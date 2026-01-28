import { create } from 'zustand';
import { toast } from 'sonner';
import brain from 'brain';
import {
  DatePreset,
  ZReportConfig,
  ZReportData,
  CashDrawerOperation,
  PaidOutEntry,
  ZReportDateRange,
  CurrentBusinessDateResponse,
} from '../types/zReport';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ZReportConfig = {
  business_day_cutoff: '05:00:00',
  default_float: 100.0,
  timezone: 'Europe/London',
  require_drawer_count: true,
};

// ============================================================================
// BRAIN HELPERS — works on both web (HTTP→backend) and Electron (Supabase direct)
// ============================================================================

async function brainCall<T>(fn: () => Promise<any>): Promise<T> {
  const response = await fn();
  const data = await response.json();
  return data as T;
}

// ============================================================================
// DATE HELPERS
// ============================================================================

function getDateRangeForPreset(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { from: today, to: today };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    }

    case 'this_week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return { from: monday, to: today };
    }

    case 'last_7_days': {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      return { from: weekAgo, to: today };
    }

    case 'this_month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: monthStart, to: today };
    }

    case 'last_30_days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      return { from: thirtyDaysAgo, to: today };
    }

    case 'year_to_date': {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { from: yearStart, to: today };
    }

    case 'last_12_months': {
      const twelveMonthsAgo = new Date(today);
      twelveMonthsAgo.setMonth(today.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      return { from: twelveMonthsAgo, to: today };
    }

    default:
      return { from: today, to: today };
  }
}

function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// STORE TYPES
// ============================================================================

interface ZReportStore {
  // Configuration
  config: ZReportConfig | null;
  configLoading: boolean;

  // Date selection
  dateRange: ZReportDateRange;
  currentBusinessDate: CurrentBusinessDateResponse | null;

  // Report data
  reportData: ZReportData | null;
  isLoading: boolean;
  error: string | null;

  // Cash drawer inputs (local state for reconciliation form)
  cashCounted: number | null;
  localPaidOuts: PaidOutEntry[];
  notes: string;
  denominationBreakdown: Record<string, number> | null;

