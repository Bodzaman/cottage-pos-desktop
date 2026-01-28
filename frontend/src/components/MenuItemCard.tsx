import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCartStore } from '../utils/cartStore';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { FavoriteButton } from './FavoriteButton';
import type { MenuItem, ItemVariant, CartMenuItemVariant } from 'types';
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
      (variants.find(v => v.isDefault) || variants[0]) :
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
    if (orderMode === 'DINE-IN' && variant.priceDineIn !== null && variant.priceDineIn !== undefined) {
      return variant.priceDineIn;
    } else if (orderMode === 'DELIVERY' && variant.priceDelivery !== null && variant.priceDelivery !== undefined) {
      return variant.priceDelivery;
    }
    return variant.price ?? 0; // Default to base/collection price
  };
  
  // Get effective spice level based on variant selection
  const getEffectiveSpiceLevel = (): string => {
    if (selectedVariant?.spiceLevelOverride !== null && selectedVariant?.spiceLevelOverride !== undefined) {
      // Use override level from variant
      return convertSpiceIndicatorsToEmoji(selectedVariant.spiceLevelOverride);
    }

    // Use item's default spice level if available
    if (item.defaultSpiceLevel !== null && item.defaultSpiceLevel !== undefined) {
      return convertSpiceIndicatorsToEmoji(item.defaultSpiceLevel);
    }

    // Fallback to spiceIndicators field for backward compatibility
    return convertSpiceIndicatorsToEmoji(item.spiceIndicators);
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
        description: item.description,
        imageUrl: item.imageUrl,
        categoryId: item.categoryId,
        featured: item.featured,
        menuOrder: item.menuOrder,
        active: item.active,
        variants: item.variants,
      };

      const variant: CartMenuItemVariant = {
        id: selectedVariant.id || '',
        name: getVariantDisplayName(selectedVariant),
        price: getPriceByMode(selectedVariant),
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
    // Priority 1: Use database-generated variantName (e.g., "CHICKEN TIKKA (MAIN)")
    if (variant.variantName) return variant.variantName;
    // Priority 2: Use custom override name if set
    if (variant.name) return variant.name;
    // Priority 3: Fallback to just protein type name
    if (variant.proteinType?.name) return variant.proteinType.name;
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
      {item.isSetMeal && (
        <Badge className={`absolute top-3 z-10 bg-gradient-to-r from-orange-600 to-red-600 text-white border-none font-semibold shadow-lg ${
          item.featured ? 'right-3 mt-8' : 'right-3'
        }`}>
          Set Meal
        </Badge>
      )}
      
      {/* Item code badge - positioned below featured badge if both exist */}
      {item.itemCode && (
        <div className={`absolute top-3 z-10 ${
          item.featured ? 'right-3 mt-8' : 'right-3'
        }`}>
          <ItemCodeBadge code={item.itemCode} />
        </div>
      )}
      
      {/* Print settings override indicator */}
      {item.inheritCategoryPrintSettings === false && (
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
          fallbackUrl={item.imageUrl || placeholderImage}
          image_variants={item.imageVariants}
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
              variantName={selectedVariant?.name || selectedVariant?.proteinType?.name}
              imageUrl={item.imageUrl}
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
            {item.itemCode && (
              <ItemCodeBadge code={item.itemCode} size="sm" />
            )}
          </h3>
          {renderSpiceLevel(getEffectiveSpiceLevel())}
        </div>
        
        <p className="text-sm text-tandoor-offwhite mb-3">
          {item.description || 'No description available'}
        </p>
        
        {/* Dietary Icons */}
        {item.dietaryTags && item.dietaryTags.length > 0 && (
          <div className="mb-4">
            <DietaryIcons
              dietaryTags={item.dietaryTags}
              size="md"
              className="gap-1"
            />
          </div>
        )}
        
        {/* Allergen Information */}
        {(item.allergens || item.allergenWarnings) && (
          <div className="mb-4">
            <AllergenDisplay
              allergens={item.allergens}
              allergenNotes={item.allergenWarnings}
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
                          {variant.spiceLevelOverride !== null && variant.spiceLevelOverride !== undefined && variant.spiceLevelOverride !== item.defaultSpiceLevel && (
                            <span className="ml-2 text-red-500">
                              {convertSpiceIndicatorsToEmoji(variant.spiceLevelOverride)}
                            </span>
                          )} - {formatPrice(variant.price)}
                        </span>
                        {/* Show variant code if exists */}
                        {variant.variantCode && (
                          <ItemCodeBadge code={variant.variantCode} size="sm" className="ml-2" />
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
                src={item.imageUrl || placeholderImage}
                alt={item.name}
                loading="lazy"
                className="w-full h-48 object-cover rounded-md"
              />
              
              {/* Dietary information */}
              {item.dietaryTags && item.dietaryTags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#B01739] mb-2">Dietary Information:</h4>
                  <DietaryIcons
                    dietaryTags={item.dietaryTags}
                    showLabels={true}
                    size="sm"
                    className="gap-2"
                  />
                </div>
              )}
              
              {/* Allergen information */}
              {(item.allergens || item.allergenWarnings) && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[#B01739] mb-2">Allergen Information:</h4>
                  <AllergenDisplay
                    allergens={item.allergens}
                    allergenNotes={item.allergenWarnings}
                    size="sm"
                    showLabels={true}
                    className="gap-2"
                  />
                  {item.allergenWarnings && item.allergenWarnings.trim() && (
                    <div className="mt-2 p-2 rounded bg-amber-50/10 border border-amber-400/20">
                      <p className="text-xs text-amber-200">
                        <span className="font-medium">Additional Notes:</span> {item.allergenWarnings}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <DialogDescription className="text-[#BBC3E1]">
                {selectedVariant?.descriptionOverride || item.description}
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
                          {variant.variantCode && (
                            <ItemCodeBadge code={variant.variantCode} size="sm" />
                          )}
                        </div>
                        {variant.spiceLevelOverride !== null && variant.spiceLevelOverride !== undefined && variant.spiceLevelOverride !== item.defaultSpiceLevel && (
                          <span className="text-xs text-tandoor-offwhite flex items-center mt-1">
                            Spice: <span className="text-red-500 ml-1">{convertSpiceIndicatorsToEmoji(variant.spiceLevelOverride)}</span>
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-[#B01739]">{formatPrice(getPriceByMode(variant))}</span>
                      {orderMode === 'DINE-IN' && variant.priceDineIn !== null && variant.priceDineIn !== variant.price && (
                        <span className="text-xs text-[#BBC3E1]/70 block">(Dine-in price)</span>
                      )}
                      {orderMode === 'DELIVERY' && variant.priceDelivery !== null && variant.priceDelivery !== variant.price && (
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
  if (prevProps.item.imageUrl !== nextProps.item.imageUrl) return false;
  if (prevProps.item.description !== nextProps.item.description) return false;
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
    if (prevVariant.priceDineIn !== nextVariant.priceDineIn) return false;
    if (prevVariant.priceDelivery !== nextVariant.priceDelivery) return false;
    if (prevVariant.name !== nextVariant.name) return false;
    if (prevVariant.proteinType?.name !== nextVariant.proteinType?.name) return false;
    if (prevVariant.isDefault !== nextVariant.isDefault) return false;
    if (prevVariant.spiceLevelOverride !== nextVariant.spiceLevelOverride) return false;
  }

  return true;
};

// Export memoized component
export const MenuItemCard = memo(MenuItemCardComponent, arePropsEqual);
