/**
 * Electron API Type Definitions
 *
 * Extends the global Window interface with electronAPI methods
 * exposed by the Electron preload script.
 *
 * IMPORTANT: Keep these types in sync with electron/preload.js
 */

// ============================================================================
// OFFLINE ORDER QUEUE TYPES
// ============================================================================

export interface ElectronOfflineOrder {
  id: string;
  idempotency_key: string;
  local_id: string;
  order_data: any;
}

export interface ElectronOfflineOrderRecord {
  id: string;
  idempotency_key: string;
  local_id: string;
  server_id: string | null;
  order_data: string; // JSON stringified
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface OfflineOrderStats {
  total: number;
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  oldest_pending: string | null;
}

// IPC Response wrapper types (matches main.js handler responses)
export interface OfflineOrderEnqueueResponse {
  success: boolean;
  order?: ElectronOfflineOrderRecord;
  error?: string;
}

export interface OfflineOrderListResponse {
  success: boolean;
  orders: ElectronOfflineOrderRecord[];
  error?: string;
}

export interface OfflineOrderStatsResponse {
  success: boolean;
  stats: OfflineOrderStats | null;
  error?: string;
}

export interface OfflineOrderOperationResponse {
  success: boolean;
  error?: string;
}

export interface OfflineOrderDeleteResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

// ============================================================================
// PRINT QUEUE TYPES
// ============================================================================

export interface ElectronPrintJob {
  id: string;
  order_id?: string;
  job_type: 'receipt' | 'kitchen' | 'z-report';
  print_data: any;
  printer_name?: string;
}

export interface ElectronPrintJobRecord {
  id: string;
  order_id: string | null;
  job_type: string;
  print_data: string; // JSON stringified
  status: 'pending' | 'printing' | 'printed' | 'failed';
  error_message: string | null;
  retry_count: number;
  printer_name: string | null;
  created_at: string;
  printed_at: string | null;
}

export interface PrintQueueStats {
  total: number;
  pending: number;
  printing: number;
  printed: number;
  failed: number;
}

// Print Queue IPC Response wrapper types
export interface PrintQueueEnqueueResponse {
  success: boolean;
  job?: ElectronPrintJobRecord;
  error?: string;
}

export interface PrintQueueListResponse {
  success: boolean;
  jobs: ElectronPrintJobRecord[];
  error?: string;
}

export interface PrintQueueStatsResponse {
  success: boolean;
  stats: PrintQueueStats | null;
  error?: string;
}

export interface PrintQueueOperationResponse {
  success: boolean;
  error?: string;
}

export interface PrintQueueDeleteResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

// ============================================================================
// STRIPE TYPES
// ============================================================================

export interface StripeStatus {
  configured: boolean;
  message: string;
}

export interface StripePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface StripeConfirmResult {
  success: boolean;
  paymentIntent?: any;
  error?: string;
}

// ============================================================================
// PRINT RESULT TYPES (referenced from electronPrintService.ts)
// ============================================================================

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

// ============================================================================
// DISPLAY & WORKSPACE TYPES
// ============================================================================

export interface DisplayInfo {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  size: { width: number; height: number };
  scaleFactor: number;
  internal: boolean;
  primary: boolean;
}

export interface WorkspaceLayout {
  displays: Array<{
    id: number;
    role: 'pos' | 'kitchen' | 'customer' | 'none';
    windowState?: any;
  }>;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NativeNotificationData {
  title: string;
  body: string;
  icon?: string;
  urgency?: 'normal' | 'critical' | 'low';
  actions?: Array<{ type: string; text: string }>;
  data?: any;
}

// ============================================================================
// MAIN ELECTRON API INTERFACE
// ============================================================================

export interface ElectronAPI {
  // Legacy print methods
  printReceipt: (data: unknown) => Promise<PrintResult>;
  printTest: () => Promise<PrintResult>;
  getPrinters: () => Promise<PrinterInfo[]>;

  // WYSIWYG thermal printing
  printReceiptWYSIWYG: (data: { html: string; paperWidth: 58 | 80; printerName?: string }) => Promise<PrintResult>;

  // ESC/POS thermal printing
  printReceiptESCPOS: (data: { type: 'kitchen' | 'customer'; receiptData: any; printerName?: string }) => Promise<PrintResult & { bytesWritten?: number }>;

  // Z-Report printing
  printZReport: (data: any) => Promise<PrintResult>;

  // Raster image printing
  printReceiptRaster: (data: { imageData: string; paperWidth: 58 | 80; printerName?: string }) => Promise<PrintResult & { bytesWritten?: number }>;

  // Config
  getConfig: () => Promise<unknown>;
  saveConfig: (config: unknown) => Promise<unknown>;

