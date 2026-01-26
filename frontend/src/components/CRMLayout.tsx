import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Link2,
  ArrowLeft,
  LogOut,
  WifiOff,
  ChevronRight,
  UserCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { colors, styles } from "../utils/InternalDesignSystem";
import { CRMView } from "../hooks/useCRMRouting";

interface NavItem {
  id: CRMView;
  label: string;
  icon: typeof Users;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "directory", label: "Customers", icon: Users },
  { id: "link-queue", label: "Identity Links", icon: Link2, adminOnly: true },
];

interface CRMLayoutProps {
  children: ReactNode;
  activeView: CRMView;
  customerId?: string | null;
  customerName?: string | null;
  isAdminUser: boolean;
  isOnline: boolean;
  userEmail?: string;
  isEmbedded?: boolean; // Hide footer elements when embedded in modal
  onNavigate: (view: CRMView) => void;
  onBackToPOS: () => void;
  onLogout: () => void;
}

export function CRMLayout({
  children,
  activeView,
  customerId,
  customerName,
  isAdminUser,
  isOnline,
  userEmail,
  isEmbedded = false,
  onNavigate,
  onBackToPOS,
  onLogout,
}: CRMLayoutProps) {
  const isProfileView = activeView === "profile" && customerId;

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: colors.background.primary }}
    >
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
              background:
                "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)",
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <WifiOff className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              You're offline. Some features may be unavailable.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.light,
        }}
      >
        {/* Sidebar Header */}
        <div
          className="p-4 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.purple.primary}22 0%, ${colors.purple.primary}44 100%)`,
              }}
            >
              <Users
                className="w-5 h-5"
                style={{ color: colors.purple.primary }}
              />
            </div>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                CRM
              </h1>
              <p
                className="text-xs"
                style={{ color: colors.text.muted }}
              >
                Customer Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdminUser).map(
            (item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: isActive
                      ? `${colors.purple.primary}15`
                      : "transparent",
                    color: isActive
                      ? colors.purple.primary
                      : colors.text.secondary,
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight
                      className="w-4 h-4 ml-auto"
                      style={{ color: colors.purple.primary }}
                    />
                  )}
                </button>
              );
            }
          )}

          {/* Profile breadcrumb when viewing a customer */}
          {isProfileView && (
            <div
              className="mt-4 pt-4 border-t"
              style={{ borderColor: colors.border.light }}
            >
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  backgroundColor: `${colors.purple.primary}15`,
                  color: colors.purple.primary,
                }}
              >
                <UserCircle className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate">
                    {customerName || "Customer Profile"}
                  </span>
                  <span
                    className="text-xs truncate block"
                    style={{ color: colors.text.muted }}
                  >
                    {customerId?.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer - hidden when embedded in modal */}
        {!isEmbedded && (
          <div
            className="p-3 border-t space-y-2"
            style={{ borderColor: colors.border.light }}
          >
            {/* User info */}
            {userEmail && (
              <div
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.background.tertiary }}
              >
                <p
                  className="text-xs truncate"
                  style={{ color: colors.text.muted }}
                >
                  Signed in as
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: colors.text.primary }}
                >
                  {userEmail}
                </p>
              </div>
            )}

            {/* Back to POS */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToPOS}
              className="w-full justify-start gap-2"
              style={{ color: colors.text.secondary }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to POS
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="w-full justify-start gap-2 hover:text-red-400"
              style={{ color: colors.text.muted }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header
          className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b"
          style={{
            backgroundColor: "rgba(15, 15, 15, 0.85)",
            backdropFilter: "blur(16px)",
            borderColor: colors.border.light,
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("directory")}
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
              style={{ color: colors.text.muted }}
            >
              <Home className="w-4 h-4" />
              CRM
            </button>

            {activeView !== "directory" && (
              <>
                <ChevronRight
                  className="w-4 h-4"
                  style={{ color: colors.text.muted }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text.primary }}
                >
                  {activeView === "profile"
                    ? customerName || "Customer Profile"
                    : activeView === "link-queue"
                    ? "Identity Links"
                    : ""}
                </span>
              </>
            )}
          </div>

          {/* Search hint */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: colors.background.tertiary,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <Search className="w-4 h-4" style={{ color: colors.text.muted }} />
            <span className="text-sm" style={{ color: colors.text.muted }}>
              Press{" "}
              <kbd
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: colors.background.secondary,
                  color: colors.text.secondary,
                }}
              >
                /
              </kbd>{" "}
              to search
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
