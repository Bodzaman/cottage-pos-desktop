import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { MenuItem, OrderMode, CartState, CartCustomization, CartItem } from 'types';
import { getPriceForMode, calculateTotalItems, calculateTotalAmount } from 'types';
import { trackItemAdded, trackItemRemoved, trackModeSwitch, trackCartCleared, trackCartEvent } from './cartAnalytics';
import { getOrCreateSessionId } from './session-manager';
import { supabase } from './supabaseClient';
// brain import removed - cart is managed locally via Zustand persistence
import { initCartRealtimeSubscription, cleanupCartSubscription } from './cartRealtimeSubscription';

// Re-export CartItem and CartState for backward compatibility
export type { CartItem, CartState, CartCustomization } from 'types';

// ✅ PHASE 5g: Define isDev at module level for reactive subscription
const isDev = import.meta.env.DEV;

// ✅ Cart schema version - increment when CartItem structure changes
const CART_SCHEMA_VERSION = 5; // ✅ Incremented from 4 to trigger migration for JSONB parsing

// ✅ REMOVED (Phase 2): Obsolete backend sync infrastructure
// - CartSubscriptionState interface
// - subscriptionState variable
// - initCartSubscription() function
// - cleanupCartSubscription() function
// - syncCartToBackend() function
// - mapBackendItemToCartItem() function
// All cart operations now happen directly in frontend via useCartStore

// Helper function to map frontend CartItem to backend format (snake_case)
const mapCartItemToBackend = (cartItem: CartItem): Record<string, unknown> => {
  return {
    id: cartItem.id,
    menu_item_id: cartItem.menuItemId,
    name: cartItem.name,
    description: cartItem.description,
    price: cartItem.price,
    price_delivery: cartItem.priceDelivery,
    price_collection: cartItem.priceCollection,
    quantity: cartItem.quantity,
    variant_id: cartItem.variant?.id,
    variant_name: cartItem.variant?.name,
    customizations: cartItem.customizations || [],
    image_url: cartItem.imageUrl,
    notes: cartItem.notes || '',
    order_mode: cartItem.orderMode || 'collection'
  };
};

// NEW: Network status tracking
let isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
let offlineQueue: Array<{ action: string; payload: any }> = [];

// NEW: Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    toast.success('Back online! Syncing cart...');
    processOfflineQueue();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    toast.info('You\'re offline. Cart saved locally.', {
      duration: 5000,
    });
  });
}

// NEW: Process queued operations when back online
const processOfflineQueue = async () => {
  if (offlineQueue.length === 0) return;
  
  const queue = [...offlineQueue];
  offlineQueue = [];
  
  for (const { action, payload } of queue) {
    try {
      // Execute queued analytics events
      if (action === 'analytics') {
        await payload.fn(...payload.args);
      }
    } catch (error) {
      console.error('Failed to process queued operation:', error);
    }
  }
  
  toast.success('Cart synced successfully');
};

// NEW: Retry helper with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T | null> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(`Failed after ${maxAttempts} attempts:`, error);
        return null;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
};

// Helper functions are imported from 'types' at the top of the file

/**
 * Parse Supabase cart row into frontend CartItem format
 */
