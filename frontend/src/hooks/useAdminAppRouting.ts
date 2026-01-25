import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePOSAuth } from "utils/usePOSAuth";
import { useOnlineStatus } from "./useOnlineStatus";

// Valid app module IDs that open in the App Shell
const VALID_APPS = ["website", "menu", "media", "ai-management", "print-designs", "settings"];

/**
 * Manages admin app launcher routing, legacy ?tab= compatibility, and auth.
 *
 * URL mapping:
 *   ?tab= absent       → launcher
 *   ?tab=launcher      → launcher
 *   ?tab=dashboard     → launcher (legacy compat)
 *   ?tab=<valid-app>   → that module in App Shell
 */
export function useAdminAppRouting() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout: posLogout } = usePOSAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnline = useOnlineStatus();

  const tabParam = searchParams.get("tab");

  // Legacy ?tab= compatibility: "dashboard" and "launcher" map to the launcher view
  const isLauncherView = !tabParam || tabParam === "launcher" || tabParam === "dashboard" || !VALID_APPS.includes(tabParam);
  const activeApp = isLauncherView ? null : tabParam;

  // Check if user is admin
  const isAdminUser = user?.role === 'admin';

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/pos-login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const openApp = useCallback((appId: string) => {
    setSearchParams({ tab: appId });
  }, [setSearchParams]);

  const backToLauncher = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // backToPOS is only available for staff users accessing admin via management header
  // Admin users should NOT have access to POS
  const backToPOS = useCallback(() => {
    if (!isAdminUser) {
      navigate("/pos-desktop");
    }
  }, [navigate, isAdminUser]);

  const logout = useCallback(() => {
    posLogout();
    navigate("/pos-login");
  }, [posLogout, navigate]);

  return {
    user: isLoading || !isAuthenticated ? null : user,
    activeApp,
    isLauncherView,
    isOnline,
    isAdminUser,
    openApp,
    backToLauncher,
    backToPOS,
    logout,
  };
}
