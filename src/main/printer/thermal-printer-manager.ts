import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import log from 'electron-log';
import { DatabaseManager } from '../offline/database-manager';

export interface PrintJobResult {
  success: boolean;
  message: string;
  jobId?: number;
}

export interface ReceiptData {
  orderNumber: string;
  orderType: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  timestamp: Date;
  customerName?: string;
  tableNumber?: string;
}

export class ThermalPrinterManager {
  private printer!: ThermalPrinter;
  private dbManager!: DatabaseManager;
  private isInitialized = false;

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager;
    this.initializePrinter();
  }

  private initializePrinter(): void {
    try {
      // Get printer name from config or use default
      const printerName = this.dbManager.getConfig('printer_name') || 'Epson TM-T20III';

      this.printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `printer:${printerName}`,
        characterSet: CharacterSet.PC852_LATIN2,
        removeSpecialCharacters: false,
        lineCharacter: '=',
        options: {
          timeout: 5000,
        }
      });

      this.isInitialized = true;
      log.info(`🖨️ Thermal printer initialized: ${printerName}`);
    } catch (error) {
      log.error('❌ Failed to initialize thermal printer:', error);
      this.isInitialized = false;
    }
  }

  public async testPrint(): Promise<PrintJobResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: 'Printer not initialized'
      };
    }

    try {
      this.printer.clear();

      // Test receipt header
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println('COTTAGE TANDOORI');
      this.printer.bold(false);
      this.printer.setTextSize(0, 0);
      this.printer.println('Traditional Indian Cuisine');
      this.printer.println('123 High Street, London');
      this.printer.println('Tel: 020 1234 5678');
      this.printer.newLine();

      this.printer.drawLine();
      this.printer.alignLeft();
      this.printer.bold(true);
      this.printer.println('TEST PRINT');
      this.printer.bold(false);

      this.printer.newLine();
      this.printer.println(`Date: ${new Date().toLocaleDateString()}`);
      this.printer.println(`Time: ${new Date().toLocaleTimeString()}`);
      this.printer.println('Printer: Epson TM-T20III');
      this.printer.newLine();

      this.printer.println('✅ Thermal printing system working');
      this.printer.println('✅ USB connection established');
      this.printer.println('✅ Character encoding correct');
      this.printer.newLine();

      this.printer.drawLine();
      this.printer.alignCenter();
      this.printer.println('Thank you for testing!');
      this.printer.newLine();
      this.printer.cut();

      // Execute print
      await this.printer.execute();

      log.info('✅ Test print completed successfully');
      return {
        success: true,
        message: 'Test print completed successfully'
      };
    } catch (error) {
      log.error('❌ Test print failed:', error);
      return {
        success: false,
        message: `Test print failed: ${error.message}`
      };
    }
  }

  public async printReceipt(receiptData: ReceiptData, orderId: string): Promise<PrintJobResult> {
    if (!this.isInitialized) {
      // Add to print queue for later processing
      this.dbManager.addPrintJob(orderId, 'RECEIPT', JSON.stringify(receiptData));
      return {
        success: false,
        message: 'Printer not available - added to queue'
      };
    }

    try {
      this.printer.clear();

      // Header
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println('COTTAGE TANDOORI');
      this.printer.bold(false);
      this.printer.setTextSize(0, 0);
      this.printer.println('Traditional Indian Cuisine');
      this.printer.println('123 High Street, London SW1A 1AA');
      this.printer.println('Tel: 020 1234 5678');
      this.printer.println('VAT: GB123456789');
      this.printer.newLine();

      this.printer.drawLine();

      // Order details
      this.printer.alignLeft();
      this.printer.bold(true);
      this.printer.println(`ORDER #${receiptData.orderNumber}`);
      this.printer.bold(false);
      this.printer.println(`Type: ${receiptData.orderType}`);
      if (receiptData.tableNumber) {
        this.printer.println(`Table: ${receiptData.tableNumber}`);
      }
      if (receiptData.customerName) {
        this.printer.println(`Customer: ${receiptData.customerName}`);
      }
      this.printer.println(`Date: ${receiptData.timestamp.toLocaleDateString()}`);
      this.printer.println(`Time: ${receiptData.timestamp.toLocaleTimeString()}`);
      this.printer.newLine();

      this.printer.drawLine();

      // Items
      this.printer.bold(true);
      this.printer.tableCustom([
        { text: 'Item', align: 'LEFT', width: 0.5 },
        { text: 'Qty', align: 'CENTER', width: 0.15 },
        { text: 'Price', align: 'RIGHT', width: 0.35 }
      ]);
      this.printer.bold(false);
      this.printer.drawLine();

      receiptData.items.forEach(item => {
        this.printer.tableCustom([
          { text: item.name, align: 'LEFT', width: 0.5 },
          { text: item.quantity.toString(), align: 'CENTER', width: 0.15 },
          { text: `£${item.total.toFixed(2)}`, align: 'RIGHT', width: 0.35 }
        ]);
        if (item.quantity > 1) {
          this.printer.println(`  @ £${item.price.toFixed(2)} each`);
        }
      });

      this.printer.newLine();
      this.printer.drawLine();

      // Totals
      this.printer.tableCustom([
        { text: 'Subtotal:', align: 'LEFT', width: 0.7 },
        { text: `£${receiptData.subtotal.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
      ]);

      this.printer.tableCustom([
        { text: 'VAT (20%):', align: 'LEFT', width: 0.7 },
        { text: `£${receiptData.tax.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
      ]);

      this.printer.bold(true);
      this.printer.tableCustom([
        { text: 'TOTAL:', align: 'LEFT', width: 0.7 },
        { text: `£${receiptData.total.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
      ]);
      this.printer.bold(false);

      this.printer.newLine();
      this.printer.drawLine();

      // Footer
      this.printer.alignCenter();
      this.printer.println('Thank you for your order!');
      this.printer.println('Visit us again soon');
      this.printer.newLine();
      this.printer.println('Follow us on social media:');
      this.printer.println('@cottagetandoori');
      this.printer.newLine();

      // Cut paper
      this.printer.cut();

      // Execute print
      await this.printer.execute();

      log.info(`✅ Receipt printed for order ${receiptData.orderNumber}`);
      return {
        success: true,
        message: 'Receipt printed successfully'
      };
    } catch (error) {
      log.error(`❌ Receipt printing failed for order ${receiptData.orderNumber}:`, error);

      // Add to print queue for retry
      this.dbManager.addPrintJob(orderId, 'RECEIPT', JSON.stringify(receiptData));

      return {
        success: false,
        message: `Receipt printing failed: ${error.message}`
      };
    }
  }

  public async processPrintQueue(): Promise<void> {
    const pendingJobs = this.dbManager.getPendingPrintJobs();

    for (const job of pendingJobs) {
      try {
        const receiptData = JSON.parse(job.content);
        const result = await this.printReceipt(receiptData, job.order_id);

        if (result.success) {
          this.dbManager.markPrintJobCompleted(job.id);
          log.info(`✅ Print queue job ${job.id} completed`);
        } else {
          this.dbManager.markPrintJobFailed(job.id, result.message);
          log.error(`❌ Print queue job ${job.id} failed: ${result.message}`);
        }
      } catch (error) {
        this.dbManager.markPrintJobFailed(job.id, error.message);
        log.error(`❌ Print queue job ${job.id} processing error:`, error);
      }
    }
  }

  public async printKitchenTicket(receiptData: ReceiptData, orderId: string): Promise<PrintJobResult> {
    if (!this.isInitialized) {
      this.dbManager.addPrintJob(orderId, 'KITCHEN', JSON.stringify(receiptData));
      return {
        success: false,
        message: 'Printer not available - added to queue'
      };
    }

    try {
      this.printer.clear();

      // Kitchen ticket header
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println('KITCHEN ORDER');
      this.printer.bold(false);
      this.printer.setTextSize(0, 0);
      this.printer.newLine();

      this.printer.alignLeft();
      this.printer.bold(true);
      this.printer.println(`ORDER #${receiptData.orderNumber}`);
      this.printer.bold(false);
      this.printer.println(`Type: ${receiptData.orderType}`);
      if (receiptData.tableNumber) {
        this.printer.println(`Table: ${receiptData.tableNumber}`);
      }
      this.printer.println(`Time: ${receiptData.timestamp.toLocaleTimeString()}`);
      this.printer.newLine();

      this.printer.drawLine();

      // Items for kitchen
      receiptData.items.forEach(item => {
        this.printer.bold(true);
        this.printer.println(`${item.quantity}x ${item.name}`);
        this.printer.bold(false);
      });

      this.printer.newLine();
      this.printer.drawLine();
      this.printer.alignCenter();
      this.printer.println('Prepare with care!');
      this.printer.newLine();
      this.printer.cut();

      await this.printer.execute();

      log.info(`✅ Kitchen ticket printed for order ${receiptData.orderNumber}`);
      return {
        success: true,
        message: 'Kitchen ticket printed successfully'
      };
    } catch (error) {
      log.error(`❌ Kitchen ticket printing failed:`, error);
      this.dbManager.addPrintJob(orderId, 'KITCHEN', JSON.stringify(receiptData));

      return {
        success: false,
        message: `Kitchen ticket printing failed: ${error.message}`
      };
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public async checkPrinterStatus(): Promise<{ connected: boolean; name: string }> {
    const printerName = this.dbManager.getConfig('printer_name') || 'Epson TM-T20III';

    try {
      // Simple test to check if printer responds
      await this.printer.execute();
      return { connected: true, name: printerName };
    } catch (error) {
      return { connected: false, name: printerName };
    }
  }
}