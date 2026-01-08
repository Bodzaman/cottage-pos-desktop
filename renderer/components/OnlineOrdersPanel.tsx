


import { useState, useEffect } from "react";
import { OrderQueuePanel } from "./OrderQueuePanel";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { OrderActionPanel } from "./OrderActionPanel";
import { useNavigate } from "react-router-dom";
import { useSimpleAuth } from "../utils/simple-auth-context";
import { orderManagementService, CompletedOrder, OrderFilterParams } from "../utils/orderManagementService";
import { colors as designColors } from "../utils/designSystem";
import { globalColors, effects } from "../utils/QSAIDesign";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DetailedOrderDialog } from "./DetailedOrderDialog";
import { RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";
import { POSViewProps } from "./POSViewContainer";

interface OnlineOrdersPanelProps extends POSViewProps {
  autoApproveEnabled?: boolean;
  onAutoApproveToggle?: (enabled: boolean) => void;
}

/**
 * Online Orders Panel component for integration into the POS page.
 * Provides website order management functionality directly in the POS interface.
 */
export function OnlineOrdersPanel({ onBack, autoApproveEnabled = false, onAutoApproveToggle }: OnlineOrdersPanelProps) {
  // State for panel layout and order management
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [newOrderNotification, setNewOrderNotification] = useState(false);
  
  // Auto-approve orders setting
  const [autoApprove, setAutoApprove] = useState(autoApproveEnabled);
  
  // Filters specifically for Online orders from website and app
  const [filters] = useState<OrderFilterParams>({
    order_source: 'ONLINE',
    status: 'NEW' // Focus on new orders in the POS panel
  });
  
  // Fetch orders on component mount and when refreshed
  useEffect(() => {
    fetchOrders();
    
    // Listen for manual refresh requests
    const handleRefreshOrders = () => {
      console.log('OnlineOrdersPanel: Manual refresh requested');
      fetchOrders();
    };
    
    document.addEventListener('refresh-online-orders', handleRefreshOrders as EventListener);
    
    // Set up automatic refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    return () => {
      document.removeEventListener('refresh-online-orders', handleRefreshOrders as EventListener);
      clearInterval(refreshInterval);
    };
  }, []);
  
  // Handle auto-approve toggle
  const handleAutoApproveToggle = (value: boolean) => {
    setAutoApprove(value);
    if (onAutoApproveToggle) {
      onAutoApproveToggle(value);
    }
    toast.success(`Auto-approve ${value ? 'enabled' : 'disabled'} for Website orders`);
  };
  
  // Fetch orders with current filters
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const result = await orderManagementService.getOrders(1, 20, filters);
      setOrders(result.orders);
      setTotalCount(result.totalCount);
      
      // Check for new orders
      const newOrders = result.orders.filter(order => order.status === 'NEW');
      if (newOrders.length > 0) {
        setNewOrderNotification(true);
        // Play notification sound for new orders
        const audio = new Audio('/assets/notification.mp3');
        audio.play().catch(e => console.log('Audio playback prevented:', e));
      }
    } catch (error) {
      console.error('Error fetching website orders:', error);
      toast.error('Failed to load Website orders');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear notification when user interacts with the panel
  const clearNotification = () => {
    setNewOrderNotification(false);
  };
  
  // Handle order approval
  const handleApproveOrder = async (orderId: string) => {
    try {
      // Update order status to 'CONFIRMED' using the new tracking system
      const response = await apiClient.update_order_tracking_status({
        order_id: orderId,
        new_status: 'CONFIRMED',
        staff_id: profile?.id || 'pos-staff',
        notes: 'Order approved by POS staff'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Order ${orderId} approved and sent to kitchen`);
        
        // Trigger printing of FOH and kitchen tickets
        toast.success(`Printing tickets for order ${orderId}`);
        
        // Refresh orders list
        fetchOrders();
      } else {
        toast.error(`Failed to approve order: ${result.message}`);
      }
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
    }
  };
  
  // Handle selecting an order for the detail panel
  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.order_id === orderId);
    setSelectedOrderId(orderId);
    setSelectedOrder(order || null);
  };

  // Handle order approval action
  const handleApproveAction = async (orderId: string) => {
    await handleApproveOrder(orderId);
  };

  // Handle order rejection action
  const handleRejectAction = async (orderId: string) => {
    try {
      const response = await apiClient.update_order_tracking_status({
        order_id: orderId,
        new_status: 'CANCELLED',
        staff_id: profile?.id || 'pos-staff',
        notes: 'Order rejected by POS staff'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Order ${orderId} rejected`);
        fetchOrders();
      } else {
        toast.error(`Failed to reject order: ${result.message}`);
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Failed to reject order');
    }
  };

  // Handle order processing action
  const handleProcessAction = async (orderId: string) => {
    try {
      const response = await apiClient.update_order_tracking_status({
        order_id: orderId,
        new_status: 'PREPARING',
        staff_id: profile?.id || 'pos-staff',
        notes: 'Order is being prepared'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Order ${orderId} is being processed`);
        fetchOrders();
      } else {
        toast.error(`Failed to update order: ${result.message}`);
      }
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    }
  };

  // Handle order completion action
  const handleCompleteAction = async (orderId: string) => {
    try {
      const response = await apiClient.update_order_tracking_status({
        order_id: orderId,
        new_status: 'READY',
        staff_id: profile?.id || 'pos-staff',
        notes: 'Order ready for collection/delivery'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Order ${orderId} completed and ready`);
        fetchOrders();
      } else {
        toast.error(`Failed to complete order: ${result.message}`);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order');
    }
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

  return (
    <div className="h-full" onClick={clearNotification}>
      {/* Detailed Order Dialog */}
      <DetailedOrderDialog
        order={selectedOrder}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        orderSource="WEBSITE"
      />
      
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold" style={{ 
            background: `linear-gradient(to right, #FFFFFF, ${globalColors.purple.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 20px rgba(124, 93, 250, 0.3)'
          }}>
            Website Orders
          </h2>
          <p className="text-sm" style={{ color: designColors.text.secondary }}>
            {totalCount} new online order{totalCount !== 1 ? 's' : ''} waiting for approval
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-approve-online" 
              checked={autoApprove}
              onCheckedChange={handleAutoApproveToggle}
            />
            <Label htmlFor="auto-approve-online" className="cursor-pointer text-sm" style={{ color: designColors.text.secondary }}>
              Auto-Approve
            </Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="h-8 px-2"
            style={{ 
              backgroundColor: designColors.background.secondary, 
              borderColor: `${globalColors.purple.primary}40`,
              color: designColors.text.primary
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Orders panel with notification indicator */}
      <Card className={`mb-4 ${newOrderNotification ? 'ring-2 ring-blue-500 shadow-blue-500/10' : ''}`}
        style={{
          background: newOrderNotification 
            ? `linear-gradient(145deg, rgba(21, 25, 42, 0.7) 0%, rgba(21, 25, 42, 0.8) 100%)` 
            : `linear-gradient(145deg, ${designColors.background.tertiary} 0%, ${designColors.background.secondary} 100%)`,
          backdropFilter: 'blur(4px)',
          border: `1px solid ${globalColors.purple.primary}20`,
          boxShadow: `0 8px 16px rgba(0, 0, 0, 0.12), ${effects.outerGlow('subtle')}`
        }}
      >
        {/* Three-panel layout for order management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-[calc(100vh-220px)]">
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
                  setDetailDialogOpen(true);
                }
              }}
              onViewInAllOrders={(orderId) => {
                navigate(`/all-orders?orderId=${orderId}`);
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
              onEditInPos={(order) => {
                // TODO: Complete POS integration - Currently causes routing error
                // Extract order details and move to POS
                // const orderType = order.order_type.toUpperCase() === 'DELIVERY' ? 'DELIVERY' : 'COLLECTION';
                
                // DISABLED: This navigate call with state parameter causes "Cannot convert object to primitive value" error
                // navigate('/pos', {
                //   state: {
                //     loadOrder: order
                //   }
                // });
                
                toast.info(`Order editing in POS - feature under development`);
              }}
              className="h-full"
            />
          </div>
        </div>
      </Card>
      
      {/* Footer with notification count if needed */}
      {newOrderNotification && (
        <div className="fixed bottom-4 right-4 animate-pulse">
          <div className="bg-blue-600 text-white rounded-full px-4 py-2 flex items-center shadow-lg">
            <Bell className="h-4 w-4 mr-2" />
            New Website orders require attention
          </div>
        </div>
      )}
    </div>
  );
}
