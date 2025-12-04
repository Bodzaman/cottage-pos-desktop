/**
 * OrderConfirmationView - Order review step in unified payment flow
 * Shows THERMAL RECEIPT PREVIEW (WYSIWYG) before processing payment
 * Part of PaymentFlowOrchestrator state machine
 * 
 * This is a VIEW component (not a modal), designed to live inside the orchestrator
 * Supports two modes:
 * - "payment": Shows "Continue to Payment" CTA → proceeds to payment flow
 * - "pay-later": Shows "Confirm Pay on Collection" CTA → prints receipt directly
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  User,
  MapPin,
  Package,
  Phone,
  Home,
  Users,
  ArrowRight,
  Edit,
  Printer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OrderConfirmationViewProps } from '../utils/paymentFlowTypes';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';
import { OrderItem } from '../utils/menuTypes';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { generateDisplayNameForReceipt } from '../utils/menuHelpers';

export function OrderConfirmationView({
  mode,
  orderItems,
  orderType,
  orderTotal,
  tableNumber,
  guestCount,
  customerData,
  deliveryFee = 0,
  onContinueToPayment,
  onAddToOrder,
  onMakeChanges,
  onBack
}: OrderConfirmationViewProps) {
  
  // Get order type display info
  const getOrderTypeInfo = () => {
    switch (orderType) {
      case 'DINE-IN':
        return { icon: User, label: 'Dine-In', color: QSAITheme.purple.primary };
      case 'DELIVERY':
        return { icon: MapPin, label: 'Delivery', color: '#0EBAB1' };
      case 'COLLECTION':
        return { icon: Package, label: 'Collection', color: '#F59E0B' };
      case 'WAITING':
        return { icon: Clock, label: 'Customer Waiting', color: '#EF4444' };
    }
  };

  const orderTypeInfo = getOrderTypeInfo();
  const OrderTypeIcon = orderTypeInfo.icon;

  // Helper to get customer name
  const getCustomerName = () => {
    if (customerData?.firstName || customerData?.lastName) {
      return `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
    }
    return 'Customer';
  };

  // Get CTA text based on mode
  const getCTAText = () => {
    if (mode === 'pay-later') {
      switch (orderType) {
        case 'COLLECTION':
          return 'Confirm Pay on Collection';
        case 'DELIVERY':
          return 'Confirm Pay on Delivery';
        case 'WAITING':
          return 'Confirm Pay When Ready';
        default:
          return 'Confirm Pay Later';
      }
    }
    return 'Continue to Payment';
  };

  // Get CTA icon based on mode
  const getCTAIcon = () => {
    return mode === 'pay-later' ? Printer : ArrowRight;
  };

  const CTAIcon = getCTAIcon();

  // Map order data to receipt format for ThermalReceiptDisplay
  const mapToReceiptOrderData = () => {
    const subtotal = orderTotal - (deliveryFee || 0);
    
    // Format delivery address from customer data fields
    let deliveryAddress: string | undefined = undefined;
    if (orderType === 'DELIVERY' && customerData) {
      // Build address from individual fields (street, city, postcode)
      const addressParts: string[] = [];
      if (customerData.street) addressParts.push(customerData.street);
      if (customerData.city) addressParts.push(customerData.city);
      if (customerData.postcode) addressParts.push(customerData.postcode);
      
      if (addressParts.length > 0) {
        deliveryAddress = addressParts.join(', ');
        
        // Add delivery notes if present
        if (customerData.deliveryNotes) {
          deliveryAddress += ` (${customerData.deliveryNotes})`;
        }
      }
    }
    
    // Format collection time for COLLECTION/WAITING modes
    const collectionTime = (orderType === 'COLLECTION' || orderType === 'WAITING')
      ? 'ASAP' // Default to ASAP, could be enhanced with actual time selection
      : undefined;
    
    return {
      orderId: `POS-${Date.now()}`,
      orderNumber: `${orderType.charAt(0)}${orderType.charAt(1)}-${Math.floor(Math.random() * 9000) + 1000}`,
      orderType: orderType,
      items: orderItems.map(item => {
        // ✅ FIX: Use generateDisplayNameForReceipt to avoid duplicate variation names
        // This will show "LAMB TIKKA MASALA" instead of "TIKKA MASALA (LAMB TIKKA MASALA)"
        const displayName = generateDisplayNameForReceipt(
          item.name,
          item.variantName,
          item.protein_type
        );
        
        return {
          id: item.id || item.menu_item_id || `item-${Date.now()}`,
          name: displayName, // ✅ Use generated display name
          price: item.price,
          quantity: item.quantity,
          variant: item.variantName ? {
            id: item.id,
            name: item.variantName,
            price_adjustment: 0
          } : undefined,
          customizations: item.modifiers?.map(mod => ({
            id: mod.id || `mod-${Date.now()}`,
            name: mod.name,
            price: mod.price || 0
          })) || [],
          instructions: item.notes || undefined
        };
      }),
      subtotal,
      serviceCharge: 0,
      deliveryFee: deliveryFee || 0,
      total: orderTotal,
      
      // Conditional fields based on order type
      tableNumber: orderType === 'DINE-IN' ? tableNumber?.toString() : undefined,
      guestCount: orderType === 'DINE-IN' ? guestCount : undefined,
      
      customerName: getCustomerName(),
      customerPhone: customerData?.phone || undefined,
      customerEmail: customerData?.email || undefined,
      
      deliveryAddress,
      collectionTime,
      timestamp: new Date().toISOString()
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* ============================================ */}
      {/* FIXED HEADER */}
      {/* ============================================ */}
      <div className="flex-none space-y-4 pb-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Confirm Order Details</h2>
          <p className="text-sm text-white/60">
            Review the order before processing payment
          </p>
        </div>

        {/* Order Type Badge */}
        <div className="flex justify-center">
          <Badge 
            className="px-4 py-2 text-sm font-semibold"
            style={{
              background: orderTypeInfo.color,
              color: 'white'
            }}
          >
            <OrderTypeIcon className="h-4 w-4 mr-2" />
            {orderTypeInfo.label}
          </Badge>
        </div>
      </div>

      {/* ============================================ */}
      {/* SCROLLABLE CONTENT AREA - THERMAL RECEIPT */}
      {/* ============================================ */}
      <div className="flex-1 overflow-y-auto" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
      }}>
        <div className="flex justify-center py-4">
          <ThermalReceiptDisplay
            orderMode={orderType}
            orderData={mapToReceiptOrderData()}
            paperWidth={80}
            showZoomControls={false}
            className="shadow-2xl"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* FIXED FOOTER - ACTION BUTTONS */}
      {/* ============================================ */}
      <div className="flex-none space-y-3 pt-4 border-t border-white/10">
        {/* Primary Action: Continue to Payment OR Confirm Pay Later */}
        <Button
          onClick={onContinueToPayment}
          className="w-full h-14 text-white font-bold text-lg"
          style={{
            ...styles.frostedGlassStyle,
            background: QSAITheme.purple.primary,
            boxShadow: effects.outerGlow('medium')
          }}
        >
          {getCTAText()}
          <CTAIcon className="h-5 w-5 ml-2" />
        </Button>

        {/* Secondary Action: Edit Order */}
        <Button
          variant="outline"
          onClick={onMakeChanges}
          className="w-full h-12 border-white/20 text-white/80 hover:bg-white/10 hover:border-purple-500/50"
          style={styles.frostedGlassStyle}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Order
        </Button>
      </div>
    </motion.div>
  );
}
