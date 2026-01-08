// Web Printing Foundation for Cottage Tandoori
// Supports WebUSB and browser-based thermal receipt printing

// Types for web printing
export interface WebPrinter {
  id: string;
  name: string;
  type: 'webusb' | 'webserial';
  device?: USBDevice;
  connected: boolean;
  capabilities: string[];
}

export interface PrintJob {
  content: string;
  type: 'text' | 'receipt' | 'raw';
  options?: {
    fontSize?: 'small' | 'normal' | 'large';
    alignment?: 'left' | 'center' | 'right';
    bold?: boolean;
    underline?: boolean;
  };
}

export interface ReceiptData {
  restaurantName: string;
  address: string;
  phone: string;
  orderId: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// ESC/POS Command Generator
class ESCPOSEncoder {
  private buffer: number[] = [];

  // Initialize printer
  initialize(): ESCPOSEncoder {
    this.buffer.push(0x1B, 0x40); // ESC @
    return this;
  }

  // Add text
  text(text: string): ESCPOSEncoder {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    this.buffer.push(...Array.from(bytes));
    return this;
  }

  // Line feed
  feed(lines: number = 1): ESCPOSEncoder {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A); // LF
    }
    return this;
  }

  // Set alignment
  align(alignment: 'left' | 'center' | 'right'): ESCPOSEncoder {
    this.buffer.push(0x1B, 0x61); // ESC a
    switch (alignment) {
      case 'left':
        this.buffer.push(0x00);
        break;
      case 'center':
        this.buffer.push(0x01);
        break;
      case 'right':
        this.buffer.push(0x02);
        break;
    }
    return this;
  }

  // Set text size
  size(width: number = 1, height: number = 1): ESCPOSEncoder {
    // Ensure values are within range (1-8)
    width = Math.max(1, Math.min(8, width));
    height = Math.max(1, Math.min(8, height));
    
    this.buffer.push(0x1D, 0x21); // GS !
    const size = ((width - 1) << 4) | (height - 1);
    this.buffer.push(size);
    return this;
  }

  // Set bold
  bold(enabled: boolean = true): ESCPOSEncoder {
    this.buffer.push(0x1B, 0x45, enabled ? 0x01 : 0x00); // ESC E
    return this;
  }

  // Set underline
  underline(enabled: boolean = true): ESCPOSEncoder {
    this.buffer.push(0x1B, 0x2D, enabled ? 0x01 : 0x00); // ESC -
    return this;
  }

  // Cut paper
  cut(): ESCPOSEncoder {
    this.buffer.push(0x1D, 0x56, 0x00); // GS V 0 (full cut)
    return this;
  }

  // Partial cut
  partialCut(): ESCPOSEncoder {
    this.buffer.push(0x1D, 0x56, 0x01); // GS V 1 (partial cut)
    return this;
  }

  // Print QR code
  qr(data: string, size: number = 6): ESCPOSEncoder {
    const qrData = new TextEncoder().encode(data);
    
    // Set QR code size
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size);
    
    // Set QR code model
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x41, 0x32);
    
    // Set error correction level
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30);
    
    // Store QR code data
    const dataLength = qrData.length + 3;
    this.buffer.push(0x1D, 0x28, 0x6B, dataLength & 0xFF, (dataLength >> 8) & 0xFF, 0x31, 0x50, 0x30);
    this.buffer.push(...Array.from(qrData));
    
    // Print QR code
    this.buffer.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
    
    return this;
  }

  // Draw line
  drawLine(char: string = '-', length: number = 32): ESCPOSEncoder {
    this.text(char.repeat(length));
    this.feed();
    return this;
  }

  // Get the command buffer
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  // Clear buffer
  clear(): ESCPOSEncoder {
    this.buffer = [];
    return this;
  }
}

// Web Printing Manager
export class WebPrintManager {
  private connectedPrinters: Map<string, WebPrinter> = new Map();

  // Check if WebUSB is supported
  isWebUSBSupported(): boolean {
    return 'usb' in navigator && 'requestDevice' in navigator.usb;
  }

