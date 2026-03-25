import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../styles';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function ChatBubbleAI({ text }: { text: string }) {
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

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 16,
      }}
    >
      {/* Avatar */}
      <Image
        source={require('../assets/images/tobafarm-logo.png')}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          marginRight: 10,
        }}
      />

      {/* Text */}
      <TouchableOpacity 
        activeOpacity={0.9} 
        onLongPress={handleLongPress}
        style={{ flex: 1 }}
      >
        <Text
          selectable={true}
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          {text}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
