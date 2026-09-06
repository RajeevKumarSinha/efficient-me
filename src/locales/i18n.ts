import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { Platform, NativeModules } from 'react-native';

import en from './en.json';
import es from './es.json';
import de from './de.json';
import fr from './fr.json';
import hi from './hi.json';
import ja from './ja.json';

export type SupportedLanguage = 'en' | 'es' | 'de' | 'fr' | 'hi' | 'ja';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

const LANGUAGE_STORAGE_KEY = 'user_selected_language';

export const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  hi: { translation: hi },
  ja: { translation: ja },
};

/**
 * Detects device language safely using standard Intl API or NativeModules
 */
export function getDeviceLanguage(): SupportedLanguage {
  try {
    // 1. Standard Intl API (works on Hermes, JSC, V8, and Web)
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      if (locale) {
        const langCode = locale.split(/[-_]/)[0].toLowerCase() as SupportedLanguage;
        if (['en', 'es', 'de', 'fr', 'hi', 'ja'].includes(langCode)) {
          return langCode;
        }
      }
    }

    // 2. Fallback to NativeModules I18nManager
    const nativeLocale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    if (nativeLocale && typeof nativeLocale === 'string') {
      const langCode = nativeLocale.split(/[-_]/)[0].toLowerCase() as SupportedLanguage;
      if (['en', 'es', 'de', 'fr', 'hi', 'ja'].includes(langCode)) {
        return langCode;
      }
    }
  } catch (e) {
    console.warn('[i18n] Error detecting device locale:', e);
  }
  return 'en';
}

/**
 * Initializes i18n engine with persistent storage support
 */
export async function initI18n(): Promise<void> {
  let savedLang: string | null = null;
  if (Platform.OS !== 'web') {
    try {
      savedLang = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
    } catch {
      // Fallback
    }
  }

  const initialLang: SupportedLanguage =
    savedLang && ['en', 'es', 'de', 'fr', 'hi', 'ja'].includes(savedLang)
      ? (savedLang as SupportedLanguage)
      : getDeviceLanguage();

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      compatibilityJSON: 'v4',
      resources,
      lng: initialLang,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already safe from XSS
      },
    });
  } else {
    await i18n.changeLanguage(initialLang);
  }
}

/**
 * Persistently switch active application language
 */
export async function changeAppLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('[i18n] Failed to persist language choice:', e);
    }
  }
}

export default i18n;
