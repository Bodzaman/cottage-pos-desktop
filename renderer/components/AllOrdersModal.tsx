
import React, { useState, useEffect, useMemo } from 'react';
import { useSimpleAuth } from "../utils/simple-auth-context";
import { useNavigate } from 'react-router-dom';
import { createRefundAudit } from '../utils/orderAuditTrail';
import { globalColors } from '../utils/QSAIDesign';
import brain from 'brain';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Filter, Download, RefreshCw, Phone, ShoppingBag, CalendarIcon, LayoutList, LayoutGrid, Check, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, AlertCircle, X, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { OrderDetailDialog, OrderData } from './OrderDetailDialog';

export interface AllOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Convert backend order to frontend OrderData format
const convertBackendOrder = (backendOrder: any): OrderData => {
  // Map order source
  const sourceMapping: Record<string, "ai-voice" | "online" | "pos"> = {
    "AI_VOICE": "ai-voice",
    "ONLINE": "online", 
    "POS": "pos"
  };

  // Map order type
  const typeMapping: Record<string, "delivery" | "pickup" | "dine-in"> = {
    "DELIVERY": "delivery",
    "COLLECTION": "pickup",
    "DINE-IN": "dine-in",
    "WAITING": "pickup" // Waiting orders are treated as pickup
  };

  return {
    id: backendOrder.order_id,
    orderNumber: backendOrder.order_number || backendOrder.order_id,
    type: typeMapping[backendOrder.order_type] || "delivery",
    source: sourceMapping[backendOrder.order_source] || "online",
    status: backendOrder.status?.toLowerCase() as any || "pending",
    total: backendOrder.total,
    items: backendOrder.items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      variant: item.variant_name || undefined,
      notes: item.notes || undefined
    })) || [],
    customer: {
      name: backendOrder.customer_name || "Walk-in Customer",
      phone: backendOrder.customer_phone || "",
      email: backendOrder.customer_email || undefined
    },
    address: backendOrder.order_type === "DELIVERY" ? {
      addressLine1: "Address on file",
      city: "London",
      postcode: "E1 XXX"
    } : undefined,
    payment: {
      method: backendOrder.payment?.method?.toLowerCase() as any || "card",
      status: "paid" as any,
      amount: backendOrder.total,
      reference: backendOrder.payment?.transaction_id || undefined
    },
    timestamps: {
      created: backendOrder.created_at,
      updated: backendOrder.completed_at !== backendOrder.created_at ? backendOrder.completed_at : undefined,
      scheduled: undefined
    },
    tableNumber: backendOrder.table_number || undefined,
    transcript: undefined // Voice orders might have this in future
  };
};

