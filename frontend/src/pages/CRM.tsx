import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCRMRouting } from "../hooks/useCRMRouting";
import { CRMLayout } from "../components/CRMLayout";
import { colors } from "../utils/InternalDesignSystem";

// Lazy load view components
const CRMCustomerDirectory = lazy(
  () => import("../components/CRMCustomerDirectory").then((m) => ({ default: m.CRMCustomerDirectory }))
);
const CRMCustomerProfile = lazy(
  () => import("../components/CRMCustomerProfile").then((m) => ({ default: m.CRMCustomerProfile }))
);
const CRMIdentityLinkQueue = lazy(
  () => import("../components/CRMIdentityLinkQueue").then((m) => ({ default: m.CRMIdentityLinkQueue }))
);

// Loading fallback
function ViewLoadingFallback() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center h-64"
    >
      <Loader2
        className="w-6 h-6 animate-spin"
        style={{ color: colors.purple.primary }}
      />
      <span className="ml-3" style={{ color: colors.text.muted }}>
        Loading...
      </span>
    </motion.div>
  );
}

// Animation variants for view transitions
const viewVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15, ease: "easeIn" } },
};

export default function CRM() {
  const {
    user,
    isLoading,
    isOnline,
    isAdminUser,
    activeView,
    customerId,
    searchQuery,
    goToDirectory,
    goToProfile,
    goToLinkQueue,
    updateSearchQuery,
    backToPOS,
    logout,
  } = useCRMRouting();

  // Track customer name for breadcrumb
  const [customerName, setCustomerName] = useState<string | null>(null);

  // Auth guard loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background.primary }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: colors.purple.primary }}
        />
      </div>
    );
  }

  // Not authenticated (hook will redirect, but show loading in meantime)
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background.primary }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: colors.purple.primary }}
        />
      </div>
    );
  }

  // Handle navigation
  const handleNavigate = (view: "directory" | "profile" | "link-queue") => {
    switch (view) {
      case "directory":
        goToDirectory();
        setCustomerName(null);
        break;
      case "link-queue":
        goToLinkQueue();
        setCustomerName(null);
        break;
      default:
        goToDirectory();
    }
  };

  const handleSelectCustomer = (id: string) => {
    goToProfile(id);
  };

  const handleBackFromProfile = () => {
    goToDirectory(searchQuery || undefined);
    setCustomerName(null);
  };

  return (
    <CRMLayout
      activeView={activeView}
      customerId={customerId}
      customerName={customerName}
      isAdminUser={isAdminUser}
      isOnline={isOnline}
      userEmail={user.username}
      onNavigate={handleNavigate}
      onBackToPOS={backToPOS}
      onLogout={logout}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView + (customerId || "")}
          variants={viewVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full"
        >
          <Suspense fallback={<ViewLoadingFallback />}>
            {activeView === "directory" && (
              <CRMCustomerDirectory
                initialQuery={searchQuery || undefined}
                onSelectCustomer={handleSelectCustomer}
                onUpdateQuery={updateSearchQuery}
              />
            )}

            {activeView === "profile" && customerId && (
              <CRMCustomerProfile
                customerId={customerId}
                onBack={handleBackFromProfile}
                onCustomerNameChange={setCustomerName}
              />
            )}

            {activeView === "link-queue" && (
              <CRMIdentityLinkQueue
                onViewCustomer={handleSelectCustomer}
              />
            )}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </CRMLayout>
  );
}
