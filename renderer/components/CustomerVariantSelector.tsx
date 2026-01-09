import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MenuItem, ItemVariant, ProteinType } from '../utils/menuTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { convertSpiceIndicatorsToEmoji } from '../utils/spiceLevelUtils';
import { Minus, Plus, Info, Star, Heart, Sliders } from 'lucide-react';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { cn } from '../utils/cn';
import { PremiumMenuCard } from './PremiumMenuCard';
import { PremiumTheme } from '../utils/premiumTheme';
import { FavoriteHeartButton } from './FavoriteHeartButton';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CustomerCustomizationModal } from './CustomerCustomizationModal';
import { SelectedCustomization } from '../utils/menuTypes';
import { LazyImage } from './LazyImage';
import { OptimizedImage } from './OptimizedImage';
import { Badge } from '@/components/ui/badge';

// NEW: Define state for quantities of each variant
interface VariantQuantities {
  [variantId: string]: number;
}

interface Props {
  item: MenuItem | null;
  itemVariants: ItemVariant[];
  isOpen: boolean;
  onClose: () => void;
  addToCart: (item: MenuItem, quantity: number, variant: ItemVariant, customizations?: SelectedCustomization[], notes?: string) => void;
  mode?: "delivery" | "collection";
  initialVariant?: ItemVariant | null; // NEW: Optional pre-selected variant
  // ✅ NEW: Edit mode props
  editMode?: boolean;
  editingCartItemId?: string | null;
  editingCartItem?: any;
}

// ✅ NEW: Helper function to check if variant/item has any food details configured
const hasAnyFoodDetails = (target: MenuItem | ItemVariant): boolean => {
  return (
    (target.spice_level && target.spice_level > 0) ||
    (target.allergens && target.allergens.length > 0) ||
    !!(target.allergen_notes?.trim()) ||
    target.is_vegetarian === true ||
    target.is_vegan === true ||
    target.is_gluten_free === true ||
    target.is_halal === true ||
    target.is_dairy_free === true ||
    target.is_nut_free === true
  );
};

