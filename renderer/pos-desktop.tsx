import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
import { toast } from 'sonner';

// Databutton imports
import brain from 'brain';

// Store imports
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useRealtimeMenuStore, loadPOSBundle, getMenuDataForPOS } from '../utils/realtimeMenuStore';
import { useCustomerDataStore } from 'utils/customerDataStore';
import { useVoiceOrderStore } from '../utils/voiceOrderStore';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { useHeaderViewChange } from '../utils/headerViewChange';
import { useSystemStatus } from 'utils/pollingService';

// Enhanced image preloading imports
import { useImagePreloader } from '../utils/useImagePreloader';
import { POSSkeletonGrid } from 'components/POSSkeletonGrid';

// Utility imports
import { colors as designColors } from '../utils/designSystem';
import { quickLog, createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';
import posPerformance, { POSPerfMarks } from 'utils/posPerformance';

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
import ManagementPasswordDialog from '../components/ManagementPasswordDialog';
import MenuManagementDialog from '../components/MenuManagementDialog';
import AllOrdersModal from '../components/AllOrdersModal';
import { CustomizeOrchestrator, CustomizeOrchestratorProvider } from '../components/CustomizeOrchestrator';
import { POSFooter } from '../components/POSFooter';

// View Components - Import from POSII for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import { AIOrdersPanel } from 'components/AIOrdersPanel';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { MenuCategory, MenuItem, OrderItem, ModifierSelection } from '../utils/menuTypes';
import { CustomerData } from '../utils/customerDataStore';
import { printingService } from '../utils/printingService';
import { checkHelperAppStatus, printBothViaHelperApp } from '../utils/helperAppDetection';
import { TipSelection, PaymentResult } from '../utils/menuTypes';
import { registerServiceWorker } from '../utils/serviceWorkerManager';
import { outboxSyncManager } from '../utils/outboxSyncManager';
import { bufferedPaymentManager } from '../utils/bufferedPaymentManager';

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
  
  // Customer Information
  customerData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
    tableNumber: string;
    guestCount: number;
    address: string;
    street: string;
    city: string;
    postcode: string;
    deliveryNotes: string;
  };
  
  // UI State
  showCustomerModal: boolean;
  showVariantSelector: boolean;
  showOrderConfirmation: boolean;
  pendingOrderConfirmation: boolean;
  showGuestCountModal: boolean;
  showDineInModal: boolean;
}

/**
 * POSDesktop - Professional Point of Sale interface
 * Clean, production-ready implementation for restaurant operations
 */
