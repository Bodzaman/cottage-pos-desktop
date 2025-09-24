/**
 * React Hook for Image Preloading Integration
 * Provides easy access to preloaded images and loading states
 */

import { useState, useEffect } from 'react';
import { imagePreloader, PreloadedImage } from './imagePreloader';
import { POSBundleMenuItem } from 'types';

interface UseImagePreloaderReturn {
  isImageReady: (url: string) => boolean;
  getImageStatus: (url: string) => PreloadedImage | null;
  initializePreloading: (bundleItems: POSBundleMenuItem[]) => Promise<void>;
  stats: {
    total: number;
    loaded: number;
    failed: number;
    activeLoads: number;
    successRate: number;
  };
  isInitializing: boolean;
}

/**
 * Hook to integrate with the image preloading service
 */
export function useImagePreloader(): UseImagePreloaderReturn {
  const [isInitializing, setIsInitializing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    loaded: 0,
    failed: 0,
    activeLoads: 0,
    successRate: 0
  });
  
  // Update stats periodically during preloading
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isInitializing) {
      intervalId = setInterval(() => {
        setStats(imagePreloader.getStats());
      }, 200);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isInitializing]);
  
  const initializePreloading = async (bundleItems: POSBundleMenuItem[]) => {
    setIsInitializing(true);
    
    try {
      await imagePreloader.initializeFromBundle(bundleItems);
      setStats(imagePreloader.getStats());
    } catch (error) {
      console.error('🖼️ [useImagePreloader] Error initializing preloading:', error);
    } finally {
      setIsInitializing(false);
    }
  };
  
  const isImageReady = (url: string): boolean => {
    return imagePreloader.isImageReady(url);
  };
  
  const getImageStatus = (url: string): PreloadedImage | null => {
    return imagePreloader.getImageStatus(url);
  };
  
  return {
    isImageReady,
    getImageStatus,
    initializePreloading,
    stats,
    isInitializing
  };
}
