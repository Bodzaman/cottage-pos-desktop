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
 * Simplified flow: ORDER_CONFIRMATION → PAYMENT_PROCESSING → SUCCESS/FAILURE
 */
export enum PaymentFlowStep {
  ORDER_CONFIRMATION = 'order-confirmation',
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
  // Payment status for PAID badge on receipts
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';
  // WYSIWYG Captured Receipt Images for raster printing
  capturedReceiptImages?: {
    kitchen?: string;
    customer?: string;
  };
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
  // Mode is now determined internally based on user action in OrderConfirmationView
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
  totalAmount: number;
  processingPayment: boolean;
  error?: string;
  transactionId?: string;
  pspReference?: string;
}

// ============================================================================
// VIEW COMPONENT PROPS
// ============================================================================

/**
 * Captured receipt images for WYSIWYG printing
 */
export interface CapturedReceiptImages {
  kitchen?: string;
  customer?: string;
}

/**
 * Props for OrderConfirmationView
 */
export interface OrderConfirmationViewProps {
  orderItems: OrderItem[];
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  orderTotal: number;
  tableNumber?: number;
  guestCount?: number;
  customerData?: CustomerData;
  deliveryFee?: number;
  // NEW: Separate handlers for each action - now receive captured images for WYSIWYG printing
  onTakePaymentNow: (capturedImages: CapturedReceiptImages) => void;   // Proceed to Stripe payment flow
  onPayOnCollection: (capturedImages: CapturedReceiptImages) => void;  // Print receipt and complete (no payment)
  onBack: () => void;             // Close modal, return to cart
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