export function CustomerVariantSelector({ 
  item, 
  itemVariants,
  isOpen, 
  onClose, 
  addToCart, 
  mode = "collection",
  initialVariant = null, // NEW: Destructure the new prop
  // ✅ NEW: Destructure edit mode props with defaults
  editMode = false,
  editingCartItemId = null,
  editingCartItem = null
}: Props) {
  // Use the realtime menu store instead of direct Supabase calls
  const { proteinTypes } = useRealtimeMenuStore();

  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  // NEW: State to hold quantities for each variant
  const [variantQuantities, setVariantQuantities] = useState<VariantQuantities>({});
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);

  useEffect(() => {
    if (!item) return;

    // Filter variants for the selected menu item from the passed prop
    const filteredVariants = itemVariants?.filter(variant => variant.menu_item_id === item.id) || [];
    setVariants(filteredVariants);

    // Initialize variant quantities to 1 for all variants
    const initialQuantities: VariantQuantities = {};
    filteredVariants.forEach(v => {
      initialQuantities[v.id] = 1;
    });
    setVariantQuantities(initialQuantities);

    // ✅ NEW: Pre-fill state when in edit mode
    if (editMode && editingCartItem) {
      // Set the variant being edited
      const variantToEdit = filteredVariants.find(v => v.id === editingCartItem.variant?.id);
      if (variantToEdit) {
        setSelectedVariant(variantToEdit);
        setVariantQuantities(prev => ({
          ...prev,
          [variantToEdit.id]: editingCartItem.quantity || 1
        }));
        
        // ✅ NEW: Auto-open customization modal for single-variant items in edit mode
        // This ensures users see the full customization UI when editing
        if (filteredVariants.length === 1) {
          // Close this dialog and open customization modal
          onClose();
          setIsCustomizationModalOpen(true);
        }
      }
      
      // Set quantity and notes
      setQuantity(editingCartItem.quantity || 1);
      setNotes(editingCartItem.notes || '');
    } else if (initialVariant && filteredVariants.find(v => v.id === initialVariant.id)) {
      // NEW: Set initial variant if provided (existing logic)
      setSelectedVariant(initialVariant);
    } else {
      // ✅ FIX: Auto-select first variant (sorted by price) when not in edit mode
      // This ensures reactive hero image works for customer browsing
      if (filteredVariants.length > 0) {
        const sortedByPrice = [...filteredVariants].sort((a, b) => {
          const priceA = mode === 'delivery' ? (a.price_delivery ?? a.price) : a.price;
          const priceB = mode === 'delivery' ? (b.price_delivery ?? b.price) : b.price;
          return priceA - priceB;
        });
        setSelectedVariant(sortedByPrice[0]);
      }
    }
  }, [item, itemVariants, proteinTypes, initialVariant, editMode, editingCartItem, editingCartItemId]);


  // Price calculation helpers - these need to be robust
  const getVariantPrice = (variant: ItemVariant): number => {
    if (mode === "delivery") {
      return variant.price_delivery || variant.price || 0;
    } else {
      // Collection mode - use base price (which is takeaway price)
      return variant.price || 0;
    }
  };
  
  const getItemPrice = (): number => {
    if (!item) return 0;
    if (mode === "delivery") {
      return item.price_delivery || item.price_takeaway || item.price || 0;
    } else {
      // Collection mode
      return item.price_takeaway || item.price || 0;
    }
  };

  const getDisplayImage = (variant?: ItemVariant) => {
    // ✅ VARIANT INHERITANCE: Use display_image_url (resolved by backend)
    // Falls back to item image if variant has no custom/inherited image
    if (variant?.display_image_url) {
      return variant.display_image_url;
    }
    if (item?.image_url) {
      return item.image_url;
    }
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  }

  // ✅ NEW: Reactive image display for selected variant
  const displayedVariantImage = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.display_image_url 
        || selectedVariant.image_url 
        || item?.image_url 
        || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
    }
    return item?.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
  }, [selectedVariant, item]);

  // ✅ NEW: Compute displayed hero image reactively
  const displayedHeroImage = useMemo(() => {
    const computedImage = selectedVariant
      ? (selectedVariant.display_image_url 
        || selectedVariant.image_url 
        || item?.image_url 
        || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80')
      : (item?.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80');
    
    return computedImage;
  }, [selectedVariant, item]);

  // ✅ CANONICAL HELPER: Single source of truth for variant display names
  // This ensures consistency across all add-to-cart operations
  const getVariantDisplayName = (variant: ItemVariant, fallbackItemName: string): string => {
    return variant.variant_name || variant.name || fallbackItemName;
  };
  
  // 🎯 Helper: Find cheapest variant
  const getCheapestVariant = () => {
    if (variants.length === 0) return null;
    return variants.reduce((cheapest, variant) => {
      const variantPrice = getVariantPrice(variant);
      const cheapestPrice = getVariantPrice(cheapest);
      return variantPrice < cheapestPrice ? variant : cheapest;
    });
  };
  
  // 🎯 Helper: Calculate price range for display
  const getPriceRangeDisplay = () => {
    if (variants.length === 0) return '';
    const prices = variants.map(v => getVariantPrice(v));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `£${minPrice.toFixed(2)}`;
    }
    return `£${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`;
  };

  // Handlers
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  // Handle quantity change for specific variant
  const handleVariantQuantityChange = (variantId: string, delta: number) => {
    setVariantQuantities(prev => {
      const currentQty = prev[variantId] || 1;
      const newQty = Math.max(1, Math.min(20, currentQty + delta));
      return { ...prev, [variantId]: newQty };
    });
  };

  // Handle variant selection from grid
  const handleVariantSelect = (variant: ItemVariant) => {
    setSelectedVariant(variant);
  };

  const handleCustomizeClick = (variant: ItemVariant) => {
    setSelectedVariant(variant);
    // Close the parent Dialog FIRST to ensure only one Dialog is open at a time
    onClose();
    // Then open the customization modal
    setIsCustomizationModalOpen(true);
  };

  // NEW: Handle add to cart with customizations from modal
  const handleAddToCartWithCustomizations = (
    item: MenuItem,
    quantity: number,
    variant: ItemVariant,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    if (!variant) return;
    
    // ✅ Convert customizations to cart format and pass to addToCart
    const cartCustomizations = customizations?.map(c => ({
      id: c.id,
      name: c.name,
      price: c.price,
      group: c.group
    })) || [];
    
    console.log('✅ Adding from CustomerVariantSelector:', {
      item: item.name,
      qty: quantity,
      customizations: cartCustomizations,
      notes: notes || ''
    });
    
    // ✅ NEW SIGNATURE: (item, quantity, variant, customizations, notes)
    addToCart(item, quantity, variant, cartCustomizations, notes || '');
    
    // Use helper for toast display name
    const displayName = getVariantDisplayName(variant, item.name);
    toast.success(`${displayName} added to cart!`);
    
    // Only close the customization modal (parent Dialog already closed)
    setIsCustomizationModalOpen(false);
  };

  // Handle customization complete (multi-variant items with customization)
  const handleCustomizationComplete = async (
    variant: any,
    customizations: any[],
    quantity: number,
    notes: string
  ) => {
    // ✅ FIXED: Pass parameters in correct order (item, variant, quantity, customizations, notes)
    addToCart(item, variant, quantity, customizations, notes);
    
    // Use helper for toast display name
    const displayName = getVariantDisplayName(variant, item.name);
    toast.success(`${displayName} added to cart!`);
    
    // Only close the customization modal (parent Dialog already closed)
    setIsCustomizationModalOpen(false);
  };

  // Handle add to cart for single-variant items (no customization)
  const handleAddToCart = () => {
    if (!item) return;
    
    // For single variant items, get the first/only variant or create a default one
    const variant = variants[0];
    
    if (variant) {
      // ✅ FIXED: Pass empty array for customizations, then notes
      addToCart(item, variant, quantity, [], notes);
    } else {
      // Fallback for items with no variants
      const price = mode === 'delivery'
        ? (item.price_delivery || item.price_takeaway || item.price || 0)
        : (item.price_takeaway || item.price || 0);
      
      addToCart(item, { id: item.id, name: item.name, price }, quantity, [], notes);
    }
    
    onClose();
    toast.success(`Added ${quantity}x ${item.name} to cart`);
  };

  // Handle quick add (variant button click in multi-variant view)
  const handleQuickAddVariant = (variant: any) => {
    // ✅ FIXED: Pass empty array for customizations, then empty string for notes
    addToCart(item, variant, 1, [], '');
    
    // Use helper for toast display name
    const displayName = getVariantDisplayName(variant, item.name);
    toast.success(`${displayName} added to cart!`);
    
    onClose();
  };

  // Handle direct add to cart from variant card (without customization)
  const handleAddVariantToCart = (variant: ItemVariant) => {
    // ✅ FIXED: Pass empty array for customizations, then empty string for notes
    addToCart(item, variant, 1, [], '');
    
    // Use helper for toast display name
    const displayName = getVariantDisplayName(variant, item.name);
    toast.success(`${displayName} added to cart!`);
    
    onClose();
  };

  // State for special instructions
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Determine if the item is multi-variant based on the filtered variants
  const isMultiVariant = variants.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-2xl w-full"
          style={{ 
            backgroundColor: PremiumTheme.colors.dark[900],
            borderColor: PremiumTheme.colors.dark[700],
            boxShadow: PremiumTheme.shadows.glow.tandoori,
            zIndex: 70 // ✅ Ensure modal appears above cart drawer (z-index 60)
          }}
          aria-labelledby="variant-selector-title"
          aria-describedby="variant-selector-description"
        >
          <DialogHeader>
            <DialogTitle 
              id="variant-selector-title"
              className="text-2xl font-bold"
              style={{ color: PremiumTheme.colors.text.primary }}
            >
              {item?.name}
            </DialogTitle>
            <DialogDescription 
              id="variant-selector-description"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              {isMultiVariant && variants.length > 1 
                ? `Available in ${variants.length} options`
                : (item?.menu_item_description || 'Customize your selection.')
              }
            </DialogDescription>
          </DialogHeader>

          {/* Price Range Display - Outside DialogHeader to avoid Radix Slot ref issues */}
          {isMultiVariant && variants.length > 1 && (
            <div className="-mt-2 mb-2">
              <p 
                className="text-sm font-semibold"
                style={{ color: PremiumTheme.colors.gold[400] }}
              >
                {getPriceRangeDisplay()}
              </p>
            </div>
          )}

          {/* Variant Selection as Premium Cards */}
          {isMultiVariant && (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto p-1 rounded-lg"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${PremiumTheme.colors.royal[500]} ${PremiumTheme.colors.dark[800]}`
              }}
            >
              <h3 
                className="text-base font-semibold mb-3 px-1"
                style={{ color: PremiumTheme.colors.text.secondary }}
              >
                Choose Your Protein:
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {variants.map(itemVariant => {
                  const displayName = getVariantDisplayName(itemVariant, item.name);
                  const isSelected = selectedVariant?.id === itemVariant.id;
                  const price = mode === 'delivery' 
                    ? (itemVariant.price_delivery ?? itemVariant.price)
                    : itemVariant.price;
                  const variantQty = variantQuantities[itemVariant.id] || 1;
                  const displayImage = getDisplayImage(itemVariant);
                  const description = itemVariant.description_override || item?.menu_item_description || '';
                  
                  return (
                    <motion.div
                      key={itemVariant.id}
                      className={cn(
                        "rounded-lg border-2 transition-all overflow-hidden cursor-pointer",
                        isSelected ? "border-opacity-100" : "border-opacity-30 hover:border-opacity-60"
                      )}
                      style={{
                        background: isSelected 
                          ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[900]}40 0%, ${PremiumTheme.colors.dark[800]} 100%)`
                          : PremiumTheme.colors.dark[850],
                        borderColor: isSelected 
                          ? PremiumTheme.colors.burgundy[500]
                          : PremiumTheme.colors.dark[600]
                      }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleVariantSelect(itemVariant)}
                    >
                      {/* Horizontal Layout: Image on Left, Content on Right */}
                      <div className="flex gap-3 p-3">
                        {/* Left: Image - Compact Size */}
                        <div 
                          className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden"
                          style={{ backgroundColor: PremiumTheme.colors.dark[700] }}
                        >
                          <img
                            src={itemVariant.display_image_url || itemVariant.image_url || item?.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80'}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Right: Content */}
                        <div className="flex-1 flex flex-col">
                          {/* Header: Name + Price */}
                          <div className="flex items-start justify-between mb-2">
                            <h4 
                              className="text-base font-bold"
                              style={{ color: PremiumTheme.colors.text.primary }}
                            >
                              {displayName}
                            </h4>
                            <span 
                              className="text-lg font-bold ml-3"
                              style={{ color: PremiumTheme.colors.gold[400] }}
                            >
                              £{price.toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Description */}
                          {description && (
                            <p 
                              className="text-sm mb-4 line-clamp-2"
                              style={{ color: PremiumTheme.colors.text.muted }}
                            >
                              {description}
                            </p>
                          )}
                          
                          {/* ✅ NEW: Food Detail Badges - Conditional Rendering */}
                          {hasAnyFoodDetails(itemVariant) && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {/* Spice Level Badge */}
                              {itemVariant.spice_level && itemVariant.spice_level > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: PremiumTheme.colors.dark[800],
                                    borderColor: PremiumTheme.colors.burgundy[500],
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                >
                                  {convertSpiceIndicatorsToEmoji(itemVariant.spice_level)}
                                </Badge>
                              )}
                              
                              {/* Allergen Badges */}
                              {itemVariant.allergens && itemVariant.allergens.length > 0 && (
                                itemVariant.allergens.map((allergen, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: PremiumTheme.colors.dark[800],
                                      borderColor: PremiumTheme.colors.gold[500],
                                      color: PremiumTheme.colors.text.secondary
                                    }}
                                  >
                                    {allergen}
                                  </Badge>
                                ))
                              )}
                              
                              {/* Dietary Flag Badges */}
                              {itemVariant.is_vegetarian && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: PremiumTheme.colors.dark[800],
                                    borderColor: PremiumTheme.colors.silver[500],
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                >
                                  🌱 Vegetarian
                                </Badge>
                              )}
                              {itemVariant.is_vegan && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: PremiumTheme.colors.dark[800],
                                    borderColor: PremiumTheme.colors.silver[500],
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                >
                                  🌿 Vegan
                                </Badge>
                              )}
                              {itemVariant.is_gluten_free && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: PremiumTheme.colors.dark[800],
                                    borderColor: PremiumTheme.colors.silver[500],
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                >
                                  Gluten-Free
                                </Badge>
                              )}
                              {itemVariant.is_halal && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: PremiumTheme.colors.dark[800],
                                    borderColor: PremiumTheme.colors.silver[500],
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                >
                                  ☪️ Halal
                                </Badge>
                              )}
                              {itemVariant.is_dairy_free && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: PremiumTheme.colors.dark[800],
                                    borderColor: PremiumTheme.colors.silver[500],
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                >
                                  Dairy-Free
                                </Badge>
                              )}
                              {itemVariant.is_nut_free && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: PremiumTheme.colors.dark[800],
                                    borderColor: PremiumTheme.colors.silver[500],
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                >
                                  Nut-Free
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Footer: Quantity Controls + Action Button */}
                          <div className="mt-auto flex items-center gap-3">
                            {/* Quantity Controls */}
                            <div 
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                              style={{
                                backgroundColor: PremiumTheme.colors.dark[900],
                                borderColor: PremiumTheme.colors.dark[600]
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVariantQuantityChange(itemVariant.id, -1);
                                }}
                                disabled={variantQty <= 1}
                                className="p-1 rounded hover:bg-opacity-80 disabled:opacity-30 transition-all"
                                style={{
                                  color: PremiumTheme.colors.text.secondary
                                }}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span 
                                className="text-lg font-semibold w-8 text-center"
                                style={{ color: PremiumTheme.colors.text.primary }}
                              >
                                {variantQty}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVariantQuantityChange(itemVariant.id, 1);
                                }}
                                disabled={variantQty >= 20}
                                className="p-1 rounded hover:bg-opacity-80 disabled:opacity-30 transition-all"
                                style={{
                                  color: PremiumTheme.colors.text.secondary
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Customise & Add Button */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCustomizeClick(itemVariant);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold"
                              style={{
                                background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                                color: PremiumTheme.colors.text.primary
                              }}
                            >
                              <Sliders className="h-4 w-4" />
                              Customise & Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback for single items (original UI) */}
          <DialogFooter className="pt-6 px-2">
            {!isMultiVariant && (
               <>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                    <Button variant="outline" onClick={() => handleQuantityChange(1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleAddToCart}
                    className="flex-grow transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.royal[600]} 0%, ${PremiumTheme.colors.royal[500]} 100%)`,
                      boxShadow: PremiumTheme.shadows.glow.royal,
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    Add {quantity} to Cart — £{(getItemPrice() * quantity).toFixed(2)}{quantity > 1 && ` (£${getItemPrice().toFixed(2)} each)`}
                  </Button>
               </>
            )}
             {isMultiVariant && !selectedVariant && (
              <p className="text-sm text-center w-full" style={{ color: PremiumTheme.colors.text.muted }}>
                Select a protein option above.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Customization Modal - Rendered as sibling to avoid nesting Dialogs */}
      {selectedVariant && (
        <CustomerCustomizationModal
          item={item!}
          variant={selectedVariant}
          isOpen={isCustomizationModalOpen}
          onClose={() => setIsCustomizationModalOpen(false)}
          addToCart={handleAddToCartWithCustomizations}
          mode={mode}
          initialQuantity={variantQuantities[selectedVariant.id] || 1}
        />
      )}
    </>
  );
}
