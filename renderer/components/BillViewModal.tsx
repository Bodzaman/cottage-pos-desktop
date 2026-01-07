import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Receipt, CreditCard, Users, User, X } from 'lucide-react';
import { AppApisTableOrdersOrderItem, CustomerTab } from 'types';
import { QSAITheme } from 'utils/QSAIDesign';
import { calculateBillSummary, calculatePaymentAmount } from 'utils/billCalculations';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  orderItems: AppApisTableOrdersOrderItem[];
  customerTabs: CustomerTab[];
  onProcessPayment: (customerIds: (string | null)[], amount: number) => Promise<void>;
  onPrintReceipt?: () => void;
}

type PaymentMode = 'pay-all' | 'split-even' | 'individual';

/**
 * Professional Bill View with customer-grouped breakdown
 * Shows itemized orders per customer with flexible payment options
 */
export function BillViewModal({
  isOpen,
  onClose,
  tableNumber,
  orderItems,
  customerTabs,
  onProcessPayment,
  onPrintReceipt
}: Props) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('pay-all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string | null>>(new Set());
  const [processingPayment, setProcessingPayment] = useState(false);

  // Calculate bill summary
  const billSummary = useMemo(() => {
    return calculateBillSummary(orderItems, customerTabs, {
      taxRate: 0, // VAT already included in menu prices
      serviceChargePercent: 0 // No service charge by default
    });
  }, [orderItems, customerTabs]);

  // Calculate payment amount based on mode
  const paymentAmount = useMemo(() => {
    if (paymentMode === 'pay-all') {
      return billSummary.grandTotal;
    }
    if (paymentMode === 'split-even') {
      return billSummary.grandTotal / billSummary.customerBreakdowns.length;
    }
    if (paymentMode === 'individual') {
      return calculatePaymentAmount(billSummary, {
        type: 'individual',
        customerIds: Array.from(selectedCustomerIds),
        amount: 0
      });
    }
    return 0;
  }, [paymentMode, billSummary, selectedCustomerIds]);

  // Toggle customer selection for individual payment
  const toggleCustomerSelection = (customerId: string | null) => {
    const newSelection = new Set(selectedCustomerIds);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomerIds(newSelection);
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (paymentMode === 'individual' && selectedCustomerIds.size === 0) {
      toast.error('Please select at least one customer to process payment');
      return;
    }

    setProcessingPayment(true);
    try {
      let customerIdsToPay: (string | null)[];

      if (paymentMode === 'pay-all') {
        // All customers
        customerIdsToPay = billSummary.customerBreakdowns.map(b => b.customerId);
      } else if (paymentMode === 'split-even') {
        // All customers split evenly
        customerIdsToPay = billSummary.customerBreakdowns.map(b => b.customerId);
      } else {
        // Selected customers only
        customerIdsToPay = Array.from(selectedCustomerIds);
      }

      await onProcessPayment(customerIdsToPay, paymentAmount);

      // Print receipt if available
      if (onPrintReceipt) {
        onPrintReceipt();
      }

      toast.success(`Payment processed: £${paymentAmount.toFixed(2)}`);
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl border-0 p-0 overflow-hidden max-h-[90vh]"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.background.primary} 0%, ${QSAITheme.background.secondary} 100%)`,
          border: `1px solid ${QSAITheme.border.medium}`,
          borderBottom: `2px solid ${QSAITheme.purple.primary}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <DialogHeader
          className="px-6 py-4 border-b"
          style={{
            borderColor: QSAITheme.border.medium,
            background: `linear-gradient(135deg, ${QSAITheme.background.dark} 0%, ${QSAITheme.background.primary} 100%)`
          }}
        >
          <div className="flex items-center justify-between">
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
                  Table {tableNumber} - Bill Summary
                </DialogTitle>
                <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                  {billSummary.customerBreakdowns.length} {billSummary.customerBreakdowns.length === 1 ? 'customer' : 'customers'}
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="w-4 h-4" style={{ color: QSAITheme.text.muted }} />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)]">
          <div className="p-6 space-y-6">
            {/* Customer breakdowns */}
            {billSummary.customerBreakdowns.map((breakdown, index) => (
              <div
                key={breakdown.customerId || `table-${index}`}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: QSAITheme.background.card,
                  borderColor: paymentMode === 'individual' && selectedCustomerIds.has(breakdown.customerId)
                    ? QSAITheme.purple.primary
                    : QSAITheme.border.medium
                }}
              >
                {/* Customer header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: QSAITheme.border.light }}>
                  <div className="flex items-center gap-2">
                    {paymentMode === 'individual' && (
                      <Checkbox
                        checked={selectedCustomerIds.has(breakdown.customerId)}
                        onCheckedChange={() => toggleCustomerSelection(breakdown.customerId)}
                      />
                    )}
                    <User className="w-4 h-4" style={{ color: QSAITheme.purple.light }} />
                    <span className="font-semibold" style={{ color: QSAITheme.text.primary }}>
                      {breakdown.customerName}
                    </span>
                    <span className="text-xs" style={{ color: QSAITheme.text.muted }}>
                      ({breakdown.itemCount} {breakdown.itemCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <div className="font-bold" style={{ color: QSAITheme.text.primary }}>
                    £{breakdown.subtotal.toFixed(2)}
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  {breakdown.items.map((item, itemIndex) => (
                    <div
                      key={`${item.id}-${itemIndex}`}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <div className="flex-1 min-w-0">
                        <span style={{ color: QSAITheme.text.secondary }}>
                          {item.quantity}x {item.name}
                        </span>
                        {item.variant && (
                          <span className="ml-2 text-xs" style={{ color: QSAITheme.text.muted }}>({item.variant})</span>
                        )}
                      </div>
                      <div className="font-medium ml-2" style={{ color: QSAITheme.text.primary }}>
                        £{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Totals section */}
            <div
              className="p-4 rounded-lg border-2"
              style={{
                backgroundColor: QSAITheme.background.dark,
                borderColor: QSAITheme.purple.primary
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: QSAITheme.text.secondary }}>Table Subtotal:</span>
                  <span className="font-medium" style={{ color: QSAITheme.text.primary }}>
                    £{billSummary.tableSubtotal.toFixed(2)}
                  </span>
                </div>
                {billSummary.tax > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: QSAITheme.text.secondary }}>Tax (20%):</span>
                    <span className="font-medium" style={{ color: QSAITheme.text.primary }}>
                      £{billSummary.tax.toFixed(2)}
                    </span>
                  </div>
                )}
                {billSummary.serviceCharge > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: QSAITheme.text.secondary }}>Service Charge:</span>
                    <span className="font-medium" style={{ color: QSAITheme.text.primary }}>
                      £{billSummary.serviceCharge.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="h-px my-2" style={{ backgroundColor: QSAITheme.border.medium }} />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold" style={{ color: QSAITheme.text.primary }}>GRAND TOTAL:</span>
                  <span
                    className="text-xl font-bold"
                    style={{
                      color: QSAITheme.purple.light,
                      textShadow: `0 0 8px ${QSAITheme.purple.glow}`
                    }}
                  >
                    £{billSummary.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment options footer */}
        <div
          className="p-6 border-t space-y-4"
          style={{
            borderColor: QSAITheme.border.medium,
            background: QSAITheme.background.dark
          }}
        >
          {/* Payment mode selector */}
          <div className="flex items-center gap-2">
            <Button
              variant={paymentMode === 'pay-all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMode('pay-all')}
              className="flex-1"
              style={paymentMode === 'pay-all' ? {
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                color: 'white'
              } : {}}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay All
            </Button>
            <Button
              variant={paymentMode === 'split-even' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMode('split-even')}
              className="flex-1"
              style={paymentMode === 'split-even' ? {
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                color: 'white'
              } : {}}
            >
              <Users className="w-4 h-4 mr-2" />
              Split Even
            </Button>
            <Button
              variant={paymentMode === 'individual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMode('individual')}
              className="flex-1"
              style={paymentMode === 'individual' ? {
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                color: 'white'
              } : {}}
            >
              <User className="w-4 h-4 mr-2" />
              Individual
            </Button>
          </div>

          {/* Payment amount display */}
          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.purple.primary}20 0%, ${QSAITheme.purple.light}20 100%)`,
              border: `1px solid ${QSAITheme.purple.primary}`
            }}
          >
            {paymentMode === 'split-even' && (
              <p className="text-sm mb-1" style={{ color: QSAITheme.text.muted }}>
                £{paymentAmount.toFixed(2)} per person
              </p>
            )}
            {paymentMode === 'individual' && (
              <p className="text-sm mb-1" style={{ color: QSAITheme.text.muted }}>
                {selectedCustomerIds.size} customer{selectedCustomerIds.size !== 1 ? 's' : ''} selected
              </p>
            )}
            <p className="text-lg font-bold" style={{ color: QSAITheme.text.primary }}>
              Payment Amount: £{paymentAmount.toFixed(2)}
            </p>
          </div>

          {/* Process payment button */}
          <Button
            onClick={handlePayment}
            disabled={processingPayment || (paymentMode === 'individual' && selectedCustomerIds.size === 0)}
            className="w-full py-6 text-lg font-bold"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
              color: 'white',
              boxShadow: `0 4px 16px ${QSAITheme.purple.glow}`
            }}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {processingPayment ? 'Processing...' : `Process Payment - £${paymentAmount.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