const AllOrdersModal: React.FC<AllOrdersModalProps> = ({ isOpen, onClose }) => {
  const { isStaff, user } = useSimpleAuth();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'online' | 'pos'>('all');
  const [activeView, setActiveView] = useState<'grid' | 'list'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined; }>({ from: undefined, to: undefined });
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [orderStats, setOrderStats] = useState({ total: 0, ai: 0, online: 0, pos: 0 });
  
  // Load orders when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);
  
  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [orders, searchQuery, dateRange, selectedType, selectedStatus, selectedSource, activeTab]);
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch real orders from the backend
      const response = await brain.get_orders({
        page: 1,
        page_size: 100 // Get more orders for better testing
      });
      const data = await response.json();
      
      // Convert backend orders to frontend format
      const convertedOrders = data.orders?.map(convertBackendOrder) || [];
      setOrders(convertedOrders);
      
      // Calculate real stats
      const aiOrders = convertedOrders.filter(order => order.source === 'ai-voice').length;
      const onlineOrders = convertedOrders.filter(order => order.source === 'online').length;
      const posOrders = convertedOrders.filter(order => order.source === 'pos').length;
      
      setOrderStats({
        total: convertedOrders.length,
        ai: aiOrders,
        online: onlineOrders,
        pos: posOrders
      });
      
      // Apply initial filters
      applyFilters();
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      // Fallback to empty array on error
      setOrders([]);
      setOrderStats({ total: 0, ai: 0, online: 0, pos: 0 });
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...orders];
    
    // Filter by active tab
    if (activeTab === 'ai') {
      filtered = filtered.filter(order => order.source === 'ai-voice');
    } else if (activeTab === 'online') {
      filtered = filtered.filter(order => order.source === 'online');
    } else if (activeTab === 'pos') {
      filtered = filtered.filter(order => order.source === 'pos');
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.phone.toLowerCase().includes(query) ||
        (order.customer.email && order.customer.email.toLowerCase().includes(query)) ||
        (order.address && order.address.postcode.toLowerCase().includes(query))
      );
    }
    
    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.timestamps.created);
        return orderDate >= dateRange.from!;
      });
    }
    
    if (dateRange.to) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.timestamps.created);
        return orderDate <= dateRange.to!;
      });
    }
    
    // Filter by order type and source (combined)
    if (selectedType !== 'all') {
      if (selectedType === 'ai-orders') {
        filtered = filtered.filter(order => order.source === 'ai-voice');
      } else if (selectedType === 'online-orders') {
        filtered = filtered.filter(order => order.source === 'online');
      } else if (selectedType === 'waiting') {
        filtered = filtered.filter(order => order.type === 'pickup' && order.source === 'pos');
      } else if (selectedType === 'collection') {
        filtered = filtered.filter(order => order.type === 'pickup');
      } else {
        // For dine-in and delivery, filter by the type directly
        filtered = filtered.filter(order => order.type === selectedType);
      }
    }
    
    // Filter by order status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }
    
    // Filter by order source
    if (selectedSource !== 'all') {
      filtered = filtered.filter(order => order.source === selectedSource);
    }
    
    setFilteredOrders(filtered);
    setTotalOrderCount(filtered.length);
  };
  
  // Handle export
  const handleExport = () => {
    toast.success('Exported orders to CSV');
  };
  
  // Handle opening order detail dialog
  const handleOpenOrderDetail = (order: OrderData) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };
  
  // Handle editing order
  const handleEditOrder = (order: OrderData) => {
    // Close modal first, then navigate
    onClose();
    
    // If this is an AI voice order, navigate to the right panel in POS
    if (order.source === 'ai-voice' && order.sourceOrderId) {
      // Navigate to the POS with the correct order type based on the original order
      const orderTypeParam = order.type.toLowerCase();
      
      // Add orderPanel parameter to explicitly tell POS which panel to show
      const orderPanel = order.type.toUpperCase();
      
      navigate(`/pos?view=pos&type=${orderTypeParam}&orderPanel=${orderPanel}&voiceOrderId=${order.sourceOrderId}`);
      
      toast.success(`Opening voice order for editing in ${orderTypeParam.toUpperCase()} panel`, {
        description: `Loading order ${order.orderNumber}...`,
        duration: 3000
      });
      
      // Update analytics
      console.log(`Voice order ${order.sourceOrderId} opened for editing from All Orders Modal, type: ${orderTypeParam}, panel: ${orderPanel}`);
    } 
    // For online or POS orders, just navigate to POS
    else {
      toast.success(`Opening order ${order.orderNumber} for editing`);
      navigate('/pos');
    }
  };
  
  // Handle printing order
  const handlePrintOrder = (order: OrderData) => {
    toast.success(`Printing order ${order.orderNumber}`);
  };
  
  // Handle refunding order
  const handleRefundOrder = (order: OrderData) => {
    // Create audit trail entry for refund
    if (user) {
      createRefundAudit(
        order.id,
        user.id,
        user.name || user.email || 'Staff',
        order.source as "ai-voice" | "online" | "pos",
        order.payment.amount, // Full refund by default
        'Refund processed through All Orders Modal'
      );
    }
    
    toast.success(`Refund initiated for order ${order.orderNumber}`);
  };
  
  // Pagination controls
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  
  // Determine if an order should be shown as 'Waiting'
  const isWaitingOrder = (order: OrderData) => {
    return order.type === 'pickup' && order.source === 'pos' && 
           (order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready');
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20';
      case 'confirmed': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
      case 'preparing': return 'bg-purple-500/20 text-purple-500 border-purple-500/20';
      case 'ready': return 'bg-green-500/20 text-green-500 border-green-500/20';
      case 'completed': return 'bg-green-700/20 text-green-600 border-green-700/20';
      case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };
  
  // Get type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'delivery': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
      case 'pickup': return 'bg-purple-500/20 text-purple-500 border-purple-500/20';
      case 'dine-in': return 'bg-green-500/20 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };
  
  // Get source badge color
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ai-voice': return 'bg-purple-500/20 text-purple-500 border-purple-500/20';
      case 'online': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
      case 'pos': return 'bg-amber-500/20 text-amber-500 border-amber-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };
  
  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'ai-voice': return <Phone className="h-4 w-4" />;
      case 'online': return <ShoppingBag className="h-4 w-4" />;
      case 'pos': return <LayoutList className="h-4 w-4" />;
      default: return null;
    }
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  // Render stats cards like AllOrdersView
  const renderStatsCards = () => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.payment.amount, 0);
    const ordersByType = filteredOrders.reduce((acc, order) => {
      const key = isWaitingOrder(order) ? 'waiting' : order.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const ordersBySource = filteredOrders.reduce((acc, order) => {
      acc[order.source] = (acc[order.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{filteredOrders.length}</div>
            <div className="text-sm text-gray-400">Total Orders</div>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">£{totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-gray-400">Total Revenue</div>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{Object.keys(ordersByType).length}</div>
            <div className="text-sm text-gray-400">Order Types</div>
          </CardContent>
        </Card>
        <Card className="border-0" style={{ backgroundColor: globalColors.background.tertiary }}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{Object.keys(ordersBySource).length}</div>
            <div className="text-sm text-gray-400">Order Sources</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render filter bar like AllOrdersView
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
          
          {/* Order Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dine-in">Dine-In</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="collection">Collection</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="ai-orders">AI Orders</SelectItem>
              <SelectItem value="online-orders">Online Orders</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Source Filter */}
          {activeTab === 'all' && (
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ai-voice">AI Voice</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {/* Refresh Button */}
          <Button
            onClick={fetchOrders}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Export Button */}
          <Button
            variant="outline"
            className="gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render individual order card like AllOrdersView
  const renderOrderCard = (order: OrderData) => (
    <Card key={order.id} className="mb-4 border-0 cursor-pointer" style={{ 
      backgroundColor: globalColors.background.tertiary,
      borderLeft: `4px solid ${globalColors.purple.primary}`
    }}
    onClick={() => handleOpenOrderDetail(order)}
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
                {order.source === 'ai-voice' ? 'AI Voice' : order.source === 'online' ? 'Online' : 'POS'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(order.status)} capitalize`}>
              {order.status}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <div className="text-white font-medium">{order.customer.name}</div>
            <div className="text-gray-400 text-sm">{order.customer.phone}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Order Type</div>
            <Badge className={`${getTypeColor(order.type)} capitalize`}>
              {isWaitingOrder(order) ? 'Waiting' : (order.type === 'pickup' ? 'Collection' : order.type)}
            </Badge>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Date & Time</div>
            <div className="text-white text-sm">
              {format(new Date(order.timestamps.created), "dd/MM/yyyy HH:mm")}
            </div>
          </div>
        </div>
        
        <Separator className="my-3 bg-gray-700" />
        
        <div className="space-y-1 mb-3">
          {order.items.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-300">{item.quantity}x {item.name}</span>
              <span className="text-gray-300">£{(item.price * item.quantity).toFixed(2)}</span>
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
          <span className="text-white font-medium">Total: £{order.payment.amount.toFixed(2)}</span>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenOrderDetail(order);
              }}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleEditOrder(order);
              }}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render pagination
  const renderPagination = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-400">
        Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <div className="text-sm text-gray-400">
          Page {page} of {totalPages}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="px-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        
        <Select value={itemsPerPage.toString()} onValueChange={(value) => {
          setItemsPerPage(Number(value));
          setPage(1);
        }}>
          <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder={itemsPerPage.toString()} />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800 text-white">
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal Panel - Slide in from right */}
      <div 
        className={`fixed right-0 top-0 bottom-0 w-[95vw] max-w-7xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: globalColors.background.primary,
          borderLeft: `1px solid ${globalColors.border.light}`
        }}
      >
        {/* Modal Header */}
        <div 
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: globalColors.border.light }}
        >
          <h2 className="text-2xl font-bold" style={{
            background: `linear-gradient(to right, #FFFFFF, ${globalColors.purple.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(124, 93, 250, 0.3)'
          }}>
            Order History & Management
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="mb-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'ai' | 'online' | 'pos')}>
              <TabsList className="bg-gray-900 border border-gray-800">
                <TabsTrigger 
                  value="all" 
                  className={activeTab === 'all' ? 'text-white' : 'text-gray-400'}
                  style={{
                    backgroundColor: activeTab === 'all' ? 'rgba(124, 93, 250, 0.1)' : 'transparent'
                  }}
                >
                  All Orders ({orderStats.total})
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className={activeTab === 'ai' ? 'text-white' : 'text-gray-400'}
                  style={{
                    backgroundColor: activeTab === 'ai' ? 'rgba(124, 93, 250, 0.1)' : 'transparent'
                  }}
                >
                  AI Voice Orders ({orderStats.ai})
                </TabsTrigger>
                <TabsTrigger 
                  value="online" 
                  className={activeTab === 'online' ? 'text-white' : 'text-gray-400'}
                  style={{
                    backgroundColor: activeTab === 'online' ? 'rgba(124, 93, 250, 0.1)' : 'transparent'
                  }}
                >
                  Online Orders ({orderStats.online})
                </TabsTrigger>
                <TabsTrigger 
                  value="pos" 
                  className={activeTab === 'pos' ? 'text-white' : 'text-gray-400'}
                  style={{
                    backgroundColor: activeTab === 'pos' ? 'rgba(124, 93, 250, 0.1)' : 'transparent'
                  }}
                >
                  POS Orders ({orderStats.pos})
                </TabsTrigger>
              </TabsList>
              
              {/* Stats Cards */}
              {renderStatsCards()}
              
              {/* Filter Bar */}
              {renderFilterBar()}
              
              {/* Pagination Info at Top */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="text-sm text-gray-400">
                  Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Items per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder={itemsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Tabs>
          </div>
          
          {isLoading ? (
            <Card className="border-0" style={{ backgroundColor: globalColors.background.secondary }}>
              <CardContent className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Loading orders...</p>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="flex flex-col items-center justify-center p-12">
                <AlertCircle className="h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Orders Found</h3>
                <p className="text-gray-400 text-center max-w-md">
                  No orders match your current filter criteria. Try adjusting your filters or search query.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 gap-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  onClick={() => {
                    setSearchQuery('');
                    setDateRange({ from: undefined, to: undefined });
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setSelectedSource('all');
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0" style={{ backgroundColor: globalColors.background.secondary }}>
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Orders ({filteredOrders.length})</span>
                  {isLoading && (
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedOrders.map(renderOrderCard)}
                </div>
                
                {/* Pagination */}
                {renderPagination()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onEdit={handleEditOrder}
        onPrint={handlePrintOrder}
        onRefund={handleRefundOrder}
        orderSource={selectedOrder?.source || 'online'}
      />
    </>
  );
};

export default AllOrdersModal;
