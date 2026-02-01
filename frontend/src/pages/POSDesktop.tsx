import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

// Databutton imports
import { supabase } from 'utils/supabaseClient';
import brain from 'brain';

// Store imports
import { useSimpleAuth } from '../utils/simple-auth-context';
// NEW: React Query-powered menu store (replaces realtimeMenuStore)
import { useRealtimeMenuStoreCompat } from '../utils/realtimeMenuStoreCompat';
import { cleanupMenuRealtimeSync } from '../utils/menuRealtimeSync';
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
import { useRestaurantSettings } from '../utils/useRestaurantSettings';
import { createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';
import posPerf, { POSPerfMarks } from 'utils/posPerformance';
import { generateDisplayName } from 'utils/menuHelpers';
import { getOrderItems } from 'utils/posSupabaseHelpers';
import { completeTableOrder } from 'utils/supabaseQueries';

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
import { AnimatePresence, motion } from 'framer-motion';
import { AdminSidePanel } from 'components/AdminSidePanel';
import { AvatarDropdown } from 'components/AvatarDropdown';
import { PaymentFlowOrchestrator } from 'components/PaymentFlowOrchestrator';
import { ReprintDialog } from 'components/pos/ReprintDialog';
import { PrinterSettings } from 'components/pos/PrinterSettings';
import { UpdateProgressModal, useAutoUpdate } from 'components/pos/UpdateProgressModal';
import { CommandPalette } from 'components/pos/CommandPalette';
import { WorkspaceSetupWizard } from 'components/pos/WorkspaceSetupWizard';
import { EightySixBoard } from 'components/pos/EightySixBoard';
import { PaymentFlowResult } from 'utils/paymentFlowTypes';
import { Loader2 } from 'lucide-react';

// View Components - Import from POSDesktop for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import {
  OnlineOrderKanban,
  OnlineOrderFilters,
  OnlineOrderSummaryPanel,
  RejectOrderModal,
} from 'components/online-orders';
import { useOnlineOrdersRealtimeStore } from 'utils/stores/onlineOrdersRealtimeStore';
import { useCallerIdStore } from 'utils/callerIdStore';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { MenuItem, OrderItem, ModifierSelection, PaymentResult } from '../utils/types';
import { TipSelection } from '../components/POSTipSelector';
import { usePOSSettingsQuery } from '@/utils/posSettingsQueries';

// Custom hooks
import { useOrderManagement } from 'utils/useOrderManagement';
import { useCustomerFlow } from 'utils/useCustomerFlow';
import { useOrderProcessing } from 'utils/useOrderProcessing';
import { usePrintingOperations } from 'utils/usePrintingOperations';
import { usePOSInitialization } from 'utils/usePOSInitialization';

