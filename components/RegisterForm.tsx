import { OTPCreate } from "@/types/otp";
import { RegisterUser } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { register } from "../api/authApi";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { ComponentStyles, ComponentTextStyles, Colors } from "../styles";

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
    Keyboard.dismiss();

    const un = username.trim();
    const em = email.trim();
    const pw = password.trim();
    const cf = confirm.trim();

    if (!un || !em || !pw || !cf) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (un.length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }

    if (un.includes(" ")) {
      setError("Username tidak boleh mengandung spasi.");
      return;
    }

    if (!em.includes("@")) {
      setError("Format email tidak valid.");
      return;
    }
    
 if (pw.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (!/[A-Z]/.test(pw)) {
      setError("Password harus ada minimal satu huruf besar.");
      return;
    }
    if (!/[0-9]/.test(pw)) {
      setError("Password harus ada minimal satu angka.");
      return;
    }

    if (pw !== cf) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    try {
      setLoading(true);

      const responseData = await register({
        username: un,
        email: em,
        password: pw,
        role: "user",
      });

      const otpParams: OTPCreate = {
        email: em,
        user_id: responseData.id,
        lang: "id",
      };

      await new Promise((r) => setTimeout(r, 600));

      router.replace({
        pathname: "/otp",
        params: otpParams as any,
      });
    } catch (err: any) {
      setError(err.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      keyboardShouldPersistTaps="handled"
    >
      <View style={ComponentStyles.loginCard}>
        
        {/* --- Error Display --- */}
        {error && (
          <Text style={[ComponentTextStyles.registerErrorText, { marginBottom: 15 }]}>
            {error}
          </Text>
        )}

        {/* --- Username --- */}
        <Text style={ComponentTextStyles.loginLabel}>Username :</Text>
        <TextInput
          style={ComponentStyles.loginInput}
          value={username}
          onChangeText={setUsername}
          placeholder="Min. 3 karakter, tanpa spasi"
          autoCapitalize="none"
          editable={!loading}
        />

        {/* --- Email --- */}
        <Text style={ComponentTextStyles.loginLabel}>Email :</Text>
        <TextInput
          style={ComponentStyles.loginInput}
          value={email}
          onChangeText={setEmail}
          placeholder="contoh@tobafarm.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        {/* --- Password --- */}
        <Text style={ComponentTextStyles.loginLabel}>Password :</Text>
        <View style={ComponentStyles.passwordWrapper}>
          <TextInput
            secureTextEntry={!showPassword}
            style={ComponentStyles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 karakter (A-z, 0-9)"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        {/* --- Confirm Password --- */}
        <Text style={ComponentTextStyles.loginLabel}>Konfirmasi Password :</Text>
        <View style={ComponentStyles.passwordWrapper}>
          <TextInput
            secureTextEntry={!showPassword}
            style={ComponentStyles.passwordInput}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Ulangi password"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>

            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        {/* --- Footer Link --- */}
        <Text style={ComponentTextStyles.registerText}>
          Sudah memiliki akun?{" "}
          <Text
            style={ComponentTextStyles.registerHighlight}
            onPress={() => !loading && router.push("/login")}
          >
            Masuk
          </Text>

        </Text>

        {/* --- Submit Button --- */}
        <TouchableOpacity
          style={[ComponentStyles.loginSubmitButton, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={ComponentTextStyles.loginSubmitText}>Daftar Sekarang</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}