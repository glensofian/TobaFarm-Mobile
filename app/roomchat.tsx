import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatInput from '../components/ChatInput';
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
import * as FileSystem from 'expo-file-system';
import NoInternetModal from '../components/NoInternetModal';
import { MODEL_CONFIG } from '../constants/modelConfig';
import { models } from '../constants/models';
import { ChatRepository } from '../data/repositories/ChatRepository';
import { useRAG, MemoryVectorStore } from 'react-native-rag';
import {
  ExecuTorchEmbeddings,
  ExecuTorchLLM,
} from '@react-native-rag/executorch';
import {
  ALL_MINILM_L6_V2,
  // ALL_MINILM_L6_V2_TOKENIZER,
  LLAMA3_2_1B_QLORA,
  // LLAMA3_2_TOKENIZER,
  // LLAMA3_2_TOKENIZER_CONFIG,
} from 'react-native-executorch';

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

  useEffect(() => {
    checkOfflineModel();
  }, [checkOfflineModel]);

  const api = useMemo(() => createConversationsApi(), []);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [nickname, setNickname] = useState<string>("William");
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState("");

  const availableModels = models
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

  /* =======================
   HANDLERS
  ======================== */
  const handleLoadConversations = useCallback(async () => {
    let serverLoaded: Conversation[] = [];
    let localLoaded: any[] = [];

    // 1. Load Server (Try but don't crash)
    try {
      serverLoaded = await api.loadConversations();
    } catch (e) {
      console.warn("Could not load server conversations:", e);
    }

    // 2. Load Local (Try but don't crash)
    try {
      localLoaded = await ChatRepository.getAllConversations();
    } catch (e) {
      console.error("Could not load local conversations:", e);
    }

    // 3. Merge and deduplicate
    const combined = [...serverLoaded];
    localLoaded.forEach(lc => {
      if (!combined.find(s => s.id === lc.id || s.id === lc.server_id)) {
        combined.push({
          id: lc.id,
          title: lc.title || "Percakapan Baru",
          createdAt: new Date(lc.created_at).toISOString()
        });
      }
    });

    setConversations(combined);
  }, [api]);

  const handleLoadMessages = useCallback(async (cid: string) => {
    if (!cid || cid.startsWith("temp-")) return;

    try {
      // 1. Try local first
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

      // 2. If online, fetch from API
      if (isInternetReachable) {
        const conv = await ChatRepository.getConversation(cid);
        // Only fetch from API if we have a server_id OR if it's not a local UUID (likely a server ID from loadConversations)
        const isLocalUuid = cid.includes('-') && cid.length > 20;
        const targetId = conv?.server_id || (!conv && !isLocalUuid ? cid : null);

        if (targetId) {
          try {
            const serverMsgs = await api.fetchMessages(targetId);
            if (serverMsgs.length > 0) {
              setMessagesByConversation((prev) => ({
                ...prev,
                [cid]: serverMsgs,
              }));
            }
          } catch (apiErr: any) {
            // Silence 404s if it's a recently created local chat that hasn't synced yet
            if (apiErr?.response?.status !== 404) {
              throw apiErr;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Load messages notice:", e);
    }
  }, [api, isInternetReachable]);

  useEffect(() => {
    if (isInternetReachable === false && selectedModel !== 'tofa-offline') {
      setSelectedModel('tofa-offline');
      Alert.alert(
        'Offline',
        'Koneksi internet terputus. Beralih ke model Tofa Offline.'
      );
    }
  }, [isInternetReachable, selectedModel]);

  // Handle connection loss
  useEffect(() => {
    if (justDisconnected) {
      console.log("🔴 Lost internet - switching to offline mode");
      setMode("offline");
      setIsModalDismissed(false); // Reset dismissal on new disconnect

      console.log("Mode: offline (switched)");
      // Show user notification
      Alert.alert(
        'Offline',
        'Koneksi internet terputus. Beralih ke model Tofa Offline.'
      );
    }
  }, [justDisconnected]);

  // Handle connection restore
  useEffect(() => {
    if (justConnected) {
      console.log("🟢 Internet restored - switching to online mode");
      setMode("online");

      // Refresh data from server
      handleLoadConversations();
      handleLoadMessages(activeConversationId);

      console.log("Mode: online (switched)");
      Alert.alert(
        'Online',
        'Koneksi internet pulih. Menggunakan AI cloud.'
      );
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
    };
    init();
  }, []);


  /* =======================
   LOAD CONVERSATIONS
  ======================== */
  useEffect(() => {
    handleLoadConversations();
  }, [handleLoadConversations]);

  /* =======================
   LOAD MESSAGES
  ======================== */
  useEffect(() => {
    handleLoadMessages(activeConversationId);
  }, [activeConversationId, handleLoadMessages]);

  const tempIdMapRef = useRef<Record<string, string>>({});


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

  const handleDeleteConversation = (id: string) => {
    try {
      console.log("Deleting conversation:", id);
      api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveConversationId("");
      setMessagesByConversation({});
    } catch (e) {
      console.error("Failed to delete conversation:", e);
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

  const activeMessages = (messagesByConversation[activeConversationId] || []).map((m) => ({
    id: m.id,
    type: m.role === 'bot' || (m as any).role === 'assistant' ? 'ai' : 'user',
    text: m.text,
  }));

  const getActiveConversationId = useCallback(
    () => activeConversationId,
    [activeConversationId],
  );

  const onNewChat = async () => {
    const isOffline = selectedModel === 'tofa-offline';
    try {
      let newId = "";
      let newTitle = "Percakapan Baru";

      if (isOffline) {
        const localConv = await ChatRepository.createConversation(newTitle);
        newId = localConv.id;
      } else {
        const data = await api.createConversation();
        if (!data?.id) return;
        newId = data.id;
      }

      const newConv: Conversation = {
        id: newId,
        title: newTitle,
        createdAt: nowIso(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setMessagesByConversation((prev) => ({ ...prev, [newId]: [] }));
      setActiveConversationId(newId);
    } catch (e) {
      console.error("Failed to create new chat:", e);
    }
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

  const onWsToken = useCallback((cid: string, token: string) => {
    // Resolve target ID (handle temp -> real mapping)
    const realId = tempIdMapRef.current[cid] || cid;

    setMessagesByConversation((prev) => {
      const threadMsgs = prev[realId] ?? [];
      const lastMsg = threadMsgs[threadMsgs.length - 1];

      // Simplified: if last msg is bot, append.
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

      // Check if it's a temp ID and resolve to real ID
      if (cid.startsWith("temp-")) {
        targetId = tempIdMapRef.current[cid] || "";

        // Retry if mapping not ready yet (race condition)
        if (!targetId) {
          console.log("Waiting for real ID mapping...", cid);
          await new Promise(r => setTimeout(r, 1000));
          targetId = tempIdMapRef.current[cid] || "";
        }
      }

      if (!targetId) {
        // The backend might send global messages (like "Server is warming up") before a chat starts.
        // We do not need to save these to the database.
        return;
      }

      try {
        if (!fullText) return;
        if (selectedModel === 'tofa-offline') {
          await ChatRepository.saveMessage({
            conversation_id: targetId,
            role: 'assistant',
            content: fullText,
            is_synced: false
          });
        } else {
          await api.saveMessage(targetId, "assistant", fullText);
        }
      } catch (e) {
        console.error("Failed to save assistant message:", e);
      }
    },
    [authHeaders, selectedModel],
  );

  const ws = useWebSocketChat({
    model: selectedModel,
    enabled: true,
    getActiveConversationId,
    onToken: onWsToken,
    onDone: onWsDone,
  });

  const handleStop = () => {
    ws.stop();
    setIsSending(false);
  }

  const onSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    setIsSending(true);
    let threadId = activeConversationId;
    const isNewChat = !threadId;

    // 1. If new chat, prepare immediate UI transition
    if (isNewChat) {
      threadId = "temp-" + uid("t");
      setActiveConversationId(threadId); // Immediate switch
      setConversations((prev) => [
        { id: threadId, title: truncateTitle(text, 28), createdAt: nowIso() },
        ...prev,
      ]);
    }

    // 2. Optimistic UI update
    const userMsg = makeUserMsg(text);
    setMessagesByConversation((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), userMsg],
    }));
    setInput("");

    // 3. Send via WS (Immediate, so streaming can start)
    const wsText = nickname || ""
      ? `The user has asked you to call him ${nickname}. ${text}`
      : text;
    const isOffline = selectedModel === 'tofa-offline';

    // 4. Save User Message Locally if offline
    if (isOffline) {
      try {
        await ChatRepository.saveMessage({
          conversation_id: threadId,
          role: 'user',
          content: text,
          is_synced: false
        });
      } catch (e) {
        console.error("Failed to save user message locally:", e);
      }
    }

    const wsOk = await ws.send(wsText, threadId);
    if (!wsOk) {
      alert("Gagal mengirim pesan. Pastikan koneksi atau model sudah siap.");
      setIsSending(false);
      return;
    }

    // 5. If it was a new online chat, get the real ID from backend in background
    if (isNewChat && !isOffline) {
      try {
        const data = await api.createConversation();
        if (data?.id) {
          const realId = data.id;

          // Store mapping for onWsDone
          tempIdMapRef.current[threadId] = realId;

          // Swap "temp" state to "real" state
          setMessagesByConversation((prev) => {
            const { [threadId]: tempMsgs, ...rest } = prev;
            return { ...rest, [realId]: tempMsgs ?? [userMsg] };
          });

          setConversations((prev) =>
            prev.map((c) => (c.id === threadId ? { ...c, id: realId } : c))
          );

          setActiveConversationId(realId);
          threadId = realId;
        }
      } catch (e) {
        console.error("Failed to create real conversation:", e);
      }
    }

    // 5. Save user message to backend (async)
    try {
      await api.saveMessage(threadId, "user", text);
    } catch (e) {
      console.error("Failed to save user message:", e);
    }

    // 5. Update title if it was still using default
    if (!isNewChat) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === threadId && c.title === "Percakapan Baru"
            ? { ...c, title: truncateTitle(text, 28), updatedAt: nowIso() }
            : c,
        ),
      );
    }

    setIsSending(false);
  };


  const handleClearAllChats = () => {

  };

  const handleShowDownloadModel = () => {
    setModelsModalVisible(false);
    setDownloadModelVisible(true);

  }

  return (
    <SafeAreaView
      style={[
        Layout.chatScreen,
        { backgroundColor: Colors.backgroundPrimary },
      ]}
    >
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

      {/* ===== HEADER ===== */}
      <View style={ComponentStyles.roomChatHeader}>
        <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? (
            <Ionicons name="menu" size={22} color={Colors.black} />
          ) : (
            <Ionicons name="menu" size={22} color={Colors.white} />
          )}
        </TouchableOpacity>

        <View style={ComponentStyles.roomChatHeaderCenter}>
          <TouchableOpacity
            onPress={() => setModelsModalVisible(!modelsModalVisible)}
            style={ComponentStyles.roomChatDropdownTrigger}
          >
            <Text style={ComponentTextStyles.roomChatHeaderTitle}>
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
                      {
                        backgroundColor: selectedModel === model.id ? '#f5f5f5' : 'transparent',
                        opacity: isOnlineDisabled ? 0.5 : 1,
                      }
                    ]}
                  >
                    <View style={ComponentStyles.dropdownItemRow}>
                      <View style={ComponentStyles.dropdownItemContent}>
                        <Text style={[
                          ComponentTextStyles.dropdownModelName,
                          {
                            color: isOnlineDisabled ? '#888' : (selectedModel === model.id ? Colors.backgroundPrimary : '#333'),
                            fontWeight: selectedModel === model.id ? '600' : '400'
                          }
                        ]}>
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
                      style={{ flex: 1 }}
                    >
                      <View style={[ComponentStyles.dropdownOfflineInner, { opacity: isDownloaded ? 1 : 0.5 }]}>
                        <Text style={[
                          ComponentTextStyles.dropdownModelName,
                          {
                            color: selectedModel === model.id ? Colors.backgroundPrimary : '#333',
                            fontWeight: selectedModel === model.id ? '600' : '400'
                          }
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
      <View style={Layout.chatInputContainer}>
        <ChatInput
          model={selectedModel}
          onSend={(text) => onSend(undefined, text)}
        />
      </View>

      <NoInternetModal
        visible={!isNetworkConnected && !isModalDismissed}
        onClose={() => setIsModalDismissed(true)}
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
