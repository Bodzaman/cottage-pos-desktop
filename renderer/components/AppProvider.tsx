import React, { useState, useEffect } from "react";
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationProvider } from "components/NavigationProvider";
import { SimpleAuthProvider, useSimpleAuth } from "utils/simple-auth-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionStatusIndicator } from "components/ConnectionStatusIndicator";
import { ChatTriggerButton } from "components/ChatTriggerButton";
import { ChatLargeModal } from "components/ChatLargeModal";
import { CartSidebar } from "components/CartSidebar";
import { CustomerCustomizationModal } from "./CustomerCustomizationModal"; // ✅ FIX: Use relative path
import { GoogleMapsProvider } from "utils/googleMapsProvider";
import { setupGlobalErrorHandlers, checkBrowserCompatibility } from "utils/errorHandling";
import { useRealtimeMenuStore } from "utils/realtimeMenuStore";
import { useTableOrdersStore } from "utils/tableOrdersStore";
import { useCartStore } from "utils/cartStore";
import { useChatVisibility } from "utils/useChatVisibility";
import { queryClient } from "utils/queryClient";
import { toast } from "sonner";
import { apiClient } from "app";
import { getOrCreateSessionId } from "utils/session-manager";
import { useNavigate, useLocation } from "react-router-dom";

const isDev = import.meta.env.DEV;

/**
 * ✅ REMOVED: CartSidebarWrapper
 * Cart should only appear on OnlineOrders page (customer-facing),
 * not globally on all pages. Moved to OnlineOrders.tsx.
 */

/**
 * ✅ NEW: Global CustomerCustomizationModal wrapper
 * Renders at AppProvider level so it persists when cart drawer closes
 */
