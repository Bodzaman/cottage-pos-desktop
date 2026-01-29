/**
 * Signature Dish React Query Hooks
 *
 * React Query-based data fetching for featured menu items (signature dishes).
 * Used by the SignatureDishSection component on the Home page.
 */

import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import type { SignatureDish } from 'types';

// ==============================================================================
// QUERY KEYS
// ==============================================================================

export const signatureDishKeys = {
  all: ['signature-dishes'] as const,
  featured: () => [...signatureDishKeys.all, 'featured'] as const,
};

// ==============================================================================
// TYPES
// ==============================================================================

interface MenuItemVariant {
  id: string;
  name?: string;
  variant_name?: string;
  price: number;
  image_url?: string;
  description?: string;
  featured?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_halal?: boolean;
  is_dairy_free?: boolean;
  is_nut_free?: boolean;
}

interface MenuItemWithVariants {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price?: number;
  featured?: boolean;
  variants?: MenuItemVariant[];
}

// ==============================================================================
// FETCHERS
// ==============================================================================

async function fetchSignatureDishes(): Promise<SignatureDish[]> {
  const response = await brain.view_menu_items_with_variants();
  const data = await response.json();

  if (!data.success || !data.menu_items) {
    console.log('[signatureDishQueries] No menu items returned');
    return [];
  }

  // Build flattened list of featured variants (matching original logic)
  const featuredVariants: SignatureDish[] = [];

  for (const item of data.menu_items as MenuItemWithVariants[]) {
    const baseFeatured = item.featured === true;
    const hasVariants = item.variants && item.variants.length > 0;

    if (!hasVariants) {
      // Single item (no variants) - use base featured flag
      if (baseFeatured) {
        const prices = [item.price].filter(p => p != null);
        const minPrice = prices.length > 0 ? prices[0] : 0;

        featuredVariants.push({
          id: item.id,
          title: item.name,
          description: item.description || 'Delicious dish prepared with traditional spices and cooking methods.',
          main_image: item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          spice_level: 0,
          tags: ['signature'],
          category: 'house-special',
          price: { 'Standard': `£${(minPrice || 0).toFixed(2)}` },
          has_variants: false,
          variants: []
        } as SignatureDish);
      }
    } else {
      // Item with variants - apply combined logic
      const variants = item.variants!;
      const featuredVariantsList = variants.filter(v => v.featured === true);

      if (baseFeatured && featuredVariantsList.length === 0) {
        // Base featured ON + No variant featured → Show all variants
        for (const variant of variants) {
          featuredVariants.push({
            id: `${item.id}-${variant.id}`,
            title: `${item.name} (${variant.name || variant.variant_name})`,
            description: variant.description || item.description || 'Delicious dish prepared with traditional spices and cooking methods.',
            main_image: variant.image_url || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            spice_level: 0,
            tags: ['signature'],
            category: 'house-special',
            price: { 'Standard': `£${(variant.price || 0).toFixed(2)}` },
            has_variants: false,
            variants: []
          } as SignatureDish);
        }
      } else if (featuredVariantsList.length > 0) {
        // Variant featured ON → Show only featured variants (base flag doesn't matter)
        for (const variant of featuredVariantsList) {
          featuredVariants.push({
            id: `${item.id}-${variant.id}`,
            title: `${item.name} (${variant.name || variant.variant_name})`,
            description: variant.description || item.description || 'Delicious dish prepared with traditional spices and cooking methods.',
            main_image: variant.image_url || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            spice_level: 0,
            tags: ['signature'],
            category: 'house-special',
            price: { 'Standard': `£${(variant.price || 0).toFixed(2)}` },
            has_variants: false,
            variants: []
          } as SignatureDish);
        }
      }
      // Both OFF → Item not featured (skip)
    }
  }

  console.log('[signatureDishQueries] Fetched', featuredVariants.length, 'signature dishes');
  return featuredVariants;
}

// ==============================================================================
// HOOKS
// ==============================================================================

/**
 * Hook to fetch featured menu items (signature dishes).
 * Uses React Query for automatic caching and deduplication.
 *
 * @example
 * ```tsx
 * const { data: dishes, isLoading, error } = useSignatureDishes();
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 *
 * return <DishGrid dishes={dishes} />;
 * ```
 */
export function useSignatureDishes() {
  return useQuery({
    queryKey: signatureDishKeys.featured(),
    queryFn: fetchSignatureDishes,
    staleTime: 10 * 60 * 1000, // 10 minutes (featured items rarely change)
    gcTime: 60 * 60 * 1000,    // 1 hour retention
    placeholderData: [],       // Return empty array while loading
  });
}
