import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useCustomerDataStore } from './customerDataStore';
import type { OrderType } from './customerTypes';

/**
 * Customer data structure for POS
 */
export interface CustomerData {
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
}

/**
 * Hook: useCustomerFlow
 * 
 * RESPONSIBILITY:
 * Manages customer data collection and validation flow in POSDesktop.
 * Handles customer details modal, form validation, and data persistence
 * for COLLECTION, WAITING, and DELIVERY order types.
 * 
 * DATA FLOW:
 * 1. POSDesktop passes orderType and customerData state
 * 2. User clicks customer badge → handleCustomerDetailsClick() → opens modal
 * 3. User fills form → handleCustomerSave() → updates local + global store
 * 4. customerDataStore persists data globally for order processing
 * 5. validateCustomerData() checks if required fields are complete
 * 
 * VALIDATION RULES BY ORDER TYPE:
 * - DINE-IN: Requires selectedTableNumber + guestCount
 * - COLLECTION/WAITING: Requires firstName + lastName + phone
 * - DELIVERY: Requires firstName + lastName + phone + (address OR street+postcode)
 * 
 * SPECIAL FEATURES:
 * - Manager Override: Allows bypassing delivery area validation
 * - Order Type Switch: Converts DELIVERY → COLLECTION if delivery unavailable
 * - Dual Storage: Updates both local state (POSDesktop) and global store (customerDataStore)
 * 
 * DEPENDENCIES:
 * - customerDataStore: Global Zustand store for customer data persistence
 * - sonner: User feedback toasts
 * 
 * CONSUMED BY:
 * - POSDesktop: Main component using this hook
 * - useOrderProcessing: Reads customerData for order submission
 * - usePrintingOperations: Reads customerData for receipt printing
 * 
 * @param orderType - Current order type (DINE-IN | COLLECTION | DELIVERY | WAITING)
 * @param customerData - Local customer data state from POSDesktop
 * @param setCustomerData - State setter from POSDesktop
 * @param selectedTableNumber - Current table (for DINE-IN validation)
 * @param guestCount - Guest count (for DINE-IN validation)
 * @returns Customer flow handlers, modal state, and validation functions
 */
export function useCustomerFlow(
  orderType: OrderType,
  customerData: CustomerData,
  setCustomerData: (data: CustomerData | ((prev: CustomerData) => CustomerData)) => void,
  selectedTableNumber: number | null,
  guestCount: number
) {
  const customerDataStore = useCustomerDataStore();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [managerOverrideGranted, setManagerOverrideGranted] = useState(false);

  // ============================================================================
  // VALIDATE CUSTOMER DATA - Based on order type
  // ============================================================================
  const validateCustomerData = useCallback((orderType: string) => {
    switch (orderType) {
      case "DINE-IN":
        return selectedTableNumber !== null && guestCount > 0;
      case "COLLECTION":
      case "WAITING":
        return customerData?.firstName?.trim() !== '' && 
               customerData?.lastName?.trim() !== '' && 
               customerData?.phone?.trim() !== '';
      case "DELIVERY":
        return customerData?.firstName?.trim() !== '' && 
               customerData?.lastName?.trim() !== '' &&
               customerData?.phone?.trim() !== '' && 
               (customerData?.address?.trim() !== '' || 
                (customerData?.street?.trim() !== '' && customerData?.postcode?.trim() !== ''));
      default:
        return false;
    }
  }, [customerData, selectedTableNumber, guestCount]);

  // ============================================================================
  // SAVE CUSTOMER DETAILS
  // ============================================================================
  const handleCustomerSave = useCallback((customerData: any) => {
    setCustomerData({
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
    
    setShowCustomerModal(false);
    toast.success('Customer details saved');
  }, [customerDataStore, setCustomerData]);

  // ============================================================================
  // CLOSE CUSTOMER MODAL
  // ============================================================================
  const closeCustomerModal = useCallback(() => {
    setShowCustomerModal(false);
    // Reset any granted override after closing the flow
    setManagerOverrideGranted(false);
  }, []);

  // ============================================================================
  // OPEN CUSTOMER MODAL
  // ============================================================================
  const handleCustomerDetailsClick = useCallback(() => {
    setShowCustomerModal(true);
  }, []);

  // ============================================================================
  // CLEAR CUSTOMER DETAILS
  // ============================================================================
  const handleClearCustomerDetails = useCallback(() => {
    customerDataStore.clearCustomerData();
    setCustomerData({
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
    });
  }, [customerDataStore, setCustomerData]);

  // ============================================================================
  // UPDATE SINGLE CUSTOMER FIELD
  // ============================================================================
  const handleCustomerDataUpdate = useCallback((field: string, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setCustomerData]);

  // ============================================================================
  // HANDLE ORDER TYPE SWITCH - For delivery area validation
  // ============================================================================
  const handleOrderTypeSwitch = useCallback((newOrderType: 'COLLECTION', onOrderTypeChange?: (orderType: any) => void) => {
    if (onOrderTypeChange) {
      onOrderTypeChange(newOrderType);
    }
    setShowCustomerModal(false);
    // Reset override since we switched order type
    setManagerOverrideGranted(false);
    toast.success(`🔄 Order type switched to ${newOrderType}`);
  }, []);

  // ============================================================================
  // HANDLE MANAGER OVERRIDE - For delivery validation
  // ============================================================================
  const handleManagerOverride = useCallback((onManagerOverride?: () => void) => {
    if (onManagerOverride) {
      onManagerOverride();
    }
  }, []);

  return {
    // State
    showCustomerModal,
    managerOverrideGranted,
    
    // State setters (for external control)
    setShowCustomerModal,
    setManagerOverrideGranted,
    
    // Handlers
    handleCustomerSave,
    closeCustomerModal,
    handleCustomerDetailsClick,
    handleClearCustomerDetails,
    handleCustomerDataUpdate,
    handleOrderTypeSwitch,
    handleManagerOverride,
    
    // Validation
    validateCustomerData,
  };
}
