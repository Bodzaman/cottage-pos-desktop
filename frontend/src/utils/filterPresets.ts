import { UnifiedFilters } from './mediaLibraryStore';

/**
 * Filter Preset Structure
 */
export interface FilterPreset {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  filters: UnifiedFilters;
  createdAt: string; // ISO timestamp
  isDefault: boolean; // Built-in vs user-created
  isStarred?: boolean; // Favorite toggle (user presets only)
}

/**
 * Built-in Filter Presets
 * 
 * These are hardcoded and always available.
 * Not stored in localStorage - defined in code for easy updates.
 */
export const BUILTIN_PRESETS: FilterPreset[] = [
  {
    id: 'needs-attention',
    name: 'Needs Attention',
    icon: 'AlertCircle',
    isDefault: true,
    createdAt: new Date().toISOString(),
    filters: {
      selectedAssetType: 'all',
      selectedSectionId: null,
      selectedCategoryId: null,
      selectedMenuItemId: null,
      showUncategorized: true, // Show uncategorized assets
      showLinked: false,
      showInUse: false,
      showMultiUse: false,
      showOrphaned: true, // Show orphaned assets
      searchQuery: '',
    },
  },
  {
    id: 'menu-images-only',
    name: 'Menu Images Only',
    icon: 'Image',
    isDefault: true,
    createdAt: new Date().toISOString(),
    filters: {
      selectedAssetType: 'menu-item', // Only menu images
      selectedSectionId: null,
      selectedCategoryId: null,
      selectedMenuItemId: null,
      showUncategorized: false,
      showLinked: true, // Only linked images
      showInUse: false,
      showMultiUse: false,
      showOrphaned: false,
      searchQuery: '',
    },
  },
  {
    id: 'unused-assets',
    name: 'Unused Assets',
    icon: 'Trash2',
    isDefault: true,
    createdAt: new Date().toISOString(),
    filters: {
      selectedAssetType: 'all',
      selectedSectionId: null,
      selectedCategoryId: null,
      selectedMenuItemId: null,
      showUncategorized: true, // Show uncategorized (likely unused)
      showLinked: false, // NOT linked
      showInUse: false, // NOT in use
      showMultiUse: false,
      showOrphaned: false,
      searchQuery: '',
    },
  },
  {
    id: 'popular-images',
    name: 'Popular Images',
    icon: 'Star',
    isDefault: true,
    createdAt: new Date().toISOString(),
    filters: {
      selectedAssetType: 'all',
      selectedSectionId: null,
      selectedCategoryId: null,
      selectedMenuItemId: null,
      showUncategorized: false,
      showLinked: false,
      showInUse: false,
      showMultiUse: true, // Show multi-use assets (2+ links)
      showOrphaned: false,
      searchQuery: '',
    },
  },
  {
    id: 'recent-uploads',
    name: 'Recent Uploads',
    icon: 'Calendar',
    isDefault: true,
    createdAt: new Date().toISOString(),
    filters: {
      selectedAssetType: 'all',
      selectedSectionId: null,
      selectedCategoryId: null,
      selectedMenuItemId: null,
      showUncategorized: false,
      showLinked: false,
      showInUse: false,
      showMultiUse: false,
      showOrphaned: false,
      searchQuery: '',
    },
  },
];

// LocalStorage key for user presets
const PRESETS_STORAGE_KEY = 'mediaLibrary_filterPresets_v1';
const MAX_USER_PRESETS = 10;

/**
 * Get all user-created presets from localStorage
 */
export function getUserPresets(): FilterPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading user presets:', error);
    return [];
  }
}

/**
 * Get all presets (built-in + user-created)
 */
export function getAllPresets(): FilterPreset[] {
  return [...BUILTIN_PRESETS, ...getUserPresets()];
}

/**
 * Save a new user preset to localStorage
 * 
 * @returns Success status and optional error message
 */
export function saveUserPreset(
  name: string,
  icon: string,
  filters: UnifiedFilters
): { success: boolean; error?: string; preset?: FilterPreset } {
  try {
    const existing = getUserPresets();
    
    // Enforce max limit
    if (existing.length >= MAX_USER_PRESETS) {
      return {
        success: false,
        error: `Maximum ${MAX_USER_PRESETS} presets allowed. Delete old presets first.`,
      };
    }
    
    // Check for duplicate name
    const allPresets = getAllPresets();
    if (allPresets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return {
        success: false,
        error: 'A preset with this name already exists.',
      };
    }
    
    // Create new preset
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      icon,
      filters,
      createdAt: new Date().toISOString(),
      isDefault: false,
      isStarred: false,
    };
    
    // Save to localStorage
    const updated = [...existing, newPreset];
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    
    return { success: true, preset: newPreset };
  } catch (error) {
    console.error('Error saving preset:', error);
    return {
      success: false,
      error: 'Failed to save preset. Please try again.',
    };
  }
}

/**
 * Delete a user preset by ID
 */
export function deleteUserPreset(presetId: string): boolean {
  try {
    const existing = getUserPresets();
    const updated = existing.filter(p => p.id !== presetId);
    
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error deleting preset:', error);
    return false;
  }
}

/**
 * Update a user preset (for renaming or starring)
 */
export function updateUserPreset(
  presetId: string,
  updates: Partial<Pick<FilterPreset, 'name' | 'icon' | 'isStarred'>>
): boolean {
  try {
    const existing = getUserPresets();
    const index = existing.findIndex(p => p.id === presetId);
    
    if (index === -1) return false;
    
    // Apply updates
    existing[index] = {
      ...existing[index],
      ...updates,
    };
    
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (error) {
    console.error('Error updating preset:', error);
    return false;
  }
}
