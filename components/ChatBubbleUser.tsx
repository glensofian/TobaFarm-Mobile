import { View, Text } from 'react-native';
import { Colors } from '../styles';

export default function ChatBubbleUser({ text }: { text: string }) {
  return (
    <View
      style={{
        alignSelf: 'center',
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginVertical: 12,
      }}
    >
      <Text style={{ color: Colors.black, fontSize: 12 }}>
        {text}
      </Text>
    </View>
  );
}
