/**
 * Z-Report React Query Hooks
 *
 * React Query-based data fetching for Z-Report configuration and data.
 * Complements the Zustand store which handles UI state.
 *
 * Architecture:
 * - React Query: Config, business date, report data fetching
 * - Zustand (zReportStore): UI state, local paid-outs, form inputs
 *
 * Benefits:
 * - Automatic cache management with staleTime/gcTime
 * - Request deduplication built-in
 * - Background refetch on window focus
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import brain from 'brain';
import type {
  ZReportConfig,
  ZReportData,
  CurrentBusinessDateResponse,
} from '../types/zReport';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const zReportKeys = {
  all: ['z-report'] as const,
  config: () => [...zReportKeys.all, 'config'] as const,
  businessDate: () => [...zReportKeys.all, 'business-date'] as const,
  report: (businessDate?: string) => [...zReportKeys.all, 'report', { businessDate }] as const,
};

// ==============================================================================
// DEFAULTS
// ==============================================================================

const DEFAULT_CONFIG: ZReportConfig = {
  business_day_cutoff: '05:00:00',
  default_float: 100.0,
  timezone: 'Europe/London',
  require_drawer_count: true,
};

// ==============================================================================
// BRAIN HELPER
// ==============================================================================

async function brainCall<T>(fn: () => Promise<any>): Promise<T> {
  const response = await fn();
  const data = await response.json();
  return data as T;
}

// ==============================================================================
// FETCHERS
// ==============================================================================

async function fetchZReportConfig(): Promise<ZReportConfig> {
  const response = await brainCall<{ success: boolean; data: ZReportConfig }>(
    () => (brain as any).get_z_report_config()
  );
  if (response.success && response.data) {
    console.log('[zReportQueries] Config fetched successfully');
    return response.data;
  }
  return DEFAULT_CONFIG;
}

async function fetchCurrentBusinessDate(): Promise<CurrentBusinessDateResponse | null> {
  const response = await brainCall<{ success: boolean; data: CurrentBusinessDateResponse }>(
    () => (brain as any).get_current_business_date()
  );
  if (response.success && response.data) {
    console.log('[zReportQueries] Business date fetched:', response.data.business_date);
    return response.data;
  }
  return null;
}

async function fetchZReport(businessDate?: string): Promise<ZReportData | null> {
  const response = await brainCall<{ success: boolean; data: ZReportData; message: string }>(
    () => (brain as any).generate_z_report({ business_date: businessDate })
  );
  if (response.success && response.data) {
    console.log('[zReportQueries] Report fetched for date:', businessDate);
    return response.data;
  }
  throw new Error(response.message || 'Failed to generate report');
}

// ==============================================================================
// QUERY HOOKS
// ==============================================================================

/**
 * Hook to fetch Z-Report configuration.
 */
export function useZReportConfigQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: zReportKeys.config(),
    queryFn: fetchZReportConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000,   // 1 hour
    enabled: options?.enabled ?? true,
    placeholderData: DEFAULT_CONFIG,
  });
}

/**
 * Hook to fetch current business date.
 */
export function useCurrentBusinessDateQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: zReportKeys.businessDate(),
    queryFn: fetchCurrentBusinessDate,
    staleTime: 60 * 1000, // 1 minute (business date can change)
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch Z-Report data for a specific business date.
 */
export function useZReportQuery(businessDate?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: zReportKeys.report(businessDate),
    queryFn: () => fetchZReport(businessDate),
    staleTime: 30 * 1000, // 30 seconds (report data changes frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: (options?.enabled ?? true) && !!businessDate,
    retry: 1,
  });
}

// ==============================================================================
// MUTATION HOOKS
// ==============================================================================

/**
 * Hook to update Z-Report config.
 */
export function useUpdateZReportConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configUpdates: Partial<ZReportConfig>) => {
      const currentConfig = queryClient.getQueryData<ZReportConfig>(zReportKeys.config()) || DEFAULT_CONFIG;
      const newConfig = { ...currentConfig, ...configUpdates };

      const response = await brainCall<{ success: boolean }>(
        () => (brain as any).update_z_report_config(newConfig)
      );

      if (!response.success) {
        throw new Error('Failed to update config');
      }

      return newConfig;
    },
    onSuccess: (newConfig) => {
      queryClient.setQueryData(zReportKeys.config(), newConfig);
      toast.success('Z-Report settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });
}

/**
 * Hook to finalize a Z-Report.
 */
export function useFinalizeZReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      business_date: string;
      actual_cash: number;
      notes?: string;
      closed_by?: string;
      verified_by?: string;
    }) => {
      const response = await brainCall<{ success: boolean; data: ZReportData; message: string }>(
        () => (brain as any).finalize_z_report(params)
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to finalize report');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Update the cached report data
      queryClient.setQueryData(zReportKeys.report(data.business_date), data);
      toast.success(`Z-Report ${data.report_number || ''} finalized`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to finalize report';
      toast.error(message);
    },
  });
}

/**
 * Hook to record a cash drawer operation (paid-out, float, etc.).
 */
export function useRecordCashDrawerOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      operation_type: 'PAID_OUT' | 'FLOAT' | 'PAID_IN' | 'SAFE_DROP';
      amount: number;
      reason?: string;
      staff_name?: string;
      business_date?: string;
    }) => {
      const response = await brainCall<{ success: boolean }>(
        () => (brain as any).record_cash_drawer_operation(params)
      );

      if (!response.success) {
        throw new Error('Failed to record operation');
      }

      return params;
    },
    onSuccess: (params) => {
      // Invalidate report to refetch with new operation
      queryClient.invalidateQueries({ queryKey: zReportKeys.report(params.business_date) });

      const opType = params.operation_type === 'PAID_OUT' ? 'Paid-out' :
                     params.operation_type === 'FLOAT' ? 'Float' : 'Operation';
      toast.success(`${opType} recorded`);
    },
    onError: () => {
      toast.error('Failed to record operation');
    },
  });
}

/**
 * Hook to delete a cash drawer operation.
 */
export function useDeleteCashDrawerOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { operation_id: string; business_date?: string }) => {
      const response = await brainCall<{ success: boolean }>(
        () => (brain as any).delete_cash_drawer_operation({ operation_id: params.operation_id })
      );

      if (!response.success) {
        throw new Error('Failed to delete operation');
      }

      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: zReportKeys.report(params.business_date) });
      toast.success('Operation deleted');
    },
    onError: () => {
      toast.error('Failed to delete operation');
    },
  });
}

/**
 * Hook to save staff cash count.
 */
export function useSaveStaffCashCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      business_date: string;
      staff_cash_counted: number;
      staff_closed_by: string;
      denomination_breakdown?: Record<string, number> | null;
      notes?: string;
    }) => {
      const response = await brainCall<{ success: boolean; message: string }>(
        () => (brain as any).save_staff_cash_count(params)
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to save cash count');
      }

      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: zReportKeys.report(params.business_date) });
      toast.success('Cash count saved');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to save cash count';
      toast.error(message);
    },
  });
}

// ==============================================================================
// INVALIDATION HELPERS
// ==============================================================================

/**
 * Hook to get a function that invalidates Z-Report cache.
 */
export function useInvalidateZReport() {
  const queryClient = useQueryClient();

  return (businessDate?: string) => {
    if (businessDate) {
      queryClient.invalidateQueries({ queryKey: zReportKeys.report(businessDate) });
    } else {
      queryClient.invalidateQueries({ queryKey: zReportKeys.all });
    }
  };
}
