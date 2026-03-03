export type Lang = "id" | "en";

export type UserProfile = {
  username: string;
  // tambah field lain kalau ada
};

export type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
};

export type PromptState = { initialPrompt?: string; user?: UserProfile };

export type ApiConversation = {
  id: string;
  title: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

export type ApiMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at?: string;
  createdAt?: string;
};
