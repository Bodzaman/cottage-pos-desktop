import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, X } from 'lucide-react';
import { QSAITheme } from '../utils/QSAIDesign';
import { PaymentFlowMode } from '../utils/paymentFlowTypes';

interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: PaymentFlowMode) => void; // NEW: Unified handler
  orderNumber?: string;
  orderTotal: number;
  orderType: 'WAITING' | 'COLLECTION' | 'DELIVERY';
}

/**
 * PaymentChoiceModal
 * 
 * Allows staff to choose between immediate payment or deferred payment
 * for WAITING/COLLECTION/DELIVERY orders.
 * 
 * ARCHITECTURE:
 * - Both options route through PaymentFlowOrchestrator
 * - "Take Payment Now" → mode="payment" → Full payment flow
 * - "Pay on Collection/Delivery" → mode="pay-later" → Thermal preview → Print directly
 * - No nested confirmation dialogs
 * - Clean separation of concerns
 */
export function PaymentChoiceModal({
  isOpen,
  onClose,
  onSelectMode,
  orderNumber,
  orderTotal,
  orderType
}: PaymentChoiceModalProps) {

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const getPayLaterLabel = () => {
    switch (orderType) {
      case 'COLLECTION':
        return 'Pay on Collection';
      case 'DELIVERY':
        return 'Pay on Delivery';
      case 'WAITING':
        return 'Pay When Ready';
      default:
        return 'Pay Later';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.dark} 100%)`,
          border: `1px solid ${QSAITheme.purple.primary}40`,
          color: QSAITheme.text.primary
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-2xl font-bold text-center"
            style={{ color: QSAITheme.text.primary }}
          >
            Process Order {orderNumber && `#${orderNumber}`}
          </DialogTitle>
          <DialogDescription 
            className="text-center text-lg pt-2"
            style={{ color: QSAITheme.text.secondary }}
          >
            Total: <span className="font-bold" style={{ color: QSAITheme.purple.primary }}>{formatCurrency(orderTotal)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <p 
            className="text-center font-medium"
            style={{ color: QSAITheme.text.primary }}
          >
            Choose payment option:
          </p>

          {/* Take Payment Now Option */}
          <button
            onClick={() => onSelectMode('payment')}
            className="w-full p-6 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.primary}10 100%)`,
              borderColor: QSAITheme.purple.primary,
              boxShadow: `0 4px 12px ${QSAITheme.purple.primary}30`
            }}
          >
            <div className="flex items-center justify-center space-x-3 mb-2">
              <CreditCard className="w-6 h-6" style={{ color: QSAITheme.purple.primary }} />
              <span className="text-xl font-bold" style={{ color: QSAITheme.text.primary }}>
                Take Payment Now
              </span>
            </div>
            <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>
              Review order → Process payment → Print receipt
            </p>
          </button>

          {/* Pay Later Option */}
          <button
            onClick={() => onSelectMode('pay-later')}
            className="w-full p-6 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.background.card} 0%, ${QSAITheme.background.secondary} 100%)`,
              borderColor: `${QSAITheme.text.secondary}40`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Clock className="w-6 h-6" style={{ color: QSAITheme.text.secondary }} />
              <span className="text-xl font-bold" style={{ color: QSAITheme.text.primary }}>
                {getPayLaterLabel()}
              </span>
            </div>
            <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>
              Review order → Print receipt → Pay later
            </p>
          </button>

          {/* Cancel Button */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
            style={{
              borderColor: `${QSAITheme.text.secondary}40`,
              color: QSAITheme.text.secondary
            }}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
