import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RegisterForm from "../components/RegisterForm";
import { Layout } from "../styles";

export default function RegisterScreen() {
  return (
    <SafeAreaView style={Layout.loginScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={Layout.loginContainer}>
              <View style={Layout.loginLogoWrapper}>
                <Image
                  source={require("../assets/images/tobafarm-logo.png")}
                  style={Layout.loginLogo}
                  resizeMode="contain"
                />
              </View>

              <View style={Layout.loginFormWrapper}>
                <RegisterForm />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
