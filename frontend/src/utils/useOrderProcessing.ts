import { useCallback } from 'react';
import { toast } from 'sonner';
import brain from 'brain';
import type { OrderItem } from './types';
import type { OrderType } from './customerTypes';
import type { CustomerData } from './useCustomerFlow';
import { useCustomerDataStore } from './customerDataStore';
import { usePOSCustomerStore } from './posCustomerStore';
import { usePOSOrderStore } from './posOrderStore';
import { usePOSAuth } from './usePOSAuth';

/**
 * Hook: useOrderProcessing
 * 
 * RESPONSIBILITY:
 * Centralizes order submission and payment processing logic for all order types.
 * Validates order completeness, builds API payloads, and handles order finalization.
 * Acts as the bridge between POSDesktop UI state and backend order creation.
 * 
 * DATA FLOW:
 * 1. POSDesktop calls processOrder() when user confirms order
 * 2. validateOrder() checks order type + items + customer data completeness
 * 3. If valid → builds order payload with type-specific fields
 * 4. Submits to backend via brain.create_order() (currently simulated)
 * 5. On success → triggers callbacks to reset UI state
 * 
 * VALIDATION BY ORDER TYPE:
 * - DINE_IN: Requires orderItems + selectedTableNumber + guestCount
 * - COLLECTION/WAITING: Requires orderItems + customer (firstName, lastName, phone)
 * - DELIVERY: Requires orderItems + customer + delivery address
 *
 * ORDER PAYLOAD STRUCTURE:
 * Common: order_type, items[], total, status, payment_status, created_at
 * DINE_IN: + table_number, guest_count
 * COLLECTION/WAITING/DELIVERY: + customer_data {firstName, lastName, phone, email, notes}
 * DELIVERY: + delivery_address {address, street, city, postcode, deliveryNotes}
 * 
 * KEY OPERATIONS:
 * - processOrder(): Main orchestrator with conditional flows per order type
 * - validateOrder(): Pre-submission validation with error messages
 * - handleSubmitOrder(): Builds payload and calls backend API
 * - calculateTotal(): Computes order total including modifier prices
 * 
 * DEPENDENCIES:
 * - brain: TypeScript HTTP client for backend API calls
 * - customerDataStore: Global store for customer data persistence
 * - useCustomerFlow: Provides customerData structure
 * 
 * CALLBACKS:
 * - onDineInConfirm: Opens guest count modal for DINE_IN orders
 * - onCustomerDetailsRequired: Opens customer modal for COLLECTION/DELIVERY
 * - onOrderComplete: Resets POSDesktop state after successful submission
 *
 * @param orderType - Current order type (DINE_IN, COLLECTION, DELIVERY, or WAITING)
 * @param customerData - Customer information from useCustomerFlow
 * @param selectedTableNumber - Selected table for DINE_IN
 * @param guestCount - Guest count for DINE_IN
 * @param onOrderComplete - Optional callback after successful order submission
 * @returns Order processing handlers and validation utilities
 *
 * NOTE: orderItems is now obtained directly from usePOSOrderStore to prevent
 * parent re-renders when cart changes (fixes menu flicker issue)
 */
