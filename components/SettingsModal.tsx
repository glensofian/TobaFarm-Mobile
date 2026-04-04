import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ComponentStyles, ComponentTextStyles } from '../styles';

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  onClearAll: () => Promise<void>;
  onOpenChangePassword: () => void;
  username: string;
  onSaveNickname?: (name: string) => Promise<void>;
};

export default function SettingsModal({
  visible,
  onClose,
  onLogout,
  onClearAll,
  onOpenChangePassword,
  username,
  onSaveNickname,
}: SettingsModalProps) {
  const [nickname, setNickname] = useState(username);
  const [selectedLanguage, setSelectedLanguage] = useState('Indonesia');

  // Efek untuk menyimpan secara otomatis (debounce bisa ditambahkan nanti)
  useEffect(() => {
    if (visible && nickname && nickname !== username) {
      onSaveNickname?.(nickname);
    }
  }, [nickname]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={ComponentStyles.settingsOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={ComponentStyles.settingsKeyboardView}
        >
          <Pressable style={ComponentStyles.settingsPressableOverlay} onPress={onClose}>
            <View style={ComponentStyles.settingsModalContainer} onStartShouldSetResponder={() => true}>
              {/* Header */}
              <View style={ComponentStyles.settingsHeader}>
                <Text style={ComponentTextStyles.settingsHeaderTitle}>Pengaturan</Text>
                <TouchableOpacity onPress={onClose} style={ComponentStyles.settingsCloseBtn}>
                  <Ionicons name="close" size={24} color={'#000'} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={ComponentStyles.settingsScrollContent}
                keyboardShouldPersistTaps="handled"
              >

                {/* Bahasa */}
                <View style={ComponentStyles.settingsRow}>
                  <Text style={ComponentTextStyles.settingsLabel}>Bahasa</Text>
                  <TouchableOpacity style={ComponentStyles.settingsDropdownBtn}>
                    <Text style={ComponentTextStyles.settingsDropdownText}>{selectedLanguage}</Text>
                    <Ionicons name="chevron-down" size={16} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* Nama Panggilan */}
                <View style={ComponentStyles.settingsRow}>
                  <Text style={ComponentTextStyles.settingsLabel}>Nama Panggilan</Text>
                  <TextInput
                    style={ComponentStyles.settingsInput}
                    value={nickname} // Gunakan state nickname langsung tanpa || username
                    onChangeText={setNickname}
                    placeholder={username || "Nama"} // Username tetap ada sebagai bayangan (placeholder)
                    placeholderTextColor="#999"
                    selectTextOnFocus={true}
                  />
                </View>

                {/* Hapus Semua Chat */}
                <View style={ComponentStyles.settingsRow}>
                  <Text style={ComponentTextStyles.settingsLabel}>Hapus Semua Chat</Text>
                  <TouchableOpacity 
                    style={ComponentStyles.settingsActionBtn} 
                    onPress={() => {
                        Alert.alert(
                          "Hapus Semua Chat",
                          "Apakah Anda yakin ingin menghapus seluruh riwayat percakapan? Tindakan ini tidak dapat dibatalkan.",
                          [
                            { text: "Batal", style: "cancel" },
                            { text: "Hapus", style: "destructive", onPress: onClearAll }
                          ]
                        );
                    }}
                  >
                    <Text style={[ComponentTextStyles.settingsActionText, { color: '#D32F2F' }]}>Hapus</Text>
                    <Ionicons name="trash-outline" size={18} color="#D32F2F" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>

                {/* Keluar dari akun */}
                <View style={ComponentStyles.settingsRow}>
                  <Text style={ComponentTextStyles.settingsLabel}>Keluar dari akun</Text>
                  <TouchableOpacity style={ComponentStyles.settingsActionBtn} onPress={onLogout}>
                    <Text style={ComponentTextStyles.settingsActionText}>Keluar</Text>
                    <Ionicons name="log-out-outline" size={18} color={'#000'} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>

                {/* Ganti Kata Sandi */}
                <View style={[ComponentStyles.settingsRow, { borderBottomWidth: 0 }]}>
                  <Text style={ComponentTextStyles.settingsLabel}>Ganti Kata Sandi</Text>
                  <TouchableOpacity
                    style={ComponentStyles.settingsChangePassBtn}
                    onPress={() => {
                      onClose();
                      setTimeout(onOpenChangePassword, 300);
                    }}
                  >
                    <Text style={ComponentTextStyles.settingsChangePassText}>Ganti</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
