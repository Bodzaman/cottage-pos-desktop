import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Search, UtensilsCrossed } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MenuItem, ItemVariant, Customization } from '../utils/types';
import { useRealtimeMenuStoreCompat } from '../utils/realtimeMenuStoreCompat';
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { convertSpiceIndicatorsToEmoji } from '../utils/spiceLevelUtils';

// OrderMode type for mode prop - supports both lowercase and uppercase
type OrderMode = 'delivery' | 'collection' | 'dine-in' | 'DELIVERY' | 'COLLECTION' | 'DINE-IN' | 'DINE_IN';

export interface SelectedCustomization {
  id: string;
  name: string;
  price_adjustment: number;
  price?: number;
  group?: string;
}

interface CustomerUnifiedCustomizationModalProps {
  item: MenuItem | null;
  itemVariants: ItemVariant[];
  isOpen: boolean;
  onClose: () => void;
  addToCart: (item: MenuItem, quantity: number, variant: ItemVariant, customizations?: SelectedCustomization[], notes?: string) => void;
  mode?: OrderMode;
  initialVariant?: ItemVariant | null;
  initialQuantity?: number;
  // Edit mode props
  editMode?: boolean;
  editingCartItemId?: string | null;
  editingCartItem?: any;
  initialCustomizations?: SelectedCustomization[];
  onModalClose?: () => void;
}

// Helper function to check if variant has any food details
const hasAnyFoodDetails = (target: ItemVariant): boolean => {
  return (
    (target.spice_level && Number(target.spice_level) > 0) ||
    (target.allergens && (Array.isArray(target.allergens) ? target.allergens.length > 0 : Object.keys(target.allergens).length > 0)) ||
    !!(target.allergen_notes?.trim()) ||
    target.is_vegetarian === true ||
    target.is_vegan === true ||
    target.is_gluten_free === true ||
    target.is_halal === true ||
    target.is_dairy_free === true ||
    target.is_nut_free === true
  );
};

