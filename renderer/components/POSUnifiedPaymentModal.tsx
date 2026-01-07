import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Banknote,
  ArrowLeft,
  CheckCircle,
  Loader2,
  DollarSign,
  Receipt,
  AlertCircle,
  RefreshCw,
  X,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalColors as QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import POSTipSelector, { TipSelection } from './POSTipSelector';
import { PaymentResult } from '../utils/menuTypes';
import { toast } from 'sonner';
import { safeCurrency, safeTotalWithTip } from '../utils/numberUtils';
import { Card, CardContent } from '@/components/ui/card';
import CardTerminalModal from './CardTerminalModal';
import { apiClient } from 'app';

// Payment Flow State Machine
enum PaymentStep {
  TIP_SELECTION = 'tip-selection',
  PAYMENT_METHOD = 'payment-method', 
  CARD_INPUT = 'card-input',
  ADYEN_TERMINAL = 'adyen-terminal',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

interface POSUnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  orderTotal: number;
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  tableNumber?: number;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerStreet?: string;
  customerPostcode?: string;
  guestCount?: number;
  onPaymentComplete: (tipSelection: TipSelection, paymentResult?: PaymentResult) => void;
}

/**
 * Unified Payment Modal - Single Modal with State Machine
 * Replaces the complex multi-modal architecture with clean transitions
 */
