
/**
 * ManagementHeader - Restaurant Management Header Component
 * Adapted for cottage-pos-desktop Electron app
 * 
 * Original from Databutton Cottage Tandoori platform
 * Adapted for standalone Electron application
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { globalColors } from '../utils/QSAIDesign';
import { colors as designColors } from '../utils/designSystem';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import SearchResultsDropdown from "./SearchResultsDropdown";
import { OrderDetailDialog } from "./OrderDetailDialog";
import { apiClient } from '../api/apiClient'; // Replaced brain import
import { OrderModel } from '../types/orderTypes'; // Updated types import

export interface Props {
  title?: string;
  selectedStore?: string;
  currentSection?: string;
  className?: string;
  showGradient?: boolean;
  onAdminSuccess?: () => void; // Callback for POS admin overlay
}

const ManagementHeader: React.FC<Props> = ({ 
  title, 
  selectedStore, 
  currentSection, 
  className, 
  showGradient, 
  onAdminSuccess 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showMenuManagementModal, setShowMenuManagementModal] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);

  // Order search state (replacing menu search)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OrderModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderModel | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  // Only show search on POS page
  const showSearch = path === '/pos' || path === '/posii' || path === '/posdesktop' || path === '/pos-desktop';

  // Debounced search function - Updated to use apiClient
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.length >= 2) {
            setIsSearching(true);
            try {
              // Use apiClient instead of brain
              const data = await apiClient.getOrders({
                page: 1,
                page_size: 20,
                search: query
              });
              setSearchResults(data.orders || []);
              setShowSearchDropdown(true);
            } catch (error) {
              console.error('Search error:', error);
              setSearchResults([]);
            } finally {
              setIsSearching(false);
            }
          } else {
            setSearchResults([]);
            setShowSearchDropdown(false);
          }
        }, 300);
      };
    })()
  , []);

  // Handle search query change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      debouncedSearch(value.trim());
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  // Handle order selection
  const handleSelectOrder = (order: OrderModel) => {
    setSelectedOrder(order);
    setShowOrderDialog(true);
    setShowSearchDropdown(false);
  };

  // Handle show all results
  const handleShowAllResults = () => {
    setShowAllOrdersModal(true);
    setShowSearchDropdown(false);
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSearchDropdown) {
          setShowSearchDropdown(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearchDropdown]);

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
        console.log('Dispatching trigger-pos-admin event for POS overlay');
        document.dispatchEvent(new CustomEvent('trigger-pos-admin'));
      } else {
        navigate('/admin');
      }
    }
  };

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
              className="text-2xl font-oldenglish font-bold" 
              style={{
                fontSize: '2.4rem',
                fontWeight: '800',
                lineHeight: '1.1',
                letterSpacing: '0.02em',
                backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #B91C1C 100%)', // White to dark ruby red
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(185, 28, 28, 0.4)', // Ruby glow
                filter: 'drop-shadow(0 2px 4px rgba(185, 28, 28, 0.3))', // Ruby shadow
                marginBottom: '0.25rem'
              }}
            >
              Cottage Tandoori
            </h1>
          </div>
        </div>

        {/* Center: Enhanced Search Bar - Prominent & Centered */}
        {showSearch ? (
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative search-container">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" 
                style={{ color: globalColors.text.tertiary }} 
              />
              <Input
                type="text"
                placeholder="Search orders by customer, phone, or order number..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
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
              {searchQuery && (
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 hover:scale-110"
                  style={{ color: globalColors.text.tertiary }}
                  onClick={handleClearSearch}
                  onMouseEnter={(e) => e.currentTarget.style.color = globalColors.text.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = globalColors.text.tertiary}
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Search Results Dropdown */}
              <SearchResultsDropdown
                results={searchResults}
                isVisible={showSearchDropdown}
                isLoading={isSearching}
                onSelectOrder={handleSelectOrder}
                onShowAllResults={handleShowAllResults}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        ) : (
          /* Spacer when search is not shown */
          <div className="flex-1" />
        )}

        {/* Right: Settings & Tools Group - Anchored Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Settings & Quick Tools Group */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <QuickNavigation />
          </div>

          {/* Visual Divider */}
          <div 
            className="w-px h-8" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          />

          {/* Admin Button - Priority Position */}
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
            onClick={() => setShowPasswordDialog(true)}
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </Button>
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
          onEdit={(order) => console.log('Edit order:', order)}
          onPrint={(order) => console.log('Print order:', order)}
          onRefund={(order) => console.log('Refund order:', order)}
          orderSource={selectedOrder.order_source === 'AI_VOICE' ? 'ai-voice' : 
                     selectedOrder.order_source === 'ONLINE' || selectedOrder.order_source === 'CUSTOMER_ONLINE_MENU' ? 'online' : 'pos'}
        />
      )}
    </header>
  );
};

export default ManagementHeader;
