import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const ComponentStyles = StyleSheet.create({
  /* ===== CHAT INPUT ===== */
  chatInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },

  chatInputAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ===== LOGIN BUTTON ===== */
  loginButtonWrapper: {
    position: "absolute",
    top: 40,
    right: 16,
    zIndex: 10,
  },

  loginButton: {
    borderWidth: 1,
    borderColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },

  /* ===== LOGIN CARD ===== */
  loginCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    elevation: 6,
  },

  loginInput: {
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 6,
    height: 44,
    marginBottom: 16,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
  },

  loginSubmitButton: {
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 25,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ===== CHAT BUBBLE ===== */
  chatBubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },

  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: Colors.white,
  },

  /* ===== CHAT AI ===== */
  chatBubbleAIWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  chatAIAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    marginRight: 10,
  },

  chatBubbleAI: {
    maxWidth: "90%",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  /* ===== SIDEBAR ===== */
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 999,
    elevation: 30,
  },

  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  sidebarContainer: {
    width: '78%',
    backgroundColor: '#F2F2F2',
  },

  sidebarHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  sidebarNewChat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },

  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  sidebarItemActive: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 8,
  },

  sidebarFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },

  sidebarFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },

  sidebarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,

    borderWidth: 1.5,
    borderColor: Colors.black,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  /* ===== MODAL ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalButtonGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 24,
  },

  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  modalButtonPrimary: {
    backgroundColor: Colors.buttonPrimary,
    borderColor: Colors.buttonPrimary,
  },

  modalButtonSecondary: {
    backgroundColor: Colors.white,
    borderColor: Colors.borderInput,
  },

  /* ===== PROGRESS BAR ===== */
  modalProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F4F8',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 8,
  },

  modalProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 4,
  },
});

export const ComponentTextStyles = StyleSheet.create({
  /* ===== CHAT INPUT TEXT ===== */
  chatInputText: {
    flex: 1,
    color: Colors.black,
    paddingVertical: 6,
  },

  /* ===== LOGIN / REGISTER ===== */
  loginLabel: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 13,
    marginBottom: 6,
    paddingVertical: 6,
  },

  registerText: {
    fontFamily: "Montserrat-Italic",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
    paddingVertical: 6,
  },

  registerHighlight: {
    fontFamily: "Montserrat-SemiBold",
    color: Colors.accentPrimary,
  },

  registerErrorText: {
    color: "red",
    fontFamily: "Montserrat-Regular",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 0,
  },
  loginSubmitText: {
    color: Colors.white,
    fontFamily: "Montserrat-SemiBold",
    paddingVertical: 6,
  },

  /* ===== OTP ===== */
  otpResendText: {
    marginTop: 16,
  },

  /* ===== CHAT TEXT ===== */
  chatBubbleText: {
    fontFamily: "Montserrat-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
  },

  chatBubbleTextUser: {
    fontFamily: "Montserrat-Medium",
    color: Colors.black,
  },

  sidebarAvatarText: {
    fontFamily: "Montserrat-Medium",
    color: Colors.black,
  },

  sidebarNewChatText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: Colors.black,
  },

  sidebarSectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#555',
    paddingHorizontal: 16,
    marginVertical: 12,
  },

  sidebarItemText: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: Colors.black,
  },

  sidebarItemRenameText: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: Colors.black,
    backgroundColor: '#EEE',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },

  sidebarFooterText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    color: Colors.black,
  },

  /* ===== MODAL TEXT ===== */
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },

  modalDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  modalButtonTextPrimary: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 15,
    color: Colors.white,
  },

  modalButtonTextSecondary: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 15,
    color: Colors.black,
  },
});
