/**
 * OrderConfirmationView - Order review step in unified payment flow
 * Shows order summary with customer/table info and action buttons
 * Part of PaymentFlowOrchestrator state machine
 * 
 * This is a VIEW component (not a modal), designed to live inside the orchestrator
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
  ChefHat,
  ArrowRight,
  Edit,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OrderConfirmationViewProps } from '../utils/paymentFlowTypes';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { safeCurrency } from '../utils/numberUtils';
import { OrderItem } from '../utils/menuTypes';

export function OrderConfirmationView({
  orderItems,
  orderType,
  orderTotal,
  tableNumber,
  guestCount,
  customerData,
  deliveryFee = 0,
  onContinueToPayment,
  onAddToOrder,
  onSendToKitchen,
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

  // Calculate item count
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  // Helper to get customer name
  const getCustomerName = () => {
    if (customerData?.firstName || customerData?.lastName) {
      return `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
    }
    return 'Customer';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
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

      {/* Customer/Table Info Card */}
      {(orderType === 'DINE-IN' || orderType === 'DELIVERY' || orderType === 'COLLECTION') && (
        <Card style={styles.frostedGlassStyle}>
          <CardContent className="p-4 space-y-3">
            {/* DINE-IN: Table + Guests */}
            {orderType === 'DINE-IN' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Table:</span>
                  </div>
                  <span className="font-semibold text-white">Table {tableNumber || '?'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Guests:</span>
                  </div>
                  <span className="font-semibold text-white">{guestCount || 1}</span>
                </div>
              </>
            )}

            {/* DELIVERY/COLLECTION: Customer Info */}
            {(orderType === 'DELIVERY' || orderType === 'COLLECTION') && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/80">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Customer:</span>
                  </div>
                  <span className="font-semibold text-white">{getCustomerName()}</span>
                </div>
                {customerData?.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/80">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">Phone:</span>
                    </div>
                    <span className="font-semibold text-white text-sm">{customerData.phone}</span>
                  </div>
                )}
                {orderType === 'DELIVERY' && customerData?.address && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-white/80">
                      <Home className="h-4 w-4 mt-0.5" />
                      <span className="text-sm">Address:</span>
                    </div>
                    <span className="font-semibold text-white text-sm text-right max-w-[200px]">
                      {customerData.address}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Items Summary */}
      <Card style={styles.frostedGlassStyle}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Order Items</h3>
            <Badge variant="secondary" className="bg-white/10 text-white">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          {/* Scrollable Items List */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {orderItems.map((item, index) => (
              <div 
                key={item.id || index}
                className="flex justify-between items-start py-2 border-b border-white/5 last:border-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {item.quantity}x {item.name}
                  </div>
                  {item.variantName && (
                    <div className="text-xs text-white/60 mt-0.5">{item.variantName}</div>
                  )}
                  {item.notes && (
                    <div className="text-xs text-white/50 mt-1 italic">{item.notes}</div>
                  )}
                </div>
                <div className="text-sm font-semibold text-white ml-4">
                  {safeCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card 
        className="border-purple-500/30"
        style={{
          ...styles.frostedGlassStyle,
          background: 'rgba(91, 33, 182, 0.1)',
          boxShadow: effects.outerGlow('subtle')
        }}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-center text-white/80">
            <span>Subtotal:</span>
            <span className="font-semibold">{safeCurrency(orderTotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between items-center text-white/80">
              <span>Delivery Fee:</span>
              <span className="font-semibold">{safeCurrency(deliveryFee)}</span>
            </div>
          )}
          <Separator className="bg-white/10 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-white">Total:</span>
            <span 
              className="text-2xl font-bold"
              style={{ color: QSAITheme.purple.primary }}
            >
              {safeCurrency(orderTotal + deliveryFee)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        {/* Primary Action: Continue to Payment */}
        <Button
          onClick={onContinueToPayment}
          className="w-full h-14 text-white font-bold text-lg"
          style={{
            ...styles.frostedGlassStyle,
            background: QSAITheme.purple.primary,
            boxShadow: effects.outerGlow('medium')
          }}
        >
          Continue to Payment
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onSendToKitchen}
            className="h-12 border-white/20 text-white/80 hover:bg-white/10 hover:border-purple-500/50"
            style={styles.frostedGlassStyle}
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Send to Kitchen
          </Button>
          <Button
            variant="outline"
            onClick={onAddToOrder}
            className="h-12 border-white/20 text-white/80 hover:bg-white/10 hover:border-purple-500/50"
            style={styles.frostedGlassStyle}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Order
          </Button>
        </div>

        {/* Make Changes Button */}
        <Button
          variant="outline"
          onClick={onMakeChanges}
          className="w-full h-12 border-white/20 text-white/60 hover:bg-white/5 hover:border-white/30"
          style={styles.frostedGlassStyle}
        >
          <Edit className="h-4 w-4 mr-2" />
          Make Changes to Order
        </Button>
      </div>
    </motion.div>
  );
}
