import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Printer, 
  Split, 
  Check,
  Clock,
  Users,
  Package,
  Truck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OrderItem, OrderType } from 'utils/usePOSOrders';

// Global colors (extracted from POS.tsx)
const globalColors = {
  purple: {
    primary: '#7C5DFA',
    light: '#9277FF',
    primaryTransparent: 'rgba(124, 93, 250, 0.1)'
  },
  background: {
    primary: 'rgba(20, 20, 20, 0.95)',
    secondary: 'rgba(15, 15, 15, 0.95)'
  }
};

const effects = {
  outerGlow: (color: string, opacity: number = 0.2) => `0 0 20px ${color}${Math.round(opacity * 255).toString(16)}`,
  innerGlow: (color: string, opacity: number = 0.1) => `inset 0 0 10px ${color}${Math.round(opacity * 255).toString(16)}`
};

interface OrderManagerProps {
  orderItems: OrderItem[];
  orderType: OrderType;
  tableNumber?: number | null;
  guestCount?: number;
  customerFirstName?: string;
  customerLastName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerStreet?: string;
  customerCity?: string;
  customerPostcode?: string;
  
  // Order operations
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onClearOrder: () => void;
  onProcessPayment: () => void;
  onSendToKitchen: () => void;
  onPrintBill: () => void;
  onSplitBill: () => void;
  onCompleteOrder: () => void;
  
  // Order status
  sentToKitchen?: boolean;
  hasNewItems?: boolean;
  lastSentToKitchenAt?: Date | null;
  lastBillPrintedAt?: Date | null;
  billPrinted?: boolean;
  tableStatus?: string;
  kitchenTicketsCount?: number;
  
  // Delivery info
  deliveryFee?: string;
  deliveryDistance?: number | null;
  deliveryTime?: string | null;
  minimumOrderMet?: boolean;
  minimumOrderAmount?: number;
  
  className?: string;
}

