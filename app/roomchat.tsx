import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, BackHandler, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatInput from '../components/ChatInput';
import FirstCanvas from '../components/FirstCanvas';
import ChatList from '../components/ChatList';
import Sidebar from '../components/Sidebar';
import { useSyncChat } from '../hooks/useSyncChat';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { Conversation, Message } from "../types";

import { translations } from '@/constants/i18n/translations';
import { Lang, UserProfile } from '@/types';
import { nowIso } from '@/utils/date';
import { getValueFor, save } from '@/utils/storage';
import { truncateTitle } from '@/utils/truncateTitle';
import { uid } from '@/utils/uid';
import { Colors, Layout, ComponentStyles, ComponentTextStyles } from '../styles';

import { createConversationsApi } from '@/api/conversationsApi';
import DownloadModel from '@/components/DownloadModel';
import { useNetwork } from '@/context/NetworkContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import * as FileSystem from 'expo-file-system/legacy';
import NotificationModal from '../components/NotificationModal';
import { MODEL_CONFIG } from '../constants/modelConfig';
import { models } from '../constants/models';
import { ChatRepository } from '../data/repositories/ChatRepository';
import { useRAG, MemoryVectorStore } from 'react-native-rag';
import {
  ExecuTorchEmbeddings,
} from '@react-native-rag/executorch';
import {
  ALL_MINILM_L6_V2,
} from 'react-native-executorch';
import { LlamaRNWrapper } from '../utils/LlamaRNWrapper';
import { loadKnowledgeBase } from '../utils/knowledgeLoader';

const getToken = async () => {
  return await getValueFor("token");
};

const authHeaders = async () => {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};


const makeUserMsg = (text: string): Message => ({
  id: uid("m"),
  role: "user",
  text,
  createdAt: nowIso(),
});

