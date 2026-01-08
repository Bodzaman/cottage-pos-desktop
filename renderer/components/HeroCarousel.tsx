import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface HeroCarouselProps {
  images: string[];
  interval?: number;
}

export function HeroCarousel({ images, interval = 6000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [runtimeFailedImages, setRuntimeFailedImages] = useState<Set<number>>(new Set());
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset all state when images array changes
  useEffect(() => {
    console.log('[HeroCarousel] Images prop changed, resetting state...');
    setCurrentIndex(0);
    setLoaded(false);
    setLoadedImages(new Set());
    setFailedImages(new Set());
    setRuntimeFailedImages(new Set());
    setAllImagesFailed(false);
  }, [images]);

  // Preload images with comprehensive error handling
  useEffect(() => {
    if (!images || images.length === 0) {
      console.warn('[HeroCarousel] No images provided');
      return;
    }

    console.log(`[HeroCarousel] Starting preload of ${images.length} images...`);
    
    const imageElements = images.map((src, index) => {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        console.log(`[HeroCarousel] ✅ Image ${index + 1}/${images.length} loaded successfully: ${src.substring(0, 60)}...`);
        setLoadedImages(prev => new Set(prev).add(index));
      };
      
      img.onerror = (error) => {
        console.error(`[HeroCarousel] ❌ Image ${index + 1}/${images.length} failed to load: ${src}`, error);
        setFailedImages(prev => new Set(prev).add(index));
      };
      
      return img;
    });

    // Fallback timeout: Show carousel after 3 seconds even if images haven't loaded
    forceLoadTimeoutRef.current = setTimeout(() => {
      if (!loaded) {
        console.warn('[HeroCarousel] ⏰ Timeout reached (3s). Forcing carousel to display...');
        console.log(`[HeroCarousel] Status: ${loadedImages.size} loaded, ${failedImages.size} failed out of ${images.length} total`);
        setLoaded(true);
      }
    }, 3000);

    // Cleanup function
    return () => {
      imageElements.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (forceLoadTimeoutRef.current) {
        clearTimeout(forceLoadTimeoutRef.current);
      }
    };
  }, [images, loaded, loadedImages.size, failedImages.size]);

  // Monitor load progress and set loaded state when ready
  useEffect(() => {
    const totalProcessed = loadedImages.size + failedImages.size;
    
    if (totalProcessed > 0) {
      console.log(`[HeroCarousel] Progress: ${loadedImages.size} loaded, ${failedImages.size} failed, ${totalProcessed}/${images.length} total`);
    }
    
    // Set loaded to true when all images have been processed (loaded or failed)
    if (totalProcessed === images.length && !loaded) {
      console.log('[HeroCarousel] ✅ All images processed. Starting carousel...');
      setLoaded(true);
      
      // Clear the force load timeout since we loaded naturally
      if (forceLoadTimeoutRef.current) {
        clearTimeout(forceLoadTimeoutRef.current);
      }
    }
  }, [loadedImages.size, failedImages.size, images.length, loaded]);

  // Check if all images have failed at runtime
  useEffect(() => {
    if (runtimeFailedImages.size === images.length && images.length > 0) {
      console.error('[HeroCarousel] 🚫 All images failed to render at runtime. Stopping carousel.');
      setAllImagesFailed(true);
    }
  }, [runtimeFailedImages.size, images.length]);

  // Handle carousel rotation
  useEffect(() => {
    if (images.length < 2 || !loaded || allImagesFailed) return;

    const rotate = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    timeoutRef.current = setTimeout(rotate, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, interval, images.length, loaded, allImagesFailed]);

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="animate-pulse p-8 bg-black bg-opacity-50 rounded-lg text-center">
          <div className="text-gray-300 text-lg font-medium mb-2">
            Loading stunning visuals...
          </div>
          <div className="text-gray-400 text-sm mt-2">
            {loadedImages.size} of {images.length} images ready
          </div>
        </div>
      </div>
    );
  }
  
  if (images.length === 0 || allImagesFailed) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center p-8">
          <div className="text-gray-300 text-xl font-medium mb-2">
            Welcome to Cottage Tandoori
          </div>
          <div className="text-gray-400 text-sm">
            {allImagesFailed ? 'Image gallery temporarily unavailable' : 'No images to display'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          <img
            src={images[currentIndex]}
            alt={`Hero image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error(`[HeroCarousel] ❌ Runtime error displaying image ${currentIndex}:`, images[currentIndex]);
              
              // Track this failed image
              setRuntimeFailedImages(prev => {
                const newSet = new Set(prev);
                newSet.add(currentIndex);
                return newSet;
              });
              
              // Only try to skip if not all images have failed
              if (runtimeFailedImages.size + 1 < images.length) {
                // Try next image
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
              }
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Image indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-white scale-110' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30 z-5" />
    </div>
  );
}
