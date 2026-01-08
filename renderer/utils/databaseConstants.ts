/**
 * Centralized Database Constants for Frontend
 * 
 * This file mirrors the backend database constants and provides
 * type-safe access to table names and column names in the frontend.
 * 
 * IMPORTANT: Keep this file in sync with src/app/libs/database_constants.py
 */

// =============================================================================
// TABLE NAME CONSTANTS
// =============================================================================

export const Tables = {
  // Menu Domain
  MENU_CATEGORIES: 'menu_categories',
  MENU_ITEMS: 'menu_items',
  MENU_ITEM_VARIANTS: 'menu_item_variants',
  MENU_MODIFIERS: 'menu_modifiers',
  MENU_MODIFIER_GROUPS: 'menu_modifier_groups',
  MENU_PROTEIN_TYPES: 'menu_protein_types',
  MENU_AI_METADATA: 'menu_ai_metadata',
  
  // Order Domain
  ORDER_TRANSACTIONS: 'order_transactions',
  ORDER_ITEMS: 'order_items',
  ORDER_NOTIFICATIONS: 'order_notifications',
  
  // User Domain
  USER_ACCOUNTS: 'user_accounts',
  USER_PROFILES_LEGACY: 'user_profiles_legacy',
  USER_FAVORITES_LEGACY: 'user_favorites_legacy',
  USER_ROLE_DEFINITIONS: 'user_role_definitions',
  USER_ROLES: 'user_roles',
  USER_MANAGER_CREDENTIALS: 'user_manager_credentials',
  
  // Restaurant Core
  RESTAURANT_SETTINGS: 'restaurant_settings',
  RESTAURANT_DETAILS: 'restaurant_details',
  RESTAURANT_VERSIONS: 'restaurant_versions',
  
  // Reservations Domain
  RESERVATIONS: 'reservations',
  RESERVATION_NOTIFICATIONS: 'reservation_notifications',
  
  // POS Domain
  POS_SETTINGS: 'pos_settings',
  POS_TABLES: 'pos_tables',
  
  // Payment Domain
  PAYMENT_NOTIFICATIONS: 'payment_notifications',
  
  // Media Domain
  MEDIA_ASSETS: 'media_assets',
  
  // Delivery Domain
  DELIVERY_ZONES: 'delivery_zones',
  
  // Notification Domain
  NOTIFICATION_TEMPLATES: 'notification_templates',
} as const;

// =============================================================================
// COLUMN NAME CONSTANTS
// =============================================================================

export const Columns = {
  // Common columns
  ID: 'id',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  IS_ACTIVE: 'is_active', // Standard boolean active field
  NAME: 'name',
  DESCRIPTION: 'description',
  
  // Menu specific
  MENU_ITEM_ID: 'menu_item_id',
  CATEGORY_ID: 'category_id',
  PARENT_CATEGORY_ID: 'parent_category_id',
  PRICE_DINE_IN: 'price_dine_in',
  PRICE_DELIVERY: 'price_delivery',
  HAS_VARIANTS: 'has_variants',
  IMAGE_URL: 'image_url',
  
  // Order specific
  ORDER_ID: 'order_id',
  ORDER_TYPE: 'order_type',
  ORDER_STATUS: 'order_status',
  TOTAL_AMOUNT: 'total_amount',
  CUSTOMER_ID: 'customer_id',
  
  // User specific
  USER_ID: 'user_id',
  EMAIL: 'email',
  ROLE: 'role',
  
  // Restaurant specific
  OPENING_HOURS: 'opening_hours',
  CONTACT_INFO: 'contact_info',
} as const;

// =============================================================================
// LEGACY TABLE MAPPING
// =============================================================================

export const LEGACY_TABLE_MAPPING = {
  // Old name -> New name
  categories: Tables.MENU_CATEGORIES,
  orders: Tables.ORDER_TRANSACTIONS,
  users: Tables.USER_ACCOUNTS,
  profiles: Tables.USER_PROFILES_LEGACY,
  favorites: Tables.USER_FAVORITES_LEGACY,
  roles: Tables.USER_ROLE_DEFINITIONS,
  modifiers: Tables.MENU_MODIFIERS,
  modifier_groups: Tables.MENU_MODIFIER_GROUPS,
  item_variants: Tables.MENU_ITEM_VARIANTS,
  protein_types: Tables.MENU_PROTEIN_TYPES,
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type TableName = typeof Tables[keyof typeof Tables];
export type ColumnName = typeof Columns[keyof typeof Columns];
export type LegacyTableName = keyof typeof LEGACY_TABLE_MAPPING;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Get the correct table name, handling legacy mappings
 */
export function getTableName(legacyName: string): string {
  return LEGACY_TABLE_MAPPING[legacyName as LegacyTableName] || legacyName;
}

/**
 * Validate that a table name follows our naming conventions
 */
export function validateTableName(tableName: string): boolean {
  const allTables = Object.values(Tables);
  const allLegacyTables = Object.values(LEGACY_TABLE_MAPPING);
  return allTables.includes(tableName as TableName) || allLegacyTables.includes(tableName as TableName);
}

/**
 * Get all tables for a specific domain (e.g., 'menu', 'order', 'user')
 */
export function getDomainTables(domain: string): string[] {
  const allTables = Object.values(Tables);
  return allTables.filter(table => table.startsWith(`${domain.toLowerCase()}_`));
}

/**
 * Detect hardcoded database references in code
 */
export function detectHardcodedPatterns(code: string): string[] {
  const issues: string[] = [];
  
  // Check for hardcoded URLs
  if (code.includes('.supabase.co')) {
    issues.push('Hardcoded Supabase URL detected');
  }
  
  // Check for hardcoded table names (legacy patterns)
  const legacyPatterns = [
    "table('categories')",
    "table('orders')", 
    "table('users')",
    'from("categories")',
    'from("orders")',
    'from("users")',
  ];
  
  for (const pattern of legacyPatterns) {
    if (code.includes(pattern)) {
      issues.push(`Legacy table reference detected: ${pattern}`);
    }
  }
  
  // Check for inconsistent column naming
  if (code.includes('"active"') && !code.includes('"is_active"')) {
    issues.push("Inconsistent column naming: use 'is_active' not 'active'");
  }
  
  return issues;
}

/**
 * Format Supabase query to use proper table names
 */
export function formatSupabaseQuery(tableName: string): string {
  return getTableName(tableName);
}
