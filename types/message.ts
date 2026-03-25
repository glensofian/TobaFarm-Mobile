type Role = "user" | "assistant" | "system";

export type MessageCreate = {
    role: Role;
    content: string;
    meta_data?: Record<string, any>;
}

export type MessageOut = {
    id: string; // UUID
    role: Role;
    content: string;
    meta_data?: Record<string, any>;
    created_at: string; // datetime 
}