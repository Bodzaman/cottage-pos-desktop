import React, { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePOSAuth } from "utils/usePOSAuth";
import { colors } from "../utils/InternalDesignSystem";
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';

// Import static components
import AdminHeader from "../components/AdminHeader";
import { AdminTabsContent } from "../components/AdminTabsContent";

// Main Admin Component
function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = usePOSAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'menu';
  const selectedItemId = searchParams.get('item');
  const { 
    menuItems, 
    categories, 
    itemVariants,
    refreshData, 
    isLoading: menuLoading 
  } = useRealtimeMenuStore();

  // ============================================================================
  // AUTHENTICATION GUARD - PHASE 7
  // ============================================================================
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/pos-login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show nothing while checking authentication
  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  // Memoized handlers for better performance
  const handleBackToHome = useCallback(() => {
    navigate("/pos-desktop");
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/pos-login");
  }, [logout, navigate]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background.primary }}
    >
      <div className="container mx-auto p-6">
        {/* Header with semantic banner role */}
        <header role="banner">
          <AdminHeader
            userEmail={user.username}
            onBackToPOS={handleBackToHome}
            onLogout={handleLogout}
            showBackButton={true}
            isStandalone={true}
          />
        </header>

        {/* Main content with semantic main role */}
        <main role="main" aria-label="Admin Dashboard">
          {/* Main Tabs - single source of truth */}
          <AdminTabsContent syncWithUrl={true} />
        </main>
      </div>
    </div>
  );
}

export default Admin;
