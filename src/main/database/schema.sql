-- Cottage Tandoori POS - Offline Database Schema
-- SQLite database for offline-first functionality

PRAGMA foreign_keys = ON;

-- Configuration table for app settings
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Menu categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    allergens TEXT, -- JSON array
    spice_level INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Orders (both dine-in and online)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    order_type TEXT NOT NULL, -- 'DINE_IN', 'COLLECTION', 'DELIVERY', 'WAITING'
    table_number TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT, -- 'CASH', 'CARD', 'ONLINE'
    payment_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'FAILED'
    order_status TEXT DEFAULT 'NEW', -- 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'
    notes TEXT,
    synced BOOLEAN DEFAULT FALSE,
    sync_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Sync queue for offline operations
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    data TEXT, -- JSON data
    attempts INTEGER DEFAULT 0,
    last_attempt DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Print jobs queue
CREATE TABLE IF NOT EXISTS print_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    print_type TEXT NOT NULL, -- 'RECEIPT', 'KITCHEN', 'BAR'
    printer_name TEXT,
    content TEXT NOT NULL, -- Print content
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PRINTING', 'PRINTED', 'FAILED'
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    printed_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Insert default configuration
INSERT OR IGNORE INTO config (key, value) VALUES
('app_version', '1.0.7'),
('pos_url', 'https://exoticcreations.databutton.app/cottage-tandoori-restaurant'),
('printer_name', 'Epson TM-T20III'),
('auto_print_receipts', 'true'),
('offline_mode', 'false'),
('last_sync', ''),
('tax_rate', '0.20'),
('currency', 'GBP');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);