import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ComponentStyles,
  ComponentTextStyles,
  Colors,
} from '../styles';
import { useNetwork } from '@/context/NetworkContext';

type Props = {
  onSend?: (text: string) => void;
  model?: string;
};

export default function ChatInput({ onSend, model }: Props) {
  const [value, setValue] = useState('');
  const { isInternetReachable, isConnected } = useNetwork();

  const handleSend = () => {
    if (!value.trim()) return;
    if (model !== 'tofa-offline' && (!isInternetReachable || !isConnected)) {
      Alert.alert('No Internet', 'Please check your internet connection');
      return;
    }
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
