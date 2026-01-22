/**
 * Session Manager - Anonymous Session ID Management
 * 
 * Generates and persists a unique session_id for every visitor (guest or authenticated).
 * This enables:
 * - Guest users to use AI cart functions
 * - Cart recovery ("You left items in your cart")
 * - Analytics on guest behavior
 * - Seamless cart migration on login
 * 
 * Pattern: Industry-standard e-commerce (Amazon, Shopify, etc.)
 */

const SESSION_ID_KEY = 'cart_session_id';
const isDev = import.meta.env.DEV;

/**
 * Generate a new UUID v4 session ID
 */
function generateSessionId(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback to custom UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create session ID from localStorage
 * - Returns existing session_id if found
 * - Generates new UUID if not found
 * - Persists to localStorage
 */
export function getOrCreateSessionId(): string {
  try {
    // Check if session_id exists in localStorage
    const existingSessionId = localStorage.getItem(SESSION_ID_KEY);
    
    if (existingSessionId) {
      return existingSessionId;
    }
    
    // Generate new session_id
    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, newSessionId);
    
    return newSessionId;
    
  } catch (error) {
    console.error(' Session Manager: Failed to access localStorage:', error);
    
    // Fallback: Generate session_id without persistence (in-memory only)
    const fallbackSessionId = generateSessionId();
    return fallbackSessionId;
  }
}

/**
 * Clear current session ID (used on explicit logout)
 * - Removes session_id from localStorage
 * - Forces new session_id on next access
 */
export function clearSessionId(): void {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.error(' Session Manager: Failed to clear session_id:', error);
  }
}

/**
 * Get current session ID without creating a new one
 * - Returns existing session_id or null
 * - Does NOT generate new session_id if missing
 */
export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_ID_KEY);
  } catch (error) {
    console.error(' Session Manager: Failed to get session_id:', error);
    return null;
  }
}

/**
 * Replace current session ID with a new one
 * - Used after successful cart migration on login
 * - Generates fresh session_id for next guest session
 */
export function regenerateSessionId(): string {
  try {
    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, newSessionId);
    
    return newSessionId;
    
  } catch (error) {
    console.error(' Session Manager: Failed to regenerate session_id:', error);
    return generateSessionId(); // Fallback to in-memory only
  }
}
