import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import log from 'electron-log';

export interface OrderData {
  id: string;
  orderNumber: string;
  orderType: 'DINE_IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod?: 'CASH' | 'CARD' | 'ONLINE';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  synced: boolean;
  items: OrderItemData[];
}

export interface OrderItemData {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface MenuItemData {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  allergens?: string[];
  spiceLevel: number;
  available: boolean;
  sortOrder: number;
}

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  active: boolean;
}

export class DatabaseManager {
  private db!: Database.Database;
  private dbPath!: string;

  constructor() {
    // Create database directory in user data
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, 'cottage_pos.db');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      // Read and execute schema
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        this.db.exec(schema);
        log.info('✅ Database initialized with schema');
      } else {
        log.error('❌ Database schema file not found');
      }
    } catch (error) {
      log.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Configuration methods
  public getConfig(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value || null;
  }

  public setConfig(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO config (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(key, value);
  }

  // Order methods
  public saveOrder(order: OrderData): void {
    const transaction = this.db.transaction((orderData: OrderData) => {
      // Insert order
      const orderStmt = this.db.prepare(`
        INSERT OR REPLACE INTO orders (
          id, order_number, order_type, table_number, customer_name, 
          customer_phone, customer_address, subtotal, tax_amount, 
          discount_amount, total_amount, payment_method, payment_status, 
          order_status, notes, synced, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      orderStmt.run(
        orderData.id, orderData.orderNumber, orderData.orderType,
        orderData.tableNumber, orderData.customerName, orderData.customerPhone,
        orderData.customerAddress, orderData.subtotal, orderData.taxAmount,
        orderData.discountAmount, orderData.totalAmount, orderData.paymentMethod,
        orderData.paymentStatus, orderData.orderStatus, orderData.notes, 
        orderData.synced ? 1 : 0
      );

      // Delete existing order items
      const deleteItemsStmt = this.db.prepare('DELETE FROM order_items WHERE order_id = ?');
      deleteItemsStmt.run(orderData.id);

      // Insert order items
      const itemStmt = this.db.prepare(`
        INSERT INTO order_items (
          id, order_id, menu_item_id, quantity, unit_price, 
          total_price, special_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of orderData.items) {
        itemStmt.run(
          item.id, orderData.id, item.menuItemId, item.quantity,
          item.unitPrice, item.totalPrice, item.specialInstructions
        );
      }

      // Add to sync queue if not synced
      if (!orderData.synced) {
        this.addToSyncQueue('CREATE', 'orders', orderData.id, JSON.stringify(orderData));
      }
    });

    transaction(order);
    log.info(`💾 Order ${order.orderNumber} saved to local database`);
  }

  public getOrder(orderId: string): OrderData | null {
    const orderStmt = this.db.prepare(`
      SELECT * FROM orders WHERE id = ?
    `);
    const order = orderStmt.get(orderId) as { id: number; status: string; customer_id?: number; items?: string; total?: number; created_at?: string; } | undefined;

    if (!order) return null;

    const itemsStmt = this.db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `);
    const items = itemsStmt.all(orderId) as any[];

    return {
      id: order.id,
      orderNumber: order.order_number,
      orderType: order.order_type,
      tableNumber: order.table_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      discountAmount: order.discount_amount,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      notes: order.notes,
      synced: Boolean(order.synced),
      items: items.map(item => ({
        id: item.id,
        menuItemId: item.menu_item_id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        specialInstructions: item.special_instructions
      }))
    };
  }

  public getUnsyncedOrders(): OrderData[] {
    const stmt = this.db.prepare(`
      SELECT id FROM orders WHERE synced = 0 ORDER BY created_at
    `);
    const orderIds = stmt.all() as { id: string }[];

    return orderIds.map(row => this.getOrder(row.id)).filter(order => order !== null) as OrderData[];
  }

  // Sync queue methods
  public addToSyncQueue(operation: string, tableName: string, recordId: string, data?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO sync_queue (operation_type, table_name, record_id, data)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(operation, tableName, recordId, data);
  }

  public getSyncQueue(limit = 50): Array<any> {
    const stmt = this.db.prepare(`
      SELECT * FROM sync_queue 
      WHERE attempts < 3 
      ORDER BY created_at 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  public markSyncItemProcessed(syncId: number): void {
    const stmt = this.db.prepare('DELETE FROM sync_queue WHERE id = ?');
    stmt.run(syncId);
  }

  public markSyncItemFailed(syncId: number, error: string): void {
    const stmt = this.db.prepare(`
      UPDATE sync_queue 
      SET attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP, error_message = ?
      WHERE id = ?
    `);
    stmt.run(error, syncId);
  }

  // Print queue methods
  public addPrintJob(orderId: string, printType: string, content: string, printerName?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO print_jobs (order_id, print_type, content, printer_name)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(orderId, printType, content, printerName);
  }

  public getPendingPrintJobs(): Array<any> {
    const stmt = this.db.prepare(`
      SELECT * FROM print_jobs 
      WHERE status = 'PENDING' AND attempts < 3
      ORDER BY created_at
    `);
    return stmt.all();
  }

  public markPrintJobCompleted(jobId: number): void {
    const stmt = this.db.prepare(`
      UPDATE print_jobs 
      SET status = 'PRINTED', printed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(jobId);
  }

  public markPrintJobFailed(jobId: number, error: string): void {
    const stmt = this.db.prepare(`
      UPDATE print_jobs 
      SET status = 'FAILED', attempts = attempts + 1, error_message = ?
      WHERE id = ?
    `);
    stmt.run(error, jobId);
  }

  // Cleanup methods
  public cleanup(): void {
    // Remove old sync queue items (older than 7 days)
    const cleanupSync = this.db.prepare(`
      DELETE FROM sync_queue 
      WHERE created_at < datetime('now', '-7 days')
    `);
    cleanupSync.run();

    // Remove old completed print jobs (older than 30 days)
    const cleanupPrint = this.db.prepare(`
      DELETE FROM print_jobs 
      WHERE status = 'PRINTED' AND created_at < datetime('now', '-30 days')
    `);
    cleanupPrint.run();

    log.info('🧹 Database cleanup completed');
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      log.info('🔒 Database connection closed');
    }
  }
}