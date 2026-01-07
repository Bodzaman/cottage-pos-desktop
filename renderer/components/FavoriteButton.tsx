import React, { useState, useEffect, memo } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from 'app';
import { toast } from 'sonner';

export interface FavoriteButtonProps {
  menuItemId: string;
  menuItemName: string;
  variantId?: string;
  variantName?: string;
  imageUrl?: string;
  userId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

const FavoriteButtonComponent = ({
  menuItemId,
  menuItemName,
  variantId,
  variantName,
  imageUrl,
  userId,
  className,
  size = 'md',
  showLabel = false,
  onFavoriteChange
}: FavoriteButtonProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };

  // Check favorite status on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await apiClient.check_favorite_status({
          user_id: userId,
          menu_item_id: menuItemId,
          variant_id: variantId
        });
        
        const data = await response.json();
        setIsFavorite(data.is_favorite);
        setFavoriteId(data.favorite_id);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    if (userId && menuItemId) {
      checkFavoriteStatus();
    }
  }, [userId, menuItemId, variantId]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await apiClient.remove_favorite({
          user_id: userId,
          menu_item_id: menuItemId,
          variant_id: variantId
        });
        
        const data = await response.json();
        
        if (data.success) {
          setIsFavorite(false);
          setFavoriteId(null);
          toast.success('Removed from favorites');
          onFavoriteChange?.(false);
        } else {
          toast.error(data.message || 'Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        const response = await apiClient.add_favorite({
          user_id: userId,
          menu_item_id: menuItemId,
          menu_item_name: menuItemName,
          variant_id: variantId,
          variant_name: variantName,
          image_url: imageUrl
        });
        
        const data = await response.json();
        
        if (data.success) {
          setIsFavorite(true);
          setFavoriteId(data.favorite_id);
          toast.success('Added to favorites');
          onFavoriteChange?.(true);
        } else {
          toast.error(data.message || 'Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all duration-200',
        'hover:bg-red-50 dark:hover:bg-red-950/20',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        buttonSizeClasses[size],
        className
      )}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          'transition-all duration-200',
          sizeClasses[size],
          isFavorite 
            ? 'fill-red-500 text-red-500 scale-110' 
            : 'text-gray-400 hover:text-red-500',
          isLoading && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className={cn(
          'ml-1 text-sm font-medium',
          isFavorite ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'
        )}>
          {isFavorite ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </button>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: FavoriteButtonProps, nextProps: FavoriteButtonProps): boolean => {
  // Compare core props that affect rendering and functionality
  if (prevProps.menuItemId !== nextProps.menuItemId) return false;
  if (prevProps.userId !== nextProps.userId) return false;
  if (prevProps.variantId !== nextProps.variantId) return false;
  if (prevProps.size !== nextProps.size) return false;
  if (prevProps.showLabel !== nextProps.showLabel) return false;
  if (prevProps.className !== nextProps.className) return false;
  
  // Skip checking onFavoriteChange function as it may be recreated
  // but functionality should remain the same
  
  return true;
};

// Export memoized component
export const FavoriteButton = memo(FavoriteButtonComponent, arePropsEqual);
