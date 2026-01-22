import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Package, Truck, MapPin, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

interface OrderCardProps {
  order: OrderData;
  onReorder?: () => void; // Made optional since we're using ReorderButton
  onViewDetails: () => void;
  className?: string;
}

// Helper function to format currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown time';
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

// Helper function to get order source styling
const getOrderSourceBadge = (source: string) => {
  const sourceUpper = source.toUpperCase();
  
  switch (sourceUpper) {
    case 'ONLINE':
      return {
        className: 'bg-amber-600/15 text-amber-400',
        label: 'Online'
      };
    case 'POS':
      return {
        className: 'bg-cyan-600/15 text-cyan-400',
        label: 'In-Store'
      };
    case 'PHONE':
      return {
        className: 'bg-pink-600/15 text-pink-400',
        label: 'Phone'
      };
    default:
      return {
        className: 'bg-gray-600/15 text-gray-400',
        label: source
      };
  }
};

export function OrderCard({ order, onReorder, onViewDetails, className }: OrderCardProps) {
  const statusBadge = getStatusBadge(order.status);
  const typeBadge = getOrderTypeBadge(order.order_type);
  const sourceBadge = getOrderSourceBadge(order.order_source);
  
  // Get the first few items for preview
  const previewItems = order.items.slice(0, 3);
  const remainingItems = order.items.length - 3;
  
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
    <Card className={`bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors duration-200 ${className}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 bg-gray-800/50 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold text-white text-lg">
                  #{order.order_id.slice(-8).toUpperCase()}
                </h3>
                <Badge variant="outline" className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
                <Badge variant="outline" className={`${typeBadge.className} flex items-center gap-1`}>
                  {typeBadge.icon}
                  {typeBadge.label}
                </Badge>
                <Badge variant="secondary" className={sourceBadge.className}>
                  {sourceBadge.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatRelativeTime(order.created_at)}
                </div>
                {order.table_number && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Table {order.table_number}
                  </div>
                )}
                <div className="text-gray-500">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-500 mb-1">
                {formatPrice(order.total)}
              </div>
              <div className="text-sm text-gray-400">
                via {order.payment.method}
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Items Preview */}
        <div className="p-4">
          <div className="space-y-2 mb-4">
            {previewItems.map((item, idx) => (
              <div key={`${order.order_id}-preview-${idx}`} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <span className="text-white font-medium">{item.quantity}x</span>
                  <span className="text-gray-300 ml-2">{item.name}</span>
                  {item.variant_name && (
                    <span className="text-gray-500 ml-1">({item.variant_name})</span>
                  )}
                </div>
                <span className="text-gray-400">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            
            {remainingItems > 0 && (
              <div className="text-sm text-gray-500 italic">
                +{remainingItems} more item{remainingItems !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Order Summary */}
          <div className="border-t border-gray-800 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.service_charge > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Service Charge:</span>
                <span>{formatPrice(order.service_charge)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount:</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Tax:</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            {order.tip > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Tip:</span>
                <span>{formatPrice(order.tip)}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <ReorderButton
              orderId={order.order_id}
              orderItems={orderItemsForReorder}
              orderType={order.order_type.toLowerCase()}
              className="flex-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
