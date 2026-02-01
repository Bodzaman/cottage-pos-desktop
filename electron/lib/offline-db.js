/**
 * SQLite Offline Database for Cottage Tandoori POS
 *
 * Provides persistent storage for:
 * - Offline order queue (survives app restarts/crashes)
 * - Print job queue (retry failed prints)
 *
 * Uses better-sqlite3 for synchronous, fast SQLite access.
 * WAL mode enabled for crash safety.
 *
 * IMPORTANT: This module runs ONLY in the Electron main process.
 * Renderer access is via IPC handlers exposed in main.js.
 */

const Database = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');
const log = require('electron-log');

// Database instance (singleton)
let db = null;

// Current schema version - increment when schema changes
const SCHEMA_VERSION = 1;

/**
 * Initialize the SQLite database
 * Creates tables if they don't exist, runs migrations
 */
function initDatabase() {
    if (db) {
        return db;
    }

    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'pos-offline.db');

    log.info(`[OFFLINE-DB] Initializing database at: ${dbPath}`);

    try {
        // Create database with WAL mode for crash safety
        db = new Database(dbPath, {
            verbose: process.env.NODE_ENV === 'development' ? (msg) => log.debug(`[SQL] ${msg}`) : undefined
        });

        // Enable WAL mode for crash safety and concurrent reads
        db.pragma('journal_mode = WAL');
        db.pragma('busy_timeout = 5000');
        db.pragma('synchronous = NORMAL');

        // Run migrations
        runMigrations(db);

        log.info('[OFFLINE-DB] Database initialized successfully');
        log.info(`[OFFLINE-DB] Journal mode: ${db.pragma('journal_mode', { simple: true })}`);

        return db;
    } catch (error) {
        log.error(`[OFFLINE-DB] Failed to initialize database: ${error}`);
        throw error;
    }
}

/**
 * Run database migrations
 */
function runMigrations(database) {
    // Check current schema version
    const versionTable = database.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='schema_version'
    `).get();

    let currentVersion = 0;

    if (!versionTable) {
        // Create schema_version table
        database.exec(`
            CREATE TABLE schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } else {
        const row = database.prepare('SELECT MAX(version) as version FROM schema_version').get();
        currentVersion = row?.version || 0;
    }

    log.info(`[OFFLINE-DB] Current schema version: ${currentVersion}, Target: ${SCHEMA_VERSION}`);

    // Apply migrations
    if (currentVersion < 1) {
        applyMigrationV1(database);
    }

    // Add future migrations here:
    // if (currentVersion < 2) { applyMigrationV2(database); }
}

/**
 * Migration V1: Initial schema
 */
function applyMigrationV1(database) {
    log.info('[OFFLINE-DB] Applying migration V1...');

    database.exec(`
        -- Offline order queue
        CREATE TABLE IF NOT EXISTS offline_orders (
            id TEXT PRIMARY KEY,
            idempotency_key TEXT UNIQUE NOT NULL,
            local_id TEXT NOT NULL,
            server_id TEXT,
            order_data TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            synced_at TEXT
        );

        -- Print job queue
        CREATE TABLE IF NOT EXISTS print_queue (
            id TEXT PRIMARY KEY,
            order_id TEXT,
            job_type TEXT NOT NULL,
            print_data TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            printer_name TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            printed_at TEXT
        );

        -- Indexes for common queries
        CREATE INDEX IF NOT EXISTS idx_offline_orders_status ON offline_orders(status);
        CREATE INDEX IF NOT EXISTS idx_offline_orders_idempotency ON offline_orders(idempotency_key);
        CREATE INDEX IF NOT EXISTS idx_print_queue_status ON print_queue(status);
        CREATE INDEX IF NOT EXISTS idx_print_queue_order ON print_queue(order_id);

        -- Record migration
        INSERT INTO schema_version (version) VALUES (1);
    `);

    log.info('[OFFLINE-DB] Migration V1 applied successfully');
}

