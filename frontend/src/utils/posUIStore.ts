/**
 * posUIStore.ts
 * 
 * Focused Zustand store for POS UI state management
 * Separates UI/modal state from order and customer data
 * 
 * Key Benefits:
 * - Components subscribe only to UI changes they care about
 * - No re-renders when order or customer data changes
 * - Centralized modal management
 */

import { create } from 'zustand';

// ============================================================================
// UI STORE TYPES
// ============================================================================

export type POSViewMode = 'DINE_IN' | 'TAKE_AWAY' | 'ONLINE' | 'RESERVATIONS';

export interface UIStore {
  // View Management
  activeView: string;
  previousView: string;
  posViewMode: POSViewMode;
  
  // Modal State
  showCustomerModal: boolean;
  showVariantSelector: boolean;
  showGuestCountModal: boolean;
  showDineInModal: boolean;
  showPaymentFlow: boolean;
  showSessionRestoreDialog: boolean;
  
  // Pending Actions
  pendingOrderConfirmation: boolean;
  
  // Printer Queue State
  queuedJobsCount: number;
  
  // UI Actions
  setActiveView: (view: string) => void;
  setPreviousView: (view: string) => void;
  setPosViewMode: (mode: POSViewMode) => void;
  
  // Modal Actions
  openModal: (modalName: keyof Omit<UIStore, 'activeView' | 'previousView' | 'posViewMode' | 'pendingOrderConfirmation' | 'queuedJobsCount' | 'setActiveView' | 'setPreviousView' | 'setPosViewMode' | 'openModal' | 'closeModal' | 'setModal' | 'closeAllModals' | 'setPendingOrderConfirmation' | 'setQueuedJobsCount'>) => void;
  closeModal: (modalName: keyof Omit<UIStore, 'activeView' | 'previousView' | 'posViewMode' | 'pendingOrderConfirmation' | 'queuedJobsCount' | 'setActiveView' | 'setPreviousView' | 'setPosViewMode' | 'openModal' | 'closeModal' | 'setModal' | 'closeAllModals' | 'setPendingOrderConfirmation' | 'setQueuedJobsCount'>) => void;
  setModal: (modalName: keyof Omit<UIStore, 'activeView' | 'previousView' | 'posViewMode' | 'pendingOrderConfirmation' | 'queuedJobsCount' | 'setActiveView' | 'setPreviousView' | 'setPosViewMode' | 'openModal' | 'closeModal' | 'setModal' | 'closeAllModals' | 'setPendingOrderConfirmation' | 'setQueuedJobsCount'>, value: boolean) => void;
  closeAllModals: () => void;
  
  // Pending Actions
  setPendingOrderConfirmation: (pending: boolean) => void;
  
  // Printer Queue Actions
  setQueuedJobsCount: (count: number) => void;
}

// ============================================================================
// UI STORE IMPLEMENTATION
// ============================================================================

export const usePOSUIStore = create<UIStore>((set) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================
  
  // View Management
  activeView: 'pos',
  previousView: 'pos',
  posViewMode: 'DINE_IN',
  
  // Modal State
  showCustomerModal: false,
  showVariantSelector: false,
  showGuestCountModal: false,
  showDineInModal: false,
  showPaymentFlow: false,
  showSessionRestoreDialog: false,
  
  // Pending Actions
  pendingOrderConfirmation: false,
  
  // Printer Queue State
  queuedJobsCount: 0,
  
  // ============================================================================
  // VIEW ACTIONS
  // ============================================================================
  
  setActiveView: (view) => {
    set(state => ({
      previousView: state.activeView,
      activeView: view
    }));
  },
  
  setPreviousView: (view) => {
    set({ previousView: view });
  },

  setPosViewMode: (mode) => {
    set({ posViewMode: mode });
  },
  
  // ============================================================================
  // MODAL ACTIONS
  // ============================================================================
  
  openModal: (modalName) => {
    set({ [modalName]: true });
  },
  
  closeModal: (modalName) => {
    set({ [modalName]: false });
  },
  
  setModal: (modalName, value) => {
    set({ [modalName]: value });
  },
  
  closeAllModals: () => {
    set({
      showCustomerModal: false,
      showVariantSelector: false,
      showGuestCountModal: false,
      showDineInModal: false,
      showPaymentFlow: false,
      showSessionRestoreDialog: false
    });
  },
  
  // ============================================================================
  // PENDING ACTIONS
  // ============================================================================
  
  setPendingOrderConfirmation: (pending) => {
    set({ pendingOrderConfirmation: pending });
  },
  
  // Printer Queue Actions
  setQueuedJobsCount: (count) => {
    set({ queuedJobsCount: count });
  }
}));
