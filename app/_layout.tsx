import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { NetworkProvider } from '../context/NetworkContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function Layout() {
  // Load font aplikasi
  const [loaded] = useFonts({
    'Montserrat-SemiBold': require('../assets/fonts/static/Montserrat-SemiBold.ttf'),
    'Montserrat-SemiBoldItalic': require('../assets/fonts/static/Montserrat-SemiBoldItalic.ttf'),
    'Montserrat-Italic': require('../assets/fonts/static/Montserrat-Italic.ttf'),
    'Montserrat-Medium': require('../assets/fonts/static/Montserrat-Medium.ttf'),
    'Montserrat-Regular': require('../assets/fonts/static/Montserrat-Regular.ttf'),
    'Montserrat-Bold': require('../assets/fonts/static/Montserrat-Bold.ttf'),
    'Montserrat-BoldItalic': require('../assets/fonts/static/Montserrat-BoldItalic.ttf'),
  });

  // Tampilkan loading global saat font belum siap
  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Root navigation untuk seluruh halaman aplikasi
  return (
    <LanguageProvider>
      <NetworkProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </NetworkProvider>
    </LanguageProvider>
  );
}
