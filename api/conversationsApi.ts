import axios from "axios";
import { router } from "expo-router";
import type {
  ApiConversation,
  ApiMessage,
  Conversation,
  Message,
} from "../types";
import { getValueFor, removeValueFor } from "../utils/storage";

type ClearAllResponse = {
  message: string;
};

// --- Fungsi Validasi ---
function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

const apiClient = axios.create();

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expired atau tidak valid. Mengarahkan ke Login...");
      try {
        await removeValueFor("token");
        await removeValueFor("user");
      } catch (e) {
        console.error("Gagal menghapus sesi lokal:", e);
      }
      router.replace("/login");
    }
    return Promise.reject(error);
  }
);

export function createConversationsApi() {
  const apiBase = process.env.EXPO_PUBLIC_TOFA_API_URL as string;

  const authHeaders = async () => {
    const token = await getValueFor("token");
    return {
      Authorization: `Bearer ${token ?? ""}`,
    };
  };

  /* =========================
     LOAD CONVERSATIONS
  ========================= */
  const loadConversations = async (): Promise<Conversation[]> => {
    try {
      const res = await apiClient.get(`${apiBase}/conversations/`, {
        headers: await authHeaders(),
      });

      const data = res.data;

      if (!Array.isArray(data)) return [];

      return (data as ApiConversation[]).map((item) => ({
        id: assertString(item.id, "conversation.id"),
        title: item.title ?? "Untitled",
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        updatedAt: item.updated_at || item.updatedAt,
      }));
    } catch (error) {
      console.error("Failed to load conversations", error);
      throw error;
    }
  };

  /* =========================
     LOAD MESSAGES
  ========================= */
  const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    const res = await apiClient.get(`${apiBase}/messages/${conversationId}`, {
      headers: await authHeaders(),
    });

    const data = res.data;

    if (!Array.isArray(data)) return [];

    return (data as ApiMessage[]).map((msg) => ({
      id: assertString(msg.id, "message.id"),
      role: msg.role === "assistant" ? "bot" : "user", 
      text: msg.content ?? "",
      createdAt: msg.created_at || msg.createdAt || new Date().toISOString(),
    }));
  };

  /* =========================
     SAVE MESSAGE
  ========================= */
  const saveMessage = async (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<void> => {
    if (!content.trim()) return;

    await apiClient.post(
      `${apiBase}/messages/${conversationId}`,
      {
        role,
        content,
        meta_data: {},
      },
      { headers: await authHeaders() },
    );
  };

  /* =========================
     CREATE CONVERSATION
  ========================= */
  const createConversation = async (): Promise<{ id: string }> => {
    const res = await apiClient.post(
      `${apiBase}/conversations/`,
      {},
      { headers: await authHeaders() },
    );

    console.log("Create Conversation Response:", res);
    const data = res.data;

    if (!data || typeof data !== "object") {
      throw new Error("Invalid conversation response");
    }

    const id = assertString((data as { id?: unknown }).id, "conversation.id");
    return { id };
  };

  /* =========================
     CLEAR ALL
  ========================= */
  const clearAllChats = async (): Promise<ClearAllResponse> => {
    const stored = await getValueFor("user");
    const user_id = stored ? JSON.parse(stored).id : "";
    const id = user_id as string;
    
    console.log("Clearing all chats for user_id:", id, "With type of:", typeof id);
    
    const res = await apiClient.delete(`${apiBase}/conversations/clear/${id}`, {
      headers: await authHeaders(),
    });

    return {
      message: res.data?.message ?? "All conversations cleared",
    };
  };

  /* =========================
     RENAME
  ========================= */
  const renameConversation = async (
    id: string,
    title: string,
  ): Promise<void> => {
    await apiClient.put(
      `${apiBase}/conversations/${id}`,
      { title },
      { headers: await authHeaders() },
    );
  };

  /* =========================
     DELETE
  ========================= */
  const deleteConversation = async (id: string): Promise<void> => {
    await apiClient.delete(`${apiBase}/conversations/${id}`, {
      headers: await authHeaders(),
    });
  };

  return {
    loadConversations,
    fetchMessages,
    saveMessage,
    createConversation,
    clearAllChats,
    renameConversation,
    deleteConversation,
  };
}
