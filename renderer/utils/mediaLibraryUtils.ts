import { supabase } from './supabaseClient';
import { toast } from 'sonner';
import brain from 'brain';
import type { OptimizedMediaResponse, ImageVariant } from 'types';
import { extractApiError, isNotFoundError } from './apiErrorHandler';

// Types
// Media asset schema
export interface MediaItem {
  id: string;
  name: string;
  friendlyName: string;
  size: number;
  type: string; // 'image' or 'video'
  url: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  usage?: string;
  asset_category?: 'menu-item' | 'menu-item-variant' | 'ai-avatar' | 'marketing' | 'gallery' | 'general';
  width?: number;
  height?: number;
  aspectRatio?: string; // 'square', 'widescreen', etc.
  metadata?: any; // For storing additional info
  usageCount?: number;
  usageDetails?: {
    usage: string;
    objectId: string;
    objectType: string;
  }[];
}

export interface MediaMetadata {
  [key: string]: {
    friendlyName: string;
    uploadedAt?: string;
    description?: string;
  }
}

export interface MediaAsset {
  id: string;
  file_name: string;
  friendly_name?: string;
  type: string;
  url: string;
  tags: string[];
  description?: string;
  usage?: string;
  upload_date?: string;
  file_size?: number;
  width?: number;
  height?: number;
  aspect_ratio?: string;
  
  // Hierarchical organization fields (from media_hierarchical_migration)
  asset_category?: 'menu-item' | 'menu-item-variant' | 'ai-avatar' | 'marketing' | 'gallery' | 'general';
  menu_section_id?: string | null;
  menu_category_id?: string | null;
  
  // Usage tracking fields
  linked_items?: string[]; // Array of menu item IDs or agent IDs
  usage_count?: number; // Number of items this asset is linked to
  usage_context?: Record<string, any>; // Flexible metadata
}

// Add new enhanced interfaces
export interface MenuItemInfo {
  id: string;
  name: string;
  category_name?: string;
  variant_info?: string;
}

export interface EnhancedMediaItem extends MediaItem {
  linked_menu_items: MenuItemInfo[];
  usage_count: number;
  primary_menu_item?: MenuItemInfo;
  display_name?: string;
  secondary_info?: string;
}

// Frontend filter options (maps to GetMediaAssetsParams)
export interface MediaFilterOptions {
  type?: string;           // Maps to asset_type
  tag?: string;            // Maps to tag
  usage?: string;          // Maps to usage
  search?: string;         // Maps to search
  aspectRatio?: string;    // Maps to aspect_ratio
  tags?: string[];         // For multiple tags (converted to single tag)
  limit?: number;          // Maps to limit
  offset?: number;         // Maps to offset
}

/**
 * Get the display name for a media item, handling null values gracefully
 * @param item - Media item (either MediaItem or MediaAsset interface)
 * @returns Display name with fallback to formatted filename
 */
export const getMediaDisplayName = (item: MediaItem | MediaAsset): string => {
  if (!item) {
    return 'Unknown Media';
  }
  
  let friendlyName: string | null | undefined;
  let fileName: string | undefined;
  
  // Handle both MediaItem and MediaAsset interfaces
  if ('friendlyName' in item) {
    friendlyName = item.friendlyName;
    fileName = item.name;
  } else {
    friendlyName = item.friendly_name;
    fileName = item.file_name;
  }
  
  // Check if friendly name is valid (not null, undefined, empty, or string "null")
  if (friendlyName && 
      friendlyName.trim() !== '' && 
      friendlyName.toLowerCase() !== 'null') {
    return friendlyName;
  }
  
  // Fall back to formatted filename, with safety check
  return formatFilenameForDisplay(fileName || 'unknown-file');
};

/**
 * Format filename for display by removing extension and capitalizing
 * @param filename - Original filename
 * @returns Formatted display name
 */
