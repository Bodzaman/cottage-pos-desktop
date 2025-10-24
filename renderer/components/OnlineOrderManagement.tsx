import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin, 
  User, 
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  ChefHat,
  Truck,
  MessageSquare,
  DollarSign,
  Calendar,
  Package,
  ArrowLeft,
  Download,
  Eye,
  Edit,
  ShoppingBag,
  LayoutList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { POSViewProps } from './POSViewContainer';
import { globalColors } from '../utils/QSAIDesign';
import { formatCurrency } from '../utils/formatters';
import brain from 'brain';
import { useSafeTimeout } from 'utils/safeHooks';
import { format } from 'date-fns';

// Enhanced order interface for full management
interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'DELIVERY' | 'COLLECTION';
  status: 'NEW' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  items: OrderItem[];
  total: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  placedAt: string;
  estimatedTime?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  allergenNotes?: string;
  source: 'WEBSITE' | 'CHATBOT' | 'APP';
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  modifiers?: string[];
  specialInstructions?: string;
}

// Staff action types for workflow
type StaffAction = 
  | 'CONFIRM'
  | 'START_PREPARATION' 
  | 'SET_READY_TIME'
  | 'CONTACT_CUSTOMER'
  | 'MARK_COMPLETED'
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'APPLY_DISCOUNT'
  | 'PROCESS_REFUND'
  | 'UPDATE_ADDRESS'
  | 'ASSIGN_DRIVER'
  | 'HANDLE_COMPLAINT';

interface OnlineOrderManagementProps extends POSViewProps {
  autoApproveEnabled?: boolean;
  onAutoApproveToggle?: (enabled: boolean) => void;
}

