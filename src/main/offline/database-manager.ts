// import Database from 'better-sqlite3'; // Will be added when needed
// Placeholder implementation for now

// Temporary type definitions
type DatabaseType = any;
type StatementType = any;
import { app } from 'electron';
import { join } from 'path';
import log from 'electron-log';

interface DatabaseRecord {
  id: string;
  [key: string]: unknown;
}

interface ConfigRecord {
  key: string;
  value: string;
}

interface OfflineQueueRecord {
  id: string;
  data: string;
  created_at: string;
  processed: number;
}

interface PrintJobRecord {
  id: string;
  type: string;
  data: string;
  status: string;
  created_at: string;
  processed_at?: string;
}

export class DatabaseManager {
  private db!: any // any // Database placeholderDatabase placeholder;
  private dbPath!: string;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      // Set database path in user data directory
      this.dbPath = join(app.getPath('userData'), 'cottage-pos.db');
      
      // Initialize database connection
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      
      // Create tables if they don't exist
      this.createTables();
      
      log.info(`Database initialized at: ${this.dbPath}`);
    } catch (error) {
      log.error('Database initialization error:', error);
      throw error;
    }
  }

  private createTables(): void {
    // Configuration table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Offline queue for syncing when online
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed INTEGER DEFAULT 0
      )
    `);

    // Print jobs queue
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS print_jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME
      )
    `);

    // Orders cache for offline operation
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders_cache (
        id TEXT PRIMARY KEY,
        order_data TEXT NOT NULL,
        order_type TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      )
    `);

    // Menu items cache
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS menu_cache (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        available INTEGER DEFAULT 1,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    log.info('Database tables created/verified');
  }

  async query(sql: string, params: unknown[] = []): Promise<DatabaseRecord[]> {
    try {
      const stmt = this.db.prepare(sql);
      const results = stmt.all(...params) as DatabaseRecord[];
      return results;
    } catch (error) {
      log.error('Database query error:', error);
      throw error;
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      return {
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid)
      };
    } catch (error) {
      log.error('Database run error:', error);
      throw error;
    }
  }

  async getConfig(key: string): Promise<unknown> {
    try {
      const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
      const result = stmt.get(key) as ConfigRecord | undefined;
      
      if (result) {
        try {
          return JSON.parse(result.value);
        } catch {
          return result.value;
        }
      }
      
      return null;
    } catch (error) {
      log.error('Get config error:', error);
      throw error;
    }
  }

  async setConfig(key: string, value: unknown): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO config (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      stmt.run(key, serializedValue);
    } catch (error) {
      log.error('Set config error:', error);
      throw error;
    }
  }

  async addToOfflineQueue(data: unknown): Promise<string> {
    try {
      const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stmt = this.db.prepare(`
        INSERT INTO offline_queue (id, data) VALUES (?, ?)
      `);
      
      stmt.run(id, JSON.stringify(data));
      return id;
    } catch (error) {
      log.error('Add to offline queue error:', error);
      throw error;
    }
  }

  async getOfflineQueue(): Promise<DatabaseRecord[]> {
    try {
      const stmt = this.db.prepare('SELECT * FROM offline_queue WHERE processed = 0 ORDER BY created_at');
      return stmt.all() as DatabaseRecord[];
    } catch (error) {
      log.error('Get offline queue error:', error);
      return [];
    }
  }

  async processOfflineQueue(): Promise<number> {
    try {
      // Mark all items as processed
      const stmt = this.db.prepare('UPDATE offline_queue SET processed = 1 WHERE processed = 0');
      const result = stmt.run();
      
      log.info(`Processed ${result.changes} offline queue items`);
      return result.changes;
    } catch (error) {
      log.error('Process offline queue error:', error);
      return 0;
    }
  }

  async addPrintJob(type: string, data: unknown): Promise<string> {
    try {
      const id = `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stmt = this.db.prepare(`
        INSERT INTO print_jobs (id, type, data) VALUES (?, ?, ?)
      `);
      
      stmt.run(id, type, JSON.stringify(data));
      return id;
    } catch (error) {
      log.error('Add print job error:', error);
      throw error;
    }
  }

  async getPendingPrintJobs(): Promise<PrintJobRecord[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM print_jobs 
        WHERE status = 'pending' 
        ORDER BY created_at
      `);
      return stmt.all() as PrintJobRecord[];
    } catch (error) {
      log.error('Get pending print jobs error:', error);
      return [];
    }
  }

  async markPrintJobCompleted(id: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE print_jobs 
        SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      stmt.run(id);
    } catch (error) {
      log.error('Mark print job completed error:', error);
      throw error;
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      log.info('Database connection closed');
    }
  }
}
