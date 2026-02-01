import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { globalColors } from '../utils/QSAIDesign';
import { colors as designColors } from '../utils/designSystem';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Utensils,
  Settings,
  ChefHat,
  ShoppingBag,
  Calendar,
  Globe,
  BarChart3,
  Shield,
  TableProperties,
  Truck,
  FileText,
  Monitor,
  Search,
  X
} from "lucide-react";
import ManagementPasswordDialog from "./ManagementPasswordDialog";
import { Breadcrumbs } from "./Breadcrumbs";
import { QuickNavigation } from "./QuickNavigation";
import MenuManagementDialog from "./MenuManagementDialog";
import AllOrdersModal from "./AllOrdersModal";
import ContextSearchResultsDropdown from "./ContextSearchResultsDropdown";
import { OrderDetailDialog } from "./OrderDetailDialog";
import { OrderModel } from "types";
import { usePOSAuth } from "../utils/usePOSAuth";
import { usePOSContextSearch, POSSearchResult } from "../utils/usePOSContextSearch";
import { AvatarDropdown } from "./AvatarDropdown";
import { APP_BASE_PATH } from '../utils/environment';
import { POSOnlineStatusControl } from "./POSOnlineStatusControl";
import { useBrandFont } from "../utils/useBrandFont";
import { CallerIdPanel } from "./pos/CallerIdPanel";
import { useCallerIdStore } from "../utils/callerIdStore";


export interface Props {
  title?: string;
  selectedStore?: string;
  currentSection?: string;
  className?: string;
  showGradient?: boolean;
  onAdminSuccess?: () => void;
  onLogout?: () => void;
  // Context-aware search callbacks
  onCustomerSelect?: (profile: any) => void;
  onSelectOnlineOrder?: (orderId: string) => void;
  onReorder?: (order: any) => void;
  // Caller ID callbacks
  onCallerIdStartOrder?: (customerId: string | null, phone: string) => void;
  onCallerIdDismiss?: () => void;
}

