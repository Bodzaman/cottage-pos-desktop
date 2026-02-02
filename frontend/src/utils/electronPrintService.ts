/**
 * Electron Print Service
 *
 * Provides WYSIWYG thermal printing through Electron's native printing.
 * This service captures the rendered ThermalPreview HTML and sends it
 * to the main process for printing on the Epson TM-T20III or compatible printer.
 *
 * When running in web browser mode, printing falls back to queue-based system.
 */

import html2canvas from 'html2canvas';

// Type declarations for Electron API exposed via preload
declare global {
  interface Window {
    electronAPI?: {
      printReceiptWYSIWYG: (data: WYSIWYGPrintData) => Promise<PrintResult>;
      printReceiptESCPOS: (data: ESCPOSPrintData) => Promise<ESCPOSPrintResult>;
      printReceiptRaster: (data: RasterPrintData) => Promise<RasterPrintResult>;
      printReceipt: (data: unknown) => Promise<PrintResult>;
      printTest: () => Promise<PrintResult>;
      getPrinters: () => Promise<PrinterInfo[]>;
      getConfig: () => Promise<unknown>;
      saveConfig: (config: unknown) => Promise<unknown>;
      platform: string;
    };
  }
}

export interface PrintResult {
  success: boolean;
  printer?: string;
  timestamp?: string;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  displayName?: string;
  driver?: string;
  status?: string;
  available?: boolean;
  isDefault?: boolean;
}

interface WYSIWYGPrintData {
  html: string;
  paperWidth: 58 | 80;
  printerName?: string;
}

// ESC/POS printing types
export interface ESCPOSPrintData {
  type: 'kitchen' | 'customer';
  receiptData: KitchenTicketData | CustomerReceiptData;
  printerName?: string;
}

export interface ESCPOSPrintResult extends PrintResult {
  type?: string;
  bytesWritten?: number;
}

export interface KitchenTicketData {
  tableNumber?: number | string;
  guestCount?: number;
  items: KitchenItem[];
  orderNumber?: string;
  orderType?: string;
  timestamp?: string;
  serverName?: string;
  // Payment status for PAID badge on takeaway kitchen tickets (doubles as customer receipt)
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';
}

export interface KitchenItem {
  name: string;
  quantity: number;
  variantName?: string;
  modifiers?: Array<string | { name: string }>;
  notes?: string;
  // Section information for receipt grouping
  sectionNumber?: number;
  sectionName?: string;
}

export interface CustomerReceiptData {
  businessName?: string;
  address?: string;
  address2?: string;
  phone?: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  serviceCharge?: number;  // Service charge amount for dine-in bills
  total: number;
  orderNumber?: string;
  orderType?: string;
  tableNumber?: number | string;
  guestCount?: number;  // Number of guests for dine-in orders
  timestamp?: string;
  paymentMethod?: string;
  customerName?: string;
  footerMessage?: string;
  // Payment Status for PAID badge display on receipts
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
  modifiers?: Array<string | { name: string; price?: number }>;
  // Section information for receipt grouping
  sectionNumber?: number;
  sectionName?: string;
}

// Raster printing types (true WYSIWYG)
export interface RasterPrintData {
  imageData: string; // Base64 encoded PNG from html2canvas
  paperWidth: 58 | 80;
  printerName?: string;
}

export interface RasterPrintResult extends PrintResult {
  bytesWritten?: number;
  method?: 'raster';
}

/**
 * Check if running in Electron environment with print API available
 */
export function isElectronPrintAvailable(): boolean {
  const hasWindow = typeof window !== 'undefined';
  const hasElectronAPI = hasWindow && typeof window.electronAPI !== 'undefined';
  const hasPrintMethod = hasElectronAPI && typeof window.electronAPI?.printReceiptWYSIWYG === 'function';

  // Log diagnostic info on first check
  if (hasWindow && !(window as any).__electronPrintChecked) {
    (window as any).__electronPrintChecked = true;
    console.log('🔍 [ElectronPrintService] Environment check:', {
      hasWindow,
      hasElectronAPI,
      hasPrintMethod,
      electronAPIKeys: hasElectronAPI ? Object.keys(window.electronAPI!) : [],
      userAgent: window.navigator?.userAgent
    });
  }

  return hasPrintMethod;
}

