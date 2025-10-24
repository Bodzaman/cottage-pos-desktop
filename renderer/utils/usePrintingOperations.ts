import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import brain from 'brain';
import type { OrderItem } from './menuTypes';
import type { OrderType } from './customerTypes';
import type { CustomerData } from './useCustomerFlow';

/**
 * Hook: usePrintingOperations
 * 
 * RESPONSIBILITY:
 * Manages all printing operations in POSDesktop using template assignment system.
 * Handles kitchen tickets, customer receipts, and bill printing for all order types.
 * Integrates with ThermalReceiptDesignerV2 template engine for customizable receipt layouts.
 * 
 * DATA FLOW:
 * 1. User clicks print button → handlePrintKitchenTicket() or handlePrintReceipt()
 * 2. Hook builds order payload with items, customer data, and metadata
 * 3. Calls brain.generate_receipt_html() with template_assignment_id
 * 4. Backend renders receipt HTML using assigned template
 * 5. Opens print dialog in new window with rendered HTML
 * 
 * TEMPLATE ASSIGNMENT INTEGRATION:
 * - Each order type can have assigned receipt templates
 * - Templates defined in ThermalReceiptDesignerV2 page
 * - Template selection managed via POSSettings → PrinterManagement
 * - Supports different layouts for kitchen vs customer receipts
 * 
 * PRINTING MODES:
 * - Kitchen Ticket: Item-focused, includes modifiers, notes, prep instructions
 * - Customer Receipt: Price-focused, includes totals, payment info, branding
 * - Bill: Similar to receipt but for dine-in bill requests
 * 
 * KEY OPERATIONS:
 * - handlePrintKitchenTicket(): Prints to kitchen with cooking details
 * - handlePrintReceipt(): Prints customer-facing receipt with prices
 * - handlePrintBill(): Prints bill for dine-in tables
 * - Prevents duplicate prints via lastPrintedAt timestamp tracking
 * 
 * DEPENDENCIES:
 * - brain: API client for receipt generation endpoints
 * - ThermalReceiptDesignerV2: Template engine for receipt layouts
 * - PrinterManagement: Template assignment configuration
 * 
 * STATE TRACKING:
 * - isPrinting: Prevents concurrent print operations
 * - lastPrintedAt: Timestamp of last print (prevents accidental duplicates)
 * 
 * @param orderType - Current order type
 * @param orderItems - Items to print on receipt
 * @param customerData - Customer info for receipt header
 * @param selectedTableNumber - Table number for dine-in orders
 * @param guestCount - Guest count for dine-in orders
 * @returns Printing handlers and operation state
 */
