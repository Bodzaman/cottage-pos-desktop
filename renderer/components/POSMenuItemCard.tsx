import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Minus, Settings2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { colors } from 'utils/designSystem';
import { getSpiceEmoji } from 'utils/premiumTheme';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import type { MenuItem, OrderItem, SelectedCustomization } from 'utils/menuTypes';
import type { ItemVariant } from 'utils/menuTypes';
import { shallow } from 'zustand/shallow';
import { StaffCustomizationModal } from 'components/StaffCustomizationModal';
import { POSVariantSelector } from 'components/POSVariantSelector';
import { OptimizedImage } from 'components/OptimizedImage';
import { useVariantImageCarousel } from 'utils/useVariantImageCarousel';

interface POSMenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (orderItem: OrderItem) => void;
  onCustomizeItem?: (orderItem: OrderItem) => void;
  orderType?: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  variantCarouselEnabled?: boolean; // NEW: Toggle for variant image carousel
}

/**
 * Professional POS Menu Item Card
 * - Top-mounted image (150px, object-fit: cover)
 * - Structured card layout (not background image)
 * - All variants displayed and clickable
 * - Quantity controls affect add amount
 * - Purple theme with glow effects
 */
export function POSMenuItemCard({
  item,
  onAddToOrder,
  onCustomizeItem,
  orderType = 'COLLECTION',
  variantCarouselEnabled = true // Default: enabled
}: POSMenuItemCardProps) {
  // Subscribe to store data
  const variantsByMenuItem = useRealtimeMenuStore(
    state => state.variantsByMenuItem,
    shallow
  );
  const proteinTypes = useRealtimeMenuStore(
    state => state.proteinTypes,
    shallow
  );

  // Local state
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);
  const [showVariantInfoPopover, setShowVariantInfoPopover] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [selectedVariantForCustomization, setSelectedVariantForCustomization] = useState<ItemVariant | null>(null);
  const [previewedVariant, setPreviewedVariant] = useState<ItemVariant | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Detect if description is truncated
  useEffect(() => {
    const element = descriptionRef.current;
    if (element && item.description) {
      // Check if the content is taller than the container (3 lines)
      setIsDescriptionTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [item.description]);

  // Get variants for this item
  const variants = variantsByMenuItem[item.id] || [];
  const activeVariants = variants.filter(v => v.is_active).sort((a, b) => a.price - b.price);
  const isMultiVariant = variants.length > 1;

  // Helper function to check if a variant has any food details configured
  const variantHasFoodDetails = (variant: ItemVariant): boolean => {
    const hasSpice = (variant.spice_level || 0) > 0;
    const hasAllergens = (variant.allergens || []).length > 0;
    const hasAllergenNotes = !!(variant.allergen_notes && variant.allergen_notes.trim());
    const hasDietaryFlags = !!(variant.is_vegetarian || variant.is_vegan || variant.is_gluten_free || variant.is_halal || variant.is_dairy_free || variant.is_nut_free);
    
    return hasSpice || hasAllergens || hasAllergenNotes || hasDietaryFlags;
  };

  // Filter variants that have food details configured
  const variantsWithFoodDetails = useMemo(() => {
    return activeVariants.filter(variantHasFoodDetails);
  }, [activeVariants]);

  // State for food detail popover
  const [showFoodDetails, setShowFoodDetails] = useState(false);

  // ✅ FIX (MYA-1479): Extract variant image URLs for carousel (string array)
  // 🎯 CRITICAL: Use useMemo to prevent array recreation on every render
  const variantImages = useMemo(
    () => variants.filter(v => v.image_url).map(v => v.image_url!),
    [variants]
  );

  // 🎠 CAROUSEL CONTROL: Only cycle if enabled, otherwise use first variant
  const { currentImage, currentIndex } = useVariantImageCarousel(
    variantCarouselEnabled ? variantImages : [], // Only cycle if enabled
    8500
  );

  // ✅ DISPLAY PRIORITY (MYA-1479):
  // 1. Base image (if exists) → static
  // 2. Carousel enabled + variants → auto-cycle
  // 3. Carousel disabled + variants → first variant static
  // 4. No images → placeholder
  const displayImage = item.image_url 
    || currentImage 
    || (!variantCarouselEnabled && variantImages.length > 0 ? variantImages[0] : null);

  // Spice indicators
  const spiceLevel = item.spice_indicators ? parseInt(item.spice_indicators) || 0 : 0;
  const spiceEmojis = spiceLevel > 0 ? getSpiceEmoji(spiceLevel).repeat(Math.min(spiceLevel, 3)) : '';
  
  // ✅ VARIANT-AWARE SPICE LEVEL: Show previewed variant spice if hovering, else item-level
  const getDisplaySpiceLevel = (): number => {
    if (previewedVariant?.spice_level !== undefined) {
      return previewedVariant.spice_level;
    }
    return item.spice_indicators ? parseInt(item.spice_indicators) || 0 : 0;
  };
  
  const displaySpiceLevel = getDisplaySpiceLevel();
  const displaySpiceEmojis = displaySpiceLevel > 0 ? getSpiceEmoji(displaySpiceLevel).repeat(Math.min(displaySpiceLevel, 3)) : '';
  
  // ✅ VARIANT-AWARE DIETARY FLAGS: Show previewed variant flags if hovering, else item-level
  const getDisplayDietaryFlags = (): {
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    is_halal?: boolean;
    is_dairy_free?: boolean;
    is_nut_free?: boolean;
  } => {
    if (previewedVariant) {
      return {
        is_vegetarian: previewedVariant.is_vegetarian,
        is_vegan: previewedVariant.is_vegan,
        is_gluten_free: previewedVariant.is_gluten_free,
        is_halal: previewedVariant.is_halal,
        is_dairy_free: previewedVariant.is_dairy_free,
        is_nut_free: previewedVariant.is_nut_free
      };
    }
    // Fallback: parse item.dietary_tags array to boolean flags
    const tags = item.dietary_tags || [];
    return {
      is_vegetarian: tags.includes('Vegetarian'),
      is_vegan: tags.includes('Vegan'),
      is_gluten_free: tags.includes('Gluten-free'),
      is_halal: tags.includes('Halal'),
      is_dairy_free: tags.includes('Dairy-free'),
      is_nut_free: tags.includes('Nut-free')
    };
  };
  
  const dietaryFlags = getDisplayDietaryFlags();

  // Get price based on order type
  const getVariantPrice = (variant: ItemVariant): number => {
    if (orderType === 'DELIVERY') return variant.price_delivery ?? variant.price;
    if (orderType === 'DINE-IN') return variant.price_dine_in ?? variant.price;
    return variant.price;
  };

  // Get variant display name - prioritize protein type for clean display
  const getVariantName = (variant: ItemVariant): string => {
    const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
    return proteinType?.name || variant.variant_name || variant.name || 'Standard';
  };

  // Handle variant click - add to order with current quantity
  const handleVariantClick = (variant: ItemVariant) => {
    const price = getVariantPrice(variant);
    const variantName = getVariantName(variant);

    // For single-variant items, don't show variant name
    // For multi-variant items, prefix with variant name (protein type first)
    const displayName = isMultiVariant ? `${variantName} ${item.name}` : item.name;

    const orderItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: item.id,
      variant_id: variant.id,
      name: displayName,
      variantName: isMultiVariant ? variantName : undefined,
      quantity: quantity,
      price: price,
      protein_type: variant.protein_type_name,
      image_url: variant.display_image_url || variant.image_url || item.image_url || '',
      modifiers: [],
      customizations: undefined,
      item_type: 'menu_item',
      category_id: item.category_id
    };

    onAddToOrder(orderItem);

    // Reset quantity and show toast
    const total = price * quantity;
    toast.success(`Added ${quantity}× ${isMultiVariant ? variantName : item.name}`, {
      description: `£${total.toFixed(2)}`,
      duration: 2000,
      position: 'top-center'
    });
    setQuantity(1);
  };

  // Handle Add button click - works for both single and multi-variant items
  const handleAddClick = () => {
    // If there are active variants, use the first one (cheapest)
    if (activeVariants.length > 0) {
      handleVariantClick(activeVariants[0]);
      return;
    }

    // Fallback: If no active variants but item has variants, use first variant
    if (variants.length > 0) {
      handleVariantClick(variants[0]);
      return;
    }

    // ✅ NEW Path 3: Single item (NO variants) - use base price fields
    // This matches the proven logic from PremiumMenuCard (List View)
    const price = orderType === 'DELIVERY' 
      ? (item.price_delivery || item.price_takeaway || item.base_price || item.price || 0)
      : orderType === 'DINE-IN' 
      ? (item.price_dine_in || item.price_takeaway || item.base_price || item.price || 0)
      : (item.price_takeaway || item.base_price || item.price || 0);

    const orderItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: item.id,
      variant_id: null, // ✅ FIX: Send null instead of synthetic "single-" prefix
      name: item.name,
      variantName: undefined,
      quantity: quantity,
      price: price,
      protein_type: undefined,
      image_url: item.image_url || '',
      modifiers: [],
      customizations: undefined,
      item_type: 'menu_item',
      category_id: item.category_id
    };

    onAddToOrder(orderItem);

    // Reset quantity and show toast
    const total = price * quantity;
    toast.success(`Added ${quantity}× ${item.name}`, {
      description: `£${total.toFixed(2)}`,
      duration: 2000,
      position: 'top-center'
    });
    setQuantity(1);
  };

  // Handle customize button
  const handleCustomize = () => {
    // For multi-variant items, open variant selector first
    if (isMultiVariant && activeVariants.length > 1) {
      setIsVariantSelectorOpen(true);
      return;
    }

    // For single-variant items, use that variant and open customization modal directly
    const defaultVariant = activeVariants[0];
    setSelectedVariantForCustomization(defaultVariant || null);
    setIsCustomizationModalOpen(true);
  };

  // Handle variant selection from POSVariantSelector → Open customization modal
  const handleVariantSelectedForCustomization = (orderItem: OrderItem) => {
    // Find the variant by variant_id from the orderItem
    const variant = variants.find(v => v.id === orderItem.variant_id);
    
    // Set the selected variant and open customization modal
    setSelectedVariantForCustomization(variant || null);
    setIsVariantSelectorOpen(false);
    setIsCustomizationModalOpen(true);
  };

  // Handle customization confirmation
  const handleCustomizationConfirm = (
    item: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    // If parent provided onCustomizeItem callback, use it
    if (onCustomizeItem && variant) {
      const price = getVariantPrice(variant);
      const variantName = getVariantName(variant);
      const displayName = isMultiVariant ? `${item.name} (${variantName})` : item.name;

      const orderItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menu_item_id: item.id,
        variant_id: variant.id,
        name: displayName,
        variantName: isMultiVariant ? variantName : undefined,
        quantity: quantity,
        price: price,
        protein_type: variant.protein_type_name,
        image_url: variant.display_image_url || variant.image_url || item.image_url || '',
        notes: notes || '',
        customizations: customizations?.map(c => ({
          id: c.id,
          name: c.name,
          price: c.price
        })) || [],
        item_type: 'menu_item',
        category_id: item.category_id
      };

      onCustomizeItem(orderItem);
    } else {
      // Fallback: Use onAddToOrder directly
      const price = variant 
        ? getVariantPrice(variant)
        : (orderType === 'DELIVERY' ? (item.price_delivery || item.price_takeaway || item.price || 0) :
           orderType === 'DINE-IN' ? (item.price_dine_in || item.price_takeaway || item.price || 0) :
           (item.price_takeaway || item.price || 0));

      const customizationsTotal = customizations?.reduce((sum, c) => sum + c.price, 0) || 0;
      const totalPrice = (price + customizationsTotal) * quantity;

      const orderItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menu_item_id: item.id,
        variant_id: variant?.id || null,
        name: item.name,
        variantName: variant ? getVariantName(variant) : undefined,
        quantity: quantity,
        price: totalPrice,
        protein_type: variant?.protein_type_name,
        image_url: variant ? (variant.display_image_url || variant.image_url || item.image_url || '') : (item.image_url || ''),
        notes: notes || '',
        customizations: customizations?.map(c => ({
          id: c.id,
          name: c.name,
          price: c.price
        })) || [],
        item_type: 'menu_item',
        category_id: item.category_id
      };

      onAddToOrder(orderItem);
    }

    // Close the modal
    setIsCustomizationModalOpen(false);
    setSelectedVariantForCustomization(null);
  };

  // Truncate long variant names
  const truncateText = (text: string, maxLength: number = 20): string => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <motion.div
      className="group relative rounded-lg overflow-hidden border transition-all duration-300 hover:scale-[1.02] h-full flex flex-col"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
        borderColor: 'rgba(124, 93, 250, 0.2)',
        boxShadow: '0 0 20px rgba(124, 93, 250, 0.1)'
      }}
      whileHover={{
        borderColor: 'rgba(124, 93, 250, 0.5)',
        boxShadow: '0 0 30px rgba(124, 93, 250, 0.3)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* IMAGE SECTION - Top mounted, fixed height */}
      <div className="relative w-full h-[150px] overflow-hidden flex-shrink-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          >
            <OptimizedImage
              fallbackUrl={displayImage}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              variant="square"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}

        {/* Dietary badges - Top right corner */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {item.dietary_tags.includes('Vegan') && (
              <div 
                className="px-2 py-1 rounded text-xs font-bold backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.9)',
                  color: 'white'
                }}
              >
                🌱
              </div>
            )}
            {item.dietary_tags.includes('Dairy-free') && (
              <div 
                className="px-2 py-1 rounded text-xs font-bold backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.9)',
                  color: 'white'
                }}
              >
                🥛
              </div>
            )}
          </div>
        )}

        {/* Featured ribbon - Diagonal top-left */}
        {item.featured && (
          <div 
            className="absolute -left-8 top-4 rotate-[-45deg] px-8 py-1 text-xs font-bold text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #7C5DFA 0%, #5B3CC4 100%)',
              width: '120px',
              textAlign: 'center'
            }}
          >
            FEATURED
          </div>
        )}
      </div>

      {/* CONTENT SECTION - Flex-1 to fill available space */}
      <div className="p-4 space-y-3 flex flex-col flex-1">
        {/* Item Name + Spice Indicators */}
        <div className="flex items-start justify-between gap-2">
          <h3 
            className="text-lg font-bold leading-tight"
            style={{ color: 'rgba(255, 255, 255, 0.95)' }}
          >
            {item.name}
          </h3>
          {displaySpiceEmojis && (
            <span className="text-base flex-shrink-0">
              {displaySpiceEmojis}
            </span>
          )}
        </div>

        {/* Item Description - Fills available space with "See More" for long text */}
        {item.description && (
          <div className="flex-shrink-0">
            <p 
              ref={descriptionRef}
              className="text-sm leading-relaxed line-clamp-3"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              {item.description}
            </p>
            
            {/* Flex container for See More (left) and Variant Details (right) */}
            <div className="flex items-center gap-2 mt-1">
              {/* See More - Left aligned */}
              {isDescriptionTruncated && (
                <Popover open={showDescriptionPopover} onOpenChange={setShowDescriptionPopover}>
                  <PopoverTrigger asChild>
                    <button
                      className="text-xs font-medium transition-all duration-200 hover:underline"
                      style={{ color: colors.brand.purple }}
                      onMouseEnter={() => setShowDescriptionPopover(true)}
                      onMouseLeave={() => setShowDescriptionPopover(false)}
                    >
                      See More
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 p-4 border shadow-xl z-[100]"
                    style={{
                      backgroundColor: 'rgba(15, 15, 15, 0.98)',
                      borderColor: 'rgba(124, 93, 250, 0.4)',
                      boxShadow: '0 0 40px rgba(124, 93, 250, 0.3)'
                    }}
                    side="top"
                    sideOffset={8}
                    align="start"
                    onMouseEnter={() => setShowDescriptionPopover(true)}
                    onMouseLeave={() => setShowDescriptionPopover(false)}
                  >
                    <div className="space-y-2">
                      <h4 
                        className="font-bold text-base"
                        style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                      >
                        {item.name}
                      </h4>
                      <p 
                        className="text-sm leading-relaxed"
                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              {/* Pipe separator - only show when both See More and Variant Details are present */}
              {isDescriptionTruncated && isMultiVariant && variantsWithFoodDetails.length > 0 && (
                <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>|</span>
              )}
              
              {/* Variant Food Details Info Icon - Right aligned */}
              {isMultiVariant && variantsWithFoodDetails.length > 0 && (
                <Popover open={showVariantInfoPopover} onOpenChange={setShowVariantInfoPopover}>
                  <PopoverTrigger asChild>
                    <button
                      className="inline-flex items-center gap-1 text-xs font-medium transition-all duration-200 hover:underline"
                      style={{ color: colors.brand.purple }}
                      onMouseEnter={() => setShowVariantInfoPopover(true)}
                      onMouseLeave={() => setShowVariantInfoPopover(false)}
                    >
                      <Info className="w-3.5 h-3.5" />
                      Variant Details
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-96 max-h-96 overflow-y-auto p-4 border shadow-xl z-[100]"
                    style={{
                      backgroundColor: 'rgba(15, 15, 15, 0.98)',
                      borderColor: 'rgba(124, 93, 250, 0.4)',
                      boxShadow: '0 0 40px rgba(124, 93, 250, 0.3)'
                    }}
                    side="top"
                    sideOffset={8}
                    align="end"
                    onMouseEnter={() => setShowVariantInfoPopover(true)}
                    onMouseLeave={() => setShowVariantInfoPopover(false)}
                  >
                    <div className="space-y-3">
                      <h4 
                        className="font-bold text-base border-b pb-2"
                        style={{ 
                          color: 'rgba(255, 255, 255, 0.95)',
                          borderColor: 'rgba(124, 93, 250, 0.3)'
                        }}
                      >
                        Food Details by Variant
                      </h4>
                      {variantsWithFoodDetails.map((variant) => {
                        const variantName = getVariantName(variant);
                        const variantSpiceLevel = variant.spice_level || 0;
                        const variantSpiceEmojis = variantSpiceLevel > 0 ? getSpiceEmoji(variantSpiceLevel).repeat(Math.min(variantSpiceLevel, 3)) : '';
                        const allergens = variant.allergens || [];
                        
                        const dietaryFlags = [
                          variant.is_vegetarian && { label: 'Vegetarian', emoji: '🥬' },
                          variant.is_vegan && { label: 'Vegan', emoji: '🌱' },
                          variant.is_gluten_free && { label: 'Gluten-free', emoji: '🌾' },
                          variant.is_halal && { label: 'Halal', emoji: '☪️' },
                          variant.is_dairy_free && { label: 'Dairy-free', emoji: '🥛' },
                          variant.is_nut_free && { label: 'Nut-free', emoji: '🥜' },
                        ].filter(Boolean);
                        
                        return (
                          <div 
                            key={variant.id}
                            className="p-3 rounded border space-y-2"
                            style={{
                              backgroundColor: 'rgba(124, 93, 250, 0.05)',
                              borderColor: 'rgba(124, 93, 250, 0.2)'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                {variantName}
                              </span>
                              {variantSpiceEmojis && (
                                <span className="text-sm">{variantSpiceEmojis}</span>
                              )}
                            </div>
                            
                            {allergens.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Allergens:</p>
                                <div className="flex flex-wrap gap-1">
                                  {allergens.map((allergen: string, idx: number) => (
                                    <span 
                                      key={idx}
                                      className="px-2 py-0.5 rounded text-xs"
                                      style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                        color: 'rgba(239, 68, 68, 1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                      }}
                                    >
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {variant.allergen_notes && (
                              <p className="text-xs italic" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                {variant.allergen_notes}
                              </p>
                            )}
                            
                            {dietaryFlags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {dietaryFlags.map((flag: any, idx: number) => (
                                  <span 
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                                    style={{
                                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                      color: 'rgba(34, 197, 94, 1)',
                                      border: '1px solid rgba(34, 197, 94, 0.3)'
                                    }}
                                  >
                                    <span>{flag.emoji}</span>
                                    <span>{flag.label}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        )}

        {/* VARIANTS SECTION - All variants shown as clickable buttons */}
        {isMultiVariant && activeVariants.length > 0 && (
          <div className="space-y-1.5">
            {activeVariants.map((variant) => {
              const variantName = getVariantName(variant);
              const price = getVariantPrice(variant);
              
              return (
                <button
                  key={variant.id}
                  onClick={() => handleVariantClick(variant)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: 'rgba(124, 93, 250, 0.1)',
                    borderColor: 'rgba(124, 93, 250, 0.3)',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 93, 250, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(124, 93, 250, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.3)';
                  }}
                >
                  <span className="text-sm font-medium truncate">
                    {truncateText(variantName, 18)}
                  </span>
                  <span 
                    className="text-sm font-bold ml-2 flex-shrink-0"
                    style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                  >
                    £{price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Single variant - show price */}
        {!isMultiVariant && activeVariants.length === 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Price
            </span>
            <span 
              className="text-xl font-bold"
              style={{ color: 'rgba(255, 255, 255, 0.95)' }}
            >
              £{getVariantPrice(activeVariants[0]).toFixed(2)}
            </span>
          </div>
        )}

        {/* Zero variants - show base price for single-price items */}
        {activeVariants.length === 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Price
            </span>
            <span 
              className="text-xl font-bold"
              style={{ color: 'rgba(255, 255, 255, 0.95)' }}
            >
              £{(
                orderType === 'DELIVERY' ? (item.price_delivery || item.price_takeaway || item.base_price || item.price || 0) :
                orderType === 'DINE-IN' ? (item.price_dine_in || item.price_takeaway || item.base_price || item.price || 0) :
                (item.price_takeaway || item.base_price || item.price || 0)
              ).toFixed(2)}
            </span>
          </div>
        )}

        {/* Spacer to push buttons to bottom using flex */}
        <div className="flex-1" />

        {/* FOOTER SECTION - Pushed to bottom with mt-auto */}
        <div className="space-y-2 mt-auto">
          {/* QUANTITY CONTROLS */}
          <div 
            className="grid grid-cols-3 rounded-lg overflow-hidden"
            style={{
              border: `1px solid rgba(124, 93, 250, 0.2)`
            }}
          >
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="flex-1 py-2 transition-all duration-200 active:scale-95 border-r"
              style={{
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(124, 93, 250, 0.2)',
                color: quantity > 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)'
              }}
            >
              <Minus className="h-4 w-4 mx-auto" />
            </button>
            
            <div 
              className="flex-1 py-2 text-center font-bold"
              style={{
                backgroundColor: 'rgba(124, 93, 250, 0.1)',
                color: colors.brand.purple
              }}
            >
              {quantity}
            </div>
            
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex-1 py-2 transition-all duration-200 active:scale-95 border-l"
              style={{
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(124, 93, 250, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              <Plus className="h-4 w-4 mx-auto" />
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2">
            {/* Add Button - Always active, works for all items */}
            <button
              onClick={handleAddClick}
              className="flex-1 py-2.5 rounded-lg font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${colors.brand.purple} 0%, ${colors.brand.purpleDark} 100%)`
              }}
            >
              Add
            </button>

            {/* Customize Button */}
            <button
              onClick={handleCustomize}
              className="flex-1 py-2.5 rounded-lg font-semibold border transition-all duration-200 hover:shadow-lg active:scale-95 text-sm"
              style={{
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: colors.brand.purple,
                color: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              <span className="flex items-center justify-center gap-1">
                <Settings2 className="h-4 w-4" />
                <span>Customize</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      <StaffCustomizationModal
        item={item}
        variant={selectedVariantForCustomization || undefined}
        isOpen={isCustomizationModalOpen}
        onClose={() => {
          setIsCustomizationModalOpen(false);
          setSelectedVariantForCustomization(null);
        }}
        onConfirm={handleCustomizationConfirm}
        orderType={orderType}
        initialQuantity={quantity}
      />

      {/* Variant Selector Modal - For choosing protein before customization */}
      <POSVariantSelector
        menuItem={item}
        isOpen={isVariantSelectorOpen}
        onClose={() => setIsVariantSelectorOpen(false)}
        onAddToOrder={handleVariantSelectedForCustomization}
        orderType={orderType}
      />
    </motion.div>
  );
}
