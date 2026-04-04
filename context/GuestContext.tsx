/**
 * Menyediakan semua state & logic untuk halaman RoomGuest (mode tamu, tidak login).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Keyboard, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useNetwork } from './NetworkContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { MODEL_CONFIG } from '../constants/modelConfig';
import { models } from '../constants/models';
import { nowIso } from '../utils/date';
import { uid } from '../utils/uid';
import type { Message } from '../types';

// --- Types ---

export type GuestNotification = { title: string; message: string } | null;

export type GuestContextValue = {
  /* Model selection */
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  defaultOnlineModel: string;

  /* Offline model availability */
  isOfflineModelDownloaded: boolean;
  checkOfflineModel: () => Promise<void>;

  /* Download modal */
  downloadModelVisible: boolean;
  setDownloadModelVisible: (v: boolean) => void;

  /* Dropdown UI */
  isDropdownOpen: boolean;
  setIsDropdownOpen: (v: boolean) => void;

  /* Network */
  isInternetReachable: boolean | null;

  /* Messages */
  guestMessages: Message[];

  /* Input */
  input: string;
  setInput: (v: string) => void;

  /* Sending state */
  isSending: boolean;
  typingDots: string;

  /* Notification banner */
  notification: GuestNotification;
  setNotification: (n: GuestNotification) => void;

  /* Actions */
  onSend: (e?: React.FormEvent, overrideText?: string) => Promise<void>;

  /* WS status */
  wsStatus: 'idle' | 'connecting' | 'open' | 'closed' | 'error';
};

// --- Context ---

const GuestContext = createContext<GuestContextValue | undefined>(undefined);

// --- Provider ---

export function GuestProvider({ children }: { children: React.ReactNode }) {
  /* --- Model --- */
  const defaultOnlineModel = useMemo(
    () => models.find((m) => m.type === 'online')?.id || models[0].id,
    [],
  );

  const [selectedModel, setSelectedModel] = useState<string>(defaultOnlineModel);
  const [downloadModelVisible, setDownloadModelVisible] = useState(false);
  const [isOfflineModelDownloaded, setIsOfflineModelDownloaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  /* --- Network --- */
  const { isInternetReachable } = useNetwork();
  const { justDisconnected } = useNetworkStatus();

  /* --- Messages --- */
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [guestMessages, setGuestMessages] = useState<Message[]>([]);
  const guestConversationId = useMemo(() => 'guest-session-' + uid('g'), []);

  /* --- Notification --- */
  const [notification, setNotification] = useState<GuestNotification>(null);

  /* --- Typing animation dots --- */
  const [typingDots, setTypingDots] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isSending) {
      interval = setInterval(() => {
        setTypingDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 400);
    } else {
      setTypingDots('');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSending]);

  /* --- Offline model check --- */
  const checkOfflineModel = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(MODEL_CONFIG.getLocalModelPath());
      setIsOfflineModelDownloaded(info.exists);
    } catch (err) {
      console.error('Error checking offline model:', err);
      setIsOfflineModelDownloaded(false);
    }
  }, []);

  useEffect(() => {
    checkOfflineModel();
  }, [checkOfflineModel]);

  /* --- Auto model switch based on connectivity --- */
  useEffect(() => {
    if (isInternetReachable === false && selectedModel !== 'tofa-offline') {
      if (isOfflineModelDownloaded) {
        setSelectedModel('tofa-offline');
        setNotification({
          title: 'Offline Mode',
          message: 'Koneksi terputus. Beralih ke mode offline otomatis.',
        });
      } else {
        setNotification({
          title: 'Mode Offline Tidak Tersedia',
          message:
            'Koneksi terputus. Silakan hubungkan internet untuk mengunduh model terlebih dahulu.',
        });
      }
    } else if (isInternetReachable === true && selectedModel === 'tofa-offline') {
      setSelectedModel(defaultOnlineModel);
      setNotification({
        title: 'Online Mode',
        message: 'Koneksi pulih. AI kembali menggunakan cloud.',
      });
    }
  }, [isInternetReachable, selectedModel, defaultOnlineModel, isOfflineModelDownloaded]);

  useEffect(() => {
    if (justDisconnected && selectedModel === 'tofa-offline' && isOfflineModelDownloaded) {
      setNotification({
        title: 'Offline Mode',
        message: 'Koneksi terputus. Beralih ke mode offline otomatis.',
      });
    }
  }, [justDisconnected]);

  /* --- WebSocket handlers --- */
  const onWsToken = useCallback((cid: string, token: string) => {
    setGuestMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === 'bot') {
        return [
          ...prev.slice(0, -1),
          { ...lastMsg, text: lastMsg.text + token },
        ];
      }
      return [
        ...prev,
        { id: uid('m'), role: 'bot', text: token, createdAt: nowIso() },
      ];
    });
  }, []);

  const onWsDone = useCallback(async (_cid: string, _fullText: string) => {
    setIsSending(false);
  }, []);

  const ws = useWebSocketChat({
    model: selectedModel,
    enabled: true,
    getActiveConversationId: () => guestConversationId,
    onToken: onWsToken,
    onDone: onWsDone,
  });

  /* --- Send message --- */
  const onSend = useCallback(
    async (e?: React.FormEvent, overrideText?: string) => {
      if (e) e.preventDefault();
      const text = (overrideText ?? input).trim();

      if (!text || isSending) return;

      if (selectedModel === 'tofa-offline' && !isOfflineModelDownloaded) {
        Alert.alert(
          'Model Offline Belum Tersedia',
          'Silakan hubungkan internet untuk mengunduh model terlebih dahulu.',
          [{ text: 'OK' }],
        );
        return;
      }

      setIsSending(true);
      Keyboard.dismiss();

      const userMsg: Message = {
        id: uid('m'),
        role: 'user',
        text,
        createdAt: nowIso(),
      };
      setGuestMessages((prev) => [...prev, userMsg]);
      setInput('');

      const wsOk = await ws.send(text, guestConversationId);
      if (!wsOk) {
        setNotification({
          title: 'Koneksi Bermasalah',
          message: 'Gagal mengirim pesan. Pastikan koneksi atau model sudah siap.',
        });
        setIsSending(false);
      }
    },
    [input, isSending, selectedModel, isOfflineModelDownloaded, ws, guestConversationId],
  );

  /* --- Expose WS status --- */
  const wsStatus = ws.status;

  return (
    <GuestContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        defaultOnlineModel,
        isOfflineModelDownloaded,
        checkOfflineModel,
        downloadModelVisible,
        setDownloadModelVisible,
        isDropdownOpen,
        setIsDropdownOpen,
        isInternetReachable,
        guestMessages,
        input,
        setInput,
        isSending,
        typingDots,
        notification,
        setNotification,
        onSend,
        wsStatus,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

// --- Hook ---

export function useGuest(): GuestContextValue {
  const ctx = useContext(GuestContext);
  if (!ctx) {
    throw new Error('useGuest must be used within a <GuestProvider>');
  }
  return ctx;
}
