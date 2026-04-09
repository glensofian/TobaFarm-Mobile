export type Language = "id" | "en";

export interface LandingPageTranslation {
  loginButton: string;
  registerButton: string;
  greeting: string;
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  greetingNight: string;
  helpText: string;
  chatBubble: string;
  welcomeBack: string;
  guestButton: string;
}

export interface RoomChatTranslation {
  headerTitle: string;
  placeholder: string;
  sendButton: string;
  newChat: string;
  deleteHistory: string;
  logout: string;
  offline: string;
  settings: string;
  activeModel: string;
  downloadModel: string;
  syncing: string;
  answering: string;
  offlineMode: string;
  onlineMode: string;
  searchPlaceholder: string;
  yourChats: string;
  rename: string;
  delete: string;
  guestMode: string;
  login: string;
  noInternet: string;
  checkConnection: string;
  modelAnsweringTitle: string;
  modelAnsweringMessage: string;
}

export interface SettingsTranslation {
  title: string;
  profileSection: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  appSection: string;
  languageLabel: string;
  indonesian: string;
  english: string;
  clearHistoryLabel: string;
  clearHistoryConfirm: string;
  logoutLabel: string;
  changePasswordLabel: string;
  updateSuccess: string;
  updateError: string;
  cancel: string;
  delete: string;
  changeButton: string;
}

export interface ChangePasswordTranslation {
  title: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  cancel: string;
  save: string;
  errOldIncorrect: string;
  errMinLength: string;
  errUppercase: string;
  errLowercase: string;
  errNumber: string;
  errSamePassword: string;
  errFormIncomplete: string;
  errDefault: string;
  success: string;
}

export interface TranslationData {
  landing: LandingPageTranslation;
  roomChat: RoomChatTranslation;
  settings: SettingsTranslation;
  changePassword: ChangePasswordTranslation;
}
