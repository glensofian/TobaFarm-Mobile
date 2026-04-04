/**
 * Menyediakan semua state & logic untuk halaman RoomChat (untuk user yang sudah login).
 * Menangani pengelolaan percakapan, pesan, RAG (Offline), WebSocket, dan Sinkronisasi.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Keyboard } from 'react-native';

import { useSyncChat } from '../hooks/useSyncChat';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { useNetwork } from './NetworkContext';

import { changePassword, updateNickname } from '@/api/authApi';
import { createConversationsApi } from '@/api/conversationsApi';
import { nowIso } from '@/utils/date';
import { getValueFor, removeValueFor, save } from '@/utils/storage';
import { uid } from '@/utils/uid';
import { MODEL_CONFIG } from '../constants/modelConfig';
import { models } from '../constants/models';
import { ChatRepository } from '../data/repositories/ChatRepository';
import { loadKnowledgeBase } from '../utils/knowledgeLoader';
import { LlamaRNWrapper } from '../utils/LlamaRNWrapper';

import { ExecuTorchEmbeddings } from '@react-native-rag/executorch';
import { ALL_MINILM_L6_V2 } from 'react-native-executorch';
import { MemoryVectorStore } from 'react-native-rag';

import type {
  Conversation as GlobalConversation,
  Message as GlobalMessage,
  UserProfile
} from '../types';

import type {
  Conversation as DBConversation,
  Message as DBMessage
} from '../data/entities';

// --- Types ---

export type ChatNotification = { title: string; message: string } | null;

export type ChatContextValue = {
  /* User Profile */
  user: UserProfile | null;

  /* Sidebar & UI */
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;

  /* Model selection */
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  modelsModalVisible: boolean;
  setModelsModalVisible: (v: boolean) => void;
  downloadModelVisible: boolean;
  setDownloadModelVisible: (v: boolean) => void;
  isOfflineModelDownloaded: boolean;
  checkOfflineModel: () => Promise<void>;
  handleDeleteOfflineModel: () => void;

  /* Conversations */
  conversations: GlobalConversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  filteredConversations: GlobalConversation[];
  isDataLoaded: boolean;
  setIsDataLoaded: (v: boolean) => void;

  /* Messages */
  messagesByConversation: Record<string, GlobalMessage[]>;
  activeMessagesUI: { id: string; type: string; text: string }[];
  currentMessages: GlobalMessage[];

  /* Input & Sending */
  input: string;
  setInput: (v: string) => void;
  isSending: boolean;
  typingDots: string;

  /* RAG / Initialization */
  initializationError: string | null;
  setInitializationError: (e: string | null) => void;
  isKnowledgeBaseLoaded: boolean;

  /* Notification banner */
  notification: ChatNotification;
  setNotification: (n: ChatNotification) => void;

  /* Actions */
  onSend: (e?: React.FormEvent, overrideText?: string, forceNewChat?: boolean) => Promise<void>;
  handleNewChat: () => void;
  handleSelectConversation: (id: string) => void;
  handleDeleteConversation: (id: string) => Promise<void>;
  handleRenameConversation: (id: string, newTitle: string) => Promise<void>;
  handleLoadConversations: () => Promise<void>;
  handleLoadMessages: (conversationId: string) => Promise<void>;
  handleStop: () => void;
  handleClearAllChats: () => Promise<void>;
  handleChangePassword: (oldPw: string, newPw: string) => Promise<void>;
  handleUpdateNickname: (newNickname: string) => Promise<void>;
  handleLogout: () => Promise<void>;

  /* Sync & Status */
  isSyncing: boolean;
  wsStatus: 'idle' | 'connecting' | 'open' | 'closed' | 'error';
};

// --- Mappers ---

function dbToGlobalConversation(db: DBConversation): GlobalConversation {
  return {
    id: db.id,
    title: db.title,
    createdAt: new Date(db.created_at).toISOString(),
  };
}

function dbToGlobalMessage(db: DBMessage): GlobalMessage {
  return {
    id: db.id,
    role: db.role === 'assistant' ? 'bot' : (db.role === 'user' ? 'user' : 'bot'),
    text: db.content,
    createdAt: new Date(db.created_at).toISOString(),
  };
}

