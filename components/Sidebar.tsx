import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserProfile } from '@/types';
import { useRouter } from 'expo-router';
import type { Translation } from "../constants/i18n/translations";
import {
  Colors,
  ComponentStyles,
  ComponentTextStyles,
} from '../styles';
import type { Conversation } from "../types";
import { removeValueFor } from '../utils/storage';

type Props = {
  user: UserProfile;

  t: Translation;

  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (fn: (v: boolean) => boolean) => void;

  searchOpen: boolean;
  setSearchOpen: (fn: (v: boolean) => boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;

  conversations: Conversation[];
  filteredConversations: Conversation[];
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;

  openMenuId: string | null;
  setOpenMenuId: (fn: (prev: string | null) => string | null) => void;

  onNewChat: () => void;
  onOpenRename: (id: string, currentTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;

  onOpenSettings: () => void;

  // refs
  menuRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
};

export default function Sidebar({
  user,
  t,
  showSidebar,
  setShowSidebar,
  sidebarCollapsed,
  setSidebarCollapsed,
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
  filteredConversations,
  activeConversationId,
  setActiveConversationId,
  openMenuId,
  setOpenMenuId,
  onNewChat,
  onOpenRename,
  onDeleteConversation,
  onClearAll,
  onOpenSettings,
  menuRef,
  searchInputRef,
  
}: Props) {
  const router = useRouter();
  const [settingsModal, showSettingsModal] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSidebar ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar]);

  if (!showSidebar) return null;

  const onClose = () => setShowSidebar(false);

  const handleLogout = async () => {
    await removeValueFor("token");
    await removeValueFor("user");
    showSettingsModal(false);
    router.replace("/");
  };

  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  const submitRename = () => {
    if (renamingId && renamingValue.trim()) {
      onOpenRename(renamingId, renamingValue.trim());
    }
    setRenamingId(null);
    setRenamingValue("");
  };


  return (
    <View style={ComponentStyles.sidebarOverlay}>
      {/* ===== BACKDROP ===== */}
      <TouchableOpacity
        style={[ComponentStyles.sidebarBackdrop, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
        activeOpacity={1}
        onPress={() => {
          setOpenMenuId(null);
          onClose();
        }}
      />

      {/* ===== SIDEBAR CONTENT ===== */}
      <Animated.View 
        style={[ComponentStyles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setOpenMenuId(null)}
          >
            {/* HEADER */}
            <View style={ComponentStyles.sidebarHeader}>
              {searchOpen ? (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 8, height: 40 }}>
                  <Ionicons name="search" size={18} color={Colors.black} style={{ marginRight: 8 }} />
                  <TextInput
                    style={{ flex: 1, fontFamily: 'Montserrat-Regular', fontSize: 14, color: Colors.black, padding: 0 }}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t?.searchPlaceholder || "Cari percakapan..."}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => { setSearchOpen(() => false); setSearchQuery(''); }}>
                    <Ionicons name="close" size={20} color={Colors.black} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="menu" size={22} color={Colors.black} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={() => setSearchOpen(() => true)}>
                    <Ionicons name="search" size={20} color={Colors.black} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* NEW CHAT */}
            <TouchableOpacity
              onPress={() => {
                setOpenMenuId(null);
                onNewChat();
              }}
              style={ComponentStyles.sidebarNewChat}
            >
              <Ionicons name="create-outline" size={18} color={Colors.black} />
              <Text style={ComponentTextStyles.sidebarNewChatText}>
                {t?.newChatTitle || "Percakapan Baru"}
              </Text>
            </TouchableOpacity>

            {/* LIST CHAT */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={ComponentTextStyles.sidebarSectionTitle}>
                {t?.yourChats || "Percakapan Anda"}
              </Text>

              {filteredConversations.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setActiveConversationId(item.id);
                    onClose();
                  }}
                  onLongPress={() => setOpenMenuId(() => item.id)}
                  style={[
                    ComponentStyles.sidebarItem,
                    item.id === activeConversationId && ComponentStyles.sidebarItemActive,
                    openMenuId === item.id && { zIndex: 10 },
                  ]}
                >
                  {renamingId === item.id ? (
                    <TextInput
                      style={ComponentTextStyles.sidebarItemRenameText}
                      value={renamingValue}
                      onChangeText={setRenamingValue}
                      autoFocus
                      onBlur={submitRename}
                      onSubmitEditing={submitRename}
                    />
                  ) : (
                    <Text
                      style={ComponentTextStyles.sidebarItemText}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  )}

                  {openMenuId === item.id && (
                    <View style={{
                      position: 'absolute',
                      top: 10,
                      right: 40,
                      backgroundColor: 'white',
                      borderRadius: 8,
                      padding: 8,
                      elevation: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4.65,
                      zIndex: 1000,
                      minWidth: 120,
                    }}>
                      <TouchableOpacity
                        onPress={() => {
                          setRenamingId(item.id);
                          setRenamingValue(item.title);
                          setOpenMenuId(null);
                        }}
                        style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' }}
                      >
                        <Text style={{ fontSize: 14, fontFamily: 'Montserrat-Medium', color: Colors.black }}>Rename</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          onDeleteConversation(item.id);
                          setOpenMenuId(null);
                        }}
                        style={{ paddingVertical: 8 }}
                      >
                        <Text style={{ fontSize: 14, fontFamily: 'Montserrat-Medium', color: '#D32F2F' }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ===== FOOTER PROFILE ===== */}
            <View style={ComponentStyles.sidebarFooter}>
              <View style={ComponentStyles.sidebarFooterCard}>
                {/* AVATAR */}
                <View style={ComponentStyles.sidebarAvatar}>
                  <Text style={ComponentTextStyles.sidebarAvatarText}>
                    {initial}
                  </Text>
                </View>

                {/* NAME */}
                <Text
                  style={ComponentTextStyles.sidebarFooterText}
                  numberOfLines={1}
                >
                  {user?.username || "User"}
                </Text>

                {/* ARROW */}
                <Ionicons
                  name="settings-outline"
                  size={16}
                  color={Colors.black}
                  onPress={() => showSettingsModal(!settingsModal)}
                />

                {settingsModal && (
                  <View style={{
                    position: 'absolute',
                    bottom: 45,
                    right: 15,
                    backgroundColor: 'white',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    zIndex: 1000,
                  }}>
                    <TouchableOpacity onPress={() => { showSettingsModal(false) }}>
                      <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: '#D32F2F' }} onPress={handleLogout}>
                        Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
