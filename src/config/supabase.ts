
/**
 * Supabase Configuration for cottage-pos-desktop
 * Centralized configuration for database connections
 */

export const supabaseConfig = {
  url: process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
  serviceRoleKey: process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY',
};

// Database table names
export const tables = {
  MENU_CATEGORIES: 'menu_categories',
  MENU_ITEMS: 'menu_items',
  ORDERS: 'orders',
  POS_TABLES: 'pos_tables',
  CUSTOMERS: 'customers',
  PAYMENTS: 'payments',
  PRINT_JOBS: 'print_jobs'
};

// Order types
export const ORDER_TYPES = {
  DINE_IN: 'DINE-IN',
  COLLECTION: 'COLLECTION', 
  DELIVERY: 'DELIVERY',
  WAITING: 'WAITING'
} as const;

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;
