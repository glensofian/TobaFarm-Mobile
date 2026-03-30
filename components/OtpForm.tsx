import { OTPCreate, OTPInput } from "@/types/otp";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { ComponentStyles, ComponentTextStyles, Colors } from "../styles";

export default function OtpForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string; user_id: string }>();
  const email = params.email || "";
  const user_id = params.user_id || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]); 
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const inputs = useRef<TextInput[]>([]);

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

    try {
      const payload: OTPCreate = {
        email,
        user_id: user_id || null,
        lang: "id",
      };

      console.log(payload);

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/otp`,
        payload,
      );

      if (response.status === 200) {
        setInfo(`OTP Berhasil Dikirim ke ${email}`);
      }

      if (response.status !== 200) {
        setError("Gagal mengirim OTP. Silakan coba lagi.");
        return;
      }

    } catch (error) {
      setError("Gagal mengirim OTP. Coba lagi.");
    }
  };

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const onSubmit = async () => {
    setError(null);

    const code = otp.join("");

    if (code.length < 6) {
      setError("Kode OTP minimal 6 digit.");
      return;
    }

    try {
      setLoading(true);
      const payload: OTPInput = { email, otp: code };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/otp/verify`,
        payload,
      );

      if (response.status !== 200) {
        setError("Gagal verifikasi OTP. Silakan coba lagi.");
        return;
      }

      setInfo("Kode OTP berhasil diverifikasi.");

      const verifyRegistrationResponse = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/auth/verify`,
        payload,
      );

      if (verifyRegistrationResponse.status !== 200) {
        setError("Gagal verifikasi OTP. Silakan coba lagi.");
        return;
      }

      setInfo("Kode OTP berhasil diverifikasi.");

      setLoading(true);

      await new Promise((r) => setTimeout(r, 600));

      // Setelah OTP berhasil, arahkan ke login (atau langsung chat jika flow Anda begitu)
      router.replace("/login");
    } catch {
      setError("Kode OTP tidak valid atau sudah kadaluarsa.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      setResendLoading(true);
      await onLoad();
    } finally {
      setResendLoading(false);
    }
  };
 return (
    <View style={ComponentStyles.loginCard}>
      {/* --- Header --- */}
      <Text
        style={[
          ComponentTextStyles.loginLabel,
          { textAlign: "center", marginBottom: 20 },
        ]}
      >
        Masukkan 6 Digit Kode Verifikasi
      </Text>

      {/* --- OTP Inputs --- */}
      <View style={ComponentStyles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              if (el) inputs.current[index] = el;
            }}
            style={[
              ComponentStyles.otpInputBox,
              digit ? ComponentStyles.otpInputBoxActive : null,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            editable={!loading}
          />
        ))}
      </View>

      {/* --- Status Message --- */}
      {error && (
        <Text
          style={[ComponentTextStyles.registerErrorText, { marginBottom: 15 }]}
        >
          {error}
        </Text>
      )}
      {info && (
        <Text
          style={{
            color: "green",
            marginBottom: 15,
            textAlign: "center",
            fontSize: 12,
            fontWeight: "500",
          }}
        >
          {info}
        </Text>
      )}

      {/* --- Action Button --- */}
      <TouchableOpacity
        style={[ComponentStyles.loginSubmitButton, loading && { opacity: 0.7 }]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={ComponentTextStyles.loginSubmitText}>
            Verifikasi Sekarang
          </Text>
        )}
      </TouchableOpacity>

      {/* --- Resend --- */}
      <TouchableOpacity
        onPress={onResend}
        disabled={loading}
        style={{ marginTop: 20 }}

      >
        <Text style={ComponentTextStyles.registerText}>
          Belum mendapatkan kode?{" "}
          <Text style={ComponentTextStyles.registerHighlight}>Kirim Ulang</Text>

        </Text>
      </TouchableOpacity>
    </View>
  );
}