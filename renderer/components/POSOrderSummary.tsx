import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Receipt,
  CreditCard,
  Utensils,
  Clock,
  Users,
  MapPin,
  User,
  ChefHat,
  CheckCircle,
  Loader2,
  ArrowRight,
  Star,
  RotateCcw,
  Save,
  X,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { OrderItem, ModifierSelection, CustomizationSelection } from '../utils/menuTypes';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import POSTipSelector, { TipSelection } from './POSTipSelector';
import { pendingPaymentService } from '../utils/pendingPaymentService';
import { colors, globalColors, QSAITheme, effects } from '../utils/QSAIDesign';
import { toast } from 'sonner';
import { apiClient } from 'app';

export interface POSOrderSummaryProps {
  orderItems: OrderItem[];
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  tableNumber?: number;
  guestCount?: number;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerStreet?: string;
  customerPostcode?: string;
  onAddModifier?: (itemId: string, modifier: ModifierSelection) => void;
  onRemoveModifier?: (itemId: string, modifierId: string) => void;
  onUpdateNotes?: (itemId: string, notes: string) => void;
  onIncrementItem?: (itemId: string) => void;
  onDecrementItem?: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onProcessPayment?: () => void;
  onSendToKitchen?: () => void;
  onSaveUpdate?: (tableNumber: number, orderItems: OrderItem[]) => void;
  onClearOrder?: () => void;
  onQuantityChange: (index: number, newQuantity: number) => void;
  onCustomizeItem?: (index: number, item: OrderItem) => void;
  onSchedulingChange?: (data: SchedulingData) => void;
  schedulingData?: SchedulingData;
  sentToKitchen?: boolean;
  hasNewOrUnprintedItems?: boolean;
  billPrinted?: boolean;
  minimumOrderMet?: boolean;
  minimumOrderAmount?: number;
  serviceCharge?: number;
  tableStatus?: TableStatus;
  kitchenTicketsCount?: number;
  paymentCompleted?: boolean;  // Add payment completion state
  collectionCompleted?: boolean;  // Add collection completion state
  deliveryDistance?: number | null;  // Add delivery distance
  deliveryTime?: string | null;     // Add delivery time
  deliveryFee?: number;             // Add delivery fee
  showVatBreakdown?: boolean;
  tax?: number;
  serviceCharge?: number;
  deliveryFee?: number;
  orderNotes?: string;
  paymentProcessing?: boolean;
  isPaymentComplete?: boolean;
  isDeliveryDispatched?: boolean;
  setIsDeliveryDispatched?: (dispatched: boolean) => void;
  
  // New callback props for modal management
  onOpenCustomerModal?: () => void;
  onOpenTableModal?: () => void;
  onPrintBill?: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
};

// Helper functions for calculations and formatting
const formatCurrency = (amount: number): string => {
  return `£${amount.toFixed(2)}`;
};

// Helper function to calculate item total with modifiers if present
const calculateItemTotal = (item: any): number => {
  let total = item.price * item.quantity;
  
  // For Set Meals, the price is already the complete set price
  if (item.item_type === 'set_meal') {
    return total;
  }
  
  // For regular menu items, add modifier costs
  if (item.modifiers && item.modifiers.length > 0) {
    item.modifiers.forEach(group => {
      group.options.forEach(option => {
        total += option.price * item.quantity;
      });
    });
  }
  
  return total;
};

// Validation helper function for minimum order value
const validateMinimumOrderValue = async (orderType: string, total: number) => {
  // Only validate for DELIVERY orders
  if (orderType !== 'DELIVERY') {
    return { valid: true, error: null };
  }
  
  try {
    // Get POS settings for minimum order value
    const response = await apiClient.get_pos_settings();
    const data = await response.json();
    
    if (data.success && data.settings?.delivery) {
      const minimumOrderValue = data.settings.delivery.minimum_order_value;
      
      if (minimumOrderValue && total < minimumOrderValue) {
        return {
          valid: false,
          error: `Minimum order value for delivery is £${minimumOrderValue.toFixed(2)}. Current total: £${total.toFixed(2)}`
        };
      }
    }
    
    return { valid: true, error: null };
  } catch (error) {
    console.error('Error validating minimum order value:', error);
    // If validation fails, allow order to proceed (graceful fallback)
    return { valid: true, error: null };
  }
};

