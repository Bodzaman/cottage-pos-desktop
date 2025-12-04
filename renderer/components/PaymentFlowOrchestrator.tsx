/**
 * PaymentFlowOrchestrator - Single Payment Flow Modal with State Machine
 * 
 * ARCHITECTURE:
 * - Single Dialog container (no nested modals)
 * - Internal state machine manages flow steps
 * - Routes to view components based on current step
 * - Smooth transitions with AnimatePresence
 * - Clean data flow: Parent → Orchestrator → Views
 * - Supports two modes:
 *   - "payment": Full payment flow (confirmation → tip → payment method → processing → result)
 *   - "pay-later": Confirmation only (confirmation → print directly)
 * 
 * REPLACES:
 * - OrderConfirmationModal (now OrderConfirmationView)
 * - CardTerminalModal (now PaymentProcessingView)
 * - Nested payment modals (unified into this orchestrator)
 * 
 * FLOW STEPS:
 * 1. ORDER_CONFIRMATION → Review order details
 * 2. TIP_SELECTION → Add tip (DINE-IN only, skipped for others)
 * 3. PAYMENT_METHOD → Choose CASH or ADYEN
 * 4. PAYMENT_PROCESSING → Process payment (Adyen Drop-in or Cash)
 * 5. SUCCESS/FAILURE → Show result
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AnimatePresence } from 'framer-motion';
import { PaymentFlowOrchestratorProps, PaymentFlowStep, PaymentMethod } from '../utils/paymentFlowTypes';
import { OrderConfirmationView } from './OrderConfirmationView';
import { TipSelectionView } from './TipSelectionView';
import { PaymentMethodView } from './PaymentMethodView';
import { PaymentProcessingView } from './PaymentProcessingView';
import { PaymentResultView } from './PaymentResultView';
import { styles } from '../utils/QSAIDesign';

export function PaymentFlowOrchestrator({
  isOpen,
  onClose,
  mode,
  orderItems,
  orderTotal,
  orderType,
  tableNumber,
  guestCount,
  customerData,
  deliveryFee = 0,
  onPaymentComplete
}: PaymentFlowOrchestratorProps) {
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [currentStep, setCurrentStep] = useState<PaymentFlowStep>(PaymentFlowStep.ORDER_CONFIRMATION);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    amount: number;
    method: PaymentMethod;
    pspReference?: string;
    sessionId?: string;
    errorMessage?: string;
  } | null>(null);

  // Generate unique order ID for this payment session
  const orderId = `POS-${Date.now()}`;

  // Calculate total with tip and delivery
  const totalWithTip = orderTotal + tipAmount + deliveryFee;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
      setTipAmount(0);
      setSelectedPaymentMethod(null);
      setPaymentResult(null);
    }
  }, [isOpen]);

  // ============================================================================
  // NAVIGATION HELPERS
  // ============================================================================

  const goToNextStep = (fromStep: PaymentFlowStep) => {
    switch (fromStep) {
      case PaymentFlowStep.ORDER_CONFIRMATION:
        // DINE-IN goes to tip selection, others skip to payment method
        if (orderType === 'DINE-IN') {
          setCurrentStep(PaymentFlowStep.TIP_SELECTION);
        } else {
          setCurrentStep(PaymentFlowStep.PAYMENT_METHOD);
        }
        break;
      
      case PaymentFlowStep.TIP_SELECTION:
        setCurrentStep(PaymentFlowStep.PAYMENT_METHOD);
        break;
      
      case PaymentFlowStep.PAYMENT_METHOD:
        setCurrentStep(PaymentFlowStep.PAYMENT_PROCESSING);
        break;
      
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
      case PaymentFlowStep.TIP_SELECTION:
        setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
        break;
      
      case PaymentFlowStep.PAYMENT_METHOD:
        // Go back to tip selection if DINE-IN, otherwise to order confirmation
        if (orderType === 'DINE-IN') {
          setCurrentStep(PaymentFlowStep.TIP_SELECTION);
        } else {
          setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
        }
        break;
      
      case PaymentFlowStep.PAYMENT_PROCESSING:
        setCurrentStep(PaymentFlowStep.PAYMENT_METHOD);
        setSelectedPaymentMethod(null);
        break;
      
      default:
        setCurrentStep(PaymentFlowStep.ORDER_CONFIRMATION);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Order Confirmation Actions
  const handleContinueToPayment = () => {
    // If pay-later mode, skip payment flow and complete immediately
    if (mode === 'pay-later') {
      // Return result without payment data, triggering print directly
      onPaymentComplete({
        success: true,
        orderItems,
        orderTotal: totalWithTip,
        tipAmount: 0, // No tips for pay-later
        paymentMethod: 'CASH', // Default to CASH for pay-later
        orderId
      });
      onClose();
      return;
    }
    
    // Normal payment flow
    goToNextStep(PaymentFlowStep.ORDER_CONFIRMATION);
  };

  const handleAddToOrder = () => {
    // TODO: Implement add to order functionality
    console.log('Add to order - not implemented yet');
    onClose();
  };

  const handleSendToKitchen = () => {
    // TODO: Implement send to kitchen functionality
    console.log('Send to kitchen - not implemented yet');
    onClose();
  };

  const handleMakeChanges = () => {
    // Close modal and return to cart for edits
    onClose();
  };

  // Tip Selection
  const handleTipSelected = (amount: number) => {
    setTipAmount(amount);
  };

  const handleContinueFromTip = () => {
    goToNextStep(PaymentFlowStep.TIP_SELECTION);
  };

  // Payment Method Selection
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    goToNextStep(PaymentFlowStep.PAYMENT_METHOD);
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
      amount: totalWithTip,
      method: selectedPaymentMethod || 'ADYEN',
      errorMessage
    });
    setCurrentStep(PaymentFlowStep.FAILURE);
  };

  // Payment Result Actions
  const handleRetryPayment = () => {
    setPaymentResult(null);
    setSelectedPaymentMethod(null);
    setCurrentStep(PaymentFlowStep.PAYMENT_METHOD);
  };

  const handleFlowComplete = () => {
    if (paymentResult?.success) {
      // Call parent callback with successful payment data
      onPaymentComplete({
        success: true,
        orderItems,
        orderTotal: totalWithTip,
        tipAmount,
        paymentMethod: paymentResult.method,
        pspReference: paymentResult.pspReference,
        sessionId: paymentResult.sessionId,
        orderId
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
        className="max-w-2xl max-h-[90vh] overflow-y-auto border-gray-700 text-white p-8"
        style={{
          background: '#1E1E1E',
          ...styles.frostedGlassStyle
        }}
      >
        {/* Single container with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          {/* STEP 1: ORDER CONFIRMATION */}
          {currentStep === PaymentFlowStep.ORDER_CONFIRMATION && (
            <OrderConfirmationView
              key="order-confirmation"
              mode={mode}
              orderItems={orderItems}
              orderType={orderType}
              orderTotal={orderTotal}
              tableNumber={tableNumber}
              guestCount={guestCount}
              customerData={customerData}
              deliveryFee={deliveryFee}
              onContinueToPayment={handleContinueToPayment}
              onAddToOrder={handleAddToOrder}
              onMakeChanges={handleMakeChanges}
              onBack={onClose}
            />
          )}

          {/* STEP 2: TIP SELECTION (DINE-IN only) */}
          {currentStep === PaymentFlowStep.TIP_SELECTION && (
            <TipSelectionView
              key="tip-selection"
              orderTotal={orderTotal + deliveryFee}
              currentTipAmount={tipAmount}
              onTipSelected={handleTipSelected}
              onContinue={handleContinueFromTip}
              onBack={goToPreviousStep}
            />
          )}

          {/* STEP 3: PAYMENT METHOD SELECTION */}
          {currentStep === PaymentFlowStep.PAYMENT_METHOD && (
            <PaymentMethodView
              key="payment-method"
              orderTotal={orderTotal}
              tipAmount={tipAmount}
              totalWithTip={totalWithTip}
              onSelectPaymentMethod={handleSelectPaymentMethod}
              onBack={goToPreviousStep}
              availableMethods={['CASH', 'STRIPE']}
            />
          )}

          {/* STEP 4: PAYMENT PROCESSING */}
          {currentStep === PaymentFlowStep.PAYMENT_PROCESSING && selectedPaymentMethod && (
            <PaymentProcessingView
              key="payment-processing"
              paymentMethod={selectedPaymentMethod}
              totalAmount={totalWithTip}
              orderId={orderId}
              orderType={orderType}
              customerName={getCustomerName()}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailed={handlePaymentFailed}
              onBack={goToPreviousStep}
            />
          )}

          {/* STEP 5: SUCCESS */}
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

          {/* STEP 6: FAILURE */}
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
