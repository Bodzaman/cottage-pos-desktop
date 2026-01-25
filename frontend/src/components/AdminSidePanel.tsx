import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, Globe, ChefHat, ImageIcon, Bot, Printer, Cog } from 'lucide-react';
import { colors } from '../utils/InternalDesignSystem';
import { AdminAppTile } from './AdminAppTile';
import { ErrorBoundary } from './ErrorBoundary';
import { Separator } from '@/components/ui/separator';

// Lazy-load module components
const AdminPortalMenuContent = lazy(() => import('../components/AdminPortalMenuContent'));
const MediaLibraryContent = lazy(() => import('../components/MediaLibraryContent').then(m => ({ default: m.MediaLibraryContent })));
const AIStaffManagementHub = lazy(() => import('../pages/AIStaffManagementHub'));
const ThermalReceiptDesignerV2 = lazy(() => import('../pages/ThermalReceiptDesignerV2'));
const RestaurantSettingsManager = lazy(() => import('../components/RestaurantSettingsManager'));
const StaffManagement = lazy(() => import('../components/StaffManagement').then(m => ({ default: m.StaffManagement })));
const WebsiteCMSContent = lazy(() => import('../components/WebsiteCMSContent'));

type AppType = 'website' | 'menu' | 'media' | 'ai-management' | 'print-designs' | 'settings';

const VALID_APPS: string[] = ['website', 'menu', 'media', 'ai-management', 'print-designs', 'settings'];

const ADMIN_APPS = [
  { id: 'website', icon: Globe, label: 'Website', color: '#3B82F6' },
  { id: 'menu', icon: ChefHat, label: 'Menu', color: '#10B981' },
  { id: 'media', icon: ImageIcon, label: 'Media', color: '#F59E0B' },
  { id: 'ai-management', icon: Bot, label: 'AI Staff', color: '#8B5CF6' },
  { id: 'print-designs', icon: Printer, label: 'Print Studio', color: '#EC4899' },
  { id: 'settings', icon: Cog, label: 'Settings', color: '#6B7280' },
];

const APP_META: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  website: { label: 'Website', icon: Globe, color: '#3B82F6' },
  menu: { label: 'Menu', icon: ChefHat, color: '#10B981' },
  media: { label: 'Media', icon: ImageIcon, color: '#F59E0B' },
  'ai-management': { label: 'AI Staff', icon: Bot, color: '#8B5CF6' },
  'print-designs': { label: 'Print Studio', icon: Printer, color: '#EC4899' },
  settings: { label: 'Settings', icon: Cog, color: '#6B7280' },
};

// Animation variants
const launcherVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const moduleVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
};

function ModuleLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-48">
      <div
        className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2"
        style={{ borderColor: colors.purple.primary }}
      />
      <span className="ml-3 text-sm" style={{ color: colors.purple.light }}>Loading...</span>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface AdminSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export function AdminSidePanel({ isOpen, onClose, defaultTab = 'menu' }: AdminSidePanelProps) {
  // Compute initial app: "dashboard" or invalid → launcher (null); valid app → open directly
  const initialApp = VALID_APPS.includes(defaultTab) ? defaultTab : null;
  const [activeApp, setActiveApp] = useState<string | null>(initialApp);

  const greeting = useMemo(() => getGreeting(), []);
  const meta = activeApp ? APP_META[activeApp] : null;
  const IconComponent = meta?.icon || Cog;

  // Escape key: module → launcher; launcher → close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (activeApp) {
          setActiveApp(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, activeApp, onClose]);

  // Reset to initial state when panel closes and reopens
  useEffect(() => {
    if (isOpen) {
      setActiveApp(initialApp);
    }
  }, [isOpen, initialApp]);

  const handleOpenApp = useCallback((appId: string) => {
    setActiveApp(appId);
  }, []);

  const handleBackToLauncher = useCallback(() => {
    setActiveApp(null);
  }, []);

  // Render module content
  const moduleContent = useMemo(() => {
    switch (activeApp as AppType) {
      case 'website':
        return <WebsiteCMSContent />;
      case 'menu':
        return <AdminPortalMenuContent />;
      case 'media':
        return <MediaLibraryContent />;
      case 'ai-management':
        return <AIStaffManagementHub />;
      case 'print-designs':
        return <ThermalReceiptDesignerV2 />;
      case 'settings':
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
        animation: 'adminPanelFadeIn 250ms ease-out',
      }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 h-16 shrink-0"
        style={{
          backgroundColor: 'rgba(15, 15, 15, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(124, 58, 237, 0.15)',
        }}
      >
        {/* Left: Back/Title */}
        <div className="flex items-center gap-3">
          {activeApp ? (
            <>
              <button
                onClick={handleBackToLauncher}
                className="flex items-center gap-1.5 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors -ml-2"
                style={{ color: colors.purple.light }}
              >
                <ArrowLeft className="w-4 h-4" />
                Apps
              </button>
              <div className="w-px h-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg"
                  style={{ background: `linear-gradient(145deg, ${meta?.color || '#7C3AED'}CC, ${meta?.color || '#7C3AED'}88)` }}
                >
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                  {meta?.label || 'Admin'}
                </span>
              </div>
            </>
          ) : (
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Cottage Tandoori Admin
            </h2>
          )}
        </div>

        {/* Right: Close */}
        <button
          onClick={activeApp ? handleBackToLauncher : onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          style={{ color: colors.text.secondary }}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Content area */}
      <div className="h-[calc(100%-4rem)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {!activeApp ? (
            <motion.div
              key="launcher"
              variants={launcherVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center min-h-full px-6 py-12"
            >
              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-center mb-12"
              >
                <h1 className="text-2xl font-semibold mb-1" style={{ color: colors.text.primary }}>
                  {greeting}
                </h1>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Cottage Tandoori Admin
                </p>
              </motion.div>

              {/* App tile grid */}
              <div className="grid grid-cols-3 gap-8 w-full max-w-sm sm:max-w-md">
                {ADMIN_APPS.map((app, index) => (
                  <AdminAppTile
                    key={app.id}
                    id={app.id}
                    icon={app.icon}
                    label={app.label}
                    color={app.color}
                    onOpen={handleOpenApp}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`module-${activeApp}`}
              variants={moduleVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6"
            >
              <ErrorBoundary fallbackMessage={`Failed to load ${meta?.label || 'module'}. Please go back and try again.`}>
                <Suspense fallback={<ModuleLoadingFallback />}>
                  {moduleContent}
                </Suspense>
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Entry animation */}
      <style>{`
        @keyframes adminPanelFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
