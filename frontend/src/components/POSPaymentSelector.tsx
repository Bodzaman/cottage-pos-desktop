


import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { POSButton } from './POSButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote, Smartphone, CheckCircle, Calculator, Minus, Plus, AlertTriangle } from "lucide-react";
import { styles } from "../utils/QSAIDesign";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { OrderItem } from "../utils/menuTypes";
import brain from 'brain';

// Payment method types
export type PaymentMethodType = 'CARD' | 'CASH' | 'CUSTOMER_PAYS' | 'ALREADY_PAID' | 'SMS_PAYMENT_LINK' | 'QR_AT_DOOR';

// Payment result interface
export interface PaymentResult {
  method: PaymentMethodType;
  amount: number;
  change?: number;
  cashReceived?: number;
  reference?: string;
  tipAmount?: number;
  totalWithTip?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  orderTotal: number;
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  onPaymentConfirm: (result: PaymentResult) => void;
  tipAmount?: number;
  totalWithTip?: number;
  onInitiateCardPayment?: () => void;
}

/**
 * Get required customer data fields based on order type
 */
const getRequiredDataForOrderType = (orderType: string) => {
  switch (orderType) {
    case 'DINE-IN':
    case 'WAITING':
      // Only order items + amount required
      // Optional: customerName for personalization
      return {
        required: [],
        optional: ['customerName']
      };
      
    case 'COLLECTION':
      // Only order items + amount required
      // Optional: customerPhone for pickup notifications, customerName
      return {
        required: [],
        optional: ['customerPhone', 'customerName']
      };
      
    case 'DELIVERY':
      // Order + amount + delivery address + phone required
      return {
        required: ['customerAddress', 'customerPhone'],
        optional: ['customerName']
      };
      
    default:
      return {
        required: [],
        optional: ['customerName', 'customerPhone', 'customerAddress']
      };
  }
};

/**
 * Validate if all required customer data is present for the order type
 */
