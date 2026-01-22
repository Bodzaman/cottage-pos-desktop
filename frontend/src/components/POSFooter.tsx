import React, { useState, useEffect } from 'react';
import brain from 'brain';
import { QSAITheme, styles } from 'utils/QSAIDesign';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { createLogger, quickLog } from 'utils/logger';
import { useSystemStatus } from 'utils/pollingService';
// NEW: Import offline status utilities
import { getOfflineStatus, onOfflineStatusChange } from '../utils/serviceWorkerManager';
import { outboxSyncManager } from '../utils/outboxSyncManager';
import type { OutboxSyncStatus } from '../utils/outboxSyncManager';

interface POSFooterProps {
  className?: string;
  currentOrderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "ONLINE_ORDERS";
}

/**
 * Professional footer for POSDesktop with complete operational status dashboard
 * Four-section layout: System Status | Operational Status | Branding | Date & Time
 */
export function POSFooter({ className = '', currentOrderType = 'DINE-IN' }: POSFooterProps) {
  const logger = createLogger('POSFooter');
  
  // Time state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ✅ REPLACED: Individual printer polling with centralized service
  const { systemStatus: centralizedSystemStatus } = useSystemStatus();
  
  // ✅ REMOVED: Individual printer status state
  // const [printerStatus, setPrinterStatus] = useState<{
  //   connected: boolean;
  //   loading: boolean;
  // }>({ connected: true, loading: false });
  
  // Map centralized system status to local printer status format
  const printerStatus = {
    connected: centralizedSystemStatus.system_status === 'healthy' || centralizedSystemStatus.helper_app_running,
    loading: false
  };

  // NEW: Offline status monitoring
  const [isOffline, setIsOffline] = useState(getOfflineStatus());
  const [offlineSyncStatus, setOfflineSyncStatus] = useState<OutboxSyncStatus | null>(null);
  
  const [internetStatus, setInternetStatus] = useState<{
    online: boolean;
    loading: boolean;
  }>({ online: navigator.onLine, loading: false });
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    loading: boolean;
  }>({ connected: true, loading: false }); // Assume connected by default
  
  // Get table orders from store for active table count - SAFE ACCESS
  const tableOrdersStore = useTableOrdersStore();
  const persistedTableOrders = tableOrdersStore?.persistedTableOrders ?? {};
  
  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================
  
  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // NEW: Monitor offline status changes
  useEffect(() => {
    const unsubscribeOffline = onOfflineStatusChange((offline) => {
      setIsOffline(offline);
      // Update internet status to match offline status
      setInternetStatus({ online: !offline, loading: false });
    });
    
    // Monitor sync status
    const unsubscribeSync = outboxSyncManager.onStatusChange((status) => {
      setOfflineSyncStatus(status);
    });
    
    // Initial status fetch
    outboxSyncManager.getStatus().then(setOfflineSyncStatus).catch(console.error);
    
    return () => {
      unsubscribeOffline();
      unsubscribeSync();
    };
  }, []);
  
  // ✅ REMOVED: Individual printer status polling useEffect
  // useEffect(() => {
  //   const checkPrinterStatus = async () => { ... };
  //   checkPrinterStatus();
  //   const interval = setInterval(checkPrinterStatus, 30000);
  //   return () => clearInterval(interval);
  // }, []);
  
  // Monitor internet connectivity
  useEffect(() => {
    const handleOnline = () => setInternetStatus({ online: true, loading: false });
    const handleOffline = () => setInternetStatus({ online: false, loading: false });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // ✅ REMOVED: Stripe status check causing console errors
  // The problematic useEffect that was trying to fetch from https://api.stripe.com
  // This was causing "getCORSEnabled() (Not Found)" and "waitTillPageLoad() (Not Found)" errors
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  // Calculate active tables count
  const getActiveTablesCount = (): number => {
    if (!persistedTableOrders || typeof persistedTableOrders !== 'object') {
      return 0;
    }
    
    try {
      return Object.keys(persistedTableOrders).filter(tableNumber => {
        const orders = persistedTableOrders[parseInt(tableNumber)];
        return orders && Array.isArray(orders) && orders.length > 0;
      }).length;
    } catch (error) {
      console.error('POSFooter: Error calculating active tables count:', error);
      return 0;
    }
  };
  
  // Format current time
  const formatDateTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleDateString('en-GB', options).replace(',', ' |');
  };

  // Format time as HH:MM:SS
  const formatTimeOnly = (date: Date): string => {
    return date.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get overall system status
  const getSystemStatus = (): { label: string; color: string } => {
    // NEW: Check offline status first
    if (isOffline) {
      const hasPendingOps = (offlineSyncStatus?.pendingOperations || 0) > 0;
      
      if (hasPendingOps) {
        return { label: 'Offline • Queued', color: 'text-yellow-400' };
      }
      return { label: 'Offline • Ready', color: 'text-orange-400' };
    }
    
    const allConnected = printerStatus.connected && internetStatus.online && stripeStatus.connected;
    const anyLoading = printerStatus.loading || internetStatus.loading || stripeStatus.loading;
    const isSyncing = offlineSyncStatus?.isSyncing;
    
    if (isSyncing) {
      return { label: 'Syncing', color: 'text-blue-400' };
    }
    if (anyLoading) {
      return { label: 'Checking', color: 'text-qsai-text-muted' };
    }
    if (allConnected) {
      return { label: 'Ready', color: 'text-qsai-text-primary' };
    }
    return { label: 'Issues', color: 'text-red-400' };
  };

  const systemStatus = getSystemStatus();
  
  // Get order type display config
  const getOrderTypeConfig = (orderType: string) => {
    const configs = {
      'DINE-IN': { label: 'DINE-IN', color: QSAITheme.purple.primary },
      'DELIVERY': { label: 'DELIVERY', color: '#10B981' },
      'COLLECTION': { label: 'COLLECTION', color: '#F59E0B' },
      'WAITING': { label: 'WAITING', color: '#8B5CF6' },
      'ONLINE_ORDERS': { label: 'ONLINE', color: QSAITheme.purple.dark }
    };
    
    return configs[orderType as keyof typeof configs] || { label: orderType, color: QSAITheme.text.muted };
  };
  
  // Get status indicator with loading states - CLEANER VERSION
  const StatusIndicator = ({ 
    connected, 
    loading, 
    icon, 
    label,
    extraInfo
  }: { 
    connected: boolean; 
    loading: boolean; 
    icon: string;
    label: string;
    extraInfo?: string;
  }) => (
    <div className="flex items-center gap-1 group relative">
      <span className="text-base">{icon}</span>
      <div 
        className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
          loading ? 'bg-yellow-500 animate-pulse' : 
          connected ? 'bg-green-500' : 'bg-red-500'
        }`} 
      />
      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {label}: {loading ? 'Checking...' : connected ? 'Connected' : 'Disconnected'}
        {extraInfo && <div className="text-gray-300">{extraInfo}</div>}
      </div>
    </div>
  );
  
  // NEW: Offline mode indicator
  const OfflineModeIndicator = () => {
    if (!isOffline) return null;
    
    const pendingOps = offlineSyncStatus?.pendingOperations || 0;
    
    return (
      <div className="flex items-center gap-1.5 group relative">
        <span className="text-sm">📵</span>
        <span className="text-xs font-bold text-orange-400 bg-orange-400/20 px-1.5 py-0.5 rounded text-center min-w-[20px]">
          {pendingOps}
        </span>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          <div>Offline Mode Active</div>
          {pendingOps > 0 && (
            <div className="text-orange-300">
              {pendingOps} orders queued
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const activeTablesCount = getActiveTablesCount();
  const orderTypeConfig = getOrderTypeConfig(currentOrderType);
  
  return (
    <footer 
      className={`
        h-10 
        ${QSAITheme.background.panel} 
        border-t border-qsai-purple/10
        px-4 py-2
        flex items-center justify-between
        ${className}
      `}
      style={{
        background: isOffline ? 'rgba(34, 18, 18, 0.95)' : 'rgba(18, 18, 18, 0.95)', // Slightly red tint when offline
        backdropFilter: 'blur(8px)',
        boxShadow: '0 -1px 3px rgba(0,0,0,0.3)',
        borderTop: isOffline ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(124, 93, 250, 0.1)'
      }}
    >
      {/* Far Left - Operational Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🏠</span>
          <span className="text-xs font-bold text-qsai-text-primary bg-qsai-purple/20 px-1.5 py-0.5 rounded text-center min-w-[20px]">
            {activeTablesCount}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📋</span>
          <span 
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: orderTypeConfig.color }}
          >
            {orderTypeConfig.label}
          </span>
        </div>
        
        {/* NEW: Offline mode indicator */}
        <OfflineModeIndicator />
      </div>
      
      {/* Center - Branding */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <span 
          className="text-xs font-medium tracking-wide"
          style={{
            backgroundImage: isOffline 
              ? 'linear-gradient(135deg, rgba(255, 200, 200, 1) 0%, rgba(255, 200, 200, 0.7) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: isOffline 
              ? '0 0 10px rgba(239, 68, 68, 0.2)'
              : '0 0 10px rgba(124, 93, 250, 0.2)',
            letterSpacing: '0.02em'
          }}
        >
          powered by QuickServe AI{isOffline ? ' • Offline Mode' : ''}
        </span>
      </div>
      
      {/* Right Section - System Status + Date & Time */}
      <div className="flex items-center gap-4">
        {/* System Status Icons */}
        <div className="flex items-center gap-3">
          <StatusIndicator
            connected={printerStatus.connected}
            loading={printerStatus.loading}
            icon="🖨️"
            label="Printer"
          />
          
          <StatusIndicator
            connected={internetStatus.online}
            loading={internetStatus.loading}
            icon="📶"
            label="Internet"
            extraInfo={isOffline ? 'Offline Mode Active' : undefined}
          />
          
          <StatusIndicator
            connected={stripeStatus.connected && !isOffline}
            loading={stripeStatus.loading}
            icon="💳"
            label="Payments"
          />
          
          {/* NEW: Sync status indicator when online */}
          {!isOffline && (offlineSyncStatus?.isSyncing) && (
            <div className="flex items-center gap-1">
              <span className="text-sm animate-spin">🔄</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Date & Time */}
        <div className="flex items-center">
          <span className="text-xs font-medium text-qsai-text-primary" style={{ letterSpacing: '0.02em' }}>
            System Status{' '}
            <span className={`${systemStatus.color}`}>
              • {systemStatus.label}
            </span>
            {' | '}
            <span className="text-qsai-text-primary">
              {formatTimeOnly(currentTime)}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
