import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, ItemVariant, ProteinType, SelectedCustomization } from 'utils/menuTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Star, Leaf, Sliders, Check, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { PremiumTheme } from 'utils/premiumTheme';
import { useCartStore } from 'utils/cartStore';
import { shallow } from 'zustand/shallow';
import { CustomerCustomizationModal } from './CustomerCustomizationModal';
import { CustomerVariantSelector } from './CustomerVariantSelector';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { toast } from 'sonner';
import { cn } from 'utils/cn';
import { computeUnitPrice, formatCurrency } from 'utils/priceUtils';
import { FavoriteHeartButton } from './FavoriteHeartButton';
import { OptimizedImage } from './OptimizedImage';
import { useVariantImageCarousel } from 'utils/useVariantImageCarousel';

interface CompactMenuListProps {
  menuItems: MenuItem[];
  onItemSelect: (item: MenuItem, variant?: ItemVariant) => void;
  mode?: 'delivery' | 'collection';
  itemVariants?: ItemVariant[];
  proteinTypes?: ProteinType[];
  className?: string;
}

export function CompactMenuList({ 
  menuItems, 
  onItemSelect, 
  mode = 'collection', 
  itemVariants = [],
  proteinTypes = [],
  className = '' 
}: CompactMenuListProps) {
  const { addItem } = useCartStore();
  const { customizations, variantsByMenuItem } = useRealtimeMenuStore(
    (state) => ({ customizations: state.customizations, variantsByMenuItem: state.variantsByMenuItem }),
    shallow
  );

  // A11y: screen reader announcements
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');

  // State for tracking selected variants and quantities per item
  const [itemStates, setItemStates] = useState<Record<string, {
    selectedVariant: ItemVariant | null;
    quantity: number;
    isCustomizationModalOpen: boolean;
    isVariantSelectorOpen: boolean;
    isDescExpanded?: boolean;
    addedPulse?: boolean;
  }>>({});

  // Helper to get item state
  const getItemState = (itemId: string) => {
    if (!itemStates[itemId]) {
      const variants = getItemVariants(itemId);
      const activeVariants = variants.filter(v => v.is_active).sort((a, b) => a.price - b.price);
      const isMultiVariant = variants.length > 0;
      
      setItemStates(prev => ({
        ...prev,
        [itemId]: {
          selectedVariant: isMultiVariant && activeVariants.length > 0 ? activeVariants[0] : null,
          quantity: 1,
          isCustomizationModalOpen: false,
          isVariantSelectorOpen: false,
          isDescExpanded: false,
          addedPulse: false
        }
      }));
      
      return {
        selectedVariant: isMultiVariant && activeVariants.length > 0 ? activeVariants[0] : null,
        quantity: 1,
        isCustomizationModalOpen: false,
        isVariantSelectorOpen: false,
        isDescExpanded: false,
        addedPulse: false
      };
    }
    return itemStates[itemId];
  };

  // Helper to update item state
  const updateItemState = (itemId: string, updates: Partial<typeof itemStates[string]>) => {
    setItemStates(prev => {
      // Get current state from prev, not from closure
      const currentState = prev[itemId] || {
        selectedVariant: null,
        quantity: 1,
        isCustomizationModalOpen: false,
        isVariantSelectorOpen: false,
        isDescExpanded: false,
        addedPulse: false
      };
      
      return {
        ...prev,
        [itemId]: { ...currentState, ...updates }
      };
    });
  };

  // Helper to get item variants
  const getItemVariants = (itemId: string) => {
    return itemVariants.filter(variant => variant.menu_item_id === itemId);
  };

  // Helper to get display price
  const getDisplayPrice = (item: MenuItem, selectedVariant: ItemVariant | null) => {
    const variants = getItemVariants(item.id);
    const isMultiVariant = variants.length > 0;
    
    if (isMultiVariant && selectedVariant) {
      return mode === 'delivery'
        ? (selectedVariant.price_delivery ?? selectedVariant.price)
        : selectedVariant.price;
    } else {
      return mode === 'delivery'
        ? (item.price_delivery || item.price_takeaway || item.price || 0)
        : (item.price_takeaway || item.price || 0);
    }
  };

  // Helper to check if item has customizations
  const hasCustomizations = (itemId: string) => {
    return customizations.some(c => 
      c.menu_item_ids?.includes(itemId) && 
      c.active && 
      c.show_on_website
    );
  };

  // Handle variant selection
  const handleVariantSelect = (itemId: string, variant: ItemVariant) => {
    updateItemState(itemId, { 
      selectedVariant: variant,
      quantity: 1 // Reset quantity when changing variant
    });
  };

  // 🎠 NEW: Handle variant selection with carousel sync
  // Called inline from protein chip buttons (needs carousel methods in scope)
  const handleVariantSelectWithCarousel = (
    itemId: string,
    variant: ItemVariant,
    variants: ItemVariant[],
    goToIndex: (index: number) => void,
    pause: () => void
  ) => {
    // Update selected variant state
    handleVariantSelect(itemId, variant);

    // 🎠 Jump carousel to selected variant's image
    const variantIndex = variants.findIndex(v => v.id === variant.id);
    if (variantIndex !== -1) {
      goToIndex(variantIndex);
      pause(); // Pause auto-cycle (will auto-resume after 5s from hook)
    }
  };

  // Handle quantity controls
  const handleQuantityDecrease = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const state = getItemState(itemId);
    if (state.quantity > 1) {
      updateItemState(itemId, { quantity: state.quantity - 1 });
    }
  };

  const handleQuantityIncrease = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const state = getItemState(itemId);
    updateItemState(itemId, { quantity: state.quantity + 1 });
  };

  // Handle add to cart
  const handleAddToCart = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const state = getItemState(item.id);
    const price = getDisplayPrice(item, state.selectedVariant);
    const variants = getItemVariants(item.id);
    const isMultiVariant = variants.length > 0;
    
    if (isMultiVariant && state.selectedVariant) {
      // ✅ FIX: Pass complete variant object instead of creating stripped-down version
      // This preserves variant_name, price_delivery, and all other fields
      addItem(item, state.selectedVariant, state.quantity, '');
      
      const displayName = state.selectedVariant.variant_name || state.selectedVariant.name || 'Option';
      toast.success(`${item.name} added to cart`, {
        description: `${displayName} • Qty: ${state.quantity} • £${(price * state.quantity).toFixed(2)}`
      });

      setAriaLiveMessage(`${item.name}, ${displayName}, quantity ${state.quantity} added to cart.`);
    } else {
      const singleVariant = {
        id: `single-${item.id}`,
        name: item.name,
        price: price
      };
      
      addItem(item, singleVariant, state.quantity, '');
      
      toast.success(`${item.name} added to cart`, {
        description: `Quantity: ${state.quantity} • £${(price * state.quantity).toFixed(2)}`
      });

      setAriaLiveMessage(`${item.name}, quantity ${state.quantity} added to cart.`);
    }
    
    // Reset quantity to 1 after adding
    updateItemState(item.id, { quantity: 1, addedPulse: true });

    // Clear the pulse after a brief animation
    setTimeout(() => updateItemState(item.id, { addedPulse: false }), 600);
  };

  // Handle customization
  const handleCustomiseClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const variants = getItemVariants(item.id);
    const isMultiVariant = variants.length > 0;
    
    if (isMultiVariant) {
      // For variant items, open the protein selection modal
      updateItemState(item.id, { isVariantSelectorOpen: true });
    } else {
      // For single items, open customization modal directly
      updateItemState(item.id, { isCustomizationModalOpen: true });
    }
  };

  // Handle add to cart with customizations
  const handleAddToCartWithCustomizations = (
    item: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    const price = variant 
      ? (mode === 'delivery' ? (variant.price_delivery ?? variant.price) : variant.price)
      : (mode === 'delivery' ? (item.price_delivery || item.price_takeaway || item.price || 0) : (item.price_takeaway || item.price || 0));
    
    let variantForCart;
    if (variant) {
      // ✅ Use the full variant_name field (e.g., "Chicken Shashlick Bhuna") instead of just protein type
      const displayName = variant.variant_name || variant.name || 'Option';
      variantForCart = {
        id: variant.id,
        name: displayName,
        price: variant.price,
        price_delivery: variant.price_delivery ?? variant.price // ✅ Ensure price_delivery is always included
      };
    } else {
      // Non-variant item
      variantForCart = {
        id: `${item.id}-default`,
        name: item.name,
        price: price
      };
    }

    console.log('🛒 [CompactMenuList] Adding to cart:', {
      itemName: item.name,
      variantName: variantForCart.name,
      quantity,
      customizations,
      notes,
      mode
    });

    // ✅ FIX: Correct parameter order: item, variant, qty, customizations, mode, notes
    addItem(item, variantForCart, quantity, customizations || [], mode, notes || '');
    
    updateItemState(item.id, {
      isCustomizationModalOpen: false,
      isVariantSelectorOpen: false,
      addedPulse: true,
      quantity: 1
    });

    setTimeout(() => {
      updateItemState(item.id, { addedPulse: false });
    }, 1000);
  };

  if (!menuItems || menuItems.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-400">No items available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* A11y live region */}
      <div aria-live="polite" className="sr-only">{ariaLiveMessage}</div>
      {menuItems.map((item, index) => {
        const variants = variantsByMenuItem[item.id] || [];
        const activeVariants = variants.filter(v => v.is_active).sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        const isMultiVariant = activeVariants.length > 0;
        const state = getItemState(item.id);
        
        // ✅ APPLY POSDesktop PATTERN (lines 74-77 from POSMenuItemCard.tsx)
        // Extract variant image URLs directly from variants array
        const variantImages = React.useMemo(
          () => variants.filter(v => v.image_url).map(v => v.image_url!),
          [variants]
        );
        
        // Use carousel hook with extracted URLs
        const {
          currentImage,
          currentIndex,
          isPaused,
          goToNext,
          goToPrevious,
          goToIndex,
          pause,
          resume
        } = useVariantImageCarousel(variantImages, 8500);
        
        // Price computation using shared util for parity with Gallery
        const unitPrice = computeUnitPrice({ item, variant: state.selectedVariant, mode });
        const totalPrice = unitPrice * state.quantity;
        
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group"
          >
            <div
              className="p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-2xl"
              style={{
                background: `radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 60%), linear-gradient(135deg, ${PremiumTheme.colors.dark[800]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
                borderColor: PremiumTheme.colors.dark[600],
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)'
              }}
            >
              <div className="flex items-start gap-4">
                {/* Image with Carousel */}
                <div
                  className="w-[72px] h-[72px] rounded-lg bg-gray-700 flex-shrink-0 cursor-pointer ring-1 ring-[#8B1538]/40 transition-transform duration-300 relative overflow-hidden"
                  onClick={() => onItemSelect(item)}
                  onMouseEnter={pause}
                  onMouseLeave={resume}
                  style={{
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), 0 2px 10px rgba(0,0,0,0.35)'
                  }}
                >
                  {/* Carousel Animation with Crossfade */}
                  {currentImage ? (
                    <>
                      {/* AnimatePresence for smooth crossfade */}
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentIndex}
                          src={currentImage}
                          alt={item.name}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute inset-0 w-full h-full object-cover rounded-lg"
                        />
                      </AnimatePresence>
                      
                      {/* Left arrow */}
                      {variantImages.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                          className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          aria-label="Previous variant image"
                        >
                          <ChevronLeft className="h-3 w-3 text-white" />
                        </button>
                      )}
                      
                      {/* Right arrow */}
                      {variantImages.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); goToNext(); }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          aria-label="Next variant image"
                        >
                          <ChevronRight className="h-3 w-3 text-white" />
                        </button>
                      )}
                      
                      {/* Dot indicators */}
                      {variantImages.length > 1 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                          {variantImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); goToIndex(idx); }}
                              className={cn(
                                "rounded-full transition-all",
                                idx === currentIndex
                                  ? "w-1.5 h-1.5 bg-white"
                                  : "w-1 h-1 bg-white/50 hover:bg-white/75"
                              )}
                              aria-label={`Go to variant ${idx + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Pause/Resume button */}
                      {variantImages.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); isPaused ? resume() : pause(); }}
                          className="absolute top-1 right-1 bg-black/40 hover:bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          aria-label={isPaused ? 'Resume carousel' : 'Pause carousel'}
                        >
                          {isPaused ? <Play className="h-2.5 w-2.5 text-white" /> : <Pause className="h-2.5 w-2.5 text-white" />}
                        </button>
                      )}
                    </>
                  ) : (
                    // Fallback to base item image
                    <OptimizedImage
                      image_variants={item.image_variants}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                      fallbackSrc='https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80'
                      preset="thumbnail"
                    />
                  )}
                  
                  {/* Favorite Heart Button - Bottom Left */}
                  <div className="absolute bottom-1 left-1 z-10">
                    <FavoriteHeartButton
                      menuItemId={item.id}
                      menuItemName={item.name}
                      variantId={state.selectedVariant?.id}
                      variantName={state.selectedVariant ? (() => {
                        const proteinType = proteinTypes.find(pt => pt.id === state.selectedVariant!.protein_type_id);
                        return proteinType?.name || state.selectedVariant!.name || 'Option';
                      })() : undefined}
                      imageUrl={item.image_url}
                      size="sm"
                    />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title and Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate cursor-pointer hover:text-gray-300 tracking-wide"
                        onClick={() => onItemSelect(item)}
                      >
                        {item.name}
                      </h3>
                      {/* Variant hint */}
                      {isMultiVariant && (
                        <div className="mt-0.5 text-xs text-gray-400">
                          {state.selectedVariant ? (
                            <span>
                              Selected: {(() => {
                                const proteinType = proteinTypes.find(pt => pt.id === state.selectedVariant!.protein_type_id);
                                const displayName = proteinType?.name || state.selectedVariant.name || 'Option';
                                return displayName;
                              })()} {`• ${formatCurrency(unitPrice)}`}
                            </span>
                          ) : (
                            <button
                              className="underline underline-offset-2 hover:text-gray-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateItemState(item.id, { isVariantSelectorOpen: true });
                              }}
                            >
                              Choose an option
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {item.featured && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-[#8B1538] text-white border-0"
                          >
                            <Star className="w-3 h-3 mr-1" fill="currentColor" />
                            Featured
                          </Badge>
                        )}
                        
                        {item.dietary_tags?.includes('Vegetarian') && (
                          <Badge 
                            variant="outline" 
                            className="text-xs border-green-600 text-green-400"
                          >
                            <Leaf className="w-3 h-3" fill="currentColor" />
                          </Badge>
                        )}
                        
                        {item.spice_indicators && parseInt(item.spice_indicators) > 0 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs border-red-600 text-red-400"
                          >
                            {Array.from({ length: parseInt(item.spice_indicators) }).map((_, i) => (
                              <span key={i}>🌶️</span>
                            ))}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Price Pill - fixed width, tabular numbers */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className="rounded-full border px-3 py-1 tabular-nums w-[96px] ml-auto"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderColor: `${PremiumTheme.colors.burgundy[500]}30`,
                          color: PremiumTheme.colors.silver[50]
                        }}
                      >
                        <span className="font-semibold">
                          {formatCurrency(unitPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {item.description && (
                    <div>
                      <p className={cn('text-sm text-gray-300', state.isDescExpanded ? '' : 'line-clamp-2', 'font-serif')}>
                        {item.description}
                      </p>
                      <button
                        className="mt-1 text-xs text-gray-400 hover:text-gray-300 underline underline-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItemState(item.id, { isDescExpanded: !state.isDescExpanded });
                        }}
                        aria-label={state.isDescExpanded ? 'Collapse description' : 'Expand description'}
                      >
                        {state.isDescExpanded ? 'See less' : 'See more'}
                      </button>
                    </div>
                  )}
                  
                  {/* Variant Chips - Horizontal Scrollable */}
                  {isMultiVariant && activeVariants.length > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {activeVariants.map((variant) => {
                          const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
                          const displayName = proteinType?.name || variant.name || 'Option';
                          const isSelected = state.selectedVariant?.id === variant.id;
                          const variantPrice = mode === 'delivery' 
                            ? (variant.price_delivery ?? variant.price)
                            : variant.price;
                          
                          return (
                            <button
                              key={variant.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVariantSelectWithCarousel(item.id, variant, activeVariants, goToIndex, pause);
                              }}
                              className={cn(
                                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border-2",
                                isSelected
                                  ? "bg-[#8B1538] border-[#8B1538] text-white shadow-lg"
                                  : "bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50"
                              )}
                            >
                              <span className="whitespace-nowrap">
                                {displayName} • £{variantPrice.toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-1 py-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 hover:bg-gray-700"
                        onClick={(e) => handleQuantityDecrease(item.id, e)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-300" />
                      </Button>
                      {/* Animated quantity flip */}
                      <div className="min-w-[2rem] h-6 overflow-hidden text-center">
                        <AnimatePresence initial={false} mode="popLayout">
                          <motion.span
                            key={state.quantity}
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -8, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="block text-white font-semibold text-sm"
                            aria-live="off"
                          >
                            {state.quantity}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 hover:bg-gray-700"
                        onClick={(e) => handleQuantityIncrease(item.id, e)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-300" />
                      </Button>
                    </div>
                    
                    {/* Customise Button - Always show for all items */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                      onClick={(e) => handleCustomiseClick(item, e)}
                      aria-label={`Customise ${item.name}`}
                    >
                      <Sliders className="w-3.5 h-3.5 mr-1.5" />
                      Customise
                    </Button>
                    
                    {/* Add Button */}
                    <div className="relative">
                      <Button
                        size="sm"
                        className="bg-[#8B1538] hover:bg-[#7A1230] text-white font-semibold min-w-[130px]"
                        onClick={(e) => handleAddToCart(item, e)}
                        aria-label={`Add ${state.quantity} ${item.name} to cart`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        <span> Add • {formatCurrency(totalPrice)}</span>
                      </Button>
                      {state.addedPulse && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="absolute -right-2 -top-2 bg-emerald-500/20 text-emerald-400 rounded-full p-1"
                          aria-hidden="true"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Customization Modal */}
            <CustomerCustomizationModal
              item={item}
              variant={state.selectedVariant}
              isOpen={state.isCustomizationModalOpen}
              onClose={() => updateItemState(item.id, { isCustomizationModalOpen: false })}
              addToCart={(item, quantity, variant, customizations, notes) => {
                // ✅ NEW SIGNATURE: Direct pass-through, no swapping needed
                handleAddToCartWithCustomizations(item, quantity, variant, customizations, notes);
              }}
              mode={mode}
              initialQuantity={state.quantity}
            />
            
            {/* Variant Selector Modal */}
            {isMultiVariant && (
              <CustomerVariantSelector
                item={item}
                itemVariants={itemVariants}
                isOpen={state.isVariantSelectorOpen}
                onClose={() => updateItemState(item.id, { isVariantSelectorOpen: false })}
                addToCart={(item, quantity, variant, customizations, notes) =>
                  handleAddToCartWithCustomizations(item, quantity, variant, customizations, notes)
                }
                mode={mode}
                initialVariant={state.selectedVariant}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