export default function RoomChat() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const storedUser = getValueFor("user");
  const [modelsModalVisible, setModelsModalVisible] = useState(false);
  const [downloadModelVisible, setDownloadModelVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(models[0].id);
  const { isInternetReachable, isConnected } = useNetwork();
  const { isConnected: isNetworkConnected, justDisconnected, justConnected } = useNetworkStatus();
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Debugging logs for URL constants
  useEffect(() => {
    console.log("DEBUG ExecuTorch Constants (Stringified):", JSON.stringify({
      ALL_MINILM_L6_V2,
    }, null, 2));
  }, []);

  const vectorStore = useMemo(() => {
    try {
      console.log("Instantiating MemoryVectorStore with constants...");
      
      const modelSource = ALL_MINILM_L6_V2?.modelSource || "https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.5.0/all-MiniLM-L6-v2_xnnpack.pte";
      const tokenizerSource = ALL_MINILM_L6_V2?.tokenizerSource || "https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.5.0/tokenizer.json";

      return new MemoryVectorStore({
        embeddings: new ExecuTorchEmbeddings({
          modelSource,
          tokenizerSource,
        } as any),
      });
    } catch (err: any) {
      const msg = `VectorStore Init Error: ${err.message || String(err)}`;
      console.error(msg);
      setInitializationError(msg);
      return null;
    }
  }, []);

  const llm = useMemo(() => {
    try {
      console.log("Instantiating LlamaRNWrapper...");
      return new LlamaRNWrapper();
    } catch (err: any) {
      const msg = `LLM Init Error: ${err.message || String(err)}`;
      console.error(msg);
      setInitializationError(msg);
      return null;
    }
  }, []);
  const [isModalDismissed, setIsModalDismissed] = useState(false);
  const [isOfflineModelDownloaded, setIsOfflineModelDownloaded] = useState(false);

  const checkOfflineModel = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(MODEL_CONFIG.getLocalModelPath());
      setIsOfflineModelDownloaded(info.exists);
    } catch (err) {
      console.error("Error checking offline model:", err);
      setIsOfflineModelDownloaded(false);
    }
  }, []);

  const [isKnowledgeBaseLoaded, setIsKnowledgeBaseLoaded] = useState(false);

  useEffect(() => {
    checkOfflineModel();
  }, [checkOfflineModel]);

  // Seed Knowledge Base once vector store is ready
  useEffect(() => {
    if (vectorStore && llm && !isKnowledgeBaseLoaded) {
      const init = async () => {
        try {
          // Load the Vector Store (initializes dimension)
          await loadKnowledgeBase(vectorStore);
          // Load the LLM into memory
          try {
            await llm.load();
          } catch (llmErr) {
            console.warn("LM Offline belum siap/belum didownload, tapi sistem tetap jalan untuk mode Online.");
          }
          setIsKnowledgeBaseLoaded(true);
        } catch (err) {
          setIsKnowledgeBaseLoaded(true);
        }
      };
      
      init();
    }
  }, [vectorStore, llm, isKnowledgeBaseLoaded]);

  const api = useMemo(() => createConversationsApi(), []);
  const tempIdMapRef = useRef<Record<string, string>>({});
  const lastSavedTextRef = useRef<string>(""); 
  const hasSavedResponseRef = useRef<boolean>(false); // NEW: Strict flag to prevent any double-saving in one turn
  const isSendingRef = useRef(false); // Ref to avoid handleLoadMessages re-creation on send
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [nickname, setNickname] = useState<string>("");
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState("");
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);

  // --- Typing animation dots (shown while AI is responding)
  const [typingDots, setTypingDots] = useState("");
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSending) {
      interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 400);
    } else {
      setTypingDots("");
    }
    return () => clearInterval(interval);
  }, [isSending]);


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

      // Otherwise create a new bot message
      return {
        ...prev,
        [realId]: [
          ...threadMsgs,
          { id: uid("m"), role: "bot", text: token, createdAt: nowIso() },
        ],
      };
    });
  }, []);

  const onWsDone = useCallback(
    async (cid: string, fullText: string) => {
      let targetId = cid;

      if (tempIdMapRef.current[cid]) {
        targetId = tempIdMapRef.current[cid];
      }

      if (!targetId) {
        return;
      }

      try {
        if (!fullText || hasSavedResponseRef.current) return;
        if (fullText === lastSavedTextRef.current) return;

        hasSavedResponseRef.current = true;
        lastSavedTextRef.current = fullText;

        if (selectedModel === 'tofa-offline') {
          await ChatRepository.saveMessage({
            conversation_id: targetId,
            role: 'assistant',
            content: fullText,
            is_synced: false
          });
        } else {
          await api.saveMessage(targetId, "assistant", fullText).catch(e => {
            console.warn("Failed to persist AI response on server:", e);
            hasSavedResponseRef.current = false;
          });
        }
      } catch (e) {
        console.error("Failed to save assistant message:", e);
      } finally {
        setTimeout(() => {
          setIsSending(false);
          setIsDataLoaded(true);
        }, 500);
      }
    },
    [api, selectedModel],
  );

  const ws = useWebSocketChat({
    model: selectedModel,
    enabled: true,
    getActiveConversationId: () => activeConversationId,
    onToken: onWsToken,
    onDone: onWsDone,
    vectorStore,
    llm,
  });

  const availableModels = models;

  // --- Derived
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.title || "").toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const { isSyncing } = useSyncChat({ user, isInternetReachable });

  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

    // Handle Back After Log in
  useEffect(() => {
    const backAction = () => {
      return true; 
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, []);


  /* =======================
   HANDLERS
  ======================== */
  const handleLoadConversations = useCallback(async () => {
    let serverLoaded: Conversation[] = [];
    let localLoaded: any[] = [];
    let isApiSuccess = false;

    try {
      serverLoaded = await api.loadConversations();
      isApiSuccess = true;
      setApiError(false);
    } catch (e) {
      console.warn("Could not load server conversations:", e);
      setApiError(true);
    }

    try {
      localLoaded = await ChatRepository.getAllConversations();
    } catch (e) {
      console.error("Could not load local conversations:", e);
    }

    const combined = [...serverLoaded];
    localLoaded.forEach(lc => {
      const existing = combined.find(s => s.id === lc.id || s.id === lc.server_id);
      if (!existing) {
        combined.push({
          id: lc.id,
          title: lc.title || "Percakapan Baru",
          createdAt: new Date(lc.created_at).toISOString()
        });
      } else {
        if ((existing.title === "Untitled" || existing.title === "Percakapan Baru") && lc.title) {
          existing.title = lc.title;
        }
      }
    });

    setConversations((prev) => {
      const nextConversations = [...combined];

      prev.forEach(prevChat => {
        if (prevChat.id.startsWith("temp-")) {
          const isMapped = tempIdMapRef.current[prevChat.id];
          const alreadyInNext = nextConversations.find(c => c.id === prevChat.id || (isMapped && c.id === isMapped));
          
          if (!isMapped && !alreadyInNext) {
            nextConversations.push(prevChat);
          }
        }
      });

      nextConversations.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      return nextConversations;
    });

    if (isApiSuccess || isInternetReachable === false) {
      setIsDataLoaded(true);
    } else {
      setTimeout(() => setIsDataLoaded(true), 2000);
    }
  }, [api, isInternetReachable]);

  useEffect(() => { isSendingRef.current = isSending; }, [isSending]);

  const handleLoadMessages = useCallback(async (cid: string) => {
    if (!cid || cid.startsWith("temp-") || isSendingRef.current) return;

    try {
      if (isInternetReachable) {
        const serverMsgs = await api.fetchMessages(cid);
        if (serverMsgs.length > 0) {
          setMessagesByConversation((prev) => ({ ...prev, [cid]: serverMsgs }));
        }
      } else {
        const localMsgs = await ChatRepository.getMessagesByConversation(cid);
        if (localMsgs.length > 0) {
          setMessagesByConversation((prev) => ({
            ...prev,
            [cid]: localMsgs.map(m => ({
              id: m.id,
              role: m.role === 'assistant' ? 'bot' : 'user' as any,
              text: m.content,
              createdAt: new Date(m.created_at).toISOString()
            })),
          }));
        }
      }
    } catch (e) {
      console.warn("Load messages notice:", e);
    }
  }, [api, isInternetReachable]);

  useEffect(() => {
    if (isInternetReachable === false && selectedModel !== 'tofa-offline') {
      setSelectedModel('tofa-offline');
      setNotification({
        title: 'Offline',
        message: 'Koneksi internet terputus. Beralih ke model Tofa Offline otomatis.'
      });
      setMode("offline");
      console.log("Mode: offline (switched via reachability)");
    }
  }, [isInternetReachable, selectedModel]);

  // Handle connection restore
  useEffect(() => {
    if (justConnected) {
      console.log("🟢 Internet restored - switching to online mode");
      setMode("online");
      setNotification({
        title: 'Online',
        message: 'Koneksi internet pulih. Menggunakan AI cloud.'
      });

      // Refresh data from server
      handleLoadConversations();
      handleLoadMessages(activeConversationId);

      console.log("Mode: online (switched)");
    }
  }, [justConnected, handleLoadConversations, handleLoadMessages, activeConversationId]);




  useEffect(() => {
    const init = async () => {
      const storedUser = await getValueFor("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as UserProfile);
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
      const storedNickname = await getValueFor("nickname");
      if (storedNickname) {
        setNickname(String(storedNickname));
      }

      const savedLang = await getValueFor("lang");
      if (savedLang) {
        setLang(savedLang === "en" ? "en" : "id");
      }

      const lastChat = await getValueFor("lastConversationId");
      if (lastChat) {
        setActiveConversationId(String(lastChat));
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (activeConversationId && !activeConversationId.startsWith("temp-")) {
      save("lastConversationId", activeConversationId);
    }
  }, [activeConversationId]);

  /* =======================
     RAG SEEDING (AUTO-INITIALIZE)
  ======================== */



  /* =======================
   LOAD CONVERSATIONS
  ======================== */
  useEffect(() => {
    handleLoadConversations();
  }, [handleLoadConversations]);
  useEffect(() => {
    if (!isDataLoaded || !activeConversationId) return;
    if (activeConversationId.startsWith("temp-")) return;

    const exists = conversations.some(c => String(c.id) === String(activeConversationId));
    if (!exists) {
      console.log("Restored lastConversationId not found in list, resetting to FirstCanvas.");
      setActiveConversationId("");
    }
  }, [isDataLoaded, conversations, activeConversationId]);

  /* =======================
   LOAD MESSAGES
  ======================== */
  useEffect(() => {
    if (!isDataLoaded) return;
    handleLoadMessages(activeConversationId);
  }, [activeConversationId, handleLoadMessages, isDataLoaded]);

// Redirect Home if Conversation = []
  useEffect(() => {
    if (prompt || !isDataLoaded || isSyncing || apiError) return;

    const timer = setTimeout(() => {
      if (conversations.length === 0 && activeConversationId === "") {
        console.log("Percakapan benar-benar kosong, mengalihkan ke Home...");
        router.replace("/");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isDataLoaded, isSyncing, conversations.length, activeConversationId, prompt, apiError,router]);

useEffect(() => {
  const isTargetOffline = selectedModel === 'tofa-offline';
  const isWsReady = ws.status === 'open';
  const isReady = isDataLoaded && (isTargetOffline ? isKnowledgeBaseLoaded : isWsReady);

  if (prompt && isReady && !isSending) {
    console.log("AI Ready! Processing prompt:", prompt);

    const timer = setTimeout(() => {
      onSend(undefined, prompt, true);
      router.setParams({ prompt: undefined });
    }, 100);

    return () => clearTimeout(timer);
  }
}, [prompt, isDataLoaded, isKnowledgeBaseLoaded, selectedModel, ws.status, isSending]);

  // const [lang, setLang] = useState<Lang>(() => {
  //   const saved = String(getValueFor("lang"));
  //   return saved === "en" ? "en" : "id";
  // });
  // useEffect(() => save("lang", lang), [lang]);

  const [bootstrap] = useState(() => {
    return {
      extraConversation: null as Conversation | null,
      extraMessages: null as Message[] | null,
      activeId: "",
    };
  });




  const [lang, setLang] = useState<Lang>("id");

  useEffect(() => {
    save("lang", lang);
  }, [lang]);

  const t = useMemo(() => translations[lang], [lang]);

const handleDeleteConversation = async (id: string) => {
    try {
      console.log("Deleting conversation:", id);

      let targetId = id;
      if (id.startsWith("temp-")) {
        targetId = tempIdMapRef.current[id] || id; 
      }

      if (!targetId.startsWith("temp-")) {
        await api.deleteConversation(targetId);
      } else if (selectedModel === 'tofa-offline') {
        try {
          await ChatRepository.deleteConversation(targetId);
        } catch (localErr) {
          console.log("Local DB delete notice:", localErr);
        }
      }

      setConversations((prev) => prev.filter((c) => c.id !== id && c.id !== targetId));

      if (activeConversationId === id || activeConversationId === targetId) {
        setActiveConversationId("");
      }

    } catch (e: any) {
      if (e.response && e.response.status === 401) {
        Alert.alert("Sesi Berakhir", "Sesi Anda habis. Silakan login ulang.");
      } else {
        Alert.alert("Gagal", "Tidak dapat menghapus percakapan dari server.");
      }
    }
  };

  const handleOpenSettings = () => {
    // TODO: Implement settings functionality
  };

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      await api.renameConversation(id, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (e) {
      console.error("Failed to rename conversation:", e);
    }
  };

  const activeMessages = useMemo(() => {
    const threadMsgs = activeConversationId ? (messagesByConversation[activeConversationId] || []) : [];
    
    if (threadMsgs.length > 0) {
      return threadMsgs.map((m) => ({
        id: m.id,
        type: m.role === 'bot' || (m as any).role === 'assistant' ? 'ai' : 'user',
        text: m.text,
      }));
    }

    // Fallback: If we have a prompt but no messages in state yet, show the prompt
    if (prompt && !activeConversationId) {
      return [{
        id: 'initial-prompt',
        type: 'user',
        text: prompt,
      }];
    }

    return [];
  }, [activeConversationId, messagesByConversation, prompt]);

  const getActiveConversationId = useCallback(
    () => activeConversationId,
    [activeConversationId],
  );

  const onNewChat = async () => {
    setActiveConversationId("");
  };

  const handleDeleteOfflineModel = () => {
    Alert.alert(
      "Delete Offline Model",
      "Are you sure you want to delete the downloaded model? You will need to download it again to use offline mode.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const path = MODEL_CONFIG.getLocalModelPath();
              console.log("Deleting offline model at:", path);
              await FileSystem.deleteAsync(path, { idempotent: true });
              await checkOfflineModel();
              if (selectedModel === 'tofa-offline') {
                setSelectedModel(models[0].id);
              }
              Alert.alert("Success", "Model deleted successfully.");
            } catch (e) {
              console.error("Failed to delete offline model:", e);
              Alert.alert("Error", "Failed to delete the model.");
            }
          }
        }
      ]
    );
  };

  const handleOpenRename = () => {

  };

  const messages = messagesByConversation[activeConversationId] || [];



  const handleStop = () => {
    ws.stop();
    setIsSending(false);
  };

  const onSend = async (e?: React.FormEvent, overrideText?: string, forceNewChat: boolean = false) => {
    if (e) e.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    lastSavedTextRef.current = ""; 
    hasSavedResponseRef.current = false; // Reset flag for new exchange
    setIsSending(true);
    let threadId = forceNewChat ? "" : activeConversationId;
    const isNewChat = !threadId;
    const generatedTitle = truncateTitle(text, 28);

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
          console.error("Failed to pre-save local chat:", err);
        }
      }
    }

    const userMsg = makeUserMsg(text);
    setMessagesByConversation((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), userMsg],
    }));
    setInput("");

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

    // WS Logic
    const wsText = nickname
      ? `The user has asked you to call him ${nickname}. ${text}`
      : text;

    const wsOk = await ws.send(wsText, threadId);
    if (!wsOk && !isOffline) {
      alert("Gagal mengirim pesan. Pastikan koneksi atau model sudah siap.");
      setIsSending(false);
      return;
    }

    if (isNewChat && !isOffline) {
      // ONLINE + NEW CHAT: Create conversation on server
      try {
        const data = await api.createConversation();
        if (data?.id) {
          const realId = data.id;
          const oldTempId = threadId; 
          tempIdMapRef.current[oldTempId] = realId; 

          setConversations((prev) =>
            prev.map((c) => (c.id === oldTempId ? { ...c, id: realId, title: generatedTitle } : c))
          );
          setMessagesByConversation((prev) => {
            const { [oldTempId]: m, ...rest } = prev;
            return { ...rest, [realId]: m ?? [userMsg] };
          });

          threadId = realId;
          setActiveConversationId(realId);

          api.renameConversation(realId, generatedTitle).catch(e => console.error("Gagal rename di server", e));
          api.saveMessage(realId, "user", text).catch(e => console.error("API user msg save failed:", e));
        }
      } catch (e) {
        console.error("Failed to create real conversation:", e);
      }
    } else if (!isNewChat && !isOffline) {
      // ONLINE + EXISTING CHAT
      api.saveMessage(threadId, "user", text).catch(e => console.error("API save failed:", e));

      const currentConv = conversations.find(c => c.id === threadId);
      if (currentConv && (currentConv.title === "Percakapan Baru" || currentConv.title === "Untitled")) {
        api.renameConversation(threadId, generatedTitle).catch(e => console.warn("Failed to rename old chat", e));
        setConversations((prev) =>
          prev.map((c) => c.id === threadId ? { ...c, title: generatedTitle } : c)
        );
      }
    } else if (isOffline) {
    }
  };


  const handleClearAllChats = () => {

  };

  const handleShowDownloadModel = () => {
    setModelsModalVisible(false);
    setDownloadModelVisible(true);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        Layout.chatScreen,
        { backgroundColor: Colors.backgroundPrimary },
      ]}
    >
      {initializationError && (
        <View style={{
          backgroundColor: '#ffebee',
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#ef5350',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text style={{ color: '#c62828', fontSize: 12, flex: 1 }}>
            ⚠️ {initializationError}
          </Text>
          <TouchableOpacity onPress={() => setInitializationError(null)}>
            <Ionicons name="close-circle" size={20} color="#c62828" />
          </TouchableOpacity>
        </View>
      )}

      {/* ===== HEADER ===== */}
      <View
        style={ComponentStyles.roomChatHeader}
      >
        <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)}>
          <Ionicons name="menu" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={ComponentStyles.roomChatHeaderCenter}>
          <TouchableOpacity
            onPress={() => setModelsModalVisible(!modelsModalVisible)}
            style={ComponentStyles.roomChatDropdownTrigger}
          >
            <Text
              style={ComponentTextStyles.roomChatHeaderTitle}
            >
              TobaFarm
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color={Colors.white} />
          </TouchableOpacity>

          {modelsModalVisible && (
            <View style={ComponentStyles.dropdownModal}>
              <View style={ComponentStyles.dropdownHeader}>
                <Text style={ComponentTextStyles.dropdownHeaderText}>Pilih Model</Text>
              </View>

              {availableModels.filter(m => m.type === 'online').map((model) => {
                const isOnlineDisabled = !isInternetReachable;

                return (
                  <TouchableOpacity
                    key={model.id}
                    disabled={isOnlineDisabled}
                    onPress={() => {
                      setSelectedModel(model.id);
                      setModelsModalVisible(false);
                    }}
                    style={[
                      ComponentStyles.dropdownItem,
                      { backgroundColor: selectedModel === model.id ? '#f5f5f5' : 'transparent' },
                      { opacity: isOnlineDisabled ? 0.5 : 1 },
                    ]}
                  >
                    <View style={ComponentStyles.dropdownItemRow}>
                      <View style={ComponentStyles.dropdownItemContent}>
                        <Text style={ComponentTextStyles.dropdownModelName}>
                          {model.label}
                        </Text>
                        {isOnlineDisabled && (
                          <Text style={ComponentTextStyles.dropdownRequirementText}>
                            Butuh koneksi internet
                          </Text>
                        )}
                      </View>
                      {selectedModel === model.id && (
                        <Ionicons name="checkmark" size={18} color={Colors.backgroundPrimary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {availableModels.filter(m => m.type === 'offline').map((model) => {
                const isDownloaded = model.id === 'tofa-offline' ? isOfflineModelDownloaded : true;
                return (
                  <View
                    key={model.id}
                    style={[
                      ComponentStyles.dropdownOfflineRow,
                      { backgroundColor: selectedModel === model.id ? '#f5f5f5' : 'transparent' }
                    ]}
                  >
                    <TouchableOpacity
                      disabled={!isDownloaded}
                      onPress={() => {
                        setSelectedModel(model.id);
                        setModelsModalVisible(false);
                      }}
                      style={{ flex: 1}}
                    >
                      <View style={ComponentStyles.dropdownOfflineInner}>
                        <Text style={[
                          ComponentTextStyles.dropdownModelName,
                          { color: selectedModel === model.id ? Colors.backgroundPrimary : '#333' },
                          { fontWeight: selectedModel === model.id ? '600' : '400' }
                        ]}>
                          {model.label}
                        </Text>
                        {selectedModel === model.id && isDownloaded && (
                          <Ionicons name="checkmark" size={18} color={Colors.backgroundPrimary} style={{ marginRight: 8 }} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {!isDownloaded && (
                      <TouchableOpacity
                        style={ComponentStyles.dropdownDownloadBtn}
                        onPress={handleShowDownloadModel}
                      >
                        <Ionicons name="add-outline" size={22} color={Colors.backgroundPrimary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={ComponentStyles.roomChatHeaderIcons}>
          <Ionicons name="create-outline" size={20} color={Colors.white} />
          <Ionicons name="settings-outline" size={20} color={Colors.white} />

          {selectedModel === 'tofa-offline' && (
            <TouchableOpacity onPress={handleDeleteOfflineModel}>
              <Ionicons name="trash" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {modelsModalVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={ComponentStyles.dropdownBackdrop}
          onPress={() => setModelsModalVisible(false)}
        />
      )}
      {/* ===== AREA CHAT & INPUT ===== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        enabled={Platform.OS === "ios" || (isKeyboardVisible && !sidebarOpen)}
      >
        {activeConversationId || prompt ? (
          <>
            {/* ===== CHAT LIST ===== */}
            <View style={ComponentStyles.chatListContainer}>
              {isSyncing && (
                <View style={ComponentStyles.syncBanner}>
                  <Text style={ComponentTextStyles.syncBannerText}>
                    Menyinkronkan percakapan...
                  </Text>
                </View>
              )}
              <ChatList data={activeMessages} />
            </View>

            {/* ===== INPUT ===== */}
            <View
              pointerEvents={isSending ? "none" : "auto"}
              style={[Layout.chatInputContainer, { paddingBottom: (isKeyboardVisible && !sidebarOpen) ? 10 : insets.bottom + 10 }]}
            >
              <ChatInput
                model={selectedModel}
                isLoading={isSending}
                placeholder={isSending ? `ToFa Sedang Menjawab${typingDots}` : "Tanyakan sesuatu..."}
                onSend={(text) => onSend(undefined, text)}
              />
            </View>
          </>
        ) : (
          <FirstCanvas
            username={user?.username}
            selectedModel={selectedModel}
            onSend={(text) => onSend(undefined, text, true)}
          />
        )}
      </KeyboardAvoidingView>

      {/* ===== SIDEBAR ===== */}
      <Sidebar
        user={user}
        t={t}
        showSidebar={sidebarOpen}
        setShowSidebar={setSidebarOpen}
        onOpenRename={handleRenameConversation}
        onNewChat={onNewChat}
        conversations={conversations}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        onDeleteConversation={handleDeleteConversation}
        onClearAll={handleClearAllChats}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchQuery={searchQuery}
        sidebarCollapsed={sidebarOpen}
        setSidebarCollapsed={setSidebarOpen}
        setSearchQuery={setSearchQuery}
        filteredConversations={filteredConversations}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        menuRef={menuRef}
        searchInputRef={searchInputRef}
        onOpenSettings={handleOpenSettings}
      />

      {/* ===== MODALS & OVERLAYS ===== */}
      <NotificationModal
        visible={!!notification}
        title={notification?.title}
        message={notification?.message}
        onClose={() => setNotification(null)}
      />

      <DownloadModel
        visible={downloadModelVisible}
        onClose={() => setDownloadModelVisible(false)}
        onDownloadSuccess={() => {
          checkOfflineModel();
          setDownloadModelVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
