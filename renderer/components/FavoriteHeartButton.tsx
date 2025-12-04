


import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useSimpleAuth } from '../utils/simple-auth-context';

interface Props {
  menuItemId: string;
  menuItemName: string;
  variantId?: string;
  variantName?: string;
  imageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteHeartButton({
  menuItemId,
  menuItemName,
  variantId,
  variantName,
  imageUrl,
  className = '',
  size = 'md'
}: Props) {
  const { user, isFavorite, addFavorite, removeFavorite, favorites } = useSimpleAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Size variants
  const sizeClasses = {
    sm: 'h-5 w-5 p-1.5',
    md: 'h-8 w-8 p-2',
    lg: 'h-10 w-10 p-2.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Check if this item is favorited using SimpleAuth
  const isItemFavorited = isFavorite(menuItemId, variantId || null);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (isItemFavorited) {
        // Find the favorite to remove
        const favoriteToRemove = favorites.find(fav => 
          fav.menu_item_id === menuItemId && 
          fav.variant_id === (variantId || null)
        );
        
        if (favoriteToRemove) {
          const { error } = await removeFavorite(favoriteToRemove.id);
          if (error) {
            toast.error('Failed to remove from favorites');
          } else {
            toast.success('Removed from favorites');
          }
        }
      } else {
        // Add to favorites
        const { error } = await addFavorite(
          menuItemId,
          menuItemName,
          variantId || null,
          variantName || null,
          imageUrl || null
        );
        
        if (error) {
          toast.error('Failed to add to favorites');
        } else {
          toast.success('Added to favorites!');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    // Hide heart icon for non-authenticated users
    return null;
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]} 
        rounded-md bg-black/50 transition-all duration-200 
        flex items-center justify-center
        ${ isItemFavorited
          ? 'text-red-500 hover:bg-black/60' 
          : 'text-white/80 hover:text-white hover:bg-black/60'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      <Heart 
        className={`${iconSizes[size]} transition-all duration-200 ${
          isItemFavorited ? 'fill-current' : ''
        }`}
      />
    </button>
  );
}
