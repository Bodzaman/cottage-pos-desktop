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
 */
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

  // Hierarchical organization fields
  asset_category?: AssetCategory;
  menu_section_id?: string | null;
  menu_category_id?: string | null;

  // Usage tracking fields
  linked_items?: string[];
  usage_count?: number;
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
 */
export interface MediaItem {
  id: string;
  name: string;
  friendlyName: string;
  size: number;
  type: string;
  url: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  usage?: string;
  asset_category?: AssetCategory;
  width?: number;
  height?: number;
  aspectRatio?: string;
  metadata?: unknown;
  usageCount?: number;
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
