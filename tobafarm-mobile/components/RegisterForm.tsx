import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ComponentStyles, ComponentTextStyles } from '../styles';

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <View style={ComponentStyles.loginCard}>
      {/* USERNAME */}
      <Text style={ComponentTextStyles.loginLabel}>Username :</Text>
      <TextInput style={ComponentStyles.loginInput} />

      {/* EMAIL */}
      <Text style={ComponentTextStyles.loginLabel}>
        Email / No. Telp :
      </Text>
      <TextInput style={ComponentStyles.loginInput} />

      {/* PASSWORD */}
      <Text style={ComponentTextStyles.loginLabel}>Password :</Text>
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

      {/* CONFIRM PASSWORD */}
      <Text style={ComponentTextStyles.loginLabel}>
        Konfirmasi Password :
      </Text>
      <View style={ComponentStyles.passwordWrapper}>
        <TextInput
          secureTextEntry={!showConfirmPassword}
          style={ComponentStyles.passwordInput}
        />
        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
        >
          <Ionicons
            name={
              showConfirmPassword
                ? 'eye-off-outline'
                : 'eye-outline'
            }
            size={20}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* LOGIN LINK */}
      <Text style={ComponentTextStyles.registerText}>
        Sudah memiliki akun?{' '}
        <Text
          style={ComponentTextStyles.registerHighlight}
          onPress={() => router.push('/login')}
        >
          Masuk
        </Text>
        , sekarang juga!
      </Text>

      {/* SUBMIT */}
      <TouchableOpacity 
      style={ComponentStyles.loginSubmitButton}
      onPress={() => router.push('/otp')}
      >
        <Text 
          style={ComponentTextStyles.loginSubmitText}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}
