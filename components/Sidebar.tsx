import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserProfile } from '@/types';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import {
  Colors,
  ComponentStyles,
  ComponentTextStyles,
} from '../styles';
import type { Conversation } from "../types";
import { removeValueFor } from '../utils/storage';

type Props = {
  user: UserProfile;

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
  menuRef?: React.RefObject<any>;
  searchInputRef?: React.RefObject<any>;
};

export default function Sidebar({
  user,
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
  const { t } = useLanguage();
  const router = useRouter();
  const [settingsModal, showSettingsModal] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [isVisible, setIsVisible] = useState(showSidebar);
  const slideAnim = useRef(new Animated.Value(showSidebar ? 0 : -300)).current;
  const fadeAnim = useRef(new Animated.Value(showSidebar ? 1 : 0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSidebar) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -350,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        setRenamingId(null);
        setRenamingValue("");
        setOpenMenuId(null);
      });
    }
  }, [showSidebar]);

  // Animasi search
  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [searchOpen]);

  if (!isVisible) return null;

  const onClose = () => setShowSidebar(false);

  const handleLogout = async () => {
    await removeValueFor("token");
    await removeValueFor("user");
    await removeValueFor("lastConversationId");
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
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: fadeAnim }}>
        <TouchableOpacity
          style={[ComponentStyles.sidebarBackdrop, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
          activeOpacity={1}
          onPress={() => {
            setOpenMenuId(null);
            onClose();
          }}
        />
      </Animated.View>

      {/* ===== SIDEBAR CONTENT ===== */}
      <Animated.View 
        style={[ComponentStyles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              setOpenMenuId(null);
              showSettingsModal(false);
            }}
          >
            {/* HEADER */}
            <View style={[ComponentStyles.sidebarHeader, { height: 42, overflow: 'hidden' }]}> 
              {/* SEARCH BAR ANIMATED */}
              {searchOpen && (
                <Animated.View style={{ 
                  position: 'absolute',
                  top: 0, 
                  left: 10, 
                  right: 10, 
                  bottom: 0,
                  zIndex: 2,
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#FFFFFF', 
                  borderWidth: 1,
                  borderColor: '#CCCCCC',
                  borderRadius: 10, 
                  paddingHorizontal: 8, 
                  opacity: searchAnim,
                  transform: [{ scaleY: searchAnim.interpolate({ inputRange:[0, 1], outputRange:[0.8, 1]}) }]
                }}>
                  <TouchableOpacity onPress={() => { setSearchOpen(() => false); setSearchQuery(''); }}>
                    <Ionicons name="arrow-back" size={20} color={Colors.black} style={{ padding: 4 }} />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={{ flex: 1, fontFamily: 'Montserrat-Regular', fontSize: 14, color: Colors.black, paddingVertical: 0, paddingHorizontal: 4 }}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t?.roomChat.searchPlaceholder || "Cari percakapan..."}
                    placeholderTextColor="#999"
                    autoFocus
                  />
                  
                  {searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={18} color={'#999'} />
                    </TouchableOpacity>
                  ) : null}
                </Animated.View>
              )}

              {/* DEFAULT HEADER */}
              <Animated.View style={{ 
                flex: 1, 
                flexDirection: 'row', 
                alignItems: 'center',
                opacity: searchAnim.interpolate({ inputRange:[0, 1], outputRange:[1, 0] })
              }}>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="menu" size={22} color={Colors.black} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => setSearchOpen(() => true)}>
                  <Ionicons name="search" size={20} color={Colors.black} />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* NEW CHAT */}
            <TouchableOpacity
              onPress={() => {
                setOpenMenuId(null);
                setActiveConversationId("");
                onNewChat();
                onClose();
              }}
              style={ComponentStyles.sidebarNewChat}
            >
              <Ionicons name="create-outline" size={18} color={Colors.black} />
              <Text style={ComponentTextStyles.sidebarNewChatText}>
                {t?.roomChat.newChat || "Percakapan Baru"}
              </Text>
            </TouchableOpacity>

            {/* LIST CHAT */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={ComponentTextStyles.sidebarSectionTitle}>
                {t?.roomChat.yourChats || "Percakapan Anda"}
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
                    String(item.id) === String(activeConversationId) && ComponentStyles.sidebarItemActive,
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

                {/* SETTINGS ICON */}
                <Ionicons
                  name="settings-outline"
                  size={16}
                  color={Colors.black}
                  onPress={() => {
                    onClose();
                    setTimeout(onOpenSettings, 300);
                  }}
                />
              </View>
            </View>
          </Pressable>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
