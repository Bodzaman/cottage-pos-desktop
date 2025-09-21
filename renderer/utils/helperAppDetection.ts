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
    console.log('🔍 [HelperApp] Checking helper app status...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HELPER_APP_TIMEOUT);
    
    const response = await fetch(`${HELPER_APP_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ [HelperApp] Helper app is available:', data);
      
      return {
        isAvailable: true,
        isConnected: true,
        printerConnected: data.printer_connected || false,
        connectionType: data.connection_type || 'unknown',
        message: data.message || 'Helper app is running'
      };
    } else {
      console.log('⚠️ [HelperApp] Helper app responded with error:', response.status);
      
      return {
        isAvailable: false,
        isConnected: false,
        message: `Helper app returned ${response.status}`,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error: any) {
    console.log('❌ [HelperApp] Helper app is not available:', error.message);
    
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
    console.log(`🔍 [HelperApp] Kitchen ticket detected for order type: ${orderType}`);
    return 'kitchen';
  }
  
  // Default to customer receipt for other cases
  console.log(`🔍 [HelperApp] Customer receipt detected for order type: ${orderType}`);
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
    const endpoint = receiptType === 'kitchen' ? '/print/kitchen' : '/print/receipt';
    const url = `${HELPER_APP_URL}${endpoint}`;
    
    console.log(`🖨️ [HelperApp] Sending ${receiptType} print job to:`, url);
    console.log(`🖨️ [HelperApp] Print data:`, {
      order_id: printData.order_id,
      order_type: printData.order_type,
      items_count: printData.items.length,
      total: printData.total_amount
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HELPER_APP_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printData)
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [HelperApp] ${receiptType} print successful:`, result);
      
      return {
        success: true,
        message: result.message || `${receiptType} printed successfully`,
        job_id: result.job_id || `helper_${Date.now()}`
      };
    } else {
      const errorText = await response.text();
      console.log(`❌ [HelperApp] ${receiptType} print failed:`, response.status, errorText);
      
      return {
        success: false,
        message: `Print failed: ${response.status}`,
        error: errorText
      };
    }
  } catch (error: any) {
    console.log(`❌ [HelperApp] ${receiptType} print error:`, error.message);
    
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
  console.log('🖨️ [HelperApp] Printing both kitchen ticket and customer receipt...');
  
  // Print kitchen ticket
  const kitchenResult = await printViaHelperApp(printData, 'kitchen');
  
  // Print customer receipt
  const customerResult = await printViaHelperApp(printData, 'customer');
  
  const overallSuccess = kitchenResult.success && customerResult.success;
  
  console.log(`📊 [HelperApp] Print results:`, {
    kitchen: kitchenResult.success ? '✅' : '❌',
    customer: customerResult.success ? '✅' : '❌',
    overall: overallSuccess ? '✅' : '❌'
  });
  
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
    console.log('🧪 [HelperApp] Testing print functionality...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HELPER_APP_TIMEOUT);
    
    const response = await fetch(`${HELPER_APP_URL}/print/test`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'COTTAGE TANDOORI\nTest Print from POSII\nHelper App Integration Test'
      })
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ [HelperApp] Test print successful:', result);
      
      return {
        success: true,
        message: result.message || 'Test print successful',
        job_id: result.job_id
      };
    } else {
      const errorText = await response.text();
      console.log('❌ [HelperApp] Test print failed:', response.status, errorText);
      
      return {
        success: false,
        message: `Test print failed: ${response.status}`,
        error: errorText
      };
    }
  } catch (error: any) {
    console.log('❌ [HelperApp] Test print error:', error.message);
    
    return {
      success: false,
      message: 'Test print failed: Helper app error',
      error: error.message
    };
  }
}
