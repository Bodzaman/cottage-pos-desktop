/**
 * Buffered Payment Capture Manager
 * Handles payment processing when offline using Stripe payment intents
 */

// NEW: Import IndexedDB-compatible storage
import { offlineStorage } from './offlineStorage';
import brain from 'brain';
import { getOfflineStatus, onOfflineStatusChange } from './serviceWorkerManager';

// Payment intent data structure
export interface BufferedPaymentIntent {
  id: string;
  orderId: string;
  paymentIntentId?: string; // Stripe payment intent ID
  amount: number;
  currency: string;
  paymentMethod: 'CARD' | 'CASH' | 'CONTACTLESS';
  cardDetails?: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  status: 'PENDING' | 'CAPTURED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  capturedAt?: string;
  failureReason?: string;
  idempotencyKey: string;
  retryCount: number;
  metadata: Record<string, any>;
}

// Payment capture result
export interface PaymentCaptureResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  shouldRetry: boolean;
  clientSecret?: string;
}

// Payment status
export interface PaymentManagerStatus {
  isOnline: boolean;
  pendingPayments: number;
  failedPayments: number;
  isProcessing: boolean;
  lastProcessingAttempt?: string;
  errors: string[];
}

class BufferedPaymentManager {
  private isInitialized = false;
  private isProcessing = false;
  private processingInterval: number | null = null;
  private statusCallbacks: Array<(status: PaymentManagerStatus) => void> = [];
  private stripe: any = null; // Will be loaded dynamically
  private readonly STORAGE_KEY_PREFIX = 'buffered_payment_';
  
