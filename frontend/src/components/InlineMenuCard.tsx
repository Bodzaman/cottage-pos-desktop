import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeMenuStoreCompat } from 'utils/realtimeMenuStoreCompat';
import { useCartStore } from 'utils/cartStore';
import { ShoppingCart, Loader2, AlertCircle, Plus, Minus, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PremiumTheme } from 'utils/premiumTheme';
import { cn } from 'utils/cn';
import { CustomerUnifiedCustomizationModal, SelectedCustomization } from './CustomerUnifiedCustomizationModal';
import { MenuItem, ItemVariant } from '../utils/types';
import { useVariantImageCarousel } from 'utils/useVariantImageCarousel';
import { computeUnitPrice } from 'utils/priceUtils';

export interface InlineMenuCardProps {
  itemId?: string; // UUID of menu_item
  menuItemId?: string; // Alias for itemId (for compatibility with VoiceActivityPanel)
  itemData?: MenuItem; // Direct item data (bypasses store lookup when provided)
  className?: string;
  animationDelay?: number; // ✅ NEW: Delay in ms for staggered animations (default: 0)
  orderMode?: string; // Optional order mode override (uses cart store default)
  compact?: boolean; // Optional compact mode (unused, for API compatibility)
}

/**
 * InlineMenuCard Component
 * 
 * PHASE E: Replicates OnlineOrders compact card layout exactly
 * 
 * Features:
 * - 90x90px image with variant carousel (8.5s cycle)
 * - Interactive variant pills with live image switching
 * - "Selected: VARIANT • £X.XX" status display
 * - Inline quantity controls [-] [qty] [+]
 * - Conditional "Customise" button
 * - Direct "+ Add • £X.XX" button (no modal for simple adds)
 * - Expandable description with "See more/See less"
 * - Supports both variant-based and single items
 */
