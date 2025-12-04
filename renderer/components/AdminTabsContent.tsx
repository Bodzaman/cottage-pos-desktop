import React, { useState, useEffect, useCallback, lazy, Suspense, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImageIcon,
  Bot,
  Cog,
  ChefHat,
  LayoutDashboard,
} from "lucide-react";
import { ErrorBoundary } from "../components/ErrorBoundary";

// Lazy load heavy tab components for better initial load performance
const AdminDashboardContent = lazy(() => import("../components/AdminDashboardContent"));
const AdminPortalMenuContent = lazy(() => import("../components/AdminPortalMenuContent"));
const MediaLibraryContent = lazy(() => import("../components/MediaLibraryContent").then(module => ({ default: module.MediaLibraryContent })));
const AIStaffManagementHub = lazy(() => import("../pages/AIStaffManagementHub"));
const RestaurantSettingsManager = lazy(() => import("../components/RestaurantSettingsManager"));

// Define the tab types
type TabType = "dashboard" | "menu" | "media" | "ai-management" | "settings";

// Tab display names for document title and announcements
const TAB_LABELS: Record<TabType, string> = {
  "dashboard": "Dashboard",
  "menu": "Menu Management",
  "media": "Media Library",
  "ai-management": "AI Staff Management",
  "settings": "Restaurant Settings"
};

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
export function AdminTabsContent({ defaultTab = "dashboard", syncWithUrl = true }: AdminTabsContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for focus management
  const dashboardContentRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const mediaContentRef = useRef<HTMLDivElement>(null);
  const aiContentRef = useRef<HTMLDivElement>(null);
  const settingsContentRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  // Read initial tab from URL query params if syncWithUrl is enabled
  const getInitialTab = (): TabType => {
    if (!syncWithUrl) return defaultTab;
    
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabType;
    return tabParam && ['dashboard', 'menu', 'media', 'ai-management', 'settings'].includes(tabParam) 
      ? tabParam 
      : defaultTab;
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  // Update document title based on active tab
  useEffect(() => {
    const tabLabel = TAB_LABELS[activeTab];
    document.title = `${tabLabel} | Admin Portal | Cottage Tandoori POS`;
    
    // Announce tab change to screen readers
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `Now viewing: ${tabLabel} section`;
    }
    
    // Move focus to content area for keyboard navigation
    const contentRefs: Record<TabType, React.RefObject<HTMLDivElement>> = {
      dashboard: dashboardContentRef,
      menu: menuContentRef,
      media: mediaContentRef,
      "ai-management": aiContentRef,
      settings: settingsContentRef
    };
    
    const targetRef = contentRefs[activeTab];
    if (targetRef?.current) {
      // Small delay to allow content to render
      setTimeout(() => {
        targetRef.current?.focus();
      }, 100);
    }
  }, [activeTab]);

  // Persist active tab to URL query params (only if syncWithUrl is enabled)
  useEffect(() => {
    if (!syncWithUrl) return;
    
    const params = new URLSearchParams(location.search);
    params.set('tab', activeTab);
    navigate(`?${params.toString()}`, { replace: true });
  }, [activeTab, navigate, location.search, syncWithUrl]);

  // Keyboard shortcuts: Alt+1 through Alt+5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const tabs: TabType[] = ['dashboard', 'menu', 'media', 'ai-management', 'settings'];
        const key = e.key;
        
        // Map Alt+1 to Alt+5 to tabs
        if (key >= '1' && key <= '5') {
          e.preventDefault();
          const index = parseInt(key) - 1;
          setActiveTab(tabs[index]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Memoized handler for better performance
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType);
  }, []);

  return (
    <>
      {/* Live region for screen reader announcements (WCAG 4.1.3) */}
      <div 
        ref={liveRegionRef}
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Navigation landmark for tab list (WCAG 2.4.1) */}
        <nav role="navigation" aria-label="Dashboard tabs">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 bg-black/40 border border-purple-600/30">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
              title="Dashboard (Alt+1)"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="text-xs ml-1 opacity-50">Alt+1</span>
            </TabsTrigger>
            <TabsTrigger 
              value="menu" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
              title="Menu Management (Alt+2)"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Menu</span>
              <span className="text-xs ml-1 opacity-50">Alt+2</span>
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
              title="Media Library (Alt+3)"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Media</span>
              <span className="text-xs ml-1 opacity-50">Alt+3</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai-management" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
              title="AI Staff Management (Alt+4)"
            >
              <Bot className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">AI Staff</span>
              <span className="text-xs ml-1 opacity-50">Alt+4</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300"
              title="Restaurant Settings (Alt+5)"
            >
              <Cog className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
              <span className="text-xs ml-1 opacity-50">Alt+5</span>
            </TabsTrigger>
          </TabsList>
        </nav>
        
        {/* Tab content sections with semantic HTML and ARIA */}
        <section aria-labelledby="dashboard-tab">
          <TabsContent 
            value="dashboard" 
            className="space-y-6" 
            ref={dashboardContentRef} 
            tabIndex={-1}
          >
            <ErrorBoundary fallbackMessage="Failed to load dashboard. Please refresh the page.">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminDashboardContent onTabChange={handleTabChange} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </section>
        
        <section aria-labelledby="menu-tab">
          <TabsContent 
            value="menu" 
            className="space-y-6" 
            ref={menuContentRef} 
            tabIndex={-1}
          >
            <ErrorBoundary fallbackMessage="Failed to load menu management. Please refresh the page.">
              <Suspense fallback={<TabLoadingFallback />}>
                <AdminPortalMenuContent />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </section>
        
        <section aria-labelledby="media-tab">
          <TabsContent 
            value="media" 
            className="space-y-6" 
            ref={mediaContentRef} 
            tabIndex={-1}
          >
            <ErrorBoundary fallbackMessage="Failed to load media library. Please refresh the page.">
              <Suspense fallback={<TabLoadingFallback />}>
                <MediaLibraryContent />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </section>
        
        <section aria-labelledby="ai-management-tab">
          <TabsContent 
            value="ai-management" 
            className="space-y-6" 
            ref={aiContentRef} 
            tabIndex={-1}
          >
            <ErrorBoundary fallbackMessage="Failed to load AI staff management. Please refresh the page.">
              <Suspense fallback={<TabLoadingFallback />}>
                <AIStaffManagementHub />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </section>
        
        <section aria-labelledby="settings-tab">
          <TabsContent 
            value="settings" 
            className="space-y-6" 
            ref={settingsContentRef} 
            tabIndex={-1}
          >
            <ErrorBoundary fallbackMessage="Failed to load settings. Please refresh the page.">
              <Suspense fallback={<TabLoadingFallback />}>
                <RestaurantSettingsManager />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </section>
      </Tabs>
    </>
  );
}