  // Actions - Configuration
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<ZReportConfig>) => Promise<boolean>;

  // Actions - Date selection
  setDatePreset: (preset: DatePreset) => void;
  setCustomDateRange: (from: Date, to: Date) => void;
  fetchCurrentBusinessDate: () => Promise<void>;

  // Actions - Report
  fetchReport: (businessDate?: string) => Promise<void>;
  refreshReport: () => Promise<void>;

  // Actions - Finalization
  setCashCounted: (amount: number | null) => void;
  setNotes: (notes: string) => void;
  finalizeReport: (closedBy?: string, verifiedBy?: string) => Promise<boolean>;

  // Actions - Paid-outs (local state)
  addLocalPaidOut: (description: string, amount: number) => void;
  removeLocalPaidOut: (id: string) => void;
  clearLocalPaidOuts: () => void;

  // Actions - Cash drawer operations (persisted to backend)
  recordPaidOut: (description: string, amount: number, staffName?: string) => Promise<boolean>;
  recordFloat: (amount: number, staffName?: string) => Promise<boolean>;
  deleteDrawerOperation: (operationId: string) => Promise<boolean>;

  // Actions - Staff cash count
  setDenominationBreakdown: (breakdown: Record<string, number> | null) => void;
  saveStaffCashCount: (closedBy: string) => Promise<boolean>;

  // Actions - Printing
  printReport: () => Promise<boolean>;

  // Actions - Reset
  reset: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useZReportStore = create<ZReportStore>((set, get) => ({
  // Initial state
  config: DEFAULT_CONFIG,
  configLoading: false,
  dateRange: {
    from: new Date(),
    to: new Date(),
    preset: 'today' as DatePreset,
  },
  currentBusinessDate: null,
  reportData: null,
  isLoading: false,
  error: null,
  cashCounted: null,
  localPaidOuts: [],
  notes: '',
  denominationBreakdown: null,

  // ============================================================================
  // CONFIGURATION ACTIONS
  // ============================================================================

  fetchConfig: async () => {
    set({ configLoading: true });
    try {
      const response = await brainCall<{ success: boolean; data: ZReportConfig }>(
        () => (brain as any).get_z_report_config()
      );
      if (response.success && response.data) {
        set({ config: response.data, configLoading: false });
      } else {
        set({ configLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch Z-Report config:', error);
      set({ configLoading: false });
    }
  },

  updateConfig: async (configUpdates) => {
    const currentConfig = get().config || DEFAULT_CONFIG;
    const newConfig = { ...currentConfig, ...configUpdates };

    try {
      const response = await brainCall<{ success: boolean }>(
        () => (brain as any).update_z_report_config(newConfig)
      );
      if (response.success) {
        set({ config: newConfig });
        toast.success('Z-Report settings updated');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update Z-Report config:', error);
      toast.error('Failed to update settings');
      return false;
    }
  },

  // ============================================================================
  // DATE SELECTION ACTIONS
  // ============================================================================

  setDatePreset: (preset) => {
    const { from, to } = getDateRangeForPreset(preset);
    set({
      dateRange: { from, to, preset },
      reportData: null,
      error: null,
    });
    // Auto-fetch report after changing date
    get().fetchReport(formatDateForAPI(from));
  },

  setCustomDateRange: (from, to) => {
    set({
      dateRange: { from, to, preset: 'custom' },
      reportData: null,
      error: null,
    });
    // Auto-fetch report after changing date
    get().fetchReport(formatDateForAPI(from));
  },

  fetchCurrentBusinessDate: async () => {
    try {
      const response = await brainCall<{ success: boolean; data: CurrentBusinessDateResponse }>(
        () => (brain as any).get_current_business_date()
      );
      if (response.success && response.data) {
        set({ currentBusinessDate: response.data });

        // Update date range to match current business date
        const businessDate = new Date(response.data.business_date);
        set({
          dateRange: {
            from: businessDate,
            to: businessDate,
            preset: 'today',
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch current business date:', error);
    }
  },

  // ============================================================================
  // REPORT ACTIONS
  // ============================================================================

  fetchReport: async (businessDate) => {
    const { dateRange } = get();

    set({ isLoading: true, error: null });

    try {
      const dateToFetch = businessDate || (dateRange.from ? formatDateForAPI(dateRange.from) : undefined);

      const response = await brainCall<{ success: boolean; data: ZReportData; message: string }>(
        () => (brain as any).generate_z_report({ business_date: dateToFetch })
      );

      if (response.success && response.data) {
        set({
          reportData: response.data,
          isLoading: false,
          error: null,
          // Reset cash counted when loading new report
          cashCounted: null,
          notes: response.data.notes || '',
        });
      } else {
        set({
          isLoading: false,
          error: response.message || 'Failed to generate report',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch report';
      console.error('Failed to fetch Z-Report:', error);
      set({ isLoading: false, error: message });
      toast.error(message);
    }
  },

  refreshReport: async () => {
    const { dateRange } = get();
    if (dateRange.from) {
      await get().fetchReport(formatDateForAPI(dateRange.from));
    }
  },

  // ============================================================================
  // FINALIZATION ACTIONS
  // ============================================================================

  setCashCounted: (amount) => {
    set({ cashCounted: amount });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  finalizeReport: async (closedBy, verifiedBy) => {
    const { reportData, cashCounted, notes } = get();

    if (!reportData) {
      toast.error('No report data to finalize');
      return false;
    }

    if (cashCounted === null) {
      toast.error('Please enter the cash counted');
      return false;
    }

    set({ isLoading: true });

    try {
      const response = await brainCall<{ success: boolean; data: ZReportData; message: string }>(
        () => (brain as any).finalize_z_report({
          business_date: reportData.business_date,
          actual_cash: cashCounted,
          notes: notes || undefined,
          closed_by: closedBy,
          verified_by: verifiedBy,
        })
      );

      if (response.success) {
        set({
          reportData: response.data,
          isLoading: false,
        });
        toast.success(`Z-Report ${response.data.report_number || ''} finalized`);
        return true;
      } else {
        set({ isLoading: false });
        toast.error(response.message || 'Failed to finalize report');
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finalize report';
      console.error('Failed to finalize Z-Report:', error);
      set({ isLoading: false });
      toast.error(message);
      return false;
    }
  },

  // ============================================================================
  // LOCAL PAID-OUT ACTIONS
  // ============================================================================

  addLocalPaidOut: (description, amount) => {
    const { localPaidOuts } = get();
    const newEntry: PaidOutEntry = {
      id: `local-${Date.now()}`,
      description,
      amount,
      createdAt: new Date(),
    };
    set({ localPaidOuts: [...localPaidOuts, newEntry] });
  },

  removeLocalPaidOut: (id) => {
    const { localPaidOuts } = get();
    set({ localPaidOuts: localPaidOuts.filter((p) => p.id !== id) });
  },

  clearLocalPaidOuts: () => {
    set({ localPaidOuts: [] });
  },

  // ============================================================================
  // CASH DRAWER OPERATION ACTIONS (PERSISTED)
  // ============================================================================

  recordPaidOut: async (description, amount, staffName) => {
    const { dateRange } = get();
    const businessDate = dateRange.from ? formatDateForAPI(dateRange.from) : undefined;

    try {
      const response = await brainCall<{ success: boolean }>(
        () => (brain as any).record_cash_drawer_operation({
          operation_type: 'PAID_OUT',
          amount,
          reason: description,
          staff_name: staffName,
          business_date: businessDate,
        })
      );

      if (response.success) {
        toast.success('Paid-out recorded');
        await get().refreshReport();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to record paid-out:', error);
      toast.error('Failed to record paid-out');
      return false;
    }
  },

  recordFloat: async (amount, staffName) => {
    const { dateRange } = get();
    const businessDate = dateRange.from ? formatDateForAPI(dateRange.from) : undefined;

    try {
      const response = await brainCall<{ success: boolean }>(
        () => (brain as any).record_cash_drawer_operation({
          operation_type: 'FLOAT',
          amount,
          reason: 'Opening float',
          staff_name: staffName,
          business_date: businessDate,
        })
      );

      if (response.success) {
        toast.success('Float recorded');
        await get().refreshReport();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to record float:', error);
      toast.error('Failed to record float');
      return false;
    }
  },

  deleteDrawerOperation: async (operationId) => {
    try {
      const response = await brainCall<{ success: boolean }>(
        () => (brain as any).delete_cash_drawer_operation({ operation_id: operationId })
      );
      if (response.success) {
        toast.success('Operation deleted');
        await get().refreshReport();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete operation:', error);
      toast.error('Failed to delete operation');
      return false;
    }
  },

  // ============================================================================
  // STAFF CASH COUNT ACTIONS
  // ============================================================================

  setDenominationBreakdown: (breakdown) => {
    set({ denominationBreakdown: breakdown });
  },

  saveStaffCashCount: async (closedBy) => {
    const { reportData, cashCounted, denominationBreakdown, notes, dateRange } = get();

    if (!reportData || cashCounted === null) {
      toast.error('Please count cash first');
      return false;
    }

    const businessDate = dateRange.from ? formatDateForAPI(dateRange.from) : reportData.business_date;

    set({ isLoading: true });

    try {
      const response = await brainCall<{ success: boolean; message: string }>(
        () => (brain as any).save_staff_cash_count({
          business_date: businessDate,
          staff_cash_counted: cashCounted,
          staff_closed_by: closedBy,
          denomination_breakdown: denominationBreakdown,
          notes: notes || undefined,
        })
      );

      if (response.success) {
        toast.success('Cash count saved');
        set({ isLoading: false });
        await get().refreshReport();
        return true;
      } else {
        set({ isLoading: false });
        toast.error(response.message || 'Failed to save cash count');
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save cash count';
      console.error('Failed to save staff cash count:', error);
      set({ isLoading: false });
      toast.error(message);
      return false;
    }
  },

  // ============================================================================
  // PRINT ACTIONS
  // ============================================================================

  printReport: async () => {
    const { reportData, dateRange } = get();

    if (!reportData) {
      toast.error('No report data to print');
      return false;
    }

    try {
      const businessDate = dateRange.from ? formatDateForAPI(dateRange.from) : reportData.business_date;

      const response = await brainCall<{ success: boolean; message: string }>(
        () => (brain as any).print_z_report({
          business_date: businessDate,
          report_data: reportData,
        })
      );

      if (response.success) {
        toast.success('Z-Report sent to printer');
        return true;
      } else {
        toast.error(response.message || 'Print failed');
        return false;
      }
    } catch (error) {
      console.error('Failed to print Z-Report:', error);
      toast.error('Failed to print Z-Report');
      return false;
    }
  },

  // ============================================================================
  // RESET
  // ============================================================================

  reset: () => {
    set({
      reportData: null,
      isLoading: false,
      error: null,
      cashCounted: null,
      localPaidOuts: [],
      notes: '',
      denominationBreakdown: null,
      dateRange: {
        from: new Date(),
        to: new Date(),
        preset: 'today',
      },
    });
  },
}));

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Auto-initialize the store when first used
 */
let hasInitialized = false;

export function useZReportInit() {
  const { fetchConfig, fetchCurrentBusinessDate, fetchReport } = useZReportStore();

  if (!hasInitialized) {
    hasInitialized = true;
    fetchConfig().catch(console.error);
    fetchCurrentBusinessDate()
      .then(() => fetchReport())
      .catch(console.error);
  }
}

/**
 * Hook to get computed cash drawer values
 */
export function useCashDrawerCalculations() {
  const { reportData, cashCounted, localPaidOuts } = useZReportStore();

  const openingFloat = reportData?.cash_drawer?.opening_float ?? 100;
  const cashSales = reportData?.cash_drawer?.cash_sales ?? 0;
  const cashRefunds = reportData?.cash_drawer?.cash_refunds ?? 0;
  const persistedPaidOuts = reportData?.cash_drawer?.paid_outs ?? 0;
  const paidIns = reportData?.cash_drawer?.paid_ins ?? 0;
  const safeDrops = reportData?.cash_drawer?.safe_drops ?? 0;

  // Add local (unsaved) paid-outs to the calculation
  const localPaidOutsTotal = localPaidOuts.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidOuts = persistedPaidOuts + localPaidOutsTotal;

  const expectedCash = openingFloat + cashSales - cashRefunds - totalPaidOuts + paidIns - safeDrops;
  const variance = cashCounted !== null ? cashCounted - expectedCash : null;

  return {
    openingFloat,
    cashSales,
    cashRefunds,
    persistedPaidOuts,
    localPaidOutsTotal,
    totalPaidOuts,
    paidIns,
    safeDrops,
    expectedCash: Math.round(expectedCash * 100) / 100,
    actualCash: cashCounted,
    variance: variance !== null ? Math.round(variance * 100) / 100 : null,
  };
}
