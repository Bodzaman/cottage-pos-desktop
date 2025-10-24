import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImageIcon,
  Bot,
  Cog,
  ChefHat,
} from "lucide-react";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Lazy load heavy tab components for better initial load performance
const AdminPortalMenuContent = lazy(() => import("../components/AdminPortalMenuContent"));
const AdminPortalMedia = lazy(() => import("../components/AdminPortalMedia"));
const AIStaffManagementHub = lazy(() => import("../pages/AIStaffManagementHub"));
const RestaurantSettingsManager = lazy(() => import("../components/RestaurantSettingsManager"));

// Define the tab types
type TabType = "menu" | "media" | "ai-management" | "settings";

// Loading fallback component
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
    <span className="ml-3 text-purple-300">Loading...</span>
  </div>
);

interface AdminTabsContentProps {
  /** Optional default tab - if not provided, will try to read from URL query params */
  defaultTab?: TabType;
  /** Whether to sync active tab with URL query params (default: true for standalone page, false for side panel) */
  syncWithUrl?: boolean;
}

/**
 * AdminTabsContent - Reusable admin tab interface
 * 
 * This component is the single source of truth for the admin UI.
 * It's used by both:
 * - /admin page (with ProtectedRoute wrapper)
 * - AdminSidePanel (rendered directly without ProtectedRoute)
 * 
 * Any changes to this component automatically appear in both places.
 */
export function AdminTabsContent({ defaultTab = "menu", syncWithUrl = true }: AdminTabsContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Read initial tab from URL query params if syncWithUrl is enabled
  const getInitialTab = (): TabType => {
    if (!syncWithUrl) return defaultTab;
    
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabType;
    return tabParam && ['menu', 'media', 'ai-management', 'settings'].includes(tabParam) 
      ? tabParam 
      : defaultTab;
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  // Persist active tab to URL query params (only if syncWithUrl is enabled)
  useEffect(() => {
    if (!syncWithUrl) return;
    
    const params = new URLSearchParams(location.search);
    params.set('tab', activeTab);
    navigate(`?${params.toString()}`, { replace: true });
  }, [activeTab, navigate, location.search, syncWithUrl]);

  // Memoized handler for better performance
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-black/40 border border-purple-600/30">
        <TabsTrigger 
          value="menu" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
        >
          <ChefHat className="h-4 w-4 mr-2" />
          Menu
        </TabsTrigger>
        <TabsTrigger 
          value="media" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Media
        </TabsTrigger>
        <TabsTrigger 
          value="ai-management" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
        >
          <Bot className="h-4 w-4 mr-2" />
          AI Staff
        </TabsTrigger>
        <TabsTrigger 
          value="settings" 
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
        >
          <Cog className="h-4 w-4 mr-2" />
          Settings
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="menu" className="space-y-6">
        <ErrorBoundary fallbackMessage="Failed to load menu management. Please refresh the page.">
          <Suspense fallback={<TabLoadingFallback />}>
            <AdminPortalMenuContent />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>
      
      <TabsContent value="media" className="space-y-6">
        <ErrorBoundary fallbackMessage="Failed to load media library. Please refresh the page.">
          <Suspense fallback={<TabLoadingFallback />}>
            <AdminPortalMedia />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>
      
      <TabsContent value="ai-management" className="space-y-6">
        <ErrorBoundary fallbackMessage="Failed to load AI staff management. Please refresh the page.">
          <Suspense fallback={<TabLoadingFallback />}>
            <AIStaffManagementHub />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-6">
        <ErrorBoundary fallbackMessage="Failed to load settings. Please refresh the page.">
          <Suspense fallback={<TabLoadingFallback />}>
            <RestaurantSettingsManager />
          </Suspense>
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
}
