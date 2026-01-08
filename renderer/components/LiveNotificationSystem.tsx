import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, Clock, CheckCircle, AlertCircle, Car, ChefHat } from 'lucide-react';
import { useOrderTracking } from '../utils/orderTracking';

interface Props {
  userId?: string;
  enabled?: boolean;
}

export const LiveNotificationSystem: React.FC<Props> = ({ 
  userId, 
  enabled = true 
}) => {
  const { 
    orders, 
    connectionStatus, 
    lastEvent 
  } = useOrderTracking({ userId, enabled });

  // Handle real-time order events
  useEffect(() => {
    if (!lastEvent || !enabled) return;

    const { eventType, orderData, previousData } = lastEvent;
    const order = orderData;

    // Order lifecycle notifications
    switch (eventType) {
      case 'INSERT':
        if (order.order_source === 'online') {
          toast.success(
            `Order ${order.order_number} placed successfully!`,
            {
              description: `Total: £${order.total} • ${order.order_type}`,
              icon: <CheckCircle className="h-4 w-4" />,
              duration: 5000,
            }
          );
        }
        break;

      case 'UPDATE':
        handleStatusChangeNotification(order, previousData);
        break;

      default:
        break;
    }
  }, [lastEvent, enabled]);

  // Handle connection status changes
  useEffect(() => {
    if (!enabled) return;

    if (connectionStatus === 'connected') {
      toast.success('Live order tracking connected', {
        description: 'You\'ll receive real-time updates',
        icon: <Bell className="h-4 w-4" />,
        duration: 3000,
      });
    } else if (connectionStatus === 'disconnected') {
      toast.error('Live tracking disconnected', {
        description: 'Trying to reconnect...',
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 5000,
      });
    }
  }, [connectionStatus, enabled]);

  const handleStatusChangeNotification = (order: any, previousData?: any) => {
    const status = order.status;
    const orderRef = order.order_number || order.order_id?.slice(0, 8);

    switch (status) {
      case 'confirmed':
        toast.info(
          `Order ${orderRef} confirmed!`,
          {
            description: 'Your order has been accepted by the restaurant',
            icon: <CheckCircle className="h-4 w-4" />,
            duration: 4000,
          }
        );
        break;

      case 'preparing':
        toast.info(
          `Order ${orderRef} is being prepared`,
          {
            description: 'Our chefs are working on your order',
            icon: <ChefHat className="h-4 w-4" />,
            duration: 4000,
          }
        );
        break;

      case 'ready':
        if (order.order_type === 'collection') {
          toast.success(
            `Order ${orderRef} ready for collection!`,
            {
              description: 'Your order is ready to be collected',
              icon: <Bell className="h-4 w-4" />,
              duration: 6000,
            }
          );
        } else {
          toast.success(
            `Order ${orderRef} ready for delivery!`,
            {
              description: 'Your order is ready and will be dispatched soon',
              icon: <Bell className="h-4 w-4" />,
              duration: 6000,
            }
          );
        }
        break;

      case 'out_for_delivery':
        toast.info(
          `Order ${orderRef} out for delivery`,
          {
            description: 'Your order is on its way!',
            icon: <Car className="h-4 w-4" />,
            duration: 5000,
          }
        );
        break;

      case 'delivered':
      case 'completed':
        toast.success(
          `Order ${orderRef} completed!`,
          {
            description: 'Thank you for your order. Enjoy your meal!',
            icon: <CheckCircle className="h-4 w-4" />,
            duration: 6000,
          }
        );
        break;

      case 'cancelled':
        toast.error(
          `Order ${orderRef} cancelled`,
          {
            description: 'Your order has been cancelled',
            icon: <AlertCircle className="h-4 w-4" />,
            duration: 5000,
          }
        );
        break;

      default:
        // Generic status change notification
        if (previousData && previousData.status !== status) {
          toast.info(
            `Order ${orderRef} status updated`,
            {
              description: `Status changed to ${status.replace('_', ' ')}`,
              icon: <Clock className="h-4 w-4" />,
              duration: 3000,
            }
          );
        }
        break;
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default LiveNotificationSystem;