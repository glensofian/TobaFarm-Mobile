import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import LoginButton from "../components/LoginButton";
import ChatInput from "../components/ChatInput";
import {
  Colors,
  Typography,
  Layout,
  ComponentStyles,
  ComponentTextStyles,
} from "../styles";
import { getValueFor } from "../utils/storage";
import { createConversationsApi } from "../api/conversationsApi";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // Check Log / No
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValueFor("token"); 
      const userStr = await getValueFor("user");

      setIsLoggedIn(!!token);

      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUsername(userData.username);

          const api = createConversationsApi();
          const conversations = await api.loadConversations();
          if (conversations.length > 0) {
            console.log("Riwayat chat ditemukan, otomatis masuk ke RoomChat...");
            router.replace("/roomchat");
          }
        } catch (e) {
          console.error("Gagal parse data user", e);
        }
      }
    };

    checkAuth();
  }, []);

  // Greetings
  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 4 && hour < 11) {
      return "Selamat Pagi";
    } else if (hour >= 11 && hour < 15) {
      return "Selamat Siang";
    } else if (hour >= 15 && hour < 18) {
      return "Selamat Sore";
    } else {
      return "Selamat Malam";
    }
  }, []);

  return (
    <SafeAreaView
      style={[Layout.screen, { backgroundColor: Colors.backgroundPrimary }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {!isLoggedIn && <LoginButton />}

            {/* LOGO */}
            <View style={ComponentStyles.homeLogoContainer}>
              <Image
                source={require("../assets/images/tobafarm-logo.png")}
                style={ComponentStyles.homeLogo}
                resizeMode="contain"
              />
            </View>

            {/* PROMPT */}
            <View style={ComponentStyles.homePromptContainer}>
              <Text
                style={[Typography.greeting, ComponentTextStyles.homeGreeting]}
              >
                Halo{isLoggedIn ? `, ${username}` : ''}. {greeting}
              </Text>

              <Text
                style={[Typography.question, ComponentTextStyles.homeQuestion]}
              >
                Apa yang boleh saya bantu ?
              </Text>

              <ChatInput
                onSend={(text) => {
                  if (!text.trim()) return;
                  const targetPath = isLoggedIn ? "/roomchat" : "/roomguest";
                  router.push({
                    pathname: targetPath,
                    params: { prompt: text },
                  });
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