export function InlineMenuCard({ itemId, menuItemId, itemData, className, animationDelay = 0, orderMode, compact }: InlineMenuCardProps) {
  // Support both itemId and menuItemId props for compatibility
  const resolvedItemId = itemId || menuItemId || '';
  // ✅ CRITICAL: ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // This ensures consistent hook call order on every render (React Rules of Hooks)
  const { menuItems, itemVariants, proteinTypes, customizations, isLoading } = useRealtimeMenuStoreCompat({ context: 'online' });
  const { addItem, currentOrderMode } = useCartStore();
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = React.useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [selectedVariant, setSelectedVariant] = React.useState<ItemVariant | null>(null);
  const [quantity, setQuantity] = React.useState(1);

  // Use provided item data or fall back to store lookup by UUID
  const menuItem = itemData || menuItems?.find(item => item.id === resolvedItemId);

  // Get variants for this item (may be empty for single items)
  // Note: itemVariants from realtimeMenuStore use snake_case fields (menu_item_id, is_active)
  const variants = itemVariants?.filter(variant => variant.menu_item_id === resolvedItemId && variant.is_active) || [];
  const activeVariants = variants.filter(v => v.is_active).sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
  const isVariantBased = activeVariants.length > 0;
  const defaultVariant = activeVariants.find(v => v.is_default) || activeVariants[0];

  // ✅ Extract variant image URLs for carousel (like CompactMenuList)
  const variantImages = React.useMemo(
    () => {
      if (!isVariantBased) return [];
      return activeVariants
        .map(v => v.display_image_url || v.image_url)
        .filter(Boolean) as string[];
    },
    [activeVariants, isVariantBased]
  );

  // ✅ Use carousel hook (8.5s like CompactMenuList) - ALWAYS call this hook
  // Track local paused state for mouse hover
  const [carouselPaused, setCarouselPaused] = React.useState(false);
  const {
    currentImage,
    currentIndex,
    goToNext,
    goToPrevious,
    goToIndex
  } = useVariantImageCarousel(variantImages, 8500, carouselPaused);

  // ✅ Initialize selected variant on first render
  React.useEffect(() => {
    if (isVariantBased && !selectedVariant && defaultVariant) {
      setSelectedVariant(defaultVariant);
    }
  }, [isVariantBased, selectedVariant, defaultVariant]);

  // ✅ Resolve display image with carousel support
  const displayImageUrl = React.useMemo(() => {
    // For variant-based items with carousel: use carousel's current image
    if (isVariantBased && variantImages.length > 0) {
      return currentImage || variantImages[0];
    }
    
    // For variant-based items without carousel: use selected variant image
    if (isVariantBased && selectedVariant) {
      if (selectedVariant.display_image_url) return selectedVariant.display_image_url;
      if (selectedVariant.image_url) return selectedVariant.image_url;
    }
    
    // Fallback to menu item images (for single items)
    if (menuItem?.image_variants?.square?.webp) return menuItem.image_variants.square.webp;
    if (menuItem?.image_url) return menuItem.image_url;
    
    return null;
  }, [isVariantBased, variantImages, currentImage, selectedVariant, menuItem]);

  // ✅ Get current mode for pricing
  // currentOrderMode from cartStore is OrderMode: 'delivery' | 'collection' | 'dine-in' (lowercase)
  const mode: 'delivery' | 'collection' = currentOrderMode === 'delivery' ? 'delivery' : 'collection';

  // ✅ Calculate unit price using shared util
  const unitPrice = menuItem ? computeUnitPrice({ 
    item: menuItem, 
    variant: isVariantBased ? selectedVariant : null, 
    mode 
  }) : 0;
  const totalPrice = unitPrice * quantity;

  // ✅ Description expansion logic
  const DESCRIPTION_THRESHOLD = 100;
  const shouldTruncate = menuItem?.description && menuItem.description.length > DESCRIPTION_THRESHOLD;
  
  const displayedDescription = React.useMemo(() => {
    if (!menuItem?.description) return null;
    
    if (!shouldTruncate || isDescriptionExpanded) {
      return menuItem.description;
    }
    
    return menuItem.description.substring(0, DESCRIPTION_THRESHOLD) + '...';
  }, [menuItem?.description, shouldTruncate, isDescriptionExpanded]);

  // ✅ NOW we can safely do early returns (all hooks have been called)
  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading menu item...</span>
        </div>
      </Card>
    );
  }

  // Item not found
  if (!menuItem) {
    return (
      <Card className={cn('p-4 border-destructive/50', className)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-sm text-destructive">Menu item not found</span>
        </div>
      </Card>
    );
  }

  // ✅ Handle variant selection with carousel sync (like CompactMenuList)
  const handleVariantSelect = (variant: ItemVariant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity when changing variant
    
    // Sync carousel to selected variant's image
    const variantIndex = activeVariants.findIndex(v => v.id === variant.id);
    if (variantIndex !== -1 && variantImages.length > 0) {
      goToIndex(variantIndex);
      setCarouselPaused(true); // Pause auto-cycle
    }
  };

  // ✅ Quantity controls
  const handleQuantityDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(quantity + 1);
  };

  // ✅ Direct Add to Cart (no modal for simple adds)
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      if (isVariantBased && selectedVariant) {
        // Variant-based item
        addItem(
          menuItem as any, // addItem expects types/menu.MenuItem (camelCase)
          selectedVariant,
          quantity,
          [],
          mode,
          ''
        );
        
      } else {
        // Single item without variants
        const syntheticVariant: ItemVariant = {
          id: menuItem.id,
          menu_item_id: menuItem.id,
          protein_type_id: '',
          name: menuItem.name,
          variant_name: menuItem.name,
          price: menuItem.price || 0,
          price_dine_in: menuItem.price_dine_in || menuItem.price || 0,
          price_delivery: menuItem.price_delivery || menuItem.price || 0,
          is_default: true,
          is_active: true,
          display_image_url: menuItem.image_url,
          image_url: menuItem.image_url
        };

        addItem(
          menuItem as any, // addItem expects types/menu.MenuItem (camelCase)
          syntheticVariant,
          quantity,
          [],
          mode,
          ''
        );
      }
      
      // Reset quantity after add
      setQuantity(1);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      toast.error('Failed to add to cart', {
        description: 'Please try again'
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ✅ Handle customise button - Opens unified modal
  const handleCustomiseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCustomizationModalOpen(true);
  };

  // ✅ Handle add to cart from unified modal (with customizations)
  const handleAddToCartFromModal = (
    item: MenuItem,
    qty: number,
    variant: ItemVariant,
    customizationsList?: SelectedCustomization[],
    notes?: string
  ) => {
    // Convert SelectedCustomization (price_adjustment) to CartCustomization (price) format
    const cartCustomizations = (customizationsList || []).map(c => ({
      id: c.id,
      name: c.name,
      price: c.price_adjustment,
      group: c.group
    }));
    addItem(item as any, variant, qty, cartCustomizations, mode, notes || '');
    setIsCustomizationModalOpen(false);
  };

  // ✅ Phase 4A: ChatGPT-style staggered reveal animation
  const animationVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        delay: animationDelay / 1000, // Convert ms to seconds
        ease: [0.4, 0.0, 0.2, 1] // Smooth easeOut curve
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationVariants}
      className={className}
    >
      <Card 
        className={cn('overflow-hidden transition-all duration-300', className)}
        style={{ 
          background: `radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 60%), linear-gradient(135deg, ${PremiumTheme.colors.dark[800]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          borderColor: PremiumTheme.colors.dark[600],
          borderWidth: '2px',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)'
        }}
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* ✅ E1: Responsive Image with Carousel */}
            {/* Uses clamp() for responsive sizing: min 70px on small screens, max 90px on larger */}
            <div
              className="rounded-lg bg-gray-700 flex-shrink-0 cursor-pointer ring-1 ring-[#8B1538]/40 transition-transform duration-300 relative overflow-hidden"
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
              style={{
                width: 'clamp(70px, 20vw, 90px)',
                height: 'clamp(70px, 20vw, 90px)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), 0 2px 10px rgba(0,0,0,0.35)'
              }}
            >
              {displayImageUrl ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentIndex}
                    src={displayImageUrl}
                    alt={menuItem.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl opacity-30">🍽️</span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {/* Item Name & Price */}
              <div className="flex items-start justify-between gap-2">
                <h4 
                  className="font-bold text-base leading-tight"
                  style={{ color: PremiumTheme.colors.text.primary }}
                >
                  {menuItem.name}
                </h4>
                <span 
                  className="text-lg font-bold whitespace-nowrap"
                  style={{ color: PremiumTheme.colors.saffron[400] }}
                >
                  £{unitPrice.toFixed(2)}
                </span>
              </div>

              {/* ✅ E2: Selected Variant Status (only for variant-based items) */}
              {isVariantBased && selectedVariant && (
                <div 
                  className="text-xs"
                  style={{ color: PremiumTheme.colors.text.secondary }}
                >
                  Selected: <span style={{ color: PremiumTheme.colors.saffron[400] }}>
                    {selectedVariant.variant_name || selectedVariant.name} • £{unitPrice.toFixed(2)}
                  </span>
                </div>
              )}

              {/* ✅ Description with See more/See less */}
              {displayedDescription && (
                <div>
                  <p 
                    className="text-xs leading-relaxed"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    {displayedDescription}
                  </p>
                  {shouldTruncate && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-xs mt-1 hover:underline transition-colors"
                      style={{ color: PremiumTheme.colors.saffron[500] }}
                    >
                      {isDescriptionExpanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </div>
              )}

              {/* ✅ E2: Interactive Variant Pills */}
              {isVariantBased && activeVariants.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {activeVariants.map(variant => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const variantPrice = mode === 'delivery' 
                      ? (variant.price_delivery ?? variant.price)
                      : variant.price;
                    
                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantSelect(variant)}
                        className="text-xs px-2 py-1 rounded transition-all duration-200 hover:scale-105"
                        style={{
                          background: isSelected ? '#8B2332' : PremiumTheme.colors.background.tertiary,
                          color: isSelected ? 'white' : PremiumTheme.colors.text.muted,
                          border: isSelected ? '1px solid #8B2332' : 'none'
                        }}
                      >
                        {variant.variant_name || variant.name} • £{variantPrice.toFixed(2)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ✅ E3, E4, E5: Controls Row - Quantity + Customise + Add */}
              <div className="flex items-center gap-2 mt-1">
                {/* ✅ E3: Inline Quantity Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleQuantityDecrease}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                    style={{
                      background: PremiumTheme.colors.dark[700],
                      borderColor: PremiumTheme.colors.dark[600],
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span 
                    className="text-sm font-medium min-w-[24px] text-center"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleQuantityIncrease}
                    className="h-8 w-8 p-0"
                    style={{
                      background: PremiumTheme.colors.dark[700],
                      borderColor: PremiumTheme.colors.dark[600],
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* ✅ E4: Customise Button (conditional) */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCustomiseClick}
                  className="h-8 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                >
                  <Sliders className="w-3 h-3 inline-block mr-1" />
                  Customise
                </Button>

                {/* ✅ E5: Direct Add to Cart Button */}
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="h-8 gap-1 flex-1 text-xs font-medium"
                  style={{
                    background: '#8B2332',
                    color: 'white',
                    borderColor: '#8B2332'
                  }}
                >
                  {isAddingToCart ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add • £{totalPrice.toFixed(2)}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Unified Customization Modal - Handles both variants and customizations */}
      <CustomerUnifiedCustomizationModal
        item={menuItem as any}
        itemVariants={itemVariants as any[]}
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        addToCart={handleAddToCartFromModal}
        mode={mode}
        initialVariant={selectedVariant as any}
        initialQuantity={quantity}
      />
    </motion.div>
  );
}
