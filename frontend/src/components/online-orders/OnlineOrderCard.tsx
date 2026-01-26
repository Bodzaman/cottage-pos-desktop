/**
 * OnlineOrderCard Component
 * Compact order card for Kanban view with timer, single-click actions, and urgency indicators
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Truck,
  ShoppingBag,
  Check,
  X,
  ChefHat,
  Package,
  Eye,
  Phone,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderAgeTimer } from './OrderAgeTimer';
import { OnlineOrder, OnlineOrderStatus, UrgencyLevel } from 'utils/stores/onlineOrdersRealtimeStore';
import { formatCurrency } from 'utils/formatters';

interface OnlineOrderCardProps {
  order: OnlineOrder;
  isSelected?: boolean;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
  onSelect?: (orderId: string) => void;
  isActionLoading?: boolean;
}

const URGENCY_BORDER_COLORS: Record<UrgencyLevel, string> = {
  NORMAL: 'border-l-green-500',
  WARNING: 'border-l-yellow-500',
  CRITICAL: 'border-l-orange-500',
  OVERDUE: 'border-l-red-500',
};

const STATUS_BADGE_COLORS: Record<OnlineOrderStatus, string> = {
  NEW: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  CONFIRMED: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30',
  PREPARING: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  READY: 'bg-green-500/20 text-green-600 border-green-500/30',
  COMPLETED: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
  CANCELLED: 'bg-red-500/20 text-red-600 border-red-500/30',
};

export function OnlineOrderCard({
  order,
  isSelected = false,
  onAccept,
  onReject,
  onMarkReady,
  onComplete,
  onViewDetails,
  onSelect,
  isActionLoading = false,
}: OnlineOrderCardProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const isNew = order.status === 'NEW';
  const isPreparing = order.status === 'CONFIRMED' || order.status === 'PREPARING';
  const isReady = order.status === 'READY';

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAccept?.(order.id);
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReject?.(order.id);
  };

  const handleMarkReady = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkReady?.(order.id);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(order.id);
  };

  const handleViewDetails = () => {
    onViewDetails?.(order.id);
  };

  const handleClick = () => {
    // If onSelect is provided, use it for selection (inline panel mode)
    // Otherwise fall back to onViewDetails (drawer mode)
    if (onSelect) {
      onSelect(order.id);
    } else {
      handleViewDetails();
    }
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md',
        'border-l-4',
        URGENCY_BORDER_COLORS[order.urgencyLevel],
        order.urgencyLevel === 'CRITICAL' && 'animate-pulse',
        order.urgencyLevel === 'OVERDUE' && 'ring-2 ring-red-500/50',
        isSelected && 'ring-2 ring-purple-500 bg-purple-500/5'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Order Number + Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm">
              #{order.orderNumber}
            </span>
            <Badge
              variant="outline"
              className={cn('text-xs', STATUS_BADGE_COLORS[order.status])}
            >
              {order.status}
            </Badge>
          </div>
          <OrderAgeTimer
            createdAt={order.createdAt}
            acceptanceDeadline={order.acceptanceDeadline}
            size="sm"
          />
        </div>

        {/* Order Type Badge */}
        <div className="flex items-center gap-2">
          {order.orderType === 'DELIVERY' ? (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 text-xs">
              <Truck className="w-3 h-3 mr-1" />
              DELIVERY
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 text-xs">
              <ShoppingBag className="w-3 h-3 mr-1" />
              COLLECTION
            </Badge>
          )}
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span className="truncate">{order.customerName}</span>
          <span className="text-muted-foreground/50">•</span>
          <span>({itemCount} items)</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            {formatCurrency(order.total)}
          </span>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {isNew && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAccept}
                disabled={isActionLoading}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={handleReject}
                disabled={isActionLoading}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}

          {isPreparing && (
            <Button
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleMarkReady}
              disabled={isActionLoading}
            >
              <ChefHat className="w-4 h-4 mr-1" />
              Ready
            </Button>
          )}

          {isReady && (
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleComplete}
              disabled={isActionLoading}
            >
              <Package className="w-4 h-4 mr-1" />
              {order.orderType === 'DELIVERY' ? 'Dispatched' : 'Collected'}
            </Button>
          )}

          {!isNew && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default OnlineOrderCard;
