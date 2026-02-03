/**
 * i18n Configuration - Multi-language support using react-i18next
 *
 * SaaS-ready architecture that supports any number of languages.
 * Uses lazy loading to only load the active language's translations.
 *
 * Supported languages can be extended by:
 * 1. Adding to SUPPORTED_LANGUAGES array below
 * 2. Creating translation files in /frontend/locales/{code}/
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

/**
 * Supported languages configuration
 * Add new languages here - no other code changes needed
 */
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
];

export const DEFAULT_LANGUAGE = 'en';
export const FALLBACK_LANGUAGE = 'en';

// Extract language codes for i18next
export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

// Translation namespaces
export const NAMESPACES = ['common', 'pos', 'admin', 'kds', 'chat'] as const;
export type Namespace = (typeof NAMESPACES)[number];

// Storage key for persisted language preference
export const LANGUAGE_STORAGE_KEY = 'cottage_language';

/**
 * Check if a language is RTL (right-to-left)
 */
export function isRTL(languageCode: string): boolean {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === languageCode);
  return lang?.rtl ?? false;
}

/**
 * Get language config by code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}

/**
 * Initialize i18next with react-i18next
 *
 * Features:
 * - Browser language detection
 * - localStorage persistence
 * - Lazy loading of translation files
 * - Fallback to English
 */
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Default language
    lng: localStorage.getItem(LANGUAGE_STORAGE_KEY) || undefined,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGE_CODES,

    // Namespaces
    ns: NAMESPACES,
    defaultNS: 'common',

    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Development settings
    debug: import.meta.env.DEV,

    // React settings
    react: {
      useSuspense: true,
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = isRTL(lng) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;

  // Persist language preference
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
});

export default i18n;
