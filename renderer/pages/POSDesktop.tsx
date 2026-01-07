import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

// Databutton imports
import { supabase } from 'utils/supabaseClient';

// Store imports
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useRealtimeMenuStore, getMenuDataForPOS, startRealtimeSubscriptionsIfNeeded, cleanupRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { useCustomerDataStore } from '../utils/customerDataStore';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { useSystemStatus } from 'utils/pollingService';
import { usePOSAuth } from 'utils/usePOSAuth';
import { ResponsivePOSShell } from 'components/ResponsivePOSShell';

// NEW: Import focused POS stores
import { usePOSOrderStore } from 'utils/posOrderStore';
import { usePOSCustomerStore } from 'utils/posCustomerStore';
import { usePOSUIStore } from 'utils/posUIStore';
import { usePOSCustomerIntelligence } from 'utils/usePOSCustomerIntelligence';

// NEW: Event-driven architecture hooks for DINE-IN mode
import { useDineInOrder } from 'utils/useDineInOrder';
import { useRestaurantTables } from 'utils/useRestaurantTables';
import { useCustomerTabs } from 'utils/useCustomerTabs';

// Enhanced image preloading imports
import { useImagePreloader } from '../utils/useImagePreloader';
import { POSSkeletonGrid } from 'components/POSSkeletonGrid';
import { CategorySidebarSkeleton } from 'components/CategorySidebarSkeleton';
import { OrderSummarySkeleton } from 'components/OrderSummarySkeleton';
import { POSZoneErrorBoundary } from 'components/POSZoneErrorBoundary';

