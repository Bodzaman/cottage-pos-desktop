import { apiClient } from 'app';
import { MediaAsset } from './mediaLibraryUtils';

/**
 * Menu section/category hierarchy types
 */
export interface MenuSection {
  id: string;
  name: string;
  display_name: string; // Without [SECTION] prefix
  categories: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  name: string;
  section_id: string | null;
  is_section: boolean;
}

/**
 * API Response structures (snake_case - matches backend)
 */
interface CategoryGroupAPI {
  category_id: string;
  category_name: string;
  section_id: string | null;
  section_name: string | null;
  assets: MediaAsset[];
  asset_count: number;
}

interface SectionGroupAPI {
  section_id: string;
  section_name: string;
  categories: CategoryGroupAPI[];
  total_assets: number;
}

interface OrphanedAssetsAPI {
  asset_category: string;
  assets: MediaAsset[];
  count: number;
}

interface APIResponse {
  menu_images: SectionGroupAPI[];
  menu_images_orphaned: OrphanedAssetsAPI;
  ai_avatars: MediaAsset[];
  ai_avatars_orphaned: OrphanedAssetsAPI;
  general_media: MediaAsset[];
  total_assets: number;
  categorized_count: number;
  orphaned_count: number;
}

/**
 * Frontend-friendly structure (extracted flat arrays)
 */
export interface HierarchicalMediaData {
  // Flat arrays for easy component consumption
  sections: MenuSection[];          // Sections with nested categories
  menuImages: MediaAsset[];         // All menu images (flat)
  aiAvatars: MediaAsset[];          // All AI avatars
  generalMedia: MediaAsset[];       // All general media
  orphanedMenuImages: MediaAsset[]; // Uncategorized menu images
  orphanedAiAvatars: MediaAsset[];  // Uncategorized AI avatars
  
  // Metadata
  totalAssets: number;
  categorizedCount: number;
  orphanedCount: number;
}

/**
 * Transform API response to frontend-friendly structure
 */
function transformAPIResponse(apiData: APIResponse): HierarchicalMediaData {
  // Extract sections and convert to MenuSection format
  const sections: MenuSection[] = apiData.menu_images.map((sectionAPI) => {
    // Remove [SECTION] prefix for display
    const displayName = sectionAPI.section_name.replace('[SECTION]', '').trim();
    
    // Convert categories to MenuCategory format
    const categories: MenuCategory[] = sectionAPI.categories.map((catAPI) => ({
      id: catAPI.category_id,
      name: catAPI.category_name,
      section_id: catAPI.section_id,
      is_section: false,
    }));
    
    return {
      id: sectionAPI.section_id,
      name: sectionAPI.section_name,
      display_name: displayName,
      categories,
    };
  });
  
  // Flatten all menu images into a single array
  const menuImages: MediaAsset[] = [];
  apiData.menu_images.forEach((section) => {
    section.categories.forEach((category) => {
      menuImages.push(...category.assets);
    });
  });

  // 🔧 FIX: Include orphaned menu images
  if (apiData.menu_images_orphaned?.assets) {
    menuImages.push(...apiData.menu_images_orphaned.assets);
  }
  
  return {
    sections,
    menuImages,
    aiAvatars: apiData.ai_avatars,
    generalMedia: apiData.general_media,
    orphanedMenuImages: apiData.menu_images_orphaned.assets,
    orphanedAiAvatars: apiData.ai_avatars_orphaned.assets,
    totalAssets: apiData.total_assets,
    categorizedCount: apiData.categorized_count,
    orphanedCount: apiData.orphaned_count,
  };
}

/**
 * Fetch hierarchical media data from the API
 * Returns media organized by sections and categories
 */
export const fetchHierarchicalMedia = async (): Promise<HierarchicalMediaData> => {
  try {
    const response = await apiClient.get_hierarchical_media({});
    const apiData: APIResponse = await response.json();

    // Validate response structure
    if (!apiData || typeof apiData !== 'object' || !('menu_images' in apiData)) {
      throw new Error('Invalid response format from API');
    }

    // Transform API response to frontend structure
    return transformAPIResponse(apiData);
  } catch (error) {
    console.error('Error fetching hierarchical media:', error);
    throw error;
  }
};

