import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailSrc?: string; // Low-res thumbnail for initial display
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: React.ReactNode;
}

/**
 * LazyImage component with intersection observer for performance
 * Features:
 * - Loads images only when they come into viewport
 * - Shows low-res thumbnail first if available
 * - Fallback placeholder while loading
 * - Error handling
 */
export function LazyImage({
  src,
  alt,
  className = '',
  thumbnailSrc,
  onLoad,
  onError,
  placeholder
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when image comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of image is visible
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle image load success
  const handleLoad = () => {
    setIsLoaded(true);
    setShowFullImage(true);
    onLoad?.();
  };

  // Handle image load error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Default placeholder
  const defaultPlaceholder = (
    <div 
      className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-600 animate-pulse"
    />
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Show thumbnail first if available and full image hasn't loaded */}
      {thumbnailSrc && !showFullImage && isInView && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ filter: 'blur(2px)' }}
        />
      )}
      
      {/* Main image - only load when in view */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            showFullImage ? 'opacity-100' : 'opacity-0'
          } ${thumbnailSrc ? 'absolute inset-0' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      
      {/* Placeholder/Error state */}
      {(!isInView || hasError || (!thumbnailSrc && !showFullImage)) && (
        <div className={`${
          thumbnailSrc || showFullImage ? 'absolute inset-0' : ''
        } ${!isInView || hasError ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
          {hasError ? (
            <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
              <div className="text-gray-400 text-sm">Image unavailable</div>
            </div>
          ) : (
            placeholder || defaultPlaceholder
          )}
        </div>
      )}
    </div>
  );
}
