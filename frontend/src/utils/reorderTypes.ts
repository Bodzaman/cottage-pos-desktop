// Reorder validation types

export interface ReorderItem {
  item_id: string;
  name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  original_price: number;
  notes?: string;
}

export interface ReorderValidationRequest {
  order_id: string;
  items: ReorderItem[];
}

export interface ValidationResult {
  item_id: string;
  name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  status: 'available' | 'price_changed' | 'unavailable' | 'variant_unavailable';
  original_price: number;
  current_price?: number;
  price_difference?: number;
  matched_item_id?: string;
  matched_variant_id?: string;
  suggestion?: string;
  notes?: string;
}

export interface ReorderValidationResponse {
  success: boolean;
  message: string;
  order_id: string;
  total_items: number;
  available_items: number;
  price_changed_items: number;
  unavailable_items: number;
  original_total: number;
  new_total: number;
  total_difference: number;
  validation_results: ValidationResult[];
  recommendations: string[];
}

// Order data types for reordering
export interface OrderItemForReorder {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  variant_name?: string;
  notes?: string;
}

export interface OrderDataForReorder {
  order_id: string;
  order_type: string;
  items: OrderItemForReorder[];
}