// Helper function to get short protein label from variant
const getShortProteinLabel = (variant: ItemVariant): string => {
  // Priority 1: Use protein_type_name directly (e.g., "Chicken", "Lamb")
  if (variant.protein_type_name) return variant.protein_type_name;

  // Priority 2: Extract from variant_name (e.g., "CHICKEN TIKKA (starter)" → "Chicken")
  if (variant.variant_name) {
    const match = variant.variant_name.match(/^(\w+)/);
    if (match) {
      // Title case: "CHICKEN" → "Chicken"
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
  }

  // Priority 3: Use name field
  if (variant.name) return variant.name;

  return 'Standard';
};

export function CustomerUnifiedCustomizationModal({
  item,
  itemVariants,
  isOpen,
  onClose,
  addToCart,
  mode = 'collection',
  initialVariant = null,
  initialQuantity = 1,
  editMode = false,
  editingCartItemId = null,
  editingCartItem = null,
  initialCustomizations = [],
  onModalClose
}: CustomerUnifiedCustomizationModalProps) {
  const { customizations } = useRealtimeMenuStoreCompat({ context: 'online' });

  // Filter variants for this item
  const variants = useMemo(() => {
    if (!item) return [];
    return itemVariants?.filter(v => v.menu_item_id === item.id && v.is_active !== false) || [];
  }, [item, itemVariants]);

  const isMultiVariant = variants.length > 1;
  const hasVariants = variants.length > 0;

  // State
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize state when modal opens - with guard to prevent resets from realtime updates
  useEffect(() => {
    // Reset initialization flag when modal closes
    if (!isOpen) {
      setHasInitialized(false);
      return;
    }

    if (!item) return;

    // Don't reset after initial setup - prevents realtime updates from resetting selection
    if (hasInitialized) return;

    // Reset search
    setSearchQuery('');
    setDebouncedSearchQuery('');

    // Handle edit mode
    if (editMode && editingCartItem) {
      const variantToEdit = variants.find(v => v.id === editingCartItem.variant?.id);
      if (variantToEdit) {
        setSelectedVariant(variantToEdit);
      } else if (variants.length > 0) {
        setSelectedVariant(variants[0]);
      }
      setQuantity(editingCartItem.quantity || 1);
      if (initialCustomizations.length > 0) {
        setSelectedCustomizations(initialCustomizations);
      }
    } else {
      // Normal mode: set initial variant or first variant
      if (initialVariant && variants.find(v => v.id === initialVariant.id)) {
        setSelectedVariant(initialVariant);
      } else if (variants.length > 0) {
        // Auto-select first variant sorted by price
        const sortedByPrice = [...variants].sort((a, b) => {
          const priceA = mode === 'delivery' ? (a.price_delivery ?? a.price) : a.price;
          const priceB = mode === 'delivery' ? (b.price_delivery ?? b.price) : b.price;
          return priceA - priceB;
        });
        setSelectedVariant(sortedByPrice[0]);
      } else {
        setSelectedVariant(null);
      }
      setQuantity(initialQuantity);
      setSelectedCustomizations([]);
    }

    setHasInitialized(true);
  }, [isOpen, item?.id, initialVariant?.id, initialQuantity, editMode, editingCartItem, initialCustomizations, mode]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Price calculation helpers
  const getVariantPrice = useCallback((variant: ItemVariant): number => {
    if (mode === 'delivery') {
      return variant.price_delivery ?? variant.price ?? 0;
    }
    return variant.price ?? 0;
  }, [mode]);

  const getItemPrice = useCallback((): number => {
    if (!item) return 0;
    if (mode === 'delivery') {
      return item.price_delivery || item.price_takeaway || item.price || 0;
    }
    return item.price_takeaway || item.price || 0;
  }, [item, mode]);

  // Base price (from variant or item)
  const basePrice = useMemo(() => {
    if (selectedVariant) {
      return getVariantPrice(selectedVariant);
    }
    return getItemPrice();
  }, [selectedVariant, getVariantPrice, getItemPrice]);

  // Add-ons subtotal
  const addOnsSubtotal = useMemo(() => {
    return selectedCustomizations.reduce((sum, c) => sum + c.price_adjustment, 0);
  }, [selectedCustomizations]);

  // Total price
  const totalPrice = useMemo(() => {
    return (basePrice + addOnsSubtotal) * quantity;
  }, [basePrice, addOnsSubtotal, quantity]);

  // Filter customizations for website display
  const websiteCustomizations = useMemo(() => {
    return customizations.filter(c => c.show_on_website === true && c.is_active === true);
  }, [customizations]);

  // Apply search filter
  const filteredCustomizations = useMemo(() => {
    return websiteCustomizations.filter(c => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.customization_group?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    });
  }, [websiteCustomizations, debouncedSearchQuery]);

  // Group customizations
  const groupedCustomizations = useMemo(() => {
    const groups: Record<string, Customization[]> = {};
    filteredCustomizations.forEach(customization => {
      const groupName = customization.customization_group || customization.name || 'Other';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(customization);
    });
    // Sort each group by display_order
    Object.keys(groups).forEach(groupName => {
      groups[groupName].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    });
    return groups;
  }, [filteredCustomizations]);

  // Get variant display name
  const getVariantDisplayName = (variant: ItemVariant): string => {
    return variant.variant_name || variant.name || 'Standard';
  };

  // Handle variant selection
  const handleVariantSelect = (variant: ItemVariant) => {
    setSelectedVariant(variant);
  };

  // Handle customization toggle
  const handleCustomizationToggle = (customization: Customization, checked: boolean) => {
    if (checked) {
      setSelectedCustomizations(prev => [
        ...prev,
        {
          id: customization.id,
          name: customization.name,
          price_adjustment: customization.price ?? 0,
          group: customization.customization_group ?? undefined
        }
      ]);
    } else {
      setSelectedCustomizations(prev => prev.filter(c => c.id !== customization.id));
    }
  };

  // Handle quantity change
  const handleQuantityDecrease = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const handleQuantityIncrease = () => {
    if (quantity < 20) setQuantity(q => q + 1);
  };

  // Handle chip removal
  const handleRemoveChip = (customizationId: string) => {
    setSelectedCustomizations(prev => prev.filter(c => c.id !== customizationId));
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!item) return;

    const variant = selectedVariant || (variants.length > 0 ? variants[0] : null);

    if (variant) {
      addToCart(item, quantity, variant, selectedCustomizations, '');
      const displayName = getVariantDisplayName(variant);
      toast.success(`${displayName} added to cart!`);
    } else {
      // Fallback for items with no variants
      const price = getItemPrice();
      const fallbackVariant: ItemVariant = {
        id: item.id,
        name: item.name,
        price,
        protein_type_id: ''
      };
      addToCart(item, quantity, fallbackVariant, selectedCustomizations, '');
      toast.success(`Added ${quantity}x ${item.name} to cart`);
    }

    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setQuantity(1);
    setSelectedCustomizations([]);
    setSearchQuery('');
    onClose();
    onModalClose?.();
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleAddToCart();
        return;
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        handleClose();
        break;
      case 'Enter':
        e.preventDefault();
        handleAddToCart();
        break;
      case '+':
      case '=':
        e.preventDefault();
        handleQuantityIncrease();
        break;
      case '-':
      case '_':
        e.preventDefault();
        handleQuantityDecrease();
        break;
    }
  }, [quantity, selectedVariant, selectedCustomizations, item]);

  // Get reactive hero image
  const displayedHeroImage = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.display_image_url || selectedVariant.image_url || item?.image_url || '/placeholder-food.jpg';
    }
    return item?.image_url || '/placeholder-food.jpg';
  }, [selectedVariant, item]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl w-full max-h-[90dvh] overflow-hidden p-0"
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          borderColor: PremiumTheme.colors.burgundy[500],
          borderWidth: '2px',
          boxShadow: PremiumTheme.shadows.glow.tandoori,
          zIndex: 70
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Main Grid: 1 col mobile, 2 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-full max-h-[90dvh]">

          {/* LEFT COLUMN: Image + Variants */}
          <div
            className="flex flex-col md:border-r"
            style={{ borderColor: PremiumTheme.colors.dark[700] }}
          >
            {/* Hero Image - smaller on mobile, taller on desktop */}
            <div className="relative h-32 md:h-56 w-full overflow-hidden shrink-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={displayedHeroImage}
                  src={displayedHeroImage}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </AnimatePresence>
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${PremiumTheme.colors.dark[900]} 0%, transparent 60%)`
                }}
              />
              {/* Price badge */}
              <motion.div
                key={basePrice}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="absolute top-3 left-3 px-3 py-1.5 rounded-lg font-bold text-lg"
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  color: PremiumTheme.colors.gold[400]
                }}
              >
                £{basePrice.toFixed(2)}
              </motion.div>
              {/* Dietary badges */}
              {selectedVariant && hasAnyFoodDetails(selectedVariant) && (
                <div className="absolute top-3 right-3 flex flex-wrap gap-1 max-w-[120px] justify-end">
                  {selectedVariant.is_vegetarian && (
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-green-600/90 text-white border-0">🌱</Badge>
                  )}
                  {selectedVariant.is_vegan && (
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-green-700/90 text-white border-0">🌿</Badge>
                  )}
                  {selectedVariant.is_gluten_free && (
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-600/90 text-white border-0">GF</Badge>
                  )}
                  {selectedVariant.is_halal && (
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-blue-600/90 text-white border-0">☪️</Badge>
                  )}
                  {selectedVariant.spice_level && selectedVariant.spice_level > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-red-600/90 text-white border-0">
                      {convertSpiceIndicatorsToEmoji(selectedVariant.spice_level)}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Variant Pills Section */}
            {isMultiVariant && (
              <div className="p-3 md:flex-1 md:overflow-y-auto">
                <h3
                  className="text-xs font-semibold mb-2 uppercase tracking-wide"
                  style={{ color: PremiumTheme.colors.text.muted }}
                >
                  Choose Protein
                </h3>

                {/* Mobile: horizontal scroll */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:hidden scrollbar-hide">
                  {variants.map(variant => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const price = getVariantPrice(variant);
                    const shortLabel = getShortProteinLabel(variant);

                    return (
                      <motion.button
                        key={variant.id}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm whitespace-nowrap transition-all"
                        )}
                        style={{
                          background: isSelected
                            ? PremiumTheme.colors.burgundy[600]
                            : PremiumTheme.colors.dark[850],
                          borderColor: isSelected
                            ? PremiumTheme.colors.burgundy[500]
                            : PremiumTheme.colors.dark[600],
                          color: isSelected
                            ? PremiumTheme.colors.text.primary
                            : PremiumTheme.colors.text.muted
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleVariantSelect(variant)}
                      >
                        {isSelected && <Check className="h-3 w-3 shrink-0" />}
                        <span className="font-medium">{shortLabel}</span>
                        <span
                          className="text-xs"
                          style={{ color: isSelected ? PremiumTheme.colors.gold[400] : PremiumTheme.colors.text.muted }}
                        >
                          £{price.toFixed(2)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Desktop: vertical list */}
                <div className="hidden md:flex md:flex-col gap-2">
                  {variants.map(variant => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const price = getVariantPrice(variant);
                    const shortLabel = getShortProteinLabel(variant);

                    return (
                      <motion.button
                        key={variant.id}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2.5 rounded-lg border transition-all"
                        )}
                        style={{
                          background: isSelected
                            ? `${PremiumTheme.colors.burgundy[600]}20`
                            : PremiumTheme.colors.dark[850],
                          borderColor: isSelected
                            ? PremiumTheme.colors.burgundy[500]
                            : PremiumTheme.colors.dark[700],
                          color: isSelected
                            ? PremiumTheme.colors.text.primary
                            : PremiumTheme.colors.text.muted
                        }}
                        whileHover={{
                          borderColor: PremiumTheme.colors.dark[500],
                          background: isSelected ? `${PremiumTheme.colors.burgundy[600]}30` : PremiumTheme.colors.dark[800]
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVariantSelect(variant)}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4" style={{ color: PremiumTheme.colors.burgundy[400] }} />}
                          <span className="font-medium">{shortLabel}</span>
                        </div>
                        <span
                          className="font-bold"
                          style={{ color: isSelected ? PremiumTheme.colors.gold[400] : PremiumTheme.colors.text.primary }}
                        >
                          £{price.toFixed(2)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Title + Customizations + Footer */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            {/* Header */}
            <DialogHeader className="px-4 py-3 shrink-0">
              <DialogTitle
                className="text-xl font-bold"
                style={{ color: PremiumTheme.colors.text.primary }}
              >
                {item.name}
              </DialogTitle>
              <DialogDescription
                className="text-sm line-clamp-2"
                style={{ color: PremiumTheme.colors.text.muted }}
              >
                {item.menu_item_description || item.description || ''}
              </DialogDescription>
            </DialogHeader>

            {/* Customizations Section - scrollable */}
            <div className="flex-1 overflow-y-auto px-4 min-h-0">
              {/* Search bar - sticky */}
              {websiteCustomizations.length > 0 && (
                <div
                  className="sticky top-0 py-2 z-10"
                  style={{ background: PremiumTheme.colors.dark[900] }}
                >
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      style={{ color: PremiumTheme.colors.text.muted }}
                    />
                    <Input
                      type="text"
                      placeholder="Search options..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9"
                      style={{
                        background: PremiumTheme.colors.dark[850],
                        borderColor: PremiumTheme.colors.dark[700],
                        color: PremiumTheme.colors.text.primary
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Grouped Customizations */}
              <div className="space-y-4 pb-4">
                {Object.keys(groupedCustomizations).length > 0 ? (
                  Object.entries(groupedCustomizations).map(([groupName, items]) => {
                    const groupSelectionCount = selectedCustomizations.filter(c => c.group === groupName).length;
                    const hasExclusiveItems = items.some(item => item.is_exclusive);

                    return (
                      <div key={groupName} className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <h3
                            className="text-sm font-semibold"
                            style={{ color: PremiumTheme.colors.burgundy[400] }}
                          >
                            {groupName}
                          </h3>
                          <span className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                            {hasExclusiveItems ? 'Choose one' : 'Choose any'}
                            {groupSelectionCount > 0 && ` (${groupSelectionCount})`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map(customization => {
                            const isSelected = selectedCustomizations.some(c => c.id === customization.id);
                            const hasPrice = (customization.price ?? 0) > 0;

                            return (
                              <motion.button
                                key={customization.id}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all"
                                )}
                                style={{
                                  background: isSelected
                                    ? PremiumTheme.colors.burgundy[600]
                                    : PremiumTheme.colors.dark[850],
                                  borderColor: isSelected
                                    ? PremiumTheme.colors.burgundy[500]
                                    : PremiumTheme.colors.dark[700],
                                  color: isSelected
                                    ? PremiumTheme.colors.text.primary
                                    : PremiumTheme.colors.text.muted
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                  if (hasExclusiveItems) {
                                    setSelectedCustomizations(prev => prev.filter(c => c.group !== groupName));
                                    if (!isSelected) {
                                      handleCustomizationToggle(customization, true);
                                    }
                                  } else {
                                    handleCustomizationToggle(customization, !isSelected);
                                  }
                                }}
                              >
                                {isSelected && <Check className="h-3 w-3 shrink-0" />}
                                <span>{customization.name}</span>
                                {hasPrice && (
                                  <span className="opacity-75">+£{customization.price?.toFixed(2)}</span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : websiteCustomizations.length === 0 ? null : (
                  <div className="text-center py-4" style={{ color: PremiumTheme.colors.text.muted }}>
                    {searchQuery ? 'No options found.' : 'No customization options available.'}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Chips - show above footer if any */}
            {selectedCustomizations.length > 0 && (
              <div
                className="px-4 py-2 shrink-0 border-t"
                style={{ borderColor: PremiumTheme.colors.dark[700] }}
              >
                <div className="flex flex-wrap gap-1.5">
                  <AnimatePresence>
                    {selectedCustomizations.map(custom => (
                      <motion.div
                        key={custom.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <Badge
                          className="flex items-center gap-1 py-0.5 px-2 cursor-pointer hover:opacity-80 transition-opacity text-xs"
                          style={{
                            background: PremiumTheme.colors.burgundy[600],
                            color: PremiumTheme.colors.text.primary
                          }}
                          onClick={() => handleRemoveChip(custom.id)}
                        >
                          <span>{custom.name}</span>
                          {custom.price_adjustment > 0 && (
                            <span className="opacity-75">+£{custom.price_adjustment.toFixed(2)}</span>
                          )}
                          <X className="h-3 w-3" />
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Footer - Fixed at bottom */}
            <div
              className="shrink-0 px-4 py-3 border-t space-y-2"
              style={{
                background: PremiumTheme.colors.dark[900],
                borderColor: PremiumTheme.colors.dark[700]
              }}
            >
              {/* Quantity and Price Row */}
              <div className="flex items-center justify-between">
                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleQuantityDecrease}
                    disabled={quantity <= 1}
                    className="h-9 w-9"
                    style={{
                      borderColor: PremiumTheme.colors.dark[600],
                      background: PremiumTheme.colors.dark[850],
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span
                    className="text-lg font-bold w-8 text-center"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleQuantityIncrease}
                    disabled={quantity >= 20}
                    className="h-9 w-9"
                    style={{
                      borderColor: PremiumTheme.colors.dark[600],
                      background: PremiumTheme.colors.dark[850],
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Price Breakdown */}
                <div className="text-right">
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: PremiumTheme.colors.text.muted }}>
                      £{basePrice.toFixed(2)}
                    </span>
                    {addOnsSubtotal > 0 && (
                      <span style={{ color: PremiumTheme.colors.burgundy[400] }}>
                        +£{addOnsSubtotal.toFixed(2)}
                      </span>
                    )}
                    {quantity > 1 && (
                      <span style={{ color: PremiumTheme.colors.text.muted }}>
                        × {quantity}
                      </span>
                    )}
                  </div>
                  <motion.div
                    key={totalPrice}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-lg font-bold"
                    style={{ color: PremiumTheme.colors.gold[400] }}
                  >
                    £{totalPrice.toFixed(2)}
                  </motion.div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleAddToCart}
                      className="w-full text-base font-semibold py-5"
                      style={{
                        background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                        color: PremiumTheme.colors.text.primary,
                        minHeight: '48px'
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {editMode ? 'Save Changes' : 'Add to Cart'} • £{totalPrice.toFixed(2)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
                    <p>Press Enter to add • Esc to cancel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
