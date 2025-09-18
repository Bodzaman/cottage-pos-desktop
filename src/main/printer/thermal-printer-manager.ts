
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer'
import { PrintJob, PrintJobStatus, Receipt } from '@shared/data/models'
import { DatabaseManager } from '../offline/database-manager'

interface PrintJobResult {
  success: boolean
  message: string
  jobId?: string

export class ThermalPrinterManager {
  private printer: ThermalPrinter
  private dbManager: DatabaseManager
  private isConnected = false

  constructor(dbManager: DatabaseManager) {
    this.dbManager = dbManager
    this.printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'tcp://192.168.1.123',
      characterSet: 'UK'
    })
    this.initialize()
  
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

  private async initialize(): Promise<void> {
    try {
      this.isConnected = await this.printer.isPrinterConnected()
      console.log(`Printer connected: ${this.isConnected}`)
    } catch (error) {
      console.error('Failed to initialize printer connection:', error)
      this.isConnected = false
    
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
  
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

  public async getPrinterStatus(): Promise<{ isConnected: boolean }> {
    try {
      this.isConnected = await this.printer.isPrinterConnected()
      return { isConnected: this.isConnected 
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
    } catch (error) {
      console.error('Error checking printer status:', error)
      this.isConnected = false
      return { isConnected: false 
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
    
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
  
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

  public async addPrintJob(receipt: Receipt, options: any): Promise<PrintJobResult> {
    const job: Omit<PrintJob, 'id'> = {
      receipt,
      status: PrintJobStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
    try {
      const newJobId = await this.dbManager.addPrintJob(job)
      this.processPrintQueue()
      return { success: true, message: 'Job added to queue.', jobId: newJobId 
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
    } catch (error) {
      const err = error as Error
      return { success: false, message: `Failed to add job to DB: ${err.message}` 
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
    
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
  
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

  public addPrintJobToQueue(receipt: Receipt, options: any): Promise<PrintJobResult> {
      return this.addPrintJob(receipt, options)
  
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

  public async processPrintQueue(): Promise<void> {
    if (!this.isConnected) {
      console.log('Printer not connected. Skipping print queue processing.')
      return
    
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

    const pendingJobs = await this.dbManager.getPendingPrintJobs()
    if (!pendingJobs || typeof pendingJobs[Symbol.iterator] !== 'function') {
        console.error('getPendingPrintJobs did not return an iterable object.')
        return
    
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

    for (const job of pendingJobs) {
      try {
        await this.dbManager.updatePrintJobStatus(job.id, PrintJobStatus.PRINTING)
        this.printer.clear()
        this.printer.println('Cottage Tandoori')
        this.printer.println(`Order: ${job.receipt.orderNumber}`)
        this.printer.println('-'.repeat(32))
        job.receipt.items.forEach((item) => {
          this.printer.tableCustom([{ text: `${item.quantity}x ${item.name}`, align: 'LEFT', width: 0.75 }, { text: `£${item.price.toFixed(2)}`, align: 'RIGHT', width: 0.25 }])
        })
        this.printer.println('-'.repeat(32))
        this.printer.println(`Total: £${job.receipt.total.toFixed(2)}`)
        this.printer.cut()

        await this.printer.execute()
        await this.dbManager.updatePrintJobStatus(job.id, PrintJobStatus.COMPLETED)
        console.log(`Successfully printed job ${job.id}`)
      } catch (error) {
        console.error(`Failed to print job ${job.id}:`, error)
        await this.dbManager.updatePrintJobStatus(job.id, PrintJobStatus.FAILED)
      
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
    
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}
  
  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
    }
  }
}

  // IPC-compatible methods
  public async printReceipt(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'receipt' });
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      return false;
    }
  }

  public async printKitchenTicket(orderData: any): Promise<boolean> {
    try {
      const receipt = {
        orderNumber: orderData.id,
        items: orderData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total
      };

      const result = await this.addPrintJob(receipt, { type: 'kitchen' });
      return result.success;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      return false;
    }
  }

  public async getStatus(): Promise<{ connected: boolean; ready: boolean }> {
    try {
      const status = await this.getPrinterStatus();
      return { 
        connected: status.isConnected, 
        ready: status.isConnected 
      };
    } catch (error) {
      console.error('Get status error:', error);
      return { connected: false, ready: false };
}
}
