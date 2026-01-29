/**
 * Gallery React Query Hooks
 *
 * React Query-based data fetching for gallery images from menu data.
 */

import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import type { GalleryImage } from './galleryData';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const galleryKeys = {
  all: ['gallery'] as const,
  menuImages: () => [...galleryKeys.all, 'menu-images'] as const,
};

// ==============================================================================
// FETCHERS
// ==============================================================================

interface MenuDataResponse {
  items?: Array<{
    image_url?: string;
    name?: string;
  }>;
}

async function fetchMenuImagesForGallery(): Promise<GalleryImage[]> {
  const response = await brain.get_real_menu_data();
  const menuData: MenuDataResponse = await response.json();

  if (!menuData?.items) {
    return [];
  }

  // Convert menu items to gallery images - ONLY items with real image URLs
  const menuGalleryItems: GalleryImage[] = [];

  menuData.items.forEach((item, index) => {
    // Only include items that have a real image_url from database
    if (item.image_url && item.image_url.trim() !== '') {
      menuGalleryItems.push({
        id: 1000 + index, // Start from 1000 to avoid conflicts with venue images
        src: item.image_url,
        alt: item.name || 'Menu item',
        category: 'food',
        title: item.name,
      });
    }
  });

  console.log('[galleryQueries] Fetched', menuGalleryItems.length, 'menu images for gallery');
  return menuGalleryItems;
}

// ==============================================================================
// HOOKS
// ==============================================================================

/**
 * Hook to fetch menu items as gallery images.
 * Uses React Query for automatic caching and deduplication.
 *
 * @example
 * ```tsx
 * const { data: menuImages, isLoading } = useGalleryMenuImages();
 * const allImages = [...menuImages, ...venueImages];
 * ```
 */
export function useGalleryMenuImages() {
  return useQuery({
    queryKey: galleryKeys.menuImages(),
    queryFn: fetchMenuImagesForGallery,
    staleTime: 30 * 60 * 1000, // 30 minutes (gallery images change infrequently)
    gcTime: 60 * 60 * 1000,    // 1 hour retention
    placeholderData: [], // Return empty array while loading
  });
}
