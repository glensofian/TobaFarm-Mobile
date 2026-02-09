import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import LoginButton from '../components/LoginButton';
import ChatInput from '../components/ChatInput';
import { Colors, Typography, Layout } from '../styles';

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={[Layout.screen, { backgroundColor: Colors.backgroundPrimary }]}
    >
      <LoginButton />

      {/* LOGO */}
      <View style={{ flex: 1.6, justifyContent: 'flex-end', alignItems: 'center' }}>
        <Image
          source={require('../assets/images/tobafarm-logo.png')}
          style={{ width: 220, height: 220 }}
          resizeMode="contain"
        />
      </View>

      {/* PROMPT */}
      <View style={{ flex: 1.4, width: '85%', alignSelf: 'center' }}>
        <Text style={[Typography.greeting, { color: Colors.textSecondary }]}>
          Halo, Selamat Pagi
        </Text>

        <Text
          style={[
            Typography.question,
            { color: Colors.textPrimary, marginBottom: 12 },
          ]}
        >
          Apa yang boleh saya bantu ?
        </Text>

        <ChatInput
          onSend={(text) => {
            if (!text.trim()) return;

            router.push({
              pathname: '/roomchat',
              params: {
                prompt: text,
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}