  // Stripe payment methods
  stripeGetStatus: () => Promise<StripeStatus>;
  stripeCreatePaymentIntent: (data: { amount: number; currency?: string }) => Promise<StripePaymentIntentResult>;
  stripeConfirmPayment: (data: { paymentIntentId: string; paymentMethodId: string }) => Promise<StripeConfirmResult>;

  // Platform info
  platform: string;
  version: NodeJS.ProcessVersions;

  // Local file-system cache
  cacheSet: (key: string, data: any) => Promise<void>;
  cacheGet: (key: string) => Promise<any>;
  cacheClear: (key: string) => Promise<void>;

  // Crash recovery state persistence
  saveCrashState: (state: any) => Promise<void>;
  getCrashState: () => Promise<any>;
  clearCrashState: () => Promise<void>;

  // Sleep/Wake lifecycle events
  onSystemResume: (callback: () => void) => void;
  onSystemSuspend: (callback: () => void) => void;
  removeSystemResumeListener: () => void;
  removeSystemSuspendListener: () => void;

  // Receipt history for reprint
  saveReceiptHistory: (receipt: any) => Promise<void>;
  getReceiptHistory: () => Promise<any[]>;

  // Printer status monitoring
  getPrinterStatus: () => Promise<any>;
  onPrinterStatus: (callback: (status: any) => void) => void;
  removePrinterStatusListener: () => void;

  // Printer role configuration
  getPrinterRoles: () => Promise<any>;
  savePrinterRoles: (roles: any) => Promise<void>;
  testPrintRole: (role: string) => Promise<PrintResult>;

  // Window title
  setWindowTitle: (title: string) => Promise<void>;

  // Multi-monitor workspace management
  getDisplays: () => Promise<DisplayInfo[]>;
  getWorkspaceLayout: () => Promise<WorkspaceLayout>;
  saveWorkspaceLayout: (layout: WorkspaceLayout) => Promise<void>;
  applyWorkspaceLayout: (layout: WorkspaceLayout) => Promise<void>;
  onDisplaysChanged: (callback: () => void) => void;
  removeDisplaysChangedListener: () => void;

  // Native notifications
  showNotification: (data: NativeNotificationData) => Promise<void>;
  onNotificationClicked: (callback: (data: any) => void) => void;
  removeNotificationClickedListener: () => void;

  // ============================================================================
  // OFFLINE ORDER QUEUE (SQLite persistence)
  // All methods return wrapped responses: { success: boolean, ... }
  // ============================================================================

  offlineOrderEnqueue: (order: ElectronOfflineOrder) => Promise<OfflineOrderEnqueueResponse>;
  offlineOrderList: (status?: 'pending' | 'syncing' | 'synced' | 'failed') => Promise<OfflineOrderListResponse>;
  offlineOrderMarkSynced: (id: string, serverId: string) => Promise<OfflineOrderOperationResponse>;
  offlineOrderMarkFailed: (id: string, error: string) => Promise<OfflineOrderOperationResponse>;
  offlineOrderGetStats: () => Promise<OfflineOrderStatsResponse>;
  offlineOrderDelete: (id: string) => Promise<OfflineOrderDeleteResponse>;

  // ============================================================================
  // PRINT QUEUE (SQLite persistence)
  // All methods return wrapped responses: { success: boolean, ... }
  // ============================================================================

  printQueueEnqueue: (job: ElectronPrintJob) => Promise<PrintQueueEnqueueResponse>;
  printQueueList: (status?: 'pending' | 'printing' | 'printed' | 'failed') => Promise<PrintQueueListResponse>;
  printQueueMarkPrinted: (id: string) => Promise<PrintQueueOperationResponse>;
  printQueueMarkFailed: (id: string, error: string) => Promise<PrintQueueOperationResponse>;
  printQueueRetry: (id: string) => Promise<PrintQueueOperationResponse>;
  printQueueGetStats: () => Promise<PrintQueueStatsResponse>;
  printQueueDelete: (id: string) => Promise<PrintQueueDeleteResponse>;
}

// ============================================================================
// GLOBAL WINDOW EXTENSION
// ============================================================================

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if running in Electron with offline persistence available
 */
export function isElectronOfflineAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.electronAPI !== 'undefined' &&
    typeof window.electronAPI.offlineOrderEnqueue === 'function';
}

/**
 * Check if running in Electron with print queue available
 */
export function isElectronPrintQueueAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.electronAPI !== 'undefined' &&
    typeof window.electronAPI.printQueueEnqueue === 'function';
}

/**
 * Get the Electron API safely
 * Returns undefined if not in Electron environment
 */
export function getElectronAPI(): ElectronAPI | undefined {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }
  return undefined;
}
