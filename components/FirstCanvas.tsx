import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import ChatInput from './ChatInput';
import { ComponentStyles, ComponentTextStyles, Typography } from '../styles';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  username?: string;
  onSend: (text: string) => void;
  selectedModel: string;
};

export default function FirstCanvas({ username, onSend, selectedModel }: Props) {
  const { t } = useLanguage();

  const greetingStr = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return t.landing.greetingMorning;
    if (hour >= 11 && hour < 15) return t.landing.greetingAfternoon;
    if (hour >= 15 && hour < 18) return t.landing.greetingEvening;
    return t.landing.greetingNight;
  }, [t.landing]);

  const fadeLogo = useRef(new Animated.Value(0)).current;
  const fadePrompt = useRef(new Animated.Value(0)).current;
  const slidePrompt = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeLogo, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadePrompt, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slidePrompt, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]),
    ]).start();
  }, [fadeLogo, fadePrompt, slidePrompt]);

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
        {/* LOGO */}
        <Animated.View style={[ComponentStyles.homeLogoContainer, { opacity: fadeLogo }]}>
          <Image
            source={require("../assets/images/tobafarm-logo.png")}
            style={ComponentStyles.homeLogo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* PROMPT AREA */}
        <Animated.View style={[
          ComponentStyles.homePromptContainer, 
          { opacity: fadePrompt, transform: [{ translateY: slidePrompt }] }
        ]}>
          <Text style={[Typography.greeting, ComponentTextStyles.homeGreeting]}>
            {t.landing.greeting}{username ? `, ${username}` : ""}. {greetingStr}
          </Text>

          <Text style={[Typography.question, ComponentTextStyles.homeQuestion]}>
            {t.landing.helpText}
          </Text>

          <ChatInput 
            model={selectedModel}
            onSend={onSend} 
          />
        </Animated.View>
      </View>
  );
}
