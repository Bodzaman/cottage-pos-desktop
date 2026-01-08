import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OrderItem, MenuItem, ItemVariant, ModifierSelection } from 'utils/menuTypes';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { useCustomizeOrchestrator } from 'components/CustomizeOrchestrator';
import { InfoButton } from './InfoButton';
import { AllergenDisplay } from './AllergenDisplay';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { cn } from '@/lib/utils';
import { LazyImage } from 'components/LazyImage';
import { OptimizedImage } from 'components/OptimizedImage';
import { POSVariantSelector } from './POSVariantSelector';

interface POSMenuCardProps {
  item: MenuItem;
  onAddToOrder: (orderItem: OrderItem) => void;
  onCustomizeItem?: (orderItem: OrderItem) => void;
  itemVariants?: ItemVariant[];
  viewMode?: 'card' | 'list';
  orderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
}

type CustomizationOption = {
  id: string;
  name: string;
  price: number | null;
  description?: string | null;
  customization_group?: string;
  is_exclusive?: boolean;
};

type CustomizationSelection = {
  id: string;
  customization_id: string;
  name: string;
  price_adjustment: number;
  group?: string;
};

/**
 * Clean, uniform POS Menu Card with dynamic height layout
 * All cards maintain 320px height with structured sections
 */
export function POSMenuCard({
  item,
  onAddToOrder,
  onCustomizeItem,
  itemVariants = [],
  viewMode = 'card',
  orderType = 'COLLECTION'
}: POSMenuCardProps) {
  const isDev = import.meta.env.DEV;
  // Get variants from realtimeMenuStore with null safety
  const { itemVariants: storeVariants, proteinTypes, isLoading } = useRealtimeMenuStore();
  
  // 🔍 DEBUG: Log proteinTypes availability
  console.log('🧬 [POSMenuCard] ProteinTypes Store:', {
    itemName: item.name,
    proteinTypesCount: proteinTypes?.length || 0,
    proteinTypes: proteinTypes?.map(pt => ({ id: pt.id, name: pt.name }))
  });
  
  // ✅ FIX: Check array length, not truthiness - empty array [] is truthy but has no items
  const variants = (itemVariants && itemVariants.length > 0) 
    ? itemVariants 
    : storeVariants?.filter(variant => variant.menu_item_id === item.id) || [];

  // Use CustomizeOrchestrator instead of individual modal state
  const orchestrator = useCustomizeOrchestrator();
  
  // ✅ NEW: State for StaffVariantSelector modal (Phase 4.6)
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  
  // Check if item is in skeleton state (during fast bundle loading)
  const isSkeletonState = (item as any)._isSkeletonState === true;
  
  // Determine display name based on context - use kitchen_display_name for kitchen displays
  // POSDesktop is considered kitchen-facing, so use kitchen_display_name when available
  const displayName = item.kitchen_display_name || item.name;

  // Component state
  const [showOtherProtein, setShowOtherProtein] = useState(false);

  // Utility function to generate unique order item ID
  const generateOrderItemId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Refs for dropdown positioning
  const chooseButtonRef = useRef<HTMLButtonElement>(null);

  // Constants
  const CUSTOMIZE_BUTTON_HEIGHT = 36;
  const CARD_HEIGHT = 320;
  const LIST_HEIGHT = 140;
  const height = viewMode === 'card' ? CARD_HEIGHT : LIST_HEIGHT;
  
  // Add missing layout constants
  const TITLE_HEIGHT = 50; // Title section height
  const VARIANT_ROW_HEIGHT = 40; // Height per variant row
  const VARIANTS_HEIGHT = CARD_HEIGHT - TITLE_HEIGHT - CUSTOMIZE_BUTTON_HEIGHT; // Available space for variants
  const MAX_VISIBLE_VARIANTS = Math.floor(VARIANTS_HEIGHT / VARIANT_ROW_HEIGHT);
  const SHOULD_SCROLL = variants.length > MAX_VISIBLE_VARIANTS;
  
  const placeholderImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';

  // Helper functions
  const formatPrice = (price: number): string => {
    return `£${price.toFixed(2)}`;
  };

  const getItemPrice = (): number => {
    return item.price || 0;
  };

  const getVariantPrice = (variant: ItemVariant): number => {
    switch (orderType) {
      case "DINE-IN":
        return variant.price_dine_in || variant.price;
      case "DELIVERY":
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

  // ✅ NEW: Handler for variant selection → customization modal
  const handleVariantSelectedForCustomization = (orderItem: OrderItem) => {
    console.log('🔧 POSMenuCard: Variant selected, opening customization modal:', orderItem);
    
    // Find the variant by variant_id from the orderItem
    const variant = variants.find(v => v.id === orderItem.variant_id);
    
    // Set the selected variant and open customization modal
    setSelectedVariantForCustomization(variant || null);
    setIsVariantSelectorOpen(false);
    setIsCustomizationModalOpen(true);
  };

  // ✅ NEW: Handler for customization confirmation
  const handleCustomizationConfirm = (
    item: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    console.log('🔧 POSMenuCard: Customization confirmed:', { quantity, variant, customizations, notes });
    
    if (!variant) return;
    
    const basePrice = getVariantPrice(variant);
    const variantName = getVariantDisplayName(variant);
    
    const orderItem: OrderItem = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: item.id,
      variant_id: variant.id,
      category_id: item.category_id,
      category_name: '', // Will be populated
      name: variantName,
      variantName: variantName,
      quantity: quantity,
      price: basePrice,
      customizations: customizations,
      notes: notes,
      image_url: variant.image_url || item.image_url || null,
      sent_to_kitchen: false
    };
    
    onAddToOrder(orderItem);
    setIsCustomizationModalOpen(false);
    setSelectedVariantForCustomization(null);
  };

  // Get all three prices for variant or item
  const getThreeTierPricing = (variant?: ItemVariant) => {
    if (variant) {
      return {
        dineIn: variant.price_dine_in || variant.price,
        takeaway: variant.price,
        delivery: variant.price_delivery || variant.price
      };
    } else {
      // For single items, use the base price for all tiers if specific pricing not available
      const basePrice = getItemPrice();
      return {
        dineIn: basePrice,
        takeaway: basePrice,
        delivery: basePrice
      };
    }
  };

  // Helper to render compact price grid
  const renderCompactPriceGrid = (pricing: { dineIn: number, takeaway: number, delivery: number }) => {
    return (
      <div className="grid grid-cols-3 gap-1 text-center text-xs">
        {/* Dine-in */}
        <div className="flex flex-col">
          <span className="text-[#7C5DFA] font-medium text-[10px] uppercase tracking-wide mb-0.5">Dine-in</span>
          <span className="text-white font-bold text-xs">£{pricing.dineIn.toFixed(2)}</span>
        </div>
        {/* Takeaway */}
        <div className="flex flex-col">
          <span className="text-[#F59E0B] font-medium text-[10px] uppercase tracking-wide mb-0.5">Takeaway</span>
          <span className="text-white font-bold text-xs">£{pricing.takeaway.toFixed(2)}</span>
        </div>
        {/* Delivery */}
        <div className="flex flex-col">
          <span className="text-[#3B82F6] font-medium text-[10px] uppercase tracking-wide mb-0.5">Delivery</span>
          <span className="text-white font-bold text-xs">£{pricing.delivery.toFixed(2)}</span>
        </div>
      </div>
    );
  };

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

  // Early return for loading state
  if (isLoading || !itemVariants) {
    return (
      <div className={`bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-4 ${viewMode === 'card' ? 'h-[250px]' : 'h-20'} flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">Loading menu item...</div>
      </div>
    );
  }

  // Handle customization - use CustomizeOrchestrator instead of direct modal management
  const handleCustomize = (selectedVariant?: ItemVariant) => {
    console.log('🔧 POSMenuCard.handleCustomize called', { item: item.name, selectedVariant });
    
    // ✅ FIX: Create OrderItem with full variant context BEFORE passing to orchestrator
    if (selectedVariant) {
      // Variant provided - create OrderItem with full context
      const basePrice = getVariantPrice(selectedVariant);
      
      // Use same variant name resolution as handleAddToOrder
      const proteinType = proteinTypes.find(pt => pt.id === selectedVariant.protein_type_id);
      const variantName = selectedVariant.variant_name || 
                         selectedVariant.name || 
                         (proteinType ? `${proteinType.name} ${item.name}` : item.name);
      
      const orderItem: OrderItem = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        menu_item_id: item.id,
        category_id: item.category_id,
        category_name: '', // Will be populated by orchestrator
        name: variantName,
        variantName: variantName,
        variant_id: selectedVariant.id,
        image_url: selectedVariant.image_url || item.image_url, // ✅ Preserve image
        price: basePrice,
        quantity: 1,
        notes: '',
        modifiers: [],
        customizations: []
      };
      
      console.log('🔧 Created OrderItem with full context:', {
        variant_id: orderItem.variant_id,
        variantName: orderItem.variantName,
        image_url: orderItem.image_url,
        price: orderItem.price
      });
      
      orchestrator.customize({
        source: orderItem, // ✅ Pass complete OrderItem
        context: 'menu',
        onSave: (customizedItem: OrderItem) => {
          console.log('💾 POSMenuCard customize onSave:', customizedItem);
          onAddToOrder(customizedItem);
        }
      });
    } else {
      // No variant provided - determine next action
      if (variants.length === 1) {
        // Auto-select single variant
        console.log('🔧 Auto-selecting single variant for customization');
        return handleCustomize(variants[0]);
      } else if (variants.length > 1) {
        // Show variant selector first
        console.log('🔧 Multiple variants - showing selector');
        setIsVariantSelectorOpen(true);
        setPendingAction('customize');
      } else {
        // No variants - use base item
        console.log('🔧 No variants - using base item');
        orchestrator.customize({
          source: item,
          context: 'menu',
          onSave: (customizedItem: OrderItem) => {
            console.log('💾 POSMenuCard customize onSave:', customizedItem);
            onAddToOrder(customizedItem);
          }
        });
      }
    }
  };

  // Handle adding item to order
  const handleAddToOrder = (selectedVariant?: ItemVariant) => {
    // This function should ALWAYS add to order directly, never customize
    // Only the customize button (🔧) should call handleCustomize
    
    let basePrice: number;
    let variantId: string | null;
    let variantName: string;

    if (selectedVariant) {
      basePrice = getVariantPrice(selectedVariant);
      variantId = selectedVariant.id;
      
      // ✅ FIX: Prioritize variant_name (database-generated with prefix) over name field
      // variant_name contains the properly formatted name like "CHICKEN SHASHLICK BHUNA"
      // name is a custom override that may or may not have the prefix
      const proteinType = proteinTypes.find(pt => pt.id === selectedVariant.protein_type_id);
      
      // Priority order:
      // 1. variant_name (Generated Name from database with prefix pattern)
      // 2. name (custom override)
      // 3. Construct from protein + base item
      // 4. Protein name only
      // 5. Fallback to 'Standard'
      variantName = selectedVariant.variant_name 
        || selectedVariant.name
        || (proteinType?.name && item.name ? `${proteinType.name} ${item.name}`.trim() : null)
        || proteinType?.name 
        || selectedVariant.protein_type_name 
        || 'Standard';
      
      console.log('🔍 VARIANT NAME RESOLUTION:', {
        selectedVariant,
        variantDbGeneratedName: selectedVariant.variant_name,
        variantCustomName: selectedVariant.name,
        proteinTypeName: proteinType?.name,
        baseItemName: item.name,
        RESOLVED_variantName: variantName
      });
    } else if (variants.length === 0) {
      // Item without variants - use null for variant_id as backend expects UUID or null
      basePrice = getItemPrice();
      variantId = null; // ✅ FIXED: Set to null instead of 'default'
      variantName = 'Standard';
    } else {
      console.error('No variant found for item with variants');
      return;
    }

    const finalName = selectedVariant ? variantName : item.name;
    
    console.log('📝 NAME ASSIGNMENT:', {
      hasSelectedVariant: !!selectedVariant,
      variantName,
      itemBaseName: item.name,
      FINAL_NAME_ASSIGNED: finalName
    });

    const orderItem: OrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menu_item_id: item.id,
      variant_id: variantId,
      name: finalName, // ✅ FIX: Use variant protein name when variant is selected
      variantName,
      quantity: 1,
      price: basePrice,
      notes: undefined,
      protein_type: selectedVariant?.protein_type_name,
      image_url: selectedVariant?.image_url || item.image_url, // ✅ FIX: Prioritize variant image, fallback to parent
      modifiers: [],
      customizations: undefined,
      // Add Set Meal identification
      item_type: (item as any).item_type || 'menu_item'
    };

    console.log('🛒 POSMenuCard adding to order:', {
      itemName: item.name,
      itemType: (item as any).item_type,
      isSetMeal: (item as any).item_type === 'set_meal',
      basePrice,
      orderItem
    });

    // Always call onAddToOrder to add item directly to order
    onAddToOrder(orderItem);
  };

  // Render spice level indicators
  const renderSpiceLevel = (): JSX.Element => {
    const spiceLevel = item.default_spice_level || 0;
    
    if (!spiceLevel || spiceLevel === 0) {
      return <div></div>;
    }
    
    const peppers = Array(spiceLevel).fill('🌶️').join('');
    
    return (
      <div className="flex items-center space-x-1 mt-1">
        <span className="text-red-500 text-sm">{peppers}</span>
      </div>
    );
  };

  // Render list view
  if (viewMode === 'list') {
    return (
      <>
        {/* Horizontal List Layout */}
        <div
          className="text-left w-full transition-all duration-300 rounded-lg overflow-hidden flex items-center group relative focus-within:ring-2 focus-within:ring-[#7C5DFA] focus-within:ring-offset-2 focus-within:ring-offset-black h-20 p-3 gap-4"
          style={{
            background: `linear-gradient(145deg, ${QSAITheme.background.panel} 0%, ${QSAITheme.background.card} 100%)`,
            backdropFilter: 'blur(12px)',
            borderRadius: '0.75rem',
            border: `1px solid ${QSAITheme.border.light}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Small thumbnail */}
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-900/50 flex-shrink-0">
            {isSkeletonState || !item.image_url ? (
              /* Skeleton loader for image */
              <div className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-600 animate-pulse" />
            ) : (
              <OptimizedImage 
                image_variants={item.image_variants}
                alt={item.name}
                preset="thumbnail"
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
            )}
          </div>
          
          {/* Content area - flexible */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="text-white text-sm font-semibold truncate cursor-pointer hover:text-[#7C5DFA] transition-colors flex-1" 
                title={variants.length > 0 ? `${item.name} - Click to choose variant` : item.name}
                onClick={() => {
                  if (variants.length > 0) {
                    // For items with variants, open variant selection instead of adding default
                    setShowDropdown(true);
                  } else {
                    // Add single item
                    handleAddToOrder();
                  }
                }}
              >
                {item.name}
              </h3>
              
              {/* Info button for list view */}
              <InfoButton 
                item={item} 
                size="sm" 
                className="" 
              />
            </div>
            
            {(item.description || item.menu_item_description || item.long_description) && (
              <p className="text-[#BBC3E1] text-xs line-clamp-2 leading-relaxed">
                {item.description || item.menu_item_description || item.long_description}
              </p>
            )}
            
            {/* Add allergen display for list view */}
            <div className="mt-1">
              <AllergenDisplay 
                allergens={item.allergens || []}
                allergenNotes={item.allergen_warnings || item.allergen_notes}
                compact={true}
                maxVisible={3}
              />
            </div>
          </div>
          
          {/* Variants/Price section */}
          <div className="flex items-center gap-3">
            {variants.length > 0 ? (
              <div className="text-xs text-[#BBC3E1]">
                {variants.length} option{variants.length > 1 ? 's' : ''}
              </div>
            ) : (
              <div className="text-sm text-white font-semibold">
                {formatPrice(getItemPrice())}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Match card view pattern: different CTAs for variants vs non-variants */}
            {variants.length === 0 ? (
              // Items WITHOUT variants: Show Add button (quick add)
              <button
                className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-md shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #7C5DFA 0%, #9580FF 100%)',
                  border: '1px solid rgba(124, 93, 250, 0.3)'
                }}
                onClick={() => handleAddToOrder()}
                title="Add item to order"
              >
                Add
              </button>
            ) : (
              // Items WITH variants: Show Choose button (opens StaffVariantSelector)
              <button
                ref={chooseButtonRef}
                className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 rounded-md shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #7C5DFA 0%, #9580FF 100%)',
                  border: '1px solid rgba(124, 93, 250, 0.3)'
                }}
                onClick={() => {
                  console.log('🔧 Choose button clicked in list view:', {
                    itemName: item.name,
                    viewMode,
                    variantsLength: variants.length
                  });
                  setIsVariantSelectorOpen(true);
                }}
                title="Choose variant and customize"
              >
                Choose · {variants.length} option{variants.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
        
      </>
    );
  }

  return (
    <>
      {/* Fixed Height Card Container */}
      <div
        className={cn(
          "bg-[#1A1A1A] rounded-lg border border-[rgba(124,93,250,0.2)] overflow-hidden group hover:border-[rgba(124,93,250,0.4)] transition-all duration-300",
          "flex flex-col",
          viewMode === 'list' ? 'flex-row h-20' : ''
        )}
        style={viewMode === 'card' ? { height: `${CARD_HEIGHT}px` } : undefined}
      >
        
        {/* Fixed Title Section - Enhanced with gradient text and bigger sizing */}
        <div 
          className="px-4 py-4 flex-shrink-0 bg-[#1A1A1A] border-b border-gray-700/50" 
          style={{ height: `${TITLE_HEIGHT}px` }}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Enhanced title with QSAI gradient effect and larger size */}
              <h3 
                className="font-bold text-lg leading-tight truncate text-white cursor-pointer hover:text-[#7C5DFA] transition-colors"
                onClick={() => {
                  if (variants.length > 0) {
                    // Scroll to variants
                    const variantsSection = document.querySelector('.background-image-section');
                    variantsSection?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    handleAddToOrder();
                  }
                }}
                title={variants.length > 0 ? `${displayName} - Click to view variants` : `${displayName} - Click to add`}
              >
                {displayName}
              </h3>
            </div>
            
            {/* Info button */}
            <InfoButton 
              item={item} 
              size="md" 
              className="" 
            />
          </div>
          
          {/* Add allergen display to card view title section */}
          <div className="mt-2">
            <AllergenDisplay 
              allergens={item.allergens || []}
              allergenNotes={item.allergen_warnings || item.allergen_notes}
              compact={true}
              maxVisible={4}
            />
          </div>
        </div>
        
        {/* Variants section with proper scrolling functionality */}
        <div 
          className={cn(
            "px-3 flex-1 relative",
            "background-image-section" // Add class for all items now
          )}
          style={{ 
            height: `${VARIANTS_HEIGHT}px`,
            maxHeight: `${VARIANTS_HEIGHT}px`
          }}
        >
          {/* Background image using LazyImage */}
          {!isSkeletonState && item.image_url && (
            <LazyImage 
              src={item.image_url}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover rounded-md"
              placeholder={
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse rounded-md" />
              }
              onError={() => {
                console.log(`Failed to load background image for ${item.name}`);
              }}
            />
          )}
          
          {/* Show skeleton loader during bundle loading OR when no image */}
          {(isSkeletonState || !item.image_url) && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse rounded-md" />
          )}
          
          {/* Dark overlay - different opacity for single vs variation items */}
          {!isSkeletonState && (
            <div 
              className="absolute inset-0 bg-black rounded-md z-10"
              style={{
                backgroundColor: variants.length === 0 
                  ? 'rgba(0, 0, 0, 0.65)' // 65% opacity for single items
                  : 'rgba(0, 0, 0, 0.75)'  // 75% opacity for variation items (more text)
              }}
            />
          )}
          
          <div 
            className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 relative z-10"
            style={{
              // Ensure proper scrolling area
              overflowY: 'auto',
              scrollBehavior: 'smooth'
            }}
          >
            <div className="space-y-1">
              {isSkeletonState ? (
                /* Skeleton content during bundle loading */
                <div className="space-y-2 p-2">
                  <div className="h-4 bg-gray-600 rounded animate-pulse" />
                  <div className="h-3 bg-gray-600 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-600 rounded animate-pulse w-1/2" />
                  <div className="mt-4 h-8 bg-gray-600 rounded animate-pulse" />
                </div>
              ) : variants.length === 0 ? (
                // Single item display matching variation card format
                <div className="space-y-1 relative z-10">
                  {/* Check if this is a Set Meal and show component dishes */}
                  {(item as any).item_type === 'set_meal' && (item as any).set_meal_data?.items ? (
                    // Set Meal component dishes display
                    <div className="space-y-1">
                      <div className="p-2 border-b border-gray-600/30 mb-2">
                        <span className="text-gray-300 text-sm font-medium">Includes:</span>
                      </div>
                      {(item as any).set_meal_data.items.map((setMealItem: any, index: number) => (
                        <div 
                          key={`setmeal-item-${item.id}-${index}`}
                          className="grid grid-cols-[auto_1fr_auto] gap-2 items-center p-1.5 rounded bg-black/20"
                        >
                          <span className="text-[#7C5DFA] text-xs font-bold w-6 text-center">
                            {setMealItem.quantity}×
                          </span>
                          <span className="text-white text-sm">
                            {setMealItem.menu_item_name || 'Menu Item'}
                          </span>
                          <span className="text-gray-300 text-xs">
                            £{(setMealItem.item_price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {/* Set Meal pricing summary */}
                      <div className="mt-3 p-2 border-t border-gray-600/30">
                        <div 
                          className="grid grid-cols-[1fr_auto] gap-3 items-center p-2 rounded hover:bg-[#7C5DFA]/20 transition-all duration-200 cursor-pointer group"
                          onClick={() => handleAddToOrder()}
                        >
                          <span className="text-white font-semibold group-hover:text-purple-200 transition-colors duration-200">
                            Complete Set Meal
                          </span>
                          <span className="text-white font-bold text-right">
                            £{(item.price || 0).toFixed(2)}
                          </span>
                        </div>
                        {(item as any).set_meal_data?.savings > 0 && (
                          <div className="text-center mt-1">
                            <span className="text-green-400 text-xs">
                              Save £{((item as any).set_meal_data.savings || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Regular single item display
                    <div 
                      className="grid grid-cols-[1fr_auto] gap-3 items-center p-2 rounded hover:bg-black/20 transition-all duration-200 group"
                      onClick={() => handleAddToOrder()}
                    >
                      <span className="text-white font-medium group-hover:text-purple-200 transition-colors duration-200">
                        {displayName}
                      </span>
                      <span className="text-white font-bold text-right">
                        £{(item.price || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                // Multiple variants display
                <div className="space-y-1 relative z-10">
                  {variants.map((variant, index) => {
                    const variantPrice = getVariantPrice(variant);
                    const variantName = getVariantDisplayName(variant);
                    
                    return (
                      <div 
                        key={`variant-${variant.id}-${index}`}
                        className="flex items-center gap-2 p-2 rounded hover:bg-black/20 transition-all duration-200 group"
                      >
                        {/* Customize Button */}
                        <button
                          className="text-[#7C5DFA] hover:text-[#9580FF] transition-colors duration-200 opacity-70 hover:opacity-100 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomize(variant);
                          }}
                          title="Customize this variant"
                        >
                          🔧
                        </button>
                        
                        {/* Variant Name, Price and Food Details - Clickable for quick add */}
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleAddToOrder(variant)}
                        >
                          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                            <div className="space-y-1">
                              <span className="text-white font-medium group-hover:text-purple-200 transition-colors duration-200 block">
                                {variantName}
                              </span>
                              
                              {/* Variant-specific food details */}
                              <div className="flex items-center gap-2 text-xs">
                                {/* Variant-specific spice level */}
                                {variant.spice_level && variant.spice_level > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-red-400">
                                      {Array(variant.spice_level).fill('🌶️').join('')}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Variant-specific allergens - compact display */}
                                {variant.allergens && variant.allergens.length > 0 && (
                                  <AllergenDisplay 
                                    allergens={variant.allergens}
                                    allergenNotes={variant.allergen_notes}
                                    compact={true}
                                    maxVisible={2}
                                    size="sm"
                                  />
                                )}
                              </div>
                            </div>
                            
                            <span className="text-white font-bold text-right">
                              £{variantPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Other option */}
                  <div 
                    className="grid grid-cols-[1fr_auto] gap-3 items-center p-2 rounded hover:bg-black/20 transition-all duration-200 cursor-pointer group"
                    onClick={() => setShowOtherProtein(true)}
                  >
                    <span className="text-gray-300 italic group-hover:text-purple-200 transition-colors duration-200">
                      Other
                    </span>
                    <span className="text-gray-300 text-right">
                      Custom
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Fixed Customise Button Section - Perfect Flush Design */}
        <div className="flex-shrink-0">
          {/* Show ADD + CUSTOMIZE buttons for items WITHOUT variations */}
          {variants.length === 0 && (
            <div className="flex items-stretch" style={{ height: `${CUSTOMIZE_BUTTON_HEIGHT + 4}px` }}>
              {/* Add Button - Takes 70% width */}
              <button
                className="flex-[7] hover:opacity-90 border-0 border-t transition-all duration-300 flex items-center justify-center gap-1 text-sm font-medium rounded-bl-lg"
                style={{ 
                  margin: 0, 
                  padding: 0,
                  lineHeight: '1',
                  background: 'linear-gradient(135deg, #7C5DFA 0%, #9580FF 100%)',
                  borderTopColor: 'rgba(124, 93, 250, 0.3)',
                  color: 'white'
                }}
                onClick={() => handleAddToOrder()}
                title="Add item to order"
              >
                Add
              </button>
              
              {/* Customize Button - Takes 30% width */}
              <button
                className="flex-[3] bg-black/25 backdrop-blur-sm border-0 border-t border-l border-white/15 text-white hover:bg-black/35 hover:border-white/25 transition-all duration-300 flex items-center justify-center gap-1 text-xs rounded-br-lg"
                style={{ 
                  margin: 0, 
                  padding: 0,
                  lineHeight: '1'
                }}
                onClick={() => handleCustomize()}
                title="Customise item"
              >
                🔧 Customise
              </button>
            </div>
          )}
          
          {/* Show Choose button for items WITH variations */}
          {variants.length > 0 && (
            <button
              className="w-full hover:opacity-90 border-0 border-t transition-all duration-300 flex items-center justify-center gap-1 text-sm font-medium rounded-b-lg"
              style={{ 
                height: `${CUSTOMIZE_BUTTON_HEIGHT + 4}px`,
                margin: 0, 
                padding: 0,
                lineHeight: '1',
                background: 'linear-gradient(135deg, #7C5DFA 0%, #9580FF 100%)',
                borderTopColor: 'rgba(124, 93, 250, 0.3)',
                color: 'white'
              }}
              onClick={() => setIsVariantSelectorOpen(true)}
              title="Choose variant and customize"
            >
              Choose · {variants.length} options
            </button>
          )}
        </div>
      </div>

      <POSVariantSelector
        menuItem={item}
        isOpen={isVariantSelectorOpen}
        onClose={() => setIsVariantSelectorOpen(false)}
        onAddToOrder={handleVariantSelected}
        orderType={orderType}
      />
      
    </>
  );
}
