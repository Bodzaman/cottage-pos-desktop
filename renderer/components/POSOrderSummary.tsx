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
  AlertCircle,
  Package,
  Truck,
  Eye
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { OrderItem, ModifierSelection, CustomizationSelection, PaymentResult } from '../utils/menuTypes';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import POSTipSelector, { TipSelection } from './POSTipSelector';
import { pendingPaymentService } from '../utils/pendingPaymentService';
import { SchedulingData } from '../utils/schedulingTypes';
import { TableStatus } from '../utils/masterTypes';
import { kitchenService } from '../utils/kitchenService';
import { 
  groupMultiCustomItems, 
  MultiCustomGroup 
} from '../utils/multiCustomGrouping';
import { MultiCustomOrderCard } from './MultiCustomOrderCard';
import { MultiCustomDetailsModal } from './MultiCustomDetailsModal';
import { OrderSchedulingInput } from './OrderSchedulingInput';
import { POSUnifiedPaymentModal } from './POSUnifiedPaymentModal';
import { colors, globalColors, QSAITheme, effects } from '../utils/QSAIDesign';
import { styles } from '../utils/QSAIDesign';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { useCustomerDataStore } from '../utils/customerDataStore';

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
  customerEmail?: string;
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
  onQuantityChange?: (index: number, newQuantity: number) => void;
  onCustomizeItem?: (index: number, item: OrderItem) => void;
  onSchedulingChange?: (data: SchedulingData) => void;
  schedulingData?: SchedulingData | null;
  sentToKitchen?: boolean;
  hasNewOrUnprintedItems?: boolean;
  billPrinted?: boolean;
  minimumOrderMet?: boolean;
  minimumOrderAmount?: number;
  tableStatus?: TableStatus;
  kitchenTicketsCount?: number;
  paymentCompleted?: boolean;
  collectionCompleted?: boolean;
  deliveryDistance?: number | null;
  deliveryTime?: string | null;
  deliveryFee?: number;
  showVatBreakdown?: boolean;
  tax?: number;
  serviceCharge?: number;
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
const calculateItemTotal = (item: OrderItem): number => {
  let total = item.price * item.quantity;
  
  // For Set Meals, the price is already the complete set price
  if (item.item_type === 'set_meal') {
    return total;
  }
  
  // For regular menu items, add modifier costs
  if (item.modifiers && item.modifiers.length > 0) {
    item.modifiers.forEach((group: any) => {
      if (group.options) {
        group.options.forEach((option: any) => {
          total += (option.price || 0) * item.quantity;
        });
      } else if (group.price_adjustment) {
        total += group.price_adjustment * item.quantity;
      }
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

// Helper function to format scheduling display
const formatSchedulingDisplay = (data: SchedulingData, orderType: string) => {
  if (orderType === "COLLECTION" && data.pickup_time) {
    return `Collection at ${data.pickup_time}`;
  }
  if (orderType === "DELIVERY" && data.delivery_time) {
    return `Delivery at ${data.delivery_time}`;
  }
  return null;
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
  customerEmail,
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
  billPrinted = false,
  minimumOrderMet = true,
  tableStatus = 'AVAILABLE',
  paymentCompleted = false,
  collectionCompleted = false,
  deliveryFee = 0,
  tax = 0,
  serviceCharge = 0,
  paymentProcessing: initialPaymentProcessing = false,
  isPaymentComplete: initialIsPaymentComplete = false,
  isDeliveryDispatched: initialIsDeliveryDispatched = false,
  setIsDeliveryDispatched: parentSetIsDeliveryDispatched = () => {},
  
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
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(initialPaymentProcessing);
  const [isPaymentComplete, setIsPaymentComplete] = useState<boolean>(initialIsPaymentComplete);
  const [isDeliveryDispatched, setIsDeliveryDispatched] = useState<boolean>(initialIsDeliveryDispatched);
  const [currentTipSelection, setCurrentTipSelection] = useState<TipSelection | null>(null);
  
  // Customer data store integration
  const { hasRequiredCustomerData } = useCustomerDataStore();
  
  // Multi-custom modal state
  const [selectedMultiCustomGroup, setSelectedMultiCustomGroup] = useState<MultiCustomGroup | null>(null);
  const [showMultiCustomDetails, setShowMultiCustomDetails] = useState<boolean>(false);
  const [detailsTriggerElement, setDetailsTriggerElement] = useState<HTMLElement | undefined>(undefined);
  
  // Group multi-custom items
  const { multiCustomGroups, regularItems } = groupMultiCustomItems(orderItems);
  
  // Multi-custom group handlers
  const handleViewMultiCustomDetails = (group: MultiCustomGroup, triggerElement?: HTMLElement) => {
    setSelectedMultiCustomGroup(group);
    setDetailsTriggerElement(triggerElement);
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
  
  const globalPosSettings = (window as any).posSettings;

  if (orderType === "DELIVERY") {
    // Check global settings first
    if (globalPosSettings?.delivery_charge) {
      if (globalPosSettings.delivery_charge.enabled) {
        // Use the configured amount from settings
        deliveryFeeValue = globalPosSettings.delivery_charge.amount;
      } else {
        // Delivery charge is disabled in settings
        deliveryFeeValue = 0;
      }
    } else {
      // Fallback to prop if settings not available
      deliveryFeeValue = deliveryFee;
    }
  }
  
  // Apply service charge conditionally based on settings
  let serviceChargeValue = 0;
  if (orderType === "DINE-IN") {
    if (globalPosSettings?.service_charge && globalPosSettings.service_charge.enabled) {
      serviceChargeValue = subtotal * (globalPosSettings.service_charge.percentage / 100);
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
      if (globalPosSettings?.service_charge && globalPosSettings.service_charge.enabled) {
        totalWithCharges += subtotalCalc * (globalPosSettings.service_charge.percentage / 100);
      } else {
        // Default service charge if settings not available
        totalWithCharges += subtotalCalc * (serviceCharge / 100);
      }
    }
    
    // Add delivery fee if applicable (for DELIVERY orders) - use restaurant delivery settings
    if (orderType === "DELIVERY") {
      // Use restaurant delivery settings from props
      totalWithCharges += deliveryFee;
    }
    
    return totalWithCharges;
  }, [orderItems, orderType, serviceCharge, deliveryFee, globalPosSettings]);
  
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
        customerReceiptPrinted: true,
        status: 'PENDING_PAYMENT'
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
    const currentSubtotal = calculateSubtotal();
    
    // Use POS settings if available, otherwise fallback to default
    if (globalPosSettings?.service_charge && globalPosSettings.service_charge.enabled) {
      return currentSubtotal * (globalPosSettings.service_charge.percentage / 100);
    } else {
      return currentSubtotal * 0.10; // 10% service charge for dine-in (fallback)
    }
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
    
    // Store tip selection for payment modal
    setCurrentTipSelection(tipSelection);
    
    // Open payment modal with updated total
    setShowPaymentModal(true);
    
    toast.success(`Tip added: ${formatCurrency(tipAmount)}`, {
      description: `Total with tip: ${formatCurrency(totalWithTip)}`
    });
  };
  
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
    
    // Call the printBill callback
    if (onPrintBill) {
      onPrintBill();
      // Notify the kitchen service of the status change
      kitchenService.syncWithPOS();
    }
  };
  
  const hasNewOrUnprintedItemsCalculated = orderItems.some(item => (item as any).isNewItem || ((item as any).sentToKitchen === false));
  const allItemsSentToKitchen = orderItems.length > 0 && (sentToKitchen || orderItems.every(item => (item as any).sentToKitchen));

  // Stripe Modal Handlers
  const handleStripeSuccess = (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    setShowStripePayment(false);
    setPaymentProcessing(true);
    
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
      // For DINE-IN orders
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

  const handleStripeCancel = () => {
    setShowStripePayment(false);
    setPaymentProcessing(false);
  };

  // Handle payment confirmation with real cash payment recording
  const handlePaymentConfirm = async (result: PaymentResult) => {
    setShowPaymentModal(false);
    setPaymentProcessing(true);
    
    try {
      // For DELIVERY orders, handle different payment scenarios
      if (orderType === "DELIVERY") {
        setIsPaymentComplete(true);
        toast.success(`Payment method ${result.method} confirmed for delivery`);
      } else {
        // Handle non-delivery orders
        const orderData = {
          order_id: `POS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          order_type: orderType,
          order_source: 'POS',
          customer_name: customerFirstName || 'Walk-in Customer',
          table_number: tableNumber,
          guest_count: guestCount,
          items: orderItems.map(item => ({
            item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variant_name: item.variantName,
            modifiers: item.modifiers,
            notes: item.notes
          })),
          subtotal: subtotal,
          tax_amount: tax,
          service_charge: serviceChargeValue,
          total_amount: total,
          payment: {
            method: result.method,
            amount: total,
            cash_received: result.cashReceived,
            change_given: result.change,
            timestamp: new Date().toISOString()
          },
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        };
        
        // Store the order first
        const storeResponse = await apiClient.store_order(orderData);
        const storeResult = await storeResponse.json();
        
        if (storeResult.success) {
          toast.success(`Payment processed via ${result.method.toLowerCase()}`);
          
          if (orderType === 'COLLECTION' || orderType === 'WAITING') {
            setIsPaymentComplete(true);
          } else {
            if (onProcessPayment) onProcessPayment();
          }
        } else {
          toast.error('Order storage failed', {
            description: storeResult.message
          });
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed');
    } finally {
      setPaymentProcessing(false);
      kitchenService.syncWithPOS();
    }
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
                  <Utensils className="h-6 w-6" style={{ color: QSAITheme.text.primary || '#FFF' }} />
                ) : orderType === "COLLECTION" ? (
                  <Package className="h-6 w-6" style={{ color: globalColors.purple.primary }} />
                ) : orderType === "DELIVERY" ? (
                  <Truck className="h-6 w-6" style={{ color: globalColors.purple.primary }} />
                ) : (
                  <Clock className="h-6 w-6" style={{ color: globalColors.purple.primary }} />
                )}
              </div>
              <div>
                <h3 
                  className="text-lg font-semibold tracking-wide"
                  style={{
                    color: '#FFF',
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
                  background: `${QSAITheme.background.tertiary}80`,
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
      </div>
      
      {/* SECTION 2: Flexible Content - Scrollable order items list */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{
        background: `linear-gradient(145deg, rgba(18, 18, 18, 0.8), rgba(26, 26, 26, 0.8))`,
        backdropFilter: 'blur(16px)',
        boxShadow: 'inset 0 1px 8px rgba(0,0,0,0.2), inset 0 -1px 8px rgba(0,0,0,0.2)',
        borderTop: `1px solid ${globalColors.purple.primaryTransparent}20`
      }}>
        <div className="p-4">
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
                <h3 className="text-lg font-medium mb-1" style={{ color: '#FFF' }}>No items in order</h3>
                <p className="text-sm max-w-[250px] text-center" style={{ color: '#999' }}>
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
                    onViewDetails={(group) => {
                      handleViewMultiCustomDetails(group);
                    }}
                    onCustomizeItem={onCustomizeItem}
                    onRemoveGroup={() => handleRemoveMultiCustomGroup(group)}
                    onUpdateQuantity={(itemId, newQuantity) => onQuantityChange && onQuantityChange(orderItems.findIndex(i => i.id === itemId), newQuantity)}
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
                      border: (item as any).isNewItem 
                        ? `1px solid ${globalColors.purple.primaryTransparent}50`
                        : `1px solid rgba(255, 255, 255, 0.07)`,
                      boxShadow: (item as any).isNewItem 
                        ? `0 8px 16px ${globalColors.purple.glow}10`
                        : '0 8px 16px rgba(0,0,0,0.15)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    className="transition-all duration-300 hover:shadow-lg"
                  >
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
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Utensils className="h-5 w-5" style={{ color: globalColors.purple.primary, opacity: 0.6 }} />
                                </div>
                              )}
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{item.name}</h4>
                              {item.variantName && (
                                <div className="text-sm mt-1" style={{ color: '#999' }}>
                                  {item.variantName}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <span className="font-semibold text-white">
                            {formatCurrency(calculateItemTotal(item))}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center overflow-hidden p-0.5 rounded-lg" 
                        style={{ 
                          background: `rgba(0,0,0,0.2)`,
                          border: `1px solid rgba(255, 255, 255, 0.07)`
                        }}>
                        <button
                          className="h-7 w-7 flex items-center justify-center text-white"
                          onClick={() => onQuantityChange && onQuantityChange(index, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center font-medium text-white">{item.quantity}</span>
                        <button
                          className="h-7 w-7 flex items-center justify-center text-white"
                          onClick={() => onQuantityChange && onQuantityChange(index, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {onCustomizeItem && (
                          <button
                            onClick={() => onCustomizeItem(index, item)}
                            className="h-7 w-7 flex items-center justify-center rounded border"
                            style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#999' }}
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveItem && onRemoveItem(item.id)}
                          className="h-7 w-7 flex items-center justify-center rounded border"
                          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'rgb(239, 68, 68)' }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
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
        background: `rgba(18, 18, 18, 0.98)`,
        borderTop: `1px solid rgba(124, 93, 250, 0.3)`
      }}>
        {/* Pricing Breakdown */}
        <div className="space-y-1 px-4 pt-3 pb-2 text-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span>Subtotal:</span>
            <span className="text-white">{formatCurrency(subtotal)}</span>
          </div>
          
          {orderType === "DELIVERY" && (
            <div className="flex justify-between items-center text-gray-400">
              <span>Delivery Fee:</span>
              <span className="text-white">{deliveryFeeValue === 0 ? "FREE" : formatCurrency(deliveryFeeValue)}</span>
            </div>
          )}

          {orderType === "DINE-IN" && serviceChargeValue > 0 && (
            <div className="flex justify-between items-center text-gray-400">
              <span>Service Charge:</span>
              <span className="text-white">{formatCurrency(serviceChargeValue)}</span>
            </div>
          )}
          
          <div className="py-2 mt-1 flex justify-between items-center border-t border-white/5">
            <span className="text-white font-bold">Total:</span>
            <span className="text-xl font-extrabold text-white">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="p-4">
          <Button
            disabled={orderItems.length === 0 || paymentProcessing}
            onClick={handleProcessOrder}
            className="w-full h-12 font-bold"
            style={{
              background: `linear-gradient(135deg, ${colors.purple?.primary || '#7C5DFA'} 0%, ${colors.purple?.dark || '#5B3CC4'} 100%)`
            }}
          >
            {paymentProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Receipt className="h-4 w-4 mr-2" />
            )}
            Process Order • {formatCurrency(total)}
          </Button>
        </div>
      </div>
      
      <MultiCustomDetailsModal
        isOpen={showMultiCustomDetails}
        group={selectedMultiCustomGroup}
        onClose={() => setShowMultiCustomDetails(false)}
        onEditPortion={handleEditMultiCustomPortion}
        triggerElement={detailsTriggerElement}
      />
      
      <POSUnifiedPaymentModal
        isOpen={showStripePayment}
        onClose={handleStripeCancel}
        orderItems={orderItems}
        orderTotal={total}
        orderType={orderType}
        tableNumber={tableNumber}
        customerFirstName={customerFirstName}
        customerLastName={customerLastName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        onPaymentComplete={(tipSelection, paymentResult) => handleStripeSuccess(tipSelection, paymentResult)}
      />
      
      <OrderConfirmationModal
        isOpen={showOrderConfirmation}
        onClose={() => setShowOrderConfirmation(false)}
        orderItems={orderItems.map(item => ({
          id: item.id,
          menu_item_id: item.menu_item_id || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variant_name: item.variantName || null,
          notes: item.notes || null,
          protein_type: item.protein_type || null,
          image_url: item.image_url || null,
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
        deliveryFee={orderType === 'DELIVERY' ? deliveryFee : 0}
        total={total}
        onConfirm={handleOrderConfirmation}
        actionLabel={getOrderConfirmationActionLabel()}
      />
    </div>
  );
}
