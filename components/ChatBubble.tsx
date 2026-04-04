import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { ComponentStyles, ComponentTextStyles } from '../styles';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import MarkdownText from './MarkdownText';
import { Colors } from '../styles';

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

  // ===== AI MESSAGE — rendered with Markdown =====
  return (
    <View style={ComponentStyles.chatBubbleAIWrapper}>
      {/* AI ICON */}
      <Image
        source={require('../assets/images/tobafarm-logo.png')}
        style={[ComponentStyles.chatAIAvatar, { marginTop: 2 }]}
      />

      {/* AI TEXT — Markdown rendered */}
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        style={[
          ComponentStyles.chatBubbleAI,
          { 
            marginLeft: -4,
            borderTopLeftRadius: 2,
            padding: 12 
          }
        ]}
      >
        <MarkdownText
          text={text}
          fontSize={13}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}
