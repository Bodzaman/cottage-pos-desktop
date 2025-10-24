/**
 * PaymentResultView - Final step showing payment success or failure
 * Displays result with animations and auto-close on success
 * Part of PaymentFlowOrchestrator state machine
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { PaymentResultViewProps } from '../utils/paymentFlowTypes';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';

export function PaymentResultView({
  success,
  amount,
  paymentMethod,
  errorMessage,
  pspReference,
  onComplete,
  onRetry
}: PaymentResultViewProps) {
  
  // Get payment method display name
  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case 'ADYEN': return 'Card';
      case 'CASH': return 'Cash';
      case 'STRIPE': return 'Card';
      default: return 'Payment';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* SUCCESS STATE */}
      {success && (
        <>
          {/* Success Icon with Animation */}
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 15,
                delay: 0.1
              }}
            >
              <CheckCircle2 
                className="h-32 w-32 mx-auto mb-6" 
                style={{ color: '#10B981' }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-white/60 text-lg">
                {getPaymentMethodName()} payment completed
              </p>
            </motion.div>
          </div>

          {/* Payment Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="border-green-500/30"
              style={{
                ...styles.frostedGlassStyle,
                background: 'rgba(16, 185, 129, 0.1)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
              }}
            >
              <CardContent className="p-6 space-y-4">
                {/* Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Amount Paid:</span>
                  <span className="text-2xl font-bold text-green-500">
                    {safeCurrency(amount)}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Payment Method:</span>
                  <span className="font-semibold text-white">
                    {getPaymentMethodName()}
                  </span>
                </div>

                {/* PSP Reference (if available) */}
                {pspReference && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Reference:</span>
                      <span className="font-mono text-xs text-white/80">
                        {pspReference}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Complete Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={onComplete}
              className="w-full h-14 text-white font-bold text-lg"
              style={{
                ...styles.frostedGlassStyle,
                background: QSAITheme.purple.primary,
                boxShadow: effects.outerGlow('medium')
              }}
            >
              Complete Order
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>

          {/* Auto-complete message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-xs text-white/40"
          >
            Receipt will be printed and cart will be cleared
          </motion.div>
        </>
      )}

      {/* FAILURE STATE */}
      {!success && (
        <>
          {/* Error Icon with Animation */}
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 15,
                delay: 0.1
              }}
            >
              <XCircle 
                className="h-32 w-32 mx-auto mb-6" 
                style={{ color: '#EF4444' }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-white/60 text-lg">
                Unable to process payment
              </p>
            </motion.div>
          </div>

          {/* Error Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="border-red-500/30"
              style={{
                ...styles.frostedGlassStyle,
                background: 'rgba(239, 68, 68, 0.1)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
              }}
            >
              <CardContent className="p-6 space-y-4">
                {/* Error Message */}
                <div className="text-center">
                  <div className="text-red-400 font-semibold mb-2">Error Details</div>
                  <div className="text-white/80 text-sm">
                    {errorMessage || 'An unknown error occurred during payment processing'}
                  </div>
                </div>

                {/* Amount (for reference) */}
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Amount:</span>
                  <span className="font-semibold text-white">
                    {safeCurrency(amount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            {/* Retry Button */}
            <Button
              onClick={onRetry}
              className="w-full h-14 text-white font-bold text-lg"
              style={{
                ...styles.frostedGlassStyle,
                background: QSAITheme.purple.primary,
                boxShadow: effects.outerGlow('medium')
              }}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Try Again
            </Button>

            {/* Cancel Button */}
            <Button
              onClick={onComplete}
              variant="outline"
              className="w-full h-12 border-white/20 text-white/80 hover:bg-white/10"
              style={styles.frostedGlassStyle}
            >
              Cancel Payment
            </Button>
          </motion.div>

          {/* Help Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-xs text-white/40"
          >
            Need help? Contact your manager or check payment terminal
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
