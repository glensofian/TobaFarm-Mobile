import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { ComponentStyles, ComponentTextStyles } from "../styles";
import { save } from "../utils/storage";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState(""); // Email / No Telp
  const [password, setPassword] = useState("");

  const router = useRouter();

  const onSubmit = async () => {
    setError(null);

    const em = identifier.trim();
    const pw = password.trim();

    if (!em || !pw) {
      setError("Email/No. Telp dan Password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const payload = new URLSearchParams({
        username: em,
        password: pw,
      });
      console.log("Answer:");
      console.log(process.env.EXPO_PUBLIC_TOFA_API_URL);
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_TOFA_API_URL}/auth/token`,
        payload,
      );

      console.log("Response Status:");
      console.log(response.status);

      if (response.status !== 200) {
        setError("Login gagal. Silakan coba lagi.");
        return;
      }

      console.log("Response data:");
      console.log(response.data);

      await save("token", response.data.access_token);
      await save("user", JSON.stringify(response.data.user));

      console.log("Routing to roomcaht");
      // Simulasi sukses sementara:
      await new Promise((r) => setTimeout(r, 500));

      router.push("/roomchat");
    } catch {
      setError("Login gagal. Silakan cek kembali data Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ComponentStyles.loginCard}>
      <Text style={ComponentTextStyles.loginLabel}>Email / No. Telp :</Text>

      {error && (
        <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
          {error}
        </Text>
      )}

      <TextInput
        style={ComponentStyles.loginInput}
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Username / Email"
        autoCapitalize="none"
      />

      <Text style={ComponentTextStyles.loginLabel}>Password :</Text>

      <View style={ComponentStyles.passwordWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          style={ComponentStyles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      <Text style={ComponentTextStyles.registerText}>
        Belum memiliki akun?{" "}
        <Text
          style={ComponentTextStyles.registerHighlight}
          onPress={() => router.push("/register")}
        >
          Daftar
        </Text>
        , sekarang juga!
      </Text>

      <TouchableOpacity
        style={[ComponentStyles.loginSubmitButton, loading && { opacity: 0.7 }]}
        onPress={() => onSubmit()}
        disabled={loading}
      >
        <Text style={ComponentTextStyles.loginSubmitText}>
          {loading ? "Logging in..." : "Log in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
