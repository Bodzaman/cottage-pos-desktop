import React, { useState, Suspense, lazy } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { CRMLayout } from "./CRMLayout";
import { CRMView } from "../hooks/useCRMRouting";
import { colors } from "../utils/InternalDesignSystem";

// Lazy load view components (same as CRM page)
const CRMCustomerDirectory = lazy(
  () => import("./CRMCustomerDirectory").then((m) => ({ default: m.CRMCustomerDirectory }))
);
const CRMCustomerProfile = lazy(
  () => import("./CRMCustomerProfile").then((m) => ({ default: m.CRMCustomerProfile }))
);
const CRMIdentityLinkQueue = lazy(
  () => import("./CRMIdentityLinkQueue").then((m) => ({ default: m.CRMIdentityLinkQueue }))
);

interface CRMModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

/**
 * CRMModal - Large modal wrapper for embedded CRM access from POS Desktop
 *
 * Features:
 * - 95vw x 90vh modal size (almost full screen)
 * - Embeds full CRM functionality with internal state management
 * - Hides footer elements (Back to POS, Signed in as, Logout) via isEmbedded prop
 * - X button to close and return to POS
 */
export function CRMModal({ isOpen, onClose }: CRMModalProps) {
  // Internal CRM state (not URL-based since we're in a modal)
  const [activeView, setActiveView] = useState<CRMView>("directory");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  // Reset state when modal closes
  const handleClose = () => {
    setActiveView("directory");
    setCustomerId(null);
    setCustomerName(null);
    setSearchQuery(null);
    onClose();
  };

  // Handle navigation within the modal
  const handleNavigate = (view: CRMView) => {
    if (view === "directory" || view === "link-queue") {
      setActiveView(view);
      setCustomerId(null);
      setCustomerName(null);
    }
  };

  const handleSelectCustomer = (id: string) => {
    setActiveView("profile");
    setCustomerId(id);
  };

  const handleBackFromProfile = () => {
    setActiveView("directory");
    setCustomerId(null);
    setCustomerName(null);
  };

  const handleUpdateQuery = (query: string) => {
    setSearchQuery(query || null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="p-0 overflow-hidden border-0"
        hideCloseButton
        style={{
          maxWidth: "95vw",
          width: "95vw",
          height: "90vh",
          maxHeight: "90vh",
          backgroundColor: colors.background.primary,
          border: `1px solid ${colors.border.light}`,
        }}
      >
        {/* Close button - positioned in top right */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-3 right-3 z-50 hover:bg-white/10"
          style={{ color: colors.text.muted }}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* CRM Layout with isEmbedded=true to hide footer elements */}
        <CRMLayout
          activeView={activeView}
          customerId={customerId}
          customerName={customerName}
          isAdminUser={true}
          isOnline={true}
          isEmbedded={true}
          onNavigate={handleNavigate}
          onBackToPOS={handleClose}
          onLogout={() => {}}
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
                    onUpdateQuery={handleUpdateQuery}
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
      </DialogContent>
    </Dialog>
  );
}

export default CRMModal;
