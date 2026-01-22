/**
 * On-Demand Printer Service
 * 
 * Replaces continuous polling with on-demand printer status checks
 * Only checks printer status when actually needed (e.g., before printing)
 * Includes caching to prevent repeated API calls
 */

import { create } from 'zustand';
import brain from 'brain';
import { createLogger } from './logger';

const logger = createLogger('OnDemandPrinterService');

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface PrinterStatusCache {
  connected: boolean;
  status: string;
  queuedJobs: number;
  error: string | null;
  lastChecked: Date;
  helper_app_running: boolean;
  system_status: any;
}

interface OnDemandPrinterState {
  cachedStatus: PrinterStatusCache | null;
  isChecking: boolean;
  lastError: string | null;
  
  // Actions
  checkPrinterStatus: () => Promise<PrinterStatusCache>;
  clearCache: () => void;
  isStatusFresh: () => boolean;
}

// On-demand printer service store
export const useOnDemandPrinterService = create<OnDemandPrinterState>((set, get) => ({
  cachedStatus: null,
  isChecking: false,
  lastError: null,
  
  // Check if cached status is still fresh (within cache duration)
  isStatusFresh: () => {
    const state = get();
    if (!state.cachedStatus) return false;
    
    const timeSinceCheck = Date.now() - state.cachedStatus.lastChecked.getTime();
    return timeSinceCheck < CACHE_DURATION;
  },
  
  // On-demand printer status check with caching
  checkPrinterStatus: async () => {
    const state = get();
    
    // Return cached status if still fresh
    if (state.isStatusFresh() && state.cachedStatus) {
      logger.debug('Returning cached printer status');
      return state.cachedStatus;
    }
    
    // Prevent concurrent checks
    if (state.isChecking) {
      logger.debug('Printer status check already in progress, waiting...');
      // Wait for current check to complete
      while (get().isChecking) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return get().cachedStatus!;
    }
    
    set({ isChecking: true, lastError: null });
    
    try {
      logger.info('Performing on-demand printer status check...');
      const startTime = performance.now();
      
      // Only check essential endpoints with timeout
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Printer check timeout')), 8000)
      );
      
      const [healthResponse, jobsResponse] = await Promise.race([
        Promise.all([
          brain.check_printer_health(),
          brain.get_print_jobs({ limit: 10 }) // Limit to reduce response time
        ]),
        timeoutPromise
      ]);
      
      const [healthData, jobsData] = await Promise.all([
        healthResponse.json(),
        jobsResponse.json()
      ]);
      
      const pendingJobs = jobsData.jobs ? jobsData.jobs.filter(job => 
        job.status === 'pending' || job.status === 'processing'
      ).length : 0;
      
      const newStatus: PrinterStatusCache = {
        connected: healthData.status === 'healthy',
        status: healthData.status || 'disconnected',
        queuedJobs: pendingJobs,
        error: healthData.error || null,
        lastChecked: new Date(),
        helper_app_running: false, // Simplified - don't check helper app unless needed
        system_status: 'simplified' // Simplified status
      };
      
      const duration = performance.now() - startTime;
      logger.info(`On-demand printer check completed in ${duration.toFixed(2)}ms`, {
        status: newStatus.status,
        queuedJobs: newStatus.queuedJobs
      });
      
      set({ 
        cachedStatus: newStatus,
        isChecking: false,
        lastError: null
      });
      
      return newStatus;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('On-demand printer check failed', error);
      
      // Return a fallback status on error
      const fallbackStatus: PrinterStatusCache = {
        connected: false,
        status: 'error',
        queuedJobs: 0,
        error: errorMessage,
        lastChecked: new Date(),
        helper_app_running: false,
        system_status: 'error'
      };
      
      set({ 
        cachedStatus: fallbackStatus,
        isChecking: false,
        lastError: errorMessage
      });
      
      return fallbackStatus;
    }
  },
  
  // Clear cached status (force fresh check next time)
  clearCache: () => {
    logger.debug('Clearing printer status cache');
    set({ cachedStatus: null, lastError: null });
  }
}));

// Hook for components that need on-demand printer status
export const useOnDemandPrinter = () => {
  const { cachedStatus, isChecking, lastError, checkPrinterStatus, clearCache, isStatusFresh } = useOnDemandPrinterService();
  
  // Return structure compatible with existing components
  return {
    // Current status (may be cached) - compatible format
    printerStatus: {
      connected: cachedStatus?.connected || false,
      status: cachedStatus?.status || 'disconnected',
      lastChecked: cachedStatus?.lastChecked || null,
      queuedJobs: cachedStatus?.queuedJobs || 0,
      error: cachedStatus?.error || null
    },
    isChecking,
    lastError,
    isStatusFresh: isStatusFresh(),
    
    // Actions
    checkStatus: checkPrinterStatus,
    clearCache,
    
    // Helper method for pre-print checks
    ensurePrinterReady: async () => {
      const status = await checkPrinterStatus();
      if (!status.connected) {
        throw new Error(`Printer not available: ${status.error || status.status}`);
      }
      return status;
    }
  };
};

// Utility function for print operations
export const checkPrinterBeforePrint = async (): Promise<boolean> => {
  try {
    const printerService = useOnDemandPrinterService.getState();
    const status = await printerService.checkPrinterStatus();
    return status.connected && status.status === 'healthy';
  } catch (error) {
    logger.error('Pre-print check failed', error);
    return false;
  }
};
