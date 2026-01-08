import { useState, useEffect } from 'react';

/**
 * useOfflineStatus - Network status monitoring
 * 
 * Returns:
 * - isOnline: boolean - Current network status
 * - wasOffline: boolean - Was offline at some point (useful for showing sync messages)
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🌐 Network: Back online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📡 Network: Offline');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
