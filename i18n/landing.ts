import type { LandingPageTranslation } from "./types";

export const landingPageTranslation: Record<
  "id" | "en",
  LandingPageTranslation & Record<string, string>
> = {
  id: {
    loginButton: "Masuk",
    registerButton: "Daftar",
    greeting: "Halo",
    greetingMorning: "Selamat Pagi",
    greetingAfternoon: "Selamat Siang",
    greetingEvening: "Selamat Sore",
    greetingNight: "Selamat Malam",
    helpText: "Apa yang boleh saya bantu?",
    chatBubble: "Mulai Percakapan",
    welcomeBack: "Selamat Datang Kembali",
    guestButton: "Masuk Sebagai Guest",
  },

  en: {
    loginButton: "Login",
    registerButton: "Register",
    greeting: "Hello",
    greetingMorning: "Good Morning",
    greetingAfternoon: "Good Afternoon",
    greetingEvening: "Good Evening",
    greetingNight: "Good Night",
    helpText: "How can I help you?",
    chatBubble: "Start Chat",
    welcomeBack: "Welcome Back",
    guestButton: "Enter as Guest",
  },
};
