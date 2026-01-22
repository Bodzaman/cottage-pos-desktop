/**
 * Thermal Printer Integration for POSDesktop
 *
 * Provides TypeScript client for connecting POSDesktop to the Windows thermal printer helper.
 * This module handles the HTTP communication with the thermal printer service.
 */

import brain from 'brain';
import { OrderItem } from './menuTypes';
import { TableOrderItem } from './tableTypes';
import { toast } from 'sonner';

export interface ThermalPrinterStatus {
  connected: boolean;
  status: 'healthy' | 'error' | 'disconnected';
  url?: string;
  platform?: string;
  nodeVersion?: string;
  port?: number;
  error?: string;
}

export interface PrintResult {
  success: boolean;
  message: string;
  printerId?: string;
  timestamp: string;
  error?: string;
}

export interface KitchenPrintData {
  tableNumber: number;
  orderId: string;
  items: OrderItem[] | TableOrderItem[];
  timestamp?: string;
  onlyNewItems?: boolean;
}

export interface ReceiptPrintData {
  orderId: string;
  total: number;
  items: OrderItem[];
  customerData?: any;
  paymentMethod?: string;
  transactionId?: string;
}

/**
 * Thermal Printer Integration Client
 * Handles communication between POSDesktop and the Windows thermal printer helper
 */
class ThermalPrinterClient {
  private static instance: ThermalPrinterClient;
  private baseUrl = 'http://127.0.0.1:3001';
  private lastStatusCheck: Date | null = null;
  private cachedStatus: ThermalPrinterStatus | null = null;

  private constructor() {}

  static getInstance(): ThermalPrinterClient {
    if (!ThermalPrinterClient.instance) {
      ThermalPrinterClient.instance = new ThermalPrinterClient();
    }
    return ThermalPrinterClient.instance;
  }

  /**
   * Check thermal printer service status
   */
  async checkStatus(useCache = true): Promise<ThermalPrinterStatus> {
    // Use cached status if recent (within 30 seconds)
    if (useCache && this.cachedStatus && this.lastStatusCheck) {
      const timeSinceCheck = Date.now() - this.lastStatusCheck.getTime();
      if (timeSinceCheck < 30000) {
        return this.cachedStatus;
      }
    }

    try {
      const response = await (brain as any).check_thermal_printer_status();
      const result = await response.json();

      this.cachedStatus = result.printerService;
      this.lastStatusCheck = new Date();

      return this.cachedStatus;
    } catch (error) {
      const errorStatus: ThermalPrinterStatus = {
        connected: false,
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.cachedStatus = errorStatus;
      this.lastStatusCheck = new Date();

      return errorStatus;
    }
  }

  /**
   * Print kitchen ticket
   */
  async printKitchenTicket(data: KitchenPrintData): Promise<PrintResult> {
    try {
      const response = await (brain as any).print_kitchen_ticket({
        tableNumber: data.tableNumber,
        orderId: data.orderId,
        items: data.items,
        timestamp: data.timestamp || new Date().toISOString(),
        onlyNewItems: data.onlyNewItems
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Kitchen ticket printed for Table ${data.tableNumber}`);
      } else {
        toast.error(`Kitchen print failed: ${result.error || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      const errorResult: PrintResult = {
        success: false,
        message: 'Kitchen printer not available',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      toast.error('Kitchen printer not available. Make sure cottage-tandoori-printer.exe is running.');
      return errorResult;
    }
  }

  /**
   * Print receipt
   */
  async printReceipt(data: ReceiptPrintData): Promise<PrintResult> {
    try {
      const response = await (brain as any).print_receipt({
        orderId: data.orderId,
        total: data.total,
        items: data.items,
        customerData: data.customerData,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Receipt printed for order ${data.orderId}`);
      } else {
        toast.error(`Receipt print failed: ${result.error || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      const errorResult: PrintResult = {
        success: false,
        message: 'Receipt printer not available',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      toast.error('Receipt printer not available. Make sure cottage-tandoori-printer.exe is running.');
      return errorResult;
    }
  }

  /**
   * Test printers
   */
  async testPrinters(printerType: 'kitchen' | 'receipt' | 'both' = 'both'): Promise<PrintResult> {
    try {
      const response = await (brain as any).test_thermal_printers({
        printerType: printerType
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Thermal printer test completed for ${printerType} printer(s)`);
      } else {
        toast.error(`Thermal printer test failed: ${result.error || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      const errorResult: PrintResult = {
        success: false,
        message: 'Thermal printer service not available',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      toast.error('Thermal printer service not available. Make sure cottage-tandoori-printer.exe is running.');
      return errorResult;
    }
  }

  /**
   * Get integration guide
   */
  async getIntegrationGuide(): Promise<any> {
    try {
      const response = await (brain as any).get_integration_guide();
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get integration guide:', error);
      return null;
    }
  }
}

// Export singleton instance
export const thermalPrinter = ThermalPrinterClient.getInstance();
export default thermalPrinter;

/**
 * Integration helper for POSDesktop printing service
 * Updates the existing printing service to use thermal printers
 */
export function integrateThermalPrintingWithPOSDesktop() {
  // This function can be called to integrate thermal printing with the existing POSDesktop printing service
  return {
    checkStatus: () => thermalPrinter.checkStatus(),
    printKitchen: (tableNumber: number, items: OrderItem[], orderId: string) =>
      thermalPrinter.printKitchenTicket({ tableNumber, orderId, items }),
    printReceipt: (orderId: string, items: OrderItem[], total: number, customerData?: any) =>
      thermalPrinter.printReceipt({ orderId, total, items, customerData }),
    testPrinters: (type?: 'kitchen' | 'receipt' | 'both') =>
      thermalPrinter.testPrinters(type)
  };
}
