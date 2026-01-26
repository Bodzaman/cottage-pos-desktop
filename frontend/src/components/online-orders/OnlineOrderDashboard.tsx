/**
 * OnlineOrderDashboard Component
 * Main container for the redesigned online order management system
 * Features: Kanban layout, realtime updates, timeout handling, sound alerts
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  ArrowLeft,
  Bell,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OnlineOrderKanban } from './OnlineOrderKanban';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { RejectOrderModal } from './RejectOrderModal';
import {
  useOnlineOrdersRealtimeStore,
  OnlineOrder,
} from 'utils/stores/onlineOrdersRealtimeStore';
import { supabase } from 'utils/supabaseClient';

interface OnlineOrderDashboardProps {
  onBack?: () => void;
}

export function OnlineOrderDashboard({ onBack }: OnlineOrderDashboardProps) {
  // Store state
  const {
    orders,
    isLoading,
    connectionStatus,
    soundEnabled,
    fetchOrders,
    acceptOrder,
    rejectOrder,
    markReady,
    markComplete,
    initializeRealtime,
    cleanup,
    setSoundEnabled,
    newOrders,
    preparingOrders,
    readyOrders,
    urgentOrders,
  } = useOnlineOrdersRealtimeStore();

  // Local state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize realtime on mount
  useEffect(() => {
    initializeRealtime();

    return () => {
      cleanup();
    };
  }, [initializeRealtime, cleanup]);

  // Get selected order
  const selectedOrder = selectedOrderId ? orders[selectedOrderId] : null;

  // Get the order being rejected (for modal)
  const rejectingOrder = orderToReject ? orders[orderToReject] : null;

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    toast.success('Orders refreshed');
  }, [fetchOrders]);

  const handleViewDetails = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  }, []);

  const handleAccept = useCallback(async (orderId: string) => {
    setIsActionLoading(true);
    try {
      const success = await acceptOrder(orderId);
      if (success) {
        toast.success('Order accepted and sent to kitchen');
        // Create print job for kitchen ticket
        try {
          const order = orders[orderId];
          if (order) {
            await supabase.rpc('create_print_job', {
              p_job_type: 'KITCHEN_TICKET',
              p_order_data: {
                orderNumber: order.orderNumber,
                orderType: order.orderType,
                items: order.items,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                deliveryAddress: order.deliveryAddress,
                specialInstructions: order.specialInstructions,
                allergenNotes: order.allergenNotes,
              },
              p_printer_id: null,
              p_priority: 3,
            });
          }
        } catch (printError) {
          console.error('Failed to create print job:', printError);
        }
      } else {
        toast.error('Failed to accept order');
      }
    } finally {
      setIsActionLoading(false);
      setIsDrawerOpen(false);
    }
  }, [acceptOrder, orders]);

  const handleRejectClick = useCallback((orderId: string) => {
    setOrderToReject(orderId);
    setIsRejectModalOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(async (reason: string) => {
    if (!orderToReject) return;

    setIsActionLoading(true);
    try {
      const success = await rejectOrder(orderToReject, reason);
      if (success) {
        toast.success('Order rejected and customer notified');
      } else {
        toast.error('Failed to reject order');
      }
    } finally {
      setIsActionLoading(false);
      setIsRejectModalOpen(false);
      setOrderToReject(null);
      setIsDrawerOpen(false);
    }
  }, [orderToReject, rejectOrder]);

  const handleMarkReady = useCallback(async (orderId: string) => {
    setIsActionLoading(true);
    try {
      const success = await markReady(orderId);
      if (success) {
        toast.success('Order marked as ready');
      } else {
        toast.error('Failed to update order');
      }
    } finally {
      setIsActionLoading(false);
      setIsDrawerOpen(false);
    }
  }, [markReady]);

  const handleComplete = useCallback(async (orderId: string) => {
    setIsActionLoading(true);
    try {
      const success = await markComplete(orderId);
      if (success) {
        const order = orders[orderId];
        toast.success(
          order?.orderType === 'DELIVERY'
            ? 'Order dispatched'
            : 'Order collected'
        );
        // Create print job for customer receipt
        try {
          if (order) {
            await supabase.rpc('create_print_job', {
              p_job_type: 'CUSTOMER_RECEIPT',
              p_order_data: {
                orderNumber: order.orderNumber,
                orderType: order.orderType,
                items: order.items,
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                total: order.total,
                customerName: order.customerName,
                paymentStatus: order.paymentStatus,
              },
              p_printer_id: null,
              p_priority: 5,
            });
          }
        } catch (printError) {
          console.error('Failed to create print job:', printError);
        }
      } else {
        toast.error('Failed to complete order');
      }
    } finally {
      setIsActionLoading(false);
      setIsDrawerOpen(false);
    }
  }, [markComplete, orders]);

  const handlePrint = useCallback(async (orderId: string) => {
    const order = orders[orderId];
    if (!order) return;

    try {
      await supabase.rpc('create_print_job', {
        p_job_type: 'CUSTOMER_RECEIPT',
        p_order_data: {
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          items: order.items,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryAddress: order.deliveryAddress,
        },
        p_printer_id: null,
        p_priority: 5,
      });
      toast.success('Print job created');
    } catch (error) {
      console.error('Failed to print:', error);
      toast.error('Failed to print receipt');
    }
  }, [orders]);

  // Count stats
  const newCount = newOrders().length;
  const preparingCount = preparingOrders().length;
  const readyCount = readyOrders().length;
  const urgentCount = urgentOrders().length;
  const totalActive = newCount + preparingCount + readyCount;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold">Online Orders</h1>
            <p className="text-sm text-muted-foreground">
              {totalActive} active order{totalActive !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Urgent Orders Alert */}
          {urgentCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <Bell className="w-3 h-3 mr-1" />
              {urgentCount} urgent
            </Badge>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-1.5">
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Live</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span className="text-sm text-yellow-600">Connecting</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Offline</span>
              </>
            )}
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
            <Label htmlFor="sound-toggle" className="cursor-pointer">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </Label>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
            {newCount} New
          </Badge>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-600">
            {preparingCount} Preparing
          </Badge>
          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
            {readyCount} Ready
          </Badge>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        {isLoading && Object.keys(orders).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <OnlineOrderKanban
            newOrders={newOrders()}
            preparingOrders={preparingOrders()}
            readyOrders={readyOrders()}
            onAccept={handleAccept}
            onReject={handleRejectClick}
            onMarkReady={handleMarkReady}
            onComplete={handleComplete}
            onViewDetails={handleViewDetails}
            isActionLoading={isActionLoading}
          />
        )}
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedOrderId(null);
        }}
        onAccept={handleAccept}
        onReject={handleRejectClick}
        onMarkReady={handleMarkReady}
        onComplete={handleComplete}
        onPrint={handlePrint}
        isActionLoading={isActionLoading}
      />

      {/* Reject Order Modal */}
      <RejectOrderModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setOrderToReject(null);
        }}
        onConfirm={handleRejectConfirm}
        orderNumber={rejectingOrder?.orderNumber}
        isLoading={isActionLoading}
      />
    </div>
  );
}

export default OnlineOrderDashboard;
