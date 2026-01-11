import React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { apiClient } from 'app';
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
  Cog,
  Package,
  Truck
} from 'lucide-react';
import { OrderItem, ModifierSelection, CustomizationSelection, PaymentResult } from '../utils/menuTypes';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import POSTipSelector, { TipSelection } from './POSTipSelector';
import { TableSelectionModal } from './TableSelectionModal';
import { colors, globalColors as QSAITheme, effects } from '../utils/QSAIDesign';
import { formatCurrency } from '../utils/formatters';
import { usePOSSettingsWithAutoFetch } from '../utils/posSettingsStore';
import { useCustomerDataStore } from '../utils/customerDataStore';
import { createLogger } from 'utils/logger';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { StaffCustomizationModal } from './StaffCustomizationModal';
import { SelectedCustomization } from '../utils/menuTypes';
import { usePOSOrderStore } from '../utils/posOrderStore';
import { MenuItem, ItemVariant } from '../utils/menuTypes';
import { CustomerData } from '../utils/useCustomerFlow';
import { kitchenService } from '../utils/kitchenService';

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
  onPaymentSuccess?: (tipSelection: TipSelection, paymentResult?: PaymentResult) => void;
  onSendToKitchen?: () => void;
  onPrintBill?: () => void;
  onSaveUpdate?: (tableNumber: number, orderItems: OrderItem[]) => void;
  onTableSelect?: (tableNumber: number) => void;
  onCustomerDetailsClick?: () => void;
  onTableSelectionClick?: () => void;
  onCustomizeItem?: (index: number, item: OrderItem) => void;
  onShowKitchenPreview?: () => void;
  onShowPaymentModal?: () => void;
  onPrintReceipt?: () => void;
  onSchedulingChange?: (data: any) => void;
  schedulingData?: any;
  onCloseTableSelection?: () => void;
  showOrderConfirmation?: boolean;
  onCloseOrderConfirmation?: () => void;
  onShowOrderConfirmation?: () => void;
  onOrderConfirmed?: (action: 'payment' | 'no_payment' | 'add_to_order' | 'send_to_kitchen' | 'make_changes') => void;
  className?: string;
  deliveryFee?: number;
}

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
  onPaymentSuccess,
  onSendToKitchen,
  onPrintBill,
  onSaveUpdate,
  onTableSelect,
  onCustomerDetailsClick,
  onTableSelectionClick,
  onCustomizeItem,
  onShowKitchenPreview,
  onShowPaymentModal,
  onSchedulingChange,
  schedulingData,
  onCloseTableSelection,
  showOrderConfirmation = false,
  onCloseOrderConfirmation,
  onShowOrderConfirmation,
  onOrderConfirmed,
  className = '',
  deliveryFee = 0
}: Props) {
  const logger = createLogger('OrderSummaryPanel');
  const { settings: posSettings } = usePOSSettingsWithAutoFetch();
  const { menuItems, itemVariants } = useRealtimeMenuStore();
  const updateItemWithCustomizations = usePOSOrderStore(state => state.updateItemWithCustomizations);
  
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [customizingOrderItem, setCustomizingOrderItem] = useState<OrderItem | null>(null);
  const [customizingItemIndex, setCustomizingItemIndex] = useState<number>(-1);
  const [showFinalBillModal, setShowFinalBillModal] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState<boolean>(false);
  const [currentTipSelection, setCurrentTipSelection] = useState<TipSelection | null>(null);
  
  const handleOpenCustomization = (index: number, item: OrderItem) => {
    setCustomizingOrderItem(item);
    setCustomizingItemIndex(index);
    setIsCustomizationModalOpen(true);
  };
  
  const handleCustomizationConfirm = (menuItem: MenuItem, quantity: number, variant?: any, customizations?: SelectedCustomization[], notes?: string) => {
    if (customizingItemIndex === -1 || !customizingOrderItem) return;
    const updates: any = {};
    if (quantity !== customizingOrderItem.quantity) updates.quantity = quantity;
    if (customizations) {
      updates.customizations = customizations.map(c => ({
        id: c.id,
        customization_id: c.id,
        name: c.name,
        price_adjustment: c.price,
        group: c.group
      }));
    }
    if (notes !== undefined) updates.notes = notes;
    updateItemWithCustomizations(customizingOrderItem.id, updates);
    setIsCustomizationModalOpen(false);
    setCustomizingOrderItem(null);
    setCustomizingItemIndex(-1);
    toast.success('Item updated successfully');
  };
  
  const handleOrderConfirmationClose = () => {
    if (onCloseOrderConfirmation) onCloseOrderConfirmation();
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      let itemTotal = (item.price || 0) * item.quantity;
      if (item.customizations && item.customizations.length > 0) {
        itemTotal += item.customizations.reduce((custSum, c) => custSum + (c.price_adjustment || 0), 0) * item.quantity;
      }
      return sum + itemTotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const serviceCharge = orderType === "DINE-IN" && posSettings?.service_charge?.enabled 
    ? subtotal * (posSettings.service_charge.percentage / 100)
    : 0;
  const total = subtotal + serviceCharge + deliveryFee;

  const handleProcessOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('No items to process');
      return;
    }
    if (orderType === 'DELIVERY') {
      const minVal = posSettings?.delivery?.minimum_order_value || 15;
      if (total < minVal) {
        toast.error(`Minimum order value is ${formatCurrency(minVal)}`);
        return;
      }
    }
    if ((orderType === 'WAITING' || orderType === 'COLLECTION') && !customerFirstName && !customerData?.firstName) {
      if (onCustomerDetailsClick) onCustomerDetailsClick();
      return;
    }
    if (orderType === 'DINE-IN') {
      if (!tableNumber) {
        if (onTableSelectionClick) onTableSelectionClick();
        return;
      }
      if (!guestCount) {
        toast.info('Guest count required');
        return;
      }
    }
    if (onShowPaymentModal) onShowPaymentModal();
    else if (onShowOrderConfirmation) onShowOrderConfirmation();
  };

  const handleOrderConfirmation = (action: any) => {
    if (onOrderConfirmed) onOrderConfirmed(action);
  };

  const handlePaymentSuccess = async (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    try {
      setCurrentTipSelection(tipSelection || null);
      if (onSendToKitchen) onSendToKitchen();
      if (onPaymentSuccess) await onPaymentSuccess(tipSelection, paymentResult);
      setIsPaymentComplete(true);
    } catch (error) {
      toast.error('Failed to complete payment');
    }
  };

  return (
    <div className={cn('grid h-full border-l', className)} style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.panel, gridTemplateRows: 'auto 1fr auto', overflow: 'hidden' }}>
      <div className="p-4 border-b" style={{ borderColor: QSAITheme.border.medium }}>
        <h3 className="font-semibold text-sm text-white">ORDER SUMMARY</h3>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          {orderType === "DINE-IN" && tableNumber && <span>Table {tableNumber}</span>}
          <span>{orderItems.length} items</span>
        </div>
      </div>

      <div className="overflow-y-auto p-3 space-y-2">
        {orderItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items</div>
        ) : (
          orderItems.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-3" style={{ backgroundColor: QSAITheme.background.tertiary, borderColor: QSAITheme.border.light }}>
              <div className="flex justify-between">
                <span className="text-white font-medium">{item.name}</span>
                <span className="text-white">£{((item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onUpdateQuantity?.(item.id, Math.max(1, item.quantity - 1))}><Minus size={14} /></Button>
                  <span className="text-white">{item.quantity}</span>
                  <Button size="sm" variant="ghost" onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}><Plus size={14} /></Button>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleOpenCustomization(index, item)}><Cog size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => onRemoveItem?.(item.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t space-y-3" style={{ borderColor: QSAITheme.border.light }}>
        <div className="space-y-1 text-sm text-gray-400">
          <div className="flex justify-between"><span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span></div>
          {serviceCharge > 0 && <div className="flex justify-between"><span>Service</span><span className="text-white">{formatCurrency(serviceCharge)}</span></div>}
          {deliveryFee > 0 && <div className="flex justify-between"><span>Delivery</span><span className="text-white">{formatCurrency(deliveryFee)}</span></div>}
          <div className="flex justify-between font-bold text-base text-white pt-1"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
        <Button onClick={handleProcessOrder} disabled={orderItems.length === 0} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12">
          Process Order
        </Button>
      </div>

      <OrderConfirmationModal
        isOpen={showOrderConfirmation}
        onClose={handleOrderConfirmationClose}
        orderItems={orderItems}
        orderType={orderType}
        subtotal={subtotal}
        total={total}
        actionLabel={orderType === 'DINE-IN' ? 'dine-in' : 'takeaway'}
        onConfirm={handleOrderConfirmation}
      />
      
      {isCustomizationModalOpen && customizingOrderItem && (() => {
        const fullMenuItem = menuItems.find(mi => mi.id === customizingOrderItem.menu_item_id);
        const selectedVariant = customizingOrderItem.variant_id ? itemVariants.find(v => v.id === customizingOrderItem.variant_id) : null;
        return fullMenuItem ? (
          <StaffCustomizationModal
            item={fullMenuItem}
            variant={selectedVariant}
            isOpen={isCustomizationModalOpen}
            onClose={() => setIsCustomizationModalOpen(false)}
            onConfirm={handleCustomizationConfirm}
            orderType={orderType}
            initialQuantity={customizingOrderItem.quantity}
            existingCustomizations={customizingOrderItem.customizations?.map(c => ({
              id: c.id || (c as any).customization_id,
              name: c.name,
              price: c.price_adjustment,
              group: (c as any).group
            }))}
            existingNotes={customizingOrderItem.notes}
          />
        ) : null;
      })()}
    </div>
  );
});

export { OrderSummaryPanel };
export default OrderSummaryPanel;