  // NEW: Use a simple in-memory cache with IndexedDB persistence
  private paymentCache: Map<string, BufferedPaymentIntent> = new Map();
  private isLoaded = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(stripePublishableKey?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load Stripe if we have a key
      if (stripePublishableKey) {
        await this.loadStripe(stripePublishableKey);
      }

      await offlineStorage.initialize();
      
      // NEW: Load existing payments from storage
      await this.loadPaymentsFromStorage();

      // Set up offline status monitoring
      onOfflineStatusChange((isOffline) => {
        if (!isOffline) {
          // We're back online, start processing buffered payments
          this.startPeriodicProcessing();
        } else {
          // We're offline, stop processing
          this.stopPeriodicProcessing();
        }
        this.notifyStatusCallbacks();
      });

      // If we're currently online, start processing
      if (!getOfflineStatus()) {
        this.startPeriodicProcessing();
      }

      this.isInitialized = true;
      console.log('✅ [PaymentManager] Initialized successfully');

    } catch (error) {
      console.error('❌ [PaymentManager] Initialization failed:', error);
      throw error;
    }
  }
  
  // NEW: Load payments from IndexedDB into memory cache
  private async loadPaymentsFromStorage(): Promise<void> {
    try {
      // Get all payment-related sync operations from offline storage
      const allOps = await offlineStorage.getPendingSyncOperations();
      const paymentOps = allOps.filter(op => op.type === 'CREATE_PAYMENT');
      
      // Convert sync operations back to payment intents
      for (const op of paymentOps) {
        if (op.data && op.data.paymentIntent) {
          const payment = op.data.paymentIntent as BufferedPaymentIntent;
          this.paymentCache.set(payment.id, payment);
        }
      }
      
      this.isLoaded = true;
      console.log(`📦 [PaymentManager] Loaded ${this.paymentCache.size} payments from storage`);
    } catch (error) {
      console.error('❌ [PaymentManager] Failed to load payments from storage:', error);
      this.isLoaded = true; // Continue anyway
    }
  }

  private async loadStripe(publishableKey: string): Promise<void> {
    try {
      // In a real implementation, you'd load Stripe from CDN
      // For now, we'll assume it's available globally
      if (typeof window !== 'undefined' && (window as any).Stripe) {
        this.stripe = (window as any).Stripe(publishableKey);
        console.log('✅ [PaymentManager] Stripe initialized');
      } else {
        console.warn('⚠️ [PaymentManager] Stripe not available');
      }
    } catch (error) {
      console.error('❌ [PaymentManager] Failed to load Stripe:', error);
    }
  }

  // ============================================================================
  // PAYMENT BUFFERING
  // ============================================================================

  /**
   * Buffer a cash payment for processing when online
   */
  async bufferCashPayment(orderId: string, amount: number): Promise<string> {
    const paymentId = `cash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const idempotencyKey = `cash_payment_${orderId}_${Date.now()}`;

    const bufferedPayment: BufferedPaymentIntent = {
      id: paymentId,
      orderId,
      amount,
      currency: 'GBP',
      paymentMethod: 'CASH',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      idempotencyKey,
      retryCount: 0,
      metadata: {
        processedOffline: getOfflineStatus(),
        userAgent: navigator.userAgent
      }
    };

    await this.saveBufferedPayment(bufferedPayment);
    console.log(`💰 [PaymentManager] Buffered cash payment: ${paymentId}`);
    
    this.notifyStatusCallbacks();

    // Try immediate processing if online
    if (!getOfflineStatus()) {
      this.triggerProcessing();
    }

    return paymentId;
  }

  /**
   * Buffer a card payment intent for capture when online
   */
  async bufferCardPayment(
    orderId: string, 
    amount: number, 
    cardDetails?: {
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
    }
  ): Promise<{ paymentId: string; requiresOnlineProcessing: boolean }> {
    
    const paymentId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const idempotencyKey = `card_payment_${orderId}_${Date.now()}`;

    if (getOfflineStatus()) {
      // We're offline - create a pending payment intent
      const bufferedPayment: BufferedPaymentIntent = {
        id: paymentId,
        orderId,
        amount,
        currency: 'GBP',
        paymentMethod: 'CARD',
        cardDetails,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        idempotencyKey,
        retryCount: 0,
        metadata: {
          processedOffline: true,
          requiresOnlineCapture: true,
          userAgent: navigator.userAgent
        }
      };

      await this.saveBufferedPayment(bufferedPayment);
      console.log(`💳 [PaymentManager] Buffered card payment (offline): ${paymentId}`);
      
      return { paymentId, requiresOnlineProcessing: true };
    } else {
      // We're online - try to create payment intent immediately
      try {
        const result = await this.createStripePaymentIntent(orderId, amount, cardDetails);
        
        if (result.success && result.paymentIntentId) {
          const bufferedPayment: BufferedPaymentIntent = {
            id: paymentId,
            orderId,
            paymentIntentId: result.paymentIntentId,
            amount,
            currency: 'GBP',
            paymentMethod: 'CARD',
            cardDetails,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            idempotencyKey,
            retryCount: 0,
            metadata: {
              processedOffline: false,
              stripeClientSecret: result.clientSecret,
              userAgent: navigator.userAgent
            }
          };

          await this.saveBufferedPayment(bufferedPayment);
          console.log(`💳 [PaymentManager] Created card payment intent: ${paymentId}`);
          
          return { paymentId, requiresOnlineProcessing: false };
        } else {
          throw new Error(result.error || 'Failed to create payment intent');
        }
      } catch (error) {
        console.error('❌ [PaymentManager] Failed to create payment intent, buffering for later:', error);
        
        // Fall back to buffering
        const bufferedPayment: BufferedPaymentIntent = {
          id: paymentId,
          orderId,
          amount,
          currency: 'GBP',
          paymentMethod: 'CARD',
          cardDetails,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          idempotencyKey,
          retryCount: 0,
          metadata: {
            processedOffline: false,
            requiresOnlineCapture: true,
            failedInitialCreation: true,
            initialError: error instanceof Error ? error.message : 'Unknown error',
            userAgent: navigator.userAgent
          }
        };

        await this.saveBufferedPayment(bufferedPayment);
        return { paymentId, requiresOnlineProcessing: true };
      }
    }
  }

  /**
   * Cancel a buffered payment
   */
  async cancelBufferedPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = this.paymentCache.get(paymentId);
      if (!payment) {
        return false;
      }

      if (payment.status === 'CAPTURED') {
        console.warn(`⚠️ [PaymentManager] Cannot cancel captured payment: ${paymentId}`);
        return false;
      }

      payment.status = 'CANCELLED';
      await this.saveBufferedPayment(payment);
      
      console.log(`❌ [PaymentManager] Cancelled payment: ${paymentId}`);
      this.notifyStatusCallbacks();
      
      return true;
    } catch (error) {
      console.error('❌ [PaymentManager] Failed to cancel payment:', error);
      return false;
    }
  }

  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================

  private startPeriodicProcessing(): void {
    if (this.processingInterval) return;

    // Process every 15 seconds when online
    this.processingInterval = window.setInterval(() => {
      this.triggerProcessing();
    }, 15000);

    // Do an immediate processing
    this.triggerProcessing();
  }

  private stopPeriodicProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async triggerProcessing(): Promise<void> {
    if (this.isProcessing || getOfflineStatus()) {
      return;
    }

    this.isProcessing = true;
    this.notifyStatusCallbacks();

    try {
      const pendingPayments = this.getPendingPayments();
      
      if (pendingPayments.length === 0) {
        console.log('ℹ️ [PaymentManager] No pending payments to process');
        return;
      }

      console.log(`🔄 [PaymentManager] Processing ${pendingPayments.length} pending payments`);

      // Process payments sequentially to avoid overwhelming the server
      for (const payment of pendingPayments) {
        try {
          await this.processPayment(payment);
          // Small delay between payments
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ [PaymentManager] Failed to process payment ${payment.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ [PaymentManager] Processing failed:', error);
    } finally {
      this.isProcessing = false;
      this.notifyStatusCallbacks();
    }
  }

  private async processPayment(payment: BufferedPaymentIntent): Promise<void> {
    console.log(`🔄 [PaymentManager] Processing payment: ${payment.id}`);

    try {
      let result: PaymentCaptureResult;

      if (payment.paymentMethod === 'CASH') {
        result = await this.processCashPayment(payment);
      } else if (payment.paymentMethod === 'CARD') {
        result = await this.processCardPayment(payment);
      } else {
        throw new Error(`Unsupported payment method: ${payment.paymentMethod}`);
      }

      if (result.success) {
        payment.status = 'CAPTURED';
        payment.capturedAt = new Date().toISOString();
        if (result.paymentIntentId) {
          payment.paymentIntentId = result.paymentIntentId;
        }
        await this.saveBufferedPayment(payment);
        console.log(`✅ [PaymentManager] Successfully captured payment: ${payment.id}`);
      } else {
        const newRetryCount = payment.retryCount + 1;
        const shouldRetry = result.shouldRetry && newRetryCount < 5;

        if (shouldRetry) {
          payment.retryCount = newRetryCount;
          payment.failureReason = result.error;
          await this.saveBufferedPayment(payment);
          
          // Schedule retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 60000);
          setTimeout(() => {
            this.triggerProcessing();
          }, retryDelay);
          
          console.log(`⏳ [PaymentManager] Retrying payment in ${retryDelay}ms: ${payment.id}`);
        } else {
          payment.status = 'FAILED';
          payment.failureReason = result.error;
          await this.saveBufferedPayment(payment);
          console.error(`❌ [PaymentManager] Payment failed permanently: ${payment.id} - ${result.error}`);
        }
      }

    } catch (error) {
      console.error(`❌ [PaymentManager] Error processing payment ${payment.id}:`, error);
      
      payment.retryCount++;
      payment.failureReason = error instanceof Error ? error.message : 'Unknown error';
      
      if (payment.retryCount >= 5) {
        payment.status = 'FAILED';
      }
      
      await this.saveBufferedPayment(payment);
    }
  }

  // ============================================================================
  // PAYMENT METHOD HANDLERS
  // ============================================================================

  private async processCashPayment(payment: BufferedPaymentIntent): Promise<PaymentCaptureResult> {
    try {
      const response = await brain.process_payment2({
        order_id: payment.orderId,
        payment_method: 'CASH',
        amount: payment.amount,
        idempotency_key: payment.idempotencyKey
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          paymentIntentId: result.payment_id
        };
      } else {
        const result = await response.json();
        return {
          success: false,
          error: result.detail || 'Failed to process cash payment',
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        shouldRetry: true
      };
    }
  }

  private async processCardPayment(payment: BufferedPaymentIntent): Promise<PaymentCaptureResult> {
    try {
      // If we don't have a payment intent yet, create one
      if (!payment.paymentIntentId) {
        const intentResult = await this.createStripePaymentIntent(
          payment.orderId, 
          payment.amount, 
          payment.cardDetails
        );
        
        if (!intentResult.success) {
          return intentResult;
        }
        
        payment.paymentIntentId = intentResult.paymentIntentId;
        payment.metadata.stripeClientSecret = intentResult.clientSecret;
        await this.saveBufferedPayment(payment);
      }

      // Now capture the payment intent
      const response = await brain.process_payment2({
        order_id: payment.orderId,
        payment_method: 'CARD',
        amount: payment.amount,
        stripe_payment_intent_id: payment.paymentIntentId,
        idempotency_key: payment.idempotencyKey
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          paymentIntentId: result.payment_id || payment.paymentIntentId
        };
      } else {
        const result = await response.json();
        return {
          success: false,
          error: result.detail || 'Failed to capture card payment',
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        shouldRetry: true
      };
    }
  }

  private async createStripePaymentIntent(
    orderId: string, 
    amount: number, 
    cardDetails?: any
  ): Promise<PaymentCaptureResult> {
    try {
      // In a real implementation, you'd call your backend to create the intent
      // For now, we'll simulate this
      const response = await brain.create_payment_intent({
        order_id: orderId,
        amount: amount,
        currency: 'gbp',
        card_details: cardDetails
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          paymentIntentId: result.payment_intent_id,
          clientSecret: result.client_secret
        };
      } else {
        const result = await response.json();
        return {
          success: false,
          error: result.detail || 'Failed to create payment intent',
          shouldRetry: response.status >= 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        shouldRetry: true
      };
    }
  }

  // ============================================================================
  // DATA MANAGEMENT - NEW: Using cache + IndexedDB persistence
  // ============================================================================

  private async saveBufferedPayment(payment: BufferedPaymentIntent): Promise<void> {
    // Save to memory cache
    this.paymentCache.set(payment.id, payment);
    
    // Persist to IndexedDB via sync operations
    try {
      await offlineStorage.addSyncOperation({
        type: 'CREATE_PAYMENT',
        data: { paymentIntent: payment },
        status: 'PENDING',
        retry_count: 0
      });
    } catch (error) {
      console.error('❌ [PaymentManager] Failed to persist payment to storage:', error);
    }
  }

  private getPendingPayments(): BufferedPaymentIntent[] {
    if (!this.isLoaded) return [];
    
    return Array.from(this.paymentCache.values())
      .filter(payment => payment.status === 'PENDING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getAllPayments(): Promise<BufferedPaymentIntent[]> {
    if (!this.isLoaded) {
      await this.loadPaymentsFromStorage();
    }
    
    return Array.from(this.paymentCache.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ============================================================================
  // STATUS AND MONITORING
  // ============================================================================

  async getStatus(): Promise<PaymentManagerStatus> {
    if (!this.isLoaded) {
      await this.loadPaymentsFromStorage();
    }
    
    const allPayments = Array.from(this.paymentCache.values());
    const pendingPayments = allPayments.filter(p => p.status === 'PENDING');
    const failedPayments = allPayments.filter(p => p.status === 'FAILED');
    
    return {
      isOnline: !getOfflineStatus(),
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      isProcessing: this.isProcessing,
      lastProcessingAttempt: pendingPayments.length > 0 ? 
        Math.max(...pendingPayments.map(p => new Date(p.createdAt).getTime())).toString() : undefined,
      errors: failedPayments.slice(0, 5).map(p => p.failureReason || 'Unknown error')
    };
  }

  onStatusChange(callback: (status: PaymentManagerStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  private async notifyStatusCallbacks(): Promise<void> {
    if (this.statusCallbacks.length === 0) return;
    
    try {
      const status = await this.getStatus();
      this.statusCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('❌ [PaymentManager] Error in status callback:', error);
        }
      });
    } catch (error) {
      console.error('❌ [PaymentManager] Error getting status for callbacks:', error);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  async cleanup(): Promise<void> {
    this.stopPeriodicProcessing();
    
    // Clean up old completed/failed payments (keep for 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const allPayments = Array.from(this.paymentCache.values());
    
    for (const payment of allPayments) {
      const paymentDate = new Date(payment.createdAt);
      if (paymentDate < thirtyDaysAgo && payment.status !== 'PENDING') {
        this.paymentCache.delete(payment.id);
        console.log(`🗑️ [PaymentManager] Cleaned up old payment: ${payment.id}`);
      }
    }
  }
}

// Singleton instance
export const bufferedPaymentManager = new BufferedPaymentManager();

// Initialize with Stripe (you'd get this from your app config)
// bufferedPaymentManager.initialize('pk_test_...');
