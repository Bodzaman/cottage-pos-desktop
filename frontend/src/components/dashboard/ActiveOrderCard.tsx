import React from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, HelpCircle, MapPin, ChefHat, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PremiumCard } from 'components/PremiumCard';
import { PortalButton } from 'components/PortalButton';
import { cn } from 'utils/cn';

interface ActiveOrderCardProps {
  order: {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    order_type: string;
    estimated_ready_time?: string;
    created_at: string;
    order_items?: Array<{
      menu_item_name: string;
      quantity: number;
      image_url?: string;
    }>;
  };
  onTrack?: () => void;
  onHelp?: () => void;
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse?: boolean;
}> = {
  pending: {
    label: 'Order Received',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
  confirmed: {
    label: 'Confirmed',
    icon: Package,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  preparing: {
    label: 'Being Prepared',
    icon: ChefHat,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    pulse: true,
  },
  ready: {
    label: 'Ready for Pickup',
    icon: Package,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  on_the_way: {
    label: 'Out for Delivery',
    icon: Truck,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    pulse: true,
  },
};

export function ActiveOrderCard({ order, onTrack, onHelp }: ActiveOrderCardProps) {
  const navigate = useNavigate();
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleTrack = () => {
    if (onTrack) {
      onTrack();
    } else {
      navigate('/customer-portal#orders');
    }
  };

  const handleHelp = () => {
    if (onHelp) {
      onHelp();
    }
  };

  // Calculate ETA display
  const getEtaDisplay = () => {
    if (order.status === 'ready') {
      return order.order_type === 'delivery' ? 'Ready for delivery' : 'Ready for pickup';
    }
    if (order.estimated_ready_time) {
      const eta = new Date(order.estimated_ready_time);
      const now = new Date();
      const diffMs = eta.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins > 0) {
        return `~${diffMins} min`;
      }
    }
    return order.order_type === 'delivery' ? 'Arriving soon' : 'Almost ready';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PremiumCard
        subsurface
        className={cn(
          'overflow-hidden',
          'border-l-4',
          config.borderColor.replace('border-', 'border-l-')
        )}
      >
        <div className="p-4 md:p-5">
          {/* Header: Status + Order Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Status Icon with optional pulse */}
              <div className={cn(
                'p-2.5 rounded-xl',
                config.bgColor,
                config.pulse && 'animate-pulse'
              )}>
                <StatusIcon className={cn('h-5 w-5', config.color)} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-semibold',
                    config.color
                  )}>
                    {config.label}
                  </span>
                  {config.pulse && (
                    <span className="relative flex h-2 w-2">
                      <span className={cn(
                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                        config.bgColor
                      )}></span>
                      <span className={cn(
                        'relative inline-flex rounded-full h-2 w-2',
                        config.bgColor
                      )}></span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Order #{order.order_number}
                </p>
              </div>
            </div>

            {/* ETA / Status Text */}
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {getEtaDisplay()}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {order.order_type}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5 my-3" />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {order.order_items?.length || 0} items · £{order.total_amount?.toFixed(2)}
            </p>

            <div className="flex items-center gap-2">
              <PortalButton
                variant="secondary"
                size="sm"
                onClick={handleHelp}
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </PortalButton>
              <PortalButton
                variant="primary"
                size="sm"
                onClick={handleTrack}
              >
                <MapPin className="h-4 w-4" />
                Track
              </PortalButton>
            </div>
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

export default ActiveOrderCard;
