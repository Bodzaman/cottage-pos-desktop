/**
 * OnlineOrderSummaryPanel Component
 * Right panel for the Online Orders view in ResponsivePOSShell
 * Shows selected order details and action buttons (inline, not a drawer)
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Truck,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Check,
  X,
  ChefHat,
  Package,
  Printer,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderAgeTimer } from './OrderAgeTimer';
import { OnlineOrder, OnlineOrderStatus } from 'utils/stores/onlineOrdersRealtimeStore';
import { formatCurrency } from 'utils/formatters';
import { format } from 'date-fns';

interface OnlineOrderSummaryPanelProps {
  order: OnlineOrder | null;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onPrint?: (orderId: string) => void;
  isActionLoading?: boolean;
}

const STATUS_COLORS: Record<OnlineOrderStatus, string> = {
  NEW: 'bg-blue-500',
  CONFIRMED: 'bg-indigo-500',
  PREPARING: 'bg-purple-500',
  READY: 'bg-green-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
};

export function OnlineOrderSummaryPanel({
  order,
  onAccept,
  onReject,
  onMarkReady,
  onComplete,
  onPrint,
  isActionLoading = false,
}: OnlineOrderSummaryPanelProps) {
  // Empty state
  if (!order) {
    return (
      <div
        className="flex flex-col h-full rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(25,25,25,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(124,93,250,0.15)',
          boxShadow: '0 12px 30px -8px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'rgba(124,93,250,0.08)',
              border: '1px solid rgba(124,93,250,0.15)',
            }}
          >
            <Inbox className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No Order Selected
          </h3>
          <p className="text-sm text-gray-500 max-w-[200px]">
            Click on an order card to view details and take action
          </p>
        </div>
      </div>
    );
  }

  const isNew = order.status === 'NEW';
  const isPreparing = order.status === 'CONFIRMED' || order.status === 'PREPARING';
  const isReady = order.status === 'READY';

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(25,25,25,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(124,93,250,0.15)',
        boxShadow: '0 12px 30px -8px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full', STATUS_COLORS[order.status])} />
            <span className="font-mono text-lg font-bold text-white">
              #{order.orderNumber}
            </span>
          </div>
          <OrderAgeTimer
            createdAt={order.createdAt}
            acceptanceDeadline={order.acceptanceDeadline}
            size="sm"
          />
        </div>

        {/* Order Type & Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {order.orderType === 'DELIVERY' ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              <Truck className="w-3 h-3 mr-1" />
              DELIVERY
            </Badge>
          ) : (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              <ShoppingBag className="w-3 h-3 mr-1" />
              COLLECTION
            </Badge>
          )}
          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
            {order.status}
          </Badge>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
            <CreditCard className="w-3 h-3 mr-1" />
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Customer Info */}
          <div className="space-y-2">
            <h3 className="font-medium text-xs text-gray-500 uppercase tracking-wider">
              Customer
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-white">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-sm text-purple-400 hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400 truncate">
                    {order.customerEmail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {order.orderType === 'DELIVERY' && order.deliveryAddress && (
            <>
              <Separator className="bg-white/[0.07]" />
              <div className="space-y-2">
                <h3 className="font-medium text-xs text-gray-500 uppercase tracking-wider">
                  Delivery Address
                </h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{order.deliveryAddress}</span>
                </div>
              </div>
            </>
          )}

          {/* Order Items */}
          <Separator className="bg-white/[0.07]" />
          <div className="space-y-2">
            <h3 className="font-medium text-xs text-gray-500 uppercase tracking-wider">
              Items ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex justify-between items-start text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-white">{item.quantity}x</span>
                      <span className="text-gray-300 truncate">{item.name}</span>
                    </div>
                    {item.variant && (
                      <div className="text-xs text-gray-500 ml-5">
                        {item.variant}
                      </div>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-xs text-gray-500 ml-5">
                        + {item.modifiers.map(m => m.name).join(', ')}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="text-xs text-orange-400 ml-5 italic">
                        {item.specialInstructions}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-white ml-2">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <>
              <Separator className="bg-white/[0.07]" />
              <div className="space-y-2">
                <h3 className="font-medium text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Instructions
                </h3>
                <p className="text-sm text-gray-300 bg-white/[0.07] p-2 rounded">
                  {order.specialInstructions}
                </p>
              </div>
            </>
          )}

          {/* Allergen Notes */}
          {order.allergenNotes && (
            <>
              <Separator className="bg-white/[0.07]" />
              <div className="space-y-2">
                <h3 className="font-medium text-xs text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Allergen Alert
                </h3>
                <p className="text-sm text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20">
                  {order.allergenNotes}
                </p>
              </div>
            </>
          )}

          {/* Order Summary */}
          <Separator className="bg-white/[0.07]" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Delivery</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white pt-2 border-t border-white/[0.07]">
              <span>Total</span>
              <span className="text-lg">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {format(order.createdAt, 'HH:mm')} on {format(order.createdAt, 'dd MMM')}
            </span>
          </div>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-3 border-t border-white/[0.07] space-y-2">
        {isNew && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onAccept?.(order.id)}
              disabled={isActionLoading}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Accept
            </Button>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => onReject?.(order.id)}
              disabled={isActionLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isPreparing && (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => onMarkReady?.(order.id)}
            disabled={isActionLoading}
          >
            <ChefHat className="w-4 h-4 mr-1.5" />
            Mark Ready
          </Button>
        )}

        {isReady && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onComplete?.(order.id)}
            disabled={isActionLoading}
          >
            <Package className="w-4 h-4 mr-1.5" />
            {order.orderType === 'DELIVERY' ? 'Dispatched' : 'Collected'}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full border-white/10 text-gray-300 hover:bg-white/[0.07]"
          onClick={() => onPrint?.(order.id)}
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}

export default OnlineOrderSummaryPanel;
