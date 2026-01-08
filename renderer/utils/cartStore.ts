import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { MenuItem } from 'utils/menuTypes';
import { trackItemAdded, trackItemRemoved, trackModeSwitch, trackCartCleared } from './cartAnalytics';
import { getOrCreateSessionId } from './session-manager';
import { supabase } from './supabaseClient';
import { apiClient } from 'app';
import { initCartRealtimeSubscription, cleanupCartSubscription } from './cartRealtimeSubscription';

// ✅ PHASE 5g: Define isDev at module level for reactive subscription
const isDev = import.meta.env.DEV;

// ✅ Cart schema version - increment when CartItem structure changes
const CART_SCHEMA_VERSION = 5; // ✅ Incremented from 4 to trigger migration for JSONB parsing

// ✅ Local type definition for cart customization
// Defined locally to avoid importing from excluded TypeScript files
export interface CartCustomization {
  /** Customization ID */
  id: string;
  /** Customization name */
  name: string;
  /** Customization price */
  price: number;
  /** Customization group (optional) */
  group?: string | null;
}

// ✅ REMOVED (Phase 2): Obsolete backend sync infrastructure
// - CartSubscriptionState interface
// - subscriptionState variable
// - initCartSubscription() function
// - cleanupCartSubscription() function
// - syncCartToBackend() function
// - mapBackendItemToCartItem() function
// All cart operations now happen directly in frontend via useCartStore

// ✅ NEW (MYA-1535): Helper function to map frontend CartItem to backend format
const mapCartItemToBackend = (cartItem: CartItem): any => {
  return {
    id: cartItem.id,
    menuItemId: cartItem.menuItemId,
    name: cartItem.name,
    description: cartItem.description,
    price: cartItem.price,
    price_delivery: cartItem.price_delivery,
    price_collection: cartItem.price_collection,
    quantity: cartItem.quantity,
    variantId: cartItem.variant?.id,
    variantName: cartItem.variant?.name,
    customizations: cartItem.customizations || [],
    image_url: cartItem.image_url,
    notes: cartItem.notes || '',
    orderMode: cartItem.orderMode || 'collection'
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
      icon: '📱',
    });
  });
}

