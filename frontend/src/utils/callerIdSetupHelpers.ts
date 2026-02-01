/**
 * Caller ID Setup Helpers
 * Utilities for the Caller ID phone setup wizard
 *
 * Architecture:
 * - In Electron: Uses direct Supabase queries (no backend needed for setup)
 * - In Web dev: Uses relative paths (Vite proxies /routes/* to localhost:8000)
 * - In Web production: Uses Databutton backend
 */

import { supabase } from './supabaseClient';

// Detect Electron environment
const isElectron = typeof window !== 'undefined' &&
  (window as any).electronAPI !== undefined;

// API base path for non-Electron environments
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
// Supabase Direct Implementations (for Electron)
// =============================================================================

async function supabaseFetchDevices(): Promise<CallerIdDevice[]> {
  const { data, error } = await supabase
    .from('callerid_allowed_devices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CallerID] Supabase fetch devices error:', error);
    return [];
  }

  // Map database fields to CallerIdDevice interface
  return (data || []).map(d => ({
    id: d.id,
    mac_address: d.mac_address,
    device_name: d.device_name || 'Unknown Device',
    ip_address: d.ip_address,
    is_active: d.is_active ?? true,
    last_seen_at: d.last_seen_at,
    test_status: d.test_status || 'pending',
    setup_completed: d.setup_completed ?? false,
    created_at: d.created_at,
    updated_at: d.updated_at
  }));
}

async function supabaseAddDevice(
  deviceName: string,
  macAddress: string,
  ipAddress?: string
): Promise<{ success: boolean; deviceId?: string; message: string }> {
  const normalizedMac = normalizeMacAddress(macAddress);

  // Check if device already exists
  const { data: existing } = await supabase
    .from('callerid_allowed_devices')
    .select('id')
    .eq('mac_address', normalizedMac)
    .single();

  if (existing) {
    return {
      success: false,
      message: 'A device with this MAC address already exists.'
    };
  }

  const { data, error } = await supabase
    .from('callerid_allowed_devices')
    .insert({
      mac_address: normalizedMac,
      device_name: deviceName,
      ip_address: ipAddress || null,
      is_active: true,
      test_status: 'pending',
      setup_completed: false
    })
    .select('id')
    .single();

  if (error) {
    console.error('[CallerID] Supabase add device error:', error);
    return {
      success: false,
      message: 'Failed to add device. Please try again.'
    };
  }

  return {
    success: true,
    deviceId: data.id,
    message: 'Device added successfully.'
  };
}

async function supabaseRemoveDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('callerid_allowed_devices')
    .delete()
    .eq('id', deviceId);

  if (error) {
    console.error('[CallerID] Supabase remove device error:', error);
    return {
      success: false,
      message: 'Failed to remove device. Please try again.'
    };
  }

  return {
    success: true,
    message: 'Device removed successfully.'
  };
}

function supabaseGetConfig(): CallerIdConfig {
  // In Electron, generate URLs pointing to a local backend
  // The user will need to run the backend locally for the phone to connect
  const backendUrl = 'http://YOUR_BACKEND_IP:8000';
  const secret = 'YOUR_SECRET_TOKEN';

  return {
    secret_configured: false,
    backend_url: backendUrl,
    incoming_url: `${backendUrl}/routes/callerid/incoming?remote=$remote&call_id=$call_id&mac=$mac&token=${secret}`,
    answered_url: `${backendUrl}/routes/callerid/answered?call_id=$call_id&mac=$mac&token=${secret}`,
    terminated_url: `${backendUrl}/routes/callerid/terminated?call_id=$call_id&mac=$mac&token=${secret}`
  };
}

async function supabaseSimulateTestCall(
  phoneNumber: string = '07700900123',
  deviceMac?: string
): Promise<{ success: boolean; eventId?: string; message: string }> {
  // Create a test event directly in the caller_id_events table
  const callId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Normalize phone number (simple normalization for test)
  const phoneE164 = phoneNumber.startsWith('+') ? phoneNumber :
    phoneNumber.startsWith('0') ? `+44${phoneNumber.substring(1)}` : `+44${phoneNumber}`;

  const ttlExpires = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  const { data, error } = await supabase
    .from('caller_id_events')
    .insert({
      call_id: callId,
      phone_raw: phoneNumber,
      phone_e164: phoneE164,
      call_status: 'incoming',
      mac_address: deviceMac ? normalizeMacAddress(deviceMac) : null,
      ttl_expires_at: ttlExpires,
      dismissed_by: []
    })
    .select('id')
    .single();

  if (error) {
    console.error('[CallerID] Supabase simulate test call error:', error);
    return {
      success: false,
      message: 'Failed to simulate test call. Please try again.'
    };
  }

  // Update device test status
  if (deviceMac) {
    await supabase
      .from('callerid_allowed_devices')
      .update({
        test_status: 'success',
        last_seen_at: new Date().toISOString()
      })
      .eq('mac_address', normalizeMacAddress(deviceMac));
  }

  return {
    success: true,
    eventId: data.id,
    message: 'Test call simulated successfully! Check your POS for the popup.'
  };
}

// =============================================================================
// API Helpers (with Electron Supabase fallback)
// =============================================================================

/**
 * Fetch all registered devices
 */
export async function fetchDevices(): Promise<CallerIdDevice[]> {
  // In Electron, use direct Supabase
  if (isElectron) {
    return supabaseFetchDevices();
  }

  // In web, use API
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
  // In Electron, use direct Supabase
  if (isElectron) {
    return supabaseAddDevice(deviceName, macAddress, ipAddress);
  }

  // In web, use API
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
  // In Electron, use direct Supabase
  if (isElectron) {
    return supabaseRemoveDevice(deviceId);
  }

  // In web, use API
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
  // In Electron, return local config
  if (isElectron) {
    return supabaseGetConfig();
  }

  // In web, use API
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
  // In Electron, use direct Supabase
  if (isElectron) {
    return supabaseSimulateTestCall(phoneNumber, deviceMac);
  }

  // In web, use API
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
