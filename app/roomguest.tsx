import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatInput from '../components/ChatInput';
import ChatList from '../components/ChatList';
import DownloadModel from '../components/DownloadModel';
import NotificationModal from '../components/NotificationModal';
import { GuestProvider, useGuest } from '../context/GuestContext';
import {
  Colors,
  Layout,
  ComponentStyles,
  ComponentTextStyles,
} from '../styles';

// --- Inner component { Context } ---

function RoomGuestInner() {
  const router = useRouter();
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const insets = useSafeAreaInsets();

  // --- State Keyboard visibility ---
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const {
    selectedModel,
    setSelectedModel,
    defaultOnlineModel,
    isOfflineModelDownloaded,
    checkOfflineModel,
    downloadModelVisible,
    setDownloadModelVisible,
    isDropdownOpen,
    setIsDropdownOpen,
    guestMessages,
    isSending,
    typingDots,
    notification,
    setNotification,
    onSend,
    wsStatus,
  } = useGuest();

  // Handle initial prompt from home screen
  useEffect(() => {
    const isReady = wsStatus === 'open' || selectedModel === 'tofa-offline';
    if (prompt && guestMessages.length === 0 && isReady && !isSending) {
      const timer = setTimeout(() => {
        onSend(undefined, prompt as string);
        router.setParams({ prompt: undefined });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [prompt, wsStatus, selectedModel, guestMessages.length, isSending]);

  // Map messages for ChatList
  const activeMessagesUI = guestMessages.map((m) => ({
    id: m.id,
    type: m.role === 'bot' || (m as any).role === 'assistant' ? 'ai' : 'user',
    text: m.text,
  }));

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: Colors.backgroundPrimary }}
    >
      {/* ===== HEADER ===== */}
      <View style={[ComponentStyles.roomChatHeader, { height: 60, zIndex: 20 }]}>
        {/* Title */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            style={[
              ComponentTextStyles.roomChatHeaderTitle,
              { fontSize: 20, fontFamily: 'Montserrat-Bold' },
            ]}
          >
            TobaFarm
          </Text>
        </View>

        {/* Model Dropdown */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            style={[
              ComponentStyles.roomChatDropdownTrigger,
              {
                backgroundColor: 'rgba(0,0,0,0.2)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Montserrat-SemiBold',
                color: selectedModel === 'tofa-offline' ? '#ffb703' : '#4ade80',
                marginRight: 4,
              }}
            >
              {selectedModel === 'tofa-offline' ? 'Mode Offline' : 'Mode Online'}
            </Text>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="white"
            />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={[ComponentStyles.dropdownModal, { top: 45, width: 160 }]}>
              {/* Online option */}
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
                          selectedModel !== 'tofa-offline'
                            ? Colors.buttonPrimary
                            : '#333',
                      },
                    ]}
                  >
                    Mode Online
                  </Text>
                  {selectedModel !== 'tofa-offline' && (
                    <Ionicons name="checkmark" size={16} color={Colors.buttonPrimary} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Offline option */}
              <View style={ComponentStyles.dropdownOfflineRow}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  disabled={!isOfflineModelDownloaded}
                  onPress={() => {
                    setSelectedModel('tofa-offline');
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      ComponentTextStyles.dropdownModelName,
                      {
                        color:
                          selectedModel === 'tofa-offline'
                            ? Colors.buttonPrimary
                            : '#333',
                        opacity: isOfflineModelDownloaded ? 1 : 0.4,
                      },
                    ]}
                  >
                    Mode Offline
                  </Text>
                  {selectedModel === 'tofa-offline' && (
                    <Ionicons name="checkmark" size={16} color={Colors.buttonPrimary} />
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

        {/* Login button */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
          <TouchableOpacity
            onPress={() => router.push('/login')}
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
                fontFamily: 'Montserrat-SemiBold',
                fontSize: 12,
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown backdrop */}
      {isDropdownOpen && (
        <TouchableOpacity
          activeOpacity={1}
          style={ComponentStyles.dropdownBackdrop}
          onPress={() => setIsDropdownOpen(false)}
        />
      )}

      {/* ===== CHAT AREA ===== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        enabled={Platform.OS === 'ios' || isKeyboardVisible}
      >
        {/* Chat list */}
        <View style={ComponentStyles.chatListContainer}>
          <View
            style={[
              ComponentStyles.syncBanner,
              { backgroundColor: 'rgba(255,255,255,0.1)' },
            ]}
          >
            <Text style={[ComponentTextStyles.syncBannerText, { color: '#ccc' }]}>
              Mode Tamu: Percakapan ini tidak tersimpan
            </Text>
          </View>
          <ChatList data={activeMessagesUI} />
        </View>

        {/* Input */}
        <View
          pointerEvents={isSending ? 'none' : 'auto'}
          style={[
            Layout.chatInputContainer,
            { paddingBottom: isKeyboardVisible ? 10 : insets.bottom + 10 },
          ]}
        >
          <ChatInput
            model={selectedModel}
            onSend={(text) => onSend(undefined, text)}
            placeholder={isSending ? `ToFa Sedang Menjawab${typingDots}` : 'Tanyakan sesuatu...'}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ===== MODALS ===== */}
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
          setSelectedModel('tofa-offline');
          setDownloadModelVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

// --- Root export ---

export default function RoomGuest() {
  return (
    <GuestProvider>
      <RoomGuestInner />
    </GuestProvider>
  );
}