// NEW: Process queued operations when back online
const processOfflineQueue = async () => {
  if (offlineQueue.length === 0) return;
  
  console.log('🔄 Processing', offlineQueue.length, 'queued cart operations...');
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
      console.log(`Retry attempt ${attempt}/${maxAttempts} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
};

// ✅ NEW: Helper function to get correct price for current mode
const getPriceForMode = (
  mode: 'delivery' | 'collection',
  priceDelivery?: number,
  priceCollection?: number,
  fallbackPrice?: number
): number => {
  if (mode === 'delivery') {
    return priceDelivery ?? priceCollection ?? fallbackPrice ?? 0;
  } else {
    return priceCollection ?? fallbackPrice ?? 0;
  }
};

// ✅ NEW: Helper function to calculate total number of items
const calculateTotalItems = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

// ✅ NEW: Helper function to calculate total cart amount
const calculateTotalAmount = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

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
        console.warn('Failed to parse customizations:', e);
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
        console.warn('Failed to parse variant:', e);
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
    price: calculatedPrice, // ✅ Use calculated price instead of rawItem.price
    price_delivery: priceDelivery,
    price_collection: priceCollection,
    quantity: rawItem.quantity || 1,
    variant,
    variant_name: rawItem.variant_name, // ✅ FIX #1: Read variant_name from database
    customizations,
    image_url: rawItem.image_url,
    notes: rawItem.notes,
    orderMode: rawItem.order_mode || 'collection'
  };
};

// Debounce helper
let quantityUpdateTimeout: NodeJS.Timeout | null = null;
const QUANTITY_UPDATE_DEBOUNCE = 300; // ms

interface CartStore {
  items: CartItem[];
  orderMode: 'DELIVERY' | 'COLLECTION';
  // ... existing properties ...
  
  // Existing methods
  addItem: (item: CartItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateQuantityDebounced: (itemId: string, quantity: number) => void; // NEW
  removeItem: (itemId: string) => void;
  // ... rest of existing methods ...
}

export interface CartState {
  // ... existing properties ...
  
  // ✅ NEW: Real-time subscription management
  initRealtimeSubscription: () => void;
  cleanupRealtimeSubscription: () => void;
  
  // ... existing methods ...
}

// ✅ Re-export CartCustomization for components that need it
export type { CartCustomization };

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  price: number;
  price_delivery?: number;
  price_collection?: number;
  quantity: number;
  variant?: any;
  variant_name?: string | null; // ✅ FIX #1: Add variant_name field from database
  customizations?: CartCustomization[];
  image_url?: string | null;
  notes?: string;
  orderMode: 'delivery' | 'collection';
}

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
    
    // ✅ NEW (MYA-1564): Chat cart drawer actions (ChatLargeModal only)
    openChatCart: () => {
      set({ 
        isChatCartOpen: true,
        isCartOpen: false // Mutual exclusivity: close OnlineOrders sidebar
      });
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
      console.log('🛒 Global cart drawer toggled to:', !isOpen);
    },
    
    // NEW: Set order mode
    setOrderMode: (mode: 'delivery' | 'collection') => {
      const prevMode = get().currentOrderMode;
      set({ currentOrderMode: mode, lastSavedAt: new Date().toISOString() });
      console.log('🛒 CartStore order mode changed to:', mode);
      
      // Track analytics if mode actually changed
      if (prevMode !== mode) {
        const state = get();
        trackModeSwitch(prevMode, mode, state.totalAmount, state.totalItems);
      }
    },
    
    // NEW: Update prices based on order mode (simplified - marks items as potentially changed)
    updatePricesForMode: (newMode: 'delivery' | 'collection') => {
      set((state) => {
        const updatedItems = state.items.map(item => {
          // Calculate the correct price for the new mode
          const newPrice = getPriceForMode(
            newMode,
            item.price_delivery,
            item.price_collection,
            item.price // fallback to current price if no mode-specific pricing
          );
          
          // Check if price actually changed
          const didPriceChange = Math.abs(newPrice - item.price) > 0.01;
          
          return {
            ...item,
            price: newPrice, // ✅ ACTUALLY UPDATE THE PRICE
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

    // ✅ FIXED: Implementation matches OnlineOrders calls
    addItem: async (item: MenuItem, variant: any, quantity: number, customizations?: CartCustomization[], orderMode?: 'delivery' | 'collection', notes?: string) => {
      const currentMode = get().currentOrderMode;
      // ✅ FIX: Ensure finalMode is never undefined - default to 'collection'
      const finalMode = orderMode || currentMode || 'collection';
      const { userId, sessionId } = get();
      
      // ✅ DIAGNOSTIC: Log what we're receiving
      console.log('🛒 [CART DEBUG] addItem called:', {
        itemName: item.name,
        variantReceived: variant,
        variantName: variant?.name,
        variantVariantName: variant?.variant_name,
        quantity,
        userId,
        sessionId
      });
      
      try {
        // ✅ WRITE TO SUPABASE FIRST (single source of truth)
        console.log('📤 Writing to Supabase cart table...');
        
        // ✅ DIAGNOSTIC: Log exact payload before sending
        const payload = {
          item_name: item.name,
          quantity: quantity,
          variant_id: variant?.id || null,
          customizations: customizations || [],
          notes: notes || null,
          order_mode: finalMode,
          // ✅ FIX: Enforce EITHER/OR constraint - send ONLY user_id OR session_id
          user_id: userId || undefined,
          session_id: userId ? undefined : (sessionId || undefined)
        };
        console.log('📦 [CART DEBUG] Exact payload being sent to backend:', JSON.stringify(payload, null, 2));
        console.log('🔍 [CART DEBUG] order_mode value:', finalMode, 'type:', typeof finalMode);
        
        const response = await apiClient.add_item_to_cart(payload);
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Item added to Supabase:', result.message);
          
          // Show toast notification
          const variantText = variant?.name && variant.name !== 'Standard' ? ` (${variant.name})` : '';
          const quantityText = quantity > 1 ? `${quantity}x ` : '';
          toast.success(`${quantityText}${item.name}${variantText} added to cart`);
          
          // ✅ Refresh cart from Supabase (real-time sync will handle this in Phase 5)
          // For now, manually refresh to get latest state
          await get().fetchCartFromSupabase();
          
          // Track analytics
          trackItemAdded(
            item.id,
            item.name,
            result.item?.price || 0,
            finalMode,
            'menu'
          );
        } else {
          toast.error(result.message || 'Failed to add item to cart');
        }
      } catch (error) {
        console.error('❌ Failed to add item to cart:', error);
        toast.error('Failed to add item to cart');
      }
    },
    
    removeItem: async (itemId: string) => {
      // Get item details before removing for analytics
      const item = get().items.find(i => i.id === itemId);
      
      if (!item) {
        toast.error('Item not found in cart');
        return;
      }

      try {
        // Get session ID
        const sessionId = getOrCreateSessionId();
        
        // ✅ DEBUG: Log exact payload being sent
        console.log('🔍 [CART REMOVAL DEBUG] Starting removal...');
        console.log('  itemId:', itemId, 'type:', typeof itemId);
        console.log('  sessionId:', sessionId, 'type:', typeof sessionId);
        console.log('  item.id:', item.id, 'type:', typeof item.id);
        console.log('  Payload:', JSON.stringify({ cart_item_id: itemId, session_id: sessionId }, null, 2));
        
        // Call backend to remove from Supabase
        const response = await apiClient.remove_item_from_cart({
          cart_item_id: itemId.toString(), // ✅ FIX #11: Convert to string for backend validation
          session_id: sessionId
        });
        
        console.log('🔍 [CART REMOVAL DEBUG] Response status:', response.status);
        console.log('🔍 [CART REMOVAL DEBUG] Response headers:', response.headers);
        
        const result = await response.json();
        console.log('🔍 [CART REMOVAL DEBUG] Response body:', result);
        
        if (result.success) {
          // Show toast notification
          toast.success(`${item.name} removed from cart`);
          
          // Refresh cart from Supabase
          await get().fetchCartFromSupabase();
          
          // Track analytics
          trackItemRemoved(item.menuItemId, item.name, 'user_action');
        } else {
          toast.error(result.message || 'Failed to remove item');
        }
      } catch (error) {
        console.error('❌ [CART REMOVAL DEBUG] Exception caught:', error);
        console.error('❌ [CART REMOVAL DEBUG] Error details:', JSON.stringify(error, null, 2));
        toast.error('Failed to remove item from cart');
      }
    },
    
    updateItemQuantity: (itemId: string, quantity: number) => {
      set((state) => {
        let newItems;
        if (quantity <= 0) {
          newItems = state.items.filter(item => item.id !== itemId);
        } else {
          newItems = state.items.map(item => 
            item.id === itemId ? { ...item, quantity } : item
          );
        }
        
        return {
          items: newItems,
          totalItems: calculateTotalItems(newItems),
          totalAmount: calculateTotalAmount(newItems),
          lastSavedAt: new Date().toISOString() // NEW
        };
      });
    },

    // NEW: Update item notes/special instructions
    updateItemNotes: (itemId: string, notes: string) => {
      set((state) => {
        const newItems = state.items.map(item => 
          item.id === itemId ? { ...item, notes } : item
        );
        
        return {
          items: newItems,
          lastSavedAt: new Date().toISOString()
        };
      });
    },

    // NEW: Comprehensive update method
    updateItem: (itemId: string, updates: Partial<Pick<CartItem, 'variant' | 'customizations' | 'quantity' | 'notes'>>) => {
      set((state) => {
        const newItems = state.items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        );
        
        return {
          items: newItems,
          lastSavedAt: new Date().toISOString()
        };
      });
    },

    // NEW: Debounced version for rapid clicking
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
      
      // Debounce analytics tracking
      quantityUpdateTimeout = setTimeout(() => {
        if (quantity < 1) {
          get().removeItem(itemId);
          return;
        }
        
        trackCartEvent('cart_item_quantity_changed', {
          item_id: itemId,
          new_quantity: quantity,
          order_mode: get().orderMode,
        });
      }, QUANTITY_UPDATE_DEBOUNCE);
    },
    
    clearCart: async () => {
      const state = get();
      const { sessionId, userId } = state;
      
      // Track analytics before clearing
      if (state.items.length > 0) {
        trackCartCleared('user_action', state.totalAmount);
      }
      
      // ✅ CRITICAL FIX: Clear from Supabase database first
      try {
        const response = await apiClient.clear_cart({ 
          // ✅ FIX: Enforce EITHER/OR constraint
          session_id: userId ? undefined : sessionId
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.error('Failed to clear cart from database:', result.message);
          toast.error('Failed to clear cart');
          return;
        }
      } catch (error) {
        console.error('Error clearing cart from database:', error);
        toast.error('Failed to clear cart');
        return;
      }
      
      // ✅ Clear frontend state after successful database clear
      set({ 
        items: [],
        totalItems: 0,
        totalAmount: 0,
        lastSavedAt: undefined
      });
      
      console.log('✅ Cart cleared from both database and frontend');
    },
    
    // ✅ PHASE 4.1b: Fetch cart from Supabase and update local state
    fetchCartFromSupabase: async () => {
      const { userId, sessionId } = get();
      
      try {
        const response = await apiClient.get_cart({
          // ✅ FIX: Enforce EITHER/OR constraint - send ONLY user_id OR session_id
          user_id: userId || undefined,
          session_id: userId ? undefined : sessionId
        });
        
        const cartData = await response.json();
        
        if (cartData.success) {
          // ✅ Parse JSONB fields from raw Supabase response
          const parsedItems = (cartData.items || []).map(parseCartItemFromSupabase);
          
          // Update local state
          set({
            items: parsedItems,
            totalItems: cartData.total_items || 0,
            totalAmount: cartData.total_amount || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      }
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
      
      console.log('🔄 Setting cart from AI:', {
        itemCount: newItems.length,
        totalItems: newTotalItems,
        totalAmount: newTotalAmount,
        mode: finalMode
      });
      
      set((state) => {
        // Track analytics for cart replacement
        if (state.items.length > 0) {
          trackCartCleared('user_action', state.totalAmount);
        }
        
        return { 
          items: newItems,
          totalItems: newTotalItems,
          totalAmount: newTotalAmount,
          currentOrderMode: finalMode,
          lastSavedAt: new Date().toISOString()
        };
      });
    },

    migrateGuestCartToUser: async (userId: string) => {
      const currentUserId = get().userId;
      const currentItems = get().items;
      const currentMode = get().currentOrderMode;
      const currentLastSavedAt = get().lastSavedAt;

      if (currentUserId === userId) {
        console.log('🛒 [CART DEBUG] migrateGuestCartToUser: User is already logged in.');
        return;
      }

      if (currentItems.length === 0) {
        console.log('🛒 [CART DEBUG] migrateGuestCartToUser: Cart is empty.');
        return;
      }

      console.log('🛒 [CART DEBUG] migrateGuestCartToUser: Migrating cart to user:', userId);

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
        console.log('🛒 [CART DEBUG] saveCartToBackend: User ID mismatch.');
        return;
      }

      if (currentItems.length === 0) {
        console.log('🛒 [CART DEBUG] saveCartToBackend: Cart is empty.');
        return;
      }

      console.log('🛒 [CART DEBUG] saveCartToBackend: Saving cart to backend for user:', userId);

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
      console.log(`🔄 [CartStore] Migrating from version ${version} to ${CART_SCHEMA_VERSION}`);
      
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
          console.log('🔄 [CartStore] Parsing JSONB fields during migration...');
          
          persistedState.items = persistedState.items.map((item: any) => {
            const parsed = { ...item };
            
            // Parse customizations if it's a string
            if (typeof item.customizations === 'string') {
              try {
                parsed.customizations = JSON.parse(item.customizations);
              } catch (e) {
                console.warn('⚠️ Failed to parse customizations:', e);
                parsed.customizations = [];
              }
            }
            
            // Parse extras_selected if it's a string
            if (typeof item.extras_selected === 'string') {
              try {
                parsed.extras_selected = JSON.parse(item.extras_selected);
              } catch (e) {
                console.warn('⚠️ Failed to parse extras_selected:', e);
                parsed.extras_selected = [];
              }
            }
            
            // Ensure arrays exist (fallback to empty arrays)
            parsed.customizations = parsed.customizations || [];
            parsed.extras_selected = parsed.extras_selected || [];
            
            return parsed;
          });
          
          console.log('✅ [CartStore] JSONB fields parsed successfully during migration');
        }
      }
      
      if (version < 5) {
        // v4 → v5: ✅ Comprehensive JSONB parsing for all cart items
        // This fixes items that were already at v4 but still have unparsed JSONB strings
        if (persistedState?.items) {
          console.log('🔄 [CartStore v4→v5] Applying comprehensive JSONB parsing...');
          
          persistedState.items = persistedState.items.map((item: any) => {
            const parsed = { ...item };
            
            // Parse customizations if it's a string
            if (typeof item.customizations === 'string') {
              try {
                parsed.customizations = JSON.parse(item.customizations);
                if (isDev) console.log('✅ Parsed customizations for item:', item.name);
              } catch (e) {
                console.warn('⚠️ Failed to parse customizations:', e);
                parsed.customizations = [];
              }
            }
            
            // Parse variant if it's a string
            if (typeof item.variant === 'string') {
              try {
                parsed.variant = JSON.parse(item.variant);
                if (isDev) console.log('✅ Parsed variant for item:', item.name);
              } catch (e) {
                console.warn('⚠️ Failed to parse variant:', e);
                parsed.variant = undefined;
              }
            }
            
            // Parse extras_selected if it's a string
            if (typeof item.extras_selected === 'string') {
              try {
                parsed.extras_selected = JSON.parse(item.extras_selected);
              } catch (e) {
                console.warn('⚠️ Failed to parse extras_selected:', e);
                parsed.extras_selected = [];
              }
            }
            
            // Ensure arrays exist (fallback to empty arrays)
            parsed.customizations = parsed.customizations || [];
            parsed.extras_selected = parsed.extras_selected || [];
            
            return parsed;
          });
          
          console.log('✅ [CartStore v4→v5] Comprehensive JSONB parsing complete');
        }
      }
      
      return persistedState as CartState;
    },
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.error('❌ [CartStore] Hydration error:', error);
        return;
      }
      
      if (!state?.items || state.items.length === 0) {
        return;
      }
      
      // ✅ SAFETY NET: Apply JSONB parsing on every rehydration
      // This handles cases where localStorage has unparsed JSONB even at current version
      console.log('🔄 [CartStore] Applying JSONB parsing on rehydration...');
      
      let needsParsing = false;
      const parsedItems = state.items.map((item: any) => {
        let parsed = { ...item };
        let itemNeedsParsing = false;
        
        // Parse customizations if it's a string
        if (typeof item.customizations === 'string') {
          try {
            parsed.customizations = JSON.parse(item.customizations);
            itemNeedsParsing = true;
            if (isDev) console.log('✅ Parsed customizations for:', item.name);
          } catch (e) {
            console.warn('⚠️ Failed to parse customizations:', e);
            parsed.customizations = [];
          }
        }
        
        // Parse variant if it's a string
        if (typeof item.variant === 'string') {
          try {
            parsed.variant = JSON.parse(item.variant);
            itemNeedsParsing = true;
            if (isDev) console.log('✅ Parsed variant for:', item.name);
          } catch (e) {
            console.warn('⚠️ Failed to parse variant:', e);
            parsed.variant = undefined;
          }
        }
        
        // Parse extras_selected if it's a string
        if (typeof item.extras_selected === 'string') {
          try {
            parsed.extras_selected = JSON.parse(item.extras_selected);
            itemNeedsParsing = true;
          } catch (e) {
            console.warn('⚠️ Failed to parse extras_selected:', e);
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
        console.log('✅ [CartStore] JSONB parsing applied, updating state...');
        useCartStore.setState({ items: parsedItems });
      } else {
        if (isDev) console.log('✅ [CartStore] No JSONB parsing needed');
      }
      
      // ✅ NEW (MYA-1552): Validate userId against actual auth state
      if (state && state.userId) {
        // Check if user is actually authenticated
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user) {
            // User is NOT authenticated but localStorage has userId - clear it
            console.log('⚠️ [CartStore] Found stale userId in localStorage without valid session');
            console.log('🧹 [CartStore] Clearing stale userId:', state.userId);
            
            useCartStore.setState({ userId: null });
            
            console.log('✅ [CartStore] Auth state validated and corrected');
          } else if (session.user.id !== state.userId) {
            // Different user logged in - clear old userId
            console.log('⚠️ [CartStore] UserId mismatch - session:', session.user.id, 'vs stored:', state.userId);
            console.log('🧹 [CartStore] Updating to current session userId');
            
            useCartStore.setState({ userId: session.user.id });
            
            console.log('✅ [CartStore] UserId synced with session');
          } else {
            console.log('✅ [CartStore] Auth state valid - userId matches session');
          }
        }).catch((error) => {
          console.error('❌ [CartStore] Failed to validate auth state:', error);
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
    if (isDev) console.log('🔔 CartStore: sessionId now available, initializing real-time subscription...', currentSessionId);
    
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
  if (isDev) console.log('🔔 CartStore: Existing sessionId detected on init, initializing subscription...', initialState.sessionId);
  const store = useCartStore;
  initCartRealtimeSubscription(initialState.sessionId, store.setState, store.getState);
  isSubscriptionInitialized = true;
  previousSessionId = initialState.sessionId;
}

// ✅ Cleanup subscription on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (isSubscriptionInitialized) {
      if (isDev) console.log('🧹 CartStore: Cleaning up subscription on unload');
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
export const useOrderMode = () => useCartStore((state) => state.orderMode);

// ✅ Subscription initialization is now handled by onRehydrateStorage hook (see persist config above)
