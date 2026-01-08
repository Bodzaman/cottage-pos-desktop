import { useState, useEffect } from "react";
import { OrderQueuePanel } from "./OrderQueuePanel";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { OrderActionPanel } from "./OrderActionPanel";
import { useNavigate } from "react-router-dom";
import { useSimpleAuth } from "../utils/simple-auth-context";
import { orderManagementService, CompletedOrder, OrderFilterParams } from "../utils/orderManagementService";
import { DetailedOrderDialog } from "./DetailedOrderDialog";
import { colors, cardStyle } from "../utils/designSystem";
import { QSAITheme, styles, effects } from "../utils/QSAIDesign";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, DownloadIcon, Search, BarChart3, RefreshCw, XIcon, TableIcon, TruckIcon, ShoppingBagIcon, UserIcon, FileTextIcon, ReceiptIcon, AlertCircle, ChevronLeft, ChevronRight, Filter, Bell, Check, X, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../utils/formatters";
import { POSViewProps } from "./POSViewContainer";
import { useMountedRef, useSafeTimeout } from 'utils/safeHooks';
import { extractItemName, extractVariantName, extractQuantity, formatOrderItemDisplay } from '../utils/orderDisplayUtils';

// Order status colors
const ORDER_STATUS_COLORS = {
  "NEW": "bg-blue-600",
  "PROCESSING": "bg-amber-600",
  "READY": "bg-purple-600",
  "COMPLETED": "bg-green-700",
  "CANCELLED": "bg-red-700",
  "REFUNDED": "bg-red-700",
  "PARTIAL_REFUND": "bg-orange-700"
};

// Order type colors and labels
const ORDER_TYPE_COLORS = {
  "DINE-IN": "bg-[#7C5DFA]",
  "COLLECTION": "bg-[#7C5DFA]/90",
  "DELIVERY": "bg-[#7C5DFA]/80",
  "WAITING": "bg-[#7C5DFA]/70",
  "ONLINE": "bg-[#7C5DFA]/60"
};

// Payment method colors and labels
const PAYMENT_METHOD_COLORS = {
  "CASH": "bg-green-600",
  "CARD": "bg-blue-600",
  "ONLINE": "bg-purple-600",
  "SPLIT": "bg-amber-600"
};

interface OnlineOrdersViewProps extends POSViewProps {
  initialTab?: 'orders';
  autoApproveEnabled?: boolean;
  onAutoApproveToggle?: (enabled: boolean) => void;
}

