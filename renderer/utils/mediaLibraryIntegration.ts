/**
 * Upload a media item to the media library and track its usage.
 * This is a convenience function that combines uploadMedia and trackMediaUsage.
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
      await trackMediaUsage(mediaItem.id, usage, description);
    }
    
    return mediaItem;
  } catch (error) {
    console.error('Error uploading and tracking media:', error);
    throw error;
  }
};

/**
 * Get recommended tags for menu items based on their category or content
 */
export const getRecommendedMenuItemTags = (categoryName?: string): string[] => {
  const baseTags = ['menu-item'];
  
  if (categoryName) {
    // Sanitize category name for tags (lowercase, no spaces)
    const sanitizedCategory = categoryName.toLowerCase().replace(/\s+/g, '-');
    baseTags.push(sanitizedCategory);
  }
  
  return baseTags;
};

/**
 * Check if the media migration has been run to ensure all storage images are in the media library
 */
export const checkMediaMigrationStatus = async (): Promise<{
  migrationComplete: boolean;
  needsAttention: boolean;
  message: string;
}> => {
  try {
    const response = await apiClient.check_migration_status2();
    const data = await response.json();
    
    if (!data.success) {
      return {
        migrationComplete: false,
        needsAttention: true,
        message: 'Unable to check media migration status'
      };
    }
    
    // Check if all images are tracked
    const allTracked = data.total_images <= data.imported_images;
    
    return {
      migrationComplete: allTracked,
      needsAttention: !allTracked,
      message: data.message || 'Media migration status checked successfully'
    };
  } catch (error) {
    console.error('Error checking media migration status:', error);
    return {
      migrationComplete: false,
      needsAttention: true,
      message: `Error checking migration: ${error.message}`
    };
  }
};// Centralized Media Library integration utilities
import { toast } from 'sonner';
import { MediaItem, uploadMedia, updateMediaAsset, updateMediaAssetUsage } from './mediaLibraryUtils';
import { apiClient } from 'app';

/**
 * Initializes the media library schema if it doesn't exist yet.
 * This should be called by components that need to use the media library
 * when they first load.
 */
export const initializeMediaLibrary = async (): Promise<boolean> => {
  try {
    // Check if schema exists
    const schemaCheckResponse = await apiClient.check_media_assets_schema_status();
    const schemaCheckData = await schemaCheckResponse.json();
    
    // If schema doesn't exist, set it up
    if (!schemaCheckData.exists) {
      console.log('Media assets schema does not exist, setting up...');
      const schemaSetupResponse = await apiClient.setup_unified_media_schema();
      const schemaSetupData = await schemaSetupResponse.json();
      
      // Check if setup was successful based on the success flag or message
      if (!schemaSetupData.success) {
        // Check for benign errors like "already exists" or successful SQL execution
        const errorDetails = schemaSetupData.error || '';
        if (errorDetails.includes('SQL executed successfully') || 
            errorDetails.includes('already exists')) {
          console.log('Schema exists or was created successfully despite error code, proceeding...');
          return true;
        } else {
          // This is a genuine error
          console.error('Schema setup failed:', errorDetails);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing media library schema:', error);
    return false;
  }
};

/**
 * Gets a list of recently added media assets.
 * This is useful for quick selection of recently uploaded items.
 */
export const getRecentMedia = async (limit: number = 5): Promise<MediaItem[]> => {
  try {
    const response = await apiClient.get_recent_media_assets({ limit });
    const data = await response.json();
    
    if (!data.success || !data.assets) {
      return [];
    }
    
    // Convert API response to MediaItem format for consistent usage
    return data.assets.map((asset: any) => ({
      id: asset.id,
      name: asset.file_name,
      friendlyName: asset.friendly_name || asset.file_name,
      size: asset.file_size || 0,
      url: asset.url,
      updatedAt: asset.upload_date || new Date().toISOString(),
      type: asset.type,
      tags: asset.tags || [],
      usage: asset.usage || '',
      description: asset.description || '',
      metadata: {
        tags: asset.tags || [],
        usage: asset.usage || '',
        type: asset.type
      }
    }));
  } catch (error) {
    console.error('Error fetching recent media:', error);
    return [];
  }
};

/**
 * Track usage of a media item.
 * This updates the usage field to help track where media is being used.
 */
export const trackMediaUsage = async (mediaItemId: string, usage: string, description?: string): Promise<boolean> => {
  try {
    // Use the updateMediaAssetUsage helper function from mediaLibraryUtils
    await updateMediaAssetUsage(mediaItemId, { usage, description });
    return true;
  } catch (error) {
    console.error('Error tracking media usage:', error);
    return false;
  }
};

/**
 * Creates a media selector button that opens the MediaSelector component.
 * Example usage:
 * 
 * const { triggerMediaSelect } = useMediaSelector({
 *   onSelect: (media) => {
 *     console.log('Selected media:', media);
 *     setImageUrl(media.url);
 *   },
 *   mediaType: 'image',
 *   usage: 'menu-item',
 *   aspectRatio: 'square'
 * });
 * 
 * return (
 *   <Button onClick={() => triggerMediaSelect()}>Select Media</Button>
 * );
 */
export const useMediaSelector = ({
  onSelect,
  mediaType = 'image',
  usage = '',
  aspectRatio = 'any',
  tags = [],
}: {
  onSelect: (media: MediaItem) => void;
  mediaType?: 'image' | 'video' | 'all';
  usage?: string;
  aspectRatio?: 'square' | 'widescreen' | 'any';
  tags?: string[];
}) => {
  return {
    triggerMediaSelect: () => {
      // Initialization happens in the MediaSelector component
      // This just provides an interface for other components
      window.dispatchEvent(new CustomEvent('open-media-selector', {
        detail: {
          mediaType,
          usage,
          aspectRatio,
          tags,
          onSelectCallback: onSelect
        }
      }));
    }
  };
};