/**
 * Close the database connection
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        log.info('[OFFLINE-DB] Database closed');
    }
}

/**
 * Get database instance (must be initialized first)
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

// ============================================================================
// OFFLINE ORDER QUEUE OPERATIONS
// ============================================================================

/**
 * Enqueue an order for offline sync
 */
function offlineOrderEnqueue(order) {
    const database = getDatabase();

    const stmt = database.prepare(`
        INSERT INTO offline_orders (id, idempotency_key, local_id, order_data, status)
        VALUES (?, ?, ?, ?, 'pending')
        ON CONFLICT(idempotency_key) DO UPDATE SET
            order_data = excluded.order_data,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `);

    const result = stmt.get(
        order.id,
        order.idempotency_key,
        order.local_id,
        JSON.stringify(order.order_data)
    );

    log.info(`[OFFLINE-DB] Order enqueued: ${order.id} (idempotency: ${order.idempotency_key})`);
    return result;
}

/**
 * List orders by status
 */
function offlineOrderList(status) {
    const database = getDatabase();

    if (status) {
        const stmt = database.prepare('SELECT * FROM offline_orders WHERE status = ? ORDER BY created_at ASC');
        return stmt.all(status);
    } else {
        const stmt = database.prepare('SELECT * FROM offline_orders ORDER BY created_at ASC');
        return stmt.all();
    }
}

/**
 * Mark order as synced with server ID
 */
function offlineOrderMarkSynced(id, serverId) {
    const database = getDatabase();

    const stmt = database.prepare(`
        UPDATE offline_orders
        SET status = 'synced',
            server_id = ?,
            synced_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(serverId, id);
    log.info(`[OFFLINE-DB] Order marked synced: ${id} -> ${serverId}`);
}

/**
 * Mark order as failed with error message
 */
function offlineOrderMarkFailed(id, error) {
    const database = getDatabase();

    const stmt = database.prepare(`
        UPDATE offline_orders
        SET status = 'failed',
            error_message = ?,
            retry_count = retry_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(error, id);
    log.info(`[OFFLINE-DB] Order marked failed: ${id} - ${error}`);
}

/**
 * Mark order as syncing (in progress)
 */
function offlineOrderMarkSyncing(id) {
    const database = getDatabase();

    const stmt = database.prepare(`
        UPDATE offline_orders
        SET status = 'syncing',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(id);
}

/**
 * Get statistics about the offline order queue
 */
function offlineOrderGetStats() {
    const database = getDatabase();

    const stats = database.prepare(`
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'syncing' THEN 1 ELSE 0 END) as syncing,
            SUM(CASE WHEN status = 'synced' THEN 1 ELSE 0 END) as synced,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM offline_orders
    `).get();

    const oldest = database.prepare(`
        SELECT created_at FROM offline_orders
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
    `).get();

    return {
        ...stats,
        oldest_pending: oldest?.created_at || null
    };
}

/**
 * Delete synced orders older than specified days
 */
function offlineOrderCleanup(daysOld = 7) {
    const database = getDatabase();

    const stmt = database.prepare(`
        DELETE FROM offline_orders
        WHERE status = 'synced'
        AND synced_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysOld);
    log.info(`[OFFLINE-DB] Cleaned up ${result.changes} synced orders older than ${daysOld} days`);
    return result.changes;
}

/**
 * Delete an offline order by ID
 */
function offlineOrderDelete(id) {
    const database = getDatabase();

    const stmt = database.prepare('DELETE FROM offline_orders WHERE id = ?');
    const result = stmt.run(id);
    log.info(`[OFFLINE-DB] Order deleted: ${id}`);
    return result.changes > 0;
}

// ============================================================================
// PRINT QUEUE OPERATIONS
// ============================================================================

/**
 * Enqueue a print job
 */
function printQueueEnqueue(job) {
    const database = getDatabase();

    const stmt = database.prepare(`
        INSERT INTO print_queue (id, order_id, job_type, print_data, printer_name, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
        RETURNING *
    `);

    const result = stmt.get(
        job.id,
        job.order_id || null,
        job.job_type,
        JSON.stringify(job.print_data),
        job.printer_name || null
    );

    log.info(`[OFFLINE-DB] Print job enqueued: ${job.id} (type: ${job.job_type})`);
    return result;
}

