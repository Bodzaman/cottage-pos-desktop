import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Edit, Trash2, Info, ToggleLeft, ToggleRight, UtensilsCrossed, Package, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { apiClient } from 'app';
import type { MenuItem, MenuItemVariant, ProteinType } from 'utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { getItemDisplayPrice, getVariantSummary } from '../utils/variantPricing';
import { getSpiceEmoji } from 'utils/premiumTheme';
import { colors } from 'utils/designSystem';
import { toast } from 'sonner';
import { OptimizedImage } from 'components/OptimizedImage';
import { useVariantImageCarousel } from 'utils/useVariantImageCarousel';

export interface CompactMenuItemCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    menu_item_description?: string;
    long_description?: string;
    price_dine_in?: number;
    price?: number;
    base_price?: number;
    price_delivery?: number;
    price_takeaway?: number;
    active: boolean;
    display_order?: number;
    spice_level?: string;
    dietary_tags?: string[];
    allergens?: string[];
    allergen_warnings?: string;
    allergen_info?: string;
    cooking_time?: number;
    image_url?: string | null;
    image_variants?: Record<string, string> | null;
    variants?: Array<{
      id: string;
      variant_name: string;
      name?: string;
      price_adjustment: number;
      is_active: boolean;
      image_url?: string | null;
      image_variants?: Record<string, any> | null;
      protein_type?: string | null;
      protein_type_id?: string | null;
    }>;
  };
  onEdit: (item: any) => void;
  onDelete: (itemId: string) => void;
  onToggleActive?: (itemId: string, active: boolean) => void;
  className?: string;
}

