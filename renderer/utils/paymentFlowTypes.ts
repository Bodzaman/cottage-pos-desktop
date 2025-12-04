/**
 * Type definitions for the unified Payment Flow Orchestrator
 * Replaces the multi-modal architecture with a single state machine
 */

import { OrderItem } from './menuTypes';

/**
 * Payment flow mode - determines the flow behavior
 */
export type PaymentFlowMode = 'payment' | 'pay-later';

/**
 * Payment flow steps - internal state machine for the orchestrator
 */
export enum PaymentFlowStep {
  ORDER_CONFIRMATION = 'order-confirmation',
  TIP_SELECTION = 'tip-selection',
  PAYMENT_METHOD = 'payment-method',
  PAYMENT_PROCESSING = 'payment-processing',
  SUCCESS = 'success',
  FAILURE = 'failure'
}

/**
 * Payment method types supported in the orchestrator
 */
export type PaymentMethod = 'CASH' | 'STRIPE';

/**
 * Customer data for payment processing
 */
export interface CustomerData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  street?: string;
  postcode?: string;
  deliveryInstructions?: string;
}

/**
 * Payment flow result returned to parent on completion
 */
export interface PaymentFlowResult {
  success: boolean;
  paymentMethod: PaymentMethod;
  // Identifiers
  transactionId?: string;
  pspReference?: string; // Adyen PSP reference
  sessionId?: string;    // Adyen Session ID
  orderId?: string;      // POS-side order/session identifier
  // Amounts
  totalAmount?: number;  // Kept for compatibility
  orderTotal?: number;   // Preferred in POSDesktop
  tipAmount?: number;
  // Context
  orderItems?: OrderItem[];
  receiptData?: ReceiptData;
  error?: string;
  errorMessage?: string;
  orderNumber?: string;
}

/**
 * Receipt data for printing
 */
export interface ReceiptData {
  orderNumber: string;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  orderItems: OrderItem[];
  subtotal: number;
  tipAmount?: number;
  deliveryFee?: number;
  total: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  timestamp: string;
  tableNumber?: number;
  guestCount?: number;
  customerData?: CustomerData;
}

/**
 * Props for PaymentFlowOrchestrator component
 */
export interface PaymentFlowOrchestratorProps {
  isOpen: boolean;
  onClose: () => void;
  mode: PaymentFlowMode; // NEW: determines if payment flow or pay-later flow
  orderItems: OrderItem[];
  orderTotal: number;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  tableNumber?: number;
  guestCount?: number;
  customerData?: CustomerData;
  deliveryFee?: number;
  onPaymentComplete: (result: PaymentFlowResult) => void;
}

/**
 * Internal orchestrator state
 */
export interface PaymentFlowState {
  currentStep: PaymentFlowStep;
  selectedPaymentMethod?: PaymentMethod;
  tipAmount: number;
  totalWithTip: number;
  processingPayment: boolean;
  error?: string;
  transactionId?: string;
  pspReference?: string;
}

// ============================================================================
// VIEW COMPONENT PROPS
// ============================================================================

/**
 * Props for OrderConfirmationView
 */
export interface OrderConfirmationViewProps {
  mode: PaymentFlowMode; // NEW: determines CTA text and behavior
  orderItems: OrderItem[];
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  orderTotal: number;
  tableNumber?: number;
  guestCount?: number;
  customerData?: CustomerData;
  deliveryFee?: number;
  onContinueToPayment: () => void;
  onAddToOrder: () => void;
  onMakeChanges: () => void;
  onBack?: () => void;
}

/**
 * Props for TipSelectionView
 */
export interface TipSelectionViewProps {
  orderTotal: number;
  currentTipAmount: number;
  onTipSelected: (tipAmount: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Props for PaymentMethodView
 */
export interface PaymentMethodViewProps {
  orderTotal: number;
  tipAmount: number;
  totalWithTip: number;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onBack: () => void;
  availableMethods?: PaymentMethod[]; // Optional: restrict available methods
}

/**
 * Props for PaymentProcessingView
 * Aligned with implementation in components/PaymentProcessingView.tsx
 */
export interface PaymentProcessingViewProps {
  paymentMethod: PaymentMethod;
  totalAmount: number;
  orderId: string;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  customerName?: string;
  onPaymentSuccess: (data: { method: PaymentMethod; amount: number; pspReference?: string; sessionId?: string }) => void;
  onPaymentFailed: (errorMessage: string) => void;
  onBack: () => void;
}

/**
 * Props for PaymentResultView
 * Aligned with implementation in components/PaymentResultView.tsx
 */
export interface PaymentResultViewProps {
  success: boolean;
  paymentMethod: PaymentMethod;
  amount: number;
  pspReference?: string;
  errorMessage?: string;
  onComplete: () => void;
  onRetry?: () => void;
  onSwitchPaymentMethod?: () => void;
}
