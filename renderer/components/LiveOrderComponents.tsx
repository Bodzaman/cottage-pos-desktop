
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Bell, CheckCircle, Truck, Package, Utensils, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedOrder, OrderStatus, OrderEvent } from '../utils/realTimeOrders';
import { SafeDate } from '../utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-500', text: 'Pending', icon: Clock };
      case 'confirmed':
        return { color: 'bg-blue-500', text: 'Confirmed', icon: CheckCircle };
      case 'preparing':
        return { color: 'bg-orange-500', text: 'Preparing', icon: Utensils };
      case 'ready':
        return { color: 'bg-green-500', text: 'Ready', icon: Bell };
      case 'out_for_delivery':
        return { color: 'bg-purple-500', text: 'Out for Delivery', icon: Truck };
      case 'delivered':
        return { color: 'bg-green-600', text: 'Delivered', icon: CheckCircle };
      case 'completed':
        return { color: 'bg-gray-500', text: 'Completed', icon: CheckCircle };
      case 'cancelled':
        return { color: 'bg-red-500', text: 'Cancelled', icon: AlertTriangle };
      case 'refunded':
        return { color: 'bg-red-400', text: 'Refunded', icon: AlertTriangle };
      default:
        return { color: 'bg-gray-400', text: 'Unknown', icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      className={cn(
        'flex items-center gap-1.5 px-3 py-1 text-white font-medium',
        config.color,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
};

interface OrderProgressProps {
  status: OrderStatus;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'collection';
  estimatedTime?: string;
  className?: string;
}

export const OrderProgress: React.FC<OrderProgressProps> = ({ 
  status, 
  orderType, 
  estimatedTime,
  className 
}) => {
  const getProgressSteps = (orderType: string) => {
    const baseSteps = [
      { key: 'pending', label: 'Order Received', description: 'Your order has been received' },
      { key: 'confirmed', label: 'Confirmed', description: 'Restaurant confirmed your order' },
      { key: 'preparing', label: 'Preparing', description: 'Kitchen is preparing your food' },
      { key: 'ready', label: 'Ready', description: 'Your order is ready' },
    ];

    if (orderType === 'delivery') {
      return [
        ...baseSteps,
        { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Driver is on the way' },
        { key: 'delivered', label: 'Delivered', description: 'Order delivered successfully' },
      ];
    } else if (orderType === 'takeaway' || orderType === 'collection') {
      return [
        ...baseSteps,
        { key: 'completed', label: 'Collected', description: 'Order collected successfully' },
      ];
    } else {
      return [
        ...baseSteps,
        { key: 'completed', label: 'Served', description: 'Enjoy your meal!' },
      ];
    }
  };

  const steps = getProgressSteps(orderType);
  const currentStepIndex = steps.findIndex(step => step.key === status);
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const isStepCompleted = (stepIndex: number) => stepIndex <= currentStepIndex;
  const isCurrentStep = (stepIndex: number) => stepIndex === currentStepIndex;

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Order Progress</h3>
            {estimatedTime && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Ready in {estimatedTime}
              </div>
            )}
          </div>
          
          <Progress value={progressPercentage} className="w-full" />
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-start space-x-3">
                <div className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  isStepCompleted(index) 
                    ? 'bg-green-500 text-white' 
                    : isCurrentStep(index)
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                )}>
                  {isStepCompleted(index) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'text-sm font-medium',
                    isStepCompleted(index) || isCurrentStep(index)
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </div>
                  <div className={cn(
                    'text-xs',
                    isStepCompleted(index) || isCurrentStep(index)
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/60'
                  )}>
                    {step.description}
                  </div>
                </div>
                
                {isCurrentStep(index) && (
                  <div className="flex-shrink-0">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface OrderTimelineProps {
  events: OrderEvent[];
  className?: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ events, className }) => {
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('status_changed')) return CheckCircle;
    if (eventType.includes('payment')) return CheckCircle;
    if (eventType.includes('created')) return Bell;
    return Clock;
  };

  const formatEventTime = (timestamp: string) => {
    return <SafeDate date={new Date(timestamp)} format="time" />;
  };

  const getEventDescription = (event: OrderEvent) => {
    switch (event.event_type) {
      case 'order.created':
        return 'Order placed successfully';
      case 'order.status_changed':
        return `Status changed to ${event.event_data.new_status}`;
      case 'payment.processing':
        return 'Payment being processed';
      case 'payment.succeeded':
        return 'Payment confirmed';
      case 'payment.failed':
        return 'Payment failed';
      default:
        return event.event_type.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (events.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
          <p className="text-muted-foreground text-sm">No events yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
        
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.event_type);
            const isLatest = index === 0;
            
            return (
              <div key={event.event_id} className="flex items-start space-x-3">
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  isLatest ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">
                      {getEventDescription(event)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatEventTime(event.created_at)}
                    </div>
                  </div>
                  
                  {event.event_data.notes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.event_data.notes}
                    </div>
                  )}
                  
                  {event.event_data.estimated_ready_time && (
                    <div className="text-xs text-green-600 mt-1">
                      Ready by <SafeDate date={new Date(event.event_data.estimated_ready_time)} format="time" />
                    </div>
                  )}
                </div>
                
                {/* Connecting line */}
                {index < events.length - 1 && (
                  <div className="absolute left-[calc(1.5rem-1px)] mt-8 w-0.5 h-4 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface LiveOrderCardProps {
  order: UnifiedOrder;
  events?: OrderEvent[];
  showTimeline?: boolean;
  showProgress?: boolean;
  className?: string;
}

export const LiveOrderCard: React.FC<LiveOrderCardProps> = ({
  order,
  events = [],
  showTimeline = true,
  showProgress = true,
  className,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  const formatOrderTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstimatedTime = () => {
    if (order.estimated_ready_time) {
      const now = new Date();
      const readyTime = new Date(order.estimated_ready_time);
      const diffMinutes = Math.max(0, Math.ceil((readyTime.getTime() - now.getTime()) / (1000 * 60)));
      
      if (diffMinutes === 0) return 'Ready now';
      if (diffMinutes < 60) return `${diffMinutes} min`;
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return undefined;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Order Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Order #{order.order_number || order.order_id.slice(-6)}</h2>
              <p className="text-sm text-muted-foreground">
                Placed on {formatOrderTime(order.created_at)}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Order Type</p>
              <p className="text-muted-foreground capitalize">{order.order_type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="font-medium">Source</p>
              <p className="text-muted-foreground capitalize">{order.order_source}</p>
            </div>
            <div>
              <p className="font-medium">Total</p>
              <p className="text-muted-foreground font-medium">{formatPrice(order.total)}</p>
            </div>
            <div>
              <p className="font-medium">Payment</p>
              <p className="text-muted-foreground capitalize">
                {order.payment_status || 'Pending'}
              </p>
            </div>
          </div>
          
          {order.delivery_address && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">Delivery Address</p>
              <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
              {order.delivery_instructions && (
                <p className="text-xs text-muted-foreground mt-1">
                  Instructions: {order.delivery_instructions}
                </p>
              )}
            </div>
          )}
          
          {order.special_instructions && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">Special Instructions</p>
              <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Progress */}
      {showProgress && (
        <OrderProgress 
          status={order.status}
          orderType={order.order_type}
          estimatedTime={getEstimatedTime()}
        />
      )}
      
      {/* Order Timeline */}
      {showTimeline && events.length > 0 && (
        <OrderTimeline events={events} />
      )}
      
      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.item_id || index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.variant_name && (
                      <div className="text-sm text-muted-foreground">{item.variant_name}</div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-muted-foreground mt-1">Note: {item.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">x{item.quantity}</div>
                    <div className="text-sm text-muted-foreground">{formatPrice(item.total_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