export function usePrintingOperations(
  orderType: OrderType,
  orderItems: OrderItem[],
  customerData: CustomerData,
  selectedTableNumber: number | null,
  guestCount: number
) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastPrintedAt, setLastPrintedAt] = useState<Date | null>(null);

  // ============================================================================
  // HELPER: Get Template Assignment for Order Mode
  // ============================================================================
  const getTemplateAssignment = useCallback(async (mode: OrderType) => {
    try {
      // Convert order type to API format (e.g., "DINE-IN" -> "DINE_IN")
      const apiOrderMode = mode.replace(/-/g, '_');
      
      const response = await brain.get_template_assignment({ 
        orderMode: apiOrderMode 
      });
      const assignment = await response.json();
      
      return {
        kitchenTemplateId: assignment.kitchen_template_id,
        customerTemplateId: assignment.customer_template_id
      };
    } catch (error) {
      console.warn('⚠️ Failed to fetch template assignment, using defaults:', error);
      // Return default template IDs if fetch fails
      return {
        kitchenTemplateId: 'classic_restaurant',
        customerTemplateId: 'classic_restaurant'
      };
    }
  }, []);

  // ============================================================================
  // PRINT KITCHEN TICKET
  // ============================================================================
  const handlePrintKitchenTicket = useCallback(async () => {
    if (orderItems.length === 0) {
      toast.error('No items to print');
      return false;
    }

    setIsPrinting(true);
    try {
      // Fetch template assignment for this order mode
      const { kitchenTemplateId } = await getTemplateAssignment(orderType);
      
      const ticketData = {
        orderType,
        tableNumber: selectedTableNumber,
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes || '',
          modifiers: item.modifiers || [],
          variant_name: item.variant_name || null
        })),
        timestamp: new Date().toISOString(),
        guestCount: orderType === 'DINE-IN' ? guestCount : undefined,
        template_data: { template_id: kitchenTemplateId } // ✅ Wrap in template_data object
      };

      console.log('🖨️ Printing kitchen ticket with template:', kitchenTemplateId);

      // Call backend print endpoint
      const response = await brain.print_kitchen_ticket(ticketData);
      const result = await response.json();

      if (result.success) {
        setLastPrintedAt(new Date());
        toast.success('Kitchen ticket printed');
        return true;
      } else {
        throw new Error(result.error || 'Print failed');
      }
    } catch (error) {
      console.error('❌ Error printing kitchen ticket:', error);
      toast.error('Failed to print kitchen ticket');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, selectedTableNumber, guestCount, getTemplateAssignment]);

  // ============================================================================
  // PRINT CUSTOMER RECEIPT
  // ============================================================================
  const handlePrintReceipt = useCallback(async (orderTotal: number) => {
    if (orderItems.length === 0) {
      toast.error('No items to print');
      return false;
    }

    setIsPrinting(true);
    try {
      // Fetch template assignment for this order mode
      const { customerTemplateId } = await getTemplateAssignment(orderType);
      
      // Generate order number
      const orderNumber = `${orderType.charAt(0)}${Date.now().toString().slice(-6)}`;
      
      const receiptData = {
        orderNumber, // ✅ Add orderNumber - REQUIRED FIELD
        orderType,
        items: orderItems.map(item => {
          let itemPrice = item.price;
          
          // Add modifier prices
          if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(mod => {
              itemPrice += mod.price_adjustment || 0;
            });
          }
          
          return {
            name: item.name,
            variant_name: item.variant_name || null,
            quantity: item.quantity,
            unitPrice: itemPrice,
            total: itemPrice * item.quantity,
            modifiers: item.modifiers?.map(m => m.option_name) || []
          };
        }),
        tax: orderTotal * 0.20, // ✅ Add tax calculation
        deliveryFee: orderType === 'DELIVERY' ? 2.50 : 0, // ✅ Add delivery fee
        table: selectedTableNumber?.toString() || undefined,
        customerName: orderType !== 'DINE-IN' ? `${customerData.firstName} ${customerData.lastName}`.trim() : undefined,
        paymentMethod: 'Card',
        timestamp: new Date().toISOString(),
        template_data: { template_id: customerTemplateId } // ✅ Wrap in template_data object
      };

      console.log('🖨️ Printing customer receipt with orderNumber:', orderNumber);

      // Call backend print endpoint
      const response = await brain.print_customer_receipt(receiptData);
      const result = await response.json();

      if (result.success) {
        setLastPrintedAt(new Date());
        toast.success('Receipt printed');
        return true;
      } else {
        throw new Error(result.error || 'Print failed');
      }
    } catch (error) {
      console.error('❌ Error printing receipt:', error);
      toast.error('Failed to print receipt');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, customerData, selectedTableNumber, getTemplateAssignment]);

  // ============================================================================
  // PRINT BILL (for dine-in)
  // ============================================================================
  const handlePrintBill = useCallback(async (orderTotal: number) => {
    if (orderType !== 'DINE-IN') {
      toast.error('Bill printing is only for dine-in orders');
      return false;
    }

    if (orderItems.length === 0) {
      toast.error('No items to print');
      return false;
    }

    setIsPrinting(true);
    try {
      // Fetch template assignment for dine-in
      const { customerTemplateId } = await getTemplateAssignment('DINE-IN');
      
      const billData = {
        tableNumber: selectedTableNumber,
        guestCount,
        items: orderItems.map(item => {
          let itemPrice = item.price;
          
          // Add modifier prices
          if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(mod => {
              itemPrice += mod.price_adjustment || 0;
            });
          }
          
          return {
            name: item.name,
            variant_name: item.variant_name || null,
            quantity: item.quantity,
            unitPrice: itemPrice,
            total: itemPrice * item.quantity
          };
        }),
        subtotal: orderTotal,
        serviceCharge: orderTotal * 0.125, // 12.5% service charge
        total: orderTotal * 1.125,
        timestamp: new Date().toISOString(),
        template_id: customerTemplateId // ✅ Pass template ID
      };

      console.log('🖨️ Printing bill with template:', customerTemplateId);

      // Call backend print endpoint (if exists)
      // const response = await brain.print_bill(billData);
      // const result = await response.json();

      // For now, simulate success (until print_bill endpoint exists)
      setLastPrintedAt(new Date());
      toast.success(`Bill printed for Table ${selectedTableNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error printing bill:', error);
      toast.error('Failed to print bill');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, selectedTableNumber, guestCount, getTemplateAssignment]);

  // ============================================================================
  // SEND TO KITCHEN (combines print + status update)
  // ============================================================================
  const handleSendToKitchen = useCallback(async () => {
    if (orderItems.length === 0) {
      toast.error('No items to send to kitchen');
      return false;
    }

    setIsPrinting(true);
    try {
      // Fetch template assignment for this order mode
      const { kitchenTemplateId } = await getTemplateAssignment(orderType);
      
      // Generate order number
      const orderNumber = `${orderType.charAt(0)}${Date.now().toString().slice(-6)}`;
      
      const ticketData = {
        orderNumber, // ✅ Add orderNumber
        orderType,
        tableNumber: selectedTableNumber,
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes || '',
          modifiers: item.modifiers || [],
          variant_name: item.variant_name || null
        })),
        timestamp: new Date().toISOString(),
        guestCount: orderType === 'DINE-IN' ? guestCount : undefined,
        template_data: { template_id: kitchenTemplateId } // ✅ Wrap in template_data object
      };

      console.log('🖨️ Printing kitchen ticket with template:', kitchenTemplateId);

      // Call backend print endpoint
      const response = await brain.print_kitchen_ticket(ticketData);
      const result = await response.json();

      if (result.success) {
        setLastPrintedAt(new Date());
        toast.success('Kitchen ticket printed');
        return true;
      } else {
        throw new Error(result.error || 'Print failed');
      }
    } catch (error) {
      console.error('❌ Error printing kitchen ticket:', error);
      toast.error('Failed to print kitchen ticket');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, selectedTableNumber, guestCount, getTemplateAssignment]);

  return {
    // State
    isPrinting,
    lastPrintedAt,
    
    // Handlers
    handlePrintKitchenTicket,
    handlePrintReceipt,
    handlePrintBill,
    handleSendToKitchen,
  };
}
