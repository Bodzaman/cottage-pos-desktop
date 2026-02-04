/**
 * Electron-specific i18n Configuration
 *
 * Uses static imports instead of HTTP backend to load translation files.
 * This is necessary because:
 * 1. Electron production builds load from file:// protocol
 * 2. i18next-http-backend cannot load files from file:// URLs on Windows
 *
 * All translations are bundled at build time, ensuring reliable loading
 * across Windows, macOS, and Linux.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ============ STATIC TRANSLATION IMPORTS ============
// All translations bundled at build time - no HTTP loading needed

// English
import enCommon from '../../frontend/src/locales/en/common.json';
import enPos from '../../frontend/src/locales/en/pos.json';
import enAdmin from '../../frontend/src/locales/en/admin.json';
import enKds from '../../frontend/src/locales/en/kds.json';
import enChat from '../../frontend/src/locales/en/chat.json';

// Bengali
import bnCommon from '../../frontend/src/locales/bn/common.json';
import bnPos from '../../frontend/src/locales/bn/pos.json';
import bnAdmin from '../../frontend/src/locales/bn/admin.json';
import bnKds from '../../frontend/src/locales/bn/kds.json';
import bnChat from '../../frontend/src/locales/bn/chat.json';

// Hindi
import hiCommon from '../../frontend/src/locales/hi/common.json';
import hiPos from '../../frontend/src/locales/hi/pos.json';
import hiAdmin from '../../frontend/src/locales/hi/admin.json';
import hiKds from '../../frontend/src/locales/hi/kds.json';
import hiChat from '../../frontend/src/locales/hi/chat.json';

// Urdu
import urCommon from '../../frontend/src/locales/ur/common.json';
import urPos from '../../frontend/src/locales/ur/pos.json';
import urAdmin from '../../frontend/src/locales/ur/admin.json';
import urKds from '../../frontend/src/locales/ur/kds.json';
import urChat from '../../frontend/src/locales/ur/chat.json';

// Chinese
import zhCommon from '../../frontend/src/locales/zh/common.json';
import zhPos from '../../frontend/src/locales/zh/pos.json';
import zhAdmin from '../../frontend/src/locales/zh/admin.json';
import zhKds from '../../frontend/src/locales/zh/kds.json';
import zhChat from '../../frontend/src/locales/zh/chat.json';

// Spanish
import esCommon from '../../frontend/src/locales/es/common.json';
import esPos from '../../frontend/src/locales/es/pos.json';
import esAdmin from '../../frontend/src/locales/es/admin.json';
import esKds from '../../frontend/src/locales/es/kds.json';
import esChat from '../../frontend/src/locales/es/chat.json';

// Italian
import itCommon from '../../frontend/src/locales/it/common.json';
import itPos from '../../frontend/src/locales/it/pos.json';
import itAdmin from '../../frontend/src/locales/it/admin.json';
import itKds from '../../frontend/src/locales/it/kds.json';
import itChat from '../../frontend/src/locales/it/chat.json';

// Turkish
import trCommon from '../../frontend/src/locales/tr/common.json';
import trPos from '../../frontend/src/locales/tr/pos.json';
import trAdmin from '../../frontend/src/locales/tr/admin.json';
import trKds from '../../frontend/src/locales/tr/kds.json';
import trChat from '../../frontend/src/locales/tr/chat.json';

// French
import frCommon from '../../frontend/src/locales/fr/common.json';
import frPos from '../../frontend/src/locales/fr/pos.json';
import frAdmin from '../../frontend/src/locales/fr/admin.json';
import frKds from '../../frontend/src/locales/fr/kds.json';
import frChat from '../../frontend/src/locales/fr/chat.json';

// German
import deCommon from '../../frontend/src/locales/de/common.json';
import dePos from '../../frontend/src/locales/de/pos.json';
import deAdmin from '../../frontend/src/locales/de/admin.json';
import deKds from '../../frontend/src/locales/de/kds.json';
import deChat from '../../frontend/src/locales/de/chat.json';

// Thai
import thCommon from '../../frontend/src/locales/th/common.json';
import thPos from '../../frontend/src/locales/th/pos.json';
import thAdmin from '../../frontend/src/locales/th/admin.json';
import thKds from '../../frontend/src/locales/th/kds.json';
import thChat from '../../frontend/src/locales/th/chat.json';

// Polish
import plCommon from '../../frontend/src/locales/pl/common.json';
import plPos from '../../frontend/src/locales/pl/pos.json';
import plAdmin from '../../frontend/src/locales/pl/admin.json';
import plKds from '../../frontend/src/locales/pl/kds.json';
import plChat from '../../frontend/src/locales/pl/chat.json';

// Romanian
import roCommon from '../../frontend/src/locales/ro/common.json';
import roPos from '../../frontend/src/locales/ro/pos.json';
import roAdmin from '../../frontend/src/locales/ro/admin.json';
import roKds from '../../frontend/src/locales/ro/kds.json';
import roChat from '../../frontend/src/locales/ro/chat.json';

// ============ BUNDLED RESOURCES ============

const resources = {
  en: { common: enCommon, pos: enPos, admin: enAdmin, kds: enKds, chat: enChat },
  bn: { common: bnCommon, pos: bnPos, admin: bnAdmin, kds: bnKds, chat: bnChat },
  hi: { common: hiCommon, pos: hiPos, admin: hiAdmin, kds: hiKds, chat: hiChat },
  ur: { common: urCommon, pos: urPos, admin: urAdmin, kds: urKds, chat: urChat },
  zh: { common: zhCommon, pos: zhPos, admin: zhAdmin, kds: zhKds, chat: zhChat },
  es: { common: esCommon, pos: esPos, admin: esAdmin, kds: esKds, chat: esChat },
  it: { common: itCommon, pos: itPos, admin: itAdmin, kds: itKds, chat: itChat },
  tr: { common: trCommon, pos: trPos, admin: trAdmin, kds: trKds, chat: trChat },
  fr: { common: frCommon, pos: frPos, admin: frAdmin, kds: frKds, chat: frChat },
  de: { common: deCommon, pos: dePos, admin: deAdmin, kds: deKds, chat: deChat },
  th: { common: thCommon, pos: thPos, admin: thAdmin, kds: thKds, chat: thChat },
  pl: { common: plCommon, pos: plPos, admin: plAdmin, kds: plKds, chat: plChat },
  ro: { common: roCommon, pos: roPos, admin: roAdmin, kds: roKds, chat: roChat },
};

// ============ CONFIGURATION (re-exported from original) ============

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
export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);
export const NAMESPACES = ['common', 'pos', 'admin', 'kds', 'chat'] as const;
export type Namespace = (typeof NAMESPACES)[number];
export const LANGUAGE_STORAGE_KEY = 'cottage_language';

export function isRTL(languageCode: string): boolean {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === languageCode);
  return lang?.rtl ?? false;
}

export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}

// ============ i18next INITIALIZATION ============

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Static resources - no HTTP backend needed
    resources,

    // Default language
    lng: localStorage.getItem(LANGUAGE_STORAGE_KEY) || undefined,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGE_CODES,

    // Namespaces
    ns: NAMESPACES,
    defaultNS: 'common',

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
