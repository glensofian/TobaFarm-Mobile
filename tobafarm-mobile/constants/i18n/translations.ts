import type { Lang } from "../../types";

export type Translation = {
  settings: string;
  language: string;
  indonesian: string;
  english: string;
  nickname: string;
  clearAll: string;
  delete: string;
  logout: string;
  logOut: string;
  changePassword: string;
  change: string;
  searchPlaceholder: string;
  newChatTitle: string;
  yourChats: string;
  emptyChat: string;
  emptySearch: string;
  chatPlaceholder: string;
  inputPlaceholder: string;
  send: string;
  renameTitle: string;
  cancel: string;
  save: string;
  passwordsDoNotMatch: string;

  oldPassword: string;
  newPassword: string;
  confirmPassword: string;

  oldPasswordPlaceholder: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
};

export const translations: Record<Lang, Translation> = {
  id: {
    settings: "Settings",
    language: "Bahasa",
    indonesian: "Indonesia",
    english: "English",
    nickname: "Panggilan",
    clearAll: "Hapus Semua Chat",
    delete: "Hapus",
    logout: "Keluar",
    logOut: "Log Out",
    changePassword: "Ganti Kata Sandi",
    change: "Ganti",
    searchPlaceholder: "Cari percakapan...",
    newChatTitle: "Percakapan Baru",
    yourChats: "Percakapan Anda",
    emptyChat: "Belum ada percakapan.",
    emptySearch: "Tidak ada hasil.",
    chatPlaceholder: "Tulis pertanyaan untuk memulai percakapan.",
    inputPlaceholder: "Tulis pertanyaan Anda",
    send: "Kirim",
    renameTitle: "Rename Percakapan",
    cancel: "Batal",
    save: "Simpan",
    passwordsDoNotMatch: "Kata sandi baru dan konfirmasi tidak cocok",
    oldPassword: "Kata Sandi Lama",
    newPassword: "Kata Sandi Baru",
    confirmPassword: "Konfirmasi Kata Sandi",
    oldPasswordPlaceholder: "Masukkan kata sandi lama",
    newPasswordPlaceholder: "Masukkan kata sandi baru",
    confirmPasswordPlaceholder: "Konfirmasi kata sandi baru",
  },
  en: {
    settings: "Settings",
    language: "Language",
    indonesian: "Indonesian",
    english: "English",
    nickname: "Nickname",
    clearAll: "Clear All Chats",
    delete: "Delete",
    logout: "Logout",
    logOut: "Log Out",
    changePassword: "Change Password",
    change: "Change",
    searchPlaceholder: "Search chats...",
    newChatTitle: "New Chat",
    yourChats: "Your Chats",
    emptyChat: "No chats yet.",
    emptySearch: "No results.",
    chatPlaceholder: "Type a question to start a conversation.",
    inputPlaceholder: "Type your question",
    send: "Send",
    renameTitle: "Rename Chat",
    cancel: "Cancel",
    save: "Save",
    passwordsDoNotMatch: "New password and confirmation do not match",
    oldPassword: "Old Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    oldPasswordPlaceholder: "Enter old password",
    newPasswordPlaceholder: "Enter new password",
    confirmPasswordPlaceholder: "Confirm new password",
  },
};
