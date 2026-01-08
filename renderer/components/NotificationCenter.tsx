


import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  Calendar,
  CheckCircle,
  XCircle,
  PencilLine,
  CircleSlash,
  ThumbsUp,
  CalendarPlus,
  Trash2,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

import { colors, cardStyle, animation } from '../utils/designSystem';
import { Notification, formatRelativeTime, formatNotificationDateTime, getNotificationIcon, getNotificationColor } from '../utils/notificationUtils';

interface Props {
  userId: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'user123',
    type: 'reservation_created',
    title: 'Reservation Request Received',
    message: 'Your reservation request for Friday, April 26th at 7:30 PM has been received and is awaiting confirmation.',
    read: false,
    created_at: '2025-04-25T10:30:00Z',
    metadata: {
      reservation_id: 'res123',
      reservation_date: '2025-04-26',
      reservation_time: '19:30',
    }
  },
  {
    id: '2',
    user_id: 'user123',
    type: 'reservation_confirmed',
    title: 'Reservation Confirmed',
    message: 'Great news! Your reservation for Friday, April 26th at 7:30 PM has been confirmed.',
    read: true,
    created_at: '2025-04-25T11:15:00Z',
    metadata: {
      reservation_id: 'res123',
      reservation_date: '2025-04-26',
      reservation_time: '19:30',
      table_id: 'table7'
    }
  },
  {
    id: '3',
    user_id: 'user123',
    type: 'reservation_reminder',
    title: 'Upcoming Reservation Reminder',
    message: 'Friendly reminder: Your reservation is coming up on Friday, April 26th at 7:30 PM.',
    read: false,
    created_at: '2025-04-26T10:00:00Z',
    metadata: {
      reservation_id: 'res123',
      reservation_date: '2025-04-26',
      reservation_time: '19:30',
      table_id: 'table7'
    }
  },
  {
    id: '4',
    user_id: 'user123',
    type: 'reservation_declined',
    title: 'Reservation Request Declined',
    message: 'Unfortunately, your reservation request for Sunday, April 28th at 8:00 PM could not be accommodated.',
    read: false,
    created_at: '2025-04-24T14:20:00Z',
    metadata: {
      reservation_id: 'res124',
      reservation_date: '2025-04-28',
      reservation_time: '20:00'
    }
  },
  {
    id: '5',
    user_id: 'user123',
    type: 'reservation_completed',
    title: 'Thanks for Dining With Us',
    message: 'Thank you for dining with us on Tuesday, April 23rd. We hope you enjoyed your experience!',
    read: true,
    created_at: '2025-04-23T22:45:00Z',
    metadata: {
      reservation_id: 'res122',
      reservation_date: '2025-04-23',
      reservation_time: '19:00',
      table_id: 'table5'
    }
  }
];

