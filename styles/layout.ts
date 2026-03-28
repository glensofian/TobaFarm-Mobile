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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: verticalScale(40),
    paddingHorizontal: scale(20),
  },

  loginLogoWrapper: {
    marginTop: verticalScale(48),
    marginBottom: verticalScale(10),
    alignItems: 'center',
  },

  loginLogo: {
    width: scale(180),
    height: scale(180),
    maxWidth: 200,
    maxHeight: 200,
  },

  loginFormWrapper: {
    width: '100%',
    paddingHorizontal: scale(16),
    transform: [{ translateY: verticalScale(-20) }],
  },

  /* ===== ChatScreen ===== */
  chatScreen: {
  flex: 1,
  justifyContent: 'flex-start',
},

chatInputContainer: {
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: Colors.backgroundPrimary,
},
});
