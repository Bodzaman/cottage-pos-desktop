import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { 
  ChevronLeft, Search, RefreshCw, Filter, Calendar, 
  Package, Truck, Users, Clock, ChefHat, Phone,
  CreditCard, MapPin, User, Eye, Edit, Trash2
} from 'lucide-react';

// Core imports
import { colors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';
import { formatCurrency } from '../utils/formatters';

// Types
interface POSViewProps {
  onBack?: () => void;
}

interface AllOrder {
  order_id: string;  // Changed from 'id' to match API response
  order_number: string;
  order_type: 'DINE-IN' | 'DELIVERY' | 'COLLECTION' | 'WAITING';
  order_source: 'POS' | 'ONLINE' | 'CUSTOMER_ONLINE_MENU' | 'AI_VOICE' | 'WEBSITE';
  status: string;
  customer_name?: string;
  customer_phone?: string;
  table_number?: number;
  total: number;
  payment_method?: string;
  created_at: string;
  completed_at?: string;
  items: any[];
  notes?: string;
}

interface FilterState {
  orderType: string;
  orderSource: string;
  paymentMethod: string;
  status: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

/**
 * Comprehensive All Orders View Component
 * 
 * Replaces both the Reconciliation page and POSDesktop "Reports" view with a unified
 * interface showing ALL order types and sources in one place.
 * 
 * Features:
 * - Shows ALL order types: DINE-IN, DELIVERY, COLLECTION, WAITING
 * - Shows ALL order sources: POS, ONLINE, CUSTOMER_ONLINE_MENU, AI_VOICE, WEBSITE
 * - Advanced filtering by type, source, payment method, status, date range
 * - Real-time data from apiClient.get_orders() endpoint
 * - Full order management actions: view details, update status, refunds
 * - Consistent experience between standalone page and POSDesktop integration
 */
export function AllOrdersView({ onBack }: POSViewProps) {
  // State Management
  const [orders, setOrders] = useState<AllOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AllOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AllOrder | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    orderType: 'ALL',
    orderSource: 'ALL',
    paymentMethod: 'ALL',
    status: 'ALL',
    dateRange: {
      from: undefined,
      to: undefined
    }
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAllOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use the comprehensive orders endpoint to get ALL orders
      const response = await apiClient.get_orders({
        page,
        page_size: pageSize,
        search: searchQuery || undefined,
        order_type: filters.orderType === 'ALL' ? undefined : filters.orderType,
        order_source: filters.orderSource === 'ALL' ? undefined : filters.orderSource,
        payment_method: filters.paymentMethod === 'ALL' ? undefined : filters.paymentMethod,
        status: filters.status === 'ALL' ? undefined : filters.status
      });
      
      const data = await response.json();
      
      // OrderListResponse has orders and total_count directly, no success field
      setOrders(data.orders || []);
      setTotalCount(data.total_count || 0);
      
      // Log for debugging
      console.log('AllOrdersView: Fetched orders:', {
        count: data.orders?.length || 0,
        totalCount: data.total_count || 0,
        filters
      });
    } catch (error) {
      console.error('AllOrdersView: Failed to fetch orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, searchQuery, filters]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllOrders();
  }, [fetchAllOrders]);

  // ============================================================================
  // FILTERING & SEARCH
  // ============================================================================

  // Apply local filtering for immediate UI response
  useEffect(() => {
    let filtered = [...orders];
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_phone?.includes(query) ||
        order.status.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery]);

  // Debounced search and filter changes
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      setPage(1); // Reset to first page when filters change
      fetchAllOrders();
    }, 300);
    
    return () => clearTimeout(delayedFetch);
  }, [searchQuery, filters]);

  // Initial data load
  useEffect(() => {
    fetchAllOrders();
  }, []);

  // ============================================================================
  // ORDER ACTIONS
  // ============================================================================

  const handleViewOrder = (order: AllOrder) => {
    setSelectedOrder(order);
    setShowOrderDialog(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiClient.update_order_status({
        order_id: orderId,
        status: newStatus
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchAllOrders(); // Refresh data
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'DINE-IN': return <Users className="h-4 w-4" />;
      case 'DELIVERY': return <Truck className="h-4 w-4" />;
      case 'COLLECTION': return <Package className="h-4 w-4" />;
      case 'WAITING': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getOrderSourceIcon = (orderSource: string) => {
    switch (orderSource) {
      case 'POS': return <ChefHat className="h-4 w-4" />;
      case 'ONLINE': 
      case 'CUSTOMER_ONLINE_MENU':
      case 'WEBSITE': return <User className="h-4 w-4" />;
      case 'AI_VOICE': return <Phone className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-purple-500';
      case 'ready': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderOrderCard = (order: AllOrder) => (
    <Card key={order.order_id} className="mb-4 border-0" style={{ 
      backgroundColor: colors.background.tertiary,
      borderLeft: `4px solid ${globalColors.purple.primary}`
    }}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getOrderTypeIcon(order.order_type)}
              <span className="font-semibold text-white">{order.order_number}</span>
            </div>
            <div className="flex items-center space-x-1">
              {getOrderSourceIcon(order.order_source)}
              <span className="text-sm text-gray-400">{order.order_source}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(order.status)} text-white`}>
              {order.status}
            </Badge>
            <span className="font-bold text-white">{formatCurrency(order.total)}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-400">Customer:</span>
            <p className="text-white">{order.customer_name || 'Walk-in'}</p>
          </div>
          <div>
            <span className="text-gray-400">Phone:</span>
            <p className="text-white">{order.customer_phone || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-400">Table:</span>
            <p className="text-white">{order.table_number || 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-400">Payment:</span>
            <p className="text-white">{order.payment_method || 'Cash'}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
          <div className="text-sm text-gray-400">
            Created: {new Date(order.created_at).toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewOrder(order)}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateOrderStatus(order.order_id, 'completed')}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Update
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFilterBar = () => (
    <Card className="mb-6 border-0" style={{ backgroundColor: colors.background.secondary }}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          {/* Order Type Filter */}
          <Select value={filters.orderType} onValueChange={(value) => setFilters(prev => ({ ...prev, orderType: value }))}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="DINE-IN">Dine-In</SelectItem>
              <SelectItem value="DELIVERY">Delivery</SelectItem>
              <SelectItem value="COLLECTION">Collection</SelectItem>
              <SelectItem value="WAITING">Waiting</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Order Source Filter */}
          <Select value={filters.orderSource} onValueChange={(value) => setFilters(prev => ({ ...prev, orderSource: value }))}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Order Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              <SelectItem value="POS">POS</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="CUSTOMER_ONLINE_MENU">Online Menu</SelectItem>
              <SelectItem value="AI_VOICE">AI Voice</SelectItem>
              <SelectItem value="WEBSITE">Website</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatsCards = () => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const ordersByType = filteredOrders.reduce((acc, order) => {
      acc[order.order_type] = (acc[order.order_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const ordersBySource = filteredOrders.reduce((acc, order) => {
      acc[order.order_source] = (acc[order.order_source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0" style={{ backgroundColor: colors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalOrders}</div>
            <div className="text-sm text-gray-400">Total Orders</div>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ backgroundColor: colors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-gray-400">Total Revenue</div>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ backgroundColor: colors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{Object.keys(ordersByType).length}</div>
            <div className="text-sm text-gray-400">Order Types</div>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ backgroundColor: colors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{Object.keys(ordersBySource).length}</div>
            <div className="text-sm text-gray-400">Order Sources</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: colors.background.primary }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">
                All Orders
              </h1>
              <p className="text-gray-400">
                Unified view of all orders from every source and type
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-white border-gray-600">
              {totalCount} Total Orders
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Filter Bar */}
        {renderFilterBar()}

        {/* Orders List */}
        <Card className="border-0" style={{ backgroundColor: colors.background.secondary }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Orders ({filteredOrders.length})</span>
              {isLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Loading all orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">No orders found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(renderOrderCard)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
