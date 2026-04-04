import axios from "axios";
import { getValueFor } from "../utils/storage";
import { RegisterUser, LoginUser } from "../types/user";
import { OTPCreate } from "../types/otp";

const apiBase = process.env.EXPO_PUBLIC_TOFA_API_URL as string;

const authHeaders = async () => {
  const token = await getValueFor("token");
  return {
    Authorization: `Bearer ${token ?? ""}`,
  };
};

/* =========================
   LOGIN
========================= */
export const login = async (data: LoginUser) => {
  try {
    const payload = new URLSearchParams({
        username: data.username,
        password: data.password,
    });

    const response = await axios.post(
        `${apiBase}/auth/token`,
        payload.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
    );
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Login gagal. Silakan coba lagi.";
    throw new Error(message);
  }
};

/* =========================
   REGISTER
========================= */
export const register = async (data: RegisterUser) => {
  try {
    const response = await axios.post(`${apiBase}/auth/register`, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Registrasi gagal. Silakan coba lagi.";
    throw new Error(message);
  }
};

/* =========================
   OTP: SEND
========================= */
export const sendOtp = async (data: OTPCreate) => {
  try {
    const response = await axios.post(`${apiBase}/otp`, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Gagal mengirim OTP.";
    throw new Error(message);
  }
};

/* =========================
   OTP: VERIFY CODE
========================= */
export const verifyOtpCode = async (data: { email: string; otp: string }) => {
  try {
    const response = await axios.post(`${apiBase}/otp/verify`, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Kode OTP tidak valid.";
    throw new Error(message);
  }
};

/* =========================
   AUTH: VERIFY REGISTRATION
========================= */
export const verifyRegistration = async (data: { email: string; otp: string }) => {
  try {
    const response = await axios.post(`${apiBase}/auth/verify`, data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Verifikasi registrasi gagal.";
    throw new Error(message);
  }
};

/* =========================
   CHANGE PASSWORD
========================= */
export const changePassword = async (oldPw: string, newPw: string): Promise<void> => {
  try {
    await axios.post(
      `${apiBase}/auth/change-password`,
      {
        old_password: oldPw,
        new_password: newPw,
      },
      {
        headers: await authHeaders(),
      }
    );
  } catch (error: any) {
    const message = error.response?.data?.detail || "Gagal mengubah kata sandi.";
    throw new Error(message);
  }
};

/* =========================
   UPDATE NICKNAME
========================= */
export const updateNickname = async (nickname: string): Promise<void> => {
    try {
      const stored = await getValueFor("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user?.id) throw new Error("User not found");

      await axios.put(
        `${apiBase}/users/${user.id}/profile`,
        { nickname },
        { headers: await authHeaders() }
      );
    } catch (error: any) {
      const message = error.response?.data?.detail || "Gagal memperbarui nama panggilan.";
      throw new Error(message);
    }
};