/**
 * Fetch menu sections with their categories
 * Parses sections (marked with [SECTION]) and their child categories
 */
export const fetchMenuSections = async (): Promise<MenuSection[]> => {
  try {
    const response = await apiClient.get_menu_categories({});
    const data = await response.json();

    if (!data.success || !data.categories) {
      throw new Error(data.message || 'Failed to fetch menu categories');
    }

    // Separate sections and regular categories
    const sections: Map<string, MenuSection> = new Map();
    const categories: MenuCategory[] = [];

    data.categories.forEach((cat: any) => {
      const isSection = cat.name?.startsWith('[SECTION]');

      if (isSection) {
        // This is a section
        const displayName = cat.name.replace('[SECTION]', '').trim();
        sections.set(cat.id, {
          id: cat.id,
          name: cat.name,
          display_name: displayName,
          categories: [],
        });
      } else {
        // This is a regular category
        categories.push({
          id: cat.id,
          name: cat.name,
          section_id: cat.parent_category_id,
          is_section: false,
        });
      }
    });

    // Assign categories to their parent sections
    categories.forEach((cat) => {
      if (cat.section_id && sections.has(cat.section_id)) {
        sections.get(cat.section_id)!.categories.push(cat);
      }
    });

    // Convert map to array and sort by name
    return Array.from(sections.values()).sort((a, b) =>
      a.display_name.localeCompare(b.display_name)
    );
  } catch (error) {
    console.error('Error fetching menu sections:', error);
    throw error;
  }
};

/**
 * Get categories for a specific section
 */
export const getCategoriesForSection = async (
  sectionId: string
): Promise<MenuCategory[]> => {
  try {
    const response = await apiClient.get_menu_categories({});
    const data = await response.json();

    if (!data.success || !data.categories) {
      throw new Error(data.message || 'Failed to fetch menu categories');
    }

    return data.categories
      .filter(
        (cat: any) =>
          cat.parent_category_id === sectionId && !cat.name?.startsWith('[SECTION]')
      )
      .map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        section_id: cat.parent_category_id,
        is_section: false,
      }))
      .sort((a: MenuCategory, b: MenuCategory) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching categories for section:', error);
    return [];
  }
};

/**
 * Filter media assets by section and/or category
 * Special case: sectionId === 'uncategorized' returns orphaned images
 */
export const filterMediaByHierarchy = (
  assets: MediaAsset[],
  sectionId?: string | null,
  categoryId?: string | null
): MediaAsset[] => {
  let filtered = [...assets];

  // Special filter for uncategorized images
  if (sectionId === 'uncategorized') {
    return filtered.filter(
      (asset) => !asset.menu_section_id || !asset.menu_category_id
    );
  }

  if (sectionId) {
    filtered = filtered.filter((asset) => asset.menu_section_id === sectionId);
  }

  if (categoryId) {
    filtered = filtered.filter((asset) => asset.menu_category_id === categoryId);
  }

  return filtered;
};

/**
 * Get orphaned (uncategorized) media for a specific asset category
 */
export const getOrphanedMedia = (
  assets: MediaAsset[],
  assetCategory: 'menu-item' | 'ai-avatar'
): MediaAsset[] => {
  return assets.filter(
    (asset) =>
      asset.asset_category === assetCategory &&
      (!asset.menu_section_id || !asset.menu_category_id)
  );
};

/**
 * Get media count by section and category
 */
export const getMediaCountsByHierarchy = (
  assets: MediaAsset[]
): Map<string, Map<string, number>> => {
  const counts = new Map<string, Map<string, number>>();

  assets.forEach((asset) => {
    if (asset.menu_section_id && asset.menu_category_id) {
      if (!counts.has(asset.menu_section_id)) {
        counts.set(asset.menu_section_id, new Map());
      }

      const sectionCounts = counts.get(asset.menu_section_id)!;
      const currentCount = sectionCounts.get(asset.menu_category_id) || 0;
      sectionCounts.set(asset.menu_category_id, currentCount + 1);
    }
  });

  return counts;
};

