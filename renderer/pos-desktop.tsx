




























import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

// Databutton imports
import brain from 'brain';

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

// Enhanced image preloading imports
import { useImagePreloader } from '../utils/useImagePreloader';
import { POSSkeletonGrid } from 'components/POSSkeletonGrid';
import { CategorySidebarSkeleton } from 'components/CategorySidebarSkeleton';
import { OrderSummarySkeleton } from 'components/OrderSummarySkeleton';
import { POSZoneErrorBoundary } from 'components/POSZoneErrorBoundary';

// Utility imports
import { colors as designColors } from '../utils/designSystem';
import { QSAITheme } from '../utils/QSAIDesign';
import { quickLog, createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';
import posPerf, { POSPerfMarks } from 'utils/posPerformance';

// Component imports
import { ManagementHeader } from '../components/ManagementHeader';
import { POSNavigation } from '../components/POSNavigation';
import { DineInTableSelector } from '../components/DineInTableSelector';
import { CategorySidebar } from '../components/CategorySidebar';
import { POSMenuSelector } from '../components/POSMenuSelector';
import { OrderSummaryPanel } from '../components/OrderSummaryPanel';
import { POSOrderSummary } from '../components/POSOrderSummary';
import { CustomerSummaryBadge } from '../components/CustomerSummaryBadge';
import { CustomerDetailsModal } from 'components/CustomerDetailsModal';
import { POSGuestCountModalClean } from 'components/POSGuestCountModalClean';
import { DineInOrderModal } from 'components/DineInOrderModal';
import ManagementPasswordDialog from 'components/ManagementPasswordDialog';
import MenuManagementDialog from '../components/MenuManagementDialog';
import AllOrdersModal from '../components/AllOrdersModal';
import { CustomizeOrchestrator, CustomizeOrchestratorProvider } from '../components/CustomizeOrchestrator';
import { POSFooter } from 'components/POSFooter';
import { AdminSidePanel } from 'components/AdminSidePanel';
import { AvatarDropdown } from 'components/AvatarDropdown';
import { PaymentFlowOrchestrator } from 'components/PaymentFlowOrchestrator';
import { PaymentFlowResult } from 'utils/paymentFlowTypes';
import { PaymentChoiceModal } from 'components/PaymentChoiceModal';

// View Components - Import from POSDesktop for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { MenuCategory, MenuItem, OrderItem, ModifierSelection } from '../utils/menuTypes';
import { CustomerData } from '../utils/customerDataStore';
import { TipSelection, PaymentResult } from '../utils/menuTypes';
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

// REMOVED: No longer needed - state now managed by focused stores
// interface POSState {
//   // View Management
//   activeView: string;
//   previousView: string;
  
//   // Order Management
//   orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
//   selectedTableNumber: number | null;
//   guestCount: number;
//   orderItems: OrderItem[];
  
//   // Customer Information
//   customerData: {
//     firstName: string;
//     lastName: string;
//     phone: string;
//     email: string;
//     notes: string;
//     tableNumber: string;
//     guestCount: number;
//     address: string;
//     street: string;
//     city: string;
//     postcode: string;
//     deliveryNotes: string;
//   };
  
//   // UI State
//   showCustomerModal: boolean;
//   showVariantSelector: boolean;
//   pendingOrderConfirmation: boolean;
//   showGuestCountModal: boolean;
//   showDineInModal: boolean;
//   showPaymentFlow: boolean; // NEW: Single payment flow state
//   showSessionRestoreDialog: boolean;
// }

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
    isAuthenticated, 
    isLoading: authLoading, 
    email, 
    userId,
    role,
    profileImageUrl,
    logout 
  } = usePOSAuth();

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
  
  const customerDataStore = useCustomerDataStore();
  const tableOrdersStore = useTableOrdersStore();
  
  // NEW: Focused POS stores replace single POSState
  const orderStore = usePOSOrderStore();
  const customerStore = usePOSCustomerStore();
  const uiStore = usePOSUIStore();
  
  // Table orders from persistent store
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
  // HOOKS & STATE
  // ============================================================================
  
  // ✅ Get POS settings from store for delivery fee calculation
  const { settings: posSettings } = usePOSSettingsWithAutoFetch();
  
  // Calculate order total
  const orderTotal = useMemo(() => 
    orderStore.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [orderStore.orderItems]
  );
  
  // ✅ Calculate delivery fee using same logic as OrderSummaryPanel
  const deliveryFee = useMemo(() => {
    return orderStore.orderType === "DELIVERY" && posSettings?.delivery_charge?.enabled
      ? posSettings.delivery_charge.amount
      : 0;
  }, [orderStore.orderType, posSettings]);
  
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
    if (isDev) console.log(`🍽️ [POSDesktop] handleTableSelect called: Table ${tableNumber}, Status: ${tableStatus}`);
    
    if (tableStatus && tableStatus !== 'AVAILABLE') {
      if (isDev) console.log(`🍽️ [POSDesktop] Table ${tableNumber} is ${tableStatus} - opening dine-in modal`);
      orderStore.setSelectedTableNumber(tableNumber);
      uiStore.setModal('showDineInModal', true);
    } else {
      if (isDev) console.log(`🍽️ [POSDesktop] Table ${tableNumber} selected (AVAILABLE) - opening guest count modal`);
      orderStore.setSelectedTableNumber(tableNumber);
      uiStore.setModal('showGuestCountModal', true);
    }
    
    const updatedCustomerData = {
      ...customerDataStore.customerData,
      tableNumber: tableNumber.toString(),
      guestCount: orderStore.guestCount || 1
    };

    customerStore.updateCustomer(updatedCustomerData);
  }, []);
  
  const handleGuestCountSave = useCallback(async (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => {
    const tableNumber = orderStore.selectedTableNumber;
    if (!tableNumber) return;
    
    const hasExistingOrder = orderStore.orderItems.length > 0;
    
    const success = await createTableOrder(tableNumber, guestCount, linkedTables || []);
    
    if (success) {
      orderStore.setGuestCount(guestCount);
      uiStore.setModal('showGuestCountModal', false);
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
    }
  }, [createTableOrder]);
  
  // CUSTOMER DATA MANAGEMENT
  const handleCustomerDetailsClick = useCallback(() => {
    uiStore.setModal('showCustomerModal', true);
  }, []);
  
  const handleClearCustomerDetails = useCallback(() => {
    customerDataStore.clearCustomerData();
    customerStore.clearCustomer();
  }, []);

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
    customerDataStore.setCustomerData(customerData);
    
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
  
  const handleAddToOrder = orderManagement.handleAddToOrder;
  const handleRemoveItem = orderManagement.handleRemoveItem;
  const handleUpdateQuantity = orderManagement.handleUpdateQuantity;
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
  }, []);

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
      toast.error('Failed to clear saved session');
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
      
      // Print customer receipt using hook
      const receiptData = {
        order_number: `${orderStore.orderType.charAt(0)}${Date.now().toString().slice(-6)}`,
        order_type: orderStore.orderType,
        table_number: orderStore.selectedTableNumber,
        guest_count: orderStore.guestCount,
        customer_name: `${customerStore.customerData.firstName} ${customerStore.customerData.lastName}`.trim() || 'Walk-in Customer',
        items: orderStore.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.variant?.price || item.price,
          total: (item.variant?.price || item.price) * item.quantity
        })),
        subtotal,
        vat_amount: vatAmount,
        tip_amount: tipSelection.amount,
        total_amount: finalTotal,
        payment_method: paymentResult?.method || 'CASH',
        timestamp: new Date().toISOString()
      };
      
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
      return;
    }
    
    await printing.handleSendToKitchen();
  }, [printing]);

  const handlePrintBill = useCallback(async () => {
    if (!orderStore.orderItems || orderStore.orderItems.length === 0) {
      toast.error('No items to print bill for');
      return;
    }
    
    await printing.handlePrintBill(orderTotal);
  }, [printing, orderTotal]);

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

  // Payment Modal handlers
  const handleShowPaymentModal = useCallback(async () => {
    if (isDev) console.log('💳 [POSDesktop] Opening payment flow');
    
    // For DINE-IN orders, bypass payment processing - just print bill
    if (orderStore.orderType === 'DINE-IN') {
      if (isDev) console.log('🍽️ [POSDesktop] DINE-IN order - printing bill only, no payment processing');
      
      try {
        // Print bill to thermal printer
        await printing.handlePrintBill(orderTotal);
        
        // Clear saved session from IndexedDB (order complete, no need to restore)
        await clearCurrentSession();
        
        // Reset order state
        orderStore.clearOrder();
        customerStore.clearCustomer();
        
        toast.success('✅ Bill printed successfully!');
      } catch (error) {
        console.error('❌ [POSDesktop] Bill printing failed:', error);
        toast.error('Failed to print bill. Please try again.');
      }
      return;
    }
    
    // For WAITING, COLLECTION, DELIVERY orders → Show payment choice modal
    if (isDev) console.log(`💳 [POSDesktop] ${orderStore.orderType} order - showing payment choice modal`);
    setShowPaymentChoiceModal(true);
  }, [orderStore.orderType, printing, orderTotal, clearCurrentSession]);

  // NEW: Handle "Take Payment Now" choice
  const handleTakePaymentNow = useCallback(() => {
    if (isDev) console.log('💳 [POSDesktop] User chose "Take Payment Now" - opening Stripe payment flow');
    setShowPaymentChoiceModal(false);
    uiStore.setModal('showPaymentFlow', true);
  }, []);

  // NEW: Handle "Pay Later" choice - Skip payment, print receipt, clear order
  const handlePayLater = async () => {
    console.log('💳 [POSDesktop] Pay Later selected - printing receipt without payment');
    
    // Close the payment choice modal
    setShowPaymentChoiceModal(false);
    
    try {
      // Generate order number
      const orderNumber = generateOrderNumber();
      
      // Fetch validated template ID for current order mode
      const templateId = await templateAssignments.getCustomerTemplateId(orderStore.orderType);
      
      // Format items for receipt printing
      const receiptItems = orderStore.orderItems.map(item => {
        const itemPrice = item.variant?.price || item.price || 0;
        return {
          name: item.variant?.name || item.name,
          quantity: item.quantity,
          price: itemPrice,
          total: itemPrice * item.quantity,
          modifiers: item.modifiers?.map(m => m.option_name) || []
        };
      });
      
      // Build receipt data matching CustomerReceiptRequest
      const receiptData = {
        orderNumber,
        orderType: orderStore.orderType as string,
        items: receiptItems,
        tax: 0,
        deliveryFee: 0,
        orderSource: 'POS',
        template_data: {
          subtotal: orderTotal,
          total: orderTotal,
          timestamp: new Date().toISOString(),
          // Include template_id only if template exists (validated)
          ...(templateId && { template_id: templateId })
        }
      };
      
      console.log('🖨️ [POSDesktop] Printing receipt for pay-later order:', receiptData);
      if (templateId) {
        console.log(`✅ Using validated template: ${templateId}`);
      } else {
        console.log('⚠️ No template assigned or template missing - using default formatting');
      }
      
      // Print customer receipt via brain API
      const printResponse = await brain.print_customer_receipt(receiptData);
      const printResult = await printResponse.json();
      
      if (!printResult.success) {
        throw new Error(printResult.error || 'Print failed');
      }
      
      console.log('✅ [POSDesktop] Receipt printed for pay-later order');
      
      // Show success message
      toast.success('Order processed - Payment pending', {
        description: `Order ${orderNumber} ready for ${orderStore.orderType.toLowerCase()}. Collect payment on pickup/delivery.`,
      });
      
      // Clear the order from POS
      orderStore.clearOrder();
      
    } catch (error) {
      console.error('❌ [POSDesktop] Error in pay-later flow:', error);
      toast.error('Failed to process order', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  // NEW: Payment Flow Completion Handler
  const handlePaymentFlowComplete = useCallback(async (result: PaymentFlowResult) => {
    if (isDev) console.log('💳 [POSDesktop] Payment flow completed:', result);
    
    if (!result.success) {
      console.error('Payment flow failed');
      uiStore.setModal('showPaymentFlow', false);
      return;
    }
    
    try {
      // Print receipt
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
      
      const processResponse = await brain.process_print_queue({
        max_jobs: 20,
        force_retry_failed: true
      });
      
      const processResult = await processResponse.json();
      
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
    
    // Use initialization guard to prevent multiple concurrent starts
    posPerf.startInitialization('pos_desktop', async () => {
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
      const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      if (isDevelopment && isActive) {
        console.error('❌ [POSDesktop] Initialization guard failed:', error);
      }
    });
    
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

  // Handle category selection
  const handleCategoryChange = (categoryId: string | null) => {
    // ✅ NEW: Start real-time subscriptions on first interaction
    startRealtimeSubscriptionsIfNeeded();
    
    // ✅ NETWORK OPTIMIZATION: Subscribe to selected category only
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.subscribeToCategory(categoryId);
    
    // ✅ FIXED: Pass categoryId directly to store without validation
    // The store has all categories including synthetic sections and real DB categories
    menuStore.setSelectedMenuCategory(categoryId);
  };
  
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
      <POSZoneErrorBoundary zoneName="Order Type & Customer Selection" onReset={() => orderStore.setOrderType('COLLECTION')}>
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
                className="w-full"
              />
            )}
            {(orderStore.orderType === "DELIVERY" || orderStore.orderType === "COLLECTION" || orderStore.orderType === "WAITING") && (
              <CustomerSummaryBadge
                orderType={orderStore.orderType}
                onClick={handleCustomerDetailsClick}
                onClear={handleClearCustomerDetails}
                className="w-full"
              />
            )}
          </div>
        </div>
      </POSZoneErrorBoundary>
    );

    const zoneCategories = (
      <POSZoneErrorBoundary zoneName="Category Sidebar" onReset={() => realtimeMenuStore.setSelectedMenuCategory(null)}>
        <div className="min-w-0" style={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
          {initialization.initialLoad ? (
            <CategorySidebarSkeleton />
          ) : (
            <CategorySidebar
              categories={categories}
              onCategorySelect={handleCategoryChange}
              selectedCategory={selectedCategory}
              isLoading={menuLoading}
            />
          )}
        </div>
      </POSZoneErrorBoundary>
    );

    const zoneMenu = (
      <POSZoneErrorBoundary zoneName="Menu Selector" onReset={() => realtimeMenuStore.setSelectedMenuCategory(null)} showHomeButton>
        <div className="min-w-0" style={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
          <POSMenuSelector
            onAddToOrder={handleAddToOrder}
            onCustomizeItem={handleCustomizeItemFromMenu}
            onCategoryChange={handleCategoryChange}
            className="h-full"
            showSkeletons={initialization.initialLoad}
            orderType={orderStore.orderType}
          />
        </div>
      </POSZoneErrorBoundary>
    );

    const zoneSummary = (
      <POSZoneErrorBoundary zoneName="Order Summary" onReset={handleClearOrder} showHomeButton>
        <div className="min-w-0" style={{ minHeight: 0, overflow: 'hidden', height: '100%' }}>
          {initialization.initialLoad ? (
            <OrderSummarySkeleton />
          ) : (
            <OrderSummaryPanel
              orderItems={orderStore.orderItems}
              orderType={orderStore.orderType}
              tableNumber={orderStore.selectedTableNumber}
              guestCount={orderStore.guestCount}
              customerFirstName={customerStore.customerData.firstName}
              customerLastName={customerStore.customerData.lastName}
              customerPhone={customerStore.customerData.phone}
              customerEmail={customerStore.customerData.email}
              customerAddress={customerStore.customerData.address}
              customerPostcode={customerStore.customerData.postcode}
              deliveryFee={orderStore.deliveryFee}
              onAddItem={(item) => {
                orderStore.setOrderItems([...orderStore.orderItems, item]);
              }}
              onRemoveItem={(index) => {
                const newItems = [...orderStore.orderItems];
                newItems.splice(index, 1);
                orderStore.setOrderItems(newItems);
              }}
              onUpdateItem={(index, updates) => {
                const newItems = [...orderStore.orderItems];
                newItems[index] = { ...newItems[index], ...updates };
                orderStore.setOrderItems(newItems);
              }}
              onClearOrder={handleClearOrder}
              onCompleteOrder={handleCompleteOrder}
              onProcessPayment={handleCompleteOrder}
              onPaymentSuccess={handlePaymentSuccess}
              onSendToKitchen={handleSendToKitchen}
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
          categories: zoneCategories,
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
          <POSGuestCountModalClean 
            isOpen={uiStore.showGuestCountModal}
            onClose={() => uiStore.setModal('showGuestCountModal', false)}
            tableNumber={orderStore.selectedTableNumber || 0}
            onConfirm={(guestCount) => orderStore.setGuestCount(guestCount)}
          />
        )}

        {/* Dine-In Modal when table already seated */}
        {uiStore.showDineInModal && (
          <DineInOrderModal 
            isOpen={uiStore.showDineInModal}
            onClose={() => uiStore.setModal('showDineInModal', false)}
            tableNumber={orderStore.selectedTableNumber || 0}
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

        {/* Payment Choice Modal - NEW: Choose between immediate payment or pay later */}
        <PaymentChoiceModal
          isOpen={showPaymentChoiceModal}
          onClose={() => setShowPaymentChoiceModal(false)}
          onTakePaymentNow={handleTakePaymentNow}
          onPayLater={handlePayLater}
          orderTotal={orderTotal}
          orderType={orderStore.orderType as 'WAITING' | 'COLLECTION' | 'DELIVERY'}
        />

        {/* Payment Flow Orchestrator - Full Stripe payment flow */}
        <PaymentFlowOrchestrator
          isOpen={uiStore.showPaymentFlow}
          onClose={handleClosePaymentModal}
          orderItems={orderStore.orderItems}
          orderTotal={orderTotal}
          orderType={orderStore.orderType}
          tableNumber={orderStore.selectedTableNumber || undefined}
          guestCount={orderStore.guestCount}
          customerData={customerStore.customerData}
          deliveryFee={deliveryFee}
          onPaymentComplete={handlePaymentFlowComplete}
        />
      </div>
    </CustomizeOrchestratorProvider>
  );
}
