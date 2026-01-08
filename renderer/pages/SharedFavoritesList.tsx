import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { Heart, ShoppingCart, AlertCircle, Loader2, ArrowLeft, Flame, User } from 'lucide-react';
import { useCartStore } from 'utils/cartStore';
import type { SharedListResponse } from 'types';

const SpiceLevelIndicator = ({ level }: { level: number }) => {
  const spiceIcons = [];
  for (let i = 0; i < level && i < 5; i++) {
    spiceIcons.push(
      <Flame key={i} className="h-3 w-3 text-red-500 fill-current" />
    );
  }
  return <div className="flex">{spiceIcons}</div>;
};

export default function SharedFavoritesList() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listData, setListData] = useState<SharedListResponse | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedList = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get_shared_favorite_list({ token });
        const data = await response.json();
        
        if (data.success) {
          setListData(data);
        } else {
          setError(data.message || 'Failed to load shared list');
        }
      } catch (err) {
        console.error('Error loading shared list:', err);
        setError('Failed to load shared list. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    loadSharedList();
  }, [token]);

  const handleAddToCart = async (item: any) => {
    setAddingToCart(item.menu_item_id);
    
    try {
      addItem({
        id: item.menu_item_id,
        name: item.menu_item_name,
        price: item.menu_item_price || 0,
        quantity: 1,
        category: item.category || 'Main Course',
        spice_level: item.spice_level,
        is_vegetarian: item.is_vegetarian,
        customizations: []
      });
      
      toast.success(`${item.menu_item_name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0F12] via-[#17191D] to-[#0D0F12] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#8B1538] animate-spin mx-auto mb-4" />
          <p className="text-[#B7BDC6]">Loading shared list...</p>
        </div>
      </div>
    );
  }

  if (error || !listData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0F12] via-[#17191D] to-[#0D0F12] flex items-center justify-center p-4">
        <Card className="bg-black/20 backdrop-blur-sm border-white/10 max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#EAECEF] mb-2">Unable to Load List</h2>
              <p className="text-[#B7BDC6] mb-6">
                {error || 'This shared list is not available. It may have expired or been deleted.'}
              </p>
              <Button
                onClick={() => navigate('/online-orders')}
                className="bg-[#8B1538] hover:bg-[#7A1230] text-white"
              >
                Browse Our Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresDate = new Date(listData.expires_at);
  const isExpired = expiresDate < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0F12] via-[#17191D] to-[#0D0F12] text-[#EAECEF]">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/online-orders')}
              className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Menu
            </Button>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-[#8B92A0]">
                <User className="h-4 w-4" />
                <span>Shared by {listData.shared_by}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-[#EAECEF] mb-2 flex items-center gap-3">
                    <Heart className="h-8 w-8 text-[#8B1538] fill-current" />
                    {listData.list_name}
                  </CardTitle>
                  <p className="text-[#B7BDC6]">
                    {listData.items.length} {listData.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                {isExpired && (
                  <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm">
                    Expired
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {listData.items.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-[#8B1538]/40 mx-auto mb-4" />
                  <p className="text-[#B7BDC6]">This list is empty</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {listData.items.map((item) => (
                    <motion.div
                      key={item.menu_item_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/20 rounded-lg border border-white/10 overflow-hidden hover:border-[#8B1538]/30 transition-all duration-200"
                    >
                      <div className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                          <img
                            src={item.menu_item_image || '/placeholder-food.jpg'}
                            alt={item.menu_item_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-food.jpg';
                            }}
                          />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#EAECEF] mb-1">
                            {item.menu_item_name}
                          </h3>
                          {item.menu_item_description && (
                            <p className="text-sm text-[#8B92A0] mb-2 line-clamp-2">
                              {item.menu_item_description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {item.menu_item_price && (
                                <p className="text-lg font-bold text-[#EAECEF]">
                                  £{item.menu_item_price.toFixed(2)}
                                </p>
                              )}
                              {item.spice_level && item.spice_level > 0 && (
                                <SpiceLevelIndicator level={item.spice_level} />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Add to Cart Button */}
                        <div className="flex items-center">
                          <Button
                            onClick={() => handleAddToCart(item)}
                            disabled={addingToCart === item.menu_item_id || isExpired}
                            className="bg-[#8B1538]/20 text-[#8B1538] hover:bg-[#8B1538] hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {addingToCart === item.menu_item_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Info */}
          {!isExpired && (
            <div className="mt-6 text-center">
              <p className="text-sm text-[#8B92A0]">
                This list expires on {expiresDate.toLocaleDateString()} at {expiresDate.toLocaleTimeString()}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
