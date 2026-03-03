import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatInput from '../components/ChatInput';
import ChatList from '../components/ChatList';
import Sidebar from '../components/Sidebar';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { Conversation, Message } from "../types";
// import { RenameModal } from "../components/RenameModal";

import { translations } from '@/constants/i18n/translations';
import { Lang, UserProfile } from '@/types';
import { nowIso } from '@/utils/date';
import { getValueFor, save } from '@/utils/storage';
import { truncateTitle } from '@/utils/truncateTitle';
import { uid } from '@/utils/uid';
import { Colors, Layout } from '../styles';

import { createConversationsApi } from '@/api/conversationsApi';

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


  // --- Derived
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.title || "").toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

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
    (async () => {
      try {
        const loaded = await api.loadConversations();
        if (loaded.length) setConversations(loaded);
      } catch (e) {
        console.error("Failed to load sessions:", e);
      }
    })();
  }, [api]);

  /* =======================
   LOAD MESSAGES
  ======================== */
  useEffect(() => {
    if (!activeConversationId) return;

    (async () => {
      try {
        const msgs = await api.fetchMessages(activeConversationId);
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversationId]: msgs,
        }));
      } catch (e) {
        console.error("Fetch messages error", e);
      }
    })();
  }, [activeConversationId, api]);

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
    try {
      const data = await api.createConversation();
      if (!data?.id) return;

      const newConv: Conversation = {
        id: data.id,
        title: "Percakapan Baru",
        createdAt: nowIso(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setMessagesByConversation((prev) => ({ ...prev, [data.id]: [] }));
      setActiveConversationId(data.id);
    } catch (e) {
      console.error("Failed to create new chat:", e);
    }
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
        await api.saveMessage(targetId, "assistant", fullText);
      } catch (e) {
        console.error("Failed to save assistant message:", e);
      }
    },
    [authHeaders],
  );

  const ws = useWebSocketChat({
    wsUrl: "ws://localhost:8000/ws",
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
    const wsText = nickname || "William"
      ? `The user has asked you to call him ${nickname}. ${text}`
      : text;
    const wsOk = ws.send(wsText, threadId);
    if (!wsOk) {
      alert("Sedang menghubungkan ke server... Silakan tunggu.");
      setIsSending(false);
      return;
    }

    // 4. If it was a new chat, get the real ID from backend in background
    if (isNewChat) {
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
      <View
        style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <Ionicons name="menu" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text
          style={{
            color: Colors.white,
            fontSize: 16,
            fontFamily: 'Montserrat-SemiBold',
          }}
        >
          TobaFarm
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Ionicons
            name="create-outline"
            size={20}
            color={Colors.white}
          />
          <Ionicons
            name="settings-outline"
            size={20}
            color={Colors.white}
          />
        </View>
      </View>

      {/* ===== CHAT LIST ===== */}
      <View style={{ flex: 1 }}>
        <ChatList data={activeMessages} />
      </View>

      {/* ===== INPUT ===== */}
      <View style={Layout.chatInputContainer}>
        <ChatInput
          onSend={(text) => onSend(undefined, text)}
        />
      </View>
    </SafeAreaView>
  );
}
