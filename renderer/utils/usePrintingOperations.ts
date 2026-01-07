import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from './supabaseClient';
import type { OrderType } from './masterTypes';
import type { OrderItem } from './menuTypes';
import type { CustomerData } from './useCustomerFlow';
import { useTemplateAssignments } from './useTemplateAssignments';
import { getElectronHeaders } from './electronDetection';
import { apiClient } from 'app';

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
  
  // Use validated template assignments hook
  const templateAssignments = useTemplateAssignments();

  // ============================================================================
  // HELPER: Get Template Assignment for Order Mode
  // ============================================================================
  const getTemplateAssignment = useCallback(async (mode: OrderType) => {
    try {
      // Convert order type to API format (e.g., "DINE-IN" -> "DINE_IN")
      const apiOrderMode = mode.replace(/-/g, '_');
      
      const response = await apiClient.get_template_assignment({ 
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
  const handlePrintKitchen = useCallback(async () => {
    if (orderItems.length === 0) {
      toast.error('No items to print');
      return false;
    }

    setIsPrinting(true);
    try {
      // Fetch template assignment for this order mode
      const { kitchenTemplateId } = await getTemplateAssignment(orderType);
      
      // Generate order number
      const orderNumber = `${orderType.charAt(0)}${Date.now().toString().slice(-6)}`;
      
      // Build print job data
      const jobData = {
        p_job_type: 'KITCHEN_TICKET',
        p_order_data: {
          orderNumber,
          orderType,
          items: orderItems.map(item => ({
            name: item.name,
            variant_name: item.variant_name || null,
            quantity: item.quantity,
            modifiers: item.modifiers?.map(m => m.option_name) || [],
            special_instructions: item.special_instructions || null
          })),
          table: selectedTableNumber?.toString() || undefined,
          customerName: orderType !== 'DINE-IN' ? `${customerData.firstName} ${customerData.lastName}`.trim() : undefined,
          timestamp: new Date().toISOString(),
          template_id: kitchenTemplateId
        },
        p_printer_id: null, // Auto-select based on job type
        p_priority: 10 // High priority for kitchen tickets
      };

      console.log('🖨️ Creating kitchen ticket print job:', jobData);

      // Call Supabase RPC to create print job
      const { data, error } = await supabase.rpc('create_print_job', jobData);

      if (error) {
        throw new Error(error.message || 'Failed to create print job');
      }

      if (data) {
        setLastPrintedAt(new Date());
        toast.success('Kitchen ticket queued for printing');
        console.log('✅ Print job created:', data);
        return true;
      } else {
        throw new Error('No job ID returned');
      }
    } catch (error: any) {
      console.error('❌ Error printing kitchen ticket:', error);
      toast.error(`Kitchen print failed: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderItems, orderType, selectedTableNumber, customerData, getTemplateAssignment]);

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
      
      // Build print job data
      const jobData = {
        p_job_type: 'CUSTOMER_RECEIPT',
        p_order_data: {
          orderNumber,
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
          tax: orderTotal * 0.20,
          deliveryFee: orderType === 'DELIVERY' ? 2.50 : 0,
          table: selectedTableNumber?.toString() || undefined,
          customerName: orderType !== 'DINE-IN' ? `${customerData.firstName} ${customerData.lastName}`.trim() : undefined,
          paymentMethod: 'Card',
          timestamp: new Date().toISOString(),
          template_id: customerTemplateId
        },
        p_printer_id: null, // Auto-select based on job type
        p_priority: 5 // Normal priority
      };

      console.log('🖨️ Creating customer receipt print job:', jobData);

      // Call Supabase RPC to create print job
      const { data, error } = await supabase.rpc('create_print_job', jobData);

      if (error) {
        throw new Error(error.message || 'Failed to create print job');
      }

      if (data) {
        setLastPrintedAt(new Date());
        toast.success('Receipt queued for printing');
        console.log('✅ Print job created:', data);
        return true;
      } else {
        throw new Error('No job ID returned');
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

    if (!selectedTableNumber) {
      toast.error('Table number is required for bill printing');
      return false;
    }

    setIsPrinting(true);
    try {
      // Fetch validated customer template for dine-in bills
      const customerTemplateId = await templateAssignments.getCustomerTemplateId('DINE-IN');
      
      // Calculate bill totals
      const subtotal = orderTotal;
      const serviceCharge = orderTotal * 0.125; // 12.5% service charge
      const tax = (orderTotal + serviceCharge) * 0.20; // 20% VAT on subtotal + service
      const total = subtotal + serviceCharge + tax;
      
      // Build items for receipt
      const receiptItems = orderItems.map(item => {
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
      });

      // Build print job data
      const jobData = {
        job_type: 'BILL',
        order_data: {
          orderNumber: `TABLE-${selectedTableNumber}-${Date.now()}`,
          orderType: 'DINE-IN',
          items: receiptItems,
          tax,
          deliveryFee: 0,
          tableNumber: selectedTableNumber,
          guestCount,
          subtotal,
          serviceCharge,
          total,
          timestamp: new Date().toISOString(),
          template_id: customerTemplateId || 'classic_restaurant',
          table: `Table ${selectedTableNumber}`,
          paymentMethod: 'Card'
        },
        printer_id: null, // Auto-select based on job type
        priority: 5 // Normal priority
      };

      console.log('🖨️ Creating bill print job for table:', selectedTableNumber);
      if (customerTemplateId) {
        console.log(`✅ Using validated template: ${customerTemplateId}`);
      } else {
        console.log('⚠️ No template assigned - using default formatting');
      }

      // Call Supabase RPC to create print job
      const { data, error } = await supabase.rpc('create_print_job', jobData);

      if (error) {
        throw new Error(error.message || 'Failed to create print job');
      }

      if (data) {
        setLastPrintedAt(new Date());
        toast.success(`✅ Bill queued for Table ${selectedTableNumber}`);
        console.log('✅ Print job created:', data);
        return true;
      } else {
        throw new Error('No job ID returned');
      }
    } catch (error) {
      console.error('❌ Error printing bill:', error);
      toast.error('Failed to print bill');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, selectedTableNumber, guestCount, templateAssignments]);

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
      
      // Build print job data
      const jobData = {
        job_type: 'KITCHEN_TICKET',
        order_data: {
          orderNumber,
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
          template_id: kitchenTemplateId
        },
        printer_id: null, // Auto-select based on job type
        priority: 5 // Normal priority
      };

      console.log('🖨️ Sending to kitchen with template:', kitchenTemplateId);

      // Call Supabase RPC to create print job
      const { data, error } = await supabase.rpc('create_print_job', jobData);

      if (error) {
        throw new Error(error.message || 'Failed to create print job');
      }

      if (data) {
        setLastPrintedAt(new Date());
        toast.success('Order sent to kitchen');
        console.log('✅ Kitchen ticket queued:', data);
        return true;
      } else {
        throw new Error('No job ID returned');
      }
    } catch (error) {
      console.error('❌ Error sending to kitchen:', error);
      toast.error('Failed to send to kitchen');
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
    handlePrintKitchen,
    handlePrintReceipt,
    handlePrintBill,
    handleSendToKitchen,
  };
}
