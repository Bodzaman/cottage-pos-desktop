import { create } from 'zustand';
import { apiClient } from 'app';
import { MediaAsset } from './mediaLibraryUtils';
import { HierarchicalMediaData } from './mediaHierarchyUtils';

// Tab types for media library navigation
export type MediaLibraryTab = 'menu-images' | 'ai-avatars' | 'general';

// Filter state for menu images
interface MenuImageFilters {
  selectedSectionId: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
}

// NEW: Unified filter state for sidebar filter system (Phase 1)
interface UnifiedFilters {
  // Asset type (replaces activeTab system)
  selectedAssetType: 'all' | 'menu-item' | 'ai-avatar' | 'general';
  
  // Image type filter (menu items only) - Phase 3 MYA-1476
  selectedImageType: 'all' | 'menu-item' | 'menu-item-variant';
  
  // Hierarchy filters (menu items only)
  selectedSectionId: string | null;
  selectedCategoryId: string | null;
  selectedMenuItemId?: string | null; // Phase 2
  
  // Status toggles
  showUncategorized: boolean;
  showLinked: boolean;
  showInUse: boolean;
  showMultiUse: boolean; // NEW: Phase 2 - Assets used in 2+ items
  showOrphaned: boolean; // NEW: Phase 2 - Linked to deleted/inactive items
  
  // Search query (Phase 2)
  searchQuery: string;
}

// NEW: Batch selection state
interface BatchSelectionState {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
}

// Upload state
interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  selectedAssetType: 'menu-item' | 'ai-avatar' | 'general';
  selectedSectionId: string | null;
  selectedCategoryId: string | null;
}

// Store interface
interface MediaLibraryStore {
  // Active tab
  activeTab: MediaLibraryTab;
  setActiveTab: (tab: MediaLibraryTab) => void;

  // Hierarchical media data (NEW)
  allMedia: HierarchicalMediaData;
  setAllMedia: (data: HierarchicalMediaData) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;

  // Menu image filters
  menuImageFilters: MenuImageFilters;
  setMenuSectionFilter: (sectionId: string | null) => void;
  setMenuCategoryFilter: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;

  // NEW: Unified filters for sidebar system
  unifiedFilters: UnifiedFilters;
  setUnifiedAssetType: (type: 'all' | 'menu-item' | 'ai-avatar' | 'general') => void;
  setUnifiedSectionFilter: (sectionId: string | null) => void;
  setUnifiedCategoryFilter: (categoryId: string | null) => void;
  setSelectedImageType: (imageType: 'all' | 'menu-item' | 'menu-item-variant') => void;
  setSelectedMenuItemId: (menuItemId: string | null) => void; // NEW
  setShowUncategorized: (show: boolean) => void;
  setShowLinked: (show: boolean) => void;
  setShowInUse: (show: boolean) => void;
  setShowMultiUse: (show: boolean) => void; // NEW
  setShowOrphaned: (show: boolean) => void; // NEW
  setUnifiedSearchQuery: (query: string) => void;
  resetUnifiedFilters: () => void;
  getActiveFilterCount: () => number;
  applyFilters: (filters: Partial<UnifiedFilters>) => void; // NEW: Apply filter preset

  // Upload state
  uploadState: UploadState;
  setUploadAssetType: (type: 'menu-item' | 'ai-avatar' | 'general') => void;
  setUploadSectionId: (sectionId: string | null) => void;
  setUploadCategoryId: (categoryId: string | null) => void;
  setUploadProgress: (progress: number) => void;
  setUploadState: (state: Partial<UploadState>) => void;

  // Reset
  resetFilters: () => void;

  // NEW: Batch selection
  batchSelection: BatchSelectionState;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleItemSelection: (id: string) => void;
  selectAllItems: (ids: string[]) => void;
  clearSelection: () => void;
  isItemSelected: (id: string) => boolean;
}

const initialMenuImageFilters: MenuImageFilters = {
  selectedSectionId: null,
  selectedCategoryId: null,
  searchQuery: '',
};

const initialUploadState: UploadState = {
  isUploading: false,
  uploadProgress: 0,
  selectedAssetType: 'general',
  selectedSectionId: null,
  selectedCategoryId: null,
};

// NEW: Initial batch selection state
const initialBatchSelection: BatchSelectionState = {
  isSelectionMode: false,
  selectedIds: new Set(),
};

// NEW: Initial unified filters state
const initialUnifiedFilters: UnifiedFilters = {
  selectedAssetType: 'all',
  selectedImageType: 'all', // Phase 3 MYA-1476 - default to showing both menu items and variants
  selectedSectionId: null,
  selectedCategoryId: null,
  selectedMenuItemId: null,
  showUncategorized: false,
  showLinked: false,
  showInUse: false,
  showMultiUse: false, // NEW
  showOrphaned: false, // NEW
  searchQuery: '',
};

// Initialize allMedia with safe defaults to prevent undefined errors
const initialAllMedia: HierarchicalMediaData = {
  sections: [],
  menuImages: [],
  aiAvatars: [],
  generalMedia: [],
  orphanedMenuImages: [],
  orphanedAiAvatars: [],
};

