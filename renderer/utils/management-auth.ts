import { toast } from "sonner";
import { apiClient } from "app";

/**
 * Authentication status response from management password verification
 */
export interface AuthStatus {
  authenticated: boolean;
  isDefaultPassword?: boolean;
  timestamp: number;
}

/**
 * Constants for management authentication
 */
const STORAGE_KEY = "management_authenticated";
const AUTH_TIME_KEY = "management_auth_time";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Save management authentication status to session storage
 */
export const saveAuthStatus = (authenticated: boolean) => {
  if (authenticated) {
    // Store authentication status in session storage
    sessionStorage.setItem(STORAGE_KEY, "true");
    // Store authentication timestamp (for session expiry)
    sessionStorage.setItem(AUTH_TIME_KEY, Date.now().toString());
  } else {
    // Clear authentication data
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TIME_KEY);
  }
};

/**
 * Check if management authentication is valid
 * @returns {boolean} True if authenticated and not expired
 */
export const isManagementAuthenticated = (): boolean => {
  try {
    const authenticated = sessionStorage.getItem(STORAGE_KEY) === "true";
    
    if (!authenticated) return false;
    
    // Check if the session has expired
    const authTime = sessionStorage.getItem(AUTH_TIME_KEY);
    if (!authTime) return false;
    
    const authTimestamp = parseInt(authTime, 10);
    const now = Date.now();
    
    // Session expired if more than SESSION_TIMEOUT_MS has passed
    if (now - authTimestamp > SESSION_TIMEOUT_MS) {
      // Clear expired session
      saveAuthStatus(false);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking management authentication:", error);
    return false;
  }
};

/**
 * Verify management password against the backend API
 * @param password The password to verify
 * @returns Promise resolving to authentication status
 */
export const verifyManagementPassword = async (password: string): Promise<AuthStatus> => {
  try {
    const response = await apiClient.verify_password({ password });
    const data = await response.json();
    
    if (data.authenticated) {
      // Save authentication status
      saveAuthStatus(true);
      return { 
        authenticated: true, 
        isDefaultPassword: data.is_default_password || false,
        timestamp: Date.now() 
      };
    } else {
      return { 
        authenticated: false, 
        isDefaultPassword: false,
        timestamp: 0 
      };
    }
  } catch (error) {
    console.error("Authentication error:", error);
    toast.error("Authentication failed", {
      description: "Please try again later"
    });
    return { 
      authenticated: false, 
      isDefaultPassword: false,
      timestamp: 0 
    };
  }
};

/**
 * Clear management authentication session
 */
export const clearManagementAuth = () => {
  saveAuthStatus(false);
  toast.info("Logged out of management access");
};

/**
 * Update the auth timestamp to extend the session
 */
export const refreshAuthSession = () => {
  if (isManagementAuthenticated()) {
    sessionStorage.setItem(AUTH_TIME_KEY, Date.now().toString());
  }
};
