


/**
 * Offline Status Indicator Component
 * 
 * Provides visual feedback for offline/online status and sync operations
 * Used throughout the POS interface to inform users of connectivity status
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  CloudOff,
  CloudUpload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { offlineSync, SyncStatus } from '../utils/offlineSync';
import { globalColors, designColors } from '../utils/QSAIDesign';

interface OfflineStatusProps {
  variant?: 'badge' | 'full' | 'minimal';
  showStats?: boolean;
  className?: string;
}

export function OfflineStatusIndicator({ 
  variant = 'badge', 
  showStats = false, 
  className = '' 
}: OfflineStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineSync.getSyncStatus());
  const [storageStats, setStorageStats] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = offlineSync.onSyncStatusChange(setSyncStatus);
    
    // Load initial storage stats
    if (showStats) {
      loadStorageStats();
    }
    
    return unsubscribe;
  }, [showStats]);

  const loadStorageStats = async () => {
    try {
      const stats = await offlineSync.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('❌ Failed to load storage stats:', error);
    }
  };

  const handleForceSync = async () => {
    if (syncStatus.isOnline && !syncStatus.isCurrentlySyncing) {
      await offlineSync.forceSync();
      if (showStats) {
        await loadStorageStats();
      }
    }
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return '#EF4444'; // Red for offline
    if (syncStatus.isCurrentlySyncing) return '#F59E0B'; // Orange for syncing
    if (syncStatus.syncError) return '#EF4444'; // Red for errors
    if (syncStatus.pendingOperations > 0) return '#F59E0B'; // Orange for pending
    return '#10B981'; // Green for online and synced
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline Mode';
    if (syncStatus.isCurrentlySyncing) return 'Syncing...';
    if (syncStatus.syncError) return 'Sync Error';
    if (syncStatus.pendingOperations > 0) return `${syncStatus.pendingOperations} Pending`;
    return 'Online & Synced';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="h-4 w-4" />;
    if (syncStatus.isCurrentlySyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (syncStatus.syncError) return <AlertTriangle className="h-4 w-4" />;
    if (syncStatus.pendingOperations > 0) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Badge variant - minimal status indicator
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${className}`}
              style={{
                background: `linear-gradient(135deg, ${getStatusColor()} 0%, ${getStatusColor()}cc 100%)`,
                boxShadow: `0 4px 12px ${getStatusColor()}33`
              }}
              onClick={() => setShowDetails(!showDetails)}
            >
              {getStatusIcon()}
              <span className="text-sm font-medium text-white">
                {getStatusText()}
              </span>
              {syncStatus.pendingOperations > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                  {syncStatus.pendingOperations}
                </Badge>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">{getStatusText()}</p>
              {syncStatus.lastSuccessfulSync && (
                <p className="text-xs opacity-75 mt-1">
                  Last sync: {new Date(syncStatus.lastSuccessfulSync).toLocaleTimeString()}
                </p>
              )}
              {syncStatus.syncError && (
                <p className="text-xs text-red-300 mt-1">
                  Error: {syncStatus.syncError}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Minimal variant - just icon and color
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center justify-center w-8 h-8 rounded-full ${className}`}
        style={{ backgroundColor: getStatusColor() }}
      >
        {getStatusIcon()}
      </motion.div>
    );
  }

  // Full variant - comprehensive status display
  return (
    <Card className={`${className}`} style={{ borderColor: designColors.border.primary }}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${getStatusColor()}20` }}
              >
                <div style={{ color: getStatusColor() }}>
                  {getStatusIcon()}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-white">{getStatusText()}</h3>
                <p className="text-sm opacity-75">
                  {syncStatus.isOnline ? 'Connected to server' : 'Working offline'}
                </p>
              </div>
            </div>
            
            {syncStatus.isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleForceSync}
                disabled={syncStatus.isCurrentlySyncing}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {syncStatus.isCurrentlySyncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync Now
              </Button>
            )}
          </div>

          {/* Sync Progress */}
          {syncStatus.isCurrentlySyncing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-75">Synchronizing data...</span>
                <CloudUpload className="h-4 w-4 opacity-75" />
              </div>
              <Progress value={50} className="h-2" /> {/* Indeterminate progress */}
            </motion.div>
          )}

          {/* Error Display */}
          {syncStatus.syncError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-red-500/20 border border-red-500/30"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-300">Sync Error</p>
                  <p className="text-red-200 opacity-75">{syncStatus.syncError}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Storage Stats */}
          {showStats && storageStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center gap-2 text-sm font-medium opacity-75">
                <Database className="h-4 w-4" />
                Local Storage Statistics
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="opacity-75">Total Orders:</span>
                    <span className="font-medium">{storageStats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Pending Sync:</span>
                    <span className="font-medium text-orange-400">{storageStats.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Failed Sync:</span>
                    <span className="font-medium text-red-400">{storageStats.failedOrders}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="opacity-75">Cached Menu:</span>
                    <span className="font-medium">{storageStats.cachedMenuItems} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Cache Age:</span>
                    <span className="font-medium">{storageStats.cacheAge || 'Fresh'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Sync Queue:</span>
                    <span className="font-medium">{storageStats.pendingSyncOps}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Offline Mode Notice */}
          {!syncStatus.isOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30"
            >
              <div className="flex items-start gap-2">
                <CloudOff className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-300">Offline Mode Active</p>
                  <p className="text-blue-200 opacity-75">
                    Orders will be saved locally and synced when connection is restored.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Last Sync Info */}
          {syncStatus.lastSuccessfulSync && (
            <div className="text-xs opacity-50 text-center">
              Last successful sync: {new Date(syncStatus.lastSuccessfulSync).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified hook for checking offline status
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineSync.getSyncStatus());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubscribeSync = offlineSync.onSyncStatusChange(setSyncStatus);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
    };
  }, []);

  return {
    isOnline,
    syncStatus,
    hasPendingSync: syncStatus.pendingOperations > 0,
    hasErrors: !!syncStatus.syncError || syncStatus.failedOperations > 0,
    isCurrentlySyncing: syncStatus.isCurrentlySyncing
  };
}

// Component for showing offline mode banner
export function OfflineModeBanner() {
  const { isOnline, syncStatus } = useOfflineStatus();
  
  if (isOnline) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-[#8B1538]/20 border-b border-[#8B1538]/30 px-6 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CloudOff className="h-5 w-5 text-[#B47D7D]" />
            <div>
              <p className="font-medium text-[#CDA3A3]">Working Offline</p>
              <p className="text-sm text-[#B47D7D] opacity-75">
                Orders are being saved locally and will sync when connection is restored.
              </p>
            </div>
          </div>
          
          {syncStatus.pendingOperations > 0 && (
            <Badge variant="secondary" className="bg-[#8B1538]/20 text-[#CDA3A3]">
              {syncStatus.pendingOperations} pending
            </Badge>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