/**
 * UNIFIED FILTER LOGIC - Phase 1 MVP
 * Applies all filter dimensions from the sidebar filter system
 * 
 * @param allMedia - Complete hierarchical media data
 * @param filters - Unified filter state from store
 * @returns Filtered array of media assets
 */
export const filterMediaUnified = (
  allMedia: HierarchicalMediaData,
  filters: {
    selectedAssetType: 'all' | 'menu-item' | 'ai-avatar' | 'general';
    selectedImageType: 'all' | 'menu-item' | 'menu-item-variant'; // NEW: Phase 3 MYA-1476
    selectedSectionId: string | null;
    selectedCategoryId: string | null;
    selectedMenuItemId: string | null;
    showUncategorized: boolean;
    showLinked: boolean;
    showInUse: boolean;
    showMultiUse: boolean;
    showOrphaned: boolean;
    searchQuery: string;
  }
): MediaAsset[] => {
  // STEP 1: Start with assets based on selected type
  let filtered: MediaAsset[] = [];
  
  switch (filters.selectedAssetType) {
    case 'menu-item':
      filtered = [...allMedia.menuImages];
      break;
    case 'ai-avatar':
      filtered = [...allMedia.aiAvatars];
      break;
    case 'general':
      filtered = [...allMedia.generalMedia];
      break;
    case 'all':
    default:
      // Combine all asset types
      filtered = [
        ...allMedia.menuImages,
        ...allMedia.aiAvatars,
        ...allMedia.generalMedia,
      ];
      break;
  }
  
  // STEP 1.5: Apply image type filter (menu items vs variants) - Phase 3 MYA-1476
  // This filter applies when:
  // 1. User is viewing 'menu-item' OR 'all' asset types, AND
  // 2. User has selected a specific image type (not 'all')
  if (filters.selectedImageType !== 'all') {
    // Only apply to menu-item and menu-item-variant assets
    filtered = filtered.filter((asset) => {
      // Keep non-menu assets (ai-avatar, general) when viewing 'all'
      if (asset.asset_category !== 'menu-item' && asset.asset_category !== 'menu-item-variant') {
        return true; // Keep AI avatars and general media
      }
      // Filter menu assets by selected image type
      return asset.asset_category === filters.selectedImageType;
    });
  }
  
  // STEP 2: Apply hierarchy filters (only for menu items)
  if (filters.selectedAssetType === 'menu-item') {
    // NEW: Filter by menu item if selected (highest priority)
    if (filters.selectedMenuItemId) {
      // Note: This requires the asset to have linked_items metadata
      // For now, we filter by matching the menu item ID in linked_items array
      filtered = filtered.filter((asset) => {
        // Check if this asset is linked to the selected menu item
        if (asset.linked_items && Array.isArray(asset.linked_items)) {
          return asset.linked_items.some(
            (link: any) => link.menu_item_id === filters.selectedMenuItemId
          );
        }
        return false;
      });
    }
    // Filter by section if selected (and no menu item filter)
    else if (filters.selectedSectionId) {
      filtered = filtered.filter(
        (asset) => asset.menu_section_id === filters.selectedSectionId
      );
    }
    
    // Filter by category if selected (more specific)
    if (filters.selectedCategoryId && !filters.selectedMenuItemId) {
      filtered = filtered.filter(
        (asset) => asset.menu_category_id === filters.selectedCategoryId
      );
    }
  }
  
  // STEP 3: Apply status filters
  // These are AND conditions - all enabled filters must match
  const statusFilters: ((asset: MediaAsset) => boolean)[] = [];
  
  if (filters.showUncategorized) {
    // Uncategorized = missing section OR category
    statusFilters.push(
      (asset) => !asset.menu_section_id || !asset.menu_category_id
    );
  }
  
  if (filters.showLinked) {
    // Linked = has linked_items array with entries
    statusFilters.push(
      (asset) => asset.linked_items && asset.linked_items.length > 0
    );
  }
  
  if (filters.showInUse) {
    // In Use = has usage_count > 0 or linked_items present
    statusFilters.push(
      (asset) => 
        (asset.usage_count && asset.usage_count > 0) ||
        (asset.linked_items && asset.linked_items.length > 0)
    );
  }

  if (filters.showMultiUse) {
    // Multi-Use = assets linked to 2+ menu items (popular/reused assets)
    statusFilters.push(
      (asset) => {
        const linkCount = asset.linked_items?.length || asset.usage_count || 0;
        return linkCount >= 2;
      }
    );
  }

  if (filters.showOrphaned) {
    // Orphaned = assets with linked_items but linked to deleted/inactive items
    // Note: For now, we detect orphaned by checking if asset has hierarchical metadata
    // but is missing proper category/section assignment despite having links
    // TODO Phase 3: Check against actual active menu_items table for proper orphan detection
    statusFilters.push(
      (asset) => {
        const hasLinks = asset.linked_items && asset.linked_items.length > 0;
        const missingHierarchy = !asset.menu_section_id && !asset.menu_category_id;
        // Orphaned if it has links but no proper hierarchy (suggests broken references)
        return hasLinks && missingHierarchy;
      }
    );
  }
  
  // Apply all status filters (AND logic)
  if (statusFilters.length > 0) {
    filtered = filtered.filter((asset) =>
      statusFilters.every((filterFn) => filterFn(asset))
    );
  }
  
  // STEP 4: Apply search query (Phase 2 - placeholder for now)
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (asset) =>
        asset.file_name?.toLowerCase().includes(query) ||
        asset.friendly_name?.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }
  
  // STEP 5: Deduplicate by ID (in case of any overlaps)
  const uniqueAssets = new Map<string, MediaAsset>();
  filtered.forEach((asset) => {
    if (!uniqueAssets.has(asset.id)) {
      uniqueAssets.set(asset.id, asset);
    }
  });
  
  // STEP 6: Sort by upload date (newest first) or filename
  const result = Array.from(uniqueAssets.values()).sort((a, b) => {
    // Sort by upload date if available
    if (a.upload_date && b.upload_date) {
      return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
    }
    // Fallback to filename
    return a.file_name.localeCompare(b.file_name);
  });
  
  return result;
};

