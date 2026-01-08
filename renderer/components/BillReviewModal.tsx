import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Printer, X, CreditCard, Banknote, SplitSquareHorizontal, Users, Calculator } from 'lucide-react';
import { AppApisTableOrdersOrderItem } from 'types';
import { QSAITheme } from 'utils/QSAIDesign';
import { calculateSubtotal } from 'utils/orderCalculations';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  orderItems: OrderItem[];
  linkedTables?: number[];
  onPrintFinalBill: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'split';
type SplitMode = 'equal' | 'custom' | 'by-item';

interface SplitPayment {
  id: string;
  amount: number;
  method: 'cash' | 'card';
  description: string;
}

/**
 * Enhanced Bill Review modal with split billing and flexible payment options
 * Professional order breakdown for final billing with purple gradients and dark theme
 */
export function BillReviewModal({
  isOpen,
  onClose,
  tableNumber,
  orderItems,
  linkedTables = [],
  onPrintFinalBill
}: Props) {
  // State for payment handling
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [numberOfSplits, setNumberOfSplits] = useState(2);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: number }>({});
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Calculate totals
  const subtotal = calculateSubtotal(orderItems);
  const tax = 0; // VAT is already included in menu prices
  const total = subtotal; // No VAT addition since prices are VAT-inclusive
  
  // Format linked tables for display
  const allTables = [tableNumber, ...linkedTables].sort((a, b) => a - b);
  const tableDisplay = allTables.length > 1 
    ? `Tables ${allTables.join(', ')}`
    : `Table ${tableNumber}`;
    
  // Calculate split amounts
  const calculateSplitAmount = (splitIndex: number): number => {
    if (splitMode === 'equal') {
      return total / numberOfSplits;
    }
    if (splitMode === 'custom') {
      return customAmounts[`split-${splitIndex}`] || 0;
    }
    return 0; // by-item mode handled separately
  };
  
  // Validate payment amounts
  const validatePayment = (): boolean => {
    if (paymentMethod === 'split') {
      if (splitMode === 'equal') {
        return numberOfSplits >= 2 && numberOfSplits <= 10;
      }
      if (splitMode === 'custom') {
        const totalCustom = Object.values(customAmounts).reduce((sum, amount) => sum + (amount || 0), 0);
        return Math.abs(totalCustom - total) < 0.01; // Allow for rounding
      }
    }
    return true;
  };
  
  const handleProcessPayment = async () => {
    if (!validatePayment()) {
      toast.error('Payment amounts do not match the total bill');
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let successMessage = '';
      if (paymentMethod === 'cash') {
        successMessage = `Cash payment of £${total.toFixed(2)} processed successfully`;
      } else if (paymentMethod === 'card') {
        successMessage = `Card payment of £${total.toFixed(2)} processed successfully`;
      } else {
        const splitCount = splitMode === 'equal' ? numberOfSplits : Object.keys(customAmounts).length;
        successMessage = `Split payment (${splitCount} parts) processed successfully`;
      }
      
      toast.success(successMessage);
      onPrintFinalBill();
      onClose();
    } catch (error) {
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handlePrintBill = () => {
    onPrintFinalBill();
    toast.success('Final bill printed successfully');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg border-0 p-0 overflow-hidden max-h-[90vh]"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.background.primary} 0%, ${QSAITheme.background.secondary} 100%)`,
          border: `1px solid ${QSAITheme.border.medium}`,
          borderBottom: `2px solid ${QSAITheme.purple.primary}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <DialogHeader 
          className="px-6 py-4 border-b"
          style={{
            borderColor: QSAITheme.border.medium,
            background: `linear-gradient(135deg, ${QSAITheme.background.dark} 0%, ${QSAITheme.background.primary} 100%)`
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                boxShadow: `0 4px 12px ${QSAITheme.purple.glow}`
              }}
            >
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold" style={{ color: QSAITheme.text.primary }}>
                Final Bill & Payment
              </DialogTitle>
              <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                {tableDisplay}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Order Summary */}
          <div className="p-6 space-y-4">
            {/* Items List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: QSAITheme.text.accent }}>
                Order Items ({orderItems.length})
              </h3>
              
              <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-track-gray-800"
                style={{
                  scrollbarColor: 'rgba(139, 21, 56, 0.6) rgba(26, 26, 26, 0.5)'
                }}
              >
                {orderItems.map((item, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center p-3 rounded-lg border"
                    style={{
                      backgroundColor: QSAITheme.background.tertiary,
                      borderColor: QSAITheme.border.light
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: QSAITheme.text.primary }}>
                        {item.name}
                      </p>
                      {item.customizations && item.customizations.length > 0 && (
                        <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                          {item.customizations.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                        {item.quantity} × £{item.price.toFixed(2)}
                      </p>
                      <p className="font-semibold" style={{ color: QSAITheme.text.primary }}>
                        £{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bill Totals */}
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: QSAITheme.background.dark,
                borderColor: QSAITheme.border.accent,
                background: `linear-gradient(135deg, ${QSAITheme.background.dark} 0%, ${QSAITheme.background.tertiary} 100%)`
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: QSAITheme.text.muted }}>Subtotal:</span>
                  <span style={{ color: QSAITheme.text.primary }}>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: QSAITheme.text.muted }}>VAT (20%):</span>
                  <span style={{ color: QSAITheme.text.primary }}>£{tax.toFixed(2)}</span>
                </div>
                <div 
                  className="flex justify-between text-lg font-bold pt-2 border-t"
                  style={{ borderColor: QSAITheme.border.medium }}
                >
                  <span style={{ color: QSAITheme.text.primary }}>Total:</span>
                  <span style={{ color: QSAITheme.purple.primary }}>£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: QSAITheme.text.accent }}>
                Payment Method
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className="h-12 flex flex-col gap-1"
                  style={{
                    backgroundColor: paymentMethod === 'cash' ? QSAITheme.purple.primary : 'transparent',
                    borderColor: paymentMethod === 'cash' ? QSAITheme.purple.primary : QSAITheme.border.medium,
                    color: paymentMethod === 'cash' ? 'white' : QSAITheme.text.primary
                  }}
                >
                  <Banknote className="w-4 h-4" />
                  <span className="text-xs">Cash</span>
                </Button>
                
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="h-12 flex flex-col gap-1"
                  style={{
                    backgroundColor: paymentMethod === 'card' ? QSAITheme.purple.primary : 'transparent',
                    borderColor: paymentMethod === 'card' ? QSAITheme.purple.primary : QSAITheme.border.medium,
                    color: paymentMethod === 'card' ? 'white' : QSAITheme.text.primary
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Card</span>
                </Button>
                
                <Button
                  variant={paymentMethod === 'split' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('split')}
                  className="h-12 flex flex-col gap-1"
                  style={{
                    backgroundColor: paymentMethod === 'split' ? QSAITheme.purple.primary : 'transparent',
                    borderColor: paymentMethod === 'split' ? QSAITheme.purple.primary : QSAITheme.border.medium,
                    color: paymentMethod === 'split' ? 'white' : QSAITheme.text.primary
                  }}
                >
                  <SplitSquareHorizontal className="w-4 h-4" />
                  <span className="text-xs">Split</span>
                </Button>
              </div>
            </div>
            
            {/* Split Payment Options */}
            {paymentMethod === 'split' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold" style={{ color: QSAITheme.text.accent }}>
                  Split Options
                </h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={splitMode === 'equal' ? 'default' : 'outline'}
                    onClick={() => setSplitMode('equal')}
                    className="h-10 text-xs"
                    style={{
                      backgroundColor: splitMode === 'equal' ? QSAITheme.purple.primary : 'transparent',
                      borderColor: splitMode === 'equal' ? QSAITheme.purple.primary : QSAITheme.border.medium,
                      color: splitMode === 'equal' ? 'white' : QSAITheme.text.primary
                    }}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Equal Split
                  </Button>
                  
                  <Button
                    variant={splitMode === 'custom' ? 'default' : 'outline'}
                    onClick={() => setSplitMode('custom')}
                    className="h-10 text-xs"
                    style={{
                      backgroundColor: splitMode === 'custom' ? QSAITheme.purple.primary : 'transparent',
                      borderColor: splitMode === 'custom' ? QSAITheme.purple.primary : QSAITheme.border.medium,
                      color: splitMode === 'custom' ? 'white' : QSAITheme.text.primary
                    }}
                  >
                    <Calculator className="w-3 h-3 mr-1" />
                    Custom
                  </Button>
                </div>
                
                {/* Equal Split Configuration */}
                {splitMode === 'equal' && (
                  <div className="space-y-2">
                    <label className="text-sm" style={{ color: QSAITheme.text.muted }}>
                      Number of people: {numberOfSplits}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={numberOfSplits}
                      onChange={(e) => setNumberOfSplits(parseInt(e.target.value))}
                      className="w-full"
                      style={{ accentColor: QSAITheme.purple.primary }}
                    />
                    <div className="text-center p-2 rounded border" style={{ backgroundColor: QSAITheme.background.tertiary, borderColor: QSAITheme.border.light }}>
                      <span className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                        £{(total / numberOfSplits).toFixed(2)} per person
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Custom Split Configuration */}
                {splitMode === 'custom' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2].map(i => (
                        <div key={i}>
                          <label className="text-xs" style={{ color: QSAITheme.text.muted }}>Person {i}</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={total}
                            value={customAmounts[`split-${i}`] || ''}
                            onChange={(e) => setCustomAmounts(prev => ({
                              ...prev,
                              [`split-${i}`]: parseFloat(e.target.value) || 0
                            }))}
                            className="w-full p-2 text-xs rounded border"
                            style={{
                              backgroundColor: QSAITheme.background.tertiary,
                              borderColor: QSAITheme.border.light,
                              color: QSAITheme.text.primary
                            }}
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-center text-xs" style={{ color: QSAITheme.text.muted }}>
                      Remaining: £{Math.max(0, total - Object.values(customAmounts).reduce((sum, amount) => sum + (amount || 0), 0)).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePrintBill}
                className="flex-1 h-12 font-medium border-2 transition-all duration-200"
                style={{
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.muted,
                  backgroundColor: 'transparent'
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Only
              </Button>
              
              <Button
                onClick={handleProcessPayment}
                disabled={processingPayment || !validatePayment()}
                className="flex-1 h-12 font-semibold text-white transition-all duration-200"
                style={{
                  background: processingPayment ? QSAITheme.background.tertiary : `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                  boxShadow: processingPayment ? 'none' : `0 4px 12px ${QSAITheme.purple.glow}`,
                  border: 'none',
                  opacity: processingPayment || !validatePayment() ? 0.6 : 1
                }}
              >
                {processingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    Process Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BillReviewModal;
