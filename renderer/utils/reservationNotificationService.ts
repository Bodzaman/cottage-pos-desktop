import { supabase } from './supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Define notification types
export type NotificationType = 
  | 'reservation_created' 
  | 'reservation_confirmed' 
  | 'reservation_declined' 
  | 'reservation_reminder' 
  | 'reservation_modified' 
  | 'reservation_canceled' 
  | 'reservation_completed';

// Define notification data
export interface ReservationNotificationData {
  user_id: string;
  reservation_id: string;
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Reservation notification service to handle creating and managing notifications
 * for users when reservation status changes.
 */
export const reservationNotificationService = {
  /**
   * Create a notification for a user about their reservation
   */
  async createNotification(data: ReservationNotificationData): Promise<boolean> {
    try {
      const { user_id, reservation_id, type, title, message } = data;
      
      const notificationData = {
        id: uuidv4(),
        user_id,
        reservation_id,
        notification_type: type,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      // Insert the notification into the database
      const { error } = await supabase
        .from('reservation_notifications')
        .insert(notificationData);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  },
  
  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reservation_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },
  
  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservation_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },
  
  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservation_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },
  
  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservation_notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  },
  
  /**
   * Create a notification based on reservation status change
   */
  async notifyReservationStatusChange(reservation: any, userId: string, newStatus: string): Promise<boolean> {
    if (!userId) return false;
    
    const formattedDate = new Date(reservation.reservation_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Convert time from 24h to 12h format
    const [hours, minutes] = reservation.reservation_time.split(':');
    const hour = parseInt(hours);
    const formattedTime = `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    
    let notificationData: ReservationNotificationData | null = null;
    
    switch(newStatus) {
      case 'PENDING':
        notificationData = {
          user_id: userId,
          reservation_id: reservation.id,
          type: 'reservation_created',
          title: 'Reservation Request Received',
          message: `Your reservation request for ${formattedDate} at ${formattedTime} for ${reservation.party_size} people has been received and is awaiting confirmation.`
        };
        break;
        
      case 'CONFIRMED':
        notificationData = {
          user_id: userId,
          reservation_id: reservation.id,
          type: 'reservation_confirmed',
          title: 'Reservation Confirmed',
          message: `Great news! Your reservation for ${formattedDate} at ${formattedTime} has been confirmed.`
        };
        break;
        
      case 'DECLINED':
        notificationData = {
          user_id: userId,
          reservation_id: reservation.id,
          type: 'reservation_declined',
          title: 'Reservation Request Declined',
          message: `Unfortunately, your reservation request for ${formattedDate} at ${formattedTime} could not be accommodated.`
        };
        break;
        
      case 'MODIFIED':
        notificationData = {
          user_id: userId,
          reservation_id: reservation.id,
          type: 'reservation_modified',
          title: 'Reservation Modified',
          message: `Your reservation for ${formattedDate} at ${formattedTime} has been updated. Please check your reservation details.`
        };
        break;
        
      case 'CANCELED':
        notificationData = {
          user_id: userId,
          reservation_id: reservation.id,
          type: 'reservation_canceled',
          title: 'Reservation Canceled',
          message: `Your reservation for ${formattedDate} at ${formattedTime} has been canceled as requested.`
        };
        break;
        
      case 'COMPLETED':
        notificationData = {
          user_id: userId,
          reservation_id: reservation.id,
          type: 'reservation_completed',
          title: 'Thanks for Dining With Us',
          message: `Thank you for dining with us on ${formattedDate}. We hope you enjoyed your experience!`
        };
        break;
    }
    
    if (notificationData) {
      return this.createNotification(notificationData);
    }
    
    return false;
  }
};
