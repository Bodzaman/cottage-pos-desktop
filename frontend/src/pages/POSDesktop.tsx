import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

// Databutton imports
import { supabase } from 'utils/supabaseClient';

// Store imports
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useRealtimeMenuStore, loadPOSBundle, cleanupRealtimeMenuStore, startRealtimeSubscriptionsIfNeeded, setMenuStoreContext } from '../utils/realtimeMenuStore';
import { useCustomerDataStore } from '../utils/customerDataStore';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
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
import { useActiveOrders } from 'utils/useActiveOrders';

// Enhanced image preloading imports
import { OrderSummarySkeleton } from 'components/OrderSummarySkeleton';
import { POSZoneErrorBoundary } from 'components/POSZoneErrorBoundary';

// Utility imports
import { QSAITheme } from '../utils/QSAIDesign';
import { createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';
import posPerf, { POSPerfMarks } from 'utils/posPerformance';
import { generateDisplayName } from 'utils/menuHelpers';
import { getOrderItems } from 'utils/posSupabaseHelpers';

// Component imports
import { ManagementHeader } from '../components/ManagementHeader';
import { POSNavigation } from '../components/POSNavigation';
import { DineInTableSelector } from '../components/DineInTableSelector';
import { DineInTableDashboard } from '../components/DineInTableDashboard';
import { POSSectionPills } from '../components/POSSectionPills';
import { POSCategoryPills } from '../components/POSCategoryPills';
import { POSMenuSelector } from '../components/POSMenuSelector';
import { OrderSummaryPanel } from '../components/OrderSummaryPanel';
import { OrderCustomerCard } from '../components/OrderCustomerCard';
import { POSButton } from '../components/POSButton';
import { CustomerDetailsModal } from 'components/CustomerDetailsModal';
import { CustomerOrderHistoryModal } from 'components/CustomerOrderHistoryModal';
import { POSGuestCountModal } from 'components/POSGuestCountModal';
import { DineInOrderWorkspace } from 'components/DineInOrderWorkspace';
import { DineInKitchenPreviewModal } from 'components/DineInKitchenPreviewModal';
import { DineInBillPreviewModal } from 'components/DineInBillPreviewModal';
import { CustomizeOrchestratorProvider } from '../components/CustomizeOrchestrator';
import { POSFooter } from 'components/POSFooter';
import { POSLockScreen } from 'components/POSLockScreen';
import { POSOfflineBanner } from 'components/POSOfflineBanner';
import { AnimatePresence } from 'framer-motion';
import { AdminSidePanel } from 'components/AdminSidePanel';
import { AvatarDropdown } from 'components/AvatarDropdown';
import { PaymentFlowOrchestrator } from 'components/PaymentFlowOrchestrator';
import { PaymentFlowResult } from 'utils/paymentFlowTypes';
import { Loader2 } from 'lucide-react';

// View Components - Import from POSDesktop for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { MenuItem, OrderItem, ModifierSelection, PaymentResult } from '../utils/menuTypes';
import { TipSelection } from '../components/POSTipSelector';
import { usePOSSettingsWithAutoFetch } from '@/utils/posSettingsStore';

// Custom hooks
import { useOrderManagement } from 'utils/useOrderManagement';
import { useCustomerFlow } from 'utils/useCustomerFlow';
import { useOrderProcessing } from 'utils/useOrderProcessing';
import { usePrintingOperations } from 'utils/usePrintingOperations';
import { usePOSInitialization } from 'utils/usePOSInitialization';

import { OfflineFirst } from '../utils/offlineFirstManager';
import { type PersistedSession } from '../utils/sessionPersistence';
import { startPOSHeartbeat } from '../utils/posHeartbeat';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * POSDesktop - Professional Point of Sale interface
 */
export default function POSDesktop() {
  const isDev = (import.meta as any).env?.DEV;
  const navigate = useNavigate();
  const location = useLocation();
  useSimpleAuth();
  const { user, isAuthenticated, isLoading: authLoading, logout, pinEnabled } = usePOSAuth();

  // Lock screen state with 10-minute inactivity timeout
  const [isLocked, setIsLocked] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Only set timer if PIN is enabled (otherwise lock screen won't work)
    if (pinEnabled) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT);
    }
  }, [pinEnabled]);

  useEffect(() => {
    if (!pinEnabled) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetInactivityTimer(); // Start timer on mount

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [pinEnabled, resetInactivityTimer]);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // F4 shortcut handler - lock screen manually
  const handleLockScreen = useCallback(() => {
    if (pinEnabled) setIsLocked(true);
  }, [pinEnabled]);

  // 🎯 DRAFT/PUBLISH WORKFLOW: Set POS context to only see published menu items
  // This must be called BEFORE any store initialization
  // NOTE: We do NOT call initialize() here - usePOSInitialization handles data loading
  // This prevents the slow full refresh from overwriting the fast POS bundle
  useEffect(() => {
    setMenuStoreContext('pos');
    // usePOSInitialization will:
    // 1. Load fast POS bundle with resolved image URLs (~20ms)
    // 2. Trigger background network refresh (~700ms, silent update)
    // 3. Start real-time subscriptions for live updates

    // ✅ CLEANUP: Properly tear down realtime subscriptions on unmount
    // This prevents memory leaks from Supabase channels remaining subscribed
    return () => {
      cleanupRealtimeMenuStore();
    };
  }, []);

  // 🔄 POS HEARTBEAT: Send periodic heartbeat to backend
  // This enables the customer website to detect when POS is offline
  // and block online orders accordingly (industry-standard pattern)
  useEffect(() => {
    const stopHeartbeat = startPOSHeartbeat();
    return stopHeartbeat;
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/pos-login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  // Admin users should not be on POSDesktop - redirect to Admin portal
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAuthenticated, user?.role, navigate]);

  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const managerApprovalResolverRef = useRef<((approved: boolean) => void) | null>(null);
  const [managerOverrideGranted, setManagerOverrideGranted] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ============================================================================
  // SESSION PERSISTENCE STATE
  // ============================================================================
  const [pendingSession, setPendingSession] = useState<PersistedSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const showSessionRestoreDialog = usePOSUIStore(state => state.showSessionRestoreDialog);

  const categories = useRealtimeMenuStore(state => state.categories, shallow);
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const isLoading = useRealtimeMenuStore(state => state.isLoading);
  const isConnected = useRealtimeMenuStore(state => state.isConnected);
  const setSearchQuery = useRealtimeMenuStore(state => state.setSearchQuery);
  
  // ✅ FIX: Use reactive selectors for values that should trigger re-renders
  // Use getState() only for actions (mutations), not for reading values
  const orderType = usePOSOrderStore(state => state.orderType);
  const orderItems = usePOSOrderStore(state => state.orderItems, shallow);
  const selectedTableNumber = usePOSOrderStore(state => state.selectedTableNumber);
  const guestCount = usePOSOrderStore(state => state.guestCount);
  const setOrderType = usePOSOrderStore(state => state.setOrderType);
  const setOrderItems = usePOSOrderStore(state => state.setOrderItems);
  const setSelectedTableNumber = usePOSOrderStore(state => state.setSelectedTableNumber);
  const setGuestCount = usePOSOrderStore(state => state.setGuestCount);
  const clearOrder = usePOSOrderStore(state => state.clearOrder);
  
  const customerData = usePOSCustomerStore(state => state.customerData, shallow);
  const updateCustomer = usePOSCustomerStore(state => state.updateCustomer);
  const clearCustomer = usePOSCustomerStore(state => state.clearCustomer);
  
  const activeView = usePOSUIStore(state => state.activeView);
  const posViewMode = usePOSUIStore(state => state.posViewMode);
  const setPosViewMode = usePOSUIStore(state => state.setPosViewMode);
  const showDineInModal = usePOSUIStore(state => state.showDineInModal);
  const showGuestCountModal = usePOSUIStore(state => state.showGuestCountModal);
  const showCustomerModal = usePOSUIStore(state => state.showCustomerModal);
  const showPaymentFlow = usePOSUIStore(state => state.showPaymentFlow);
  const setActiveView = usePOSUIStore(state => state.setActiveView);
  const setModal = usePOSUIStore(state => state.setModal);
  const setQueuedJobsCount = usePOSUIStore(state => state.setQueuedJobsCount);
  const persistedTableOrders = useTableOrdersStore((state) => state.persistedTableOrders);
  const createTableOrder = useTableOrdersStore((state) => state.createTableOrder);

  const { tables: restaurantTables, loading: tablesLoading, refetch: refetchTables } = useRestaurantTables();

  // Active orders - source of truth for linked tables data
  const { orders: activeOrders } = useActiveOrders();

  // Customer intelligence for order history
  const { customerProfile, clearCustomer: clearIntelligenceCustomer } = usePOSCustomerIntelligence();
  
  const selectedTableUuid = useMemo(() => {
    if (orderType !== 'DINE-IN' || !selectedTableNumber) return null;
    const table = restaurantTables.find((t: any) => Number(t.table_number) === selectedTableNumber);
    return table?.id || null;
  }, [orderType, selectedTableNumber, restaurantTables]);

  // Dynamic table capacity lookup
  const selectedTableCapacity = useMemo(() => {
    if (!selectedTableNumber) return 4;
    const table = restaurantTables.find((t: any) => parseInt(t.table_number) === selectedTableNumber);
    return table?.capacity || 4;
  }, [selectedTableNumber, restaurantTables]);

  const linkedTableContext = useMemo(() => {
    if (orderType !== 'DINE-IN' || !selectedTableNumber) {
      return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    }

    // PRIMARY SOURCE: Check active orders (source of truth for linked tables)
    const activeOrder = activeOrders.find(o =>
      o.tableNumber === selectedTableNumber ||
      (o.linkedTables && o.linkedTables.includes(selectedTableNumber))
    );

    if (activeOrder && activeOrder.linkedTables && activeOrder.linkedTables.length > 1) {
      const linkedTableNumbers = activeOrder.linkedTables.filter(t => t !== selectedTableNumber);
      const isPrimaryTable = activeOrder.tableNumber === selectedTableNumber;
      const selectedTable = restaurantTables.find((t: any) => parseInt(t.table_number) === selectedTableNumber);
      const linkedTableObjects = restaurantTables.filter((t: any) => linkedTableNumbers.includes(parseInt(t.table_number)));
      const totalLinkedCapacity = (selectedTable?.capacity || 0) + linkedTableObjects.reduce((sum: number, t: any) => sum + (t.capacity || 0), 0);
      return { linkedTableNumbers, isPrimaryTable, totalLinkedCapacity };
    }

    // FALLBACK: Check restaurantTables for legacy data
    const selectedTable = restaurantTables.find((t: any) => parseInt(t.table_number) === selectedTableNumber);
    if (!selectedTable) return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    const isLinked = selectedTable.is_linked_table || selectedTable.is_linked_primary;
    if (!isLinked || !selectedTable.linked_with_tables) return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    const linkedTableNumbers = selectedTable.linked_with_tables;
    const isPrimaryTable = selectedTable.is_linked_primary || false;
    const linkedTableObjects = restaurantTables.filter((t: any) => linkedTableNumbers.includes(parseInt(t.table_number)));
    const totalLinkedCapacity = selectedTable.capacity + linkedTableObjects.reduce((sum: number, t: any) => sum + (t.capacity || 0), 0);
    return { linkedTableNumbers, isPrimaryTable, totalLinkedCapacity };
  }, [orderType, selectedTableNumber, restaurantTables, activeOrders]);

  const { order: dineInOrder, enrichedItems: dineInEnrichedItems, enrichedLoading: dineInEnrichedLoading, enrichedError: dineInEnrichedError, createOrder, addItem: addItemToDineIn, removeItem: removeItemFromDineIn, updateItemQuantity, sendToKitchen: sendDineInToKitchen, updateGuestCount } = useDineInOrder(selectedTableUuid || '');

  const dineInOrderRef = useRef(dineInOrder);
  useEffect(() => { dineInOrderRef.current = dineInOrder; }, [dineInOrder]);

  // Pass orderId to useCustomerTabs for proper tab scoping (tabs are cleaned up when order completes)
  const { customerTabs: customerTabsData, activeTabId, setActiveTabId, createTab, addItemsToTab, renameTab, closeTab, splitTab, mergeTabs, moveItemsBetweenTabs } = useCustomerTabs(orderType === 'DINE-IN' ? selectedTableNumber : null, dineInOrder?.id);

  const [dineInStagingItems, setDineInStagingItems] = useState<OrderItem[]>([]);
  const addToStagingCart = useCallback((item: OrderItem) => setDineInStagingItems(prev => [...prev, item]), []);
  const removeFromStagingCart = useCallback((itemId: string) => setDineInStagingItems(prev => prev.filter(item => item.id !== itemId)), []);
  const clearStagingCart = useCallback(() => setDineInStagingItems([]), []);

  // Guard ref to prevent concurrent execution of persistStagingCart (defense in depth)
  const isPersistingRef = useRef(false);

  const persistStagingCart = useCallback(async () => {
    // Guard against concurrent execution (race condition from double-clicks)
    if (isPersistingRef.current) {
      console.log('[POSDesktop] persistStagingCart already in progress, skipping');
      return false;
    }
    if (dineInStagingItems.length === 0) return false;
    if (!dineInOrderRef.current) {
      const startTime = Date.now();
      while (!dineInOrderRef.current && (Date.now() - startTime < 3000)) await new Promise(r => setTimeout(r, 100));
      if (!dineInOrderRef.current) return false;
    }

    isPersistingRef.current = true;
    try {
      for (const item of dineInStagingItems) await addItemToDineIn(item);
      setDineInStagingItems([]);
      return true;
    } catch { return false; }
    finally {
      isPersistingRef.current = false;
    }
  }, [dineInStagingItems, addItemToDineIn]);

  const clearCustomerData = useCustomerDataStore(state => state.clearCustomerData);
  const setCustomerData = useCustomerDataStore(state => state.setCustomerData);
  const customerDataStoreData = useCustomerDataStore(state => state.customerData, shallow);
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const { settings: posSettings } = usePOSSettingsWithAutoFetch();
  const variantCarouselEnabled = posSettings?.variant_carousel_enabled ?? true;
  
  const orderTotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [orderItems]);
  const deliveryFee = useMemo((): number => {
    if (orderType === "DELIVERY" && (customerData as any).deliveryFee !== undefined) return (customerData as any).deliveryFee;
    if (orderType === "DELIVERY" && posSettings?.delivery_charge?.enabled) return posSettings.delivery_charge.amount;
    return 0;
  }, [orderType, customerData, posSettings]);
  
  const initialization = usePOSInitialization({ onViewChange: (view: any) => setActiveView(view) });

  // ============================================================================
  // CRASH DETECTION: Clean Exit Flag (localStorage)
  // Only show session restore dialog after unexpected termination (crash)
  // ============================================================================

  // Set crash marker when order becomes active
  useEffect(() => {
    if (orderItems.length > 0 && orderType !== 'DINE-IN') {
      localStorage.setItem('pos_clean_exit', 'false');
    }
  }, [orderItems.length, orderType]);

  // Register beforeunload + unmount cleanup to mark clean exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('pos_clean_exit', 'true');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      localStorage.setItem('pos_clean_exit', 'true'); // SPA navigation = clean exit
    };
  }, []);

  // ============================================================================
  // SESSION PERSISTENCE & RESTORATION (crash recovery only)
  // ============================================================================

  // Load saved session on mount - only restore if crash detected
  useEffect(() => {
    const loadSavedSession = async () => {
      if (isLoadingSession) {
        if (isDev) console.log('[POSDesktop] Session load already in progress, skipping');
        return;
      }

      setIsLoadingSession(true);

      try {
        // Check crash detection flag - only restore after unexpected termination
        const cleanExit = localStorage.getItem('pos_clean_exit');

        if (cleanExit !== 'false') {
          // Last exit was clean (or flag never set) - clear any stale IndexedDB data
          if (isDev) console.log('[POSDesktop] Clean exit detected, clearing stale session data');
          await OfflineFirst.clearAllSessions();
          return;
        }

        // Crash detected (pos_clean_exit === 'false') - check for recoverable session
        const savedSession = await OfflineFirst.loadSession();

        if (savedSession && savedSession.orderItems?.length > 0) {
          if (isDev) console.log('[POSDesktop] Crash detected - found recoverable session:', savedSession);
          setPendingSession(savedSession);
          setModal('showSessionRestoreDialog', true);
        } else {
          if (isDev) console.log('[POSDesktop] Crash flag set but no session data, resetting');
          localStorage.setItem('pos_clean_exit', 'true');
        }
      } catch (error) {
        console.error('[POSDesktop] Failed to load saved session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSavedSession();
  }, []);

  // Handle session discard (user chooses to start fresh)
  const handleSessionDiscard = useCallback(async () => {
    if (isDev) console.log('[POSDesktop] User discarded saved session');

    try {
      await OfflineFirst.clearAllSessions();
      localStorage.setItem('pos_clean_exit', 'true');
      setPendingSession(null);
      setModal('showSessionRestoreDialog', false);
      toast.success('Starting fresh order');
    } catch (error) {
      console.error('[POSDesktop] Failed to discard session:', error);
      toast.error('Failed to clear saved session');
    }
  }, []);

  // Handle session restore (user chooses to restore saved order)
  const handleSessionRestore = useCallback(async () => {
    if (!pendingSession) {
      if (isDev) console.warn('⚠️ [POSDesktop] No pending session to restore');
      return;
    }

    if (isDev) console.log('✅ [POSDesktop] Restoring saved session:', pendingSession);

    try {
      setOrderItems(pendingSession.orderItems);
      setOrderType(pendingSession.orderType);
      updateCustomer(pendingSession.customerData);
      setSelectedTableNumber(pendingSession.selectedTableNumber);
      setGuestCount(pendingSession.guestCount);
      setModal('showSessionRestoreDialog', false);
      setPendingSession(null);

      toast.success(`Restored order with ${pendingSession.orderItems.length} items`);
    } catch (error) {
      console.error('❌ [POSDesktop] Failed to restore session:', error);
      toast.error('Failed to restore saved order');
    }
  }, [pendingSession, setOrderItems, setOrderType, updateCustomer, setSelectedTableNumber, setGuestCount]);

  // Auto-save session when order changes (only for non-DINE-IN orders with items)
  useEffect(() => {
    if (orderType === 'DINE-IN') return; // DINE-IN uses database persistence
    if (orderItems.length === 0) return; // Nothing to save

    const saveCurrentSession = async () => {
      try {
        const session: PersistedSession = {
          sessionId: `pos-session-${Date.now()}`,
          orderItems,
          orderType,
          customerData,
          selectedTableNumber,
          guestCount,
          timestamp: Date.now(),
          subtotal: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          tax: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.2,
          total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.2,
        };
        await OfflineFirst.saveSession(session);
        if (isDev) console.log('💾 [POSDesktop] Session auto-saved:', session.orderItems.length, 'items');
      } catch (error) {
        console.error('❌ [POSDesktop] Failed to auto-save session:', error);
      }
    };

    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(saveCurrentSession, 2000);
    return () => clearTimeout(timeoutId);
  }, [orderItems, orderType, customerData, selectedTableNumber, guestCount]);

  const handleLogout = useCallback(async () => { await logout(); navigate('/pos-login', { replace: true }); }, [logout, navigate]);
  const handleManagementAuthSuccess = useCallback(() => { setManagerOverrideGranted(true); if (managerApprovalResolverRef.current) managerApprovalResolverRef.current(true); setIsManagementDialogOpen(false); setShowAdminPanel(true); }, []);

  const handleViewModeChange = useCallback((mode: 'DINE_IN' | 'TAKE_AWAY' | 'ONLINE' | 'RESERVATIONS') => {
    setPosViewMode(mode);
    switch (mode) {
      case 'DINE_IN':
        setOrderType('DINE-IN');
        setActiveView('pos');
        break;
      case 'TAKE_AWAY':
        if (!['COLLECTION', 'DELIVERY', 'WAITING'].includes(orderType)) {
          setOrderType('COLLECTION');
        }
        setActiveView('pos');
        break;
      case 'ONLINE':
        setActiveView('pos');
        break;
      case 'RESERVATIONS':
        setActiveView('pos');
        break;
    }
  }, [orderType]);
  
  const handleTableSelect = useCallback((tableNumber: number, tableStatus?: string) => {
    const table = restaurantTables.find((t: any) => parseInt(t.table_number) === tableNumber);
    if (table?.is_linked_table || table?.is_linked_primary || (tableStatus && tableStatus !== 'AVAILABLE')) {
      setOrderType('DINE-IN');
      setSelectedTableNumber(tableNumber);
      setModal('showDineInModal', true);
    } else {
      setOrderType('DINE-IN');
      setSelectedTableNumber(tableNumber);
      setModal('showGuestCountModal', true);
    }
    updateCustomer({ ...customerDataStoreData, tableNumber: tableNumber.toString(), guestCount: guestCount || 1 } as any);
  }, [restaurantTables, customerDataStoreData]);
  
  const handleGuestCountSave = useCallback(async (guestCount: number, action: string, linkedTables?: number[]) => {
    const tableIdVal = selectedTableNumber;
    if (!tableIdVal) return;

    // Generate table group ID if linking tables
    const allTableNumbers = linkedTables && linkedTables.length > 0
      ? [tableIdVal, ...linkedTables]
      : [tableIdVal];
    const tableGroupId = allTableNumbers.length > 1 ? `group_${Date.now()}` : undefined;

    // Create order with all linking data (orders are the source of truth)
    const orderId = await createOrder({
      guestCount,
      linkedTables: allTableNumbers,
      tableGroupId,
    });

    if (orderId !== null) {
      // Sync to table_orders table for dashboard display (legacy compatibility)
      await createTableOrder(tableIdVal, guestCount, linkedTables || []);

      if (action === 'link' && linkedTables && linkedTables.length > 0) {
        // Note: Linking data is now stored in the orders table (source of truth)
        // The dashboard will derive linking state from orders via useTableState hook
        toast.success(`Linked tables ${allTableNumbers.map(t => `T${t}`).join(' + ')}`);
        await refetchTables();
      }

      setGuestCount(guestCount);
      setModal('showGuestCountModal', false);
      setModal('showDineInModal', true);
    }
  }, [createOrder, createTableOrder, refetchTables, selectedTableNumber]);

  const handleLoadPastOrder = useCallback(async (order: any) => {
    const data = await getOrderItems(order.order_id);
    if (data.success && data.items) {
      const items = data.items.map((i: any) => ({
        id: i.id || i.menu_item_id,
        menu_item_id: i.menu_item_id,
        variant_id: i.variant_id || '',
        name: generateDisplayName(i.name, i.variant_name, i.protein_type),
        price: parseFloat(i.price || 0),
        quantity: parseInt(i.quantity || 1),
        variantName: i.variant_name,
        protein_type: i.protein_type || '',
        modifiers: i.modifiers || [],
        notes: i.notes || '',
        image_url: i.image_url || '',
      }));
      setOrderItems([...orderItems, ...items]);
      setShowOrderHistoryModal(false);
    }
  }, []);

  const calculateOrderTotal = useCallback((): number => {
    return orderItems.reduce((total: number, item: OrderItem) => {
      let it = item.price * item.quantity;
      if (item.modifiers) item.modifiers.forEach((m: any) => { it += (m.price_adjustment || 0) * item.quantity; });
      return total + it;
    }, 0);
  }, [orderItems]);

  const handleCustomerSave = useCallback((data: any) => { updateCustomer(data); setCustomerData(data); }, [setCustomerData]);

  const orderManagement = useOrderManagement(orderItems, setOrderItems);
  const customerFlow = useCustomerFlow(orderType as any, customerData as any, (data: any) => updateCustomer(data), selectedTableNumber, guestCount);
  const orderProcessing = useOrderProcessing(orderType as any, orderItems, customerData as any, selectedTableNumber, guestCount);
  const printing = usePrintingOperations(orderType as any, orderItems, customerData as any, selectedTableNumber, guestCount);


  const handleAddToOrder = useCallback((item: OrderItem) => {
    if (orderType === 'DINE-IN') addItemToDineIn(item);
    else orderManagement.handleAddToOrder(item);
  }, [orderType, addItemToDineIn, orderManagement]);

  const handleClearOrder = useCallback(async () => {
    orderManagement.handleClearOrder();
    clearOrder();
    await OfflineFirst.clearAllSessions();
    localStorage.setItem('pos_clean_exit', 'true');
  }, [orderManagement]);

  const handlePaymentSuccess = useCallback(async (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    const subtotal = calculateOrderTotal();
    const finalTotal = subtotal * 1.2 + tipSelection.amount;
    await (orderProcessing as any).persistPayment({ payment_method: paymentResult?.method || 'CASH', subtotal, tax_amount: subtotal * 0.2, tip_amount: tipSelection.amount, total_amount: finalTotal });
    await printing.handlePrintKitchen();
    await printing.handlePrintReceipt(finalTotal);
    clearOrder();
    clearCustomer();
    await OfflineFirst.clearAllSessions();
    localStorage.setItem('pos_clean_exit', 'true');
  }, [calculateOrderTotal, orderProcessing, printing]);

  const handleSendToKitchen = useCallback(async () => {
    if (orderItems.length === 0) return;
    const subtotal = calculateOrderTotal();
    await supabase.from('orders').insert({ order_type: orderType, table_number: selectedTableNumber, guest_count: guestCount || 1, items: orderItems as any, subtotal, tax_amount: subtotal * 0.2, total_amount: subtotal * 1.2, status: 'IN_PROGRESS', created_at: new Date().toISOString() });
    toast.success('🍽️ Sent to kitchen!');
  }, [calculateOrderTotal]);

  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [showKitchenPreviewModal, setShowKitchenPreviewModal] = useState(false);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);

  const handleShowPaymentModal = useCallback(async () => {
    if (orderType === 'DINE-IN') return await printing.handlePrintBill(orderTotal);
    // Skip PaymentChoiceModal - go directly to PaymentFlowOrchestrator
    // User will choose "Take Payment Now" or "Pay on Collection" from the confirmation view
    setModal('showPaymentFlow', true);
  }, [orderType, printing, orderTotal]);

  const handlePaymentFlowComplete = useCallback(async (result: PaymentFlowResult) => {
    if (!result.success) {
      setModal('showPaymentFlow', false);
      return;
    }

    // Check if we have captured images for WYSIWYG printing
    const electronAPI = window.electronAPI as any;
    if (result.capturedReceiptImages && electronAPI?.printReceiptRaster) {
      console.log('🖨️ [POSDesktop] Using WYSIWYG raster printing for takeaway order...');

      // Print kitchen ticket
      if (result.capturedReceiptImages.kitchen) {
        try {
          const kitchenResult = await electronAPI.printReceiptRaster({
            imageData: result.capturedReceiptImages.kitchen,
            paperWidth: 80
          });
          if (kitchenResult.success) {
            console.log('✅ Kitchen ticket printed via WYSIWYG on', kitchenResult.printer);
          } else {
            console.warn('⚠️ Kitchen ticket print failed:', kitchenResult.error);
          }
        } catch (err) {
          console.error('❌ Kitchen ticket print error:', err);
        }
      }

      // Print customer receipt
      if (result.capturedReceiptImages.customer) {
        try {
          const customerResult = await electronAPI.printReceiptRaster({
            imageData: result.capturedReceiptImages.customer,
            paperWidth: 80
          });
          if (customerResult.success) {
            console.log('✅ Customer receipt printed via WYSIWYG on', customerResult.printer);
            toast.success('Order placed & receipts printed');
          } else {
            console.warn('⚠️ Customer receipt print failed:', customerResult.error);
            toast.warning('Order placed but receipt print failed');
          }
        } catch (err) {
          console.error('❌ Customer receipt print error:', err);
        }
      }
    } else {
      // Fallback to queue-based printing if no captured images
      console.log('🖨️ [POSDesktop] Using queue-based printing (no captured images)...');
      // Pass paymentStatus for PAID badge: 'PAID' if payment taken, undefined for pay-later
      const paymentStatus = result.paymentStatus;
      await printing.handlePrintKitchen(paymentStatus);
      await printing.handlePrintReceipt(result.orderTotal ?? 0, paymentStatus);
      const successMsg = paymentStatus === 'PAID' ? 'Payment complete - receipts printed' : 'Order placed - receipts printed';
      toast.success(successMsg);
    }

    clearOrder();
    clearCustomer();
    await OfflineFirst.clearAllSessions();
    localStorage.setItem('pos_clean_exit', 'true');
    setModal('showPaymentFlow', false);
  }, [printing, clearOrder, clearCustomer]);

  const { printerStatus } = useOnDemandPrinter();

  useEffect(() => {
    if (printerStatus?.queuedJobs !== undefined) setQueuedJobsCount(printerStatus.queuedJobs);
  }, [printerStatus]);

  useEffect(() => {
    const timer = setTimeout(() => { startRealtimeSubscriptionsIfNeeded(); }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSectionSelect = useCallback((id: string | null) => { setSelectedSectionId(id); setSelectedCategoryId(null); useRealtimeMenuStore.getState().setSelectedMenuCategory(id); }, []);
  const handleCategorySelect = useCallback((id: string | null) => { setSelectedCategoryId(id); useRealtimeMenuStore.getState().setSelectedMenuCategory(id); }, []);
  const childCats = useMemo(() => selectedSectionId ? categories.filter(c => c.parent_category_id === selectedSectionId) : [], [categories, selectedSectionId]);

  const renderMainPOSView = () => {
    // Full-width table dashboard for DINE-IN mode
    if (posViewMode === 'DINE_IN') {
      return (
        <DineInTableDashboard
          tables={restaurantTables}
          persistedTableOrders={persistedTableOrders as any}
          customerTabs={customerTabsData as any}
          onTableSelect={handleTableSelect}
          selectedTableNumber={selectedTableNumber}
          isLoading={tablesLoading}
        />
      );
    }

    // Online Orders mode - render inline
    if (posViewMode === 'ONLINE') {
      return <OnlineOrderManagement />;
    }

    // Reservations mode - render inline
    if (posViewMode === 'RESERVATIONS') {
      return <ReservationsPlaceholder />;
    }

    // Existing 3-panel layout for takeaway modes
    return (
      <ResponsivePOSShell zones={{
        customer: (
          <POSZoneErrorBoundary zoneName="Customer" onReset={() => {}} showHomeButton>
            <div className="flex flex-col h-full bg-[#121212] rounded-lg overflow-hidden border border-white/5 p-3">
              <OrderCustomerCard orderType={orderType as 'COLLECTION' | 'DELIVERY' | 'WAITING'} onModeChange={(mode) => setOrderType(mode)} onTakeOrder={() => setModal('showCustomerModal', true)} onEdit={() => setModal('showCustomerModal', true)} onViewOrders={() => setShowOrderHistoryModal(true)} onClear={() => { clearCustomer(); clearCustomerData(); clearIntelligenceCustomer(); }} />
            </div>
          </POSZoneErrorBoundary>
        ),
        categories: null,
        menu: (
          <POSZoneErrorBoundary zoneName="Menu" onReset={() => {}} showHomeButton>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-3 space-y-2 bg-[#121212] border-b border-white/5">
                <POSSectionPills selectedSectionId={selectedSectionId} onSectionSelect={handleSectionSelect} />
                {selectedSectionId && <POSCategoryPills categories={childCats as any} selectedCategoryId={selectedCategoryId} onCategorySelect={handleCategorySelect} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <POSMenuSelector onAddToOrder={handleAddToOrder as any} onCustomizeItem={undefined} onCategoryChange={handleCategorySelect} orderType={orderType} selectedSectionId={selectedSectionId} childCategories={childCats} selectedCategoryId={selectedCategoryId} onCategorySelect={handleCategorySelect} variantCarouselEnabled={variantCarouselEnabled} />
              </div>
            </div>
          </POSZoneErrorBoundary>
        ),
        summary: (
          <POSZoneErrorBoundary zoneName="Order" onReset={handleClearOrder} showHomeButton>
            <OrderSummaryPanel orderItems={orderItems} orderType={orderType as any} tableNumber={selectedTableNumber || 0} guestCount={guestCount} customerFirstName={customerData.firstName} customerLastName={customerData.lastName} customerPhone={customerData.phone} customerAddress={customerData.address} customerPostcode={customerData.postcode} deliveryFee={deliveryFee} onRemoveItem={orderManagement.handleRemoveItem} onUpdateQuantity={(itemId: string, quantity: number) => orderManagement.handleUpdateQuantity(0, quantity) /* dummy index */} onClearOrder={handleClearOrder} onSendToKitchen={handleSendToKitchen} onPrintBill={() => printing.handlePrintBill(orderTotal)} onSaveUpdate={() => {}} onTableSelect={(num: number) => setSelectedTableNumber(num)} onTableSelectionClick={() => setModal('showGuestCountModal', true)} onCustomizeItem={orderManagement.handleCustomizeItem} onCustomerDetailsClick={() => setModal('showCustomerModal', true)} onShowPaymentModal={handleShowPaymentModal} />
          </POSZoneErrorBoundary>
        )
      }} />
    );
  };

  // Keyboard shortcuts: F1-F5 for POS actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when lock screen is active or in input fields
      if (isLocked) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          handleClearOrder();
          toast.info('New order started');
          break;
        case 'F2':
          e.preventDefault();
          if (orderItems.length > 0) {
            setModal('showPaymentFlow', true);
          } else {
            toast.warning('Add items before checkout');
          }
          break;
        case 'F3':
          e.preventDefault();
          if (orderItems.length > 0) {
            printing.handlePrintReceipt(orderTotal);
          }
          break;
        case 'F4':
          e.preventDefault();
          handleLockScreen();
          break;
        case 'F5':
          e.preventDefault();
          loadPOSBundle();
          toast.info('Menu refreshed');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, orderItems, orderTotal, printing, handleClearOrder, handleLockScreen]);

  if (authLoading) return <div className="h-dvh w-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-purple-500" /></div>;
  if (!isAuthenticated) return null;

  return (
    <CustomizeOrchestratorProvider>
      <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-black overflow-hidden">
        {/* Offline/Online Status Banner */}
        <POSOfflineBanner />
        <ManagementHeader title="POS" onAdminSuccess={handleManagementAuthSuccess} onLogout={handleLogout} />
        <POSNavigation currentViewMode={posViewMode} onViewModeChange={handleViewModeChange} />
        <div className="flex-1 overflow-hidden">{renderMainPOSView()}</div>
        <POSFooter currentOrderType={orderType} />
        
        <DineInOrderWorkspace
          isOpen={showDineInModal}
          onClose={() => setModal('showDineInModal', false)}
          tableId={selectedTableUuid}
          tableNumber={selectedTableNumber}
          linkedTables={linkedTableContext.linkedTableNumbers}
          isPrimaryTable={linkedTableContext.isPrimaryTable}
          restaurantTables={restaurantTables as any}
          order={orderType === 'DINE-IN' ? (dineInOrder as any) : null}
          enrichedItems={dineInEnrichedItems || []}
          enrichedLoading={dineInEnrichedLoading}
          enrichedError={dineInEnrichedError}
          onAddItem={addItemToDineIn}
          onRemoveItem={removeItemFromDineIn}
          onUpdateItemQuantity={updateItemQuantity}
          onSendToKitchen={sendDineInToKitchen}
          onUpdateGuestCount={updateGuestCount}
          customerTabs={customerTabsData as any}
          activeTabId={activeTabId}
          onSetActiveTabId={setActiveTabId}
          onCreateTab={createTab}
          onRenameTab={renameTab}
          onCloseTab={closeTab}
          stagingItems={dineInStagingItems}
          onAddToStaging={addToStagingCart}
          onRemoveFromStaging={removeFromStagingCart}
          onClearStaging={clearStagingCart}
          onPersistStaging={persistStagingCart}
          onPrintBill={printing.handlePrintBill}
          onCompleteOrder={async () => {
            // Mark order as paid and close workspace
            setModal('showDineInModal', false);
            clearStagingCart();
          }}
        />
        <POSGuestCountModal isOpen={showGuestCountModal} onClose={() => setModal('showGuestCountModal', false)} onSave={handleGuestCountSave} tableNumber={selectedTableNumber || 0} tableCapacity={selectedTableCapacity} initialGuestCount={1} />
        <CustomerDetailsModal isOpen={showCustomerModal} onClose={() => setModal('showCustomerModal', false)} onSave={handleCustomerSave} orderType={orderType as any} initialData={customerData as any} orderValue={orderTotal} onOrderTypeSwitch={(newMode) => setOrderType(newMode)} onManagerOverride={() => {}} requestManagerApproval={async () => true} managerOverrideGranted={true} />
        <AdminSidePanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} defaultTab="dashboard" />
        <CustomerOrderHistoryModal isOpen={showOrderHistoryModal} onClose={() => setShowOrderHistoryModal(false)} customer={customerProfile} orders={customerProfile?.recent_orders || []} onReorder={handleLoadPastOrder} />
        <PaymentFlowOrchestrator isOpen={showPaymentFlow} onClose={() => setModal('showPaymentFlow', false)} orderItems={orderItems} orderTotal={orderTotal} orderType={orderType as any} customerData={customerData as any} deliveryFee={deliveryFee} onPaymentComplete={handlePaymentFlowComplete} />

        {/* Kitchen Preview Modal for DINE-IN staging items */}
        <DineInKitchenPreviewModal
          isOpen={showKitchenPreviewModal}
          onClose={() => setShowKitchenPreviewModal(false)}
          orderItems={dineInStagingItems}
          tableNumber={selectedTableNumber}
          guestCount={guestCount}
          linkedTables={linkedTableContext.linkedTableNumbers}
          onSaveOnly={async () => {
            await persistStagingCart();
            setShowKitchenPreviewModal(false);
          }}
          onSaveAndPrint={async () => {
            await persistStagingCart();
            await sendDineInToKitchen();
            setShowKitchenPreviewModal(false);
          }}
        />

        {/* Bill Preview Modal for DINE-IN database items */}
        <DineInBillPreviewModal
          isOpen={showBillPreviewModal}
          onClose={() => setShowBillPreviewModal(false)}
          orderItems={(dineInEnrichedItems || []) as any}
          tableNumber={selectedTableNumber}
          guestCount={guestCount}
          orderTotal={dineInOrder?.total_amount || 0}
          onPrintBill={printing.handlePrintBill}
        />

        {/* Session Restore Dialog - Prompt user to restore saved session on app restart */}
        <Dialog open={showSessionRestoreDialog} onOpenChange={(open) => !open && handleSessionDiscard()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Restore Previous Order?</DialogTitle>
              <DialogDescription>
                {pendingSession && (
                  <>
                    Found a saved order from{' '}
                    <strong>{Math.round((Date.now() - pendingSession.timestamp) / 1000 / 60)} minutes ago</strong>.
                    <br />
                    <br />
                    <span className="text-sm space-y-1 block">
                      <span className="block">Items: <strong>{pendingSession.orderItems.length}</strong></span>
                      <span className="block">Type: <strong>{pendingSession.orderType}</strong></span>
                      {pendingSession.selectedTableNumber && (
                        <span className="block">Table: <strong>{pendingSession.selectedTableNumber}</strong></span>
                      )}
                      <span className="block">Total: <strong>£{pendingSession.total?.toFixed(2) || '0.00'}</strong></span>
                    </span>
                    <br />
                    Would you like to restore this order or start fresh?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-3 pt-4">
              <POSButton variant="secondary" onClick={handleSessionDiscard}>
                Start Fresh
              </POSButton>
              <POSButton variant="primary" onClick={handleSessionRestore} showChevron={false}>
                Restore Order
              </POSButton>
            </div>
          </DialogContent>
        </Dialog>
        {/* Lock Screen Overlay */}
        <AnimatePresence>
          {isLocked && <POSLockScreen onUnlock={handleUnlock} />}
        </AnimatePresence>
      </div>
    </CustomizeOrchestratorProvider>
  );
}
