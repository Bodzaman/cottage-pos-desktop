
import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleAuth } from "../utils/simple-auth-context";
import { createRefundAudit } from "../utils/orderAuditTrail";
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Search, RefreshCw, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { colors } from '../utils/designSystem';
import { OrderDetailDialog, OrderData } from '../components/OrderDetailDialog';
import { formatCurrency } from '../utils/formatters';
import { OrdersTable } from '../components/orders/OrdersTable';
import { OrderSubTabs } from '../components/orders/OrderSubTabs';
import { OrderCustomerCRM } from '../components/orders/CustomerPreviewCard';
import brain from "brain";

type PrimaryTab = 'all' | 'dine-in' | 'takeaway' | 'online';

const TAKEAWAY_SUB_TABS = [
  { value: 'all', label: 'All' },
  { value: 'WAITING', label: 'Waiting' },
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'DELIVERY', label: 'Delivery' },
];

const ONLINE_SUB_TABS = [
  { value: 'all', label: 'All' },
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'DELIVERY', label: 'Delivery' },
];

// Extended OrderData with CRM fields
interface OrderDataWithCRM extends OrderData {
  customerCRM?: OrderCustomerCRM | null;
  rawOrderType?: string;
}

// Convert backend order to frontend format
const convertBackendOrder = (backendOrder: any): OrderDataWithCRM => {
  const typeMapping: Record<string, "delivery" | "pickup" | "dine-in"> = {
    "DELIVERY": "delivery",
    "COLLECTION": "pickup",
    "DINE-IN": "dine-in",
    "WAITING": "pickup",
  };

  const sourceMapping: Record<string, "online" | "pos"> = {
    "ONLINE": "online",
    "POS": "pos",
    "CUSTOMER_ONLINE_MENU": "online",
    "WEBSITE": "online",
  };

  const customerCRM = backendOrder.customer_data
    ? {
        id: backendOrder.customer_data.id,
        first_name: backendOrder.customer_data.first_name,
        last_name: backendOrder.customer_data.last_name,
        phone: backendOrder.customer_data.phone,
        customer_reference_number: backendOrder.customer_data.customer_reference_number,
        total_orders: backendOrder.customer_data.total_orders,
        total_spend: backendOrder.customer_data.total_spend,
        last_order_at: backendOrder.customer_data.last_order_at,
        tags: backendOrder.customer_data.tags,
        notes_summary: backendOrder.customer_data.notes_summary,
      }
    : null;

  return {
    id: backendOrder.order_id,
    orderNumber: backendOrder.order_number || backendOrder.order_id,
    type: typeMapping[backendOrder.order_type] || "delivery",
    source: (sourceMapping[backendOrder.order_source] || "pos") as any,
    status: backendOrder.status?.toLowerCase() as any || "pending",
    total: backendOrder.total,
    rawOrderType: backendOrder.order_type,
    items: backendOrder.items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      variant: item.variant_name || undefined,
      notes: item.notes || undefined,
    })) || [],
    customer: {
      name: backendOrder.customer_name || "Walk-in",
      phone: backendOrder.customer_phone || "",
      email: backendOrder.customer_email || undefined,
    },
    address: backendOrder.order_type === "DELIVERY" ? {
      addressLine1: "Address on file",
      city: "",
      postcode: "",
    } : undefined,
    payment: {
      method: backendOrder.payment?.method?.toLowerCase() as any || "card",
      status: "paid" as any,
      amount: backendOrder.total,
      reference: backendOrder.payment?.transaction_id || undefined,
    },
    timestamps: {
      created: backendOrder.created_at,
      updated: backendOrder.completed_at !== backendOrder.created_at ? backendOrder.completed_at : undefined,
    },
    tableNumber: backendOrder.table_number || undefined,
    customerCRM,
  };
};