export const OrderManager: React.FC<OrderManagerProps> = ({
  orderItems,
  orderType,
  tableNumber,
  guestCount,
  customerFirstName,
  customerLastName,
  customerAddress,
  customerPhone,
  customerStreet,
  customerCity,
  customerPostcode,
  onRemoveItem,
  onUpdateQuantity,
  onClearOrder,
  onProcessPayment,
  onSendToKitchen,
  onPrintBill,
  onSplitBill,
  onCompleteOrder,
  sentToKitchen = false,
  hasNewItems = false,
  lastSentToKitchenAt,
  lastBillPrintedAt,
  billPrinted = false,
  tableStatus = "AVAILABLE",
  kitchenTicketsCount = 0,
  deliveryFee = "0.00",
  deliveryDistance,
  deliveryTime,
  minimumOrderMet = true,
  minimumOrderAmount = 20.00,
  className = ''
}) => {
  // Calculate totals
  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;
      
      // Add modifier prices
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          mod.options.forEach(option => {
            itemTotal += option.price * item.quantity;
          });
        });
      }
      
      // Apply discount if any
      if (item.discount) {
        itemTotal = itemTotal * (1 - item.discount / 100);
      }
      
      return sum + itemTotal;
    }, 0);
  };
  
  const calculateTax = () => {
    // VAT is already included in menu prices - return 0 to avoid double charging
    return 0;
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
  
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    // VAT is already included in menu item prices - no need to add it
    const serviceCharge = calculateServiceCharge();
    
    // Calculate delivery fee - use restaurant delivery settings
    let delivery = 0;
    if (orderType === 'DELIVERY') {
      delivery = parseFloat(deliveryFee);
    }
    
    // Total = subtotal (VAT already included) + service charge + delivery fee
    return subtotal + serviceCharge + delivery;
  };
  
  // Get order type icon
  const getOrderTypeIcon = () => {
    switch (orderType) {
      case 'DINE-IN':
        return <Users className="h-4 w-4" />;
      case 'COLLECTION':
        return <Package className="h-4 w-4" />;
      case 'DELIVERY':
        return <Truck className="h-4 w-4" />;
      case 'WAITING':
        return <Clock className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };
  
  // Check if order can be sent to kitchen
  const canSendToKitchen = () => {
    return orderItems.length > 0 && (!sentToKitchen || hasNewItems);
  };
  
  // Check if bill can be printed
  const canPrintBill = () => {
    return orderItems.length > 0 && sentToKitchen && !billPrinted;
  };
  
  // Check if payment can be processed
  const canProcessPayment = () => {
    if (orderItems.length === 0) return false;
    if (orderType === 'DELIVERY' && !minimumOrderMet) return false;
    return true;
  };
  
  return (
    <Card className={`h-full flex flex-col ${className}`}
      style={{
        background: `linear-gradient(145deg, ${globalColors.background.primary} 0%, ${globalColors.background.secondary} 100%)`,
        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getOrderTypeIcon()}
            <span style={{
              backgroundImage: `linear-gradient(135deg, white 30%, ${globalColors.purple.light} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 10px rgba(124, 93, 250, 0.2)'
            }}>
              Order Summary
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {orderType === 'DINE-IN' && tableNumber && (
              <Badge variant="outline" className="text-xs">
                Table {tableNumber}
                {guestCount && guestCount > 0 && ` • ${guestCount} guests`}
              </Badge>
            )}
            
            {orderItems.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {orderItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </Badge>
            )}
            
            {kitchenTicketsCount > 0 && (
              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400">
                {kitchenTicketsCount} in kitchen
              </Badge>
            )}
          </div>
        </CardTitle>
        
        {/* Customer Info for Collection/Delivery */}
        {(orderType === 'COLLECTION' || orderType === 'DELIVERY') && customerFirstName && (
          <div className="text-sm text-gray-400 mt-2">
            <div className="flex items-center gap-4">
              <span>{customerFirstName} {customerLastName}</span>
              {customerPhone && <span>• {customerPhone}</span>}
            </div>
            {orderType === 'DELIVERY' && customerAddress && (
              <div className="text-xs mt-1 text-gray-500">
                {customerAddress}
                {deliveryDistance && (
                  <span className="ml-2">• {deliveryDistance.toFixed(1)} miles</span>
                )}
                {deliveryTime && (
                  <span className="ml-2">• Est. {deliveryTime}</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Order Items */}
        <div className="flex-1 overflow-y-auto mb-4">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No items in order</p>
              <p className="text-sm text-center">Add items from the menu to start building an order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.name}</h4>
                      
                      {/* Modifiers */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {item.modifiers.map((mod, modIndex) => (
                            <div key={modIndex}>
                              {mod.options.map((option, optIndex) => (
                                <span key={optIndex} className="mr-2">
                                  + {option.name} (+£{option.price.toFixed(2)})
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Special Instructions */}
                      {item.specialInstructions && (
                        <div className="text-xs text-yellow-400 mt-1 italic">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                      
                      {/* Discount */}
                      {item.discount && (
                        <div className="text-xs text-green-400 mt-1">
                          Discount: {item.discount}% ({item.discountReason})
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-semibold text-white">
                          £{(item.price * item.quantity).toFixed(2)}
                        </span>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-300"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Order Totals */}
        {orderItems.length > 0 && (
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-white">£{calculateSubtotal().toFixed(2)}</span>
            </div>
            
            {orderType === 'DINE-IN' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Service Charge ({typeof window !== 'undefined' && window.posSettings?.service_charge?.enabled 
                    ? window.posSettings.service_charge.percentage 
                    : 10}%):
                </span>
                <span className="text-white">£{calculateServiceCharge().toFixed(2)}</span>
              </div>
            )}
            
            {orderType === 'DELIVERY' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Delivery Fee:</span>
                <span className="text-white">
                  {parseFloat(deliveryFee) === 0 ? 'FREE' : `£${parseFloat(deliveryFee).toFixed(2)}`}
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">VAT (20%):</span>
              <span className="text-white text-xs">Included in prices</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">Total:</span>
              <span className="text-white" style={{ color: '#ffffff !important' }}>£{calculateTotal().toFixed(2)}</span>
            </div>
            
            {/* Minimum Order Warning for Delivery */}
            {orderType === 'DELIVERY' && !minimumOrderMet && (
              <div className="text-xs text-orange-400 mt-2 p-2 bg-orange-500/10 rounded">
                Minimum order of £{minimumOrderAmount.toFixed(2)} required for delivery
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        {orderItems.length > 0 && (
          <div className="mt-4 space-y-2">
            {/* Kitchen Actions */}
            {orderType !== 'ONLINE_ORDERS' && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSendToKitchen}
                  disabled={!canSendToKitchen()}
                  className="flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  {sentToKitchen && !hasNewItems ? 'Sent' : 'Send to Kitchen'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrintBill}
                  disabled={!canPrintBill()}
                  className="flex items-center gap-1"
                >
                  <Printer className="h-3 w-3" />
                  {billPrinted ? 'Bill Printed' : 'Print Bill'}
                </Button>
              </div>
            )}
            
            {/* Payment Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSplitBill}
                disabled={orderItems.length === 0}
                className="flex items-center gap-1"
              >
                <Split className="h-3 w-3" />
                Split Bill
              </Button>
              
              <Button
                onClick={onProcessPayment}
                disabled={!canProcessPayment()}
                className="flex items-center gap-1"
                style={{
                  background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.light} 100%)`,
                  border: 'none'
                }}
              >
                <Check className="h-3 w-3" />
                Process Payment
              </Button>
            </div>
            
            {/* Clear Order */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearOrder}
              className="w-full text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
