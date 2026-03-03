import axios from "axios";
import type {
  ApiConversation,
  ApiMessage,
  Conversation,
  Message,
} from "../types";
import { getValueFor } from "../utils/storage";



type ClearAllresponseponse = { message: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function createConversationsApi() {
  const apiBase = process.env.EXPO_PUBLIC_TOFA_API_URL as string;

  const authHeaders = async () => {
    const token = await getValueFor("token");
    return {
      Authorization: `Bearer ${token ?? ""}`,
    };
  };

  const loadConversations = async (): Promise<Conversation[]> => {
    const token = await getValueFor("token");
    const responseponse = await axios.get(`${apiBase}/conversations/`, {
      headers: {
        Authorization: `Bearer ${token ?? ""}`,
      },
    });

    if (responseponse.status !== 200) {
      console.error("Failed to load conversations");
      return [];
    }

    console.log("Succesfully Loaded Conversations: ", responseponse.data);

    const data: unknown = responseponse.data;
    if (!Array.isArray(data)) return [];

    return (data as ApiConversation[]).map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      updatedAt: item.updated_at || item.updatedAt,
    }));
  };

  const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    const response = await axios.get(`${apiBase}/messages/${conversationId}`, {
      headers: await authHeaders(),
    });

    const data: unknown = response.data;
    if (!Array.isArray(data)) return [];

    return (data as ApiMessage[]).map((msg) => ({
      id: msg.id,
      role: msg.role === "assistant" ? "bot" : "user",
      text: msg.content,
      createdAt: msg.created_at || msg.createdAt || new Date().toISOString(),
    }));
  };

  const saveMessage = async (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ) => {
    if (!content.trim()) return;

    await axios.post(
      `${apiBase}/messages/${conversationId}`,
      { role, content, meta_data: {} },
      { headers: await authHeaders() },
    );
  };

  const createConversation = async (): Promise<{ id: string } | null> => {
    const response = await axios.post(
      `${apiBase}/conversations/`,
      {},
      { headers: await authHeaders() },
    );

    const data: unknown = response.data;
    if (!isRecord(data)) return null;
    if (!isString(data.id)) return null;

    return { id: data.id };
  };

  const clearAllChats = async (): Promise<ClearAllresponseponse> => {

    const response = await axios.delete(`${apiBase}/conversations/clear`, {
      headers: await authHeaders(),
    });

    const data: unknown = response.data;
    if (!isRecord(data) || !isString(data.message)) {
      return { message: "Cleared" };
    }
    return { message: data.message };
  };

  const renameConversation = async (id: string, title: string) => {
    await axios.put(
      `${apiBase}/conversations/${id}`,
      { title },
      { headers: await authHeaders() },
    );
  };

  const deleteConversation = async (id: string) => {
    await axios.delete(`${apiBase}/conversations/${id}`, {
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
