import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, RefreshCw, Clock, Package } from 'lucide-react';
import { RecentOrder } from 'types';
import { formatDistanceToNow } from 'date-fns';

interface POSOrderHistorySectionProps {
  orders: RecentOrder[];
  onOrderAgain: (order: RecentOrder) => void;
  maxOrders?: number;
  className?: string;
}

/**
 * POSOrderHistorySection - Displays unified order history (online + POS)
 * 
 * Layout:
 * ━━━ Recent Orders (3) ━━━
 * 
 * 🛍️ Order #4521 • 2 days ago • £28.50
 * ├─ Chicken Tikka Masala x1
 * ├─ Garlic Naan x2
 * └─ 🔄 Order Again
 * 
 * Features:
 * - Shows max 3 most recent orders (configurable)
 * - Each order card shows: number, date, total, items preview
 * - "Order Again" button per order
 * - Hover effect with purple glow
 * - Scrollable if >3 orders (max height: 300px)
 * - Unified display (no distinction between online/POS)
 */
export const POSOrderHistorySection: React.FC<POSOrderHistorySectionProps> = ({
  orders,
  onOrderAgain,
  maxOrders = 3,
  className = '',
}) => {
  // Show most recent orders first
  const displayOrders = orders.slice(0, maxOrders);
  
  if (orders.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Package className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No previous orders</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
          Recent Orders ({orders.length})
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>

      {/* Orders List */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        {displayOrders.map((order) => (
          <OrderHistoryCard
            key={order.order_id}
            order={order}
            onOrderAgain={() => onOrderAgain(order)}
          />
        ))}
      </div>

      {/* Show more indicator */}
      {orders.length > maxOrders && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            +{orders.length - maxOrders} more orders
          </p>
        </div>
      )}
    </div>
  );
};

// Individual Order Card Component
interface OrderHistoryCardProps {
  order: RecentOrder;
  onOrderAgain: () => void;
}

const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({ order, onOrderAgain }) => {
  // Format date as relative time ("2 days ago")
  const orderDate = new Date(order.order_date);
  const relativeDate = formatDistanceToNow(orderDate, { addSuffix: true });

  // Parse items summary (format: "ITEM1, ITEM2, ITEM3")
  const itemsList = order.items_summary?.split(',').map(item => item.trim()).filter(Boolean) || [];
  const previewItems = itemsList.slice(0, 3); // Show top 3 items
  const hasMoreItems = itemsList.length > 3;

  // Format total amount
  const formattedTotal = order.total_amount != null 
    ? `£${order.total_amount.toFixed(2)}` 
    : '£0.00';

  // Status badge color
  const statusColor = {
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/30',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
    PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  }[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';

  return (
    <div
      className="
        group relative overflow-hidden rounded-lg
        bg-zinc-900/50 border border-zinc-700/50
        hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10
        transition-all duration-200
        p-3
      "
    >
      {/* Order Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShoppingBag className="h-4 w-4 text-purple-400 flex-shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">
                Order #{order.order_id.slice(0, 8)}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColor}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{relativeDate}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-purple-300">
            {formattedTotal}
          </div>
        </div>
      </div>

      {/* Items Preview */}
      {previewItems.length > 0 && (
        <div className="mb-3 pl-6 space-y-1">
          {previewItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
              <div className="h-1 w-1 rounded-full bg-purple-400/50" />
              <span className="truncate">{item}</span>
            </div>
          ))}
          {hasMoreItems && (
            <div className="text-xs text-gray-500 pl-3">
              +{itemsList.length - 3} more items
            </div>
          )}
        </div>
      )}

      {/* Order Again Button */}
      <Button
        size="sm"
        onClick={onOrderAgain}
        className="
          w-full
          bg-purple-600/20 hover:bg-purple-600/30
          border border-purple-500/30 hover:border-purple-500/50
          text-purple-300 hover:text-purple-200
          transition-all duration-200
          group-hover:shadow-md group-hover:shadow-purple-500/20
        "
      >
        <RefreshCw className="h-3.5 w-3.5 mr-2" />
        Order Again
      </Button>
    </div>
  );
};
