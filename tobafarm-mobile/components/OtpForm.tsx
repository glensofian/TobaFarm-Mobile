import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ComponentStyles, ComponentTextStyles } from '../styles';

export default function OtpForm() {
  const router = useRouter();

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
      />

      {/* CONTINUE */}
      <TouchableOpacity 
        style={ComponentStyles.loginSubmitButton}
        onPress={() => router.replace('/')}
      >
        <Text style={ComponentTextStyles.loginSubmitText}>
          Continue
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
          onPress={() => {
            // TODO: resend OTP
          }}
        >
          Kirim Ulang
        </Text>
      </Text>
    </View>
  );
}
