

import { useState, useEffect } from "react";
import { OrderQueuePanel } from "./OrderQueuePanel";
import { OrderDetailPanel } from "./OrderDetailPanel";
import { OrderActionPanel } from "./OrderActionPanel";
import { RejectionReasonModal } from "./RejectionReasonModal";
import { PartialAcceptModal } from "./PartialAcceptModal";
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
import brain from 'brain';
import { OrderStatus } from '../brain/data-contracts';

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

  // Rejection modal state
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<CompletedOrder | null>(null);

  // Partial accept modal state
  const [partialAcceptModalOpen, setPartialAcceptModalOpen] = useState(false);
  const [orderToPartialAccept, setOrderToPartialAccept] = useState<CompletedOrder | null>(null);
  
  // Auto-approve orders setting
  const [autoApprove, setAutoApprove] = useState(autoApproveEnabled);
  
  // Filters specifically for Online orders from website and app
  const [filters] = useState<OrderFilterParams>({
    order_source: 'ONLINE',
  });

  // Fetch orders on component mount and when refreshed
  useEffect(() => {
    fetchOrders();
    
    // Listen for manual refresh requests
    const handleRefreshOrders = () => {
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
      
      // Check for new orders or orders awaiting acceptance
      const pendingOrders = result.orders.filter(
        order => order.status === 'NEW' || order.status === 'AWAITING_ACCEPT'
      );
      if (pendingOrders.length > 0) {
        setNewOrderNotification(true);
        // Play notification sound for new orders
        const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
        const soundPath = isElectron
          ? './audio-sounds/online_order_notification_sound_pos.mp3'
          : '/audio-sounds/online_order_notification_sound_pos.mp3';
        const audio = new Audio(soundPath);
        audio.play().catch(() => {
          // Audio playback failed, possibly due to autoplay restrictions
        });
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
      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: OrderStatus.CONFIRMED,
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

  // Handle order approval/acceptance action
  const handleApproveAction = async (orderId: string) => {
    try {
      // Call the new accept endpoint which handles status update, printing, and logging
      const response = await fetch('/routes/order-acceptance/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          staff_id: user?.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Order accepted and sent to kitchen`);
        if (result.print_triggered) {
          toast.success('Kitchen tickets printed');
        }
        fetchOrders();
      } else {
        // Fallback to legacy method if new endpoint fails
        console.warn('New accept endpoint failed, using fallback:', result);
        await handleApproveOrder(orderId);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      // Fallback to legacy method
      await handleApproveOrder(orderId);
    }
  };

  // Handle order rejection action - opens the rejection modal
  const handleRejectAction = async (orderId: string) => {
    const order = orders.find(o => o.order_id === orderId);
    if (order) {
      setOrderToReject(order);
      setRejectionModalOpen(true);
    }
  };

  // Handle rejection confirmation from modal
  const handleConfirmRejection = async (reasonId: string, note?: string) => {
    if (!orderToReject) return;

    const response = await fetch('/routes/order-acceptance/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderToReject.order_id,
        staff_id: user?.id,
        reason_id: reasonId,
        note: note,
        initiate_refund: true,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to reject order');
    }

    toast.success(`Order ${orderToReject.order_id} rejected`);
    if (result.refund_initiated) {
      toast.info('Refund has been initiated');
    }
    fetchOrders();
  };

  // Handle accept with changes action - opens the partial accept modal
  const handleAcceptWithChangesAction = (orderId: string) => {
    const order = orders.find(o => o.order_id === orderId);
    if (order) {
      setOrderToPartialAccept(order);
      setPartialAcceptModalOpen(true);
    }
  };

  // Handle partial accept confirmation from modal
  const handleConfirmPartialAccept = async (
    removedItems: { item_id: string; name: string; quantity: number; price: number }[],
    modifiedItems: { item_id: string; name: string; original_quantity: number; new_quantity: number; price: number }[],
    refundAmount: number
  ) => {
    if (!orderToPartialAccept) return;

    const response = await fetch('/routes/order-acceptance/accept-with-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderToPartialAccept.order_id,
        staff_id: user?.id,
        removed_items: removedItems,
        modified_items: modifiedItems,
        refund_amount: refundAmount,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to accept order with changes');
    }

    toast.success(`Order accepted with changes`);
    if (result.refund_initiated) {
      toast.info(`Partial refund of £${refundAmount.toFixed(2)} initiated`);
    }
    if (result.print_triggered) {
      toast.success('Kitchen tickets printed');
    }
    setPartialAcceptModalOpen(false);
    setOrderToPartialAccept(null);
    fetchOrders();
  };

  // Handle order processing action
  const handleProcessAction = async (orderId: string) => {
    try {
      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: OrderStatus.PREPARING,
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
      const response = await brain.update_order_tracking_status({
        order_id: orderId,
        new_status: OrderStatus.READY,
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
        order={selectedOrder as any}
        isOpen={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        orderSource="WEBSITE"
      />

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setOrderToReject(null);
        }}
        onConfirm={handleConfirmRejection}
        orderNumber={orderToReject?.order_id}
        orderTotal={orderToReject?.total || orderToReject?.total_amount}
      />

      {/* Partial Accept Modal */}
      <PartialAcceptModal
        isOpen={partialAcceptModalOpen}
        onClose={() => {
          setPartialAcceptModalOpen(false);
          setOrderToPartialAccept(null);
        }}
        onConfirm={handleConfirmPartialAccept}
        orderNumber={orderToPartialAccept?.order_number || orderToPartialAccept?.order_id?.slice(0, 8)}
        orderTotal={orderToPartialAccept?.total || orderToPartialAccept?.total_amount || 0}
        items={orderToPartialAccept?.items || []}
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
            {(() => {
              const awaitingCount = orders.filter(o => o.status === 'NEW' || o.status === 'AWAITING_ACCEPT').length;
              return awaitingCount > 0
                ? `${awaitingCount} order${awaitingCount !== 1 ? 's' : ''} awaiting acceptance`
                : `${totalCount} online order${totalCount !== 1 ? 's' : ''}`;
            })()}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-[calc(100dvh-220px)]">
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
              onAcceptWithChanges={handleAcceptWithChangesAction}
              onProcess={handleProcessAction}
              onComplete={handleCompleteAction}
              onCallCustomer={handleCallCustomer}
              onTextCustomer={handleTextCustomer}
              onEditInPos={(order) => {
                // Store order ID in sessionStorage to avoid navigate state serialization issues
                sessionStorage.setItem('posLoadOrderId', order.id);
                toast.info(`Loading order #${order.order_number || order.id.slice(0, 8)} in POS...`);
                navigate('/pos');
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