export default function POSDesktop() {
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
  // STORE INTEGRATIONS
  // ============================================================================
  const realtimeMenuStore = useRealtimeMenuStore();
  const customerDataStore = useCustomerDataStore();
  const voiceOrderStore = useVoiceOrderStore();
  const tableOrdersStore = useTableOrdersStore();
  
  // Extract data from stores
  const { searchQuery, setSearchQuery } = realtimeMenuStore;
  const categories = realtimeMenuStore.categories;
  const selectedCategory = realtimeMenuStore.selectedMenuCategory;
  const selectedParentCategory = realtimeMenuStore.selectedParentCategory;
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
  // ENHANCED IMAGE PRELOADING & BUNDLE STRATEGY
  // ============================================================================
  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Enhanced image preloading integration
  const { 
    isImageReady, 
    getImageStatus, 
    initializePreloading, 
    stats,
    isInitializing 
  } = useImagePreloader();
  
  // Component initialization with enhanced bundle strategy
  useEffect(() => {
    const initializePOSDesktop = async () => {
      console.log('🚀 [POSDesktop] Starting enhanced initialization with image preloading...');
      
      try {
        // Phase 1: Load bundle (this triggers the enhanced bundle API)
        console.log('📦 [POSDesktop] Loading enhanced POS bundle...');
        const bundleStartTime = performance.now();
        
        await loadPOSBundle();
        
        const bundleLoadTime = performance.now() - bundleStartTime;
        console.log(`✅ [POSDesktop] Enhanced bundle loaded in ${bundleLoadTime.toFixed(2)}ms`);
        
        setBundleLoaded(true);
        
        // Phase 2: Start priority-based image preloading
        console.log('🖼️ [POSDesktop] Starting priority-based image preloading...');
        const imageStartTime = performance.now();
        
        // Get current menu items for preloading from bundle
        const currentMenuItems = realtimeMenuStore.filteredMenuItems.slice(0, 10); // First 10 visible items
        
        if (currentMenuItems.length > 0) {
          // Convert to POSBundleMenuItem format for preloading
          const bundleItems = currentMenuItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price || 0,
            category_id: item.category_id,
            display_order: item.display_order || 0,
            active: item.active !== false,
            image_thumb_url: item.image_url,
            image_priority: 'critical', // Set priority for first batch
            preload_order: item.display_order || 0
          }));
          
          console.log(`🎯 [POSDesktop] Preloading ${bundleItems.length} priority images...`);
          
          // Start preloading with correct function
          await initializePreloading(bundleItems as any);
          
          const imageLoadTime = performance.now() - imageStartTime;
          console.log(`🖼️ [POSDesktop] Image preloading completed in ${imageLoadTime.toFixed(2)}ms`);
          console.log(`📊 [POSDesktop] Preload stats:`, stats);
        }
        
        // Phase 3: Complete initialization with skeleton transition delay
        setTimeout(() => {
          setInitialLoad(false); // ✅ Allow skeleton rendering before hiding
          console.log('✅ [POSDesktop] Enhanced initialization complete');
        }, 500); // Brief delay to ensure skeletons are visible during startup
        
      } catch (error) {
        console.error('❌ [POSDesktop] Enhanced initialization failed:', error);
        setBundleLoaded(true); // Fallback to show content
        setInitialLoad(false);
      }
    };
    
    initializePOSDesktop();
  }, []); // Keep empty dependency array - the initialization should only run once
  
  // NEW: Initialize offline services
  useEffect(() => {
    const initializeOfflineServices = async () => {
      try {
        // Register service worker for offline support
        const swRegistered = await registerServiceWorker();
        if (swRegistered) {
          console.log('✅ [POSDesktop] Service worker registered successfully');
        }
        
        // Initialize outbox sync manager
        await outboxSyncManager.initialize();
        console.log('✅ [POSDesktop] Outbox sync manager initialized');
        
        // Initialize payment manager (you'd pass your Stripe key here)
        await bufferedPaymentManager.initialize();
        console.log('✅ [POSDesktop] Buffered payment manager initialized');
        
      } catch (error) {
        console.error('❌ [POSDesktop] Failed to initialize offline services:', error);
      }
    };
    
    initializeOfflineServices();
  }, []);

  // ============================================================================
  // HEADER VIEW CHANGE LISTENER  
  // ============================================================================
  useEffect(() => {
    const cleanup = useHeaderViewChange((event) => {
      switch (event.view) {
        case 'pos':
          updateState({ activeView: 'pos' });
          break;
        case 'reservations':
          updateState({ activeView: 'reservations' });
          break;
        default:
          // Keep error for unknown views
          console.warn('[POSDesktop] Unknown view:', event.view);
      }
    })();
    
    return cleanup;
  }, []);

  // ============================================================================
  // HEADER STATE MANAGEMENT
  // ============================================================================
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showMenuManagementModal, setShowMenuManagementModal] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  
  // ============================================================================
  // HEADER HANDLERS
  // ============================================================================
  const handleAdminAuthenticated = () => {
    // Could add admin overlay functionality here if needed
  };
  
  const handleOrderTypeChange = useCallback((orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "AI_ORDERS" | "ONLINE_ORDERS") => {
    // Update state for all order types (remove early return)
    updateState({ orderType });
    
    // Switch views for special order types (like POSII)
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
        showDineInModal: true,
        selectedTableNumber: tableNumber
      });
    } else {
      // Table is available - open guest count modal
      console.log(`🍽️ [POSDesktop] Table ${tableNumber} selected (AVAILABLE) - opening guest count modal`);
      updateState({
        showGuestCountModal: true,
        selectedTableNumber: tableNumber
      });
    }
    
    const updatedCustomerData = {
      ...state.customerData,
      tableNumber: tableNumber.toString(),
      guestCount: state.guestCount || 1
    };

    updateState({ customerData: updatedCustomerData });
  };
  
  // Guest count save handler - matches POSII functionality
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
  // CUSTOMER MODAL HANDLERS (PARITY WITH POSII)
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

  // Handle delivery area validation - order type switching
  const handleOrderTypeSwitch = useCallback((newOrderType: 'COLLECTION') => {
    updateState({ 
      orderType: newOrderType,
      showCustomerModal: false // Close modal after switching
    });
    toast.success(`🔄 Order type switched to ${newOrderType}`);
  }, [updateState]);

  // Handle delivery area validation - manager override
  const handleManagerOverride = useCallback(() => {
    // For now, we'll just close the modal and allow the delivery
    // In a real system, this would prompt for manager credentials
    updateState({ showCustomerModal: false });
    toast.info('🔐 Manager override - delivery approved');
  }, [updateState]);

  const validateCustomerData = useCallback((orderType: string) => {
    const { customerData, selectedTableNumber, guestCount } = state;
    
    switch (orderType) {
      case "DINE-IN":
        return selectedTableNumber !== null && guestCount > 0;
      case "COLLECTION":
      case "WAITING":
        return customerData?.firstName?.trim() !== '' && customerData?.lastName?.trim() !== '' && customerData?.phone?.trim() !== '';
      case "DELIVERY":
        return customerData?.firstName?.trim() !== '' && customerData?.lastName?.trim() !== '' &&
               customerData?.phone?.trim() !== '' && 
               (customerData?.address?.trim() !== '' || (customerData?.street?.trim() !== '' && customerData?.postcode?.trim() !== ''));
      default:
        return false;
    }
  }, [state]);

  // ============================================================================
  // ORDER MANAGEMENT HANDLERS
  // ============================================================================
  const handleAddToOrder = useCallback((orderItem: OrderItem) => {
    setState(prev => {
      const currentItems = prev.orderItems;
      
      // Check for duplicate item (same menu item + variant + modifiers)
      const duplicateIndex = currentItems.findIndex(existingItem => {
        const sameMenuItem = existingItem.menu_item_id === orderItem.menu_item_id;
        const sameVariant = existingItem.variant_id === orderItem.variant_id;
        const sameNotes = existingItem.notes === orderItem.notes;
        
        // Compare modifiers arrays (if both have modifiers)
        const sameModifiers = (() => {
          const existingMods = existingItem.modifiers || [];
          const newMods = orderItem.modifiers || [];
          
          if (existingMods.length !== newMods.length) return false;
          
          // Sort and compare modifier arrays
          const sortedExisting = existingMods.sort((a, b) => a.modifier_id.localeCompare(b.modifier_id));
          const sortedNew = newMods.sort((a, b) => a.modifier_id.localeCompare(b.modifier_id));
          
          return sortedExisting.every((mod, index) => {
            const newMod = sortedNew[index];
            return mod.modifier_id === newMod.modifier_id && 
                   mod.option_id === newMod.option_id;
          });
        })();
        
        return sameMenuItem && sameVariant && sameNotes && sameModifiers;
      });
      
      if (duplicateIndex >= 0) {
        // Increment quantity of existing item
        const updatedItems = currentItems.map((item, index) => 
          index === duplicateIndex 
            ? { ...item, quantity: item.quantity + orderItem.quantity }
            : item
        );
        toast.success(`Increased quantity of ${orderItem.name} (now ${currentItems[duplicateIndex].quantity + orderItem.quantity})`);
        return { ...prev, orderItems: updatedItems };
      } else {
        // Add as new item
        const newItems = [...currentItems, orderItem];
        toast.success(`Added ${orderItem.name} to order`);
        return { ...prev, orderItems: newItems };
      }
    });
  }, []);
  
  const handleRemoveItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      orderItems: prev.orderItems.filter(item => item.id !== itemId)
    }));
    toast.info("Item removed from order");
  }, []);
  
  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setState(prev => ({
        ...prev,
        orderItems: prev.orderItems.filter((_, i) => i !== index)
      }));
      toast.info("Item removed from order");
      return;
    }
    
    setState(prev => ({
      ...prev,
      orderItems: prev.orderItems.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  }, []);
  
  const handleClearOrder = useCallback(() => {
    updateState({
      orderItems: [],
      selectedTableNumber: null,
      guestCount: 1
    });
    toast.info('Order cleared');
  }, [updateState]);

  const handleIncrementItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      orderItems: prev.orderItems.map(item => 
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    }));
  }, []);
  
  const handleDecrementItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      orderItems: prev.orderItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(1, item.quantity - 1);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    }));
  }, []);

  const handleUpdateNotes = useCallback((itemId: string, notes: string) => {
    setState(prev => ({
      ...prev,
      orderItems: prev.orderItems.map(item => 
        item.id === itemId ? { ...item, notes } : item
      )
    }));
  }, []);

  const handleCustomizeItem = useCallback((index: number, item: OrderItem) => {
    // Handle item customization logic
    console.log('Customize item:', index, item);
  }, []);

  const handleCustomizeItemFromMenu = useCallback((item: OrderItem) => {
    console.log('Customize item from menu:', item);
  }, []);

  // ============================================================================
  // ORDER PROCESSING HANDLERS
  // ============================================================================
  const handleProcessOrder = useCallback(async () => {
    if (state.orderItems.length === 0) {
      toast.error("No items to process");
      return;
    }

    // ============================================================================
    // STEP 1: CUSTOMER DATA VALIDATION
    // ============================================================================
    if (!customerDataStore.hasRequiredCustomerData(state.orderType)) {
      console.log(`🔍 [POSDesktop] Missing customer data for ${state.orderType} order`);
      
      if (state.orderType === 'DINE-IN') {
        // For DINE-IN: Need table selection
        if (!state.selectedTableNumber) {
          console.log('🔍 [POSDesktop] Opening table selection modal for DINE-IN order');
          updateState({ 
            pendingOrderConfirmation: true, 
            showGuestCountModal: true,
            selectedTableNumber: 1 // Default to table 1, will be updated in modal
          });
          toast.info('Table selection required', {
            description: 'Please select a table to continue with this order'
          });
          return; // Stop here - will continue after table is selected
        }
      } else {
        // For DELIVERY/COLLECTION/WAITING: Need customer details
        console.log(`🔍 [POSDesktop] Opening customer modal for ${state.orderType} order`);
        updateState({ showCustomerModal: true, pendingOrderConfirmation: true });
        toast.info('Customer details required', {
          description: 'Please provide customer information to continue'
        });
        return; // Stop here - will continue after customer data is provided
      }
    }

    // ============================================================================
    // STEP 2: BUSINESS RULES VALIDATION
    // ============================================================================
    const calculatedTotal = state.orderItems.reduce((sum, item) => {
      const itemPrice = item.variant?.price || item.price;
      return sum + (itemPrice * item.quantity);
    }, 0);

    // Validate minimum order for DELIVERY
    if (state.orderType === 'DELIVERY') {
      const minimumOrder = 15; // Should come from settings
      if (calculatedTotal < minimumOrder) {
        toast.error('Minimum order not met', {
          description: `Delivery orders require a minimum of £${minimumOrder.toFixed(2)}. Current total: £${calculatedTotal.toFixed(2)}`
        });
        return;
      }
    }

    // All validations passed - open Order Confirmation Modal
    console.log('✅ All validations passed, opening Order Confirmation Modal');
    updateState({ showOrderConfirmation: true });
  }, [state]);

  // ============================================================================
  // PAYMENT COMPLETION HANDLER - Table closure and receipt printing
  // ============================================================================
  const handlePaymentSuccess = useCallback(async (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    console.log('💳 [POSDesktop] Payment completed successfully:', { tipSelection, paymentResult });
    
    try {
      // ========================================================================
      // STEP 1: CALCULATE FINAL TOTALS WITH TIP
      // ========================================================================
      const subtotal = state.orderItems.reduce((sum, item) => {
        const itemPrice = item.variant?.price || item.price;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      const vatAmount = subtotal * 0.20; // 20% VAT
      const totalWithVat = subtotal + vatAmount;
      const finalTotal = totalWithVat + tipSelection.amount;
      
      console.log('💰 [POSDesktop] Final payment totals:', {
        subtotal: subtotal.toFixed(2),
        vat: vatAmount.toFixed(2),
        tip: tipSelection.amount.toFixed(2),
        finalTotal: finalTotal.toFixed(2)
      });
      
      // ========================================================================
      // STEP 2: PERSIST PAYMENT TO DATABASE
      // ========================================================================
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
      
      console.log('💾 [POSDesktop] Persisting payment data...');
      const paymentResponse = await brain.process_payment2(paymentData);
      console.log('✅ [POSDesktop] Payment persisted:', paymentResponse);
      
      // ========================================================================
      // STEP 3: PRINT CUSTOMER RECEIPT WITH TEMPLATE SUPPORT
      // ========================================================================
      console.log('🧾 [POSDesktop] Printing customer receipt with template support...');
      
      // Get template assignment for the order type
      let templateAssignment;
      try {
        const apiOrderMode = state.orderType.replace(/-/g, '_'); // Convert DINE-IN → DINE_IN
        const assignmentResponse = await brain.get_template_assignment({ order_mode: apiOrderMode });
        templateAssignment = await assignmentResponse.json();
        console.log('✅ [POSDesktop] Template assignment loaded:', templateAssignment);
      } catch (error) {
        console.warn('⚠️ [POSDesktop] Failed to load template assignment, using defaults:', error);
        templateAssignment = {
          customer_template_id: state.orderType === 'DELIVERY' ? 'delivery_takeaway' : 'classic_restaurant'
        };
      }
      
      const receiptData = {
        order_number: `${state.orderType.charAt(0)}${Date.now().toString().slice(-6)}`,
        order_type: state.orderType,
        table_number: state.selectedTableNumber,
        guest_count: state.guestCount, // ✅ FIXED: Add missing guest count
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
      
      try {
        const printResponse = await brain.create_print_job({
          template_id: templateAssignment.customer_template_id, // ✅ FIXED: Use saved template
          receipt_type: 'customer',
          order_data: receiptData, // ✅ FIXED: Use order_data instead of data
          priority: 'normal'
        });
        
        const printJob = await printResponse.json();
        console.log('✅ [POSDesktop] Receipt print job created with template:', printJob.job_id);
        toast.success('Receipt printed successfully');
      } catch (printError) {
        console.warn('⚠️ [POSDesktop] Receipt printing failed, but payment completed:', printError);
        toast.warning('Payment completed but receipt printing failed');
      }
      
      // ========================================================================
      // STEP 4: CLOSE TABLE/TAB AND RESET STATE
      // ========================================================================
      if (state.orderType === 'DINE-IN' && state.selectedTableNumber) {
        console.log(`🍽️ [POSDesktop] Closing table ${state.selectedTableNumber}...`);
        
        try {
          await brain.update_pos_table_status({
            tableNumber: state.selectedTableNumber,
            status: 'available'
          });
          console.log(`✅ [POSDesktop] Table ${state.selectedTableNumber} closed successfully`);
        } catch (tableError) {
          console.warn('⚠️ [POSDesktop] Failed to update table status:', tableError);
        }
      }
      
      // Reset order state
      console.log('🔄 [POSDesktop] Resetting order state after successful payment...');
      updateState({
        orderItems: [],
        selectedTableNumber: null,
        guestCount: 1,
        showOrderConfirmation: false,
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
      
      // Success notification
      toast.success(`Payment of £${finalTotal.toFixed(2)} completed successfully!`);
      
    } catch (error) {
      console.error('❌ [POSDesktop] Payment completion failed:', error);
      toast.error('Failed to complete payment process');
    }
  }, [state, brain, updateState]);

  // ============================================================================
  // THERMAL PRINTING HANDLERS WITH OFFLINE QUEUING
  // ============================================================================

  const handleSendToKitchen = async () => {
    if (!state.orderItems || state.orderItems.length === 0) {
      toast.error('No items to send to kitchen');
      return;
    }

    console.log('🔥 [POSDesktop] Starting kitchen printing process...');
    
    try {
      // ========================================================================
      // 🆕 GET TEMPLATE ASSIGNMENT FOR CURRENT ORDER MODE
      // ========================================================================
      
      console.log('📋 [POSDesktop] Fetching template assignment for order mode:', state.orderType);
      let templateAssignment;
      
      try {
        // Get template assignment for the order type (convert format for API)
        const apiOrderMode = state.orderType.replace(/-/g, '_'); // Convert DINE-IN → DINE_IN
        const assignmentResponse = await brain.get_template_assignment({ order_mode: apiOrderMode });
        templateAssignment = await assignmentResponse.json();
        console.log('✅ [POSDesktop] Template assignment loaded:', templateAssignment);
      } catch (error) {
        console.warn('⚠️ [POSDesktop] Failed to load template assignment, using defaults:', error);
        // Fallback to default templates
        templateAssignment = {
          kitchen_template_id: state.orderType === 'DELIVERY' ? 'delivery_takeaway' : 'classic_restaurant',
          customer_template_id: state.orderType === 'DELIVERY' ? 'delivery_takeaway' : 'classic_restaurant'
        };
      }
      
      // ========================================================================
      // PREPARE KITCHEN TICKET DATA 
      // ========================================================================
      
      const kitchenReceipt = {
        orderNumber: `T${state.selectedTableNumber}`,
        orderType: state.orderType,
        items: state.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes || '',
          modifiers: item.modifiers?.map(mod => mod.name) || []
        })),
        table: `${state.selectedTableNumber}`,
        specialInstructions: '',
        customerName: state.customerData?.firstName || 'Walk-in Customer',
        timestamp: new Date().toISOString()
      };

      // ========================================================================
      // 🆕 CREATE PRINT JOB USING TEMPLATE ASSIGNMENT
      // ========================================================================
      
      console.log('🖨️ [POSDesktop] Creating kitchen print job with template:', templateAssignment.kitchen_template_id);
      
      try {
        const printJobResponse = await brain.create_print_job({
          template_id: templateAssignment.kitchen_template_id,
          receipt_type: 'kitchen',
          order_data: kitchenReceipt,
          priority: 'high',
          metadata: {
            order_mode: state.orderType,
            table_number: state.selectedTableNumber,
            created_from: 'pos_desktop_kitchen'
          }
        });
        
        const printJob = await printJobResponse.json();
        console.log('✅ [POSDesktop] Kitchen print job created:', printJob.job_id);
        
        toast.success(`Kitchen ticket sent to printer (${printJob.job_id})`, {
          description: `Table ${state.selectedTableNumber} • ${state.orderItems.length} items`
        });
        
      } catch (printError) {
        console.error('❌ [POSDesktop] Failed to create kitchen print job:', printError);
        toast.error('Failed to send kitchen ticket to printer');
      }

      // ========================================================================
      // DIRECT HELPER APP PRINTING - Frontend-to-Local Architecture (Fallback)
      // ========================================================================
      
      console.log('🖨️ [POSDesktop] Starting fallback print process with helper app detection...');
      
      // Step 1: Check if helper app is available
      const helperStatus = await checkHelperAppStatus();
      console.log('🔍 [POSDesktop] Helper app status:', helperStatus);
      
      let printResult: any = null;
      let printingMethod = 'unknown';
      
      if (helperStatus.isAvailable) {
        // Step 2: Use helper app directly for printing
        console.log('✅ [POSDesktop] Helper app available - using direct printing');
        printingMethod = 'helper_app';
        
        try {
          const helperPrintResult = await printBothViaHelperApp(kitchenReceipt);
          
          // Convert helper app response to match POSII format
          printResult = {
            success: helperPrintResult.overallSuccess,
            kitchen_job: {
              job_id: helperPrintResult.kitchen.job_id || `kitchen_${Date.now()}`,
              success: helperPrintResult.kitchen.success
            },
            customer_job: {
              job_id: helperPrintResult.customer.job_id || `customer_${Date.now()}`,
              success: helperPrintResult.customer.success
            },
            method: 'helper_app',
            message: `Kitchen: ${helperPrintResult.kitchen.success ? '✅' : '❌'} | Customer: ${helperPrintResult.customer.success ? '✅' : '❌'}`
          };
          
          console.log('✅ [POSDesktop] Helper app printing completed:', printResult);
          
        } catch (error) {
          console.log('❌ [POSDesktop] Helper app printing failed:', error);
          printingMethod = 'cloud_fallback';
          
          // Fallback to cloud backend
          console.log('🔄 [POSDesktop] Falling back to cloud backend printing...');
          const printResponse = await brain.print_kitchen_and_customer(kitchenReceipt);
          printResult = await printResponse.json();
          printResult.method = 'cloud_fallback';
        }
        
      } else {
        // Step 3: Fallback to cloud backend when helper app unavailable
        console.log('⚠️ [POSDesktop] Helper app unavailable - using cloud backend fallback');
        printingMethod = 'cloud_backend';
        
        try {
          const printResponse = await brain.print_kitchen_and_customer(kitchenReceipt);
          printResult = await printResponse.json();
          printResult.method = 'cloud_backend';
          
          console.log('✅ [POSDesktop] Cloud backend printing completed:', printResult);
          
        } catch (error) {
          console.log('❌ [POSDesktop] Cloud backend printing also failed:', error);
          
          // Create mock result for order processing
          printResult = {
            success: false,
            kitchen_job: { job_id: `failed_kitchen_${Date.now()}`, success: false },
            customer_job: { job_id: `failed_customer_${Date.now()}`, success: false },
            method: 'failed',
            message: 'Both helper app and cloud backend printing failed',
            error: error.message
          };
        }
      }
      
      // Check if print jobs were created successfully (regardless of physical printing)
      const jobsCreated = printResult.kitchen_job?.job_id && printResult.customer_job?.job_id;
      const hasPhysicalPrinter = printResult.success;
      
      // ========================================================================
      // OFFLINE QUEUE FALLBACK - CREATE PRINT JOB FOR LATER PROCESSING
      // ========================================================================
      
      if (!hasPhysicalPrinter) {
        console.log('📝 [POSDesktop] All printing methods failed - queuing print job for offline processing...');
        
        try {
          // Create print job for offline processing
          const printJobRequest = {
            job_type: 'kitchen_ticket',
            priority: 'high',
            order_data: kitchenReceipt,
            metadata: {
              table_number: state.selectedTableNumber,
              order_mode: state.orderType,
              created_from: 'pos_desktop',
              retry_count: 0
            }
          };
          
          const queueResponse = await brain.create_print_job(printJobRequest);
          const queueResult = await queueResponse.json();
          
          if (queueResult.success) {
            // Mark items as queued for kitchen
            const updatedOrder = state.orderItems.map(item => ({
              ...item,
              sentToKitchen: true,
              kitchenQueued: true,
              kitchenQueuedAt: new Date(),
              queueJobId: queueResult.job_id
            }));
            
            updateOrderData(state.selectedTableNumber, updatedOrder);
            
            updateState({
              kitchenQueued: true,
              lastKitchenQueuedAt: new Date(),
              queuedJobsCount: (state.queuedJobsCount || 0) + 1
            });

            toast.warning(`Kitchen ticket queued for offline printing - Table ${state.selectedTableNumber}`, {
              description: 'Will print automatically when printer comes online'
            });
            
            console.log('✅ [POSDesktop] Print job queued successfully:', queueResult.job_id);
            return; // Exit successfully even though printing failed
          } else {
            throw new Error('Failed to queue print job: ' + (queueResult.error || 'Unknown error'));
          }
        } catch (queueError) {
          console.error('❌ [POSDesktop] Failed to queue print job:', queueError);
          throw new Error('Printing failed and could not queue job: ' + queueError.message);
        }
      }

      // ========================================================================
      // UPDATE ORDER STATE AFTER SUCCESSFUL PRINTING
      // ========================================================================
      
      if (hasPhysicalPrinter) {
        // Mark items as sent to kitchen
        const updatedOrder = state.orderItems.map(item => ({
          ...item,
          sentToKitchen: true,
          kitchenPrintedAt: new Date()
        }));
        
        updateOrderData(state.selectedTableNumber, updatedOrder);
        
        updateState({
          kitchenPrinted: true,
          lastKitchenPrintedAt: new Date()
        });

        toast.success(`Kitchen ticket printed successfully - Table ${state.selectedTableNumber}`, {
          description: `Printed via ${printResult.method.replace('_', ' ')}`
        });
        
        console.log('✅ [POSDesktop] Kitchen printing process completed successfully');
      }
      
    } catch (error) {
      console.error('❌ [POSDesktop] Kitchen printing failed:', error);
      toast.error('Failed to print kitchen ticket', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handlePrintBill = async () => {
    if (!state.orderItems || state.orderItems.length === 0) {
      toast.error('No items to print bill for');
      return;
    }

    console.log('🧾 [POSDesktop] Starting bill printing process...');
    
    try {
      // ========================================================================
      // CALCULATE ORDER TOTALS
      // ========================================================================
      
      const subtotal = state.orderItems.reduce((sum, item) => {
        const itemPrice = item.variant?.price || item.price;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      const vatRate = 0.20; // 20% VAT
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;
      
      // ========================================================================
      // PREPARE CUSTOMER RECEIPT DATA
      // ========================================================================
      
      const customerReceipt = {
        orderNumber: `T${state.selectedTableNumber}`,
        orderMode: state.orderType,
        tableNumber: state.selectedTableNumber,
        items: state.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          variant: item.variant?.name || 'Standard',
          price: item.variant?.price || item.price,
          total: (item.variant?.price || item.price) * item.quantity
        })),
        subtotal: subtotal,
        vatAmount: vatAmount,
        vatRate: vatRate,
        totalAmount: total,
        paymentMethod: 'Cash', // Default for POS
        timestamp: new Date().toISOString()
      };

      // ========================================================================
      // ATTEMPT THERMAL PRINTING WITH OFFLINE FALLBACK
      // ========================================================================
      
      let printSuccess = false;
      
      try {
        const helperResponse = await brain.print_customer_receipt(customerReceipt);
        const helperData = await helperResponse.json();
        
        if (helperData.success) {
          updateState({
            billPrinted: true,
            lastBillPrintedAt: new Date()
          });

          toast.success(`Bill printed successfully - Total: £${total.toFixed(2)}`, {
            description: 'Printed via thermal printer'
          });
          
          console.log('✅ [POSDesktop] Bill printing completed successfully');
          printSuccess = true;
        } else {
          throw new Error(helperData.error || 'Print failed');
        }
        
      } catch (error) {
        console.log('❌ [POSDesktop] Thermal printing failed:', error);
        
        // =====================================================================
        // OFFLINE QUEUE FALLBACK FOR CUSTOMER RECEIPTS
        // =====================================================================
        
        try {
          console.log('📝 [POSDesktop] Queuing customer receipt for offline processing...');
          
          const printJobRequest = {
            job_type: 'customer_receipt',
            priority: 'medium',
            order_data: customerReceipt,
            metadata: {
              table_number: state.selectedTableNumber,
              order_mode: state.orderType,
              total_amount: total,
              created_from: 'pos_desktop',
              retry_count: 0
            }
          };
          
          const queueResponse = await brain.create_print_job(printJobRequest);
          const queueResult = await queueResponse.json();
          
          if (queueResult.success) {
            updateState({
              billQueued: true,
              lastBillQueuedAt: new Date(),
              queuedJobsCount: (state.queuedJobsCount || 0) + 1
            });

            toast.warning(`Bill queued for offline printing - Total: £${total.toFixed(2)}`, {
              description: 'Will print automatically when printer comes online'
            });
            
            console.log('✅ [POSDesktop] Customer receipt queued successfully:', queueResult.job_id);
          } else {
            throw new Error('Failed to queue customer receipt: ' + (queueResult.error || 'Unknown error'));
          }
        } catch (queueError) {
          console.error('❌ [POSDesktop] Failed to queue customer receipt:', queueError);
          toast.error('Failed to print bill', {
            description: 'Order saved but printing and queuing failed'
          });
        }
      }
      
    } catch (error) {
      console.error('❌ [POSDesktop] Bill printing failed:', error);
      toast.error('Failed to print bill', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleSaveUpdate = useCallback(async () => {
    console.log('Save/Update order');
    toast.success('Order saved');
  }, []);

  const handleCompleteOrder = useCallback(async () => {
    console.log('Complete order');
    
    // Validate we have items to complete
    if (!state.orderItems || state.orderItems.length === 0) {
      toast.error('No items to complete');
      return;
    }

    console.log('🏁 [POSDesktop] Starting order completion with customer receipt...');
    
    try {
      // ========================================================================
      // 🆕 GET TEMPLATE ASSIGNMENT FOR CURRENT ORDER MODE
      // ========================================================================
      
      console.log('📋 [POSDesktop] Fetching template assignment for order mode:', state.orderType);
      let templateAssignment;
      
      try {
        // Get template assignment for the order type (convert format for API)
        const apiOrderMode = state.orderType.replace(/-/g, '_'); // Convert DINE-IN → DINE_IN
        const assignmentResponse = await brain.get_template_assignment({ order_mode: apiOrderMode });
        templateAssignment = await assignmentResponse.json();
        console.log('✅ [POSDesktop] Template assignment loaded for completion:', templateAssignment);
      } catch (error) {
        console.warn('⚠️ [POSDesktop] Failed to load template assignment, using defaults:', error);
        // Fallback to default templates
        templateAssignment = {
          kitchen_template_id: state.orderType === 'DELIVERY' ? 'delivery_takeaway' : 'classic_restaurant',
          customer_template_id: state.orderType === 'DELIVERY' ? 'delivery_takeaway' : 'classic_restaurant'
        };
      }
      
      // ========================================================================
      // PREPARE CUSTOMER RECEIPT DATA
      // ========================================================================
      
      const orderTotal = state.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vatAmount = orderTotal * 0.2; // 20% VAT
      const finalTotal = orderTotal + vatAmount;
      
      const customerReceipt = {
        orderNumber: `${state.orderType === 'DINE-IN' ? 'T' : 'O'}${state.selectedTableNumber || Date.now()}`,
        orderType: state.orderType,
        channel: 'POS_DESKTOP',
        items: state.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          notes: item.notes || '',
          modifiers: item.modifiers?.map(mod => ({ name: mod.name, price: mod.price || 0 })) || []
        })),
        subtotal: orderTotal,
        vat: vatAmount,
        total: finalTotal,
        paymentMethod: 'Cash', // Default for POS
        customerName: state.customerData?.firstName && state.customerData?.lastName 
          ? `${state.customerData.firstName} ${state.customerData.lastName}` 
          : 'Walk-in Customer',
        customerPhone: state.customerData?.phone || '',
        deliveryAddress: state.orderType === 'DELIVERY' ? {
          address: state.customerData?.address || '',
          street: state.customerData?.street || '',
          city: state.customerData?.city || '',
          postcode: state.customerData?.postcode || ''
        } : null,
        table: state.orderType === 'DINE-IN' ? `${state.selectedTableNumber}` : null,
        guest_count: state.guestCount, // ✅ FIXED: Add missing guest count for template compatibility
        timestamp: new Date().toISOString()
      };
      
      // ========================================================================
      // 🆕 CREATE CUSTOMER RECEIPT PRINT JOB
      // ========================================================================
      
      console.log('🧾 [POSDesktop] Creating customer receipt print job with template:', templateAssignment.customer_template_id);
      
      try {
        const printJobResponse = await brain.create_print_job({
          template_id: templateAssignment.customer_template_id,
          receipt_type: 'customer',
          order_data: customerReceipt,
          priority: 'medium',
          metadata: {
            order_mode: state.orderType,
            table_number: state.selectedTableNumber,
            created_from: 'pos_desktop_customer',
            completion_type: 'order_complete'
          }
        });
        
        const printJob = await printJobResponse.json();
        console.log('✅ [POSDesktop] Customer receipt print job created:', printJob.job_id);
        
        toast.success(`Order completed! Customer receipt sent to printer (${printJob.job_id})`, {
          description: `${state.orderType} • £${finalTotal.toFixed(2)} • ${state.orderItems.length} items`
        });
        
        // Clear the order after successful completion
        updateState({
          orderItems: [],
          selectedTableNumber: null,
          customerData: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            notes: '',
            tableNumber: '',
            guestCount: 0,
            address: '',
            street: '',
            city: '',
            postcode: '',
            deliveryNotes: ''
          }
        });
        
      } catch (printError) {
        console.error('❌ [POSDesktop] Failed to create customer receipt print job:', printError);
        toast.error('Order completed but failed to print customer receipt');
      }
      
    } catch (error) {
      console.error('❌ [POSDesktop] Order completion failed:', error);
      toast.error('Failed to complete order');
    }
  }, [state, brain, updateState]);

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
    posPerformance.startInitialization('pos_desktop', async () => {
      // Check if effect is still active (not unmounted)
      if (!isActive) {
        return;
      }
      
      try {
        // Mark startup beginning
        posPerformance.mark(POSPerfMarks.STARTUP);
        posPerformance.mark(POSPerfMarks.BUNDLE_LOAD);
        
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
        
        posPerformance.measure(POSPerfMarks.BUNDLE_LOAD, { success: bundleSuccess });
        
        if (bundleSuccess) {
          if (isDevelopment) {
            console.log('✅ [POSDesktop] Fast bundle loaded successfully');
          }
          
          // Set default category from bundle data
          const menuData = getMenuDataForPOS();
          const starterPatterns = ['Starters', 'Appetizers', 'Appetizer', 'Hot Appetizers'];
          const starterCategory = menuData.categories?.find(cat => 
            !cat.parent_category_id &&
            starterPatterns.some(pattern =>
              cat.name.toLowerCase().includes(pattern.toLowerCase())
            )
          );
          
          if (starterCategory && isActive) {
            if (isDevelopment) {
              console.log(`🎯 [POSDesktop] Setting default category to: ${starterCategory.name}`);
            }
            realtimeMenuStore.setSelectedMenuCategory(starterCategory.id);
          }
          
          // Mark first interactive
          posPerformance.mark(POSPerfMarks.FIRST_INTERACTIVE);
          
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
          
          const menuData = getMenuDataForPOS();
          const starterPatterns = ['Starters', 'Appetizers', 'Appetizer', 'Hot Appetizers'];
          const starterCategory = menuData.categories?.find(cat => 
            !cat.parent_category_id &&
            starterPatterns.some(pattern =>
              cat.name.toLowerCase().includes(pattern.toLowerCase())
            )
          );
          
          if (starterCategory && isActive) {
            if (isDevelopment) {
              console.log(`🎯 [POSDesktop] Setting default category to: ${starterCategory.name}`);
            }
            realtimeMenuStore.setSelectedMenuCategory(starterCategory.id);
          }
        }
        
        if (isActive) {
          posPerformance.measure(POSPerfMarks.STARTUP);
        }
        
        // Log performance summary only in development
        if (isDevelopment && isActive) {
          setTimeout(() => {
            if (isActive) {
              const summary = posPerformance.getSummary();
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
          posPerformance.record('startup_error', 1, { error: error.message });
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
      posPerformance.resetInitialization('pos_desktop');
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
      posPerformance.startInitialization('pos_desktop_subscriptions', async () => {
        // Check if effect is still active (not unmounted)
        if (!isActive) {
          return;
        }
        
        try {
          const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
          if (isDevelopment) {
            console.log('🚀 [POSDesktop] Starting real-time subscriptions after bundle completion...');
          }
          
          // Start real-time subscriptions for menu data
          realtimeMenuStore.startRealtimeSubscriptions();
          
          // Check if effect is still active after startup
          if (!isActive) {
            return;
          }
          
          // Mark subscriptions started
          posPerformance.mark(POSPerfMarks.FIRST_INTERACTIVE);
          
          // Log completion only in development
          if (isDevelopment && isActive) {
            console.log('✅ [POSDesktop] Real-time subscriptions started successfully');
          }
          
        } catch (error) {
          const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
          if (isDevelopment && isActive) {
            console.error('❌ [POSDesktop] Error starting subscriptions:', error);
          }
          if (isActive) {
            posPerformance.record('subscriptions_error', 1, { error: error.message });
          }
        }
      }).catch((error) => {
        const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        if (isDevelopment && isActive) {
          console.error('❌ [POSDesktop] Subscriptions guard failed:', error);
        }
      });
    }, 500); // 500ms delay to ensure bundle loading and UI rendering is complete
    
    // Cleanup function for React StrictMode and component unmounting
    return () => {
      isActive = false;
      clearTimeout(subscriptionDelay);
      
      // Reset initialization state to allow fresh start on remount
      posPerformance.resetInitialization('pos_desktop_subscriptions');
    };
  }, []);

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

  // Main View Renderer - NEW: Add view switching logic like POSII
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
      <div className="h-full grid" style={{
        gridTemplateColumns: '300px 200px 1fr 300px', // Customer Details | Categories | Menu Items | Order Summary
        gridTemplateRows: 'minmax(0, 1fr)', // Fixed height constraint - use all available height without expansion
        height: '100%', // Ensure height is constrained by parent
        maxHeight: '100%', // Prevent expansion beyond parent
        minHeight: 0, // Allow content to shrink
        gap: '1rem',
        padding: '1rem',
        background: `linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(25, 25, 25, 0.95) 50%, rgba(20, 20, 20, 0.98) 100%)`, // Enhanced gradient from MYA-788
        boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)', // Professional shadows from MYA-788
        border: '1px solid rgba(124, 93, 250, 0.15)', // Purple accent border from MYA-788
        position: 'relative',
        transition: 'all 0.3s ease',
        borderRadius: '12px', // Increased border radius for premium feel
        backdropFilter: 'blur(10px)', // Backdrop blur from MYA-788
        overflow: 'hidden'
      }}>
        {/* Zone 1 - Customer Details: Order-type-specific customer information (300px width) */}
        <div className="h-full overflow-hidden">
          <div className="h-full rounded-xl overflow-hidden shadow-xl flex flex-col" style={{
            background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.98) 0%, rgba(25, 25, 25, 0.95) 50%, rgba(20, 20, 20, 0.98) 100%)', // Enhanced gradient
            boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08)', // Improved shadow with inner border
            border: '1px solid rgba(124, 93, 250, 0.15)', // Purple accent border
            backdropFilter: 'blur(10px)' // Added backdrop filter for premium feel
          }}>
            {/* Header */}
            <div className="p-4 border-b border-gray-700/30">
              <h3 className="text-lg font-semibold mb-1" style={{
                backgroundImage: `linear-gradient(135deg, white 30%, ${designColors.brand.purple} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 10px rgba(124, 93, 250, 0.2)'
              }}>
                {state.orderType === 'DINE-IN' ? 'Table Selection' : state.orderType === 'DELIVERY' ? 'Delivery Details' : state.orderType === 'COLLECTION' ? 'Collection Details' : 'Customer Details'}
              </h3>
              <p className="text-gray-400 text-sm">
                {state.orderType === 'DINE-IN' ? 'Choose an available table for dine-in service' : `Order type: ${state.orderType}`}
              </p>
            </div>
            
            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
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
        <div className="h-full overflow-hidden">
          <CategorySidebar
            categories={categories}
            onCategorySelect={realtimeMenuStore.setSelectedMenuCategory}
            selectedCategory={selectedCategory}
            isLoading={menuLoading}
          />
        </div>
        
        {/* Zone 3 - Menu Items: Main menu item selection area (flexible 1fr) */}
        <div className="h-full">
          <POSMenuSelector
            key={state.orderType}
            onAddToOrder={handleAddToOrder}
            orderMode={state.orderType}
            onCustomizeItem={handleCustomizeItemFromMenu}
            className="h-full"
            // ✅ NEW: Enhanced bundle strategy props
            showSkeletons={initialLoad || isInitializing}
            preloadedImages={{ isImageReady, getImageStatus }}
          />
        </div>
        
        {/* Zone 4 - Order Summary: Current order details and actions (300px width) */}
        <div className="h-full">
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
      </div>
    );
  };

  // Main app structure - Fixed: Removed circular call
  return (
    <CustomizeOrchestratorProvider>
      <div 
        className="h-screen w-screen overflow-hidden flex flex-col"
        style={{ 
          background: `linear-gradient(145deg, ${designColors.background.primary} 0%, ${designColors.background.secondary} 100%)`,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Header */}
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
            onClose={() => updateState({ showCustomerModal: false })}
            onSave={handleCustomerSave}
            orderType={state.orderType as "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING"}
            orderValue={calculateOrderTotal()}
            initialData={{
              firstName: state.customerData?.firstName || '',
              lastName: state.customerData?.lastName || '',
              phone: state.customerData?.phone || '',
              email: state.customerData?.email || '',
              notes: state.customerData?.notes || '',
              address: state.customerData?.address || '',
              street: state.customerData?.street || '',
              city: state.customerData?.city || '',
              postcode: state.customerData?.postcode || '',
              deliveryNotes: state.customerData?.deliveryNotes || ''
            }}
          />
        )}
        
        {/* Professional Footer */}
        <POSFooter 
          currentOrderType={state.orderType}
          className=""
        />
      </div>
    </CustomizeOrchestratorProvider>
  );
}
