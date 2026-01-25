import { create } from 'zustand';

/**
 * Offline Banner Store
 *
 * Manages the visibility state of the POSOfflineBanner.
 * Allows user to dismiss banner and reopen from footer.
 */
interface OfflineBannerStore {
  /** User has manually dismissed the banner */
  userDismissed: boolean;

  /** Set dismissed state */
  setUserDismissed: (dismissed: boolean) => void;

  /** Reopen the banner (called from footer) */
  reopenBanner: () => void;

  /** Reset state (called when going back online and sync complete) */
  reset: () => void;
}

export const useOfflineBannerStore = create<OfflineBannerStore>((set) => ({
  userDismissed: false,

  setUserDismissed: (dismissed) => set({ userDismissed: dismissed }),

  reopenBanner: () => set({ userDismissed: false }),

  reset: () => set({ userDismissed: false }),
}));
