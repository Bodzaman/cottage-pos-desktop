import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
import { toast } from 'sonner';

// Databutton imports
import brain from 'brain';

// Store imports
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useRealtimeMenuStore, getMenuDataForPOS, startRealtimeSubscriptionsIfNeeded } from '../utils/realtimeMenuStore';
import { useCustomerDataStore } from '../utils/customerDataStore';
import { useVoiceOrderStore } from '../utils/voiceOrderStore';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { useSystemStatus } from 'utils/pollingService';

// Enhanced image preloading imports
import { useImagePreloader } from '../utils/useImagePreloader';
import { POSSkeletonGrid } from 'components/POSSkeletonGrid';

// Utility imports
import { colors as designColors } from '../utils/designSystem';
import { quickLog, createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';
import posPerf, { POSPerfMarks } from 'utils/posPerformance';

// Component imports
import ManagementHeader from '../components/ManagementHeader';
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
import { POSFooter } from '../components/POSFooter';

// View Components - Import from POSDesktop for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import { AIOrdersPanel } from 'components/AIOrdersPanel';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { MenuCategory, MenuItem, OrderItem, ModifierSelection } from '../utils/menuTypes';
import { CustomerData } from '../utils/customerDataStore';
import { TipSelection, PaymentResult } from '../utils/menuTypes';
import { FIXED_SECTIONS, type SectionId, filterItemsBySection } from 'utils/sectionMapping';

// Custom hooks
import { useTableManagement } from 'utils/useTableManagement';
import { useOrderManagement } from 'utils/useOrderManagement';
import { useCustomerFlow } from 'utils/useCustomerFlow';
import { useOrderProcessing } from 'utils/useOrderProcessing';
import { usePrintingOperations } from 'utils/usePrintingOperations';
import { usePOSInitialization } from 'utils/usePOSInitialization';

// ============================================================================
// TYPES
// ============================================================================

interface POSState {
  // View Management
  activeView: string;
  previousView: string;
  
  // Order Management
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  selectedTableNumber: number | null;
  guestCount: number;
  orderItems: OrderItem[];
}

/**
 * POSDesktop - Professional Point of Sale interface
 * Clean, production-ready implementation for restaurant operations
 */
export default function POSDesktop() {
  // ✅ Development check for console log guards
  const isDev = import.meta.env.DEV;
  
  // ============================================================================
  // AUTHENTICATION & USER MANAGEMENT
  // ============================================================================
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isAdmin, isCustomer } = useSimpleAuth();
  
  const isAuthenticated = !!user;
  const isStaff = isAdmin;
  const hasPermission = isAdmin;

  // ============================================================================
  // MANAGER OVERRIDE DIALOG STATE (NEW)
  // ============================================================================
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const managerApprovalResolverRef = useRef<((approved: boolean) => void) | null>(null);
  const [managerOverrideGranted, setManagerOverrideGranted] = useState(false);

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
    toast.success('Management access granted');
  }, []);

  const handleManagementAuthCancel = useCallback(() => {
    if (managerApprovalResolverRef.current) {
      managerApprovalResolverRef.current(false);
      managerApprovalResolverRef.current = null;
    }
    setIsManagementDialogOpen(false);
  }, []);
  
  // ============================================================================
  // STORE INTEGRATIONS
  // ============================================================================
  const realtimeMenuStore = useRealtimeMenuStore();
  const customerDataStore = useCustomerDataStore();
  const voiceOrderStore = useVoiceOrderStore();
  const tableOrdersStore = useTableOrdersStore();
  
  // Force immediate store refresh on mount to load latest variant names
  useEffect(() => {
    console.log('🔄 POSDesktop: Forcing menu store refresh to load updated variant names...');
    realtimeMenuStore.forceFullRefresh().then(() => {
      console.log('✅ POSDesktop: Menu store refreshed with latest variant data');
    }).catch(err => {
      console.error('❌ POSDesktop: Failed to refresh menu store:', err);
    });
  }, []);

  // ============================================================================
  // NEW: CUSTOM HOOKS FOR LOGIC EXTRACTION
  // ============================================================================
  const initialization = usePOSInitialization({
    onViewChange: (view) => {
      if (view === 'pos') {
        setState(prev => ({ ...prev, activeView: 'pos', previousView: prev.activeView }));
      } else if (view === 'reservations') {
        setState(prev => ({ ...prev, activeView: 'reservations', previousView: prev.activeView }));
      }
    }
  });

  // Extract data from stores
  const { searchQuery, setSearchQuery } = realtimeMenuStore;
  const categories = realtimeMenuStore.categories;
  const selectedCategory = realtimeMenuStore.selectedMenuCategory;
  const menuItems = realtimeMenuStore.menuItems;
  const menuLoading = realtimeMenuStore.isLoading;
  
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
  
  // Voice orders count
  const newOrdersCount = useVoiceOrderStore(state => 
    state.orders?.filter(order => order.status === 'NEW' || order.status === 'PENDING')?.length || 0
  );
  
  // ============================================================================
  // HEADER HANDLERS
  // ============================================================================
  const handleAdminAuthenticated = () => {
    // Could add admin overlay functionality here if needed
  };
  
  const handleOrderTypeChange = useCallback((orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "AI_ORDERS" | "ONLINE_ORDERS") => {
    // Update state for all order types (remove early return)
    updateState({ orderType });
    
    // Switch views for special order types (like POSDesktop)
    if (orderType === 'AI_ORDERS') {
      updateState({ activeView: 'ai-orders' });
    } else if (orderType === 'ONLINE_ORDERS') {
      updateState({ activeView: 'online-orders' });
    } else {
      // For standard order types, return to main POS view
      updateState({ activeView: 'pos' });
    }
    
    toast.success(`Order type changed to ${orderType}`);
  }, []);

  // ============================================================================
  // MAIN STATE MANAGEMENT
  // ============================================================================
  const [state, setState] = useState<POSState>({
    // View Management
    activeView: "pos", // Changed from "TAKE ORDER" to "pos" to match POSViewType
    previousView: "",
    
    // Order Management
    orderType: "DINE-IN",
    selectedTableNumber: null as number | null,
    guestCount: 1,
    orderItems: [] as OrderItem[],
    
    // Customer Information
    customerData: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      notes: '',
      tableNumber: '',
      guestCount: 1,
      address: '',
      street: '',
      city: '',
      postcode: '',
      deliveryNotes: ''
    },
    
    // UI State
    showCustomerModal: false,
    showVariantSelector: false,
    showOrderConfirmation: false,
    pendingOrderConfirmation: false,
    showGuestCountModal: false,
    showDineInModal: false, // Initialize dine-in modal state
  });
  
  // Helper function to update state
  const updateState = useCallback((updates: Partial<POSState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const getDisplayOrderItems = useCallback(() => {
    return state.orderItems;
  }, [state.orderItems]);

  // ============================================================================
  // TABLE MANAGEMENT HANDLERS
  // ============================================================================
  // Table management - Enhanced for dine-in workflow
  const handleTableSelect = (tableNumber: number, tableStatus?: string) => {
    console.log(`🍽️ [POSDesktop] handleTableSelect called: Table ${tableNumber}, Status: ${tableStatus}`);
    
    if (tableStatus && tableStatus !== 'AVAILABLE') {
      // Table is seated/occupied - open dine-in modal
      console.log(`🍽️ [POSDesktop] Table ${tableNumber} is ${tableStatus} - opening dine-in modal`);
      updateState({
        selectedTableNumber: tableNumber,
        showDineInModal: true
      });
    } else {
      // Table is available - open guest count modal
      console.log(`🍽️ [POSDesktop] Table ${tableNumber} selected (AVAILABLE) - opening guest count modal`);
      updateState({
        selectedTableNumber: tableNumber,
        showGuestCountModal: true
      });
    }
    
    const updatedCustomerData = {
      ...customerDataStore.customerData,
      tableNumber: tableNumber.toString(),
      guestCount: state.guestCount || 1
    };

    updateState({ customerData: updatedCustomerData });
  };
  
  // Guest count save handler - matches POSDesktop functionality
  const handleGuestCountSave = useCallback(async (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => {
    const tableNumber = state.selectedTableNumber;
    if (!tableNumber) return;
    
    // Check if we have existing order items (coming from Order Summary Process Order flow)
    const hasExistingOrder = state.orderItems.length > 0;
    
    // Create table order in persistent storage
    const success = await createTableOrder(tableNumber, guestCount, linkedTables || []);
    
    if (success) {
      updateState({
        guestCount,
        showGuestCountModal: false,
        // Preserve order items if they exist, otherwise start fresh
        orderItems: hasExistingOrder ? state.orderItems : []
      });
      
      if (hasExistingOrder) {
        // Coming from Order Summary Process Order - show success
        toast.success(`Table ${tableNumber} seated with ${guestCount} guests - confirming order`);
        
        // Check if we should trigger Order Confirmation Modal
        if (state.pendingOrderConfirmation) {
          console.log('✅ Continuing Process Order flow - opening Order Confirmation Modal');
          updateState({ pendingOrderConfirmation: false, showOrderConfirmation: true });
        }
      } else {
        // Fresh table selection - ready for new ordering
        toast.success(`Table ${tableNumber} seated with ${guestCount} guests - ready for ordering`);
      }
    }
  }, [state.selectedTableNumber, state.orderItems, state.pendingOrderConfirmation, createTableOrder, updateState]);

  // ============================================================================
  // CUSTOMER DATA MANAGEMENT
  // ============================================================================
  const handleCustomerDetailsClick = useCallback(() => {
    updateState({ showCustomerModal: true });
  }, [updateState]);
  
  const handleClearCustomerDetails = useCallback(() => {
    customerDataStore.clearCustomerData();
    updateState({
      customerData: {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        notes: '',
        tableNumber: '',
        guestCount: 2,
        address: '',
        street: '',
        city: '',
        postcode: '',
        deliveryNotes: ''
      }
    });
  }, [customerDataStore, updateState]);

  // ============================================================================
  // CUSTOMER MODAL HANDLERS (PARITY WITH POSDesktop)
  // ============================================================================
  
  // Calculate order total for validation
  const calculateOrderTotal = useCallback((): number => {
    return state.orderItems.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;
      
      // Add modifier prices if present
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          itemTotal += (modifier.price_adjustment || 0) * item.quantity;
        });
      }
      
      return total + itemTotal;
    }, 0);
  }, [state.orderItems]);

  // Handle customer data save from modal
  const handleCustomerSave = useCallback((customerData: any) => {
    console.log('💾 [POSDesktop] Saving customer data:', customerData);
    
    // Update POSDesktop state
    updateState({
      customerData: {
        firstName: customerData.firstName || '',
        lastName: customerData.lastName || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        notes: customerData.notes || '',
        tableNumber: customerData.tableNumber || '',
        guestCount: customerData.guestCount || 2,
        address: customerData.address || '',
        street: customerData.street || '',
        city: customerData.city || '',
        postcode: customerData.postcode || '',
        deliveryNotes: customerData.deliveryNotes || ''
      },
      showCustomerModal: false
    });
    
    // Store in global customer data store for order processing
    customerDataStore.setCustomerData({
      firstName: customerData.firstName || '',
      lastName: customerData.lastName || '',
      phone: customerData.phone || '',
      email: customerData.email || '',
      notes: customerData.notes || '',
      deliveryNotes: customerData.deliveryNotes || ''
    });
    
    toast.success('Customer details saved');
  }, [customerDataStore, updateState]);

  // ============================================================================
  // CUSTOM HOOKS - Core Business Logic
  // ============================================================================
  
  // Order Management Hook - ✅ Correct parameters
  const orderManagement = useOrderManagement(
    state.orderItems,
    (items) => {
      setState(prev => ({
        ...prev,
        orderItems: typeof items === 'function' ? items(prev.orderItems) : items
      }));
    }
  );
  
  // Customer Flow Hook - ✅ Fixed: Pass all 5 required parameters
  const customerFlow = useCustomerFlow(
    state.orderType,
    state.customerData,
    (data) => updateState({ customerData: data }),
    state.selectedTableNumber,
    state.guestCount
  );
  
  // Order Processing Hook - ✅ Fixed: Pass all 6 required parameters
  const orderProcessing = useOrderProcessing(
    state.orderType,
    state.orderItems,
    state.customerData,
    state.selectedTableNumber,
    state.guestCount
  );
  
  // Printing Operations Hook - ✅ Fixed: Pass all 5 required parameters
  const printing = usePrintingOperations(
    state.orderType,
    state.orderItems,
    state.customerData,
    state.selectedTableNumber,
    state.guestCount
  );

  // ============================================================================
  // DELEGATED HANDLERS - Use hooks instead of inline logic
  // ============================================================================
  
  const handleAddToOrder = orderManagement.handleAddToOrder;
  const handleRemoveItem = orderManagement.handleRemoveItem;
  const handleUpdateQuantity = orderManagement.handleUpdateQuantity;
  const handleClearOrder = useCallback(() => {
    orderManagement.handleClearOrder();
    updateState({
      selectedTableNumber: null,
      guestCount: 1
    });
  }, [orderManagement, updateState]);
  const handleIncrementItem = orderManagement.handleIncrementItem;
  const handleDecrementItem = orderManagement.handleDecrementItem;
  const handleUpdateNotes = orderManagement.handleUpdateNotes;
  const handleCustomizeItem = orderManagement.handleCustomizeItem;
  const handleCustomizeItemFromMenu = useCallback((item: OrderItem) => {
    console.log('Customize item from menu:', item);
  }, []);
  
  // Customer flow handlers
  const saveCustomerDetails = customerFlow.saveCustomerDetails;
  const closeCustomerModal = useCallback(() => {
    customerFlow.closeCustomerModal();
    updateState({ showCustomerModal: false });
    setManagerOverrideGranted(false);
  }, [customerFlow, updateState]);
  
  const handleOrderTypeSwitch = useCallback((newOrderType: 'COLLECTION') => {
    updateState({ 
      orderType: newOrderType,
      showCustomerModal: false
    });
    setManagerOverrideGranted(false);
    toast.success(`🔄 Order type switched to ${newOrderType}`);
  }, [updateState]);
  
  const handleManagerOverride = useCallback(() => {
    setIsManagementDialogOpen(true);
  }, []);
  
  const validateCustomerData = customerFlow.validateCustomerData;

  // ============================================================================
  // ORDER PROCESSING HANDLERS - Delegated to useOrderProcessing hook
  // ============================================================================
  const handleProcessOrder = useCallback(async () => {
    await orderProcessing.processOrder(
      () => updateState({ 
        pendingOrderConfirmation: true, 
        showGuestCountModal: true,
        selectedTableNumber: 1
      }),
      () => updateState({ showCustomerModal: true, pendingOrderConfirmation: true }),
      () => updateState({ showOrderConfirmation: true })
    );
  }, [orderProcessing, updateState]);

  // ============================================================================
  // PAYMENT COMPLETION HANDLER - Delegated to hooks
  // ============================================================================
  const handlePaymentSuccess = useCallback(async (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    console.log('💳 [POSDesktop] Payment completed successfully:', { tipSelection, paymentResult });
    
    try {
      // Calculate final totals
      const subtotal = state.orderItems.reduce((sum, item) => {
        const itemPrice = item.variant?.price || item.price;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      const vatAmount = subtotal * 0.20;
      const totalWithVat = subtotal + vatAmount;
      const finalTotal = totalWithVat + tipSelection.amount;
      
      // Persist payment using hook
      const paymentData = {
        order_type: state.orderType,
        table_number: state.selectedTableNumber,
        customer_data: state.customerData,
        items: state.orderItems,
        payment_method: paymentResult?.method || 'CASH',
        subtotal,
        vat_amount: vatAmount,
        tip_amount: tipSelection.amount,
        total_amount: finalTotal,
        stripe_payment_intent_id: paymentResult?.reference || null
      };
      
      await orderProcessing.persistPayment(paymentData);
      
      // Print customer receipt using hook
      const receiptData = {
        order_number: `${state.orderType.charAt(0)}${Date.now().toString().slice(-6)}`,
        order_type: state.orderType,
        table_number: state.selectedTableNumber,
        guest_count: state.guestCount,
        customer_name: `${state.customerData.firstName} ${state.customerData.lastName}`.trim() || 'Walk-in Customer',
        items: state.orderItems.map(item => ({
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
      
      await printing.printCustomerReceipt(receiptData, state.orderType);
      
      // Reset order state
      updateState({
        orderItems: [],
        customerData: {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          notes: '',
          tableNumber: '',
          guestCount: 1,
          address: '',
          street: '',
          city: '',
          postcode: '',
          deliveryNotes: ''
        },
        selectedTableNumber: null,
        guestCount: 1,
        showOrderConfirmation: false,
        showPaymentModal: false
      });
      
      toast.success('💰 Payment completed successfully!');
    } catch (error) {
      console.error('❌ [POSDesktop] Payment completion failed:', error);
      toast.error('Payment completion failed. Please try again.');
    }
  }, [state, orderProcessing, printing, updateState]);

  // ============================================================================
  // THERMAL PRINTING HANDLERS WITH OFFLINE QUEUING
  // ============================================================================

  const handleSendToKitchen = useCallback(async () => {
    if (!state.orderItems || state.orderItems.length === 0) {
      toast.error('No items to send to kitchen');
      return;
    }
    
    await printing.printKitchenTicket(state, updateState);
  }, [state, printing, updateState]);

  const handlePrintBill = useCallback(async () => {
    if (!state.orderItems || state.orderItems.length === 0) {
      toast.error('No items to print bill for');
      return;
    }
    
    await printing.printBill(state, updateState);
  }, [state, printing, updateState]);

  const handleSaveUpdate = useCallback(async () => {
    console.log('Save/Update order');
    toast.success('Order saved');
  }, []);

  const handleCompleteOrder = useCallback(async () => {
    if (!state.orderItems || state.orderItems.length === 0) {
      toast.error('No items to complete');
      return;
    }
    
    await printing.completeOrder(state, updateState);
  }, [state, printing, updateState]);

  const handleSplitBill = useCallback(async () => {
    console.log('Split bill');
    toast.success('Bill split');
  }, []);

  const handleCustomerDataUpdate = useCallback((field: string, value: string) => {
    updateState({
      customerData: {
        ...state.customerData,
        [field]: value
      }
    });
  }, [state.customerData, updateState]);

  const handleSchedulingChange = useCallback((data: any) => {
    console.log('Scheduling change:', data);
  }, []);

  const isOrderReady = useCallback(() => {
    if (state.orderItems.length === 0) return false;
    return validateCustomerData(state.orderType);
  }, [state.orderItems.length, state.orderType, validateCustomerData]);

  // ============================================================================
  // PRINTER STATUS MONITORING
  // ============================================================================
  
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
      updateState({
        queuedJobsCount: printerStatus.queuedJobs
      });
    }
  }, [printerStatus?.queuedJobs, updateState]);

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
          console.log('🚀 [POSDesktop] Starting fast initialization with POS bundle...');
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
            console.log('✅ [POSDesktop] Fast bundle loaded successfully');
          }
          
          // ✅ FIX: Don't auto-select section - let it default to null to show ALL items
          // The categories array contains real DB categories (UUIDs), not synthetic section IDs
          // When selectedMenuCategory is null, updateFilteredItems shows all items (correct behavior)
          if (isDevelopment) {
            console.log('🎯 [POSDesktop] Showing all menu items (no category pre-selected)');
          }
          
          // Mark first interactive
          posPerf.mark(POSPerfMarks.FIRST_INTERACTIVE);
          
        } else {
          // Fallback to full initialization if bundle fails
          if (isDevelopment) {
            console.log('⚠️ [POSDesktop] Bundle loading failed, falling back to full initialization');
          }
          
          if (isActive) {
            await realtimeMenuStore.initialize();
          }
          
          // Check again after async operation
          if (!isActive) {
            return;
          }
          
          // ✅ FIX: Don't auto-select section here either
          if (isDevelopment) {
            console.log('🎯 [POSDesktop] Showing all menu items (no category pre-selected)');
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
              console.log('📊 [POSDesktop] Performance Summary:', summary);
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
          realtimeMenuStore.startRealtimeSubscriptions();
          
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

  // Handle category selection
  const handleCategoryChange = (categoryId: string | null) => {
    // ✅ NEW: Start real-time subscriptions on first interaction
    startRealtimeSubscriptionsIfNeeded();
    
    // ✅ FIXED: Pass categoryId directly to store without validation
    // The store has all categories including synthetic sections and real DB categories
    realtimeMenuStore.setSelectedMenuCategory(categoryId);
  };
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  // Header Component
  const renderHeader = () => {
    return (
      <div>
        {/* Management Header - First Row */}
        <ManagementHeader
          title="Point of Sale"
          className="border-b border-gray-700"
          showGradient={false}
          onAdminSuccess={handleAdminAuthenticated}
        />

        {/* POS Navigation - Second Row */}
        <POSNavigation
          className="border-b border-gray-700 px-4 py-2"
          activeView={state.activeView}
          currentOrderType={state.orderType}
          onOrderTypeChange={handleOrderTypeChange}
          aiOrdersCount={newOrdersCount}  // Use real count from store
          onlineOrdersCount={0}  // TODO: Wire up online orders count
        />
      </div>
    );
  };

  // Main View Renderer - NEW: Add view switching logic like POSDesktop
  const renderViewContent = () => {
    switch (state.activeView) {
      case 'online-orders':
        return (
          <OnlineOrderManagement 
            onBack={() => {
              updateState({ activeView: 'pos', orderType: 'DINE-IN' });
            }} 
          />
        );
      
      case 'ai-orders':
        return (
          <AIOrdersPanel 
            onBack={() => {
              updateState({ activeView: 'pos', orderType: 'DINE-IN' });
            }} 
          />
        );
      
      case 'reservations':
        return (
          <ReservationsPlaceholder 
            onBack={() => {
              updateState({ activeView: 'pos', orderType: 'DINE-IN' });
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
    return (
      <div className="grid" style={{
        gridTemplateColumns: '300px 200px 1fr 300px', // Customer Details | Categories | Menu Items | Order Summary
        gridTemplateRows: '1fr', // Single row fills all available height
        height: 'calc(100vh - 110px)', // Viewport-driven: 100vh - (ManagementHeader ~60px + POSNavigation ~50px)
        minHeight: 'calc(100vh - 110px)', // Enforce minimum
        maxHeight: 'calc(100vh - 110px)', // Prevent overflow
        gap: '1rem',
        padding: '1rem',
        background: `linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(25, 25, 25, 0.95) 50%, rgba(20, 20, 20, 0.98) 100%)`, // Enhanced gradient from MYA-788
        boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)', // Professional shadows from MYA-788
        border: '1px solid rgba(124, 93, 250, 0.15)', // Purple accent border from MYA-788
        position: 'relative',
        transition: 'all 0.3s ease',
        borderRadius: '12px', // Increased border radius for premium feel
        backdropFilter: 'blur(10px)', // Backdrop blur from MYA-788
        overflow: 'hidden' // Prevent grid itself from scrolling
      }}>
        {/* Zone 1 - Customer Details: Order-type-specific customer information (300px width) */}
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div className="h-full rounded-xl overflow-hidden shadow-xl flex flex-col" style={{
            background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(25, 25, 25, 0.95) 50%, rgba(20, 20, 20, 0.98) 100%)', // Enhanced gradient
            boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)', // Improved shadow with inner border
            border: '1px solid rgba(124, 93, 250, 0.15)', // Purple accent border
            backdropFilter: 'blur(10px)' // Added backdrop filter for premium feel
          }}>
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-700/30">
              <h3 className="text-lg font-semibold mb-1" style={{
                backgroundImage: `linear-gradient(135deg, white 30%, ${designColors.brand.purple} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 10px rgba(124, 93, 250, 0.2)'
              }}>
                {state.orderType === 'DINE-IN' ? 'Table Selection' : state.orderType === 'DELIVERY' ? 'Delivery Details' : state.orderType === 'COLLECTION' ? 'Collection Details' : 'Customer Details'}
              </h3>
              {/* Gradient Underline */}
              <div 
                className="w-24 h-1 rounded-full mt-2"
                style={{
                  background: `linear-gradient(90deg, transparent, ${designColors.brand.purple}, transparent)`
                }}
              />
              <p className="text-gray-400 text-sm">
                {state.orderType === 'DINE-IN' ? 'Choose an available table for dine-in service' : `Order type: ${state.orderType}`}
              </p>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* DINE-IN: Table Selection Grid */}
              {state.orderType === "DINE-IN" && (
                <div className="space-y-4">
                  <DineInTableSelector
                    selectedTable={state.selectedTableNumber}
                    onTableSelect={handleTableSelect}
                    tableOrders={persistentTableOrders}
                    className=""
                  />
                  {state.selectedTableNumber && (
                    <div className="text-sm text-gray-400 mt-4">
                      Table {state.selectedTableNumber} • {state.guestCount} guests
                    </div>
                  )}
                </div>
              )}
              
              {/* Customer Details Badge for other order types */}
              {(state.orderType === "DELIVERY" || state.orderType === "COLLECTION" || state.orderType === "WAITING") && (
                <CustomerSummaryBadge
                  orderType={state.orderType}
                  onClick={handleCustomerDetailsClick}
                  onClear={handleClearCustomerDetails}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </div>

        {/* Zone 2 - Categories: Menu category navigation (200px width) */}
        <CategorySidebar
          categories={categories}
          onCategorySelect={handleCategoryChange}
          selectedCategory={selectedCategory}
          isLoading={menuLoading}
        />
        
        {/* Zone 3 - Menu Items: Main menu item selection area (flexible 1fr) */}
        <POSMenuSelector
          onAddToOrder={handleAddToOrder}
          onCustomizeItem={handleCustomizeItemFromMenu}
          onCategoryChange={handleCategoryChange}
          className="h-full"
          showSkeletons={initialization.initialLoad}
          orderType={state.orderType}
        />
        
        {/* Zone 4 - Order Summary: Current order details and actions (300px width) */}
        <OrderSummaryPanel
          orderItems={getDisplayOrderItems()}
          orderType={state.orderType}
          tableNumber={state.selectedTableNumber}
          guestCount={state.guestCount}
          customerFirstName={state.customerData.firstName}
          customerLastName={state.customerData.lastName}
          customerPhone={state.customerData.phone}
          customerAddress={state.customerData.address}
          customerStreet={state.customerData.street}
          customerPostcode={state.customerData.postcode}
          customerData={state.customerData}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
          onClearOrder={handleClearOrder}
          onProcessPayment={handleProcessOrder}
          onSendToKitchen={handleSendToKitchen}
          onPrintBill={handlePrintBill}
          onSaveUpdate={handleSaveUpdate}
          onTableSelect={handleTableSelect}
          onCustomerDetailsClick={handleCustomerDetailsClick}
          onTableSelectionClick={() => {
            console.log('📋 [POSDesktop] Table selection requested for DINE-IN order');
            // For DINE-IN orders, we need to select a table and guest count first
            updateState({ 
              showGuestCountModal: true,
              selectedTableNumber: 1 // Default to table 1, will be updated in modal
            });
          }}
          onCustomizeItem={handleCustomizeItem}
          onIncrementItem={handleIncrementItem}
          onDecrementItem={handleDecrementItem}
          onUpdateNotes={handleUpdateNotes}
          onCompleteOrder={handleCompleteOrder}
          onSplitBill={handleSplitBill}
          onClearCustomerDetails={handleClearCustomerDetails}
          onCustomerDataUpdate={handleCustomerDataUpdate}
          validateCustomerData={validateCustomerData}
          isOrderReady={isOrderReady}
          onSchedulingChange={handleSchedulingChange}
          schedulingData={null}
          
          // ✅ NEW: Direct props control for Order Confirmation Modal
          showOrderConfirmation={state.showOrderConfirmation}
          onCloseOrderConfirmation={() => updateState({ showOrderConfirmation: false })}
          onShowOrderConfirmation={() => updateState({ showOrderConfirmation: true })}
          
          // ✅ NEW: Payment completion handler
          onPaymentComplete={handlePaymentSuccess}
          
          className="h-full"
        />
      </div>
    );
  };

  // Main app structure - Fixed: Removed circular call
  return (
    <CustomizeOrchestratorProvider>
      {/* Main POS Layout */}
      <div className="flex flex-col h-full">
        {/* Header and Navigation */}
        {renderHeader()}

        {/* Main Content - Use view content renderer */}
        <div className="flex-1 overflow-hidden">
          {renderViewContent()}
        </div>

        {/* Guest Count Modal for Table Selection */}
        {state.showGuestCountModal && (
          <POSGuestCountModalClean
            isOpen={state.showGuestCountModal}
            onClose={() => updateState({ showGuestCountModal: false })}
            onSave={handleGuestCountSave}
            tableNumber={state.selectedTableNumber}
            onTableChange={(tableNumber) => updateState({ selectedTableNumber: tableNumber })}
          />
        )}

        {/* Dine-In Order Modal for Seated Tables */}
        {state.showDineInModal && state.selectedTableNumber && state.selectedTableNumber > 0 && (
          <DineInOrderModal
            isOpen={state.showDineInModal}
            onClose={() => updateState({ showDineInModal: false })}
            tableNumber={state.selectedTableNumber}
          />
        )}

        {/* Customer Details Modal */}
        {state.showCustomerModal && (
          <CustomerDetailsModal
            isOpen={state.showCustomerModal}
            onClose={closeCustomerModal}
            onSave={handleCustomerSave}
            orderType={state.orderType}
            initialData={state.customerData}
            orderValue={calculateOrderTotal()}
            onOrderTypeSwitch={handleOrderTypeSwitch}
            onManagerOverride={handleManagerOverride}
            // NEW: pass promise-based approval and granted flag
            requestManagerApproval={requestManagerApproval}
            managerOverrideGranted={managerOverrideGranted}
          />
        )}

        {/* Professional Footer */}
        <POSFooter 
          currentOrderType={state.orderType}
          className=""
        />

        {/* NEW: Management Password Dialog for critical overrides */}
        <ManagementPasswordDialog
          isOpen={isManagementDialogOpen}
          onClose={handleManagementAuthCancel}
          onAuthenticated={handleManagementAuthSuccess}
          userId={user?.id}
        />
      </div>
    </CustomizeOrchestratorProvider>
  );
}
