import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePOSAuth } from "utils/usePOSAuth";
import { gridBackgroundStyle } from "../utils/designSystem";
import { useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Settings, Search, ChefHat, Clock, Package, Users, BarChart3, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { toast } from 'sonner';
import { supabase } from 'utils/supabaseClient';
import { apiClient } from 'app';

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
      console.log('[Admin] User not authenticated, redirecting to /pos-login');
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #2a1a3a 100%)' }}>
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
