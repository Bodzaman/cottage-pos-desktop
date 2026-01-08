import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Star, 
  Clock,
  Users,
  Plus,
  Heart,
  Info
} from 'lucide-react';

// Types (Same as POSDesktop)
import { MenuItem, ItemVariant, OrderItem } from '../utils/menuTypes';

// Store Integrations (Same as POSDesktop)
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { useCartStore } from '../utils/cartStore';
import { useSimpleAuth } from '../utils/simple-auth-context';

// Components
import { CustomerVariantSelector } from './CustomerVariantSelector';

// Theme
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';

interface CustomerMenuCardProps {
  item: MenuItem;
  orderMode: 'delivery' | 'collection' | 'dine-in';
  onAddToCart?: (orderItem: OrderItem) => void;
  className?: string;
  showFavorites?: boolean;
}

/**
 * CustomerMenuCard - Customer-optimized menu card
 * 
 * Reuses exact backend logic from POSMenuCard:
 * - Same variant detection: variants.filter(variant => variant.menu_item_id === item.id)
 * - Same price logic: orderMode-based pricing (delivery/collection/dine-in)
 * - Same spice level display: item.default_spice_level with pepper emojis
 * - Same OrderItem creation structure
 * 
 * Customer-optimized UI features:
 * - Beautiful images and descriptions
 * - Smooth animations and hover effects
 * - Favorites functionality
 * - Clear allergen and dietary info
 * - Appetizing visual presentation
 */
