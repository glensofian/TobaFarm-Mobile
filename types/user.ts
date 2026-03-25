type Role = "admin" | "user" | string;

export type UserProfile = {
  username: string;
  // Nanti tambah field profile pic
};

export type RegisterUser = {
    username: string;
    password: string;
    email: string;
    role: Role;
}

export type LoginUser = {
    username: string;
    password: string;
}

export type UserOut = {
    id: string; // UUID
    username: string;
    email: string;
    role: Role;
    created_at: string; // datetime
}

export type Token = {
    user: UserOut;
    access_token: string;
    token_type: string;
}