import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apiClient } from 'app';
import { toast } from 'sonner';

// Voice Cart Item interface
export interface VoiceCartItem {
  id?: string;
  menu_item_id: string;
  menu_item_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  special_instructions?: string;
  description?: string;
  image_url?: string;
  addedByVoice?: boolean;
}

// Voice Search Result interface
export interface VoiceSearchResult {
  menu_item_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  confidence: number;
}

// Customer Profile interface
export interface VoiceCustomerProfile {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  isAuthenticated: boolean;
  userId?: string;
}

/**
 * OrderType for voice cart (subset of order types for voice ordering)
 * NOTE: This is different from the canonical OrderType in masterTypes.ts
 * Voice ordering only supports delivery and collection
 */
export type OrderType = 'delivery' | 'collection';

// Voice Cart State
interface VoiceCartState {
  // Session Management
  sessionId: string | null;
  sessionActive: boolean;
  sessionStartTime: Date | null;
  timeRemaining: number; // in seconds
  
  // Cart Items
  items: VoiceCartItem[];
  total: number;
  
  // Voice Search Results
  searchResults: VoiceSearchResult[];
  isSearching: boolean;
  lastSearchTerm: string;
  
  // Customer Profile
  customerProfile: VoiceCustomerProfile;
  orderType: OrderType;
  
  // UI State
  showSearchResults: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  setSessionId: (sessionId: string | null) => void;
  setSessionActive: (active: boolean) => void;
  setTimeRemaining: (time: number) => void;
  setCustomerProfile: (profile: Partial<VoiceCustomerProfile>) => void;
  setOrderType: (type: OrderType) => void;
  
  // Cart Actions
  addItem: (item: VoiceCartItem) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Voice Search Actions
  setSearchResults: (results: VoiceSearchResult[]) => void;
  clearSearchResults: () => void;
  setShowSearchResults: (show: boolean) => void;
  performItemLookup: (searchTerm: string) => Promise<void>;
  
  // API Integration
  refreshFromTools: (sessionId: string, userId?: string) => Promise<void>;
  addToCartViaTools: (itemCode: string, quantity: number, userId?: string) => Promise<void>;
  
  // Session Management
  initializeSession: (userId?: string) => Promise<string>;
  endSession: () => void;
}