const validateRequiredData = (orderType: string, customerName: string | undefined, customerPhone: string | undefined, customerAddress: string | undefined) => {
  const requirements = getRequiredDataForOrderType(orderType);
  const missingFields: string[] = [];
  
  requirements.required.forEach(field => {
    switch (field) {
      case 'customerName':
        if (!customerName || customerName.trim() === '') {
          missingFields.push('Customer Name');
        }
        break;
      case 'customerPhone':
        if (!customerPhone || customerPhone.trim() === '') {
          missingFields.push('Customer Phone');
        }
        break;
      case 'customerAddress':
        if (!customerAddress || customerAddress.trim() === '') {
          missingFields.push('Delivery Address');
        }
        break;
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    requirements
  };
};

/**
 * POS Payment Selection Component - Recreated from scratch
 * Provides payment method selection with cash change calculation
 * Integrates with existing POS design system and workflow
 */
export function POSPaymentSelector({
  isOpen,
  onClose,
  orderItems,
  orderTotal,
  orderType,
  tableNumber,
  customerName,
  customerPhone,
  customerAddress,
  onPaymentConfirm,
  tipAmount = 0,
  totalWithTip,
  onInitiateCardPayment
}: Props) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use totalWithTip if provided, otherwise use orderTotal
  const finalTotal = totalWithTip || orderTotal;
  
  // Calculate change for cash payments
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - finalTotal;
  const isValidCash = cashAmount >= finalTotal;

  // Get validation results
  const validation = validateRequiredData(orderType, customerName, customerPhone, customerAddress);
  const requirements = validation.requirements;

  // Payment method configurations
  const paymentMethods = [
    {
      type: 'CASH' as PaymentMethodType,
      label: 'Cash Payment',
      icon: Banknote,
      description: orderType === 'DELIVERY' ? 'Cash on delivery' : 'Accept cash with change calculation',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/30'
    },
    {
      type: 'CARD' as PaymentMethodType,
      label: 'Card Payment',
      icon: CreditCard,
      description: orderType === 'DELIVERY' ? 'Manual card entry at door' : 'Process card payment via Stripe',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/30'
    },
    // Delivery-specific payment methods
    ...(orderType === 'DELIVERY' ? [
      {
        type: 'SMS_PAYMENT_LINK' as PaymentMethodType,
        label: 'SMS Payment Link',
        icon: Smartphone,
        description: 'Send payment link before delivery',
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10',
        borderColor: 'border-purple-400/30'
      },
      {
        type: 'QR_AT_DOOR' as PaymentMethodType,
        label: 'QR Code at Door',
        icon: Smartphone,
        description: 'Show QR code when driver arrives',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/10',
        borderColor: 'border-cyan-400/30'
      }
    ] : []),
    // Standard customer payment option for non-delivery
    ...(orderType !== 'DELIVERY' ? [
      {
        type: 'CUSTOMER_PAYS' as PaymentMethodType,
        label: 'Customer Pays',
        icon: Smartphone,
        description: 'Send QR code/link to customer',
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10',
        borderColor: 'border-purple-400/30'
      }
    ] : []),
    {
      type: 'ALREADY_PAID' as PaymentMethodType,
      label: 'Already Paid',
      icon: CheckCircle,
      description: orderType === 'DELIVERY' ? 'Pre-paid online order' : 'Mark as pre-paid (online orders)',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30'
    }
  ];

  // Handle payment method selection
  const handleMethodSelect = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setCashReceived('');
  };

  // Handle cash amount input
  const handleCashInput = (value: string) => {
    // Only allow numeric input with up to 2 decimal places
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) return; // Only one decimal point
    if (parts[1] && parts[1].length > 2) return; // Max 2 decimal places
    setCashReceived(numericValue);
  };

  // Quick cash amount buttons
  const quickAmounts = [
    finalTotal, // Exact amount
    Math.ceil(finalTotal / 5) * 5, // Round to nearest £5
    Math.ceil(finalTotal / 10) * 10, // Round to nearest £10
    finalTotal + 10 // Add £10
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount > finalTotal);

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    
    if (!selectedMethod) {
      return;
    }

    setIsProcessing(true);

    try {
      switch (selectedMethod) {
        case 'CASH':
          if (!isValidCash) {
            toast.error('Cash amount must be at least the order total');
            return;
          }
          
          // Record cash payment in our system
          try {
            // TODO: Update Brain SDK to include create_payment_intent2 endpoint
            const cashPaymentResponse = await (brain as any).create_payment_intent2({
              amount: Math.round(finalTotal * 100), // Convert to cents
              currency: 'gbp',
              payment_method: 'cash',
              metadata: {
                order_type: orderType,
                table_number: tableNumber?.toString() || '',
                customer_name: customerName || ''
              }
            });

            const cashResult = await cashPaymentResponse.json();

            onPaymentConfirm({
              method: 'CASH',
              amount: finalTotal,
              cashReceived: cashAmount,
              change: change,
              reference: cashResult.id || `CASH-${Date.now()}`,
              tipAmount,
              totalWithTip: finalTotal
            });

            toast.success('Cash payment recorded successfully');
          } catch (error) {
            console.error('Failed to record cash payment:', error);
            // Still allow local processing if API fails
            onPaymentConfirm({
              method: 'CASH',
              amount: finalTotal,
              cashReceived: cashAmount,
              change: change,
              reference: `CASH-LOCAL-${Date.now()}`,
              tipAmount,
              totalWithTip: finalTotal
            });
            toast.success('Cash payment processed (local recording)');
          }
          break;

        case 'CARD':
          // Use parent callback to initiate card payment instead of internal state
          if (onInitiateCardPayment) {
            onInitiateCardPayment();
          } else {
            toast.error('Card payment not available');
          }
          return; // Exit early without processing further

        case 'SMS_PAYMENT_LINK':
          // For delivery orders - create checkout session and send SMS
          try {
            const smsResponse = await (brain as any).create_checkout_session({
              order_type: orderType,
              amount: Math.round(finalTotal * 100),
              currency: 'gbp',
              customer_phone: customerPhone || '',
              customer_name: customerName || ''
            });

            const smsResult = await smsResponse.json();

            if (smsResult.checkout_url) {
              // In a real system, you would send this URL via SMS
              toast.success('Payment link created - would be sent via SMS');

              onPaymentConfirm({
                method: 'SMS_PAYMENT_LINK',
                amount: finalTotal,
                reference: smsResult.session_id || `SMS-${Date.now()}`,
                tipAmount,
                totalWithTip: finalTotal
              });
            } else {
              throw new Error('Failed to create payment link');
            }
          } catch (error) {
            console.error('SMS payment link failed:', error);
            toast.error('Failed to create SMS payment link');
            return;
          }
          break;

        case 'QR_AT_DOOR':
          // For delivery orders - generate QR code for driver to show
          try {
            const qrResponse = await (brain as any).create_checkout_session({
              order_type: orderType,
              amount: Math.round(finalTotal * 100),
              currency: 'gbp',
              customer_phone: customerPhone || '',
              customer_name: customerName || ''
            });

            const qrResult = await qrResponse.json();

            if (qrResult.checkout_url) {
              toast.success('QR code payment URL generated for delivery');

              onPaymentConfirm({
                method: 'QR_AT_DOOR',
                amount: finalTotal,
                reference: qrResult.session_id || `QR-${Date.now()}`,
                tipAmount,
                totalWithTip: finalTotal
              });
            } else {
              throw new Error('Failed to create QR payment URL');
            }
          } catch (error) {
            console.error('QR payment failed:', error);
            toast.error('Failed to create QR payment');
            return;
          }
          break;

        case 'CUSTOMER_PAYS':
          // Generate payment link for customer
          try {
            const customerResponse = await (brain as any).create_checkout_session({
              order_type: orderType,
              amount: Math.round(finalTotal * 100),
              currency: 'gbp',
              customer_phone: customerPhone || '',
              customer_name: customerName || ''
            });

            const customerResult = await customerResponse.json();

            if (customerResult.checkout_url) {
              toast.success('Payment link generated for customer');

              onPaymentConfirm({
                method: 'CUSTOMER_PAYS',
                amount: finalTotal,
                reference: customerResult.session_id || `CUSTOMER-${Date.now()}`,
                tipAmount,
                totalWithTip: finalTotal
              });
            } else {
              throw new Error('Failed to create customer payment link');
            }
          } catch (error) {
            console.error('Customer payment link failed:', error);
            toast.error('Failed to create customer payment link');
            return;
          }
          break;

        case 'ALREADY_PAID':
          onPaymentConfirm({
            method: 'ALREADY_PAID',
            amount: finalTotal,
            reference: `PREPAID-${Date.now()}`,
            tipAmount,
            totalWithTip: finalTotal
          });
          break;
      }

      onClose();
    } catch (error) {
      toast.error('Payment processing failed');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" style={styles.glassCard}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Process Payment - {orderType}
            {tableNumber && ` (Table ${tableNumber})`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card style={styles.frostedGlassStyle}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Order Total:</span>
                  <span className="text-lg font-semibold text-white">£{orderTotal.toFixed(2)}</span>
                </div>
                
                {tipAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Tip:</span>
                    <span className="text-lg font-semibold text-green-400">£{tipAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator className="bg-white/10" />
                
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Final Total:</span>
                  <span className="text-xl font-bold text-white">£{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-sm text-white/60 mt-2">
                {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                {customerName && ` • ${customerName}`}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.type;

                return (
                  <motion.div
                    key={method.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer outline-none"
                      style={{
                        borderRadius: '8px',
                        border: isSelected
                          ? undefined
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isSelected
                          ? undefined
                          : 'rgba(255, 255, 255, 0.06)',
                        transition: 'all 150ms ease',
                        ...(isSelected ? {} : {}),
                      }}
                      tabIndex={0}
                      onClick={() => handleMethodSelect(method.type)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMethodSelect(method.type); } }}
                    >
                      {/* Selected state overlay */}
                      <div
                        className="rounded-lg"
                        style={{
                          ...(isSelected ? {
                            border: '2px solid currentColor',
                            boxShadow: '0 0 12px rgba(255, 255, 255, 0.1)',
                          } : {}),
                        }}
                      >
                        <CardContent
                          className={`p-4 rounded-lg ${isSelected ? method.bgColor : ''}`}
                          style={isSelected ? { borderColor: 'currentColor' } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-6 w-6 ${isSelected ? method.color : 'text-white/60'}`} />
                            <div>
                              <div className={`font-medium ${isSelected ? 'text-white' : 'text-white/80'}`}>
                                {method.label}
                              </div>
                              <div className="text-xs text-white/50">
                                {method.description}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className={`h-4 w-4 ${method.color}`} />
                            </div>
                          )}
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Cash Payment Details */}
          {selectedMethod === 'CASH' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card style={styles.frostedGlassStyle}>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-white/80">Cash Received</Label>
                    <Input
                      type="text"
                      value={cashReceived}
                      onChange={(e) => handleCashInput(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 bg-black/20 border-white/10 text-white"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div>
                    <Label className="text-white/80 text-sm">Quick Amounts</Label>
                    <div className="flex gap-2 mt-2">
                      {quickAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setCashReceived(amount.toString())}
                          className="border-white/10 text-white/80 hover:bg-white/10"
                        >
                          £{amount.toFixed(2)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Change Calculation */}
                  {cashReceived && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Change Due:</span>
                        <span className={`text-lg font-bold ${
                          change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          £{Math.max(0, change).toFixed(2)}
                        </span>
                      </div>
                      {change < 0 && (
                        <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          Insufficient cash amount
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Footer: Cancel (left) | Process Payment (right) */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <POSButton
            variant="tertiary"
            onClick={onClose}
          >
            Cancel
          </POSButton>
          <POSButton
            variant="primary"
            colorScheme="green"
            onClick={handleConfirmPayment}
            disabled={!selectedMethod || (selectedMethod === 'CASH' && !isValidCash) || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Process Payment £${finalTotal.toFixed(2)}`}
          </POSButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default POSPaymentSelector;