export const useMediaLibraryStore = create<MediaLibraryStore>((set, get) => ({
  // Initial state
  activeTab: 'menu-images',
  allMedia: initialAllMedia,
  isLoading: false,
  error: null,
  menuImageFilters: initialMenuImageFilters,
  uploadState: initialUploadState,
  batchSelection: initialBatchSelection,
  unifiedFilters: initialUnifiedFilters,

  // Tab management
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  // Data setters
  setAllMedia: (data) => {
    set({ allMedia: data });
  },

  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Filter setters
  setMenuSectionFilter: (sectionId) => {
    set((state) => ({
      menuImageFilters: {
        ...state.menuImageFilters,
        selectedSectionId: sectionId,
        // Reset category when section changes
        selectedCategoryId: null,
      },
    }));
  },

  setMenuCategoryFilter: (categoryId) => {
    set((state) => ({
      menuImageFilters: {
        ...state.menuImageFilters,
        selectedCategoryId: categoryId,
      },
    }));
  },

  setSearchQuery: (query) => {
    set((state) => ({
      menuImageFilters: {
        ...state.menuImageFilters,
        searchQuery: query,
      },
    }));
  },

  // Upload state setters
  setUploadAssetType: (type) => {
    set((state) => ({
      uploadState: {
        ...state.uploadState,
        selectedAssetType: type,
        // Reset section/category when type changes
        selectedSectionId: null,
        selectedCategoryId: null,
      },
    }));
  },

  setUploadSectionId: (sectionId) => {
    set((state) => ({
      uploadState: {
        ...state.uploadState,
        selectedSectionId: sectionId,
        // Reset category when section changes
        selectedCategoryId: null,
      },
    }));
  },

  setUploadCategoryId: (categoryId) => {
    set((state) => ({
      uploadState: {
        ...state.uploadState,
        selectedCategoryId: categoryId,
      },
    }));
  },

  setUploadProgress: (progress) => {
    set((state) => ({
      uploadState: {
        ...state.uploadState,
        uploadProgress: progress,
      },
    }));
  },

  setUploadState: (state) => {
    set({ uploadState: { ...get().uploadState, ...state } });
  },

  // Reset filters
  resetFilters: () => {
    set({
      menuImageFilters: initialMenuImageFilters,
    });
  },

  // NEW: Unified filter setters
  setUnifiedAssetType: (type) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        selectedAssetType: type,
        // Reset hierarchy when switching asset types
        selectedSectionId: null,
        selectedCategoryId: null,
      };
      
      return { unifiedFilters: newFilters };
    });
  },

  setUnifiedSectionFilter: (sectionId) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        selectedSectionId: sectionId,
        // Reset category when section changes
        selectedCategoryId: null,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setUnifiedCategoryFilter: (categoryId) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        selectedCategoryId: categoryId,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setSelectedImageType: (imageType) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        selectedImageType: imageType,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setSelectedMenuItemId: (menuItemId) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        selectedMenuItemId: menuItemId,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setShowUncategorized: (show) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        showUncategorized: show,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setShowLinked: (show) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        showLinked: show,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setShowInUse: (show) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        showInUse: show,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setShowMultiUse: (show) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        showMultiUse: show,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setShowOrphaned: (show) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        showOrphaned: show,
      };
      return { unifiedFilters: newFilters };
    });
  },

  setUnifiedSearchQuery: (query) => {
    set((state) => {
      const newFilters = {
        ...state.unifiedFilters,
        searchQuery: query,
      };
      return { unifiedFilters: newFilters };
    });
  },

  resetUnifiedFilters: () => {
    const defaultFilters = {
      selectedAssetType: 'all' as const,
      selectedSectionId: null,
      selectedCategoryId: null,
      selectedMenuItemId: null,
      showUncategorized: false,
      showLinked: false,
      showInUse: false,
      showMultiUse: false,
      showOrphaned: false,
      searchQuery: '',
    };
    set({ unifiedFilters: defaultFilters });
  },

  getActiveFilterCount: () => {
    const filters = get().unifiedFilters;
    let count = 0;
    
    // Count active filters
    if (filters.selectedAssetType !== 'all') count++;
    if (filters.selectedSectionId) count++;
    if (filters.selectedCategoryId) count++;
    if (filters.selectedMenuItemId) count++;
    if (filters.showUncategorized) count++;
    if (filters.showLinked) count++;
    if (filters.showInUse) count++;
    if (filters.showMultiUse) count++; // NEW
    if (filters.showOrphaned) count++; // NEW
    if (filters.searchQuery.trim() !== '') count++;
    
    return count;
  },

  // NEW: Apply filter preset (bulk update all filters)
  applyFilters: (filters) => {
    set((state) => ({
      unifiedFilters: {
        ...state.unifiedFilters,
        ...filters,
      },
    }));
  },

  // NEW: Batch selection methods
  enterSelectionMode: () => {
    set({ 
      batchSelection: { 
        isSelectionMode: true, 
        selectedIds: new Set() 
      } 
    });
  },
  
  exitSelectionMode: () => {
    set({ 
      batchSelection: { 
        isSelectionMode: false, 
        selectedIds: new Set() 
      } 
    });
  },
  
  toggleItemSelection: (id) => {
    const currentSelection = get().batchSelection.selectedIds;
    const newSelection = new Set(currentSelection);
    
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    
    set({ 
      batchSelection: { 
        ...get().batchSelection, 
        selectedIds: newSelection 
      } 
    });
  },
  
  selectAllItems: (ids) => {
    set({ 
      batchSelection: { 
        ...get().batchSelection, 
        selectedIds: new Set(ids) 
      } 
    });
  },
  
  clearSelection: () => {
    set({ 
      batchSelection: { 
        ...get().batchSelection, 
        selectedIds: new Set() 
      } 
    });
  },
  
  isItemSelected: (id) => {
    return get().batchSelection.selectedIds.has(id);
  },
}));
