import { apiClient } from 'app';

/**
 * Utility functions for menu-media integration
 * Provides a clean interface for working with menu items and their associated media assets
 */

/**
 * Link a media asset to a menu item
 * @param menuItemId - The ID of the menu item
 * @param assetId - The ID of the media asset
 * @param mediaType - 'primary' or 'secondary' to indicate which image slot
 * @param updateUsage - Whether to update the usage metadata for the asset
 * @returns The response from the API
 */
export const linkMediaToMenuItem = async (
  menuItemId: string,
  assetId: string,
  mediaType: 'primary' | 'secondary',
  updateUsage: boolean = true
) => {
  try {
    const response = await apiClient.link_media_to_menu_item({
      menu_item_id: menuItemId,
      asset_id: assetId,
      image_type: mediaType === 'primary' ? 'square' : 'widescreen'
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error linking media to menu item:', error);
    throw error;
  }
};

/**
 * Get the status of menu items and their media relationships
 * @returns Status information about menu media relationships
 */
export const getMenuMediaStatus = async () => {
  try {
    const response = await apiClient.get_menu_media_status_v3();
    return await response.json();
  } catch (error) {
    console.error('Error getting menu media status:', error);
    throw error;
  }
};

/**
 * Get relationships between menu items and their media assets
 * @param limit - Maximum number of relationships to return
 * @param offset - Offset for pagination
 * @returns List of menu media relationships
 */
export const getMenuMediaRelationships = async (limit: number = 100, offset: number = 0) => {
  try {
    const response = await apiClient.get_menu_media_relationships_v3({ limit, offset });
    return await response.json();
  } catch (error) {
    console.error('Error getting menu media relationships:', error);
    throw error;
  }
};

/**
 * Fix missing media references
 * Find menu items with image URLs but missing asset ID references and fix them
 * @returns Result of the operation
 */
export const fixMissingMediaReferences = async () => {
  try {
    const response = await apiClient.fix_missing_media_references_v3();
    return await response.json();
  } catch (error) {
    console.error('Error fixing missing media references:', error);
    throw error;
  }
};

/**
 * Cleanup orphaned media assets
 * @param deleteOrphaned - Whether to actually delete orphaned media assets or just report them
 * @returns Result of the operation
 */
export const cleanupOrphanedMedia = async (deleteOrphaned: boolean = false) => {
  try {
    const response = await apiClient.cleanup_orphaned_media_v3({ delete_orphaned: deleteOrphaned });
    return await response.json();
  } catch (error) {
    console.error('Error cleaning up orphaned media:', error);
    throw error;
  }
};

/**
 * Perform a complete media asset sync for a menu item
 * This will ensure all metadata is properly set and the menu item correctly references its media assets
 * 
 * @param menuItemId - ID of the menu item
 * @param primaryMediaId - ID of the primary media asset (optional)
 * @param secondaryMediaId - ID of the secondary media asset (optional)
 * @returns Result of the operation
 */
export const syncMenuItemMedia = async (
  menuItemId: string,
  primaryMediaId?: string,
  secondaryMediaId?: string
) => {
  try {
    const results: { success: boolean; messages: string[] } = {
      success: true,
      messages: []
    };
    
    // Update primary media if provided
    if (primaryMediaId) {
      const primaryResult = await linkMediaToMenuItem(menuItemId, primaryMediaId, 'primary');
      results.success = results.success && primaryResult.success;
      results.messages.push(`Primary media: ${primaryResult.message}`);
    }
    
    // Update secondary media if provided
    if (secondaryMediaId) {
      const secondaryResult = await linkMediaToMenuItem(menuItemId, secondaryMediaId, 'secondary');
      results.success = results.success && secondaryResult.success;
      results.messages.push(`Secondary media: ${secondaryResult.message}`);
    }
    
    return results;
  } catch (error) {
    console.error('Error syncing menu item media:', error);
    return {
      success: false,
      messages: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

export default {
  linkMediaToMenuItem,
  getMenuMediaStatus,
  getMenuMediaRelationships,
  fixMissingMediaReferences,
  cleanupOrphanedMedia,
  syncMenuItemMedia
};
