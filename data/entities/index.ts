// data/entities/index.ts

// UUID helper for client-side generation
import * as Crypto from 'expo-crypto';
export const generateId = () => Crypto.randomUUID();

export interface Conversation {
  id: string;              
  title: string;
  created_at: number;      
  is_synced: boolean;      
  server_id?: string;      
  messages?: Message[];    
}

export interface Message {
  id: string;
  conversation_id: string; 
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>; 
  created_at: number;
  is_synced: boolean;
  server_id?: string;
}

// Helper to convert DB row → TypeScript object
export const parseMessageRow = (row: any): Message => ({
  id: row.id,
  conversation_id: row.conversation_id,
  role: row.role,
  content: row.content,
  metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  created_at: row.created_at,
  is_synced: Boolean(row.is_synced),
  server_id: row.server_id || undefined,
});

export const parseConversationRow = (row: any): Conversation => ({
  id: row.id,
  title: row.title,
  created_at: row.created_at,
  is_synced: Boolean(row.is_synced),
  server_id: row.server_id || undefined,
});