export const formatFilenameForDisplay = (filename: string | undefined): string => {
  if (!filename || filename.trim() === '') return 'Untitled';
  
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Remove UUID prefix if present (format: uuid_filename)
  const cleanName = nameWithoutExt.replace(/^[0-9a-f-]{36}_/i, '');
  
  // Replace underscores and hyphens with spaces
  const spacedName = cleanName.replace(/[_-]/g, ' ');
  
  // Capitalize each word
  return spacedName.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Clean tags array by filtering out null, empty, and "null" string values
 * @param tags - Array of tags that might contain null values
 * @returns Cleaned array of valid tags
 */
export const cleanTags = (tags?: string[] | null): string[] => {
  if (!tags || !Array.isArray(tags)) return [];
  
  return tags.filter(tag => 
    tag && 
    tag.trim() !== '' && 
    tag.toLowerCase() !== 'null'
  );
};

/**
 * Clean usage string by handling null, empty, and "null" string values
 * @param usage - Usage string that might be null or "null"
 * @returns Clean usage string or null
 */
export const cleanUsage = (usage?: string | null): string | null => {
  if (!usage || 
      usage.trim() === '' || 
      usage.toLowerCase() === 'null') {
    return null;
  }
  
  return usage;
};

// Media filter options
/**
 * Handles the linking of media assets to menu items in the database.
 * This function maintains the bidirectional relationship between menu items and media assets.
 * 
 * @param mediaId The ID of the media asset to link
 * @param mediaType 'primary' or 'secondary' to indicate the type of media (square or widescreen)
 * @param menuItemId Optional menu item ID if already created
 * @param menuItemName Optional menu item name for descriptive purposes
 * @returns Promise resolving to success status
 */
export const linkMediaToMenuItem = async (
  mediaId: string,
  mediaType: 'primary' | 'secondary',
  menuItemId?: string,
  menuItemName?: string
): Promise<boolean> => {
  try {
    if (!mediaId) {
      console.error('No media ID provided for linking');
      return false;
    }
    
    // If menu item ID is available, create direct link using the API
    if (menuItemId) {
      const params: any = {
        menuItemId: menuItemId,
      };
      
      // Set appropriate media ID based on type
      if (mediaType === 'primary') {
        params.primary_media_id = mediaId;
      } else {
        params.secondary_media_id = mediaId;
      }
      
      const response = await brain.link_menu_item_media(params);
      const data = await response.json();
      
      if (data.success) {
        console.log(`Successfully linked ${mediaType} media ${mediaId} to menu item ${menuItemId}`);
        return true;
      }
      
      throw new Error(data.message || 'API call failed');
    }
    
    // If no menu item ID (item not created yet), just update the media asset metadata
    // to indicate it's intended for a menu item
    else {
      const result = await updateMediaAssetUsage(mediaId, {
        usage: 'menu-item',
        description: `${mediaType === 'primary' ? 'Primary' : 'Secondary'} media for ${menuItemName || 'menu item'}`,
        tags: ['menu-item', mediaType === 'primary' ? 'primary' : 'secondary']
      });
      return result.success;
    }
  } catch (error) {
    console.error(`Error linking media ${mediaId} to menu item:`, error);
    return false;
  }
};

/**
 * Cleans up orphaned media assets that are no longer used by menu items.
 * This can be called when menu items are deleted or media assets are replaced.
 * 
 * @param deleteFiles Whether to actually delete the files or just update metadata
 * @returns Promise resolving to success status and count of cleaned files
 */
export const cleanupOrphanedMedia = async (deleteFiles: boolean = false): Promise<{success: boolean, count: number}> => {
  try {
    const response = await brain.cleanup_orphaned_media({ delete_files: deleteFiles });
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        count: data.orphaned_assets_found || 0
      };
    }
    
    return {
      success: false,
      count: 0
    };
  } catch (error) {
    console.error('Error cleaning up orphaned media:', error);
    return {
      success: false,
      count: 0
    };
  }
};