export default function AllOrders() {
  const { isStaff, user } = useSimpleAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab state
  const [activeTab, setActiveTab] = useState<PrimaryTab>('all');
  const [subTab, setSubTab] = useState('all');

  // Data state
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<OrderDataWithCRM[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Order detail dialog
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Build query params from tab/filter state
  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
    };

    // Tab-based filtering
    switch (activeTab) {
      case 'dine-in':
        params.order_type = 'DINE-IN';
        break;
      case 'takeaway':
        params.order_source = 'POS';
        if (subTab !== 'all') {
          params.order_type = subTab;
        }
        break;
      case 'online':
        params.order_source = 'ONLINE';
        if (subTab !== 'all') {
          params.order_type = subTab;
        }
        break;
    }

    // Additional filters
    if (selectedStatus !== 'all') {
      params.status = selectedStatus.toUpperCase();
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    return params;
  }, [activeTab, subTab, page, pageSize, selectedStatus, searchQuery]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = buildQueryParams();
      const response = await brain.get_orders(params);
      const data = await response.json();

      const converted = data.orders?.map(convertBackendOrder) || [];

      // For takeaway tab without sub-tab, filter out DINE-IN from POS orders client-side
      let filtered = converted;
      if (activeTab === 'takeaway' && subTab === 'all') {
        filtered = converted.filter((o: OrderDataWithCRM) => o.rawOrderType !== 'DINE-IN');
      }

      setOrders(filtered);
      setTotalCount(data.total_count || filtered.length);

      // Check for deep-link orderId
      const searchParams = new URLSearchParams(location.search);
      const orderId = searchParams.get('orderId');
      if (orderId) {
        const target = filtered.find((o: OrderDataWithCRM) => o.id === orderId);
        if (target) {
          setSelectedOrder(target);
          setDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams, location.search, activeTab, subTab]);

  // Refetch when filters change
  useEffect(() => {
    fetchOrders();
  }, [activeTab, subTab, page, pageSize, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset sub-tab and page when primary tab changes
  const handleTabChange = (tab: PrimaryTab) => {
    setActiveTab(tab);
    setSubTab('all');
    setPage(1);
  };

  const handleViewOrder = (order: OrderData) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handlePrintOrder = (order: OrderData) => {
    toast.success(`Printing order ${order.orderNumber}`);
  };

  const handleEditOrder = (order: OrderData) => {
    navigate('/pos');
    toast.success(`Opening order ${order.orderNumber} for editing`);
  };

  const handleRefundOrder = (order: OrderData) => {
    if (user) {
      createRefundAudit(
        order.id,
        user.id,
        user.name || user.email || 'Staff',
        order.source as "online" | "pos",
        order.payment.amount,
        'Refund processed through All Orders page'
      );
    }
    toast.success(`Refund initiated for order ${order.orderNumber}`);
  };

  const handleViewCustomerProfile = (customerId: string) => {
    // Navigate to CRM customer profile
    navigate(`/admin?view=crm&customerId=${customerId}`);
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const primaryTabs: { value: PrimaryTab; label: string }[] = [
    { value: 'all', label: 'All Orders' },
    { value: 'dine-in', label: 'Dine-In' },
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'online', label: 'Online' },
  ];

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: colors.background.primary }}>
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">All Orders</h1>
              <p className="text-sm text-gray-500">Order History & Management</p>
            </div>
          </div>
          <Badge variant="outline" className="text-white border-gray-600">
            {totalCount} orders
          </Badge>
        </div>

        {/* Primary Tabs */}
        <div className="flex flex-col gap-0">
          <div className="flex gap-1 bg-[#111] rounded-lg p-1 w-fit">
            {primaryTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Secondary Sub-Tabs */}
          {activeTab === 'takeaway' && (
            <OrderSubTabs tabs={TAKEAWAY_SUB_TABS} activeTab={subTab} onChange={val => { setSubTab(val); setPage(1); }} />
          )}
          {activeTab === 'online' && (
            <OrderSubTabs tabs={ONLINE_SUB_TABS} activeTab={subTab} onChange={val => { setSubTab(val); setPage(1); }} />
          )}
        </div>

        {/* Filter Bar */}
        <Card className="border-0" style={{ backgroundColor: colors.background.secondary }}>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search order #, customer, phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white text-sm h-9"
                />
              </div>

              <Select value={selectedStatus} onValueChange={val => { setSelectedStatus(val); setPage(1); }}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white text-sm h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        {isLoading ? (
          <Card className="border-0" style={{ backgroundColor: colors.background.secondary }}>
            <CardContent className="text-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-gray-500" />
              <p className="text-gray-500 text-sm">Loading orders...</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="border-0" style={{ backgroundColor: colors.background.secondary }}>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <AlertCircle className="h-10 w-10 text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">No Orders Found</h3>
              <p className="text-gray-500 text-sm text-center max-w-md">
                No orders match your current filters. Try adjusting your search or filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 bg-white/5 border-white/10 text-white"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSubTab('all');
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0" style={{ backgroundColor: colors.background.secondary }}>
            <CardContent className="p-0">
              <OrdersTable
                orders={orders}
                onViewOrder={handleViewOrder}
                onPrintOrder={handlePrintOrder}
                onViewCustomerProfile={handleViewCustomerProfile}
              />
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0 bg-white/5 border-white/10 text-white"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-xs text-gray-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0 bg-white/5 border-white/10 text-white"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Select value={pageSize.toString()} onValueChange={val => { setPageSize(Number(val)); setPage(1); }}>
                <SelectTrigger className="w-16 h-8 bg-white/5 border-white/10 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
    </div>
  );
}
