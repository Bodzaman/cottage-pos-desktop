/**
 * POS Heartbeat Sender
 *
 * Sends periodic heartbeat signals to the backend to indicate POSDesktop is online.
 * This enables the customer website to block orders when the restaurant's POS is offline.
 *
 * Industry Standard: Toast, Square, Uber Eats use similar heartbeat patterns.
 *
 * Features:
 * - Sends heartbeat every 60 seconds when online
 * - Automatically pauses when offline
 * - Resumes immediately when back online
 * - Runs in both Electron and web browser (for dev/testing)
 */

import { getOfflineStatus, onOfflineStatusChange } from './serviceWorkerManager';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** How often to send heartbeat (in milliseconds) */
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds

/** Backend heartbeat endpoint */
const HEARTBEAT_ENDPOINT = '/routes/pos/heartbeat';

// ============================================================================
// STATE
// ============================================================================

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribeOffline: (() => void) | null = null;
let isRunning = false;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Send heartbeat to backend
 */
async function sendHeartbeat(): Promise<boolean> {
  try {
    // Don't send if offline
    if (getOfflineStatus()) {
      console.debug('[Heartbeat] Skipping - offline');
      return false;
    }

    const response = await fetch(HEARTBEAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.warn(`[Heartbeat] Failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.debug('[Heartbeat] Sent successfully:', data.last_heartbeat_at);
    return true;
  } catch (error) {
    // Network errors are expected when offline
    if (!getOfflineStatus()) {
      console.warn('[Heartbeat] Error:', error);
    }
    return false;
  }
}

/**
 * Start the heartbeat interval
 */
function startHeartbeatInterval() {
  // Clear any existing interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Send immediately on start
  sendHeartbeat();

  // Then send every HEARTBEAT_INTERVAL_MS
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  console.log('[Heartbeat] Started - sending every 60 seconds');
}

/**
 * Stop the heartbeat interval
 */
function stopHeartbeatInterval() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[Heartbeat] Paused - offline');
  }
}

/**
 * Handle offline status changes
 */
function handleOfflineChange(offline: boolean) {
  if (offline) {
    // Going offline - stop sending heartbeats
    stopHeartbeatInterval();
  } else {
    // Coming back online - resume heartbeats
    startHeartbeatInterval();
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Start the POS heartbeat service.
 *
 * Call this once when POSDesktop mounts.
 * The service will automatically:
 * - Send heartbeat every 60 seconds
 * - Pause when offline
 * - Resume when back online
 *
 * @returns Cleanup function to stop the service
 */
export function startPOSHeartbeat(): () => void {
  // Don't start twice
  if (isRunning) {
    console.warn('[Heartbeat] Already running');
    return stopPOSHeartbeat;
  }

  isRunning = true;
  console.log('[Heartbeat] Initializing POS heartbeat service');

  // Subscribe to offline status changes
  unsubscribeOffline = onOfflineStatusChange(handleOfflineChange);

  // Start sending heartbeats if currently online
  if (!getOfflineStatus()) {
    startHeartbeatInterval();
  } else {
    console.log('[Heartbeat] Starting paused - currently offline');
  }

  // Return cleanup function
  return stopPOSHeartbeat;
}

/**
 * Stop the POS heartbeat service.
 *
 * Call this when POSDesktop unmounts.
 */
export function stopPOSHeartbeat(): void {
  if (!isRunning) {
    return;
  }

  // Stop the interval
  stopHeartbeatInterval();

  // Unsubscribe from offline changes
  if (unsubscribeOffline) {
    unsubscribeOffline();
    unsubscribeOffline = null;
  }

  isRunning = false;
  console.log('[Heartbeat] Stopped');
}

/**
 * Check if heartbeat service is currently running
 */
export function isHeartbeatRunning(): boolean {
  return isRunning;
}

/**
 * Manually trigger a heartbeat (useful for testing)
 */
export async function triggerHeartbeat(): Promise<boolean> {
  return sendHeartbeat();
}