/**
 * List print jobs by status
 */
function printQueueList(status) {
    const database = getDatabase();

    if (status) {
        const stmt = database.prepare('SELECT * FROM print_queue WHERE status = ? ORDER BY created_at ASC');
        return stmt.all(status);
    } else {
        const stmt = database.prepare('SELECT * FROM print_queue ORDER BY created_at ASC');
        return stmt.all();
    }
}

/**
 * Mark print job as printed
 */
function printQueueMarkPrinted(id) {
    const database = getDatabase();

    const stmt = database.prepare(`
        UPDATE print_queue
        SET status = 'printed',
            printed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(id);
    log.info(`[OFFLINE-DB] Print job marked printed: ${id}`);
}

/**
 * Mark print job as failed
 */
function printQueueMarkFailed(id, error) {
    const database = getDatabase();

    const stmt = database.prepare(`
        UPDATE print_queue
        SET status = 'failed',
            error_message = ?,
            retry_count = retry_count + 1
        WHERE id = ?
    `);

    stmt.run(error, id);
    log.info(`[OFFLINE-DB] Print job marked failed: ${id} - ${error}`);
}

/**
 * Retry a failed print job (reset to pending)
 */
function printQueueRetry(id) {
    const database = getDatabase();

    const stmt = database.prepare(`
        UPDATE print_queue
        SET status = 'pending',
            error_message = NULL
        WHERE id = ?
    `);

    stmt.run(id);
    log.info(`[OFFLINE-DB] Print job retry queued: ${id}`);
}

/**
 * Get pending print jobs for processing
 */
function printQueueGetPending() {
    const database = getDatabase();

    const stmt = database.prepare(`
        SELECT * FROM print_queue
        WHERE status = 'pending'
        ORDER BY created_at ASC
    `);

    return stmt.all();
}

/**
 * Mark print job as printing (in progress)
 */
function printQueueMarkPrinting(id) {
    const database = getDatabase();

    const stmt = database.prepare(`
        UPDATE print_queue
        SET status = 'printing'
        WHERE id = ?
    `);

    stmt.run(id);
}

/**
 * Get print queue statistics
 */
function printQueueGetStats() {
    const database = getDatabase();

    const stats = database.prepare(`
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'printing' THEN 1 ELSE 0 END) as printing,
            SUM(CASE WHEN status = 'printed' THEN 1 ELSE 0 END) as printed,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM print_queue
    `).get();

    return stats;
}

/**
 * Delete printed jobs older than specified days
 */
function printQueueCleanup(daysOld = 3) {
    const database = getDatabase();

    const stmt = database.prepare(`
        DELETE FROM print_queue
        WHERE status = 'printed'
        AND printed_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysOld);
    log.info(`[OFFLINE-DB] Cleaned up ${result.changes} printed jobs older than ${daysOld} days`);
    return result.changes;
}

/**
 * Delete a print job by ID
 */
function printQueueDelete(id) {
    const database = getDatabase();

    const stmt = database.prepare('DELETE FROM print_queue WHERE id = ?');
    const result = stmt.run(id);
    log.info(`[OFFLINE-DB] Print job deleted: ${id}`);
    return result.changes > 0;
}

// Export all functions
module.exports = {
    // Database lifecycle
    initDatabase,
    closeDatabase,
    getDatabase,

    // Offline Order Queue
    offlineOrderEnqueue,
    offlineOrderList,
    offlineOrderMarkSynced,
    offlineOrderMarkFailed,
    offlineOrderMarkSyncing,
    offlineOrderGetStats,
    offlineOrderCleanup,
    offlineOrderDelete,

    // Print Queue
    printQueueEnqueue,
    printQueueList,
    printQueueMarkPrinted,
    printQueueMarkFailed,
    printQueueRetry,
    printQueueGetPending,
    printQueueMarkPrinting,
    printQueueGetStats,
    printQueueCleanup,
    printQueueDelete
};
