import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  Calendar,
  X,
  Package,
  UtensilsCrossed,
  RotateCcw,
  Loader2,
  XCircle,
  Check,
  Clock,
  ChefHat,
  Truck,
  ShoppingBag,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PremiumCard } from './PremiumCard';
import { PortalButton } from './PortalButton';
import { cn } from 'utils/cn';

// Status Badge Component - matches mock design
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    completed: { label: 'Delivered', color: 'bg-green-500/20 text-green-400', icon: Check },
    delivered: { label: 'Delivered', color: 'bg-green-500/20 text-green-400', icon: Check },
    picked_up: { label: 'Picked Up', color: 'bg-green-500/20 text-green-400', icon: Check },
    pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    preparing: { label: 'Preparing', color: 'bg-orange-500/20 text-orange-400', icon: ChefHat },
    ready: { label: 'Ready', color: 'bg-blue-500/20 text-blue-400', icon: Package },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-500/20 text-purple-400', icon: Truck },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400', icon: X },
    refunded: { label: 'Refunded', color: 'bg-gray-500/20 text-gray-400', icon: RotateCcw },
  };

  const { label, color, icon: Icon } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

interface Props {
  orderHistory: any[] | null;
  isViewingCachedData: boolean;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  isReordering: string | null;
  handleReorder: (order: any) => Promise<void>;
  // Pagination props
  totalCount?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export default function OrdersSection({
  orderHistory,
  isViewingCachedData,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  searchQuery,
  setSearchQuery,
  isReordering,
  handleReorder,
  totalCount,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: Props) {
  const navigate = useNavigate();

  // State for expanded order details (view full order)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter logic
  const filteredOrders = useMemo(() => {
    if (!orderHistory) return [];
    
    return orderHistory.filter(order => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      
      // Date range filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at!);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'last7' && daysAgo > 7) return false;
        if (dateFilter === 'last30' && daysAgo > 30) return false;
        if (dateFilter === 'last180' && daysAgo > 180) return false;
      }
      
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOrderNumber = order.order_number?.toLowerCase().includes(query);
        const matchesAddress = order.delivery_address?.toLowerCase().includes(query);
        const matchesItems = order.order_items?.some((item: any) => 
          item.menu_item_name?.toLowerCase().includes(query)
        );
        
        if (!matchesOrderNumber && !matchesAddress && !matchesItems) {
          return false;
        }
      }
      
      return true;
    });
  }, [orderHistory, statusFilter, dateFilter, searchQuery]);

  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
    setSearchQuery('');
  };

  // Active order statuses for visual treatment
  const ACTIVE_STATUSES = ['pending', 'preparing', 'ready', 'out_for_delivery'];

  return (
    <div className="space-y-4">
      {/* Offline Indicator */}
      {isViewingCachedData && (
        <Badge
          variant="secondary"
          className="bg-blue-500/20 text-blue-400 border border-blue-500/30"
        >
          <Package className="h-3 w-3 mr-1" />
          Viewing Offline Data
        </Badge>
      )}

      {/* Compact Filter Toolbar */}
      <PremiumCard subsurface padding="sm">
        <div className="space-y-3">
          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm rounded-lg bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-sm rounded-lg bg-white/5 border-white/10 text-white">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl rounded-lg border border-white/10 bg-gray-900/95">
                <SelectItem value="all" className="text-white text-sm">All Status</SelectItem>
                <SelectItem value="completed" className="text-white text-sm">Completed</SelectItem>
                <SelectItem value="pending" className="text-white text-sm">Pending</SelectItem>
                <SelectItem value="cancelled" className="text-white text-sm">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-sm rounded-lg bg-white/5 border-white/10 text-white">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl rounded-lg border border-white/10 bg-gray-900/95">
                <SelectItem value="all" className="text-white text-sm">All Time</SelectItem>
                <SelectItem value="last7" className="text-white text-sm">Last 7 Days</SelectItem>
                <SelectItem value="last30" className="text-white text-sm">Last 30 Days</SelectItem>
                <SelectItem value="last180" className="text-white text-sm">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Pills + Results Count */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {hasActiveFilters && (
                <>
                  {statusFilter !== 'all' && (
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#8B1538]/15 text-[#8B1538] hover:bg-[#8B1538]/25 transition-colors"
                    >
                      {statusFilter}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {dateFilter !== 'all' && (
                    <button
                      onClick={() => setDateFilter('all')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#8B1538]/15 text-[#8B1538] hover:bg-[#8B1538]/25 transition-colors"
                    >
                      {dateFilter === 'last7' ? '7 days' : dateFilter === 'last30' ? '30 days' : '6 months'}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {searchQuery.trim() && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#8B1538]/15 text-[#8B1538] hover:bg-[#8B1538]/25 transition-colors"
                    >
                      "{searchQuery.slice(0, 10)}{searchQuery.length > 10 ? '...' : ''}"
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-white ml-1"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {filteredOrders.length} of {orderHistory?.length || 0} orders
            </p>
          </div>
        </div>
      </PremiumCard>

      {orderHistory && orderHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => {
            const isActive = ACTIVE_STATUSES.includes(order.status);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <PremiumCard
                  subsurface
                  hover
                  className={cn(
                    'overflow-hidden',
                    isActive && 'border-l-4 border-l-[#8B1538] bg-[rgba(139,21,56,0.03)]'
                  )}
                >
                  {/* Compact Header: Order # + Date • Time | Status */}
                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-white text-sm">
                          #{order.order_number || order.id?.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="text-xs text-gray-400 truncate">
                          {formatDate(order.created_at)}, {formatTime(order.created_at)}
                        </span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Middle Row: Thumbnails | Total + Type */}
                  <div className="px-4 pb-3 flex items-center justify-between gap-4">
                    {/* Compact Thumbnails */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      {order.order_items?.slice(0, 4).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.menu_item_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <UtensilsCrossed className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.order_items?.length > 4 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{order.order_items.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Price + Type */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-lg font-bold text-white">
                        £{order.total_amount?.toFixed(2)}
                      </span>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium',
                        order.order_type === 'delivery' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                      )}>
                        {order.order_type === 'delivery' ? (
                          <><Truck className="h-3 w-3" /> Delivery</>
                        ) : (
                          <><ShoppingBag className="h-3 w-3" /> Pickup</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <span className="text-xs text-gray-500">
                      {order.order_items?.length || 0} items
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrderExpand(order.id)}
                        className="text-gray-400 hover:text-white hover:bg-white/10 h-8 px-3 text-xs"
                      >
                        {expandedOrderId === order.id ? 'Hide' : 'View'}
                      </Button>
                      <PortalButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleReorder(order)}
                        disabled={isReordering === order.id}
                      >
                        {isReordering === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Reorder
                      </PortalButton>
                    </div>
                  </div>

                {/* Expandable Details */}
                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 py-4 border-t"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        {/* Full Order Items List */}
                        <p className="text-sm font-medium text-gray-400 mb-3">Order Details:</p>
                        <div className="space-y-3">
                          {order.order_items?.map((item: any, index: number) => (
                            <div key={index} className="flex gap-3 items-start py-2 border-b border-white/5 last:border-0">
                              <div className="flex-shrink-0">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.menu_item_name}
                                    className="w-14 h-14 rounded-lg object-cover border border-white/10 bg-black/40"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-[#8B1538]/20 border border-white/10 flex items-center justify-center">
                                    <UtensilsCrossed className="h-5 w-5 text-[#8B1538]" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-white font-medium">
                                      {item.quantity}x {item.menu_item_name}
                                    </span>
                                    {item.variant_name && (
                                      <span className="text-gray-500 ml-2">({item.variant_name})</span>
                                    )}
                                    {/* Item Description */}
                                    {item.menu_item_description && (
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {item.menu_item_description}
                                      </p>
                                    )}
                                    {item.customizations && item.customizations.length > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {Array.isArray(item.customizations)
                                          ? item.customizations.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')
                                          : ''}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-gray-400 ml-4 flex-shrink-0">
                                    £{((item.unit_price || item.price) * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Totals */}
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                          {order.subtotal && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Subtotal</span>
                              <span className="text-white">£{order.subtotal.toFixed(2)}</span>
                            </div>
                          )}
                          {order.delivery_fee && order.delivery_fee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Delivery Fee</span>
                              <span className="text-white">£{order.delivery_fee.toFixed(2)}</span>
                            </div>
                          )}
                          {order.tip_amount && order.tip_amount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Tip</span>
                              <span className="text-white">£{order.tip_amount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-white/10">
                            <span className="font-semibold text-white">Total</span>
                            <span className="font-bold text-lg text-[#8B1538]">
                              £{order.total_amount?.toFixed(2)}
                            </span>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </PremiumCard>
            </motion.div>
            );
          })}

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Orders
                    {totalCount && (
                      <span className="ml-2 text-gray-500">
                        ({orderHistory?.length || 0} of {totalCount})
                      </span>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <PremiumCard subsurface className="py-12 px-6">
          <div className="text-center max-w-sm mx-auto">
            <div className="p-4 rounded-xl bg-[#8B1538]/15 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {hasActiveFilters ? (
                <Search className="h-7 w-7 text-[#8B1538]" />
              ) : (
                <History className="h-7 w-7 text-[#8B1538]" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {hasActiveFilters ? 'No orders match your filters' : 'No orders yet'}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {hasActiveFilters
                ? 'Try adjusting your filters or search criteria.'
                : 'Your order history will appear here once you place your first order.'}
            </p>
            {hasActiveFilters ? (
              <PortalButton
                variant="secondary"
                onClick={clearFilters}
              >
                <XCircle className="h-4 w-4" />
                Clear Filters
              </PortalButton>
            ) : (
              <PortalButton
                variant="primary"
                onClick={() => navigate('/online-orders')}
              >
                <Plus className="h-4 w-4" />
                Place Your First Order
              </PortalButton>
            )}
          </div>
        </PremiumCard>
      )}
    </div>
  );
}
