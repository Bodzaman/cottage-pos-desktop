import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Clock,
  User,
  MapPin,
  Package,
  Receipt,
  Phone,
  Home,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { globalColors as QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';
import { AppApisTableOrdersOrderItem } from 'types';
import cn from 'classnames';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderItems: AppApisTableOrdersOrderItem[];
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  tableNumber?: number;
  guestCount?: number;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerStreet?: string;
  customerPostcode?: string;
  schedulingData?: {
    pickup_time?: Date;
    timing_type?: 'deliver_at' | 'not_before' | 'deliver_after';
    timing_value?: Date;
  } | null;
  
  // Financial calculations
  subtotal: number;
  serviceCharge?: number;
  vatAmount?: number;
  deliveryFee?: number;
  total: number;
  
  // Actions to execute after confirmation
  onConfirm: (action: 'payment' | 'no_payment' | 'add_to_order' | 'send_to_kitchen' | 'make_changes') => void;
  actionLabel: string;
}

/**
 * OrderConfirmationModal - Comprehensive order review before processing
 * Provides staff with a final confirmation step for all POS actions
 * Styled to match QSAI design system with frosted glass effects
 * 
 * THREE-ZONE ARCHITECTURE:
 * - Zone 1: Fixed Header (title, badges, question)
 * - Zone 2: Scrollable Review Area (customer info, items, totals)
 * - Zone 3: Fixed Action Bar (confirmation buttons)
 */
