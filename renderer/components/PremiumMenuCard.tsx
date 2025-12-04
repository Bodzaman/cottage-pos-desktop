





import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Sliders, Settings, Settings2, ShoppingCart, ChevronRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePOSStore } from 'utils/posStore';
import type { MenuItem, MenuItemVariant, ProteinType } from 'types';
import { PremiumTheme, getSpiceColor, getSpiceEmoji } from 'utils/premiumTheme';
import { CardDesignTokens } from 'utils/cardDesignTokens';
import { DescriptionPopover } from 'components/DescriptionPopover';
import { CompactProteinChips } from 'components/CompactProteinChips';
import { StaffCustomizationModal, SelectedCustomization } from 'components/StaffCustomizationModal';
import { CustomerCustomizationModal } from 'components/CustomerCustomizationModal';
import { CustomerVariantSelector } from 'components/CustomerVariantSelector';
import { StaffVariantSelector } from 'components/StaffVariantSelector';
import { VariantPopover } from 'components/VariantPopover';
import { colors } from 'utils/designSystem';
import { toast } from 'sonner';
import { cn } from 'utils/cn';
import { DescriptionModal } from 'components/DescriptionModal';
import { getOptimizedImagePreset } from 'utils/imageOptimization';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { shallow } from 'zustand/shallow';
import { useVariantImageCarousel } from 'utils/useVariantImageCarousel';

// Helper function to check if a variant has any food details configured
const variantHasFoodDetails = (variant: ItemVariant): boolean => {
  const hasSpice = (variant.spice_level || 0) > 0;
  const hasAllergens = (variant.allergens || []).length > 0;
  const hasAllergenNotes = !!(variant.allergen_notes && variant.allergen_notes.trim());
  const hasDietaryFlags = !!(variant.is_vegetarian || variant.is_vegan || variant.is_gluten_free || variant.is_halal || variant.is_dairy_free || variant.is_nut_free);
  
  return hasSpice || hasAllergens || hasAllergenNotes || hasDietaryFlags;
};

// Helper to get variant display name
const getVariantDisplayName = (variant: ItemVariant): string => {
  if (variant.variant_name) return variant.variant_name;
  if (variant.name) return variant.name;
  if (variant.protein_type_name) return variant.protein_type_name;
  return 'Standard';
};

interface PremiumMenuCardProps {
  item: MenuItem;
  mode?: 'delivery' | 'collection' | 'dine-in'; // OnlineOrders mode
  orderType?: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING'; // POS mode
  onSelect: (item: MenuItem, variant?: ItemVariant) => void;
  isCompact?: boolean;
  showAIBadge?: boolean;
  className?: string;
  itemVariants?: ItemVariant[];
  proteinTypes?: ProteinType[];
  onAddToOrder?: (orderItem: any) => void; // POS callback
  viewMode?: 'card' | 'list'; // Display mode
  theme?: 'premium' | 'pos'; // Theme variant
  onCustomizeItem?: (item: MenuItem, variant?: ItemVariant) => void; // POS customize callback
  variantCarouselEnabled?: boolean; // MYA-1479: POS Settings toggle
}

