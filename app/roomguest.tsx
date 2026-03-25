import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatInput from "../components/ChatInput";
import ChatList from "../components/ChatList";
import DownloadModel from "@/components/DownloadModel";
import NoInternetModal from "../components/NoInternetModal";
import { useWebSocketChat } from "../hooks/useWebSocketChat";
import { useNetwork } from "@/context/NetworkContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import * as FileSystem from "expo-file-system";
import { Message } from "../types";
import { nowIso } from "@/utils/date";
import { uid } from "@/utils/uid";
import { MODEL_CONFIG } from "../constants/modelConfig";
import { models } from "../constants/models";
import {
  Colors,
  Layout,
  ComponentStyles,
  ComponentTextStyles,
} from "../styles";

const makeUserMsg = (text: string): Message => ({
  id: uid("m"),
  role: "user",
  text,
  createdAt: nowIso(),
});

export default function RoomGuest() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const router = useRouter();

  const defaultOnlineModel = useMemo(
    () => models.find((m) => m.type === "online")?.id || models[0].id,
    [],
  );

  const [selectedModel, setSelectedModel] =
    useState<string>(defaultOnlineModel);
  const [downloadModelVisible, setDownloadModelVisible] = useState(false);
  const [isOfflineModelDownloaded, setIsOfflineModelDownloaded] =
    useState(false);

  // --- State Network ---
  const { isInternetReachable } = useNetwork();
  const {
    isConnected: isNetworkConnected,
    justDisconnected,
    justConnected,
  } = useNetworkStatus();
  const [isModalDismissed, setIsModalDismissed] = useState(false);

  // --- State Message Guest ---
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const guestConversationId = useMemo(() => "guest-session-" + uid("g"), []);

  // --- State Animation Typing ---
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

  // --- Check Model Offline ---
  const checkOfflineModel = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(
        MODEL_CONFIG.getLocalModelPath(),
      );
      setIsOfflineModelDownloaded(info.exists);
    } catch (err) {
      console.error("Error checking offline model:", err);
      setIsOfflineModelDownloaded(false);
    }
  }, []);

  useEffect(() => {
    checkOfflineModel();
  }, [checkOfflineModel]);

  // --- Handle Initial Prompt ---
  useEffect(() => {
    if (prompt && guestMessages.length === 0) {
      setTimeout(() => {
        onSend(undefined, prompt as string);
      }, 500);
    }
  }, [prompt]);

  // --- Automatic Model Change ---
  useEffect(() => {
    if (isInternetReachable === false && selectedModel !== "tofa-offline") {
      setSelectedModel("tofa-offline");
      Alert.alert(
        "Offline Mode",
        "Koneksi terputus. AI beralih ke mode offline otomatis.",
      );
    } else if (
      isInternetReachable === true &&
      selectedModel === "tofa-offline"
    ) {
      setSelectedModel(defaultOnlineModel);
      Alert.alert(
        "Online Mode",
        "Koneksi pulih. AI kembali menggunakan cloud.",
      );
    }
  }, [isInternetReachable, selectedModel, defaultOnlineModel]);

  useEffect(() => {
    if (justDisconnected) {
      setIsModalDismissed(false);
    }
  }, [justDisconnected]);

  // --- WebSocket Handlers ---
  const onWsToken = useCallback((cid: string, token: string) => {
    setGuestMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === "bot") {
        return [
          ...prev.slice(0, -1),
          { ...lastMsg, text: lastMsg.text + token },
        ];
      }
      return [
        ...prev,
        { id: uid("m"), role: "bot", text: token, createdAt: nowIso() },
      ];
    });
  }, []);

  const onWsDone = useCallback(async (cid: string, fullText: string) => {
    setIsSending(false);
  }, []);

  const ws = useWebSocketChat({
    model: selectedModel,
    enabled: true,
    getActiveConversationId: () => guestConversationId,
    onToken: onWsToken,
    onDone: onWsDone,
  });

  // --- Initial Prompt ---
  const onSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText ?? input).trim();
    
    if (!text || isSending) return;

    setIsSending(true);
    Keyboard.dismiss();

    const userMsg = makeUserMsg(text);
    setGuestMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (selectedModel === "tofa-offline" && !isOfflineModelDownloaded) {
      Alert.alert(
        "Model Offline Belum Tersedia",
        "Anda sedang offline namun model AI lokal belum diunduh. Silakan hubungkan internet terlebih dahulu.",
        [{ text: "OK" }],
      );
      setIsSending(false);
      return;
    }

    const wsOk = await ws.send(text, guestConversationId);
    if (!wsOk) {
      alert("Gagal mengirim pesan. Pastikan koneksi atau model sudah siap.");
      setIsSending(false);
    }
  };

  // --- Mapper UI List Chat ---
  const activeMessagesUI = guestMessages.map((m) => ({
    id: m.id,
    type: m.role === "bot" || (m as any).role === "assistant" ? "ai" : "user",
    text: m.text,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundPrimary }}>
      
      {/* ===== HEADER GUEST ===== */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.backgroundPrimary }}>
        <View style={[ComponentStyles.roomChatHeader, { height: 60, zIndex: 10 }]}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[ComponentTextStyles.roomChatHeaderTitle, { fontSize: 20, fontFamily: 'Montserrat-Bold' }]}>
              TobaFarm
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontFamily: "Montserrat-SemiBold", color: selectedModel === "tofa-offline" ? "#ffb703" : "#4ade80" }}>
                {selectedModel === "tofa-offline" ? "Offline Mode" : "Online Mode"}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, justifyContent: "center", alignItems: "flex-end" }}>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={{ backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }}
            >
              <Text style={{ color: Colors.backgroundPrimary, fontFamily: "Montserrat-SemiBold", fontSize: 12 }}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ===== AREA CHAT & INPUT ===== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          
          <View style={[ComponentStyles.syncBanner, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={[ComponentTextStyles.syncBannerText, { color: "#ccc" }]}>
              Mode Tamu: Percakapan ini tidak tersimpan
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <ChatList data={activeMessagesUI} />
          </View>
        </View>

        {/* Input Container */}
        <View 
          pointerEvents={isSending ? "none" : "auto"}
          style={[
            Layout.chatInputContainer, 
            { paddingBottom: Platform.OS === "android" ? 12 : 0 }
          ]}
        >
          <ChatInput
            model={selectedModel}
            onSend={(text) => onSend(undefined, text)}
            placeholder={isSending ? `ToFa Sedang Menjawab${typingDots}` : "Tanyakan sesuatu..."}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ===== MODALS & OVERLAYS ===== */}
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
    </View>
  );
}
