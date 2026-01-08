
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Truck, ChefHat, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeDate } from '../utils';

interface OrderEvent {
  event_id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  created_by?: string;
}

interface Props {
  status: string;
  events?: OrderEvent[];
  estimatedReadyTime?: string;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Order Received',
    icon: Clock,
    color: 'bg-yellow-500',
    description: 'Your order has been received'
  },
  confirmed: {
    label: 'Order Confirmed',
    icon: Check,
    color: 'bg-blue-500',
    description: 'Restaurant has confirmed your order'
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    color: 'bg-orange-500',
    description: 'Your order is being prepared'
  },
  ready: {
    label: 'Ready',
    icon: Package,
    color: 'bg-green-500',
    description: 'Your order is ready'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Car,
    color: 'bg-purple-500',
    description: 'Your order is on its way'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-600',
    description: 'Order delivered successfully'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-600',
    description: 'Order completed'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-500',
    description: 'Order has been cancelled'
  }
};

const getStatusSteps = (orderType: string) => {
  const baseSteps = ['pending', 'confirmed', 'preparing', 'ready'];
  
  if (orderType === 'delivery') {
    return [...baseSteps, 'out_for_delivery', 'delivered'];
  }
  
  return [...baseSteps, 'completed'];
};

export const OrderLifecycleEvents: React.FC<Props> = ({ 
  status, 
  events = [], 
  estimatedReadyTime,
  className 
}) => {
  const orderType = 'collection'; // This should come from order data
  const steps = getStatusSteps(orderType);
  const currentStepIndex = steps.indexOf(status);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary" 
          className={cn(
            'text-white',
            statusConfig[status as keyof typeof statusConfig]?.color || 'bg-gray-500'
          )}
        >
          {statusConfig[status as keyof typeof statusConfig]?.label || status}
        </Badge>
        {estimatedReadyTime && (
          <span className="text-sm text-muted-foreground">
            Est. ready: <SafeDate date={new Date(estimatedReadyTime)} format="time" />
          </span>
        )}
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const config = statusConfig[step as keyof typeof statusConfig];
          const Icon = config?.icon || Clock;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step} className="flex items-center gap-3">
              {/* Step Icon */}
              <div 
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2',
                  isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : isCurrent
                    ? `border-blue-500 ${config?.color || 'bg-blue-500'} text-white`
                    : 'border-gray-300 bg-gray-100 text-gray-400'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              
              {/* Step Content */}
              <div className="flex-1">
                <div 
                  className={cn(
                    'font-medium',
                    isCompleted || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {config?.label || step}
                </div>
                <div className="text-sm text-muted-foreground">
                  {config?.description || step}
                </div>
              </div>
              
              {/* Timestamp if available */}
              {events.find(e => e.event_data?.new_status === step) && (
                <div className="text-xs text-muted-foreground">
                  <SafeDate 
                    date={new Date(
                      events.find(e => e.event_data?.new_status === step)!.created_at
                    )} 
                    format="time" 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Recent Updates</h4>
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => (
              <div key={event.event_id} className="text-xs text-muted-foreground">
                <span className="font-medium">
                  <SafeDate date={new Date(event.created_at)} format="time" />
                </span>
                {' - '}
                {event.event_type.replace('order.', '').replace('_', ' ')}
                {event.event_data?.notes && (
                  <span className="block ml-2 italic">
                    {event.event_data.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderLifecycleEvents;
