import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { colors } from "../utils/InternalDesignSystem";
import { useAdminAppRouting } from "../hooks/useAdminAppRouting";
import { AdminAppLauncher } from "../components/AdminAppLauncher";
import { AdminAppShell } from "../components/AdminAppShell";

const launcherVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

const appShellVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

function Admin() {
  const { user, isLauncherView, activeApp, openApp, backToLauncher, backToPOS, logout, isOnline, isAdminUser } = useAdminAppRouting();

  // Page entrance animation state
  const [pageVisible, setPageVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setPageVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.99 }}
      animate={pageVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="min-h-screen" style={{ backgroundColor: colors.background.primary }}>
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <WifiOff className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              You're offline. Some features may be unavailable.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isLauncherView ? (
          <motion.div key="launcher" variants={launcherVariants} initial="initial" animate="animate" exit="exit">
            <AdminAppLauncher
              onOpenApp={openApp}
              userEmail={user.username}
              onLogout={logout}
              onBackToPOS={isAdminUser ? undefined : backToPOS}
              isOnline={isOnline}
            />
          </motion.div>
        ) : (
          <motion.div key={`app-${activeApp}`} variants={appShellVariants} initial="initial" animate="animate" exit="exit">
            <AdminAppShell
              activeApp={activeApp!}
              onBack={backToLauncher}
              userEmail={user.username}
              onLogout={logout}
              onBackToPOS={isAdminUser ? undefined : backToPOS}
              isOnline={isOnline}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default Admin;
