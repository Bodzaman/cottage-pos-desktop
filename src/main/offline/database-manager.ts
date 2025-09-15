import { app } from 'electron';
import { join } from 'path';
import Database from 'better-sqlite3';

export interface OfflineOrder {
  id: string;
  tableId?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  timestamp: string;
  orderType: 'DINE-IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY';
  status: 'pending' | 'completed';
}

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = join(app.getPath('userData'), 'cottage-pos.db');
  }

  public async initialize(): Promise<void> {
    try {
      this.db = new Database(this.dbPath);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create offline orders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS offline_orders (
        id TEXT PRIMARY KEY,
        table_id TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        timestamp TEXT NOT NULL,
        order_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
      )
    `);

    // Create print queue table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_queue (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        receipt_data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        printed BOOLEAN DEFAULT FALSE
      )
    `);
  }

  public async saveOfflineOrder(order: OfflineOrder): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO offline_orders (id, table_id, items, total, timestamp, order_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      order.id,
      order.tableId || null,
      JSON.stringify(order.items),
      order.total,
      order.timestamp,
      order.orderType,
      order.status
    );
  }

  public async getOfflineOrders(): Promise<OfflineOrder[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM offline_orders WHERE status = ?');
    const rows = stmt.all('pending') as any[];

    return rows.map(row => ({
      id: row.id,
      tableId: row.table_id,
      items: JSON.parse(row.items),
      total: row.total,
      timestamp: row.timestamp,
      orderType: row.order_type,
      status: row.status
    }));
  }

  public async markOrderCompleted(orderId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('UPDATE offline_orders SET status = ? WHERE id = ?');
    stmt.run('completed', orderId);
  }

  public async addToPrintQueue(orderId: string, receiptData: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO print_queue (id, order_id, receipt_data, created_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      `print_${Date.now()}`,
      orderId,
      receiptData,
      new Date().toISOString()
    );
  }

  public async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const databaseManager = new DatabaseManager();
