/**
 * POSDesktop Electron Integration Plan
 * Extraction of POSDesktop and dependencies for cottage-pos-desktop Build 29
 */

export const EXTRACTION_PLAN = {
  // Core POSDesktop component
  mainComponent: {
    source: 'ui/src/pages/POSDesktop.tsx',
    destination: 'src/renderer/pages/POSDesktop.tsx',
    lines: 1329,
    description: 'Main POS interface with multiple views'
  },

  // Essential UI Components (25+ files)
  uiComponents: [
    'ManagementHeader.tsx',
    'POSNavigation.tsx',
    'DineInTableSelector.tsx',
    'CategorySidebar.tsx',
    'POSMenuSelector.tsx',
    'POSMenuCard.tsx',
    'OrderSummaryPanel.tsx',
    'CustomerDetailsModal.tsx',
    'POSGuestCountModal.tsx',
    'DineInOrderModal.tsx',
    'OrderConfirmationModal.tsx',
    'POSUnifiedPaymentModal.tsx',
    'TableSelectionModal.tsx',
    'CustomizeOrchestrator.tsx',
    'CustomerSummaryBadge.tsx',
    'ManagementPasswordDialog.tsx',
    'MenuManagementDialog.tsx',
    'OnlineOrderManagement.tsx',
    'ReservationsPlaceholder.tsx'
  ],

  // Critical Utility Stores
  utilityStores: [
    'realtimeMenuStore.ts',
    'customerDataStore.ts', 
    'tableOrdersStore.ts',
    'posSettingsStore.ts',
    'QSAIDesign.ts',
    'formatters.ts',
    'menuTypes.ts',
    'tableTypes.ts',
    'logger.ts',
    'onDemandPrinterService.ts',
    'helperAppDetection.ts'
  ],

  // Brain API endpoints to replace
  apiEndpoints: {
    'brain.create_pos_order()': 'POST /pos-orders/create-order',
    'brain.print_kitchen_and_customer()': 'POST /print/kitchen-and-customer',
    'brain.process_print_queue()': 'POST /print-jobs/queue/process',
    'brain.create_print_job()': 'POST /print-jobs',
    'brain.get_supabase_config()': 'GET /get-supabase-config'
  },

  // Production API configuration
  apiConfig: {
    baseUrl: 'https://api.databutton.com/_projects/88a315b0-faa2-491d-9215-cf1e283cdee2/dbtn/prodx/app/routes'
  }
};

export const COMPONENT_FILES_TO_EXTRACT = [
  // Core UI Components
  'CategorySidebar.tsx',
  'POSMenuSelector.tsx',
  'POSMenuCard.tsx',
  'OrderSummaryPanel.tsx',
  'CustomerDetailsModal.tsx',
  'POSGuestCountModal.tsx',
  'DineInOrderModal.tsx',
  'OrderConfirmationModal.tsx',
  'POSUnifiedPaymentModal.tsx',
  'TableSelectionModal.tsx',
  'CustomizeOrchestrator.tsx',
  'CustomerSummaryBadge.tsx',
  'ManagementPasswordDialog.tsx',
  'MenuManagementDialog.tsx',
  'OnlineOrderManagement.tsx',
  'ReservationsPlaceholder.tsx'
];

// API client replacement for brain calls
export const createAPIClient = (baseUrl: string) => {
  return {
    async createPOSOrder(orderData: any) {
      return fetch(`${baseUrl}/pos-orders/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    },

    async printKitchenAndCustomer(printData: any) {
      return fetch(`${baseUrl}/print/kitchen-and-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printData)
      });
    },

    async processPrintQueue() {
      return fetch(`${baseUrl}/print-jobs/queue/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },

    async createPrintJob(jobData: any) {
      return fetch(`${baseUrl}/print-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
    },

    async getSupabaseConfig() {
      return fetch(`${baseUrl}/get-supabase-config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
};

// Migration instructions
export const MIGRATION_STEPS = [
  '1. Copy all UI components to cottage-pos-desktop/src/renderer/components/',
  '2. Copy all utility stores to cottage-pos-desktop/src/renderer/stores/',
  '3. Replace all brain.* calls with createAPIClient methods',
  '4. Update import paths for Electron renderer structure',
  '5. Test component rendering and store functionality',
  '6. Integrate with Build 29 thermal printing system',
  '7. Verify Supabase real-time subscriptions',
  '8. End-to-end testing of order flow'
];

// Package dependencies for Electron
export const ELECTRON_DEPENDENCIES = {
  dependencies: {
    '@supabase/supabase-js': '^2.38.0',
    'zustand': '^4.4.1',
    'framer-motion': '^10.16.4',
    'lucide-react': '^0.290.0',
    'sonner': '^1.2.0',
    'date-fns': '^2.30.0',
    'react': '^18.2.0',
    'react-dom': '^18.2.0'
  }
};
