import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

export default function Layout() {
  // Load font aplikasi
  const [loaded] = useFonts({
    'Montserrat-SemiBold': require('../assets/fonts/static/Montserrat-SemiBold.ttf'),
    'Montserrat-Italic': require('../assets/fonts/static/Montserrat-Italic.ttf'),
    'Montserrat-Medium': require('../assets/fonts/static/Montserrat-Medium.ttf'),
    'Montserrat-Regular': require('../assets/fonts/static/Montserrat-Regular.ttf'),
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
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
