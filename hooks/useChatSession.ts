// hooks/useChatSession.ts
import { useState, useEffect, useCallback } from 'react';
import { ChatRepository } from '../data/repositories/ChatRepository';
import { Conversation, Message } from '../data/entities';

export const useChatSession = (conversationId: string | null) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [conv, msgs] = await Promise.all([
        ChatRepository.getConversation(conversationId),
        ChatRepository.getMessagesByConversation(conversationId),
      ]);
      
      setConversation(conv);
      setMessages(msgs);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load chat');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (role: Message['role'], content: string, metadata?: Record<string, any>) => {
    if (!conversationId) throw new Error('No active conversation');
    
    const message = await ChatRepository.saveMessage({
      conversation_id: conversationId,
      role,
      content,
      metadata,
      is_synced: false, // Mark as unsynced for later background sync
    });
    
    // Optimistic update
    setMessages(prev => [...prev, message]);
    return message;
  }, [conversationId]);

  const createNewConversation = useCallback(async (title?: string) => {
    const conv = await ChatRepository.createConversation(title);
    setConversation(conv);
    setMessages([]);
    return conv.id;
  }, []);

  const deleteCurrentConversation = useCallback(async () => {
    if (!conversationId) return;
    await ChatRepository.deleteConversation(conversationId);
    setConversation(null);
    setMessages([]);
  }, [conversationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    conversation,
    messages,
    loading,
    error,
    sendMessage,
    createNewConversation,
    deleteCurrentConversation,
    refresh: loadData,
  };
};