const parseCartItemFromSupabase = (rawItem: any): CartItem => {
  // Parse customizations (handle both string and array)
  let customizations: CartCustomization[] = [];
  if (rawItem.customizations) {
    if (typeof rawItem.customizations === 'string') {
      try {
        customizations = JSON.parse(rawItem.customizations);
      } catch (e) {
        customizations = [];
      }
    } else if (Array.isArray(rawItem.customizations)) {
      customizations = rawItem.customizations;
    }
  }
  
  // Parse variant (JSONB → object)
  let variant: any = undefined;
  if (rawItem.variant) {
    if (typeof rawItem.variant === 'string') {
      try {
        variant = JSON.parse(rawItem.variant);
      } catch (e) {
      }
    } else if (typeof rawItem.variant === 'object') {
      variant = rawItem.variant;
    }
  }
  
  // ✅ FIX #13: Calculate price based on order mode
  // Database stores price_delivery and price_collection, not a single "price" field
  const orderMode = rawItem.order_mode || 'collection';
  const priceDelivery = rawItem.price_delivery;
  const priceCollection = rawItem.price_collection;
  
  // Use same logic as determinePriceByMode helper
  let calculatedPrice = 0;
  if (orderMode === 'delivery') {
    calculatedPrice = priceDelivery ?? priceCollection ?? 0;
  } else {
    calculatedPrice = priceCollection ?? 0;
  }
  
  return {
    id: rawItem.id,
    menuItemId: rawItem.menu_item_id,
    name: rawItem.name,
    description: rawItem.description,
    price: calculatedPrice, // Use calculated price instead of rawItem.price
    priceDelivery: priceDelivery,
    priceCollection: priceCollection,
    quantity: rawItem.quantity || 1,
    variant,
    variantName: rawItem.variant_name, // Read variant_name from database
    customizations,
    imageUrl: rawItem.image_url,
    notes: rawItem.notes,
    orderMode: (rawItem.order_mode || 'collection') as OrderMode
  };
};

// Debounce helper
let quantityUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
const QUANTITY_UPDATE_DEBOUNCE = 300; // ms

// CartState and CartItem are imported from 'types' and re-exported above

