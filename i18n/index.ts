import { landingPageTranslation } from "./landing";
import { roomChatTranslation } from "./roomChat";
import { settingsTranslation } from "./settings";
import { changePasswordTranslation } from "./changePassword";
import type { TranslationData } from "./types";

export const translations: Record<"id" | "en", TranslationData> = {
  id: {
    landing: landingPageTranslation.id,
    roomChat: roomChatTranslation.id,
    settings: settingsTranslation.id,
    changePassword: changePasswordTranslation.id,
  },
  en: {
    landing: landingPageTranslation.en,
    roomChat: roomChatTranslation.en,
    settings: settingsTranslation.en,
    changePassword: changePasswordTranslation.en,
  },
};

export type { TranslationData, Language } from "./types";