// Get all media assets from the enhanced API
export const fetchMediaLibrary = async (filterOptions?: MediaFilterOptions): Promise<MediaItem[]> => {
  try {
    // Map frontend filter options to backend parameters
    const backendParams = {
      search: filterOptions?.search,
      // REMOVED: asset_type filtering - backend returns type='general' for uploads
      // which gets filtered out. Frontend will handle type filtering if needed.
      tag: filterOptions?.tag || (filterOptions?.tags && filterOptions.tags.length > 0 ? filterOptions.tags[0] : undefined),
      usage: filterOptions?.usage,
      // REMOVED: aspect_ratio filtering - most images have NULL aspect_ratio in DB
      // which causes filter to return 0 results. Frontend handles this filter instead.
      linked_only: filterOptions?.linkedOnly,
      unlinked_only: filterOptions?.unlinkedOnly,
      limit: filterOptions?.limit || 100,
      offset: filterOptions?.offset || 0
    };
    
    // Remove undefined values
    Object.keys(backendParams).forEach(key => {
      if (backendParams[key] === undefined) {
        delete backendParams[key];
      }
    });
    
    console.log('fetchMediaLibrary: Using enhanced API with params:', backendParams);
    
    // Use the enhanced API
    const response = await brain.get_enhanced_media_library(backendParams);
    const data = await response.json();

    if (!data.success || !data.assets) {
      console.error('Error from enhanced API:', data.message, data.error);
      return [];
    }

    console.log(`fetchMediaLibrary: Enhanced API returned ${data.assets.length} assets`);

    // Convert enhanced API response to MediaItem format for backward compatibility
    return data.assets.map((asset: any) => ({
      id: asset.id,
      name: asset.file_name || `asset-${asset.id}`,
      friendlyName: asset.display_name || asset.friendly_name || formatFilenameForDisplay(asset.file_name),
      size: asset.file_size || 0,
      url: asset.url || '',
      updatedAt: asset.upload_date || new Date().toISOString(),
      type: asset.type || 'image',
      tags: cleanTags(asset.tags),
      usage: cleanUsage(asset.usage),
      description: asset.description,
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.aspect_ratio,
      metadata: {
        // Store enhanced context for UI components that need it
        linked_menu_items: asset.linked_menu_items || [],
        usage_count: asset.usage_count || 0,
        primary_menu_item: asset.primary_menu_item,
        display_name: asset.display_name,
        secondary_info: asset.secondary_info,
        enhanced: true
      },
      usageCount: asset.usage_count || 0,
      usageDetails: asset.linked_menu_items?.map((item: any) => ({
        usage: 'menu-item',
        objectId: item.id,
        objectType: 'menu_item'
      })) || []
    }));
  } catch (error: any) {
    console.error('Error fetching enhanced media library:', error);
    // Fallback to original API if enhanced API fails
    console.log('Falling back to original get_media_library API');
    return fetchMediaLibraryFallback(filterOptions);
  }
};

// Fallback to original API
const fetchMediaLibraryFallback = async (filterOptions?: MediaFilterOptions): Promise<MediaItem[]> => {
  try {
    const backendParams = {
      asset_type: filterOptions?.type,
      tag: filterOptions?.tag || (filterOptions?.tags && filterOptions.tags.length > 0 ? filterOptions.tags[0] : undefined),
      usage: filterOptions?.usage,
      search: filterOptions?.search,
      aspect_ratio: filterOptions?.aspectRatio,
      limit: filterOptions?.limit || 100,
      offset: filterOptions?.offset || 0
    };
    
    // Use the original media_assets API as fallback
    const response = await brain.get_media_library(backendParams);
    const data = await response.json();

    if (!data.success || !data.assets) {
      console.error('Error from fallback API:', data.message, data.error);
      return [];
    }

    // Convert API response to MediaItem format for backward compatibility
    return data.assets.map((asset: any) => ({
      id: asset.id,
      name: asset.filename || asset.original_filename || `asset-${asset.id}`,
      friendlyName: asset.name || asset.filename || asset.original_filename || `Asset ${asset.id}`,
      size: asset.file_size || 0,
      url: asset.url,
      updatedAt: asset.updated_at || asset.created_at || new Date().toISOString(),
      type: asset.file_type || (asset.url && asset.url.includes('.mp4') ? 'video' : 'image'),
      tags: asset.tags || [],
      usage: asset.usage,
      description: asset.description,
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.aspect_ratio || calculateAspectRatio(asset.width, asset.height),
      metadata: asset.metadata || {},
      usageCount: 0
    }));
  } catch (error: any) {
    console.error('Error fetching media library (fallback):', error);
    return [];
  }
};

// Get all images (backward compatibility)
export const fetchImageLibrary = async (): Promise<MediaItem[]> => {
  return fetchMediaLibrary({ type: 'image' });
};

// Get all videos
export const fetchVideoLibrary = async (): Promise<MediaItem[]> => {
  return fetchMediaLibrary({ type: 'video' });
};

