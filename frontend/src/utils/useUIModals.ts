import { useState, useCallback } from 'react';

/**
 * Consolidated UI modal state management for POS
 * Reduces scattered boolean state across POSDesktop
 */
export function useUIModals() {
  // ============================================================================
  // MODAL STATE
  // ============================================================================
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [showGuestCountModal, setShowGuestCountModal] = useState(false);
  const [showDineInModal, setShowDineInModal] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showMenuManagementModal, setShowMenuManagementModal] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Additional state flags
  const [pendingOrderConfirmation, setPendingOrderConfirmation] = useState(false);

  // ============================================================================
  // MODAL ACTIONS
  // ============================================================================
  
  // Customer Modal
  const openCustomerModal = useCallback(() => setShowCustomerModal(true), []);
  const closeCustomerModal = useCallback(() => setShowCustomerModal(false), []);
  
  // Variant Selector
  const openVariantSelector = useCallback(() => setShowVariantSelector(true), []);
  const closeVariantSelector = useCallback(() => setShowVariantSelector(false), []);
  
  // Order Confirmation
  const openOrderConfirmation = useCallback(() => setShowOrderConfirmation(true), []);
  const closeOrderConfirmation = useCallback(() => setShowOrderConfirmation(false), []);
  
  // Guest Count Modal
  const openGuestCountModal = useCallback(() => setShowGuestCountModal(true), []);
  const closeGuestCountModal = useCallback(() => setShowGuestCountModal(false), []);
  
  // Dine-In Modal
  const openDineInModal = useCallback(() => setShowDineInModal(true), []);
  const closeDineInModal = useCallback(() => setShowDineInModal(false), []);
  
  // Password Dialog
  const openPasswordDialog = useCallback(() => setShowPasswordDialog(true), []);
  const closePasswordDialog = useCallback(() => setShowPasswordDialog(false), []);
  
  // Menu Management Modal
  const openMenuManagementModal = useCallback(() => setShowMenuManagementModal(true), []);
  const closeMenuManagementModal = useCallback(() => setShowMenuManagementModal(false), []);
  
  // All Orders Modal
  const openAllOrdersModal = useCallback(() => setShowAllOrdersModal(true), []);
  const closeAllOrdersModal = useCallback(() => setShowAllOrdersModal(false), []);
  
  // Payment Modal
  const openPaymentModal = useCallback(() => setShowPaymentModal(true), []);
  const closePaymentModal = useCallback(() => setShowPaymentModal(false), []);
  
  // Pending Order Confirmation
  const setPending = useCallback((value: boolean) => setPendingOrderConfirmation(value), []);
  
  // ============================================================================
  // UTILITY - Close all modals
  // ============================================================================
  const closeAllModals = useCallback(() => {
    setShowCustomerModal(false);
    setShowVariantSelector(false);
    setShowOrderConfirmation(false);
    setShowGuestCountModal(false);
    setShowDineInModal(false);
    setShowPasswordDialog(false);
    setShowMenuManagementModal(false);
    setShowAllOrdersModal(false);
    setShowPaymentModal(false);
    setPendingOrderConfirmation(false);
  }, []);

  return {
    // State
    showCustomerModal,
    showVariantSelector,
    showOrderConfirmation,
    showGuestCountModal,
    showDineInModal,
    showPasswordDialog,
    showMenuManagementModal,
    showAllOrdersModal,
    showPaymentModal,
    pendingOrderConfirmation,
    
    // Actions - Customer Modal
    openCustomerModal,
    closeCustomerModal,
    
    // Actions - Variant Selector
    openVariantSelector,
    closeVariantSelector,
    
    // Actions - Order Confirmation
    openOrderConfirmation,
    closeOrderConfirmation,
    
    // Actions - Guest Count Modal
    openGuestCountModal,
    closeGuestCountModal,
    
    // Actions - Dine-In Modal
    openDineInModal,
    closeDineInModal,
    
    // Actions - Password Dialog
    openPasswordDialog,
    closePasswordDialog,
    
    // Actions - Menu Management Modal
    openMenuManagementModal,
    closeMenuManagementModal,
    
    // Actions - All Orders Modal
    openAllOrdersModal,
    closeAllOrdersModal,
    
    // Actions - Payment Modal
    openPaymentModal,
    closePaymentModal,
    
    // Actions - Pending State
    setPending,
    
    // Utility
    closeAllModals
  };
}
