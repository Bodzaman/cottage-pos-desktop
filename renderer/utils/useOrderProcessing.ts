import { useCallback } from 'react';
import { toast } from 'sonner';
import brain from 'brain';
import type { OrderItem } from './menuTypes';
import type { OrderType } from './customerTypes';
import type { CustomerData } from './useCustomerFlow';
import { useCustomerDataStore } from './customerDataStore';

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
 * - DINE-IN: Requires orderItems + selectedTableNumber + guestCount
 * - COLLECTION/WAITING: Requires orderItems + customer (firstName, lastName, phone)
 * - DELIVERY: Requires orderItems + customer + delivery address
 * 
 * ORDER PAYLOAD STRUCTURE:
 * Common: order_type, items[], total, status, payment_status, created_at
 * DINE-IN: + table_number, guest_count
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
 * - onDineInConfirm: Opens guest count modal for DINE-IN orders
 * - onCustomerDetailsRequired: Opens customer modal for COLLECTION/DELIVERY
 * - onOrderComplete: Resets POSDesktop state after successful submission
 * 
 * @param orderType - Current order type
 * @param orderItems - Items in the current order
 * @param customerData - Customer information from useCustomerFlow
 * @param selectedTableNumber - Selected table for DINE-IN
 * @param guestCount - Guest count for DINE-IN
 * @param onOrderComplete - Optional callback after successful order submission
 * @returns Order processing handlers and validation utilities
 */
export function useOrderProcessing(
  orderType: OrderType,
  orderItems: OrderItem[],
  customerData: CustomerData,
  selectedTableNumber: number | null,
  guestCount: number,
  onOrderComplete?: () => void
) {
  const customerDataStore = useCustomerDataStore();

  // ============================================================================
  // CALCULATE ORDER TOTAL
  // ============================================================================
  const calculateTotal = useCallback((): number => {
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
  }, [orderItems]);

  // ============================================================================
  // VALIDATE ORDER DATA
  // ============================================================================
  const validateOrder = useCallback((): { valid: boolean; message?: string } => {
    // Check if there are items in the order
    if (orderItems.length === 0) {
      return { valid: false, message: 'Please add items to the order' };
    }

    // Validate based on order type
    switch (orderType) {
      case 'DINE-IN':
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
  }, [orderType, orderItems, customerData, selectedTableNumber, guestCount]);

  // ============================================================================
  // SUBMIT ORDER
  // ============================================================================
  const handleSubmitOrder = useCallback(async () => {
    const validation = validateOrder();
    if (!validation.valid) {
      toast.error(validation.message || 'Order validation failed');
      return;
    }

    try {
      // Build order payload based on order type
      const orderPayload: any = {
        order_id: `POS-${Date.now()}`, // Generate unique order ID
        order_type: orderType,
        items: orderItems.map(item => ({
          item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || '',
          modifiers: item.modifiers || []
        })),
        subtotal: calculateTotal(),
        total_amount: calculateTotal(),
        payment_method: 'cash', // Default for POS
        payment_status: 'paid',
      };

      // Add order type specific data
      if (orderType === 'DINE-IN') {
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
      toast.error('Failed to submit order. Please try again.');
      return { success: false };
    }
  }, [orderType, orderItems, customerData, selectedTableNumber, guestCount, calculateTotal, validateOrder, customerDataStore, onOrderComplete]);

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
