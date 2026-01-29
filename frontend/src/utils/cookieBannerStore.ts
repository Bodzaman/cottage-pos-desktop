import { create } from 'zustand';

interface CookieBannerState {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

const COOKIE_NAME = 'cottage_tandoori_consent';

export const useCookieBannerStore = create<CookieBannerState>((set) => ({
  isVisible: true,
  setVisible: (visible) => set({ isVisible: visible }),
}));

// Check if consent cookie exists on init
if (typeof document !== 'undefined') {
  const hasConsent = document.cookie.includes(`${COOKIE_NAME}=`);
  if (hasConsent) {
    useCookieBannerStore.getState().setVisible(false);
  }
}
