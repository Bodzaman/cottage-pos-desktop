import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from 'utils/cn';
import { format } from 'date-fns';
import { CalendarIcon, Search, FileText, Eye, Filter, Download, AlertCircle, Clock, MapPin, Phone, DollarSign, CheckCircle, ExternalLink, History } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { Order } from 'utils/orderManagementService';
import { formatCurrency } from 'utils/formatters';
import { useMountedRef, useSafeTimeout } from 'utils/safeHooks';

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface OrderHistoryListProps {
  onOrderSelect?: (order: Order) => void;
}

export function OrderHistoryList({ onOrderSelect }: OrderHistoryListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderType, setOrderType] = useState<string>('ALL');
  const [orderStatus, setOrderStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    to: new Date(),
  });
  
  const { user } = useSimpleAuth();
  const mountedRef = useMountedRef();
  const { setSafeTimeout } = useSafeTimeout();

  // Mock function to fetch orders (replace with actual API call)
  const fetchOrders = async (page: number = 1) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, this would make an API call
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!mountedRef.current) return;
      
      const mockOrders: Order[] = [
        {
          order_id: 'ORD-2024-001',
          created_at: new Date().toISOString(),
          order_type: 'DELIVERY',
          status: 'COMPLETED',
          customer_name: 'John Doe',
          customer_phone: '+44 7123 456789',
          customer_email: 'john@example.com',
          delivery_address: '123 Main St, London',
          items: [
            {
              id: '1',
              name: 'Chicken Tikka Masala',
              price: 12.95,
              quantity: 1,
              modifiers: []
            }
          ],
          subtotal: 12.95,
          tax: 2.59,
          delivery_fee: 3.50,
          discounts: 0,
          total: 19.04,
          payment_method: 'CARD',
          special_instructions: 'Extra spicy please',
          table_number: null,
          estimated_ready_time: null,
          actual_ready_time: null,
          delivery_time: null,
          updated_at: new Date().toISOString(),
          history: []
        }
      ];
      
      setOrders(mockOrders);
      setTotalPages(1);
      setTotalOrders(mockOrders.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (mountedRef.current) {
        toast.error('Failed to fetch orders');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Fetch orders when component mounts or filters change
  useEffect(() => {
    fetchOrders(1);
  }, [user, orderType, orderStatus, dateRange]);

  // Refetch when search term changes (debounced) using safe timeout
  useEffect(() => {
    setSafeTimeout(() => {
      if (user && mountedRef.current) {
        fetchOrders(1);
      }
    }, 500);
  }, [searchTerm, user, mountedRef, setSafeTimeout]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Order History</h2>
          <p className="text-gray-400">
            {totalOrders > 0 ? `${totalOrders} orders found` : 'No orders found'}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search orders by ID or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
        
        {/* Filters */}
        {showFilters && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Order Type
                  </label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      {ORDER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-800">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Status
                  </label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      {ORDER_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value} className="text-white hover:bg-gray-800">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Date Range
                  </label>
                  <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      <SelectItem value="all" className="text-white hover:bg-gray-800">All Time</SelectItem>
                      <SelectItem value="7days" className="text-white hover:bg-gray-800">Last 7 Days</SelectItem>
                      <SelectItem value="30days" className="text-white hover:bg-gray-800">Last 30 Days</SelectItem>
                      <SelectItem value="90days" className="text-white hover:bg-gray-800">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-amber-500"></div>
          <p className="mt-2 text-gray-400">Loading your order history...</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && (
        <>
          {orders.length === 0 ? (
            <Alert className="bg-gray-800 border-gray-700 text-gray-300">
              <AlertDescription>
                {searchTerm || orderType !== 'all' || orderStatus !== 'all' || dateRange !== 'all'
                  ? 'No orders found matching your filters. Try adjusting your search criteria.'
                  : "You don't have any order history yet. Place an order to see it here!"}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  onViewDetails={() => handleViewDetails(order)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <p className="text-sm text-gray-400">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    const pageNum = currentPage <= 3 ? idx + 1 : currentPage - 2 + idx;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`
                          ${currentPage === pageNum 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                            : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                          }
                        `}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
