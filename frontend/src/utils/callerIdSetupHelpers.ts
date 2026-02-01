/**
 * Caller ID Setup Helpers
 * Utilities for the Caller ID phone setup wizard
 */

// API base path (uses Vite proxy in dev)
const API_BASE = '/routes/callerid';

// =============================================================================
// Types
// =============================================================================

export interface CallerIdDevice {
  id: string;
  mac_address: string;
  device_name: string;
  ip_address?: string;
  is_active: boolean;
  last_seen_at?: string;
  test_status: 'pending' | 'success' | 'failed';
  setup_completed: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CallerIdConfig {
  secret_configured: boolean;
  backend_url: string;
  incoming_url: string;
  answered_url: string;
  terminated_url: string;
}

// =============================================================================
// MAC Address Utilities
// =============================================================================

/**
 * Format MAC address for display (AA:BB:CC:DD:EE:FF)
 */
export function formatMacAddress(mac: string): string {
  const normalized = normalizeMacAddress(mac);
  if (normalized.length !== 12) return mac;

  return normalized.match(/.{2}/g)?.join(':') || mac;
}

/**
 * Normalize MAC address to uppercase without separators
 */
export function normalizeMacAddress(mac: string): string {
  if (!mac) return '';
  return mac.toUpperCase().replace(/[:\-\.]/g, '');
}

/**
 * Validate MAC address format
 */
export function isValidMacAddress(mac: string): boolean {
  const normalized = normalizeMacAddress(mac);
  return /^[0-9A-F]{12}$/.test(normalized);
}

/**
 * Format MAC address as user types (auto-insert colons)
 */
export function formatMacAddressInput(value: string): string {
  // Remove all non-hex characters
  const hex = value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();

  // Insert colons every 2 characters
  const parts: string[] = [];
  for (let i = 0; i < hex.length && i < 12; i += 2) {
    parts.push(hex.slice(i, i + 2));
  }

  return parts.join(':');
}

// =============================================================================
// API Helpers
// =============================================================================

/**
 * Fetch all registered devices
 */
export async function fetchDevices(): Promise<CallerIdDevice[]> {
  try {
    const response = await fetch(`${API_BASE}/devices`);
    const data = await response.json();
    return data.success ? (data.devices || []) : [];
  } catch (error) {
    console.error('[CallerID] Failed to fetch devices:', error);
    return [];
  }
}

/**
 * Add a new device
 */
export async function addDevice(
  deviceName: string,
  macAddress: string,
  ipAddress?: string
): Promise<{ success: boolean; deviceId?: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_name: deviceName,
        mac_address: normalizeMacAddress(macAddress),
        ip_address: ipAddress || null
      })
    });
    const data = await response.json();
    return {
      success: data.success,
      deviceId: data.device_id,
      message: data.message
    };
  } catch (error) {
    console.error('[CallerID] Failed to add device:', error);
    return {
      success: false,
      message: 'Failed to add device. Please try again.'
    };
  }
}

/**
 * Remove a device
 */
export async function removeDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/devices/${deviceId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('[CallerID] Failed to remove device:', error);
    return {
      success: false,
      message: 'Failed to remove device. Please try again.'
    };
  }
}

/**
 * Get bridge configuration (URLs, token status)
 */
export async function fetchConfig(): Promise<CallerIdConfig | null> {
  try {
    const response = await fetch(`${API_BASE}/config`);
    return await response.json();
  } catch (error) {
    console.error('[CallerID] Failed to fetch config:', error);
    return null;
  }
}

/**
 * Simulate a test call
 */
export async function simulateTestCall(
  phoneNumber: string = '07700900123',
  deviceMac?: string
): Promise<{ success: boolean; eventId?: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phoneNumber,
        device_mac: deviceMac || null
      })
    });
    const data = await response.json();
    return {
      success: data.success,
      eventId: data.event_id,
      message: data.message
    };
  } catch (error) {
    console.error('[CallerID] Failed to simulate test call:', error);
    return {
      success: false,
      message: 'Failed to simulate test call. Please try again.'
    };
  }
}

// =============================================================================
// Clipboard Helpers
// =============================================================================

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    return true;
  } catch (error) {
    console.error('[CallerID] Failed to copy to clipboard:', error);
    return false;
  }
}

// =============================================================================
// Device Status Helpers
// =============================================================================

/**
 * Get device status display info
 */
export function getDeviceStatusInfo(device: CallerIdDevice): {
  label: string;
  color: 'green' | 'amber' | 'red' | 'gray';
  icon: 'check' | 'clock' | 'alert' | 'offline';
} {
  if (!device.is_active) {
    return { label: 'Disabled', color: 'gray', icon: 'offline' };
  }

  if (device.test_status === 'success') {
    return { label: 'Connected', color: 'green', icon: 'check' };
  }

  if (device.test_status === 'failed') {
    return { label: 'Connection Failed', color: 'red', icon: 'alert' };
  }

  // Check if we've seen activity recently (last 24 hours)
  if (device.last_seen_at) {
    const lastSeen = new Date(device.last_seen_at);
    const hoursSince = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);

    if (hoursSince < 24) {
      return { label: 'Active', color: 'green', icon: 'check' };
    }
  }

  return { label: 'Pending Setup', color: 'amber', icon: 'clock' };
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString();
}
