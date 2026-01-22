/**
 * TipSelectionView - Tip selection step in unified payment flow
 * Reuses POSTipSelector component with Continue/Back navigation
 * Part of PaymentFlowOrchestrator state machine
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { TipSelectionViewProps } from '../utils/paymentFlowTypes';
import POSTipSelector, { TipSelection } from './POSTipSelector';
import { QSAITheme, styles } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';

export function TipSelectionView({
  orderTotal,
  currentTipAmount,
  onTipSelected,
  onContinue,
  onBack
}: TipSelectionViewProps) {
  // Local state for tip selection
  const [selectedTip, setSelectedTip] = useState<TipSelection>({
    type: currentTipAmount > 0 ? 'custom' : 'none',
    amount: currentTipAmount
  });

  // Handle tip selection from POSTipSelector
  const handleTipChange = (tip: TipSelection) => {
    setSelectedTip(tip);
    onTipSelected(tip.amount);
  };

  // Calculate total with tip
  const totalWithTip = orderTotal + selectedTip.amount;

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
        <h2 className="text-2xl font-bold text-white mb-2">Add Gratuity</h2>
        <p className="text-sm text-white/60">
          Would you like to add a tip for excellent service?
        </p>
      </div>

      {/* Tip Selector */}
      <POSTipSelector
        subtotal={orderTotal}
        onTipSelected={handleTipChange}
        initialTip={selectedTip}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-white/10">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-white/20 text-white/80 hover:bg-white/10 h-12"
          style={styles.frostedGlassStyle}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onContinue}
          className="flex-1 h-12 text-white font-semibold"
          style={{
            ...styles.frostedGlassStyle,
            background: QSAITheme.purple.primary
          }}
        >
          Continue to Payment
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Total Summary */}
      {selectedTip.amount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-center pt-4 border-t border-white/10"
        >
          <div className="text-sm text-white/60">New Total</div>
          <div className="text-3xl font-bold" style={{ color: QSAITheme.purple.primary }}>
            {safeCurrency(totalWithTip)}
          </div>
          <div className="text-xs text-white/40 mt-1">
            Includes {safeCurrency(selectedTip.amount)} tip
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
