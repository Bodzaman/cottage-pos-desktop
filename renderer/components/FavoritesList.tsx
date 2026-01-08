import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from 'app';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OptimizedImage } from 'components/OptimizedImage';

export interface FavoriteItem {
  id: string;
  user_id: string;
  menu_item_id: string;
  menu_item_name: string;
  variant_id?: string;
  variant_name?: string;
  image_url?: string;
  created_at: string;
}

export interface FavoriteItemCardProps {
  item: FavoriteItem;
  onRemove: (itemId: string) => void;
  onAddToCart?: (item: FavoriteItem) => void;
  className?: string;
}

export function FavoriteItemCard({ item, onRemove, onAddToCart, className }: FavoriteItemCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleRemove = async () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    try {
      const response = await apiClient.remove_favorite({
        user_id: item.user_id,
        menu_item_id: item.menu_item_id,
        variant_id: item.variant_id
      });
      
      const data = await response.json();
      
      if (data.success) {
        onRemove(item.id);
        toast.success('Removed from favorites');
      } else {
        toast.error(data.message || 'Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      // Call the onAddToCart prop if provided
      if (onAddToCart) {
        onAddToCart(item);
        toast.success('Added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recently added';
    }
  };

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Image */}
          <div className="flex-shrink-0">
            {item.image_url ? (
              <OptimizedImage
                fallbackUrl={item.image_url}
                variant="thumbnail"
                alt={item.menu_item_name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Star className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {item.menu_item_name}
                </h3>
                
                {item.variant_name && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {item.variant_name}
                  </Badge>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Added {formatDate(item.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="h-8 w-8 p-0"
                  title="Add to cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  title="Remove from favorites"
                >
                  {isRemoving ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface FavoritesListProps {
  userId: string;
  onAddToCart?: (item: FavoriteItem) => void;
  className?: string;
}

export function FavoritesList({ userId, onAddToCart, className }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get_user_favorites({ user_id: userId });
      const data = await response.json();
      
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const handleRemoveItem = (itemId: string) => {
    setFavorites(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearAll = async () => {
    if (!userId || favorites.length === 0) return;
    
    try {
      const response = await apiClient.clear_all_favorites({ user_id: userId });
      const data = await response.json();
      
      if (data.success) {
        setFavorites([]);
        toast.success('All favorites cleared');
      } else {
        toast.error(data.message || 'Failed to clear favorites');
      }
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast.error('Failed to clear favorites');
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            My Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            My Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadFavorites} className="mt-2" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            My Favorites
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {favorites.length}
              </Badge>
            )}
          </CardTitle>
          
          {favorites.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              No favorites yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start adding items to your favorites to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((item) => (
              <FavoriteItemCard
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
