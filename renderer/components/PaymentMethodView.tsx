/**
 * PaymentMethodView - Payment method selection step in unified payment flow
 * Shows CASH and ADYEN payment options with totals
 * Part of PaymentFlowOrchestrator state machine
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Banknote, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { PaymentMethodViewProps } from '../utils/paymentFlowTypes';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';

export function PaymentMethodView({
  orderTotal,
  tipAmount,
  totalWithTip,
  onSelectPaymentMethod,
  onBack,
  availableMethods = ['CASH', 'ADYEN'] // Default to CASH and ADYEN
}: PaymentMethodViewProps) {
  // Payment method configurations
  const paymentMethods = [
    {
      id: 'CASH' as const,
      name: 'Cash',
      description: 'Accept cash payment',
      icon: Banknote,
      available: availableMethods.includes('CASH')
    },
    {
      id: 'ADYEN' as const,
      name: 'Card Payment',
      description: 'Credit/Debit card via Adyen',
      icon: CreditCard,
      available: availableMethods.includes('ADYEN')
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select Payment Method</h2>
        <p className="text-sm text-white/60">
          Choose how the customer will pay
        </p>
      </div>

      {/* Total Summary Card */}
      <Card 
        className="border-purple-500/30"
        style={{
          ...styles.frostedGlassStyle,
          background: 'rgba(91, 33, 182, 0.1)',
          boxShadow: effects.outerGlow('subtle')
        }}
      >
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-white/80">
              <span>Subtotal:</span>
              <span className="font-semibold">{safeCurrency(orderTotal)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between items-center text-white/80">
                <span>Tip:</span>
                <span className="font-semibold">{safeCurrency(tipAmount)}</span>
              </div>
            )}
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-white">Total:</span>
              <span 
                className="text-3xl font-bold"
                style={{ color: QSAITheme.purple.primary }}
              >
                {safeCurrency(totalWithTip)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Buttons */}
      <div className="space-y-4">
        {paymentMethods.filter(method => method.available).map((method) => {
          const Icon = method.icon;
          
          return (
            <motion.div
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => onSelectPaymentMethod(method.id)}
                className="w-full h-20 flex items-center justify-between p-6 border-white/20 hover:border-purple-500/50 transition-all duration-200"
                variant="outline"
                style={{
                  ...styles.frostedGlassStyle,
                  '&:hover': {
                    background: 'rgba(91, 33, 182, 0.1)',
                    borderColor: QSAITheme.purple.primary
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{
                      background: 'rgba(91, 33, 182, 0.2)',
                      border: `1px solid ${QSAITheme.purple.primary}40`
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">{method.name}</div>
                    <div className="text-sm text-white/60">{method.description}</div>
                  </div>
                </div>
                <CreditCard className="h-5 w-5 text-white/40" />
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full border-white/20 text-white/80 hover:bg-white/10 h-12"
          style={styles.frostedGlassStyle}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {tipAmount > 0 ? 'Tip Selection' : 'Order Confirmation'}
        </Button>
      </div>

      {/* Payment Info Notice */}
      <div className="text-center text-xs text-white/40 pt-2">
        All transactions are secure and encrypted
      </div>
    </motion.div>
  );
}