// Get metadata for friendly names (mainly for backward compatibility)
export const fetchMetadata = async (): Promise<MediaMetadata> => {
  try {
    // Use the new enhanced API
    const response = await brain.get_media_library();
    const data = await response.json();
    
    if (!data.success || !data.assets) {
      console.error('Error from API:', data.message, data.error);
      return {};
    }
    
    // Convert assets to metadata format for backward compatibility
    const metadataObj: MediaMetadata = {};
    data.assets.forEach((asset: MediaAsset) => {
      metadataObj[asset.file_name] = {
        friendlyName: asset.friendly_name || asset.file_name,
        uploadedAt: asset.upload_date,
        description: asset.description
      };
    });
    
    return metadataObj;
  } catch (error: any) {
    console.error('Error processing metadata:', error.message);
    return {};
  }
};

// These functions have been moved to mediaAssetUtils.ts to avoid duplication
// Import them from there if needed: fetchMediaAssetDetails, formatMediaAsset, updateMediaAssetUsage

// Update media asset metadata
export const updateMediaAsset = async (
  assetId: string, 
  data: { 
    tags?: string[], 
    description?: string, 
    usage?: string 
  }
): Promise<MediaItem | null> => {
  try {
    // Get the current asset first
    const assetResponse = await brain.get_media_asset({ asset_id: assetId });
    const assetData = await assetResponse.json();
    
    if (!assetData.success || !assetData.asset) {
      throw new Error(assetData.message || 'Asset not found');
    }
    
    // Create update payload (keep existing data for fields not being updated)
    const updatePayload = {
      id: assetId,
      file_name: assetData.asset.file_name,
      type: assetData.asset.type,
      url: assetData.asset.url,
      tags: data.tags !== undefined ? data.tags : assetData.asset.tags,
      description: data.description !== undefined ? data.description : assetData.asset.description,
      usage: data.usage !== undefined ? data.usage : assetData.asset.usage,
      upload_date: assetData.asset.upload_date,
      file_size: assetData.asset.file_size
    };
    
    // Update the asset
    const response = await brain.update_media_asset({ asset_id: assetId }, updatePayload);
    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(responseData.message || 'Failed to update asset');
    }
    
    // Return updated asset in MediaItem format
    if (responseData.asset) {
      return {
        id: responseData.asset.id,
        name: responseData.asset.file_name,
        friendlyName: responseData.asset.friendly_name || responseData.asset.file_name,
        size: responseData.asset.file_size || 0,
        url: responseData.asset.url,
        updatedAt: responseData.asset.upload_date || new Date().toISOString(),
        type: responseData.asset.type,
        tags: responseData.asset.tags,
        usage: responseData.asset.usage,
        description: responseData.asset.description,
        metadata: {
          tags: responseData.asset.tags,
          usage: responseData.asset.usage,
          type: responseData.asset.type
        }
      };
    }
    
    return null;
  } catch (error: any) {
    console.error('Error updating asset metadata:', error.message);
    throw error;
  }
};

// Save metadata for friendly names (backward compatibility)
export const saveMetadata = async (filename: string, friendlyName: string): Promise<void> => {
  try {
    // Find the asset ID by filename
    const assets = await fetchMediaLibrary();
    const asset = assets.find(a => a.name === filename);
    
    if (!asset) {
      throw new Error(`Asset with filename ${filename} not found`);
    }
    
    // Update the asset's description (which we use as friendly name)
    await updateMediaAsset(asset.id, { description: friendlyName });
    
  } catch (error: any) {
    console.error('Error saving metadata:', error.message);
    throw error;
  }
};

