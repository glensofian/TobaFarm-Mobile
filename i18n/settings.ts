import type { SettingsTranslation } from "./types";

export const settingsTranslation: Record<
  "id" | "en",
  SettingsTranslation & Record<string, string>
> = {
  id: {
    title: "Pengaturan",
    profileSection: "Profil",
    nicknameLabel: "Nama Panggilan",
    nicknamePlaceholder: "Ubah nama panggilan...",
    appSection: "Aplikasi",
    languageLabel: "Bahasa",
    indonesian: "Indonesia",
    english: "Inggris",
    clearHistoryLabel: "Hapus Semua Chat",
    clearHistoryConfirm: "Semua riwayat percakapan akan dihapus secara permanen. Lanjutkan?",
    logoutLabel: "Keluar Akun",
    changePasswordLabel: "Ganti Kata Sandi",
    updateSuccess: "Berhasil diperbarui",
    updateError: "Gagal diperbarui",
    cancel: "Batal",
    delete: "Hapus",
    changeButton: "Ganti",
  },

  en: {
    title: "Settings",
    profileSection: "Profile",
    nicknameLabel: "Nickname",
    nicknamePlaceholder: "Change nickname...",
    appSection: "Application",
    languageLabel: "Language",
    indonesian: "Indonesian",
    english: "English",
    clearHistoryLabel: "Clear All Chats",
    clearHistoryConfirm: "All conversation history will be permanently deleted. Continue?",
    logoutLabel: "Logout",
    changePasswordLabel: "Change Password",
    updateSuccess: "Successfully updated",
    updateError: "Failed to update",
    cancel: "Cancel",
    delete: "Delete",
    changeButton: "Change",
  },
};
