/**
 * usePOSContextSearch.ts
 * Context-aware search hook for POS Desktop header.
 * Adapts search behavior based on the active tab (posViewMode):
 *   - DINE_IN:   Customer lookup (name, phone, email)
 *   - TAKE_AWAY: Past order search
 *   - ONLINE:    Hybrid active (in-memory) + past order search
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { usePOSUIStore, POSViewMode } from './posUIStore';
import { useOnlineOrdersRealtimeStore, OnlineOrder } from './stores/onlineOrdersRealtimeStore';
import brain from 'brain';
import { OrderModel } from 'types';

// ============================================================================
// TYPES
// ============================================================================

export type SearchResultSource = 'active' | 'past' | 'customer';
export type SearchResultType = 'customer' | 'order' | 'online_order';

export interface POSSearchResult {
  id: string;
  source: SearchResultSource;
  type: SearchResultType;
  label: string;
  sublabel: string;
  orderType?: string;
  status?: string;
  total?: number;
  createdAt?: string;
  itemPreview?: string;
  rawData: any;
}

export interface UsePOSContextSearchOptions {
  onCustomerSelect?: (profile: any) => void;
  onSelectOnlineOrder?: (orderId: string) => void;
  onReorder?: (order: any) => void;
}

// ============================================================================
// INPUT TYPE DETECTION (mirrors usePOSCustomerIntelligence logic)
// ============================================================================

function detectInputType(value: string): 'email' | 'phone' | 'ref' | 'name' | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes('@')) return 'email';

  const digitsOnly = trimmed.replace(/\s/g, '');
  if (/^\+?\d+$/.test(digitsOnly) && digitsOnly.replace('+', '').length >= 10) return 'phone';
  if (/^CT[R]?\d+$/i.test(trimmed)) return 'ref';
  if (trimmed.length >= 2) return 'name';

  return null;
}

// ============================================================================
// ONLINE ORDER IN-MEMORY SEARCH
// ============================================================================

function searchOnlineOrdersInMemory(
  orders: Record<string, OnlineOrder>,
  query: string
): POSSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: POSSearchResult[] = [];

  for (const order of Object.values(orders)) {
    const nameMatch = order.customerName?.toLowerCase().includes(q);
    const phoneMatch = order.customerPhone?.toLowerCase().includes(q);
    const numberMatch = order.orderNumber?.toLowerCase().includes(q);
    const itemMatch = order.items?.some(i => i.name?.toLowerCase().includes(q));

    if (nameMatch || phoneMatch || numberMatch || itemMatch) {
      const itemNames = order.items?.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ') || '';
      const moreCount = (order.items?.length || 0) > 2 ? `, +${order.items.length - 2} more` : '';

      results.push({
        id: order.id,
        source: 'active',
        type: 'online_order',
        label: `#${order.orderNumber}`,
        sublabel: order.customerName || 'Customer',
        orderType: order.orderType,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
        itemPreview: itemNames + moreCount,
        rawData: order,
      });
    }
  }

  return results.slice(0, 10);
}

// ============================================================================
// TRANSFORM BACKEND ORDERS TO SEARCH RESULTS
// ============================================================================

function transformOrderToResult(order: OrderModel, source: SearchResultSource): POSSearchResult {
  const itemNames = order.items?.slice(0, 2).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || '';
  const moreCount = (order.items?.length || 0) > 2 ? `, +${order.items.length - 2} more` : '';

  return {
    id: order.order_id || '',
    source,
    type: 'order',
    label: `#${order.order_number || order.order_id || 'N/A'}`,
    sublabel: order.customer_name || 'Walk-in Customer',
    orderType: order.order_type,
    status: order.status,
    total: order.total,
    createdAt: order.created_at,
    itemPreview: itemNames + moreCount,
    rawData: order,
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function usePOSContextSearch(options: UsePOSContextSearchOptions = {}) {
  const { onCustomerSelect, onSelectOnlineOrder, onReorder } = options;

  const posViewMode = usePOSUIStore(state => state.posViewMode);
  const onlineOrders = useOnlineOrdersRealtimeStore(state => state.orders);

  const [query, setQuery] = useState('');
  const [activeResults, setActiveResults] = useState<POSSearchResult[]>([]);
  const [pastResults, setPastResults] = useState<POSSearchResult[]>([]);
  const [customerResults, setCustomerResults] = useState<POSSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout>();
  const requestIdRef = useRef(0);

  // Dynamic placeholder per tab
  const placeholder = useMemo(() => {
    switch (posViewMode) {
      case 'DINE_IN':
        return 'Find customer by name, phone, or email...';
      case 'TAKE_AWAY':
        return 'Search orders by customer, phone, or order number...';
      case 'ONLINE':
        return 'Search online orders by customer or order number...';
      default:
        return 'Search...';
    }
  }, [posViewMode]);

  // Whether search is disabled for this tab
  const isDisabled = posViewMode === 'RESERVATIONS';

  // Clear everything on tab switch
  useEffect(() => {
    setQuery('');
    setActiveResults([]);
    setPastResults([]);
    setCustomerResults([]);
    setIsSearching(false);
    setShowDropdown(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [posViewMode]);

  // ---- DINE_IN: Customer lookup ----
  const searchCustomers = useCallback(async (q: string, reqId: number) => {
    const inputType = detectInputType(q);
    if (!inputType) return;

    setIsSearching(true);
    try {
      if (inputType === 'name') {
        const response = await brain.crm_search_customers({ query: q, limit: 8 });
        const data = await response.json();
        if (reqId !== requestIdRef.current) return;

        if (data.success && data.customers?.length > 0) {
          setCustomerResults(
            data.customers.map((c: any) => ({
              id: c.id,
              source: 'customer' as const,
              type: 'customer' as const,
              label: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown',
              sublabel: [c.phone, c.email].filter(Boolean).join(' · ') || '',
              rawData: c,
            }))
          );
          setShowDropdown(true);
        } else {
          setCustomerResults([]);
          setShowDropdown(true);
        }
      } else {
        // email / phone / ref → lookup
        const searchParams: any = {};
        if (inputType === 'email') searchParams.email = q.trim();
        else if (inputType === 'phone') searchParams.phone = q.trim();
        else if (inputType === 'ref') searchParams.customer_reference = q.trim();

        const response = await brain.lookup_customer(searchParams);
        const data = await response.json();
        if (reqId !== requestIdRef.current) return;

        if (data.success && data.customer) {
          setCustomerResults([{
            id: data.customer.id,
            source: 'customer',
            type: 'customer',
            label: [data.customer.first_name, data.customer.last_name].filter(Boolean).join(' ') || 'Unknown',
            sublabel: [data.customer.phone, data.customer.email].filter(Boolean).join(' · ') || '',
            rawData: data.customer,
          }]);
          setShowDropdown(true);
        } else {
          setCustomerResults([]);
          setShowDropdown(true);
        }
      }
    } catch (error) {
      console.error('[ContextSearch] Customer search error:', error);
      if (reqId === requestIdRef.current) {
        setCustomerResults([]);
      }
    } finally {
      if (reqId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  // ---- TAKE_AWAY: Past orders ----
  const searchPastOrders = useCallback(async (q: string, reqId: number) => {
    setIsSearching(true);
    try {
      const response = await brain.get_orders({ page: 1, search: q });
      const data = await response.json();
      if (reqId !== requestIdRef.current) return;

      const orders: OrderModel[] = data.orders || [];
      // Exclude DINE-IN for takeaway context
      const filtered = orders.filter((o: OrderModel) =>
        o.order_type?.toUpperCase() !== 'DINE-IN' && o.order_type?.toUpperCase() !== 'DINE_IN'
      );
      setPastResults(filtered.map(o => transformOrderToResult(o, 'past')));
      setShowDropdown(true);
    } catch (error) {
      console.error('[ContextSearch] Past order search error:', error);
      if (reqId === requestIdRef.current) setPastResults([]);
    } finally {
      if (reqId === requestIdRef.current) setIsSearching(false);
    }
  }, []);

  // ---- ONLINE: Hybrid (in-memory + backend) ----
  const searchOnlineOrders = useCallback(async (q: string, reqId: number) => {
    // Instant: in-memory search
    const memResults = searchOnlineOrdersInMemory(onlineOrders, q);
    setActiveResults(memResults);
    setShowDropdown(true);

    // Debounced: backend search
    setIsSearching(true);
    try {
      const response = await brain.get_orders({
        page: 1,
        search: q,
      });
      const data = await response.json();
      if (reqId !== requestIdRef.current) return;

      const orders: OrderModel[] = data.orders || [];
      // Only show online orders in past results
      const onlineOnly = orders.filter((o: OrderModel) =>
        o.order_source === 'CUSTOMER_ONLINE_ORDER' || o.order_source === 'CUSTOMER_ONLINE_MENU'
      );
      // Deduplicate: exclude IDs already in active results
      const activeIds = new Set(memResults.map(r => r.id));
      const deduped = onlineOnly.filter(o => !activeIds.has(o.order_id || ''));
      setPastResults(deduped.map(o => transformOrderToResult(o, 'past')));
    } catch (error) {
      console.error('[ContextSearch] Online order search error:', error);
      if (reqId === requestIdRef.current) setPastResults([]);
    } finally {
      if (reqId === requestIdRef.current) setIsSearching(false);
    }
  }, [onlineOrders]);

  // ---- Main search handler ----
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.trim().length < 2 || isDisabled) {
      setActiveResults([]);
      setPastResults([]);
      setCustomerResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    const reqId = ++requestIdRef.current;

    // For ONLINE tab, show in-memory results instantly
    if (posViewMode === 'ONLINE') {
      const memResults = searchOnlineOrdersInMemory(onlineOrders, value.trim());
      setActiveResults(memResults);
      if (memResults.length > 0) setShowDropdown(true);
    }

    debounceRef.current = setTimeout(() => {
      switch (posViewMode) {
        case 'DINE_IN':
          searchCustomers(value.trim(), reqId);
          break;
        case 'TAKE_AWAY':
          searchPastOrders(value.trim(), reqId);
          break;
        case 'ONLINE':
          searchOnlineOrders(value.trim(), reqId);
          break;
      }
    }, 300);
  }, [posViewMode, isDisabled, onlineOrders, searchCustomers, searchPastOrders, searchOnlineOrders]);

  // ---- Clear ----
  const clearSearch = useCallback(() => {
    setQuery('');
    setActiveResults([]);
    setPastResults([]);
    setCustomerResults([]);
    setShowDropdown(false);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // ---- Actions ----
  const handleSelect = useCallback((result: POSSearchResult) => {
    if (result.type === 'customer' && onCustomerSelect) {
      onCustomerSelect(result.rawData);
      clearSearch();
    } else if (result.type === 'online_order' && result.source === 'active' && onSelectOnlineOrder) {
      onSelectOnlineOrder(result.id);
      clearSearch();
    }
    // For past orders, the caller (ManagementHeader) handles opening OrderDetailDialog
  }, [onCustomerSelect, onSelectOnlineOrder, clearSearch]);

  const handleReorder = useCallback((result: POSSearchResult) => {
    if (onReorder && result.source === 'past' && posViewMode === 'TAKE_AWAY') {
      onReorder(result.rawData);
      clearSearch();
    }
  }, [onReorder, posViewMode, clearSearch]);

  // All results merged for the dropdown (ordered: customer → active → past)
  const allResults = useMemo(() => {
    return [...customerResults, ...activeResults, ...pastResults];
  }, [customerResults, activeResults, pastResults]);

  return {
    query,
    setQuery: handleSearchChange,
    placeholder,
    isDisabled,
    isSearching,
    showDropdown,
    setShowDropdown,
    clearSearch,
    posViewMode,

    // Grouped results
    customerResults,
    activeResults,
    pastResults,
    allResults,

    // Actions
    handleSelect,
    handleReorder,
  };
}
