import { 
  View, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OtpForm from '../components/OtpForm';
import { Layout } from '../styles';

export default function OtpScreen() {
  return (
    <SafeAreaView style={Layout.loginScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            
            <View style={Layout.loginContainer}>
              {/* LOGO */}
              <View style={Layout.loginLogoWrapper}>
                <Image
                  source={require('../assets/images/tobafarm-logo.png')}
                  style={Layout.loginLogo}
                  resizeMode="contain"
                />
              </View>

              {/* OTP FORM */}
              <View style={Layout.loginFormWrapper}>
                <OtpForm />
              </View>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
