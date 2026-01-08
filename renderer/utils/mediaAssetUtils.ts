import { supabase } from './supabaseClient';
import { apiClient } from 'app';
import { MediaItem } from './mediaLibraryUtils';

/**
 * Enhanced interface for media assets with detailed information
 */
export interface MediaAssetDetails {
  id: string;
  file_name: string;
  storage_path: string;
  url: string;
  mime_type: string;
  file_extension: string;
  size_bytes: number;
  width: number;
  height: number;
  aspect_ratio: string;
  description: string;
  tags: string[];
  upload_date: string;
  user_id: string | null;
  usage: string | null;
  usages_count: number;
  metadata: Record<string, any> | null;
}

/**
 * Fetch detailed media asset information from the database
 * @param assetId The media asset ID to fetch
 * @returns The media asset details or null if not found
 */
export const fetchMediaAssetDetails = async (assetId: string): Promise<{
  success: boolean;
  asset?: MediaAssetDetails;
  message?: string;
  error?: any;
}> => {
  if (!assetId) {
    return {
      success: false,
      message: 'Asset ID is required'
    };
  }
  
  try {
    // Try the API endpoint first
    try {
      const response = await apiClient.get_media_asset({ asset_id: assetId });
      const data = await response.json();
      
      if (data.success && data.asset) {
        return {
          success: true,
          asset: data.asset
        };
      }
    } catch (apiError) {
      console.warn('API fetch failed, falling back to direct Supabase query', apiError);
    }
    
    // Fallback to direct query if API fails
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', assetId)
      .single();
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      return {
        success: false,
        message: 'Media asset not found'
      };
    }
    
    // Transform data to match the MediaAssetDetails interface
    const asset: MediaAssetDetails = {
      id: data.id,
      file_name: data.file_name,
      storage_path: data.storage_path,
      url: data.url,
      mime_type: data.mime_type || '',
      file_extension: data.file_extension || '',
      size_bytes: data.size_bytes || 0,
      width: data.width || 0,
      height: data.height || 0,
      aspect_ratio: data.aspect_ratio || '',
      description: data.description || '',
      tags: data.tags || [],
      upload_date: data.upload_date || new Date().toISOString(),
      user_id: data.user_id,
      usage: data.usage,
      usages_count: data.usages_count || 0,
      metadata: data.metadata
    };
    
    return {
      success: true,
      asset
    };
  } catch (error) {
    console.error('Error fetching media asset details:', error);
    return {
      success: false,
      message: 'Failed to fetch media asset details',
      error
    };
  }
};

/**
 * Format a media asset from the database into the Media interface used by components
 * @param asset The media asset from the database 
 * @returns A formatted Media object
 */
export const formatMediaAsset = (asset: MediaAssetDetails) => {
  // Determine if this is a video based on mime type or file extension
  const isVideo = asset.mime_type?.startsWith('video/') ||
    ['mp4', 'mov', 'webm', 'avi'].includes(asset.file_extension?.toLowerCase());
  
  // Get a more user-friendly name from description if available
  const displayName = asset.description || asset.file_name;
  
  return {
    id: asset.id,
    url: asset.url,
    name: displayName,
    type: isVideo ? 'video' : 'image',
    fileExtension: asset.file_extension,
    width: asset.width,
    height: asset.height,
    size: asset.size_bytes,
    aspectRatio: asset.aspect_ratio,
    tags: asset.tags,
    description: asset.description,
    uploadDate: asset.upload_date,
    mimeType: asset.mime_type
  };
};

/**
 * Update the usage information for a media asset
 * @param assetId The ID of the media asset
 * @param options Usage information options
 * @returns Success status
 */
export const updateMediaAssetUsage = async (
  assetId: string,
  options: { 
    usage: string;
    description?: string;
    tags?: string[];
    objectId?: string;
  }
): Promise<{success: boolean; message?: string}> => {
  if (!assetId || !options.usage) {
    return { success: false, message: 'Missing required parameters' };
  }
  
  try {
    // Try using the API first for proper tracking and event handling
    try {
      const response = await apiClient.update_media_asset({
        asset_id: assetId
      }, {
        usage: options.usage,
        usage_object_id: options.objectId || null,
        description: options.description,
        tags: options.tags ? options.tags.join(',') : undefined
      });
      
      const data = await response.json();
      if (data.success) {
        return { success: true };
      }
    } catch (apiError) {
      console.warn('API update failed, falling back to direct update', apiError);
    }
    
    // Fallback to direct update
    // First, get current asset to preserve existing data
    const { data: currentAsset, error: fetchError } = await supabase
      .from('media_assets')
      .select('metadata, tags, usage, usages_count, description')
      .eq('id', assetId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    // Prepare updated metadata
    const metadata = currentAsset.metadata || {};
    if (!metadata.usages) metadata.usages = [];
    
    // Check if this usage already exists
    const existingUsageIndex = metadata.usages.findIndex(
      (u: any) => u.objectId === options.objectId && u.usage === options.usage
    );
    
    if (existingUsageIndex === -1) {
      // Add new usage
      metadata.usages.push({
        usage: options.usage,
        objectId: options.objectId,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing usage
      metadata.usages[existingUsageIndex].updatedAt = new Date().toISOString();
    }
    
    // Merge tags if provided
    const tags = currentAsset.tags || [];
    if (options.tags) {
      options.tags.forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }
    
    // Update description if provided
    const description = options.description || currentAsset.description;
    
    // Update the asset
    const { error: updateError } = await supabase
      .from('media_assets')
      .update({
        usage: options.usage, // Set most recent usage
        usages_count: (currentAsset.usages_count || 0) + (existingUsageIndex === -1 ? 1 : 0),
        metadata,
        tags,
        description
      })
      .eq('id', assetId);
      
    if (updateError) {
      throw updateError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating media asset usage:', error);
    return {
      success: false,
      message: 'Failed to update media asset usage'
    };
  }
};
