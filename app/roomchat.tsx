import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatInput from '../components/ChatInput';
import FirstCanvas from '../components/FirstCanvas';
import ChatList from '../components/ChatList';
import Sidebar from '../components/Sidebar';
import DownloadModel from '../components/DownloadModel';
import NotificationModal from '../components/NotificationModal';
import SettingsModal from '../components/SettingsModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { ChatProvider, useChat } from '../context/ChatContext';
import { useLanguage } from '../context/LanguageContext';
import { useNetwork } from '../context/NetworkContext';
import { Colors, Layout, ComponentStyles, ComponentTextStyles } from '../styles';
import { translations } from '../i18n';
import { models } from '../constants/models';

// --- Inner component { Context } ---

function RoomChatInner() {
  const router = useRouter();
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { isInternetReachable } = useNetwork();
  
  // --- State Keyboard visibility ---
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // --- Modal States ---
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  
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
    user,
    sidebarOpen, setSidebarOpen,
    searchOpen, setSearchOpen,
    searchQuery, setSearchQuery,
    selectedModel, setSelectedModel,
    modelsModalVisible, setModelsModalVisible,
    downloadModelVisible, setDownloadModelVisible,
    isOfflineModelDownloaded, checkOfflineModel,
    handleDeleteOfflineModel,
    activeConversationId, setActiveConversationId,
    filteredConversations,
    activeMessagesUI,
    input, setInput,
    isSending,
    typingDots,
    initializationError, setInitializationError,
    notification, setNotification,
    onSend,
    handleNewChat,
    handleDeleteConversation,
    handleRenameConversation,
    handleClearAllChats,
    handleLogout,
    handleUpdateNickname,
    handleChangePassword,
    isSyncing,
    wsStatus,
  } = useChat();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const models = [
    { id: 'tofa-lite', label: 'ToFa Lite' },
    { id: 'tofa-pro', label: 'ToFa Pro' },
    { id: 'tofa-ultra', label: 'ToFa Ultra' }
  ];

  // Initial prompt handling
  useEffect(() => {
    const isReady = wsStatus === 'open' || selectedModel === 'tofa-offline';
    if (prompt && activeMessagesUI.length === 0 && isReady && !isSending) {
      onSend(undefined, prompt as string, true);
      router.setParams({ prompt: undefined });
    }
  }, [prompt, wsStatus, selectedModel, activeMessagesUI.length, isSending, onSend, router]);

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
      <View style={ComponentStyles.roomChatHeader}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <Ionicons name="menu" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={ComponentStyles.roomChatHeaderCenter}>
          <TouchableOpacity
            onPress={() => setModelsModalVisible(!modelsModalVisible)}
            style={ComponentStyles.roomChatDropdownTrigger}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={ComponentTextStyles.roomChatHeaderTitle}>
                TobaFarm
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: -2 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Montserrat-Medium' }}>
                  {models.find(m => m.id === selectedModel)?.label || "Model"}
                </Text>
                <Ionicons name="chevron-down" size={10} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Online/Offline Status */}
          {isInternetReachable === false && (
            <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700', marginTop: -2 }}>
              {t.roomChat.offline}
            </Text>
          )}

          {modelsModalVisible && (
            <View style={ComponentStyles.dropdownModal}>
              <View style={ComponentStyles.dropdownHeader}>
                <Text style={ComponentTextStyles.dropdownHeaderText}>{t.roomChat.activeModel}</Text>
              </View>

              {/* Online Models */}
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => {
                    setSelectedModel(model.id);
                    setModelsModalVisible(false);
                  }}
                  style={[
                    ComponentStyles.dropdownItem,
                    { backgroundColor: selectedModel === model.id ? '#f5f5f5' : 'transparent' }
                  ]}
                >
                  <View style={ComponentStyles.dropdownItemRow}>
                    <Text style={ComponentTextStyles.dropdownModelName}>{model.label}</Text>
                    {selectedModel === model.id && (
                      <Ionicons name="checkmark" size={18} color={Colors.backgroundPrimary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Offline Model */}
              <View
                style={[
                  ComponentStyles.dropdownOfflineRow,
                  { backgroundColor: selectedModel === 'tofa-offline' ? '#f5f5f5' : 'transparent' }
                ]}
              >
                <TouchableOpacity
                  disabled={!isOfflineModelDownloaded}
                  onPress={() => {
                    setSelectedModel('tofa-offline');
                    setModelsModalVisible(false);
                  }}
                  style={{ flex: 1 }}
                >
                  <View style={ComponentStyles.dropdownOfflineInner}>
                    <Text style={[
                      ComponentTextStyles.dropdownModelName,
                      { color: selectedModel === 'tofa-offline' ? Colors.backgroundPrimary : '#333' }
                    ]}>
                      {t.roomChat.offlineMode}
                    </Text>
                    {selectedModel === 'tofa-offline' && (
                      <Ionicons name="checkmark" size={18} color={Colors.backgroundPrimary} style={{ marginRight: 8 }} />
                    )}
                  </View>
                </TouchableOpacity>

                {!isOfflineModelDownloaded && (
                  <TouchableOpacity
                    style={ComponentStyles.dropdownDownloadBtn}
                    onPress={() => {
                      setModelsModalVisible(false);
                      setDownloadModelVisible(true);
                    }}
                  >
                    <Ionicons name="add-outline" size={22} color={Colors.backgroundPrimary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={ComponentStyles.roomChatHeaderIcons}>
          <TouchableOpacity onPress={handleNewChat}>
            <Ionicons name="create-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
          {selectedModel === 'tofa-offline' && (
            <TouchableOpacity onPress={handleDeleteOfflineModel}>
              <Ionicons name="trash" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Backdrop */}
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
        enabled={Platform.OS === "ios" || (isKeyboardVisible && !sidebarOpen && !settingsVisible && !changePasswordVisible)}
      >
        {activeConversationId || prompt ? (
          <>
            <View style={ComponentStyles.chatListContainer}>
              {isSyncing && (
                <View style={ComponentStyles.syncBanner}>
                  <Text style={ComponentTextStyles.syncBannerText}>
                    {t.roomChat.syncing}
                  </Text>
                </View>
              )}
              <ChatList data={activeMessagesUI} />
            </View>

            <View
              pointerEvents={isSending ? "none" : "auto"}
              style={[
                Layout.chatInputContainer,
                { paddingBottom: (isKeyboardVisible && !sidebarOpen) ? 10 : insets.bottom + 10 }
              ]}
            >
              <ChatInput
                model={selectedModel}
                isLoading={isSending}
                onSend={(text) => onSend(undefined, text)}
                placeholder={isSending ? `${t.roomChat.answering}${typingDots}` : t.roomChat.placeholder}
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
        user={user!}
        showSidebar={sidebarOpen}
        setShowSidebar={setSidebarOpen}
        sidebarCollapsed={sidebarOpen}
        setSidebarCollapsed={() => {}}
        onOpenRename={handleRenameConversation}
        onNewChat={handleNewChat}
        onClearAll={handleClearAllChats}
        conversations={filteredConversations}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        onDeleteConversation={handleDeleteConversation}
        searchOpen={searchOpen}
        setSearchOpen={(fn: any) => setSearchOpen(fn)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredConversations={filteredConversations}
        openMenuId={openMenuId}
        setOpenMenuId={(fn: any) => setOpenMenuId(fn)}
        onOpenSettings={() => setSettingsVisible(true)}
      />

      {/* ===== MODALS (PROPS BASED) ===== */}
      <SettingsModal 
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onLogout={handleLogout}
        onClearAll={handleClearAllChats}
        onOpenChangePassword={() => setChangePasswordVisible(true)}
        username={user?.username || ""}
        onSaveNickname={handleUpdateNickname}
      />

      <ChangePasswordModal 
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
        onSubmit={handleChangePassword}
      />

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

// --- Root export ---

export default function RoomChat() {
  return (
    <ChatProvider>
      <RoomChatInner />
    </ChatProvider>
  );
}
