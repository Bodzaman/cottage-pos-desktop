import { create } from 'zustand';
import { apiClient } from 'app';
import { createLogger } from './logger';

const logger = createLogger('PollingService');

// Lightweight state interface - NO PRINTER STATUS
interface PollingState {
  // System Status (lightweight health only)
  systemStatus: {
    helper_app_running: boolean;
    system_status: string;
    lastChecked: Date | null;
  };
  
  // Polling state
  isPolling: boolean;
  lastPollAttempt: Date | null;
  pollIntervalId: NodeJS.Timeout | null;
  
  // Actions
  startPolling: () => void;
  stopPolling: () => void;
  checkStatus: () => Promise<void>;
}

// Lightweight polling service (NO HEAVY API CALLS)
export const usePollingService = create<PollingState>((set, get) => ({
  // Initial state
  systemStatus: {
    helper_app_running: false,
    system_status: 'unknown',
    lastChecked: null
  },
  
  isPolling: false,
  lastPollAttempt: null,
  pollIntervalId: null,
  
  // Start lightweight polling (60s interval)
  startPolling: () => {
    const state = get();
    
    if (state.isPolling) {
      logger.debug('Lightweight polling already active');
      return;
    }
    
    logger.info('Starting lightweight polling (60s interval, health check only)');
    
    // Initial check
    get().checkStatus();
    
    // Set up 60-second interval
    const intervalId = setInterval(() => {
      get().checkStatus();
    }, 60000);
    
    set({
      isPolling: true,
      pollIntervalId: intervalId
    });
  },
  
  // Stop polling
  stopPolling: () => {
    const state = get();
    
    if (state.pollIntervalId) {
      clearInterval(state.pollIntervalId);
      logger.info('Stopped lightweight polling');
    }
    
    set({
      isPolling: false,
      pollIntervalId: null
    });
  },
  
  // LIGHTWEIGHT ONLY - just basic health endpoint
  checkStatus: async () => {
    try {
      logger.debug('Lightweight health check only...');
      
      // ONLY call basic health endpoint with timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Health timeout')), 5000)
      );
      
      const healthResponse = await Promise.race([
        apiClient.check_printer_health(),
        timeoutPromise
      ]);
      
      const healthData = await healthResponse.json();
      
      const newSystemStatus = {
        helper_app_running: healthData.status === 'healthy',
        system_status: healthData.status || 'offline',
        lastChecked: new Date()
      };
      
      // Only log on status change
      const state = get();
      if (state.systemStatus.system_status !== newSystemStatus.system_status) {
        logger.info('System status changed', {
          from: state.systemStatus.system_status,
          to: newSystemStatus.system_status
        });
      }
      
      set({
        systemStatus: newSystemStatus,
        lastPollAttempt: new Date()
      });
      
    } catch (error) {
      // Expected when services are offline
      set({
        systemStatus: {
          helper_app_running: false,
          system_status: 'offline',
          lastChecked: new Date()
        },
        lastPollAttempt: new Date()
      });
    }
  }
}));

// Hook for lightweight system status only
export const useSystemStatus = () => {
  const { systemStatus, startPolling, checkStatus } = usePollingService();
  
  // Auto-start polling when first component mounts
  useEffect(() => {
    startPolling();
  }, [startPolling]);
  
  return {
    systemStatus,
    refreshStatus: checkStatus
  };
};

// Effect hook for React
import { useEffect } from 'react';

// Cleanup function for app shutdown
export const cleanupPollingService = () => {
  usePollingService.getState().stopPolling();
};

// DEPRECATED: Heavy printer status polling removed
// Use useOnDemandPrinter from onDemandPrinterService.ts instead
export const usePrinterStatus = () => {
  logger.warn('usePrinterStatus is deprecated. Use useOnDemandPrinter for on-demand checks.');
  
  return {
    printerStatus: {
      connected: false,
      status: 'use-on-demand-service',
      lastChecked: null,
      queuedJobs: 0,
      error: 'Use onDemandPrinterService instead'
    },
    refreshStatus: () => Promise.resolve()
  };
};
