import React, { useState, useEffect, useCallback, lazy, Suspense, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  ImageIcon,
  Bot,
  Cog,
  ChefHat,
  LayoutDashboard,
  Printer,
} from "lucide-react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Separator } from '@/components/ui/separator';
import { colors } from "../utils/InternalDesignSystem";

// Animation variants for smooth tab transitions
const tabContentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const tabTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1], // Smooth easeInOut
};

// Lazy load heavy tab components for better initial load performance
const AdminDashboardContent = lazy(() => import("../components/AdminDashboardContent"));
const AdminPortalMenuContent = lazy(() => import("../components/AdminPortalMenuContent"));
const MediaLibraryContent = lazy(() => import("../components/MediaLibraryContent").then(module => ({ default: module.MediaLibraryContent })));
const AIStaffManagementHub = lazy(() => import("../pages/AIStaffManagementHub"));
const ThermalReceiptDesignerV2 = lazy(() => import("../pages/ThermalReceiptDesignerV2"));
const RestaurantSettingsManager = lazy(() => import("../components/RestaurantSettingsManager"));
const StaffManagement = lazy(() => import("../components/StaffManagement").then(module => ({ default: module.StaffManagement })));

// Define the tab types
type TabType = "dashboard" | "menu" | "media" | "ai-management" | "print-designs" | "settings";

// Tab display names for document title and announcements
const TAB_LABELS: Record<TabType, string> = {
  "dashboard": "Dashboard",
  "menu": "Menu Management",
  "media": "Media Library",
  "ai-management": "AI Staff Management",
  "print-designs": "Print Designs Studio",
  "settings": "Restaurant Settings"
};

