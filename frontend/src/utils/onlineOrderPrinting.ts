/**
 * Online Order Printing Utility
 * Handles print job creation for online orders
 */

import { supabase } from './supabaseClient';

export interface OnlineOrderForPrint {
  id: string;
  orderNumber: string;
  orderType: 'DELIVERY' | 'COLLECTION';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    variant?: string;
    modifiers?: Array<{ name: string; price?: number }>;
    specialInstructions?: string;
  }>;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  specialInstructions?: string;
  allergenNotes?: string;
}

/**
 * Create a print job for an online order
 * This creates a kitchen ticket print job via the print_jobs RPC
 */
export async function createPrintJobForOrder(order: OnlineOrderForPrint): Promise<boolean> {
  try {
    const result = await supabase.rpc('create_print_job', {
      p_job_type: 'KITCHEN_TICKET',
      p_order_data: {
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        items: order.items,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        specialInstructions: order.specialInstructions,
        allergenNotes: order.allergenNotes,
      },
      p_printer_id: null,
      p_priority: 3, // High priority for online orders
    });

    if (result.error) {
      console.error('Failed to create print job:', result.error);
      return false;
    }

    console.log('Print job created for order:', order.orderNumber);
    return true;
  } catch (error) {
    console.error('Error creating print job:', error);
    return false;
  }
}

/**
 * Create a customer receipt print job for an online order
 */
export async function createReceiptPrintJob(order: OnlineOrderForPrint): Promise<boolean> {
  try {
    const result = await supabase.rpc('create_print_job', {
      p_job_type: 'CUSTOMER_RECEIPT',
      p_order_data: {
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
      },
      p_printer_id: null,
      p_priority: 5, // Lower priority than kitchen ticket
    });

    if (result.error) {
      console.error('Failed to create receipt print job:', result.error);
      return false;
    }

    console.log('Receipt print job created for order:', order.orderNumber);
    return true;
  } catch (error) {
    console.error('Error creating receipt print job:', error);
    return false;
  }
}