// Create Voice Cart Store
export const useVoiceCartStore = create<VoiceCartState>()(subscribeWithSelector((set, get) => ({
  // Initial State
  sessionId: null,
  sessionActive: false,
  sessionStartTime: null,
  timeRemaining: 300, // 5 minutes
  
  items: [],
  total: 0,
  
  searchResults: [],
  isSearching: false,
  lastSearchTerm: '',
  
  customerProfile: {
    isAuthenticated: false,
  },
  orderType: 'collection',
  
  showSearchResults: false,
  isProcessing: false,
  error: null,
  
  // Session Actions
  setSessionId: (sessionId) => set({ sessionId }),
  setSessionActive: (active) => set({ sessionActive: active }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setCustomerProfile: (profile) => set(state => ({ 
    customerProfile: { ...state.customerProfile, ...profile } 
  })),
  setOrderType: (type) => set({ orderType: type }),
  
  // Cart Actions
  addItem: (item) => set(state => {
    const existingItemIndex = state.items.findIndex(
      existing => existing.menu_item_id === item.menu_item_id && 
                 existing.variant_id === item.variant_id
    );
    
    let newItems;
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      newItems = [...state.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + item.quantity
      };
    } else {
      // Add new item
      newItems = [...state.items, { ...item, id: `voice-${Date.now()}-${Math.random()}` }];
    }
    
    const newTotal = newItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    
    return { items: newItems, total: newTotal };
  }),
  
  removeItem: (itemId) => set(state => {
    const newItems = state.items.filter(item => item.id !== itemId);
    const newTotal = newItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    return { items: newItems, total: newTotal };
  }),
  
  updateItemQuantity: (itemId, quantity) => set(state => {
    if (quantity <= 0) {
      return get().removeItem(itemId) as any;
    }
    
    const newItems = state.items.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    const newTotal = newItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    
    return { items: newItems, total: newTotal };
  }),
  
  clearCart: () => set({ items: [], total: 0 }),
  
  // Voice Search Actions
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearchResults: () => set({ searchResults: [], showSearchResults: false }),
  setShowSearchResults: (show) => set({ showSearchResults: show }),
  
  performItemLookup: async (searchTerm: string) => {
    set({ isSearching: true, lastSearchTerm: searchTerm, error: null });
    
    try {
      const response = await apiClient.item_lookup_tool({
        search_term: searchTerm,
        session_id: get().sessionId || undefined,
        user_id: get().customerProfile.userId
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const searchResults: VoiceSearchResult[] = result.data.map((item: any) => ({
          menu_item_id: item.menu_item_id || item.id,
          name: item.name,
          description: item.description,
          price: item.price || item.unit_price || 0,
          image_url: item.image_url,
          category: item.category,
          confidence: item.confidence || 0.8
        }));
        
        set({ 
          searchResults, 
          showSearchResults: searchResults.length > 0,
          isSearching: false 
        });
        
        if (searchResults.length > 0) {
          toast.success(`Found ${searchResults.length} items for "${searchTerm}"`);
        } else {
          toast.info(`No items found for "${searchTerm}"`);
        }
      } else {
        throw new Error(result.message || 'Search failed');
      }
    } catch (error) {
      console.error('❌ Voice search failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Search failed',
        isSearching: false,
        showSearchResults: false 
      });
      toast.error('Search failed', {
        description: 'Please try a different search term'
      });
    }
  },
  
  // API Integration
  refreshFromTools: async (sessionId: string, userId?: string) => {
    try {
      const response = await apiClient.get_cart_tool({
        session_id: sessionId,
        user_id: userId
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const items: VoiceCartItem[] = result.data.items?.map((item: any) => ({
          id: `voice-${item.menu_item_id}-${Date.now()}`,
          menu_item_id: item.menu_item_id,
          menu_item_name: item.name,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          special_instructions: item.special_instructions,
          description: item.description,
          image_url: item.image_url,
          addedByVoice: true
        })) || [];
        
        const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        
        set({ items, total });
        
        // Update customer profile if available
        if (result.data.user_authenticated && result.data.user_name) {
          set(state => ({
            customerProfile: {
              ...state.customerProfile,
              name: result.data.user_name,
              isAuthenticated: true,
              userId: userId
            }
          }));
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh voice cart:', error);
      set({ error: error instanceof Error ? error.message : 'Refresh failed' });
    }
  },
  
  addToCartViaTools: async (itemCode: string, quantity: number, userId?: string) => {
    const sessionId = get().sessionId;
    if (!sessionId) {
      throw new Error('No active voice session');
    }
    
    set({ isProcessing: true, error: null });
    
    try {
      const response = await apiClient.add_to_cart_tool({
        session_id: sessionId,
        item_code: itemCode,
        quantity,
        user_id: userId
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh cart from tools to get updated state
        await get().refreshFromTools(sessionId, userId);
        toast.success('Item added to voice cart');
      } else {
        throw new Error(result.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('❌ Failed to add to voice cart:', error);
      set({ error: error instanceof Error ? error.message : 'Add to cart failed' });
      throw error;
    } finally {
      set({ isProcessing: false });
    }
  },
  
  // Session Management
  initializeSession: async (userId?: string) => {
    try {
      const sessionId = `voice-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      set({ 
        sessionId,
        sessionActive: true,
        sessionStartTime: new Date(),
        timeRemaining: 300,
        items: [],
        total: 0,
        error: null
      });
      
      if (userId) {
        set(state => ({
          customerProfile: {
            ...state.customerProfile,
            userId,
            isAuthenticated: true
          }
        }));
      }
      
      console.log('✅ Voice cart session initialized:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to initialize voice session:', error);
      throw error;
    }
  },
  
  endSession: () => {
    set({
      sessionId: null,
      sessionActive: false,
      sessionStartTime: null,
      timeRemaining: 300,
      items: [],
      total: 0,
      searchResults: [],
      showSearchResults: false,
      isProcessing: false,
      error: null,
      customerProfile: { isAuthenticated: false },
      orderType: 'collection'
    });
    
    console.log('🔚 Voice cart session ended');
  }
})));

// Helper function to format time remaining
export const formatTimeRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
