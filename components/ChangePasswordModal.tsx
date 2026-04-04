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
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t.changePassword.title, t.changePassword.errFormIncomplete);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t.changePassword.title, t.changePassword.errFormIncomplete);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(oldPassword, newPassword);
      Alert.alert(t.changePassword.title, t.changePassword.success);
      onClose();
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      Alert.alert(t.changePassword.title, e.message || "Error");
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
                <Text style={ComponentTextStyles.changePassHeaderTitle}>{t.changePassword.title}</Text>
              </View>

              <ScrollView
                contentContainerStyle={ComponentStyles.changePassScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Kata Sandi Lama */}
                <View style={ComponentStyles.changePassField}>
                  <Text style={ComponentTextStyles.changePassLabel}>{t.changePassword.oldPassword}</Text>
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
                  <Text style={ComponentTextStyles.changePassLabel}>{t.changePassword.newPassword}</Text>
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
                  <Text style={ComponentTextStyles.changePassLabel}>{t.changePassword.confirmPassword}</Text>
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
                    <Text style={ComponentTextStyles.changePassBtnCancelText}>{t.changePassword.cancel}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={ComponentStyles.changePassBtnSave}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    <Text style={ComponentTextStyles.changePassBtnSaveText}>{loading ? t.roomChat.syncing : t.changePassword.save}</Text>
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
