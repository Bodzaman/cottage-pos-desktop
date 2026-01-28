import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Minus, Settings2, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { colors } from 'utils/designSystem';
import { getSpiceEmoji } from 'utils/premiumTheme';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { getItemDisplayPrice, type OrderMode } from 'utils/variantPricing';
import type { MenuItem, ItemVariant } from '../utils/menuTypes';
import type { OrderItem } from 'types';
import { shallow } from 'zustand/shallow';
import { StaffCustomizationModal } from 'components/StaffCustomizationModal';
import { StaffVariantSelector } from 'components/StaffVariantSelector';
import type { SelectedCustomization } from 'components/StaffCustomizationModal';
import { useMenuItemImage } from 'utils/useMenuItemImage';
import { supabase } from 'utils/supabaseClient';

// Stable empty array reference to prevent unnecessary re-renders
const EMPTY_VARIANTS: ItemVariant[] = [];

interface POSMenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (orderItem: OrderItem) => void;
  onCustomizeItem?: (orderItem: OrderItem) => void;
  orderType?: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  variantCarouselEnabled?: boolean; // Toggle for variant image carousel
  isAboveFold?: boolean; // NEW: Prioritize image loading for above-fold items
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
  variantCarouselEnabled = true, // Default: enabled
  isAboveFold = false // Default: lazy loading
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
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [is86d, setIs86d] = useState(item.is_available === false || item.isAvailable === false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // Sync 86 state when item prop changes
  useEffect(() => {
    setIs86d(item.is_available === false || item.isAvailable === false);
  }, [item.is_available, item.isAvailable]);

  // Right-click context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!showContextMenu) return;
    const close = () => setShowContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [showContextMenu]);

  // Toggle 86 status
  const toggle86 = useCallback(async () => {
    setShowContextMenu(null);
    const newAvailable = is86d; // Flip: if 86'd, make available
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: newAvailable })
        .eq('id', item.id);
      if (error) throw error;
      setIs86d(!newAvailable);
      toast.success(newAvailable ? `${item.name} restored` : `${item.name} marked as 86'd`);
    } catch {
      toast.error('Failed to update item availability');
    }
  }, [is86d, item.id, item.name]);

  // Detect if description is truncated
  useEffect(() => {
    const element = descriptionRef.current;
    if (element && item.description) {
      // Check if the content is taller than the container (3 lines)
      setIsDescriptionTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [item.description]);

  // Get variants for this item (stable reference when empty)
  const variants = variantsByMenuItem[item.id] || EMPTY_VARIANTS;
  const activeVariants = variants.filter(v => v.is_active).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const isMultiVariant = variants.length > 1;

  // ✅ UNIFIED PRICING: Use variantPricing utility to handle both single-price and variant items
  // This eliminates the £0.00 bug where variant-only items showed zero price
  const priceDisplay = useMemo(() => {
    // Map orderType to OrderMode (handle 'WAITING' → 'COLLECTION')
    const mode: OrderMode = orderType === 'WAITING' ? 'COLLECTION' : orderType;
    return getItemDisplayPrice(item, activeVariants, mode);
  }, [item, activeVariants, orderType]);

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

  // 🚀 UNIFIED IMAGE HOOK: Single source of truth for image resolution
  // - POS context: Returns raw URLs for fastest loading (no server-side optimization)
  // - Handles carousel logic internally
  // - Returns null if no images → we hide the image section entirely
  const { imageUrl, hasImage, currentImageIndex } = useMenuItemImage({
    item,
    variants,
    context: 'pos', // Raw URLs for speed - staff needs instant loading
    enableCarousel: variantCarouselEnabled
  });


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

  // Get variant display name - prioritize full variant_name from database
  // This respects user's chosen naming pattern (PREFIX, SUFFIX, INFIX, CUSTOM)
  const getVariantName = (variant: ItemVariant): string => {
    return variant.variant_name || variant.name || 'Standard';
  };

  // Short variant label — prioritizes protein_type_name for clean button display
  const getShortVariantLabel = (variant: ItemVariant): string => {
    if (variant.protein_type_name) return variant.protein_type_name;
    const fullName = variant.variant_name || variant.name || '';
    if (!fullName) return 'Option';
    const itemUpper = item.name.toUpperCase().trim();
    const fullUpper = fullName.toUpperCase().trim();
    if (fullUpper.includes(itemUpper)) {
      let stripped = fullUpper.replace(itemUpper, '').trim();
      stripped = stripped.replace(/^\(.*?\)\s*/, '').replace(/\s*\(.*?\)$/, '').trim();
      if (stripped.length > 0) {
        return stripped.charAt(0) + stripped.slice(1).toLowerCase();
      }
    }
    return fullName;
  };

  // Handle variant click - add to order with current quantity
  const handleVariantClick = (variant: ItemVariant) => {
    const price = getVariantPrice(variant);
    const variantDisplayName = getVariantName(variant);

    // For multi-variant items, use the full variant name directly (e.g., "CHICKEN SHASHLICK BHUNA")
    // For single-variant items, use the base item name
    const displayName = isMultiVariant ? variantDisplayName : item.name;

    // For toast notification, use a short protein name if available for cleaner UX
    const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
    const toastName = isMultiVariant ? (proteinType?.name || variantDisplayName) : item.name;

    const orderItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menuItemId: item.id,
      menu_item_id: item.id,
      variantId: variant.id || null,
      variant_id: variant.id || null,
      name: displayName,
      variantName: variantDisplayName || undefined,
      quantity: quantity,
      price: price,
      proteinType: variant.protein_type_name,
      protein_type: variant.protein_type_name,
      imageUrl: variant.display_image_url || variant.image_url || item.image_url || '',
      image_url: variant.display_image_url || variant.image_url || item.image_url || '',
      modifiers: [],
      customizations: undefined,
      itemType: 'menu_item',
      item_type: 'menu_item',
      categoryId: item.category_id,
      category_id: item.category_id,
      // Include kitchen display name and display order for receipt printing
      kitchenDisplayName: item.kitchen_display_name || null,
      kitchen_display_name: item.kitchen_display_name || null,
      displayOrder: item.display_order || 0,
      display_order: item.display_order || 0,
    };

    onAddToOrder(orderItem);

    // Reset quantity and show toast
    const total = price * quantity;
    toast.success(`Added ${quantity}× ${toastName}`, {
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

    // ✅ Path 3: Single item (NO variants) - use unified pricing utility
    // priceDisplay already computed using getItemDisplayPrice() which handles all cases
    const price = priceDisplay.displayPrice;

    // ✅ FIX: Guard against £0.00 price (variant-based items before variants load)
    if (price <= 0) {
      toast.warning('Unable to add item', {
        description: 'Price not available. Please try again or select a variant.',
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    const orderItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menuItemId: item.id,
      menu_item_id: item.id,
      variantId: null, // ✅ FIX: Send null instead of synthetic "single-" prefix
      variant_id: null,
      name: item.name,
      variantName: undefined,
      quantity: quantity,
      price: price,
      proteinType: undefined,
      protein_type: undefined,
      imageUrl: item.image_url || '',
      image_url: item.image_url || '',
      modifiers: [],
      customizations: undefined,
      itemType: 'menu_item',
      item_type: 'menu_item',
      categoryId: item.category_id,
      category_id: item.category_id,
      // Include kitchen display name and display order for receipt printing
      kitchenDisplayName: item.kitchen_display_name || null,
      kitchen_display_name: item.kitchen_display_name || null,
      displayOrder: item.display_order || 0,
      display_order: item.display_order || 0,
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

  // Handle customize button - matches PremiumMenuCard pattern
  const handleCustomize = () => {
    if (isMultiVariant) {
      // For multi-variant items, open variant selector first
      setIsVariantSelectorOpen(true);
    } else {
      // For single items, open customization modal directly
      // Create synthetic variant from base item
      const defaultVariant = activeVariants[0] || {
        id: item.id,
        menu_item_id: item.id,
        variant_name: 'Standard',
        price: item.price || item.base_price || 0,
        is_default: true,
        is_active: true,
        display_order: 0,
        protein_type_id: null,
        protein_type_name: null,
        image_url: item.image_url,
        display_image_url: item.image_url
      };

      setSelectedVariantForCustomization(defaultVariant);
      setIsCustomizationModalOpen(true);
    }
  };

  // Handle customization confirmation
  const handleCustomizationConfirm = (
    item: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    // ✅ DEBUG: Log what we received from StaffCustomizationModal
    console.log('[POSMenuItemCard] handleCustomizationConfirm received:', {
      itemName: item.name,
      quantity,
      variant: variant ? { id: variant.id, name: variant.variant_name } : null,
      customizations: customizations || [],
      notes,
      onCustomizeItemExists: !!onCustomizeItem
    });

    // If parent provided onCustomizeItem callback, use it
    if (onCustomizeItem && variant) {
      const price = getVariantPrice(variant);
      const variantName = getVariantName(variant);
      // ✅ FIX: For multi-variant items, use variant name as display name (not concatenated)
      // This matches the pattern in handleVariantClick and prevents name duplication
      const displayName = isMultiVariant ? variantName : item.name;

      const orderItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menu_item_id: item.id,
        variant_id: variant.id,
        name: displayName,
        variantName: variantName || undefined,
        quantity: quantity,
        price: price,
        protein_type: variant.protein_type_name,
        image_url: variant?.display_image_url || variant?.image_url || item.image_url || '',
        notes: notes || '',
        customizations: customizations?.map(c => ({
          id: c.id,
          name: c.name,
          price_adjustment: c.price_adjustment
        })) || [],
        item_type: 'menu_item',
        category_id: item.category_id
      };

      console.log('[POSMenuItemCard] Using onCustomizeItem path, passing orderItem:', orderItem);
      onCustomizeItem(orderItem);
    } else {
      // Fallback: Use onAddToOrder directly
      console.log('[POSMenuItemCard] Using fallback onAddToOrder path');
      // ✅ Use unified pricing: variant price if available, else priceDisplay from utility
      const price = variant
        ? getVariantPrice(variant)
        : priceDisplay.displayPrice;

      const customizationsTotal = customizations?.reduce((sum, c) => sum + c.price_adjustment, 0) || 0;
      const totalPrice = (price + customizationsTotal) * quantity;

      // ✅ FIX: For multi-variant items, use variant name as display name
      const displayName = variant && isMultiVariant ? getVariantName(variant) : item.name;

      const orderItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menu_item_id: item.id,
        variant_id: variant?.id || null,
        name: displayName,
        variantName: variant ? getVariantName(variant) : undefined,
        quantity: quantity,
        price: totalPrice,
        protein_type: variant?.protein_type_name,
        // ✅ FIX: Use variant image when available
        image_url: variant?.display_image_url || variant?.image_url || item.image_url || '',
        notes: notes || '',
        customizations: customizations?.map(c => ({
          id: c.id,
          name: c.name,
          price_adjustment: c.price_adjustment
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
        borderColor: is86d ? 'rgba(239, 68, 68, 0.4)' : 'rgba(124, 93, 250, 0.2)',
        boxShadow: is86d ? '0 0 20px rgba(239, 68, 68, 0.1)' : '0 0 20px rgba(124, 93, 250, 0.1)',
        opacity: is86d ? 0.6 : 1,
      }}
      whileHover={is86d ? {} : {
        borderColor: 'rgba(124, 93, 250, 0.5)',
        boxShadow: '0 0 30px rgba(124, 93, 250, 0.3)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: is86d ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onContextMenu={handleContextMenu}
    >
      {/* 86'd OVERLAY */}
      {is86d && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
          <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />
          <span className="text-sm font-bold text-red-400 uppercase tracking-wider">86'd</span>
          <button
            onClick={toggle86}
            className="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            Restore
          </button>
        </div>
      )}

      {/* RIGHT-CLICK CONTEXT MENU */}
      {showContextMenu && (
        <div
          className="fixed z-[200] rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{
            left: showContextMenu.x,
            top: showContextMenu.y,
            backgroundColor: colors.background?.primary || '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors"
            style={{ color: is86d ? '#34D399' : '#F87171' }}
            onClick={toggle86}
          >
            <AlertTriangle className="h-4 w-4" />
            {is86d ? 'Restore Item' : 'Mark as 86\'d (Out of Stock)'}
          </button>
        </div>
      )}

      {/* IMAGE SECTION - Only render if item has images */}
      {hasImage && (
        <div className="relative w-full h-[150px] overflow-hidden flex-shrink-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={imageUrl}
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              <img
                src={imageUrl!}
                alt={item.name}
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </motion.div>
          </AnimatePresence>

          {/* Loading skeleton - only for initial image load */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          )}

          {/* Error state - show dark background instead of broken icon */}
          {imageError && (
            <div className="absolute inset-0 bg-gray-800" />
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
      )}

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
                    className="w-80 p-4 border rounded-lg shadow-xl z-[9999]"
                    style={{
                      backgroundColor: '#0f0f0f',
                      borderColor: 'rgba(124, 93, 250, 0.4)',
                      boxShadow: '0 0 40px rgba(124, 93, 250, 0.3), 0 20px 60px rgba(0, 0, 0, 0.8)'
                    }}
                    side="top"
                    sideOffset={12}
                    align="start"
                    collisionPadding={16}
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
                    className="w-96 max-h-96 overflow-y-auto p-4 border rounded-lg shadow-xl z-[9999]"
                    style={{
                      backgroundColor: '#0f0f0f',
                      borderColor: 'rgba(124, 93, 250, 0.4)',
                      boxShadow: '0 0 40px rgba(124, 93, 250, 0.3), 0 20px 60px rgba(0, 0, 0, 0.8)'
                    }}
                    side="top"
                    sideOffset={12}
                    align="end"
                    collisionPadding={16}
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
              const variantName = getShortVariantLabel(variant);
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

        {/* Zero variants - show unified price using variantPricing utility */}
        {/* ✅ FIX: Uses getItemDisplayPrice() which handles both single-price and variant items */}
        {/* This eliminates £0.00 for items that only have variant pricing */}
        {activeVariants.length === 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Price
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: 'rgba(255, 255, 255, 0.95)' }}
            >
              {priceDisplay.formattedPrice}
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

      {/* Variant Selection Modal - Shows first for multi-variant items */}
      <StaffVariantSelector
        isOpen={isVariantSelectorOpen}
        onClose={() => setIsVariantSelectorOpen(false)}
        item={item}
        itemVariants={activeVariants}
        orderType={orderType}
        onAddToOrder={(orderItem) => {
          onAddToOrder(orderItem);
          setIsVariantSelectorOpen(false);
        }}
      />

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
    </motion.div>
  );
}