export function CompactMenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleActive,
  className
}: CompactMenuItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // ✅ OPTION B ARCHITECTURE (MYA-1479): Read variants from item prop (API-enriched)
  // The API resolves all variant data including image_url and image_variants
  // We only need proteinTypes from store for variant summary text calculations
  const { proteinTypes } = useRealtimeMenuStore();
  const variantsList = item.variants || [];
  
  // 🔍 DEBUG: Log what data we're actually receiving
  useEffect(() => {
    console.log(`🔍 [CompactMenuItemCard] Item: ${item.name}`);
    console.log('  Base image_url:', item.image_url);
    console.log('  Base image_variants:', item.image_variants);
    console.log('  Variants count:', variantsList.length);
    
    if (variantsList.length > 0) {
      console.log('  First 3 variants:');
      variantsList.slice(0, 3).forEach((v, i) => {
        console.log(`    [${i}] ${v.variant_name || v.name}`);
        console.log(`        image_url: ${v.image_url}`);
        console.log(`        image_variants:`, v.image_variants);
      });
    }
  }, [item.id, item.name, item.image_url, variantsList.length]);
  
  // ✅ Extract variant image URLs for carousel (string array)
  // 🎯 CRITICAL: Use useMemo to prevent array recreation on every render
  const variantImages = useMemo(
    () => variantsList.filter(v => v.image_url).map(v => v.image_url!),
    [variantsList]
  );
  
  console.log(`🎠 [CompactMenuItemCard] ${item.name} - Carousel images:`, variantImages.length, variantImages);
  
  const { currentImage, currentIndex, isLoading } = useVariantImageCarousel(variantImages, 8500);
  
  // ✅ Display priority: base image → variant carousel → placeholder
  const displayImage = item.image_url || currentImage || null;

  // State
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [showPricePopover, setShowPricePopover] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  
  // Detect if description is truncated
  useEffect(() => {
    const element = descriptionRef.current;
    if (element && description) {
      setIsDescriptionTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [item.description, item.menu_item_description, item.long_description]);
  
  // Helper function to resolve protein name from protein_type_id
  const resolveProteinName = (proteinTypeId: string | null | undefined): string | null => {
    if (!proteinTypeId || !proteinTypes) return null;
    const proteinType = proteinTypes.find(pt => pt.id === proteinTypeId);
    return proteinType?.name || null;
  };
  
  // Get smart pricing using the utility
  const hasVariants = variantsList.length > 0;
  const priceDisplayDineIn = getItemDisplayPrice(item, variantsList, 'DINE-IN');
  const priceDisplayTakeaway = getItemDisplayPrice(item, variantsList, 'COLLECTION');
  const priceDisplayDelivery = getItemDisplayPrice(item, variantsList, 'DELIVERY');
  const variantSummary = hasVariants ? getVariantSummary(variantsList, proteinTypes || []) : null;
  
  const placeholderImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80';
  
  const description = item.description || item.menu_item_description || item.long_description || '';
  
  // Spice indicators
  const spiceLevel = item.spice_level ? parseInt(item.spice_level) || 0 : 0;
  const spiceEmojis = spiceLevel > 0 ? getSpiceEmoji(spiceLevel).repeat(Math.min(spiceLevel, 3)) : '';
  
  // Toggle active status function
  const toggleActiveStatus = async () => {
    if (isTogglingActive) return;
    
    try {
      setIsTogglingActive(true);
      const newActiveStatus = !item.active;
      
      if (onToggleActive) {
        await onToggleActive(item.id, newActiveStatus);
      } else {
        const response = await apiClient.update_menu_item(
          { itemId: item.id },
          { active: newActiveStatus }
        );
        
        if (!response.ok) {
          throw new Error('Failed to update item status');
        }
        
        toast.success(`Item ${newActiveStatus ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      console.error('Error toggling item active status:', error);
      toast.error('Failed to update item status');
    } finally {
      setIsTogglingActive(false);
    }
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
              fallbackUrl={displayImage || placeholderImage}
              alt={item.name}
              className="w-full h-full object-cover"
              preset="square"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}

        {/* Status indicator - Top right corner */}
        <div 
          className={cn(
            "absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-lg z-10",
            item.active ? 'bg-emerald-400' : 'bg-red-400'
          )} 
        />
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
          {spiceEmojis && (
            <span className="text-base flex-shrink-0">
              {spiceEmojis}
            </span>
          )}
        </div>

        {/* Item Description - with "See More" for long text */}
        {description && (
          <div className="flex-shrink-0">
            <p 
              ref={descriptionRef}
              className="text-sm leading-relaxed line-clamp-3"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              {description}
            </p>
            {isDescriptionTruncated && (
              <Popover open={showDescriptionPopover} onOpenChange={setShowDescriptionPopover}>
                <PopoverTrigger asChild>
                  <button
                    className="text-xs font-medium mt-1 transition-all duration-200 hover:underline"
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
                      {description}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        {/* Dietary Tags Badge */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.dietary_tags.map((tag) => (
              <Badge 
                key={tag}
                className="bg-green-500/20 text-green-300 border-green-500/30 text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Variant Summary Badge (if multi-variant) */}
        {hasVariants && variantSummary && variantSummary.count > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-2 py-1">
              {variantSummary.count} protein option{variantSummary.count !== 1 ? 's' : ''}
            </Badge>
            {variantSummary.priceRange && (
              <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {variantSummary.priceRange}
              </span>
            )}
          </div>
        )}

        {/* Spacer to push price and buttons to bottom */}
        <div className="flex-1" />

        {/* Price Display - Single price with click to expand */}
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Takeaway Price
          </span>
          <Popover open={showPricePopover} onOpenChange={setShowPricePopover}>
            <PopoverTrigger asChild>
              <button
                className="text-xl font-bold transition-colors hover:opacity-80"
                style={{ color: 'rgba(255, 255, 255, 0.95)' }}
              >
                {priceDisplayTakeaway.formattedPrice}
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-72 p-3 border shadow-xl"
              style={{
                backgroundColor: 'rgba(15, 15, 15, 0.98)',
                borderColor: 'rgba(124, 93, 250, 0.4)'
              }}
              align="end"
            >
              <div className="space-y-2">
                <h4 
                  className="font-semibold text-sm border-b pb-2"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.95)',
                    borderColor: 'rgba(124, 93, 250, 0.3)'
                  }}
                >
                  All Channel Prices
                </h4>
                <div className="space-y-2">
                  {/* Dine-in */}
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'rgba(124, 93, 250, 0.1)' }}>
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4" style={{ color: colors.brand.purple }} />
                      <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Dine-in</span>
                    </div>
                    <span className="font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                      {priceDisplayDineIn.formattedPrice}
                    </span>
                  </div>
                  
                  {/* Takeaway */}
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'rgba(124, 93, 250, 0.1)' }}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" style={{ color: colors.brand.purple }} />
                      <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Takeaway</span>
                    </div>
                    <span className="font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                      {priceDisplayTakeaway.formattedPrice}
                    </span>
                  </div>
                  
                  {/* Delivery */}
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'rgba(124, 93, 250, 0.1)' }}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" style={{ color: colors.brand.purple }} />
                      <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Delivery</span>
                    </div>
                    <span className="font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                      {priceDisplayDelivery.formattedPrice}
                    </span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ACTION BUTTONS - Two-row layout */}
        <div className="space-y-2 mt-3">
          {/* Row 1: Toggle Active Button (Full Width) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleActiveStatus}
                  disabled={isTogglingActive}
                  className={cn(
                    "w-full py-2.5 rounded-lg font-semibold transition-all duration-200 text-sm",
                    item.active 
                      ? "text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                      : "text-slate-500 hover:bg-slate-500/20 border border-slate-500/30"
                  )}
                  style={{
                    backgroundColor: item.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)'
                  }}
                >
                  {isTogglingActive ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {item.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.active ? 'Deactivate' : 'Activate'} item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Row 2: Edit, Delete, Info Buttons (3 Columns) */}
          <div className="grid grid-cols-3 gap-2">
            {/* Edit Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="w-full py-2.5 rounded-lg font-semibold border transition-all duration-200 text-sm"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      color: 'rgba(96, 165, 250, 0.9)'
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit item details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Delete Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                    className="w-full py-2.5 rounded-lg font-semibold border transition-all duration-200 text-sm"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      color: 'rgba(248, 113, 113, 0.9)'
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete item</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Info Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full py-2.5 rounded-lg font-semibold border transition-all duration-200 text-sm"
                    style={{
                      backgroundColor: 'rgba(100, 116, 139, 0.1)',
                      borderColor: 'rgba(100, 116, 139, 0.3)',
                      color: 'rgba(148, 163, 184, 0.9)'
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Info className="h-4 w-4" />
                      Info
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">{item.name}</p>
                    {description && (
                      <p className="text-xs text-gray-300">{description}</p>
                    )}
                    {item.cooking_time && (
                      <p className="text-xs text-gray-300">Cooking time: {item.cooking_time} mins</p>
                    )}
                    {hasVariants && (
                      <div className="border-t border-gray-600 pt-2">
                        <p className="font-medium text-xs text-gray-300 mb-1">Available Proteins:</p>
                        <div className="space-y-1">
                          {variantsList.slice(0, 3).map((variant) => {
                            const proteinName = resolveProteinName(variant.protein_type_id);
                            return (
                              <p key={variant.id} className="text-xs text-gray-400">
                                • {proteinName || 'Unknown'}
                              </p>
                            );
                          })}
                          {variantsList.length > 3 && (
                            <p className="text-xs text-purple-400">+{variantsList.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CompactMenuItemCard;
