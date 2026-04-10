// data/repositories/ChatRepository.ts
import { getDatabase } from '../database';
import { Conversation, Message, parseMessageRow, parseConversationRow, generateId } from '../entities';

export const ChatRepository = {
  // ========== CONVERSATIONS ==========
  
  async createConversation(title = 'New Chat', serverId?: string): Promise<Conversation> {
    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();
    
    await db.runAsync(
      `INSERT INTO conversations (id, title, created_at, is_synced, server_id) 
       VALUES (?, ?, ?, ?, ?)`,
      id, title, now, serverId ? 1 : 0, serverId
    );
    
    return { id, title, created_at: now, is_synced: !!serverId, server_id: serverId };
  },

  async saveConversation(conv: Conversation): Promise<void> {
    const db = await getDatabase();
    console.log(`[ChatRepository] saveConversation: id=${conv.id}, title=${conv.title}`);
    await db.runAsync(
      `INSERT OR REPLACE INTO conversations (id, title, created_at, is_synced, server_id) 
       VALUES (?, ?, ?, ?, ?)`,
      conv.id, conv.title, conv.created_at || Date.now(), conv.is_synced ? 1 : 0, conv.server_id || ""
    );
  },

  async getConversation(id: string): Promise<Conversation | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      `SELECT * FROM conversations WHERE id = ?`,
      id
    );
    return row ? parseConversationRow(row) : null;
  },

  // Returns all local conversations (both synced and unsynced) so they are available offline.
  async getAllConversations(limit = 200): Promise<Conversation[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM conversations 
       ORDER BY created_at DESC 
       LIMIT ?`,
      limit
    );
    return rows.map(parseConversationRow);
  },

  async updateConversationTitle(id: string, title: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE conversations SET title = ? WHERE id = ?`,
      title, id
    );
  },

  async deleteConversation(id: string): Promise<void> {
    const db = await getDatabase();
    // CASCADE deletes messages automatically due to FOREIGN KEY
    await db.runAsync(`DELETE FROM conversations WHERE id = ?`, id);
  },

  async getUnsyncedConversations(): Promise<Conversation[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM conversations WHERE is_synced = 0 ORDER BY created_at ASC`
    );
    return rows.map(parseConversationRow);
  },

  async markConversationSynced(localId: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE conversations SET is_synced = 1, server_id = ? WHERE id = ?`,
      serverId, localId
    );
  },

  async replaceConversationId(oldId: string, newId: string): Promise<void> {
    const db = await getDatabase();
    const old = await db.getFirstAsync<any>('SELECT * FROM conversations WHERE id = ?', oldId);
    if (old) {
      await db.runAsync(
        `INSERT OR REPLACE INTO conversations (id, title, created_at, is_synced, server_id) 
         VALUES (?, ?, ?, ?, ?)`,
        newId, old.title, old.created_at, 1, newId
      );
      await this.updateMessagesConversationId(oldId, newId);
      await db.runAsync(`DELETE FROM conversations WHERE id = ?`, oldId);
    }
  },

  // ========== MESSAGES ==========

  async saveMessage(message: Omit<Message, 'id' | 'created_at'> & { id?: string, created_at?: number }): Promise<Message> {
    const db = await getDatabase();
    const id = message.id || generateId();
    const now = message.created_at || Date.now();
    
    console.log(`[ChatRepository] saveMessage: role=${message.role}, conversation_id=${message.conversation_id}`);
    
    // Quick verify parents exists
    const parent = await db.getFirstAsync('SELECT id FROM conversations WHERE id = ?', message.conversation_id);
    if (!parent) {
      console.warn(`[WARNING] saveMessage: Parent conversation ${message.conversation_id} NOT FOUND in database! Creating stub.`);
      await db.runAsync(
        `INSERT OR REPLACE INTO conversations (id, title, created_at, is_synced, server_id) 
         VALUES (?, ?, ?, ?, ?)`,
        message.conversation_id, 'Restored Chat', Date.now(), 1, message.conversation_id
      );
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO messages (id, conversation_id, role, content, metadata, created_at, is_synced, server_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      message.conversation_id,
      message.role,
      message.content,
      message.metadata ? JSON.stringify(message.metadata) : "",
      now,
      message.is_synced ? 1 : 0,
      message.server_id || ""
    );
    
    return { id, created_at: now, ...message };
  },

  async getMessagesByConversation(conversationId: string, limit = 50): Promise<Message[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM messages 
       WHERE conversation_id = ? 
       ORDER BY created_at ASC 
       LIMIT ?`,
      conversationId, limit
    );
    return rows.map(parseMessageRow);
  },

  async getUnsyncedMessages(): Promise<Message[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM messages WHERE is_synced = 0 ORDER BY created_at ASC`
    );
    return rows.map(parseMessageRow);
  },

  async markMessageSynced(localId: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE messages SET is_synced = 1, server_id = ? WHERE id = ?`,
      serverId || "", localId
    );
  },

  async deleteMessagesByConversation(conversationId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM messages WHERE conversation_id = ?`,
      conversationId
    );
  },

  async updateMessagesConversationId(oldId: string, newId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE messages SET conversation_id = ? WHERE conversation_id = ?`,
      newId, oldId
    );
  },

  // ========== CLEANUP ==========

  // Delete all messages that have been successfully synced to the server.
  // This prevents duplication when loading from both local and API sources.
  async deleteSyncedMessages(): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM messages WHERE is_synced = 1`);
    return result.changes;
  },

  // Delete all conversations that have been successfully synced to the server.
  async deleteSyncedConversations(): Promise<number> {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM conversations WHERE is_synced = 1`);
    return result.changes;
  },

  // Completely erase all conversations and messages locally
  async wipeAllLocalData(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM messages`);
    await db.runAsync(`DELETE FROM conversations`);
    console.log("Local SQLite database wiped successfully.");
  },

  // Save space: purge synced messages of conversations other than the active one
  async purgeOldSyncedMessages(activeConversationId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM messages WHERE is_synced = 1 AND conversation_id != ?`,
      activeConversationId
    );
  },

  // ========== SYNC UTILITIES ===========

  async getPendingSyncData(): Promise<{
    conversations: Conversation[];
    messages: Message[];
  }> {
    const [conversations, messages] = await Promise.all([
      this.getUnsyncedConversations(),
      this.getUnsyncedMessages(),
    ]);
    return { conversations, messages };
  },

  async applyServerSyncData(serverConversations: Array<{local_id: string, server_id: string}>, 
                           serverMessages: Array<{local_id: string, server_id: string}>): Promise<void> {
    const db = await getDatabase();
    
    // Batch update conversations
    for (const {local_id, server_id} of serverConversations) {
      await db.runAsync(
        `UPDATE conversations SET is_synced = 1, server_id = ? WHERE id = ?`,
        server_id, local_id
      );
    }
    
    // Batch update messages
    for (const {local_id, server_id} of serverMessages) {
      await db.runAsync(
        `UPDATE messages SET is_synced = 1, server_id = ? WHERE id = ?`,
        server_id, local_id
      );
    }
  }
};