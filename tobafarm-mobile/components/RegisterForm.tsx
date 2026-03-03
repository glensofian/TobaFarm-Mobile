import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ComponentStyles, ComponentTextStyles } from '../styles';
import { RegisterUser } from '@/types/user';
import axios from 'axios';
import { OTPCreate } from '@/types/otp';

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);


  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);

    const un = username.trim();
    const em = email.trim();
    const pw = password.trim();
    const cf = confirm.trim();

    if (!un || !em || !pw || !cf) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (un.length < 6) {
      setError("Username minimal 6 karakter.");
      return;
    }

    if (un.includes(" ")) {
      setError("Username tidak boleh mengandung spasi.");
      return;
    }

    if (!em.includes("@")) {
      setError("Email tidak valid.");
      return;
    }

    if (pw.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (pw !== cf) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    const payload: RegisterUser = {
      username: un,
      email: em,
      password: pw,
      role: "user"
    }

    try {
      setLoading(true);


      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/auth/register`,
        payload
      );

      if (response.status !== 200) {
        setError("Registrasi gagal. Silakan coba lagi.");
        return;
      }

      await new Promise((r) => setTimeout(r, 600));

      router.push({
        pathname: "/otp",
        params: { email: em, user_id: response.data.user_id } as OTPCreate
      });
    } catch {
      setError("Registrasi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ComponentStyles.loginCard}>
      {/* USERNAME */}
      {error && (
        <Text style={ComponentTextStyles.registerErrorText}>
          {error}
        </Text>
      )}
      <Text style={ComponentTextStyles.loginLabel}>Username :</Text>
      <TextInput style={ComponentStyles.loginInput} value={username} onChangeText={setUsername} />

      {/* EMAIL */} 
      <Text style={ComponentTextStyles.loginLabel}>
        Email:
      </Text>
      <TextInput style={ComponentStyles.loginInput} value={email} onChangeText={setEmail} />

      {/* PASSWORD */}
      <Text style={ComponentTextStyles.loginLabel}>Password :</Text>
      <View style={ComponentStyles.passwordWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          style={ComponentStyles.passwordInput}
          value={password}
          onChangeText={setPassword}
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
          value={confirm}
          onChangeText={setConfirm}
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
      onPress={onSubmit}
      disabled={loading}
      >
        <Text 
          style={ComponentTextStyles.loginSubmitText}>
          {loading ? 'Loading...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
