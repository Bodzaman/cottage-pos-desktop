import React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Clock,
  Users,
  MapPin,
  ChefHat,
  CheckCircle,
  Loader2,
  Star,
  Save,
  Utensils,
  Settings,
  Cog
} from 'lucide-react';
import { OrderItem, ModifierSelection, CustomizationSelection, TipSelection } from '../utils/menuTypes';
import { ConfirmationModal } from './ConfirmationModal';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import { TableSelectionModal } from './TableSelectionModal';
import { colors, globalColors as QSAITheme, effects } from '../utils/QSAIDesign';
import { formatCurrency } from '../utils/formatters';
import { usePOSSettingsWithAutoFetch } from '../utils/posSettingsStore';
import { useCustomerDataStore } from '../utils/customerDataStore';
import { useCustomizeOrchestrator } from './CustomizeOrchestrator';
import brain from 'brain';
import { createLogger } from 'utils/logger';
import { colors as designColors } from '@/utils/designSystem';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { StaffCustomizationModal, SelectedCustomization } from './StaffCustomizationModal';

interface Props {
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
  customerData?: CustomerData;
  onRemoveItem?: (itemId: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onClearOrder?: () => void;
  onProcessPayment?: () => void;
  onSendToKitchen?: () => void;
  onPrintBill?: () => void;
  onSaveUpdate?: (tableNumber: number, orderItems: OrderItem[]) => void;
  onTableSelect?: (tableNumber: number) => void;
  onCustomerDetailsClick?: () => void;
  onTableSelectionClick?: () => void;
  onCustomizeItem?: (index: number, item: OrderItem) => void;
  
  // Payment Modal props - SIMPLIFIED
  onShowPaymentModal?: () => void;
  onPrintReceipt?: () => void;
  
  // ✅ NEW: Direct props control for Order Confirmation Modal
  showOrderConfirmation?: boolean;
  onCloseOrderConfirmation?: () => void;
  onShowOrderConfirmation?: () => void;
  
  // ✅ ADD: Action callback for order confirmation
  onOrderConfirmed?: (action: 'payment' | 'no_payment' | 'add_to_order' | 'send_to_kitchen' | 'make_changes') => void;
  
  // ✅ NEW: Table Selection Modal props
  showTableSelection?: boolean;
  onCloseTableSelection?: () => void;
  
  className?: string;
  deliveryFee?: number;
  minimumOrderMet?: boolean;
  minimumOrderAmount?: number;
}

/**
 * Enhanced order summary panel with proper component architecture and QSAI design
 * Follows the clean architecture pattern from DineInOrderSummary but adapted for main POS workflow
 * Now includes integrated Stripe payment functionality
 * 
 * PERFORMANCE: Memoized to prevent re-renders when props unchanged
 */
const OrderSummaryPanel = React.memo(function OrderSummaryPanel({
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
  customerData,
  onRemoveItem,
  onUpdateQuantity,
  onClearOrder,
  onProcessPayment,
  onSendToKitchen,
  onPrintBill,
  onSaveUpdate,
  onTableSelect,
  onCustomerDetailsClick,
  onTableSelectionClick,
  onCustomizeItem,
  
  // Payment Modal props - SIMPLIFIED
  onShowPaymentModal,
  onPrintReceipt,
  
  showOrderConfirmation = false,
  onCloseOrderConfirmation,
  onShowOrderConfirmation,
  onOrderConfirmed,
  showTableSelection = false,
  onCloseTableSelection,
  className = ''
}: Props) {
  const logger = createLogger('OrderSummaryPanel');

  // ✅ Get POS settings from store
  const { settings: posSettings } = usePOSSettingsWithAutoFetch();
  
  // ✅ Get menu items from store for customization modal
  const { menuItems, itemVariants } = useRealtimeMenuStore();
  
  // ✅ NEW: State for StaffCustomizationModal
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [customizingOrderItem, setCustomizingOrderItem] = useState<OrderItem | null>(null);
  const [customizingItemIndex, setCustomizingItemIndex] = useState<number>(-1);
  
  // ✅ FIX: Add missing state for final bill modal (DINE-IN)
  const [showFinalBillModal, setShowFinalBillModal] = useState(false);
  
  // UI State Management
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: () => void; label: string } | null>(null);
  
  // Removed legacy local modal state in favor of parent Orchestrator
  // const [internalShowStripePayment, setInternalShowStripePayment] = useState<boolean>(false);
  // const [showPaymentModalState, setShowPaymentModal] = useState<boolean>(false);
  // const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState<boolean>(false);
  const [currentTipSelection, setCurrentTipSelection] = useState<TipSelection | null>(null);
  
  // Get customer data from store
  const { customerData: storeCustomerData } = useCustomerDataStore();
  
  // ✅ NEW: Handler to open StaffCustomizationModal for editing order items
  const handleOpenCustomization = (index: number, item: OrderItem) => {
    setCustomizingOrderItem(item);
    setCustomizingItemIndex(index);
    setIsCustomizationModalOpen(true);
  };
  
  // ✅ NEW: Handler to save customized item from StaffCustomizationModal
  const handleCustomizationConfirm = (menuItem: MenuItem, quantity: number, variant?: any, customizations?: SelectedCustomization[], notes?: string) => {
    if (customizingItemIndex === -1 || !customizingOrderItem) return;
    
    // Build updated OrderItem
    const updatedItem: OrderItem = {
      ...customizingOrderItem,
      quantity: quantity,
      notes: notes || '',
      customizations: customizations?.map(c => ({
        id: c.id,
        customization_id: c.id,
        name: c.name,
        price_adjustment: c.price,
        group: c.group
      })) || customizingOrderItem.customizations || []
    };
    
    // Call parent callback if it exists
    if (onCustomizeItem) {
      onCustomizeItem(customizingItemIndex, updatedItem);
    }
    
    // Close modal
    setIsCustomizationModalOpen(false);
    setCustomizingOrderItem(null);
    setCustomizingItemIndex(-1);
    
    toast.success('Item updated successfully');
  };
  
  // Helper function to show confirmation modal
  const handleShowConfirmation = (action: () => void, label: string) => {
    setPendingAction({ action, label });
    setShowConfirmationModal(true);
  };

  // Handle Order Confirmation Modal close - notify parent and update internal state
  const handleOrderConfirmationClose = () => {
    if (onCloseOrderConfirmation) {
      onCloseOrderConfirmation();
    }
  };

  // Unified Process Order handler with smart validation
  const handleProcessOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('No items to process');
      return;
    }

