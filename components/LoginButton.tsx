import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ComponentStyles, Typography, Colors } from '../styles';

export default function LoginButton() {
  const router = useRouter();

  return (
    <View style={ComponentStyles.loginButtonWrapper}>
      <TouchableOpacity
        style={ComponentStyles.loginButton}
        onPress={() => router.push('/login')}
      >
        <Text style={[Typography.button, { color: Colors.white }]}>
          Log In
        </Text>
      </TouchableOpacity>
    </View>
  );
}
