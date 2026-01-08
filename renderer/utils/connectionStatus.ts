import React from 'react';
import { create } from 'zustand';
import { ConnectionStatusIndicator } from '../components/ConnectionStatusIndicator';

interface ConnectionStore {
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  isOnline: navigator.onLine,
  setIsOnline: (status) => set({ isOnline: status }),
}));

export const useConnectionStatus = () => {
  const { isOnline, setIsOnline } = useConnectionStore();
  
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);
  
  return isOnline;
};
