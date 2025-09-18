import { create } from 'zustand';
import { cottageAPI, type MenuItem, type ApiResponse } from '../utils/api-client';

interface MenuStore {
  // State
  menuItems: MenuItem[];
  categories: string[];
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMenuItems: () => Promise<void>;
  loadMenuItemsByCategory: (category: string) => Promise<void>;
  setSelectedCategory: (category: string | null) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  // Computed getters
  getAvailableItems: () => MenuItem[];
  getItemsByCategory: (category: string) => MenuItem[];
  getCategoryCount: (category: string) => number;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  // Initial state
  menuItems: [],
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,

  // Load all menu items
  loadMenuItems: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await cottageAPI.getMenuItems();

      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      const items = response.data || [];
      const categories = [...new Set(items.map(item => item.category))];

      set({ 
        menuItems: items, 
        categories,
        isLoading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load menu items',
        isLoading: false 
      });
    }
  },

  // Load items by category
  loadMenuItemsByCategory: async (category: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await cottageAPI.getMenuItemsByCategory(category);

      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }

      const items = response.data || [];

      set({ 
        menuItems: items,
        selectedCategory: category,
        isLoading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load category items',
        isLoading: false 
      });
    }
  },

  // Set selected category filter
  setSelectedCategory: (category: string | null) => {
    set({ selectedCategory: category });
  },

  // Update existing menu item
  updateMenuItem: async (id: string, updates: Partial<MenuItem>) => {
    try {
      const response = await cottageAPI.updateMenuItem(id, updates);

      if (response.error) {
        set({ error: response.error });
        return;
      }

      const updatedItem = response.data;
      if (updatedItem) {
        set(state => ({
          menuItems: state.menuItems.map(item => 
            item.id === id ? { ...item, ...updates } : item
          ),
          error: null
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update menu item'
      });
    }
  },

  // Add new menu item (placeholder - would need create endpoint)
  addMenuItem: async (item: Omit<MenuItem, 'id'>) => {
    try {
      // Generate temporary ID for now
      const newItem: MenuItem = {
        ...item,
        id: Date.now().toString()
      };

      set(state => ({
        menuItems: [...state.menuItems, newItem],
        categories: [...new Set([...state.categories, item.category])],
        error: null
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add menu item'
      });
    }
  },

  // Delete menu item (placeholder)
  deleteMenuItem: async (id: string) => {
    try {
      set(state => ({
        menuItems: state.menuItems.filter(item => item.id !== id),
        error: null
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete menu item'
      });
    }
  },

  // Computed: Get only available items
  getAvailableItems: () => {
    return get().menuItems.filter(item => item.available);
  },

  // Computed: Get items by category
  getItemsByCategory: (category: string) => {
    return get().menuItems.filter(item => item.category === category);
  },

  // Computed: Count items in category
  getCategoryCount: (category: string) => {
    return get().menuItems.filter(item => item.category === category).length;
  }
}));

// Export hook for easy access
export default useMenuStore;
