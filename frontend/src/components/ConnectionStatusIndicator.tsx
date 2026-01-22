import React from 'react';
import { HiWifi } from 'react-icons/hi';
import { WifiOff } from 'lucide-react';
import { useConnectionStatus } from '../utils/connectionStatus';

export function ConnectionStatusIndicator() {
  const isOnline = useConnectionStatus();
  
  if (isOnline) return null; // Don't show anything if online
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-red-900/80 backdrop-blur-sm text-white py-2 px-4 rounded-md shadow-lg flex items-center gap-2 border border-red-700">
      <WifiOff size={18} />
      <span className="text-sm font-medium">You're offline</span>
    </div>
  );
}