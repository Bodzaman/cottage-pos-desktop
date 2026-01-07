import { OrderItem } from './menuTypes';
import { TableOrderItem } from './tableTypes';
import { toast } from 'sonner';
import { apiClient } from 'app';

/**
 * Kitchen Ticket Print Job Result
 */
export interface KitchenPrintJob {
  success: boolean;
  ticketId: string;
  itemCount: number;
  tableNumber: number;
  timestamp: Date;
  error?: string;
}

/**
 * Bill Print Job Result
 */
export interface BillPrintJob {
  success: boolean;
  billId: string;
  total: number;
  tableNumber: number;
  timestamp: Date;
  error?: string;
}

/**
 * Receipt Print Job Result
 */
export interface ReceiptPrintJob {
  success: boolean;
  receiptId: string;
  total: number;
  timestamp: Date;
  error?: string;
}

/**
 * Comprehensive Printing Service for POS Operations
 * Handles kitchen tickets, bills, and receipts with error handling
 */
class PrintingService {
  private static instance: PrintingService;
  
  // Printer configuration
  private printerConfig = {
    kitchen: {
      enabled: true,
      printerName: 'Kitchen Printer',
      paperWidth: 80, // mm
    },
    receipt: {
      enabled: true,
      printerName: 'Receipt Printer', 
      paperWidth: 58, // mm
    }
  };

  private constructor() {}

  static getInstance(): PrintingService {
    if (!PrintingService.instance) {
      PrintingService.instance = new PrintingService();
    }
    return PrintingService.instance;
  }

  /**
   * Print kitchen ticket for order items
   * @param tableNumber - Table number for the order
   * @param items - Items to print on kitchen ticket
   * @param orderId - Unique order identifier
   * @param onlyNewItems - Whether to print only new/unsent items
   */
  printKitchenTicket(
    tableNumber: number,
    items: TableOrderItem[],
    orderId: string,
    onlyNewItems: boolean = false
  ): KitchenPrintJob {
    try {
      // Filter items if only printing new ones
      const itemsToPrint = onlyNewItems 
        ? items.filter(item => !item.sentToKitchen || item.isNewItem)
        : items;

      if (itemsToPrint.length === 0) {
        return {
          success: false,
          ticketId: '',
          itemCount: 0,
          tableNumber,
          timestamp: new Date(),
          error: 'No items to print'
        };
      }

      // Generate unique ticket ID
      const ticketId = `KT-${tableNumber}-${Date.now()}`;
      const timestamp = new Date();

      // Format kitchen ticket content
      const ticketContent = this.formatKitchenTicket({
        ticketId,
        tableNumber,
        orderId,
        items: itemsToPrint,
        timestamp,
        onlyNewItems
      });

      // In production, this would integrate with actual printer API
      // For now, we simulate the print job and log the content
      console.log('🖨️ KITCHEN TICKET PRINT JOB:', {
        ticketId,
        tableNumber,
        itemCount: itemsToPrint.length,
        content: ticketContent
      });

      // Simulate printer processing time
      const processingTime = Math.random() * 500 + 200; // 200-700ms
      
      // Mark items as sent to kitchen (update their status)
      itemsToPrint.forEach(item => {
        item.sentToKitchen = true;
        item.printedOnTicket = true;
        item.lastKitchenPrintAt = timestamp;
        item.isNewItem = false;
      });

      return {
        success: true,
        ticketId,
        itemCount: itemsToPrint.length,
        tableNumber,
        timestamp
      };
    } catch (error) {
      console.error('Kitchen ticket print error:', error);
      return {
        success: false,
        ticketId: '',
        itemCount: 0,
        tableNumber,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Print failed'
      };
    }
  }

  /**
   * Print customer bill
   * @param tableNumber - Table number
   * @param items - Items on the bill
   * @param orderId - Order identifier
   * @param customerData - Customer information
   */
  printBill(
    tableNumber: number,
    items: OrderItem[],
    orderId: string,
    customerData?: any
  ): BillPrintJob {
    try {
      if (items.length === 0) {
        return {
          success: false,
          billId: '',
          total: 0,
          tableNumber,
          timestamp: new Date(),
          error: 'No items on bill'
        };
      }

      // Generate unique bill ID
      const billId = `BILL-${tableNumber}-${Date.now()}`;
      const timestamp = new Date();
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const serviceCharge = subtotal * 0.10; // 10% service charge
      const total = subtotal + serviceCharge;

      // Format bill content
      const billContent = this.formatBill({
        billId,
        tableNumber,
        orderId,
        items,
        subtotal,
        serviceCharge,
        total,
        timestamp,
        customerData
      });

      // Log bill content (in production, would print to receipt printer)
      console.log('🧾 BILL PRINT JOB:', {
        billId,
        tableNumber,
        total,
        content: billContent
      });

      return {
        success: true,
        billId,
        total,
        tableNumber,
        timestamp
      };
    } catch (error) {
      console.error('Bill print error:', error);
      return {
        success: false,
        billId: '',
        total: 0,
        tableNumber,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Print failed'
      };
    }
  }

