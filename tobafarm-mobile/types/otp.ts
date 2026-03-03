export type OTPCreate = {
    email: string;
    user_id?: string | null;
    lang?: string;
}

export type OTPOut = {
    id: string;
    user_id: string;
    email: string;
    otp_hash: string;
    created_at: string;
    used: boolean;
    expires_at: string;
}

export type OTPInput= {
    email: string;
    otp: string;
}