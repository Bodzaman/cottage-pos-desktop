
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface HeroCarouselProps {
  images: string[];
  interval?: number;
}

export function HeroCarousel({ images, interval = 6000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preload images
  useEffect(() => {
    if (!images || images.length === 0) return;

    let loadedCount = 0;
    const imageElements = images.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          setLoaded(true);
        }
      };
      return img;
    });

    // Cleanup function
    return () => {
      imageElements.forEach((img) => {
        img.onload = null;
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [images]);

  // Handle carousel rotation
  useEffect(() => {
    if (images.length < 2 || !loaded) return;

    const rotate = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    timeoutRef.current = setTimeout(rotate, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, interval, images.length, loaded]);

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="animate-pulse p-8 bg-black bg-opacity-50 rounded-lg text-center">
          <div className="text-gray-300 text-lg font-medium mb-2">
            Loading stunning visuals...
          </div>
        </div>
      </div>
    );
  }
  
  if (images.length === 0) {
      return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-gray-400">No images to display.</div>
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
