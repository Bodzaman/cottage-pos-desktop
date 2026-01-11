/**
 * Type definitions and re-exports for the Cottage POS application.
 *
 * Re-exports types from brain/data-contracts.ts and provides
 * additional type definitions for components and utilities.
 */

// Re-export all types from data-contracts
export * from '../brain/data-contracts';

// ============================================================================
// Additional Type Definitions
// ============================================================================

/**
 * Enriched dine-in order item with full menu metadata
 * Used in Review Modal and order summary components
 */
export interface EnrichedDineInOrderItem {
  id: string;
  order_id: string;
  customer_tab_id: string | null;
  table_number: number;
  menu_item_id: string;
  variant_id: string | null;
  category_id: string | null;
  item_name: string;
  variant_name: string | null;
  protein_type: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  customizations: any;
  notes: string | null;
  status: string;
  sent_to_kitchen_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched fields from menu data
  image_url?: string | null;
  category_name?: string | null;
  menu_item_description?: string | null;
}

/**
 * Custom serving size response from API
 */
export interface CustomServingSizeResponse {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_default: boolean;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create custom serving size request
 */
export interface CustomServingSizeCreate {
  menu_item_id: string;
  name: string;
  price: number;
  is_default?: boolean;
  display_order?: number;
}

/**
 * Update custom serving size request
 */
export interface CustomServingSizeUpdate {
  name?: string;
  price?: number;
  is_default?: boolean;
  display_order?: number;
  active?: boolean;
}

/**
 * Agent configuration response
 */
export interface AgentConfigResponse {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Agent configuration request
 */
export interface AgentConfigRequest {
  name: string;
  type: string;
  config: Record<string, any>;
  active?: boolean;
}

/**
 * Agent test call response
 */
export interface AgentTestCallResponse {
  success: boolean;
  call_id?: string;
  status?: string;
  message?: string;
  error?: string;
}

/**
 * Upload file request
 */
export interface UploadFileRequest {
  file: File;
  folder?: string;
  public?: boolean;
}

/**
 * Customer address type alias
 * Maps to AppApisCustomerAddressesCustomerAddress from data-contracts
 */
export type CustomerAddress = {
  id: string;
  customer_id: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  postal_code: string;
  country?: string;
  is_default: boolean;
  label?: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Order item type used in POS components
 */
export interface OrderItem {
  id: string;
  menu_item_id?: string;
  variant_id?: string;
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
  protein_type?: string;
  modifiers?: any[];
  customizations?: any[];
  notes?: string;
  image_url?: string;
  sent_to_kitchen?: boolean;
  created_at?: string;
}
