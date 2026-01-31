/**
 * OrderConfirmationView - Order review step in unified payment flow
 * Shows THERMAL RECEIPT PREVIEW (WYSIWYG) before processing payment
 * Part of PaymentFlowOrchestrator state machine
 *
 * This is a VIEW component (not a modal), designed to live inside the orchestrator
 * Shows 3 CTAs:
 * - "Take Payment Now" → proceeds to Stripe payment flow
 * - "Pay on Collection/Delivery/at Counter" → prints receipt directly (no payment)
 * - "Back to Cart" → closes modal and returns to cart
 *
 * WYSIWYG PRINTING:
 * - Renders both customer and kitchen receipts (kitchen hidden off-screen)
 * - Captures receipt images when user clicks action buttons
 * - Passes captured images to parent for raster printing
 */

import { useRef, useState, useCallback } from 'react';
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
  ArrowLeft,
  CreditCard,
  Printer,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OrderConfirmationViewProps, CapturedReceiptImages } from '../utils/paymentFlowTypes';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';
import { OrderItem } from '../utils/menuTypes';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { generateDisplayNameForReceipt } from '../utils/menuHelpers';
import {
  isRasterPrintAvailable,
  captureReceiptAsImage
} from '../utils/electronPrintService';

/**
 * Get the correct order number prefix based on order type and source
 * POS prefixes: PC (Collection), PD (Delivery), DI (Dine-In), PW (Waiting)
 * Online prefixes: OC (Collection), OD (Delivery)
 */
const getOrderPrefix = (orderType: string, orderSource: 'POS' | 'ONLINE' = 'POS'): string => {
  const prefixMap: Record<string, Record<string, string>> = {
    POS: {
      COLLECTION: 'PC',
      DELIVERY: 'PD',
      'DINE-IN': 'DI',
      WAITING: 'PW',
    },
    ONLINE: {
      COLLECTION: 'OC',
      DELIVERY: 'OD',
    },
  };
  return prefixMap[orderSource]?.[orderType] || 'XX';
};

export function OrderConfirmationView({
  orderItems,
  orderType,
  orderTotal,
  tableNumber,
  guestCount,
  customerData,
  deliveryFee = 0,
  onTakePaymentNow,
  onPayOnCollection,
  onBack
}: OrderConfirmationViewProps) {
  // Refs for WYSIWYG receipt capture
  const customerReceiptRef = useRef<HTMLDivElement>(null);
  const kitchenReceiptRef = useRef<HTMLDivElement>(null);

  // State for capture in progress
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Capture both customer and kitchen receipts for WYSIWYG printing
   * Called before any action that requires printing
   */
  const captureReceipts = useCallback(async (): Promise<CapturedReceiptImages> => {
    const images: CapturedReceiptImages = {};

    if (!isRasterPrintAvailable()) {
      console.log('ℹ️ [OrderConfirmationView] Raster print not available, skipping capture');
      return images;
    }

    try {
      // Capture kitchen receipt first (hidden element)
      if (kitchenReceiptRef.current) {
        console.log('🖨️ [OrderConfirmationView] Capturing kitchen receipt...');
        images.kitchen = await captureReceiptAsImage(kitchenReceiptRef.current, 80);
        console.log('✅ Kitchen receipt captured:', images.kitchen ? `${images.kitchen.length} bytes` : 'null');
      }

      // Capture customer receipt (visible element)
      if (customerReceiptRef.current) {
        console.log('🖨️ [OrderConfirmationView] Capturing customer receipt...');
        images.customer = await captureReceiptAsImage(customerReceiptRef.current, 80);
        console.log('✅ Customer receipt captured:', images.customer ? `${images.customer.length} bytes` : 'null');
      }
    } catch (error) {
      console.error('❌ [OrderConfirmationView] Receipt capture error:', error);
    }

    return images;
  }, []);

  /**
   * Handle "Take Payment Now" with receipt capture
   */
  const handleTakePaymentNow = useCallback(async () => {
    setIsCapturing(true);
    try {
      const capturedImages = await captureReceipts();
      onTakePaymentNow(capturedImages);
    } finally {
      setIsCapturing(false);
    }
  }, [captureReceipts, onTakePaymentNow]);

  /**
   * Handle "Pay on Collection/Delivery" with receipt capture
   */
  const handlePayOnCollection = useCallback(async () => {
    setIsCapturing(true);
    try {
      const capturedImages = await captureReceipts();
      onPayOnCollection(capturedImages);
    } finally {
      setIsCapturing(false);
    }
  }, [captureReceipts, onPayOnCollection]);

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

  // Get label for "Pay Later" button based on order type
  const getPayLaterLabel = () => {
    switch (orderType) {
      case 'COLLECTION':
        return 'Pay on Collection';
      case 'DELIVERY':
        return 'Pay on Delivery';
      case 'WAITING':
        return 'Pay at Counter';
      default:
        return 'Pay Later';
    }
  };

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
      orderNumber: `${getOrderPrefix(orderType, 'POS')}-${Math.floor(Math.random() * 9000) + 1000}`,
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
          instructions: item.notes || undefined,
          // Category tracking for receipt section organization
          category_id: item.category_id,
          menu_item_id: item.menu_item_id,
          kitchen_display_name: item.kitchen_display_name
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
          {/* Customer receipt - visible preview */}
          <ThermalReceiptDisplay
            ref={customerReceiptRef}
            orderMode={orderType}
            orderData={mapToReceiptOrderData()}
            paperWidth={80}
            showZoomControls={false}
            className="shadow-2xl"
          />
        </div>

        {/* Kitchen receipt - hidden off-screen for WYSIWYG capture */}
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        >
          <ThermalReceiptDisplay
            ref={kitchenReceiptRef}
            orderMode={orderType}
            orderData={mapToReceiptOrderData()}
            paperWidth={80}
            showZoomControls={false}
            receiptFormat="kitchen"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* FIXED FOOTER - 3 CTA BUTTONS */}
      {/* ============================================ */}
      <div className="flex-none space-y-3 pt-4 border-t border-white/10">
        {/* Primary: Take Payment Now (Stripe) */}
        <Button
          onClick={handleTakePaymentNow}
          disabled={isCapturing}
          className="w-full h-14 text-white font-bold text-lg"
          style={{
            ...styles.frostedGlassStyle,
            background: QSAITheme.purple.primary,
            boxShadow: effects.outerGlow('medium')
          }}
        >
          {isCapturing ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5 mr-2" />
          )}
          Take Payment Now
        </Button>

        {/* Secondary: Pay on Collection/Delivery/at Counter */}
        <Button
          onClick={handlePayOnCollection}
          disabled={isCapturing}
          variant="outline"
          className="w-full h-12 border-white/30 text-white hover:bg-white/10 hover:border-purple-500/50"
          style={styles.frostedGlassStyle}
        >
          {isCapturing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Clock className="h-4 w-4 mr-2" />
          )}
          {getPayLaterLabel()}
        </Button>

        {/* Tertiary: Back to Cart */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full h-11 min-h-[44px] text-white/60 hover:text-white hover:bg-white/5 touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
      </div>
    </motion.div>
  );
}