export function CustomerMenuCard({ 
  item, 
  orderMode, 
  onAddToCart,
  className,
  showFavorites = true
}: CustomerMenuCardProps) {
  // Store Integrations (Same as POSDesktop)
  const { itemVariants, isLoading } = useRealtimeMenuStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useSimpleAuth();
  
  // Variant Detection (Same logic as POSMenuCard)
  const variants = itemVariants?.filter(variant => variant.menu_item_id === item.id) || [];
  
  // Component State
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); // TODO: Connect to favorites store
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Helper Functions (Same logic as POSMenuCard)
  const formatPrice = (price: number): string => {
    return `£${price.toFixed(2)}`;
  };
  
  const getItemPrice = (): number => {
    return item.price || 0;
  };
  
  const getVariantPrice = (variant: ItemVariant): number => {
    switch (orderMode) {
      case "dine-in":
        return variant.price_dine_in || variant.price;
      case "delivery":
        return variant.price_delivery || variant.price;
      default:
        return variant.price;
    }
  };
  
  const getVariantDisplayName = (variant: ItemVariant): string => {
    // Priority 1: Use database-generated variant_name (e.g., "CHICKEN TIKKA (MAIN)")
    if (variant.variant_name) return variant.variant_name;
    // Priority 2: Use custom override name if set
    if (variant.name) return variant.name;
    // Priority 3: Fallback to just protein type name
    if (variant.protein_type_name) return variant.protein_type_name;
    return 'Standard';
  };
  
  // Display Price Logic (Same as POSMenuCard)
  const getDisplayPrice = (): string => {
    if (variants.length === 0) {
      return formatPrice(getItemPrice());
    }
    
    const prices = variants.map(variant => getVariantPrice(variant));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }
    
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };
  
  // Spice Level Rendering (Same as POSMenuCard)
  const renderSpiceLevel = (): JSX.Element => {
    const spiceLevel = item.default_spice_level || 0;
    
    if (!spiceLevel || spiceLevel === 0) {
      return <div></div>;
    }
    
    const peppers = Array(spiceLevel).fill('🌶️').join('');
    
    return (
      <div className="flex items-center space-x-1">
        <span className="text-red-500 text-sm" title={`Spice Level: ${spiceLevel}/5`}>
          {peppers}
        </span>
        <span className="text-xs text-gray-400">({spiceLevel}/5)</span>
      </div>
    );
  };
  
  // OrderItem Creation (Same structure as POSMenuCard)
  const createOrderItem = (selectedVariant?: ItemVariant): OrderItem => {
    let basePrice: number;
    let variantId: string;
    let variantName: string;

    if (selectedVariant) {
      basePrice = getVariantPrice(selectedVariant);
      variantId = selectedVariant.id;
      variantName = getVariantDisplayName(selectedVariant);
    } else if (variants.length === 0) {
      // Item without variants
      basePrice = getItemPrice();
      variantId = 'default';
      variantName = 'Standard';
    } else {
      throw new Error('No variant provided for item with variants');
    }

    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: item.id,
      variant_id: variantId,
      name: item.name,
      variantName,
      quantity: 1,
      price: basePrice,
      notes: undefined,
      protein_type: selectedVariant?.protein_type_name,
      image_url: item.image_url,
      modifiers: [],
      customizations: undefined,
      item_type: 'menu_item'
    };
  };
  
  // Handle Add to Cart (Same pattern as POSMenuCard)
  const handleAddToCart = (selectedVariant?: ItemVariant) => {
    try {
      const orderItem = createOrderItem(selectedVariant);
      
      // Use cart store or passed callback
      if (onAddToCart) {
        onAddToCart(orderItem);
      } else {
        addItem(orderItem);
      }
      
      toast.success(`${item.name} added to cart`, {
        description: selectedVariant ? `${getVariantDisplayName(selectedVariant)} - ${formatPrice(getVariantPrice(selectedVariant))}` : formatPrice(getItemPrice())
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };
  
  // Handle Item Click (Same logic as POSMenuCard)
  const handleItemClick = () => {
    if (variants.length === 0) {
      // Single item - add directly to cart (Same as POSMenuCard)
      handleAddToCart();
    } else {
      // Multi-variant item - open CustomerVariantSelector modal (Same as POSMenuCard)
      setIsVariantSelectorOpen(true);
    }
  };
  
  // Handle Favorite Toggle
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!isAuthenticated) {
      toast.info('Please sign in to save favorites');
      return;
    }
    
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };
  
  // Loading State
  if (isLoading) {
    return (
      <Card className="h-96 animate-pulse bg-gray-800 border-gray-700">
        <div className="h-48 bg-gray-700 rounded-t-lg"></div>
        <CardContent className="p-4 space-y-3">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-700 rounded w-20"></div>
        </CardContent>
      </Card>
    );
  }
  
  // Image URL with fallback
  const imageUrl = item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  
  return (
    <>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn("group cursor-pointer", className)}
        onClick={handleItemClick}
      >
        <Card 
          className="h-96 overflow-hidden transition-all duration-300 bg-gray-900 border-gray-700 hover:border-silver-500 hover:shadow-xl"
          style={{
            background: `linear-gradient(145deg, ${PremiumTheme.colors.background.card} 0%, ${PremiumTheme.colors.background.secondary} 100%)`,
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Image Section */}
          <div className="relative h-48 overflow-hidden">
            <motion.img
              src={imageUrl}
              alt={item.name}
              className={cn(
                "w-full h-full object-cover transition-all duration-500 group-hover:scale-110",
                isImageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setIsImageLoaded(true)}
              loading="lazy"
            />
            
            {/* Loading placeholder */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-silver-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Favorite Button */}
            {showFavorites && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleFavoriteToggle}
                className={cn(
                  "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200",
                  isFavorite 
                    ? "bg-red-500/80 text-white" 
                    : "bg-black/40 text-gray-300 hover:bg-black/60"
                )}
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
              </motion.button>
            )}
            
            {/* Price Badge */}
            <div className="absolute top-3 left-3">
              <Badge 
                className="bg-burgundy-500 text-white font-semibold px-3 py-1 text-sm backdrop-blur-md"
                style={{ background: PremiumTheme.colors.burgundy[500] }}
              >
                {getDisplayPrice()}
              </Badge>
            </div>
            
            {/* Variants Indicator */}
            {variants.length > 0 && (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-black/60 text-white text-xs backdrop-blur-md">
                  <Users className="w-3 h-3 mr-1" />
                  {variants.length} options
                </Badge>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <CardContent className="p-4 flex-1 flex flex-col">
            {/* Title and Spice Level */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-silver-400 transition-colors">
                {item.name}
              </h3>
              {renderSpiceLevel()}
            </div>
            
            {/* Description */}
            <p className="text-gray-400 text-sm line-clamp-2 mb-3 flex-1">
              {item.description || 'Delicious dish prepared with authentic spices and fresh ingredients.'}
            </p>
            
            {/* Dietary Tags */}
            {item.dietary_tags && item.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.dietary_tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs border-gray-600 text-gray-300"
                  >
                    {tag}
                  </Badge>
                ))}
                {item.dietary_tags.length > 3 && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    +{item.dietary_tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Add to Cart Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                className="w-full bg-burgundy-500 hover:bg-burgundy-600 text-white font-medium transition-all duration-200"
                style={{
                  background: PremiumTheme.colors.burgundy[500],
                  borderColor: PremiumTheme.colors.burgundy[500]
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick();
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {variants.length > 0 ? 'Choose Options' : 'Add to Cart'}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* CustomerVariantSelector Modal */}
      <CustomerVariantSelector
        isOpen={isVariantSelectorOpen}
        onClose={() => setIsVariantSelectorOpen(false)}
        item={item}
        variants={variants}
        orderMode={orderMode}
        onAddToCart={(selectedVariant) => {
          handleAddToCart(selectedVariant);
          setIsVariantSelectorOpen(false);
        }}
      />
    </>
  );
}
