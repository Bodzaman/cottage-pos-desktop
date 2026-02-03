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
        // Validate language is supported
        const isSupported = SUPPORTED_LANGUAGES.some((l) => l.code === code);
        if (!isSupported) {
          console.warn(`Language "${code}" is not supported. Falling back to English.`);
          code = DEFAULT_LANGUAGE;
        }

        // Update i18next
        i18n.changeLanguage(code);

        // Update store
        set({
          currentLanguage: code,
          isRTL: isRTL(code),
        });
      },

      getLanguageConfig: () => {
        const { currentLanguage } = get();
        return SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
      },
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
      }),
    }
  )
);

// Sync store with i18next language changes (e.g., from browser detection)
i18n.on('languageChanged', (lng) => {
  const store = useLanguageStore.getState();
  if (store.currentLanguage !== lng) {
    useLanguageStore.setState({
      currentLanguage: lng,
      isRTL: isRTL(lng),
    });
  }
});

// Initialize store with current i18next language on load
if (i18n.isInitialized) {
  const currentLng = i18n.language || DEFAULT_LANGUAGE;
  useLanguageStore.setState({
    currentLanguage: currentLng,
    isRTL: isRTL(currentLng),
  });
}
