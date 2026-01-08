import { TableOrder, TableData, TableStatus } from './tableTypes';

export type PaymentMethod = 'CASH' | 'CARD' | 'SPLIT' | 'ONLINE';

export interface PaymentResult {
  success: boolean;
  orderId: string;
  tableNumber: number;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  message: string;
  error?: string;
}

export interface CompletePaymentRequest {
  tableNumber: number;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  tip?: number;
  splitPayments?: {
    id: string;
    amount: number;
    method: PaymentMethod;
  }[];
}

// Singleton payment service for handling order payments
export class PaymentService {
  private static instance: PaymentService;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }
  
  // Process a DINE-IN payment and properly complete the order cycle
  public async processDineInPayment(
    request: CompletePaymentRequest,
    updateTableData: (updatedTable: TableData) => void,
    currentTable: TableData
  ): Promise<PaymentResult> {
    try {
      console.log('Processing payment for table', request.tableNumber, 'with method', request.method);
      
      // Find the active order
      const activeOrder = currentTable.orders.find(order => order.orderId === request.orderId);
      
      if (!activeOrder) {
        throw new Error(`Order ${request.orderId} not found for table ${request.tableNumber}`);
      }
      
      // Validate the order is ready for payment (bill has been printed)
      if (!activeOrder.billPrinted) {
        throw new Error('Cannot process payment: Bill has not been printed yet');
      }
      
      // Simulate payment processing based on method
      const paymentResult = await this.simulatePaymentProcessing(request);
      
      if (paymentResult.success) {
        // Update the order payment status
        activeOrder.paymentStatus = 'PAID';
        if (request.tip) {
          activeOrder.tip = request.tip;
        }
        
        // Update the table status
        currentTable.status = 'PAYMENT_COMPLETE';
        
        // Update splitBills if using split payments
        if (request.method === 'SPLIT' && request.splitPayments) {
          request.splitPayments.forEach(splitPayment => {
            const splitBill = currentTable.splitBills.find(bill => bill.id === splitPayment.id);
            if (splitBill) {
              splitBill.paid = true;
            }
          });
        }
        
        // Update the table data
        updateTableData(currentTable);
        
        // Print a receipt if needed (could be implemented here)
        
        return paymentResult;
      } else {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
    } catch (error) {
      console.log(`Payment failed for Table ${request.tableNumber}:`, {
        orderId: request.orderId,
        amount: request.amount,
        method: request.method,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      });
      return {
        success: false,
        orderId: request.orderId,
        tableNumber: request.tableNumber,
        amount: request.amount,
        method: request.method,
        message: 'Payment failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Complete a table's order cycle and reset for new customers
  public completeTableOrderCycle(
    tableNumber: number,
    updateTableData: (updatedTable: TableData) => void,
    currentTable: TableData,
    storeCompletedOrder: (order: TableOrder) => void
  ): boolean {
    try {
      if (currentTable.activeOrderId) {
        const completedOrder = currentTable.orders.find(
          order => order.orderId === currentTable.activeOrderId
        );
        
        if (completedOrder && completedOrder.paymentStatus === 'PAID') {
          // Archive the completed order in the order management system
          storeCompletedOrder(completedOrder);
          
          // Reset the table to available
          const resetTable: TableData = {
            ...currentTable,
            status: 'AVAILABLE',
            activeOrderId: null,
            occupiedAt: null,
            guestCount: 0,
            sentToKitchen: false,
            hasNewItems: false,
            splitBills: [],
            // Keep the orders array but don't reset it (for history)
          };
          
          // Update the table
          updateTableData(resetTable);
          
          return true;
        } else {
          console.error('Cannot complete order cycle: Order not paid yet');
          return false;
        }
      } else {
        console.error('Cannot complete order cycle: No active order');
        return false;
      }
    } catch (error) {
      console.error('Error completing order cycle:', error);
      return false;
    }
  }
  
  // Simulate payment processing
  private async simulatePaymentProcessing(request: CompletePaymentRequest): Promise<PaymentResult> {
    // In a real implementation, this would connect to a payment processor
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful payment
        const transactionId = 'txn_' + Math.random().toString(36).substr(2, 9);
        
        console.log(`Processing payment for Table ${request.tableNumber}:`, {
          orderId: request.orderId,
          amount: request.amount,
          method: request.method,
          transactionId
        });
        
        resolve({
          success: true,
          orderId: request.orderId,
          tableNumber: request.tableNumber,
          amount: request.amount,
          method: request.method,
          transactionId,
          message: `Payment of £${request.amount.toFixed(2)} processed successfully`
        });
      }, 1500); // Simulate processing time
    });
  }
}

// Export a singleton instance
export const paymentService = PaymentService.getInstance();
