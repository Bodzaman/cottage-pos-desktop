/**
 * Media Types
 *
 * Types related to media assets, images, and media library management.
 */

// ================================
// MEDIA ASSET TYPES
// ================================

/**
 * Asset category for organizing media
 */
export type AssetCategory =
  | 'menu-item'
  | 'menu-item-variant'
  | 'ai-avatar'
  | 'marketing'
  | 'gallery'
  | 'general';

/**
 * Media asset representing an uploaded file
 * Includes camelCase aliases for MediaItem compatibility
 */
export interface MediaAsset {
  id: string;
  asset_id?: string; // Alias for id
  file_name: string;
  name?: string; // camelCase alias for file_name
  friendly_name?: string;
  friendlyName?: string; // camelCase alias for friendly_name
  type: string;
  url: string;
  tags: string[];
  description?: string;
  usage?: string;
  upload_date?: string;
  updatedAt?: string; // camelCase alias for upload_date
  file_size?: number;
  size?: number; // camelCase alias for file_size
  width?: number;
  height?: number;
  aspect_ratio?: string;
  aspectRatio?: string; // camelCase alias for aspect_ratio

  // Hierarchical organization fields
  asset_category?: AssetCategory;
  menu_section_id?: string | null;
  menu_category_id?: string | null;

  // Usage tracking fields
  linked_items?: string[];
  usage_count?: number;
  usageCount?: number; // camelCase alias for usage_count
  usage_context?: Record<string, unknown>;
}

/**
 * Detailed media asset information
 */
export interface MediaAssetDetails {
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
  asset_category?: AssetCategory;
  optimized_variants?: Record<string, ImageVariant>;
}

/**
 * Image variant for optimized images
 */
export interface ImageVariant {
  webp_url: string;
  jpeg_url: string;
  width: number;
  height: number;
  size_kb: number;
  webp_size_kb: number;
  jpeg_size_kb: number;
}

/**
 * Media image preview metadata
 */
export interface MediaImagePreviewMetadata {
  id: string;
  url: string;
  width?: number;
  height?: number;
  aspect_ratio?: string;
  variants?: Record<string, ImageVariant>;
}

/**
 * Media item for library display
 * Fields are optional to allow compatibility with MediaAsset
 */
export interface MediaItem {
  id: string;
  name?: string;
  file_name?: string; // Snake_case alias
  friendlyName?: string;
  friendly_name?: string; // Snake_case alias
  size?: number;
  file_size?: number; // Snake_case alias
  type?: string;
  url: string;
  updatedAt?: string;
  upload_date?: string; // Snake_case alias
  description?: string;
  tags?: string[];
  usage?: string;
  asset_category?: AssetCategory;
  width?: number;
  height?: number;
  aspectRatio?: string;
  aspect_ratio?: string; // Snake_case alias
  metadata?: unknown;
  usageCount?: number;
  usage_count?: number; // Snake_case alias
  usageDetails?: {
    usage: string;
    objectId: string;
    objectType: string;
  }[];
}

/**
 * Menu item info for media linking
 */
export interface MenuItemInfo {
  id: string;
  name: string;
  category_name?: string;
  variant_info?: string;
}

/**
 * Enhanced media item with linked items
 */
export interface EnhancedMediaItem extends MediaItem {
  linked_menu_items: MenuItemInfo[];
  usage_count: number;
}