export const ManagementHeader: React.FC<Props> = ({
  title,
  selectedStore,
  currentSection,
  className,
  showGradient,
  onAdminSuccess,
  onLogout,
  onCustomerSelect,
  onSelectOnlineOrder,
  onReorder,
  onCallerIdStartOrder,
  onCallerIdDismiss
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showMenuManagementModal, setShowMenuManagementModal] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  const { titleFontFamily } = useBrandFont();

  // Get auth info for dropdown
  const { user, isAuthenticated } = usePOSAuth();

  // Caller ID state
  const activeIncomingCall = useCallerIdStore(s => s.activeIncomingCall());
  const hasActiveCall = useCallerIdStore(s => s.hasActiveCall());
  const dismissEvent = useCallerIdStore(s => s.dismissEvent);
  const startOrderFromCall = useCallerIdStore(s => s.startOrderFromCall);
  
  // Context-aware search hook
  const contextSearch = usePOSContextSearch({
    onCustomerSelect,
    onSelectOnlineOrder,
    onReorder,
  });

  // Order detail dialog state (kept local — opened from search results)
  const [selectedOrder, setSelectedOrder] = useState<OrderModel | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  // Always show search bar
  const isPOSEnvironment = path.includes('pos') || path === '/' ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' ||
     window.navigator.userAgent.includes('Electron')));
  const showSearch = !contextSearch.isDisabled;

  // Handle result selection — customer/active online handled by hook, past orders open detail dialog
  const handleResultSelect = useCallback((result: POSSearchResult) => {
    if (result.type === 'customer' || (result.type === 'online_order' && result.source === 'active')) {
      contextSearch.handleSelect(result);
    } else {
      // Past order — open detail dialog
      setSelectedOrder(result.rawData);
      setShowOrderDialog(true);
      contextSearch.setShowDropdown(false);
    }
  }, [contextSearch]);

  const handleShowAllResults = useCallback(() => {
    setShowAllOrdersModal(true);
    contextSearch.setShowDropdown(false);
  }, [contextSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        contextSearch.setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextSearch]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextSearch.showDropdown) {
        contextSearch.setShowDropdown(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [contextSearch.showDropdown]);

  // Add event listeners for QuickToolsModal integration
  useEffect(() => {
    const handleMenuManagementOpen = () => {
      setShowMenuManagementModal(true);
    };

    const handleAllOrdersOpen = () => {
      setShowAllOrdersModal(true);
    };

    document.addEventListener('menu-management-open', handleMenuManagementOpen);
    document.addEventListener('all-orders-open', handleAllOrdersOpen);

    return () => {
      document.removeEventListener('menu-management-open', handleMenuManagementOpen);
      document.removeEventListener('all-orders-open', handleAllOrdersOpen);
    };
  }, []);
  
  const handleAdminAuthenticated = () => {
    if (onAdminSuccess) {
      onAdminSuccess();
    } else {
      // Check if we're on POS page and dispatch event as fallback
      if (path === '/pos') {
        document.dispatchEvent(new CustomEvent('trigger-pos-admin'));
      } else {
        navigate('/admin');
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: navigate to login
      navigate('/pos-login');
    }
  };

  // Caller ID handlers
  const handleCallerIdStartOrder = useCallback(async () => {
    if (!activeIncomingCall) return;

    const { customerId, phone } = await startOrderFromCall(activeIncomingCall.id);

    if (onCallerIdStartOrder) {
      onCallerIdStartOrder(customerId, phone);
    }
  }, [activeIncomingCall, startOrderFromCall, onCallerIdStartOrder]);

  const handleCallerIdDismiss = useCallback(async () => {
    if (!activeIncomingCall) return;

    await dismissEvent(activeIncomingCall.id);

    if (onCallerIdDismiss) {
      onCallerIdDismiss();
    }
  }, [activeIncomingCall, dismissEvent, onCallerIdDismiss]);

  return (
    <header 
      className={`relative p-4 pb-3 ${className}`}
      style={{
        background: showGradient ? `linear-gradient(to bottom, ${globalColors.background.dark} 0%, ${globalColors.background.primary} 100%)` : designColors.background.primary,
        borderBottom: `1px solid ${globalColors.border.light}`,
      }}
    >
      {/* Main Header Layout - Full Width Distribution */}
      <div className="flex items-center justify-between w-full gap-6">
        {/* Left: Restaurant Brand - Anchored Left */}
        <div className="flex-shrink-0">
          <div className="flex flex-col">
            {/* Primary Restaurant Brand */}
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: titleFontFamily,
                fontSize: '2.4rem',
                fontWeight: '800',
                lineHeight: '1.1',
                letterSpacing: '0.02em',
                backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #B91C1C 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(185, 28, 28, 0.4)',
                filter: 'drop-shadow(0 2px 4px rgba(185, 28, 28, 0.3))',
                marginBottom: '0.25rem'
              }}
            >
              Cottage Tandoori
            </h1>
          </div>
        </div>

        {/* Center: Caller ID Panel OR Search Bar */}
        <AnimatePresence mode="wait">
          {hasActiveCall && activeIncomingCall ? (
            <CallerIdPanel
              key="caller-panel"
              event={activeIncomingCall}
              onStartOrder={handleCallerIdStartOrder}
              onDismiss={handleCallerIdDismiss}
            />
          ) : showSearch ? (
            <motion.div
              key="search-bar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 max-w-2xl mx-4 sm:mx-8"
            >
              <div className="relative search-container">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: globalColors.text.tertiary }}
                />
                <Input
                  type="text"
                  placeholder={contextSearch.placeholder}
                  value={contextSearch.query}
                  onChange={(e) => contextSearch.setQuery(e.target.value)}
                  className="pl-12 pr-12 py-3 text-base font-medium"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(124, 93, 250, 0.3)',
                    color: globalColors.text.primary,
                    borderRadius: '0.75rem',
                    border: '2px solid',
                    boxShadow: '0 4px 20px rgba(124, 93, 250, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(124, 93, 250, 0.6)';
                    e.target.style.boxShadow = '0 6px 25px rgba(124, 93, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(124, 93, 250, 0.3)';
                    e.target.style.boxShadow = '0 4px 20px rgba(124, 93, 250, 0.1)';
                  }}
                />
                {contextSearch.query && (
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 hover:scale-110"
                    style={{ color: globalColors.text.tertiary }}
                    onClick={contextSearch.clearSearch}
                    onMouseEnter={(e) => e.currentTarget.style.color = globalColors.text.primary}
                    onMouseLeave={(e) => e.currentTarget.style.color = globalColors.text.tertiary}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}

                {/* Context-Aware Search Results Dropdown */}
                <ContextSearchResultsDropdown
                  customerResults={contextSearch.customerResults}
                  activeResults={contextSearch.activeResults}
                  pastResults={contextSearch.pastResults}
                  isVisible={contextSearch.showDropdown}
                  isLoading={contextSearch.isSearching}
                  searchQuery={contextSearch.query}
                  posViewMode={contextSearch.posViewMode}
                  onSelect={handleResultSelect}
                  onReprint={undefined}
                  onReorder={contextSearch.handleReorder}
                  onShowAllResults={handleShowAllResults}
                />
              </div>
            </motion.div>
          ) : (
            /* Spacer when search is not shown */
            <div className="flex-1" />
          )}
        </AnimatePresence>

        {/* Right: Settings & Tools Group - Anchored Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Online Orders Status Control (POS Only) */}
          {isPOSEnvironment && (
            <POSOnlineStatusControl />
          )}

          {/* Settings & Quick Tools Group */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <QuickNavigation />
          </div>
          
          {/* Admin Button with Dropdown */}
          {isAuthenticated && user && (
            <>
              <AvatarDropdown
                username={user.username}
                fullName={user.fullName}
                onLogout={handleLogout}
                onAdminClick={() => setShowPasswordDialog(true)}
                trigger={
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="relative text-gray-400 hover:text-white flex items-center gap-2 transition-all duration-300 px-4 py-2 font-medium"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124, 93, 250, 0.15) 0%, rgba(124, 93, 250, 0.05) 100%)',
                      border: '1px solid rgba(124, 93, 250, 0.3)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 2px 10px rgba(124, 93, 250, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 93, 250, 0.25) 0%, rgba(124, 93, 250, 0.15) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.5)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(124, 93, 250, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 93, 250, 0.15) 0%, rgba(124, 93, 250, 0.05) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.3)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(124, 93, 250, 0.1)';
                    }}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                }
              />
            </>
          )}
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Admin Password Dialog */}
      <ManagementPasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onAuthenticated={handleAdminAuthenticated}
      />
      
      {/* Menu Management Modal */}
      <MenuManagementDialog
        isOpen={showMenuManagementModal}
        onClose={() => setShowMenuManagementModal(false)}
      />
      
      {/* All Orders Modal */}
      <AllOrdersModal
        isOpen={showAllOrdersModal}
        onClose={() => setShowAllOrdersModal(false)}
      />
      
      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          order={{
            id: selectedOrder.order_id,
            orderNumber: selectedOrder.order_number || selectedOrder.order_id,
            customer: {
              name: selectedOrder.customer_name || 'Walk-in Customer',
              phone: selectedOrder.customer_phone || '',
              email: selectedOrder.customer_email || ''
            },
            items: selectedOrder.items?.map(item => ({
              name: item.name || 'Unknown Item',
              quantity: item.quantity || 1,
              price: item.price || 0,
              modifications: item.modifications || [],
              specialInstructions: item.notes || ''
            })) || [],
            total: selectedOrder.total,
            subtotal: selectedOrder.subtotal,
            tax: selectedOrder.tax,
            tip: selectedOrder.tip || 0,
            discount: selectedOrder.discount || 0,
            type: selectedOrder.order_type.toLowerCase() as 'delivery' | 'pickup' | 'dine-in',
            source: selectedOrder.order_source === 'AI_VOICE' ? 'ai-voice' : 
                   selectedOrder.order_source === 'ONLINE' || selectedOrder.order_source === 'CUSTOMER_ONLINE_MENU' ? 'online' : 'pos',
            status: selectedOrder.status.toLowerCase(),
            createdAt: selectedOrder.created_at,
            estimatedReady: selectedOrder.pickup_time || undefined,
            paymentMethod: selectedOrder.payment?.method || 'Unknown',
            notes: selectedOrder.notes || '',
            tableNumber: selectedOrder.table_number || undefined
          }}
          open={showOrderDialog}
          onOpenChange={(open) => {
            setShowOrderDialog(open);
            if (!open) setSelectedOrder(null);
          }}
          orderSource={selectedOrder.order_source === 'AI_VOICE' ? 'ai-voice' : 
                     selectedOrder.order_source === 'ONLINE' || selectedOrder.order_source === 'CUSTOMER_ONLINE_MENU' ? 'online' : 'pos'}
        />
      )}
    </header>
  );
};
