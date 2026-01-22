import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  User, 
  Phone, 
  Mail,
  RotateCcw,
  X,
  FileText
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ReorderButton } from './ReorderButton';
import { OrderItemForReorder } from '../utils/reorderTypes';

interface OrderItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  variant_name?: string;
  modifiers?: any[];
  notes?: string;
}

interface PaymentInfo {
  method: string;
  amount: number;
  tip?: number;
  transaction_id?: string;
}

interface OrderData {
  order_id: string;
  order_type: string;
  order_source: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  table_number?: number;
  guest_count?: number;
  created_at: string;
  completed_at: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  tip: number;
  total: number;
  payment: PaymentInfo;
  status: string;
  notes?: string;
  staff_id?: string;
}

interface OrderDetailModalProps {
  order: OrderData;
  isOpen: boolean;
  onClose: () => void;
  onReorder?: () => void; // Made optional since we're using ReorderButton
}

// Helper function to format currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'PPP p'); // e.g., "January 1, 2025 at 2:30 PM"
  } catch {
    return 'Unknown date';
  }
};

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  const statusUpper = status.toUpperCase();
  
  switch (statusUpper) {
    case 'COMPLETED':
      return {
        className: 'bg-green-600/20 text-green-400 border-green-600/30',
        label: 'Completed'
      };
    case 'REFUNDED':
      return {
        className: 'bg-red-600/20 text-red-400 border-red-600/30',
        label: 'Refunded'
      };
    case 'PARTIAL_REFUND':
      return {
        className: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
        label: 'Partial Refund'
      };
    case 'CANCELLED':
      return {
        className: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
        label: 'Cancelled'
      };
    default:
      return {
        className: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
        label: status
      };
  }
};

// Helper function to get order type badge styling and icon
const getOrderTypeBadge = (type: string) => {
  const typeUpper = type.toUpperCase();
  
  switch (typeUpper) {
    case 'DELIVERY':
      return {
        className: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
        label: 'Delivery',
        icon: <Truck className="w-3 h-3" />
      };
    case 'COLLECTION':
      return {
        className: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
        label: 'Collection',
        icon: <Package className="w-3 h-3" />
      };
    case 'DINE-IN':
      return {
        className: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
        label: 'Dine In',
        icon: <MapPin className="w-3 h-3" />
      };
    default:
      return {
        className: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
        label: type,
        icon: <Package className="w-3 h-3" />
      };
  }
};

export function OrderDetailModal({ order, isOpen, onClose, onReorder }: OrderDetailModalProps) {
  const statusBadge = getStatusBadge(order.status);
  const typeBadge = getOrderTypeBadge(order.order_type);
  
  // Convert order items to reorder format
  const orderItemsForReorder: OrderItemForReorder[] = order.items.map(item => ({
    item_id: item.item_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    variant_name: item.variant_name,
    notes: item.notes
  }));
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Order #{order.order_id.slice(-8).toUpperCase()}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Detailed view of order #{order.order_id.slice(-8).toUpperCase()} with {order.items?.length || 0} items, current status: {order.status}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Order Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Order Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="text-white font-mono">{order.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Placed:</span>
                    <span className="text-white">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-white">{formatDate(order.completed_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source:</span>
                    <span className="text-white">{order.order_source}</span>
                  </div>
                  {order.table_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Table:</span>
                      <span className="text-white">#{order.table_number}</span>
                    </div>
                  )}
                  {order.guest_count && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Guests:</span>
                      <span className="text-white">{order.guest_count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="space-y-3 text-sm">
                  {order.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{order.customer_name}</span>
                    </div>
                  )}
                  {order.customer_email && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email:
                      </span>
                      <span className="text-white">{order.customer_email}</span>
                    </div>
                  )}
                  {order.customer_phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone:
                      </span>
                      <span className="text-white">{order.customer_phone}</span>
                    </div>
                  )}
                  {!order.customer_name && !order.customer_email && !order.customer_phone && (
                    <div className="text-gray-500 italic">No customer information available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Order Items */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items ({order.items.length} item{order.items.length !== 1 ? 's' : ''})
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={`${order.order_id}-item-${idx}`} className="bg-gray-900 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{item.name}</span>
                          <Badge variant="secondary" className="bg-amber-600/15 text-amber-400 text-xs">
                            {item.quantity}x
                          </Badge>
                        </div>
                        
                        {item.variant_name && (
                          <div className="text-sm text-gray-400 mb-1">
                            Variant: {item.variant_name}
                          </div>
                        )}
                        
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-sm text-gray-400 mb-1">
                            Modifiers: {item.modifiers.map(mod => mod.name).join(', ')}
                          </div>
                        )}
                        
                        {item.notes && (
                          <div className="text-sm text-gray-500 italic">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatPrice(item.price)} each
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Method:</span>
                    <span className="text-white font-medium">{order.payment.method}</span>
                  </div>
                  {order.payment.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID:</span>
                      <span className="text-white font-mono text-xs">{order.payment.transaction_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="text-white font-medium">{formatPrice(order.payment.amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Order Total */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">{formatPrice(order.subtotal)}</span>
                  </div>
                  
                  {order.service_charge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Service Charge:</span>
                      <span className="text-white">{formatPrice(order.service_charge)}</span>
                    </div>
                  )}
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discount:</span>
                      <span className="text-green-400">-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax:</span>
                    <span className="text-white">{formatPrice(order.tax)}</span>
                  </div>
                  
                  {order.tip > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tip:</span>
                      <span className="text-white">{formatPrice(order.tip)}</span>
                    </div>
                  )}
                  
                  <Separator className="my-2 bg-gray-700" />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-white">Total:</span>
                    <span className="text-amber-500">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Order Notes */}
          {order.notes && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Order Notes
                </h3>
                <p className="text-gray-300 leading-relaxed">{order.notes}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <ReorderButton
              orderId={order.order_id}
              orderItems={orderItemsForReorder}
              orderType={order.order_type.toLowerCase()}
              size="default"
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={onClose}
              className="px-8 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
