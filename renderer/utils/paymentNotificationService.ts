import { apiClient } from 'app';
import { toast } from 'sonner';

class PaymentNotificationService {
  private notifications: any[] = [];
  private lastFetchTime: number = 0;
  private permissionIssueDetected: boolean = false;
  
  /**
   * Get notifications from storage
   * @param limit Maximum number of notifications to return
   * @returns Array of notifications
   */
  async getNotifications(limit: number = 5): Promise<any[]> {
    try {
      // If we've already detected permission issues, don't keep trying
      if (this.permissionIssueDetected) {
        return this.notifications.slice(0, limit);
      }
      
      // Only fetch from API if it's been more than 10 seconds since last fetch
      const now = Date.now();
      if (now - this.lastFetchTime > 10000) {
        let successfulFetch = false;
        let error;
        
        // Try to get notifications from webhook endpoint
        try {
          const response = await apiClient.get_webhook_notifications({ limit });
          
          if (response.ok) {
            const data = await response.json();
            this.notifications = data.notifications || [];
            this.lastFetchTime = now;
            successfulFetch = true;
            
            // Check for new notifications to show toasts
            if (this.notifications.length > 0) {
              const previousIds = new Set(this.notifications.map(n => n.id));
              const newNotifs = this.notifications.filter(n => !previousIds.has(n.id) && !n.processed);
              
              // Show toasts for new notifications
              newNotifs.forEach(notification => {
                this.showNotificationToast(notification);
              });
            }
            
            // Check if any notifications need action (unprocessed)
            const unprocessedNotifications = this.notifications.filter(n => !n.processed);
            if (unprocessedNotifications.length > 0) {
              console.log(`Found ${unprocessedNotifications.length} unprocessed notifications`);
            }
          } else {
            error = await response.text();
            // Don't retry if it's a permission issue
            if (error.includes('permission denied')) {
              this.permissionIssueDetected = true;
              this.lastFetchTime = now; // Update time to reduce retry frequency
              console.warn('Permission issues detected with webhook notifications');
            }
          }
        } catch (err) {
          console.error('Error with webhook notifications endpoint:', err);
          error = err;
        }
        
        // If webhook endpoint failed, try payment notifications endpoint
        if (!successfulFetch && !this.permissionIssueDetected) {
          try {
            const response = await apiClient.get_payment_notifications_v2({ limit });
            
            if (response.ok) {
              const data = await response.json();
              this.notifications = data.notifications || [];
              this.lastFetchTime = now;
              successfulFetch = true;
            } else {
              const errText = await response.text();
              console.error('Payment notifications V2 endpoint failed:', errText);
              
              // If we get permission denied, don't keep trying and spamming the console
              if (errText.includes('permission denied')) {
                this.permissionIssueDetected = true;
                this.lastFetchTime = now; // Update time to reduce retry frequency
                console.warn('Permission issues detected with notifications. This is likely a configuration issue.');
              }
            }
          } catch (err) {
            console.error('Error with payment notifications V2 endpoint:', err);
          }
        }
        
        // If both endpoints failed but not due to permissions, log an error
        if (!successfulFetch && error && !String(error).includes('permission denied') && !this.permissionIssueDetected) {
          console.error('All notification endpoints failed:', error);
        }
      }
      
      return this.notifications.slice(0, limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return this.notifications.slice(0, limit); // Return cached notifications on error
    }
  }
  
  /**
   * Create a test notification for immediate display
   * This is just for the UI - real notifications come from the webhook
   */
  async createTestNotification(orderId: string): Promise<boolean> {
    try {
      // Skip if we have detected permission issues
      if (this.permissionIssueDetected) {
        // Fallback to local handling
        return this.createLocalTestNotification(orderId);
      }
      
      // Use the test notification endpoint
      const response = await apiClient.test_notification({ orderId });
      
      if (response.ok) {
        // Force refresh notifications
        this.lastFetchTime = 0;
        await this.getNotifications();
        return true;
      }
      return this.createLocalTestNotification(orderId);
    } catch (error) {
      console.error('Error creating test notification:', error);
      return this.createLocalTestNotification(orderId);
    }
  }
  
  /**
   * Create a local test notification as fallback
   */
  private createLocalTestNotification(orderId: string): boolean {
    const newNotification = {
      order_id: orderId,
      event_type: 'test_notification',
      timestamp: Math.floor(Date.now() / 1000),
      processed: false,
      status_update: {
        status: 'TEST',
        message: 'This is a test notification (local fallback)'
      }
    };
    
    // Add to the start of the array
    this.notifications.unshift(newNotification);
    
    // Trim to keep only the most recent 10
    if (this.notifications.length > 10) {
      this.notifications = this.notifications.slice(0, 10);
    }
    
    return true;
  }
  
  /**
   * Show a toast notification for a payment event
   * @param notification Notification object to display
   */
  private showNotificationToast(notification: any) {
    // Skip older notifications (more than 2 minutes old)
    const notificationTime = notification.timestamp * 1000;
    if (Date.now() - notificationTime > 120000) return;
    
    let title = '';
    let description = '';
    let variant: 'default' | 'success' | 'destructive' = 'default';
    
    switch (notification.event_type) {
      case 'payment_intent.succeeded':
        title = 'Payment Successful';
        description = `Order #${notification.order_id} has been paid successfully.`;
        variant = 'success';
        break;
      case 'payment_intent.payment_failed':
        title = 'Payment Failed';
        description = `Payment for order #${notification.order_id} was unsuccessful.`;
        variant = 'destructive';
        break;
      case 'charge.refunded':
        title = 'Payment Refunded';
        description = `Order #${notification.order_id} has been refunded.`;
        variant = 'default';
        break;
      case 'test_notification':
        title = 'Test Notification';
        description = 'This is a test payment notification.';
        variant = 'default';
        break;
      default:
        title = 'Payment Update';
        description = `Order #${notification.order_id} status has been updated.`;
    }
    
    // Use Sonner toast
    toast[variant === 'destructive' ? 'error' : variant === 'success' ? 'success' : 'info'](title, {
      description,
      duration: 5000,
    });
  }
  
  /**
   * Mark notifications as processed
   * @param orderIds Array of order IDs to mark as processed
   */
  async markAsProcessed(orderIds: string[]): Promise<boolean> {
    try {
      // Skip if we have detected permission issues
      if (this.permissionIssueDetected) {
        // Just update local cache and return
        this.notifications = this.notifications.map(notification => {
          if (orderIds.includes(notification.order_id)) {
            return { ...notification, processed: true };
          }
          return notification;
        });
        return true;
      }
      
      // First update local cache
      this.notifications = this.notifications.map(notification => {
        if (orderIds.includes(notification.order_id)) {
          return { ...notification, processed: true };
        }
        return notification;
      });
      
      // Try the stripe webhook endpoint first
      let response = await apiClient.mark_webhook_notifications_processed({ notification_ids: orderIds.map((_, i) => i) });
      
      if (!response.ok) {
        // Fall back to payment notifications endpoint
        response = await apiClient.mark_notifications_processed_v2({ notification_ids: orderIds.map((_, i) => i) });
      }
      
      return response.ok;
    } catch (error) {
      console.error('Error marking notifications as processed:', error);
      return false;
    }
  }
}

export const paymentNotificationService = new PaymentNotificationService();
