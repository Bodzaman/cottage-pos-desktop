import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCartStore } from '../utils/cartStore';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { FavoriteButton } from './FavoriteButton';
import { MenuItem, ItemVariant, MenuItemVariant as CartMenuItemVariant } from '../utils/menuTypes';
import { Printer, CheckCircle2, XCircle } from 'lucide-react';
import { ItemCodeBadge } from './ItemCodeBadge';
import DietaryIcons from './DietaryIcons';
import AllergenDisplay from './AllergenDisplay';
import { getSpiceLevelDisplay, convertSpiceIndicatorsToEmoji } from '../utils/spiceLevelUtils';
import { OptimizedImage } from 'components/OptimizedImage';



interface Props {
  item: MenuItem;
  orderMode?: 'DINE-IN' | 'COLLECTION' | 'DELIVERY';
}

const MenuItemCardComponent: React.FC<Props> = ({ item, orderMode = 'COLLECTION' }) => {
  // Ensure item has a variants array
  const variants = item.variants || [];
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(
    variants.length > 0 ?
      (variants.find(v => v.is_default) || variants[0]) : 
      null
  );
  const { addItem } = useCartStore();
  const { user } = useSimpleAuth();
  
  // Placeholder image if no image URL is provided
  const placeholderImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  
  // Format price to GBP
  const formatPrice = (price: string | number): string => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(numericPrice);
  };
  
  // Get price based on order mode
  const getPriceByMode = (variant: ItemVariant): number => {
    if (orderMode === 'DINE-IN' && variant.price_dine_in !== null && variant.price_dine_in !== undefined) {
      return variant.price_dine_in;
    } else if (orderMode === 'DELIVERY' && variant.price_delivery !== null && variant.price_delivery !== undefined) {
      return variant.price_delivery;
    }
    return variant.price; // Default to base/collection price
  };
  
  // Get effective spice level based on variant selection
  const getEffectiveSpiceLevel = (): string => {
    if (selectedVariant?.spice_level_override !== null && selectedVariant?.spice_level_override !== undefined) {
      // Use override level from variant
      return convertSpiceIndicatorsToEmoji(selectedVariant.spice_level_override);
    }
    
    // Use item's default spice level if available
    if (item.default_spice_level !== null && item.default_spice_level !== undefined) {
      return convertSpiceIndicatorsToEmoji(item.default_spice_level);
    }
    
    // Fallback to spice_indicators field for backward compatibility
    return convertSpiceIndicatorsToEmoji(item.spice_indicators);
  };
  
  // Render spice level indicators
  const renderSpiceLevel = (spiceEmoji: string): JSX.Element => {
    if (!spiceEmoji) {
      return <span className="text-sm text-tandoor-offwhite">None</span>;
    }
    
    return (
      <div className="flex items-center mt-1">
        <span className="text-red-500">{spiceEmoji}</span>
      </div>
    );
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedVariant) return;
    
    try {
      // Create cart item format objects
      const menuItem: MenuItem = {
        id: item.id,
        name: item.name,
        menu_item_description: item.menu_item_description,
        image_url: item.image_url
      } as MenuItem;
      
      const variant: CartMenuItemVariant = {
        id: selectedVariant.id,
        name: getVariantDisplayName(selectedVariant),
        price: getPriceByMode(selectedVariant).toString()
      };
      
      // Add to cart store
      addItem(menuItem, variant, 1);
      
      toast.success(`Added ${item.name} to cart`);
      
      // Close details dialog if open
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };
  
  // Helper function to get variant display name
  const getVariantDisplayName = (variant: ItemVariant): string => {
    // Priority 1: Use database-generated variant_name (e.g., "CHICKEN TIKKA (MAIN)")
    if (variant.variant_name) return variant.variant_name;
    // Priority 2: Use custom override name if set
    if (variant.name) return variant.name;
    // Priority 3: Fallback to just protein type name
    if (variant.protein_type_name) return variant.protein_type_name;
    return '';
  };
  
  return (
    <div className="group relative overflow-hidden rounded-lg border border-tandoor-platinum/20 bg-black/30 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(229,229,229,0.1)] hover:border-tandoor-platinum/40">

      
      {/* Featured badge */}
      {item.featured && (
        <Badge className="absolute top-3 right-3 z-10 bg-[#B01739] text-white border-none">
          Featured
        </Badge>
      )}
      
      {/* Set Meal badge - positioned below featured badge if both exist */}
      {item.is_set_meal && (
        <Badge className={`absolute top-3 z-10 bg-gradient-to-r from-orange-600 to-red-600 text-white border-none font-semibold shadow-lg ${
          item.featured ? 'right-3 mt-8' : 'right-3'
        }`}>
          Set Meal
        </Badge>
      )}
      
      {/* Item code badge - positioned below featured badge if both exist */}
      {item.item_code && (
        <div className={`absolute top-3 z-10 ${
          item.featured ? 'right-3 mt-8' : 'right-3'
        }`}>
          <ItemCodeBadge code={item.item_code} />
        </div>
      )}
      
      {/* Print settings override indicator */}
      {item.inherit_category_print_settings === false && (
        <Badge className="absolute bottom-3 right-3 z-10 bg-amber-700/70 text-white border-none text-xs flex items-center gap-1">
          <Printer className="h-3 w-3" />
          Custom Print
        </Badge>
      )}
      
      {/* Item image */}
      <div 
        className="aspect-[4/3] w-full overflow-hidden relative"
        onClick={() => setIsDetailsOpen(true)}
      >
        <OptimizedImage
          fallbackUrl={item.image_url || placeholderImage}
          metadata={item.metadata || item}
          variant="square"
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
        />
        
        {/* Favorite Button - Only show if user is logged in */}
        {user && (
          <div className="absolute top-2 right-2">
            <FavoriteButton
              menuItemId={item.id}
              menuItemName={item.name}
              variantId={selectedVariant?.id}
              variantName={selectedVariant?.name || selectedVariant?.protein_type_name}
              imageUrl={item.image_url}
              userId={user.id}
              size="md"
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
            />
          </div>
        )}
      </div>
      
      {/* Item content */}
      <div className="p-5">
        {/* Status badge - positioned in content area for visibility */}
        <div className="flex justify-between items-start mb-3">
          <Badge 
            className={`text-xs font-medium flex items-center gap-1 ${
              item.active 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {item.active ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Active
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Inactive
              </>
            )}
          </Badge>
        </div>
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-xl font-medium text-tandoor-platinum cursor-pointer flex items-center gap-2"
            onClick={() => setIsDetailsOpen(true)}
          >
            {item.name}
            {/* Show item code next to name in content area for better visibility */}
            {item.item_code && (
              <ItemCodeBadge code={item.item_code} size="sm" />
            )}
          </h3>
          {renderSpiceLevel(getEffectiveSpiceLevel())}
        </div>
        
        <p className="text-sm text-tandoor-offwhite mb-3">
          {item.description || item.menu_item_description || item.long_description || 'No description available'}
        </p>
        
        {/* Dietary Icons */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="mb-4">
            <DietaryIcons 
              dietaryTags={item.dietary_tags} 
              size="md"
              className="gap-1"
            />
          </div>
        )}
        
        {/* Allergen Information */}
        {(item.allergens || item.allergen_warnings) && (
          <div className="mb-4">
            <AllergenDisplay 
              allergens={item.allergens}
              allergenNotes={item.allergen_warnings}
              size="sm"
              maxDisplay={3}
              compact={true}
              className="gap-1"
            />
          </div>
        )}
        
        {/* Variants and price */}
        <div className="mt-auto">
          {variants.length > 1 ? (
            <div className="space-y-3">
              <Select
                value={selectedVariant?.id || ''}
                onValueChange={(value) => {
                  const variant = item.variants.find(v => v.id === value);
                  if (variant) setSelectedVariant(variant);
                }}
              >
                <SelectTrigger className="bg-black/50 border-tandoor-platinum/30 text-tandoor-offwhite">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent className="bg-black border-tandoor-platinum/30">
                  {variants.map(variant => (
                    <SelectItem 
                      key={variant.id} 
                      value={variant.id}
                      className="text-tandoor-offwhite hover:text-tandoor-platinum"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {getVariantDisplayName(variant)}
                          {variant.spice_level_override !== null && variant.spice_level_override !== undefined && variant.spice_level_override !== item.default_spice_level && (
                            <span className="ml-2 text-red-500">
                              {convertSpiceIndicatorsToEmoji(variant.spice_level_override)}
                            </span>
                          )} - {formatPrice(variant.price)}
                        </span>
                        {/* Show variant code if exists */}
                        {variant.variant_code && (
                          <ItemCodeBadge code={variant.variant_code} size="sm" className="ml-2" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                className="w-full bg-tandoor-charcoal hover:bg-tandoor-black text-tandoor-platinum"
                onClick={handleAddToCart}
              >
                Add to Cart - {selectedVariant ? formatPrice(getPriceByMode(selectedVariant)) : ''}
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-tandoor-platinum">
                {selectedVariant ? formatPrice(getPriceByMode(selectedVariant)) : ''}
              </span>
              <Button 
                className="bg-tandoor-charcoal hover:bg-tandoor-black text-tandoor-platinum"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-[rgba(21, 25, 42, 0.95)] border-[rgba(176, 23, 57, 0.2)] text-white max-w-2xl backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#B01739] font-serif">{item.name}</DialogTitle>
            <div className="flex mt-1">
              {renderSpiceLevel(getEffectiveSpiceLevel())}
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div>
              <img
                src={item.image_url || placeholderImage}
                alt={item.name}
                loading="lazy"
                className="w-full h-48 object-cover rounded-md"
              />
              
              {/* Dietary information */}
              {item.dietary_tags && item.dietary_tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#B01739] mb-2">Dietary Information:</h4>
                  <DietaryIcons 
                    dietaryTags={item.dietary_tags} 
                    showLabels={true}
                    size="sm"
                    className="gap-2"
                  />
                </div>
              )}
              
              {/* Allergen information */}
              {(item.allergens || item.allergen_warnings) && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#B01739] mb-2">Allergen Information:</h4>
                  <AllergenDisplay 
                    allergens={item.allergens}
                    allergenNotes={item.allergen_warnings}
                    size="sm"
                    showLabels={true}
                    className="gap-2"
                  />
                  {item.allergen_warnings && item.allergen_warnings.trim() && (
                    <div className="mt-2 p-2 rounded bg-amber-50/10 border border-amber-400/20">
                      <p className="text-xs text-amber-200">
                        <span className="font-medium">Additional Notes:</span> {item.allergen_warnings}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <DialogDescription className="text-[#BBC3E1]">
                {selectedVariant?.description_override || item.long_description || item.menu_item_description}
              </DialogDescription>
              
              {variants.length > 1 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-[#B01739] mb-2">Available Options:</h4>
                  <div className="space-y-2">
                  {variants.map(variant => (
                    <div 
                      key={variant.id} 
                      className={`flex justify-between p-2 rounded ${selectedVariant?.id === variant.id ? 'bg-[rgba(176, 23, 57, 0.1)] border border-[#B01739]' : 'border border-transparent hover:border-[rgba(176, 23, 57, 0.2)]'} cursor-pointer`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getVariantDisplayName(variant)}</span>
                          {/* Show variant code in dialog */}
                          {variant.variant_code && (
                            <ItemCodeBadge code={variant.variant_code} size="sm" />
                          )}
                        </div>
                        {variant.spice_level_override !== null && variant.spice_level_override !== undefined && variant.spice_level_override !== item.default_spice_level && (
                          <span className="text-xs text-tandoor-offwhite flex items-center mt-1">
                            Spice: <span className="text-red-500 ml-1">{convertSpiceIndicatorsToEmoji(variant.spice_level_override)}</span>
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-[#B01739]">{formatPrice(getPriceByMode(variant))}</span>
                      {orderMode === 'DINE-IN' && variant.price_dine_in !== null && variant.price_dine_in !== variant.price && (
                        <span className="text-xs text-[#BBC3E1]/70 block">(Dine-in price)</span>
                      )}
                      {orderMode === 'DELIVERY' && variant.price_delivery !== null && variant.price_delivery !== variant.price && (
                        <span className="text-xs text-[#BBC3E1]/70 block">(Delivery price)</span>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="bg-[#B01739] hover:bg-[#C3354F] text-white w-full md:w-auto transition-colors duration-200"
              onClick={handleAddToCart}
            >
              Add to Cart - {selectedVariant ? formatPrice(getPriceByMode(selectedVariant)) : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: Props, nextProps: Props): boolean => {
  // Compare item ID and basic properties that affect rendering
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.name !== nextProps.item.name) return false;
  if (prevProps.item.image_url !== nextProps.item.image_url) return false;
  if (prevProps.item.menu_item_description !== nextProps.item.menu_item_description) return false;
  if (prevProps.item.featured !== nextProps.item.featured) return false;
  if (prevProps.orderMode !== nextProps.orderMode) return false;
  
  // Compare variants array length and key properties
  const prevVariants = prevProps.item.variants || [];
  const nextVariants = nextProps.item.variants || [];
  if (prevVariants.length !== nextVariants.length) return false;
  
  // Deep compare variant properties that affect pricing and display
  for (let i = 0; i < prevVariants.length; i++) {
    const prevVariant = prevVariants[i];
    const nextVariant = nextVariants[i];
    
    if (prevVariant.id !== nextVariant.id) return false;
    if (prevVariant.price !== nextVariant.price) return false;
    if (prevVariant.price_dine_in !== nextVariant.price_dine_in) return false;
    if (prevVariant.price_delivery !== nextVariant.price_delivery) return false;
    if (prevVariant.name !== nextVariant.name) return false;
    if (prevVariant.protein_type_name !== nextVariant.protein_type_name) return false;
    if (prevVariant.is_default !== nextVariant.is_default) return false;
    if (prevVariant.spice_level_override !== nextVariant.spice_level_override) return false;
  }
  
  return true;
};

// Export memoized component
export const MenuItemCard = memo(MenuItemCardComponent, arePropsEqual);
