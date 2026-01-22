import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  History, 
  Search, 
  Filter, 
  Calendar, 
  X, 
  Package,
  UtensilsCrossed,
  RotateCcw,
  Loader2,
  XCircle
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
}: Props) {
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[#EAECEF]">Order History</h2>
          {/* Show offline indicator when viewing cached data */}
          {isViewingCachedData && (
            <Badge 
              variant="secondary" 
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30"
            >
              <Package className="h-3 w-3 mr-1" />
              Viewing Offline Data
            </Badge>
          )}
        </div>
        <Button
          onClick={() => navigate('/online-orders')}
          className="bg-[#8B1538] hover:bg-[#7A1230] text-white shadow-[0_0_24px_#8B153855] border-0"
          aria-label="Place new order"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Place New Order
        </Button>
      </div>
      
      {/* Filters and Search Bar */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B7BDC6]" />
            <Input
              placeholder="Search by order #, items, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/20 border-white/10 text-[#EAECEF] placeholder:text-[#8B92A0]"
              aria-label="Search order history"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-black/20 border-white/10 text-[#EAECEF]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-[#17191D] border-white/10">
              <SelectItem value="all" className="text-[#EAECEF]">All Status</SelectItem>
              <SelectItem value="completed" className="text-[#EAECEF]">Completed</SelectItem>
              <SelectItem value="pending" className="text-[#EAECEF]">Pending</SelectItem>
              <SelectItem value="cancelled" className="text-[#EAECEF]">Cancelled</SelectItem>
              <SelectItem value="refunded" className="text-[#EAECEF]">Refunded</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Date Range Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="bg-black/20 border-white/10 text-[#EAECEF]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent className="bg-[#17191D] border-white/10">
              <SelectItem value="all" className="text-[#EAECEF]">All Time</SelectItem>
              <SelectItem value="last7" className="text-[#EAECEF]">Last 7 Days</SelectItem>
              <SelectItem value="last30" className="text-[#EAECEF]">Last 30 Days</SelectItem>
              <SelectItem value="last180" className="text-[#EAECEF]">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[#B7BDC6]">Active filters:</span>
            {statusFilter !== 'all' && (
              <Badge 
                variant="secondary" 
                className="bg-[#8B1538]/20 text-[#8B1538] hover:bg-[#8B1538]/30 cursor-pointer"
                onClick={() => setStatusFilter('all')}
                aria-label="Remove status filter"
              >
                Status: {statusFilter}
                <X className="h-3 w-3 ml-1" aria-hidden="true" />
              </Badge>
            )}
            {dateFilter !== 'all' && (
              <Badge 
                variant="secondary" 
                className="bg-[#8B1538]/20 text-[#8B1538] hover:bg-[#8B1538]/30 cursor-pointer"
                onClick={() => setDateFilter('all')}
                aria-label="Remove date filter"
              >
                Date: {dateFilter === 'last7' ? 'Last 7 Days' : dateFilter === 'last30' ? 'Last 30 Days' : 'Last 6 Months'}
                <X className="h-3 w-3 ml-1" aria-hidden="true" />
              </Badge>
            )}
            {searchQuery.trim() && (
              <Badge 
                variant="secondary" 
                className="bg-[#8B1538]/20 text-[#8B1538] hover:bg-[#8B1538]/30 cursor-pointer"
                onClick={() => setSearchQuery('')}
                aria-label="Remove search filter"
              >
                Search: {searchQuery}
                <X className="h-3 w-3 ml-1" aria-hidden="true" />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10 h-7"
              aria-label="Clear all filters"
            >
              Clear All
            </Button>
          </div>
        )}
        
        {/* Results count */}
        <p className="text-sm text-[#B7BDC6]">
          Showing {filteredOrders.length} of {orderHistory?.length || 0} orders
        </p>
      </div>

      {orderHistory && orderHistory.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-[#8B1538]/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-[#8B1538]/20">
                      <History className="h-5 w-5 text-[#8B1538]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#EAECEF]">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-[#B7BDC6]">
                        {new Date(order.created_at!).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#EAECEF]">£{order.total_amount?.toFixed(2)}</p>
                  <span className={`inline-block px-3 py-1 text-xs rounded-full capitalize ${
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              {/* Order Items List */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-[#B7BDC6] mb-3">Items Ordered:</p>
                  {order.order_items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-3 items-start py-2 border-b border-white/5 last:border-0">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.menu_item_name}
                            className="w-16 h-16 rounded-lg object-cover border border-white/10 bg-black/40 hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-[#8B1538]/20 border border-white/10 flex items-center justify-center">
                            <UtensilsCrossed className="h-6 w-6 text-[#8B1538]" />
                          </div>
                        )}
                      </div>
                      
                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[#EAECEF] font-medium">
                              {item.quantity}x {item.menu_item_name}
                            </span>
                            {item.variant_name && (
                              <span className="text-[#8B92A0] ml-2">({item.variant_name})</span>
                            )}
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="text-xs text-[#8B92A0] mt-1">
                                {item.customizations.join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="text-[#B7BDC6] ml-4 flex-shrink-0">£{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Order Footer with Type, Address, and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-[#B7BDC6]">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span className="capitalize">{order.order_type}</span>
                  {order.order_type === 'delivery' && order.delivery_address && (
                    <span className="text-[#8B92A0]">• {order.delivery_address}</span>
                  )}
                </div>
                
                {/* Reorder Button */}
                <Button
                  size="sm"
                  onClick={() => handleReorder(order)}
                  disabled={isReordering === order.id}
                  className="bg-[#8B1538] hover:bg-[#7A1230] text-white border-0"
                >
                  {isReordering === order.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reorder
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-[#8B1538]/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            {hasActiveFilters ? (
              <Search className="h-8 w-8 text-[#8B1538]" />
            ) : (
              <History className="h-8 w-8 text-[#8B1538]" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">
            {hasActiveFilters ? 'No orders match your filters' : 'No orders yet'}
          </h3>
          <p className="text-[#B7BDC6] mb-6">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search criteria to find what you\'re looking for.' 
              : 'Your order history will appear here once you place your first order.'}
          </p>
          {hasActiveFilters ? (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538] hover:text-white"
              aria-label="Clear filters"
            >
              <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              Clear Filters
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/online-orders')}
              className="bg-[#8B1538] hover:bg-[#7A1530] text-white shadow-[0_0_24px_#8B153855] border-0"
              aria-label="Place new order"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Place Your First Order
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