// Utility imports
import { cn } from 'utils/cn';
import { colors as designColors } from '../utils/designSystem';
import { QSAITheme } from '../utils/QSAIDesign';
import { quickLog, createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';
import posPerf, { POSPerfMarks } from 'utils/posPerformance';
import { generateDisplayName } from 'utils/menuHelpers';

// Component imports
import { ManagementHeader } from '../components/ManagementHeader';
import { POSNavigation } from '../components/POSNavigation';
import { DineInTableSelector } from '../components/DineInTableSelector';
import { CategorySidebar } from '../components/CategorySidebar';
import { POSSectionPills } from '../components/POSSectionPills';
import { POSCategoryPills } from '../components/POSCategoryPills';
import { POSMenuSelector } from '../components/POSMenuSelector';
import { OrderSummaryPanel } from '../components/OrderSummaryPanel';
import { POSOrderSummary } from '../components/POSOrderSummary';
import { CustomerSummaryBadge } from '../components/CustomerSummaryBadge';
import { POSCustomerIntelligencePanel } from '../components/POSCustomerIntelligencePanel';
import { OrderCustomerCard } from '../components/OrderCustomerCard';
import { CustomerDetailsModal } from 'components/CustomerDetailsModal';
import { CustomerOrderHistoryModal } from 'components/CustomerOrderHistoryModal';
import { POSGuestCountModal } from 'components/POSGuestCountModal';
import DineInOrderModal from 'components/DineInOrderModal';
import { DineInKitchenPreviewModal } from 'components/DineInKitchenPreviewModal';
import { DineInBillPreviewModal } from 'components/DineInBillPreviewModal';
import ManagementPasswordDialog from 'components/ManagementPasswordDialog';
import MenuManagementDialog from '../components/MenuManagementDialog';
import AllOrdersModal from '../components/AllOrdersModal';
import { CustomizeOrchestratorProvider } from '../components/CustomizeOrchestrator';
import { POSFooter } from 'components/POSFooter';
import { AdminSidePanel } from 'components/AdminSidePanel';
import { AvatarDropdown } from 'components/AvatarDropdown';
import { PaymentFlowOrchestrator } from 'components/PaymentFlowOrchestrator';
import { PaymentFlowResult, PaymentFlowMode } from 'utils/paymentFlowTypes';
import { PaymentChoiceModal } from 'components/PaymentChoiceModal';

// View Components - Import from POSDesktop for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { Category, MenuItem, OrderItem, ModifierSelection } from '../utils/menuTypes';
import { CustomerData } from '../utils/customerTypes';
import { TipSelection } from '../components/POSTipSelector';
import { PaymentResult } from '../utils/menuTypes';
import { FIXED_SECTIONS, type SectionId, filterItemsBySection } from 'utils/sectionMapping';
import { usePOSSettingsWithAutoFetch } from '@/utils/posSettingsStore';

// Custom hooks
import { useTableManagement } from 'utils/useTableManagement';
import { useOrderManagement } from 'utils/useOrderManagement';
import { useCustomerFlow } from 'utils/useCustomerFlow';
import { useOrderProcessing } from 'utils/useOrderProcessing';
import { usePrintingOperations } from 'utils/usePrintingOperations';
import { usePOSInitialization } from 'utils/usePOSInitialization';

import { OfflineFirst } from '../utils/offlineFirstManager';
import { generateSessionId, type PersistedSession } from '../utils/sessionPersistence';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

/**
 * POSDesktop - Professional Point of Sale interface
 * Clean, production-ready implementation for restaurant operations
 * 
 * PROTECTED ROUTE: Requires authentication via /pos-login
 */
export default function POSDesktop() {
  // ✅ Development check for console log guards
  const isDev = import.meta.env.DEV;
  
  // ============================================================================
  // ALL HOOKS (must be called in same order every render)
  // ============================================================================
  
  const navigate = useNavigate();
  
  const location = useLocation();
  
  // Note: POSDesktop uses POS-specific auth (usePOSAuth), not simple auth
  // We keep this hook call to maintain hook count consistency, but don't use its values
  useSimpleAuth();
  
  const { 
    user,
    isAuthenticated, 
    isLoading: authLoading,
    logout 
  } = usePOSAuth();

  // ============================================================================
  // AUTHENTICATION GUARD - PHASE 7
  // ============================================================================
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[POSDesktop] User not authenticated, redirecting to /pos-login');
      navigate('/pos-login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Show nothing while checking authentication
  if (authLoading || !isAuthenticated) {
    return null;
  }

  const hasRedirectedRef = useRef(false);
  
  const lastRedirectTimeRef = useRef(0);
  
  const REDIRECT_COOLDOWN = 1000;
  
  // ============================================================================
  // MANAGER OVERRIDE DIALOG STATE
  // ============================================================================
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const managerApprovalResolverRef = useRef<((approved: boolean) => void) | null>(null);
  const [managerOverrideGranted, setManagerOverrideGranted] = useState(false);
  
  // ============================================================================
  // ADMIN PANEL STATE
  // ============================================================================
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // ============================================================================
  // STORE INTEGRATIONS
  // ============================================================================
  // 🚀 SELECTIVE SUBSCRIPTIONS: Subscribe to specific fields only to prevent unnecessary re-renders
  const categories = useRealtimeMenuStore(state => state.categories, shallow);
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const isLoading = useRealtimeMenuStore(state => state.isLoading);
  const menuLoading = isLoading; // Alias for backward compatibility
  const isConnected = useRealtimeMenuStore(state => state.isConnected);
  const itemVariants = useRealtimeMenuStore(state => state.itemVariants, shallow);
  const proteinTypes = useRealtimeMenuStore(state => state.proteinTypes, shallow);
  const customizations = useRealtimeMenuStore(state => state.customizations, shallow);
  const searchQuery = useRealtimeMenuStore(state => state.searchQuery);
  const setSearchQuery = useRealtimeMenuStore(state => state.setSearchQuery);
  const selectedCategory = useRealtimeMenuStore(state => state.selectedMenuCategory);
  
  const tableOrdersStore = useTableOrdersStore();
  
  // NEW: Focused POS stores replace single POSState
  const orderStore = usePOSOrderStore();
  const customerStore = usePOSCustomerStore();
  const uiStore = usePOSUIStore();
  
  // Access tableOrdersStore for DINE-IN mode
  const persistedTableOrders = useTableOrdersStore((state) => state.persistedTableOrders);

  // ============================================================================
  // EVENT-DRIVEN HOOKS FOR DINE-IN MODE (Phase 3.3)
  // ============================================================================
  // NEW: Real-time hooks for event-driven architecture (DINE-IN only)
  // Only active when orderType === 'DINE-IN'
  const { tables: restaurantTables, loading: tablesLoading, refetch: refetchTables } = useRestaurantTables();
  
  // ✅ PHASE B: Resolve table_number → UUID for useDineInOrder
  const selectedTableUuid = useMemo(() => {
    if (orderStore.orderType !== 'DINE-IN' || !orderStore.selectedTableNumber) {
      return null;
    }
    
    // Find table by table_number (stored as string in database)
    const table = restaurantTables.find(
      t => t.table_number === orderStore.selectedTableNumber.toString()
    );
    
    const tableId = table?.id || null;
    
    console.log('[POSDesktop] 🔍 Table UUID Resolution:', {
      selectedTableNumber: orderStore.selectedTableNumber,
      foundTable: table,
      resolvedTableId: tableId
    });
    
    return tableId;
  }, [orderStore.orderType, orderStore.selectedTableNumber, restaurantTables]);

  // ✅ PHASE 7.2: Calculate linked table context for DineInOrderModal
  const linkedTableContext = useMemo(() => {
    if (orderStore.orderType !== 'DINE-IN' || !orderStore.selectedTableNumber) {
      return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    }

    const selectedTable = restaurantTables.find(
      t => parseInt(t.table_number) === orderStore.selectedTableNumber
    );

    if (!selectedTable) {
      return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    }

    const isLinked = selectedTable.is_linked_table || selectedTable.is_linked_primary;
    
    if (!isLinked || !selectedTable.linked_with_tables || selectedTable.linked_with_tables.length === 0) {
      return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    }

    // Calculate linked table numbers and total capacity
    const linkedTableNumbers = selectedTable.linked_with_tables;
    const isPrimaryTable = selectedTable.is_linked_primary || false;
    
    // Get all linked tables to calculate total capacity
    const linkedTableObjects = restaurantTables.filter(
      t => linkedTableNumbers.includes(parseInt(t.table_number))
    );
    
    const totalLinkedCapacity = selectedTable.capacity + 
      linkedTableObjects.reduce((sum, t) => sum + (t.capacity || 0), 0);

    if (isDev) console.log('[POSDesktop] 🔗 Linked table context:', {
      selectedTableNumber: orderStore.selectedTableNumber,
      linkedTableNumbers,
      isPrimaryTable,
      totalLinkedCapacity
    });

    return { linkedTableNumbers, isPrimaryTable, totalLinkedCapacity };
  }, [orderStore.orderType, orderStore.selectedTableNumber, restaurantTables, isDev]);

  // 🚀 EVENT-DRIVEN ARCHITECTURE: useDineInOrder hook
  const {
    order: dineInOrder, 
    loading: dineInOrderLoading,
    error: dineInError,
    enrichedItems: dineInEnrichedItems,
    enrichedLoading: dineInEnrichedLoading,
    enrichedError: dineInEnrichedError,
    createOrder,
    addItem: addItemToDineIn,
    removeItem: removeItemFromDineIn,
    updateItemQuantity,
    sendToKitchen: sendDineInToKitchen,
    requestCheck: requestDineInCheck,
    updateGuestCount
  } = useDineInOrder(selectedTableUuid);

  // ✅ FIX: Track latest dineInOrder value in ref to avoid stale closure in polling loops
  const dineInOrderRef = useRef(dineInOrder);

  // Keep ref synchronized with latest order state
  useEffect(() => {
    dineInOrderRef.current = dineInOrder;
  }, [dineInOrder]);

  // ✅ DEBUG: Log tableId calculation
  useEffect(() => {
    const tableId = orderStore.orderType === 'DINE-IN' && orderStore.selectedTableNumber 
      ? restaurantTables.find(t => t.table_number === orderStore.selectedTableNumber.toString())?.id || null
      : null;
    
    console.log('[POSDesktop] 🔍 DEBUG tableId calculation:', {
      orderType: orderStore.orderType,
      selectedTableNumber: orderStore.selectedTableNumber,
      restaurantTablesCount: restaurantTables.length,
      restaurantTables: restaurantTables.map(t => ({ id: t.id, table_number: t.table_number })),
      searchingFor: orderStore.selectedTableNumber?.toString(),
      foundTable: restaurantTables.find(t => t.table_number === orderStore.selectedTableNumber?.toString()),
      calculatedTableId: tableId
    });
  }, [orderStore.orderType, orderStore.selectedTableNumber, restaurantTables]);

  // NEW: Customer tabs hook for DINE-IN bill splitting
  const {
    customerTabs: customerTabsData,
    activeTabId,
    setActiveTabId,
    loading: tabsLoading,
    error: tabsError,
    createTab,
    addItemsToTab,
    renameTab,
    closeTab,
    splitTab,
    mergeTabs,
    moveItemsBetweenTabs
  } = useCustomerTabs(
    orderStore.orderType === 'DINE-IN' && orderStore.selectedTableNumber
      ? orderStore.selectedTableNumber
      : null
  );

  // ============================================================================
  // 🚀 PHASE 1: STAGING STATE MANAGEMENT (MYA-1615)
  // ============================================================================

  // 🚀 CLEAN STAGING ARCHITECTURE (MYA-1615 Phase 1)
  // 
  // ARCHITECTURAL PATTERN: Separation of Staging (Ephemeral) vs Database (Persistent)
  // 
  // STATE MANAGEMENT:
  // - dineInStagingItems: Ephemeral cart (managed here at POSDesktop level)
  // - dineInOrder.items: Persistent database items (managed by useDineInOrder hook)
  // 
  // DATA FLOW:
  // 1. Staff adds items in DineInOrderModal → addToStagingCart() → dineInStagingItems grows
  // 2. Staff clicks "Save Order" → persistStagingCart() → Calls backend for each item
  // 3. Backend persists to database → dineInOrder.items updates (real-time)
  // 4. Staging cart CLEARS → setDineInStagingItems([]) → Ready for next batch
  // 5. Staff opens "Review Order" → DineInFullReviewModal shows dineInOrder.items
  // 
  // MODAL RESPONSIBILITIES:
  // - DineInOrderModal: Receives stagingItems, displays ONLY staging (adding interface)
  // - DineInFullReviewModal: Receives dineInOrder.items, displays ONLY database (management interface)
  // - POSDesktop: Orchestrates both, maintains single source of truth for each
  // 
  // WHY THIS PATTERN:
  // - Clear separation between "unsaved" (staging) and "saved" (database) items
  // - Prevents confusion in UI (cart clears after save = fresh slate)
  // - Clean one-way data flow (staging → persist → database → review)
  // - No modal-to-modal communication (parent orchestrates all state)
  const [dineInStagingItems, setDineInStagingItems] = useState<OrderItem[]>([]);

  // Handler: Add item to staging cart
  const addToStagingCart = useCallback((item: OrderItem) => {
    console.log('[POSDesktop] ➕ Adding item to staging cart:', item.name);
    setDineInStagingItems(prev => [...prev, item]);
  }, []);

  // Handler: Remove item from staging cart
  const removeFromStagingCart = useCallback((itemId: string) => {
    console.log('[POSDesktop] 🗑️ Removing item from staging cart:', itemId);
    setDineInStagingItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Handler: Clear staging cart (after save or cancel)
  const clearStagingCart = useCallback(() => {
    console.log('[POSDesktop] 🧹 Clearing staging cart');
    setDineInStagingItems([]);
  }, []);

  // Handler: Persist staging items to database
  const persistStagingCart = useCallback(async () => {
    console.log('[POSDesktop] 💾 PERSIST STAGING CART CALLED:', {
      timestamp: new Date().toISOString(),
      stagingItemsCount: dineInStagingItems.length,
      selectedTableUuid,
      selectedTableNumber: orderStore.selectedTableNumber,
      orderType: orderStore.orderType,
      restaurantTablesCount: restaurantTables.length,
      hasOrder: !!dineInOrderRef.current,
      orderId: dineInOrderRef.current?.id,
      CRITICAL_CHECK: {
        hasUUID: !!selectedTableUuid,
        hasTableNumber: !!orderStore.selectedTableNumber,
        hasRestaurantTables: restaurantTables.length > 0,
        hasOrder: !!dineInOrderRef.current,
        WARNING: !selectedTableUuid ? '⚠️ PERSIST CALLED WITH NULL UUID!' : null
      }
    });

    if (dineInStagingItems.length === 0) {
      console.log('[POSDesktop] ⚠️ No staging items to persist');
      return false;
    }

    // ✅ FIX: Wait for order to exist (handles real-time subscription lag)
    // Use ref.current to access latest order state, not stale closure variable
    if (!dineInOrderRef.current) {
      console.log('[POSDesktop] ⏳ Order not loaded yet, waiting for real-time subscription...');
      
      const maxWait = 3000; // 3 seconds timeout
      const startTime = Date.now();
      const pollInterval = 100; // Check every 100ms
      
      // ✅ DIAGNOSTIC: Track polling attempts
      let pollAttempts = 0;
      
      // ✅ FIX: Poll ref.current instead of closure variable dineInOrder
      while (!dineInOrderRef.current && (Date.now() - startTime < maxWait)) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        pollAttempts++;
        console.log('[POSDesktop] ⏳ Still waiting for order...', {
          pollAttempt: pollAttempts,
          elapsed: Date.now() - startTime,
          hasOrder: !!dineInOrderRef.current,
          refValue: dineInOrderRef.current ? 'EXISTS' : 'NULL'
        });
      }
      
      // Check if order loaded
      if (!dineInOrderRef.current) {
        console.error('[POSDesktop] ❌ Timeout: Order not loaded after', maxWait, 'ms', {
          totalPollAttempts: pollAttempts,
          expectedPolls: maxWait / pollInterval
        });
        toast.error('Order not ready. Please wait a moment and try again.');
        return false;
      }
      
      console.log('[POSDesktop] ✅ Order loaded successfully:', {
        orderId: dineInOrderRef.current.id,
        waitTime: Date.now() - startTime,
        pollAttempts,
        orderStatus: dineInOrderRef.current.status,
        itemsInOrder: dineInOrderRef.current.items?.length || 0
      });
    }

    console.log('[POSDesktop] 💾 Persisting staging cart:', {
      itemCount: dineInStagingItems.length,
      items: dineInStagingItems.map(i => i.name),
      orderId: dineInOrderRef.current.id,
      orderStatus: dineInOrderRef.current.status
    });

    try {
      // ✅ DIAGNOSTIC: Track persistence progress
      const persistStartTime = Date.now();
      let successCount = 0;
      let failCount = 0;
      
      // Persist each staging item to database via addItemToDineIn
      for (const item of dineInStagingItems) {
        console.log('[POSDesktop] 📤 Calling addItemToDineIn with:', {
          itemName: item.name,
          selectedTableUuid,
          hasUUID: !!selectedTableUuid,
          orderId: dineInOrderRef.current.id,
          itemNumber: successCount + failCount + 1,
          totalItems: dineInStagingItems.length
        });
        
        try {
          await addItemToDineIn(item);
          successCount++;
          console.log('[POSDesktop] ✅ Item persisted:', item.name, `(${successCount}/${dineInStagingItems.length})`);
        } catch (itemError) {
          failCount++;
          console.error('[POSDesktop] ❌ Failed to persist item:', item.name, itemError);
          throw itemError; // Re-throw to trigger outer catch
        }
      }

      const persistDuration = Date.now() - persistStartTime;
      console.log('[POSDesktop] ✅ ALL ITEMS PERSISTED:', {
        successCount,
        failCount,
        totalDuration: persistDuration,
        avgTimePerItem: persistDuration / dineInStagingItems.length,
        itemsPersisted: dineInStagingItems.map(i => i.name)
      });

      toast.success(`Saved ${dineInStagingItems.length} item(s) to order`);
      
      // Clear staging after successful save
      setDineInStagingItems([]);
      
      console.log('[POSDesktop] ✅ Staging cart cleared - ready for next batch');
      return true;
    } catch (error) {
      console.error('[POSDesktop] ❌ Failed to persist staging cart:', error);
      toast.error('Failed to save items to order');
      return false;
    }
  }, [dineInStagingItems, addItemToDineIn, selectedTableUuid, orderStore.selectedTableNumber, orderStore.orderType, restaurantTables.length]);
  // ✅ FIX APPLIED: Removed dineInOrderRef.current from dependency array
  // Refs should NEVER have .current in dependencies - they don't trigger re-renders
  // The ref will always have the latest value when accessed inside the function
  // ============================================================================
  // LEGACY STORES (PRESERVED FOR WAITING/COLLECTION/DELIVERY MODES)
  // ============================================================================

  // ✅ PRESERVED: Store subscriptions still needed for WAITING/COLLECTION/DELIVERY modes
  const updateCustomer = usePOSCustomerStore(state => state.updateCustomer);
  const clearCustomer = usePOSCustomerStore(state => state.clearCustomer);
  const customerData = usePOSCustomerStore(state => state.customerData, shallow);
  
  const setCustomerData = useCustomerDataStore(state => state.setCustomerData);
  const clearCustomerData = useCustomerDataStore(state => state.clearCustomerData);
  const hasRequiredCustomerData = useCustomerDataStore(state => state.hasRequiredCustomerData);
  const setShowCustomerModal = useCustomerDataStore(state => state.setShowCustomerModal);
  const customerDataStoreData = useCustomerDataStore(state => state.customerData, shallow);
  
  // Table orders from persistent store (PRESERVED for other modes)
  const { 
    tableOrders: persistentTableOrders, 
    hasExistingOrders, 
    getTableStatus, 
    getTableOrders,
    createTableOrder,
    updateTableOrder,
    addItemsToTable,
    completeTableOrder
  } = tableOrdersStore;

  // ============================================================================
  // SECTION & CATEGORY NAVIGATION STATE
  // ============================================================================
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // ============================================================================
  // HOOKS & STATE
  // ============================================================================
  
  // ✅ Get POS settings from store for delivery fee calculation
  const { settings: posSettings } = usePOSSettingsWithAutoFetch();
  
  // Read variant carousel setting (default: true if not set)
  const variantCarouselEnabled = posSettings?.variant_carousel_enabled ?? true;
  
  // Calculate order total
  const orderTotal = useMemo(() => 
    orderStore.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [orderStore.orderItems]
  );
  
  // ✅ Calculate delivery fee using same logic as OrderSummaryPanel
  const deliveryFee = useMemo(() => {
    // Priority 1: Use calculated delivery fee from customer data (dynamic based on postcode)
    if (orderStore.orderType === "DELIVERY" && customerStore.customerData.deliveryFee !== undefined) {
      return customerStore.customerData.deliveryFee;
    }
    
    // Priority 2: Fall back to static POS settings delivery charge
    if (orderStore.orderType === "DELIVERY" && posSettings?.delivery_charge?.enabled) {
      return posSettings.delivery_charge.amount;
    }
    
    // Default: No delivery fee
    return 0;
  }, [orderStore.orderType, customerStore.customerData.deliveryFee, posSettings]);
  
  // Initialize POS with restored sessions
  const initialization = usePOSInitialization({
    onViewChange: (view) => {
      if (view === 'pos') {
        uiStore.setActiveView('pos');
      } else if (view === 'reservations') {
        uiStore.setActiveView('reservations');
      }
    }
  });

  // ============================================================================
  // ALL CALLBACKS AND HANDLERS (moved up before conditional logic)
  // ============================================================================
  
  // LOGOUT HANDLER
  const handleLogout = useCallback(async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/pos-login', { replace: true });
  }, [logout, navigate]);
  
  // COMPUTED VALUES
  const getDisplayOrderItems = useCallback(() => {
    return orderStore.orderItems;
  }, [orderStore.orderItems]);
  
  // Promise-based approver that children can call to request manager auth
  const requestManagerApproval = useCallback((): Promise<boolean> => {
    setIsManagementDialogOpen(true);
    return new Promise<boolean>((resolve) => {
      managerApprovalResolverRef.current = resolve;
    });
  }, []);

  const handleManagementAuthSuccess = useCallback(() => {
    setManagerOverrideGranted(true);
    if (managerApprovalResolverRef.current) {
      managerApprovalResolverRef.current(true);
      managerApprovalResolverRef.current = null;
    }
    setIsManagementDialogOpen(false);
    
    // Open admin panel after successful authentication
    setShowAdminPanel(true);
    
    toast.success('Management access granted');
  }, []);

  const handleManagementAuthCancel = useCallback(() => {
    if (managerApprovalResolverRef.current) {
      managerApprovalResolverRef.current(false);
      managerApprovalResolverRef.current = null;
    }
    setIsManagementDialogOpen(false);
  }, []);
  
  const handleOrderTypeChange = useCallback((orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "ONLINE_ORDERS") => {
    orderStore.setOrderType(orderType);
    
    if (orderType === 'ONLINE_ORDERS') {
      uiStore.setActiveView('online-orders');
    } else {
      uiStore.setActiveView('pos');
    }
    
    toast.success(`Order type changed to ${orderType}`);
  }, []);
  
  // TABLE MANAGEMENT HANDLERS
  const handleTableSelect = useCallback((tableNumber: number, tableStatus?: string) => {
    console.log(`🍽️ [POSDesktop] handleTableSelect called: Table ${tableNumber}, Status: ${tableStatus}`);
    console.log(`🔍 [POSDesktop] restaurantTables data:`, restaurantTables);
    console.log(`🔍 [POSDesktop] restaurantTables count:`, restaurantTables.length);
    
    // ✅ PHASE 7.1: Check if table is part of a linked group
    const clickedTable = restaurantTables.find(t => parseInt(t.table_number) === tableNumber);
    console.log(`🔍 [POSDesktop] clickedTable lookup result:`, clickedTable);
    
    const isLinkedTable = clickedTable?.is_linked_table || clickedTable?.is_linked_primary;
    
    console.log(`🔗 [POSDesktop] Linked table check:`, {
      tableNumber,
      isLinkedTable,
      is_linked_table: clickedTable?.is_linked_table,
      is_linked_primary: clickedTable?.is_linked_primary,
      current_order_id: clickedTable?.current_order_id,
      linked_with_tables: clickedTable?.linked_with_tables,
      linked_table_group_id: clickedTable?.linked_table_group_id,
      clickedTableFound: !!clickedTable
    });
    
    // ✅ ARCHITECTURAL FIX: Linked tables ALWAYS open DineInOrderModal
    if (isLinkedTable) {
      // Linked table (with or without order) → Always open DineInOrderModal
      console.log(`🔗 [POSDesktop] Linked table ${tableNumber} - opening dine-in modal (hasOrder: ${!!clickedTable?.current_order_id})`);
      orderStore.setOrderType('DINE-IN');
      orderStore.setSelectedTableNumber(tableNumber);
      uiStore.setModal('showDineInModal', true);
    } else if (tableStatus && tableStatus !== 'AVAILABLE') {
      // ✅ Regular occupied table → Open DineInOrderModal
      console.log(`🍽️ [POSDesktop] Table ${tableNumber} is ${tableStatus} - opening dine-in modal`);
      orderStore.setOrderType('DINE-IN');
      orderStore.setSelectedTableNumber(tableNumber);
      uiStore.setModal('showDineInModal', true);
    } else {
      // ✅ Regular available table → Open guest count modal
      console.log(`🍽️ [POSDesktop] Table ${tableNumber} selected (AVAILABLE) - opening guest count modal`);
      orderStore.setOrderType('DINE-IN');
      orderStore.setSelectedTableNumber(tableNumber);
      uiStore.setModal('showGuestCountModal', true);
    }
    
    const updatedCustomerData = {
      ...customerDataStoreData,
      tableNumber: tableNumber.toString(),
      guestCount: orderStore.guestCount || 1
    };

    customerStore.updateCustomer(updatedCustomerData);
  }, [restaurantTables, orderStore, uiStore, customerStore, customerDataStoreData]);
  
  const handleGuestCountSave = useCallback(async (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => {
    const tableNumber = orderStore.selectedTableNumber;
    if (!tableNumber) return;
    
    console.log('[POSDesktop] 🔍 DEBUG handleGuestCountSave START:', {
      tableNumber,
      guestCount,
      action,
      linkedTables,
      currentOrderType: orderStore.orderType,
      currentSelectedTableNumber: orderStore.selectedTableNumber,
      restaurantTablesCount: restaurantTables.length,
      restaurantTables: restaurantTables.map(t => ({ id: t.id, table_number: t.table_number }))
    });
    
    const hasExistingOrder = orderStore.orderItems.length > 0;
    
    // ✅ Event-driven: Create order in orders table + update pos_tables.status to OCCUPIED
    console.log('[POSDesktop] 🔍 Calling createOrder with guestCount:', guestCount);
    const orderId = await createOrder(guestCount);  // ✅ Now returns order_id instead of boolean
    
    console.log('[POSDesktop] 🔍 createOrder returned order_id:', orderId);
    
    if (orderId) {
      console.log('[POSDesktop] ✅ Order created successfully, proceeding with table linking and modal transition');
      
      // ✅ NEW: If action === 'link' and linkedTables provided, call link_tables command
      if (action === 'link' && linkedTables && linkedTables.length > 0) {
        console.log('[POSDesktop] 🔗 Linking additional tables:', linkedTables);
        try {
          const linkResponse = await apiClient.link_tables({
            order_id: orderId,
            tables_to_link: linkedTables
          });
          
          if (linkResponse.status === 200) {
            const linkData = await linkResponse.json();
            console.log('[POSDesktop] ✅ Tables linked successfully:', linkData);
            toast.success(`Table ${tableNumber} linked with ${linkedTables.join(', ')}`);
            
            // ✅ PHASE 7.3 FIX: Refetch table data to ensure linkedTableContext has fresh data
            console.log('[POSDesktop] 🔄 Refetching table data after linking...');
            await refetchTables();
            console.log('[POSDesktop] ✅ Table data refreshed');
          } else {
            console.error('[POSDesktop] ❌ Failed to link tables, status:', linkResponse.status);
            toast.error('Failed to link tables');
          }
        } catch (linkError) {
          console.error('[POSDesktop] ❌ Error linking tables:', linkError);
          toast.error('Failed to link tables');
        }
      }
      
      orderStore.setGuestCount(guestCount);
      uiStore.setModal('showGuestCountModal', false);
      
      console.log('[POSDesktop] 🔍 Setting showDineInModal to true');
      // ✅ NEW: Seamless transition - auto-open DineInOrderModal immediately
      uiStore.setModal('showDineInModal', true);
      
      console.log('[POSDesktop] 🔍 Modal state after setting:', {
        showGuestCountModal: uiStore.showGuestCountModal,
        showDineInModal: uiStore.showDineInModal
      });
      
      // Keep existing order items if any
      
      if (hasExistingOrder) {
        toast.success(`Table ${tableNumber} seated with ${guestCount} guests - confirming order`);
        
        if (uiStore.pendingOrderConfirmation) {
          if (isDev) console.log('✅ Continuing Process Order flow - opening Payment Flow Orchestrator');
          uiStore.setPendingOrderConfirmation(false);
          uiStore.setModal('showPaymentFlow', true);
        }
      } else {
        toast.success(`Table ${tableNumber} seated with ${guestCount} guests - ready for ordering`);
      }
    } else {
      console.error('[POSDesktop] ❌ createOrder FAILED - modal will not open');
    }
  }, [createOrder, orderStore, uiStore, isDev, restaurantTables]);

  // CUSTOMER DATA MANAGEMENT
  const handleCustomerDetailsClick = useCallback(() => {
    uiStore.setModal('showCustomerModal', true);
  }, []);
  
  const handleClearCustomerDetails = useCallback(() => {
    clearCustomerData(); // ✅ Use selective subscription
    customerStore.clearCustomer();
  }, [clearCustomerData]); // ✅ Add to deps

  // CUSTOMER INTELLIGENCE PANEL HANDLERS
  const handleCustomerIntelligenceSelected = useCallback((customer: any) => {
    if (isDev) console.log('🧠 [POSDesktop] Customer selected from intelligence panel:', customer);
    
    // Update customer store with intelligence data
    customerStore.updateCustomer({
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      customerRef: customer.customer_reference_number || '',
      address: customer.default_address?.address_line1 || '',
      street: customer.default_address?.address_line1 || '', // ✅ Fixed: map to address_line1 (was address_line2)
      city: customer.default_address?.city || '',
      postcode: customer.default_address?.postal_code || '',
    });
    
    // Update legacy customer data store for compatibility
    setCustomerData({
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.default_address?.address_line1 || '',
      postcode: customer.default_address?.postal_code || '',
      street: customer.default_address?.address_line1 || '', // ✅ Fixed: map to address_line1 (was address_line2)
      city: customer.default_address?.city || '',
    });
    
    // Show success toast
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    toast.success(customerName ? `Customer ${customerName} selected` : 'Customer selected');
  }, [customerStore, setCustomerData, isDev]);

  const handleLoadPastOrder = useCallback(async (order: any) => {
    if (isDev) console.log('📦 [POSDesktop] Loading past order:', order);
    
    try {
      // ✅ AUTO-SELECT CUSTOMER: Check if customer is already selected
      const currentCustomer = customerStore.customerData;
      const hasCustomerSelected = currentCustomer && (currentCustomer.phone || currentCustomer.email || currentCustomer.firstName);
      
      // If no customer selected, auto-select from intelligence store
      if (!hasCustomerSelected) {
        const intelligenceCustomer = usePOSCustomerIntelligence.getState().customerProfile;
        
        if (intelligenceCustomer) {
          if (isDev) console.log('🔄 [POSDesktop] Auto-selecting customer for reorder');
          
          // Use existing customer selection handler
          handleCustomerIntelligenceSelected(intelligenceCustomer);
        }
      }
      
      // ✅ Fetch full order items using standalone Supabase helper (no backend dependency)
      const data = await getOrderItems(order.order_id);
      
      if (!data.success || !data.items || data.items.length === 0) {
        toast.error('Cannot load order - no items found');
        return;
      }
      
      // Map order items to current OrderItem format
      const orderItems = data.items.map((item: any) => {
        // ✅ FIX: Generate proper display name from variant/protein data
        const displayName = generateDisplayName(
          item.name,
          item.variant_name,
          item.protein_type
        );
        
        return {
          id: item.id || item.menu_item_id,
          menu_item_id: item.menu_item_id,
          variant_id: item.variant_id || '',
          name: displayName, // ✅ Use generated display name instead of raw item.name
          price: parseFloat(item.price || 0),
          quantity: parseInt(item.quantity || 1),
          variantName: item.variant_name,
          protein_type: item.protein_type || '',
          modifiers: item.modifiers || [],
          notes: item.notes || '',
          image_url: item.image_url || '',
        };
      });
      
      // Add to existing order (don't replace)
      orderStore.setOrderItems([...orderStore.orderItems, ...orderItems]);
      
      // Close the modal
      setShowOrderHistoryModal(false);
      
      toast.success(`✅ ${orderItems.length} items added from previous order`, {
        description: `Total: £${order.total_amount || '0.00'}`,
      });
    } catch (error) {
      console.error('❌ [POSDesktop] Failed to load past order:', error);
      toast.error('Failed to load order items', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [orderStore, isDev, handleCustomerIntelligenceSelected, customerStore]);

  const handleClearCustomerIntelligence = useCallback(() => {
    if (isDev) console.log('🧹 [POSDesktop] Clearing customer intelligence panel');
    
    // Clear both stores
    customerStore.clearCustomer();
    clearCustomerData();
    
    toast.info('Customer cleared');
  }, [customerStore, clearCustomerData, isDev]);

  // Calculate order total for validation
  const calculateOrderTotal = useCallback((): number => {
    return orderStore.orderItems.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;
      
      // Add modifier prices if present
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          itemTotal += (modifier.price_adjustment || 0) * item.quantity;
        });
      }
      
      return total + itemTotal;
    }, 0);
  }, []);

  // Handle customer data save from modal
  const handleCustomerSave = useCallback((customerData: any) => {
    if (isDev) console.log('💾 [POSDesktop] Saving customer data:', customerData);
    
    // Update focused customer store
    customerStore.updateCustomer(customerData);
    
    // Update customer data store (legacy compatibility)
    setCustomerData(customerData); // ✅ Use selective subscription
    
    toast.success('Customer details saved');
  }, []);

  // CUSTOM HOOKS - Core Business Logic
  
  // Order Management Hook - ✅ Pass store method directly (no wrapper)
  const orderManagement = useOrderManagement(
    orderStore.orderItems,
    orderStore.setOrderItems // ✅ Direct store method - handles functional updates correctly
  );
  
  // Customer Flow Hook - ✅ Fixed: Pass all 5 required parameters
  const customerFlow = useCustomerFlow(
    orderStore.orderType,
    customerStore.customerData,
    (data) => customerStore.updateCustomer(data),
    orderStore.selectedTableNumber,
    orderStore.guestCount
  );
  
  // Order Processing Hook - ✅ Fixed: Pass all 6 required parameters
  const orderProcessing = useOrderProcessing(
    orderStore.orderType,
    orderStore.orderItems,
    customerStore.customerData,
    orderStore.selectedTableNumber,
    orderStore.guestCount
  );

  // Printing Operations Hook
  const printing = usePrintingOperations(
    orderStore.orderType,
    orderStore.orderItems,
    customerStore.customerData,
    orderStore.selectedTableNumber,
    orderStore.guestCount
  );

  // DELEGATED HANDLERS - Use hooks instead of inline logic
  
  const handleAddToOrder = useCallback((item: OrderItem) => {
    if (orderStore.orderType === 'DINE-IN') {
      // Event-driven command for DINE-IN
      addItemToDineIn(item);
    } else {
      // Legacy flow for other modes
      orderManagement.handleAddToOrder(item);
    }
  }, [orderStore.orderType, addItemToDineIn, orderManagement.handleAddToOrder]);
  const handleRemoveItem = orderManagement.handleRemoveItem;
  
  // ✅ NEW: Wrapper handler to route quantity updates based on mode
  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    if (orderStore.orderType === 'DINE-IN') {
      // Event-driven command for DINE-IN
      updateItemQuantity(itemId, quantity);
    } else {
      // Legacy flow for other modes - convert itemId to index
      const itemIndex = orderStore.orderItems.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        console.warn(`[POSDesktop] Item with id ${itemId} not found in order`);
        toast.error('Item not found in order');
        return;
      }
      orderManagement.handleUpdateQuantity(itemIndex, quantity);
    }
  }, [orderStore.orderType, orderStore.orderItems, updateItemQuantity, orderManagement.handleUpdateQuantity]);
  
  const handleClearOrder = useCallback(() => {
    orderManagement.handleClearOrder();
    orderStore.clearOrder();
  }, []);
  const handleIncrementItem = orderManagement.handleIncrementItem;
  const handleDecrementItem = orderManagement.handleDecrementItem;
  const handleUpdateNotes = orderManagement.handleUpdateNotes;
  const handleCustomizeItem = orderManagement.handleCustomizeItem;
  const handleCustomizeItemFromMenu = useCallback((item: OrderItem) => {
    if (isDev) console.log('Customize item from menu:', item);
    handleAddToOrder(item); // ✅ Actually add the item!
  }, [handleAddToOrder, isDev]);

  // Customer flow handlers
  const saveCustomerDetails = customerFlow.saveCustomerDetails;
  const closeCustomerModal = useCallback(() => {
    customerFlow.closeCustomerModal();
    uiStore.setModal('showCustomerModal', false);
    setManagerOverrideGranted(false);
  }, []);
  
  const handleOrderTypeSwitch = useCallback((newOrderType: 'COLLECTION') => {
    orderStore.setOrderType(newOrderType);
    uiStore.setModal('showCustomerModal', false);
    setManagerOverrideGranted(false);
    toast.success(`🔄 Order type switched to ${newOrderType}`);
  }, []);
  
  const handleManagerOverride = useCallback(() => {
    setIsManagementDialogOpen(true);
  }, []);
  
  const validateCustomerData = customerFlow.validateCustomerData;

  // ============================================================================
  // SESSION PERSISTENCE & RESTORATION (must be before payment handlers)
  // ============================================================================
  
  // State for pending session restoration
  const [pendingSession, setPendingSession] = useState<PersistedSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  
  // Load saved session on mount
  useEffect(() => {
    const loadSavedSession = async () => {
      // Prevent duplicate calls
      if (isLoadingSession) {
        if (isDev) console.log('⏭️ [POSDesktop] Session load already in progress, skipping');
        return;
      }
      
      setIsLoadingSession(true);
      
      try {
        const savedSession = await OfflineFirst.loadSession();
        
        if (savedSession && savedSession.orderItems.length > 0) {
          if (isDev) console.log('📦 [POSDesktop] Found saved session:', savedSession);
          setPendingSession(savedSession);
          uiStore.setModal('showSessionRestoreDialog', true);
        } else {
          if (isDev) console.log('✅ [POSDesktop] No saved session found, starting fresh');
        }
      } catch (error) {
        console.error('❌ [POSDesktop] Failed to load saved session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };
    
    loadSavedSession();
  }, []); // Empty deps = run once on mount
  
  // Clear current session from IndexedDB
  const clearCurrentSession = useCallback(async () => {
    try {
      if (pendingSession?.sessionId) {
        await OfflineFirst.clearSession(pendingSession.sessionId);
        setPendingSession(null);
        if (isDev) console.log('🗑️ [POSDesktop] Session cleared successfully');
      }
    } catch (error) {
      console.error('❌ [POSDesktop] Failed to clear session:', error);
    }
  }, [pendingSession?.sessionId]);
  
  // Handle session discard (user chooses to start fresh)
  const handleSessionDiscard = useCallback(async () => {
    if (isDev) console.log('🗑️ [POSDesktop] User discarded saved session');
    
    try {
      if (pendingSession?.sessionId) {
        await OfflineFirst.clearSession(pendingSession.sessionId);
      }
      setPendingSession(null);
      uiStore.setModal('showSessionRestoreDialog', false);
      toast.success('✅ Starting fresh order');
    } catch (error) {
      console.error('❌ [POSDesktop] Failed to discard session:', error);
      toast.error('Failed to restore saved order');
    }
  }, [pendingSession]);
  
  // Handle session restore (user chooses to restore saved order)
  const handleSessionRestore = useCallback(async () => {
    if (!pendingSession) {
      if (isDev) console.warn('⚠️ [POSDesktop] No pending session to restore');
      return;
    }
    
    if (isDev) console.log('✅ [POSDesktop] Restoring saved session:', pendingSession);
    
    try {
      // Restore order state from saved session
      orderStore.setOrderItems(pendingSession.orderItems);
      orderStore.setOrderType(pendingSession.orderType);
      customerStore.updateCustomer(pendingSession.customerData);
      orderStore.setSelectedTableNumber(pendingSession.selectedTableNumber);
      orderStore.setGuestCount(pendingSession.guestCount);
      uiStore.closeModal('showSessionRestoreDialog');
      
      toast.success(`✅ Restored order with ${pendingSession.orderItems.length} items`);
    } catch (error) {
      console.error('❌ [POSDesktop] Failed to restore session:', error);
      toast.error('Failed to restore saved order');
    }
  }, [pendingSession]);

  // ============================================================================
  // PAYMENT COMPLETION HANDLER - Delegated to hooks
  // ============================================================================

  // PAYMENT COMPLETION HANDLER - Delegated to hooks
  const handlePaymentSuccess = useCallback(async (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    if (isDev) console.log('💳 [POSDesktop] Payment completed successfully:', { tipSelection, paymentResult });
    
    try {
      // Calculate final totals
      const subtotal = orderStore.orderItems.reduce((total, item) => {
        const itemPrice = item.variant?.price || item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
      
      const vatAmount = subtotal * 0.20;
      const totalWithVat = subtotal + vatAmount;
      const finalTotal = totalWithVat + tipSelection.amount;
      
      // Persist payment using hook
      const paymentData = {
        payment_method: paymentResult?.method || 'CASH',
        subtotal,
        vat_amount: vatAmount,
        tip_amount: tipSelection.amount,
        total_amount: finalTotal
      };
      
      await orderProcessing.persistPayment(paymentData);
      
      // Auto-print BOTH kitchen ticket and customer receipt after successful payment
      await printing.handlePrintKitchen();
      await printing.handlePrintReceipt(finalTotal);
      
      // Clear saved session from IndexedDB (order complete, no need to restore)
      await clearCurrentSession();
      
      // Reset order state
      orderStore.clearOrder();
      customerStore.clearCustomer();
      
      toast.success('💰 Payment completed successfully!');
    } catch (error) {
      console.error('❌ [POSDesktop] Payment completion failed:', error);
      toast.error('Payment completion failed. Please try again.');
    }
  }, [orderProcessing, printing, clearCurrentSession]);

  // THERMAL PRINTING HANDLERS WITH OFFLINE QUEUING

  const handleSendToKitchen = useCallback(async () => {
    if (!orderStore.orderItems || orderStore.orderItems.length === 0) {
      toast.error('No items to send to kitchen');
      return false;
    }

    if (!orderStore.selectedTableNumber) {
      toast.error('Please select a table number');
      return false;
    }

    try {
      // Calculate order totals
      const subtotal = orderStore.orderItems.reduce((total, item) => {
        const itemPrice = item.variant?.price || item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
      
      const vatAmount = subtotal * 0.20;
      const totalAmount = subtotal + vatAmount;

      // Prepare order data for database
      const orderData = {
        order_type: orderStore.orderType,
        table_number: orderStore.selectedTableNumber,
        guest_count: orderStore.guestCount || 1,
        items: orderStore.orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.variant?.price || item.price,
          variant: item.variant ? {
            id: item.variant.id,
            name: item.variant.name,
            price: item.variant.price
          } : null,
          customizations: item.customizations || [],
          notes: item.notes || ''
        })),
        subtotal: subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: 'IN_PROGRESS', // Mark as in progress (sent to kitchen)
        customer_name: customerStore.customerData.name || null,
        customer_phone: customerStore.customerData.phone || null,
        created_at: new Date().toISOString()
      };

      // 1. Save order to database
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('❌ [POSDesktop] Failed to save order:', error);
        throw error;
      }

      console.log('✅ [POSDesktop] Order saved successfully (no print):', data);
      
      // Close modal
      setShowKitchenPreviewModal(false);
      
      // Clear saved session from IndexedDB
      await clearCurrentSession();
      
      toast.success('💾 Order saved successfully (not sent to kitchen)');
    } catch (error) {
      console.error('❌ [POSDesktop] Save order failed:', error);
      toast.error('Failed to save order. Please try again.');
    }
  }, [orderStore, customerStore, clearCurrentSession, orderStore.orderType, sendDineInToKitchen, isDev]);

  const handleSaveOrderOnly = useCallback(async () => {
    if (!orderStore.orderItems || orderStore.orderItems.length === 0) {
      toast.error('No items to save');
      return;
    }

    if (!orderStore.selectedTableNumber) {
      toast.error('Please select a table number');
      return;
    }

    try {
      // Calculate order totals
      const subtotal = orderStore.orderItems.reduce((total, item) => {
        const itemPrice = item.variant?.price || item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
      
      const vatAmount = subtotal * 0.20;
      const totalAmount = subtotal + vatAmount;

      // Prepare order data for database
      const orderData = {
        order_type: orderStore.orderType,
        table_number: orderStore.selectedTableNumber,
        guest_count: orderStore.guestCount || 1,
        items: orderStore.orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.variant?.price || item.price,
          variant: item.variant ? {
            id: item.variant.id,
            name: item.variant.name,
            price: item.variant.price
          } : null,
          customizations: item.customizations || [],
          notes: item.notes || ''
        })),
        subtotal: subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: 'IN_PROGRESS', // Mark as in progress (sent to kitchen)
        customer_name: customerStore.customerData.name || null,
        customer_phone: customerStore.customerData.phone || null,
        created_at: new Date().toISOString()
      };

      // 1. Save order to database
      const { data: savedOrder, error: saveError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (saveError) {
        console.error('❌ [POSDesktop] Failed to save order:', saveError);
        throw saveError;
      }

      console.log('✅ [POSDesktop] Order saved to database:', savedOrder);

      // 2. Create kitchen ticket print job in print_queue
      const printData = {
        orderNumber: savedOrder.id,
        orderType: 'DINE-IN',
        tableNumber: `Table ${orderStore.selectedTableNumber}`,
        guestCount: orderStore.guestCount || 1,
        items: orderStore.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          variant: item.variant?.name || null,
          customizations: item.customizations?.map(c => c.name).join(', ') || null,
          notes: item.notes || null
        })),
        timestamp: new Date().toISOString()
      };

      const { data: jobId, error: printError } = await supabase.rpc('create_print_job', {
        p_job_type: 'KITCHEN_TICKET',
        p_print_data: printData,
        p_priority: 3, // High priority for dine-in
        p_printer_id: null // Auto-select printer
      });

      if (printError) {
        console.error('❌ [POSDesktop] Failed to create print job:', printError);
        throw printError;
      }

      console.log('✅ [POSDesktop] Kitchen ticket print job created:', jobId);
      
      // Close modal
      setShowKitchenPreviewModal(false);
      
      // Clear saved session from IndexedDB
      await clearCurrentSession();
      
      toast.success('🍽️ Order sent to kitchen!');
      return true;
    } catch (error) {
      console.error('❌ [POSDesktop] Save and print failed:', error);
      toast.error('Failed to send order to kitchen. Please try again.');
      return false;
    }
  }, [orderStore, customerStore, clearCurrentSession, orderStore.orderType, sendDineInToKitchen, isDev]);

  const handleSaveAndPrint = useCallback(async () => {
    if (!orderStore.orderItems || orderStore.orderItems.length === 0) {
      toast.error('No items to send to kitchen');
      return false;
    }

    if (!orderStore.selectedTableNumber) {
      toast.error('Please select a table number');
      return false;
    }

    try {
      // Calculate order totals
      const subtotal = orderStore.orderItems.reduce((total, item) => {
        const itemPrice = item.variant?.price || item.price;
        return total + (itemPrice * item.quantity);
      }, 0);
      
      const vatAmount = subtotal * 0.20;
      const totalAmount = subtotal + vatAmount;

      // Prepare order data for database
      const orderData = {
        order_type: orderStore.orderType,
        table_number: orderStore.selectedTableNumber,
        guest_count: orderStore.guestCount || 1,
        items: orderStore.orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.variant?.price || item.price,
          variant: item.variant ? {
            id: item.variant.id,
            name: item.variant.name,
            price: item.variant.price
          } : null,
          customizations: item.customizations || [],
          notes: item.notes || ''
        })),
        subtotal: subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: 'IN_PROGRESS', // Mark as in progress (sent to kitchen)
        customer_name: customerStore.customerData.name || null,
        customer_phone: customerStore.customerData.phone || null,
        created_at: new Date().toISOString()
      };

      // 1. Save order to database
      const { data: savedOrder, error: saveError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (saveError) {
        console.error('❌ [POSDesktop] Failed to save order:', saveError);
        throw saveError;
      }

      console.log('✅ [POSDesktop] Order saved to database:', savedOrder);

      // 2. Create kitchen ticket print job in print_queue
      const printData = {
        orderNumber: savedOrder.id,
        orderType: 'DINE-IN',
        tableNumber: `Table ${orderStore.selectedTableNumber}`,
        guestCount: orderStore.guestCount || 1,
        items: orderStore.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          variant: item.variant?.name || null,
          customizations: item.customizations?.map(c => c.name).join(', ') || null,
          notes: item.notes || null
        })),
        timestamp: new Date().toISOString()
      };

      const { data: jobId, error: printError } = await supabase.rpc('create_print_job', {
        p_job_type: 'KITCHEN_TICKET',
        p_print_data: printData,
        p_priority: 3, // High priority for dine-in
        p_printer_id: null // Auto-select printer
      });

      if (printError) {
        console.error('❌ [POSDesktop] Failed to create print job:', printError);
        throw printError;
      }

      console.log('✅ [POSDesktop] Kitchen ticket print job created:', jobId);
      
      // Close modal
      setShowKitchenPreviewModal(false);
      
      // Clear saved session from IndexedDB
      await clearCurrentSession();
      
      toast.success('🍽️ Order sent to kitchen!');
      return true;
    } catch (error) {
      console.error('❌ [POSDesktop] Save and print failed:', error);
      toast.error('Failed to send order to kitchen. Please try again.');
      return false;
    }
  }, [orderStore, customerStore, clearCurrentSession, orderStore.orderType, sendDineInToKitchen, isDev]);

  const handlePrintBill = useCallback(async () => {
    if (!orderStore.orderItems || orderStore.orderItems.length === 0) {
      toast.error('No items to print bill for');
      return;
    }
    
    // For DINE-IN: Open bill preview modal instead of direct print
    if (orderStore.orderType === 'DINE-IN') {
      setShowBillPreviewModal(true);
      return;
    }
    
    // For other order types: Direct print (existing flow)
    await printing.handlePrintBill(orderTotal);
  }, [orderStore.orderItems, orderStore.orderType, printing, orderTotal]);

  const handleSaveUpdate = useCallback(async () => {
    if (isDev) console.log('Save/Update order');
    toast.success('Order saved');
  }, []);

  const handleCompleteOrder = useCallback(async () => {
    if (!orderStore.orderItems || orderStore.orderItems.length === 0) {
      toast.error('No items to complete');
      return;
    }
    
    await printing.handlePrintReceipt(orderTotal);
  }, [printing, orderTotal]);

  const handleSplitBill = useCallback(async () => {
    if (isDev) console.log('Split bill');
    toast.success('Bill split');
  }, []);

  const handleCustomerDataUpdate = useCallback((field: string, value: string) => {
    customerStore.updateCustomer({
      ...customerStore.customerData,
      [field]: value
    });
  }, []);

  const handleSchedulingChange = useCallback((data: any) => {
    if (isDev) console.log('Scheduling change:', data);
  }, []);
  
  // ============================================================================
  // MODAL ORCHESTRATION HANDLERS
  // ============================================================================

  // Single Payment Flow handlers
  const handleClosePaymentModal = useCallback(() => {
    uiStore.setModal('showPaymentFlow', false);
  }, []);

  // NEW: Payment choice modal state
  const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
  
  // NEW: Payment flow mode state
  const [paymentFlowMode, setPaymentFlowMode] = useState<PaymentFlowMode>('payment');

  // NEW: Order history modal state
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  
  // NEW: DINE-IN thermal receipt preview modal states
  const [showKitchenPreviewModal, setShowKitchenPreviewModal] = useState(false);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);

  // Payment Modal handlers
  const handleShowPaymentModal = useCallback(async () => {
    if (isDev) console.log('💳 [POSDesktop] Opening payment flow');
    
    // For DINE-IN orders, bypass payment processing - just print bill
    if (orderStore.orderType === 'DINE-IN') {
      if (isDev) console.log('🍽️ [POSDesktop] DINE-IN order - printing bill only, no payment processing');
      
      try {
        // Print bill to thermal printer
        const success = await printing.handlePrintBill(orderTotal);
        if (success) {
          toast.success('Bill printed successfully');
        }
        return success;
      } catch (error) {
        console.error('❌ [POSDesktop] Bill printing failed:', error);
        toast.error('Failed to print bill. Please try again.');
      }
      return;
    }
    
    // For WAITING, COLLECTION, DELIVERY orders → Show payment choice modal
    if (isDev) console.log(`💳 [POSDesktop] ${orderStore.orderType} order - showing payment choice modal`);
    setShowPaymentChoiceModal(true);
  }, [orderStore.orderType, printing, orderTotal]);

  // NEW: Handle payment mode selection from PaymentChoiceModal
  const handleSelectPaymentMode = useCallback((mode: PaymentFlowMode) => {
    if (isDev) console.log(`💳 [POSDesktop] Payment mode selected: ${mode}`);
    setPaymentFlowMode(mode);
    setShowPaymentChoiceModal(false);
    uiStore.setModal('showPaymentFlow', true);
  }, []);

  // NEW: Payment Flow Completion Handler
  const handlePaymentFlowComplete = useCallback(async (result: PaymentFlowResult) => {
    if (isDev) console.log('💳 [POSDesktop] Payment flow completed:', result);
    
    if (!result.success) {
      console.error('Payment flow failed');
      uiStore.setModal('showPaymentFlow', false);
      return;
    }
    
    try {
      // Auto-print kitchen ticket
      await printing.handlePrintKitchen();
      
      // Auto-print customer receipt
      await printing.handlePrintReceipt(result.orderTotal);
      
      // Clear saved session from IndexedDB (order complete, no need to restore)
      await clearCurrentSession();
      
      // Reset order state and close modal
      orderStore.clearOrder();
      customerStore.clearCustomer();
      uiStore.setModal('showPaymentFlow', false);
      
      toast.success('💰 Payment completed successfully!');
    } catch (error) {
      console.error('❌ [POSDesktop] Payment completion failed:', error);
      toast.error('Payment completion failed. Please try again.');
    }
  }, [printing, clearCurrentSession]);
  
  // Customer Modal handlers
  const handleShowCustomerModal = useCallback(() => {
    if (isDev) console.log('👤 [POSDesktop] Opening customer modal');
    uiStore.setModal('showCustomerModal', true);
  }, []);
  
  // Table Selection handlers (for DINE-IN orders)
  const handleShowTableSelection = useCallback(() => {
    if (isDev) console.log('📋 [POSDesktop] Opening table selection');
    // For DINE-IN, we use guest count modal which includes table selection
    uiStore.setModal('showGuestCountModal', true);
  }, []);
  
  const handleCloseTableSelection = useCallback(() => {
    if (isDev) console.log('❌ [POSDesktop] Closing table selection');
    uiStore.setModal('showGuestCountModal', false);
  }, []);

  // NEW: Order history modal handlers
  const handleOpenOrderHistoryModal = useCallback(() => {
    if (isDev) console.log('📖 [POSDesktop] Opening order history modal');
    setShowOrderHistoryModal(true);
  }, []);

  const handleCloseOrderHistoryModal = useCallback(() => {
    if (isDev) console.log('❌ [POSDesktop] Closing order history modal');
    setShowOrderHistoryModal(false);
  }, []);

  const isOrderReady = useCallback(() => {
    if (orderStore.orderItems.length === 0) return false;
    return validateCustomerData(orderStore.orderType);
  }, [validateCustomerData]);

  // PRINTER STATUS MONITORING
  
  const logger = createLogger('POSDesktop');

  // ✅ REPLACED: Heavy polling with on-demand printer service
  const { printerStatus, checkStatus: checkPrinterStatus } = useOnDemandPrinter();

  // ✅ REMOVED: Individual printer status state and polling logic
  // const [printerStatus, setPrinterStatus] = useState({
  //   connected: false,
  //   status: 'disconnected', 
  //   lastChecked: null,
  //   queuedJobs: 0,
  //   error: null
  // });

  // ✅ REMOVED: Individual checkPrinterStatus function - now handled by centralized service
  // const checkPrinterStatus = useCallback(async () => { ... }, []);

  // ✅ REMOVED: Individual 30-second polling useEffect - now handled by centralized service
  // useEffect(() => {
  //   checkPrinterStatus(); // Initial check
  //   const statusInterval = setInterval(checkPrinterStatus, 30000);
  //   return () => clearInterval(statusInterval);
  // }, [checkPrinterStatus]);

  // ✅ Update global state when printer status changes
  useEffect(() => {
    if (printerStatus?.queuedJobs !== undefined) {
      uiStore.setQueuedJobsCount(printerStatus.queuedJobs);
    }
  }, [printerStatus?.queuedJobs]);

  const handleManualPrintQueueProcess = async () => {
    try {
      toast.info('🔄 Processing print queue...');
      
      // ✅ Process print queue using standalone Supabase helper (no backend dependency)
      const processResult = await processPrintQueue({
        max_jobs: 20,
        force_retry_failed: true
      });
      
      if (processResult.success) {
        toast.success(`✅ Processed ${processResult.processed_count} print jobs`, {
          description: `${processResult.successful_count} successful, ${processResult.failed_count} failed`
        });
        
        // Refresh printer status
        setTimeout(checkPrinterStatus, 1000);
      } else {
        toast.error('❌ Failed to process print queue', {
          description: processResult.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('❌ [POSDesktop] Manual queue processing failed:', error);
      toast.error('❌ Failed to process print queue', {
        description: error.message
      });
    }
  };

  // ============================================================================
  // AUTH-RELATED EFFECTS (must be before conditional returns)
  // ============================================================================
  
  // ✅ ENABLED: Redirect to login if not authenticated (WITH NAVIGATION GUARD)
  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }
    
    const now = Date.now();
    if (now - lastRedirectTimeRef.current < REDIRECT_COOLDOWN) {
      return;
    }

    if (!authLoading && !isAuthenticated) {
      hasRedirectedRef.current = true;
      lastRedirectTimeRef.current = now;
      navigate('/pos-login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // ✅ ENABLED: Reset redirect guard when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      hasRedirectedRef.current = false;
    }
  }, [isAuthenticated]);
  
  // Cleanup subscriptions on unmount only
  useEffect(() => {
    if (isDev) console.log('🧹 POSDesktop: Cleaning up real-time menu subscriptions...');
    cleanupRealtimeMenuStore();
  }, [isDev]); // Empty deps = only runs on mount/unmount

  // Initialize menu store with fast POS bundle loading
  useEffect(() => {
    // React StrictMode guard - prevents double initialization
    let isActive = true;
    let cleanupFunctions: (() => void)[] = [];
    
    // ✅ FIX: Properly await async initialization in IIFE
    (async () => {
      // Use initialization guard - prevents double initialization
      await posPerf.startInitialization('pos_desktop', async () => {
        // Check if effect is still active (not unmounted)
        if (!isActive) {
          return;
        }
        
        try {
          // Mark startup beginning
          posPerf.mark(POSPerfMarks.STARTUP);
          posPerf.mark(POSPerfMarks.BUNDLE_LOAD);
          
          // Only log in development
          const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
          if (isDevelopment) {
            if (isDev) console.log('🚀 [POSDesktop] Starting fast initialization with POS bundle...');
          }
          
          // Try fast bundle loading first
          const bundleSuccess = await loadPOSBundle();
          
          // Check if effect is still active after async operation
          if (!isActive) {
            return;
          }
          
          posPerf.measure(POSPerfMarks.BUNDLE_LOAD, { success: bundleSuccess });
          
          if (bundleSuccess) {
            if (isDevelopment) {
              if (isDev) console.log('✅ [POSDesktop] Fast bundle loaded successfully');
            }
            
            // ✅ FIX: Don't auto-select section - let it default to null to show ALL items
            // The categories array contains real DB categories (UUIDs), not synthetic section IDs
            // When selectedMenuCategory is null, updateFilteredItems shows all items (correct behavior)
            if (isDevelopment) {
              if (isDev) console.log('🎯 [POSDesktop] Showing all menu items (no category pre-selected)');
            }
            
            // Mark first interactive
            posPerf.mark(POSPerfMarks.FIRST_INTERACTIVE);
            
          } else {
            // Fallback to full initialization if bundle fails
            if (isDevelopment) {
              if (isDev) console.log('⚠️ [POSDesktop] Bundle loading failed, falling back to full initialization');
            }
            
            if (isActive) {
              await useRealtimeMenuStore.getState().initialize();
            }
            
            // Check again after async operation
            if (!isActive) {
              return;
            }
            
            // ✅ FIX: Don't auto-select section here either
            if (isDevelopment) {
              if (isDev) console.log('🎯 [POSDesktop] Showing all menu items (no category pre-selected)');
            }
          }
          
          if (isActive) {
            posPerf.measure(POSPerfMarks.STARTUP);
          }
          
          // Log performance summary only in development
          if (isDevelopment && isActive) {
            setTimeout(() => {
              if (isActive) {
                const summary = posPerf.getSummary();
                if (isDev) console.log('📊 [POSDesktop] Performance Summary:', summary);
              }
            }, 100);
          }
          
        } catch (error) {
          const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
          if (isDevelopment && isActive) {
            console.error('❌ [POSDesktop] Error during fast initialization:', error);
          }
          if (isActive) {
            posPerf.record('startup_error', 1, { error: error.message });
          }
          throw error; // Re-throw so guard can handle it
        }
      }).catch((error) => {
        if (isDev && isActive) {
          console.error('❌ [POSDesktop] Initialization guard failed:', error);
        }
      });
    })();
    
    // Cleanup function for React StrictMode and component unmounting
    return () => {
      isActive = false;
      
      // Run any registered cleanup functions
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          // Silently handle cleanup errors
        }
      });
      
      // Reset initialization state to allow fresh start on remount
      posPerf.resetInitialization('pos_desktop');
    };
  }, []);

  // Start real-time subscriptions after bundle loading and UI rendering is complete
  useEffect(() => {
    // React StrictMode guard - prevents double initialization
    let isActive = true;
    
    // Delay subscription startup to allow bundle loading and UI rendering to complete
    const subscriptionDelay = setTimeout(() => {
      if (!isActive) return;
      
      // Use initialization guard to prevent multiple concurrent starts
      posPerf.startInitialization('pos_desktop_subscriptions', async () => {
        // Check if effect is still active (not unmounted)
        if (!isActive) {
          return;
        }
        
        try {
          if (isDev) {
            console.log('🚀 [POSDesktop] Starting real-time subscriptions after bundle completion...');
          }
          
          // Start real-time subscriptions for menu data
          const menuStore = useRealtimeMenuStore.getState();
          menuStore.startRealtimeSubscriptions();
          
          // Check if effect is still active after startup
          if (!isActive) {
            return;
          }
          
          // Mark subscriptions started
          posPerf.mark(POSPerfMarks.FIRST_INTERACTIVE);
          
          // Log completion only in development
          if (isDev && isActive) {
            console.log('✅ [POSDesktop] Real-time subscriptions started successfully');
          }
          
        } catch (error) {
          if (isDev && isActive) {
            console.error('❌ [POSDesktop] Error starting subscriptions:', error);
          }
          if (isActive) {
            posPerf.record('subscriptions_error', 1, { error: error.message });
          }
        }
      }).catch((error) => {
        if (isDev && isActive) {
          console.error('❌ [POSDesktop] Subscriptions guard failed:', error);
        }
      });
    }, 500); // 500ms delay to ensure bundle loading and UI rendering is complete
    
    // Cleanup function for React StrictMode and component unmounting
    return () => {
      isActive = false;
      clearTimeout(subscriptionDelay);
      
      // Reset initialization state to allow fresh start on remount
      posPerf.resetInitialization('pos_desktop_subscriptions');
    };
  }, []);

  // ============================================================================
  // EVENT HANDLERS - Must be defined BEFORE conditional logic (React Rules of Hooks)
  // ============================================================================

  // Handle category selection
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    // ✅ NEW: Start real-time subscriptions on first interaction
    startRealtimeSubscriptionsIfNeeded();
    
    // ✅ NETWORK OPTIMIZATION: Subscribe to selected category only
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.subscribeToCategory(categoryId);
    
    // ✅ FIXED: Pass categoryId directly to store without validation
    // The store has all categories including synthetic sections and real DB categories
    menuStore.setSelectedMenuCategory(categoryId);
  }, []);
  
  // Handle section selection
  const handleSectionSelect = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedCategoryId(null); // Reset category when section changes
    
    // Update menu store to filter by section
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(sectionId);
    menuStore.setSelectedParentCategory(null); // ✅ FIX: Clear parent filter to show all items when "All Items" clicked
  }, []);

  // Handle category pill selection (child categories)
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    
    // Update menu store
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(categoryId);
  }, []);
  
  // Get child categories for selected section
  const childCategories = useMemo(() => {
    if (!selectedSectionId) return [];
    
    return categories.filter(cat => cat.parent_category_id === selectedSectionId);
  }, [categories, selectedSectionId]);

  // ============================================================================
  // CONDITIONAL RENDERING (check auth state early)
  // ============================================================================
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(25, 25, 25, 0.65) 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Don't render POSDesktop if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // RENDER HELPERS
  
  // Header Component
  const renderHeader = () => {
    return (
      <div>
        {/* Management Header - First Row */}
        <div className="relative">
          <ManagementHeader
            title="Point of Sale"
            className="border-b border-gray-700"
            showGradient={false}
            onAdminSuccess={handleManagementAuthSuccess}
            onLogout={handleLogout}
          />
        </div>

        {/* POS Navigation - Second Row */}
        <POSNavigation
          className="border-b border-gray-700 px-4 py-2"
          activeView={uiStore.activeView}
          currentOrderType={orderStore.orderType}
          onOrderTypeChange={handleOrderTypeChange}
          aiOrdersCount={0}
          onlineOrdersCount={0}
          showAdminControls={true}
        />
      </div>
    );
  };

  // Main View Renderer - NEW: Add view switching logic like POSDesktop
  const renderViewContent = () => {
    switch (uiStore.activeView) {
      case 'online-orders':
        return (
          <OnlineOrderManagement 
            onBack={() => {
              uiStore.setActiveView('pos');
              orderStore.setOrderType('DINE-IN');
            }} 
          />
        );
      
      case 'reservations':
        return (
          <ReservationsPlaceholder 
            onBack={() => {
              uiStore.setActiveView('pos');
              orderStore.setOrderType('DINE-IN');
            }} 
          />
        );
      
      case 'pos':
      default:
        return renderMainPOSView();
    }
  };

  // Main POS View
  const renderMainPOSView = () => {
    // Define zones once to reuse in both legacy and responsive shells
    const zoneCustomer = (
      <POSZoneErrorBoundary zoneName="Order Type & Customer Selection" onReset={() => orderStore.setOrderType('COLLECTION')} showHomeButton>
        <div 
          className="flex flex-col min-w-0 flex-1 min-h-0"
          style={{
            height: '100%',
            minHeight: 0,
            flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
            boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}>
            <h2 className="text-base font-semibold" style={{
              backgroundImage: `linear-gradient(135deg, white 30%, ${QSAITheme.purple.light} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>Order & Customer</h2>
          </div>

          {/* Customer badge or Dine-In table selector */}
          <div className="flex-1 min-h-0 p-3 space-y-3">
            {orderStore.orderType === "DINE-IN" && (
              <DineInTableSelector
                selectedTable={orderStore.selectedTableNumber}
                onTableSelect={handleTableSelect}
                tableOrders={persistentTableOrders}
                tables={restaurantTables} // ✅ NEW: Event-driven tables from hook
                isLoading={tablesLoading} // ✅ NEW: Loading state from hook
                className="w-full"
              />
            )}
            {(orderStore.orderType === "DELIVERY" || orderStore.orderType === "COLLECTION" || orderStore.orderType === "WAITING") && (
              <OrderCustomerCard
                orderType={orderStore.orderType}
                onTakeOrder={handleCustomerDetailsClick}
                onCustomerSelected={handleCustomerIntelligenceSelected}
                onOrderAgain={handleLoadPastOrder}
                onViewOrders={handleOpenOrderHistoryModal}
                onClear={handleClearCustomerIntelligence}
                className="w-full"
              />
            )}
          </div>
        </div>
      </POSZoneErrorBoundary>
    );

    const zoneMenu = (
      <POSZoneErrorBoundary zoneName="Menu Selector" onReset={() => realtimeMenuStore.setSelectedMenuCategory(null)} showHomeButton>
        <div className="min-w-0 flex flex-col" style={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
          {/* Pills Navigation - Replaces CategorySidebar */}
          {!initialization.initialLoad && (
            <div className="flex-shrink-0 space-y-2 p-3" style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {/* Section Pills */}
              <POSSectionPills
                selectedSectionId={selectedSectionId}
                onSectionSelect={handleSectionSelect}
              />
              
              {/* Category Pills - Only show when section is selected */}
              {selectedSectionId && (
                <POSCategoryPills
                  categories={childCategories}
                  selectedCategoryId={selectedCategoryId}
                  onCategorySelect={handleCategorySelect}
                />
              )}
            </div>
          )}
          
          {/* Menu Items Grid */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <POSMenuSelector
              onAddToOrder={handleAddToOrder}
              onCustomizeItem={handleCustomizeItemFromMenu}
              onCategoryChange={handleCategoryChange}
              className="h-full"
              showSkeletons={initialization.initialLoad}
              orderType={orderStore.orderType}
              selectedSectionId={selectedSectionId}
              onSectionSelect={handleSectionSelect}
              childCategories={childCategories}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
              variantCarouselEnabled={variantCarouselEnabled}
            />
          </div>
        </div>
      </POSZoneErrorBoundary>
    );

    const zoneSummary = (
      <POSZoneErrorBoundary zoneName="Order Summary" onReset={handleClearOrder} showHomeButton>
        <div className="min-w-0" style={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
          {initialization.initialLoad ? (
            <OrderSummarySkeleton />
          ) : uiStore.showDineInModal ? (
            // ✅ OPTION C: Hide OrderSummaryPanel when DINE-IN modal is open
            // Prevents UX blending - DINE-IN uses modal order summary, Takeaway uses panel
            <div 
              className="flex items-center justify-center h-full"
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.dark} 100%)`,
                borderRadius: '8px',
                border: `1px solid rgba(124, 93, 250, 0.1)`
              }}
            >
              <div className="text-center space-y-2 px-4">
                <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                  DINE-IN order in progress
                </p>
                <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                  View order details in the table modal
                </p>
              </div>
            </div>
          ) : (
            <OrderSummaryPanel
              orderItems={orderStore.orderType === 'DINE-IN' ? [] : orderStore.orderItems}
              orderType={orderStore.orderType}
              tableNumber={orderStore.selectedTableNumber}
              guestCount={orderStore.guestCount}
              customerFirstName={customerStore.customerData.firstName}
              customerLastName={customerStore.customerData.lastName}
              customerPhone={customerStore.customerData.phone}
              customerEmail={customerStore.customerData.email}
              customerAddress={customerStore.customerData.address}
              customerPostcode={customerStore.customerData.postcode}
              deliveryFee={deliveryFee}
              onAddItem={(item) => {
                orderStore.setOrderItems([...orderStore.orderItems, item]);
              }}
              onRemoveItem={orderManagement.handleRemoveItem}
              onUpdateQuantity={orderManagement.handleUpdateQuantity}
              onClearOrder={handleClearOrder}
              onProcessPayment={handleCompleteOrder}
              onPaymentSuccess={handlePaymentSuccess}
              onSendToKitchen={handleSendToKitchen}
              onPrintBill={handlePrintBill}
              onSaveUpdate={handleSaveUpdate}
              onTableSelect={(tableNum) => orderStore.setSelectedTableNumber(tableNum)}
              onTableSelectionClick={handleShowTableSelection}
              onCloseTableSelection={handleCloseTableSelection}
              onCustomizeItem={handleCustomizeItem}
              onCustomerDetailsClick={handleCustomerDetailsClick}
              onSchedulingChange={handleSchedulingChange}
              schedulingData={null}
              onShowPaymentModal={handleShowPaymentModal}
            />
          )}
        </div>
      </POSZoneErrorBoundary>
    );

    return (
      <ResponsivePOSShell
        zones={{
          customer: zoneCustomer,
          categories: null,
          menu: zoneMenu,
          summary: zoneSummary,
        }}
      />
    );
  };

  // Main app structure - Fixed: Removed circular call
  return (
    <CustomizeOrchestratorProvider>
      {/* Main POS Layout - Two-row grid: content + footer */}
      <div 
        className="grid grid-rows-[1fr_auto] h-screen"
      >
        {/* Row 1: Header + Navigation + Main Content */}
        <div className="flex flex-col overflow-hidden">
          {/* Header and Navigation */}
          {renderHeader()}

          {/* Main Content - Use view content renderer */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {renderViewContent()}
          </div>

          <DineInOrderModal
            isOpen={uiStore.showDineInModal}
            onClose={() => uiStore.setModal('showDineInModal', false)}
            tableId={selectedTableUuid}
            tableNumber={orderStore.selectedTableNumber || undefined}
            tableCapacity={restaurantTables.find(t => t.table_number === orderStore.selectedTableNumber?.toString())?.capacity || 4}
            restaurantTables={restaurantTables}
            linkedTables={linkedTableContext.linkedTableNumbers}
            isPrimaryTable={linkedTableContext.isPrimaryTable}
            totalLinkedCapacity={linkedTableContext.totalLinkedCapacity}
            eventDrivenOrder={orderStore.orderType === 'DINE-IN' ? dineInOrder : null}
            eventDrivenCustomerTabs={orderStore.orderType === 'DINE-IN' ? customerTabsData : []}
            eventDrivenActiveTabId={orderStore.orderType === 'DINE-IN' ? activeTabId : null}
            onEventDrivenSetActiveTabId={orderStore.orderType === 'DINE-IN' ? setActiveTabId : undefined}
            onEventDrivenAddItem={orderStore.orderType === 'DINE-IN' ? addItemToDineIn : undefined}
            onEventDrivenRemoveItem={orderStore.orderType === 'DINE-IN' ? removeItemFromDineIn : undefined}
            onEventDrivenUpdateItemQuantity={orderStore.orderType === 'DINE-IN' ? updateItemQuantity : undefined}
            onEventDrivenUpdateGuestCount={orderStore.orderType === 'DINE-IN' ? updateGuestCount : undefined}
            onEventDrivenSendToKitchen={orderStore.orderType === 'DINE-IN' ? sendDineInToKitchen : undefined}
            onEventDrivenCreateTab={orderStore.orderType === 'DINE-IN' ? createTab : undefined}
            onEventDrivenAddItemsToTab={orderStore.orderType === 'DINE-IN' ? addItemsToTab : undefined}
            onEventDrivenRenameTab={orderStore.orderType === 'DINE-IN' ? renameTab : undefined}
            onEventDrivenCloseTab={orderStore.orderType === 'DINE-IN' ? closeTab : undefined}
            onEventDrivenSplitTab={orderStore.orderType === 'DINE-IN' ? splitTab : undefined}
            onEventDrivenMergeTabs={orderStore.orderType === 'DINE-IN' ? mergeTabs : undefined}
            onEventDrivenMoveItemsBetweenTabs={orderStore.orderType === 'DINE-IN' ? moveItemsBetweenTabs : undefined}
            stagingItems={dineInStagingItems}
            onAddToStaging={addToStagingCart}
            onRemoveFromStaging={removeFromStagingCart}
            onClearStaging={clearStagingCart}
            onPersistStaging={persistStagingCart}
            enrichedItems={dineInEnrichedItems}
            enrichedLoading={dineInEnrichedLoading}
            enrichedError={dineInEnrichedError}
          />
        </div>

        {/* Row 2: Professional Footer - Always at bottom, never overlaps */}
        <div>
          <POSFooter 
            currentOrderType={orderStore.orderType}
            className=""
          />
        </div>

        {/* Guest Count Modal for Table Selection */}
        {uiStore.showGuestCountModal && (
          <POSGuestCountModal 
            isOpen={uiStore.showGuestCountModal}
            onClose={() => uiStore.setModal('showGuestCountModal', false)}
            onSave={handleGuestCountSave}
            tableNumber={orderStore.selectedTableNumber || 0}
            tableCapacity={restaurantTables.find(t => t.table_number === orderStore.selectedTableNumber?.toString())?.capacity || 4}
            initialGuestCount={1}
            restaurantTables={restaurantTables}
            tablesLoading={tablesLoading}
          />
        )}

        {/* Customer Details Modal for COLLECTION/WAITING/DELIVERY */}
        {uiStore.showCustomerModal && (
          <CustomerDetailsModal
            isOpen={uiStore.showCustomerModal}
            onClose={closeCustomerModal}
            onSave={handleCustomerSave}
            orderType={orderStore.orderType}
            initialData={customerStore.customerData}
            orderValue={orderTotal}
            onOrderTypeSwitch={handleOrderTypeSwitch}
            onManagerOverride={handleManagerOverride}
            requestManagerApproval={requestManagerApproval}
            managerOverrideGranted={managerOverrideGranted}
          />
        )}

        {/* Admin Side Panel - Opens after successful management password authentication */}
        <AdminSidePanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
          defaultTab="dashboard"
        />

        {/* Session Restore Dialog - NEW: Prompt user to restore saved session */}
        <Dialog open={uiStore.showSessionRestoreDialog} onOpenChange={(open) => !open && handleSessionDiscard()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>🔄 Restore Previous Order?</DialogTitle>
              <DialogDescription>
                {pendingSession && (
                  <>
                    Found a saved order from{' '}
                    <strong>{Math.round((Date.now() - pendingSession.timestamp) / 1000 / 60)} minutes ago</strong>.
                    <br />
                    <br />
                    <div className="text-sm space-y-1">
                      <div>🛍️ <strong>{pendingSession.orderItems.length} items</strong></div>
                      <div>📦 <strong>{pendingSession.orderType}</strong></div>
                      {pendingSession.selectedTableNumber && (
                        <div>🎲 Table <strong>{pendingSession.selectedTableNumber}</strong></div>
                      )}
                      <div>💷 Total: <strong>£{pendingSession.total.toFixed(2)}</strong></div>
                    </div>
                    <br />
                    Would you like to restore this order or start fresh?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleSessionDiscard}>
                🗑️ Start Fresh
              </Button>
              <Button onClick={handleSessionRestore}>
                ✅ Restore Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CustomerOrderHistoryModal - Shows recent orders for selected customer */}
        <CustomerOrderHistoryModal
          isOpen={showOrderHistoryModal}
          onClose={handleCloseOrderHistoryModal}
          customer={usePOSCustomerIntelligence.getState().customerProfile}
          orders={usePOSCustomerIntelligence.getState().customerProfile?.recent_orders || []}
          onReorder={handleLoadPastOrder}
        />

        {/* PaymentChoiceModal - Choose between immediate payment or pay later */}
        <PaymentChoiceModal
          isOpen={showPaymentChoiceModal}
          onClose={() => setShowPaymentChoiceModal(false)}
          onSelectMode={handleSelectPaymentMode}
          orderTotal={orderTotal}
          orderType={orderStore.orderType as 'WAITING' | 'COLLECTION' | 'DELIVERY'}
        />

        {/* Payment Flow Orchestrator - Full Stripe payment flow */}
        <PaymentFlowOrchestrator
          isOpen={uiStore.showPaymentFlow}
          onClose={handleClosePaymentModal}
          mode={paymentFlowMode}
          orderItems={orderStore.orderItems}
          orderTotal={orderTotal}
          orderType={orderStore.orderType}
          tableNumber={orderStore.selectedTableNumber || undefined}
          guestCount={orderStore.guestCount}
          customerData={customerStore.customerData}
          deliveryFee={deliveryFee}
          onPaymentComplete={handlePaymentFlowComplete}
        />

        {/* NEW: DINE-IN Kitchen Preview Modal */}
        <DineInKitchenPreviewModal
          isOpen={showKitchenPreviewModal}
          onClose={() => setShowKitchenPreviewModal(false)}
          orderItems={orderStore.orderItems}
          tableNumber={orderStore.selectedTableNumber}
          guestCount={orderStore.guestCount}
          onSaveOnly={handleSaveOrderOnly}
          onSaveAndPrint={handleSaveAndPrint}
        />

        {/* NEW: DINE-IN Bill Preview Modal */}
        <DineInBillPreviewModal
          isOpen={showBillPreviewModal}
          onClose={() => setShowBillPreviewModal(false)}
          orderItems={orderStore.orderItems}
          tableNumber={orderStore.selectedTableNumber}
          guestCount={orderStore.guestCount}
          orderTotal={orderTotal}
          onPrintBill={async (orderTotal: number) => {
            const success = await printing.handlePrintBill(orderTotal);
            if (success) {
              toast.success('Bill printed successfully');
            }
            return success;
          }}
        />
      </div>
    </CustomizeOrchestratorProvider>
  );
}
