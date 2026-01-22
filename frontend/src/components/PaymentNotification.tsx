import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, RefreshCcw, Clock } from 'lucide-react';
import { useInterval } from '../utils/hooks';
import { paymentNotificationService } from '../utils/paymentNotificationService';
import { formatRelativeTime } from '../utils/formatters';

interface Props {
  interval?: number;
  showToast?: boolean;
  maxNotifications?: number;
}

export function PaymentNotification({ 
  interval = 30000, // Default check every 30 seconds
  showToast = true,
  maxNotifications = 3
}: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Function to load notifications
  const loadNotifications = async () => {
    try {
      setRefreshing(true);
      // Use the payment notification service to get notifications
      const notifs = await paymentNotificationService.getNotifications(maxNotifications);
      
      if (notifs.length > 0) {
        setNotifications(notifs);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Load notifications on initial render
  useEffect(() => {
    loadNotifications();
  }, []);
  
  // Set up polling interval
  useInterval(() => {
    loadNotifications();
  }, interval);
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  const getStatusIcon = (notification: any) => {
    const eventType = notification.event_type;
    
    if (eventType === 'payment_intent.succeeded' || eventType === 'payment_succeeded') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (eventType === 'payment_intent.payment_failed' || eventType === 'payment_failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (eventType === 'charge.refunded' || eventType === 'payment_refunded') {
      return <RefreshCcw className="h-5 w-5 text-blue-500" />;
    } else if (eventType === 'test_notification') {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    
    return <Clock className="h-5 w-5 text-gray-400" />;
  };
  
  const getStatusText = (notification: any) => {
    const status = notification.status_update?.status;
    
    if (!status) return 'Unknown';
    
    switch (status) {
      case 'PAYMENT_COMPLETED':
      case 'COMPLETED':
        return <span className="text-green-400">Payment completed</span>;
      case 'PAYMENT_FAILED':
        return <span className="text-red-400">Payment failed</span>;
      case 'REFUNDED':
        return <span className="text-blue-400">Fully refunded</span>;
      case 'PARTIAL_REFUND':
        return <span className="text-blue-400">Partially refunded</span>;
      case 'TEST':
        return <span className="text-yellow-400">Test notification</span>;
      default:
        return <span className="text-gray-400">{status}</span>;
    }
  };
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm flex flex-col items-center">
        <p className="mb-2">No recent payment notifications</p>
        <button 
          onClick={handleRefresh} 
          className="inline-flex items-center text-xs px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
          disabled={refreshing}
        >
          <RefreshCcw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium text-tandoor-platinum">Payment Notifications</h3>
        <button 
          onClick={handleRefresh} 
          className="inline-flex items-center text-xs px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
          disabled={refreshing}
        >
          <RefreshCcw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {notifications.map((notification, index) => (
        <div 
          key={`${notification.order_id}-${notification.timestamp}`}
          className={`p-3 rounded-lg flex items-start gap-3 ${notification.processed ? 'bg-gray-800/30' : 'bg-gray-800/50 border border-tandoor-platinum/10'}`}
        >
          <div className="mt-1">
            {getStatusIcon(notification)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">
                Order #{notification.order_id}
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(notification.timestamp)}
              </div>
            </div>
            <div className="text-sm mt-1">
              {getStatusText(notification)}
              
              {/* Show additional information based on notification type */}
              {notification.status_update?.amount && (
                <div className="text-xs mt-1 text-gray-300">
                  Amount: £{notification.status_update.amount.toFixed(2)}
                </div>
              )}
              {notification.status_update?.amount_refunded && (
                <div className="text-xs mt-1 text-gray-300">
                  Refunded: £{notification.status_update.amount_refunded.toFixed(2)}
                </div>
              )}
              {notification.status_update?.error && (
                <div className="text-xs mt-1 text-red-300">
                  Error: {notification.status_update.error}
                </div>
              )}
              {notification.status_update?.message && (
                <div className="text-xs mt-1 text-gray-300">
                  {notification.status_update.message}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


