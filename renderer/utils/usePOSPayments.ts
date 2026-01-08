import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useRealtimeMenuStore } from 'utils/useRealtimeMenuStore';
import { paymentService } from 'utils/paymentService';
import { orderManagementService } from 'utils/orderManagementService';

// Payment types
export interface PaymentMethod {
  type: 'CASH' | 'CARD' | 'CONTACTLESS' | 'SPLIT';
  amount: number;
  reference?: string;
}

export interface BillDetails {
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discounts: number;
  total: number;
  paymentMethods: PaymentMethod[];
}

export interface UsePOSPaymentsReturn {
  // Payment modal states
  showPaymentModal: boolean;
  setShowPaymentModal: (show: boolean) => void;
  showFlexibleBillingModal: boolean;
  setShowFlexibleBillingModal: (show: boolean) => void;
  showDiscountModal: boolean;
  setShowDiscountModal: (show: boolean) => void;
  showRefundModal: boolean;
  setShowRefundModal: (show: boolean) => void;
  showAdminPasswordModal: boolean;
  setShowAdminPasswordModal: (show: boolean) => void;
  
  // Payment processing
  selectedPaymentMethod: PaymentMethod['type'];
  setSelectedPaymentMethod: (method: PaymentMethod['type']) => void;
  paymentAmount: number;
  setPaymentAmount: (amount: number) => void;
  
  // Payment operations
  handleProcessPayment: (orderTotal: number, tableNumber?: number) => Promise<void>;
  handleRefund: (amount: number, reason: string) => Promise<void>;
  handleDiscount: (amount: number, reason: string, type: 'PERCENTAGE' | 'FIXED') => void;
  
  // Bill management
  billDetails: BillDetails | null;
  setBillDetails: (details: BillDetails | null) => void;
  
  // Receipt operations
  handlePrintReceipt: (orderData: any) => void;
  handleEmailReceipt: (orderData: any, email: string) => void;
  
  // Payment validation
  validatePayment: (amount: number, orderTotal: number) => boolean;
  
  // Discount management
  appliedDiscounts: Array<{
    id: string;
    type: 'PERCENTAGE' | 'FIXED';
    amount: number;
    reason: string;
    appliedAt: Date;
  }>;
  addDiscount: (discount: {
    type: 'PERCENTAGE' | 'FIXED';
    amount: number;
    reason: string;
  }) => void;
  removeDiscount: (discountId: string) => void;
  
  // Payment history
  paymentHistory: Array<{
    id: string;
    amount: number;
    method: PaymentMethod['type'];
    timestamp: Date;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    reference?: string;
  }>;
  
  // Split payment management
  splitPayments: PaymentMethod[];
  addSplitPayment: (payment: PaymentMethod) => void;
  removeSplitPayment: (index: number) => void;
  clearSplitPayments: () => void;
  
  // Cash management
  cashGiven: number;
  setCashGiven: (amount: number) => void;
  calculateChange: () => number;
}

