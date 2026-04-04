import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../styles';

type ChangePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (oldPw: string, newPw: string) => Promise<void>;
};

export default function ChangePasswordModal({
  visible,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Semua field harus diisi.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Konfirmasi password baru tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(oldPassword, newPassword);
      Alert.alert("Sukses", "Kata sandi berhasil diubah.");
      onClose();
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      Alert.alert("Gagal", e.message || "Gagal mengubah kata sandi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
        >
          <Pressable style={styles.pressableOverlay} onPress={onClose}>
            <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Ganti Kata Sandi</Text>
              </View>

              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* Password lama */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kata Sandi Lama</Text>
                  <View style={[styles.passwordWrapper, { backgroundColor: '#E2E2E2' }]}>
                    <TextInput
                      style={styles.input}
                      secureTextEntry={!showOld}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      placeholder="********"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity onPress={() => setShowOld(!showOld)} style={styles.eyeIcon}>
                      <Ionicons name={showOld ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Password Baru */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kata Sandi Baru</Text>
                  <View style={[styles.passwordWrapper, { backgroundColor: '#E2E2E2' }]}>
                    <TextInput
                      style={styles.input}
                      secureTextEntry={!showNew}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="********"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                      <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Konfirmasi */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Konfirmasi Kata Sandi Baru</Text>
                  <View style={[styles.passwordWrapper, { backgroundColor: '#E2E2E2' }]}>
                    <TextInput
                      style={styles.input}
                      secureTextEntry={!showNew}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="********"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* Buttons */}
                <View style={styles.footer}>
                  <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.saveBtn, loading && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    <Text style={styles.saveBtnText}>{loading ? "Menyimpan..." : "Simpan"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    flexShrink: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.black,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginBottom: 6,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.black,
  },
  eyeIcon: {
    padding: 8,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'flex-end',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelBtn: {
    marginRight: 10,
    backgroundColor: '#EEE',
  },
  cancelBtnText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#333',
  },
  saveBtn: {
    backgroundColor: Colors.backgroundPrimary,
  },
  saveBtnText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: Colors.white,
  },
});
