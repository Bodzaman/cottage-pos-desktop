import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X, RefreshCw } from 'lucide-react';
import { getOfflineStatus, onOfflineStatusChange } from 'utils/serviceWorkerManager';
import { outboxSyncManager } from 'utils/outboxSyncManager';
import type { OutboxSyncStatus } from 'utils/outboxSyncManager';
import { useOfflineBannerStore } from 'utils/offlineBannerStore';
import { useTranslation } from 'react-i18next';

/**
 * POSOfflineBanner - Network status banner for POS Desktop
 *
 * Offline state: Red/orange scrolling marquee with reassuring message
 * Online/Syncing state: Green banner with progress bar
 * Auto-dismisses when sync complete, user can dismiss manually
 * Can be reopened from footer
 */
export function POSOfflineBanner() {
  const { t } = useTranslation('pos');
  // Network state
  const [isOffline, setIsOffline] = useState(getOfflineStatus());
  const [syncStatus, setSyncStatus] = useState<OutboxSyncStatus | null>(null);

  // Track initial pending count for progress calculation
  const initialPendingRef = useRef<number>(0);
  const [wasOffline, setWasOffline] = useState(false);

  // Banner visibility (from store)
  const { userDismissed, setUserDismissed, reset } = useOfflineBannerStore();

  // Auto-dismiss timer
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to offline status changes
  useEffect(() => {
    const unsubscribeOffline = onOfflineStatusChange((offline) => {
      if (offline) {
        setWasOffline(true);
        // Reset dismiss state when going offline
        reset();
      }
      setIsOffline(offline);
    });

    return () => unsubscribeOffline();
  }, [reset]);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribeSync = outboxSyncManager.onStatusChange((status) => {
      setSyncStatus(status);

      // Track initial pending count when sync starts
      if (status.isSyncing && status.pendingOperations > 0 && initialPendingRef.current === 0) {
        initialPendingRef.current = status.pendingOperations;
      }

      // Reset initial count when sync completes
      if (!status.isSyncing && status.pendingOperations === 0) {
        initialPendingRef.current = 0;
      }
    });

    // Initial status fetch
    outboxSyncManager.getStatus().then(setSyncStatus).catch(console.error);

    return () => unsubscribeSync();
  }, []);

  // Auto-dismiss when back online and sync complete
  useEffect(() => {
    // Clear any existing timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    // If online, not syncing, and no pending operations
    if (!isOffline && !syncStatus?.isSyncing && syncStatus?.pendingOperations === 0) {
      // Wait 2 seconds then reset (which will hide banner)
      autoDismissTimerRef.current = setTimeout(() => {
        setWasOffline(false);
        reset();
      }, 2000);
    }

    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [isOffline, syncStatus?.isSyncing, syncStatus?.pendingOperations, reset]);

  // Calculate progress percentage
  const getProgress = (): number => {
    if (!syncStatus || initialPendingRef.current === 0) return 0;
    const synced = initialPendingRef.current - syncStatus.pendingOperations;
    return Math.round((synced / initialPendingRef.current) * 100);
  };

  // Determine what to show
  const shouldShowOfflineBanner = isOffline && !userDismissed;
  const shouldShowSyncBanner = !isOffline && wasOffline && (syncStatus?.isSyncing || (syncStatus?.pendingOperations ?? 0) > 0) && !userDismissed;
  const shouldShowSuccessBanner = !isOffline && wasOffline && !syncStatus?.isSyncing && syncStatus?.pendingOperations === 0 && !userDismissed;

  const showBanner = shouldShowOfflineBanner || shouldShowSyncBanner || shouldShowSuccessBanner;

  // Handle close button
  const handleDismiss = () => {
    setUserDismissed(true);
  };

  // Marquee text for offline state
  const offlineText = t('offline.banner') + ' — ' + t('offline.message');

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50"
          role="alert"
          aria-live="polite"
        >
          {/* OFFLINE BANNER */}
          {shouldShowOfflineBanner && (
            <div
              className="relative px-4 py-3"
              style={{
                background: 'rgba(34, 18, 18, 0.98)',
                borderBottom: '2px solid rgba(239, 68, 68, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <WifiOff className="h-5 w-5 text-orange-400" />
                </div>

                {/* Scrolling marquee text */}
                <div className="flex-1 overflow-hidden">
                  <div className="marquee-container">
                    <div className="marquee-content">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-orange-300">
                        <span className="text-orange-400">⚠️</span>
                        {offlineText}
                        <span className="mx-8 text-orange-400">⚠️</span>
                        {offlineText}
                        <span className="mx-8 text-orange-400">⚠️</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queued count badge */}
                {(syncStatus?.pendingOperations ?? 0) > 0 && (
                  <div className="flex-shrink-0 px-2 py-1 bg-orange-500/20 rounded text-xs font-bold text-orange-300">
                    {t('offline.pendingSync', { count: syncStatus?.pendingOperations })}
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4 text-orange-300" />
                </button>
              </div>
            </div>
          )}

          {/* SYNCING BANNER */}
          {shouldShowSyncBanner && (
            <div
              className="relative px-4 py-3"
              style={{
                background: 'rgba(18, 34, 18, 0.98)',
                borderBottom: '2px solid rgba(34, 197, 94, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Spinning sync icon */}
                <div className="flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-green-400 animate-spin" />
                </div>

                {/* Status text */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-green-300">
                      {t('offline.backOnline', 'Back online!')} {t('offline.syncing')} ({syncStatus?.pendingOperations ?? 0})
                    </span>
                    <span className="text-xs text-green-400/70">
                      {getProgress()}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-green-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgress()}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4 text-green-300" />
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS BANNER (brief) */}
          {shouldShowSuccessBanner && (
            <div
              className="relative px-4 py-3"
              style={{
                background: 'rgba(18, 34, 18, 0.98)',
                borderBottom: '2px solid rgba(34, 197, 94, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <Wifi className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">
                  {t('offline.backOnline', 'Back online!')} {t('offline.syncComplete')}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
