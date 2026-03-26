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
import { Ionicons } from "@expo/vector-icons";
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

  // --- State Dropdown ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      if (isOfflineModelDownloaded) {
        setSelectedModel("tofa-offline");
        Alert.alert(
          "Offline Mode",
          "Koneksi terputus. Beralih ke mode offline otomatis.",
        );
      } else {
        Alert.alert(
          "Mode Offline Tidak Tersedia",
          "Koneksi terputus. Silakan hubungkan internet untuk mengunduh model terlebih dahulu.",
        );
      }
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
  }, [
    isInternetReachable,
    selectedModel,
    defaultOnlineModel,
    isOfflineModelDownloaded,
  ]);

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

    if (selectedModel === "tofa-offline" && !isOfflineModelDownloaded) {
      Alert.alert(
        "Model Offline Belum Tersedia",
        "Silakan hubungkan internet untuk mengunduh model terlebih dahulu.",
        [{ text: "OK" }],
      );
      return;
    }

    setIsSending(true);
    Keyboard.dismiss();

    const userMsg = makeUserMsg(text);
    setGuestMessages((prev) => [...prev, userMsg]);
    setInput("");

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
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: Colors.backgroundPrimary, zIndex: 20 }}
      >
        <View style={[ComponentStyles.roomChatHeader, { height: 60 }]}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              style={[
                ComponentTextStyles.roomChatHeaderTitle,
                { fontSize: 20, fontFamily: "Montserrat-Bold" },
              ]}
            >
              TobaFarm
            </Text>
          </View>

          {/* CUSTOM DROPDOWN SELECTOR */}
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <TouchableOpacity
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              style={[
                ComponentStyles.roomChatDropdownTrigger,
                {
                  backgroundColor: "rgba(0,0,0,0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Montserrat-SemiBold",
                  color:
                    selectedModel === "tofa-offline" ? "#ffb703" : "#4ade80",
                  marginRight: 4,
                }}
              >
                {selectedModel === "tofa-offline"
                  ? "Mode Offline"
                  : "Mode Online"}
              </Text>
              <Ionicons
                name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color="white"
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View
                style={[ComponentStyles.dropdownModal, { top: 45, width: 160 }]}
              >
                {/* Opsi Online */}
                <TouchableOpacity
                  style={ComponentStyles.dropdownItem}
                  onPress={() => {
                    setSelectedModel(defaultOnlineModel);
                    setIsDropdownOpen(false);
                  }}
                >
                  <View style={ComponentStyles.dropdownItemRow}>
                    <Text
                      style={[
                        ComponentTextStyles.dropdownModelName,
                        {
                          color:
                            selectedModel !== "tofa-offline"
                              ? Colors.buttonPrimary
                              : "#333",
                        },
                      ]}
                    >
                      Mode Online
                    </Text>
                    {selectedModel !== "tofa-offline" && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={Colors.buttonPrimary}
                      />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Opsi Offline */}
                <View style={ComponentStyles.dropdownOfflineRow}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                    disabled={!isOfflineModelDownloaded}
                    onPress={() => {
                      setSelectedModel("tofa-offline");
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        ComponentTextStyles.dropdownModelName,
                        {
                          color:
                            selectedModel === "tofa-offline"
                              ? Colors.buttonPrimary
                              : "#333",
                          opacity: isOfflineModelDownloaded ? 1 : 0.4,
                        },
                      ]}
                    >
                      Mode Offline
                    </Text>
                    {selectedModel === "tofa-offline" && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={Colors.buttonPrimary}
                      />
                    )}
                  </TouchableOpacity>

                  {!isOfflineModelDownloaded && (
                    <TouchableOpacity
                      onPress={() => {
                        setDownloadModelVisible(true);
                        setIsDropdownOpen(false);
                      }}
                      style={{ paddingLeft: 8 }}
                    >
                      <Ionicons
                        name="download-outline"
                        size={20}
                        color={Colors.buttonPrimary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={{
                backgroundColor: Colors.white,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  color: Colors.backgroundPrimary,
                  fontFamily: "Montserrat-SemiBold",
                  fontSize: 12,
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Backdrop Dropdown */}
      {isDropdownOpen && (
        <TouchableOpacity
          activeOpacity={1}
          style={ComponentStyles.dropdownBackdrop}
          onPress={() => setIsDropdownOpen(false)}
        />
      )}

      {/* ===== AREA CHAT & INPUT ===== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          <View
            style={[
              ComponentStyles.syncBanner,
              { backgroundColor: "rgba(255,255,255,0.1)" },
            ]}
          >
            <Text
              style={[ComponentTextStyles.syncBannerText, { color: "#ccc" }]}
            >
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
            { paddingBottom: Platform.OS === "android" ? 12 : 0 },
          ]}
        >
          <ChatInput
            model={selectedModel}
            onSend={(text) => onSend(undefined, text)}
            placeholder={
              isSending
                ? `ToFa Sedang Menjawab${typingDots}`
                : "Tanyakan sesuatu..."
            }
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
          setSelectedModel("tofa-offline");
          setDownloadModelVisible(false);
        }}
      />
    </View>
  );
}
