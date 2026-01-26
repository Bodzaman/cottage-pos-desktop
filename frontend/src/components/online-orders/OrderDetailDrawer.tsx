/**
 * OrderDetailDrawer Component
 * Slide-out drawer showing full order details
 */

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderAgeTimer } from './OrderAgeTimer';
import { OnlineOrder, OnlineOrderStatus } from 'utils/stores/onlineOrdersRealtimeStore';
import { formatCurrency } from 'utils/formatters';
import { format } from 'date-fns';

interface OrderDetailDrawerProps {
  order: OnlineOrder | null;
  isOpen: boolean;
  onClose: () => void;
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

export function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onMarkReady,
  onComplete,
  onPrint,
  isActionLoading = false,
}: OrderDetailDrawerProps) {
  if (!order) return null;

  const isNew = order.status === 'NEW';
  const isPreparing = order.status === 'CONFIRMED' || order.status === 'PREPARING';
  const isReady = order.status === 'READY';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-3 h-3 rounded-full', STATUS_COLORS[order.status])} />
              <SheetTitle className="font-mono text-xl">
                #{order.orderNumber}
              </SheetTitle>
            </div>
            <OrderAgeTimer
              createdAt={order.createdAt}
              acceptanceDeadline={order.acceptanceDeadline}
              size="md"
            />
          </div>

          {/* Order Type & Status */}
          <div className="flex items-center gap-2 mt-2">
            {order.orderType === 'DELIVERY' ? (
              <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                <Truck className="w-3 h-3 mr-1" />
                DELIVERY
              </Badge>
            ) : (
              <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                <ShoppingBag className="w-3 h-3 mr-1" />
                COLLECTION
              </Badge>
            )}
            <Badge variant="outline">{order.status}</Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-600">
              <CreditCard className="w-3 h-3 mr-1" />
              {order.paymentStatus}
            </Badge>
          </div>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                Customer
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-primary hover:underline"
                    >
                      {order.customerPhone}
                    </a>
                  </div>
                )}
                {order.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="text-primary hover:underline text-sm"
                    >
                      {order.customerEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            {order.orderType === 'DELIVERY' && order.deliveryAddress && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                    Delivery Address
                  </h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{order.deliveryAddress}</span>
                  </div>
                </div>
              </>
            )}

            {/* Order Items */}
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                Items
              </h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex justify-between items-start py-1"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      {item.variant && (
                        <div className="text-sm text-muted-foreground ml-6">
                          {item.variant}
                        </div>
                      )}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-sm text-muted-foreground ml-6">
                          + {item.modifiers.map(m => m.name).join(', ')}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="text-sm text-orange-600 ml-6 italic">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Special Instructions
                  </h3>
                  <p className="text-sm bg-muted/50 p-2 rounded">
                    {order.specialInstructions}
                  </p>
                </div>
              </>
            )}

            {/* Allergen Notes */}
            {order.allergenNotes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-red-500 uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Allergen Alert
                  </h3>
                  <p className="text-sm bg-red-500/10 text-red-600 p-2 rounded border border-red-500/30">
                    {order.allergenNotes}
                  </p>
                </div>
              </>
            )}

            {/* Order Summary */}
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                Summary
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Placed at {format(order.createdAt, 'HH:mm')} on{' '}
                {format(order.createdAt, 'dd MMM yyyy')}
              </span>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-2">
          {isNew && (
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onAccept?.(order.id)}
                disabled={isActionLoading}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept Order
              </Button>
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={() => onReject?.(order.id)}
                disabled={isActionLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {isPreparing && (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => onMarkReady?.(order.id)}
              disabled={isActionLoading}
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Mark as Ready
            </Button>
          )}

          {isReady && (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => onComplete?.(order.id)}
              disabled={isActionLoading}
            >
              <Package className="w-4 h-4 mr-2" />
              {order.orderType === 'DELIVERY' ? 'Mark Dispatched' : 'Mark Collected'}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onPrint?.(order.id)}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default OrderDetailDrawer;
