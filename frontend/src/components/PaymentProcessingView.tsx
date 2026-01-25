/**
 * PaymentProcessingView - Payment processing step in unified payment flow
 * Handles both STRIPE (card) and CASH payment methods
 * Embeds Stripe Elements for card payments, shows animation for cash
 * Part of PaymentFlowOrchestrator state machine
 */

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Banknote, CheckCircle2 } from 'lucide-react';
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

// ============================================================================
// STRIPE CHECKOUT FORM (Child component that uses Stripe hooks)
// ============================================================================

function StripePaymentForm({
  orderId,
  totalAmount,
  clientSecret,
  customerName,
  onPaymentSuccess,
  onPaymentFailed,
  onBack,
}: {
  orderId: string;
  totalAmount: number;
  clientSecret: string;
  customerName?: string;
  onPaymentSuccess: (data: { method: 'STRIPE'; amount: number; pspReference?: string }) => void;
  onPaymentFailed: (errorMessage: string) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      console.log('💳 [Stripe] Confirming payment...');

      // Get the CardNumberElement (individual element)
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error('Card number element not found');
      }

      // Confirm the payment using CardNumberElement
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: customerName || 'POS Customer',
          },
        },
      });

      if (error) {
        console.error('❌ [Stripe] Payment error:', error);
        const errorMsg = error.message || 'Payment failed';
        setErrorMessage(errorMsg);
        toast.error('Payment failed', {
          description: errorMsg,
        });
        onPaymentFailed(errorMsg);
      } else if (paymentIntent) {
        console.log('✅ [Stripe] Payment succeeded:', paymentIntent.id);

        // Confirm with backend
        try {
          const confirmResponse = await brain.confirm_payment({
            payment_intent_id: paymentIntent.id,
            order_id: orderId,
          });

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            toast.success('Payment successful!', {
              description: `${safeCurrency(totalAmount)} charged via card`,
            });
            onPaymentSuccess({
              method: 'STRIPE',
              amount: totalAmount,
              pspReference: paymentIntent.id,
            });
          } else {
            throw new Error(confirmData.message || 'Failed to confirm payment');
          }
        } catch (confirmError: any) {
          console.error('❌ [Stripe] Error confirming payment:', confirmError);
          // Payment succeeded but confirmation failed - still call success
          toast.success('Payment successful!', {
            description: `${safeCurrency(totalAmount)} charged via card`,
          });
          onPaymentSuccess({
            method: 'STRIPE',
            amount: totalAmount,
            pspReference: paymentIntent.id,
          });
        }
      }
    } catch (err: any) {
      console.error('❌ [Stripe] Unexpected error:', err);
      const errorMsg = err.message || 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      toast.error('Payment error', {
        description: errorMsg,
      });
      onPaymentFailed(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Shared style for all card elements
  // disableLink: true prevents Link autofill button from appearing
  // This is for POS staff use - customers should not save cards via POS terminal
  const cardElementStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#A78BFA',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
    },
    disableLink: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Number */}
      <div className="space-y-1">
        <label className="text-sm text-white/70">Card Number</label>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <CardNumberElement options={cardElementStyle} />
        </div>
      </div>

      {/* Expiry and CVC side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-white/70">Expiry Date</label>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <CardExpiryElement options={cardElementStyle} />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-white/70">CVC</label>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <CardCvcElement options={cardElementStyle} />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Card
          className="border-red-500/30"
          style={{
            ...styles.frostedGlassStyle,
            background: 'rgba(239, 68, 68, 0.1)',
          }}
        >
          <CardContent className="p-4">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Pay Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-14 text-lg font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
          border: 'none',
          boxShadow: `0 0 20px ${QSAITheme.purple.glow}`,
        }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Pay {safeCurrency(totalAmount)}
          </>
        )}
      </Button>

      {/* Keyboard hint */}
      <p className="text-xs text-white/40 text-center mt-3">
        Enter card details using keyboard • Press Enter to pay
      </p>

      {/* Processing Overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" style={{ color: QSAITheme.purple.primary }} />
            <p className="text-white text-lg font-semibold">Processing payment...</p>
            <p className="text-white/60 text-sm mt-2">Please do not close this window</p>
          </div>
        </motion.div>
      )}
    </form>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // ============================================================================
  // STRIPE INITIALIZATION (for CARD payments)
  // ============================================================================
  
  useEffect(() => {
    if (paymentMethod === 'STRIPE') {
      initializeStripe();
    } else if (paymentMethod === 'CASH') {
      // CASH payments are handled by button click
      setProcessingState(ProcessingState.READY);
    }
  }, [paymentMethod]);

  const initializeStripe = async () => {
    try {
      setProcessingState(ProcessingState.INITIALIZING);
      console.log('🔧 [Stripe] Initializing Stripe...');
      
      // 1. Get Stripe publishable key
      const configResponse = await brain.get_stripe_publishable_key();
      const config = await configResponse.json();
      const publishableKey = config.publishable_key;
      
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }
      
      console.log('🔑 [Stripe] Loading Stripe SDK...');
      const stripe = loadStripe(publishableKey);
      setStripePromise(stripe);
      
      // 2. Create Payment Intent
      console.log('💳 [Stripe] Creating Payment Intent...');
      const intentResponse = await brain.create_payment_intent({
        amount: Math.round(totalAmount * 100), // Convert to pence
        currency: 'gbp',
        order_id: orderId,
        order_type: orderType,
        customer_email: undefined,
        customer_name: customerName || 'POS Customer',
        description: `POS Order - ${orderType}`,
        pos_mode: true, // POS: Restrict to card-only (no Klarna, Revolut, etc.)
      });
      
      const intentData = await intentResponse.json();
      
      if (!intentData.success || !intentData.client_secret) {
        throw new Error(intentData.message || 'Failed to create payment intent');
      }
      
      setClientSecret(intentData.client_secret);
      setProcessingState(ProcessingState.READY);
      console.log('✅ [Stripe] Stripe initialized successfully');
      
    } catch (error: any) {
      console.error('❌ [PaymentProcessing] Stripe initialization failed:', error);
      setErrorMessage(error.message || 'Failed to initialize payment system');
      setProcessingState(ProcessingState.FAILED);
      toast.error('Payment system error', {
        description: error.message || 'Failed to initialize Stripe'
      });
    }
  };

  // ============================================================================
  // PAYMENT HANDLERS
  // ============================================================================
  
  const handleStripeSuccess = (data: { method: 'STRIPE'; amount: number; pspReference?: string }) => {
    setProcessingState(ProcessingState.SUCCESS);
    
    // Delay to show success state
    setTimeout(() => {
      onPaymentSuccess(data);
    }, 1500);
  };
  
  const handleStripeError = (error: string) => {
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
    if (paymentMethod === 'STRIPE') {
      initializeStripe();
    } else {
      setProcessingState(ProcessingState.READY);
    }
  };

  // Stripe appearance configuration
  const stripeAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: QSAITheme.purple.primary,
      colorBackground: 'rgba(255, 255, 255, 0.08)',
      colorText: '#FFFFFF',
      colorDanger: '#EF4444',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
    rules: {
      '.Input': {
        border: '1px solid rgba(255, 255, 255, 0.25)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: '#FFFFFF',
      },
      '.Input:hover': {
        border: '1px solid rgba(255, 255, 255, 0.35)',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
      },
      '.Input:focus': {
        border: `1px solid ${QSAITheme.purple.primary}`,
        boxShadow: `0 0 0 3px ${QSAITheme.purple.glow}`,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
      },
      '.Label': {
        color: '#FFFFFF',
        fontWeight: '500',
      },
      '.Tab': {
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
      '.Tab:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
      '.Tab--selected': {
        borderColor: QSAITheme.purple.primary,
        backgroundColor: 'rgba(91, 33, 182, 0.1)',
      },
    },
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
          {paymentMethod === 'STRIPE' ? 'Card Payment' : 'Cash Payment'}
        </h2>
        <p className="text-sm text-white/60">
          {paymentMethod === 'STRIPE' 
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
          <div className="text-5xl font-black text-white drop-shadow-lg">
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
            <div className="text-white">Initializing payment system...</div>
          </motion.div>
        )}

        {/* READY STATE - STRIPE */}
        {processingState === ProcessingState.READY && paymentMethod === 'STRIPE' && clientSecret && stripePromise && (
          <motion.div
            key="stripe-ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Stripe Elements Container */}
            <Card style={styles.frostedGlassStyle}>
              <CardContent className="p-6">
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                  <StripePaymentForm
                    orderId={orderId}
                    totalAmount={totalAmount}
                    clientSecret={clientSecret}
                    customerName={customerName}
                    onPaymentSuccess={handleStripeSuccess}
                    onPaymentFailed={handleStripeError}
                    onBack={onBack}
                  />
                </Elements>
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
            Back to Order
          </Button>
        </div>
      )}

      {/* SaaS Branding Footer */}
      <div className="text-center pt-6">
        {/* "powered by" - smaller */}
        <div
          className="text-[10px] font-medium tracking-wide mb-0.5"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.5) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em'
          }}
        >
          powered by
        </div>
        {/* "QuickServe AI Merchant Services" - larger */}
        <div
          className="text-xs font-medium tracking-wide"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 10px rgba(124, 93, 250, 0.2)',
            letterSpacing: '0.02em'
          }}
        >
          QuickServe AI Merchant Services
        </div>
      </div>
    </motion.div>
  );
}
