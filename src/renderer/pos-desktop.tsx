// Cottage Tandoori POS Desktop - Electron Version
// Synced from Databutton workspace: 2025-09-21

import React from 'react';
import ReactDOM from 'react-dom/client';

// Mock brain API for Electron
const brain = {
  create_pos_order: async (order) => ({ json: async () => ({ success: true }) }),
  print_kitchen_and_customer: async (receipt) => ({ json: async () => ({ success: true }) }),
  create_print_job: async (job) => ({ json: async () => ({ success: true, job_id: 'electron-job' }) }),
  print_customer_receipt: async (receipt) => ({ json: async () => ({ success: true }) })
};

// Mock toast for Electron
const toast = {
  success: (msg, opts) => console.log('✅ SUCCESS:', msg, opts),
  error: (msg, opts) => console.log('❌ ERROR:', msg, opts),
  info: (msg, opts) => console.log('ℹ️ INFO:', msg, opts),
  warning: (msg, opts) => console.log('⚠️ WARNING:', msg, opts)
};



// React imports
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
// import { toast } from 'sonner';

// Databutton imports
// import brain from 'brain';

// Store imports
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useRealtimeMenuStore, getMenuDataForPOS } from 'utils/realtimeMenuStore';
import { useCustomerDataStore } from 'utils/customerDataStore';
import { useVoiceOrderStore } from 'utils/voiceOrderStore';
import { useTableOrdersStore } from 'utils/tableOrdersStore';
import { useHeaderViewChange } from 'utils/headerViewChange';

