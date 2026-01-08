import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ShoppingCart, Utensils, Minus, Plus, Check, MousePointer, Info, ChevronRight, Sparkles, Star, X, ChevronLeft } from 'lucide-react';
import type { ProteinType } from 'utils/menuTypes';
import type { MenuItem } from 'utils/menuTypes';
import type { ItemVariant } from 'utils/menuTypes';
import { PremiumTheme, getSpiceColor, getSpiceEmoji } from 'utils/premiumTheme';
import { CustomerCustomizationModal } from './CustomerCustomizationModal';
import { SelectedCustomization } from 'utils/menuTypes';
import { SimpleVariantPicker } from './SimpleVariantPicker';
import { cn } from 'utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCartStore } from 'utils/cartStore';
import { toast } from 'sonner';
import { ItemInfoModal } from './ItemInfoModal';
import { CustomerVariantSelector } from './CustomerVariantSelector';
import { getOptimizedImagePreset } from 'utils/imageOptimization';
import { FavoriteHeartButton } from './FavoriteHeartButton';
import { OptimizedImage } from './OptimizedImage';
import { useVariantImageCarousel } from 'utils/useVariantImageCarousel';

interface OnlineMenuCardProps {
  item: MenuItem;
  mode?: 'delivery' | 'collection';
  onSelect: (item: MenuItem, variant?: ItemVariant) => void;
  className?: string;
  itemVariants?: ItemVariant[];
  proteinTypes?: ProteinType[];
  searchQuery?: string;
  enableQuickPick?: boolean; // Phase 3: toggle for quick-pick behavior
  quickPickThreshold?: number; // defaults to 3
  galleryCompact?: boolean; // NEW: compact gallery mode
}

/**
 * Customer-facing menu card for OnlineOrders
 * Premium ruby design with image on top, clean layout
 */
