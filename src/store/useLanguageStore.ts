import { create } from 'zustand';
import i18n, { SupportedLanguage, SUPPORTED_LANGUAGES, changeAppLanguage, getDeviceLanguage } from '../locales/i18n';

interface LanguageState {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  initializeLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: (i18n.language as SupportedLanguage) || getDeviceLanguage() || 'en',

  initializeLanguage: () => {
    const lang = (i18n.language as SupportedLanguage) || 'en';
    set({ currentLanguage: lang });
  },

  setLanguage: async (lang: SupportedLanguage) => {
    await changeAppLanguage(lang);
    set({ currentLanguage: lang });
  },
}));
