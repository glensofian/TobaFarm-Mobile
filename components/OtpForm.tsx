import { OTPCreate, OTPInput } from "@/types/otp";
import { sendOtp, verifyOtpCode, verifyRegistration } from "../api/authApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { ComponentStyles, ComponentTextStyles } from "../styles";

export default function OtpForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string; user_id: string }>();
  const email = params.email || "";
  const user_id = params.user_id || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]); 
  
  const [loading, setLoading] = useState(false);
  
  const [isInitializing, setIsInitializing] = useState(true); 
  
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
    setIsInitializing(true);

    try {
      await sendOtp({
        email,
        user_id: user_id || null,
        lang: "id",
      });
      setInfo(`OTP Berhasil Dikirim ke ${email}`);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim OTP.");
    } finally {
      setIsInitializing(false);
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
      await verifyOtpCode({ email, otp: code });
      await verifyRegistration({ email, otp: code });

      setInfo("Kode OTP berhasil diverifikasi.");
      
      await new Promise((r) => setTimeout(r, 600));
      router.replace("/login");
      
    } catch (err: any) {
      setError(err.message || "Kode OTP tidak valid atau sudah kadaluarsa.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      setResendLoading(true);
      setOtp(["", "", "", "", "", ""]);
      await onLoad();
    } finally {
      setResendLoading(false);
    }
  };

  const isFormDisabled = loading || isInitializing || resendLoading;

  return (
    <View style={ComponentStyles.loginCard}>
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
              isFormDisabled ? { opacity: 0.5 } : null
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            editable={!isFormDisabled}
          />
        ))}
      </View>

      {/* --- Status Message --- */}
      {error && (
        <Text style={[ComponentTextStyles.registerErrorText, { marginBottom: 15 }]}>
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
        style={[ComponentStyles.loginSubmitButton, isFormDisabled && { opacity: 0.7 }]}
        onPress={onSubmit}
        disabled={isFormDisabled}
      >
        {isFormDisabled ? (
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
        disabled={isFormDisabled}
        style={{ marginTop: 20, opacity: isFormDisabled ? 0.5 : 1 }}
      >
        <Text style={ComponentTextStyles.registerText}>
          Belum mendapatkan kode?{" "}
          <Text style={ComponentTextStyles.registerHighlight}>Kirim Ulang</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
