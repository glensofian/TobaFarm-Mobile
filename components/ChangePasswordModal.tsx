import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
  View,
} from 'react-native';
import { ComponentStyles, ComponentTextStyles } from '../styles';

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
      Alert.alert("Input Tidak Lengkap", "Harap isi semua field password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Password Tidak Cocok", "Konfirmasi password baru tidak sesuai.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(oldPassword, newPassword);
      Alert.alert("Berhasil", "Kata sandi Anda telah diperbarui.");
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
      statusBarTranslucent={true}
    >
      <View style={ComponentStyles.changePassOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={ComponentStyles.changePassKeyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
        >
          <Pressable style={ComponentStyles.changePassPressableOverlay} onPress={onClose}>
            <View style={ComponentStyles.changePassContainer} onStartShouldSetResponder={() => true}>
              <View style={ComponentStyles.changePassHeader}>
                <Text style={ComponentTextStyles.changePassHeaderTitle}>Ganti Kata Sandi</Text>
              </View>

              <ScrollView
                contentContainerStyle={ComponentStyles.changePassScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Kata Sandi Lama */}
                <View style={ComponentStyles.changePassField}>
                  <Text style={ComponentTextStyles.changePassLabel}>Kata Sandi Lama</Text>
                  <View style={ComponentStyles.changePassInputWrapper}>
                    <TextInput
                      style={ComponentStyles.changePassInput}
                      secureTextEntry={!showOld}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      placeholder="********"
                      placeholderTextColor="#AAA"
                    />
                    <TouchableOpacity onPress={() => setShowOld(!showOld)} style={ComponentStyles.changePassEyeBtn}>
                      <Ionicons name={showOld ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Kata Sandi Baru */}
                <View style={ComponentStyles.changePassField}>
                  <Text style={ComponentTextStyles.changePassLabel}>Kata Sandi Baru</Text>
                  <View style={ComponentStyles.changePassInputWrapper}>
                    <TextInput
                      style={ComponentStyles.changePassInput}
                      secureTextEntry={!showNew}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="********"
                      placeholderTextColor="#AAA"
                    />
                    <TouchableOpacity onPress={() => setShowNew(!showNew)} style={ComponentStyles.changePassEyeBtn}>
                      <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Konfirmasi Kata Sandi Baru */}
                <View style={ComponentStyles.changePassField}>
                  <Text style={ComponentTextStyles.changePassLabel}>Konfirmasi Kata Sandi Baru</Text>
                  <View style={ComponentStyles.changePassInputWrapper}>
                    <TextInput
                      style={ComponentStyles.changePassInput}
                      secureTextEntry={!showNew}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="********"
                      placeholderTextColor="#AAA"
                    />
                  </View>
                </View>

                {/* Actions */}
                <View style={ComponentStyles.changePassActions}>
                  <TouchableOpacity
                    style={ComponentStyles.changePassBtnCancel}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text style={ComponentTextStyles.changePassBtnCancelText}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={ComponentStyles.changePassBtnSave}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    <Text style={ComponentTextStyles.changePassBtnSaveText}>{loading ? "Menyimpan..." : "Simpan"}</Text>
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