export function PremiumMenuCard({ 
  item, 
  onSelect, 
  mode = 'collection',
  orderType,
  isCompact = false,
  showAIBadge = false,
  className,
  itemVariants = [],
  proteinTypes = [],
  onAddToOrder,
  viewMode = 'card',
  theme = 'premium',
  onCustomizeItem,
  variantCarouselEnabled = true // MYA-1479: Default enabled
}: PremiumMenuCardProps) {
  // 🚀 SELECTIVE SUBSCRIPTIONS: Use pre-computed O(1) lookups instead of O(n) filtering
  const variantsByMenuItem = useRealtimeMenuStore(
    state => state.variantsByMenuItem,
    shallow
  );
  const storeProteinTypes = useRealtimeMenuStore(
    state => state.proteinTypes,
    shallow
  );
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);
  const [showVariantInfoPopover, setShowVariantInfoPopover] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  // NEW: Per-variant quantity state for inline variant list
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  const [customizeVariantId, setCustomizeVariantId] = useState<string | null>(null);

  // NEW: Track cart quantities to show "In order" badge and Add→Stepper swap
  const posStore = usePOSStore();
  const cartItems = posStore?.orderItems || [];
  
  // Helper: Get current quantity in cart for this item/variant
  const getCartQuantity = (variantId?: string): number => {
    if (!cartItems || cartItems.length === 0) return 0;
    
    const relevantItems = cartItems.filter(cartItem => {
      if (variantId) {
        return cartItem.variant_id === variantId;
      } else {
        return cartItem.menu_item_id === item.id && !cartItem.variant_id;
      }
    });
    
    return relevantItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  // 🎨 COMPLETE THEME COLOR MAPPING - UPDATED with new darker purple
  const themeColors = theme === 'pos' ? {
    // POS Purple Theme - DARKER PROFESSIONAL SHADES
    primary: colors.brand.purple,         // #5B3CC4
    primaryHover: colors.brand.purpleDark, // #4A2FB3
    borderColor: colors.brand.purple,
    borderGlow: `0 0 20px ${colors.brand.purple}40`,
    borderGlowHover: `0 0 20px ${colors.brand.purple}60`,
    buttonBg: `linear-gradient(135deg, ${colors.brand.purple} 0%, ${colors.brand.purpleDark} 100%)`,
    buttonBgHover: `linear-gradient(135deg, ${colors.brand.purpleLight} 0%, ${colors.brand.purple} 100%)`,
    textAccent: colors.brand.purple,
    cardBg: 'rgba(26, 26, 26, 0.6)',
    cardBgHover: 'rgba(26, 26, 26, 0.8)'
  } : {
    // Premium Ruby/Burgundy Theme (OnlineOrders)
    primary: '#8B1538',
    primaryHover: '#A01B42',
    borderColor: '#8B1538',
    borderGlow: '0 0 20px rgba(139, 21, 56, 0.3)',
    borderGlowHover: '0 0 20px rgba(139, 21, 56, 0.5)',
    buttonBg: 'linear-gradient(135deg, #8B1538 0%, #6B0F2A 100%)',
    buttonBgHover: 'linear-gradient(135deg, #A01B42 0%, #8B1538 100%)',
    textAccent: '#8B1538',
    cardBg: 'rgba(26, 26, 26, 0.6)',
    cardBgHover: 'rgba(26, 26, 26, 0.8)'
  };
  
  // Use passed variants instead of subscribing to store
  const variants = variantsByMenuItem[item.id] || itemVariants?.filter(variant => variant.menu_item_id === item.id) || [];
  
  // Sort variants by display_order (ascending) - fallback to 0 if not set
  // Note: store variants are already sorted by computeLookups(), only sort if using props
  const sortedVariants = variantsByMenuItem[item.id] 
    ? variants // Already sorted from store
    : [...variants].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  
  // Use store protein types if available, fall back to props
  const effectiveProteinTypes = storeProteinTypes.length > 0 ? storeProteinTypes : proteinTypes;

  // 🎯 CRITICAL FIX: Check has_variants flag OR actual variants array length
  // This ensures we detect multi-variant items even when has_variants field is missing from API
  const isMultiVariant = (item.has_variants === true) || (variants.length > 1);
  
  // NEW: Track selected variant for multi-variant items (default to cheapest)
  const activeVariants = variants.filter(v => v.is_active).sort((a, b) => a.price - b.price);
  
  // Filter variants that have food details configured
  const variantsWithFoodDetails = useMemo(() => {
    return activeVariants.filter(variantHasFoodDetails);
  }, [activeVariants]);
  
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(
    isMultiVariant && activeVariants.length > 0 ? activeVariants[0] : null
  );
  
  // Handler for when a variant chip is clicked
  const handleVariantChipClick = (variant: ItemVariant) => {
    setSelectedVariant(variant);
  }

  // NEW: Handle one-click protein chip ordering
  const handleAddFromChip = (variant: ItemVariant, qty: number) => {
    if (!onAddToOrder) return;

    const effectiveMode = orderType 
      ? (orderType === 'DELIVERY' ? 'delivery' : orderType === 'DINE-IN' ? 'dine-in' : 'collection')
      : mode;

    // Calculate price based on order type
    let price: number;
    if (effectiveMode === 'delivery') {
      price = variant.price_delivery ?? variant.price;
    } else if (effectiveMode === 'dine-in') {
      price = variant.price_dine_in ?? variant.price;
    } else {
      price = variant.price;
    }

    // Get variant name (use variant.name which contains Generated Name)
    const proteinType = effectiveProteinTypes.find(pt => pt.id === variant.protein_type_id);
    const variantName = variant.name || proteinType?.name || variant.variant_name || variant.protein_type_name || 'Standard';

    // Construct order item
    const orderItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: item.id,
      variant_id: variant.id,
      name: `${item.name} (${variantName})`,
      variantName: variantName,
      quantity: qty,
      price: price,
      protein_type: variant.protein_type_name,
      image_url: item.image_url || '',
      modifiers: [],
      customizations: undefined,
      item_type: 'menu_item'
    };

    // Add to order
    onAddToOrder(orderItem);

    // Reset quantity to 1
    setQuantity(1);

    // Show toast confirmation
    const total = price * qty;
    toast.success(`Added ${qty}× ${variantName} £${total.toFixed(2)}`, {
      duration: 2000,
      position: 'top-center'
    });
  };

  // Handle quantity controls for single-item cards
  const handleQuantityDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleQuantityIncrease = () => {
    setQuantity(quantity + 1);
  };

  // 🔍 DIAGNOSTIC LOGGING: Track variant detection logic
  console.log('🔍 [PremiumMenuCard] Variant Detection:', {
    itemName: item.name,
    itemId: item.id,
    hasVariantsFlag: item.has_variants,
    variantsArrayLength: variants.length,
    isMultiVariant,
    variantData: variants.map(v => ({ id: v.id, name: v.name, price: v.price, protein_type_id: v.protein_type_id }))
  });
  
  // Fallback image for premium experience
  const fallbackImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  
  // **CORRECT PRICING LOGIC**
  // Support both OnlineOrders (mode) and POS (orderType)
  const getDisplayPrice = (): number => {
    const effectiveMode = orderType 
      ? (orderType === 'DELIVERY' ? 'delivery' : orderType === 'DINE-IN' ? 'dine-in' : 'collection')
      : mode;
    
    if (isMultiVariant && selectedVariant) {
      // For multi-variant, use selected variant price
      if (effectiveMode === 'delivery') {
        return selectedVariant.price_delivery ?? selectedVariant.price;
      } else if (effectiveMode === 'dine-in') {
        return selectedVariant.price_dine_in ?? selectedVariant.price;
      } else {
        return selectedVariant.price;
      }
    } else {
      // For single items, use item price
      if (effectiveMode === 'delivery') {
        return item.price_delivery || item.price_takeaway || item.price || 0;
      } else if (effectiveMode === 'dine-in') {
        return item.price_dine_in || item.price_takeaway || item.price || 0;
      } else {
        return item.price_takeaway || item.price || 0;
      }
    }
  };

  // NEW: Helper to get variant price based on order type
  const getVariantPrice = (variant: ItemVariant): number => {
    const effectiveMode = orderType 
      ? (orderType === 'DELIVERY' ? 'delivery' : orderType === 'DINE-IN' ? 'dine-in' : 'collection')
      : mode;
    
    if (effectiveMode === 'delivery') {
      return variant.price_delivery ?? variant.price;
    } else if (effectiveMode === 'dine-in') {
      return variant.price_dine_in ?? variant.price;
    } else {
      return variant.price;
    }
  };

  // NEW: Helper to get variant display name from protein type
  const getVariantDisplayName = (variant: ItemVariant): string => {
    return variant.variantName || variant.variant_name || variant.name || 'Option';
  };

  // NEW: Handle clicking variant name to add to order
  const handleVariantNameClick = (variant: ItemVariant) => {
    const qty = variantQuantities[variant.id] || 1;
    const price = getVariantPrice(variant);
    const variantName = getVariantDisplayName(variant);
    
    if (onAddToOrder) {
      // POS Mode: Add to current order
      const orderItem: OrderItem = {
        id: `${item.id}-${Date.now()}`,
        menu_item_id: item.id,
        variant_id: variant.id,
        name: variantName,
        quantity: qty,
        price: price,
        variantName: variantName,
        notes: '',
        image_url: item.image_url || undefined,
        customizations: []
      };
      onAddToOrder(orderItem);
      
      toast.success(`${variantName} added`, {
        description: `Quantity: ${qty} • £${(price * qty).toFixed(2)}`
      });
    } else if (addItem) {
      // ✅ FIX: Pass complete variant object instead of stripped-down version
      // This preserves variant_name, price_delivery, and all other fields
      addItem(item, variant, qty, '');
      
      toast.success(`${item.name} added to cart`, {
        description: `${variantName} • Quantity: ${qty} • £${(price * qty).toFixed(2)}`
      });
    }
    
    // Reset quantity to 1 after adding
    setVariantQuantities(prev => ({ ...prev, [variant.id]: 1 }));
  };

  // NEW: Handle variant quantity changes
  const handleVariantQuantityChange = (variantId: string, delta: number) => {
    setVariantQuantities(prev => {
      const currentQty = prev[variantId] || 1;
      const newQty = Math.max(1, currentQty + delta);
      return { ...prev, [variantId]: newQty };
    });
  };

  // NEW: Handle variant customize button click
  const handleVariantCustomizeClick = (variant: ItemVariant) => {
    setSelectedVariant(variant);
    setIsCustomizationModalOpen(true);
  };

  // 🎠 CAROUSEL LOGIC (MYA-1479): Extract variant images for auto-rotation
  const variantImages = useMemo(
    () => variants.filter(v => v.image_url).map(v => v.image_url!),
    [variants]
  );

  const { currentImage, currentIndex } = useVariantImageCarousel(
    variantCarouselEnabled ? variantImages : [], // Only cycle if enabled
    8500
  );

  // Display image (with fallback)
  // ✅ VARIANT INHERITANCE: Use display_image_url from selected variant (resolved by backend)
  // ✅ CAROUSEL PRIORITY (MYA-1479):
  // 1. Base image (if exists) → static
  // 2. Carousel enabled + variants → auto-cycle
  // 3. Carousel disabled + variants → first variant static
  // 4. No images → fallback
  const displayImage = item.image_url 
    || currentImage 
    || (!variantCarouselEnabled && variantImages.length > 0 ? variantImages[0] : null)
    || fallbackImage;
  
  // Optimized images for faster loading (50-70% reduction)
  const optimizedCardImage = getOptimizedImagePreset(displayImage, 'CARD') || displayImage;
  const optimizedThumbnail = getOptimizedImagePreset(displayImage, 'THUMBNAIL') || displayImage;
  
  // 🔍 DEBUG: Log image URLs
  console.log('🔍 [PremiumMenuCard] Image URLs for:', item.name, {
    displayImage,
    optimizedCardImage,
    optimizedThumbnail,
    fallbackImage,
    itemImageUrl: item.image_url,
    selectedVariantImageUrl: selectedVariant?.image_url
  });
  
  // Spice level indicators
  const spiceLevel = item.spice_indicators ? parseInt(item.spice_indicators) || 0 : 0;
  const spiceColor = getSpiceColor(spiceLevel);
  const spiceEmoji = getSpiceEmoji(spiceLevel);

  // NEW: Dual-mode handleAddToCart - supports both CartStore (OnlineOrders) and onAddToOrder callback (POS)
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const price = getDisplayPrice();
    
    // ✅ USE VARIANT.NAME FIRST (contains Generated Name: "CHICKEN test variant item")
    let variantName = 'Standard';
    if (selectedVariant) {
      // Prioritize variant.name which has the Generated Name format
      variantName = selectedVariant.name || (() => {
        const proteinType = effectiveProteinTypes.find(pt => pt.id === selectedVariant.protein_type_id);
        return proteinType?.name || selectedVariant.variant_name || selectedVariant.protein_type_name || 'Standard';
      })();
    }
    
    // POS Mode: Use onAddToOrder callback
    if (onAddToOrder) {
      const orderItem: OrderItem = {
        id: `${item.id}-${Date.now()}`,
        menu_item_id: item.id,
        variant_id: selectedVariant?.id || `single-${item.id}`,
        name: selectedVariant ? variantName : item.name,
        quantity: quantity,
        price: price,
        variantName: selectedVariant?.name || undefined,
        notes: '',
        image_url: item.image_url || undefined,
        customizations: []
      };
      
      onAddToOrder(orderItem);
      
      toast.success(`${item.name} added to order`, {
        description: `Qty: ${quantity} • £${(price * quantity).toFixed(2)}`
      });
      
      // Reset quantity to 1 after adding
      setQuantity(1);
      
      return;
    }
    
    // OnlineOrders Mode: Use CartStore (existing logic)
    if (isMultiVariant && selectedVariant) {
      // ✅ FIX: Pass complete variant object instead of stripped-down version
      // This preserves variant_name, price_delivery, and all other fields
      addItem(item, selectedVariant, quantity, '');
      
      const displayName = selectedVariant.variant_name || selectedVariant.name || 'Option';
      toast.success(`${item.name} added to cart`, {
        description: `${displayName} • Qty: ${quantity} • £${(price * quantity).toFixed(2)}`
      });
    } else {
      // For single items
      const singleVariant = {
        id: `single-${item.id}`,
        name: 'Standard',
        price: price
      };
      
      addItem(item, singleVariant, quantity, '');
      
      toast.success(`${item.name} added to cart`, {
        description: `Quantity: ${quantity} • £${(price * quantity).toFixed(2)}`
      });
    }
    
    // Reset quantity to 1 after adding
    setQuantity(1);
  };

  // NEW: POS Mode add-to-order logic
  const handleAddToOrder = () => {
    if (!onAddToOrder) return;
    
    const price = getDisplayPrice();
    
    // 🔍 Variant name resolution with correct priority
    let variantName = 'Standard';
    if (selectedVariant) {
      // Priority 1: variant_name (database-generated full name e.g. "CHICKEN TIKKA (MAIN)")
      // Priority 2: name (custom override)
      // Priority 3: Lookup protein type name from proteinTypes
      // Priority 4: protein_type_name field
      variantName = selectedVariant.variant_name || selectedVariant.name || (() => {
        const proteinType = effectiveProteinTypes.find(pt => pt.id === selectedVariant.protein_type_id);
        return proteinType?.name || selectedVariant.protein_type_name || 'Standard';
      })();
    }
    
    const orderItem: OrderItem = {
      id: `${item.id}-${Date.now()}`,
      menu_item_id: item.id,
      variant_id: selectedVariant?.id || `single-${item.id}`,
      name: selectedVariant ? variantName : item.name,
      quantity: quantity,
      price: price,
      variantName: selectedVariant?.name || undefined,
      notes: '',
      image_url: item.image_url || undefined,
      customizations: []
    };
    
    onAddToOrder(orderItem);
  };

  // NEW: Handle variant chip selection
  const handleVariantSelect = (variant: ItemVariant) => {
    console.log('🎯 Variant selected:', variant);
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity when changing variant
  };

  // NEW: Handle add to cart with customizations
  const handleAddToCartWithCustomizations = (
    item: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    const price = variant 
      ? (mode === 'delivery' ? (variant.price_delivery ?? variant.price) : variant.price)
      : (mode === 'delivery' ? (item.price_delivery || item.price_takeaway || item.price || 0) : item.price_takeaway || item.price || 0);
    
    // ✅ FIX: Pass complete variant object or create proper single variant
    // This preserves variant_name, price_delivery, and all other fields
    const variantForCart = variant || {
      id: `single-${item.id}`,
      name: item.name,
      price: price,
      price_delivery: item.price_delivery || item.price_takeaway || item.price || 0
    };
    
    // Convert customizations to cart format
    const cartCustomizations = customizations?.map(c => ({
      id: c.id,
      name: c.name,
      price: c.price,
      group: c.group
    })) || [];
    
    // Add to cart with customizations (updated signature: item, variant, quantity, notes, customizations)
    addItem(item, variantForCart, quantity, notes || '', cartCustomizations);
    
    // Reset quantity and close modal
    setQuantity(1);
    setIsCustomizationModalOpen(false);
  };

  // Handle customize button click - opens customization modal
  const handleCustomizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCustomizationModalOpen(true);
  };

  const handleCustomise = () => {
    if (isMultiVariant) {
      // For variant items, open the protein selection modal
      setIsVariantSelectorOpen(true);
    } else {
      // For single items, open customization modal directly
      setIsCustomizationModalOpen(true);
    }
  };

  // Handle info click to show details/modal
  const handleInfoClick = () => {
    onSelect(item, undefined);
  };

  const handleButtonAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // LIST VIEW: Compact horizontal layout
  if (viewMode === 'list') {
    return (
      <motion.div
        className={cn(
          "group relative bg-transparent rounded-lg overflow-hidden border transition-all duration-200 flex items-center gap-4 p-3 hover:border-primary",
          className
        )}
        style={{
          background: `linear-gradient(135deg, ${themeColors.cardBg}, ${themeColors.cardBgHover})`,
          borderColor: themeColors.borderColor,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Image Thumbnail with Carousel Animation */}
        <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentIndex}
              className="absolute inset-0 w-full h-full"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              <img
                src={displayImage}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </motion.div>
          </AnimatePresence>
          {/* Loading skeleton */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          )}
          {/* Error fallback */}
          {imageError && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}
          {spiceLevel > 0 && (
            <div
              className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium backdrop-blur-sm"
              style={{
                backgroundColor: `${spiceColor}20`,
                border: `1px solid ${spiceColor}40`,
                color: spiceColor
              }}
            >
              {spiceEmoji}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {!isMultiVariant ? (
            // Single item: Clickable name to add to cart
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(e);
                    }}
                    className="text-lg font-semibold line-clamp-1 mb-1 text-left transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{ color: CardDesignTokens.typography.title.color }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textShadow = '0 0 8px rgba(255,255,255,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textShadow = 'none';
                    }}
                    aria-label={`Add ${item.name} to order`}
                  >
                    {item.name}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                  <p className="text-xs">Click to add • Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            // Multi-variant item: Plain title (variants handle their own clicks)
            <h3
              className="text-lg font-semibold line-clamp-1 mb-1"
              style={{ color: CardDesignTokens.typography.title.color }}
            >
              {item.name}
            </h3>
          )}

          {item.description && (
            <div className="mb-2">
              {/* Truncated description */}
              <p
                className="text-sm line-clamp-1"
                style={{ color: PremiumTheme.colors.text.muted }}
              >
                {item.description}
              </p>
              
              {/* Action links: "See More | ℹ️ Variant Details" */}
              {item.description.length > 80 && (
                <div className="flex items-center gap-2 mt-1">
                  {/* See More - Popover with hover */}
                  <Popover open={showDescriptionPopover} onOpenChange={setShowDescriptionPopover}>
                    <PopoverTrigger asChild>
                      <button
                        className="text-xs font-medium transition-all duration-200 hover:underline"
                        style={{ color: themeColors.primary }}
                        onMouseEnter={() => setShowDescriptionPopover(true)}
                        onMouseLeave={() => setShowDescriptionPopover(false)}
                        onClick={(e) => e.stopPropagation()}
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
                          style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        >
                          {item.description}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Pipe separator - only show when both actions are present */}
                  {isMultiVariant && variantsWithFoodDetails.length > 0 && (
                    <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>|</span>
                  )}
                  
                  {/* Variant Details Info Icon - conditionally render if variants have food data */}
                  {isMultiVariant && variantsWithFoodDetails.length > 0 && (
                    <HoverCard openDelay={200}>
                      <HoverCardTrigger asChild>
                        <button
                          className="inline-flex items-center gap-1 text-xs font-medium transition-all duration-200 hover:underline"
                          style={{ color: themeColors.primary }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="w-3.5 h-3.5" />
                          Variant Details
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="top"
                        align="start"
                        className="w-80 p-4"
                        style={{
                          backgroundColor: '#0F0F0F',
                          borderColor: 'rgba(124, 93, 250, 0.3)'
                        }}
                      >
                        <h4
                          className="text-sm font-semibold mb-3 pb-2 border-b"
                          style={{
                            color: '#FFFFFF',
                            borderColor: 'rgba(124, 93, 250, 0.3)'
                          }}
                        >
                          Food Details by Variant
                        </h4>
                        {variantsWithFoodDetails.map((variant) => {
                          const variantName = getVariantDisplayName(variant);
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
                          ].filter(Boolean) as Array<{ label: string; emoji: string }>;

                          return (
                            <div
                              key={variant.id}
                              className="mb-3 pb-3 border-b last:border-b-0 last:mb-0 last:pb-0"
                              style={{ borderColor: 'rgba(124, 93, 250, 0.2)' }}
                            >
                              <p className="text-xs font-semibold mb-2" style={{ color: '#C0C0C0' }}>
                                {variantName}
                              </p>
                              
                              {variantSpiceLevel > 0 && (
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs" style={{ color: '#B0B0B0' }}>Spice:</span>
                                  <span className="text-sm">{variantSpiceEmojis}</span>
                                </div>
                              )}
                              
                              {allergens.length > 0 && (
                                <div className="mb-1.5">
                                  <p className="text-xs mb-1" style={{ color: '#B0B0B0' }}>Allergens:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {allergens.map((allergen, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-0.5 rounded"
                                        style={{
                                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                          color: '#F59E0B',
                                          border: '1px solid rgba(245, 158, 11, 0.3)'
                                        }}
                                      >
                                        {allergen}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {variant.allergen_notes && (
                                <div className="mb-1.5">
                                  <p className="text-xs" style={{ color: '#B0B0B0' }}>Notes:</p>
                                  <p className="text-xs" style={{ color: '#E5E5E5' }}>{variant.allergen_notes}</p>
                                </div>
                              )}
                              
                              {dietaryFlags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {dietaryFlags.map((flag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 rounded"
                                      style={{
                                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                        color: '#22C55E',
                                        border: '1px solid rgba(34, 197, 94, 0.3)'
                                      }}
                                    >
                                      {flag.emoji} {flag.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Variant Chips - Use CompactProteinChips */}
          {isMultiVariant && variants.length > 0 && (
            <CompactProteinChips
              variants={variants}
              proteinTypes={proteinTypes}
              themeColor={themeColors.primary}
              orderType={orderType}
              maxVisible={3}
              onVariantClick={handleVariantChipClick}
              selectedVariantId={selectedVariant?.id}
              currentQuantity={quantity}
              onAddVariant={onAddToOrder ? handleAddFromChip : undefined}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={handleButtonAreaClick}>
          {/* Price - Only show for single variant items */}
          {!isMultiVariant && (
            <div className="flex items-baseline gap-2">
              <span
                className="text-xl font-bold"
                style={{ color: CardDesignTokens.typography.displayPrice.color }}
              >
                £{(getDisplayPrice() * quantity).toFixed(2)}
              </span>
              {quantity > 1 && (
                <span
                  className="text-sm font-medium"
                  style={{ color: PremiumTheme.colors.text.muted }}
                >
                  (£{getDisplayPrice().toFixed(2)} each)
                </span>
              )}
            </div>
          )}

          {/* Quantity Controls - Horizontal inline layout */}
          <div className="flex items-center border rounded overflow-hidden"
               style={{
                 backgroundColor: PremiumTheme.colors.dark[800],
                 borderColor: PremiumTheme.colors.dark[650] || PremiumTheme.colors.dark[600]
               }}>
            <button
              className="px-2 transition-all duration-200 border-r h-8 flex items-center justify-center hover:bg-opacity-50 active:scale-95"
              style={{
                color: quantity > 1 ? PremiumTheme.colors.text.secondary : PremiumTheme.colors.text.muted,
                borderColor: PremiumTheme.colors.dark[650] || PremiumTheme.colors.dark[600],
                backgroundColor: 'transparent'
              }}
              onClick={handleQuantityDecrease}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            
            <div 
              className="px-2 min-w-[2rem] h-8 text-center font-medium text-sm flex items-center justify-center"
              style={{ color: PremiumTheme.colors.text.primary }}
            >
              {quantity}
            </div>
            
            <button
              className="px-2 transition-all duration-200 border-l h-8 flex items-center justify-center hover:bg-opacity-50 active:scale-95"
              style={{
                color: PremiumTheme.colors.text.secondary,
                borderColor: PremiumTheme.colors.dark[650] || PremiumTheme.colors.dark[600],
                backgroundColor: 'transparent'
              }}
              onClick={handleQuantityIncrease}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Customise Button - UPDATED: h-8, px-3 py-2 */}
          <button
            onClick={handleCustomise}
            className="px-3 py-2 h-8 rounded text-sm font-semibold border transition-all duration-200 hover:shadow-lg active:scale-95"
            style={{
              backgroundColor: PremiumTheme.colors.dark[850],
              borderColor: themeColors.primary,
              color: PremiumTheme.colors.text.primary,
            }}
          >
            Customise
          </button>

          {/* Add Button - UPDATED: h-8, px-3 py-2 */}
          <button
            onClick={handleAddToCart}
            className="px-3 py-2 h-8 rounded text-sm font-bold text-white transition-all duration-200 hover:shadow-lg active:scale-95"
            style={{
              background: themeColors.buttonBg,
            }}
          >
            Add
          </button>
        </div>

        {/* Modals */}
        {orderType ? (
          // POS Context: Use StaffCustomizationModal
          <StaffCustomizationModal
            item={item}
            variant={selectedVariant || undefined}
            isOpen={isCustomizationModalOpen}
            onClose={() => setIsCustomizationModalOpen(false)}
            onConfirm={(item, quantity, variant, customizations, notes) => {
              // Convert to POS order item format and call onAddToOrder
              if (onAddToOrder) {
                const price = variant 
                  ? (orderType === 'DELIVERY' ? (variant.price_delivery ?? variant.price) : 
                     orderType === 'DINE-IN' ? (variant.price_dine_in ?? variant.price) : variant.price)
                  : (orderType === 'DELIVERY' ? (item.price_delivery || item.price_takeaway || item.price || 0) :
                     orderType === 'DINE-IN' ? (item.price_dine_in || item.price_takeaway || item.price || 0) : 
                     (item.price_takeaway || item.price || 0));
                
                const customizationsTotal = customizations?.reduce((sum, c) => sum + c.price, 0) || 0;
                const totalPrice = (price + customizationsTotal) * quantity;
                
                const orderItem = {
                  menu_item_id: item.id,
                  item_name: item.name,
                  quantity: quantity,
                  unit_price: price,
                  total_price: totalPrice,
                  variant_id: variant?.id || null,
                  variant_name: variant?.name || null,
                  notes: notes || '',
                  customizations: customizations?.map(c => ({
                    id: c.id,
                    name: c.name,
                    price: c.price
                  })) || []
                };
                
                onAddToOrder(orderItem);
              }
              setIsCustomizationModalOpen(false);
            }}
            orderType={orderType}
          />
        ) : (
          // OnlineOrders Context: Use CustomerCustomizationModal
          <CustomerCustomizationModal
            isOpen={isCustomizationModalOpen}
            onClose={() => setIsCustomizationModalOpen(false)}
            item={item}
            variant={selectedVariant || undefined}
            addToCart={(item, quantity, variant, customizations, notes) => {
              // ✅ NEW SIGNATURE: Direct pass-through
              handleAddToCartWithCustomizations(item, quantity, variant, customizations, notes);
            }}
            mode={mode}
          />
        )}
        {orderType ? (
          <StaffVariantSelector
            isOpen={isVariantSelectorOpen}
            onClose={() => setIsVariantSelectorOpen(false)}
            item={item}
            itemVariants={itemVariants}
            orderType={orderType}
            onAddToOrder={(orderItem) => {
              onAddToOrder(orderItem);
              setIsVariantSelectorOpen(false);
            }}
          />
        ) : (
          <CustomerVariantSelector
            isOpen={isVariantSelectorOpen}
            onClose={() => setIsVariantSelectorOpen(false)}
            item={item}
            itemVariants={itemVariants}
            mode={mode}
            addToCart={(item, quantity, variant, customizations, notes) => {
              handleAddToCartWithCustomizations(item, quantity, variant, customizations, notes);
              setIsVariantSelectorOpen(false);
            }}
          />
        )}

        {/* Description Modal */}
        <DescriptionModal
          isOpen={isDescriptionModalOpen}
          onClose={() => setIsDescriptionModalOpen(false)}
          itemName={item.name}
          description={item.description || ''}
          imageUrl={displayImage}
        />
      </motion.div>
    );
  }

  // CARD VIEW: Vertical layout (existing)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-auto flex flex-col relative overflow-hidden rounded-lg border-2 border-primary/60 bg-card shadow-lg hover:shadow-2xl hover:border-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
      onClick={!isMultiVariant ? () => {
        if (onCustomizeItem) {
          onCustomizeItem(item, selectedVariant || undefined);
        } else {
          setIsCustomizationModalOpen(true);
        }
      } : undefined}
    >
      {/* Background Image with Lazy Loading */}
      <div className="absolute inset-0">
        <img
          src={optimizedCardImage}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onLoad={() => {
            console.log('🖼️ [Card View] Image loaded successfully:', item.name, optimizedCardImage);
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.error('❌ [Card View] Image failed to load:', item.name, optimizedCardImage, e);
            setImageError(true);
          }}
        />
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-900 animate-pulse" />
        )}
        {/* Error fallback - show dark background */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-900" />
        )}
      </div>

      {/* Gradient Overlay - transparent top to dark bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black/95" />

      {/* All Content - positioned on top of background */}
      <div className="relative z-10 flex flex-col justify-between h-full p-3">
        {/* Title - Full width with text shadow for readability */}
        <h3 className="text-xl font-bold mb-2" style={{ 
          color: '#FFFFFF',
          textShadow: '0 6px 12px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.8)'
        }}>
          {item.name}
        </h3>

        {/* Dietary Tags */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.dietary_tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs rounded-full border"
                style={{
                  backgroundColor: `${PremiumTheme.colors.royal[500]}15`,
                  borderColor: `${PremiumTheme.colors.royal[500]}30`,
                  color: PremiumTheme.colors.royal[300]
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
    
        {/* Inline Variant List for Multi-Variant Items */}
        {isMultiVariant ? (
          <div className="space-y-2">
            {sortedVariants.map((variant) => {
              const currentQty = variantQuantities[variant.id] || 1;
              const variantPrice = getVariantPrice(variant);
              const displayName = getVariantDisplayName(variant);

              return (
                <div
                  key={variant.id}
                  className="rounded-md border transition-all duration-200 p-3"
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.7)',
                    borderColor: getCartQuantity(variant.id) > 0 ? 'rgba(91, 60, 196, 0.6)' : 'rgba(91, 60, 196, 0.3)',
                    boxShadow: getCartQuantity(variant.id) > 0 ? '0 0 12px rgba(91, 60, 196, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(91, 60, 196, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = getCartQuantity(variant.id) > 0 ? 'rgba(91, 60, 196, 0.6)' : 'rgba(91, 60, 196, 0.3)';
                  }}
                >
                  {/* Line 1: Variant Name + Price + In Order Badge */}
                  <div className="flex items-center justify-between mb-2">
                    {/* Clickable Variant Name */}
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleVariantNameClick(variant)}
                              className="font-bold text-sm transition-all duration-150 hover:scale-105 active:scale-95"
                              style={{
                                color: '#FFFFFF',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#FFFFFF';
                                e.currentTarget.style.textShadow = '0 0 8px rgba(255,255,255,0.5)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#FFFFFF';
                                e.currentTarget.style.textShadow = 'none';
                              }}
                              aria-label={`Add ${displayName} to order`}
                            >
                              {displayName}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                            <p className="text-xs">Click to add • Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd></p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* In Order Badge */}
                      {getCartQuantity(variant.id) > 0 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1.5 py-0 h-5"
                          style={{
                            borderColor: themeColors.primary,
                            backgroundColor: `${themeColors.primary}20`,
                            color: themeColors.primary
                          }}
                        >
                          In order ({getCartQuantity(variant.id)})
                        </Badge>
                      )}
                    </div>

                    {/* Price - WHITE */}
                    <span
                      className="font-bold text-sm"
                      style={{ color: '#FFFFFF' }}
                    >
                      £{variantPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Line 2: Vertical Stack - Row 1: Stepper, Row 2: Add + Customize */}
                  <div className="flex flex-col gap-2">
                    {/* Row 1: Quantity Stepper - ALWAYS VISIBLE, CENTERED */}
                    <div className="flex justify-center">
                      <div
                        className="flex items-center rounded border"
                        style={{
                          backgroundColor: '#1a1a1a',
                          borderColor: '#2a2a2a',
                        }}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleVariantQuantityChange(variant.id, -1)}
                                className="h-9 flex-1 flex items-center justify-center text-white hover:bg-gray-800 transition-colors min-w-[44px]"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                              <p className="text-xs">Decrease • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">−</kbd></p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <div className="px-3 py-1 text-sm font-medium text-white min-w-[3rem] text-center">
                          {currentQty}
                        </div>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleVariantQuantityChange(variant.id, 1)}
                                className="h-9 flex-1 flex items-center justify-center text-white hover:bg-gray-800 transition-colors min-w-[44px]"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                              <p className="text-xs">Increase • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">+</kbd></p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Row 2: Add + Customize Buttons - ALWAYS VISIBLE, SIDE-BY-SIDE */}
                    <div className="flex items-center gap-2">
                      {/* Add Button */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              onClick={() => handleVariantNameClick(variant)}
                              className="h-9 flex-1 rounded font-semibold text-sm text-white"
                              style={{
                                background: themeColors.buttonBg,
                              }}
                              whileHover={{
                                background: themeColors.buttonBgHover,
                                boxShadow: themeColors.borderGlowHover
                              }}
                              whileTap={{ scale: 0.95 }}
                              aria-label={`Add ${displayName} to order`}
                            >
                              Add
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                            <p className="text-xs">Add to order • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd></p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Customize Button with Label + Icon */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleVariantCustomizeClick(variant)}
                              className="h-9 px-3 flex items-center gap-1.5 rounded border transition-all duration-200 flex-shrink-0 min-w-[44px]"
                              style={{
                                borderColor: '#FFFFFF',
                                backgroundColor: 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              aria-label={`Customize ${displayName}`}
                            >
                              <Sliders className="h-4 w-4" style={{ color: '#FFFFFF' }} />
                              <span className="font-medium text-sm" style={{ color: '#FFFFFF' }}>Customize</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                            <p className="text-xs">Customize • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">M</kbd></p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Single-item: Show description + COMPACT INLINE CONTROLS (matching variant design)
          <>
            {/* Description Section - clickable to open description modal */}
            {item.description && (
              <div 
                onClick={() => setIsDescriptionModalOpen(true)}
                className="mb-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <p 
                  className="text-sm line-clamp-3"
                  style={{
                    color: '#FFFFFF',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {item.description}
                </p>
                {/* Pill-style "See more..." with chevron */}
                <div className="flex items-center gap-1 mt-1.5">
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                    style={{
                      color: PremiumTheme.colors.silver[400],
                      borderColor: 'rgba(192, 192, 192, 0.3)',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    See more
                    <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            )}

            {/* COMPACT INLINE CONTROLS - Matching Multi-Variant Design */}
            <div 
              className="rounded-md border transition-all duration-200 p-3 mt-auto"
              style={{
                backgroundColor: 'rgba(26, 26, 26, 0.7)',
                borderColor: getCartQuantity() > 0 ? 'rgba(91, 60, 196, 0.6)' : 'rgba(91, 60, 196, 0.3)',
                boxShadow: getCartQuantity() > 0 ? '0 0 12px rgba(91, 60, 196, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(91, 60, 196, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = getCartQuantity() > 0 ? 'rgba(91, 60, 196, 0.6)' : 'rgba(91, 60, 196, 0.3)';
              }}
            >
              {/* Line 1: Item Name + Price + In Order Badge */}
              <div className="flex items-center justify-between mb-2">
                {/* Clickable Item Name - Adds to Cart */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(e);
                          }}
                          className="font-bold text-sm transition-all duration-150 hover:scale-105 active:scale-95"
                          style={{
                            color: '#FFFFFF',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textShadow = '0 0 8px rgba(255,255,255,0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textShadow = 'none';
                          }}
                          aria-label={`Add ${item.name} to order`}
                        >
                          {item.name}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                        <p className="text-xs">Click to add • Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* In Order Badge */}
                  {getCartQuantity() > 0 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1.5 py-0 h-5"
                      style={{
                        borderColor: themeColors.primary,
                        backgroundColor: `${themeColors.primary}20`,
                        color: themeColors.primary
                      }}
                    >
                      In order ({getCartQuantity()})
                    </Badge>
                  )}
                </div>

                {/* Price - WHITE, right-aligned */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="font-bold text-sm"
                    style={{ color: '#FFFFFF' }}
                  >
                    £{getDisplayPrice().toFixed(2)}
                  </span>
                  
                  {/* Variant indicator badge */}
                  {selectedVariant && (
                    <span 
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ 
                        color: '#FFFFFF',
                        backgroundColor: `${themeColors.primary}40`,
                        border: `1px solid ${themeColors.primary}60`
                      }}
                    >
                      {selectedVariant.variant_name || selectedVariant.name || 'Option'}
                    </span>
                  )}
                </div>
              </div>

              {/* Line 2: Quantity Controls - VERTICAL STACK */}
              <div className="flex flex-col gap-2">
                {/* Row 1: Quantity Stepper - Centered */}
                <div className="flex justify-center">
                  <div
                    className="flex items-center rounded border"
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderColor: '#2a2a2a',
                    }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleQuantityDecrease}
                            className="h-9 flex-1 flex items-center justify-center text-white hover:bg-gray-800 transition-colors min-w-[44px]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                          <p className="text-xs">Decrease • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">−</kbd></p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <div className="px-3 py-1 text-sm font-medium text-white min-w-[3rem] text-center">
                      {quantity}
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleQuantityIncrease}
                            className="h-9 flex-1 flex items-center justify-center text-white hover:bg-gray-800 transition-colors min-w-[44px]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                          <p className="text-xs">Increase • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">+</kbd></p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Row 2: Add + Customize Buttons */}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(e);
                          }}
                          className="h-9 px-4 rounded font-semibold text-sm text-white flex-1"
                          style={{
                            background: themeColors.buttonBg,
                          }}
                          whileHover={{
                            background: themeColors.buttonBgHover,
                            boxShadow: themeColors.borderGlowHover
                          }}
                          whileTap={{ scale: 0.95 }}
                          aria-label={`Add ${quantity} ${item.name} to order`}
                        >
                          Add
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                        <p className="text-xs">Add to order • <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">A</kbd></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomizeClick(e);
                          }}
                          className="h-9 px-3 flex items-center gap-1.5 rounded border transition-all duration-200 flex-shrink-0 min-w-[44px]"
                          style={{
                            borderColor: '#FFFFFF',
                            backgroundColor: 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          aria-label="Customize item"
                        >
                          <Sliders size={14} style={{ color: '#FFFFFF' }} />
                          <span className="text-xs font-medium" style={{ color: '#FFFFFF' }}>Customize</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                        <p className="text-xs">Customize (M)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Customization Modal - Conditionally render based on context */}
      {orderType ? (
        // POS Context: Use StaffCustomizationModal
        <StaffCustomizationModal
          item={item}
          variant={isMultiVariant ? selectedVariant : null}
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          onConfirm={(item, quantity, variant, customizations, notes) => {
            // Convert to POS order item format and call onAddToOrder
            if (onAddToOrder) {
              const price = variant 
                ? (orderType === 'DELIVERY' ? (variant.price_delivery ?? variant.price) : 
                   orderType === 'DINE-IN' ? (variant.price_dine_in ?? variant.price) : variant.price)
                : (orderType === 'DELIVERY' ? (item.price_delivery || item.price_takeaway || item.price || 0) :
                   orderType === 'DINE-IN' ? (item.price_dine_in || item.price_takeaway || item.price || 0) : 
                   (item.price_takeaway || item.price || 0));
              
              const customizationsTotal = customizations?.reduce((sum, c) => sum + c.price, 0) || 0;
              const totalPrice = (price + customizationsTotal) * quantity;
              
              const orderItem = {
                menu_item_id: item.id,
                item_name: item.name,
                quantity: quantity,
                unit_price: price,
                total_price: totalPrice,
                variant_id: variant?.id || null,
                variant_name: variant?.name || null,
                notes: notes || '',
                customizations: customizations?.map(c => ({
                  id: c.id,
                  name: c.name,
                  price: c.price
                })) || []
              };
              
              onAddToOrder(orderItem);
            }
            setIsCustomizationModalOpen(false);
          }}
          orderType={orderType}
        />
      ) : (
        // OnlineOrders Context: Use CustomerCustomizationModal
        <CustomerCustomizationModal
          item={item}
          variant={isMultiVariant ? selectedVariant : null}
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          addToCart={(item, quantity, variant, customizations, notes) => {
            // ✅ NEW SIGNATURE: Direct pass-through
            handleAddToCartWithCustomizations(item, quantity, variant, customizations, notes);
          }}
          mode={mode}
        />
      )}
      
      {/* Variant Selector Modal */}
      {isMultiVariant && (
        orderType ? (
          <StaffVariantSelector
            item={item}
            itemVariants={itemVariants}
            isOpen={isVariantSelectorOpen}
            onClose={() => setIsVariantSelectorOpen(false)}
            onAddToOrder={(orderItem) => {
              onAddToOrder(orderItem);
              setIsVariantSelectorOpen(false);
            }}
            orderType={orderType}
          />
        ) : (
          <CustomerVariantSelector
            isOpen={isVariantSelectorOpen}
            onClose={() => setIsVariantSelectorOpen(false)}
            item={item}
            itemVariants={itemVariants}
            mode={mode}
            addToCart={(item, quantity, variant, customizations, notes) => {
              handleAddToCartWithCustomizations(item, quantity, variant, customizations, notes);
              setIsVariantSelectorOpen(false);
            }}
          />
        )
      )}

      {/* Description Modal */}
      <DescriptionModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        itemName={item.name}
        description={item.description || ''}
        imageUrl={displayImage}
      />
    </motion.div>
  );
}
