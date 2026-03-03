import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ComponentStyles, ComponentTextStyles } from '../styles';
import { OTPCreate, OTPInput } from '@/types/otp';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function OtpForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string; user_id: string }>();
  const email = params.email || "";
  const user_id = params.user_id || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      onLoad();
      hasFetched.current = true;
    }
  }, []);

  const onLoad = async () => {
    setError(null);
    setInfo(null);

    const lang = "id"; // Default or get from global state

    const payload: OTPCreate = {
      email,
      user_id: user_id || null,
      lang,
    };

    console.log(payload);

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/otp`,
        payload,
      );

      if (response.status !== 200) {
        setError("Gagal mengirim OTP. Silakan coba lagi.");
        return;
      }

      setInfo("Kode OTP berhasil dikirim.");
    } catch (error) {
      setError("Gagal mengirim OTP. Coba lagi.");
    }
  }

  const onSubmit = async () => {
    setError(null);
    setInfo(null);

    const code = otp.replace(/\s/g, "");

    if (!code) {
      setError("Kode OTP wajib diisi.");
      return;
    }
    if (code.length < 6) {
      setError("Kode OTP minimal 6 digit.");
      return;
    }

    try {

      const payload: OTPInput = {
        email: email,
        otp: code,
      }

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/otp/verify`,
        payload
      );

      if (response.status !== 200) {
        setError("Gagal verifikasi OTP. Silakan coba lagi.");
        return;
      }

      setInfo("Kode OTP berhasil diverifikasi.");

      const verifyRegistrationResponse = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/auth/verify`,
        payload
      );

      if (verifyRegistrationResponse.status !== 200) {
        setError("Gagal verifikasi OTP. Silakan coba lagi.");
        return;
      }

      setInfo("Kode OTP berhasil diverifikasi.");

      setLoading(true);

      await new Promise((r) => setTimeout(r, 600));

      // Setelah OTP berhasil, arahkan ke login (atau langsung chat jika flow Anda begitu)
      router.push("/login");
    } catch {
      setError("Kode OTP tidak valid atau sudah kadaluarsa.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);

    try {
      setResendLoading(true);

      // TODO: panggil API resend OTP
      // await authApi.resendOtp({ identifier });

      await new Promise((r) => setTimeout(r, 600));
      setInfo("Kode OTP baru sudah dikirim.");
    } catch {
      setError("Gagal mengirim ulang OTP. Coba lagi.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={ComponentStyles.loginCard}>
      {/* OTP */}
      <Text style={ComponentTextStyles.loginLabel}>
        Verification / Kode OTP :
      </Text>

      <TextInput
        keyboardType="number-pad"
        maxLength={6}
        style={ComponentStyles.loginInput}
        value={otp}
        onChangeText={setOtp}
        placeholder="123456"
      />

      {error && (
        <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
          {error}
        </Text>
      )}
      {info && (
        <Text style={{ color: 'green', marginBottom: 10, textAlign: 'center' }}>
          {info}
        </Text>
      )}

      {/* CONTINUE */}
      <TouchableOpacity
        style={[ComponentStyles.loginSubmitButton, loading && { opacity: 0.7 }]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Text style={ComponentTextStyles.loginSubmitText}>
          {loading ? 'Verifying...' : 'Continue'}
        </Text>
      </TouchableOpacity>

      {/* RESEND */}
      <Text
        style={[
          ComponentTextStyles.registerText,
          ComponentTextStyles.otpResendText,
        ]}
      >
        Belum mendapatkan Kode?{' '}
        <Text
          style={ComponentTextStyles.registerHighlight}
          onPress={onResend}
        >
          Kirim Ulang
        </Text>
      </Text>
    </View>
  );
}
