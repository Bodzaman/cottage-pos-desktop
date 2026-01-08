// TypeScript declarations for Epson ePOS SDK v2.27.0e
// Official Epson ePOS SDK for JavaScript browser integration

// Global declarations for ePOS SDK
declare global {
  interface Window {
    ePOSDevice?: any;
  }
}

// Epson printer connection types
export interface EpsonPrinterConfig {
  ipAddress: string;
  port: number;
  timeout?: number;
}

// Epson printer status
export interface EpsonPrinterStatus {
  connected: boolean;
  ready: boolean;
  error?: string;
  model?: string;
}

// Receipt formatting options
export interface EpsonReceiptOptions {
  header?: string;
  subheader?: string;
  content: string[];
  footer?: string;
  cutPaper?: boolean;
}

// Epson SDK wrapper class for type-safe integration
export class EpsonSDKManager {
  private device: any = null;
  private config: EpsonPrinterConfig | null = null;
  private isInitialized = false;

  constructor() {
    this.checkSDKAvailability();
  }

  // Check if Epson SDK is loaded
  private checkSDKAvailability(): boolean {
    if (typeof window !== 'undefined' && window.ePOSDevice) {
      this.isInitialized = true;
      return true;
    }
    console.warn('Epson ePOS SDK not loaded. Make sure epos-2.27.0.js is included.');
    return false;
  }

  // Initialize connection to Epson printer
  async connect(config: EpsonPrinterConfig): Promise<EpsonPrinterStatus> {
    if (!this.isInitialized) {
      throw new Error('Epson SDK not initialized');
    }

    this.config = config;
    
    try {
      // Create ePOS device instance
      this.device = new window.ePOSDevice();
      
      // Configure connection
      const url = `http://${config.ipAddress}:${config.port}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=${config.timeout || 10000}`;
      
      // Connect to printer
      const result = await new Promise((resolve, reject) => {
        this.device.connect(url, (data: any) => {
          if (data === 'OK') {
            resolve({ connected: true, ready: true });
          } else {
            reject(new Error(`Connection failed: ${data}`));
          }
        });
      });

      return result as EpsonPrinterStatus;
    } catch (error) {
      console.error('Epson connection failed:', error);
      throw new Error(`Failed to connect to Epson printer: ${error}`);
    }
  }

  // Print receipt using Epson commands
  async printReceipt(options: EpsonReceiptOptions): Promise<boolean> {
    if (!this.device || !this.isInitialized) {
      throw new Error('Epson device not connected');
    }

    try {
      // Create printer object
      const printer = this.device.createDevice('local_printer', this.device.DEVICE_TYPE_PRINTER, {
        'crypto': false,
        'buffer': false
      });

      // Format receipt content
      if (options.header) {
        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addTextSize(2, 2);
        printer.addText(options.header + '\n');
        printer.addTextSize(1, 1);
      }

      if (options.subheader) {
        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addText(options.subheader + '\n');
      }

      // Add content lines
      printer.addTextAlign(printer.ALIGN_LEFT);
      options.content.forEach(line => {
        printer.addText(line + '\n');
      });

      if (options.footer) {
        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addText('\n' + options.footer + '\n');
      }

      // Cut paper if requested
      if (options.cutPaper !== false) {
        printer.addCut(printer.CUT_FEED);
      }

      // Send print job
      const result = await new Promise((resolve, reject) => {
        printer.send((response: any) => {
          if (response.success) {
            resolve(true);
          } else {
            reject(new Error(`Print failed: ${response.code}`));
          }
        });
      });

      return result as boolean;
    } catch (error) {
      console.error('Epson print failed:', error);
      throw new Error(`Failed to print receipt: ${error}`);
    }
  }

  // Disconnect from printer
  disconnect(): void {
    if (this.device) {
      try {
        this.device.disconnect();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      this.device = null;
      this.config = null;
    }
  }

  // Get connection status
  getStatus(): EpsonPrinterStatus {
    return {
      connected: !!this.device,
      ready: !!this.device && this.isInitialized,
      model: 'TM-T20III' // Default model
    };
  }

  // Check if SDK is available
  isSDKLoaded(): boolean {
    return this.isInitialized && typeof window !== 'undefined' && !!window.ePOSDevice;
  }
}

// Export singleton instance
export const epsonSDK = new EpsonSDKManager();
