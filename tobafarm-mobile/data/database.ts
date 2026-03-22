// data/database.ts
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (_db) return _db;
  
  console.log("Opening SQLite database: tofafarm.db");
  _db = await SQLite.openDatabaseAsync('tofafarm.db');
  
  await initializeSchema(_db);
  return _db;
};

const initializeSchema = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    
    -- Conversations table (mirrors your PostgreSQL schema)
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,                          -- UUID as TEXT (SQLite doesn't have UUID type)
      title TEXT DEFAULT 'New Chat',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000), -- milliseconds
      is_synced INTEGER DEFAULT 0,                  -- 0 = local only, 1 = synced to server
      server_id TEXT                                -- Original server UUID for sync reconciliation
    );
    
    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('system', 'user', 'assistant')),
      content TEXT NOT NULL,
      metadata TEXT,                                -- JSON string (SQLite doesn't have JSONB)
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      is_synced INTEGER DEFAULT 0,
      server_id TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_conversations_sync ON conversations(is_synced, created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_sync ON messages(is_synced, created_at);
    
    -- Trigger: Auto-update conversation timestamp when message is added
    CREATE TRIGGER IF NOT EXISTS update_conversation_timestamp
    AFTER INSERT ON messages
    BEGIN
      UPDATE conversations 
      SET created_at = NEW.created_at 
      WHERE id = NEW.conversation_id;
    END;
  `);
};

export const closeDatabase = async () => {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
};