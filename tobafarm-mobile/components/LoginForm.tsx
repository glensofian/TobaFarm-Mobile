import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ComponentStyles, ComponentTextStyles } from '../styles';
import { useRouter } from 'expo-router';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  return (
    <View style={ComponentStyles.loginCard}>
      <Text style={ComponentTextStyles.loginLabel}>
        Email / No. Telp :
      </Text>

      <TextInput style={ComponentStyles.loginInput} />

      <Text style={ComponentTextStyles.loginLabel}>
        Password :
      </Text>

      <View style={ComponentStyles.passwordWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          style={ComponentStyles.passwordInput}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <Text 
        style={ComponentTextStyles.registerText}>
        Belum memiliki akun?{' '}
        <Text 
        style={ComponentTextStyles.registerHighlight}
        onPress={() => router.push('/register')}
        >
          Daftar
        </Text>
        , sekarang juga!
      </Text>

      <TouchableOpacity style={ComponentStyles.loginSubmitButton}>
        <Text style={ComponentTextStyles.loginSubmitText}>
          Log in
        </Text>
      </TouchableOpacity>
    </View>
  );
}
