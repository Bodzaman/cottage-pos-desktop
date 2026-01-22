// Types for notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'general' | 'promotion' | 'reservation';
  relatedId?: string; // ID of order or reservation
  status: 'unread' | 'read';
  createdAt: string;
  action?: {
    label: string;
    url: string;
  };
}

// Reservation interface for notification creation
export interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  special_requests?: string;
  status: string;
}

// Mock database for notifications (in a real app, this would be in Supabase)
let notifications: Notification[] = [];

// Generate ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Add a notification
export const addNotification = (userId: string, notification: Omit<Notification, 'id' | 'userId' | 'status' | 'createdAt'>) => {
  const newNotification: Notification = {
    id: generateId(),
    userId,
    status: 'unread',
    createdAt: new Date().toISOString(),
    ...notification
  };

  notifications = [newNotification, ...notifications];
  return newNotification;
};

// Get notifications for a user
export const getUserNotifications = (userId: string) => {
  return notifications.filter(n => n.userId === userId);
};

// Mark notification as read
export const markNotificationAsRead = (notificationId: string) => {
  notifications = notifications.map(n =>
    n.id === notificationId ? { ...n, status: 'read' as const } : n
  );
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = (userId: string) => {
  notifications = notifications.map(n =>
    n.userId === userId ? { ...n, status: 'read' as const } : n
  );
};

// Delete a notification
export const deleteNotification = (notificationId: string) => {
  notifications = notifications.filter(n => n.id !== notificationId);
};

// Generate reservation-related notifications
export const createReservationNotification = (userId: string, reservation: Reservation, type: 'created' | 'confirmed' | 'modified' | 'canceled' | 'reminder') => {
  const date = new Date(reservation.reservation_date);
  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Convert 24h to 12h time
  const [hours, minutes] = reservation.reservation_time.split(':');
  const hour = parseInt(hours);
  const displayTime = `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;

  let title = '';
  let message = '';

  switch (type) {
    case 'created':
      title = 'Reservation Request Received';
      message = `We've received your reservation request for ${formattedDate} at ${displayTime}. We'll confirm your table shortly.`;
      break;
    case 'confirmed':
      title = 'Reservation Confirmed';
      message = `Your reservation for ${formattedDate} at ${displayTime} has been confirmed. We look forward to seeing you!`;
      break;
    case 'modified':
      title = 'Reservation Updated';
      message = `Your reservation for ${formattedDate} at ${displayTime} has been updated.`;
      break;
    case 'canceled':
      title = 'Reservation Canceled';
      message = `Your reservation for ${formattedDate} at ${displayTime} has been canceled.`;
      break;
    case 'reminder':
      title = 'Reservation Reminder';
      message = `Just a reminder about your reservation tomorrow at ${displayTime}. We look forward to seeing you!`;
      break;
  }

  return addNotification(userId, {
    title,
    message,
    type: 'reservation',
    relatedId: reservation.id,
    action: {
      label: 'View Reservation',
      url: `/reservations/${reservation.id}`
    }
  });
};

// Create order notification
export const createOrderNotification = (userId: string, orderId: string, status: string) => {
  let title = '';
  let message = '';

  switch (status) {
    case 'pending':
      title = 'Order Received';
      message = 'Your order has been received and is being processed.';
      break;
    case 'confirmed':
      title = 'Order Confirmed';
      message = 'Your order has been confirmed and is being prepared.';
      break;
    case 'preparing':
      title = 'Order Being Prepared';
      message = 'The kitchen is now preparing your order.';
      break;
    case 'ready':
      title = 'Order Ready';
      message = 'Your order is ready for pickup/delivery.';
      break;
    case 'out_for_delivery':
      title = 'Order Out for Delivery';
      message = 'Your order is on its way to you.';
      break;
    case 'delivered':
      title = 'Order Delivered';
      message = 'Your order has been delivered. Enjoy your meal!';
      break;
    case 'completed':
      title = 'Order Completed';
      message = 'Thank you for your order! We hope you enjoyed it.';
      break;
    case 'cancelled':
      title = 'Order Cancelled';
      message = 'Your order has been cancelled.';
      break;
    default:
      title = 'Order Update';
      message = `Your order status has been updated to: ${status}`;
  }

  return addNotification(userId, {
    title,
    message,
    type: 'order',
    relatedId: orderId,
    action: {
      label: 'View Order',
      url: `/orders/${orderId}`
    }
  });
};

// Get unread count for a user
export const getUnreadCount = (userId: string): number => {
  return notifications.filter(n => n.userId === userId && n.status === 'unread').length;
};

// Clear all notifications for a user
export const clearAllNotifications = (userId: string) => {
  notifications = notifications.filter(n => n.userId !== userId);
};