// Upload a media file (image or video)
export const uploadMedia = async (
  file: File, 
  options?: { 
    friendlyName?: string, 
    description?: string, 
    tags?: string[], 
    usage?: string,
    aspectRatio?: 'square' | 'widescreen'
  }
): Promise<MediaItem> => {
  try {
    // Check if this is an image file - use optimized upload for images
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      console.log('🖼️ Uploading image via optimized endpoint...');
      
      // Use the new optimized image upload endpoint
      const response = await brain.upload_optimized_menu_image({ file });
      const data: OptimizedMediaResponse = await response.json();
      
      console.log('✅ Optimized upload response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }
      
      // Extract primary URL (square WebP by default)
      const primaryUrl = data.variants.square?.webp_url || data.variants.widescreen?.webp_url || '';
      
      // Prepare tags with aspect ratio if specified
      let tags = options?.tags || [];
      if (options?.aspectRatio) {
        tags = [...tags, options.aspectRatio];
      }
      
      // Return MediaItem with all variant URLs stored in metadata
      return {
        id: data.media_id,
        name: file.name,
        friendlyName: options?.friendlyName || file.name,
        size: Math.round(data.optimized_total_kb * 1024), // Convert KB to bytes
        url: primaryUrl,
        updatedAt: new Date().toISOString(),
        type: 'image',
        tags: tags,
        usage: options?.usage,
        description: options?.description,
        metadata: {
          // Store all optimized variants for flexible usage
          optimized: true,
          original_size_mb: data.original_size_mb,
          optimized_total_kb: data.optimized_total_kb,
          savings_percent: data.savings_percent,
          variants: {
            square: data.variants.square,
            widescreen: data.variants.widescreen,
            thumbnail: data.variants.thumbnail
          },
          tags: tags,
          usage: options?.usage,
          type: 'image'
        }
      };
    }
    
    // For non-images (videos, etc.), use the original upload method
    console.log('📹 Uploading non-image via general file endpoint...');
    
    // Prepare upload data object (brain client handles FormData conversion)
    let tags = options?.tags || [];
    
    // Add aspect ratio as a tag if specified
    if (options?.aspectRatio) {
      tags = [...tags, options.aspectRatio];
    }
    
    // Create upload data object
    const uploadData = {
      file: file,
      category: 'media',
      subcategory: null,
      description: options?.description || null,
      tags: tags.length > 0 ? JSON.stringify(tags) : null
    };
    
    // Use the general file upload endpoint
    const response = await brain.upload_general_file(uploadData);
    
    // Add debugging
    console.log('Upload response status:', response.status);
    console.log('Upload response ok:', response.ok);
    
    const data = await response.json();
    console.log('Upload response data:', data);
    console.log('Upload data.success:', data.success);
    console.log('Upload data.asset_id:', data.asset_id);
    
    if (!data.success) {
      console.error('Upload failed with data:', data);
      throw new Error(data.error || 'Upload failed');
    }
    
    // Return in MediaItem format
    if (data.asset_id && data.url) {
      return {
        id: data.asset_id,
        name: data.filename || file.name,
        friendlyName: options?.friendlyName || file.name,
        size: data.file_size || file.size,
        url: data.url,
        updatedAt: new Date().toISOString(),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        tags: tags,
        usage: options?.usage,
        description: options?.description,
        metadata: {
          tags: tags,
          usage: options?.usage,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        }
      };
    } else {
      throw new Error('Upload succeeded but asset data not returned');
    }
  } catch (error: any) {
    console.error(`Failed to upload ${file.name}:`, error.message);
    throw error;
  }
};

// Delete a media asset
export const deleteMedia = async (assetId: string): Promise<void> => {
  try {
    const response = await brain.delete_media_asset({ assetId });
    
    // If we get here, the response was OK (2xx status)
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete media asset');
    }
    
  } catch (error: any) {
    console.error('Error deleting media:', error);
    
    // Handle 404 - asset already deleted, treat as success
    if (isNotFoundError(error)) {
      console.log(`Asset ${assetId} not found in database - treating as already deleted`);
      return;
    }
    
    // Extract and throw user-friendly error message
    const apiError = extractApiError(error);
    throw new Error(apiError.message);
  }
};

// Get recently used assets
export const getRecentAssets = async (limit: number = 10): Promise<MediaItem[]> => {
  try {
    const response = await brain.get_recent_media_assets({ limit });
    const data = await response.json();
    
    if (!data.success || !data.assets) {
      return [];
    }
    
    // Convert API response to MediaItem format using same mapping as fetchMediaLibrary
    return data.assets.map((asset: any) => ({
      id: asset.id,
      name: asset.filename || asset.original_filename || `asset-${asset.id}`,
      friendlyName: asset.name || asset.filename || asset.original_filename || `Asset ${asset.id}`,
      size: asset.file_size || 0,
      url: asset.url,
      updatedAt: asset.updated_at || asset.created_at || new Date().toISOString(),
      type: asset.file_type || (asset.url && asset.url.includes('.mp4') ? 'video' : 'image'),
      tags: asset.tags || [],
      usage: asset.usage,
      description: asset.description,
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.aspect_ratio,
      metadata: {
        tags: asset.tags || [],
        usage: asset.usage,
        type: asset.file_type || 'image'
      }
    }));
  } catch (error: any) {
    console.error('Error fetching recent assets:', error.message);
    return [];
  }
};

