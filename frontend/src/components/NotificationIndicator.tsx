import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { reservationNotificationService } from '../utils/reservationNotificationService';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useNavigate } from 'react-router-dom';
import { colors as designColors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';

interface NotificationIndicatorProps {
  className?: string;
  count?: number;
  pulse?: boolean;
  onClick?: () => void;
}

export function NotificationIndicator({ className = '', count, pulse = true, onClick }: NotificationIndicatorProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  
  // Fetch unread notifications count when component mounts and when user changes
  useEffect(() => {
    // Skip fetching if we were passed an explicit count
    if (count !== undefined) return;
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        // TODO: Re-enable once RLS policies are fixed for reservation_notifications table
        // const notifications = await reservationNotificationService.getUserNotifications(user.id);
        // const unread = notifications.filter(n => !n.is_read).length;
        // setUnreadCount(unread);
        setUnreadCount(0); // Temporary: Set to 0 to prevent permission errors
      } catch (error) {
        console.error('Error fetching notification count:', error);
        setUnreadCount(0);
      }
    };
    
    fetchUnreadCount();
    
    // Set up an interval to check for new notifications every minute
    const intervalId = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(intervalId);
  }, [user, count]);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (user) {
      navigate('/customer-portal#profile');
    }
  };
  
  // Determine the count to display (explicit count or fetched count)
  const displayCount = count !== undefined ? count : unreadCount;
  
  // If no count is provided and user isn't logged in, don't render
  if (displayCount <= 0 && count === undefined && !user) return null;
  
  // For simple badge display without Bell icon (used in OrderTypeButton)
  if (count !== undefined && className === '') {
    return (
      <div 
        className={`absolute -top-2 -right-2 min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 text-xs font-bold ${pulse ? 'animate-pulse' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, #FFFFFF 100%)`,
          boxShadow: `0 0 6px ${globalColors.purple.glow}`,
          color: 'white',
          textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          zIndex: 20
        }}
      >
        {displayCount}
      </div>
    );
  }
  
  // For Bell icon with tooltip (used in Navbar)
  return (
    <div className={`relative ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleClick}
              className="p-2 rounded-full hover:bg-tandoor-charcoal/30 transition-colors"
            >
              <Bell 
                className="h-5 w-5 text-tandoor-platinum" 
                aria-hidden="true" 
              />
              {displayCount > 0 && (
                <Badge 
                  className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${pulse ? 'animate-pulse' : ''}`} 
                  style={{ background: `linear-gradient(to right, #FFFFFF, ${globalColors.purple.primary})`, boxShadow: `0 2px 6px ${globalColors.purple.glow}` }}
                >
                  {displayCount > 9 ? '9+' : displayCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{displayCount > 0 ? `${displayCount} unread notification${displayCount !== 1 ? 's' : ''}` : 'No new notifications'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