export const usePOSPayments = (): UsePOSPaymentsReturn => {
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFlexibleBillingModal, setShowFlexibleBillingModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  
  // Payment processing state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod['type']>('CARD');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cashGiven, setCashGiven] = useState(0);
  
  // Bill and payment data
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [appliedDiscounts, setAppliedDiscounts] = useState<Array<{
    id: string;
    type: 'PERCENTAGE' | 'FIXED';
    amount: number;
    reason: string;
    appliedAt: Date;
  }>>([]);
  
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    id: string;
    amount: number;
    method: PaymentMethod['type'];
    timestamp: Date;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    reference?: string;
  }>>([]);
  
  const [splitPayments, setSplitPayments] = useState<PaymentMethod[]>([]);
  
  // Access menu store for global state
  const { 
    setFlexibleBillingOpen,
    flexibleBillingItems,
    setFlexibleBillingItems 
  } = useRealtimeMenuStore();
  
  // Payment operations
  const handleProcessPayment = useCallback(async (orderTotal: number, tableNumber?: number) => {
    try {
      if (!validatePayment(paymentAmount, orderTotal)) {
        toast.error('Invalid payment amount');
        return;
      }
      
      const paymentId = Date.now().toString();
      
      // Process payment based on method
      let paymentResult;
      
      switch (selectedPaymentMethod) {
        case 'CASH':
          if (cashGiven < orderTotal) {
            toast.error('Insufficient cash provided');
            return;
          }
          paymentResult = { success: true, reference: `CASH-${paymentId}` };
          break;
          
        case 'CARD':
        case 'CONTACTLESS':
          paymentResult = await paymentService.processCardPayment({
            amount: orderTotal,
            method: selectedPaymentMethod,
            tableNumber
          });
          break;
          
        case 'SPLIT':
          const totalSplit = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
          if (Math.abs(totalSplit - orderTotal) > 0.01) {
            toast.error('Split payments must equal order total');
            return;
          }
          
          paymentResult = await paymentService.processSplitPayment({
            payments: splitPayments,
            orderTotal,
            tableNumber
          });
          break;
          
        default:
          throw new Error('Invalid payment method');
      }
      
      if (paymentResult.success) {
        // Add to payment history
        const newPayment = {
          id: paymentId,
          amount: orderTotal,
          method: selectedPaymentMethod,
          timestamp: new Date(),
          status: 'SUCCESS' as const,
          reference: paymentResult.reference
        };
        
        setPaymentHistory(prev => [newPayment, ...prev]);
        
        // Update order status
        if (tableNumber) {
          await orderManagementService.updateOrderPaymentStatus(
            `table-${tableNumber}`,
            'PAID',
            newPayment
          );
        }
        
        toast.success(`Payment of £${orderTotal.toFixed(2)} processed successfully`);
        setShowPaymentModal(false);
        
        // Reset payment state
        setPaymentAmount(0);
        setCashGiven(0);
        clearSplitPayments();
        
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Add failed payment to history
      const failedPayment = {
        id: Date.now().toString(),
        amount: orderTotal,
        method: selectedPaymentMethod,
        timestamp: new Date(),
        status: 'FAILED' as const
      };
      
      setPaymentHistory(prev => [failedPayment, ...prev]);
    }
  }, [paymentAmount, orderTotal, selectedPaymentMethod, cashGiven, splitPayments]);
  
  const handleRefund = useCallback(async (amount: number, reason: string) => {
    try {
      const refundResult = await paymentService.processRefund({
        amount,
        reason,
        timestamp: new Date()
      });
      
      if (refundResult.success) {
        toast.success(`Refund of £${amount.toFixed(2)} processed`);
        setShowRefundModal(false);
        
        // Add refund to payment history
        const refundEntry = {
          id: Date.now().toString(),
          amount: -amount, // Negative for refund
          method: 'CARD' as const,
          timestamp: new Date(),
          status: 'SUCCESS' as const,
          reference: `REFUND-${refundResult.reference}`
        };
        
        setPaymentHistory(prev => [refundEntry, ...prev]);
      } else {
        throw new Error(refundResult.error || 'Refund failed');
      }
      
    } catch (error) {
      console.error('Refund processing error:', error);
      toast.error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);
  
  const handleDiscount = useCallback((amount: number, reason: string, type: 'PERCENTAGE' | 'FIXED') => {
    const discountId = Date.now().toString();
    
    const newDiscount = {
      id: discountId,
      type,
      amount,
      reason,
      appliedAt: new Date()
    };
    
    setAppliedDiscounts(prev => [...prev, newDiscount]);
    
    const discountText = type === 'PERCENTAGE' 
      ? `${amount}% discount` 
      : `£${amount.toFixed(2)} discount`;
    
    toast.success(`${discountText} applied: ${reason}`);
    setShowDiscountModal(false);
  }, []);
  
  // Discount management
  const addDiscount = useCallback((discount: {
    type: 'PERCENTAGE' | 'FIXED';
    amount: number;
    reason: string;
  }) => {
    handleDiscount(discount.amount, discount.reason, discount.type);
  }, [handleDiscount]);
  
  const removeDiscount = useCallback((discountId: string) => {
    setAppliedDiscounts(prev => {
      const discount = prev.find(d => d.id === discountId);
      if (discount) {
        const discountText = discount.type === 'PERCENTAGE' 
          ? `${discount.amount}% discount` 
          : `£${discount.amount.toFixed(2)} discount`;
        toast.success(`${discountText} removed`);
      }
      return prev.filter(d => d.id !== discountId);
    });
  }, []);
  
  // Receipt operations
  const handlePrintReceipt = useCallback((orderData: any) => {
    try {
      // Format receipt data
      const receiptData = {
        ...orderData,
        printedAt: new Date(),
        appliedDiscounts,
        paymentMethods: selectedPaymentMethod === 'SPLIT' ? splitPayments : [{
          type: selectedPaymentMethod,
          amount: paymentAmount
        }]
      };
      
      // Send to receipt printer service
      paymentService.printReceipt(receiptData);
      
      toast.success('Receipt printed');
    } catch (error) {
      console.error('Receipt printing error:', error);
      toast.error('Failed to print receipt');
    }
  }, [appliedDiscounts, selectedPaymentMethod, splitPayments, paymentAmount]);
  
  const handleEmailReceipt = useCallback(async (orderData: any, email: string) => {
    try {
      const receiptData = {
        ...orderData,
        sentAt: new Date(),
        appliedDiscounts,
        customerEmail: email
      };
      
      await paymentService.emailReceipt(receiptData);
      
      toast.success(`Receipt emailed to ${email}`);
    } catch (error) {
      console.error('Email receipt error:', error);
      toast.error('Failed to email receipt');
    }
  }, [appliedDiscounts]);
  
  // Payment validation
  const validatePayment = useCallback((amount: number, orderTotal: number): boolean => {
    if (amount <= 0) return false;
    if (selectedPaymentMethod === 'CASH') {
      return cashGiven >= orderTotal;
    }
    return Math.abs(amount - orderTotal) < 0.01;
  }, [selectedPaymentMethod, cashGiven]);
  
  // Split payment management
  const addSplitPayment = useCallback((payment: PaymentMethod) => {
    setSplitPayments(prev => [...prev, payment]);
    toast.success(`Added ${payment.type} payment of £${payment.amount.toFixed(2)}`);
  }, []);
  
  const removeSplitPayment = useCallback((index: number) => {
    setSplitPayments(prev => {
      const removed = prev[index];
      if (removed) {
        toast.success(`Removed ${removed.type} payment of £${removed.amount.toFixed(2)}`);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);
  
  const clearSplitPayments = useCallback(() => {
    setSplitPayments([]);
  }, []);
  
  // Cash management
  const calculateChange = useCallback((): number => {
    if (selectedPaymentMethod !== 'CASH' || !billDetails) return 0;
    return Math.max(0, cashGiven - billDetails.total);
  }, [selectedPaymentMethod, cashGiven, billDetails]);
  
  return {
    // Payment modal states
    showPaymentModal,
    setShowPaymentModal,
    showFlexibleBillingModal,
    setShowFlexibleBillingModal,
    showDiscountModal,
    setShowDiscountModal,
    showRefundModal,
    setShowRefundModal,
    showAdminPasswordModal,
    setShowAdminPasswordModal,
    
    // Payment processing
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    paymentAmount,
    setPaymentAmount,
    
    // Payment operations
    handleProcessPayment,
    handleRefund,
    handleDiscount,
    
    // Bill management
    billDetails,
    setBillDetails,
    
    // Receipt operations
    handlePrintReceipt,
    handleEmailReceipt,
    
    // Payment validation
    validatePayment,
    
    // Discount management
    appliedDiscounts,
    addDiscount,
    removeDiscount,
    
    // Payment history
    paymentHistory,
    
    // Split payment management
    splitPayments,
    addSplitPayment,
    removeSplitPayment,
    clearSplitPayments,
    
    // Cash management
    cashGiven,
    setCashGiven,
    calculateChange
  };
};