  // Request access to USB printer
  async requestUSBPrinter(): Promise<WebPrinter | null> {
    if (!this.isWebUSBSupported()) {
      throw new Error('WebUSB is not supported in this browser');
    }

    try {
      // Common thermal printer vendor IDs
      const filters = [
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x20d1 }, // XPRINTER
        { vendorId: 0x0fe6 }, // ICS Advent
        { vendorId: 0x154f }, // SNBC
        { vendorId: 0x0dd4 }, // Custom Engineering
        { vendorId: 0x2013 }, // BIXOLON
        { vendorId: 0x0519 }, // Citizen
      ];

      const device = await navigator.usb.requestDevice({ filters });
      
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      const vendorHex = device.vendorId.toString(16).padStart(4, '0');
      const productHex = device.productId.toString(16).padStart(4, '0');

      const printer: WebPrinter = {
        id: `webusb_${device.vendorId}_${device.productId}`,
        name: device.productName || `USB Printer (${vendorHex}:${productHex})`,
        type: 'webusb',
        device: device,
        connected: true,
        capabilities: ['text', 'receipt', 'qr', 'barcode']
      };

      this.connectedPrinters.set(printer.id, printer);
      return printer;
    } catch (error) {
      console.error('Error requesting USB printer:', error);
      return null;
    }
  }

  // Get list of connected printers
  getConnectedPrinters(): WebPrinter[] {
    return Array.from(this.connectedPrinters.values());
  }

  // Print to a specific printer
  async print(printerId: string, job: PrintJob): Promise<boolean> {
    const printer = this.connectedPrinters.get(printerId);
    if (!printer || !printer.device) {
      throw new Error('Printer not found or not connected');
    }

    try {
      const encoder = new ESCPOSEncoder();
      encoder.initialize();

      // Apply job options
      if (job.options?.alignment) {
        encoder.align(job.options.alignment);
      }
      if (job.options?.bold) {
        encoder.bold(true);
      }
      if (job.options?.underline) {
        encoder.underline(true);
      }

      // Add content
      encoder.text(job.content);
      encoder.feed(2);
      
      if (job.type === 'receipt') {
        encoder.cut();
      }

      const commands = encoder.encode();
      
      // Send to printer via WebUSB
      await printer.device.transferOut(1, commands);
      
      return true;
    } catch (error) {
      console.error('Error printing:', error);
      return false;
    }
  }

  // Print a formatted receipt
  async printReceipt(printerId: string, receipt: ReceiptData): Promise<boolean> {
    const content = this.generateReceiptContent(receipt);
    
    const job: PrintJob = {
      content,
      type: 'receipt',
      options: {
        alignment: 'left'
      }
    };

    return this.print(printerId, job);
  }

  // Generate receipt content
  private generateReceiptContent(receipt: ReceiptData): string {
    const lines: string[] = [];
    
    // Header
    lines.push('='.repeat(32));
    lines.push(this.centerText(receipt.restaurantName, 32));
    lines.push(this.centerText(receipt.address, 32));
    lines.push(this.centerText(receipt.phone, 32));
    lines.push('='.repeat(32));
    lines.push('');
    
    // Order details
    lines.push(`Order: ${receipt.orderId}`);
    lines.push(`Time: ${receipt.timestamp}`);
    lines.push('-'.repeat(32));
    
    // Items
    receipt.items.forEach(item => {
      lines.push(item.name);
      lines.push(`  ${item.quantity} x £${item.price.toFixed(2)} = £${item.total.toFixed(2)}`);
    });
    
    lines.push('-'.repeat(32));
    
    // Totals
    lines.push(`Subtotal: £${receipt.subtotal.toFixed(2)}`);
    lines.push(`Tax: £${receipt.tax.toFixed(2)}`);
    lines.push(`TOTAL: £${receipt.total.toFixed(2)}`);
    lines.push('');
    lines.push(`Payment: ${receipt.paymentMethod}`);
    lines.push('');
    lines.push('Thank you for your order!');
    lines.push('='.repeat(32));
    
    return lines.join('\n');
  }

  // Helper to center text
  private centerText(text: string, width: number): string {
    if (text.length >= width) return text;
    const padding = width - text.length;
    const leftPad = Math.floor(padding / 2);
    return ' '.repeat(leftPad) + text;
  }

  // Test print function
  async testPrint(printerId: string): Promise<boolean> {
    const testJob: PrintJob = {
      content: 'Test Print\nCottage Tandoori POS\nPrinter Working!',
      type: 'text',
      options: {
        alignment: 'center',
        bold: true
      }
    };

    return this.print(printerId, testJob);
  }

  // Disconnect printer
  async disconnectPrinter(printerId: string): Promise<void> {
    const printer = this.connectedPrinters.get(printerId);
    if (printer && printer.device) {
      try {
        await printer.device.close();
      } catch (error) {
        console.error('Error disconnecting printer:', error);
      }
      this.connectedPrinters.delete(printerId);
    }
  }

  // Disconnect all printers
  async disconnectAll(): Promise<void> {
    const printerIds = Array.from(this.connectedPrinters.keys());
    for (const printerId of printerIds) {
      await this.disconnectPrinter(printerId);
    }
  }
}

// Create global instance
export const webPrintManager = new WebPrintManager();

// Helper functions for easy access
export const connectUSBPrinter = () => webPrintManager.requestUSBPrinter();
export const getWebPrinters = () => webPrintManager.getConnectedPrinters();
export const webPrint = (printerId: string, job: PrintJob) => webPrintManager.print(printerId, job);
export const webPrintReceipt = (printerId: string, receipt: ReceiptData) => webPrintManager.printReceipt(printerId, receipt);
export const webTestPrint = (printerId: string) => webPrintManager.testPrint(printerId);