export function POSOrderSummary({
  orderItems,
  orderType,
  tableNumber,
  guestCount,
  customerFirstName,
  customerLastName,
  customerPhone,
  customerAddress,
  customerStreet,
  customerPostcode,
  onAddModifier,
  onRemoveModifier,
  onUpdateNotes,
  onIncrementItem,
  onDecrementItem,
  onRemoveItem,
  onProcessPayment,
  onSendToKitchen,
  onSaveUpdate,
  onClearOrder,
  onQuantityChange,
  onCustomizeItem,
  onSchedulingChange,
  schedulingData,
  sentToKitchen = false,
  hasNewOrUnprintedItems = false,
  billPrinted = false,
  minimumOrderMet = true,
  minimumOrderAmount = 0,
  serviceCharge = 0,
  tableStatus = 'AVAILABLE',
  kitchenTicketsCount = 0,
  paymentCompleted = false,
  collectionCompleted = false,
  deliveryDistance = null,
  deliveryTime = null,
  deliveryFee = 0,
  showVatBreakdown = false,
  tax = 0,
  serviceCharge = 0,
  deliveryFee = 0,
  orderNotes = '',
  paymentProcessing = false,
  isPaymentComplete = false,
  isDeliveryDispatched = false,
  setIsDeliveryDispatched = () => {},
  
  // New callback props for modal management
  onOpenCustomerModal = () => {},
  onOpenTableModal = () => {},
  onPrintBill = () => {}
}: POSOrderSummaryProps) {
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState<boolean>(false);
  const [showSendToKitchenDialog, setShowSendToKitchenDialog] = useState<boolean>(false);
  const [showStripePayment, setShowStripePayment] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState<boolean>(false);
  const [isDeliveryDispatched, setIsDeliveryDispatched] = useState<boolean>(false);
  const [currentTipSelection, setCurrentTipSelection] = useState<TipSelection | null>(null);
  
  // Customer data store integration
  const { hasRequiredCustomerData } = useCustomerDataStore();
  const hasCustomerData = hasRequiredCustomerData(orderType);
  
  // Multi-custom modal state
  const [selectedMultiCustomGroup, setSelectedMultiCustomGroup] = useState<MultiCustomGroup | null>(null);
  const [showMultiCustomDetails, setShowMultiCustomDetails] = useState<boolean>(false);
  const [detailsTriggerElement, setDetailsTriggerElement] = useState<HTMLElement | null>(null);
  
  // Group multi-custom items
  const { multiCustomGroups, regularItems } = groupMultiCustomItems(orderItems);
  
  // Multi-custom group handlers
  const handleViewMultiCustomDetails = (group: MultiCustomGroup, triggerElement?: HTMLElement) => {
    setSelectedMultiCustomGroup(group);
    setDetailsTriggerElement(triggerElement || null);
    setShowMultiCustomDetails(true);
  };
  
  const handleRemoveMultiCustomGroup = (group: MultiCustomGroup) => {
    // Remove all items in the group
    group.items.forEach(item => {
      if (onRemoveItem) {
        onRemoveItem(item.id);
      }
    });
    setShowMultiCustomDetails(false);
  };
  
  const handleEditMultiCustomPortion = (portionIndex: number, item: OrderItem) => {
    // Find the actual index in the original orderItems array
    const itemIndex = orderItems.findIndex(orderItem => orderItem.id === item.id);
    if (itemIndex !== -1 && onCustomizeItem) {
      onCustomizeItem(itemIndex, item);
    }
  };
  
  const handleRemoveMultiCustomPortion = (itemId: string) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };
  
  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  // Handle delivery fee and service charge
  let deliveryFeeValue = 0;
  
  if (orderType === "DELIVERY") {
    // Check global settings first
    if (typeof window !== 'undefined' && window.posSettings?.delivery_charge) {
      if (window.posSettings.delivery_charge.enabled) {
        // Use the configured amount from settings
        deliveryFeeValue = window.posSettings.delivery_charge.amount;
      } else {
        // Delivery charge is disabled in settings
        deliveryFeeValue = 0;
      }
    } else {
      // Fallback to prop if settings not available
      deliveryFeeValue = typeof deliveryFee === 'number' ? deliveryFee : parseFloat(deliveryFee as unknown as string) || 0;
    }
  }
  
  // Apply service charge conditionally based on settings
  let serviceChargeValue = 0;
  if (orderType === "DINE-IN") {
    if (typeof window !== 'undefined' && window.posSettings?.service_charge && window.posSettings.service_charge.enabled) {
      serviceChargeValue = subtotal * (window.posSettings.service_charge.percentage / 100);
    } else {
      // Default service charge if settings not available
      serviceChargeValue = subtotal * (serviceCharge / 100);
    }
  }
  
  // Calculate total with memoization - FIX: Include service charges and delivery fees
  const total = useMemo(() => {
    const subtotalCalc = orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    // Start with subtotal, then add service charges and delivery fees
    let totalWithCharges = subtotalCalc;
    
    // Add service charge if applicable (for DINE-IN orders)
    if (orderType === "DINE-IN") {
      if (typeof window !== 'undefined' && window.posSettings?.service_charge && window.posSettings.service_charge.enabled) {
        totalWithCharges += subtotalCalc * (window.posSettings.service_charge.percentage / 100);
      } else {
        // Default service charge if settings not available
        totalWithCharges += subtotalCalc * (serviceCharge / 100);
      }
    }
    
    // Add delivery fee if applicable (for DELIVERY orders) - use restaurant delivery settings
    if (orderType === "DELIVERY") {
      // Use restaurant delivery settings from props
      totalWithCharges += typeof deliveryFee === 'number' ? deliveryFee : parseFloat(deliveryFee as unknown as string) || 0;
    }
    
    // 🔍 DEBUG: Log total calculation in POSOrderSummary
    console.log('🔍 POSOrderSummary total calculation (RESTAURANT SETTINGS):', {
      orderItemsCount: orderItems.length,
      subtotal: subtotalCalc,
      serviceCharge: orderType === "DINE-IN" ? (window.posSettings?.service_charge?.enabled ? subtotalCalc * (window.posSettings.service_charge.percentage / 100) : 0) : 0,
      deliveryFee: orderType === "DELIVERY" ? (typeof deliveryFee === 'number' ? deliveryFee : parseFloat(deliveryFee as unknown as string) || 0) : 0,
      totalWithCharges,
      orderType,
      restaurantDeliveryFee: deliveryFee
    });
    
    return totalWithCharges;
  }, [orderItems, orderType, serviceCharge, deliveryFee]);
  
  // Order item state includes kitchen tracking
  const hasNewOrUnprintedItemsCalculated = orderItems.some(item => item.isNewItem || (item.sentToKitchen === false));
  const allItemsSentToKitchen = orderItems.length > 0 && (sentToKitchen || orderItems.every(item => item.sentToKitchen));
  const hasEnoughItemsForBilling = orderItems.length > 0;
  
  // Kitchen ticket sending handler
  const handleSendToKitchen = () => {
    if (orderItems.length === 0) {
      toast.error("No items to send to kitchen");
      return;
    }
    
    if (orderType === "DINE-IN" && tableNumber) {
      // For dine-in: send to kitchen and print tickets
      if (onSendToKitchen) {
        onSendToKitchen();
      }
      toast.success(`Table ${tableNumber} order sent to kitchen`, {
        description: 'Kitchen tickets printed'
      });
    } else {
      // For other order types, use the enhanced flow
      handleEnhancedSendToKitchen();
    }
  };
  
  // Enhanced send to kitchen handler with payment modal
  const handleEnhancedSendToKitchen = async () => {
    if (orderItems.length === 0) {
      toast.error("No items to process");
      return;
    }
    
    // Validate minimum order value for delivery orders
    const validation = await validateMinimumOrderValue(orderType, total);
    if (!validation.valid) {
      toast.error('Order cannot be processed', {
        description: validation.error
      });
      return;
    }
    
    // For DELIVERY orders: Check if customer details are filled
    if (orderType === "DELIVERY") {
      if (!customerFirstName) {
        toast.error("Customer details required", {
          description: "Please add customer information before processing the order"
        });
        return;
      }
    }
    
    // For COLLECTION/WAITING orders: Check if customer name is provided
    if ((orderType === "COLLECTION" || orderType === "WAITING") && !customerFirstName) {
      toast.error("Customer name required", {
        description: "Please add customer name before processing the order"
      });
      return;
    }
    
    console.log('✅ All validations passed, opening payment modal');
    setShowStripePayment(true);
  };
  
  // Smart Process Order handler with unified validation
  const handleProcessOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("No items to process");
      return;
    }

    console.log('🔍 Smart Process Order validation for:', orderType);

    // DELIVERY Orders: Check minimum order value first
    if (orderType === "DELIVERY") {
      const validation = await validateMinimumOrderValue(orderType, total);
      if (!validation.valid) {
        toast.error('Order cannot be processed', {
          description: validation.error
        });
        return;
      }
      
      // Check if customer details are provided
      if (!customerFirstName) {
        toast.info('Customer details required', {
          description: 'Please add customer information to continue'
        });
        // Open Customer Details Modal
        if (onOpenCustomerModal) {
          onOpenCustomerModal();
        }
        return;
      }
    }

    // WAITING/COLLECTION Orders: Check if first name is provided
    if ((orderType === "WAITING" || orderType === "COLLECTION") && !customerFirstName) {
      toast.info('Customer name required', {
        description: 'Please add customer name to continue'
      });
      // Open Customer Details Modal
      if (onOpenCustomerModal) {
        onOpenCustomerModal();
      }
      return;
    }

    // DINE-IN Orders: Check if table is assigned
    if (orderType === "DINE-IN" && !tableNumber) {
      toast.info('Table selection required', {
        description: 'Please select a table to continue'
      });
      // Open Table Selection Modal - this should be handled by the parent component
      if (onOpenTableModal) {
        onOpenTableModal();
      }
      return;
    }

    // All validations passed - open Order Confirmation Modal
    console.log('✅ All validations passed, opening Order Confirmation Modal');
    setShowOrderConfirmation(true);
  };

  // Order Confirmation Modal handlers
  const handleOrderConfirmation = (action: 'payment' | 'no_payment' | 'add_to_order' | 'send_to_kitchen' | 'make_changes') => {
    setShowOrderConfirmation(false);
    
    switch (action) {
      case 'payment':
        // Open payment modal for DELIVERY/WAITING/COLLECTION orders
        setShowStripePayment(true);
        break;
      case 'no_payment':
        // Process order without payment (add to pending payment queue)
        handleProcessOrderOnly();
        break;
      case 'add_to_order':
        // For DINE-IN: Add to order (like old Add/Update button)
        handleSaveUpdate();
        break;
      case 'send_to_kitchen':
        // For DINE-IN: Send to kitchen (like old Send to Kitchen button)
        handleSendToKitchen();
        break;
      case 'make_changes':
        // Just close modal and return to order building
        break;
    }
  };
  
  const getOrderConfirmationActionLabel = () => {
    if (orderType === 'DINE-IN') {
      return 'dine-in';
    } else {
      return 'takeaway';
    }
  };
  
  // Helper function for processing order without payment
  const handleProcessOrderOnly = async () => {
    try {
      // Add to pending payment queue
      const pendingOrderId = pendingPaymentService.addPendingOrder({
        orderType: orderType as 'COLLECTION' | 'DELIVERY' | 'WAITING',
        orderItems,
        total,
        customerName: customerFirstName && customerLastName 
          ? `${customerFirstName} ${customerLastName}` 
          : customerFirstName || customerLastName,
        customerPhone,
        customerAddress: customerAddress || (customerStreet && customerPostcode 
          ? `${customerStreet}, ${customerPostcode}` 
          : undefined),
        tableNumber,
        kitchenTicketPrinted: true,
        customerReceiptPrinted: true
      });

      // Send to kitchen for food preparation
      if (onSendToKitchen) {
        onSendToKitchen();
      }

      // Show success message
      toast.success('Order processed successfully', {
        description: `Kitchen tickets printed • Order ID: ${pendingOrderId.split('_')[1]} • Payment pending`
      });

      // Clear the current order from POS
      if (onClearOrder) {
        onClearOrder();
      }

    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order', {
        description: 'Please try again or contact support'
      });
    }
  };
  
  // Helper functions for Order Confirmation Modal
  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };
  
  const calculateServiceCharge = () => {
    if (orderType !== 'DINE-IN') return 0;
    const subtotal = calculateSubtotal();
    
    // Use POS settings if available, otherwise fallback to default
    if (typeof window !== 'undefined' && window.posSettings?.service_charge && window.posSettings.service_charge.enabled) {
      return subtotal * (window.posSettings.service_charge.percentage / 100);
    } else {
      return subtotal * 0.10; // 10% service charge for dine-in (fallback)
    }
  };
  
  // Handle place order (receipts only)
  const handlePlaceOrder = () => {
    // Send to kitchen and print receipts without payment
    if (onSendToKitchen) {
      onSendToKitchen();
    }
    toast.success('Order sent to kitchen', {
      description: 'Receipts printed - payment to be collected manually'
    });
  };
  
  // Handle take payment with tip
  const handleTakePayment = (tipSelection: TipSelection) => {
    // Close the send to kitchen dialog
    setShowSendToKitchenDialog(false);
    
    // Calculate total with tip
    const tipAmount = tipSelection.type === 'percentage' 
      ? total * (tipSelection.amount / 100)
      : tipSelection.amount;
    
    const totalWithTip = total + tipAmount;
    
    // Store tip information for payment processing
    console.log('Processing payment with tip:', {
      originalTotal: total,
      tipAmount,
      totalWithTip,
      tipSelection
    });
    
    // Store tip selection for payment modal
    setCurrentTipSelection(tipSelection);
    
    // Open payment modal with updated total
    setShowPaymentModal(true);
    
    toast.success(`Tip added: ${formatCurrency(tipAmount)}`, {
      description: `Total with tip: ${formatCurrency(totalWithTip)}`
    });
  };
  
  // Handle take payment with tip (alias for dialog integration)
  const handleTakePaymentWithTip = handleTakePayment;
  
  // Bill printing handler
  const handlePrintBill = () => {
    // Make sure we have a table number and items
    if (!tableNumber) {
      toast.error("Please select a table first")
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error("No items on the bill")
      return;
    }
    
    // All items should be sent to kitchen before printing the bill
    if (hasNewOrUnprintedItemsCalculated) {
      toast.error("Please send all items to kitchen before printing bill")
      return;
    }
    
    // Call the printBill callback
    if (onPrintBill) {
      onPrintBill()
      // No toast here as the POS component will show toast after print is successful
      
      // Notify the kitchen service of the status change
      kitchenService.syncWithPOS()
    }
  };
  
  // Enhanced kitchen workflow state
  const kitchenActionText = sentToKitchen ? 
    (hasNewOrUnprintedItemsCalculated ? "Send New Items to Kitchen" : "All Items Sent to Kitchen") : 
    "Send to Kitchen";
    
  const billActionText = billPrinted ? "Reprint Bill" : "Print Bill";
  
  // Determine action button states
  const canSendToKitchen = orderItems.length > 0 && (!sentToKitchen || hasNewOrUnprintedItemsCalculated);
  const canPrintBill = allItemsSentToKitchen && tableStatus !== "AVAILABLE";
  const canProcessSplitBill = billPrinted && tableStatus === "BILL_REQUESTED";
  
  // Check if we can proceed to payment based on table status
  const canProcessPayment = orderType === "DINE-IN" ? 
    (billPrinted && (tableStatus === "BILL_REQUESTED" || tableStatus === "PAYMENT_PROCESSING")) : 
    orderItems.length > 0;

  // Get order type icon
  const getOrderTypeIcon = () => {
    switch (orderType) {
      case "DINE-IN":
        return <Utensils className="h-5 w-5 text-white" />;
      case "COLLECTION":
        return <Package className="h-5 w-5 text-white" />;
      case "DELIVERY":
        return <Truck className="h-5 w-5 text-white" />;
      case "WAITING":
        return <Clock className="h-5 w-5 text-white" />;
      default:
        return null;
    }
  };
  
  // Get order action button text
  const getActionButtonText = () => {
    switch (orderType) {
      case "DINE-IN": return "Send to Kitchen";
      case "COLLECTION": return "Process Order";
      case "DELIVERY": return "Process Order";
      case "WAITING": return "Process Order - Customer Waiting";
      default: return "Checkout";
    }
  };
  
  // Get order type description
  const getOrderTypeDescription = () => {
    switch (orderType) {
      case "DINE-IN": 
        return tableNumber ? 
          <span className="text-xs text-[#9CA3AF]">Table #{tableNumber}{guestCount ? ` • ${guestCount} guests` : ""}</span> : 
          <span className="text-xs text-amber-400">No table selected</span>;
      case "COLLECTION": 
        return customerFirstName ? 
          <span className="text-xs text-[#9CA3AF]">{customerFirstName} {customerLastName}</span> : 
          <span className="text-xs text-amber-400">Name required</span>;
      case "DELIVERY": 
        return customerAddress ? 
          <span className="text-xs text-[#9CA3AF] truncate max-w-[140px]" title={customerAddress}>
            {customerStreet ? `${customerStreet}, ` : ''}
            {customerPostcode}
          </span> : 
          <span className="text-xs text-amber-400">Address required</span>;
      case "WAITING": 
        return customerFirstName ? 
          <span className="text-xs text-[#9CA3AF]">{customerFirstName} {customerLastName}</span> : 
          <span className="text-xs text-amber-400">Name required</span>;
      default:
        return null;
    }
  };

  const handleProcessPayment = () => {
    if (orderItems.length === 0) {
      toast.error("Cannot process an empty order");
      return;
    }
    
    // For DINE-IN orders, ensure bill has been printed first
    if (orderType === "DINE-IN" && tableStatus !== "BILL_REQUESTED" && tableStatus !== "PAYMENT_PROCESSING") {
      toast.error("Please print the bill before processing payment")
      return;
    }
    
    // Open payment modal instead of simulated processing
    setShowPaymentModal(true);
  };

  // Calculate heights for the scrollable content area
  // These are approximate values that should be adjusted based on actual content
  const headerHeight = 70; // Header height in px
  const contextInfoHeight = (tableNumber || customerFirstName) ? 90 : 0; // Context info height if present
  const footerHeight = 280; // Footer with totals and buttons
  const customerName = customerFirstName && customerLastName 
    ? `${customerFirstName} ${customerLastName}` 
    : customerFirstName || customerLastName || undefined;

  // Stripe Modal Handlers
  const handleStripeSuccess = (paymentIntent: any, amount: number) => {
    setShowStripePayment(false);
    setPaymentProcessing(true);
    
    // Create payment result for confirmation
    const paymentResult: PaymentResult = {
      method: 'CARD',
      amount: amount,
      reference: paymentIntent.id,
      tipAmount: getTipAmount(),
      totalWithTip: getTotalWithTip()
    };
    
    console.log('💳 Stripe payment successful:', paymentResult);
    
    // For WAITING/COLLECTION/DELIVERY orders: Auto-print tickets after successful payment
    if (orderType === "WAITING" || orderType === "COLLECTION" || orderType === "DELIVERY") {
      console.log('🎫 Auto-printing tickets for paid takeaway order');
      
      // Print both front-of-house and kitchen tickets
      if (onSendToKitchen) {
        onSendToKitchen(); // This handles kitchen ticket printing
      }
      
      // Mark order as "paid" status
      if (onProcessPayment) {
        onProcessPayment();
      }
      
      toast.success('Payment successful - tickets printed!', {
        description: `${orderType.toLowerCase()} order ready for processing`
      });
    } else {
      // For DINE-IN orders (shouldn't reach here with new flow, but keeping for safety)
      if (onProcessPayment) {
        onProcessPayment();
      }
      
      toast.success('Payment processed successfully');
    }
    
    // Reset payment processing state
    setTimeout(() => {
      setPaymentProcessing(false);
    }, 1500);
  };

  const handleStripeError = (error: string) => {
    setShowStripePayment(false);
    setPaymentProcessing(false);
    toast.error(`Card payment failed: ${error}`);
  };

  const handleStripeCancel = () => {
    setShowStripePayment(false);
    setPaymentProcessing(false);
  };

  // Handle card payment initiation from payment selector
  const handleInitiateCardPayment = () => {
    // Close payment selector and open Stripe modal
    setShowPaymentModal(false);
    setShowStripePayment(true);
  };

  // Handle payment confirmation with real cash payment recording
  const handlePaymentConfirm = async (result: PaymentResult) => {
    setShowPaymentModal(false);
    setPaymentProcessing(true);
    
    try {
      // For DELIVERY orders, handle different payment scenarios
      if (orderType === "DELIVERY") {
        // Handle delivery-specific payment flows
        switch (result.method) {
          case 'SMS_PAYMENT_LINK':
            // Send SMS payment link and mark as payment processing
            console.log('SMS payment link sent for delivery order');
            setIsPaymentComplete(true);
            toast.success('SMS payment link sent to customer', {
              description: 'Order will be dispatched when payment confirmed'
            });
            break;
            
          case 'QR_AT_DOOR':
            // Generate QR code for driver to show at delivery
            console.log('QR code generated for door payment');
            setIsPaymentComplete(true);
            toast.success('Order ready for delivery with QR payment');
            break;
            
          case 'CASH':
            // Cash on delivery - mark as ready for dispatch
            console.log('Cash on delivery payment method selected');
            setIsPaymentComplete(true);
            toast.success('Cash on delivery confirmed - ready to dispatch');
            break;
            
          case 'CARD':
            // Manual card entry at door
            console.log('Card payment at door selected');
            setIsPaymentComplete(true);
            toast.success('Card payment at door confirmed - ready to dispatch');
            break;
            
          case 'ALREADY_PAID':
            // Pre-paid online order
            console.log('Pre-paid delivery order');
            setIsPaymentComplete(true);
            toast.success('Pre-paid order confirmed - ready to dispatch');
            break;
            
          default:
            setIsPaymentComplete(true);
            toast.success('Payment method confirmed for delivery');
        }
      } else {
        // Handle non-delivery orders (existing logic)
        // For cash payments, record the transaction properly
        if (result.method === 'CASH') {
          // First store the order to get an order ID
          const orderData = {
            order_id: `POS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            order_type: orderType,
            order_source: 'POS',
            customer_name: customerName || 'Walk-in Customer',
            table_number: tableNumber,
            guest_count: guestCount,
            items: orderItems.map(item => ({
              item_id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              variant_name: item.variant,
              modifiers: item.modifiers,
              notes: item.notes
            })),
            subtotal: subtotal,
            tax: tax,
            service_charge: serviceChargeValue,
            total: total,
            payment: {
              method: 'CASH',
              amount: total,
              cash_received: result.cashReceived,
              change_given: result.change,
              staff_id: 'current_staff', // TODO: Get actual staff ID
              timestamp: new Date().toISOString()
            },
            status: 'COMPLETED',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            
            // Add scheduling fields based on order type
            ...(orderType === 'COLLECTION' && schedulingData?.pickup_time ? {
              pickup_time: schedulingData.pickup_time,
              pickup_date: schedulingData.pickup_date
            } : {}),
            ...(orderType === 'DELIVERY' && schedulingData?.delivery_time ? {
              delivery_time: schedulingData.delivery_time,
              delivery_date: schedulingData.delivery_date
            } : {})
          };
          
          // Store the order first
          const storeResponse = await apiClient.store_order(orderData);
          const storeResult = await storeResponse.json();
          
          if (storeResult.success) {
            // Then process the cash payment
            const cashPaymentResponse = await apiClient.process_cash_payment({
              order_id: orderData.order_id,
              cash_received: result.cashReceived || 0,
              order_total: total,
              staff_id: 'current_staff', // TODO: Get actual staff ID
              notes: `${orderType} order payment`
            });
            
            const cashResult = await cashPaymentResponse.json();
            
            if (cashResult.success) {
              toast.success(`Cash payment recorded successfully`, {
                description: `Change due: £${cashResult.change_due.toFixed(2)}`
              });
              
              // For COLLECTION and WAITING orders, mark payment complete but don't finish order yet
              if (orderType === 'COLLECTION' || orderType === 'WAITING') {
                // Set payment completed state instead of calling onProcessPayment
                setIsPaymentComplete(true);
                toast.success(`Payment complete - ready for collection`, {
                  description: orderType === 'WAITING' 
                    ? 'Customer is waiting - confirm collection when ready' 
                    : 'Customer can collect when ready'
                });
              } else {
                onProcessPayment();
              }
            } else {
              toast.error('Cash payment recording failed', {
                description: cashResult.message
              });
            }
          } else {
            toast.error('Order storage failed', {
              description: storeResult.message
            });
          }
        } else {
          // For card payments, now also store order in unified backend
          const orderData = {
            order_id: `POS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            order_type: orderType,
            order_source: 'POS',
            customer_name: customerName || 'Walk-in Customer',
            table_number: tableNumber,
            guest_count: guestCount,
            items: orderItems.map(item => ({
              item_id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              variant_name: item.variant,
              modifiers: item.modifiers,
              notes: item.notes
            })),
            subtotal: subtotal,
            tax: tax,
            service_charge: serviceChargeValue,
            total: total,
            payment: {
              method: result.method,
              amount: total,
              staff_id: 'current_staff', // TODO: Get actual staff ID
              timestamp: new Date().toISOString()
            },
            status: 'COMPLETED',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            
            // Add scheduling fields based on order type
            ...(orderType === 'COLLECTION' && schedulingData?.pickup_time ? {
              pickup_time: schedulingData.pickup_time,
              pickup_date: schedulingData.pickup_date
            } : {}),
            ...(orderType === 'DELIVERY' && schedulingData?.delivery_time ? {
              delivery_time: schedulingData.delivery_time,
              delivery_date: schedulingData.delivery_date
            } : {})
          };
          
          // Store the order in backend first
          const storeResponse = await apiClient.store_order(orderData);
          const storeResult = await storeResponse.json();
          
          if (storeResult.success) {
            const processingTime = result.method === 'CARD' ? 2000 : 500;
            
            setTimeout(() => {
              let successMessage = `Payment processed via ${result.method.toLowerCase()}`;
              if (result.method === 'CASH' && result.change) {
                successMessage += ` - Change: £${result.change.toFixed(2)}`;
              }
              
              toast.success(successMessage);
              
              // For COLLECTION and WAITING orders, mark payment complete but don't finish order yet
              if (orderType === 'COLLECTION' || orderType === 'WAITING') {
                // Set payment completed state instead of calling onProcessPayment
                setIsPaymentComplete(true);
                toast.success(`Payment complete - ready for collection`, {
                  description: orderType === 'WAITING' 
                    ? 'Customer is waiting - confirm collection when ready' 
                    : 'Customer can collect when ready'
                });
              } else {
                onProcessPayment();
              }
            }, processingTime);
          } else {
            toast.error('Order storage failed', {
              description: storeResult.message
            });
          }
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed', {
        description: 'Please try again'
      });
    } finally {
      setPaymentProcessing(false);
      
      // Notify the kitchen service of the payment
      kitchenService.syncWithPOS();
    }
  };

  // Handle collection confirmation for COLLECTION, WAITING, and DELIVERY orders
  const handleCollectionConfirm = () => {
    if (orderType === 'COLLECTION' || orderType === 'WAITING') {
      // Mark order as collected and complete
      if (onProcessPayment) {
        onProcessPayment(); // This will complete the order
      }
      
      toast.success(`Order collected successfully`, {
        description: orderType === 'WAITING' 
          ? 'Thank you for your patience!' 
          : 'Order completed and collected'
      });
      
      // Generate collection receipt
      console.log('Collection receipt generated for', orderType, 'order');
    } else if (orderType === 'DELIVERY') {
      // Handle delivery dispatch/completion workflow
      if (!isDeliveryDispatched) {
        // First click: Dispatch for delivery (driver collection)
        setIsDeliveryDispatched(true);
        toast.success('Order dispatched for delivery', {
          description: 'Driver has collected the order and is en route'
        });
        console.log('Delivery order dispatched - driver en route');
      } else {
        // Second click: Mark as delivered (delivery completion)
        if (onProcessPayment) {
          onProcessPayment(); // This will complete the order
        }
        
        toast.success('Delivery completed successfully', {
          description: 'Order has been delivered to customer'
        });
        
        // Generate delivery receipt
        console.log('Delivery receipt generated - order completed');
      }
    }
  };

  // Calculate tip amounts for payment modal
  const getTipAmount = () => {
    if (!currentTipSelection) return 0;
    return currentTipSelection.type === 'percentage' 
      ? total * (currentTipSelection.amount / 100)
      : currentTipSelection.amount;
  };

  const getTotalWithTip = () => {
    return total + getTipAmount();
  };

  // Handle save/update for DINE-IN orders (without kitchen printing)
  const handleSaveUpdate = async () => {
    if (orderItems.length === 0) {
      toast.error("No items to save");
      return;
    }
    
    if (!tableNumber) {
      toast.error("Please select a table first");
      return;
    }
    
    // Call the onSaveUpdate callback if provided
    if (onSaveUpdate) {
      await onSaveUpdate(tableNumber, orderItems);
    } else {
      // Fallback: Save order without sending to kitchen (no printing)
      toast.success("Order saved/updated", {
        description: `Table ${tableNumber} order updated without kitchen notification`
      });
    }
  };
  
  return (
    <div className="h-full min-h-0 flex flex-col rounded-lg overflow-hidden" style={{ 
      background: `linear-gradient(145deg, #121212 0%, #1a6a1a 100%)`,
      backdropFilter: 'blur(4px)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.05)',
      border: `1px solid ${globalColors.purple.primaryTransparent}20`,
      borderRadius: '8px'
    }}>
      {/* SECTION 1: Fixed Header - Order type, table info, and customer info */}
      <div className="flex-shrink-0 w-full max-h-48 overflow-y-auto" style={{ 
        background: `linear-gradient(145deg, #121212 0%, #1a6a1a 100%)`,
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${globalColors.purple.primaryTransparent}20`,
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
      }}>
        {/* Order Summary Header with Table Context */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="p-3 rounded-xl flex items-center justify-center"
                style={{
                  background: `rgba(124, 93, 250, 0.15)`,
                  border: `1px solid ${QSAITheme.border.accent}`,
                  boxShadow: effects.innerGlow('subtle')
                }}
              >
                {orderType === "DINE-IN" ? (
                  <Utensils className="h-6 w-6" style={{ color: QSAITheme.primary }} />
                ) : orderType === "COLLECTION" ? (
                  <Package className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
                ) : orderType === "DELIVERY" ? (
                  <Truck className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
                ) : (
                  <Clock className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
                )}
              </div>
              <div>
                <h3 
                  className="text-lg font-semibold tracking-wide"
                  style={{
                    ...styles.gradientText('medium'),
                    textShadow: effects.textShadow('medium')
                  }}
                >
                  {orderType === "DINE-IN" && tableNumber ? `Table ${tableNumber} Order` : `${orderType} Order`}
                </h3>
                <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                  {orderType === "DINE-IN" && guestCount ? `${guestCount} guest${guestCount > 1 ? 's' : ''}` : `${orderItems.length} item${orderItems.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            {orderItems.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClearOrder}
                className="h-8 rounded-full" 
                style={{ 
                  borderColor: `rgba(255, 255, 255, 0.1)`,
                  color: QSAITheme.text.muted,
                  background: `${QSAITheme.tertiary}80`,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Order Scheduling - Collection and Delivery timing */}
        {(orderType === "COLLECTION" || orderType === "DELIVERY") && (
          <div className="px-4 py-3" style={{ 
            background: `linear-gradient(145deg, rgba(18, 18, 18, 0.9), rgba(26, 26, 26, 0.8))`,
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${globalColors.purple.primaryTransparent}20`,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
          }}>
            <OrderSchedulingInput
              orderType={orderType}
              onSchedulingChange={onSchedulingChange || (() => {})}
              className="w-full"
            />
            
            {/* Display current scheduling info if set */}
            {schedulingData && formatSchedulingDisplay(schedulingData, orderType) && (
              <div className="mt-1 px-3 py-2 rounded-lg" style={{
                background: `linear-gradient(135deg, ${globalColors.purple.primaryTransparent}15 0%, ${globalColors.purple.primaryTransparent}05 100%)`,
                border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                boxShadow: `0 2px 8px ${globalColors.purple.glow}20`
              }}>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">
                    {formatSchedulingDisplay(schedulingData, orderType)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Customer/Table info - only for dine-in */}
        {orderType === "DINE-IN" && tableNumber && (
          <div className="px-4 py-3" style={{ 
            background: `linear-gradient(145deg, rgba(18, 18, 18, 0.8), rgba(26, 26, 26, 0.8))`,
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${globalColors.purple.primaryTransparent}20`,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Table Information for Dine-In */}
            <div className="flex items-center">
              <Utensils className="h-4 w-4 mr-1" style={{ 
                color: globalColors.purple.primary,
                filter: `drop-shadow(0 0 6px ${globalColors.purple.glow})`
              }} />
              <div>
                <span className="font-medium" style={{ 
                  backgroundImage: `linear-gradient(to right, ${colors.text.primary}, ${colors.text.secondary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Table {tableNumber}</span>
                {guestCount ? (
                  <span className="text-xs ml-2" style={{ color: colors.text.secondary }}>{guestCount} {guestCount === 1 ? "guest" : "guestguest"}</span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* SECTION 2: Flexible Content - Scrollable order items list */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{
        background: `linear-gradient(145deg, rgba(18, 18, 18, 0.8), rgba(26, 26, 26, 0.8))`,
        backdropFilter: 'blur(16px)',
        boxShadow: 'inset 0 1px 8px rgba(0,0,0,0.2), inset 0 -1px 8px rgba(0,0,0,0.2)',
        borderTop: `1px solid ${globalColors.purple.primaryTransparent}20`
      }}>
        <div className="p-4"> {/* Padding container */}
          <AnimatePresence>
            {orderItems.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-32 py-10 text-center"
                style={{ 
                  background: `linear-gradient(135deg, rgba(18, 18, 18, 0.9) 0%, rgba(26, 26, 26, 0.9) 100%)`,
                  backdropFilter: 'blur(12px)',
                  borderRadius: '0.75rem',
                  border: `1px solid rgba(255, 255, 255, 0.07)`,
                  boxShadow: '0 10px 20px rgba(0,0,0,0.15)'
                }}
              >
                <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${globalColors.purple.primaryTransparent}20 0%, ${globalColors.purple.primaryTransparent}10 100%)`,
                    border: `1px solid ${globalColors.purple.primaryTransparent}20`,
                    boxShadow: `0 8px 16px ${globalColors.purple.glow}20`
                  }}
                >
                  <Package className="h-8 w-8" style={{ 
                    color: globalColors.purple.primary,
                    filter: `drop-shadow(0 0 8px ${globalColors.purple.glow})`
                  }} />
                </div>
                <h3 className="text-lg font-medium mb-1 text-transparent" style={{ 
                  backgroundImage: `linear-gradient(to right, ${colors.text.primary}, ${colors.text.secondary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>No items in order</h3>
                <p className="text-sm max-w-[250px] text-center" style={{ color: colors.text.secondary }}>
                  Select items from the menu to add them to this order
                </p>
              </motion.div>
            ) : (
              <motion.div layout className="space-y-3">
                {/* Render Multi-Custom Groups */}
                {multiCustomGroups.map((group) => (
                  <MultiCustomOrderCard
                    key={group.groupId}
                    group={group}
                    onViewDetails={(group, triggerElement) => {
                      handleViewMultiCustomDetails(group, triggerElement);
                    }}
                    onCustomizeItem={onCustomizeItem}
                    onRemoveGroup={() => handleRemoveMultiCustomGroup(group)}
                    onUpdateQuantity={onIncrementItem}
                  />
                ))}
                
                {/* Render Regular Items */}
                {regularItems.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    style={{
                      background: `linear-gradient(145deg, #1e1e1e 0%, #222222 100%)`,
                      backdropFilter: 'blur(8px)',
                      border: item.isNewItem 
                        ? `1px solid ${globalColors.purple.primaryTransparent}50`
                        : `1px solid rgba(255, 255, 255, 0.07)`,
                      boxShadow: item.isNewItem 
                        ? `0 8px 16px ${globalColors.purple.glow}10`
                        : '0 8px 16px rgba(0,0,0,0.15)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: item.isNewItem ? `${globalColors.purple.primaryTransparent}10` : 'transparent'
                    }}
                    className="transition-all duration-300 hover:shadow-lg"
                    whileHover={{
                      scale: 1.01,
                      transition: { duration: 0.2 }
                    }}
                  >
                    {item.isNewItem && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`,
                        color: '#FFF',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '0.1rem 0.5rem',
                        borderBottomLeftRadius: '0.375rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}>
                        NEW
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {/* Item Thumbnail */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden" style={{
                              background: `linear-gradient(135deg, ${globalColors.purple.primaryTransparent}20 0%, ${globalColors.purple.primaryTransparent}10 100%)`,
                              border: `1px solid ${globalColors.purple.primaryTransparent}30`
                            }}>
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${item.image_url ? 'hidden' : 'flex'}`}>
                                <Utensils className="h-5 w-5" style={{ color: globalColors.purple.primary, opacity: 0.6 }} />
                              </div>
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1">
                              <h4 className="font-medium" style={{ 
                                backgroundImage: `linear-gradient(to right, ${colors.text.primary}, ${colors.text.secondary})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}>{item.name}</h4>
                              
                              {/* Variant Information */}
                              {item.variant && (
                                <div className="flex items-center mt-1 text-xs" style={{ color: globalColors.purple.primary }}>
                                  <span className="font-medium">{item.variant}</span>
                                  {item.variant_price && item.variant_price > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{
                                      background: `${globalColors.purple.primaryTransparent}20`,
                                      border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                                      color: globalColors.purple.primary
                                    }}>
                                      +{formatCurrency(item.variant_price)}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Customizations and Modifiers */}
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {item.modifiers.map((group, groupIndex) => (
                                    <div key={groupIndex} className="text-xs">
                                      <span className="font-medium" style={{ color: colors.text.secondary }}>
                                        {group.name}:
                                      </span>
                                      <div className="ml-2 space-y-0.5">
                                        {group.options.map((option, optionIndex) => (
                                          <div key={optionIndex} className="flex justify-between items-center">
                                            <span style={{ color: colors.text.primary }}>• {option.name}</span>
                                            {option.price > 0 && (
                                              <span className="text-xs font-medium" style={{ color: globalColors.purple.primary }}>
                                                +{formatCurrency(option.price)}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {item.notes && (
                                <div className="mt-2 s-2 rounded text-xs" style={{
                                  background: `${globalColors.purple.primaryTransparent}10`,
                                  border: `1px solid ${globalColors.purple.primaryTransparent}20`,
                                  color: colors.text.primary
                                }}>
                                  <span className="font-medium" style={{ color: globalColors.purple.primary }}>Note:</span> {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <span className="font-semibold" style={{ 
                            color: '#FFFFFF'
                          }}>
                            £{(calculateItemTotal(item)).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Set Meal Items Display */}
                        {item.item_type === 'set_meal' && item.set_meal_items && item.set_meal_items.length > 0 && (
                          <div className="mt-2 space-y-1 p-2 rounded-md" style={{
                            background: `linear-gradient(145deg, ${colors.background.tertiary}50 0%, ${colors.background.secondary}50 100%)`,
                            backdropFilter: 'blur(6px)',
                            border: `1px solid rgba(255, 255, 255, 0.05)`,
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}>
                            <div className="text-xs font-medium mb-1" style={{ 
                              color: globalColors.purple.light,
                              textShadow: `0 0 8px ${globalColors.purple.glow}`
                            }}>
                              Includes:
                            </div>
                            {item.set_meal_items.map((setItem, setIdx) => (
                              <div key={setIdx} className="flex justify-between text-xs ml-2">
                                <span style={{ color: colors.text.secondary }}>
                                  {setItem.quantity}x {setItem.menu_item_name}
                                  {setItem.category_name && (
                                    <span className="text-xs ml-1 opacity-60">({setItem.category_name})</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Regular variant name for menu items */}
                        {item.item_type !== 'set_meal' && item.variantName && (
                          <div className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                            {item.variantName}
                          </div>
                        )}
                        
                        {/* Item status for DINE-IN orders */}
                        {orderType === "DINE-IN" && tableNumber && (
                          <div className="flex items-center mt-1">
                            {item.sentToKitchen ? (
                              <Badge 
                                variant="outline"
                                className="text-xs py-0 h-5 px-1.5 mr-2"
                                style={{
                                  background: `${globalColors.purple.primaryTransparent}20`,
                                  color: globalColors.purple.primary,
                                  borderColor: `${globalColors.purple.primaryTransparent}30`,
                                  backdropFilter: 'blur(4px)'
                                }}
                              >
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                Sent to Kitchen
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline"
                                className="text-xs py-0 h-5 px-1.5 mr-2"
                                style={{
                                  background: `${globalColors.purple.primaryTransparent}20`,
                                  color: '#FFFFFF',
                                  borderColor: `${globalColors.purple.primaryTransparent}30`,
                                  backdropFilter: 'blur(4px)'
                                }}
                              >
                                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                Not Sent
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Only show modifiers for regular menu items, not Set Meals */}
                        {item.item_type !== 'set_meal' && item.modifiers && item.modifiers.length > 0 && (
                          <div className="mt-1 space-y-1 p-2 rounded-md" style={{
                            background: `linear-gradient(145deg, ${colors.background.tertiary}50 0%, ${colors.background.secondary}50 100%)`,
                            backdropFilter: 'blur(6px)',
                            border: `1px solid rgba(255, 255, 255, 0.05)`,
                            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}>
                            {item.modifiers.map((group, groupIdx) => (
                              <div key={groupIdx}>
                                <div className="text-xs font-medium mb-1" style={{ 
                                  color: globalColors.purple.light,
                                  textShadow: `0 0 8px ${globalColors.purple.glow}`
                                }}>
                                  {group.name}
                                </div>
                                {group.options.map((option, optionIdx) => (
                                  <div key={optionIdx} className="flex justify-between text-xs ml-2">
                                    <span style={{ color: colors.text.secondary }}>{option.name}</span>
                                    {option.price > 0 && (
                                      <span style={{ 
                                        color: globalColors.purple.primary,
                                        textShadow: `0 0 8px ${globalColors.purple.glow}`,
                                        marginLeft: '0.5rem' 
                                      }}>+{formatCurrency(option.price)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {item.notes && (
                          <div className="mt-2 text-sm italic py-1.5 px-2.5 rounded-md"
                            style={{ 
                              color: colors.text.secondary,
                              borderLeft: `2px solid ${globalColors.purple.primary}`,
                              background: `${globalColors.purple.primaryTransparent}70`,
                              backdropFilter: 'blur(6px)',
                              border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}>
                            {item.notes}
                          </div>
                        )}
                        
                        {item.printedOnTicket && (
                          <div className="mt-7 flex items-center">
                            <ChefHat className="h-3.5 w-3.5 mr-1" style={{ 
                              color: globalColors.purple.primary,
                              filter: `drop-shadow(0 0 3px ${globalColors.purple.glow})`
                            }} />
                            <span className="text-xs" style={{ color: globalColors.purple.primary }}>Sent to kitchen</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center overflow-hidden p-0.5 rounded-lg" 
                        style={{ 
                          background: `linear-gradient(145deg, ${colors.background.tertiary}80 0%, ${colors.background.secondary}80 100%)`,
                          border: `1px solid rgba(255, 255, 255, 0.07)`,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                          backdropFilter: 'blur(8px)'
                        }}>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          style={{ 
                            height: '1.75rem',
                            width: '1.75rem',
                            color: colors.text.primary,
                            borderRadius: '0.375rem 0 0 0.375rem',
                            borderRight: `1px solid rgba(255, 255, 255, 0.05)`
                          }}
                          className="flex items-center justify-center hover:bg-[rgba(0,0,0,0.2)] transition-colors duration-200"
                          onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </motion.button>
                        <span className="w-7 text-center font-medium" style={{ 
                          backgroundImage: `linear-gradient(to right, ${colors.text.primary}, ${colors.text.secondary})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>{item.quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          style={{ 
                            height: '1.65rem',
                            width: '1.75rem',
                            color: colors.text.primary,
                            borderRadius: '0 0.375rem 0.375rem 0',
                            borderLeft: `1px solid rgba(255, 255, 255, 0.05)`
                          }}
                          className="flex items-center justify-center hover:bg-[rgba(0,0,0,0.2)] transition-colors duration-200"
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Customize Button */}
                        {onCustomizeItem && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onCustomizeItem(index, item)}
                            style={{ 
                              height: '1.65rem',
                              width: '1.75rem',
                              background: `linear-gradient(145deg, ${globalColors.purple.primaryTransparent}30 0%, ${globalColors.purple.primaryTransparent}80 100%)`,
                              color: globalColors.purple.primary,
                              borderRadius: '0.375rem',
                              border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                              boxShadow: `0 2px 4px ${globalColors.purple.glow}15`,
                              backdropFilter: 'blur(4px)'
                            }}
                            className="flex items-center justify-center transition-colors duration-200 hover:shadow-lg"
                            title="Customize item"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </motion.button>
                        )}
                        
                        {/* Delete Button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onRemoveItem(item.id)}
                          style={{ 
                            height: '1.65rem',
                            width: '1.75rem',
                            background: `linear-gradient(145deg, ${colors.status.error}30 0%, ${colors.status.error}80 100%)`,
                            color: colors.status.error,
                            borderRadius: '0.375rem',
                            border: `1px solid ${colors.status.error}30`,
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)',
                            backdropFilter: 'blur(4px)'
                          }}
                          className="flex items-center justify-center transition-colors duration-200"
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* SECTION 3: Fixed Footer - Order totals, taxes, and action buttons */}
      <div className="flex-shrink-0 border-t" style={{ 
        background: `linear-gradient(145deg, rgba(18, 18, 18, 0.98), rgba(26, 26, 26, 0.98))`,
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid rgba(124, 93, 250, 0.3)`,
        boxShadow: '0 -8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
      }}>
        {/* Pricing Breakdown - Made more compact */}
        <div className="space-y-1 px-4 pt-3 pb-2">
          <div className="flex justify-between items-center">
            <span style={{ color: colors.text.secondary, fontSize: '0.875rem' }}>Subtotal:</span>
            <span className="font-medium" style={{ 
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>{formatCurrency(subtotal)}</span>
          </div>
          
          {orderType === "DELIVERY" && (
            <div className="flex justify-between items-center">
              <span style={{ color: colors.text.secondary, fontSize: '0.875rem' }}>Delivery Fee:</span>
              <span className="font-medium" style={{ 
              color: '#FFFFFF',
              fontSize: '0.875rem'
            }}>{deliveryFeeValue === 0 ? "FREE" : formatCurrency(deliveryFeeValue)}</span>
            </div>
          )}

          {orderType === "DINE-IN" && window.posSettings?.service_charge?.enabled && (
            <div className="flex justify-between items-center">
              <span style={{ color: colors.text.secondary, fontSize: '0.875rem' }}>
                Service Charge ({window.posSettings?.service_charge?.percentage || serviceCharge}%):
              </span>
              <span className="font-medium" style={{ 
              color: '#FFFFFF',
              fontSize: '0.875rem'
            }}>{formatCurrency(serviceChargeValue)}</span>
            </div>
          )}
          
          <div className="py-2 mt-1 flex justify-between items-center" 
            style={{ 
              position: 'relative',
              borderRadius: '0 0 8px 8px',
              border: '1px solid rgba(124, 93, 250, 0.2)',
              borderTop: '1px solid rgba(124, 93, 250, 0.25)',
              background: 'rgba(18, 18, 18, 0.7)',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 0 15px rgba(124, 93, 250, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
              padding: '12px 10px',
              marginBottom: '4px',
              zIndex: 1
            }}>
            <span style={{ 
              color: '#FFFFFF', 
              fontWeight: 700, 
              fontSize: '1.1rem'
            }}>Total:</span>
            <span className="text-xl font-extrabold" style={{ 
              color: '#FFFFFF',
              fontSize: '1.4rem',
              letterSpacing: '0.02em'
            }}>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="p-4 space-y-3">
          {orderType === "DINE-IN" && tableNumber ? (
            /* Single Save Order Button - Opens Preview Modal with 3 choices */
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={orderItems.length === 0}
              onClick={handleSendToKitchen}
              style={{
                background: orderItems.length === 0
                  ? `rgba(18, 18, 18, 0.8)`
                  : `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                color: orderItems.length === 0 ? colors.text.disabled : QSAITheme.text.primary,
                boxShadow: orderItems.length === 0 ? 'none' : `0 8px 16px rgba(0,0,0,0.2), 0 0 10px ${QSAITheme.purple.glow}`,
                border: `1px solid ${orderItems.length === 0 ? 'rgba(255, 255, 255, 0.05)' : `${QSAITheme.purple.primaryTransparent}30`}`,
                borderRadius: '0.75rem',
                backdropFilter: 'blur(4px)',
                padding: '0.875rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                textShadow: orderItems.length === 0 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.3)',
                cursor: orderItems.length === 0 ? 'not-allowed' : 'pointer',
              }}
              className="w-full flex items-center justify-center transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Order
            </motion.button>
          ) : (
            /* Unified Process Order Button for COLLECTION/DELIVERY/WAITING */
            <div className="space-y-3">
              {/* Single Process Order Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={orderItems.length === 0 || paymentProcessing}
                onClick={handleProcessOrder}
                style={{
                  background: orderItems.length === 0
                    ? `rgba(18, 18, 18, 0.8)`
                    : `linear-gradient(135deg, ${colors.brand.turquoise} 0%, ${colors.brand.tealLight} 100%)`,
                  color: orderItems.length === 0 ? colors.text.disabled : colors.text.primary,
                  boxShadow: orderItems.length === 0 ? 'none' : `0 8px 16px rgba(0,0,0,0.2), 0 0 10px ${colors.brand.turquoise}40`,
                  cursor: orderItems.length === 0 ? 'not-allowed' : 'pointer',
                  borderRadius: '0.75rem',
                  border: `1px solid ${orderItems.length === 0 ? 'rgba(255, 255, 255, 0.05)' : `${colors.brand.turquoise}30`}`,
                  backdropFilter: 'blur(4px)',
                  padding: '0.875rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  letterSpacing: '0.01em',
                  textShadow: orderItems.length === 0 ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.3)',
                }}
                className="w-full flex items-center justify-center transition-all duration-300"
              >
                {paymentProcessing ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.5))' }} />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Receipt className="h-4 w-4 mr-2" style={{ filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.5))' }} />
                    Process Order • {formatCurrency(total)}
                  </span>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
      
      {/* Multi-custom Details Modal */}
      <MultiCustomDetailsModal
        isOpen={showMultiCustomDetails}
        group={selectedMultiCustomGroup}
        onClose={() => setShowMultiCustomDetails(false)}
        onEditPortion={handleEditMultiCustomPortion}
        triggerElement={detailsTriggerElement}
      />
      
      {/* Unified Payment Modal - Replaces POSStripePayment */}
      <POSUnifiedPaymentModal
        isOpen={showStripePayment}
        onClose={handleStripeCancel}
        orderItems={orderItems}
        orderTotal={(() => {
          const calculatedTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          console.log('🔍 POSOrderSummary → POSUnifiedPaymentModal orderTotal:', {
            total,
            calculatedTotal,
            totalType: typeof total,
            orderItemsLength: orderItems.length,
            showStripePayment,
            orderItems: orderItems.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity
            }))
          });
          return calculatedTotal || 0;
        })()}
        orderType={orderType}
        tableNumber={tableNumber}
        customerFirstName={customerFirstName}
        customerLastName={customerLastName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        onPaymentComplete={handleStripeSuccess}
      />
      
      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showOrderConfirmation}
        onClose={() => setShowOrderConfirmation(false)}
        orderItems={orderItems.map(item => ({
          id: item.id,
          menu_item_id: item.menu_item_id || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variant_name: item.variantName || item.variant_name || null,
          notes: item.notes || null,
          protein_type: item.proteinType || item.protein_type || null,
          image_url: item.imageUrl || item.image_url || null,
          modifiers: item.modifiers || [],
          customizations: item.customizations || []
        }))}
        orderType={orderType}
        tableNumber={tableNumber}
        guestCount={guestCount}
        customerFirstName={customerFirstName}
        customerLastName={customerLastName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        customerStreet={customerStreet}
        customerPostcode={customerPostcode}
        subtotal={calculateSubtotal()}
        serviceCharge={calculateServiceCharge()}
        deliveryFee={orderType === 'DELIVERY' ? (typeof deliveryFee === 'number' ? deliveryFee : parseFloat(deliveryFee as unknown as string) || 0) : 0}
        total={total}
        onConfirm={handleOrderConfirmation}
        actionLabel={getOrderConfirmationActionLabel()}
      />
    </div>
  );
}

// Remove the incorrect handleTipSelection function from bottom
// const handleTipSelection = (tip: TipSelection) => {
//   // Implement tip selection logic here
//   console.log(`Tip selected: ${tip}`);
// };
