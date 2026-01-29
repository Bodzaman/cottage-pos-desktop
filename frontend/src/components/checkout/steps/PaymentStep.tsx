/**
 * PaymentStep - Payment form with Stripe integration
 *
 * Features:
 * - Express checkout (Apple Pay / Google Pay) via Stripe PaymentElement
 * - Saved cards for returning customers
 * - Secure Stripe Elements integration
 * - Payment processing states
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCheckout } from '../CheckoutProvider';
import { cn } from 'utils/cn';
import brain from 'brain';
import { toast } from 'sonner';

interface PaymentStepProps {
  className?: string;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

// Stripe appearance configuration matching our theme
const stripeAppearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#8B1538',
    colorBackground: 'rgba(255, 255, 255, 0.08)',
    colorText: '#FFFFFF',
    colorDanger: '#EF4444',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
    borderRadius: '12px',
  },
  rules: {
    '.Input': {
      border: '1px solid rgba(255, 255, 255, 0.15)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#FFFFFF',
      padding: '12px',
    },
    '.Input:hover': {
      border: '1px solid rgba(255, 255, 255, 0.25)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    '.Input:focus': {
      border: '1px solid #8B1538',
      boxShadow: '0 0 0 3px rgba(139, 21, 56, 0.15)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    '.Label': {
      color: '#B7BDC6',
      fontWeight: '500',
      marginBottom: '8px',
    },
    '.Tab': {
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
    },
    '.Tab:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    '.Tab--selected': {
      borderColor: '#8B1538',
      backgroundColor: 'rgba(139, 21, 56, 0.15)',
    },
    '.TabIcon': {
      fill: '#B7BDC6',
    },
    '.TabIcon--selected': {
      fill: '#8B1538',
    },
  },
};

// Payment form component (used inside Elements)
function PaymentForm({
  total,
  onSuccess,
  onError,
}: {
  total: number;
  onSuccess: () => void;
  onError: (error: string) => void;
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
      // Get checkout data from session storage
      const checkoutDataStr = sessionStorage.getItem('checkoutData');
      if (!checkoutDataStr) {
        throw new Error('Checkout data not found');
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/customer-portal?tab=orders`,
        },
        redirect: 'if_required',
      });

      if (error) {
        const errorMsg = error.message || 'Payment failed';
        setErrorMessage(errorMsg);
        toast.error('Payment failed', { description: errorMsg });
        onError(errorMsg);
      } else if (paymentIntent) {
        toast.success('Payment successful!', {
          description: 'Your order has been placed',
        });
        onSuccess();
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      toast.error('Payment error', { description: errorMsg });
      onError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element - includes card, Apple Pay, Google Pay */}
      <div className="min-h-[200px]">
        <PaymentElement
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

      {/* Error message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/30"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className={cn(
          'w-full h-14 text-lg font-semibold',
          'bg-gradient-to-r from-[#8B1538] to-[#7A1230]',
          'hover:from-[#7A1230] hover:to-[#691025]',
          'text-white border-0 shadow-lg',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Pay £{total.toFixed(2)}
          </span>
        )}
      </Button>

      {/* Processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#8B1538]/30 border-t-[#8B1538] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#EAECEF] text-lg font-semibold">Processing payment...</p>
              <p className="text-[#B7BDC6] text-sm mt-2">Please do not close this window</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

export function PaymentStep({ className }: PaymentStepProps) {
  const { total, customerData, orderMode, minimumOrderMet } = useCheckout();

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Initialize Stripe
  useEffect(() => {
    let isMounted = true;

    const initializeStripe = async () => {
      try {
        // Get publishable key
        const configResponse = await brain.get_stripe_publishable_key();
        const config = await configResponse.json();
        const publishableKey = config.publishable_key;

        if (!publishableKey) {
          throw new Error('Stripe publishable key not configured');
        }

        const stripe = loadStripe(publishableKey);
        if (isMounted) {
          setStripePromise(stripe);
        }

        // Create Payment Intent
        const amountInPence = Math.round(total * 100);
        const intentResponse = await brain.create_payment_intent({
          amount: amountInPence,
          currency: 'gbp',
          metadata: {
            customerEmail: customerData.email,
            orderType: orderMode === 'delivery' ? 'DELIVERY' : 'COLLECTION',
          },
        });

        const intentData = await intentResponse.json();

        if (!intentData.success || !intentData.client_secret) {
          throw new Error(intentData.message || 'Failed to create payment intent');
        }

        if (isMounted) {
          setClientSecret(intentData.client_secret);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to initialize payment system');
          setIsLoading(false);
        }
      }
    };

    if (total > 0) {
      initializeStripe();
    }

    return () => {
      isMounted = false;
    };
  }, [total, customerData.email, orderMode]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    // Navigate to order confirmation
    window.location.href = '/customer-portal?tab=orders';
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl p-5 md:p-6 backdrop-blur-xl border',
        className
      )}
      style={{
        background: 'rgba(23, 25, 29, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B1538]/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#8B1538]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#EAECEF]">Payment</h2>
            <p className="text-sm text-[#B7BDC6]">Secure checkout powered by Stripe</p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Secure</span>
        </div>
      </div>

      {/* Payment success state */}
      {paymentSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-[#EAECEF] mb-2">Payment Successful!</h3>
          <p className="text-[#B7BDC6]">Redirecting to your orders...</p>
        </motion.div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <motion.div custom={0} variants={fieldVariants}>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Payment System Error</p>
                <p className="text-xs text-red-300/70 mt-1">{error}</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-[#8B1538] hover:bg-[#7A1230] text-white"
          >
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && !error && !paymentSuccess && (
        <motion.div custom={0} variants={fieldVariants} className="text-center py-12">
          <div className="w-12 h-12 border-4 border-[#8B1538]/30 border-t-[#8B1538] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#B7BDC6]">Initializing secure payment...</p>
        </motion.div>
      )}

      {/* Payment form */}
      {!isLoading && !error && !paymentSuccess && clientSecret && stripePromise && (
        <motion.div custom={1} variants={fieldVariants}>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: stripeAppearance,
            }}
          >
            <PaymentForm
              total={total}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </motion.div>
      )}

      {/* Minimum order warning */}
      {!minimumOrderMet && (
        <motion.div
          custom={2}
          variants={fieldVariants}
          className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-400">
              Minimum order not met. Please add more items to checkout.
            </p>
          </div>
        </motion.div>
      )}

      {/* Payment methods info */}
      <motion.div custom={3} variants={fieldVariants} className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-4 opacity-60">
          <img src="/static/payment-visa.svg" alt="Visa" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
          <img src="/static/payment-mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
          <img src="/static/payment-amex.svg" alt="Amex" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
          <img src="/static/payment-applepay.svg" alt="Apple Pay" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
          <img src="/static/payment-googlepay.svg" alt="Google Pay" className="h-6" onError={(e) => e.currentTarget.style.display = 'none'} />
        </div>
        <p className="text-center text-xs text-[#B7BDC6]/70 mt-3">
          Your payment information is encrypted and secure
        </p>
      </motion.div>
    </motion.div>
  );
}

export default PaymentStep;