  /**
   * Print payment receipt
   * @param orderId - Order identifier
   * @param paymentDetails - Payment information
   */
  printReceipt(
    orderId: string,
    paymentDetails: {
      amount: number;
      method: string;
      transactionId?: string;
      customerData?: any;
    }
  ): ReceiptPrintJob {
    try {
      const receiptId = `RCP-${orderId}-${Date.now()}`;
      const timestamp = new Date();

      // Format receipt content
      const receiptContent = this.formatReceipt({
        receiptId,
        orderId,
        paymentDetails,
        timestamp
      });

      console.log('🧾 RECEIPT PRINT JOB:', {
        receiptId,
        amount: paymentDetails.amount,
        method: paymentDetails.method,
        content: receiptContent
      });

      return {
        success: true,
        receiptId,
        total: paymentDetails.amount,
        timestamp
      };
    } catch (error) {
      console.error('Receipt print error:', error);
      return {
        success: false,
        receiptId: '',
        total: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Print failed'
      };
    }
  }

  /**
   * Format kitchen ticket content
   */
  private formatKitchenTicket(data: {
    ticketId: string;
    tableNumber: number;
    orderId: string;
    items: TableOrderItem[];
    timestamp: Date;
    onlyNewItems: boolean;
  }): string {
    const lines = [
      '=============================',
      '      COTTAGE TANDOORI',
      '       KITCHEN TICKET',
      '=============================',
      `Ticket: ${data.ticketId}`,
      `Table: ${data.tableNumber}`,
      `Order: ${data.orderId}`,
      `Time: ${data.timestamp.toLocaleTimeString()}`,
      data.onlyNewItems ? '*** ADDITIONAL ITEMS ***' : '',
      '-----------------------------',
      ''
    ].filter(Boolean);

    // Add items
    data.items.forEach(item => {
      lines.push(`${item.quantity}x ${item.name}`);
      if (item.variantName) {
        lines.push(`   - ${item.variantName}`);
      }
      if (item.notes) {
        lines.push(`   Notes: ${item.notes}`);
      }
      lines.push('');
    });

    lines.push('=============================');
    lines.push(`Items: ${data.items.length}`);
    lines.push('=============================');

    return lines.join('\n');
  }

  /**
   * Format bill content
   */
  private formatBill(data: {
    billId: string;
    tableNumber: number;
    orderId: string;
    items: OrderItem[];
    subtotal: number;
    serviceCharge: number;
    total: number;
    timestamp: Date;
    customerData?: any;
  }): string {
    const lines = [
      '=============================',
      '      COTTAGE TANDOORI',
      '        25 West St',
      '   Storrington, West Sussex',
      '       RH20 4DZ',
      '=============================',
      `Bill: ${data.billId}`,
      `Table: ${data.tableNumber}`,
      `Date: ${data.timestamp.toLocaleDateString()}`,
      `Time: ${data.timestamp.toLocaleTimeString()}`,
      '-----------------------------',
      ''
    ];

    // Add items
    data.items.forEach(item => {
      const lineTotal = item.price * item.quantity;
      lines.push(`${item.quantity}x ${item.name}`);
      if (item.variantName) {
        lines.push(`   ${item.variantName}`);
      }
      lines.push(`   £${lineTotal.toFixed(2)}`);
      lines.push('');
    });

    lines.push('-----------------------------');
    lines.push(`Subtotal: £${data.subtotal.toFixed(2)}`);
    lines.push(`Service Charge (10%): £${data.serviceCharge.toFixed(2)}`);
    lines.push('=============================');
    lines.push(`TOTAL: £${data.total.toFixed(2)}`);
    lines.push('=============================');
    lines.push('');
    lines.push('Thank you for dining with us!');

    return lines.join('\n');
  }

  /**
   * Format receipt content
   */
  private formatReceipt(data: {
    receiptId: string;
    orderId: string;
    paymentDetails: any;
    timestamp: Date;
  }): string {
    const lines = [
      '=============================',
      '      COTTAGE TANDOORI',
      '     PAYMENT RECEIPT',
      '=============================',
      `Receipt: ${data.receiptId}`,
      `Order: ${data.orderId}`,
      `Date: ${data.timestamp.toLocaleDateString()}`,
      `Time: ${data.timestamp.toLocaleTimeString()}`,
      '-----------------------------',
      `Amount: £${data.paymentDetails.amount.toFixed(2)}`,
      `Method: ${data.paymentDetails.method}`,
      data.paymentDetails.transactionId ? `Transaction: ${data.paymentDetails.transactionId}` : '',
      '=============================',
      'Payment Successful',
      'Thank you!',
      '============================='
    ].filter(Boolean);

    return lines.join('\n');
  }

  /**
   * Check printer status
   */
  async checkPrinterStatus(): Promise<{
    kitchen: boolean;
    receipt: boolean;
    errors: string[];
  }> {
    // In production, this would check actual printer connectivity
    // For now, simulate printer checks
    const errors: string[] = [];
    
    return {
      kitchen: this.printerConfig.kitchen.enabled,
      receipt: this.printerConfig.receipt.enabled,
      errors
    };
  }
}

// Export singleton instance
export const printingService = PrintingService.getInstance();
export default printingService;