    // DELIVERY Orders: Check minimum order value first
    if (orderType === 'DELIVERY') {
      const minimumOrder = 15; // Default minimum, should come from POS settings
      const orderTotal = subtotal + serviceCharge + deliveryFee;
      if (orderTotal < minimumOrder) {
        toast.error(`Minimum order value is ${formatCurrency(minimumOrder)}`, {
          description: `Current order: ${formatCurrency(orderTotal)}`
        });
        return;
      }
    }

    // WAITING/COLLECTION Orders: Check if customer first name is provided
    if ((orderType === 'WAITING' || orderType === 'COLLECTION') && !customerFirstName && !customerData?.firstName) {
      // Trigger customer details modal instead of showing toast
      if (onCustomerDetailsClick) {
        onCustomerDetailsClick();
      } else {
        toast.info('Customer details required', {
          description: 'Please add customer information to continue'
        });
      }
      return;
    }

    // DINE-IN Orders: Check if table is assigned and guest count is set
    if (orderType === 'DINE-IN') {
      if (!tableNumber) {
        // Trigger table selection modal instead of local modal
        if (onTableSelectionClick) {
          onTableSelectionClick();
        } else {
          toast.info('Table selection required', {
            description: 'Please select a table for this dine-in order'
          });
        }
        return;
      }
      
      if (!guestCount || guestCount === 0) {
        toast.info('Guest count required', {
          description: 'Please set the number of guests for this table'
        });
        return;
      }
    }

