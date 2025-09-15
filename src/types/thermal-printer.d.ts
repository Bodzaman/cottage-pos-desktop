// Type definitions for thermal printer functionality
declare module 'node-thermal-printer' {
  export interface ThermalPrinter {
    alignCenter(): void;
    alignLeft(): void;
    println(text: string): void;
    newLine(): void;
    cut(): void;
    execute(): Promise<any>;
  }

  export class ThermalPrinter {
    constructor(config: any);
  }
}

// Global thermal printer manager interface
interface ThermalPrinterManager {
  printReceipt?: (data: any) => Promise<void>;
  getAllPrinters?: () => Promise<any[]>;
  getStatus?: () => Promise<string>;
  disable?: () => void;
  enabled?: () => boolean;
}

declare global {
  interface Window {
    thermalPrinter?: ThermalPrinterManager;
  }
}

export {};
