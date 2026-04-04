import { View, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import {
  ComponentStyles,
  ComponentTextStyles,
  Colors,
} from '../styles';
import { useNetwork } from '@/context/NetworkContext';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  onSend?: (text: string) => void;
  model?: string;
  placeholder?: string;
  isLoading?: boolean;
};

export default function ChatInput({ onSend, model, placeholder, isLoading }: Props) {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const { isInternetReachable, isConnected } = useNetwork();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isLoading) {
      inputRef.current?.blur();
      Keyboard.dismiss();
    }
  }, [isLoading]);

  const handleSend = () => {
    if (isLoading || !value.trim()) return;
    if (model !== 'tofa-offline' && (!isInternetReachable || !isConnected)) {
      Alert.alert(t.roomChat.noInternet, t.roomChat.checkConnection);
      return;
    }
    onSend?.(value);
    setValue('');
  };

  return (
    <View style={[
      ComponentStyles.chatInputWrapper,
      isLoading && { opacity: 0.75 }
    ]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={setValue}
        placeholder={isLoading ? t.roomChat.answering : (placeholder || t.roomChat.placeholder)}
        placeholderTextColor={Colors.placeholder}
        editable={!isLoading}
        style={[
          ComponentTextStyles.chatInputText,
        ]}
        returnKeyType="send"
        onSubmitEditing={handleSend}
      />

      <TouchableOpacity
        style={ComponentStyles.chatInputAction}
        onPress={handleSend}
        disabled={isLoading}
      >
        <Ionicons
          name="send"
          size={18}
          color={isLoading ? Colors.placeholder : Colors.black}
        />
      </TouchableOpacity>
    </View>
  );
}
