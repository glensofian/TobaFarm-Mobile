import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../styles';

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
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Pressable style={styles.pressableOverlay} onPress={onClose}>
            <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Pengaturan</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={Colors.black} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >

                {/* Bahasa */}
                <View style={styles.settingRow}>
                  <Text style={styles.label}>Bahasa</Text>
                  <TouchableOpacity style={styles.dropdownBtn}>
                    <Text style={styles.dropdownText}>{selectedLanguage}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Nama Panggilan */}
                <View style={styles.settingRow}>
                  <Text style={styles.label}>Nama Panggilan</Text>
                  <TextInput
                    style={styles.input}
                    value={nickname} // Gunakan state nickname langsung tanpa || username
                    onChangeText={setNickname}
                    placeholder={username || "Nama"} // Username tetap ada sebagai bayangan (placeholder)
                    placeholderTextColor="#999"
                    selectTextOnFocus={true}
                  />
                </View>

                {/* Hapus Semua Chat */}
                <View style={styles.settingRow}>
                  <Text style={styles.label}>Hapus Semua Chat</Text>
                  <TouchableOpacity style={styles.actionBtn} onPress={onClearAll}>
                    <Text style={[styles.actionText, { color: '#D32F2F' }]}>Hapus</Text>
                    <Ionicons name="trash-outline" size={18} color="#D32F2F" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>

                {/* Keluar dari akun */}
                <View style={styles.settingRow}>
                  <Text style={styles.label}>Keluar dari akun</Text>
                  <TouchableOpacity style={styles.actionBtn} onPress={onLogout}>
                    <Text style={styles.actionText}>Keluar</Text>
                    <Ionicons name="log-out-outline" size={18} color={Colors.black} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>

                {/* Ganti Kata Sandi */}
                <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.label}>Ganti Kata Sandi</Text>
                  <TouchableOpacity
                    style={styles.changePassBtn}
                    onPress={() => {
                      onClose();
                      setTimeout(onOpenChangePassword, 300);
                    }}
                  >
                    <Text style={styles.changePassText}>Ganti</Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressableOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.black,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: Colors.black,
    flex: 1,
    marginRight: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 110,
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: Colors.black,
    marginRight: 6,
  },
  input: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.black,
    flex: 1.5,
    maxWidth: 180,
    textAlign: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: Colors.black,
  },
  changePassBtn: {
    backgroundColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  changePassText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: '#D32F2F',
  },
});
