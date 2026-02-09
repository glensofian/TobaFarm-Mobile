import { View, Text, Image } from 'react-native';
import { Colors } from '../styles';

export default function ChatBubbleAI({ text }: { text: string }) {
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
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