// Utility imports
import { colors as designColors } from '../utils/designSystem';
import { quickLog, createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';

// Component imports
import ManagementHeader from '../components/ManagementHeader';
import { POSNavigation } from '../components/POSNavigation';
import { DineInTableSelector } from '../components/DineInTableSelector';
import { CategorySidebar } from '../components/CategorySidebar';
import { POSMenuSelector } from '../components/POSMenuSelector';
import { OrderSummaryPanel } from '../components/OrderSummaryPanel';
import { CustomerSummaryBadge } from '../components/CustomerSummaryBadge';
import { CustomerDetailsModal } from 'components/CustomerDetailsModal';
import { POSGuestCountModalClean } from 'components/POSGuestCountModalClean';
import { DineInOrderModal } from 'components/DineInOrderModal';
import ManagementPasswordDialog from '../components/ManagementPasswordDialog';
import MenuManagementDialog from '../components/MenuManagementDialog';
import AllOrdersModal from '../components/AllOrdersModal';
import { CustomizeOrchestrator, CustomizeOrchestratorProvider } from '../components/CustomizeOrchestrator';

// View Components - Import from POSII for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import { AIOrdersPanel } from 'components/AIOrdersPanel';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { MenuCategory, MenuItem, OrderItem, ModifierSelection } from '../utils/menuTypes';
import { CustomerData } from '../utils/customerDataStore';
import { printingService } from '../utils/printingService';
import { checkHelperAppStatus, printBothViaHelperApp } from '../utils/helperAppDetection';

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
  showDineInModal: boolean; // Add missing state
  selectedTableNumber: number | null;
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
    selectedTableNumber: null,
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
          updateState({ pendingOrderConfirmation: false });
          // Note: Order confirmation modal would be handled here if needed
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
      const newItems = [...prev.orderItems, orderItem];
      toast.success(`Added ${orderItem.name} to order`);
      return { ...prev, orderItems: newItems };
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

    // Calculate total
    const calculatedTotal = state.orderItems.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const modifiersTotal = (item.customizations || []).reduce((modSum, cust) => 
        modSum + ((cust.price || 0) * item.quantity), 0);
      return sum + itemTotal + modifiersTotal;
    }, 0);

    try {
      console.log(`📋 [POSDesktop] Processing ${state.orderType} order - Total: £${calculatedTotal.toFixed(2)}`);
      
      const orderItems = state.orderItems.map(item => ({
        item_id: item.menu_item_id || item.id || `item_${Date.now()}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant_name: item.variantName,
        modifiers: item.customizations?.map(cust => ({
          name: cust.name,
          price: cust.price || 0
        })) || [],
        notes: item.notes
      }));

      const orderId = `${state.orderType}-${Date.now()}`;
      const now = new Date();
      
      const orderModel = {
        order_id: orderId,
        order_type: state.orderType,
        order_source: "POS-DESKTOP",
        customer_name: state.customerData?.firstName && state.customerData?.lastName 
          ? `${state.customerData.firstName} ${state.customerData.lastName}` 
          : state.customerData?.firstName || state.customerData?.lastName || "Walk-in Customer",
        customer_phone: state.customerData?.phone || null,
        table_number: state.orderType === 'DINE-IN' ? state.selectedTableNumber : null,
        guest_count: state.orderType === 'DINE-IN' ? state.guestCount : null,
        created_at: now,
        completed_at: now,
        items: orderItems,
        subtotal: calculatedTotal,
        total: calculatedTotal,
        status: "COMPLETED"
      };

      const storeResponse = await brain.create_pos_order(orderModel);
      const storeResult = await storeResponse.json();
      
      if (!storeResult.success) {
        toast.error('Failed to save order', {
          description: storeResult.message || 'Unable to store order in database'
        });
        return;
      }
      
      setState(prev => ({
        ...prev,
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
        guestCount: 1
      }));

      toast.success(`Order completed successfully!`, {
        description: `Order ${orderId} • Total: £${calculatedTotal.toFixed(2)}`
      });

    } catch (error) {
      console.error(`❌ [POSDesktop] Failed to process order:`, error);
      toast.error('Failed to process order');
    }
  }, [state]);

  // ============================================================================
  // THERMAL PRINTING HANDLERS WITH OFFLINE QUEUING
  // ============================================================================

  const handleSendToKitchen = async () => {
    if (!currentOrder || currentOrder.length === 0) {
      toast.error('No items to send to kitchen');
      return;
    }

    console.log('🔥 [POSDesktop] Starting kitchen printing process...');
    
    try {
      // ========================================================================
      // PREPARE KITCHEN TICKET DATA 
      // ========================================================================
      
      const kitchenReceipt = {
        orderNumber: `T${state.currentTableNumber}`,
        orderType: state.currentOrderMode,
        items: currentOrder.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes || '',
          modifiers: item.modifiers?.map(mod => mod.name) || []
        })),
        table: `${state.currentTableNumber}`,
        specialInstructions: '',
        customerName: state.currentCustomer?.name || 'Walk-in Customer',
        timestamp: new Date().toISOString()
      };

      // ========================================================================
      // DIRECT HELPER APP PRINTING - Frontend-to-Local Architecture  
      // ========================================================================
      
      console.log('🖨️ [POSDesktop] Starting print process with helper app detection...');
      
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
              table_number: state.currentTableNumber,
              order_mode: state.currentOrderMode,
              created_from: 'pos_desktop',
              retry_count: 0
            }
          };
          
          const queueResponse = await brain.create_print_job(printJobRequest);
          const queueResult = await queueResponse.json();
          
          if (queueResult.success) {
            // Mark items as queued for kitchen
            const updatedOrder = currentOrder.map(item => ({
              ...item,
              sentToKitchen: true,
              kitchenQueued: true,
              kitchenQueuedAt: new Date(),
              queueJobId: queueResult.job_id
            }));
            
            updateOrderData(state.currentTableNumber, updatedOrder);
            
            updateState({
              kitchenQueued: true,
              lastKitchenQueuedAt: new Date(),
              queuedJobsCount: (state.queuedJobsCount || 0) + 1
            });

            toast.warning(`Kitchen ticket queued for offline printing - Table ${state.currentTableNumber}`, {
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
        const updatedOrder = currentOrder.map(item => ({
          ...item,
          sentToKitchen: true,
          kitchenPrintedAt: new Date()
        }));
        
        updateOrderData(state.currentTableNumber, updatedOrder);
        
        updateState({
          kitchenPrinted: true,
          lastKitchenPrintedAt: new Date()
        });

        toast.success(`Kitchen ticket printed successfully - Table ${state.currentTableNumber}`, {
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
    if (!currentOrder || currentOrder.length === 0) {
      toast.error('No items to print bill for');
      return;
    }

    console.log('🧾 [POSDesktop] Starting bill printing process...');
    
    try {
      // ========================================================================
      // CALCULATE ORDER TOTALS
      // ========================================================================
      
      const subtotal = currentOrder.reduce((sum, item) => {
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
        orderNumber: `T${state.currentTableNumber}`,
        orderMode: state.currentOrderMode,
        tableNumber: state.currentTableNumber,
        items: currentOrder.map(item => ({
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
              table_number: state.currentTableNumber,
              order_mode: state.currentOrderMode,
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
    toast.success('Order completed');
  }, []);

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

  // ============================================================================
  // INITIALIZATION & EFFECTS
  // ============================================================================
  useEffect(() => {
    const initializeMenuStore = async () => {
      try {
        await realtimeMenuStore.initialize();
        
        const menuData = getMenuDataForPOS();
        const starterPatterns = ['Starters', 'Appetizers', 'Appetizer', 'Hot Appetizers'];
        const starterCategory = menuData.categories?.find(cat => 
          !cat.parent_category_id && 
          starterPatterns.some(pattern => 
            cat.name.toLowerCase().includes(pattern.toLowerCase()) ||
            pattern.toLowerCase().includes(cat.name.toLowerCase())
          )
        );
        
        if (starterCategory) {
          realtimeMenuStore.setSelectedMenuCategory(starterCategory.id);
        }
        
      } catch (error) {
        console.error('POSDesktop: Failed to initialize menu store:', error);
        toast.error('Failed to load menu data');
      }
    };
    
    initializeMenuStore();
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
      </div>
    </CustomizeOrchestratorProvider>
  );
}


// Electron App Root
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<POSDesktop />);
