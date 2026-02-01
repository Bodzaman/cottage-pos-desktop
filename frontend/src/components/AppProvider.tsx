import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationProvider } from "components/NavigationProvider";
import { SimpleAuthProvider, useSimpleAuth } from "utils/simple-auth-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectionStatusIndicator } from "components/ConnectionStatusIndicator";
import { POSGuestCountModalWrapper } from "components/POSGuestCountModalWrapper";
import { ChatTriggerButton } from "components/ChatTriggerButton";
import { ChatLargeModal } from "components/ChatLargeModal";
import { UnifiedCart } from "components/cart/UnifiedCart";
import { CustomerUnifiedCustomizationModal } from "./CustomerUnifiedCustomizationModal"; // ✅ Updated: Using unified modal
import { GoogleMapsProvider } from "utils/googleMapsProvider";
import { setupGlobalErrorHandlers, checkBrowserCompatibility } from "utils/errorHandling";
import { useRealtimeMenuStoreCompat } from "utils/realtimeMenuStoreCompat";
import { useTableOrdersStore } from "utils/tableOrdersStore";
import { useCartStore } from "utils/cartStore";
import { useChatVisibility } from "utils/useChatVisibility";
import { queryClient } from "utils/queryClient";
import { toast } from "sonner";
import { getOrCreateSessionId } from "utils/session-manager";

const isDev = import.meta.env.DEV;

/**
 * ✅ UPDATED: UnifiedCart now renders globally
 * Cart is available on all customer-facing pages (same visibility as chat)
 * Uses isChatAllowed hook to determine if cart should be visible
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
  const { menuItems, itemVariants } = useRealtimeMenuStoreCompat({ context: 'admin' });
  
  // Find the editing cart item and menu item
  const editingCartItem = editingItemId ? items.find(i => i.id === editingItemId) : null;
  const editingMenuItem = editingCartItem && menuItems 
    ? menuItems.find(m => m.id === editingCartItem.menuItemId)
    : null;
  
  // ✅ EMERGENCY FIX: Always clear editing state on mount (prevent stuck modals)
  React.useEffect(() => {
    if (editingItemId) {
      clearEditingItem();
    }
  }, []); // Empty deps = run once on mount
  
  // ✅ SAFETY: Clear stuck editing state if data is missing
  React.useEffect(() => {
    if (editingItemId && (!editingCartItem || !editingMenuItem)) {
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
  
  // Get variants for this menu item
  const menuItemVariants = itemVariants?.filter(v => v.menu_item_id === editingMenuItem.id) || [];

  return (
    <CustomerUnifiedCustomizationModal
      item={editingMenuItem}
      itemVariants={menuItemVariants}
      isOpen={true}
      onClose={handleCancelEdit}
      onModalClose={() => openCart()} // Reopen cart when modal closes
      addToCart={(item, quantity, variant, customizations, notes) => {
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
      initialVariant={editingCartItem.variant}
      initialQuantity={editingCartItem.quantity}
      editMode={true}
      editingCartItemId={editingItemId}
      editingCartItem={editingCartItem}
      initialCustomizations={editingCartItem.customizations || []}
    />
  );
}

/**
 * Inner provider component that runs INSIDE QueryClientProvider
 * This is needed because hooks like useRealtimeMenuStoreCompat use React Query
 * and must be called within the QueryClientProvider context.
 */
function AppProviderInner({ children }: { children: React.ReactNode }) {
  // ✅ Check if chat should be visible on current route
  const isChatAllowed = useChatVisibility();

  // Global cart drawer state
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const closeCart = useCartStore((state) => state.closeCart);

  // Global menu store initialization for dish detection on all pages
  // NOTE: This hook uses React Query internally, so it MUST be inside QueryClientProvider
  const { initialize: initializeMenuStore, isConnected, menuItems: globalMenuItems } = useRealtimeMenuStoreCompat({ context: 'admin' });

  // ✅ (MYA-1531): Initialize session manager on app mount
  useEffect(() => {
    const sessionId = getOrCreateSessionId();

    // PHASE 5f: Update cartStore sessionId if not already set
    const cartStore = useCartStore.getState();
    if (!cartStore.sessionId && sessionId) {
      useCartStore.setState({ sessionId });
    }
  }, []);

  // ✅ (MYA-1550): Initialize cart from Supabase on app mount
  // This ensures customizations and all cart data are loaded fresh from database
  useEffect(() => {
    const initCart = async () => {
      try {
        await useCartStore.getState().fetchCartFromSupabase();
      } catch (error) {
        console.error(' AppProvider: Failed to initialize cart from Supabase:', error);
      }
    };
    initCart();
  }, []);

  // PHASE 5f: Cleanup cart subscription on app unmount only
  useEffect(() => {
    return () => {
      const cartStore = useCartStore.getState();
      cartStore.cleanupRealtimeSubscription();
    };
  }, []);

  // Initialize error handlers on app startup
  useEffect(() => {
    setupGlobalErrorHandlers();
    checkBrowserCompatibility();
  }, []);

  // Initialize global menu store for dish detection across all pages
  useEffect(() => {
    const initMenu = async () => {
      try {
        await initializeMenuStore();
        // DEFENSIVE: Safely access menuItems with fallback
        // globalMenuItems is from the compat hook (React Query)
        const itemCount = Array.isArray(globalMenuItems) ? globalMenuItems.length : 0;
      } catch (error) {
        console.error(' AppProvider: Failed to initialize global menu store:', error);
      }
    };

    initMenu();
  }, [initializeMenuStore, globalMenuItems]);

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
        console.error(' [AppProvider] Failed to initialize table orders store:', error);
      }
    };

    initTableOrders();

    // Cleanup function for React StrictMode
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <>
      {children}
      <ConnectionStatusIndicator />
      <POSGuestCountModalWrapper />
      {isChatAllowed && <ChatTriggerButton />}
      {isChatAllowed && <ChatLargeModal />}
      <CustomerCustomizationModalWrapper />
      {/* Global cart - visible on customer-facing pages */}
      {isChatAllowed && <UnifiedCart />}
    </>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  // Get Google Maps API key from environment variable (no backend needed)
  useEffect(() => {
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (envKey) {
      setGoogleMapsApiKey(envKey);
    }
  }, []);

  // NOTE: QueryClientProvider must be the outermost provider for any component
  // that uses React Query hooks (like useRealtimeMenuStoreCompat)
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleMapsProvider apiKey={googleMapsApiKey}>
        <SimpleAuthProvider>
          <NavigationProvider>
            <TooltipProvider>
              <Toaster
                position="bottom-center"
                closeButton
                toastOptions={{
                  className: 'max-w-[90vw]',
                  duration: 4000,
                }}
              />
              <AppProviderInner>
                {children}
              </AppProviderInner>
            </TooltipProvider>
          </NavigationProvider>
        </SimpleAuthProvider>
      </GoogleMapsProvider>
    </QueryClientProvider>
  );
}

/**
 * A component that helps fix the router provider by exposing our fixed router.
 * This is referenced in the router.tsx file.
 */
export const RouterFixHelper = () => {
  return null;
};
