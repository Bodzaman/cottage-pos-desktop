/**
 * Language Store - Zustand store for reactive language state
 *
 * Provides reactive language state that syncs with i18next.
 * Use this store for components that need to react to language changes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from './i18nConfig';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isRTL,
  type LanguageConfig,
} from './i18nConfig';

// Valid language codes for validation
const VALID_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

/**
 * Validate that a value is a valid language code (not corrupted JSON)
 * Returns the validated code or DEFAULT_LANGUAGE if invalid
 */
function validateLanguageCode(value: unknown): string {
  // Must be a string
  if (typeof value !== 'string') {
    return DEFAULT_LANGUAGE;
  }

  // Must be a short language code (2-3 chars), not a JSON object string
  if (value.length > 5 || value.startsWith('{') || value.startsWith('[')) {
    console.warn('[languageStore] Corrupted language value detected, resetting to default');
    return DEFAULT_LANGUAGE;
  }

  // Must be a supported language
  if (!VALID_LANGUAGE_CODES.includes(value)) {
    return DEFAULT_LANGUAGE;
  }

  return value;
}

/**
 * Clear corrupted language data from localStorage
 * This handles the case where recursive JSON stringification corrupted the data
 */
function clearCorruptedLanguageData(): void {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!stored) return;

    // Check if the data looks corrupted (nested JSON strings)
    if (stored.includes('\\"state\\"') || stored.length > 500) {
      console.warn('[languageStore] Clearing corrupted localStorage data');
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
  } catch (e) {
    // If we can't read localStorage, just continue
  }
}

// Clear corrupted data on module load (before store initialization)
clearCorruptedLanguageData();

interface LanguageState {
  // Current language code
  currentLanguage: string;
  // Whether current language is RTL
  isRTL: boolean;
  // All supported languages
  supportedLanguages: LanguageConfig[];

  // Actions
  setLanguage: (code: string) => void;
  getLanguageConfig: () => LanguageConfig | undefined;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: i18n.language || DEFAULT_LANGUAGE,
      isRTL: isRTL(i18n.language || DEFAULT_LANGUAGE),
      supportedLanguages: SUPPORTED_LANGUAGES,

      setLanguage: (code: string) => {
        // Validate language code (prevents corrupted data from being set)
        const validCode = validateLanguageCode(code);

        // Update i18next
        i18n.changeLanguage(validCode);

        // Update store
        set({
          currentLanguage: validCode,
          isRTL: isRTL(validCode),
        });
      },

      getLanguageConfig: () => {
        const { currentLanguage } = get();
        return SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
      },
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      // Uses default localStorage - safe now that large stores moved to IndexedDB
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
      }),
      // Validate and fix corrupted data on rehydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Validate the rehydrated language code
        const validCode = validateLanguageCode(state.currentLanguage);
        if (validCode !== state.currentLanguage) {
          console.warn('[languageStore] Fixed corrupted language on rehydration');
          // Update state with valid language
          useLanguageStore.setState({
            currentLanguage: validCode,
            isRTL: isRTL(validCode),
          });
        }
      },
    }
  )
);

// Sync store with i18next language changes (e.g., from browser detection)
i18n.on('languageChanged', (lng) => {
  // Validate the language code before setting
  const validCode = validateLanguageCode(lng);
  const store = useLanguageStore.getState();
  if (store.currentLanguage !== validCode) {
    useLanguageStore.setState({
      currentLanguage: validCode,
      isRTL: isRTL(validCode),
    });
  }
});

// Initialize store with current i18next language on load
if (i18n.isInitialized) {
  const currentLng = validateLanguageCode(i18n.language);
  useLanguageStore.setState({
    currentLanguage: currentLng,
    isRTL: isRTL(currentLng),
  });
}