export const NotificationCenter = ({ userId }: Props) => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'read') return notification.read;
    return true;
  });
  
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(null);
    }
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
    setSelectedNotification(null);
  };
  
  // Render icon based on notification type
  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation_created':
        return <CalendarPlus size={18} style={{ color: getNotificationColor('reservation_created') }} />;
      case 'reservation_confirmed':
        return <CheckCircle size={18} style={{ color: getNotificationColor('reservation_confirmed') }} />;
      case 'reservation_declined':
        return <XCircle size={18} style={{ color: getNotificationColor('reservation_declined') }} />;
      case 'reservation_modified':
        return <PencilLine size={18} style={{ color: getNotificationColor('reservation_modified') }} />;
      case 'reservation_reminder':
        return <Bell size={18} style={{ color: getNotificationColor('reservation_reminder') }} />;
      case 'reservation_canceled':
        return <CircleSlash size={18} style={{ color: getNotificationColor('reservation_canceled') }} />;
      case 'reservation_completed':
        return <ThumbsUp size={18} style={{ color: getNotificationColor('reservation_completed') }} />;
      default:
        return <Bell size={18} style={{ color: colors.text.secondary }} />;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" style={{ color: colors.brand.purple }} />
          <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>Notifications</h2>
          {unreadCount > 0 && (
            <Badge style={{ backgroundColor: colors.brand.purple, color: 'white' }}>
              {unreadCount} new
            </Badge>
          )}
        </div>
        
        <div className="space-x-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              style={{
                backgroundColor: 'rgba(124, 93, 250, 0.1)',
                borderColor: colors.border.light,
                color: colors.brand.purple
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
          
          {notifications.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllNotifications}
              style={{
                backgroundColor: 'rgba(255, 76, 97, 0.1)',
                borderColor: 'rgba(255, 76, 97, 0.3)',
                color: colors.status.error
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <Card style={{
          ...cardStyle,
          borderColor: colors.border.light,
          transition: `all ${animation.normal} ease`
        }}>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(124, 93, 250, 0.1)' }}>
              <Bell className="h-6 w-6" style={{ color: colors.brand.purple }} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>No Notifications</h3>
            <p style={{ color: colors.text.secondary }}>You don't have any notifications at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Card style={{
              ...cardStyle,
              borderColor: colors.border.light,
              transition: `all ${animation.normal} ease`
            }}>
              <CardHeader className="pb-3 border-b" style={{ borderBottomColor: colors.border.light }}>
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="reservation-tabs">
                  <TabsList style={{ backgroundColor: colors.background.tertiary, width: '100%' }}>
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                    <TabsTrigger value="read" className="flex-1">Read</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="pt-4 px-2">
                <ScrollArea className="h-[400px] pr-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <p style={{ color: colors.text.tertiary }}>No notifications in this category</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNotifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`p-3 rounded-md cursor-pointer transition-all duration-200 ${selectedNotification?.id === notification.id ? 'ring-1' : ''}`}
                          style={{
                            backgroundColor: notification.read ? colors.background.tertiary : 'rgba(124, 93, 250, 0.1)',
                            borderLeft: `3px solid ${getNotificationColor(notification.type as any)}`,
                            boxShadow: selectedNotification?.id === notification.id ? `0 0 0 1px ${colors.brand.purple}` : 'none'
                          }}
                          onClick={() => {
                            setSelectedNotification(notification);
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className="mt-0.5 mr-2">
                                {renderNotificationIcon(notification.type)}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm" style={{ color: colors.text.primary }}>
                                  {notification.title}
                                </h4>
                                <p className="text-xs mt-1 line-clamp-2" style={{ color: colors.text.secondary }}>
                                  {notification.message}
                                </p>
                                <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                                  {formatRelativeTime(notification.created_at)}
                                </p>
                              </div>
                            </div>
                            
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.brand.purple }}></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card style={{
              ...cardStyle,
              borderColor: colors.border.light,
              transition: `all ${animation.normal} ease`,
              minHeight: '472px' // Match height of the notifications list card
            }}>
              {selectedNotification ? (
                <>
                  <CardHeader className="pb-3 border-b" style={{ borderBottomColor: colors.border.light }}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl flex items-center" style={{ color: colors.text.primary }}>
                        <div className="mr-2">
                          {renderNotificationIcon(selectedNotification.type)}
                        </div>
                        {selectedNotification.title}
                      </CardTitle>
                      
                      <div className="flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => markAsRead(selectedNotification.id)}
                                style={{ color: colors.text.tertiary }}
                                disabled={selectedNotification.read}
                              >
                                {selectedNotification.read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{selectedNotification.read ? 'Already read' : 'Mark as read'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteNotification(selectedNotification.id)}
                                style={{ color: colors.text.tertiary }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete notification</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: colors.text.tertiary }}>
                      {formatNotificationDateTime(selectedNotification.created_at)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 rounded-md" style={{ backgroundColor: colors.background.tertiary }}>
                        <p style={{ color: colors.text.primary }}>{selectedNotification.message}</p>
                      </div>
                      
                      {selectedNotification.metadata?.reservation_id && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm" style={{ color: colors.text.primary }}>Reservation Details</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedNotification.metadata.reservation_date && (
                              <div className="p-3 rounded-md flex items-center space-x-3" style={{ backgroundColor: colors.background.tertiary }}>
                                <Calendar className="h-5 w-5" style={{ color: colors.brand.purple }} />
                                <div>
                                  <p className="text-xs" style={{ color: colors.text.tertiary }}>Date</p>
                                  <p className="font-medium" style={{ color: colors.text.primary }}>
                                    {format(parseISO(selectedNotification.metadata.reservation_date), 'EEEE, MMMM do, yyyy')}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {selectedNotification.metadata.reservation_time && (
                              <div className="p-3 rounded-md flex items-center space-x-3" style={{ backgroundColor: colors.background.tertiary }}>
                                <Clock className="h-5 w-5" style={{ color: colors.brand.purple }} />
                                <div>
                                  <p className="text-xs" style={{ color: colors.text.tertiary }}>Time</p>
                                  <p className="font-medium" style={{ color: colors.text.primary }}>
                                    {(() => {
                                      const [hours, minutes] = selectedNotification.metadata.reservation_time!.split(':');
                                      const hour = parseInt(hours);
                                      return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
                                    })()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <Button 
                              variant="outline" 
                              className="w-full"
                              style={{
                                backgroundColor: 'rgba(124, 93, 250, 0.1)',
                                borderColor: colors.border.light,
                                color: colors.brand.purple
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              View Reservation Details
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-12 flex flex-col items-center justify-center h-full text-center">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(124, 93, 250, 0.1)' }}>
                    <Bell className="h-8 w-8" style={{ color: colors.brand.purple }} />
                  </div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text.primary }}>
                    Select a Notification
                  </h3>
                  <p className="max-w-md" style={{ color: colors.text.secondary }}>
                    Choose a notification from the list to view its details here.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
