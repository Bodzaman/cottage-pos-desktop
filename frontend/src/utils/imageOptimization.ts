import { API_URL } from '../utils/environment';

/**
 * Image optimization utility using Supabase's built-in transformations
 * 
 * Automatically resizes and converts images using Supabase Storage's native capabilities.
 * Works client-side without authentication, cached by Supabase CDN.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Get optimized image URL using Supabase's built-in transformations
 * 
 * @param originalUrl - Original Supabase or external image URL
 * @param options - Optimization parameters
 * @returns Optimized image URL with transformation params or original URL
 * 
 * @example
 * ```tsx
 * // Card view (400x400 WebP)
 * const optimizedUrl = getOptimizedImageUrl(item.image_url, { width: 400, height: 400 });
 * 
 * // List view (80x80 WebP)
 * const thumbnailUrl = getOptimizedImageUrl(item.image_url, { width: 80, height: 80 });
 * ```
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string | null {
  // Return null if no URL provided
  if (!originalUrl) {
    return null;
  }

  // Check if this is a Supabase Storage URL
  const isSupabaseUrl = originalUrl.includes('.supabase.co/storage/v1/object/public/');
  
  if (!isSupabaseUrl) {
    // For non-Supabase URLs (like Unsplash), return original
    return originalUrl;
  }

  // Default options optimized for menu cards
  const {
    width = 400,
    height = 400,
    quality = 85,
    format = 'webp'
  } = options;

  // Build Supabase transformation URL
  // Supabase requires /render/image/ endpoint for transformations
  // Format: https://[project].supabase.co/storage/v1/render/image/public/[bucket]/[path]?width=400&height=400&quality=85
  const transformUrl = originalUrl.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  
  const url = new URL(transformUrl);
  url.searchParams.set('width', width.toString());
  url.searchParams.set('height', height.toString());
  url.searchParams.set('quality', quality.toString());
  url.searchParams.set('resize', 'cover'); // cover = crop to fill, maintain aspect ratio
  
  const finalUrl = url.toString();

  return finalUrl;
}

/**
 * Preset optimization configs for common use cases
 */
export const ImagePresets = {
  /** Card view - 400x400 WebP @ 85% quality */
  CARD: { width: 400, height: 400, format: 'webp' as const, quality: 85 },
  
  /** List view thumbnail - 80x80 WebP @ 85% quality */
  THUMBNAIL: { width: 80, height: 80, format: 'webp' as const, quality: 85 },
  
  /** Large preview - 800x800 WebP @ 90% quality */
  LARGE: { width: 800, height: 800, format: 'webp' as const, quality: 90 },
  
  /** Small icon - 50x50 WebP @ 80% quality */
  ICON: { width: 50, height: 50, format: 'webp' as const, quality: 80 },
  
  /** High quality card - 400x400 WebP @ 95% quality */
  CARD_HQ: { width: 400, height: 400, format: 'webp' as const, quality: 95 },
};

/**
 * Get optimized image URL using preset configurations
 * 
 * @example
 * ```tsx
 * const cardImage = getOptimizedImagePreset(item.image_url, 'CARD');
 * const thumbnail = getOptimizedImagePreset(item.image_url, 'THUMBNAIL');
 * ```
 */
export function getOptimizedImagePreset(
  originalUrl: string | null | undefined,
  preset: keyof typeof ImagePresets
): string | null {
  return getOptimizedImageUrl(originalUrl, ImagePresets[preset]);
}
