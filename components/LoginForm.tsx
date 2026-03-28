import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { ComponentStyles, ComponentTextStyles, Colors } from "../styles";
import { save } from "../utils/storage";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  useEffect(() => {
    // setIdentifier("williamnapitupulu67@gmail.com");
    // setPassword("Napit@123");
  }, []);

  const onSubmit = async () => {
    setError(null);
    Keyboard.dismiss();

    const em = identifier.trim();
    const pw = password.trim();

    if (!em || !pw) {
      setError("Email dan Password wajib diisi.");
      return;
    }

    if (!em.includes("@")) {
      setError("Format email tidak valid.");      
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
        payload.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      console.log("Response Status:");
      console.log(response.status);

      if (response.status !== 200) {
        setError("Login gagal. Silakan coba lagi.");
        return;
      }

      console.log("Response data:");
      console.log(response.data);

      if (response.status === 200) {
        await save("token", response.data.access_token);
        await save("user", JSON.stringify(response.data.user));

        console.log("Routing to roomchat");
        await new Promise((r) => setTimeout(r, 500));

        router.replace("/roomchat");
      }
    } catch (err: any) {
      if (err.response) {
        const detail = err.response.data?.detail;
        const status = err.response.status;

        // Sinkronisasi Error
        if (status === 404 && detail === "Email not registered") {
          setError("Email tidak terdaftar.");
        } else if (status === 401 && detail === "Incorrect password") {
          setError("Kata sandi salah.");
        } else if (status === 403 && detail === "Account not verified") {
          setError("Akun belum diverifikasi. Silakan cek email/OTP.");
        } else {
          setError(detail || "Login gagal. Silakan coba lagi.");
        }
      } else {
        setError("Tidak dapat terhubung ke server. Pastikan koneksi aktif.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ComponentStyles.loginCard}>

      {error && (
        <Text
          style={{
            color: "red",
            marginBottom: 15,
            textAlign: "center",
            fontFamily: "Montserrat-SemiBold",
            fontSize: 13,
          }}
        >
          {error}
        </Text>
      )}

      {/* --- Email Input --- */}
      <Text style={ComponentTextStyles.loginLabel}>Email :</Text>
      <TextInput
        style={ComponentStyles.loginInput}
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Alamat Email"
        autoCapitalize="none"
        editable={!loading}
        keyboardType="email-address"
      />

      {/* --- Password Input --- */}

      <Text style={ComponentTextStyles.loginLabel}>Password :</Text>

      <View style={ComponentStyles.passwordWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          style={ComponentStyles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* --- Navigation Link --- */}
      <Text style={ComponentTextStyles.registerText}>
        Belum memiliki akun?{" "}
        <Text
          style={ComponentTextStyles.registerHighlight}
          onPress={() => !loading && router.push("/register")}        >
          Daftar
        </Text>
        , sekarang juga!
      </Text>

      {/* --- Action Button --- */}
      <TouchableOpacity
        style={[ComponentStyles.loginSubmitButton, loading && { opacity: 0.7 }]}
        onPress={() => onSubmit()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={ComponentTextStyles.loginSubmitText}>Masuk</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