/**
 * Get list of available printers from the system
 */
export async function getAvailablePrinters(): Promise<PrinterInfo[]> {
  if (!isElectronPrintAvailable()) {
    console.warn('Electron print API not available');
    return [];
  }

  try {
    const printers = await window.electronAPI!.getPrinters();
    return printers || [];
  } catch (error) {
    console.error('Failed to get printers:', error);
    return [];
  }
}

/**
 * Find the Epson thermal printer from available printers
 */
export async function findThermalPrinter(): Promise<PrinterInfo | null> {
  const printers = await getAvailablePrinters();

  // Look for Epson TM-T20 or TM-T88 printer
  const epsonPrinter = printers.find(p => {
    const name = (p.name || '').toLowerCase();
    return name.includes('epson') &&
      (name.includes('tm-t20') || name.includes('tm-t88') || name.includes('tm_t20') || name.includes('tm_t88'));
  });

  if (epsonPrinter) {
    return epsonPrinter;
  }

  // Fallback to default printer
  const defaultPrinter = printers.find(p => p.isDefault);
  if (defaultPrinter) {
    console.warn('Epson thermal printer not found, using default printer:', defaultPrinter.name);
    return defaultPrinter;
  }

  // Fallback to first available printer
  if (printers.length > 0) {
    console.warn('No default printer, using first available:', printers[0].name);
    return printers[0];
  }

  return null;
}

/**
 * Print a thermal receipt using WYSIWYG rendering
 *
 * @param receiptElement - The DOM element containing the rendered ThermalPreview
 * @param paperWidth - Paper width in mm (58 or 80, default 80)
 * @param printerName - Optional specific printer name to use
 * @returns Promise with print result
 *
 * @example
 * ```tsx
 * const receiptRef = useRef<HTMLDivElement>(null);
 *
 * const handlePrint = async () => {
 *   if (!receiptRef.current) return;
 *
 *   const result = await printThermalReceipt(receiptRef.current, 80);
 *   if (result.success) {
 *     toast.success('Printed successfully');
 *   } else {
 *     toast.error(`Print failed: ${result.error}`);
 *   }
 * };
 *
 * return (
 *   <div ref={receiptRef}>
 *     <ThermalPreview formData={data} paperWidth={80} mode="form" />
 *   </div>
 * );
 * ```
 */
