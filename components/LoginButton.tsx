import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ComponentStyles, Typography, Colors } from '../styles';
import { useLanguage } from '../context/LanguageContext';

export default function LoginButton() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={ComponentStyles.loginButtonWrapper}>
      <TouchableOpacity
        style={ComponentStyles.loginButton}
        onPress={() => router.push('/login')}
      >
        <Text style={[Typography.button, { color: Colors.white }]}>
          {t.landing.loginButton}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
