/**
 * Helper App Detection and Direct Printing Utilities
 *
 * This module handles direct communication with the local printer helper app
 * running on localhost:3001, bypassing cloud backend limitations.
 */

// Helper App Configuration
const HELPER_APP_URL = 'http://localhost:3001';
const HELPER_APP_TIMEOUT = 3000; // 3 seconds

// Types
export interface HelperAppStatus {
  isAvailable: boolean;
  isConnected: boolean;
  printerConnected?: boolean;
  connectionType?: string;
  message: string;
  error?: string;
}

export interface PrintJobData {
  order_id: string;
  order_type: string;
  items: any[];
  total_amount: number;
  payment_method: string;
  special_instructions?: string;
  customer_data?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    postcode?: string;
    delivery_instructions?: string;
  };
}

export interface PrintResponse {
  success: boolean;
  message: string;
  job_id?: string;
  error?: string;
}

/**
 * Check if the local helper app is running and responding
 */
export async function checkHelperAppStatus(): Promise<HelperAppStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HELPER_APP_TIMEOUT);

    const response = await fetch(`${HELPER_APP_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      return {
        isAvailable: true,
        isConnected: true,
        printerConnected: data.printer_connected || false,
        connectionType: data.connection_type || 'unknown',
        message: data.message || 'Helper app is running'
      };
    } else {
      return {
        isAvailable: false,
        isConnected: false,
        message: `Helper app returned ${response.status}`,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error: any) {
    return {
      isAvailable: false,
      isConnected: false,
      message: 'Helper app not running or not accessible',
      error: error.message
    };
  }
}

/**
 * Determine if this order should be printed as kitchen ticket or customer receipt
 * Based on order type and restaurant business logic
 */
export function determineReceiptType(orderType: string): 'kitchen' | 'customer' {
  // Kitchen ticket for all order types that need kitchen preparation
  if (['DINE-IN', 'WAITING', 'COLLECTION', 'DELIVERY'].includes(orderType.toUpperCase())) {
    return 'kitchen';
  }

  // Default to customer receipt for other cases
  return 'customer';
}

/**
 * Send print job directly to helper app
 */
export async function printViaHelperApp(
  printData: PrintJobData,
  receiptType: 'kitchen' | 'customer' = 'kitchen'
): Promise<PrintResponse> {
  try {
    const url = receiptType === 'kitchen'
      ? `${HELPER_APP_URL}/print/kitchen`
      : `${HELPER_APP_URL}/print/receipt`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HELPER_APP_TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();

      return {
        success: true,
        message: result.message || `${receiptType} printed successfully`,
        job_id: result.job_id || `helper_${Date.now()}`
      };
    } else {
      const errorText = await response.text();

      return {
        success: false,
        message: `Print failed: ${response.status}`,
        error: errorText
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Print failed: Helper app error',
      error: error.message
    };
  }
}

/**
 * Print both kitchen ticket and customer receipt via helper app
 */
export async function printBothViaHelperApp(printData: PrintJobData): Promise<{
  kitchen: PrintResponse;
  customer: PrintResponse;
  overallSuccess: boolean;
}> {
  const kitchenResult = await printViaHelperApp(printData, 'kitchen');
  const customerResult = await printViaHelperApp(printData, 'customer');

  const overallSuccess = kitchenResult.success && customerResult.success;

  return {
    kitchen: kitchenResult,
    customer: customerResult,
    overallSuccess
  };
}

/**
 * Test helper app connectivity and printer status
 */
export async function testHelperAppPrint(): Promise<PrintResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HELPER_APP_TIMEOUT);

    const response = await fetch(`${HELPER_APP_URL}/print/test`, {
      method: 'POST',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();

      return {
        success: true,
        message: result.message || 'Test print successful',
        job_id: result.job_id
      };
    } else {
      const errorText = await response.text();

      return {
        success: false,
        message: `Test print failed: ${response.status}`,
        error: errorText
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Test print failed: Helper app error',
      error: error.message
    };
  }
}