export async function printThermalReceipt(
  receiptElement: HTMLElement,
  paperWidth: 58 | 80 = 80,
  printerName?: string
): Promise<PrintResult> {
  if (!isElectronPrintAvailable()) {
    return {
      success: false,
      error: 'Printing not available. Please run in Electron desktop app.'
    };
  }

  if (!receiptElement) {
    return {
      success: false,
      error: 'No receipt element provided'
    };
  }

  try {
    // Get the innerHTML of the receipt element
    const html = receiptElement.innerHTML;

    if (!html || html.trim().length === 0) {
      return {
        success: false,
        error: 'Receipt content is empty'
      };
    }

    console.log(`[ElectronPrint] Printing receipt, paperWidth: ${paperWidth}mm, content length: ${html.length}`);

    // Send to Electron main process for printing
    const result = await window.electronAPI!.printReceiptWYSIWYG({
      html,
      paperWidth,
      printerName
    });

    if (result.success) {
      console.log(`[ElectronPrint] Print successful on ${result.printer} at ${result.timestamp}`);
    } else {
      console.error(`[ElectronPrint] Print failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown print error';
    console.error('[ElectronPrint] Print error:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Print a test receipt to verify printer connectivity
 */
export async function printTestReceipt(): Promise<PrintResult> {
  if (!isElectronPrintAvailable()) {
    return {
      success: false,
      error: 'Printing not available. Please run in Electron desktop app.'
    };
  }

  try {
    const result = await window.electronAPI!.printTest();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Print raw HTML content directly (for custom receipts)
 *
 * @param html - Raw HTML string to print
 * @param paperWidth - Paper width in mm
 * @param printerName - Optional specific printer name
 */
export async function printRawHtml(
  html: string,
  paperWidth: 58 | 80 = 80,
  printerName?: string
): Promise<PrintResult> {
  if (!isElectronPrintAvailable()) {
    return {
      success: false,
      error: 'Printing not available. Please run in Electron desktop app.'
    };
  }

  try {
    const result = await window.electronAPI!.printReceiptWYSIWYG({
      html,
      paperWidth,
      printerName
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Check if ESC/POS printing is available
 */
export function isESCPOSPrintAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.electronAPI !== 'undefined' &&
    typeof window.electronAPI?.printReceiptESCPOS === 'function';
}

/**
 * Print kitchen ticket using ESC/POS commands
 * This produces large, clear text optimized for kitchen staff
 *
 * @param data - Kitchen ticket data
 * @param printerName - Optional specific printer name
 * @returns Promise with print result
 *
 * @example
 * ```tsx
 * const result = await printKitchenTicketESCPOS({
 *   tableNumber: 5,
 *   guestCount: 4,
 *   items: [
 *     { name: 'Chicken Tikka Masala', quantity: 2, notes: 'Extra spicy' },
 *     { name: 'Naan Bread', quantity: 4 }
 *   ],
 *   orderNumber: 'ORD-001',
 *   orderType: 'DINE IN'
 * });
 * ```
 */
export async function printKitchenTicketESCPOS(
  data: KitchenTicketData,
  printerName?: string
): Promise<ESCPOSPrintResult> {
  if (!isESCPOSPrintAvailable()) {
    return {
      success: false,
      error: 'ESC/POS printing not available. Please run in Electron desktop app.'
    };
  }

  try {
    console.log('[ElectronPrint] Printing kitchen ticket via ESC/POS', {
      tableNumber: data.tableNumber,
      itemCount: data.items.length
    });

    const result = await window.electronAPI!.printReceiptESCPOS({
      type: 'kitchen',
      receiptData: data,
      printerName
    });

    if (result.success) {
      console.log(`[ElectronPrint] Kitchen ticket printed: ${result.bytesWritten} bytes`);
    } else {
      console.error(`[ElectronPrint] Kitchen ticket print failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ElectronPrint] ESC/POS kitchen print error:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Print customer receipt using ESC/POS commands
 * Professional receipt with prices, totals, and business info
 *
 * @param data - Customer receipt data
 * @param printerName - Optional specific printer name
 * @returns Promise with print result
 *
 * @example
 * ```tsx
 * const result = await printCustomerReceiptESCPOS({
 *   items: [
 *     { name: 'Chicken Tikka Masala', quantity: 2, price: 12.95 },
 *     { name: 'Naan Bread', quantity: 4, price: 2.50 }
 *   ],
 *   subtotal: 35.90,
 *   total: 35.90,
 *   orderNumber: 'ORD-001',
 *   tableNumber: 5,
 *   paymentMethod: 'CARD'
 * });
 * ```
 */
export async function printCustomerReceiptESCPOS(
  data: CustomerReceiptData,
  printerName?: string
): Promise<ESCPOSPrintResult> {
  if (!isESCPOSPrintAvailable()) {
    return {
      success: false,
      error: 'ESC/POS printing not available. Please run in Electron desktop app.'
    };
  }

  try {
    console.log('[ElectronPrint] Printing customer receipt via ESC/POS', {
      orderNumber: data.orderNumber,
      total: data.total,
      itemCount: data.items.length
    });

    const result = await window.electronAPI!.printReceiptESCPOS({
      type: 'customer',
      receiptData: data,
      printerName
    });

    if (result.success) {
      console.log(`[ElectronPrint] Customer receipt printed: ${result.bytesWritten} bytes`);
    } else {
      console.error(`[ElectronPrint] Customer receipt print failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ElectronPrint] ESC/POS customer print error:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Check if raster image printing is available
 */
export function isRasterPrintAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.electronAPI !== 'undefined' &&
    typeof window.electronAPI?.printReceiptRaster === 'function';
}

/**
 * Capture a receipt element as a PNG image using html2canvas
 * This creates a pixel-perfect screenshot of the rendered receipt
 *
 * @param receiptElement - The DOM element containing the rendered receipt
 * @param paperWidth - Paper width in mm (58 or 80, default 80)
 * @returns Base64 encoded PNG data URL
 *
 * @example
 * ```tsx
 * const receiptRef = useRef<HTMLDivElement>(null);
 * const imageData = await captureReceiptAsImage(receiptRef.current, 80);
 * ```
 */
export async function captureReceiptAsImage(
  receiptElement: HTMLElement,
  paperWidth: 58 | 80 = 80
): Promise<string> {
  if (!receiptElement) {
    throw new Error('No receipt element provided');
  }

  console.log('[RasterPrint] Capturing receipt element as image...');

  try {
    // Capture element as canvas using html2canvas
    // Use scale 3 for high-quality capture - will be resized by Sharp with lanczos3
    const canvas = await html2canvas(receiptElement, {
      scale: 3, // Higher scale for crisper text on thermal paper
      backgroundColor: '#ffffff', // White background for thermal printing
      logging: false, // Disable console logging
      useCORS: true, // Allow cross-origin images
      allowTaint: false, // Don't allow tainted canvas
      imageTimeout: 5000, // Timeout for loading images
      // Ensure we capture the full element
      scrollX: 0,
      scrollY: 0,
      windowWidth: receiptElement.scrollWidth,
      windowHeight: receiptElement.scrollHeight
    });

    console.log(`[RasterPrint] Canvas captured: ${canvas.width}x${canvas.height}px`);

    // Convert canvas to base64 PNG
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    console.log(`[RasterPrint] Image data URL length: ${dataUrl.length} chars`);

    return dataUrl;
  } catch (error) {
    console.error('[RasterPrint] Failed to capture receipt:', error);
    throw error;
  }
}

/**
 * Print a receipt using true WYSIWYG raster image printing
 * This captures the rendered receipt as an image and converts it to
 * ESC/POS raster format for exact screen-to-print matching
 *
 * @param receiptElement - The DOM element containing the rendered ThermalPreview
 * @param paperWidth - Paper width in mm (58 or 80, default 80)
 * @param printerName - Optional specific printer name to use
 * @returns Promise with print result
 *
 * @example
 * ```tsx
 * const receiptRef = useRef<HTMLDivElement>(null);
 *
 * const handlePrint = async () => {
 *   if (!receiptRef.current) return;
 *
 *   const result = await printReceiptRasterWYSIWYG(receiptRef.current, 80);
 *   if (result.success) {
 *     toast.success('Printed successfully');
 *   } else {
 *     toast.error(`Print failed: ${result.error}`);
 *   }
 * };
 *
 * return (
 *   <div ref={receiptRef}>
 *     <ThermalReceiptDisplay orderData={data} paperWidth={80} />
 *   </div>
 * );
 * ```
 */
export async function printReceiptRasterWYSIWYG(
  receiptElement: HTMLElement,
  paperWidth: 58 | 80 = 80,
  printerName?: string
): Promise<RasterPrintResult> {
  if (!isRasterPrintAvailable()) {
    return {
      success: false,
      error: 'Raster printing not available. Please run in Electron desktop app.'
    };
  }

  if (!receiptElement) {
    return {
      success: false,
      error: 'No receipt element provided'
    };
  }

  try {
    console.log(`[RasterPrint] Starting WYSIWYG raster print, paperWidth: ${paperWidth}mm`);

    // Step 1: Capture receipt as image
    const imageData = await captureReceiptAsImage(receiptElement, paperWidth);

    // Step 2: Send to main process for raster printing
    const result = await window.electronAPI!.printReceiptRaster({
      imageData,
      paperWidth,
      printerName
    });

    if (result.success) {
      console.log(`[RasterPrint] Print successful: ${result.bytesWritten} bytes sent to ${result.printer}`);
    } else {
      console.error(`[RasterPrint] Print failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown print error';
    console.error('[RasterPrint] Print error:', error);
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Default export for convenience
export default {
  isElectronPrintAvailable,
  isESCPOSPrintAvailable,
  isRasterPrintAvailable,
  getAvailablePrinters,
  findThermalPrinter,
  printThermalReceipt,
  printTestReceipt,
  printRawHtml,
  printKitchenTicketESCPOS,
  printCustomerReceiptESCPOS,
  captureReceiptAsImage,
  printReceiptRasterWYSIWYG
};