export const useCartStore = create<CartState>()(persist(
  (set, get) => ({
    items: [],
    totalItems: 0,
    totalAmount: 0,
    currentOrderMode: 'collection', // NEW: Default to collection
    lastSavedAt: undefined, // NEW
    userId: null, // ✅ NEW (MYA-1525): Initialize as null
    sessionId: getOrCreateSessionId(), // ✅ NEW (MYA-1531): Initialize session_id on store creation
    schemaVersion: CART_SCHEMA_VERSION, // ✅ Set current schema version
    
    // NEW: Global cart drawer state (OnlineOrders sidebar)
    isCartOpen: false,
    
    // ✅ NEW (MYA-1564): Separate state for ChatLargeModal drawer
    isChatCartOpen: false,
    
    // NEW: Editing state
    editingItemId: null,
    
    // NEW: Get cart age in days
    getCartAge: () => {
      const lastSaved = get().lastSavedAt;
      if (!lastSaved) return 0;
      const now = new Date();
      const saved = new Date(lastSaved);
      const diffMs = now.getTime() - saved.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    },
    
    // NEW: Check if cart is stale (> 7 days)
    isCartStale: () => {
      return get().getCartAge() > 7;
    },
    
    // NEW: Global cart drawer actions (OnlineOrders sidebar)
    openCart: () => {
      set({
        isCartOpen: true,
        isChatCartOpen: false // Mutual exclusivity: close chat cart
      });
    },
    closeCart: () => {
      set({ isCartOpen: false });
    },
    closeChatCart: () => {
      set({ isChatCartOpen: false });
    },
    toggleChatCart: () => {
      const isOpen = get().isChatCartOpen;
      set({ isChatCartOpen: !isOpen });
    },
    
    // NEW: Editing actions
    setEditingItem: (itemId: string | null) => set({ editingItemId: itemId }),
    clearEditingItem: () => set({ editingItemId: null }),
    
    toggleCart: () => {
      const isOpen = get().isCartOpen;
      set({ isCartOpen: !isOpen });
    },
    
    // Set order mode
    setOrderMode: (mode: OrderMode) => {
      const prevMode = get().currentOrderMode;
      set({ currentOrderMode: mode, lastSavedAt: new Date().toISOString() });
      
      // Track analytics if mode actually changed (only for delivery/collection)
      if (prevMode !== mode && prevMode !== 'dine-in' && mode !== 'dine-in') {
        const state = get();
        trackModeSwitch(
          prevMode as 'delivery' | 'collection',
          mode as 'delivery' | 'collection',
          state.totalAmount,
          state.totalItems
        );
      }
    },
    
    // Update prices based on order mode (marks items as potentially changed)
    updatePricesForMode: (newMode: OrderMode) => {
      set((state) => {
        const updatedItems = state.items.map(item => {
          // Calculate the correct price for the new mode
          const newPrice = getPriceForMode(
            newMode,
            item.priceDelivery,
            item.priceCollection,
            item.price // fallback to current price if no mode-specific pricing
          );

          // Check if price actually changed
          const didPriceChange = Math.abs(newPrice - item.price) > 0.01;

          return {
            ...item,
            price: newPrice,
            priceChanged: didPriceChange,
            oldPrice: didPriceChange ? item.price : undefined,
            orderMode: newMode
          };
        });

        return {
          items: updatedItems,
          totalItems: calculateTotalItems(updatedItems),
          totalAmount: calculateTotalAmount(updatedItems)
        };
      });
    },
    
    // NEW: Clear price change flags
    clearPriceChangeFlags: () => {
      set((state) => ({
        items: state.items.map(item => ({
          ...item,
          priceChanged: false,
          oldPrice: undefined
        }))
      }));
    },

    // LOCAL-ONLY: Add item to cart (no backend sync)
    addItem: async (item: MenuItem, variant: any, quantity: number, customizations?: CartCustomization[], orderMode?: OrderMode, notes?: string) => {
      const currentMode = get().currentOrderMode;
      const finalMode = orderMode || currentMode || 'collection';

      // Calculate price based on order mode
      const price = getPriceForMode(
        finalMode,
        item.priceDelivery ?? variant?.priceDelivery ?? variant?.price_delivery,
        item.priceTakeaway ?? item.priceCollection ?? variant?.price,
        variant?.price ?? item.basePrice ?? item.price ?? 0
      );

      // Create cart item with camelCase properties
      const cartItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menuItemId: item.id,
        name: item.name,
        description: item.description || '',
        price: price,
        priceDelivery: item.priceDelivery ?? variant?.priceDelivery ?? variant?.price_delivery,
        priceCollection: item.priceTakeaway ?? item.priceCollection ?? variant?.price,
        quantity: quantity,
        variant: variant ? {
          id: variant.id,
          name: variant.name || variant.variantName || variant.variant_name || 'Standard'
        } : undefined,
        customizations: customizations || [],
        notes: notes || '',
        imageUrl: item.imageUrl,
        orderMode: finalMode
      };

      // Add to cart using set
      set((state) => {
        const newItems = [...state.items, cartItem];
        return {
          items: newItems,
          totalItems: calculateTotalItems(newItems),
          totalAmount: calculateTotalAmount(newItems),
          lastSavedAt: Date.now()
        };
      });

      // Show toast notification
      const variantText = variant?.name && variant.name !== 'Standard' ? ` (${variant.name})` : '';
      const quantityText = quantity > 1 ? `${quantity}x ` : '';
      toast.success(`${quantityText}${item.name}${variantText} added to cart`);

      // Track analytics (only for delivery/collection modes)
      if (finalMode !== 'dine-in') {
        trackItemAdded(item.id, item.name, price, finalMode as 'delivery' | 'collection', 'menu');
      }
    },
    
    // ✅ LOCAL-ONLY: Remove item from cart (no backend sync)
    removeItem: async (itemId: string) => {
      const item = get().items.find(i => i.id === itemId);

      if (!item) {
        toast.error('Item not found in cart');
        return;
      }


      // Update local state
      set((state) => {
        const newItems = state.items.filter(i => i.id !== itemId);
        return {
          items: newItems,
          totalItems: calculateTotalItems(newItems),
          totalAmount: calculateTotalAmount(newItems),
          lastSavedAt: Date.now()
        };
      });

      // Show toast notification
      toast.success(`${item.name} removed from cart`);

      // Track analytics
      trackItemRemoved(item.menuItemId, item.name, 'user_action');
    },

    // Debounced version for rapid clicking
    updateQuantityDebounced: (itemId: string, quantity: number) => {
      if (quantityUpdateTimeout) {
        clearTimeout(quantityUpdateTimeout);
      }

      // Update UI immediately (optimistic)
      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        ),
      }));

      // Debounce removal for quantity < 1
      quantityUpdateTimeout = setTimeout(() => {
        if (quantity < 1) {
          get().removeItem(itemId);
        }
      }, QUANTITY_UPDATE_DEBOUNCE);
    },

    // ✅ LOCAL-ONLY: Clear cart (no backend sync)
    clearCart: async () => {
      const state = get();

      // Track analytics before clearing
      if (state.items.length > 0) {
        trackCartCleared('user_action', state.totalAmount);
      }


      // Clear frontend state
      set({
        items: [],
        totalItems: 0,
        totalAmount: 0,
        lastSavedAt: undefined
      });

      toast.success('Cart cleared');
    },
    
    // ✅ PHASE 4.1b: Cart is managed locally via Zustand persistence
    // No backend sync needed - cart state persists in localStorage
    fetchCartFromSupabase: async () => {
      // Cart is managed locally - no backend sync needed
      // State is already persisted via Zustand's persist middleware
    },
    
    // NEW: Get formatted cart summary for AI context
    getFormattedSummary: () => {
      const state = get();
      
      if (state.items.length === 0) {
        return "Cart is empty.";
      }
      
      const itemsList = state.items.map(item => {
        const variantText = item.variant?.name && item.variant.name !== 'Standard' ? ` (${item.variant.name})` : '';
        const customizationsText = item.customizations && item.customizations.length > 0
          ? ` [${item.customizations.map(c => c.name).join(', ')}]`
          : '';
        const notesText = item.notes ? ` - Note: ${item.notes}` : '';
        
        return `• ${item.quantity}x ${item.name}${variantText}${customizationsText} (£${item.price.toFixed(2)})${notesText}`;
      }).join('\n');
      
      const total = state.totalAmount.toFixed(2);
      const count = state.totalItems;
      const mode = state.currentOrderMode;
      
      return `Current cart (${count} item${count !== 1 ? 's' : ''}, ${mode}):\n${itemsList}\n\nTotal: £${total}`;
    },

    setCartFromAI: (backendCartItems: any[], totalAmount: number, orderMode: 'delivery' | 'collection') => {
      const currentMode = get().currentOrderMode;
      const finalMode = orderMode || currentMode;
      
      // Map backend cart items to frontend CartItem format
      const newItems: CartItem[] = backendCartItems.map((item: any) => ({
        id: item.id || `cart_${Date.now()}_${Math.random()}`,
        menuItemId: item.menu_item_id || item.menuItemId,
        name: item.name,
        description: item.description,
        price: item.price,
        price_delivery: item.price_delivery,
        price_collection: item.price_collection,
        quantity: item.quantity,
        variant: item.variant_id ? {
          id: item.variant_id,
          name: item.variant_name || 'Standard',
          price: item.price
        } : undefined,
        customizations: item.customizations || [],
        image_url: item.image_url,
        notes: item.notes,
        orderMode: finalMode
      }));
      
      const newTotalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const newTotalAmount = totalAmount || newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      set((state) => {
        // Track analytics for cart replacement
        if (state.items.length > 0) {
          trackCartCleared('user_action', state.totalAmount);
        }

        return {
          items: newItems,
          totalItems: newTotalItems,
          totalAmount: newTotalAmount,
          lastSavedAt: Date.now()
        };
      });
    },

    migrateGuestCartToUser: async (userId: string) => {
      const currentUserId = get().userId;
      const currentItems = get().items;
      const currentMode = get().currentOrderMode;
      const currentLastSavedAt = get().lastSavedAt;

      if (currentUserId === userId) {
        return;
      }

      if (currentItems.length === 0) {
        return;
      }


      // Update user ID in state
      set({ userId });

      // Optional: Save cart to backend
      try {
        await get().saveCartToBackend(userId);
      } catch (error) {
        console.error('Failed to save cart to backend:', error);
      }

      // Optional: Clear cart if needed
      // set({ items: [], totalItems: 0, totalAmount: 0, lastSavedAt: undefined });
    },

    saveCartToBackend: async (userId: string) => {
      const currentUserId = get().userId;
      const currentItems = get().items;
      const currentMode = get().currentOrderMode;
      const currentLastSavedAt = get().lastSavedAt;

      if (currentUserId !== userId) {
        return;
      }

      if (currentItems.length === 0) {
        return;
      }


      // Optional: Save cart to backend
      try {
        // await saveCartToBackend(userId, currentItems, currentMode, currentLastSavedAt);
      } catch (error) {
        console.error('Failed to save cart to backend:', error);
      }
    },

    // ✅ PHASE 5e: Implement real-time subscription lifecycle methods
    initRealtimeSubscription: () => {
      const { sessionId } = get();
      if (sessionId) {
        initCartRealtimeSubscription(sessionId, set, get);
      }
    },
    
    cleanupRealtimeSubscription: () => {
      cleanupCartSubscription();
    }
  }),
  {
    name: 'cottage-tandoori-cart',
    version: CART_SCHEMA_VERSION,
    migrate: (persistedState: any, version: number) => {

      if (version < 2) {
        // v1 → v2: Convert image_url to image_asset_id
        if (persistedState?.items) {
          persistedState.items = persistedState.items.map((item: any) => {
            if (item.image_url && !item.image_asset_id) {
              const { image_url, ...rest } = item;
              return {
                ...rest,
                image_asset_id: null
              };
            }
            return item;
          });
        }
      }

      if (version < 3) {
        // v2 → v3: Add price_delivery and price_collection
        if (persistedState?.items) {
          persistedState.items = persistedState.items.map((item: any) => ({
            ...item,
            price_delivery: item.price,
            price_collection: item.price
          }));
        }
      }
      
      if (version < 4) {
        // v3 → v4: ✅ Parse JSONB fields (customizations, extras_selected)
        if (persistedState?.items) {
          
          persistedState.items = persistedState.items.map((item: any) => {
            const parsed = { ...item };
            
            // Parse customizations if it's a string
            if (typeof item.customizations === 'string') {
              try {
                parsed.customizations = JSON.parse(item.customizations);
              } catch (e) {
                parsed.customizations = [];
              }
            }
            
            // Parse extras_selected if it's a string
            if (typeof item.extras_selected === 'string') {
              try {
                parsed.extras_selected = JSON.parse(item.extras_selected);
              } catch (e) {
                parsed.extras_selected = [];
              }
            }
            
            // Ensure arrays exist (fallback to empty arrays)
            parsed.customizations = parsed.customizations || [];
            parsed.extras_selected = parsed.extras_selected || [];
            
            return parsed;
          });
          
        }
      }
      
      if (version < 5) {
        // v4 → v5: ✅ Comprehensive JSONB parsing for all cart items
        // This fixes items that were already at v4 but still have unparsed JSONB strings
        if (persistedState?.items) {
          
          persistedState.items = persistedState.items.map((item: any) => {
            const parsed = { ...item };
            
            // Parse customizations if it's a string
            if (typeof item.customizations === 'string') {
              try {
                parsed.customizations = JSON.parse(item.customizations);
              } catch (e) {
                parsed.customizations = [];
              }
            }
            
            // Parse variant if it's a string
            if (typeof item.variant === 'string') {
              try {
                parsed.variant = JSON.parse(item.variant);
              } catch (e) {
                parsed.variant = undefined;
              }
            }
            
            // Parse extras_selected if it's a string
            if (typeof item.extras_selected === 'string') {
              try {
                parsed.extras_selected = JSON.parse(item.extras_selected);
              } catch (e) {
                parsed.extras_selected = [];
              }
            }
            
            // Ensure arrays exist (fallback to empty arrays)
            parsed.customizations = parsed.customizations || [];
            parsed.extras_selected = parsed.extras_selected || [];
            
            return parsed;
          });
          
        }
      }
      
      return persistedState as CartState;
    },
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        return;
      }
      
      if (!state?.items || state.items.length === 0) {
        return;
      }
      
      // ✅ SAFETY NET: Apply JSONB parsing on every rehydration
      // This handles cases where localStorage has unparsed JSONB even at current version
      
      let needsParsing = false;
      const parsedItems = state.items.map((item: any) => {
        let parsed = { ...item };
        let itemNeedsParsing = false;
        
        // Parse customizations if it's a string
        if (typeof item.customizations === 'string') {
          try {
            parsed.customizations = JSON.parse(item.customizations);
            itemNeedsParsing = true;
          } catch (e) {
            parsed.customizations = [];
          }
        }
        
        // Parse variant if it's a string
        if (typeof item.variant === 'string') {
          try {
            parsed.variant = JSON.parse(item.variant);
            itemNeedsParsing = true;
          } catch (e) {
            parsed.variant = undefined;
          }
        }
        
        // Parse extras_selected if it's a string
        if (typeof item.extras_selected === 'string') {
          try {
            parsed.extras_selected = JSON.parse(item.extras_selected);
            itemNeedsParsing = true;
          } catch (e) {
            parsed.extras_selected = [];
          }
        }
        
        // Ensure arrays exist
        parsed.customizations = parsed.customizations || [];
        parsed.extras_selected = parsed.extras_selected || [];
        
        if (itemNeedsParsing) needsParsing = true;
        return parsed;
      });
      
      // ✅ CRITICAL: Update state properly to trigger re-renders
      if (needsParsing) {
        useCartStore.setState({ items: parsedItems });
      } else {
      }
      
      // ✅ NEW (MYA-1552): Validate userId against actual auth state
      if (state && state.userId) {
        // Check if user is actually authenticated
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user) {
            // User is NOT authenticated but localStorage has userId - clear it
            
            useCartStore.setState({ userId: null });
            
          } else if (session.user.id !== state.userId) {
            // Different user logged in - clear old userId
            
            useCartStore.setState({ userId: session.user.id });
            
          } else {
          }
        }).catch((error) => {
          console.error(' [CartStore] Failed to validate auth state:', error);
        });
      }
    },
  }
));

