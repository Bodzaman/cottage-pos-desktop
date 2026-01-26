import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePOSAuth } from "utils/usePOSAuth";
import { useOnlineStatus } from "./useOnlineStatus";

/**
 * CRM View Types
 * - directory: Customer search/list (default view)
 * - profile: Single customer 360° view (requires ?id=)
 * - link-queue: Identity link review queue (admin only)
 */
export type CRMView = "directory" | "profile" | "link-queue";

const VALID_VIEWS: CRMView[] = ["directory", "profile", "link-queue"];

/**
 * Manages CRM SPA internal routing via URL search params.
 *
 * URL mapping:
 *   /crm                        → directory view
 *   /crm?view=directory         → directory view
 *   /crm?view=profile&id=xxx    → customer profile view
 *   /crm?view=link-queue        → identity link queue
 */
export function useCRMRouting() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout: posLogout } = usePOSAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnline = useOnlineStatus();

  // Parse current view from URL
  const viewParam = searchParams.get("view") as CRMView | null;
  const customerId = searchParams.get("id");
  const searchQuery = searchParams.get("q");

  // Determine active view (default to directory)
  const activeView: CRMView = viewParam && VALID_VIEWS.includes(viewParam)
    ? viewParam
    : "directory";

  // Check user roles
  const isAdminUser = user?.role === "admin";
  const isStaffUser = user?.role === "staff" || user?.role === "admin";

  // Auth guard - redirect to login if not authenticated or not staff
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/pos-login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Navigation functions
  const goToDirectory = useCallback((query?: string) => {
    const params: Record<string, string> = { view: "directory" };
    if (query) params.q = query;
    setSearchParams(params);
  }, [setSearchParams]);

  const goToProfile = useCallback((id: string) => {
    setSearchParams({ view: "profile", id });
  }, [setSearchParams]);

  const goToLinkQueue = useCallback(() => {
    setSearchParams({ view: "link-queue" });
  }, [setSearchParams]);

  // Update search query without changing view
  const updateSearchQuery = useCallback((query: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set("q", query);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Back to POS
  const backToPOS = useCallback(() => {
    navigate("/pos-desktop");
  }, [navigate]);

  // Back to Admin
  const backToAdmin = useCallback(() => {
    navigate("/admin");
  }, [navigate]);

  // Logout
  const logout = useCallback(() => {
    posLogout();
    navigate("/pos-login");
  }, [posLogout, navigate]);

  return {
    // User state
    user: isLoading || !isAuthenticated ? null : user,
    isLoading,
    isOnline,
    isAdminUser,
    isStaffUser,

    // View state
    activeView,
    customerId,
    searchQuery,

    // Navigation
    goToDirectory,
    goToProfile,
    goToLinkQueue,
    updateSearchQuery,
    backToPOS,
    backToAdmin,
    logout,
  };
}