import { OfflineFirst } from '../utils/offlineFirstManager';
import { useNativeNotifications } from '../utils/useNativeNotifications';
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

  // Page entrance animation state
  const [pageVisible, setPageVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setPageVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

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

  // 🎯 DRAFT/PUBLISH WORKFLOW: Context is now passed to useRealtimeMenuStoreCompat hook
  // The hook handles:
  // 1. Context-aware data fetching (POS sees only published items)
  // 2. React Query caching and deduplication
  // 3. Realtime subscriptions via useMenuRealtimeSync
  useEffect(() => {
    // ✅ CLEANUP: Properly tear down realtime subscriptions on unmount
    // This prevents memory leaks from Supabase channels remaining subscribed
    return () => {
      cleanupMenuRealtimeSync();
    };
  }, []);

  // 🔄 POS HEARTBEAT: Send periodic heartbeat to backend
  // This enables the customer website to detect when POS is offline
  // and block online orders accordingly (industry-standard pattern)
  useEffect(() => {
    const stopHeartbeat = startPOSHeartbeat();
    return stopHeartbeat;
  }, []);

  // 📞 CALLER ID: Initialize Supabase Realtime subscription for incoming calls
  const [callerIdModalOpen, setCallerIdModalOpen] = useState(false); // Tracks if CustomerDetailsModal was opened from caller ID flow

  useEffect(() => {
    if (user?.id) {
      useCallerIdStore.getState().initialize(user.id);
    }
    return () => {
      useCallerIdStore.getState().cleanup();
    };
  }, [user?.id]);

  // Dynamic window title from restaurant settings
  const { getBusinessProfile } = useRestaurantSettings();
  const restaurantName = getBusinessProfile().name;

  useEffect(() => {
    if (!restaurantName) return;
    document.title = restaurantName;
    // Update Electron window title if running in Electron
    if ((window as any).electronAPI?.setWindowTitle) {
      (window as any).electronAPI.setWindowTitle(restaurantName);
    }
  }, [restaurantName]);

  // ============================================================================
  // STORE SUBSCRIPTIONS — must be declared before any useEffect/useCallback that references them
  // ============================================================================
  // NEW: React Query-powered menu data (replaces realtimeMenuStore selectors)
  const menuStore = useRealtimeMenuStoreCompat({ context: 'pos', enableRealtime: true });
  const { categories, menuItems, isLoading, isConnected, setSearchQuery, setSelectedMenuCategory, refreshData: refreshMenuData } = menuStore;

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
  const showReprintDialog = usePOSUIStore(state => state.showReprintDialog);
  const showCommandPalette = usePOSUIStore(state => state.showCommandPalette);
  const showWorkspaceWizard = usePOSUIStore(state => state.showWorkspaceWizard);
  const show86Board = usePOSUIStore(state => state.show86Board);
  const setActiveView = usePOSUIStore(state => state.setActiveView);
  const setModal = usePOSUIStore(state => state.setModal);
  const setQueuedJobsCount = usePOSUIStore(state => state.setQueuedJobsCount);
  const persistedTableOrders = useTableOrdersStore((state) => state.persistedTableOrders);
  const createTableOrder = useTableOrdersStore((state) => state.createTableOrder);

  const { tables: restaurantTables, loading: tablesLoading, refetch: refetchTables } = useRestaurantTables();

  // Active orders - source of truth for linked tables data
  const { orders: activeOrders } = useActiveOrders();

  // Online orders badge tracking (early extraction for handleViewModeChange)
  const unseenCount = useOnlineOrdersRealtimeStore(state => state.unseenCount);
  const markAllSeen = useOnlineOrdersRealtimeStore(state => state.markAllSeen);

  // Customer intelligence for order history
  const { customerProfile, clearCustomer: clearIntelligenceCustomer } = usePOSCustomerIntelligence();

  // Auto-update hook for Electron app updates with progress UI
  const autoUpdate = useAutoUpdate();

  // Native Windows notifications for critical events (online orders, printer status)
  const { notify } = useNativeNotifications({
    onNotificationClick: (actionId) => {
      if (actionId.startsWith('online-order-')) {
        setPosViewMode('ONLINE');
        markAllSeen();
      }
    },
  });

  // Notify on new online orders via native notification
  const prevUnseenRef = useRef(0);
  useEffect(() => {
    const current = unseenCount();
    if (current > prevUnseenRef.current && prevUnseenRef.current >= 0) {
      const newCount = current - prevUnseenRef.current;
      notify({
        title: `${newCount} New Online Order${newCount > 1 ? 's' : ''}`,
        body: 'Tap to view and accept',
        urgency: 'critical',
        actionId: 'online-order-new',
      });
    }
    prevUnseenRef.current = current;
  }, [unseenCount()]);

  // KIOSK MODE state — declared before kiosk useEffect that references it
  const [kioskMode, setKioskMode] = useState(false);

  // KIOSK MODE: Load initial state + listen for blocked exit attempts
  useEffect(() => {
    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (!electronAPI) return;

    // Load initial kiosk state
    if (electronAPI.getKioskState) {
      electronAPI.getKioskState().then((result: any) => {
        if (result?.success) setKioskMode(!!result.enabled);
      }).catch(() => {});
    }

    // Listen for blocked exit attempts — toast the user
    if (electronAPI.onKioskExitBlocked) {
      electronAPI.onKioskExitBlocked(() => {
        toast.warning('Kiosk mode active', {
          description: 'Disable kiosk mode from Admin panel to exit'
        });
      });
    }

    return () => {
      if (electronAPI.removeKioskExitBlockedListener) {
        electronAPI.removeKioskExitBlockedListener();
      }
    };
  }, []);

  // Load order from sessionStorage (set when clicking "Edit in POS" from Online Orders)
  useEffect(() => {
    const loadOrderId = sessionStorage.getItem('posLoadOrderId');
    if (!loadOrderId) return;

    // Clear immediately to prevent re-loading on subsequent renders
    sessionStorage.removeItem('posLoadOrderId');

    const loadOrder = async () => {
      try {
        // Fetch order details
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', loadOrderId)
          .single();

        if (orderError || !order) {
          toast.error('Failed to load order');
          return;
        }

        // Fetch order items
        const { items: orderItemsData, error: itemsError } = await getOrderItems(loadOrderId);

        if (itemsError || !orderItemsData) {
          toast.error('Failed to load order items');
          return;
        }

        // Set order type
        const orderTypeMap: Record<string, string> = {
          'DELIVERY': 'DELIVERY',
          'COLLECTION': 'COLLECTION',
          'DINE_IN': 'DINE-IN',
          'DINE-IN': 'DINE-IN',
        };
        setOrderType((orderTypeMap[order.order_type?.toUpperCase()] || 'COLLECTION') as any);

        // Convert and load items
        const convertedItems: OrderItem[] = orderItemsData.map((i: any) => ({
          id: i.id || crypto.randomUUID(),
          menu_item_id: i.menu_item_id,
          variant_id: i.variant_id || null,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          variantName: i.variant_name || null,
          protein_type: i.protein_type || null,
          modifiers: i.modifiers || [],
          notes: i.notes || '',
          image_url: i.image_url || '',
        }));

        setOrderItems(convertedItems);
        // Order loaded - UI shows items in cart
      } catch (err) {
        console.error('[POSDesktop] Load order error:', err);
        toast.error('Failed to load order');
      }
    };

    loadOrder();
  }, [setOrderType, setOrderItems]);

  const toggleKioskMode = useCallback(async () => {
    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (!electronAPI?.setKioskMode) return;
    const newState = !kioskMode;
    try {
      const result = await electronAPI.setKioskMode(newState);
      if (result?.success) {
        setKioskMode(newState);
        toast.success(newState ? 'Kiosk mode enabled' : 'Kiosk mode disabled', {
          description: newState ? 'App is now locked to fullscreen' : 'Normal window mode restored'
        });
      }
    } catch {
      toast.error('Failed to toggle kiosk mode');
    }
  }, [kioskMode]);

  // CUSTOMER DISPLAY: Push cart state to secondary monitor when items change
  useEffect(() => {
    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : null;
    if (!electronAPI?.sendToCustomerDisplay) return;

    electronAPI.isCustomerDisplayOpen?.().then((result: any) => {
      if (!result?.isOpen) return;
      electronAPI.sendToCustomerDisplay({
        items: orderItems.map(item => ({
          name: item.name || 'Item',
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers?.map((m: any) => m.name || m.modifier_name).filter(Boolean) || []
        })),
        total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        orderType: orderType,
        itemCount: orderItems.length
      });
    }).catch(() => {});
  }, [orderItems, orderType]);

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
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);

  // ============================================================================
  // SESSION PERSISTENCE STATE
  // ============================================================================
  const [pendingSession, setPendingSession] = useState<PersistedSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const showSessionRestoreDialog = usePOSUIStore(state => state.showSessionRestoreDialog);

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
  
  const { data: posSettings } = usePOSSettingsQuery();
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

        // Also check Electron main process crash detection (file-based)
        let electronCrashDetected = false;
        const electronAPI = (window as any).electronAPI;
        if (electronAPI?.getCrashState) {
          try {
            const crashResult = await electronAPI.getCrashState();
            electronCrashDetected = crashResult.hasCrashState;
            if (electronCrashDetected) {
              if (isDev) console.log('[POSDesktop] Electron main process crash detected');
              // Clear Electron crash state since we're handling it
              await electronAPI.clearCrashState();
            }
          } catch {
            // Non-critical — fallback to localStorage detection
          }
        }

        if (cleanExit !== 'false' && !electronCrashDetected) {
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
      // Order restored - UI shows items in cart
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

  // Also save crash state to Electron main process (file-based, survives renderer crashes)
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.saveCrashState) return;
    if (orderItems.length === 0) return;

    const saveCrashState = () => {
      electronAPI.saveCrashState({
        tableNumber: selectedTableNumber,
        orderType,
        cartItems: orderItems,
      }).catch(() => { /* non-critical */ });
    };

    const timeoutId = setTimeout(saveCrashState, 3000);
    return () => clearTimeout(timeoutId);
  }, [orderItems, orderType, selectedTableNumber]);

  const handleLogout = useCallback(async () => { await logout(); navigate('/pos-login', { replace: true }); }, [logout, navigate]);
  const handleManagementAuthSuccess = useCallback(() => { setManagerOverrideGranted(true); if (managerApprovalResolverRef.current) managerApprovalResolverRef.current(true); setIsManagementDialogOpen(false); setShowAdminPanel(true); }, []);

  // Caller ID: Start order from incoming call
  const handleCallerIdStartOrder = useCallback(async (customerId: string | null, phone: string) => {
    // Switch to takeaway mode
    setPosViewMode('TAKE_AWAY');
    usePOSOrderStore.getState().setOrderType('COLLECTION');

    if (customerId) {
      // Known customer - load their profile
      try {
        const profile = await usePOSCustomerIntelligence.getState().loadCustomerById(customerId);
        if (profile) {
          usePOSCustomerIntelligence.getState().selectCustomer(profile);
          toast.success('Customer loaded', {
            description: `Ready to take order for ${profile.first_name || 'customer'}`
          });
        }
      } catch (err) {
        console.error('[CallerID] Failed to load customer:', err);
        toast.error('Failed to load customer details');
      }
    } else {
      // Unknown caller - open customer modal with phone prefilled
      usePOSCustomerStore.getState().updateCustomer({ phone });
      setCallerIdModalOpen(true); // Track that modal was opened from caller ID
      setModal('showCustomerModal', true);
    }
  }, []);

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
        // Mark all online orders as seen when viewing the tab
        markAllSeen();
        break;
      case 'RESERVATIONS':
        setActiveView('pos');
        break;
    }
  }, [orderType, markAllSeen]);
  
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
        // Tables linked - UI shows connected tables
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

  const handleCustomerSave = useCallback((data: any) => {
    updateCustomer(data);
    setCustomerData(data);
    setCallerIdModalOpen(false); // Reset caller ID modal tracking
  }, [setCustomerData]);

  // Handle cancel from CustomerDetailsModal - clears prefilled data if opened from caller ID
  const handleCustomerModalCancel = useCallback(() => {
    if (callerIdModalOpen) {
      // Clear the prefilled phone number from caller ID flow
      usePOSCustomerStore.getState().clearCustomer();
      setCallerIdModalOpen(false);
    }
  }, [callerIdModalOpen]);

  const orderManagement = useOrderManagement(orderItems, setOrderItems);
  const customerFlow = useCustomerFlow(orderType as any, customerData as any, (data: any) => updateCustomer(data), selectedTableNumber, guestCount);
  const orderProcessing = useOrderProcessing(orderType as any, orderItems, customerData as any, selectedTableNumber, guestCount);
  const printing = usePrintingOperations(orderType as any, orderItems, customerData as any, selectedTableNumber, guestCount);

  const handleDineInPrintBill = useCallback(async (orderTotal: number) => {
    const itemsToPrint = (dineInEnrichedItems || []).map(item => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      variant_id: item.variant_id || null,
      name: item.item_name,
      quantity: item.quantity,
      price: item.unit_price,
      variantName: item.variant_name || undefined,
      protein_type: item.protein_type || undefined,
      notes: item.notes || undefined,
      modifiers: item.customizations?.map((c: any) => ({
        id: c.customization_id || c.id,
        name: c.name,
        price_adjustment: c.price_adjustment ?? c.price ?? 0
      })) || [],
      category_id: item.category_id || undefined,
      customer_tab_id: item.customer_tab_id || undefined,
      serve_with_section_id: (item as any).serve_with_section_id || undefined,
      serveWithSectionId: (item as any).serve_with_section_id || undefined,
    }));

    return printing.handlePrintBillForItems(
      itemsToPrint,
      orderTotal,
      selectedTableNumber,
      guestCount
    );
  }, [printing, dineInEnrichedItems, selectedTableNumber, guestCount]);


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

  // NOTE: Realtime subscriptions are now handled automatically by useRealtimeMenuStoreCompat

  const handleSectionSelect = useCallback((id: string | null) => { setSelectedSectionId(id); setSelectedCategoryId(null); setSelectedMenuCategory(id); }, [setSelectedMenuCategory]);
  const handleCategorySelect = useCallback((id: string | null) => { setSelectedCategoryId(id); setSelectedMenuCategory(id); }, [setSelectedMenuCategory]);
  const childCats = useMemo(() => selectedSectionId ? categories.filter(c => c.parent_category_id === selectedSectionId) : [], [categories, selectedSectionId]);

  // ============================================================================
  // ONLINE ORDERS STATE & HANDLERS
  // ============================================================================
  const {
    orders: onlineOrders,
    isLoading: onlineOrdersLoading,
    acceptOrder,
    rejectOrder,
    markReady,
    markComplete,
    initializeRealtime: initOnlineRealtime,
    cleanup: cleanupOnlineRealtime,
    newOrders,
    preparingOrders,
    readyOrders,
  } = useOnlineOrdersRealtimeStore();

  const [selectedOnlineOrderId, setSelectedOnlineOrderId] = useState<string | null>(null);
  const [isOnlineRejectModalOpen, setIsOnlineRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<string | null>(null);
  const [isOnlineActionLoading, setIsOnlineActionLoading] = useState(false);

  // Initialize online orders realtime when ONLINE mode is active
  useEffect(() => {
    if (posViewMode === 'ONLINE') {
      initOnlineRealtime();
    }
    return () => {
      if (posViewMode === 'ONLINE') {
        cleanupOnlineRealtime();
      }
    };
  }, [posViewMode, initOnlineRealtime, cleanupOnlineRealtime]);

  const selectedOnlineOrder = selectedOnlineOrderId ? onlineOrders[selectedOnlineOrderId] : null;
  const rejectingOnlineOrder = orderToReject ? onlineOrders[orderToReject] : null;

  const handleOnlineAccept = useCallback(async (orderId: string) => {
    setIsOnlineActionLoading(true);
    try {
      const success = await acceptOrder(orderId);
      if (success) {
        // Create print job for kitchen ticket
        const order = onlineOrders[orderId];
        if (order) {
          await supabase.rpc('create_print_job', {
            p_job_type: 'KITCHEN_TICKET',
            p_order_data: {
              orderNumber: order.orderNumber,
              orderType: order.orderType,
              items: order.items,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              deliveryAddress: order.deliveryAddress,
              specialInstructions: order.specialInstructions,
              allergenNotes: order.allergenNotes,
            },
            p_printer_id: null,
            p_priority: 3,
          });
        }
      } else {
        toast.error('Failed to accept order');
      }
    } finally {
      setIsOnlineActionLoading(false);
    }
  }, [acceptOrder, onlineOrders]);

  const handleOnlineRejectClick = useCallback((orderId: string) => {
    setOrderToReject(orderId);
    setIsOnlineRejectModalOpen(true);
  }, []);

  const handleOnlineRejectConfirm = useCallback(async (reason: string) => {
    if (!orderToReject) return;
    setIsOnlineActionLoading(true);
    try {
      const success = await rejectOrder(orderToReject, reason);
      if (!success) {
        toast.error('Failed to reject order');
      }
    } finally {
      setIsOnlineActionLoading(false);
      setIsOnlineRejectModalOpen(false);
      setOrderToReject(null);
    }
  }, [orderToReject, rejectOrder]);

  const handleOnlineMarkReady = useCallback(async (orderId: string) => {
    setIsOnlineActionLoading(true);
    try {
      const success = await markReady(orderId);
      if (!success) {
        toast.error('Failed to update order');
      }
    } finally {
      setIsOnlineActionLoading(false);
    }
  }, [markReady]);

  const handleOnlineComplete = useCallback(async (orderId: string) => {
    setIsOnlineActionLoading(true);
    try {
      const success = await markComplete(orderId);
      if (!success) {
        toast.error('Failed to complete order');
      }
    } finally {
      setIsOnlineActionLoading(false);
      setSelectedOnlineOrderId(null);
    }
  }, [markComplete, onlineOrders]);

  const handleOnlinePrint = useCallback(async (orderId: string) => {
    const order = onlineOrders[orderId];
    if (!order) return;
    try {
      await supabase.rpc('create_print_job', {
        p_job_type: 'CUSTOMER_RECEIPT',
        p_order_data: {
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          items: order.items,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryAddress: order.deliveryAddress,
        },
        p_printer_id: null,
        p_priority: 5,
      });
    } catch (error) {
      console.error('Failed to print:', error);
      toast.error('Failed to print receipt');
    }
  }, [onlineOrders]);

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

    // Online Orders mode - render within ResponsivePOSShell for visual consistency
    if (posViewMode === 'ONLINE') {
      return (
        <ResponsivePOSShell zones={{
          customer: (
            <POSZoneErrorBoundary zoneName="Filters" onReset={() => {}} showHomeButton>
              <OnlineOrderFilters />
            </POSZoneErrorBoundary>
          ),
          categories: null,
          menu: (
            <POSZoneErrorBoundary zoneName="Kanban" onReset={() => {}} showHomeButton>
              <div className="h-full bg-[#121212] rounded-lg overflow-hidden border border-white/5">
                <OnlineOrderKanban
                  newOrders={newOrders()}
                  preparingOrders={preparingOrders()}
                  readyOrders={readyOrders()}
                  selectedOrderId={selectedOnlineOrderId}
                  onAccept={handleOnlineAccept}
                  onReject={handleOnlineRejectClick}
                  onMarkReady={handleOnlineMarkReady}
                  onComplete={handleOnlineComplete}
                  onViewDetails={setSelectedOnlineOrderId}
                  onSelectOrder={setSelectedOnlineOrderId}
                  isActionLoading={isOnlineActionLoading}
                />
              </div>
            </POSZoneErrorBoundary>
          ),
          summary: (
            <POSZoneErrorBoundary zoneName="Details" onReset={() => setSelectedOnlineOrderId(null)} showHomeButton>
              <OnlineOrderSummaryPanel
                order={selectedOnlineOrder}
                onAccept={handleOnlineAccept}
                onReject={handleOnlineRejectClick}
                onMarkReady={handleOnlineMarkReady}
                onComplete={handleOnlineComplete}
                onPrint={handleOnlinePrint}
                isActionLoading={isOnlineActionLoading}
              />
            </POSZoneErrorBoundary>
          )
        }} />
      );
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

  // Keyboard shortcuts: F1-F12 + Ctrl combos for POS actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when lock screen is active or in input fields
      if (isLocked) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as any).isContentEditable) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // ---- Ctrl combos ----
      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            setModal('showCommandPalette', true);
            return;
          case '8':
            e.preventDefault();
            setModal('show86Board', !show86Board);
            return;
          case 'p':
            e.preventDefault();
            setModal('showReprintDialog', true);
            return;
          case 'z':
            e.preventDefault();
            // Undo: remove last item from cart
            if (orderItems.length > 0) {
              setOrderItems(orderItems.slice(0, -1));
            }
            return;
        }
      }

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          handleClearOrder();
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
          refreshMenuData();
          break;

        // F6-F12: Section quick-select (Starters, Main, Sides, Accompaniments, Desserts, Drinks, Set Meals)
        case 'F6': case 'F7': case 'F8': case 'F9': case 'F10': case 'F11': case 'F12': {
          e.preventDefault();
          const sectionIndex = parseInt(e.key.slice(1)) - 6; // F6→0, F7→1, ...F12→6
          const { FIXED_SECTIONS } = require('../utils/sectionMapping');
          const section = FIXED_SECTIONS[sectionIndex];
          if (section) {
            setSelectedSectionId(section.uuid);
            setSelectedCategoryId(null);
            setSelectedMenuCategory(section.uuid);
          }
          break;
        }

        // Numpad quantity adjustment (operates on last item in cart)
        case '+':
        case 'Add': {
          e.preventDefault();
          if (orderItems.length > 0) {
            const updated = [...orderItems];
            updated[updated.length - 1] = { ...updated[updated.length - 1], quantity: updated[updated.length - 1].quantity + 1 };
            setOrderItems(updated);
          }
          break;
        }
        case '-':
        case 'Subtract': {
          e.preventDefault();
          if (orderItems.length > 0) {
            const updated = [...orderItems];
            const last = updated[updated.length - 1];
            if (last.quantity > 1) {
              updated[updated.length - 1] = { ...last, quantity: last.quantity - 1 };
              setOrderItems(updated);
            } else {
              setOrderItems(updated.slice(0, -1));
            }
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, orderItems, orderTotal, printing, handleClearOrder, handleLockScreen, setOrderItems, setSelectedSectionId, setSelectedCategoryId, setSelectedMenuCategory, refreshMenuData]);

  if (authLoading) return <div className="h-dvh w-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-purple-500" /></div>;
  if (!isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.99 }}
      animate={pageVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed inset-0 theme-internal"
    >
      <CustomizeOrchestratorProvider>
        {/* Offline/Online Status Banner - Fixed overlay, outside grid to prevent row mismatch */}
        <POSOfflineBanner />
        <div className="fixed inset-0 grid grid-rows-[auto_auto_1fr_auto] bg-black overflow-hidden">
        <ManagementHeader
          title="POS"
          onAdminSuccess={handleManagementAuthSuccess}
          onLogout={handleLogout}
          onCustomerSelect={(customer) => usePOSCustomerIntelligence.getState().selectCustomer(customer)}
          onSelectOnlineOrder={(id) => setSelectedOnlineOrderId(id)}
          onReorder={handleLoadPastOrder}
          onCallerIdStartOrder={handleCallerIdStartOrder}
        />
        <POSNavigation currentViewMode={posViewMode} onViewModeChange={handleViewModeChange} onlineOrdersCount={unseenCount()} />
        <div className="h-full overflow-hidden">{renderMainPOSView()}</div>
        <POSFooter
          currentOrderType={orderType}
          onToggleCustomerDisplay={async () => {
            const api = (window as any).electronAPI;
            if (!api) return;
            try {
              const status = await api.isCustomerDisplayOpen?.();
              if (status?.isOpen) {
                await api.closeCustomerDisplay?.();
              } else {
                await api.openCustomerDisplay?.();
                setTimeout(() => {
                  api.sendToCustomerDisplay?.({
                    items: orderItems.map(item => ({
                      name: item.name || 'Item',
                      quantity: item.quantity,
                      price: item.price,
                      modifiers: item.modifiers?.map((m: any) => m.name || m.modifier_name).filter(Boolean) || []
                    })),
                    total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    orderType: orderType,
                    itemCount: orderItems.length
                  });
                }, 1000);
              }
            } catch { toast.error('Customer display error'); }
          }}
          onToggleKioskMode={toggleKioskMode}
          kioskMode={kioskMode}
          onPrinterSettingsClick={() => setShowPrinterSettings(true)}
        />
      </div>

      {/* Modals - Outside grid to prevent implicit row creation */}
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
          onPrintBill={handleDineInPrintBill}
          onCompleteOrder={async () => {
            // Mark order as CLOSED and reset table to AVAILABLE
            if (selectedTableNumber) {
              try {
                await completeTableOrder(selectedTableNumber);
                toast.success('Order completed', {
                  description: 'Table is now available'
                });
              } catch (error) {
                console.error('Failed to complete order:', error);
                toast.error('Failed to complete table session');
              }
            }
            setModal('showDineInModal', false);
            clearStagingCart();
          }}
        />
        <POSGuestCountModal isOpen={showGuestCountModal} onClose={() => setModal('showGuestCountModal', false)} onSave={handleGuestCountSave} tableNumber={selectedTableNumber || 0} tableCapacity={selectedTableCapacity} initialGuestCount={1} />
        <CustomerDetailsModal
          isOpen={showCustomerModal}
          onClose={() => {
            setModal('showCustomerModal', false);
            setCallerIdModalOpen(false); // Reset caller ID tracking on any close
          }}
          onSave={handleCustomerSave}
          onCancel={handleCustomerModalCancel}
          orderType={orderType as any}
          initialData={customerData as any}
          orderValue={orderTotal}
          onOrderTypeSwitch={(newMode) => setOrderType(newMode)}
          onManagerOverride={() => {}}
          requestManagerApproval={async () => true}
          managerOverrideGranted={true}
        />
        <AdminSidePanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} defaultTab="dashboard" />
        <CustomerOrderHistoryModal isOpen={showOrderHistoryModal} onClose={() => setShowOrderHistoryModal(false)} customer={customerProfile} orders={customerProfile?.recent_orders || []} onReorder={handleLoadPastOrder} />
        <PaymentFlowOrchestrator isOpen={showPaymentFlow} onClose={() => setModal('showPaymentFlow', false)} orderItems={orderItems} orderTotal={orderTotal} orderType={orderType as any} customerData={customerData as any} deliveryFee={deliveryFee} onPaymentComplete={handlePaymentFlowComplete} />
        <ReprintDialog isOpen={showReprintDialog} onClose={() => setModal('showReprintDialog', false)} />
        <PrinterSettings isOpen={showPrinterSettings} onClose={() => setShowPrinterSettings(false)} />
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setModal('showCommandPalette', false)}
          actions={{
            onNewOrder: () => { handleClearOrder(); },
            onCheckout: () => { if (orderItems.length > 0) setModal('showPaymentFlow', true); else toast.warning('Add items before checkout'); },
            onPrintReceipt: () => { if (orderItems.length > 0) printing.handlePrintReceipt(orderTotal); },
            onLockScreen: handleLockScreen,
            onRefreshMenu: () => { refreshMenuData(); },
            onOpenReprint: () => setModal('showReprintDialog', true),
            onOpenKDS: () => { window.open(`${window.location.origin}/kds-v2?fullscreen=true`, 'kitchen-display', 'width=1920,height=1080'); },
            onOpenAllOrders: () => { document.dispatchEvent(new CustomEvent('open-all-orders')); },
            onOpenQuickTools: () => { document.dispatchEvent(new CustomEvent('open-quick-tools')); },
            onAddMenuItem: (item: any) => handleAddToOrder(item),
            onOpenCustomerDisplay: async () => {
              const api = (window as any).electronAPI;
              if (!api) return;
              try {
                const status = await api.isCustomerDisplayOpen?.();
                if (status?.isOpen) { await api.closeCustomerDisplay?.(); }
                else { await api.openCustomerDisplay?.(); }
              } catch { toast.error('Customer display error'); }
            },
            onOpenEndOfDay: () => { document.dispatchEvent(new CustomEvent('open-end-of-day')); },
            onOpenWorkspaceSetup: () => { setModal('showWorkspaceWizard', true); },
            onOpen86Board: () => { setModal('show86Board', true); },
          }}
        />

        <WorkspaceSetupWizard
          isOpen={showWorkspaceWizard}
          onClose={() => setModal('showWorkspaceWizard', false)}
        />
        <EightySixBoard
          isOpen={show86Board}
          onClose={() => setModal('show86Board', false)}
        />

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
          onPrintBill={handleDineInPrintBill}
        />

        {/* Online Orders Reject Modal */}
        <RejectOrderModal
          isOpen={isOnlineRejectModalOpen}
          onClose={() => {
            setIsOnlineRejectModalOpen(false);
            setOrderToReject(null);
          }}
          onConfirm={handleOnlineRejectConfirm}
          orderNumber={rejectingOnlineOrder?.orderNumber}
          isLoading={isOnlineActionLoading}
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

        {/* Auto-Update Progress Modal (Electron only) */}
        <UpdateProgressModal
          open={autoUpdate.isModalOpen}
          state={autoUpdate.state}
          info={autoUpdate.info}
          progress={autoUpdate.progress}
          error={autoUpdate.error}
          onInstall={autoUpdate.installUpdate}
          onDismiss={autoUpdate.dismissModal}
          onRetry={autoUpdate.retryUpdate}
        />

        {/* Lock Screen Overlay */}
        <AnimatePresence>
          {isLocked && <POSLockScreen onUnlock={handleUnlock} />}
        </AnimatePresence>
      </CustomizeOrchestratorProvider>
    </motion.div>
  );
}