function CustomerCustomizationModalWrapper() {
  // Get editing state from cart store
  const editingItemId = useCartStore((state) => state.editingItemId);
  const clearEditingItem = useCartStore((state) => state.clearEditingItem);
  const openCart = useCartStore((state) => state.openCart);
  const items = useCartStore((state) => state.items);
  const updateItem = useCartStore((state) => state.updateItem);
  const currentOrderMode = useCartStore((state) => state.currentOrderMode);
  
  // Get menu data from realtime store
  const { menuItems } = useRealtimeMenuStore();
  
  // Find the editing cart item and menu item
  const editingCartItem = editingItemId ? items.find(i => i.id === editingItemId) : null;
  const editingMenuItem = editingCartItem && menuItems 
    ? menuItems.find(m => m.id === editingCartItem.menuItemId)
    : null;
  
  // ✅ EMERGENCY FIX: Always clear editing state on mount (prevent stuck modals)
  React.useEffect(() => {
    if (editingItemId) {
      console.warn('⚠️ EMERGENCY: Clearing stuck editing state on mount');
      clearEditingItem();
    }
  }, []); // Empty deps = run once on mount
  
  // ✅ SAFETY: Clear stuck editing state if data is missing
  React.useEffect(() => {
    if (editingItemId && (!editingCartItem || !editingMenuItem)) {
      console.warn('⚠️ Clearing stuck editing state - item or menu data missing');
      clearEditingItem();
    }
  }, [editingItemId, editingCartItem, editingMenuItem, clearEditingItem]);
  
  const handleCancelEdit = () => {
    clearEditingItem();
    openCart(); // Reopen cart on cancel
  };
  
  // Only render modal if all required data is present
  if (!editingItemId || !editingMenuItem || !editingCartItem) {
    return null;
  }
  
  return (
    <CustomerCustomizationModal
      item={editingMenuItem}
      variant={editingCartItem.variant}
      isOpen={true}
      onClose={handleCancelEdit}
      onModalClose={() => openCart()} // Reopen cart when modal closes
      addToCart={(item, quantity, variant, customizations, notes) => {
        // ✅ NEW SIGNATURE: (item, quantity, variant, customizations, notes)
        // IMPORTANT: Update existing item, don't add new
        updateItem(editingItemId, {
          variant,
          quantity,
          customizations,
          notes
        });
        
        // Close editor and show success
        clearEditingItem();
        toast.success('Item updated successfully');
        
        // Reopen cart to show updated item
        openCart();
      }}
      mode={currentOrderMode}
      initialQuantity={editingCartItem.quantity}
      editMode={true}
      initialCustomizations={editingCartItem.customizations || []}
      initialInstructions={editingCartItem.notes || ''}
    />
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  console.log('🟢 AppProvider: Component rendering started');
  
  // ✅ Get location for route-based CMS detection
  const location = useLocation();
  
  // ✅ Check if chat should be visible based on route exclusions
  const isChatAllowed = useChatVisibility();
  
  // ✅ FIXED: Check if we're in CMS management page (not iframe detection)
  const isInCmsManagement = location.pathname.startsWith('/website-management');
  
  // Send log to backend for diagnostics
  try {
    apiClient.log_frontend_render({
      component: 'AppProvider',
      message: 'Component started rendering',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    // Ignore if API not ready
  }
  
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  
  // Global cart drawer state
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  
  // Global menu store initialization for dish detection on all pages
  const { initialize: initializeMenuStore, isConnected, menuItems } = useRealtimeMenuStore();
  
  // ✅ NEW (MYA-1531): Initialize session manager on app mount
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    if (isDev) console.log('🎫 AppProvider: Session initialized:', sessionId);
    
    // ✅ PHASE 5f: Update cartStore sessionId if not already set
    const cartStore = useCartStore.getState();
    if (!cartStore.sessionId && sessionId) {
      useCartStore.setState({ sessionId });
      if (isDev) console.log('🔔 AppProvider: Updated cartStore with sessionId');
    }
  }, []);
  
  // ✅ NEW (MYA-1550): Initialize cart from Supabase on app mount
  // This ensures customizations and all cart data are loaded fresh from database
  useEffect(() => {
    const initCart = async () => {
      try {
        await useCartStore.getState().fetchCartFromSupabase();
        if (isDev) console.log('✅ AppProvider: Cart initialized from Supabase');
      } catch (error) {
        console.error('❌ AppProvider: Failed to initialize cart from Supabase:', error);
      }
    };
    initCart();
  }, []);
  
  // ✅ PHASE 5f: Cleanup cart subscription on app unmount only
  useEffect(() => {
    return () => {
      if (isDev) console.log('🧹 AppProvider: Cleaning up cart subscription on unmount...');
      const cartStore = useCartStore.getState();
      cartStore.cleanupRealtimeSubscription();
    };
  }, []);
  
  // Initialize error handlers on app startup
  useEffect(() => {
    setupGlobalErrorHandlers();
    checkBrowserCompatibility();
    if (isDev) console.log('🔧 Global error handlers initialized');
  }, []);
  
  // Initialize global menu store for dish detection across all pages
  useEffect(() => {
    const initMenu = async () => {
      if (isDev) console.log('🍽️ AppProvider: Initializing global menu store for dish detection');
      
      try {
        await initializeMenuStore();
        // ✅ DEFENSIVE: Safely access menuItems with fallback
        const state = useRealtimeMenuStore.getState();
        const itemCount = Array.isArray(state?.menuItems) ? state.menuItems.length : 0;
        if (isDev) console.log('✅ AppProvider: Global menu store initialized successfully with', 
          itemCount, 'items');
      } catch (error) {
        console.error('❌ AppProvider: Failed to initialize global menu store:', error);
      }
    };
    
    initMenu();
  }, [initializeMenuStore]);

  // ============================================================================
  // SINGLETON INITIALIZATION: Table Orders Store
  // ============================================================================
  // Initialize table orders store ONCE at app-level (singleton pattern)
  // Components only subscribe to state, they NEVER initialize
  useEffect(() => {
    // React StrictMode guard - prevents double initialization
    let isActive = true;
    
    const initTableOrders = async () => {
      if (!isActive) {
        return;
      }
      
      try {
        await useTableOrdersStore.getState().loadTableOrders();
        
        if (!isActive) {
          return;
        }
      } catch (error) {
        console.error('❌ [AppProvider] Failed to initialize table orders store:', error);
      }
    };

    initTableOrders();
    
    // Cleanup function for React StrictMode
    return () => {
      isActive = false;
    };
  }, []);
  
  // Fetch Google Maps API key on app initialization
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await apiClient.get_maps_config();
        const data = await response.json();
        if (data?.apiKey) {
          setGoogleMapsApiKey(data.apiKey);
        } else {
          console.error('❌ No API key in maps config response');
        }
      } catch (error) {
        console.error('❌ Failed to fetch Google Maps API key in AppProvider:', error);
      }
    };
    
    fetchApiKey();
  }, []);
  
  // ✅ NEW: One-time cart analytics table setup
  useEffect(() => {
    const setupCartAnalytics = async () => {
      try {
        const checkResponse = await apiClient.check_cart_analytics_table();
        
        if (!checkResponse.ok) {
          const setupResponse = await apiClient.setup_cart_analytics_table();
          
          if (setupResponse.ok) {
            const result = await setupResponse.json();
          } else {
            console.warn('⚠️ Failed to create cart analytics table');
          }
        }
      } catch (error) {
        console.warn('⚠️ Cart analytics setup error:', error);
        // Don't block app initialization if analytics setup fails
      }
    };
    
    setupCartAnalytics();
  }, []); // Run once on mount
  
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <GoogleMapsProvider apiKey={googleMapsApiKey}>
          <SimpleAuthProvider>
            <NavigationProvider>
              <TooltipProvider>
                <Toaster position="top-right" richColors />
                {children}
                <ConnectionStatusIndicator />
                {/* ✅ FIXED: Only render chat when NOT in iframe to prevent duplication in CMS preview */}
                {isChatAllowed && !isInCmsManagement && <ChatTriggerButton />}
                {isChatAllowed && !isInCmsManagement && <ChatLargeModal />}
                <CustomerCustomizationModalWrapper />
              </TooltipProvider>
            </NavigationProvider>
          </SimpleAuthProvider>
        </GoogleMapsProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

/**
 * A component that helps fix the router provider by exposing our fixed router.
 * This is referenced in the router.tsx file.
 */
export const RouterFixHelper = () => {
  return null;
};
