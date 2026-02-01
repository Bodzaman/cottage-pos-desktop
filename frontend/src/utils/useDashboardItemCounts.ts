/**
 * useDashboardItemCounts - Hook to fetch item counts for dashboard table cards
 *
 * Fetches item counts from dine_in_order_items table (source of truth)
 * instead of the deprecated order.items JSONB field
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabaseClient';

interface ItemCounts {
  total: number;      // Total item count
  unsent: number;     // Unsent item count
  billTotal: number;  // Sum of line_total (order subtotal from items)
}

type ItemCountsMap = Record<string, ItemCounts>;

/**
 * Fetch item counts for multiple orders
 * Groups by order_id and counts total items and unsent items
 */
export function useDashboardItemCounts(orderIds: string[]) {
  return useQuery({
    queryKey: ['dashboard-item-counts', orderIds],
    queryFn: async (): Promise<ItemCountsMap> => {
      if (!orderIds.length) {
        return {};
      }

      // Note: dine_in_order_items does NOT have a deleted_at column
      // Items are deleted by removing rows, not soft-delete
      const { data, error } = await supabase
        .from('dine_in_order_items')
        .select('order_id, sent_to_kitchen_at, line_total')
        .in('order_id', orderIds);

      if (error) {
        console.error('[useDashboardItemCounts] Error fetching item counts:', error);
        return {};
      }

      // Group by order_id and compute counts + totals
      const counts = (data || []).reduce((acc, item) => {
        const id = item.order_id;
        if (!acc[id]) {
          acc[id] = { total: 0, unsent: 0, billTotal: 0 };
        }
        acc[id].total++;
        // Parse line_total as float - Supabase returns numeric as string
        const lineTotal = parseFloat(String(item.line_total)) || 0;
        acc[id].billTotal += lineTotal;
        if (!item.sent_to_kitchen_at) {
          acc[id].unsent++;
        }
        return acc;
      }, {} as ItemCountsMap);

      return counts;
    },
    enabled: orderIds.length > 0,
    staleTime: 10000, // 10 seconds - refresh periodically for real-time feel
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export type { ItemCounts, ItemCountsMap };
