import { useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, ChefHat, ImageIcon, Bot, Printer, Cog, ArrowLeft, Building2 } from "lucide-react";
import { colors } from "../utils/InternalDesignSystem";
import { AdminAppTile } from "./AdminAppTile";
import { Button } from "@/components/ui/button";

interface AdminAppLauncherProps {
  onOpenApp: (appId: string) => void;
  userEmail: string;
  onLogout: () => void;
  onBackToPOS?: () => void; // Optional - hidden for admin users
  isOnline?: boolean;
}

const ADMIN_APPS = [
  { id: "website", icon: Globe, label: "Website", color: "#3B82F6" },
  { id: "menu", icon: ChefHat, label: "Menu", color: "#10B981" },
  { id: "media", icon: ImageIcon, label: "Media", color: "#F59E0B" },
  { id: "ai-management", icon: Bot, label: "AI Staff", color: "#8B5CF6" },
  { id: "print-designs", icon: Printer, label: "Print Studio", color: "#EC4899" },
  { id: "settings", icon: Cog, label: "Settings", color: "#6B7280" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function AdminAppLauncher({ onOpenApp, userEmail, onLogout, onBackToPOS, isOnline = true }: AdminAppLauncherProps) {
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <div
      className="min-h-screen h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 30%, #1A1A1A 0%, #111111 35%, #0B0B0B 70%)',
      }}
    >
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.3) 100%)',
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center justify-between px-6 pt-5 pb-2"
          style={{ marginTop: !isOnline ? '40px' : '0' }} // Account for offline banner
        >
          {/* Back to POS button - only shown for staff users, hidden for admin users */}
          {onBackToPOS ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToPOS}
              className="text-sm gap-1.5 hover:bg-white/5"
              style={{ color: colors.text.secondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              POS
            </Button>
          ) : (
            <div /> // Empty placeholder to maintain layout
          )}

          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium"
              style={{ color: colors.text.secondary }}
            >
              {userEmail}
            </span>
            <span className="text-xs" style={{ color: colors.text.muted }}>
              &middot;
            </span>
            <button
              onClick={onLogout}
              className="text-xs hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
              style={{ color: colors.text.muted }}
            >
              Sign out
            </button>
          </div>
        </motion.header>

        {/* Centered content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-center mb-6"
          >
            <h1
              className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2"
              style={{ color: colors.text.primary }}
            >
              {greeting}
            </h1>
            <p
              className="text-sm sm:text-base font-light tracking-wide"
              style={{ color: colors.text.muted }}
            >
              Cottage Tandoori
            </p>
          </motion.div>

          {/* Context chips */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-8"
          >
            {/* Location chip */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: colors.text.secondary,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <Building2 className="w-3 h-3 opacity-70" />
              Cottage Tandoori (Storrington)
            </span>

            {/* Status chip */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: colors.text.secondary,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isOnline ? '#10B981' : '#EF4444' }}
                aria-label={isOnline ? "Status: Live" : "Status: Offline"}
              />
              {isOnline ? 'Live' : 'Offline'}
            </span>
          </motion.div>

          {/* App icon grid */}
          <div className="relative">
            {/* Grid bloom cloud */}
            <div
              className="absolute inset-0 pointer-events-none -z-10"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 75%)',
                filter: 'blur(50px)',
                transform: 'scale(1.5)',
              }}
            />
            <div className="grid grid-cols-3 gap-8 sm:gap-10 w-full max-w-md sm:max-w-lg">
              {ADMIN_APPS.map((app, index) => (
                <AdminAppTile
                  key={app.id}
                  id={app.id}
                  icon={app.icon}
                  label={app.label}
                  color={app.color}
                  onOpen={onOpenApp}
                  index={index}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Footer branding */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex flex-col items-center pb-6 pt-4"
        >
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            Powered by
          </span>
          <span
            className="text-xs font-medium mt-0.5"
            style={{ color: 'rgba(255, 255, 255, 0.35)' }}
          >
            QuickServe AI
          </span>
          <span
            className="text-[9px] mt-1"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            &bull; Version x.x &bull; Support
          </span>
        </motion.footer>
      </div>
    </div>
  );
}
