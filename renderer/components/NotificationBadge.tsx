import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellRing,
  Check,
  X,
  AlertTriangle,
  Clock,
  ChefHat,
  Truck,
  DollarSign,
  Eye
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient } from 'app';
import { toast } from 'sonner';
import { playNewOrderSound, playUrgentAlertSound } from 'utils/soundNotifications';

// Types
interface RealTimeNotification {
  notification_id: string;
  order_id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  sound_alert: boolean;
  user_id?: string;
  role_target?: string;
  created_at: string;
  read_at?: string;
  acknowledged_at?: string;
  data?: any;
}

interface NotificationStats {
  total_unread: number;
  urgent_count: number;
  recent_notifications: RealTimeNotification[];
  notifications_by_type: Record<string, number>;
}

interface Props {
  userId?: string;
  roleTarget?: string;
  autoRefresh?: boolean;
  soundEnabled?: boolean;
  className?: string;
}

// Notification type configuration
const getNotificationConfig = (type: string) => {
  const configs = {
    new_order: {
      icon: Bell,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      label: 'New Order'
    },
    status_change: {
      icon: Clock,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      label: 'Status Update'
    },
    urgent_alert: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      label: 'Urgent Alert'
    },
    order_ready: {
      icon: ChefHat,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      label: 'Order Ready'
    },
    payment_update: {
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      label: 'Payment Update'
    },
    delivery_update: {
      icon: Truck,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      label: 'Delivery Update'
    }
  };
  
  return configs[type as keyof typeof configs] || {
    icon: Bell,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    label: 'Notification'
  };
};

// Priority colors
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'text-red-400 bg-red-500/10';
    case 'high': return 'text-orange-400 bg-orange-500/10';
    case 'normal': return 'text-blue-400 bg-blue-500/10';
    case 'low': return 'text-gray-400 bg-gray-500/10';
    default: return 'text-gray-400 bg-gray-500/10';
  }
};

// Format time ago
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default function NotificationBadge({ 
  userId, 
  roleTarget = 'staff', 
  autoRefresh = true, 
  soundEnabled = true,
  className = ''
}: Props) {
  // State
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  
  // Load notification stats
  const loadNotificationStats = async () => {
    try {
      const params: any = {};
      if (userId) params.user_id = userId;
      if (roleTarget) params.role_target = roleTarget;
      
      const response = await apiClient.get_realtime_notification_stats(params);
      
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
        
        // Check for new notifications and play sound
        if (soundEnabled && statsData.total_unread > lastNotificationCount && lastNotificationCount > 0) {
          const newNotificationCount = statsData.total_unread - lastNotificationCount;
          
          // Play appropriate sound based on urgency
          if (statsData.urgent_count > 0) {
            await playUrgentAlertSound();
          } else {
            await playNewOrderSound();
          }
          
          // Show toast notification
          toast.info(`${newNotificationCount} new notification(s)`);
        }
        
        setLastNotificationCount(statsData.total_unread);
      }
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };
  
  // Load detailed notifications
  const loadNotifications = async () => {
    try {
      const params: any = {
        limit: 20
      };
      if (userId) params.user_id = userId;
      if (roleTarget) params.role_target = roleTarget;
      
      const response = await apiClient.get_realtime_notifications(params);
      
      if (response.ok) {
        const notificationData = await response.json();
        setNotifications(notificationData);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mark notifications as read
  const markNotificationsAsRead = async (notificationIds: string[]) => {
    try {
      const response = await apiClient.mark_realtime_notifications({
        notification_ids: notificationIds,
        action: 'read'
      });
      
      if (response.ok) {
        // Refresh data
        await Promise.all([
          loadNotificationStats(),
          loadNotifications()
        ]);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.notification_id);
    
    if (unreadIds.length > 0) {
      await markNotificationsAsRead(unreadIds);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification: RealTimeNotification) => {
    // Mark as read if not already read
    if (!notification.read_at) {
      await markNotificationsAsRead([notification.notification_id]);
    }
    
    // Handle notification-specific actions
    if (notification.order_id) {
      // Could navigate to order details page
      toast.info(`Viewing order ${notification.order_id.slice(-6)}`);
    }
  };
  
  // Initial load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadNotificationStats(),
        loadNotifications()
      ]);
    };
    
    loadData();
  }, [userId, roleTarget]);
  
  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadNotificationStats();
      if (isOpen) {
        loadNotifications();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);
  
  // Load notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);
  
  if (loading || !stats) {
    return (
      <Button variant="outline" size="sm" className={`relative ${className}`} disabled>
        <Bell className="w-4 h-4" />
      </Button>
    );
  }
  
  const hasUnread = stats.total_unread > 0;
  const hasUrgent = stats.urgent_count > 0;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`relative ${className} ${
            hasUrgent ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30' : 
            hasUnread ? 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30' : 
            'bg-gray-700 border-gray-600 hover:bg-gray-600'
          } text-white transition-all duration-200`}
        >
          {hasUrgent ? (
            <BellRing className={`w-4 h-4 ${hasUrgent ? 'animate-pulse text-red-400' : 'text-white'}`} />
          ) : (
            <Bell className={`w-4 h-4 ${hasUnread ? 'text-blue-400' : 'text-white'}`} />
          )}
          
          {/* Notification Badge */}
          {hasUnread && (
            <Badge 
              className={`absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs font-bold ${
                hasUrgent ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              {stats.total_unread > 99 ? '99+' : stats.total_unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 bg-gray-800 border-gray-700" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={markAllAsRead}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Mark All Read
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Stats Summary */}
            <div className="flex gap-4 text-sm">
              <div className="text-gray-300">
                <span className="text-white font-medium">{stats.total_unread}</span> unread
              </div>
              {stats.urgent_count > 0 && (
                <div className="text-red-400">
                  <span className="font-medium">{stats.urgent_count}</span> urgent
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="space-y-0">
                {notifications.map((notification, index) => {
                  const config = getNotificationConfig(notification.notification_type);
                  const IconComponent = config.icon;
                  const isUnread = !notification.read_at;
                  
                  return (
                    <div key={notification.notification_id}>
                      <div 
                        className={`p-4 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                          isUnread ? 'bg-gray-700/30' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`rounded-full p-2 ${config.bgColor}`}>
                            <IconComponent className={`w-4 h-4 ${config.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm font-medium ${
                                isUnread ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </h4>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`text-xs px-2 py-0.5 ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                                
                                {isUnread && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-400 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{config.label}</span>
                              <span>{formatTimeAgo(notification.created_at)}</span>
                            </div>
                            
                            {notification.order_id && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2 text-blue-400 border-blue-400/50 hover:bg-blue-400/10"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Order #{notification.order_id.slice(-6)}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {index < notifications.length - 1 && (
                        <Separator className="bg-gray-700" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
