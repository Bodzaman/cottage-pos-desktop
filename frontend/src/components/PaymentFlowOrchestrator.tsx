/**
 * PaymentFlowOrchestrator - Single Payment Flow Modal with State Machine
 *
 * ARCHITECTURE:
 * - Single Dialog container (no nested modals)
 * - Internal state machine manages flow steps
 * - Routes to view components based on current step
 * - Smooth transitions with AnimatePresence
 * - Clean data flow: Parent → Orchestrator → Views
 *
 * FLOW (Takeaway: WAITING/COLLECTION/DELIVERY):
 * 1. ORDER_CONFIRMATION → Review order, choose action:
 *    - "Take Payment Now" → PAYMENT_PROCESSING (Stripe card)
 *    - "Pay on Collection/Delivery" → Complete immediately (no payment)
 *    - "Back to Cart" → Close modal
 * 2. PAYMENT_PROCESSING → Stripe card payment
 * 3. SUCCESS/FAILURE → Show result
 *
 * Note: DINE-IN uses DineInOrderModal, not this orchestrator
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AnimatePresence } from 'framer-motion';
import { PaymentFlowOrchestratorProps, PaymentFlowStep, PaymentMethod, CapturedReceiptImages } from '../utils/paymentFlowTypes';
import { OrderConfirmationView } from './OrderConfirmationView';
import { PaymentProcessingView } from './PaymentProcessingView';
import { PaymentResultView } from './PaymentResultView';
import { styles } from '../utils/QSAIDesign';
import { usePOSOrderStore } from '../utils/posOrderStore';

export function PaymentFlowOrchestrator({
  isOpen,
  onClose,
  orderItems: propOrderItems,
  orderTotal,
  orderType,
  tableNumber,
  guestCount,
  customerData,
  deliveryFee = 0,
  onPaymentComplete
}: PaymentFlowOrchestratorProps) {

  // 🔧 FIX: Subscribe to orderItems internally instead of receiving as prop
  // This prevents POSDesktop from re-rendering when cart changes
  const storeOrderItems = usePOSOrderStore(state => state.orderItems);
  // Use prop if provided (for backward compat), otherwise use store
  const orderItems = propOrderItems ?? storeOrderItems;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [currentStep, setCurrentStep] = useState<PaymentFlowStep>(PaymentFlowStep.ORDER_CONFIRMATION);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    amount: number;
    method: PaymentMethod;
    pspReference?: string;
    sessionId?: string;
    errorMessage?: string;
  } | null>(null);

  // Store captured receipt images for WYSIWYG printing (from OrderConfirmationView)
  const [capturedReceiptImages, setCapturedReceiptImages] = useState<CapturedReceiptImages>({});

  // Generate unique order ID for this payment session
  const orderId = `POS-${Date.now()}`;

  // Calculate total with delivery fee
  const totalAmount = orderTotal + deliveryFee;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
      setSelectedPaymentMethod(null);
      setPaymentResult(null);
      setCapturedReceiptImages({});
    }
  }, [isOpen]);

  // ============================================================================
  // NAVIGATION HELPERS
  // ============================================================================

  const goToNextStep = (fromStep: PaymentFlowStep) => {
    switch (fromStep) {
      case PaymentFlowStep.PAYMENT_PROCESSING:
        // Handled by payment success/failure callbacks
        break;

      case PaymentFlowStep.SUCCESS:
      case PaymentFlowStep.FAILURE:
        // Complete the flow
        handleFlowComplete();
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case PaymentFlowStep.PAYMENT_PROCESSING:
        // Back to order confirmation (user can choose Take Payment or Pay Later again)
        setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
        setSelectedPaymentMethod(null);
        break;

      default:
        setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // ============================================================================
  // ORDER CONFIRMATION ACTIONS (3 CTAs)
  // ============================================================================

  // "Take Payment Now" - Proceed directly to Stripe card payment
  // Note: DINE-IN uses DineInOrderModal, not this orchestrator
  const handleTakePaymentNow = (capturedImages: CapturedReceiptImages) => {
    // Store captured images for use after payment completes
    setCapturedReceiptImages(capturedImages);
    setSelectedPaymentMethod('STRIPE');
    setCurrentStep(PaymentFlowStep.PAYMENT_PROCESSING);
  };

  // "Pay on Collection/Delivery/at Counter" - Complete without payment, print receipts
  const handlePayOnCollection = (capturedImages: CapturedReceiptImages) => {
    // Complete flow immediately with no payment taken
    // Include captured images for WYSIWYG printing
    // Receipts will be printed WITHOUT PAID badge
    onPaymentComplete({
      success: true,
      orderItems,
      orderTotal: totalAmount,
      tipAmount: 0,
      paymentMethod: 'CASH', // Default to CASH for pay-later
      paymentStatus: undefined, // No PAID badge
      orderId,
      capturedReceiptImages: capturedImages
    });
    onClose();
  };

  // "Back to Cart" - Close modal, return to cart
  const handleBack = () => {
    onClose();
  };

  // Payment Processing
  const handlePaymentSuccess = (data: {
    method: PaymentMethod;
    amount: number;
    pspReference?: string;
    sessionId?: string;
  }) => {
    setPaymentResult({
      success: true,
      ...data
    });
    setCurrentStep(PaymentFlowStep.SUCCESS);
  };

  const handlePaymentFailed = (errorMessage: string) => {
    setPaymentResult({
      success: false,
      amount: totalAmount,
      method: selectedPaymentMethod || 'STRIPE',
      errorMessage
    });
    setCurrentStep(PaymentFlowStep.FAILURE);
  };

  // Payment Result Actions
  const handleRetryPayment = () => {
    setPaymentResult(null);
    setSelectedPaymentMethod(null);
    setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
  };

  const handleFlowComplete = () => {
    if (paymentResult?.success) {
      // Call parent callback with successful payment data
      // Include paymentStatus: 'PAID' for PAID badge on receipts
      // Include captured images for WYSIWYG printing
      onPaymentComplete({
        success: true,
        orderItems,
        orderTotal: totalAmount,
        tipAmount: 0,
        paymentMethod: paymentResult.method,
        paymentStatus: 'PAID', // Payment was successful - show PAID badge
        pspReference: paymentResult.pspReference,
        sessionId: paymentResult.sessionId,
        orderId,
        capturedReceiptImages
      });
    }
    onClose();
  };

  // Get customer name for payment processing
  const getCustomerName = () => {
    if (customerData?.firstName || customerData?.lastName) {
      return `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
    }
    return undefined;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-2xl max-h-[90dvh] overflow-y-auto border-gray-700 text-white p-8"
        style={{
          background: '#1E1E1E',
          ...styles.frostedGlassStyle
        }}
      >
        {/* Single container with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          {/* STEP 1: ORDER CONFIRMATION - Shows CTAs: Take Payment Now, Pay Later, Back */}
          {currentStep === PaymentFlowStep.ORDER_CONFIRMATION && (
            <OrderConfirmationView
              key="order-confirmation"
              orderItems={orderItems}
              orderType={orderType}
              orderTotal={orderTotal}
              tableNumber={tableNumber}
              guestCount={guestCount}
              customerData={customerData}
              deliveryFee={deliveryFee}
              onTakePaymentNow={handleTakePaymentNow}
              onPayOnCollection={handlePayOnCollection}
              onBack={handleBack}
            />
          )}

          {/* STEP 2: PAYMENT PROCESSING - Stripe card payment */}
          {currentStep === PaymentFlowStep.PAYMENT_PROCESSING && selectedPaymentMethod && (
            <PaymentProcessingView
              key="payment-processing"
              paymentMethod={selectedPaymentMethod}
              totalAmount={totalAmount}
              orderId={orderId}
              orderType={orderType}
              customerName={getCustomerName()}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailed={handlePaymentFailed}
              onBack={goToPreviousStep}
            />
          )}

          {/* STEP 3: SUCCESS */}
          {currentStep === PaymentFlowStep.SUCCESS && paymentResult && (
            <PaymentResultView
              key="payment-success"
              success={true}
              amount={paymentResult.amount}
              paymentMethod={paymentResult.method}
              pspReference={paymentResult.pspReference}
              onComplete={handleFlowComplete}
              onRetry={handleRetryPayment}
            />
          )}

          {/* STEP 4: FAILURE */}
          {currentStep === PaymentFlowStep.FAILURE && paymentResult && (
            <PaymentResultView
              key="payment-failure"
              success={false}
              amount={paymentResult.amount}
              paymentMethod={paymentResult.method}
              errorMessage={paymentResult.errorMessage}
              onComplete={handleFlowComplete}
              onRetry={handleRetryPayment}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
