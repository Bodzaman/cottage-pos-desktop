import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Notification types
export type NotificationType = 'reservation_created' | 'reservation_confirmed' | 'reservation_declined' | 'reservation_modified' | 'reservation_reminder' | 'reservation_canceled' | 'reservation_completed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string; // ISO datetime
  metadata?: {
    reservation_id?: string;
    reservation_date?: string;
    reservation_time?: string;
    table_id?: string;
  };
}

// Get icon for notification type
export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'reservation_created':
      return 'CalendarPlus';
    case 'reservation_confirmed':
      return 'CheckCircle';
    case 'reservation_declined':
      return 'XCircle';
    case 'reservation_modified':
      return 'PencilLine';
    case 'reservation_reminder':
      return 'Bell';
    case 'reservation_canceled':
      return 'CircleSlash';
    case 'reservation_completed':
      return 'ThumbsUp';
    default:
      return 'Bell';
  }
};

// Get color for notification type
export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'reservation_created':
      return '#7C5DFA'; // purple
    case 'reservation_confirmed':
      return '#0BCEA5'; // teal
    case 'reservation_declined':
      return '#FF4C61'; // error
    case 'reservation_modified':
      return '#4285F4'; // blue
    case 'reservation_reminder':
      return '#FFAB2E'; // warning
    case 'reservation_canceled':
      return '#FF4C61'; // error
    case 'reservation_completed':
      return '#0BCEA5'; // teal
    default:
      return '#BBC3E1'; // gray
  }
};

// Format relative time (e.g., 2 hours ago, 3 days ago)
export const formatRelativeTime = (dateTime: string): string => {
  try {
    const date = parseISO(dateTime);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'unknown time';
  }
};

// Format notification datetime
export const formatNotificationDateTime = (dateTime: string): string => {
  try {
    const date = parseISO(dateTime);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    return 'unknown date';
  }
};

// Generate notification message for reservation
export const generateNotificationMessage = (type: NotificationType, date: string, time: string): string => {
  const formattedDate = format(parseISO(date), 'EEEE, MMMM do');
  
  // Convert 24h to 12h time format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const formattedTime = `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  
  switch (type) {
    case 'reservation_created':
      return `Your reservation request for ${formattedDate} at ${formattedTime} has been received and is awaiting confirmation.`;
    case 'reservation_confirmed':
      return `Great news! Your reservation for ${formattedDate} at ${formattedTime} has been confirmed.`;
    case 'reservation_declined':
      return `Unfortunately, your reservation request for ${formattedDate} at ${formattedTime} could not be accommodated.`;
    case 'reservation_modified':
      return `Your reservation details have been updated for ${formattedDate} at ${formattedTime}.`;
    case 'reservation_reminder':
      return `Friendly reminder: Your reservation is coming up on ${formattedDate} at ${formattedTime}.`;
    case 'reservation_canceled':
      return `Your reservation for ${formattedDate} at ${formattedTime} has been canceled.`;
    case 'reservation_completed':
      return `Thank you for dining with us on ${formattedDate}. We hope you enjoyed your experience!`;
    default:
      return `Your reservation for ${formattedDate} at ${formattedTime} has been updated.`;
  }
};

// Generate title for notification
export const generateNotificationTitle = (type: NotificationType): string => {
  switch (type) {
    case 'reservation_created':
      return 'Reservation Request Received';
    case 'reservation_confirmed':
      return 'Reservation Confirmed';
    case 'reservation_declined':
      return 'Reservation Request Declined';
    case 'reservation_modified':
      return 'Reservation Updated';
    case 'reservation_reminder':
      return 'Upcoming Reservation Reminder';
    case 'reservation_canceled':
      return 'Reservation Canceled';
    case 'reservation_completed':
      return 'Thanks for Dining With Us';
    default:
      return 'Reservation Update';
  }
};