    // All validations passed - open Order Confirmation Modal
    console.log('✅ All validations passed, opening Payment Flow Orchestrator');
    // Prefer new unified payment flow orchestrator
    if (onShowPaymentModal) {
      onShowPaymentModal();
    } else if (onShowOrderConfirmation) {
      // Fallback to legacy order confirmation modal if orchestrator callback not provided
      onShowOrderConfirmation();
    }
  };

  // Table selection handler
  const handleTableSelect = (selectedTableNumber: number) => {
    // This should update the table number in the parent component
    if (onTableSelect) {
      onTableSelect(selectedTableNumber);
    }
    // ✅ Use parent callback instead of local state
    if (onCloseTableSelection) {
      onCloseTableSelection();
    }
    // Let POSDesktop handle the guest count flow - don't auto-open Order Confirmation
  };

  // Order Confirmation Modal handlers
  const handleOrderConfirmation = (action: 'payment' | 'no_payment' | 'add_to_order' | 'send_to_kitchen' | 'make_changes') => {
    console.log('🎯 [OrderSummaryPanel] handleOrderConfirmation called with action:', action);
    
    // ✅ CHANGE: Delegate to parent orchestrator instead of managing local state
    if (onOrderConfirmed) {
      onOrderConfirmed(action);
    }
  };

  // DINE-IN workflow handlers
  const handleAddToOrder = async () => {
    if (orderItems.length === 0) {
      console.error("No items to add");
      return;
    }

    try {
      console.log('📝 Adding items to table order:', {
        tableNumber,
        itemCount: orderItems.length,
        total
      });
      
      // Call onSaveUpdate if available (saves without printing)
      if (onSaveUpdate && tableNumber) {
        await onSaveUpdate(tableNumber, orderItems);
      }
      
      console.log(`✅ Items added to Table ${tableNumber} order`);
      
    } catch (error) {
      console.error('❌ Failed to add items to order:', error);
      toast.error('Failed to add items to order');
    }
  };

  const handleSendToKitchen = async () => {
    if (orderItems.length === 0) {
      console.error("No items to send to kitchen");
      toast.error("No items to send to kitchen");
      return;
    }

    try {
      console.log('👨‍🍳 Sending items to kitchen:', {
        tableNumber,
        itemCount: orderItems.length
      });
      
      // For DINE-IN orders, save to table first then send to kitchen
      if (orderType === "DINE-IN" && onSaveUpdate && tableNumber) {
        await onSaveUpdate(tableNumber, orderItems);
      }
      
      // Call the kitchen handler
      if (onSendToKitchen) {
        onSendToKitchen();
      }
      
      toast.success('Order sent to kitchen', {
        description: orderType === "DINE-IN" ? `Table ${tableNumber} kitchen ticket printed` : 'Kitchen ticket printed'
      });
      
    } catch (error) {
      console.error('❌ Failed to send to kitchen:', error);
      toast.error('Failed to send to kitchen');
    }
  };

  const handlePrintFinalBill = () => {
    if (orderItems.length === 0) {
      console.error("No items for final bill");
      return;
    }

    try {
      console.log('🧾 Opening final bill review for Table', tableNumber);
      setShowFinalBillModal(true);
      
    } catch (error) {
      console.error('❌ Failed to open final bill modal:', error);
    }
  };

  const handleConfirmFinalBill = () => {
    try {
      console.log('🖨️ Printing final bill for Table', tableNumber);
      
      // Call print bill handler
      if (onPrintBill) {
        onPrintBill();
      }
      
      // Close modal
      setShowFinalBillModal(false);
      
      // Complete the order (this should close the table)
      if (onCompleteOrder) {
        onCompleteOrder();
      }
      
      console.log(`✅ Final bill printed - Table ${tableNumber} closed`);
      
    } catch (error) {
      console.error('❌ Failed to print final bill:', error);
    }
  };

  // Process order without payment (for COLLECTION/DELIVERY/WAITING)
  const handleProcessOrderOnly = async () => {
    if (orderItems.length === 0) {
      toast.error("No items to process");
      return;
    }

    try {
      // For WAITING/COLLECTION/DELIVERY orders, we need both kitchen ticket AND customer receipt
      // So we call the main process payment handler which includes complete printing logic
      if (onProcessPayment && (orderType === 'WAITING' || orderType === 'COLLECTION' || orderType === 'DELIVERY')) {
        console.log(`🔄 [OrderSummaryPanel] WAITING/COLLECTION/DELIVERY order: using main process logic for complete printing`);
        onProcessPayment();
        return;
      }
      
      // Fallback for DINE-IN: Send to kitchen only (legacy behavior)
      if (onSendToKitchen) {
        onSendToKitchen();
      }
      
      toast.success('Order processed without payment', {
        description: 'Kitchen ticket printed - payment to be collected manually'
      });
      
    } catch (error) {
      console.error('❌ Failed to process order:', error);
      toast.error('Failed to process order');
    }
  };

  // Complete order with payment (for COLLECTION/DELIVERY/WAITING)
  const handleCompleteOrderWithPayment = () => {
    if (orderItems.length === 0) {
      toast.error("No items to process payment for");
      return;
    }
    
    // ✅ Call parent handler instead of local state
    if (onShowPaymentModal) {
      onShowPaymentModal();
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (
    tipSelection: TipSelection,
    paymentResult?: PaymentResult
  ) => {
    try {
      // setPaymentProcessing(true);
      setCurrentTipSelection(tipSelection || null);
      
      console.log('💳 [OrderSummaryPanel] Payment success - calling parent callback');
      
      // Send to kitchen if not already sent
      if (onSendToKitchen) {
        onSendToKitchen();
      }
      
      // ✅ Call parent payment success handler to clear cart and complete order
      if (onPaymentSuccess) {
        console.log('✅ [OrderSummaryPanel] Invoking parent onPaymentSuccess callback');
        await onPaymentSuccess(tipSelection, paymentResult);
      }
      
      // Local state updates
      setIsPaymentComplete(true);
      // setPaymentProcessing(false);
      
    } catch (error) {
      console.error('❌ [OrderSummaryPanel] Payment success handler failed:', error);
      // setPaymentProcessing(false);
      toast.error('Failed to complete payment');
    }
  };

  // Calculate totals - including customizations
  const subtotal = orderItems.reduce((sum, item) => {
    // Base item price with null guard
    let itemTotal = (item.price || 0) * item.quantity;
    
    // Add customization costs
    if (item.customizations && item.customizations.length > 0) {
      const customizationTotal = item.customizations.reduce((custSum, customization) => {
        return custSum + (customization.price_adjustment || 0);
      }, 0);
      itemTotal += customizationTotal * item.quantity;
    }
    
    return sum + itemTotal;
  }, 0);
  
  // 🔍 DEBUG: Log order items and total calculation
  // Replace verbose console.log with structured logging that respects environment
  const orderDebugData = {
    orderItemsCount: orderItems.length,
    subtotal,
    orderType,
  };
  
  // Only log when order actually changes, not on every render
  const orderStateKey = `${orderItems.length}-${subtotal}-${orderType}`;
  const prevOrderStateRef = useRef<string>('');
  
  // Service charge for dine-in orders - now uses dynamic POS settings and respects enabled toggle
  const serviceCharge = orderType === "DINE-IN" && posSettings?.service_charge?.enabled 
    ? subtotal * (posSettings.service_charge.percentage / 100)
    : 0;
  
  // Delivery fee for delivery orders - now uses dynamic POS settings and respects enabled toggle
  const deliveryFee = orderType === "DELIVERY" && posSettings?.delivery_charge?.enabled
    ? posSettings.delivery_charge.amount
    : 0;
  
  const total = subtotal + serviceCharge + deliveryFee;

  // Get order type icon
  const getOrderTypeIcon = () => {
    switch (orderType) {
      case "DINE-IN":
        return <Utensils className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />;
      case "COLLECTION":
        return <Package className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />;
      case "DELIVERY":
        return <Truck className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />;
      case "WAITING":
        return <Clock className="h-4 w-4" style={{ color: QSAITheme.purple.primary }} />;
      default:
        return null;
    }
  };

  // Get order context text
  const getOrderContext = () => {
    switch (orderType) {
      case "DINE-IN":
        return tableNumber ? `Table ${tableNumber}${guestCount ? ` • ${guestCount} guests` : ''}` : 'No table selected';
      case "COLLECTION":
      case "DELIVERY":
      case "WAITING":
        return `${orderItems.length} item${orderItems.length !== 1 ? 's' : ''}`;
      default:
        return '';
    }
  };

  // Payment handlers - following old POSOrderSummary pattern
  const handleCashPayment = async () => {
    const paymentResult: TipSelection = {
      type: 'cash',
      amount: 0,
      method: 'CASH',
      reference: `CASH-${Date.now()}`,
      tipAmount: currentTipSelection?.amount || 0,
      totalWithTip: total + (currentTipSelection?.amount || 0)
    };
    
    console.log('💵 [OrderSummaryPanel] Cash payment - calling handlePaymentSuccess');
    handlePaymentSuccess(paymentResult);
  };

  const handleInitiateCardPayment = () => {
    // ✅ Call parent handler instead of local state
    if (onShowPaymentModal) {
      onShowPaymentModal();
    }
  };

  const handleStripeSuccess = async (paymentResult: TipSelection) => {
    console.log('💳 [OrderSummaryPanel] Stripe payment success:', paymentResult);
    
    // If parent provides a hide callback, invoke it
    if (onHidePaymentModal) {
      onHidePaymentModal();
    }
    
    setIsPaymentComplete(true);
    
    console.log('💳 [OrderSummaryPanel] Stripe - calling handlePaymentSuccess');
    handlePaymentSuccess(paymentResult);
  };

  return (
    <div
      className={cn('grid h-full border-l', className)}
      style={{ 
        borderColor: QSAITheme.border.light, 
        backgroundColor: QSAITheme.background.panel,
        gridTemplateRows: 'auto 1fr auto',
        gridTemplateColumns: '1fr',
        overflow: 'hidden' // ✅ CRITICAL: Constrains grid within parent bounds
      }}
    >
      {/* Zone 1: Fixed Header */}
      <div 
        className="p-4 border-b overflow-hidden" 
        style={{ 
          borderColor: QSAITheme.border.medium,
          gridRow: '1 / 2'
        }}
      >
        <div className="space-y-2">
          <h3 className="font-semibold text-sm" style={{
            backgroundImage: `linear-gradient(135deg, white 30%, ${QSAITheme.purple.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block'
          }}>
            ORDER SUMMARY
          </h3>
          
          {/* Gradient underline */}
          <div 
            className="w-24 h-1 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${QSAITheme.purple.light}, transparent)`
            }}
          />
          
          {/* Order context */}
          <div className="flex items-center justify-between mt-2">
            {orderType === "DINE-IN" && tableNumber && (
              <span className="text-xs opacity-75" style={{ color: QSAITheme.text.secondary }}>
                Table {tableNumber}{guestCount ? ` • ${guestCount} guests` : ''}
              </span>
            )}
            <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
              {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Zone 2: Scrollable Items */}
      <div 
        className="overflow-y-auto p-3 space-y-2"
        style={{ 
          gridRow: '2 / 3',
          minHeight: 0,
          overflowX: 'hidden' // ✅ Prevent horizontal scroll
        }}
      >
        {orderItems.length === 0 ? (
          <div className="text-center py-8">
            <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: QSAITheme.text.muted }} />
            <p className="text-sm" style={{ color: QSAITheme.text.muted }}>No items in order</p>
          </div>
        ) : (
          orderItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-opacity-50 border rounded-lg p-4 space-y-3"
              style={{
                backgroundColor: QSAITheme.background.tertiary,
                borderColor: QSAITheme.border.light
              }}
            >
              {/* Top section: Image, Name, Remove button */}
              <div className="flex items-start space-x-3">
                {/* Larger thumbnail image */}
                <div className="flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover border"
                      style={{ borderColor: QSAITheme.border.medium }}
                      onError={(e) => {
                        // On error, replace with fallback div
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const itemName = item.name || 'Item';
                          parent.innerHTML = `
                            <div class="w-16 h-16 rounded-lg border flex items-center justify-center font-bold text-white text-2xl"
                              style="background: linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%); border-color: ${QSAITheme.border.medium};">
                              ${itemName.charAt(0).toUpperCase()}
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-lg border flex items-center justify-center font-bold text-white text-2xl"
                      style={{ 
                        background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                        borderColor: QSAITheme.border.medium
                      }}
                    >
                      {(item.name || 'Item').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Item details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1" style={{ color: QSAITheme.text.primary }}>
                    {item.name}
                  </h4>
                  
                  {/* Variant and protein info */}
                  {(item.variant || item.protein_type) && (
                    <div className="flex items-center space-x-2 mb-2">
                      {item.variant && (
                        <span 
                          className="text-xs px-2 py-1 rounded" 
                          style={{ 
                            backgroundColor: QSAITheme.purple.primaryTransparent,
                            color: QSAITheme.text.secondary
                          }}
                        >
                          {item.variant}
                        </span>
                      )}
                      {item.protein_type && (
                        <span 
                          className="text-xs px-2 py-1 rounded" 
                          style={{ 
                            backgroundColor: QSAITheme.background.secondary,
                            color: QSAITheme.text.muted
                          }}
                        >
                          {item.protein_type}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Rich customization details */}
                  {(item.modifiers && item.modifiers.length > 0) && (
                    <div className="space-y-1 mb-2">
                      {item.modifiers.map((modifier, modIndex) => (
                        <div key={modIndex} className="text-xs" style={{ color: QSAITheme.text.muted }}>
                          <span className="font-medium">{modifier.name}:</span>
                          <span className="ml-1">{modifier.options.map(opt => opt.name).join(', ')}</span>
                          {modifier.options.some(opt => opt.price > 0) && (
                            <span className="ml-1" style={{ color: QSAITheme.purple.light }}>
                              (+£{modifier.options.reduce((sum, opt) => sum + opt.price, 0).toFixed(2)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Customizations display (Add Cheese, etc.) */}
                  {(item.customizations && item.customizations.length > 0) && (
                    <div className="space-y-1 mb-2">
                      {item.customizations.map((customization, custIndex) => (
                        <div key={custIndex} className="text-xs flex items-center justify-between" style={{ color: QSAITheme.text.muted }}>
                          <span className="font-medium">{customization.name}</span>
                          {customization.price_adjustment > 0 && (
                            <span className="ml-1" style={{ color: QSAITheme.purple.light }}>
                              +£{customization.price_adjustment.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add-ons display */}
                  {(item.add_ons && item.add_ons.length > 0) && (
                    <div className="mb-2">
                      <div className="text-xs font-medium mb-1" style={{ color: QSAITheme.text.secondary }}>Add-ons:</div>
                      <div className="flex flex-wrap gap-1">
                        {item.add_ons.map((addon, addonIndex) => (
                          <span 
                            key={addonIndex}
                            className="text-xs px-2 py-1 rounded" 
                            style={{ 
                              backgroundColor: QSAITheme.background.secondary,
                              color: QSAITheme.text.muted
                            }}
                          >
                            {addon.name} {addon.price > 0 && `(+£${addon.price.toFixed(2)})`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Notes and special instructions */}
                  {item.notes && (
                    <div 
                      className="text-xs p-2 rounded border-l-2 mb-2" 
                      style={{ 
                        backgroundColor: QSAITheme.background.secondary,
                        borderLeftColor: QSAITheme.purple.primary,
                        color: QSAITheme.text.muted
                      }}
                    >
                      <span className="font-medium">Note:</span> {item.notes}
                    </div>
                  )}
                </div>
                
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Bottom section: Quantity controls, Customize button, Price */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                {/* Quantity controls */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                    className="h-6 w-6 p-0"
                    style={{
                      borderColor: QSAITheme.border.medium,
                      backgroundColor: QSAITheme.background.secondary
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  
                  <span className="text-sm font-medium w-8 text-center" style={{ color: QSAITheme.text.primary }}>
                    {item.quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    className="h-6 w-6 p-0"
                    style={{
                      borderColor: QSAITheme.border.medium,
                      backgroundColor: QSAITheme.background.secondary
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Customize button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleOpenCustomization(index, item);
                  }}
                  className="text-xs px-2 py-1 h-6 flex-shrink-0"
                  style={{
                    borderColor: QSAITheme.purple.primary,
                    color: 'white',
                    backgroundColor: 'transparent'
                  }}
                >
                  <Cog className="w-3 h-3 mr-1" />
                  Custom
                </Button>
                
                {/* Price */}
                <div className="text-sm font-semibold ml-auto flex-shrink-0" style={{ color: QSAITheme.text.primary }}>
                  £{((item.price || 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Zone 3: Fixed Footer with totals and actions */}
      {/* ✅ ALWAYS render container to reserve grid space, conditionally render content */}
      <div 
        className="border-t p-4 space-y-3 overflow-hidden"
        style={{ 
          borderColor: QSAITheme.border.light,
          gridRow: '3 / 4'
        }}
      >
        {orderItems.length > 0 ? (
          <>
            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span style={{ color: QSAITheme.text.muted }}>Subtotal:</span>
                <span style={{ color: QSAITheme.text.primary }}>{formatCurrency(subtotal)}</span>
              </div>
              
              {/* Service charge - only show if enabled and dine-in */}
              {orderType === "DINE-IN" && posSettings?.service_charge?.enabled && serviceCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: QSAITheme.text.muted }}>Service ({posSettings.service_charge.percentage}%):</span>
                  <span style={{ color: QSAITheme.text.primary }}>{formatCurrency(serviceCharge)}</span>
                </div>
              )}
              
              {/* Delivery fee - only show if enabled and delivery order */}
              {orderType === "DELIVERY" && posSettings?.delivery_charge?.enabled && deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: QSAITheme.text.muted }}>Delivery:</span>
                  <span style={{ color: QSAITheme.text.primary }}>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold border-t pt-1" style={{ borderColor: QSAITheme.border.light }}>
                <span style={{ color: QSAITheme.text.primary }}>Total:</span>
                <span style={{ color: QSAITheme.text.primary }}>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Action buttons - Unified Process Order workflow for all order types */}
            <div className="space-y-2">
              {/* Unified Process Order Button */}
              <Button
                size="sm"
                onClick={handleProcessOrder}  // ✅ Always use internal handler to show modal
                className="w-full text-xs h-9 font-medium"
                style={{
                  backgroundColor: QSAITheme.purple.primary,
                  borderColor: QSAITheme.purple.primary,
                  color: 'white',
                  boxShadow: `0 4px 8px ${QSAITheme.purple.glow}`
                }}
              >
                <Receipt className="w-3 h-3 mr-2" />
                Process Order • {formatCurrency(total)}
              </Button>
            </div>

            {/* Clear Order Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearOrder}
              className="w-full text-xs h-8"
              style={{
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.muted
              }}
            >
              Clear Order
            </Button>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
              Add items to see totals and actions
            </p>
          </div>
        )}
      </div>

      {/* Order Confirmation Modal - stays until fully migrated into orchestrator */}
      <OrderConfirmationModal
        isOpen={!!showOrderConfirmation}
        onClose={handleOrderConfirmationClose}
        orderItems={orderItems}
        orderType={orderType}
        tableNumber={tableNumber}
        guestCount={guestCount}
        customerFirstName={customerFirstName || customerData?.firstName || ''}
        customerLastName={customerLastName || customerData?.lastName || ''}
        customerPhone={customerPhone || customerData?.phone || ''}
        customerAddress={customerAddress || customerData?.address || ''}
        onConfirm={handleOrderConfirmation}
      />

      {/* Table Selection Modal (DINE-IN) */}
      <TableSelectionModal 
        isOpen={!!showTableSelection}
        onClose={onCloseTableSelection || (() => {})}
        onSelectTable={handleTableSelect}
      />

      {/* Bill Review Dialog (DINE-IN) - Final Bill Confirmation */}
      <Dialog open={showFinalBillModal} onOpenChange={setShowFinalBillModal}>
        <DialogContent 
          className="max-w-2xl"
          style={{
            backgroundColor: QSAITheme.background.card,
            border: `1px solid ${QSAITheme.border.medium}`,
            boxShadow: `0 0 40px ${QSAITheme.purple.glow}`
          }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-2xl font-bold flex items-center gap-3"
              style={{ color: QSAITheme.text.primary }}
            >
              <Receipt className="w-6 h-6" style={{ color: QSAITheme.purple.primary }} />
              Final Bill Review
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Table Info */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: QSAITheme.background.secondary,
                border: `1px solid ${QSAITheme.border.medium}`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: QSAITheme.purple.primary }} />
                  <span className="font-semibold" style={{ color: QSAITheme.text.primary }}>
                    Table {tableNumber}
                  </span>
                </div>
                {guestCount && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" style={{ color: QSAITheme.text.muted }} />
                    <span style={{ color: QSAITheme.text.secondary }}>
                      {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold" style={{ color: QSAITheme.text.secondary }}>Order Summary</h3>
              <div 
                className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-lg"
                style={{ 
                  backgroundColor: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.medium}`
                }}
              >
                {orderItems.map((item, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-start pb-2"
                    style={{ borderBottom: index < orderItems.length - 1 ? `1px solid ${QSAITheme.border.light}` : 'none' }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: QSAITheme.text.primary }}>
                          {item.quantity}x {item.name}
                        </span>
                        {item.variantName && (
                          <Badge variant="secondary" className="text-xs">
                            {item.variantName}
                          </Badge>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-medium ml-4" style={{ color: QSAITheme.text.primary }}>
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: QSAITheme.purple.primary,
                border: `1px solid ${QSAITheme.purple.light}`
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold" style={{ color: '#FFFFFF' }}>Total</span>
                <span className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFinalBillModal(false)}
              style={{
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.secondary
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFinalBill}
              style={{
                backgroundColor: QSAITheme.purple.primary,
                color: '#FFFFFF'
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Print & Close Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// ✅ Named export for compatibility
export { OrderSummaryPanel };

export default OrderSummaryPanel;
