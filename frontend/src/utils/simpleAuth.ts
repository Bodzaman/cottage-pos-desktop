/**
 * Simple Auth Hook Stub
 * Provides a compatibility layer for authentication
 */

interface SimpleAuthUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface SimpleAuthReturn {
  user: SimpleAuthUser | null;
  isAuthenticated: boolean;
}

/**
 * Simple auth hook that returns current user info
 * This is a compatibility stub - use usePOSAuth for full auth functionality
 */
export function useSimpleAuth(): SimpleAuthReturn {
  // Return a default user for now - should be connected to actual auth state
  return {
    user: null,
    isAuthenticated: false
  };
}
