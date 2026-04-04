import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
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
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n';

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
  const { language, setLanguage, t } = useLanguage();
  const [nickname, setNickname] = useState(username);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Efek untuk menyimpan secara otomatis (debounce bisa ditambahkan nanti)
  useEffect(() => {
    if (visible && nickname && nickname !== username) {
      onSaveNickname?.(nickname);
    }
  }, [nickname]);

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
    Keyboard.dismiss();
  };

  const handleOpenDropdown = () => {
    Keyboard.dismiss();
    setIsLangDropdownOpen(!isLangDropdownOpen);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={ComponentStyles.settingsOverlay}>
        <Pressable style={ComponentStyles.settingsPressableOverlay} onPress={onClose}>
          <View style={ComponentStyles.settingsModalContainer} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={ComponentStyles.settingsHeader}>
              <Text style={ComponentTextStyles.settingsHeaderTitle}>{t.settings.title}</Text>
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
                <View style={[ComponentStyles.settingsRow, { zIndex: 10 }]}>
                  <Text style={ComponentTextStyles.settingsLabel}>{t.settings.languageLabel}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <TouchableOpacity 
                      style={ComponentStyles.settingsDropdownBtn} 
                      onPress={handleOpenDropdown}
                    >
                      <Text style={ComponentTextStyles.settingsDropdownText}>
                          {language === 'id' ? t.settings.indonesian : t.settings.english}
                      </Text>
                      <Ionicons name={isLangDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#000" />
                    </TouchableOpacity>

                    {isLangDropdownOpen && (
                      <View style={ComponentStyles.settingsLangDropdownMenu}>
                        <TouchableOpacity 
                          style={ComponentStyles.settingsLangDropdownItem}
                          onPress={() => selectLanguage('id')}
                        >
                          <Text style={[
                            ComponentTextStyles.settingsLangDropdownText,
                            { fontWeight: language === 'id' ? '700' : '400' }
                          ]}>
                            {t.settings.indonesian}
                          </Text>
                          {language === 'id' && <Ionicons name="checkmark" size={14} color="#000" />}
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={ComponentStyles.settingsLangDropdownItem}
                          onPress={() => selectLanguage('en')}
                        >
                          <Text style={[
                            ComponentTextStyles.settingsLangDropdownText,
                            { fontWeight: language === 'en' ? '700' : '400' }
                          ]}>
                            {t.settings.english}
                          </Text>
                          {language === 'en' && <Ionicons name="checkmark" size={14} color="#000" />}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* Nama Panggilan */}
                <View style={[ComponentStyles.settingsRow, { zIndex: 1 }]}>
                  <Text style={ComponentTextStyles.settingsLabel}>{t.settings.nicknameLabel}</Text>
                  <TextInput
                    style={ComponentStyles.settingsInput}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder={username || t.settings.nicknamePlaceholder}
                    placeholderTextColor="#999"
                    selectTextOnFocus={true}
                    editable={!isLangDropdownOpen}
                  />
                </View>

                {/* Hapus Semua Chat */}
                <View style={ComponentStyles.settingsRow}>
                  <Text style={ComponentTextStyles.settingsLabel}>{t.settings.clearHistoryLabel}</Text>
                  <TouchableOpacity 
                    style={ComponentStyles.settingsActionBtn} 
                    onPress={() => {
                        Alert.alert(
                          t.settings.clearHistoryLabel,
                          t.settings.clearHistoryConfirm,
                          [
                            { text: t.settings.cancel, style: "cancel" },
                            { text: t.settings.delete, style: "destructive", onPress: onClearAll }
                          ]
                        );
                    }}
                  >
                    <Text style={[ComponentTextStyles.settingsActionText, { color: '#D32F2F' }]}>{t.settings.delete}</Text>
                    <Ionicons name="trash-outline" size={18} color="#D32F2F" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>

                {/* Keluar dari akun */}
                <View style={ComponentStyles.settingsRow}>
                  <Text style={ComponentTextStyles.settingsLabel}>{t.settings.logoutLabel}</Text>
                  <TouchableOpacity style={ComponentStyles.settingsActionBtn} onPress={onLogout}>
                    <Text style={ComponentTextStyles.settingsActionText}>{t.roomChat.logout}</Text>
                    <Ionicons name="log-out-outline" size={18} color={'#000'} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>

                {/* Ganti Kata Sandi */}
                <View style={[ComponentStyles.settingsRow, { borderBottomWidth: 0 }]}>
                  <Text style={ComponentTextStyles.settingsLabel}>{t.settings.changePasswordLabel}</Text>
                  <TouchableOpacity
                    style={ComponentStyles.settingsChangePassBtn}
                    onPress={() => {
                      onClose();
                      setTimeout(onOpenChangePassword, 300);
                    }}
                  >
                    <Text style={ComponentTextStyles.settingsChangePassText}>
                      {t.settings.changeButton}
                    </Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}