/**
 * Upload media with hierarchical organization
 */
export const uploadOrganizedMedia = async (
  file: File,
  assetCategory: 'menu-item' | 'ai-avatar' | 'general',
  menuSectionId?: string | null,
  menuCategoryId?: string | null
): Promise<{ success: boolean; asset?: MediaAsset; error?: string }> => {
  try {
    let response;

    switch (assetCategory) {
      case 'menu-item':
        // Validate section/category for menu items
        if (!menuSectionId || !menuCategoryId) {
          throw new Error('Section and category are required for menu item images');
        }

        response = await apiClient.upload_menu_image({
          file,
          asset_category: assetCategory,
          menu_section_id: menuSectionId,
          menu_category_id: menuCategoryId,
        });
        break;

      case 'ai-avatar':
        response = await apiClient.upload_avatar({
          file,
          asset_category: assetCategory,
        });
        break;

      case 'general':
      default:
        response = await apiClient.upload_general({
          file,
          asset_category: assetCategory,
        });
        break;
    }

    const data = await response.json();

    if (data.success && data.asset) {
      return { success: true, asset: data.asset };
    }

    return { success: false, error: data.message || 'Upload failed' };
  } catch (error) {
    console.error('Error uploading organized media:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Auto-link orphaned media to categories based on existing menu item relationships
 */
export const autoLinkOrphanedMedia = async (): Promise<{
  success: boolean;
  linked_count: number;
  message?: string;
}> => {
  try {
    // This would call a backend endpoint that:
    // 1. Finds media linked to menu items via menu_items.image_asset_id
    // 2. Updates those media assets with the menu item's category/section
    // For now, return placeholder
    return {
      success: false,
      linked_count: 0,
      message: 'Auto-link endpoint not yet implemented',
    };
  } catch (error) {
    console.error('Error auto-linking orphaned media:', error);
    return {
      success: false,
      linked_count: 0,
      message: error instanceof Error ? error.message : 'Auto-link failed',
    };
  }
};
