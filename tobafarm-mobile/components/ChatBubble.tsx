import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { ComponentStyles, ComponentTextStyles } from '../styles';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function ChatBubble({ type, text }: any) {
  const isUser = type === 'user';

  const handleLongPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Message Options",
      "What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Copy Message", 
          onPress: async () => {
            await Clipboard.setStringAsync(text);
          }
        }
      ]
    );
  };

  // ===== USER MESSAGE =====
  if (isUser) {
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onLongPress={handleLongPress}
        style={[
          ComponentStyles.chatBubble,
          ComponentStyles.chatBubbleUser,
        ]}
      >
        <Text
          selectable={true}
          style={[
            ComponentTextStyles.chatBubbleText,
            ComponentTextStyles.chatBubbleTextUser,
          ]}
        >
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  // ===== AI MESSAGE =====
  return (
    <View style={ComponentStyles.chatBubbleAIWrapper}>
      {/* AI ICON */}
      <Image
        source={require('../assets/images/tobafarm-logo.png')}
        style={ComponentStyles.chatAIAvatar}
      />

      {/* AI TEXT */}
      <TouchableOpacity 
        activeOpacity={0.9} 
        onLongPress={handleLongPress}
        style={ComponentStyles.chatBubbleAI}
      >
        <Text 
          selectable={true}
          style={ComponentTextStyles.chatBubbleText}
        >
          {text}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
