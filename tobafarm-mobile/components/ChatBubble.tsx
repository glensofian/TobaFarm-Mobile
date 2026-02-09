import { View, Text, Image } from 'react-native';
import { ComponentStyles, ComponentTextStyles } from '../styles';

export default function ChatBubble({ type, text }: any) {
  const isUser = type === 'user';

  // ===== USER MESSAGE =====
  if (isUser) {
    return (
      <View
        style={[
          ComponentStyles.chatBubble,
          ComponentStyles.chatBubbleUser,
        ]}
      >
        <Text
          style={[
            ComponentTextStyles.chatBubbleText,
            ComponentTextStyles.chatBubbleTextUser,
          ]}
        >
          {text}
        </Text>
      </View>
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
      <View style={ComponentStyles.chatBubbleAI}>
        <Text style={ComponentTextStyles.chatBubbleText}>
          {text}
        </Text>
      </View>
    </View>
  );
}
