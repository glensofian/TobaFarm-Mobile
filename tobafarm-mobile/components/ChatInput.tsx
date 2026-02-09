import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ComponentStyles,
  ComponentTextStyles,
  Colors,
} from '../styles';

type Props = {
  onSend?: (text: string) => void;
};

export default function ChatInput({ onSend }: Props) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim()) return;
    onSend?.(value);
    setValue('');
  };

  return (
    <View style={ComponentStyles.chatInputWrapper}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Tanyakan sesuatu..."
        placeholderTextColor={Colors.placeholder}
        style={[
          ComponentTextStyles.chatInputText,
        ]}
      />

      <TouchableOpacity
        style={ComponentStyles.chatInputAction}
        onPress={handleSend}
      >
        <Ionicons name="send" size={18} color={Colors.black} />
      </TouchableOpacity>
    </View>
  );
}