export function useOrderProcessing(
  orderType: OrderType,
  customerData: CustomerData,
  selectedTableNumber: number | null,
  guestCount: number,
  onOrderComplete?: () => void
) {
  const customerDataStore = useCustomerDataStore();

  // 🔧 FIX: Do NOT subscribe to orderItems reactively!
  // Subscribing causes this hook to re-render when cart changes,
  // which causes POSDesktop to re-render and flicker the menu.
  // Instead, use usePOSOrderStore.getState().orderItems imperatively in callbacks.

  // ============================================================================
  // CALCULATE ORDER TOTAL
  // ============================================================================
  const calculateTotal = useCallback((): number => {
    // 🔧 FIX: Use imperative access - no reactive subscription
    const orderItems = usePOSOrderStore.getState().orderItems;
    return orderItems.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;

      // Add modifier prices if present
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          itemTotal += (modifier.price_adjustment || 0) * item.quantity;
        });
      }

      return total + itemTotal;
    }, 0);
  }, []);  // Empty deps - stable callback

  // ============================================================================
  // VALIDATE ORDER DATA
  // ============================================================================
  const validateOrder = useCallback((): { valid: boolean; message?: string } => {
    // 🔧 FIX: Use imperative access - no reactive subscription
    const orderItems = usePOSOrderStore.getState().orderItems;

    // Validate order type is a known value
    const validOrderTypes = ['DINE_IN', 'COLLECTION', 'DELIVERY', 'WAITING'];
    if (!validOrderTypes.includes(orderType)) {
      return { valid: false, message: `Invalid order type: ${orderType}` };
    }

    // Check if there are items in the order
    if (orderItems.length === 0) {
      return { valid: false, message: 'Please add items to the order' };
    }

    // Validate all items have valid prices
    const invalidPriceItem = orderItems.find(item =>
      typeof item.price !== 'number' || item.price < 0 || isNaN(item.price)
    );
    if (invalidPriceItem) {
      return { valid: false, message: `Invalid price for item: ${invalidPriceItem.name}` };
    }

    // Validate all items have valid quantities
    const invalidQuantityItem = orderItems.find(item =>
      typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)
    );
    if (invalidQuantityItem) {
      return { valid: false, message: `Invalid quantity for item: ${invalidQuantityItem.name}` };
    }

    // Validate based on order type (using underscore format to match database ENUM)
    switch (orderType) {
      case 'DINE_IN':
        if (selectedTableNumber === null) {
          return { valid: false, message: 'Please select a table' };
        }
        if (guestCount <= 0) {
          return { valid: false, message: 'Please set guest count' };
        }
        break;

      case 'COLLECTION':
      case 'WAITING':
        if (!customerData.firstName?.trim() || !customerData.lastName?.trim() || !customerData.phone?.trim()) {
          return { valid: false, message: 'Please complete customer details' };
        }
        break;

      case 'DELIVERY':
        if (!customerData.firstName?.trim() || !customerData.lastName?.trim() || !customerData.phone?.trim()) {
          return { valid: false, message: 'Please complete customer details' };
        }
        if (!customerData.address?.trim() && (!customerData.street?.trim() || !customerData.postcode?.trim())) {
          return { valid: false, message: 'Please provide delivery address' };
        }
        break;

      default:
        return { valid: false, message: 'Invalid order type' };
    }

    return { valid: true };
  }, [orderType, customerData, selectedTableNumber, guestCount]);  // 🔧 FIX: REMOVED orderItems from deps

  // ============================================================================
  // SUBMIT ORDER
  // ============================================================================
  const handleSubmitOrder = useCallback(async () => {
    const validation = validateOrder();
    if (!validation.valid) {
      toast.error(validation.message || 'Order validation failed');
      return;
    }

    // 🔧 FIX: Use imperative access - no reactive subscription
    const orderItems = usePOSOrderStore.getState().orderItems;

    try {
      // Generate idempotency key to prevent duplicate orders
      const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Determine pricing mode based on order type
      const pricingMode = orderType === 'DINE_IN' ? 'DINE_IN' :
                         orderType === 'DELIVERY' ? 'DELIVERY' : 'COLLECTION';

      // Handle WAITING as order_subtype of COLLECTION
      let normalizedOrderType = orderType;
      let orderSubtype = null;
      if (orderType === 'WAITING') {
        normalizedOrderType = 'COLLECTION';
        orderSubtype = 'WAITING';
      }

      // Get authenticated staff user for accountability
      const staffUser = usePOSAuth.getState().user;

      // Build order payload based on order type
      const orderPayload: any = {
        order_id: `POS-${Date.now()}`, // Generate unique order ID
        idempotency_key: idempotencyKey, // Prevent duplicate orders
        order_type: normalizedOrderType, // DINE_IN, COLLECTION, or DELIVERY (no WAITING)
        order_subtype: orderSubtype, // WAITING or null
        pricing_mode: pricingMode, // Track which pricing tier was used
        staff_id: staffUser?.userId || null, // Track which staff member created the order
        items: orderItems.map(item => ({
          item_id: item.menu_item_id,
          menu_item_id: item.menu_item_id, // For ThermalPreview section divider resolution
          category_id: item.category_id,   // For ThermalPreview section divider grouping
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || '',
          modifiers: item.modifiers || []
        })),
        subtotal: calculateTotal(),
        total_amount: calculateTotal(),
        payment_method: 'cash', // Default for POS
        payment_status: 'PAID', // Uppercase to match database enum
      };

      // Add order type specific data
      if (orderType === 'DINE_IN') {
        orderPayload.table_number = selectedTableNumber?.toString();
        orderPayload.guest_count = guestCount;
        orderPayload.customer_name = 'Dine-In Guest';
      } else {
        // COLLECTION, WAITING, DELIVERY
        orderPayload.customer_name = `${customerData.firstName} ${customerData.lastName}`.trim();
        orderPayload.customer_phone = customerData.phone;
        orderPayload.customer_email = customerData.email || null;
        orderPayload.notes = customerData.notes || null;
      }

      // CRM: Include customer_id for linking to customer records
      const posCustomerData = usePOSCustomerStore.getState().customerData;
      if (posCustomerData.customerId) {
        orderPayload.customer_id = posCustomerData.customerId;
      }

      console.log('📤 Submitting POS order:', orderPayload);

      // Submit to backend using unified pos_orders API
      const response = await brain.create_pos_order(orderPayload);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message);
      }

      console.log('✅ Order created:', data);

      // Show success with order number
      toast.success(
        `Order ${data.order_number} submitted successfully!`,
        { duration: 4000 }
      );

      // Clear customer data after successful order
      customerDataStore.clearCustomerData();

      // Call completion callback if provided
      if (onOrderComplete) {
        onOrderComplete();
      }

      return { success: true, order_number: data.order_number, order_id: data.database_order_id };
    } catch (error) {
      console.error('❌ Error submitting order:', error);

      // OFFLINE FALLBACK: Queue order for later sync if network fails
      try {
        const { outboxSyncManager } = await import('./outboxSyncManager');
        const offlineOrderId = await outboxSyncManager.queueOrderCreation({
          order_type: orderType,
          table_number: selectedTableNumber ?? undefined,
          guest_count: guestCount,
          items: orderItems,
          total_amount: calculateTotal(),
          customer_data: customerData,
          payment_method: 'cash',
        });

        console.log('📥 Order queued for offline sync:', offlineOrderId);
        toast.warning('Network unavailable — order saved locally and will sync when online.', { duration: 6000 });

        // Still clear cart since the order is safely queued
        if (onOrderComplete) onOrderComplete();

        return { success: true, order_number: offlineOrderId, offline: true };
      } catch (queueError) {
        console.error('❌ Failed to queue order offline:', queueError);
        toast.error('Failed to submit order. Please try again.');
        return { success: false };
      }
    }
  }, [orderType, customerData, selectedTableNumber, guestCount, calculateTotal, validateOrder, customerDataStore, onOrderComplete]);  // 🔧 FIX: REMOVED orderItems from deps

  // ============================================================================
  // HANDLE PAYMENT
  // ============================================================================
  const handlePayment = useCallback(async (paymentMethod: 'cash' | 'card' | 'online') => {
    const validation = validateOrder();
    if (!validation.valid) {
      toast.error(validation.message || 'Order validation failed');
      return false;
    }

    try {
      const total = calculateTotal();
      console.log(`💳 Processing ${paymentMethod} payment for £${total.toFixed(2)}`);

      // Process payment based on method
      switch (paymentMethod) {
        case 'cash':
          toast.success(`Cash payment of £${total.toFixed(2)} accepted`);
          break;

        case 'card':
          // Simulate card processing
          toast.success(`Card payment of £${total.toFixed(2)} processed`);
          break;

        case 'online':
          // Redirect to payment page or open payment modal
          toast.info('Redirecting to payment...');
          break;

        default:
          throw new Error('Invalid payment method');
      }

      // Submit order after successful payment
      await handleSubmitOrder();

      return true;
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast.error('Payment failed. Please try again.');
      return false;
    }
  }, [validateOrder, calculateTotal, handleSubmitOrder]);

  return {
    // Utilities
    calculateTotal,
    validateOrder,
    
    // Handlers
    handleSubmitOrder,
    handlePayment,
  };
}
