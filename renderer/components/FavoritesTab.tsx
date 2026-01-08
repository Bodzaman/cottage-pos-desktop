
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useCartStore } from '../utils/cartStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const FavoritesTab: React.FC = () => {
  const { favorites, removeFavorite } = useSimpleAuth();
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  
  // Handle adding item to cart
  const handleAddToCart = (favorite: any) => {
    try {
      // Add to cart store
      addItem(
        {
          id: favorite.menu_item_id,
          name: favorite.menu_item_name,
          image_url: favorite.image_url
        },
        {
          id: favorite.variant_id || favorite.menu_item_id,
          name: favorite.variant_name || '',
          price: '0' // We don't have price in favorites, will be populated from menu data
        },
        1 // Default quantity
      );
      
      toast.success(`Added ${favorite.menu_item_name} to cart`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };
  
  // Handle removing item from favorites
  const handleRemoveFavorite = async (id: string, name: string) => {
    try {
      const { error } = await removeFavorite(id);
      if (error) {
        throw error;
      }
      toast.success(`Removed ${name} from favorites`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove item from favorites');
    }
  };
  
  // Handle viewing an item's details
  const handleViewItem = (itemId: string) => {
    navigate(`/online-orders?itemId=${itemId}`);
  };
  
  // Placeholder image if no image URL is provided
  const placeholderImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  
  if (favorites.length === 0) {
    return (
      <Alert className="bg-gray-800 border-gray-700 text-gray-300 my-4">
        <AlertDescription>
          You don't have any favorite items yet. Browse our menu and add items to your favorites!
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Your Favorite Items</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((favorite) => (
          <Card key={favorite.id} className="bg-gray-900 border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
            <div className="aspect-[4/3] w-full overflow-hidden cursor-pointer" onClick={() => handleViewItem(favorite.menu_item_id)}>
              <img
                src={favorite.image_url || placeholderImage}
                alt={favorite.menu_item_name}
                className="h-full w-full object-cover transition-all duration-300 hover:scale-105"
              />
            </div>
            
            <CardContent className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-white text-lg">{favorite.menu_item_name}</h3>
                {favorite.variant_name && (
                  <p className="text-gray-400 text-sm">{favorite.variant_name}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => handleAddToCart(favorite)}
                >
                  Add to Cart
                </Button>
                <Button
                  size="sm"
                  variant="outline" 
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => handleRemoveFavorite(favorite.id, favorite.menu_item_name)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