// Loading fallback component - using design system colors with fade-in animation
const TabLoadingFallback = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15 }}
    className="flex items-center justify-center h-64"
  >
    <div
      className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
      style={{ borderColor: colors.purple.primary }}
    />
    <span className="ml-3" style={{ color: colors.purple.light }}>Loading...</span>
  </motion.div>
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
  const printDesignsContentRef = useRef<HTMLDivElement>(null);
  const settingsContentRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  // Read initial tab from URL query params if syncWithUrl is enabled
  const getInitialTab = (): TabType => {
    if (!syncWithUrl) return defaultTab;
    
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabType;
    return tabParam && ['dashboard', 'menu', 'media', 'ai-management', 'print-designs', 'settings'].includes(tabParam)
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
      "print-designs": printDesignsContentRef,
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

  // Keyboard shortcuts: Alt+1 through Alt+6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const tabs: TabType[] = ['dashboard', 'menu', 'media', 'ai-management', 'print-designs', 'settings'];
        const key = e.key;

        // Map Alt+1 to Alt+6 to tabs
        if (key >= '1' && key <= '6') {
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
          <TabsList
            className="grid w-full grid-cols-3 md:grid-cols-6"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.6)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.border.accent}`,
            }}
          >
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] text-[rgba(255,255,255,0.87)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
              title="Dashboard (Alt+1)"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="text-xs ml-1 opacity-50">Alt+1</span>
            </TabsTrigger>
            <TabsTrigger
              value="menu"
              className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] text-[rgba(255,255,255,0.87)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
              title="Menu Management (Alt+2)"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Menu</span>
              <span className="text-xs ml-1 opacity-50">Alt+2</span>
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] text-[rgba(255,255,255,0.87)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
              title="Media Library (Alt+3)"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Media</span>
              <span className="text-xs ml-1 opacity-50">Alt+3</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai-management"
              className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] text-[rgba(255,255,255,0.87)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
              title="AI Staff Management (Alt+4)"
            >
              <Bot className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">AI Staff</span>
              <span className="text-xs ml-1 opacity-50">Alt+4</span>
            </TabsTrigger>
            <TabsTrigger
              value="print-designs"
              className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] text-[rgba(255,255,255,0.87)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
              title="Print Designs Studio (Alt+5)"
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Print Designs</span>
              <span className="text-xs ml-1 opacity-50">Alt+5</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-[#7C3AED] data-[state=active]:text-white data-[state=active]:shadow-[0_0_16px_rgba(124,58,237,0.4)] text-[rgba(255,255,255,0.87)] transition-all duration-200 hover:bg-[rgba(124,58,237,0.15)]"
              title="Restaurant Settings (Alt+6)"
            >
              <Cog className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
              <span className="text-xs ml-1 opacity-50">Alt+6</span>
            </TabsTrigger>
          </TabsList>
        </nav>

        {/* Visual connector between tabs and content */}
        <div
          className="h-6"
          style={{
            background: `linear-gradient(to bottom, rgba(124, 58, 237, 0.05), transparent)`,
          }}
        />
        
        {/* Tab content sections with semantic HTML, ARIA, and smooth transitions */}
        <section aria-labelledby="dashboard-tab">
          <TabsContent
            value="dashboard"
            className="space-y-6"
            ref={dashboardContentRef}
            tabIndex={-1}
          >
            <motion.div
              key="dashboard-content"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              transition={tabTransition}
            >
              <ErrorBoundary fallbackMessage="Failed to load dashboard. Please refresh the page.">
                <Suspense fallback={<TabLoadingFallback />}>
                  <AdminDashboardContent onTabChange={handleTabChange} />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </TabsContent>
        </section>

        <section aria-labelledby="menu-tab">
          <TabsContent
            value="menu"
            className="space-y-6"
            ref={menuContentRef}
            tabIndex={-1}
          >
            <motion.div
              key="menu-content"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              transition={tabTransition}
            >
              <ErrorBoundary fallbackMessage="Failed to load menu management. Please refresh the page.">
                <Suspense fallback={<TabLoadingFallback />}>
                  <AdminPortalMenuContent />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </TabsContent>
        </section>

        <section aria-labelledby="media-tab">
          <TabsContent
            value="media"
            className="space-y-6"
            ref={mediaContentRef}
            tabIndex={-1}
          >
            <motion.div
              key="media-content"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              transition={tabTransition}
            >
              <ErrorBoundary fallbackMessage="Failed to load media library. Please refresh the page.">
                <Suspense fallback={<TabLoadingFallback />}>
                  <MediaLibraryContent />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </TabsContent>
        </section>

        <section aria-labelledby="ai-management-tab">
          <TabsContent
            value="ai-management"
            className="space-y-6"
            ref={aiContentRef}
            tabIndex={-1}
          >
            <motion.div
              key="ai-content"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              transition={tabTransition}
            >
              <ErrorBoundary fallbackMessage="Failed to load AI staff management. Please refresh the page.">
                <Suspense fallback={<TabLoadingFallback />}>
                  <AIStaffManagementHub />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </TabsContent>
        </section>

        <section aria-labelledby="print-designs-tab">
          <TabsContent
            value="print-designs"
            className="space-y-6"
            ref={printDesignsContentRef}
            tabIndex={-1}
          >
            <motion.div
              key="print-designs-content"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              transition={tabTransition}
            >
              <ErrorBoundary fallbackMessage="Failed to load print designs studio. Please refresh the page.">
                <Suspense fallback={<TabLoadingFallback />}>
                  <ThermalReceiptDesignerV2 />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </TabsContent>
        </section>

        <section aria-labelledby="settings-tab">
          <TabsContent
            value="settings"
            className="space-y-6"
            ref={settingsContentRef}
            tabIndex={-1}
          >
            <motion.div
              key="settings-content"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              transition={tabTransition}
            >
              <ErrorBoundary fallbackMessage="Failed to load settings. Please refresh the page.">
                <Suspense fallback={<TabLoadingFallback />}>
                  {/* Staff Management Section */}
                  <StaffManagement />

                  <Separator className="my-8" style={{ backgroundColor: colors.border.accent }} />

                  {/* Restaurant Settings Section */}
                  <RestaurantSettingsManager />
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          </TabsContent>
        </section>
      </Tabs>
    </>
  );
}
