import { lazy, Suspense, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, ChefHat, ImageIcon, Bot, Printer, Cog, LogOut, WifiOff } from "lucide-react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { colors } from "../utils/InternalDesignSystem";

// Lazy load module components (same chunks as AdminTabsContent)
const MenuManagementLanding = lazy(() => import("../components/menu/MenuManagementLanding"));
const MediaLibraryContent = lazy(() => import("../components/MediaLibraryContent").then(m => ({ default: m.MediaLibraryContent })));
const AIStaffManagementHub = lazy(() => import("../pages/AIStaffManagementHub"));
const ThermalReceiptDesignerV2 = lazy(() => import("../pages/ThermalReceiptDesignerV2"));
const RestaurantSettingsManager = lazy(() => import("../components/RestaurantSettingsManager"));
const StaffManagement = lazy(() => import("../components/StaffManagement").then(m => ({ default: m.StaffManagement })));
const WebsiteCMSContent = lazy(() => import("../components/WebsiteCMSContent"));

type AppType = "website" | "menu" | "media" | "ai-management" | "print-designs" | "settings";

interface AppMeta {
  label: string;
  icon: typeof Globe;
  color: string;
}

const APP_META: Record<AppType, AppMeta> = {
  website: { label: "Website", icon: Globe, color: "#3B82F6" },
  menu: { label: "Menu", icon: ChefHat, color: "#10B981" },
  media: { label: "Media", icon: ImageIcon, color: "#F59E0B" },
  "ai-management": { label: "AI Staff", icon: Bot, color: "#8B5CF6" },
  "print-designs": { label: "Print Studio", icon: Printer, color: "#EC4899" },
  settings: { label: "Settings", icon: Cog, color: "#6B7280" },
};

// Loading spinner
function ModuleLoadingFallback() {
  return (
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
}

interface AdminAppShellProps {
  activeApp: string;
  onBack: () => void;
  userEmail: string;
  onLogout: () => void;
  onBackToPOS?: () => void; // Optional - hidden for admin users
  isOnline?: boolean;
}

export function AdminAppShell({ activeApp, onBack, userEmail, onLogout, onBackToPOS, isOnline = true }: AdminAppShellProps) {
  const meta = APP_META[activeApp as AppType];
  const IconComponent = meta?.icon || Cog;

  // Escape key returns to launcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  // Update document title
  useEffect(() => {
    document.title = `${meta?.label || "Admin"} | Cottage Tandoori Admin`;
    return () => { document.title = "Cottage Tandoori Admin"; };
  }, [meta?.label]);

  // Render the active module
  const moduleContent = useMemo(() => {
    switch (activeApp as AppType) {
      case "website":
        return <WebsiteCMSContent />;
      case "menu":
        return <MenuManagementLanding />;
      case "media":
        return <MediaLibraryContent />;
      case "ai-management":
        return <AIStaffManagementHub />;
      case "print-designs":
        return <ThermalReceiptDesignerV2 />;
      case "settings":
        return (
          <>
            <StaffManagement />
            <Separator className="my-8" style={{ backgroundColor: colors.border.accent }} />
            <RestaurantSettingsManager />
          </>
        );
      default:
        return null;
    }
  }, [activeApp]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* App Shell Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 h-16 shrink-0"
        style={{
          backgroundColor: "rgba(15, 15, 15, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(124, 58, 237, 0.15)",
        }}
      >
        {/* Left: Back + App identity */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-sm gap-1.5 hover:bg-white/5 -ml-2"
            style={{ color: colors.purple.light }}
          >
            <ArrowLeft className="w-4 h-4" />
            Apps
          </Button>

          <div
            className="w-px h-5"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          />

          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${meta?.color || "#7C3AED"}22 0%, ${meta?.color || "#7C3AED"}44 100%)`,
              }}
            >
              <IconComponent className="w-4 h-4" style={{ color: meta?.color || "#7C3AED" }} />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: colors.text.primary }}
            >
              {meta?.label || "Admin"}
            </span>
          </div>
        </div>

        {/* Right: User controls */}
        <div className="flex items-center gap-2">
          {/* Offline indicator */}
          {!isOnline && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
              }}
            >
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
          <span
            className="text-xs hidden sm:inline mr-1"
            style={{ color: colors.text.muted }}
          >
            {userEmail}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-xs gap-1.5 hover:bg-white/5"
            style={{ color: colors.text.muted }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      {/* Module content */}
      <main className="flex-1 overflow-y-auto">
        <div className={activeApp === 'website' ? 'p-6' : 'p-6 max-w-[1600px] mx-auto'}>
          <ErrorBoundary fallbackMessage={`Failed to load ${meta?.label || "module"}. Please go back and try again.`}>
            <Suspense fallback={<ModuleLoadingFallback />}>
              {moduleContent}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
