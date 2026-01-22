/**
 * Draft Review System Types
 *
 * These types support the draft visibility and review workflow:
 * - Visual indicators (DRAFT badges, amber highlights)
 * - Review modal with before/after comparison
 * - Revert functionality to restore published state
 */

/**
 * Represents a single field change between draft and published versions
 */
export interface FieldChange {
  /** Database field name */
  field: string;
  /** Human-readable label for display */
  label: string;
  /** Value in the published snapshot (or null if new) */
  oldValue: any;
  /** Current draft value */
  newValue: any;
  /** Type hint for formatting the display */
  type: 'text' | 'price' | 'boolean' | 'category' | 'number' | 'array';
}

/**
 * A draft item with its detected changes compared to the published snapshot
 */
export interface DraftItemChange {
  /** Menu item ID */
  item_id: string;
  /** Current item name */
  name: string;
  /** True if this item has never been published */
  is_new: boolean;
  /** Timestamp of last update */
  updated_at: string;
  /** Category name for display */
  category_name?: string;
  /** List of field-by-field changes (empty for new items) */
  changes: FieldChange[];
}

/**
 * Response from getDraftItemsWithChanges
 */
export interface DraftChangesResponse {
  success: boolean;
  draft_items: DraftItemChange[];
  count: number;
  error?: string;
}

/**
 * Response from revertToPublished
 */
export interface RevertResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * A snapshot of a menu item at a point in time
 */
export interface MenuItemSnapshot {
  id: string;
  menu_item_id: string;
  snapshot_type: 'published' | 'draft';

  // Mirrored menu item fields
  name: string;
  description: string | null;
  base_price: number | null;
  price_dine_in: number | null;
  price_delivery: number | null;
  price_takeaway: number | null;
  category_id: string | null;
  kitchen_display_name: string | null;
  spice_level: number | null;
  dietary_tags: any | null;
  image_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
  variants_snapshot: any[];

  // Metadata
  snapshot_at: string;
  published_at: string | null;
}

/**
 * Field definitions for comparing menu items
 * Maps database fields to human-readable labels and value types
 */
export const COMPARABLE_FIELDS: { field: string; label: string; type: FieldChange['type'] }[] = [
  { field: 'name', label: 'Name', type: 'text' },
  { field: 'description', label: 'Description', type: 'text' },
  { field: 'base_price', label: 'Base Price', type: 'price' },
  { field: 'price_dine_in', label: 'Dine-In Price', type: 'price' },
  { field: 'price_delivery', label: 'Delivery Price', type: 'price' },
  { field: 'price_takeaway', label: 'Takeaway Price', type: 'price' },
  { field: 'kitchen_display_name', label: 'Kitchen Name', type: 'text' },
  { field: 'spice_level', label: 'Spice Level', type: 'number' },
  { field: 'is_active', label: 'Active Status', type: 'boolean' },
  { field: 'display_order', label: 'Display Order', type: 'number' },
  { field: 'dietary_tags', label: 'Dietary Tags', type: 'array' },
];

/**
 * Helper to format a value for display based on its type
 */
export function formatFieldValue(value: any, type: FieldChange['type']): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }

  switch (type) {
    case 'price':
      return typeof value === 'number' ? `£${value.toFixed(2)}` : String(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'array':
      return Array.isArray(value) ? value.join(', ') || '(none)' : String(value);
    case 'number':
      return String(value);
    case 'text':
    case 'category':
    default:
      return String(value);
  }
}

/**
 * Compare two values for equality (handles arrays and nulls)
 */
export function valuesAreEqual(a: any, b: any): boolean {
  // Handle null/undefined
  if (a === null || a === undefined) {
    return b === null || b === undefined;
  }
  if (b === null || b === undefined) {
    return false;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => valuesAreEqual(val, b[idx]));
  }

  // Handle numbers (with tolerance for floating point)
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 0.001;
  }

  // Simple equality
  return a === b;
}