// ❌ TEMPORARILY DISABLED (Stabilization): Real-time subscription initialization
// Will re-enable after JSONB parsing issue is resolved
/*
// ✅ PHASE 5f: Reactive subscription initialization
// Watch for sessionId changes and auto-initialize subscription
let isSubscriptionInitialized = false;
let previousSessionId: string | null = null;

useCartStore.subscribe((state) => {
  const currentSessionId = state.sessionId;
  
  // Initialize subscription when sessionId becomes available
  if (!isSubscriptionInitialized && currentSessionId && currentSessionId !== previousSessionId) {
    
    // Get set and get from store
    const store = useCartStore;
    initCartRealtimeSubscription(currentSessionId, store.setState, store.getState);
    
    isSubscriptionInitialized = true;
  }
  
  previousSessionId = currentSessionId;
});

// ✅ PHASE 5g: Also check immediately if sessionId already exists (from localStorage)
// This handles the case where store initializes with sessionId already present
const initialState = useCartStore.getState();
if (!isSubscriptionInitialized && initialState.sessionId) {
  const store = useCartStore;
  initCartRealtimeSubscription(initialState.sessionId, store.setState, store.getState);
  isSubscriptionInitialized = true;
  previousSessionId = initialState.sessionId;
}

// ✅ Cleanup subscription on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (isSubscriptionInitialized) {
      cleanupCartSubscription();
    }
  });
}
*/

// Optimized selectors for components to subscribe to specific slices
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartTotal = () => useCartStore((state) => {
  const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return subtotal;
});
export const useCartItemCount = () => useCartStore((state) => 
  state.items.reduce((sum, item) => sum + item.quantity, 0)
);
export const useOrderMode = () => useCartStore((state) => state.currentOrderMode);

// ✅ Subscription initialization is now handled by onRehydrateStorage hook (see persist config above)
