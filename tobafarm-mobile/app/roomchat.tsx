import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import ChatList from '../components/ChatList';
import ChatInput from '../components/ChatInput';
import Sidebar from '../components/Sidebar';

import { Layout, Colors } from '../styles';

export default function RoomChat() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'user',
      text: prompt ?? 'Bagaimana Cara Menanam Padi?',
    },
    {
      id: '2',
      type: 'ai',
      text:
        'Menanam padi membutuhkan ketelatenan dan manajemen air yang baik. Berikut adalah langkah-langkah singkatnya:\n\n' +
        '1. Persiapan Benih & Lahan\nRendam benih padi berkualitas selama 24 jam.\n\n' +
        '2. Persemaian\nTanam benih selama 15-20 hari hingga memiliki 3-4 helai daun.\n\n' +
        '3. Penanaman\nPindahkan bibit dengan jarak tanam teratur.\n\n' +
        '4. Perawatan\nPengairan, penyiangan, pemupukan, dan pengendalian hama.\n\n' +
        '5. Panen\nPanen saat 95% gabah menguning.',
    },
  ]);

  return (
    <SafeAreaView
      style={[
        Layout.chatScreen,
        { backgroundColor: Colors.backgroundPrimary },
      ]}
    >
      {/* ===== SIDEBAR ===== */}
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
        <ChatList data={messages} />
      </View>

      {/* ===== INPUT ===== */}
      <View style={Layout.chatInputContainer}>
        <ChatInput
          onSend={(text) =>
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: 'user',
                text,
              },
              {
                id: `${Date.now()}-ai`,
                type: 'ai',
                text:
                  'Ini adalah response dummy lanjutan dari ToFa AI.',
              },
            ])
          }
        />
      </View>
    </SafeAreaView>
  );
}
  