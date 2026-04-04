import { Ionicons } from "@expo/vector-icons";
import { login } from "../api/authApi";
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

      const responseData = await login({ username: em, password: pw });

      await save("token", responseData.access_token);
      await save("user", JSON.stringify(responseData.user));

      console.log("Routing to roomchat");
      await new Promise((r) => setTimeout(r, 500));

      router.replace("/roomchat");
    } catch (err: any) {
      setError(err.message || "Login gagal. Silakan coba lagi.");
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
