import { useMemo, useState, useEffect } from 'react';
import { getOptimizedImageUrl } from './imageOptimization';

const CAROUSEL_INTERVAL = 8500; // 8.5 seconds between image rotations

/**
 * Context determines image optimization strategy:
 * - 'pos': Return original URLs for fastest loading (staff needs speed)
 * - 'customer': Apply Supabase optimization for bandwidth savings
 */
type ImageContext = 'pos' | 'customer';

interface UseMenuItemImageOptions {
  /** Menu item with optional image_url */
  item: { id: string; image_url?: string | null };
  /** Item variants that may have their own images */
  variants?: Array<{ image_url?: string | null }>;
  /** Determines optimization strategy */
  context: ImageContext;
  /** Enable image carousel for multi-image items */
  enableCarousel?: boolean;
  /** Custom carousel interval in ms (default: 8500) */
  carouselInterval?: number;
}

interface UseMenuItemImageResult {
  /** Resolved image URL, or null if no image available */
  imageUrl: string | null;
  /** Quick boolean check - true if imageUrl is not null */
  hasImage: boolean;
  /** True if carousel is active (multiple images + carousel enabled) */
  isCarouselActive: boolean;
  /** Current image index in the carousel */
  currentImageIndex: number;
  /** Total number of available images */
  totalImages: number;
  /** All collected image URLs */
  allImageUrls: string[];
  /** True once all carousel images have been preloaded into browser cache */
  imagesPreloaded: boolean;
}

/**
 * useMenuItemImage - Unified hook for menu item image resolution
 *
 * **Single source of truth** for all image loading logic across menu cards.
 *
 * **Features:**
 * - Collects images from item.image_url and variant.image_url
 * - Context-aware optimization (POS = raw URLs, Customer = optimized)
 * - Built-in carousel support with configurable interval
 * - Returns null for no-image items (caller hides image section)
 *
 * **Image Priority:**
 * 1. item.image_url (base item image)
 * 2. variants[].image_url (variant images, in order)
 * 3. null (no image available)
 *
 * @example
 * ```tsx
 * const { imageUrl, hasImage } = useMenuItemImage({
 *   item,
 *   variants,
 *   context: 'pos',
 *   enableCarousel: true
 * });
 *
 * // Conditionally render image section
 * {hasImage && <img src={imageUrl} alt={item.name} />}
 * ```
 */
export function useMenuItemImage({
  item,
  variants = [],
  context,
  enableCarousel = false,
  carouselInterval = CAROUSEL_INTERVAL
}: UseMenuItemImageOptions): UseMenuItemImageResult {

  // ============================================================================
  // STEP 1: Collect all available image URLs
  // ============================================================================
  // Stable key derived from variant image URLs to avoid recalculating on array reference changes
  const variantsImageKey = useMemo(
    () => variants.map(v => v.image_url || '').join('|'),
    [variants]
  );

  const allImageUrls = useMemo(() => {
    const images: string[] = [];

    // Priority 1: Base item image (always first if exists)
    if (item.image_url) {
      images.push(item.image_url);
    }

    // Priority 2: Variant images (in order, no duplicates)
    variants.forEach(variant => {
      if (variant.image_url && !images.includes(variant.image_url)) {
        images.push(variant.image_url);
      }
    });

    return images;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.image_url, variantsImageKey]);

  // ============================================================================
  // STEP 1.5: Preload all carousel images into browser cache
  // ============================================================================
  const [imagesPreloaded, setImagesPreloaded] = useState(allImageUrls.length <= 1);

  useEffect(() => {
    // Single or no images — nothing to preload
    if (allImageUrls.length <= 1) {
      setImagesPreloaded(true);
      return;
    }

    setImagesPreloaded(false);
    let loadedCount = 0;
    const total = allImageUrls.length;

    const imageElements = allImageUrls.map((src) => {
      const img = new Image();
      img.src = src;
      const onDone = () => {
        loadedCount++;
        if (loadedCount >= total) setImagesPreloaded(true);
      };
      img.onload = onDone;
      img.onerror = onDone; // Count errors as loaded to prevent blocking
      return img;
    });

    return () => {
      imageElements.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [allImageUrls]);

  // ============================================================================
  // STEP 2: Carousel state management
  // ============================================================================
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index if images change (e.g., variants loaded async)
  useEffect(() => {
    if (currentIndex >= allImageUrls.length) {
      setCurrentIndex(0);
    }
  }, [allImageUrls.length, currentIndex]);

  // Carousel rotation effect — gated on preloading completion
  useEffect(() => {
    // Don't run carousel if disabled, only one image, or images not yet preloaded
    if (!enableCarousel || allImageUrls.length <= 1 || !imagesPreloaded) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % allImageUrls.length);
    }, carouselInterval);

    return () => clearInterval(interval);
  }, [enableCarousel, allImageUrls.length, carouselInterval, imagesPreloaded]);

  // ============================================================================
  // STEP 3: Get current raw image URL
  // ============================================================================
  const rawImageUrl = allImageUrls.length > 0 ? allImageUrls[currentIndex] : null;

  // ============================================================================
  // STEP 4: Apply context-specific optimization
  // ============================================================================
  const imageUrl = useMemo(() => {
    if (!rawImageUrl) {
      return null;
    }

    if (context === 'pos') {
      // POS: Return original URL for fastest loading
      // Staff needs speed, images are already on CDN
      return rawImageUrl;
    } else {
      // Customer-facing: Apply Supabase optimization
      // Reduces bandwidth, transforms images server-side
      return getOptimizedImageUrl(rawImageUrl) || rawImageUrl;
    }
  }, [rawImageUrl, context]);

  // ============================================================================
  // STEP 5: Return result object
  // ============================================================================
  return {
    imageUrl,
    hasImage: imageUrl !== null,
    isCarouselActive: enableCarousel && allImageUrls.length > 1,
    currentImageIndex: currentIndex,
    totalImages: allImageUrls.length,
    allImageUrls,
    imagesPreloaded
  };
}

/**
 * Simple utility to check if an item has any images without using the hook
 * Useful for static checks or SSR scenarios
 */
export function menuItemHasImage(
  item: { image_url?: string | null },
  variants: Array<{ image_url?: string | null }> = []
): boolean {
  if (item.image_url) return true;
  return variants.some(v => !!v.image_url);
}
