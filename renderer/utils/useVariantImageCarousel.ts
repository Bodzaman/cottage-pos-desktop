import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for auto-cycling through variant images with smooth fade transitions
 * 
 * Implements the same animation pattern as HeroCarousel:
 * - Auto-cycles through images every 3-5 seconds (configurable)
 * - Smooth fade transition (1.5s duration, easeInOut)
 * - Preloads images for smooth experience
 * - Cleanup on unmount
 * - ✅ NEW: Manual navigation controls (prev/next/jump)
 * - ✅ NEW: External pause control for user interaction
 * 
 * @param variantImages - Array of variant image URLs to cycle through
 * @param interval - Time between transitions in milliseconds (default: 4000ms = 4s)
 * @param isPaused - External pause control (default: false)
 * @returns Current image URL, index, loading state, and navigation methods
 * 
 * @example
 * ```tsx
 * const variants = itemVariants?.filter(v => v.menu_item_id === item.id) || [];
 * const variantImages = variants
 *   .map(v => v.image_url)
 *   .filter((url): url is string => !!url);
 * 
 * const { currentImage, currentIndex, goToPrevious, goToNext } = useVariantImageCarousel(variantImages, 8500, isPaused);
 * 
 * // Use currentImage in your component
 * <OptimizedImage src={currentImage || fallback} ... />
 * 
 * // Use navigation controls
 * <button onClick={goToPrevious}>←</button>
 * <button onClick={goToNext}>→</button>
 * ```
 */
export function useVariantImageCarousel(
  variantImages: string[],
  interval: number = 4000,
  isPaused: boolean = false
): {
  currentImage: string | null;
  currentIndex: number;
  isLoading: boolean;
  goToPrevious: () => void;
  goToNext: () => void;
  goToIndex: (index: number) => void;
} {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preload images
  useEffect(() => {
    if (!variantImages || variantImages.length === 0) {
      setIsLoading(false);
      return;
    }

    // Single image - no need to preload
    if (variantImages.length === 1) {
      setIsLoading(false);
      return;
    }

    let loadedCount = 0;
    const imageElements = variantImages.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === variantImages.length) {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        // Count errors as "loaded" to prevent blocking
        loadedCount++;
        if (loadedCount === variantImages.length) {
          setIsLoading(false);
        }
      };
      return img;
    });

    // Cleanup function
    return () => {
      imageElements.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [variantImages]);

  // Handle carousel rotation
  useEffect(() => {
    // Don't rotate if less than 2 images, still loading, or paused
    if (variantImages.length < 2 || isLoading || isPaused) {
      return;
    }

    const rotate = () => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % variantImages.length;
        return nextIndex;
      });
    };

    timeoutRef.current = setTimeout(rotate, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, interval, variantImages.length, isLoading, isPaused]);

  // Reset index when images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [variantImages]);

  // Manual navigation methods
  const goToPrevious = useCallback(() => {
    if (variantImages.length < 2) return;
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex === 0 ? variantImages.length - 1 : prevIndex - 1;
      return newIndex;
    });
  }, [variantImages.length]);

  const goToNext = useCallback(() => {
    if (variantImages.length < 2) return;
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % variantImages.length;
      return newIndex;
    });
  }, [variantImages.length]);

  const goToIndex = useCallback((index: number) => {
    if (index < 0 || index >= variantImages.length) return;
    setCurrentIndex(index);
  }, [variantImages.length]);

  return {
    currentImage: variantImages[currentIndex] || null,
    currentIndex,
    isLoading,
    goToPrevious,
    goToNext,
    goToIndex
  };
}
