import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Banknote, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatters';
import { apiClient } from 'app';

// POS Theme Colors (matching POSDesktop dark theme)
const POSTheme = {
  purple: {
    primary: '#5B3CC4',
    light: '#7C5FD8',
    dark: '#4A2FA3'
  },
  silver: {
    primary: '#C0C0C0',
    light: '#E0E0E0',
    dark: '#A0A0A0'
  },
  background: {
    primary: '#0F0F0F',
    secondary: '#1A1A1A',
    tertiary: '#252525'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#C0C0C0',
    muted: '#808080'
  }
};

interface CardTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  orderId: string;
  orderType: 'WAITING' | 'COLLECTION' | 'DELIVERY';
  customerName?: string;
  onPaymentSuccess: (paymentData: PaymentData) => void;
  onPaymentFailed: (error: string) => void;
}

interface PaymentData {
  method: 'ADYEN' | 'CASH_TEST' | 'CARD_TEST';
  amount: number;
  pspReference?: string;
  sessionId?: string;
}

enum PaymentState {
  READY = 'ready',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

/**
 * CardTerminalModal - Staff-initiated payment terminal for Adyen
 * 
 * SCOPE: WAITING, COLLECTION, DELIVERY only (NOT DINE-IN)
 * PURPOSE: Staff creates order → Staff selects Adyen → Customer pays via Drop-in
 * 
 * UI DESIGN:
 * - Amount-first: Large display at top center
 * - Keypad-right: Industry standard layout
 * - Test buttons: Simulation options for development
 * - POS dark theme: Purple accents, dark background
 */
export function CardTerminalModal({
  isOpen,
  onClose,
  orderTotal,
  orderId,
  orderType,
  customerName,
  onPaymentSuccess,
  onPaymentFailed
}: CardTerminalModalProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>(PaymentState.READY);
  const [adyenDropinContainer, setAdyenDropinContainer] = useState<HTMLDivElement | null>(null);
  const [adyenCheckout, setAdyenCheckout] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentState(PaymentState.READY);
      setErrorMessage('');
      setAdyenCheckout(null);
    }
  }, [isOpen]);

  // ============================================================================
  // ADYEN WEB DROP-IN INITIALIZATION
  // ============================================================================
  
  const initializeAdyenDropin = async () => {
    try {
      setPaymentState(PaymentState.PROCESSING);
      
      // 1. Get Adyen client key
      const configResponse = await apiClient.get_payment_config();
      const config = await configResponse.json();
      const adyenClientKey = config.adyen_client_key;
      
      if (!adyenClientKey) {
        throw new Error('Adyen client key not configured');
      }
      
      // 2. Create Adyen payment session
      const sessionResponse = await apiClient.create_payment_session({
        amount: Math.round(orderTotal * 100), // Convert to minor units (pence)
        currency: 'GBP',
        order_id: orderId,
        order_type: orderType,
        customer_name: customerName || 'POS Customer',
        return_url: `${window.location.origin}/pos-desktop` // Return to POS after payment
      });
      
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.success) {
        throw new Error(sessionData.message || 'Failed to create payment session');
      }
      
      // 3. Load Adyen Web Drop-in library
      if (!window.AdyenCheckout) {
        // Load Adyen script dynamically
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
        onPaymentCompleted: (result: any, component: any) => {
          console.log('✅ [Adyen] Payment completed:', result);
          handleAdyenPaymentSuccess(result);
        },
        onError: (error: any, component: any) => {
          console.error('❌ [Adyen] Payment error:', error);
          handleAdyenPaymentError(error.message || 'Payment failed');
        }
      });
      
      // 5. Mount Drop-in to container
      if (adyenDropinContainer) {
        const dropin = checkout.create('dropin').mount(adyenDropinContainer);
        setAdyenCheckout(dropin);
      }
      
      setPaymentState(PaymentState.READY);
      
    } catch (error: any) {
      console.error('❌ [CardTerminal] Adyen initialization failed:', error);
      setErrorMessage(error.message || 'Failed to initialize payment terminal');
      setPaymentState(PaymentState.FAILED);
      toast.error('Payment terminal error', {
        description: error.message || 'Failed to initialize Adyen'
      });
    }
  };

  // ============================================================================
  // PAYMENT HANDLERS
  // ============================================================================
  
  const handleAdyenPaymentSuccess = (result: any) => {
    setPaymentState(PaymentState.SUCCESS);
    
    const paymentData: PaymentData = {
      method: 'ADYEN',
      amount: orderTotal,
      pspReference: result.pspReference,
      sessionId: result.sessionId
    };
    
    toast.success('Payment successful!', {
      description: `${formatCurrency(orderTotal)} charged via Adyen`
    });
    
    // Delay to show success state before closing
    setTimeout(() => {
      onPaymentSuccess(paymentData);
      onClose();
    }, 1500);
  };
  
  const handleAdyenPaymentError = (error: string) => {
    setPaymentState(PaymentState.FAILED);
    setErrorMessage(error);
    onPaymentFailed(error);
  };

  // ============================================================================
  // TEST SIMULATION HANDLERS (for development/testing)
  // ============================================================================
  
  const handleTestCashPayment = () => {
    setPaymentState(PaymentState.PROCESSING);
    
    // Simulate processing delay
    setTimeout(() => {
      setPaymentState(PaymentState.SUCCESS);
      
      const paymentData: PaymentData = {
        method: 'CASH_TEST',
        amount: orderTotal
      };
      
      toast.success('Cash payment (TEST)', {
        description: `${formatCurrency(orderTotal)} - Test mode`
      });
      
      setTimeout(() => {
        onPaymentSuccess(paymentData);
        onClose();
      }, 1000);
    }, 800);
  };
  
  const handleTestCardPayment = () => {
    setPaymentState(PaymentState.PROCESSING);
    
    // Simulate processing delay
    setTimeout(() => {
      setPaymentState(PaymentState.SUCCESS);
      
      const paymentData: PaymentData = {
        method: 'CARD_TEST',
        amount: orderTotal,
        pspReference: `TEST_${Date.now()}`
      };
      
      toast.success('Card payment (TEST)', {
        description: `${formatCurrency(orderTotal)} - Test mode`
      });
      
      setTimeout(() => {
        onPaymentSuccess(paymentData);
        onClose();
      }, 1000);
    }, 1200);
  };
  
  const handleTestDeclinePayment = () => {
    setPaymentState(PaymentState.PROCESSING);
    
    // Simulate decline
    setTimeout(() => {
      setPaymentState(PaymentState.FAILED);
      setErrorMessage('Card declined (TEST)');
      
      toast.error('Payment declined (TEST)', {
        description: 'Test simulation - card declined'
      });
      
      onPaymentFailed('Card declined (TEST)');
    }, 1000);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl"
        style={{ 
          background: POSTheme.background.primary,
          border: `1px solid ${POSTheme.background.tertiary}`
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-2xl font-bold"
            style={{ color: POSTheme.text.primary }}
          >
            Payment Terminal - Order #{orderId.slice(0, 8).toUpperCase()}
          </DialogTitle>
          <div 
            className="text-sm"
            style={{ color: POSTheme.text.secondary }}
          >
            {orderType} {customerName && `• ${customerName}`}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Display - Prominent at top */}
          <div 
            className="text-center py-6 rounded-lg"
            style={{ 
              background: POSTheme.background.secondary,
              border: `2px solid ${POSTheme.purple.primary}`
            }}
          >
            <div 
              className="text-sm uppercase tracking-wide mb-2"
              style={{ color: POSTheme.text.muted }}
            >
              Order Total
            </div>
            <div 
              className="text-6xl font-bold"
              style={{ color: POSTheme.purple.primary }}
            >
              {formatCurrency(orderTotal)}
            </div>
            <div 
              className="text-sm mt-2"
              style={{ color: POSTheme.text.secondary }}
            >
              Ready for Payment
            </div>
          </div>

          {/* Main Payment Area */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Payment Options */}
            <div className="space-y-3">
              <div 
                className="text-sm font-semibold mb-3"
                style={{ color: POSTheme.text.primary }}
              >
                💳 Payment Options
              </div>
              
              {/* Adyen Real Payment Button */}
              <Button
                onClick={initializeAdyenDropin}
                disabled={paymentState !== PaymentState.READY}
                className="w-full justify-start text-left h-14"
                style={{
                  background: POSTheme.purple.primary,
                  color: POSTheme.text.primary
                }}
              >
                <CreditCard className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-semibold">⚡ Adyen Payment</div>
                  <div className="text-xs opacity-80">Card / Digital Wallet</div>
                </div>
              </Button>
              
              <div 
                className="text-xs uppercase tracking-wide mt-4 mb-2"
                style={{ color: POSTheme.text.muted }}
              >
                Test Simulation
              </div>
              
              {/* Test Buttons */}
              <Button
                onClick={handleTestCashPayment}
                disabled={paymentState !== PaymentState.READY}
                className="w-full justify-start h-12"
                variant="outline"
                style={{
                  borderColor: POSTheme.silver.dark,
                  color: POSTheme.text.secondary
                }}
              >
                <Banknote className="mr-2 h-4 w-4" />
                💵 Cash (Test)
              </Button>
              
              <Button
                onClick={handleTestCardPayment}
                disabled={paymentState !== PaymentState.READY}
                className="w-full justify-start h-12"
                variant="outline"
                style={{
                  borderColor: POSTheme.silver.dark,
                  color: POSTheme.text.secondary
                }}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                💳 Card (Test)
              </Button>
              
              <Button
                onClick={handleTestDeclinePayment}
                disabled={paymentState !== PaymentState.READY}
                className="w-full justify-start h-12"
                variant="outline"
                style={{
                  borderColor: '#EF4444',
                  color: '#EF4444'
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                ❌ Decline (Test)
              </Button>
            </div>

            {/* Right: Adyen Drop-in / Status Display */}
            <div 
              className="rounded-lg p-4 min-h-[300px] flex items-center justify-center"
              style={{ 
                background: POSTheme.background.secondary,
                border: `1px solid ${POSTheme.background.tertiary}`
              }}
            >
              {paymentState === PaymentState.READY && (
                <div className="text-center" style={{ color: POSTheme.text.muted }}>
                  <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <div>Select test payment method to simulate</div>
                </div>
              )}
              
              {paymentState === PaymentState.PROCESSING && (
                <div className="text-center" style={{ color: POSTheme.purple.primary }}>
                  <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" />
                  <div className="font-semibold">Processing payment...</div>
                </div>
              )}
              
              {paymentState === PaymentState.SUCCESS && (
                <div className="text-center" style={{ color: '#10B981' }}>
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
                  <div className="font-semibold text-xl">Payment Successful!</div>
                  <div className="text-sm mt-2" style={{ color: POSTheme.text.secondary }}>
                    {formatCurrency(orderTotal)}
                  </div>
                </div>
              )}
              
              {paymentState === PaymentState.FAILED && (
                <div className="text-center" style={{ color: '#EF4444' }}>
                  <XCircle className="h-16 w-16 mx-auto mb-4" />
                  <div className="font-semibold text-xl">Payment Failed</div>
                  <div className="text-sm mt-2" style={{ color: POSTheme.text.secondary }}>
                    {errorMessage}
                  </div>
                  <Button
                    onClick={() => setPaymentState(PaymentState.READY)}
                    className="mt-4"
                    style={{ background: POSTheme.purple.primary }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {/* Adyen Drop-in container */}
              <div 
                ref={setAdyenDropinContainer}
                className="w-full"
                style={{ display: adyenCheckout ? 'block' : 'none' }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: POSTheme.background.tertiary }}>
            <Button
              onClick={onClose}
              disabled={paymentState === PaymentState.PROCESSING}
              variant="outline"
              style={{
                borderColor: POSTheme.silver.dark,
                color: POSTheme.text.secondary
              }}
            >
              Cancel
            </Button>
            
            <div className="text-xs" style={{ color: POSTheme.text.muted }}>
              {paymentState === PaymentState.READY && 'Ready to accept payment'}
              {paymentState === PaymentState.PROCESSING && 'Please wait...'}
              {paymentState === PaymentState.SUCCESS && 'Completing order...'}
              {paymentState === PaymentState.FAILED && 'Payment unsuccessful'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CardTerminalModal;