// Bulk update tags for multiple assets
export const bulkUpdateTags = async (assetIds: string[], tags: string[]): Promise<boolean> => {
  try {
    const response = await brain.bulk_update_tags({ asset_ids: assetIds, tags });
    const data = await response.json();
    
    return data.success;
  } catch (error: any) {
    console.error('Error updating tags in bulk:', error.message);
    throw error;
  }
};

// Bulk delete multiple assets
export const bulkDeleteAssets = async (assetIds: string[]): Promise<boolean> => {
  try {
    const response = await brain.bulk_delete_assets({ asset_ids: assetIds });
    const data = await response.json();
    
    return data.success;
  } catch (error: any) {
    console.error('Error deleting assets in bulk:', error.message);
    throw error;
  }
};

// Calculate aspect ratio (e.g., "16:9", "4:3", "1:1") for an image
export const calculateAspectRatio = (width: number, height: number): string => {
  if (!width || !height || width === 0 || height === 0) return 'unknown';
  
  // Find the greatest common divisor (GCD)
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };
  
  const divisor = gcd(width, height);
  const simplifiedWidth = width / divisor;
  const simplifiedHeight = height / divisor;
  
  // Check for common aspect ratios
  if (simplifiedWidth === simplifiedHeight) return '1:1';
  if (Math.abs(simplifiedWidth/simplifiedHeight - 16/9) < 0.01) return '16:9';
  if (Math.abs(simplifiedWidth/simplifiedHeight - 4/3) < 0.01) return '4:3';
  if (Math.abs(simplifiedWidth/simplifiedHeight - 3/2) < 0.01) return '3:2';
  if (Math.abs(simplifiedWidth/simplifiedHeight - 2/3) < 0.01) return '2:3';
  
  // Use the simplified ratio
  return `${simplifiedWidth}:${simplifiedHeight}`;
};

/**
 * Upload a media item to the media library and track its usage.
 * This is a convenience function that combines uploadMedia and updateMediaAssetUsage.
 */
export const uploadAndTrackMedia = async (
  file: File,
  {
    friendlyName,
    description,
    tags = [],
    usage = '',
    aspectRatio,
  }: {
    friendlyName?: string;
    description?: string;
    tags?: string[];
    usage?: string;
    aspectRatio?: 'square' | 'widescreen';
  }
): Promise<MediaItem> => {
  try {
    // Upload the media
    const mediaItem = await uploadMedia(file, {
      friendlyName,
      description,
      tags,
      usage,
      aspectRatio,
    });
    
    // If upload successful, track usage
    if (usage && mediaItem.id) {
      await updateMediaAssetUsage(mediaItem.id, { usage, description });
    }
    
    return mediaItem;
  } catch (error) {
    console.error('Error uploading and tracking media:', error);
    throw error;
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Check if a file is an image based on its type or extension
export const isImageFile = (file: File | string): boolean => {
  // If it's a File object, check its type
  if (file instanceof File) {
    return file.type.startsWith('image/');
  }
  
  // If it's a string (url or filename), check the extension
  if (typeof file === 'string') {
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const lowercasedFile = file.toLowerCase();
    return extensions.some(ext => lowercasedFile.endsWith(ext));
  }
  
  return false;
};

// Check if a file is a video based on its type or extension
export const isVideoFile = (file: File | string): boolean => {
  // If it's a File object, check its type
  if (file instanceof File) {
    return file.type.startsWith('video/');
  }
  
  // If it's a string (url or filename), check the extension
  if (typeof file === 'string') {
    const extensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
    const lowercasedFile = file.toLowerCase();
    return extensions.some(ext => lowercasedFile.endsWith(ext));
  }
  
  return false;
};

// Generate a thumbnail URL from a video URL
export const getVideoThumbnailUrl = (videoUrl: string): string => {
  // In a real implementation, you might generate a thumbnail from the video
  // For now, we'll return a placeholder image
  return 'https://via.placeholder.com/400x225/1f2937/fafafa?text=Video+Thumbnail';
};

// Basic image optimization parameters
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'original' | 'webp' | 'jpeg' | 'png';
}

// Prepare image for upload with optional optimization
export const prepareImageForUpload = async (
  imageFile: File,
  options?: ImageOptimizationOptions
): Promise<File> => {
  // If no optimization options are provided or not an image, return the original file
  if (!options || !isImageFile(imageFile)) {
    return imageFile;
  }
  
  try {
    // Create an image element to load the file
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (options.maxWidth && width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }
        
        if (options.maxHeight && height > options.maxHeight) {
          width = (width * options.maxHeight) / height;
          height = options.maxHeight;
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw and resize image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to desired format
        const format = options.format === 'original' 
          ? imageFile.type 
          : options.format === 'webp' 
            ? 'image/webp' 
            : options.format === 'jpeg' 
              ? 'image/jpeg' 
              : options.format === 'png' 
                ? 'image/png' 
                : imageFile.type;
                
        // Get quality (default 80%)
        const quality = options.quality ? options.quality / 100 : 0.8;
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              URL.revokeObjectURL(url);
              reject(new Error('Could not create blob from canvas'));
              return;
            }
            
            // Create a new file with the optimized blob
            const optimizedFile = new File(
              [blob],
              imageFile.name,
              { type: format }
            );
            
            URL.revokeObjectURL(url);
            resolve(optimizedFile);
          },
          format,
          quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image for optimization'));
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error optimizing image:', error);
    return imageFile; // Return original if optimization fails
  }
};

