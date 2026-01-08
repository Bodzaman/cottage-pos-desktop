import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Star, 
  Flame, 
  Leaf, 
  Clock,
  Info,
  ChevronRight,
  Utensils,
  Heart,
  ShoppingCart,
  Package
} from 'lucide-react';
import { MenuItem, OrderItem, ItemVariant } from '../utils/menuTypes';
import { QSAITheme, styles } from '../utils/QSAIDesign';
import { POSMenuCard } from './POSMenuCard';
import { POSSetMealCard } from './POSSetMealCard';
import { SetMealListResponse } from 'types';
import { CompactProteinChips } from './CompactProteinChips';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';

interface EnhancedMenuGridProps {
  menuItems: MenuItem[];
  setMeals?: SetMealListResponse[]; // Optional set meals data
  onAddToOrder: (orderItem: OrderItem) => void;
  orderMode: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  searchQuery?: string;
  selectedCategory?: string | null;
  showSetMealsOnly?: boolean; // Flag to show only set meals
  className?: string;
}

export function EnhancedMenuGrid({
  menuItems,
  setMeals = [],
  onAddToOrder,
  orderMode,
  searchQuery = '',
  selectedCategory,
  showSetMealsOnly = false,
  className = ''
}: EnhancedMenuGridProps) {
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get protein types and variants from store
  const { proteinTypes, itemVariants: allItemVariants } = useRealtimeMenuStore();

  // If showing set meals only, filter and display set meals
  if (showSetMealsOnly) {
    const filteredSetMeals = setMeals.filter(setMeal => {
      if (!setMeal.active) return false;
      
      // Search filter for set meals
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          setMeal.name.toLowerCase().includes(query) ||
          setMeal.description?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

    return (
      <div className={`h-full ${className}`}>
        <ScrollArea className="h-full">
          <div className="p-6">
            {filteredSetMeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-16 w-16 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? 'No Set Meals Found' : 'No Set Meals Available'}
                </h3>
                <p className="text-gray-400 max-w-md">
                  {searchQuery 
                    ? `No set meals match "${searchQuery}". Try a different search term.`
                    : 'Set meals will appear here when they are created and activated.'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Set Meals {searchQuery && `matching "${searchQuery}"`}
                  </h2>
                  <p className="text-gray-400">
                    {filteredSetMeals.length} set meal{filteredSetMeals.length !== 1 ? 's' : ''} available
                  </p>
                </div>

                {/* Set Meals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {filteredSetMeals.map((setMeal) => (
                      <POSSetMealCard
                        key={setMeal.id}
                        setMeal={setMeal}
                        onAddToOrder={onAddToOrder}
                        orderType={orderMode}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Filter and sort menu items
  const filteredItems = menuItems.filter(item => {
    if (!item.active) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.menu_item_description?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort items: featured first, then by display order, then alphabetically
  const sortedItems = filteredItems.sort((a, b) => {
    // Featured items first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    
    // Then by display order
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    
    // Finally alphabetically
    return a.name.localeCompare(b.name);
  });

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favoriteItems);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavoriteItems(newFavorites);
  };

  const getSpiceLevel = (level: number) => {
    const flames = [];
    for (let i = 0; i < 3; i++) {
      flames.push(
        <Flame 
          key={i} 
          className={`h-3 w-3 ${
            i < level ? 'text-red-500 fill-red-500' : 'text-gray-400'
          }`} 
        />
      );
    }
    return flames;
  };

  const getDietaryBadges = (tags: string[] | null) => {
    if (!tags || tags.length === 0) return null;
    
    return tags.slice(0, 2).map((tag) => {
      const badgeProps = {
        'Vegetarian': { icon: Leaf, color: 'bg-green-600', text: 'VEG' },
        'Vegan': { icon: Leaf, color: 'bg-green-700', text: 'VEGAN' },
        'Halal': { icon: Star, color: 'bg-blue-600', text: 'HALAL' },
        'Gluten Free': { icon: Star, color: 'bg-purple-600', text: 'GF' }
      }[tag] || { icon: Star, color: 'bg-gray-600', text: tag.slice(0, 3).toUpperCase() };
      
      const IconComponent = badgeProps.icon;
      
      return (
        <Badge 
          key={tag}
          className={`${badgeProps.color} text-white text-xs px-2 py-1 flex items-center space-x-1`}
        >
          <IconComponent className="h-3 w-3" />
          <span>{badgeProps.text}</span>
        </Badge>
      );
    });
  };

  const getDefaultPrice = (item: MenuItem) => {
    if (!item.variants || item.variants.length === 0) return null;
    
    // Find the price based on order mode
    const priceField = orderMode === 'DINE-IN' ? 'dine_in_price' : 'price';
    const prices = item.variants.map(v => v[priceField]).filter(p => p != null);
    
    if (prices.length === 0) return null;
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `£${minPrice.toFixed(2)}`;
    } else {
      return `£${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`;
    }
  };

  if (sortedItems.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchQuery ? 'No items found' : 'No menu items'}
          </h3>
          <p className="text-gray-400">
            {searchQuery 
              ? `Try searching for something else` 
              : 'No items available in this category'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header with item count and view controls */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {searchQuery ? `Search Results` : selectedCategory ? 'Category Items' : 'All Items'}
            </h3>
            <p className="text-sm text-gray-400">
              {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              style={{
                backgroundColor: viewMode === 'grid' ? QSAITheme.purple.primary : 'transparent',
                borderColor: viewMode === 'grid' ? QSAITheme.purple.primary : 'transparent'
              }}
              className={viewMode === 'grid' ? 'text-white hover:opacity-90' : ''}
            >
              <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
              </div>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              style={{
                backgroundColor: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent',
                borderColor: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent'
              }}
              className={viewMode === 'list' ? 'text-white hover:opacity-90' : ''}
            >
              <div className="space-y-1 h-4 w-4">
                <div className="bg-current h-1 rounded" />
                <div className="bg-current h-1 rounded" />
                <div className="bg-current h-1 rounded" />
              </div>
            </Button>
          </div>
        </div>
        
        {searchQuery && (
          <div className="text-sm text-purple-300">
            Showing results for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {sortedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group"
                  >
                    <POSMenuCard
                      item={item}
                      onAddToOrder={onAddToOrder}
                      orderType={orderMode}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              <AnimatePresence>
                {sortedItems.map((item, index) => {
                  const isFavorite = favoriteItems.has(item.id);
                  const defaultPrice = getDefaultPrice(item);
                  
                  // Filter variants for this item
                  const variants = allItemVariants.filter(v => v.menu_item_id === item.id && v.is_active);
                  const isMultiVariant = variants.length > 0;
                  
                  // 🔍 DIAGNOSTIC: Log price rendering decision
                  console.log('🔍 [EnhancedMenuGrid v2.1] Price Logic:', {
                    itemName: item.name,
                    variantsCount: variants.length,
                    isMultiVariant,
                    defaultPrice,
                    shouldShowPrice: !isMultiVariant && defaultPrice
                  });
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <Card 
                        className="transition-all duration-200 hover:shadow-lg border-white/10 group cursor-pointer"
                        style={{
                          background: 'rgba(30, 30, 30, 0.8)',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            {/* Item Image */}
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80'}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                              />
                              {item.featured && (
                                <div className="absolute top-1 right-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="text-white font-medium text-lg group-hover:text-purple-300 transition-colors">
                                    {item.name}
                                  </h4>
                                  {item.description && (
                                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                                    onClick={() => toggleFavorite(item.id)}
                                  >
                                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Tags and Price */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {/* Dietary badges */}
                                  <div className="flex space-x-1">
                                    {getDietaryBadges(item.dietary_tags)}
                                  </div>
                                  
                                  {/* Spice level */}
                                  {item.default_spice_level > 0 && (
                                    <div className="flex items-center space-x-1">
                                      {getSpiceLevel(item.default_spice_level)}
                                    </div>
                                  )}
                                  
                                  {/* Protein chips with prices for multi-variant items */}
                                  {isMultiVariant && (
                                    <CompactProteinChips
                                      variants={variants}
                                      proteinTypes={proteinTypes}
                                      orderType={orderMode}
                                    />
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  {/* Only show main price if NOT multi-variant */}
                                  {!isMultiVariant && defaultPrice && (
                                    <span className="text-purple-300 font-semibold text-lg">
                                      {defaultPrice}
                                    </span>
                                  )}
                                  
                                  <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4"
                                    onClick={() => {
                                      // For now, add the first variant
                                      if (item.variants && item.variants.length > 0) {
                                        const variant = item.variants[0];
                                        const price = orderMode === 'DINE-IN' ? variant.dine_in_price : variant.price;
                                        
                                        const orderItem: OrderItem = {
                                          id: `${item.id}-${variant.id}-${Date.now()}`,
                                          menu_item_id: item.id,
                                          variant_id: variant.id,
                                          name: item.name,
                                          quantity: 1,
                                          price: price || 0,
                                          variantName: variant.name
                                        };
                                        
                                        onAddToOrder(orderItem);
                                      }
                                    }}
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