// --- Context ---

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// --- Provider ---

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const api = useMemo(() => createConversationsApi(), []);

  /* --- User Profile --- */
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      const u = await getValueFor("user");
      if (u) {
        try {
          setUser(JSON.parse(u));
        } catch {
          setUser(null);
        }
      }
    }
    loadUser();
  }, []);

  /* --- UI State --- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /* --- Model State --- */
  const [modelsModalVisible, setModelsModalVisible] = useState(false);
  const [downloadModelVisible, setDownloadModelVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(models[0].id);
  const [isOfflineModelDownloaded, setIsOfflineModelDownloaded] = useState(false);

  /* --- Network --- */
  const { isInternetReachable } = useNetwork();
  
  /* --- RAG / LLM Initialization --- */
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isKnowledgeBaseLoaded, setIsKnowledgeBaseLoaded] = useState(false);

  const vectorStore = useMemo(() => {
    try {
      const modelSource = ALL_MINILM_L6_V2?.modelSource || "https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.5.0/all-MiniLM-L6-v2_xnnpack.pte";
      const tokenizerSource = ALL_MINILM_L6_V2?.tokenizerSource || "https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.5.0/tokenizer.json";

      return new MemoryVectorStore({
        embeddings: new ExecuTorchEmbeddings({
          modelSource,
          tokenizerSource,
        } as any),
      });
    } catch (err: any) {
      setInitializationError(`VectorStore Init Error: ${err.message || String(err)}`);
      return null;
    }
  }, []);

  const llm = useMemo(() => {
    try {
      return new LlamaRNWrapper();
    } catch (err: any) {
      setInitializationError(`LLM Init Error: ${err.message || String(err)}`);
      return null;
    }
  }, []);

  /* --- Data Persistence --- */
  const [conversations, setConversations] = useState<GlobalConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");

  // --- Persistence: Load last conversation ID on mount ---
  useEffect(() => {
    async function loadLastId() {
      const lastId = await getValueFor("lastConversationId");
      if (lastId) {
        setActiveConversationId(lastId);
      }
    }
    loadLastId();
  }, []);

  // --- Persistence: Save active ID whenever it changes ---
  useEffect(() => {
    if (activeConversationId) {
      save("lastConversationId", activeConversationId);
    } else {
      removeValueFor("lastConversationId");
    }
  }, [activeConversationId]);

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, GlobalMessage[]>>({});

  // Ref untuk melacak state pesan terbaru
  const messagesRef = useRef<Record<string, GlobalMessage[]>>({});
  useEffect(() => {
    messagesRef.current = messagesByConversation;
  }, [messagesByConversation]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  /* --- Input & Sending --- */
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingDots, setTypingDots] = useState('');

  /* --- Notification --- */
  const [notification, setNotification] = useState<ChatNotification>(null);

  /* --- Refs for flow control --- */
  const tempIdMapRef = useRef<Record<string, string>>({});
  const lastSavedTextRef = useRef<string>("");
  const hasSavedResponseRef = useRef<boolean>(false);

  // --- Typing animation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isSending) {
      interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 400);
    } else {
      setTypingDots('');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSending]);

  // --- Offline checks
  const checkOfflineModel = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(MODEL_CONFIG.getLocalModelPath());
      setIsOfflineModelDownloaded(info.exists);
    } catch (err) {
      setIsOfflineModelDownloaded(false);
    }
  }, []);

  useEffect(() => {
    checkOfflineModel();
  }, [checkOfflineModel]);

  const handleDeleteOfflineModel = useCallback(() => {
    Alert.alert(
      "Delete Offline Model",
      "Are you sure you want to delete the downloaded model?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const path = MODEL_CONFIG.getLocalModelPath();
              await FileSystem.deleteAsync(path, { idempotent: true });
              await checkOfflineModel();
              if (selectedModel === 'tofa-offline') {
                setSelectedModel(models[0].id);
              }
              Alert.alert("Success", "Model deleted successfully.");
            } catch (e) {
              Alert.alert("Error", "Failed to delete the model.");
            }
          }
        }
      ]
    );
  }, [checkOfflineModel, selectedModel]);

  // Seed Knowledge Base
  useEffect(() => {
    if (vectorStore && llm && !isKnowledgeBaseLoaded) {
      const init = async () => {
        try {
          await loadKnowledgeBase(vectorStore);
          try {
            await llm.load();
          } catch (llmErr) {
            console.warn("LM Offline belum siap.");
          }
          setIsKnowledgeBaseLoaded(true);
        } catch (err) {
          setIsKnowledgeBaseLoaded(true);
        }
      };
      init();
    }
  }, [vectorStore, llm, isKnowledgeBaseLoaded]);

  /* --- Handlers --- */

  const handleLoadConversations = useCallback(async () => {
    try {
      let combined: GlobalConversation[] = [];
      if (isInternetReachable) {
        combined = await api.loadConversations();
      } else {
        const local = await ChatRepository.getAllConversations();
        combined = local.map(dbToGlobalConversation);
      }

      setConversations(prev => {
        const tempConvs = prev.filter(c => c.id.startsWith("temp-"));
        const merged = [...tempConvs];
        combined.forEach(ext => {
          if (!merged.find(m => m.id === ext.id)) {
            merged.push(ext);
          }
        });
        return merged;
      });
    } catch (e) {
      const local = await ChatRepository.getAllConversations();
      setConversations(prev => {
        const tempConvs = prev.filter(c => c.id.startsWith("temp-"));
        const localMapped = local.map(dbToGlobalConversation);
        const merged = [...tempConvs];
        localMapped.forEach(ext => {
          if (!merged.find(m => m.id === ext.id)) {
            merged.push(ext);
          }
        });
        return merged;
      });
    } finally {
      setIsDataLoaded(true);
    }
  }, [api, isInternetReachable]);

  const handleLoadMessages = useCallback(async (cid: string) => {
    if (!cid) return;

    const existing = messagesRef.current[cid];
    if (existing && existing.length > 0) {
      console.log("[ChatContext] Skip handleLoadMessages (data exists locally):", cid);
      return;
    }

    try {
      if (isInternetReachable && !cid.startsWith("temp-")) {
        const history = await api.fetchMessages(cid);
        setMessagesByConversation(prev => ({ ...prev, [cid]: history }));
      } else {
        const history = await ChatRepository.getMessagesByConversation(cid);
        setMessagesByConversation(prev => ({ ...prev, [cid]: history.map(dbToGlobalMessage) }));
      }
    } catch (e) {
      const history = await ChatRepository.getMessagesByConversation(cid);
      setMessagesByConversation(prev => ({ ...prev, [cid]: history.map(dbToGlobalMessage) }));
    }
  }, [api, isInternetReachable]);

  useEffect(() => {
    handleLoadConversations();
  }, [handleLoadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      handleLoadMessages(activeConversationId);
    }
  }, [activeConversationId, handleLoadMessages]);

  /* --- WS Handlers --- */
  const onWsToken = useCallback((cid: string, token: string) => {
    setIsSending(true);
    const realId = tempIdMapRef.current[cid] || cid;

    setMessagesByConversation((prev) => {
      const threadMsgs = prev[realId] ?? [];
      const lastMsg = threadMsgs[threadMsgs.length - 1];

      if (lastMsg && lastMsg.role === "bot") {
        return {
          ...prev,
          [realId]: [
            ...threadMsgs.slice(0, -1),
            { ...lastMsg, text: lastMsg.text + token },
          ],
        };
      }
      return {
        ...prev,
        [realId]: [
          ...threadMsgs,
          { id: uid("m"), role: "bot", text: token, createdAt: nowIso() },
        ],
      };
    });
  }, []);

  const onWsDone = useCallback(async (cid: string, fullText: string) => {
    const targetId = tempIdMapRef.current[cid] || cid;
    if (!targetId) return;

    try {
      if (!fullText || hasSavedResponseRef.current) return;
      if (fullText === lastSavedTextRef.current) return;

      hasSavedResponseRef.current = true;
      lastSavedTextRef.current = fullText;

      const isOffline = selectedModel === 'tofa-offline';

      const saveToApi = async (id: string, retryCount = 0) => {
        if (id.startsWith("temp-")) {
          const realId = tempIdMapRef.current[id];
          if (realId) {
            id = realId;
          } else if (retryCount < 5) {
            setTimeout(() => saveToApi(id, retryCount + 1), 300);
            return;
          } else {
            console.warn("[ChatContext] Giving up saving to API: ID is still temporary after retries.");
            return;
          }
        }

        await api.saveMessage(id, "assistant", fullText).then(() => {
          console.log("[ChatContext] AI Response Saved to API (Done):", id);
        }).catch((err) => {
          console.error("[ChatContext] Failed to save AI response:", err);
          hasSavedResponseRef.current = false;
        });
      };

      if (isOffline) {
        await ChatRepository.saveMessage({
          conversation_id: targetId,
          role: 'assistant',
          content: fullText,
          is_synced: false
        });
        console.log("[ChatContext] AI Response Saved Offline (Done)");
      } else {
        await saveToApi(targetId);
      }
    } catch (e) {
      console.error("Save assistant message error:", e);
    } finally {
      setTimeout(() => {
        setIsSending(false);
        setIsDataLoaded(true);
      }, 500);
    }
  }, [api, selectedModel]);

  const ws = useWebSocketChat({
    model: selectedModel,
    enabled: true,
    getActiveConversationId: () => activeConversationId,
    onToken: onWsToken,
    onDone: onWsDone,
    vectorStore: vectorStore || undefined,
    llm: llm || undefined,
  });

  const onSend = useCallback(async (e?: React.FormEvent, overrideText?: string, forceNewChat: boolean = false) => {
    if (e) e.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    if (selectedModel === "tofa-offline" && !isOfflineModelDownloaded) {
      Alert.alert("Model Offline Belum Tersedia", "Silakan unduh model terlebih dahulu.");
      return;
    }

    setIsSending(true);
    hasSavedResponseRef.current = false;
    lastSavedTextRef.current = "";
    Keyboard.dismiss();

    let threadId = forceNewChat ? "" : activeConversationId;
    const isNewChat = !threadId;

    let generatedTitle = text.trim().split("\n")[0];
    if (generatedTitle.length > 120) {
      generatedTitle = generatedTitle.slice(0, 117) + "...";
    }

    const isOffline = selectedModel === 'tofa-offline';

    if (isNewChat) {
      threadId = "temp-" + uid("t");
      setActiveConversationId(threadId);

      setConversations((prev) => [
        { id: threadId, title: generatedTitle, createdAt: nowIso() },
        ...prev,
      ]);

      if (isOffline) {
        try {
          await ChatRepository.saveConversation({
            id: threadId,
            title: generatedTitle,
            created_at: Date.now(),
            is_synced: false
          });
        } catch (err) {
          console.error("Failed save local chat:", err);
        }
      }
    }

    const userMsg: GlobalMessage = { id: uid("m"), role: "user", text, createdAt: nowIso() };
    setMessagesByConversation((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), userMsg],
    }));
    setInput("");

    // Persistence
    if (isOffline) {
      try {
        await ChatRepository.saveMessage({
          conversation_id: threadId,
          role: 'user',
          content: text,
          is_synced: false
        });
      } catch (e) {
        console.warn("User message local save failed:", e);
      }
    }

    const wsOk = await ws.send(text, threadId);
    if (!wsOk && !isOffline) {
      Alert.alert("Gagal", "Gagal mengirim pesan. Pastikan koneksi atau model sudah siap.");
      setIsSending(false);
      return;
    }

    if (isNewChat && !isOffline) {
      try {
        const data = await api.createConversation();
        if (data?.id) {
          const realId = data.id;
          const oldTempId = threadId;
          tempIdMapRef.current[oldTempId] = realId;

          setConversations((prev) =>
            prev.map((c) =>
              (c.id === oldTempId || c.id === realId)
                ? { ...c, id: realId, title: generatedTitle }
                : c
            )
          );
          setMessagesByConversation((prev) => {
            const { [oldTempId]: m, ...rest } = prev;
            return { ...rest, [realId]: m ?? [userMsg] };
          });

          threadId = realId;
          setActiveConversationId(realId);

          api.renameConversation(realId, generatedTitle).catch(err => {
            console.warn("[ChatContext] Failed renaming on server:", err);
          });
          api.saveMessage(realId, "user", text).catch(() => { });
        }
      } catch (e) {
        console.error("Failed to create real conversation:", e);
      }
    } else if (!isNewChat && !isOffline) {
      api.saveMessage(threadId, "user", text).catch(() => { });

      setConversations((prev) => {
        const targetIdx = prev.findIndex(c => c.id === threadId);
        if (targetIdx !== -1) {
          const target = prev[targetIdx];
          if (target.title === "Percakapan Baru" || target.title === "Untitled" || !target.title) {
            api.renameConversation(threadId, generatedTitle).catch(() => { });
            const updated = [...prev];
            updated[targetIdx] = { ...target, title: generatedTitle };
            return updated;
          }
        }
        return prev;
      });
    }
  }, [activeConversationId, input, isSending, selectedModel, isOfflineModelDownloaded, api, ws, conversations]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId("");
    setInput("");
    setSidebarOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      if (isInternetReachable && !id.startsWith("temp-")) {
        await api.deleteConversation(id);
      }
      await ChatRepository.deleteConversation(id);

      setConversations((prev) => {
        const next = prev.filter(c => c.id !== id);

        if (activeConversationId === id) {
          if (next.length === 0) {
            setTimeout(() => router.replace("/"), 300);
          } else {
            setActiveConversationId("");
          }
          setSidebarOpen(false);
        }
        return next;
      });

      setMessagesByConversation(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      Alert.alert("Gagal Menghapus", "Terjadi kesalahan saat menghapus percakapan.");
    }
  }, [api, isInternetReachable, activeConversationId, router]);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    try {
      if (isInternetReachable && !id.startsWith("temp-")) {
        await api.renameConversation(id, newTitle);
      } else {
        await ChatRepository.updateConversationTitle(id, newTitle);
      }
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    } catch (e) {
      Alert.alert("Gagal Mengubah Nama", "Terjadi kesalahan saat mengubah nama percakapan.");
    }
  }, [api, isInternetReachable]);

  const handleStop = useCallback(() => {
    ws.stop();
    setIsSending(false);
  }, [ws]);

  const handleClearAllChats = useCallback(async () => {
    try {
      if (isInternetReachable) {
        await api.clearAllChats();
      }
      await ChatRepository.deleteSyncedConversations();
      await ChatRepository.deleteSyncedMessages();

      setConversations([]);
      setMessagesByConversation({});
      setActiveConversationId("");
      removeValueFor("lastConversationId");
      setSidebarOpen(false);

      setTimeout(() => router.replace("/"), 300);
    } catch (e) {
      Alert.alert("Gagal Menghapus", "Terjadi kesalahan saat menghapus semua percakapan.");
    }
  }, [api, isInternetReachable, router]);

  const handleChangePassword = useCallback(async (oldPw: string, newPw: string) => {
    await changePassword(oldPw, newPw);
  }, []);

  const handleUpdateNickname = useCallback(async (newNickname: string) => {
    await updateNickname(newNickname);
    if (user) {
      const newUser = { ...user, nickname: newNickname };
      setUser(newUser);
      save("user", JSON.stringify(newUser));
      setNotification({ title: 'Sukses', message: 'Nama panggilan berhasil diperbarui.' });
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    setSidebarOpen(false);
    await removeValueFor("token");
    await removeValueFor("user");
    await removeValueFor("lastConversationId");
    
    // Clear local states
    setUser(null);
    setConversations([]);
    setMessagesByConversation({});
    setActiveConversationId("");

    router.replace("/");
  }, [router]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => (c.title || "").toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const { isSyncing } = useSyncChat({ user, isInternetReachable });

  const currentMessages = messagesByConversation[activeConversationId] || [];

  const activeMessagesUI = useMemo(() => {
    return currentMessages.map((m) => ({
      id: m.id,
      type: m.role === 'bot' ? 'ai' : 'user',
      text: m.text,
    }));
  }, [currentMessages]);

  return (
    <ChatContext.Provider
      value={{
        user,
        sidebarOpen, setSidebarOpen,
        searchOpen, setSearchOpen,
        searchQuery, setSearchQuery,
        selectedModel, setSelectedModel,
        modelsModalVisible, setModelsModalVisible,
        downloadModelVisible, setDownloadModelVisible,
        isOfflineModelDownloaded, checkOfflineModel,
        handleDeleteOfflineModel,
        conversations,
        activeConversationId, setActiveConversationId,
        filteredConversations,
        isDataLoaded, setIsDataLoaded,
        messagesByConversation,
        activeMessagesUI,
        currentMessages,
        input, setInput,
        isSending,
        typingDots,
        initializationError, setInitializationError,
        isKnowledgeBaseLoaded,
        notification, setNotification,
        onSend,
        handleNewChat,
        handleSelectConversation,
        handleDeleteConversation,
        handleRenameConversation,
        handleLoadConversations,
        handleLoadMessages,
        handleStop,
        handleClearAllChats,
        handleChangePassword,
        handleUpdateNickname,
        handleLogout,
        isSyncing,
        wsStatus: ws.status,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// --- Hook ---

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within a <ChatProvider>');
  }
  return ctx;
}