// Enhanced display functions for smart naming system
export const getSmartDisplayName = (item: MediaItem): string => {
  // Priority 1: Use friendlyName if explicitly set
  if (item.friendlyName && item.friendlyName.trim() !== '') {
    return item.friendlyName;
  }

  // Priority 2: Use metadata from the enhanced API call if available
  if (item.metadata?.enhanced) {
    return item.metadata.display_name || formatFilenameForDisplay(item.name);
  }

  // Priority 3: Fallback logic for older data structure or failed enhanced fetch
  if (item.usageDetails && item.usageDetails.length > 0) {
    // This part might need adjustment based on how you fetch menu item names
    return `Item: ${item.usageDetails[0].objectId}`;
  }

  // Priority 4: Format the filename as last resort
  return formatFilenameForDisplay(item.name);
};

export const getSmartSecondaryText = (item: MediaItem): string => {
  // Use metadata from the enhanced API call if available
  if (item.metadata?.enhanced) {
    return item.metadata.secondary_info || `Uploaded: ${formatDate(item.updatedAt)}`;
  }
  
  // Fallback for unlinked assets
  if (!item.usageDetails || item.usageDetails.length === 0) {
    return `Uploaded: ${formatDate(item.updatedAt)}`;
  }

  // Fallback for linked items
  return item.name;
};

export const getUsageIndicator = (item: MediaItem): { text: string; type: 'linked' | 'unused' | 'multiple' } => {
  const count = item.usageCount || 0;

  if (count === 0) {
    return { text: 'Unused', type: 'unused' };
  }
  if (count === 1) {
    return { text: 'Used in 1 item', type: 'linked' };
  }
  return { text: `Used in ${count} items`, type: 'multiple' };
};

export const extractFilenameFromUrl = (url: string): string => {
  try {
    // Extract filename from URL
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    
    // Remove query parameters
    const filename = lastPart.split('?')[0];
    
    // If it has a UUID prefix, try to extract the meaningful part
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.+)/i;
    const match = filename.match(uuidRegex);
    
    return match ? match[1] : filename;
  } catch (error) {
    return 'unknown-file';
  }
};

export const cleanFilenameForDisplay = (filename: string): string => {
  // Remove file extension for cleaner display
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Replace underscores and hyphens with spaces
  const cleanName = nameWithoutExt.replace(/[_-]/g, ' ');
  
  // Convert to title case
  return cleanName.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const getUsageIndicatorText = (item: MediaItem): { text: string; type: 'linked' | 'unused' | 'multiple' } => {
  const count = item.usageCount || (item.metadata?.linked_menu_items ? item.metadata.linked_menu_items.length : 0);
  
  if (count === 0) {
    return { text: 'Unused', type: 'unused' };
  } else if (count === 1) {
    return { text: 'Used in 1 item', type: 'linked' };
  } else {
    return { text: `Used in ${count} items`, type: 'multiple' };
  }
};