export function OnlineMenuCard({ 
  item, 
  onSelect, 
  mode = 'collection',
  className,
  itemVariants = [],
  proteinTypes = [],
  searchQuery = '',
  enableQuickPick = true,
  quickPickThreshold = 3,
  galleryCompact = false,
}: OnlineMenuCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); // NEW
  const [isCustomerVariantSelectorOpen, setIsCustomerVariantSelectorOpen] = useState(false); // NEW: For Customise button
  // Phase 2 micro-interactions state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [hasShownTooltip, setHasShownTooltip] = useState(false);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Option A: vertical list expand/collapse (non-compact dense list)
  const [showAllVariants, setShowAllVariants] = useState(false);

  // 🎠 NEW: Carousel control state
  const [isPaused, setIsPaused] = useState(false);
  const [manualControl, setManualControl] = useState(false);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Description truncation detection
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);

  // Premium Ruby/Burgundy Theme
  const themeColors = {
    primary: '#8B1538',
    primaryHover: '#A01B42',
    borderColor: '#8B1538',
    borderGlow: '0 0 20px rgba(139, 21, 56, 0.3)',
    borderGlowHover: '0 0 30px rgba(139, 21, 56, 0.5)',
    buttonBg: 'linear-gradient(135deg, #8B1538 0%, #6B0F2A 100%)',
    buttonBgHover: 'linear-gradient(135deg, #A01B42 0%, #8B1538 100%)',
    cardBg: 'rgba(26, 26, 26, 0.8)',
    cardBgHover: 'rgba(26, 26, 26, 0.95)'
  };
  
  // ✅ MOVED: Fallback image constant (must be declared before use)
  const fallbackImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  
  // Variants: always use the itemVariants prop filtered for this item - MEMOIZED
  const variants = useMemo(
    () => itemVariants.filter(v => v.menu_item_id === item.id),
    [itemVariants, item.id]
  );
  
  // Extract variant image URLs (match POS pattern) - MEMOIZED to prevent reset
  const variantImages = useMemo(
    () => variants
      .map(v => v.image_url)
      .filter((url): url is string => !!url),
    [variants]
  );
  
  // 🎠 Use enhanced carousel hook with manual controls
  const { 
    currentImage: currentVariantImage, 
    currentIndex,
    goToPrevious,
    goToNext,
    goToIndex 
  } = useVariantImageCarousel(
    variantImages,
    8500, // 8.5s interval (matches POS Desktop)
    isPaused // Pause when user hovers or manually controls
  );
  
  // 🎠 Carousel control functions
  const handlePrevious = useCallback(() => {
    goToPrevious();
    setManualControl(true);
    setIsPaused(true);
    
    // Auto-resume after 5 seconds
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    autoResumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      setManualControl(false);
    }, 5000);
  }, [goToPrevious]);

  const handleNext = useCallback(() => {
    goToNext();
    setManualControl(true);
    setIsPaused(true);
    
    // Auto-resume after 5 seconds
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    autoResumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      setManualControl(false);
    }, 5000);
  }, [goToNext]);

  const handleDotClick = useCallback((index: number) => {
    goToIndex(index);
    setManualControl(true);
    setIsPaused(true);
    
    // Auto-resume after 5 seconds
    if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    autoResumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      setManualControl(false);
    }, 5000);
  }, [goToIndex]);

  const handleMouseEnter = useCallback(() => {
    if (!manualControl) {
      setIsPaused(true);
    }
  }, [manualControl]);

  const handleMouseLeave = useCallback(() => {
    if (!manualControl) {
      setIsPaused(false);
    }
  }, [manualControl]);
  
  // Determine which image to display - PRIORITIZE CAROUSEL IMAGES
  // Priority: 1) Carousel variant images, 2) Base item image, 3) Fallback
  const displayImage = currentVariantImage 
    || item.image_url 
    || fallbackImage;
  
  const activeVariants = variants.filter(v => (v as any).is_active !== false).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  const isMultiVariant = activeVariants.length > 0; // rely on actual variants presence
  const isQuickPick = enableQuickPick && activeVariants.length > quickPickThreshold;
  const VISIBLE_COUNT = 4;

  // Selected variant state (default to first active variant)
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    isMultiVariant ? activeVariants[0]?.id : undefined
  );

  const [quantity, setQuantity] = useState(1);
  
  // Add cart store
  const { addItem } = useCartStore();

  // ✅ FIX (MYA-1380): Move selectedVariant declaration before usage
  const selectedVariant = activeVariants.find(v => v.id === selectedVariantId);
  const selectedVariantLabel = selectedVariant ? (selectedVariant.name || selectedVariant.variant_name || selectedVariant.protein_type_name || 'Option') : '';
  
  // --- Pricing helpers (mode-aware) ---
  const getModeAwareItemPrice = (): number => {
    if (mode === 'delivery') {
      return (item.price_delivery ?? item.price_takeaway ?? item.price ?? 0) as number;
    }
    // collection (takeaway)
    return (item.price_takeaway ?? item.price ?? 0) as number;
  };

  const getModeAwareVariantPrice = (variant: ItemVariant): number => {
    if (mode === 'delivery') {
      return (variant.price_delivery ?? variant.price ?? 0) as number;
    }
    return (variant.price ?? 0) as number;
  };
  
  const displayPrice = selectedVariant ? getModeAwareVariantPrice(selectedVariant) : getModeAwareItemPrice();

  // ✅ VARIANT INHERITANCE: Use display_image_url from selected variant (resolved by backend)
  const displayImageUrl = (isMultiVariant && selectedVariant?.display_image_url)
    ? selectedVariant.display_image_url
    : item.image_url || fallbackImage;
  
  // Optimized image for faster loading (50-70% reduction)
  const optimizedImage = getOptimizedImagePreset(displayImageUrl, 'CARD') || displayImageUrl;
  
  // ✅ VARIANT-AWARE SPICE LEVEL: Show variant spice if variant selected, else item-level
  const getDisplaySpiceLevel = (): number => {
    if (isMultiVariant && selectedVariant?.spice_level !== undefined) {
      return selectedVariant.spice_level;
    }
    return item.spice_indicators ? parseInt(item.spice_indicators) || 0 : 0;
  };
  
  const spiceLevel = getDisplaySpiceLevel();
  const spiceColor = getSpiceColor(spiceLevel);
  const spiceEmoji = getSpiceEmoji(spiceLevel);
  
  // ✅ VARIANT-AWARE DIETARY FLAGS: Show variant flags if selected, else item-level
  const getDisplayDietaryFlags = (): {
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    is_halal?: boolean;
    is_dairy_free?: boolean;
    is_nut_free?: boolean;
  } => {
    if (isMultiVariant && selectedVariant) {
      return {
        is_vegetarian: selectedVariant.is_vegetarian,
        is_vegan: selectedVariant.is_vegan,
        is_gluten_free: selectedVariant.is_gluten_free,
        is_halal: selectedVariant.is_halal,
        is_dairy_free: selectedVariant.is_dairy_free,
        is_nut_free: selectedVariant.is_nut_free
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
  
  // ✅ VARIANT-AWARE ALLERGENS: Show variant allergens if selected
  const getDisplayAllergens = (): string[] => {
    if (isMultiVariant && selectedVariant?.allergens) {
      return selectedVariant.allergens;
    }
    return []; // Item-level allergens not stored in MenuItem
  };
  
  const allergens = getDisplayAllergens();
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    };
  }, []);

  // ✅ NEW: Detect if description is truncated
  useEffect(() => {
    if (!descriptionRef.current || !item.description) {
      setIsDescriptionTruncated(false);
      return;
    }
    
    // Check if content is truncated (scrollHeight > clientHeight)
    const element = descriptionRef.current;
    const isTruncated = element.scrollHeight > element.clientHeight;
    setIsDescriptionTruncated(isTruncated);
  }, [item.description, galleryCompact, isMultiVariant]);

  const handleCardImageClick = () => {
    if (galleryCompact) {
      setIsInfoModalOpen(true);
      return;
    }
    // Default behavior
    if (isMultiVariant) {
      setIsVariantSelectorOpen(true);
    } else {
      setIsCustomizationModalOpen(true);
    }
  };

  // Click handlers
  const handleCustomiseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always open customization modal for extras/notes
    setIsCustomizationModalOpen(true);
  };

  const toggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  // Handle showing the helper tooltip once on first hover/focus
  const showTooltipOnce = () => {
    if (hasShownTooltip) return;
    setTooltipOpen(true);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipOpen(false);
      setHasShownTooltip(true);
    }, 1200);
  };

  // Unified selection handler (click + keyboard)
  const handleVariantSelect = (variant: ItemVariant) => {
    // Priority 1: variant_name (database-generated), Priority 2: name (custom override), Priority 3: protein_type_name
    const variantLabel = variant.variant_name || variant.name || variant.protein_type_name || 'Option';
    setSelectedVariantId(variant.id);

    // 🎠 NEW: Jump carousel to selected variant's image
    const variantIndex = variants.findIndex(v => v.id === variant.id);
    if (variantIndex !== -1) {
      goToIndex(variantIndex);
      setManualControl(true);
      setIsPaused(true);
      
      // Auto-resume after 5 seconds of inactivity
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = setTimeout(() => {
        setIsPaused(false);
        setManualControl(false);
      }, 5000);
    }

    // Inline micro-feedback (fade in/out)
    setFeedbackText(variantLabel);
    setShowFeedback(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setShowFeedback(false), 700);

    // Screen reader announcement
    setAriaLiveMessage(`Selected ${variantLabel}`);

    // Hide tooltip after first valid interaction
    setTooltipOpen(false);
    setHasShownTooltip(true);

    // If the chosen option is beyond the visible shortlist, auto-expand (non-compact list)
    if (isQuickPick && !galleryCompact && !showAllVariants) {
      const idx = activeVariants.findIndex(v => v.id === variant.id);
      if (idx >= VISIBLE_COUNT) setShowAllVariants(true);
    }
  };

  // CTA label and disable state
  const ctaDisabled = isMultiVariant && !selectedVariantId;
  const ctaLabel = isMultiVariant
    ? (selectedVariant ? `Add ${selectedVariantLabel} • £${displayPrice.toFixed(2)}` : 'Select an option')
    : `Add ${item.name} • £${displayPrice.toFixed(2)}`;

  // Inline chips config for gallery compact Option A
  const INLINE_ROW_HEIGHT = 48; // chip height 40-44 + gaps
  const INLINE_ROWS = 2;
  const INLINE_CONTAINER_H = INLINE_ROW_HEIGHT * INLINE_ROWS; // ~96px
  const INLINE_LIMIT = 2; // show first 2 chips; '+N more' appears for 3+ variants (ensures button always visible)

  return (
    <motion.div
      className={cn(
        "flex flex-col overflow-hidden",
        "bg-gradient-to-br from-black/40 via-black/30 to-black/40",
        "backdrop-blur-sm",
        "border border-gold-400/20",
        "rounded-2xl shadow-xl",
        "hover:border-gold-400/40 hover:shadow-2xl hover:shadow-gold-500/10",
        "transition-all duration-300",
        isMultiVariant ? "min-h-[640px]" : "min-h-[480px]" // Conditional heights
      )}
      style={{
        backgroundColor: themeColors.cardBg,
        borderColor: themeColors.borderColor,
      }}
    >
      {/* Image Section - TOP (Fixed Height) */}
      <div 
        className="relative w-full h-[280px] overflow-hidden shrink-0" 
        onClick={handleCardImageClick}
        onMouseEnter={variantImages.length > 1 ? handleMouseEnter : undefined}
        onMouseLeave={variantImages.length > 1 ? handleMouseLeave : undefined}
      >
        {/* ✅ Carousel Animation Wrapper (matches POS pattern) */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="w-full h-full"
            drag={variantImages.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe > 10000) {
                handlePrevious();
              } else if (swipe < -10000) {
                handleNext();
              }
            }}
          >
            <img
              src={displayImage}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </motion.div>
        </AnimatePresence>

        {/* 🎠 Left Arrow (always visible, subtle) */}
        {variantImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all duration-200 hover:scale-110"
            aria-label="Previous variant"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* 🎠 Right Arrow (always visible, subtle) */}
        {variantImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all duration-200 hover:scale-110"
            aria-label="Next variant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* 🎠 Dot Indicators (always visible at bottom) */}
        {variantImages.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {variantImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDotClick(index);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  currentIndex === index
                    ? "bg-white w-6" // Active: filled white pill
                    : "bg-white/50 hover:bg-white/80" // Inactive: semi-transparent
                )}
                aria-label={`Go to variant ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        {/* Gradient Overlay at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Spice Level Badge */}
        {spiceLevel > 0 && (
          <div
            className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-md"
            style={{
              backgroundColor: `${spiceColor}25`,
              border: `2px solid ${spiceColor}`,
              color: spiceColor
            }}
          >
            {spiceEmoji} {spiceLevel === 1 ? 'Mild' : spiceLevel === 2 ? 'Medium' : spiceLevel === 3 ? 'Hot' : 'Extra Hot'}
          </div>
        )}

        {/* Dietary Tags */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="absolute top-14 left-3 flex flex-wrap gap-2">
            {item.dietary_tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium rounded-full backdrop-blur-md"
                style={{
                  backgroundColor: `${PremiumTheme.colors.royal[500]}20`,
                  borderWidth: '1px',
                  borderColor: `${PremiumTheme.colors.royal[400]}60`,
                  color: PremiumTheme.colors.royal[200]
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Price Badge - Bottom Right */}
        <div className="absolute bottom-3 right-3">
          <div 
            className="px-4 py-2 rounded-lg backdrop-blur-md font-bold text-lg"
            style={{
              backgroundColor: `${themeColors.primary}90`,
              color: '#FFFFFF',
              border: `2px solid ${themeColors.primary}`,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            £{displayPrice.toFixed(2)}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <FavoriteHeartButton 
            menuItemId={item.id}
            menuItemName={item.name}
            variantId={selectedVariant?.id}
            variantName={selectedVariant?.name || selectedVariant?.protein_type_name}
            imageUrl={item.image_url || undefined}
            size="md"
          />
        </div>
      </div>

      {/* Content Section - EXPANDS TO FILL SPACE */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title + Info */}
        <div className="flex items-start justify-between gap-3">
          <h3 
            className="text-xl font-bold leading-tight"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            {item.name}
          </h3>
          {/* Info button only in compact gallery */}
          {galleryCompact && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={`Open info for ${item.name}`}
              onClick={(e) => { e.stopPropagation(); setIsInfoModalOpen(true); }}
            >
              <Info className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Variant Area */}
        {isMultiVariant ? (
          !galleryCompact ? (
            <div
              className="flex flex-col gap-2 rounded-lg border"
              style={{
                borderColor: `${themeColors.primary}55`,
                background: 'linear-gradient(0deg, rgba(139,21,56,0.06) 0%, rgba(139,21,56,0.03) 100%)'
              }}
            >
              {/* Label + helper */}
              <div className="flex items-center justify-between px-3 pt-2">
                <div className="flex items-center gap-2 text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>
                  <MousePointer className="h-4 w-4 opacity-80" />
                  <span className="font-medium">Choose an option</span>
                </div>
                <div className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                  Tap to select
                </div>
              </div>
              <div className="px-3">
                <div className="h-px w-full bg-white/10" />
              </div>

              {/* Chips or Vertical List based on density */}
              <TooltipProvider delayDuration={0}>
                <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                  <TooltipTrigger asChild>
                    {isQuickPick ? (
                      // Vertical radio list with inline expand/collapse
                      <div
                        className="mt-2 px-3"
                        onMouseEnter={showTooltipOnce}
                        onFocusCapture={showTooltipOnce}
                        onMouseLeave={() => setTooltipOpen(false)}
                        role="radiogroup"
                        aria-label="Choose an option"
                      >
                        {(
                          showAllVariants ? activeVariants : activeVariants.slice(0, VISIBLE_COUNT)
                        ).map((variant) => {
                          // Priority 1: variant_name (database-generated), Priority 2: name (custom override), Priority 3: protein_type_name
                          const variantLabel = variant.variant_name || variant.name || variant.protein_type_name || 'Option';
                          const variantPrice = getModeAwareVariantPrice(variant);
                          const isSelected = variant.id === selectedVariantId;
                          return (
                            <div
                              key={variant.id}
                              style={isSelected ? { boxShadow: themeColors.borderGlow } : undefined}
                              className={cn(
                                'mb-2 rounded-md border-2 px-3 py-3 min-h-[44px] flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538] transition-all hover:-translate-y-0.5 active:scale-[0.99]',
                                isSelected
                                  ? 'bg-[#8B1538] text-white border-[#8B1538]'
                                  : 'hover:bg-[#8B1538]/10 md:backdrop-blur-sm'
                              )}
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleVariantSelect(variant);
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVariantSelect(variant);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                {isSelected && <Check className="h-4 w-4" />}
                                <span className="font-medium">{variantLabel}</span>
                              </span>
                              <span className="font-semibold">£{variantPrice.toFixed(2)}</span>
                            </div>
                          );
                        })}
                        {activeVariants.length > VISIBLE_COUNT && (
                          <button
                            className="mt-1 mb-1 text-sm font-semibold hover:underline"
                            style={{ color: themeColors.primary }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAllVariants(!showAllVariants);
                            }}
                          >
                            {showAllVariants ? 'Show less' : `Show all ${activeVariants.length}`}
                          </button>
                        )}
                      </div>
                    ) : (
                       <div
                         className="flex flex-wrap gap-2 mt-1"
                         onMouseEnter={showTooltipOnce}
                         onFocusCapture={showTooltipOnce}
                         onMouseLeave={() => setTooltipOpen(false)}
                       >
                         {activeVariants.map((variant) => {
                           const variantLabel = variant.name || variant.variant_name || variant.protein_type_name || 'Option';
                           const variantPrice = getModeAwareVariantPrice(variant);
                           const isSelected = variant.id === selectedVariantId;
                           return (
                             <div
                               key={variant.id}
                               style={isSelected ? { boxShadow: themeColors.borderGlow } : undefined}
                             >
                               <Badge
                                 role="button"
                                 aria-pressed={isSelected}
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === ' ') {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     handleVariantSelect(variant);
                                   }
                                 }}
                                 variant={isSelected ? 'default' : 'outline'}
                                 className={cn(
                                   'cursor-pointer transition-all px-3.5 py-2 text-sm border-2 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538] hover:-translate-y-0.5 active:scale-[0.98]',
                                   isSelected
                                     ? 'bg-[#8B1538] text-white hover:bg-[#6B1028] shadow-md'
                                     : 'hover:bg-[#8B1538]/10 hover:shadow md:backdrop-blur-sm'
                                 )}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleVariantSelect(variant);
                                 }}
                               >
                                 <span className="flex items-center gap-1.5">
                                   {isSelected && <Check className="h-4 w-4" />}
                                   <span>{variantLabel} • £{variantPrice.toFixed(2)}</span>
                                 </span>
                               </Badge>
                             </div>
                           );
                         })}
                       </div>
                     )}
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="text-xs">
                    Tap a variant to select
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* aria-live region for screen readers */}
              <div className="sr-only" aria-live="polite">{ariaLiveMessage}</div>

              {/* Micro-feedback + Selected helper (reserved space to avoid layout shift) */}
              <div className="mt-1 min-h-[20px] px-3 pb-2">
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-1 text-emerald-400 text-xs"
                    >
                      <Check className="h-3 w-3" />
                      <span>Selected {feedbackText}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {selectedVariant && (
                  <div className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                    Selected: <span className="font-medium" style={{ color: PremiumTheme.colors.text.secondary }}>{selectedVariantLabel}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null
        ) : null}

        {/* Description with See More (hidden in compact gallery) */}
        {!galleryCompact && item.description && (
          <div className="space-y-1">
            <p
              className={cn(
                "text-sm leading-relaxed",
                !isDescriptionExpanded && "line-clamp-2"
              )}
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              {item.description}
            </p>
            {item.description.length > 100 && (
              <button
                onClick={toggleDescription}
                className="text-sm font-semibold hover:underline transition-all flex items-center gap-1"
                style={{ color: themeColors.primary }}
              >
                {isDescriptionExpanded ? (
                  <>
                    <span>See Less</span>
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span>See More...</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Compact Gallery: Description with conditional truncation */}
        {galleryCompact && item.description && (
          <div className={cn("px-1", isMultiVariant && "space-y-1")}>
            <p
              ref={descriptionRef}
              className={cn(
                "text-sm leading-relaxed",
                isMultiVariant && "line-clamp-2"
              )}
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              {item.description}
            </p>
            {isMultiVariant && isDescriptionTruncated && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInfoModalOpen(true);
                }}
                className="text-sm font-medium hover:underline transition-all inline-flex items-center gap-1"
                style={{ color: PremiumTheme.colors.gold[400] }}
                aria-label={`View full description for ${item.name}`}
              >
                <span>... See more</span>
              </button>
            )}
          </div>
        )}

        {/* Gallery Compact: Inline Protein Chips */}
        {galleryCompact && isMultiVariant && (
          <div className="space-y-2 px-1">
            {/* Chips display */}
            <TooltipProvider delayDuration={0}>
              <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                <TooltipTrigger asChild>
                  <div
                    className="flex flex-wrap gap-2"
                    onMouseEnter={showTooltipOnce}
                    onFocusCapture={showTooltipOnce}
                    onMouseLeave={() => setTooltipOpen(false)}
                  >
                    {activeVariants.map((variant) => {
                      const variantLabel = variant.name || variant.variant_name || variant.protein_type_name || 'Option';
                      const variantPrice = getModeAwareVariantPrice(variant);
                      const isSelected = variant.id === selectedVariantId;
                      return (
                        <div
                          key={variant.id}
                          style={isSelected ? { boxShadow: themeColors.borderGlow } : undefined}
                        >
                          <Badge
                            role="button"
                            aria-pressed={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleVariantSelect(variant);
                              }
                            }}
                            variant={isSelected ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer transition-all px-3.5 py-2 text-sm border-2 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538] hover:-translate-y-0.5 active:scale-[0.98]',
                              isSelected
                                ? 'bg-[#8B1538] text-white hover:bg-[#6B1028] shadow-md'
                                : 'hover:bg-[#8B1538]/10 hover:shadow md:backdrop-blur-sm'
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVariantSelect(variant);
                            }}
                          >
                            <span className="flex items-center gap-1.5">
                              {isSelected && <Check className="h-4 w-4" />}
                              <span>{variantLabel} • £{variantPrice.toFixed(2)}</span>
                            </span>
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="text-xs">
                  Tap a variant to select
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* aria-live region for screen readers */}
            <div className="sr-only" aria-live="polite">{ariaLiveMessage}</div>

            {/* Micro-feedback */}
            <div className="min-h-[20px]">
              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-1 text-emerald-400 text-xs"
                  >
                    <Check className="h-3 w-3" />
                    <span>Selected {feedbackText}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* 🎯 Invisible Spacer - ONLY for single items (pushes buttons to bottom) */}
        {!isMultiVariant && <div className="flex-1" />}

        {/* Action Buttons - ANCHORED TO BOTTOM */}
        <div className="flex flex-col gap-2.5 mt-auto">
          {/* Inline Controls Row - Quantity + Secondary Actions */}
          <div className="flex items-center justify-between gap-2">
            {/* Quantity Controls - Left Side */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-[#8B1538] text-white hover:bg-[#8B1538]/10"
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantity > 1) setQuantity(quantity - 1);
                }}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[2rem] text-center" style={{ color: PremiumTheme.colors.text.primary }}>
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-[#8B1538] text-white hover:bg-[#8B1538]/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(quantity + 1);
                }}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Secondary Actions - Right Side */}
            <div className="flex items-center gap-2">
              {/* Customise Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3"
                style={{
                  color: PremiumTheme.colors.gold[400]
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('⚙️ Customise button clicked for:', item.name);
                  console.log('   isMultiVariant:', isMultiVariant);
                  console.log('   galleryCompact:', galleryCompact);
                  console.log('   Selected variant:', selectedVariantId);
                  
                  if (galleryCompact && isMultiVariant) {
                    // Multi-variant items in gallery compact → CustomerVariantSelector
                    console.log('   Opening CustomerVariantSelector');
                    setIsCustomerVariantSelectorOpen(true);
                  } else {
                    // Single items or list mode → CustomerCustomizationModal
                    console.log('   Opening CustomerCustomizationModal');
                    setIsCustomizationModalOpen(true);
                  }
                }}
                aria-label={`Customise ${item.name} with special requests`}
              >
                <Utensils className="h-4 w-4" />
                <span className="ml-1.5">Customise</span>
              </Button>
            </div>
          </div>

          {/* Selected price mirror (near CTA) */}
          {!galleryCompact && (
            <div className="text-center text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>
              {isMultiVariant && selectedVariant ? (
                <span>Selected: {selectedVariantLabel} • £{displayPrice.toFixed(2)}</span>
              ) : (
                <span>Price: £{displayPrice.toFixed(2)}</span>
              )}
            </div>
          )}

          {/* Add to Cart Button - Full Width */}
          <Button
            className={cn(
              "w-full bg-[#8B1538] hover:bg-[#6B1028] text-white",
              ctaDisabled && 'opacity-60 cursor-not-allowed hover:bg-[#8B1538]'
            )}
            disabled={ctaDisabled}
            onClick={(e) => {
              e.stopPropagation();
              // ✅ FIX: Pass complete variant object instead of reconstructed one
              // This preserves variant_name, price_delivery, and all other fields
              let variantForCart: any = null;
              if (isMultiVariant) {
                const baseVariant = selectedVariant || activeVariants[0] || null;
                if (baseVariant) {
                  // Use complete variant object directly
                  variantForCart = baseVariant;
                }
              } else {
                // Synthetic variant for single items with proper price_delivery field
                variantForCart = {
                  id: `default-${item.id}`,
                  name: item.name,
                  price: getModeAwareItemPrice(),
                  price_delivery: item.price_delivery ?? item.price_takeaway ?? item.price ?? 0
                };
              }

              addItem(item, variantForCart, quantity, '');
              const message = quantity > 1 ? `Added ${quantity} items to cart!` : 'Added to cart!';
              toast.success(message);
              setQuantity(1); // Reset to 1 after adding
            }}
            aria-label={ctaLabel}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {ctaLabel}
          </Button>
        </div>
      </div>

      {/* Modals */}
      {galleryCompact && (
        <ItemInfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          item={item}
          itemVariants={itemVariants}
          mode={mode}
        />
      )}
      {/* Simple Variant Picker Modal - for choosing protein type only */}
      <SimpleVariantPicker
        item={item}
        itemVariants={itemVariants}
        isOpen={isVariantSelectorOpen}
        onClose={() => setIsVariantSelectorOpen(false)}
        onSelectVariant={(variant) => {
          console.log('✅ Variant selected from picker:', variant.id, variant.name);
          // Just update internal card state - DO NOT call onSelect
          setSelectedVariantId(variant.id);
          setIsVariantSelectorOpen(false);
        }}
        currentVariantId={selectedVariantId}
        mode={mode}
      />
      
      {/* CustomerVariantSelector - for Customise button (shows variants + Customise & Add) */}
      {galleryCompact && isMultiVariant && (
        <CustomerVariantSelector
          item={item}
          itemVariants={itemVariants}
          isOpen={isCustomerVariantSelectorOpen}
          onClose={() => setIsCustomerVariantSelectorOpen(false)}
          addToCart={(item, quantity, variant, customizations, notes) => {
            console.log('✅ Adding from CustomerVariantSelector:', { item: item.name, variant: variant?.name, quantity, customizations, notes });
            // Pass to addItem: (item, variant, qty, customizations, mode, notes)
            addItem(item, variant, quantity, customizations || [], mode, notes || '');
            toast.success(`Added ${quantity}x ${variant?.name || item.name} to cart`);
            setIsCustomerVariantSelectorOpen(false);
            setQuantity(1);
          }}
          mode={mode}
          initialVariant={selectedVariantId ? itemVariants.find(v => v.id === selectedVariantId) : null}
        />
      )}
      
      {/* Customization Modal - for extras/notes (non-variant items or list mode) */}
      {!(galleryCompact && isMultiVariant) && (
        <CustomerCustomizationModal
          item={item}
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          addToCart={(item, quantity, variant, customizations, notes) => {
            // ✅ NEW SIGNATURE: (item, quantity, variant, customizations, notes)
            console.log('✅ Adding to cart with customizations:', { item: item.name, variant: variant?.name, quantity, customizations, notes });
            const finalVariant = variant || (selectedVariantId ? itemVariants.find(v => v.id === selectedVariantId) : undefined);
            // Pass to addItem: (item, variant, qty, customizations, mode, notes)
            addItem(item, finalVariant, quantity, customizations || [], mode, notes || '');
            toast.success(`Added ${quantity}x ${item.name} to cart`);
            setIsCustomizationModalOpen(false);
          }}
          selectedVariant={selectedVariantId ? itemVariants.find(v => v.id === selectedVariantId) : undefined}
          mode={mode}
        />
      )}
    </motion.div>
  );
}
