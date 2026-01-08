


// POS Settings interfaces - used by POS and POSSettings components
export interface ServiceChargeSettings {
  enabled: boolean;
  percentage: number;
  print_on_receipt: boolean;
}

// Note: DeliveryChargeSettings removed - now using comprehensive DeliverySettings from restaurant settings
// This provides better integration with the delivery management system

export interface POSSettings {
  service_charge: ServiceChargeSettings;
  // delivery_charge removed - using restaurant delivery settings instead
}

// Note: The global Window interface extension is now in global.d.ts
// This keeps all global type declarations in one place
