import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import {
  ComponentStyles,
  ComponentTextStyles,
  Colors,
} from '../styles';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function Sidebar({ visible, onClose }: Props) {
  if (!visible) return null;

  /* ===== USER STATE (DUMMY SEKARANG) ===== */
  const [user] = useState({
    name: 'Glen Pardede',
  });

  const initial = user.name
    ? user.name.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={ComponentStyles.sidebarOverlay}>
      {/* ===== SIDEBAR ===== */}
      <SafeAreaView style={ComponentStyles.sidebarContainer}>
        {/* HEADER */}
        <View style={ComponentStyles.sidebarHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="menu" size={22} color={Colors.black} />
          </TouchableOpacity>

          <Ionicons name="search" size={20} color={Colors.black} />
        </View>

        {/* NEW CHAT */}
        <TouchableOpacity style={ComponentStyles.sidebarNewChat}>
          <Ionicons name="create-outline" size={18} color={Colors.black} />
          <Text style={ComponentTextStyles.sidebarNewChatText}>
            Percakapan Baru
          </Text>
        </TouchableOpacity>

        {/* LIST CHAT */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={ComponentTextStyles.sidebarSectionTitle}>
            Percakapan Anda
          </Text>

          {[
            'Bagaimana Cara Menanam Padi?',
            'Bagaimana Cara Menanam andaliman di ...',
            'Bagaimana Cara Menanam andaliman di ...',
          ].map((item, index) => (
            <View
              key={index}
              style={[
                ComponentStyles.sidebarItem,
                index === 0 && ComponentStyles.sidebarItemActive,
              ]}
            >
              <Text
                style={ComponentTextStyles.sidebarItemText}
                numberOfLines={1}
              >
                {item}
              </Text>
            </View>
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
              {user.name}
            </Text>

            {/* ARROW */}
            <Ionicons
              name="settings-outline"
              size={16}
              color={Colors.black}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* ===== BACKDROP ===== */}
      <TouchableOpacity
        style={ComponentStyles.sidebarBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
    </View>
  );
}
