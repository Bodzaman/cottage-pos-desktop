/**
 * PaymentProcessingView - Payment processing step in unified payment flow
 * Handles both ADYEN (card) and CASH payment methods
 * Embeds Adyen Drop-in for card payments, shows animation for cash
 * Part of PaymentFlowOrchestrator state machine
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentProcessingViewProps } from '../utils/paymentFlowTypes';
import { QSAITheme, styles } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';
import brain from 'brain';
import { toast } from 'sonner';

// Payment processing states
enum ProcessingState {
  INITIALIZING = 'initializing',
  READY = 'ready',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// Global window type for Adyen
declare global {
  interface Window {
    AdyenCheckout: any;
  }
}

export function PaymentProcessingView({
  paymentMethod,
  totalAmount,
  orderId,
  orderType,
  customerName,
  onPaymentSuccess,
  onPaymentFailed,
  onBack
}: PaymentProcessingViewProps) {
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.INITIALIZING);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [adyenCheckout, setAdyenCheckout] = useState<any>(null);
  const adyenContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // ADYEN INITIALIZATION (for CARD payments)
  // ============================================================================
  
  useEffect(() => {
    if (paymentMethod === 'ADYEN') {
      initializeAdyenDropin();
    } else if (paymentMethod === 'CASH') {
      // CASH payments are handled by button click
      setProcessingState(ProcessingState.READY);
    }
  }, [paymentMethod]);

  const initializeAdyenDropin = async () => {
    try {
      setProcessingState(ProcessingState.INITIALIZING);
      
      // 1. Get Adyen client key
      const configResponse = await brain.get_payment_config();
      const config = await configResponse.json();
      const adyenClientKey = config.adyen_client_key;
      
      if (!adyenClientKey) {
        throw new Error('Adyen client key not configured');
      }
      
      // 2. Create Adyen payment session
      const sessionResponse = await brain.create_payment_session({
        amount: Math.round(totalAmount * 100), // Convert to minor units (pence)
        currency: 'GBP',
        order_id: orderId,
        order_type: orderType,
        customer_name: customerName || 'POS Customer',
        return_url: `${window.location.origin}/pos-desktop`
      });
      
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.success) {
        throw new Error(sessionData.message || 'Failed to create payment session');
      }
      
      // 3. Load Adyen Web Drop-in library (if not already loaded)
      if (!window.AdyenCheckout) {
        const script = document.createElement('script');
        script.src = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/5.59.0/adyen.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        // Load Adyen CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/5.59.0/adyen.css';
        document.head.appendChild(link);
      }
      
      // 4. Initialize Adyen Checkout
      const checkout = await window.AdyenCheckout({
        environment: 'test',
        clientKey: adyenClientKey,
        session: {
          id: sessionData.session_id,
          sessionData: sessionData.session_data
        },
        onPaymentCompleted: (result: any) => {
          console.log('✅ [Adyen] Payment completed:', result);
          handleAdyenSuccess(result);
        },
        onError: (error: any) => {
          console.error('❌ [Adyen] Payment error:', error);
          handleAdyenError(error.message || 'Payment failed');
        }
      });
      
      // 5. Mount Drop-in to container
      if (adyenContainerRef.current) {
        const dropin = checkout.create('dropin').mount(adyenContainerRef.current);
        setAdyenCheckout(dropin);
      }
      
      setProcessingState(ProcessingState.READY);
      
    } catch (error: any) {
      console.error('❌ [PaymentProcessing] Adyen initialization failed:', error);
      setErrorMessage(error.message || 'Failed to initialize payment terminal');
      setProcessingState(ProcessingState.FAILED);
      toast.error('Payment terminal error', {
        description: error.message || 'Failed to initialize Adyen'
      });
    }
  };

  // ============================================================================
  // PAYMENT HANDLERS
  // ============================================================================
  
  const handleAdyenSuccess = (result: any) => {
    setProcessingState(ProcessingState.SUCCESS);
    
    toast.success('Payment successful!', {
      description: `${safeCurrency(totalAmount)} charged via card`
    });
    
    // Delay to show success state
    setTimeout(() => {
      onPaymentSuccess({
        method: 'ADYEN',
        amount: totalAmount,
        pspReference: result.pspReference,
        sessionId: result.sessionId
      });
    }, 1500);
  };
  
  const handleAdyenError = (error: string) => {
    setProcessingState(ProcessingState.FAILED);
    setErrorMessage(error);
    onPaymentFailed(error);
  };

  const handleCashPayment = () => {
    setProcessingState(ProcessingState.PROCESSING);
    
    // Simulate cash processing delay
    setTimeout(() => {
      setProcessingState(ProcessingState.SUCCESS);
      
      toast.success('Cash payment recorded', {
        description: `${safeCurrency(totalAmount)} to be collected`
      });
      
      setTimeout(() => {
        onPaymentSuccess({
          method: 'CASH',
          amount: totalAmount
        });
      }, 1000);
    }, 800);
  };

  const handleRetry = () => {
    setErrorMessage('');
    if (paymentMethod === 'ADYEN') {
      initializeAdyenDropin();
    } else {
      setProcessingState(ProcessingState.READY);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {paymentMethod === 'ADYEN' ? 'Card Payment' : 'Cash Payment'}
        </h2>
        <p className="text-sm text-white/60">
          {paymentMethod === 'ADYEN' 
            ? 'Enter card details to complete payment'
            : 'Confirm cash payment from customer'}
        </p>
      </div>

      {/* Amount Display */}
      <Card 
        className="border-purple-500/30"
        style={{
          ...styles.frostedGlassStyle,
          background: 'rgba(91, 33, 182, 0.1)'
        }}
      >
        <CardContent className="p-6 text-center">
          <div className="text-sm text-white/60 mb-2">Amount to Pay</div>
          <div className="text-4xl font-bold" style={{ color: QSAITheme.purple.primary }}>
            {safeCurrency(totalAmount)}
          </div>
        </CardContent>
      </Card>

      {/* Processing States */}
      <AnimatePresence mode="wait">
        {/* INITIALIZING STATE */}
        {processingState === ProcessingState.INITIALIZING && (
          <motion.div
            key="initializing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" style={{ color: QSAITheme.purple.primary }} />
            <div className="text-white">Initializing payment terminal...</div>
          </motion.div>
        )}

        {/* READY STATE - ADYEN */}
        {processingState === ProcessingState.READY && paymentMethod === 'ADYEN' && (
          <motion.div
            key="adyen-ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Adyen Drop-in Container */}
            <Card style={styles.frostedGlassStyle}>
              <CardContent className="p-6">
                <div ref={adyenContainerRef} className="w-full" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* READY STATE - CASH */}
        {processingState === ProcessingState.READY && paymentMethod === 'CASH' && (
          <motion.div
            key="cash-ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <Banknote className="h-24 w-24 mx-auto mb-6" style={{ color: QSAITheme.purple.primary }} />
            <p className="text-white/80 mb-6">Collect cash from customer</p>
            <Button
              onClick={handleCashPayment}
              size="lg"
              className="w-full h-14 text-white font-bold text-lg"
              style={{
                ...styles.frostedGlassStyle,
                background: QSAITheme.purple.primary
              }}
            >
              Confirm Cash Received
            </Button>
          </motion.div>
        )}

        {/* PROCESSING STATE */}
        {processingState === ProcessingState.PROCESSING && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" style={{ color: QSAITheme.purple.primary }} />
            <div className="text-white font-semibold">Processing payment...</div>
          </motion.div>
        )}

        {/* SUCCESS STATE */}
        {processingState === ProcessingState.SUCCESS && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="h-24 w-24 mx-auto mb-4 text-green-500" />
            </motion.div>
            <div className="text-2xl font-bold text-white mb-2">Payment Successful!</div>
            <div className="text-white/60">{safeCurrency(totalAmount)} received</div>
          </motion.div>
        )}

        {/* FAILED STATE */}
        {processingState === ProcessingState.FAILED && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Card 
              className="border-red-500/30"
              style={{
                ...styles.frostedGlassStyle,
                background: 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="text-red-500 text-lg font-semibold mb-2">Payment Failed</div>
                <div className="text-white/80 text-sm">{errorMessage || 'An error occurred'}</div>
              </CardContent>
            </Card>
            <Button
              onClick={handleRetry}
              className="w-full h-12 border-white/20 text-white/80"
              variant="outline"
              style={styles.frostedGlassStyle}
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button (only show when not processing/success) */}
      {processingState !== ProcessingState.PROCESSING && processingState !== ProcessingState.SUCCESS && (
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full border-white/20 text-white/80 hover:bg-white/10 h-12"
            style={styles.frostedGlassStyle}
            disabled={processingState === ProcessingState.INITIALIZING}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payment Method
          </Button>
        </div>
      )}
    </motion.div>
  );
}
