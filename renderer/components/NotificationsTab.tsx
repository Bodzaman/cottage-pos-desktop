import React, { useState, useEffect } from 'react';
import { RefreshCcw, CalendarCheck, AlertCircle, CheckCircle, XCircle, Clock, PencilLine, CircleSlash, ThumbsUp } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { formatRelativeTimeWithTooltip } from '../utils/formatRelativeTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// ReservationNotification interface for local use
interface ReservationNotification {
  id: string;
  user_id: string;
  reservation_id: string;
  type: 'confirmation' | 'reminder' | 'cancellation' | 'modification';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reservation?: {
    id: string;
    date: string;
    time: string;
    party_size: number;
    customer_name: string;
    customer_phone: string;
    status: string;
  };
}
import { reservationNotificationService } from '../utils/reservationNotificationService';
import { useNavigate } from 'react-router-dom';

export function NotificationsTab() {
  const { user } = useSimpleAuth();
  const [notifications, setNotifications] = useState<ReservationNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadNotifications();
  }, []);
  
  const loadNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use our notification service instead
      const notificationsData = await reservationNotificationService.getUserNotifications(user.id);
      
      // If we don't have real data yet, use mock data for development
      setNotifications(notificationsData.length > 0 ? notificationsData : generateMockNotifications());
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const markAsRead = async (id: string) => {
    try {
      // Update locally first for responsiveness
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      
      // Then update in database using our service
      await reservationNotificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Update locally first
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      // Then update in database using our service
      await reservationNotificationService.markAllAsRead(user.id);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const getStatusIcon = (notificationType: string) => {
    switch (notificationType) {
      case 'reservation_created':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'reservation_confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'reservation_declined':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'reservation_reminder':
        return <CalendarCheck className="h-5 w-5 text-amber-500" />;
      case 'reservation_canceled':
        return <CircleSlash className="h-5 w-5 text-gray-500" />;
      case 'reservation_modified':
        return <PencilLine className="h-5 w-5 text-purple-500" />;
      case 'reservation_completed':
        return <ThumbsUp className="h-5 w-5 text-teal-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getStatusBadge = (notificationType: string) => {
    switch (notificationType) {
      case 'reservation_created':
        return <Badge variant="outline" className="border-blue-500 text-blue-400">Pending</Badge>;
      case 'reservation_confirmed':
        return <Badge variant="outline" className="border-green-500 text-green-400">Confirmed</Badge>;
      case 'reservation_declined':
        return <Badge variant="outline" className="border-red-500 text-red-400">Declined</Badge>;
      case 'reservation_reminder':
        return <Badge variant="outline" className="border-amber-500 text-amber-400">Reminder</Badge>;
      case 'reservation_canceled':
        return <Badge variant="outline" className="border-gray-500 text-gray-400">Cancelled</Badge>;
      case 'reservation_modified':
        return <Badge variant="outline" className="border-purple-500 text-purple-400">Modified</Badge>;
      case 'reservation_completed':
        return <Badge variant="outline" className="border-teal-500 text-teal-400">Completed</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-400">Unknown</Badge>;
    }
  };
  
  // Helper function to generate mock notification data
  const generateMockNotifications = (): ReservationNotification[] => {
    const now = new Date();
    
    return [
      {
        id: '1',
        user_id: user?.id || '',
        reservation_id: 'res_123456',
        notification_type: 'reservation_confirmed',
        title: 'Reservation Confirmed',
        message: 'Your reservation for 4 people on Friday, 26th April at 7:30 PM has been confirmed.',
        is_read: false,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: '2',
        user_id: user?.id || '',
        reservation_id: 'res_123456',
        notification_type: 'reservation_reminder',
        title: 'Upcoming Reservation',
        message: 'Reminder: Your reservation for 4 people is tomorrow at 7:30 PM. We look forward to serving you!',
        is_read: true,
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: '3',
        user_id: user?.id || '',
        reservation_id: 'res_654321',
        notification_type: 'reservation_created',
        title: 'Reservation Received',
        message: 'Your reservation request for 2 people on Saturday, 3rd May at 6:00 PM has been received and is pending confirmation.',
        is_read: false,
        created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        id: '4',
        user_id: user?.id || '',
        reservation_id: 'res_789012',
        notification_type: 'reservation_declined',
        title: 'Reservation Request Declined',
        message: 'We regret to inform you that your reservation request for 8 people on Sunday, 28th April at 8:00 PM could not be accommodated. Please contact us for alternatives.',
        is_read: true,
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      }
    ];
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCcw className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">Loading notifications...</span>
      </div>
    );
  }
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-white">Your Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-amber-600">{unreadCount} new</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="bg-gray-800/40 rounded-lg p-8 text-center border border-gray-700">
          <p className="text-gray-400">You don't have any notifications yet.</p>
          <p className="text-sm text-gray-500 mt-2">When you make reservations or updates occur, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-4 rounded-lg border ${notification.is_read ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-800/60 border-amber-700/30'}`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="flex">
                <div className="mr-3 mt-1">
                  {getStatusIcon(notification.notification_type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <h3 className="font-medium text-white">{notification.title}</h3>
                      {!notification.is_read && (
                        <span className="ml-2 h-2 w-2 rounded-full bg-amber-500"></span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{formatRelativeTimeWithTooltip(new Date(notification.created_at)).text}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formatRelativeTimeWithTooltip(new Date(notification.created_at)).tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-1 text-sm">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex justify-between items-center">
                    {getStatusBadge(notification.notification_type)}
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-amber-500 p-0 h-auto text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/reservations?id=${notification.reservation_id}`;
                      }}
                    >
                      View Reservation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