export function OrderConfirmationModal({
  isOpen,
  onClose,
  orderItems,
  orderType,
  tableNumber,
  guestCount,
  customerFirstName,
  customerLastName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerStreet,
  customerPostcode,
  schedulingData,
  subtotal,
  serviceCharge = 0,
  deliveryFee = 0,
  total,
  onConfirm,
  actionLabel
}: Props) {
  
  const handleConfirm = (action: 'payment' | 'no_payment' | 'add_to_order' | 'send_to_kitchen' | 'make_changes') => {
    onConfirm(action);
    if (action !== 'make_changes') {
      onClose();
    }
  };

  /**
   * Map current order data to ThermalReceiptDisplay format
   */
  const mapToReceiptOrderData = () => {
    return {
      orderId: `POS-${Date.now()}`,
      orderNumber: `OC-${Math.floor(Math.random() * 9000) + 1000}`,
      orderType: orderType,
      items: orderItems.map(item => ({
        id: item.id || item.menu_item_id || `item-${Date.now()}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant_name ? {
          id: item.id || `variant-${Date.now()}`,
          name: item.variant_name,
          price_adjustment: 0
        } : undefined,
        customizations: item.modifiers?.map(mod => ({
          id: mod.id || `mod-${Date.now()}`,
          name: mod.name,
          price: mod.price || 0
        })) || [],
        instructions: item.notes || undefined
      })),
      subtotal,
      serviceCharge: serviceCharge || 0,
      deliveryFee: deliveryFee || 0,
      total,
      
      // Conditional fields based on order type
      tableNumber: orderType === 'DINE-IN' ? tableNumber?.toString() : undefined,
      guestCount: orderType === 'DINE-IN' ? guestCount : undefined,
      
      customerName: customerFirstName && customerLastName 
        ? `${customerFirstName} ${customerLastName}` 
        : customerFirstName || customerLastName,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      
      deliveryAddress: orderType === 'DELIVERY' && (customerAddress || customerStreet || customerPostcode)
        ? [customerAddress, customerStreet, customerPostcode].filter(Boolean).join(', ')
        : undefined,
        
      collectionTime: schedulingData?.pickup_time?.toLocaleString() || undefined,
      timestamp: new Date().toISOString()
    };
  };

  const getOrderTypeIcon = () => {
    switch (orderType) {
      case "DINE-IN": return <User className="w-5 h-5" />;
      case "DELIVERY": return <MapPin className="w-5 h-5" />;
      case "COLLECTION": return <Package className="w-5 h-5" />;
      case "WAITING": return <Clock className="w-5 h-5" />;
      default: return <Receipt className="w-5 h-5" />;
    }
  };

  // Helper function to abbreviate customer name (First Initial + Last Name)
  const getAbbreviatedName = () => {
    if (customerFirstName && customerLastName) {
      return `${customerFirstName.charAt(0)}. ${customerLastName}`;
    }
    if (customerFirstName) return customerFirstName;
    if (customerLastName) return customerLastName;
    return '';
  };

  // Helper function to abbreviate phone (073***0000)
  const getAbbreviatedPhone = () => {
    if (!customerPhone) return '';
    const cleaned = customerPhone.replace(/\s+/g, '');
    if (cleaned.length >= 7) {
      const first3 = cleaned.substring(0, 3);
      const last4 = cleaned.substring(cleaned.length - 4);
      return `${first3}***${last4}`;
    }
    return customerPhone;
  };

  // Helper function to get full address for DELIVERY
  const getFullAddress = () => {
    return [customerAddress, customerStreet, customerPostcode].filter(Boolean).join(', ');
  };

  // Helper function to abbreviate email (b***@gmail.com)
  const getAbbreviatedEmail = () => {
    if (!customerEmail) return '';
    const atIndex = customerEmail.indexOf('@');
    if (atIndex > 1) {
      return `${customerEmail.charAt(0)}***${customerEmail.substring(atIndex)}`;
    }
    return customerEmail;
  };

  // Helper function for full customer display name
  const getCustomerDisplayName = () => {
    if (customerFirstName || customerLastName) {
      return `${customerFirstName || ''} ${customerLastName || ''}`.trim();
    }
    return 'Customer';
  };

  const hasCustomerInfo = customerFirstName || customerLastName || customerPhone || customerAddress;

  // Custom scrollbar styling for Zone 2
  const scrollAreaStyle: React.CSSProperties = {
    maxHeight: 'calc(90vh - 280px)', // Adjust based on header + footer height
    overflowY: 'auto',
    paddingRight: '8px',
    scrollBehavior: 'smooth'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden border-gray-700 text-white [&>button]:hidden flex flex-col p-0"
        style={{
          background: '#1E1E1E',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
          border: `1px solid rgba(255, 255, 255, 0.03)`
        }}
        aria-describedby="order-confirmation-description"
      >
        {/* ============================================ */}
        {/* ZONE 1: FIXED HEADER (Non-scrolling)        */}
        {/* ============================================ */}
        <div 
          className="sticky top-0 z-10 px-6 py-5 space-y-4"
          style={{
            background: '#1E1E1E',
            backdropFilter: 'blur(4px)',
            borderBottom: `2px solid ${QSAITheme.purple.primary}`
          }}
        >
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              {getOrderTypeIcon()}
              <span style={{ color: QSAITheme.purple.primary }}>Order Confirmation</span>
            </DialogTitle>
            
            {/* Order Context Badges + Customer Info Badges */}
            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                {/* Order Type Badge */}
                <Badge
                  className={cn(
                    "px-3 py-1 font-medium",
                    orderType === "DINE-IN" &&
                      "bg-blue-500/20 text-blue-200 border-blue-400 hover:bg-blue-500/30 hover:text-blue-100",
                    orderType === "DELIVERY" &&
                      "bg-green-500/20 text-green-200 border-green-400 hover:bg-green-500/30 hover:text-green-100",
                    orderType === "COLLECTION" &&
                      "bg-orange-500/20 text-orange-200 border-orange-400 hover:bg-orange-500/30 hover:text-orange-100",
                    orderType === "WAITING" &&
                      "bg-purple-500/20 text-purple-200 border-purple-400 hover:bg-purple-500/30 hover:text-purple-100",
                  )}
                >
                  {getOrderTypeIcon()}
                  {orderType}
                </Badge>
                
                {tableNumber && (
                  <Badge className="border-slate-600 text-slate-300 bg-slate-600/10 px-3 py-1">
                    Table {tableNumber}
                  </Badge>
                )}
                
                {/* Guest Count - ONLY for DINE-IN */}
                {orderType === 'DINE-IN' && guestCount && (
                  <Badge className="border-slate-600 text-slate-300 bg-slate-600/10 px-3 py-1">
                    {guestCount} Guest{guestCount > 1 ? 's' : ''}
                  </Badge>
                )}

                {/* Customer Info Badges - NOT for DINE-IN (DINE-IN only needs guest count) */}
                {orderType !== 'DINE-IN' && (
                  <>
                    {/* Customer Name Badge */}
                    {(customerFirstName || customerLastName) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="border-purple-400 text-purple-200 bg-purple-500/20 px-3 py-1 hover:bg-purple-500/30 hover:text-purple-100 cursor-help font-medium">
                            <User className="w-3 h-3 mr-1.5" />
                            {getAbbreviatedName()}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-slate-900/95 border-purple-400 text-white shadow-xl">
                          <p className="text-sm font-medium">Customer: {getCustomerDisplayName()}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Customer Phone Badge */}
                    {customerPhone && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="border-purple-400 text-purple-200 bg-purple-500/20 px-3 py-1 hover:bg-purple-500/30 hover:text-purple-100 cursor-help font-medium">
                            <Phone className="w-3 h-3 mr-1.5" />
                            {customerPhone}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-slate-900/95 border-purple-400 text-white shadow-xl">
                          <p className="text-sm font-medium">Contact: {customerPhone}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Customer Email Badge - for WAITING/COLLECTION/DELIVERY */}
                    {customerEmail && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="border-purple-400 text-purple-200 bg-purple-500/20 px-3 py-1 cursor-help font-medium">
                            <Receipt className="w-3 h-3 mr-1.5" />
                            {getAbbreviatedEmail()}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-slate-900/95 border-purple-400 text-white shadow-xl">
                          <p className="text-sm font-medium">Email: {customerEmail}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Customer Address Badge - ONLY for DELIVERY */}
                    {orderType === 'DELIVERY' && (customerAddress || customerStreet || customerPostcode) && getFullAddress() && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="border-purple-400 text-purple-200 bg-purple-500/20 px-3 py-1 hover:bg-purple-500/30 hover:text-purple-200 cursor-help font-medium">
                            <Home className="w-3 h-3 mr-1.5" />
                            {getFullAddress()}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-slate-900/95 border-purple-400 text-white shadow-xl max-w-sm">
                          <p className="text-sm font-medium">Delivery Address:</p>
                          <p className="text-sm">{getFullAddress()}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>
            </TooltipProvider>
          </DialogHeader>

          {/* Critical Question */}
          <div className="text-center pt-2">
            <h3 className="text-xl font-bold text-white mb-1">Is the order correct?</h3>
            <p className="text-slate-400 text-sm">
              Please review all details with the customer before proceeding.
            </p>
          </div>
        </div>

        <div id="order-confirmation-description" className="sr-only">
          Order confirmation modal for {orderType} order with {orderItems.length} items totaling {safeCurrency(total)}
        </div>

        {/* ============================================ */}
        {/* ZONE 2: THERMAL RECEIPT PREVIEW (Scrollable) */}
        {/* ============================================ */}
        <div 
          style={scrollAreaStyle} 
          className="px-6 py-4 bg-gradient-to-b from-zinc-900/50 to-zinc-800/50"
        >
          <div className="max-w-md mx-auto">
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
        {/* ZONE 3: FIXED ACTION BAR (Non-scrolling)    */}
        {/* ============================================ */}
        <div 
          className="sticky bottom-0 z-10 px-6 py-5 space-y-3"
          style={{
            background: '#1E1E1E',
            backdropFilter: 'blur(4px)',
            borderTop: `2px solid ${QSAITheme.purple.primary}`
          }}
        >
          {orderType === "DINE-IN" ? (
            /* DINE-IN CTAs */
            <>
              {/* Top Row: Make Changes */}
              <Button
                onClick={() => handleConfirm('make_changes')}
                className="w-full text-white font-semibold border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10"
                style={{ 
                  background: QSAITheme.background.tertiary,
                  color: QSAITheme.purple.light
                }}
              >
                No - Make Changes
              </Button>
              
              {/* Bottom Row: Add to Order / Send to Kitchen */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleConfirm('add_to_order')}
                  className="text-white font-semibold"
                  style={{ 
                    background: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.border.accent}`
                  }}
                >
                  Add to Order
                </Button>
                <Button
                  onClick={() => handleConfirm('send_to_kitchen')}
                  className="text-white font-semibold"
                  style={{ 
                    background: QSAITheme.purple.primary,
                    boxShadow: effects.outerGlow('medium')
                  }}
                >
                  Send to Kitchen
                </Button>
              </div>
            </>
          ) : (
            /* DELIVERY/WAITING/COLLECTION CTAs */
            <>
              {/* Top Row: Make Changes */}
              <Button
                onClick={() => handleConfirm('make_changes')}
                className="w-full text-white font-semibold border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10"
                style={{ 
                  background: QSAITheme.background.tertiary,
                  color: QSAITheme.purple.light
                }}
              >
                No - Make Changes
              </Button>
              
              {/* Bottom Row: Process Order / Complete & Take Payment */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleConfirm('no_payment')}
                  className="text-white font-semibold"
                  style={{ 
                    background: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.border.accent}`
                  }}
                >
                  Process Order (Payment Pending)
                </Button>
                <Button
                  onClick={() => handleConfirm('payment')}
                  className="text-white font-semibold"
                  style={{ 
                    background: QSAITheme.purple.primary,
                    boxShadow: effects.outerGlow('medium')
                  }}
                >
                  Complete Order & Take Payment
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Custom Scrollbar Styles */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(30, 30, 30, 0.5);
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${QSAITheme.purple.primary};
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${QSAITheme.purple.light};
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
