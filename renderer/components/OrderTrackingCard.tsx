import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Package, Truck, CheckCircle, XCircle, Phone, MapPin, Wifi, WifiOff } from 'lucide-react';
import { apiClient } from 'app';
import { OrderTrackingDetails } from 'types';
import { subscribeToOrderTracking, unsubscribeFromOrderTracking, isRealtimeConnected, OrderTrackingSubscription } from 'utils/orderTrackingRealtime';

export interface OrderTrackingCardProps {
  orderId: string;
  customerView?: boolean;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
  className?: string;
}

// Order status progression for customer display
const STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Order Confirmed',
    icon: CheckCircle,
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  PREPARING: {
    label: 'Preparing Your Order',
    icon: Package,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  READY: {
    label: 'Ready for Pickup/Delivery',
    icon: Clock,
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    icon: Truck,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  COLLECTED: {
    label: 'Collected',
    icon: CheckCircle,
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50'
  }
};

/**
 * Customer-facing order tracking card that displays real-time order status
 * with progress indicators and estimated times
 */
export function OrderTrackingCard({ 
  orderId, 
  customerView = true, 
  onStatusUpdate, 
  className = '' 
}: OrderTrackingCardProps) {
  const [orderDetails, setOrderDetails] = useState<OrderTrackingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setRefreshing(true);
      const response = await apiClient.get_order_tracking_details({ order_id: orderId });
      const data = await response.json();
      setOrderDetails(data);
      setError(null);
    } catch (err) {
      setError('Failed to load order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Auto-refresh every 30 seconds for active orders
  useEffect(() => {
    if (!customerView || !orderDetails) return;
    
    const isActiveOrder = orderDetails.current_status && 
      !['DELIVERED', 'COLLECTED', 'CANCELLED'].includes(orderDetails.current_status);
    
    if (isActiveOrder) {
      const interval = setInterval(fetchOrderDetails, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [orderDetails, customerView]);

  // Format estimated time
  const formatEstimatedTime = (isoString: string | null) => {
    if (!isoString) return null;
    
    try {
      const estimatedTime = new Date(isoString);
      const now = new Date();
      const diffMs = estimatedTime.getTime() - now.getTime();
      const diffMinutes = Math.ceil(diffMs / (1000 * 60));
      
      if (diffMinutes <= 0) {
        return 'Ready now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        return `${hours}h ${mins}m`;
      }
    } catch (error) {
      return null;
    }
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.CONFIRMED;
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!orderId || !customerView) return;

    const handleRealtimeUpdate = (update: OrderTrackingSubscription) => {
      console.log('Real-time update received:', update);
      
      // Update order details with new status
      setOrderDetails(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          current_status: update.status,
          status_history: [
            ...prev.status_history,
            {
              order_id: update.order_id,
              status: update.status,
              timestamp: update.timestamp,
              staff_id: update.staff_id || null,
              notes: update.notes || null,
              estimated_time: update.estimated_time || null
            }
          ],
          progress_percentage: getProgressPercentage(update.status)
        };
      });
      
      // Call parent callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(orderId, update.status);
      }
    };

    const handleRealtimeError = (error: any) => {
      console.error('Real-time subscription error:', error);
      setRealtimeConnected(false);
    };

    // Subscribe to real-time updates
    const sub = subscribeToOrderTracking(
      orderId,
      handleRealtimeUpdate,
      handleRealtimeError
    );
    
    setSubscription(sub);
    setRealtimeConnected(isRealtimeConnected());

    // Cleanup subscription on unmount
    return () => {
      if (sub) {
        unsubscribeFromOrderTracking(sub);
      }
    };
  }, [orderId, customerView, onStatusUpdate]);

  // Monitor real-time connection status
  useEffect(() => {
    const checkConnection = () => {
      setRealtimeConnected(isRealtimeConnected());
    };
    
    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Get progress percentage based on status
  const getProgressPercentage = (status: string): number => {
    const progressMap: { [key: string]: number } = {
      'CONFIRMED': 15,
      'PREPARING': 50,
      'READY': 75,
      'OUT_FOR_DELIVERY': 90,
      'DELIVERED': 100,
      'COLLECTED': 100,
      'CANCELLED': 0
    };
    return progressMap[status] || 15;
  };

  if (loading) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !orderDetails) {
    return (
      <Card className={`w-full max-w-md mx-auto border-red-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Button 
            variant="outline" 
            onClick={fetchOrderDetails}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(orderDetails.current_status);
  const IconComponent = statusConfig.icon;
  const estimatedTime = formatEstimatedTime(orderDetails.estimated_completion);
  const isDelivery = orderDetails.order_type?.toUpperCase() === 'DELIVERY';
  const isComplete = ['DELIVERED', 'COLLECTED'].includes(orderDetails.current_status);
  const isCancelled = orderDetails.current_status === 'CANCELLED';

  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${className}`}>
      <CardHeader className={`${statusConfig.bgColor} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${statusConfig.color}`}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {statusConfig.label}
              </CardTitle>
              <p className="text-sm text-gray-600">Order #{orderId.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Real-time connection indicator */}
            {realtimeConnected ? (
              <div className="flex items-center space-x-1 text-green-600" title="Real-time updates active">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Live</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-gray-400" title="Real-time updates offline">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
            
            {refreshing && (
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Progress Bar */}
        {!isCancelled && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{orderDetails.progress_percentage}%</span>
            </div>
            <Progress 
              value={orderDetails.progress_percentage} 
              className="h-2"
            />
          </div>
        )}

        {/* Estimated Time */}
        {estimatedTime && !isComplete && !isCancelled && (
          <div className={`p-4 rounded-lg ${statusConfig.bgColor} border border-gray-200`}>
            <div className="flex items-center space-x-2">
              <Clock className={`h-4 w-4 ${statusConfig.textColor}`} />
              <span className="text-sm font-medium text-gray-700">
                Estimated {isDelivery ? 'delivery' : 'ready'} time:
              </span>
            </div>
            <p className={`text-lg font-semibold ${statusConfig.textColor} mt-1`}>
              {estimatedTime}
            </p>
          </div>
        )}

        {/* Order Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Order Type:</span>
            <div className="flex items-center space-x-1">
              {isDelivery ? (
                <Truck className="h-4 w-4 text-gray-500" />
              ) : (
                <MapPin className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm font-medium capitalize">
                {orderDetails.order_type?.toLowerCase()}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Amount:</span>
            <span className="text-sm font-semibold">£{orderDetails.total_amount?.toFixed(2)}</span>
          </div>

          {orderDetails.customer_name && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer:</span>
              <span className="text-sm font-medium">{orderDetails.customer_name}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={fetchOrderDetails}
            disabled={refreshing}
            className="flex-1"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </Button>
          
          {orderDetails.customer_phone && customerView && (
            <Button 
              variant="outline"
              onClick={() => window.open(`tel:${orderDetails.customer_phone}`, '_self')}
              className="flex items-center space-x-1"
            >
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </Button>
          )}
        </div>

        {/* Status History */}
        {orderDetails.status_history && orderDetails.status_history.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Order Timeline</h4>
            <div className="space-y-2">
              {orderDetails.status_history.slice(-3).map((history, index) => {
                const historyConfig = getStatusConfig(history.status);
                const HistoryIcon = historyConfig.icon;
                
                return (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                    <div className={`p-1 rounded-full ${historyConfig.color}`}>
                      <HistoryIcon className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{historyConfig.label}</span>
                      {history.notes && (
                        <p className="text-gray-500 text-xs mt-1">{history.notes}</p>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs">
                      {new Date(history.timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderTrackingCard;