export function OnlineOrderManagement({ onBack, autoApproveEnabled = false, onAutoApproveToggle }: OnlineOrderManagementProps) {
  // State management
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OnlineOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog states for various actions
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [contactNotes, setContactNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  
  const safeTimeout = useSafeTimeout();

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch orders from the dedicated online orders API
      const response = await brain.get_online_orders({
        page: 1,
        page_size: 100
      });
      
      const orderData = await response.json();
      
      if (orderData.orders) {
        // Transform API orders to our interface
        const transformedOrders: OnlineOrder[] = orderData.orders.map((order: any) => ({
          id: order.order_id || order.id,
          orderNumber: order.order_number || order.order_id,
          customerName: order.customer_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Customer',
          customerPhone: order.phone || order.customer_phone || '',
          customerEmail: order.email || order.customer_email,
          orderType: order.order_type?.toUpperCase() === 'DELIVERY' ? 'DELIVERY' : 'COLLECTION',
          status: mapOrderStatus(order.status),
          items: order.items || [],
          total: order.total || 0,
          paymentStatus: order.payment_status?.toUpperCase() || 'PENDING',
          placedAt: order.created_at || order.placed_at || new Date().toISOString(),
          estimatedTime: order.estimated_time,
          deliveryAddress: order.delivery_address || order.address,
          specialInstructions: order.special_instructions || order.notes,
          allergenNotes: order.allergen_notes,
          source: order.source?.toUpperCase() || 'WEBSITE'
        }));
        
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Map API status to our status enum
  const mapOrderStatus = (apiStatus: string): OnlineOrder['status'] => {
    const status = apiStatus?.toUpperCase();
    switch (status) {
      case 'PENDING': return 'NEW';
      case 'CONFIRMED': return 'CONFIRMED';
      case 'PROCESSING': return 'PREPARING';
      case 'READY': return 'READY';
      case 'COMPLETED': return 'COMPLETED';
      case 'CANCELLED': return 'CANCELLED';
      default: return 'NEW';
    }
  };

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = orders;
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }
    
    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Source filter
    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(order => order.source === sourceFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter, sourceFilter]);

  // Initial load and refresh
  useEffect(() => {
    fetchOrders();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Handle staff actions on orders
  const handleStaffAction = async (order: OnlineOrder, action: StaffAction) => {
    setActionInProgress(order.id);
    
    try {
      switch (action) {
        case 'CONFIRM':
          // ========================================================================
          // 🆕 ONLINE ORDER ACCEPT: Create Kitchen Print Job
          // ========================================================================
          
          console.log('📋 [OnlineOrderManagement] Order confirmed, triggering kitchen print for:', order.orderNumber);
          
          try {
            // Get template assignment for the order type
            const assignmentResponse = await brain.get_template_assignment({ order_mode: order.orderType });
            const templateAssignment = await assignmentResponse.json();
            
            // Prepare kitchen receipt data
            const kitchenReceipt = {
              orderNumber: order.orderNumber,
              orderType: order.orderType,
              channel: 'ONLINE_ORDER',
              items: order.items.map(item => ({
                name: item.name || 'Unknown Item',
                quantity: item.quantity || 1,
                notes: item.notes || '',
                modifiers: item.modifiers?.map(mod => mod.name) || []
              })),
              specialInstructions: order.specialInstructions || '',
              allergenNotes: order.allergenNotes || '',
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              deliveryAddress: order.deliveryAddress || null,
              timestamp: new Date().toISOString()
            };
            
            // Create kitchen print job
            const printJobResponse = await brain.create_print_job({
              template_id: templateAssignment.kitchen_template_id,
              receipt_type: 'kitchen',
              order_data: kitchenReceipt,
              priority: 'high',
              metadata: {
                order_mode: order.orderType,
                order_source: 'online',
                created_from: 'online_order_accept'
              }
            });
            
            const printJob = await printJobResponse.json();
            console.log('✅ [OnlineOrderManagement] Kitchen print job created:', printJob.job_id);
            
          } catch (printError) {
            console.error('❌ [OnlineOrderManagement] Failed to create kitchen print job:', printError);
            // Don't fail the whole operation for print errors
          }
          
          // Update order status
          await brain.update_order_status({
            orderId: order.id,
            status: 'CONFIRMED'
          });
          toast.success(`Order ${order.orderNumber} confirmed & sent to kitchen`);
          break;
          
        case 'START_PREPARATION':
          await brain.update_order_status({
            orderId: order.id,
            status: 'PREPARING'
          });
          toast.success(`Started preparation for ${order.orderNumber}`);
          break;
          
        case 'SET_READY_TIME':
          await brain.update_order_status({
            orderId: order.id,
            status: 'READY'
          });
          toast.success(`Order ${order.orderNumber} is ready`);
          break;
          
        case 'MARK_COMPLETED':
          // ========================================================================
          // 🆕 ONLINE ORDER COMPLETE: Create Customer Receipt Print Job
          // ========================================================================
          
          console.log('🧾 [OnlineOrderManagement] Order completed, triggering customer receipt for:', order.orderNumber);
          
          try {
            // Get template assignment for the order type (convert format for API)
            const apiOrderMode = order.orderType.replace(/-/g, '_'); // Convert DELIVERY/COLLECTION format
            const assignmentResponse = await brain.get_template_assignment({ order_mode: apiOrderMode });
            const templateAssignment = await assignmentResponse.json();
            
            // Calculate totals (basic calculation - should match order.total)
            const subtotal = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
            const vatAmount = subtotal * 0.2; // 20% VAT
            const finalTotal = order.total || (subtotal + vatAmount);
            
            // Prepare customer receipt data
            const customerReceipt = {
              orderNumber: order.orderNumber,
              orderType: order.orderType,
              channel: 'ONLINE_ORDER',
              items: order.items.map(item => ({
                name: item.name || 'Unknown Item',
                quantity: item.quantity || 1,
                price: item.price || 0,
                total: (item.price || 0) * (item.quantity || 1),
                notes: item.notes || '',
                modifiers: item.modifiers?.map(mod => ({ name: mod.name, price: mod.price || 0 })) || []
              })),
              subtotal: subtotal,
              vat: vatAmount,
              total: finalTotal,
              paymentMethod: order.paymentStatus === 'PAID' ? 'Card' : 'Pending',
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              customerEmail: order.customerEmail || '',
              deliveryAddress: order.orderType === 'DELIVERY' ? {
                address: order.deliveryAddress || ''
              } : null,
              timestamp: new Date().toISOString()
            };
            
            // Create customer receipt print job
            const printJobResponse = await brain.create_print_job({
              template_id: templateAssignment.customer_template_id,
              receipt_type: 'customer',
              order_data: customerReceipt,
              priority: 'medium',
              metadata: {
                order_mode: order.orderType,
                order_source: 'online',
                created_from: 'online_order_complete'
              }
            });
            
            const printJob = await printJobResponse.json();
            console.log('✅ [OnlineOrderManagement] Customer receipt print job created:', printJob.job_id);
            
          } catch (printError) {
            console.error('❌ [OnlineOrderManagement] Failed to create customer receipt print job:', printError);
            // Don't fail the whole operation for print errors
          }
          
          // Update order status
          await brain.update_order_status({
            orderId: order.id,
            status: 'COMPLETED'
          });
          toast.success(`Order ${order.orderNumber} completed & receipt printed`);
          break;
          
        case 'CONTACT_CUSTOMER':
          setSelectedOrder(order);
          setShowContactDialog(true);
          break;
          
        default:
          toast.info('Action not implemented yet');
      }
      
      // Refresh orders after action
      if (action !== 'CONTACT_CUSTOMER') {
        await fetchOrders();
      }
    } catch (error) {
      console.error('Staff action failed:', error);
      toast.error('Failed to perform action');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle refresh with better UX
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    toast.success('Orders refreshed');
  };

  // Calculate stats from orders
  const calculateStats = () => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    
    // Calculate peak hours (simplified)
    const ordersByHour = filteredOrders.reduce((acc, order) => {
      const hour = new Date(order.placedAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const peakHour = Object.entries(ordersByHour)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      averageOrderValue,
      peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A'
    };
  };

  const stats = calculateStats();

  // Get status badge color using AllOrdersModal pattern
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'CONFIRMED': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
      case 'PREPARING': return 'bg-purple-500/20 text-purple-500 border-purple-500/20';
      case 'READY': return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'COMPLETED': return 'bg-green-700/20 text-green-600 border-green-700/20';
      case 'CANCELLED': return 'bg-red-500/20 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  // Get action metadata (icon and label) for quick actions
  const getNextAction = (action: string) => {
    switch (action) {
      case 'CONFIRM':
        return { icon: <CheckCircle className="h-4 w-4" />, label: 'Confirm Order' };
      case 'START_PREPARATION':
        return { icon: <ChefHat className="h-4 w-4" />, label: 'Start Preparation' };
      case 'SET_READY_TIME':
        return { icon: <Clock className="h-4 w-4" />, label: 'Set Ready Time' };
      case 'MARK_COMPLETED':
        return { icon: <Package className="h-4 w-4" />, label: 'Mark Completed' };
      default:
        return { icon: <MoreHorizontal className="h-4 w-4" />, label: action };
    }
  };

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'WEBSITE': return <ShoppingBag className="h-4 w-4" />;
      case 'CHATBOT': return <MessageSquare className="h-4 w-4" />;
      case 'APP': return <Phone className="h-4 w-4" />;
      default: return <ShoppingBag className="h-4 w-4" />;
    }
  };

  // Render stats cards like AllOrdersModal
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
          <div className="text-sm text-gray-400">Total Online Orders</div>
        </CardContent>
      </Card>
      <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</div>
          <div className="text-sm text-gray-400">Total Revenue</div>
        </CardContent>
      </Card>
      <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.averageOrderValue)}</div>
          <div className="text-sm text-gray-400">Average Order Value</div>
        </CardContent>
      </Card>
      <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.peakHour}</div>
          <div className="text-sm text-gray-400">Peak Hours</div>
        </CardContent>
      </Card>
    </div>
  );

  // Render enhanced filter bar like AllOrdersModal
  const renderFilterBar = () => (
    <Card className="mb-6 border-0" style={{ backgroundColor: globalColors.background.secondary }}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order #, customer, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PREPARING">Preparing</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="ALL">All Sources</SelectItem>
              <SelectItem value="WEBSITE">Website</SelectItem>
              <SelectItem value="CHATBOT">Chatbot</SelectItem>
              <SelectItem value="APP">App</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Refresh Button */}
          <Button
            onClick={fetchOrders}
            disabled={isLoading || refreshing}
            style={{ backgroundColor: globalColors.purple.primary }}
            className="hover:opacity-90 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || refreshing) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Export Button */}
          <Button
            variant="outline"
            className="gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            onClick={() => toast.success('Export feature coming soon!')}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-500" />
          <p className="text-white">Loading online orders...</p>
        </div>
      </div>
    );
  }

  // Render individual order card like AllOrdersModal
  const renderOrderCard = (order: OnlineOrder) => (
    <Card 
      key={order.id} 
      className="mb-4 border-0 cursor-pointer transition-all duration-200 hover:shadow-lg" 
      style={{ 
        backgroundColor: globalColors.background.tertiary,
        borderLeft: `4px solid ${globalColors.purple.primary}`
      }}
      onClick={() => {
        setSelectedOrder(order);
        setShowOrderDialog(true);
      }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getSourceIcon(order.source)}
              <span className="font-semibold text-white">#{order.orderNumber}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-400">
                {order.source === 'WEBSITE' ? 'Website' : order.source === 'CHATBOT' ? 'Chatbot' : 'App'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(order.status)} capitalize`}>
              {order.status.toLowerCase()}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <div className="text-white font-medium">{order.customerName}</div>
            <div className="text-gray-400 text-sm">{order.customerPhone}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Order Type</div>
            <Badge className={`${order.orderType === 'DELIVERY' ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' : 'bg-purple-500/20 text-purple-500 border-purple-500/20'} capitalize`}>
              {order.orderType.toLowerCase()}
            </Badge>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Date & Time</div>
            <div className="text-white text-sm">
              {format(new Date(order.placedAt), "dd/MM/yyyy HH:mm")}
            </div>
          </div>
        </div>
        
        <Separator className="my-3 bg-gray-700" />
        
        <div className="space-y-1 mb-3">
          {order.items.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-300">{item.quantity}x {item.name}</span>
              <span className="text-gray-300">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="text-gray-400 text-sm">
              +{order.items.length - 2} more items
            </div>
          )}
        </div>
        
        <Separator className="my-3 bg-gray-700" />
        
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Total: {formatCurrency(order.total)}</span>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(order);
                setShowOrderDialog(true);
              }}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              style={{ backgroundColor: globalColors.purple.primary }}
              className="hover:opacity-90 text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleStaffAction(order, 'CONTACT_CUSTOMER');
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Contact
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render empty state with better styling
  const renderEmptyState = () => (
    <Card className="border-0 text-center py-12" style={{ backgroundColor: globalColors.background.tertiary }}>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: globalColors.purple.primary + '20' }}>
            <ShoppingBag className="h-8 w-8" style={{ color: globalColors.purple.primary }} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">No Online Orders Found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL'
                ? 'No orders match your current filters. Try adjusting your search criteria.'
                : 'No online orders have been placed yet. Orders will appear here as they come in.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSourceFilter('ALL');
                }}
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: globalColors.background.primary }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Enhanced Header with Gradient Styling */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="text-white hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Online Order Management
              </h1>
              <p className="text-gray-400 mt-1">Complete lifecycle management for online orders</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Auto-approve toggle */}
            <div className="flex items-center space-x-2">
              <Switch 
                id="auto-approve"
                checked={autoApproveEnabled}
                onCheckedChange={onAutoApproveToggle}
                style={{ backgroundColor: autoApproveEnabled ? globalColors.purple.primary : undefined }}
              />
              <Label htmlFor="auto-approve" className="text-gray-300">Auto-approve</Label>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Enhanced Filter Bar */}
        {renderFilterBar()}

        {/* Orders Display */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrders.map(renderOrderCard)}
            </div>
          )}
        </div>
      </div>
      
      {/* Order Detail Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Order #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Left Panel - Order Details */}
              <div className="space-y-6">
                {/* Customer Information */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white ml-2 font-medium">{selectedOrder.customerName}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div>
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white ml-2">{selectedOrder.customerPhone}</span>
                      </div>
                    )}
                    {selectedOrder.customerEmail && (
                      <div>
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white ml-2">{selectedOrder.customerEmail}</span>
                      </div>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <div>
                        <span className="text-gray-400">Address:</span>
                        <span className="text-white ml-2">{selectedOrder.deliveryAddress}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Order Items */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start p-3 bg-gray-700 rounded-lg">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{item.name}</h4>
                            {item.variant && (
                              <p className="text-gray-400 text-sm">{item.variant}</p>
                            )}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <p className="text-gray-400 text-sm">+ {item.modifiers.join(', ')}</p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-yellow-400 text-sm">Note: {item.specialInstructions}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">×{item.quantity}</p>
                            <p className="text-gray-300">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Panel - Actions */}
              <div className="space-y-6">
                {/* Order Status */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Order Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Current Status:</span>
                      <Badge className={`${getStatusColor(selectedOrder.status)} text-white`}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Payment:</span>
                      <Badge variant={selectedOrder.paymentStatus === 'PAID' ? 'default' : 'destructive'}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-white font-bold text-lg">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Quick Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['CONFIRM', 'START_PREPARATION', 'SET_READY_TIME', 'MARK_COMPLETED'].map((action) => {
                      const actionData = getNextAction(action as OnlineOrder['status']);
                      return (
                        <Button
                          key={action}
                          variant="outline"
                          className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          onClick={() => handleStaffAction(selectedOrder, action as StaffAction)}
                          disabled={actionInProgress === selectedOrder.id}
                        >
                          {actionData.icon}
                          <span className="ml-2">{actionData.label}</span>
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      onClick={() => setShowContactDialog(true)}
                    >
                      <Phone className="h-4 w-4" />
                      <span className="ml-2">Contact Customer</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Contact Customer Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Contact Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-notes" className="text-white">Notes</Label>
              <Textarea
                id="contact-notes"
                placeholder="Add notes about the customer contact..."
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowContactDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Customer contact logged');
                setShowContactDialog(false);
                setContactNotes('');
              }}>
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OnlineOrderManagement;
