import React, { useEffect, useState } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { FaLock } from 'react-icons/fa';
import { apiClient } from 'app';
import { toast } from 'sonner';

interface StripeCheckoutProps {
  orderId: string;
  amount: number; // Amount in pence (e.g., 3250 = £32.50)
  currency: string;
  orderType: 'DELIVERY' | 'COLLECTION';
  customerEmail?: string;
  customerName?: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

// Child component that uses Stripe hooks
function CheckoutForm({
  orderId,
  onPaymentSuccess,
  onPaymentError,
}: {
  orderId: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
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

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/customer-portal?tab=orders`,
        },
        redirect: 'if_required', // Only redirect if 3DS is required
      });

      if (error) {
        console.error('❌ [Stripe] Payment error:', error);
        const errorMsg = error.message || 'Payment failed';
        setErrorMessage(errorMsg);
        toast.error('Payment failed', {
          description: errorMsg,
        });
        onPaymentError(errorMsg);
      } else if (paymentIntent) {
        console.log('✅ [Stripe] Payment succeeded:', paymentIntent.id);

        // Confirm with backend
        try {
          const confirmResponse = await apiClient.confirm_payment({
            payment_intent_id: paymentIntent.id,
            order_id: orderId,
          });

          const confirmData = await confirmResponse.json();

          if (confirmData.success) {
            toast.success('Payment successful!', {
              description: 'Your order has been placed',
            });
            onPaymentSuccess(paymentIntent.id);
          } else {
            throw new Error(confirmData.message || 'Failed to confirm payment');
          }
        } catch (confirmError: any) {
          console.error('❌ [Stripe] Error confirming payment:', confirmError);
          // Payment succeeded but confirmation failed - still call success
          toast.success('Payment successful!', {
            description: 'Your order has been placed',
          });
          onPaymentSuccess(paymentIntent.id);
        }
      }
    } catch (err: any) {
      console.error('❌ [Stripe] Unexpected error:', err);
      const errorMsg = err.message || 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      toast.error('Payment error', {
        description: errorMsg,
      });
      onPaymentError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="min-h-[300px]">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#8B1538] hover:bg-[#7A1230] text-white h-14 text-lg font-semibold"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#8B1538]/30 border-t-[#8B1538] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#EAECEF] text-lg font-semibold">
              Processing payment...
            </p>
            <p className="text-[#B7BDC6] text-sm mt-2">
              Please do not close this window
            </p>
          </div>
        </div>
      )}
    </form>
  );
}

export function StripeCheckout({
  orderId,
  amount,
  currency,
  orderType,
  customerEmail,
  customerName,
  onPaymentSuccess,
  onPaymentError,
}: StripeCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeStripe = async () => {
      try {
        console.log('🔧 [Stripe] Initializing Stripe...');

        // Get publishable key
        const configResponse = await apiClient.get_stripe_publishable_key();
        const config = await configResponse.json();
        const publishableKey = config.publishable_key;

        if (!publishableKey) {
          throw new Error('Stripe publishable key not configured');
        }

        console.log('🔑 [Stripe] Loading Stripe SDK...');
        const stripe = loadStripe(publishableKey);
        setStripePromise(stripe);

        // Create Payment Intent
        console.log('💳 [Stripe] Creating Payment Intent...');
        const intentResponse = await apiClient.create_payment_intent({
          amount,
          currency: currency.toLowerCase(),
          order_id: orderId,
          order_type: orderType,
          customer_email: customerEmail,
          customer_name: customerName,
          description: `Cottage Tandoori - Order ${orderId}`,
        });

        const intentData = await intentResponse.json();

        if (!intentData.success || !intentData.client_secret) {
          throw new Error(intentData.message || 'Failed to create payment intent');
        }

        if (isMounted) {
          setClientSecret(intentData.client_secret);
          setIsLoading(false);
          console.log('✅ [Stripe] Stripe initialized successfully');
        }
      } catch (err: any) {
        console.error('❌ [Stripe] Initialization error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize payment system');
          setIsLoading(false);
        }
      }
    };

    initializeStripe();

    return () => {
      isMounted = false;
    };
  }, [orderId, amount, currency, orderType, customerEmail, customerName]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 font-semibold mb-2">Payment System Error</p>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="w-full bg-[#8B1538] hover:bg-[#7A1230] text-white"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading || !clientSecret || !stripePromise) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#8B1538]/30 border-t-[#8B1538] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#B7BDC6]">Initializing secure payment...</p>
          </div>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#8B1538',
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
        border: '1px solid #8B1538',
        boxShadow: '0 0 0 3px rgba(139, 21, 56, 0.15)',
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
        borderColor: '#8B1538',
        backgroundColor: 'rgba(139, 21, 56, 0.1)',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Header */}
      <div className="flex items-center gap-2 mb-4">
        <FaLock className="text-[#8B1538]" />
        <h3 className="text-lg font-semibold text-[#EAECEF]">Payment Details</h3>
        <span className="text-xs text-[#B7BDC6] ml-auto">Secured by Stripe</span>
      </div>

      {/* Stripe Elements */}
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <CheckoutForm
          orderId={orderId}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
        />
      </Elements>

      {/* Custom Styles */}
      <style>{`
        /* Additional custom overrides for Stripe Elements */
        .StripeElement {
          transition: all 0.2s ease;
        }
        
        .StripeElement--focus {
          box-shadow: 0 0 0 3px rgba(139, 21, 56, 0.15) !important;
        }
        
        .StripeElement--invalid {
          border-color: #EF4444 !important;
        }
      `}</style>
    </div>
  );
}
