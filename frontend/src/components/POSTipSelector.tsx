import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Heart, PoundSterling } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { safeCurrency, safeToFixed, isValidFinancialAmount } from '../utils/numberUtils';

export interface TipSelection {
  type: 'percentage' | 'custom' | 'none';
  amount: number; // Tip amount in pounds
  percentage?: number; // Original percentage if type is 'percentage'
}

interface POSTipSelectorProps {
  subtotal: number;
  onTipSelected: (tipSelection: TipSelection) => void;
  initialTip?: TipSelection;
}

/**
 * POS Tip Selection Component
 * Provides modern tip selection interface with percentage buttons and custom amount input
 */
export function POSTipSelector({
  subtotal,
  onTipSelected,
  initialTip
}: POSTipSelectorProps) {
  const [selectedTip, setSelectedTip] = useState<TipSelection>(
    initialTip || { type: 'none', amount: 0 }
  );
  const [customAmount, setCustomAmount] = useState<string>('');
  
  // Predefined tip percentages
  const tipPercentages = [10, 15, 20, 25];
  
  // Calculate tip amount for percentage
  const calculateTipAmount = (percentage: number): number => {
    if (!isValidFinancialAmount(subtotal)) return 0;
    return (subtotal * percentage) / 100;
  };
  
  // Handle percentage tip selection
  const handlePercentageTip = (percentage: number) => {
    const tipAmount = calculateTipAmount(percentage);
    const tip: TipSelection = {
      type: 'percentage',
      amount: tipAmount,
      percentage
    };
    setSelectedTip(tip);
    onTipSelected(tip);
  };
  
  // Handle custom tip amount
  const handleCustomTip = (value: string) => {
    setCustomAmount(value);
    const amount = parseFloat(value) || 0;
    
    if (isValidFinancialAmount(amount) && amount > 0) {
      const tip: TipSelection = {
        type: 'custom',
        amount
      };
      setSelectedTip(tip);
      onTipSelected(tip);
    } else {
      handleNoTip();
    }
  };
  
  // Handle no tip selection
  const handleNoTip = () => {
    const tip: TipSelection = {
      type: 'none',
      amount: 0
    };
    setSelectedTip(tip);
    onTipSelected(tip);
    setCustomAmount('');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Heart className="h-5 w-5 mr-2" style={{ color: QSAITheme.purple.primary }} />
          <h3 className="text-xl font-bold text-white">Add Tip</h3>
        </div>
        <p className="text-sm text-gray-400">
          Subtotal: <span className="font-semibold text-white">{safeCurrency(subtotal)}</span>
        </p>
      </div>
      
      {/* Percentage Tip Buttons */}
      <div>
        <Label className="text-white/80 text-sm mb-3 block">Quick Tip Percentages</Label>
        <div className="grid grid-cols-2 gap-3">
          {tipPercentages.map((percentage) => {
            const tipAmount = calculateTipAmount(percentage);
            const isSelected = selectedTip.type === 'percentage' && selectedTip.percentage === percentage;
            
            return (
              <motion.div
                key={percentage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handlePercentageTip(percentage)}
                  className={`w-full h-16 flex flex-col items-center justify-center transition-all duration-200 ${
                    isSelected 
                      ? 'text-white border-purple-500' 
                      : 'border-white/20 text-white/80 hover:border-purple-500/50'
                  }`}
                  style={isSelected 
                    ? { ...styles.frostedGlassStyle, background: QSAITheme.purple.primary, boxShadow: effects.outerGlow('medium') }
                    : { ...styles.frostedGlassStyle, '&:hover': { borderColor: QSAITheme.purple.primary + '80' } }
                  }
                >
                  <span className="text-lg font-bold">{percentage}%</span>
                  <span className="text-xs opacity-80">{safeCurrency(tipAmount)}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Custom Tip Amount */}
      <div className="space-y-3">
        <Label className="text-white/80 text-sm">Custom Tip Amount</Label>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={customAmount}
              onChange={(e) => handleCustomTip(e.target.value)}
              placeholder="0.00"
              className={`pl-9 text-white placeholder:text-gray-500 ${
                selectedTip.type === 'custom' 
                  ? 'border-purple-500 focus:border-purple-500 focus:ring-purple-500/20'
                  : 'border-white/20 focus:border-purple-500/50'
              }`}
              style={{
                ...styles.frostedGlassStyle,
                background: selectedTip.type === 'custom' 
                  ? `rgba(124, 93, 250, 0.1)` 
                  : styles.frostedGlassStyle.background
              }}
            />
          </div>
          {selectedTip.type === 'custom' && selectedTip.amount > 0 && (
            <Badge 
              variant="secondary" 
              className="text-white"
              style={{ backgroundColor: QSAITheme.purple.primary }}
            >
              {safeCurrency(selectedTip.amount)}
            </Badge>
          )}
        </div>
      </div>
      
      {/* No Tip Option */}
      <div>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Button
            variant={selectedTip.type === 'none' ? "default" : "outline"}
            onClick={handleNoTip}
            className={`w-full transition-all duration-200 ${
              selectedTip.type === 'none'
                ? 'text-white border-gray-500'
                : 'border-white/20 text-white/80 hover:border-white/30'
            }`}
            style={selectedTip.type === 'none' 
              ? { ...styles.frostedGlassStyle, background: '#374151' } 
              : styles.frostedGlassStyle
            }
          >
            No Tip
          </Button>
        </motion.div>
      </div>
      
      {/* Total with Tip Display */}
      <AnimatePresence>
        {selectedTip.amount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-white/10"
          >
            <Card style={styles.frostedGlassStyle}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white/80">Total with Tip:</span>
                  <span className="font-bold" style={{ color: QSAITheme.purple.primary }}>
                    {safeCurrency(subtotal + selectedTip.amount)}
                  </span>
                </div>
                <div className="text-sm text-white/60 mt-1">
                  Tip: {safeCurrency(selectedTip.amount)}
                  {selectedTip.type === 'percentage' && selectedTip.percentage && (
                    <span> ({selectedTip.percentage}%)</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default POSTipSelector;
