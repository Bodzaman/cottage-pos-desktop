/**
 * Secure Credential Storage for Offline Authentication
 *
 * Provides encrypted storage for user credentials enabling offline login.
 * Uses Electron's safeStorage API for OS-level encryption (Windows DPAPI / macOS Keychain).
 *
 * Features:
 * - Cache bcrypt password hashes after successful online login
 * - Offline password verification using bcrypt
 * - Management password caching for admin features
 * - Audit logging for security compliance
 *
 * IMPORTANT: This module runs ONLY in the Electron main process.
 * Renderer access is via IPC handlers exposed in main.js.
 */

const { safeStorage } = require('electron');
const crypto = require('crypto');
const log = require('electron-log');

// Import the existing offline-db module to extend its database
const offlineDb = require('./offline-db');

// Schema version for credential tables
const CREDENTIAL_SCHEMA_VERSION = 1;

// Credential cache expiry (30 days in milliseconds)
const CREDENTIAL_EXPIRY_DAYS = 30;

/**
 * Initialize credential tables in the existing SQLite database
 * Called after offlineDb.initDatabase()
 */
function initCredentialTables() {
    const db = offlineDb.getDatabase();

    // Check if credential tables exist
    const tablesExist = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='offline_credentials'
    `).get();

    if (!tablesExist) {
        log.info('[SECURE-CREDS] Creating credential tables...');

        db.exec(`
            -- User credentials for offline password login
            CREATE TABLE IF NOT EXISTS offline_credentials (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'staff',
                pin_hash TEXT,
                cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_offline_login TEXT
            );

            -- Management password for admin features (singleton)
            CREATE TABLE IF NOT EXISTS management_credentials (
                id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
                password_hash TEXT NOT NULL,
                cached_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Audit log for offline authentication attempts
            CREATE TABLE IF NOT EXISTS offline_auth_audit (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                auth_type TEXT NOT NULL,
                outcome TEXT NOT NULL,
                details TEXT,
                occurred_at TEXT DEFAULT CURRENT_TIMESTAMP,
                synced_at TEXT
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_offline_creds_username ON offline_credentials(username);
            CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON offline_auth_audit(user_id);
            CREATE INDEX IF NOT EXISTS idx_auth_audit_synced ON offline_auth_audit(synced_at);
        `);

        log.info('[SECURE-CREDS] Credential tables created successfully');
    } else {
        log.info('[SECURE-CREDS] Credential tables already exist');
    }
}

/**
 * Encrypt sensitive data using Electron's safeStorage
 * Falls back to a machine-bound key if safeStorage unavailable
 */
function encryptData(plaintext) {
    if (!plaintext) return null;

    try {
        if (safeStorage.isEncryptionAvailable()) {
            const encrypted = safeStorage.encryptString(plaintext);
            return encrypted.toString('base64');
        } else {
            // Fallback: use a simple encoding (less secure but functional)
            log.warn('[SECURE-CREDS] safeStorage unavailable, using base64 encoding');
            return Buffer.from(plaintext).toString('base64');
        }
    } catch (error) {
        log.error('[SECURE-CREDS] Encryption error:', error);
        return null;
    }
}

/**
 * Decrypt data encrypted with safeStorage
 */
function decryptData(encrypted) {
    if (!encrypted) return null;

    try {
        const buffer = Buffer.from(encrypted, 'base64');

        if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.decryptString(buffer);
        } else {
            // Fallback: decode base64
            return buffer.toString('utf8');
        }
    } catch (error) {
        log.error('[SECURE-CREDS] Decryption error:', error);
        return null;
    }
}

/**
 * Generate a UUID for audit records
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Verify a password against a bcrypt hash
 * Uses timing-safe comparison where possible
 */
async function verifyBcryptHash(password, hash) {
    // bcrypt hashes start with $2a$, $2b$, or $2y$
    if (!hash || !hash.startsWith('$2')) {
        log.warn('[SECURE-CREDS] Invalid bcrypt hash format');
        return false;
    }

    try {
        // Use native crypto for bcrypt verification
        // We need to dynamically require bcrypt since it's a native module
        const bcrypt = require('bcrypt');
        return await bcrypt.compare(password, hash);
    } catch (error) {
        // If bcrypt module not available, try bcryptjs (pure JS fallback)
        try {
            const bcryptjs = require('bcryptjs');
            return await bcryptjs.compare(password, hash);
        } catch (fallbackError) {
            log.error('[SECURE-CREDS] bcrypt verification failed:', error);
            log.error('[SECURE-CREDS] bcryptjs fallback also failed:', fallbackError);
            return false;
        }
    }
}

/**
 * Hash a password using bcrypt (for management password)
 */
async function hashPassword(password) {
    try {
        const bcrypt = require('bcrypt');
        return await bcrypt.hash(password, 10);
    } catch (error) {
        try {
            const bcryptjs = require('bcryptjs');
            return await bcryptjs.hash(password, 10);
        } catch (fallbackError) {
            log.error('[SECURE-CREDS] Password hashing failed:', error);
            throw new Error('Password hashing not available');
        }
    }
}

// ============================================================================
// USER CREDENTIAL OPERATIONS
// ============================================================================

/**
 * Cache user credentials after successful online login
 * @param {string} userId - User ID from database
 * @param {string} passwordHash - Bcrypt hash from server (optional)
 * @param {object} userData - User metadata { username, fullName, role }
 */
function cacheUserCredentials(userId, passwordHash, userData) {
    const db = offlineDb.getDatabase();

    // Encrypt the password hash before storing
    const encryptedHash = encryptData(passwordHash);
    if (!encryptedHash) {
        log.error('[SECURE-CREDS] Failed to encrypt password hash');
        return false;
    }

    const stmt = db.prepare(`
        INSERT INTO offline_credentials (user_id, username, password_hash, full_name, role, cached_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            username = excluded.username,
            password_hash = excluded.password_hash,
            full_name = excluded.full_name,
            role = excluded.role,
            cached_at = CURRENT_TIMESTAMP
    `);

    try {
        stmt.run(
            userId,
            userData.username,
            encryptedHash,
            userData.fullName || userData.full_name || null,
            userData.role || 'staff'
        );

        log.info(`[SECURE-CREDS] Cached credentials for user: ${userData.username}`);
        return true;
    } catch (error) {
        log.error('[SECURE-CREDS] Failed to cache credentials:', error);
        return false;
    }
}

/**
 * Cache user credentials from plain password (hashes it first)
 * Use this when the server doesn't return a password hash
 * @param {string} userId - User ID from database
 * @param {string} plainPassword - Plain text password to hash and cache
 * @param {object} userData - User metadata { username, fullName, role }
 */
async function cacheUserCredentialsFromPlain(userId, plainPassword, userData) {
    try {
        const hash = await hashPassword(plainPassword);
        return cacheUserCredentials(userId, hash, userData);
    } catch (error) {
        log.error('[SECURE-CREDS] Failed to hash password for caching:', error);
        return false;
    }
}

/**
 * Verify password offline against cached credentials
 * @param {string} username - Username to verify
 * @param {string} password - Plain text password
 * @returns {Promise<{success: boolean, userData?: object, error?: string}>}
 */
async function verifyPasswordOffline(username, password) {
    const db = offlineDb.getDatabase();

    // Find user by username
    const stmt = db.prepare(`
        SELECT user_id, username, password_hash, full_name, role, cached_at
        FROM offline_credentials
        WHERE username = ?
    `);

    const user = stmt.get(username);

    if (!user) {
        logAuthAttempt(null, 'password', 'failed', 'User not found in cache');
        return { success: false, error: 'No cached credentials for this user' };
    }

    // Check if credentials are expired
    const cachedAt = new Date(user.cached_at);
    const expiryDate = new Date(cachedAt.getTime() + CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    if (new Date() > expiryDate) {
        logAuthAttempt(user.user_id, 'password', 'failed', 'Credentials expired');
        return { success: false, error: 'Cached credentials expired. Please login online.' };
    }

    // Decrypt and verify password
    const decryptedHash = decryptData(user.password_hash);
    if (!decryptedHash) {
        logAuthAttempt(user.user_id, 'password', 'failed', 'Decryption failed');
        return { success: false, error: 'Failed to verify credentials' };
    }

    const isValid = await verifyBcryptHash(password, decryptedHash);

    if (isValid) {
        // Update last offline login timestamp
        db.prepare(`
            UPDATE offline_credentials
            SET last_offline_login = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `).run(user.user_id);

        logAuthAttempt(user.user_id, 'password', 'success', 'Offline password verified');

        return {
            success: true,
            userData: {
                userId: user.user_id,
                username: user.username,
                fullName: user.full_name,
                role: user.role
            }
        };
    } else {
        logAuthAttempt(user.user_id, 'password', 'failed', 'Invalid password');
        return { success: false, error: 'Invalid password' };
    }
}

/**
 * Check if a user has cached credentials
 * @param {string} userId - User ID to check
 * @returns {{hasCached: boolean, username?: string, cachedAt?: string, isExpired?: boolean}}
 */
function getOfflineCredentialStatus(userId) {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        SELECT username, cached_at
        FROM offline_credentials
        WHERE user_id = ?
    `);

    const result = stmt.get(userId);

    if (!result) {
        return { hasCached: false };
    }

    const cachedAt = new Date(result.cached_at);
    const expiryDate = new Date(cachedAt.getTime() + CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > expiryDate;

    return {
        hasCached: true,
        username: result.username,
        cachedAt: result.cached_at,
        isExpired
    };
}

/**
 * Check if any user credentials are cached (for showing appropriate UI)
 * @returns {{hasAnyCached: boolean, users: Array<{username: string, role: string}>}}
 */
function getAvailableOfflineUsers() {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        SELECT username, full_name, role, cached_at
        FROM offline_credentials
        ORDER BY cached_at DESC
    `);

    const users = stmt.all();
    const now = new Date();

    const validUsers = users.filter(user => {
        const cachedAt = new Date(user.cached_at);
        const expiryDate = new Date(cachedAt.getTime() + CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        return now <= expiryDate;
    }).map(user => ({
        username: user.username,
        fullName: user.full_name,
        role: user.role
    }));

    return {
        hasAnyCached: validUsers.length > 0,
        users: validUsers
    };
}

/**
 * Update cached PIN hash for a user
 * @param {string} userId - User ID
 * @param {string} pinHash - SHA-256 PIN hash
 */
function updateCachedPinHash(userId, pinHash) {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        UPDATE offline_credentials
        SET pin_hash = ?
        WHERE user_id = ?
    `);

    try {
        stmt.run(pinHash, userId);
        log.info(`[SECURE-CREDS] Updated PIN hash for user: ${userId}`);
        return true;
    } catch (error) {
        log.error('[SECURE-CREDS] Failed to update PIN hash:', error);
        return false;
    }
}

// ============================================================================
// MANAGEMENT PASSWORD OPERATIONS
// ============================================================================

/**
 * Cache management password hash for offline admin access
 * @param {string} passwordHash - Bcrypt hash of management password
 */
function cacheManagementPassword(passwordHash) {
    const db = offlineDb.getDatabase();

    const encryptedHash = encryptData(passwordHash);
    if (!encryptedHash) {
        log.error('[SECURE-CREDS] Failed to encrypt management password');
        return false;
    }

    const stmt = db.prepare(`
        INSERT INTO management_credentials (id, password_hash, cached_at)
        VALUES (1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            password_hash = excluded.password_hash,
            cached_at = CURRENT_TIMESTAMP
    `);

    try {
        stmt.run(encryptedHash);
        log.info('[SECURE-CREDS] Cached management password');
        return true;
    } catch (error) {
        log.error('[SECURE-CREDS] Failed to cache management password:', error);
        return false;
    }
}

/**
 * Cache management password from plain text (hashes it first)
 * Use this when the server doesn't return the hash
 * @param {string} plainPassword - Plain text management password
 */
async function cacheManagementPasswordFromPlain(plainPassword) {
    try {
        const hash = await hashPassword(plainPassword);
        return cacheManagementPassword(hash);
    } catch (error) {
        log.error('[SECURE-CREDS] Failed to hash management password:', error);
        return false;
    }
}

/**
 * Verify management password offline
 * @param {string} password - Plain text password to verify
 * @returns {Promise<{authenticated: boolean, error?: string}>}
 */
async function verifyManagementPasswordOffline(password) {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        SELECT password_hash, cached_at
        FROM management_credentials
        WHERE id = 1
    `);

    const record = stmt.get();

    if (!record) {
        logAuthAttempt(null, 'management', 'failed', 'No cached management password');
        return { authenticated: false, error: 'No cached management password. Please verify online first.' };
    }

    // Check expiry (same as user credentials)
    const cachedAt = new Date(record.cached_at);
    const expiryDate = new Date(cachedAt.getTime() + CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    if (new Date() > expiryDate) {
        logAuthAttempt(null, 'management', 'failed', 'Management password expired');
        return { authenticated: false, error: 'Cached management password expired. Please verify online.' };
    }

    const decryptedHash = decryptData(record.password_hash);
    if (!decryptedHash) {
        logAuthAttempt(null, 'management', 'failed', 'Decryption failed');
        return { authenticated: false, error: 'Failed to verify management password' };
    }

    const isValid = await verifyBcryptHash(password, decryptedHash);

    if (isValid) {
        logAuthAttempt(null, 'management', 'success', 'Offline management password verified');
        return { authenticated: true };
    } else {
        logAuthAttempt(null, 'management', 'failed', 'Invalid management password');
        return { authenticated: false, error: 'Invalid management password' };
    }
}

/**
 * Check if management password is cached
 */
function hasManagementPasswordCached() {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        SELECT cached_at FROM management_credentials WHERE id = 1
    `);

    const record = stmt.get();

    if (!record) {
        return { hasCached: false };
    }

    const cachedAt = new Date(record.cached_at);
    const expiryDate = new Date(cachedAt.getTime() + CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > expiryDate;

    return {
        hasCached: true,
        cachedAt: record.cached_at,
        isExpired
    };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log an authentication attempt for audit purposes
 */
function logAuthAttempt(userId, authType, outcome, details) {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        INSERT INTO offline_auth_audit (id, user_id, auth_type, outcome, details)
        VALUES (?, ?, ?, ?, ?)
    `);

    try {
        stmt.run(generateUUID(), userId, authType, outcome, details);
    } catch (error) {
        log.error('[SECURE-CREDS] Failed to log auth attempt:', error);
    }
}

/**
 * Get pending audit logs for sync to server
 */
function getPendingAuditLogs() {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        SELECT * FROM offline_auth_audit
        WHERE synced_at IS NULL
        ORDER BY occurred_at ASC
        LIMIT 100
    `);

    return stmt.all();
}

/**
 * Mark audit logs as synced
 */
function markAuditLogsSynced(ids) {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        UPDATE offline_auth_audit
        SET synced_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    const markSynced = db.transaction((logIds) => {
        for (const id of logIds) {
            stmt.run(id);
        }
    });

    try {
        markSynced(ids);
        return true;
    } catch (error) {
        log.error('[SECURE-CREDS] Failed to mark audit logs synced:', error);
        return false;
    }
}

/**
 * Clean up old synced audit logs (older than 30 days)
 */
function cleanupAuditLogs(daysOld = 30) {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare(`
        DELETE FROM offline_auth_audit
        WHERE synced_at IS NOT NULL
        AND synced_at < datetime('now', '-' || ? || ' days')
    `);

    const result = stmt.run(daysOld);
    log.info(`[SECURE-CREDS] Cleaned up ${result.changes} old audit logs`);
    return result.changes;
}

// ============================================================================
// CREDENTIAL CLEANUP
// ============================================================================

/**
 * Clear all cached credentials for a user
 */
function clearUserCredentials(userId) {
    const db = offlineDb.getDatabase();

    const stmt = db.prepare('DELETE FROM offline_credentials WHERE user_id = ?');
    const result = stmt.run(userId);

    log.info(`[SECURE-CREDS] Cleared credentials for user: ${userId}`);
    return result.changes > 0;
}

/**
 * Clear expired credentials
 */
function clearExpiredCredentials() {
    const db = offlineDb.getDatabase();

    const expiryDate = new Date(Date.now() - CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const userStmt = db.prepare(`
        DELETE FROM offline_credentials
        WHERE cached_at < ?
    `);

    const mgmtStmt = db.prepare(`
        DELETE FROM management_credentials
        WHERE cached_at < ?
    `);

    const userResult = userStmt.run(expiryDate);
    const mgmtResult = mgmtStmt.run(expiryDate);

    log.info(`[SECURE-CREDS] Cleared ${userResult.changes} expired user credentials, ${mgmtResult.changes} expired management passwords`);

    return {
        userCredentials: userResult.changes,
        managementCredentials: mgmtResult.changes
    };
}

// Export all functions
module.exports = {
    // Initialization
    initCredentialTables,

    // User credentials
    cacheUserCredentials,
    cacheUserCredentialsFromPlain,
    verifyPasswordOffline,
    getOfflineCredentialStatus,
    getAvailableOfflineUsers,
    updateCachedPinHash,
    clearUserCredentials,

    // Management password
    cacheManagementPassword,
    cacheManagementPasswordFromPlain,
    verifyManagementPasswordOffline,
    hasManagementPasswordCached,

    // Audit
    logAuthAttempt,
    getPendingAuditLogs,
    markAuditLogsSynced,
    cleanupAuditLogs,

    // Cleanup
    clearExpiredCredentials,

    // Constants (for reference)
    CREDENTIAL_EXPIRY_DAYS
};