export function OnlineOrdersView({ onBack, initialTab = 'orders', autoApproveEnabled = false, onAutoApproveToggle }: OnlineOrdersViewProps) {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<OrderFilterParams>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("csv");
  const [selectedOrderType, setSelectedOrderType] = useState<string | undefined>(undefined);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [newOrderNotification, setNewOrderNotification] = useState(false);
  
  // Auto-approve orders setting
  const [autoApprove, setAutoApprove] = useState(autoApproveEnabled);
  
  // Initialize safe hooks
  const mountedRef = useMountedRef();
  const { setSafeTimeout } = useSafeTimeout();
  
  // Handle auto-approve toggle
  const handleAutoApproveToggle = (value: boolean) => {
    setAutoApprove(value);
    if (onAutoApproveToggle) {
      onAutoApproveToggle(value);
    }
    toast.success(`Auto-approve ${value ? 'enabled' : 'disabled'} for Online orders`);
  };
  
  // Fetch orders when filters or pagination changes
  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, filters]);
  
  // Toggle view mode between card and list
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'card' ? 'list' : 'card');
  };
  
  // Update filters when search query or date range changes
  useEffect(() => {
    // Debounce search for performance using safe timeout
    setSafeTimeout(() => {
      if (!mountedRef.current) return;
      
      const newFilters: OrderFilterParams = {
        order_source: 'WEBSITE' // Always filter for Website orders
      };
      
      if (searchQuery) {
        newFilters.search = searchQuery;
      }
      
      if (dateRange.from) {
        newFilters.start_date = dateRange.from;
      }
      
      if (dateRange.to) {
        newFilters.end_date = dateRange.to;
      }
      
      if (selectedOrderType && selectedOrderType !== 'all') {
        newFilters.order_type = selectedOrderType;
      }
      
      if (selectedPaymentMethod && selectedPaymentMethod !== 'all') {
        newFilters.payment_method = selectedPaymentMethod;
      }
      
      if (selectedStatus && selectedStatus !== 'all') {
        newFilters.status = selectedStatus;
      }
      
      // Reset pagination when filters change
      setCurrentPage(1);
      setFilters(newFilters);
    }, 500);
  }, [searchQuery, dateRange, selectedOrderType, selectedPaymentMethod, selectedStatus, mountedRef, setSafeTimeout]);
  
  // Fetch orders with current filters and pagination
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const result = await orderManagementService.getOrders(page, pageSize, filters);
      setOrders(result.orders);
      setTotalCount(result.totalCount);
      
      const newOrders = result.orders.filter(order => order.status === 'NEW');
      if (newOrders.length > 0) {
        // Set notification flag
        setNewOrderNotification(true);
        
        // Play notification sound for new orders
        const audio = new Audio('/assets/notification.mp3');
        audio.play().catch(e => console.log('Audio playback prevented:', e));
        
        // Show toast notification
        toast.info(`${newOrders.length} new online order${newOrders.length > 1 ? 's' : ''} received`, {
          position: 'top-right',
          duration: 5000,
        });
        
        // Auto-approve orders if enabled
        if (autoApprove && newOrders.length > 0) {
          newOrders.forEach(order => {
            handleApproveOrder(order.order_id);
          });
          toast.success(`Auto-approved ${newOrders.length} new order${newOrders.length > 1 ? 's' : ''}`);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear notification when user interacts with the page
  const clearNotification = () => {
    setNewOrderNotification(false);
  };
  
  // Handle selecting an order for the detail panel
  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.order_id === orderId);
    setSelectedOrderId(orderId);
    setSelectedOrder(order || null);
  };

  // Handle order approval action
  const handleApproveAction = (orderId: string) => {
    handleApproveOrder(orderId);
  };

  // Handle order rejection action
  const handleRejectAction = (orderId: string) => {
    toast.error(`Order ${orderId} rejected`);
    fetchOrders();
  };

  // Handle order processing action
  const handleProcessAction = (orderId: string) => {
    handleProcessOrder(orderId);
  };

  // Handle order completion action
  const handleCompleteAction = (orderId: string) => {
    toast.success(`Order ${orderId} completed`);
    fetchOrders();
  };

  // Handle calling the customer
  const handleCallCustomer = (phone: string) => {
    if (!phone) {
      toast.error("Customer phone number not available");
      return;
    }
    toast.success(`Calling customer at ${phone}`);
    // Here you would integrate with your actual calling system
  };

  // Handle texting the customer
  const handleTextCustomer = (phone: string) => {
    if (!phone) {
      toast.error("Customer phone number not available");
      return;
    }
    toast.success(`Sending message to customer at ${phone}`);
    // Here you would integrate with your actual messaging system
  };
  
  // Handle order approval
  const handleApproveOrder = async (orderId: string) => {
    try {
      // Here you would integrate with your actual order approval API
      toast.success(`Order ${orderId} approved and sent to kitchen`);
      
      // Trigger printing of FOH and kitchen tickets
      toast.success(`Printing tickets for order ${orderId}`);
      
      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
    }
  };
  

  
  // Export orders with current filters
  const handleExportOrders = async () => {
    try {
      setIsExporting(true);
      const exportedOrders = await orderManagementService.exportOrders(filters);
      
      if (!exportedOrders || exportedOrders.length === 0) {
        toast.error('No orders to export');
        return;
      }
      
      // Format for export based on selected format
      let exportContent = "";
      let filename = `cottage-tandoori-orders-${new Date().toISOString().split('T')[0]}`;
      
      if (exportFormat === "csv") {
        // Create CSV content with headers
        const headers = [
          "Order ID", "Type", "Source", "Date", "Time", "Table", "Guests",
          "Status", "Subtotal", "Tax", "Service", "Discount", "Tip", "Total", "Payment Method"
        ];
        
        const rows = exportedOrders.map(order => [
          order.order_id,
          order.order_type,
          order.order_source,
          format(new Date(order.completed_at), "yyyy-MM-dd"),
          format(new Date(order.completed_at), "HH:mm"),
          order.table_number || "-",
          order.guest_count || "-",
          order.status,
          order.subtotal.toFixed(2),
          order.tax.toFixed(2),
          order.service_charge.toFixed(2),
          order.discount.toFixed(2),
          order.tip.toFixed(2),
          order.total.toFixed(2),
          order.payment.method
        ]);
        
        exportContent = [headers, ...rows].map(row => row.join(",")).join("\n");
        filename += ".csv";
      } else {
        // JSON format
        exportContent = JSON.stringify(exportedOrders, null, 2);
        filename += ".json";
      }
      
      // Create download link
      const blob = new Blob([exportContent], { type: exportFormat === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Get a readable label for order status
  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return "New";
      case "PROCESSING":
        return "Processing";
      case "READY":
        return "Ready";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "REFUNDED":
        return "Refunded";
      case "PARTIAL_REFUND":
        return "Partial Refund";
      default:
        return status;
    }
  };
  
  // Process and approve an order
  const handleProcessOrder = async (orderId: string) => {
    try {
      toast.success(`Order ${orderId} is being processed`);
      
      // Here you would integrate with your actual order processing API
      // For now, we'll just trigger printing of tickets
      toast.success(`Printing tickets for order ${orderId}`);
      
      // Refresh orders list
      fetchOrders();
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    }
  };
  
  // Pagination component
  const Pagination = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm" style={{ color: colors.text.secondary }}>
          {totalCount > 0 ? (
            <>Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} orders</>
          ) : (
            "No orders found"
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1 || isLoading}
            className="px-2.5"
            style={{ 
              backgroundColor: colors.background.secondary, 
              borderColor: colors.border.light,
              color: colors.text.primary
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm min-w-[50px] text-center" style={{ color: colors.text.secondary }}>
            {page} / {totalPages || 1}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages || isLoading}
            className="px-2.5"
            style={{ 
              backgroundColor: colors.background.secondary, 
              borderColor: colors.border.light,
              color: colors.text.primary
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setPage(1); // Reset to page 1 when changing page size
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };
  
  // Order item component
  const OrderItem = ({ order }: { order: CompletedOrder }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isNewOrder = order.status === 'NEW';
    
    const handleOpenDetails = (e: React.MouseEvent) => {
      e.stopPropagation();
      clearNotification();
      setSelectedOrder(order);
      setDialogOpen(true);
    };
    
    return (
      <Card 
        className={`mb-4 overflow-hidden transition-all duration-300 ${isNewOrder ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10' : ''}`}
        style={{ 
          ...cardStyle,
          background: isNewOrder 
            ? `linear-gradient(145deg, rgba(21, 25, 42, 0.8) 0%, rgba(21, 25, 42, 0.9) 100%)` 
            : cardStyle.backgroundColor,
        }}
      >
        <div 
          className="p-4 cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ color: colors.text.primary }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {order.order_type === "DINE-IN" ? (
                <TableIcon className="h-10 w-10 p-2 rounded-md" style={{ backgroundColor: `${colors.brand.blue}20`, color: colors.brand.blue }} />
              ) : order.order_type === "DELIVERY" ? (
                <TruckIcon className="h-10 w-10 p-2 rounded-md" style={{ backgroundColor: `${colors.brand.teal}20`, color: colors.brand.teal }} />
              ) : order.order_type === "COLLECTION" ? (
                <ShoppingBagIcon className="h-10 w-10 p-2 rounded-md" style={{ backgroundColor: `${colors.brand.purple}20`, color: colors.brand.purple }} />
              ) : (
                <UserIcon className="h-10 w-10 p-2 rounded-md" style={{ backgroundColor: `${colors.status.warning}20`, color: colors.status.warning }} />
              )}
              
              <div>
                <div className="font-semibold" style={{ color: colors.text.primary }}>{order.order_id}</div>
                <div className="text-sm" style={{ color: colors.text.secondary }}>
                  {format(new Date(order.completed_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="font-bold text-lg" style={{ color: colors.text.primary }}>
                {formatCurrency(order.total)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  style={{ 
                    backgroundColor: order.order_type === "DINE-IN" ? colors.brand.blue : 
                                    order.order_type === "COLLECTION" ? colors.brand.purple : 
                                    order.order_type === "DELIVERY" ? colors.brand.teal : 
                                    order.order_type === "WAITING" ? colors.status.warning : 
                                    colors.status.info,
                    color: colors.text.primary
                  }}
                >
                  {order.order_type}
                </Badge>
                <Badge 
                  style={{ 
                    backgroundColor: order.payment.method === "CASH" ? colors.brand.teal : 
                                    order.payment.method === "CARD" ? colors.brand.blue : 
                                    order.payment.method === "ONLINE" ? colors.brand.purple : 
                                    colors.status.warning,
                    color: colors.text.primary
                  }}
                >
                  {order.payment.method}
                </Badge>
                <Badge 
                  style={{ 
                    backgroundColor: 
                      order.status === "NEW" ? 'rgba(59, 130, 246, 0.7)' : 
                      order.status === "PROCESSING" ? 'rgba(245, 158, 11, 0.7)' : 
                      order.status === "READY" ? 'rgba(139, 92, 246, 0.7)' : 
                      order.status === "COMPLETED" ? 'rgba(16, 185, 129, 0.7)' : 
                      order.status === "REFUNDED" ? colors.status.error : 
                      'rgba(239, 68, 68, 0.7)',
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {getOrderStatusLabel(order.status)}
                </Badge>
              </div>
            </div>
          </div>
          
          {order.table_number && (
            <div className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
              Table {order.table_number} • {order.guest_count} {order.guest_count === 1 ? "Guest" : "Guests"}
            </div>
          )}
          
          {isNewOrder && (
            <div className="mt-3 flex justify-between items-center">
              <div className="text-sm flex items-center" style={{ color: '#3B82F6' }}>
                <Bell className="h-4 w-4 mr-1 animate-pulse" />
                New online order requires approval
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(e);
                  }}
                  className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md"
                >
                  <FileTextIcon className="h-4 w-4 mr-1" /> View Details
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveOrder(order.order_id);
                  }}
                  className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                >
                  <Check className="h-4 w-4 mr-1" /> Approve Order
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div 
            className="p-4" 
            style={{ 
              borderTop: `1px solid ${colors.border.light}`,
              color: colors.text.primary
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Order Items */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium" style={{ color: colors.text.primary }}>Order Items</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenDetails}
                    style={{ 
                      border: `1px solid ${QSAITheme.purple.primary}40`,
                      color: QSAITheme.purple.primary
                    }}
                  >
                    View Full Details
                  </Button>
                </div>
                <div className="space-y-2">
                  {(order.items || []).map((item, index) => (
                    <div 
                      key={`${order.order_id}-item-${index}`} 
                      className="flex justify-between py-2 border-b" 
                      style={{ 
                        borderBottomColor: colors.border.light,
                        color: colors.text.primary
                      }}
                    >
                      <div>
                        <div className="font-medium" style={{ color: colors.text.primary }}>{extractQuantity(item)}x {extractItemName(item)}</div>
                        {extractVariantName(item) && (
                          <div className="text-sm" style={{ color: colors.text.secondary }}>{extractVariantName(item)}</div>
                        )}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-sm mt-1" style={{ color: colors.text.tertiary }}>
                            {item.modifiers.map((mod, i) => (
                              <div key={`${order.order_id}-item-${index}-mod-${i}`} className="ml-2 text-xs">
                                <span style={{ color: colors.text.secondary }}>{mod.groupName}: </span>
                                {mod.options.map(opt => opt.name).join(", ")}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs italic mt-1" style={{ color: colors.text.tertiary }}>Note: {item.notes}</div>
                        )}
                      </div>
                      <div style={{ color: colors.text.primary, marginLeft: "1rem" }}>
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Order Summary */}
              <div 
                className="rounded-lg p-4" 
                style={{ 
                  backgroundColor: `${colors.background.secondary}50`,
                  color: colors.text.primary
                }}
              >
                <h4 className="font-medium mb-4" style={{ color: colors.text.primary }}>Order Summary</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: colors.text.secondary }}>Subtotal</span>
                    <span style={{ color: colors.text.primary }}>{formatCurrency(order.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span style={{ color: colors.text.secondary }}>VAT (20%)</span>
                    <span style={{ color: colors.text.primary }}>{formatCurrency(order.tax)}</span>
                  </div>
                  
                  {order.service_charge > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>Service Charge</span>
                      <span style={{ color: colors.text.primary }}>{formatCurrency(order.service_charge)}</span>
                    </div>
                  )}
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>Discount</span>
                      <span style={{ color: colors.status.error }}>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  
                  {order.tip > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>Tip</span>
                      <span style={{ color: colors.text.primary }}>{formatCurrency(order.tip)}</span>
                    </div>
                  )}
                  
                  <Separator className="my-2" style={{ backgroundColor: colors.border.light }} />
                  
                  <div className="flex justify-between font-medium">
                    <span style={{ color: colors.text.primary }}>Total</span>
                    <span style={{ color: colors.text.primary }}>{formatCurrency(order.total)}</span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm mb-1" style={{ color: colors.text.secondary }}>Payment Method</div>
                    <div className="font-medium" style={{ color: colors.text.primary }}>
                      {order.payment.method} {order.payment.transaction_id ? `(${order.payment.transaction_id})` : ""}
                    </div>
                  </div>
                  
                  {order.payment.method === "SPLIT" && order.payment.split_payments && (
                    <div className="mt-2">
                      <div className="text-sm mb-1" style={{ color: colors.text.secondary }}>Split Payments</div>
                      {order.payment.split_payments.map((split, i) => (
                        <div key={`split-${i}`} className="flex justify-between text-sm">
                          <span style={{ color: colors.text.secondary }}>{split.method}</span>
                          <span style={{ color: colors.text.primary }}>{formatCurrency(split.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };
  
  // This section used to contain ReconciliationView component which has been removed
  
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with description */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white" style={{ 
              background: `linear-gradient(to right, #FFFFFF, ${colors.brand.purple})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              display: 'inline-block',
              textShadow: '0 0 30px rgba(124, 93, 250, 0.3)'
            }}>Website Orders</h2>
            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              Manage orders placed through the website and chatbot
            </p>
          </div>
          
          {/* Auto-Approve Toggle */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="auto-approve" 
                checked={autoApprove}
                onCheckedChange={handleAutoApproveToggle}
              />
              <Label htmlFor="auto-approve" className="cursor-pointer" style={{ color: colors.text.secondary }}>
                Auto-Approve Orders
              </Label>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center bg-secondary rounded-md overflow-hidden mr-2" style={{ border: `1px solid ${colors.border.light}` }}>
                <button
                  className={`px-3 py-1.5 flex items-center text-xs ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
                  style={{
                    color: viewMode === 'card' ? '#fff' : colors.text.secondary,
                    backgroundColor: viewMode === 'card' ? QSAITheme.purple.primary : 'transparent',
                  }}
                  onClick={() => setViewMode('card')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                  </svg>
                  Cards
                </button>
                <button
                  className={`px-3 py-1.5 flex items-center text-xs ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
                  style={{
                    color: viewMode === 'list' ? '#fff' : colors.text.secondary,
                    backgroundColor: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent',
                  }}
                  onClick={() => setViewMode('list')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  List
                </button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={isLoading}
                className="h-9 px-3"
                style={{ 
                  backgroundColor: colors.background.secondary, 
                  borderColor: colors.border.light,
                  color: colors.text.primary
                }}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <Tabs defaultValue="orders" value={activeTab} className="w-full">
          <TabsList className="mb-8 w-full grid grid-cols-1" style={{ backgroundColor: colors.background.tertiary }}>
            <TabsTrigger 
              value="orders" 
              style={{ 
                backgroundColor: `${colors.brand.purple}20`,
                color: colors.brand.purple
              }}
            >
              Orders
            </TabsTrigger>
          </TabsList>
                
          <TabsContent value="orders" className="space-y-6">
          {/* Three-panel layout for order management */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            {/* Left Panel: Order Queue */}
            <div className="bg-card rounded-lg overflow-hidden">
              <OrderQueuePanel
                orders={orders}
                selectedOrderId={selectedOrderId}
                onOrderSelect={handleOrderSelect}
                orderSource="WEBSITE"
                className="h-full"
              />
            </div>
            
            {/* Center Panel: Order Details */}
            <div className="bg-card rounded-lg overflow-hidden">
              <OrderDetailPanel
                order={selectedOrder}
                className="h-full"
                onViewFullDetails={() => {
                  if (selectedOrder) {
                    setDialogOpen(true);
                  }
                }}
              />
            </div>
            
            {/* Right Panel: Order Actions */}
            <div className="bg-card rounded-lg overflow-hidden">
              <OrderActionPanel
                order={selectedOrder}
                onApprove={handleApproveAction}
                onReject={handleRejectAction}
                onProcess={handleProcessAction}
                onComplete={handleCompleteAction}
                onCallCustomer={handleCallCustomer}
                onTextCustomer={handleTextCustomer}
                className="h-full"
              />
            </div>
          </div>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.text.tertiary }} />
                <Input
                  className="pl-10"
                  placeholder="Search by order ID, customer name, or item"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                />
              </div>
                    
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      style={{ 
                        backgroundColor: colors.background.secondary, 
                        borderColor: colors.border.light,
                        color: colors.text.primary
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Date Range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                      
                <Button 
                  variant="outline" 
                  onClick={fetchOrders}
                  disabled={isLoading}
                  style={{ 
                    backgroundColor: colors.background.secondary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                        
                <Button 
                  variant="outline" 
                  onClick={handleExportOrders}
                  disabled={isExporting || orders.length === 0}
                  style={{ 
                    backgroundColor: colors.background.secondary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                >
                  {isExporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <DownloadIcon className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
                  
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label style={{ color: colors.text.secondary }}>Order Type</Label>
                <Select
                  value={selectedOrderType || 'all'}
                  onValueChange={(value) => setSelectedOrderType(value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="mt-1" style={{ 
                    backgroundColor: colors.background.secondary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}>
                    <SelectValue placeholder="All Order Types" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <SelectItem value="all">All Order Types</SelectItem>
                    <SelectItem value="DINE-IN">Dine-In</SelectItem>
                    <SelectItem value="COLLECTION">Collection</SelectItem>
                    <SelectItem value="DELIVERY">Delivery</SelectItem>
                    <SelectItem value="WAITING">Waiting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                    
              <div>
                <Label style={{ color: colors.text.secondary }}>Payment Method</Label>
                <Select
                  value={selectedPaymentMethod || 'all'}
                  onValueChange={(value) => setSelectedPaymentMethod(value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="mt-1" style={{ 
                    backgroundColor: colors.background.secondary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}>
                    <SelectValue placeholder="All Payment Methods" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <SelectItem value="all">All Payment Methods</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="SPLIT">Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                    
              <div>
                <Label style={{ color: colors.text.secondary }}>Status</Label>
                <Select
                  value={selectedStatus || 'all'}
                  onValueChange={(value) => setSelectedStatus(value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="mt-1" style={{ 
                    backgroundColor: colors.background.secondary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                    <SelectItem value="PARTIAL_REFUND">Partial Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
                  
            {/* Order List */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="h-8 w-8 animate-spin" style={{ color: colors.text.tertiary }} />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 border rounded-lg" style={{ borderColor: colors.border.light }}>
                <FileTextIcon className="h-12 w-12 mx-auto mb-4" style={{ color: colors.text.tertiary }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>No Orders Found</h3>
                <p style={{ color: colors.text.secondary }}>Try adjusting your filters or search criteria.</p>
              </div>
            ) : (
              <div>
                {viewMode === 'card' ? (
                  // Card View
                  orders.map((order) => (
                    <OrderItem key={order.order_id} order={order} />
                  ))
                ) : (
                  // List View
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{
                      backgroundColor: colors.background.tertiary,
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                    }}>
                      <thead>
                        <tr className="border-b" style={{ borderBottomColor: colors.border.light }}>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: colors.text.secondary }}>ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: colors.text.secondary }}>Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: colors.text.secondary }}>Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: colors.text.secondary }}>Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: colors.text.secondary }}>Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: colors.text.secondary }}>Items</th>
                          <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: colors.text.secondary }}>Total</th>
                          <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: colors.text.secondary }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => {
                          const isNewOrder = order.status === 'NEW';
                          return (
                            <tr 
                              key={order.order_id} 
                              className="hover:bg-gray-800/20 cursor-pointer border-b" 
                              style={{ borderBottomColor: colors.border.light }}
                              onClick={() => {
                                // Clear notification when viewing the order
                                if (isNewOrder) clearNotification();
                                // Toggle expanded view in card mode
                              }}
                            >
                              <td className="px-4 py-3 text-sm" style={{ color: colors.text.primary }}>{order.order_id}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: colors.text.primary }}>
                                {format(new Date(order.created_at || order.completed_at), "MMM d, yyyy 'at' h:mm a")}
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: colors.text.primary }}>
                                {order.customer_name || 'Guest'}
                              </td>
                              <td className="px-4 py-3">
                                <Badge 
                                  style={{ 
                                    backgroundColor: order.order_type === "DINE-IN" ? QSAITheme.blue : 
                                                  order.order_type === "COLLECTION" ? QSAITheme.purple.primary : 
                                                  QSAITheme.purple.primary,
                                    color: colors.text.primary
                                  }}
                                >
                                  {order.order_type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge 
                                  style={{ 
                                    backgroundColor: 
                                      order.status === "NEW" ? 'rgba(59, 130, 246, 0.7)' : 
                                      order.status === "PROCESSING" ? 'rgba(245, 158, 11, 0.7)' : 
                                      order.status === "READY" ? 'rgba(139, 92, 246, 0.7)' : 
                                      order.status === "COMPLETED" ? 'rgba(16, 185, 129, 0.7)' : 
                                      'rgba(239, 68, 68, 0.7)',
                                    color: '#ffffff',
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                                  }}
                                >
                                  {order.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: colors.text.primary }}>
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </td>
                              <td className="px-4 py-3 text-sm text-right" style={{ color: colors.text.primary }}>
                                {formatCurrency(order.total)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isNewOrder ? (
                                  <Button 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveOrder(order.order_id);
                                    }}
                                    className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                ) : (
                                  order.status === "COMPLETED" && (
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Logic for viewing details
                                      }}
                                      style={{ 
                                        backgroundColor: colors.background.secondary, 
                                        borderColor: colors.border.light,
                                        color: colors.text.primary
                                      }}
                                    >
                                      <FileTextIcon className="h-4 w-4 mr-1" /> Details
                                    </Button>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <Pagination />
              </div>
            )}
          </TabsContent>
                

        </Tabs>
      </div>
      
      {/* Detailed Order Dialog */}
      <DetailedOrderDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orderSource="WEBSITE"
      />
    </div>
  );
}
