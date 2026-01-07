import React from 'react';
import { getOptimizedImagePreset } from 'utils/imageOptimization';
import { MediaImagePreviewMetadata } from 'utils/menuTypes';

// DEBUG: Verify this module is loading
console.log('🚀 [OptimizedImage MODULE] Loading at:', new Date().toISOString());

/**
 * Props for the OptimizedImage component
 */
interface OptimizedImageProps {
  /** WebP image URL (primary, smallest file) */
  webpUrl?: string;
  /** JPEG fallback URL (for older browsers) */
  jpegUrl?: string;
  /** Legacy/single URL fallback */
  fallbackUrl?: string;
  /** Alt text for accessibility */
  alt: string;
  /** CSS classes to apply */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Aspect ratio variant to use (determines which optimized variant to load) */
  variant?: 'square' | 'widescreen' | 'thumbnail';
  /** Alias for variant (for backward compatibility) */
  preset?: 'card' | 'thumbnail' | 'widescreen';
  /** Media item metadata containing all variant URLs */
  metadata?: any;
  /** Direct image_variants object (alternative to metadata) */
  image_variants?: {
    square?: { webp?: string | null; jpeg?: string | null };
    widescreen?: { webp?: string | null; jpeg?: string | null };
    thumbnail?: { webp?: string | null; jpeg?: string | null };
  } | null;
  /** Image load callback */
  onLoad?: () => void;
  /** Image error callback */
  onError?: () => void;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
}

/**
 * OptimizedImage Component
 * 
 * Displays images using progressive enhancement:
 * 1. Tries WebP format first (70-80% smaller, modern browsers)
 * 2. Falls back to JPEG (universal compatibility)
 * 3. Falls back to legacy URL if no optimized variants exist
 * 
 * Automatically extracts the correct variant URLs from metadata.
 * 
 * @example
 * ```tsx
 * // With metadata (recommended)
 * <OptimizedImage 
 *   metadata={mediaItem.metadata}
 *   variant="square"
 *   alt="Chicken Tikka Masala"
 *   className="w-24 h-24 object-cover rounded"
 * />
 * 
 * // With explicit URLs
 * <OptimizedImage 
 *   webpUrl="https://...square_webp.webp"
 *   jpegUrl="https://...square_jpeg.jpg"
 *   alt="Chicken Tikka Masala"
 *   className="w-24 h-24 object-cover rounded"
 * />
 * 
 * // With legacy URL fallback
 * <OptimizedImage 
 *   fallbackUrl="https://...original.jpg"
 *   alt="Chicken Tikka Masala"
 *   className="w-24 h-24 object-cover rounded"
 * />
 * ```
 */
export function OptimizedImage({
  webpUrl,
  jpegUrl,
  fallbackUrl,
  alt,
  className = '',
  onClick,
  variant = 'square',
  preset,
  metadata,
  image_variants,
  onLoad,
  onError,
  loading = 'lazy'
}: OptimizedImageProps) {
  // Use preset as alias for variant if provided
  const effectiveVariant = variant || (preset === 'card' ? 'square' : preset) || 'square';
  
  // Extract URLs from metadata if provided
  let effectiveWebpUrl = webpUrl;
  let effectiveJpegUrl = jpegUrl;
  
  // Priority 1: Check image_variants prop (new format)
  if (image_variants && typeof image_variants === 'object') {
    const variantData = image_variants[effectiveVariant as keyof typeof image_variants];
    if (variantData) {
      effectiveWebpUrl = effectiveWebpUrl || variantData.webp || undefined;
      effectiveJpegUrl = effectiveJpegUrl || variantData.jpeg || undefined;
    }
  }
  
  // Priority 2: Check metadata prop (legacy format)
  if (metadata && typeof metadata === 'object' && !effectiveWebpUrl && !effectiveJpegUrl) {
    // Try to get optimized variants from metadata
    const variantKey = `${effectiveVariant}_variants` || 'square_variants';
    const variants = metadata[variantKey] || metadata.variants?.[effectiveVariant];
    
    if (variants) {
      effectiveWebpUrl = effectiveWebpUrl || variants.webp_url;
      effectiveJpegUrl = effectiveJpegUrl || variants.jpeg_url;
    }
    
    // Also check for direct URL fields (alternate metadata structure)
    if (!effectiveWebpUrl && metadata[`${effectiveVariant}_webp_url`]) {
      effectiveWebpUrl = metadata[`${effectiveVariant}_webp_url`];
    }
    if (!effectiveJpegUrl && metadata[`${effectiveVariant}_jpeg_url`]) {
      effectiveJpegUrl = metadata[`${effectiveVariant}_jpeg_url`];
    }
  }
  
  // Determine final URLs with fallback chain
  const finalWebpUrl = effectiveWebpUrl || undefined;
  const finalJpegUrl = effectiveJpegUrl || fallbackUrl || undefined;
  const finalFallbackUrl = fallbackUrl || finalJpegUrl || undefined;
  
  // If we have optimized variants, use <picture> for progressive enhancement
  if (finalWebpUrl || (finalJpegUrl && finalJpegUrl !== finalFallbackUrl)) {
    return (
      <picture onClick={onClick} className={className}>
        {finalWebpUrl && (
          <source srcSet={finalWebpUrl} type="image/webp" />
        )}
        {finalJpegUrl && (
          <source srcSet={finalJpegUrl} type="image/jpeg" />
        )}
        <img 
          src={finalFallbackUrl} 
          alt={alt} 
          className={className}
          loading={loading}
          onLoad={onLoad}
          onError={onError}
        />
      </picture>
    );
  }
  
  // Fallback to simple img tag for legacy images
  return (
    <img 
      src={finalFallbackUrl} 
      alt={alt} 
      className={className}
      onClick={onClick}
      loading={loading}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

/**
 * Hook to get optimized image URLs from media item
 * Useful when you need the URLs directly instead of rendering the component
 */
export function useOptimizedImageUrls(
  metadata: any,
  variant: 'square' | 'widescreen' | 'thumbnail' = 'square'
): { webpUrl?: string; jpegUrl?: string } {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  
  const variantKey = `${variant}_variants`;
  const variants = metadata[variantKey] || metadata.variants?.[variant];
  
  if (variants) {
    return {
      webpUrl: variants.webp_url,
      jpegUrl: variants.jpeg_url
    };
  }
  
  // Check for direct URL fields
  return {
    webpUrl: metadata[`${variant}_webp_url`],
    jpegUrl: metadata[`${variant}_jpeg_url`]
  };
}
