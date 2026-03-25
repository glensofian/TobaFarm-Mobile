import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { scale, verticalScale } from './responsive';

export const Layout = StyleSheet.create({
  /* ===== GLOBAL ===== */
  screen: {
    flex: 1,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  horizontalPadding: {
    paddingHorizontal: scale(20),
  },

  /* ===== LOGIN / REGISTER ===== */
  loginScreen: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },

  loginContainer: {
    flex: 1,
    alignItems: 'center',
  },

  loginLogoWrapper: {
    marginTop: verticalScale(48),
    marginBottom: verticalScale(16),
    alignItems: 'center',
  },

  loginLogo: {
    width: scale(240),
    height: scale(240),
    maxWidth: 280,
    maxHeight: 280,
  },

  loginFormWrapper: {
    width: '100%',
    paddingHorizontal: scale(16),
    transform: [{ translateY: verticalScale(-20) }],
  },

  /* ===== ChatScreen ===== */
  chatScreen: {
  flex: 1,
  justifyContent: 'space-between',
},

chatInputContainer: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: Colors.backgroundPrimary,
},
});