export function POSUnifiedPaymentModal({
  isOpen,
  onClose,
  orderItems,
  orderTotal,
  orderType,
  tableNumber,
  customerFirstName,
  customerLastName,
  customerPhone,
  customerAddress,
  customerStreet,
  customerPostcode,
  guestCount,
  onPaymentComplete
}: POSUnifiedPaymentModalProps) {
  // State Machine
  const [currentStep, setCurrentStep] = useState<PaymentStep>(PaymentStep.TIP_SELECTION);
  const [selectedTip, setSelectedTip] = useState<TipSelection>({ type: 'none', amount: 0 });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'CARD' | null>(null);
  const [cashAmountReceived, setCashAmountReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [failedPaymentError, setFailedPaymentError] = useState<string>('');
  const [showAdyenTerminal, setShowAdyenTerminal] = useState(false);
  
  // Calculated values
  const totalWithTip = safeTotalWithTip(orderTotal, selectedTip.amount);
  const customerName = [customerFirstName, customerLastName].filter(Boolean).join(' ');
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Conditionally set initial step based on order type
      // Skip tip selection for takeaway orders (WAITING, COLLECTION, DELIVERY)
      // Only show tip selection for DINE-IN orders where table service is provided
      const initialStep = orderType === 'DINE-IN' 
        ? PaymentStep.TIP_SELECTION 
        : PaymentStep.PAYMENT_METHOD;
      
      setCurrentStep(initialStep);
      setSelectedTip({ type: 'none', amount: 0 });
      setSelectedPaymentMethod(null);
      setCashAmountReceived(0);
      setIsProcessing(false);
      setShowAdyenTerminal(false);
    }
  }, [isOpen, orderType]);

  // Early return if modal is not open - prevents unnecessary processing and error logging
  if (!isOpen) {
    return null;
  }

  // Ensure orderTotal is valid (only validate when modal is actually open)
  if (!orderTotal || orderTotal <= 0) {
    console.error('❌ POSUnifiedPaymentModal: Invalid orderTotal received:', orderTotal);
    // Return early with error state when orderTotal is invalid
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-red-500">Payment Error</DialogTitle>
            <DialogDescription className="text-gray-400">
              Unable to process payment due to an invalid order total
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p>Unable to process payment: Invalid order total (£{orderTotal || 0})</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Validation helper function for minimum order value
  const validateMinimumOrderValue = async () => {
    // Only validate for DELIVERY orders
    if (orderType !== 'DELIVERY') {
      return { valid: true, error: null };
    }
    
    try {
      // Get POS settings for minimum order value
      const response = await apiClient.get_pos_settings();
      const data = await response.json();
      
      if (data.success && data.settings?.delivery) {
        const minimumOrderValue = data.settings.delivery.minimum_order_value;
        
        if (minimumOrderValue && totalWithTip < minimumOrderValue) {
          return {
            valid: false,
            error: `Minimum order value for delivery is £${minimumOrderValue.toFixed(2)}. Current total: £${totalWithTip.toFixed(2)}`
          };
        }
      }
      
      return { valid: true, error: null };
    } catch (error) {
      console.error('Error validating minimum order value:', error);
      // Allow payment to proceed if validation fails
      return { valid: true, error: null };
    }
  };
  
  // State Machine Transitions
  const goToPaymentMethod = () => {
    setCurrentStep(PaymentStep.PAYMENT_METHOD);
  };
  
  const goToCardInput = async () => {
    // Validate minimum order value before proceeding
    const validation = await validateMinimumOrderValue();
    if (!validation.valid) {
      toast.error('Payment cannot be processed', {
        description: validation.error
      });
      return;
    }
    
    setSelectedPaymentMethod('CARD');
    setCurrentStep(PaymentStep.CARD_INPUT);
  };
  
  const processCashPayment = async () => {
    // Validate minimum order value before proceeding
    const validation = await validateMinimumOrderValue();
    if (!validation.valid) {
      toast.error('Payment cannot be processed', {
        description: validation.error
      });
      return;
    }
    
    setSelectedPaymentMethod('CASH');
    setCurrentStep(PaymentStep.PROCESSING);
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(PaymentStep.SUCCESS);
      
      // Complete payment
      const paymentResult: PaymentResult = {
        method: 'CASH',
        amount: totalWithTip,
        reference: `CASH-${Date.now()}`,
        tipAmount: selectedTip.amount,
        totalWithTip: totalWithTip,
        changeGiven: cashAmountReceived - totalWithTip
      };
      
      setTimeout(() => {
        onPaymentComplete(selectedTip, paymentResult);
        onClose();
      }, 2000);
    }, 1500);
  };
  
  const handleStripeSuccess = (paymentIntent: any, amount: number) => {
    setCurrentStep(PaymentStep.SUCCESS);
    
    const paymentResult: PaymentResult = {
      method: 'CARD',
      amount: amount,
      reference: paymentIntent.id,
      tipAmount: selectedTip.amount,
      totalWithTip: amount
    };
    
    setTimeout(() => {
      onPaymentComplete(selectedTip, paymentResult);
      onClose();
    }, 2000);
  };
  
  const handleStripeError = (error: string) => {
    console.log('💳 Stripe payment failed:', error);
    setCurrentStep(PaymentStep.FAILED);
    setFailedPaymentError(error);
  };
  
  // Adyen payment handlers
  const processAdyenPayment = async () => {
    console.log('⚡ Opening Adyen Terminal Modal');
    setSelectedPaymentMethod('CARD'); // Adyen is also card
    setShowAdyenTerminal(true);
  };
  
  const handleAdyenPaymentSuccess = (paymentData: any) => {
    console.log('✅ Adyen payment successful:', paymentData);
    setShowAdyenTerminal(false);
    setCurrentStep(PaymentStep.SUCCESS);
    
    const paymentResult: PaymentResult = {
      method: 'CARD',
      amount: paymentData.amount,
      reference: paymentData.pspReference,
      tipAmount: selectedTip.amount,
      totalWithTip: paymentData.amount
    };
    
    setTimeout(() => {
      onPaymentComplete(selectedTip, paymentResult);
      onClose();
    }, 2000);
  };
  
  const handleAdyenPaymentFailed = (error: string) => {
    console.log('❌ Adyen payment failed:', error);
    setShowAdyenTerminal(false);
    setCurrentStep(PaymentStep.FAILED);
    setFailedPaymentError(error);
  };
  
  // Failed payment handlers
  const handleRetryPayment = () => {
    setCurrentStep(PaymentStep.PAYMENT_METHOD);
    setFailedPaymentError('');
  };
  
  const handleSwitchToCash = () => {
    setSelectedPaymentMethod('CASH');
    setCurrentStep(PaymentStep.PAYMENT_METHOD);
    setFailedPaymentError('');
  };
  
  const handleCancelOrder = () => {
    toast.error('Order cancelled');
    onClose();
  };
  
  const handleProcessWithoutPayment = () => {
    // Process order without payment - useful for comp orders or payment later
    const paymentResult: PaymentResult = {
      method: 'NONE' as any, // Extended payment method
      amount: 0,
      tipAmount: 0,
      totalWithTip: 0
    };
    
    toast.success('Order processed without payment', {
      description: 'Payment to be collected separately'
    });
    
    setTimeout(() => {
      onPaymentComplete(selectedTip, paymentResult);
      onClose();
    }, 1000);
  };
  
  const goBack = () => {
    switch (currentStep) {
      case PaymentStep.PAYMENT_METHOD:
        setCurrentStep(PaymentStep.TIP_SELECTION);
        break;
      case PaymentStep.CARD_INPUT:
        setCurrentStep(PaymentStep.PAYMENT_METHOD);
        break;
      default:
        break;
    }
  };
  
  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case PaymentStep.TIP_SELECTION:
        return 'Add Tip (Optional)';
      case PaymentStep.PAYMENT_METHOD:
        return 'Select Payment Method';
      case PaymentStep.CARD_INPUT:
        return 'Card Payment';
      case PaymentStep.PROCESSING:
        return 'Processing Payment';
      case PaymentStep.SUCCESS:
        return 'Payment Successful';
      case PaymentStep.FAILED:
        return 'Payment Failed';
      default:
        return 'Payment';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl border-gray-700 text-white overflow-hidden"
        style={styles.frostedGlassStyle}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <CreditCard className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Payment processing for order total £{totalWithTip.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {/* Step 1: Tip Selection */}
          {currentStep === PaymentStep.TIP_SELECTION && (
            <motion.div
              key="tip-selection"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <POSTipSelector
                orderTotal={orderTotal}
                selectedTip={selectedTip}
                onTipChange={setSelectedTip}
              />
              
              <Separator className="bg-gray-700" />
              
              <div className="flex items-center justify-between p-4 rounded-lg" style={styles.frostedGlassStyle}>
                <div>
                  <h3 className="font-bold text-lg">Order Total</h3>
                  <p className="text-gray-400">Including tip</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: QSAITheme.purple.primary }}>{safeCurrency(totalWithTip)}</div>
                  {selectedTip.amount > 0 && (
                    <p className="text-sm text-gray-400">Base: {safeCurrency(orderTotal)} + Tip: {safeCurrency(selectedTip.amount)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/80 hover:border-white/30"
                  style={styles.frostedGlassStyle}
                >
                  Cancel
                </Button>
                <Button
                  onClick={goToPaymentMethod}
                  className="flex-1 text-white"
                  style={{ 
                    ...styles.frostedGlassStyle, 
                    background: QSAITheme.purple.primary,
                    boxShadow: effects.outerGlow('medium')
                  }}
                >
                  Continue to Payment
                  <span className="ml-2 font-bold">{safeCurrency(totalWithTip)}</span>
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Payment Method Selection */}
          {currentStep === PaymentStep.PAYMENT_METHOD && (
            <motion.div
              key="payment-method"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Cash Payment */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={processCashPayment}
                  className="p-6 rounded-xl text-white transition-all duration-300 group border border-white/20 hover:border-purple-500/50"
                  style={{
                    ...styles.frostedGlassStyle,
                    background: 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)'
                  }}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors" style={{ backgroundColor: 'rgba(124, 93, 250, 0.2)' }}>
                      <Banknote className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg">CASH</h3>
                      <p className="text-sm opacity-80">Physical payment</p>
                    </div>
                  </div>
                </motion.button>
                
                {/* Adyen Payment */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={processAdyenPayment}
                  className="p-6 rounded-xl text-white transition-all duration-300 group border border-white/20 hover:border-purple-500/50 relative"
                  style={{
                    ...styles.frostedGlassStyle,
                    background: 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)'
                  }}
                >
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-xs font-bold text-purple-300">⚡ NEW</span>
                  </div>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors" style={{ backgroundColor: 'rgba(124, 93, 250, 0.2)' }}>
                      <Smartphone className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg">ADYEN</h3>
                      <p className="text-sm opacity-80">Card terminal</p>
                    </div>
                  </div>
                </motion.button>
              </div>
              
              <div className="p-4 rounded-lg" style={styles.frostedGlassStyle}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total to Pay:</span>
                  <span className="text-2xl font-bold" style={{ color: QSAITheme.purple.primary }}>{safeCurrency(totalWithTip)}</span>
                </div>
                {selectedTip.amount > 0 && (
                  <div className="flex justify-between items-center text-sm text-gray-400 mt-1">
                    <span>Includes tip:</span>
                    <span>{safeCurrency(selectedTip.amount)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={goBack}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/80 hover:border-white/30"
                  style={styles.frostedGlassStyle}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 3: Card Input - Embedded Stripe Component */}
          {currentStep === PaymentStep.CARD_INPUT && (
            <motion.div
              key="card-input"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Embedded Manual Card Entry - Individual Stripe Elements */}
              <div className="rounded-lg p-1" style={{ ...styles.frostedGlassStyle, background: 'rgba(30, 30, 30, 0.3)' }}>
                <POSManualCardEntry
                  orderItems={orderItems}
                  orderTotal={totalWithTip}
                  orderType={orderType}
                  tableNumber={tableNumber}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  tipAmount={selectedTip.amount}
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                  onCancel={() => setCurrentStep(PaymentStep.PAYMENT_METHOD)}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={goBack}
                  variant="outline"
                  className="flex-1 border-white/20 text-white/80 hover:border-white/30"
                  style={styles.frostedGlassStyle}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payment Methods
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 4: Processing */}
          {currentStep === PaymentStep.PROCESSING && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border flex items-center justify-center" style={{ backgroundColor: 'rgba(124, 93, 250, 0.2)', borderColor: 'rgba(124, 93, 250, 0.3)' }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: QSAITheme.purple.primary }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
              <p className="text-gray-400">Please wait while we process your {selectedPaymentMethod?.toLowerCase()} payment...</p>
              <div className="mt-4 text-lg font-semibold" style={{ color: QSAITheme.purple.primary }}>{safeCurrency(totalWithTip)}</div>
            </motion.div>
          )}
          
          {/* Step 5: Success */}
          {currentStep === PaymentStep.SUCCESS && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full border flex items-center justify-center"
                style={{ backgroundColor: 'rgba(124, 93, 250, 0.2)', borderColor: 'rgba(124, 93, 250, 0.5)' }}
              >
                <CheckCircle className="h-8 w-8" style={{ color: QSAITheme.purple.primary }} />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-gray-400">Your {selectedPaymentMethod?.toLowerCase()} payment has been processed</p>
              <div className="mt-4 text-lg font-semibold" style={{ color: QSAITheme.purple.primary }}>{safeCurrency(totalWithTip)}</div>
            </motion.div>
          )}
          
          {/* Step 6: Failed Payment */}
          {currentStep === PaymentStep.FAILED && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Error Display */}
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
                <p className="text-gray-400 mb-4">{failedPaymentError || 'The payment could not be processed'}</p>
                <div className="text-lg font-semibold text-gray-300">Amount: {safeCurrency(totalWithTip)}</div>
              </div>
              
              {/* Failed Payment Options */}
              <div className="grid grid-cols-1 gap-3">
                {/* Retry Payment */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleRetryPayment}
                    className="w-full p-4 h-auto bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                    style={styles.frostedGlassStyle}
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Retry Payment</div>
                        <div className="text-xs text-blue-100">Try the card payment again</div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
                
                {/* Switch to Cash */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSwitchToCash}
                    className="w-full p-4 h-auto bg-green-600 hover:bg-green-700 text-white border-green-500"
                    style={styles.frostedGlassStyle}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Pay with Cash</div>
                        <div className="text-xs text-green-100">Accept cash payment instead</div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
                
                {/* Process Without Payment */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleProcessWithoutPayment}
                    className="w-full p-4 h-auto bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500"
                    style={styles.frostedGlassStyle}
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Process Without Payment</div>
                        <div className="text-xs text-yellow-100">Complete order, collect payment later</div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
                
                {/* Cancel Order */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleCancelOrder}
                    variant="outline"
                    className="w-full p-4 h-auto border-red-500 text-red-400 hover:bg-red-500/10"
                    style={styles.frostedGlassStyle}
                  >
                    <div className="flex items-center gap-3">
                      <X className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Cancel Order</div>
                        <div className="text-xs text-red-300">Cancel the entire order</div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
      
      {/* Adyen Card Terminal Modal */}
      {showAdyenTerminal && (
        <CardTerminalModal
          isOpen={showAdyenTerminal}
          onClose={() => {
            setShowAdyenTerminal(false);
            setCurrentStep(PaymentStep.PAYMENT_METHOD);
          }}
          orderTotal={totalWithTip}
          orderId={`POS-${Date.now()}`}
          orderType={orderType as 'WAITING' | 'COLLECTION' | 'DELIVERY'}
          customerName={customerName}
          onPaymentSuccess={handleAdyenPaymentSuccess}
          onPaymentFailed={handleAdyenPaymentFailed}
        />
      )}
    </Dialog>
  );
}

export default POSUnifiedPaymentModal;
export type { POSUnifiedPaymentModalProps };
