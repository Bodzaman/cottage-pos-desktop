import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Search, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MenuItem, ItemVariant, Customization, OrderItem } from '../utils/types';
import { useRealtimeMenuStoreCompat } from '../utils/realtimeMenuStoreCompat';
import { FIXED_SECTIONS, findRootSection } from '../utils/sectionMapping';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

// POS Purple Theme Colors
const POS_THEME = {
  primary: '#7C5DFA',
  primaryHover: '#6B4DE0',
  primaryLight: '#9277FF',
  background: '#1A1A1A',
  backgroundLight: '#171717',
  border: '#404040',
  borderActive: '#7C5DFA',
  text: '#FFFFFF',
  textMuted: '#B0B0B0',
  success: '#0EBAB1',
  gold: '#FFD700'
};

export interface SelectedCustomization {
  id: string;
  name: string;
  price_adjustment: number;
  price?: number;
  group?: string;
}

interface StaffUnifiedCustomizationModalProps {
  item: MenuItem | null;
  itemVariants: ItemVariant[];
  isOpen: boolean;
  onClose: () => void;
  onAddToOrder: (orderItem: OrderItem) => void;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  initialVariant?: ItemVariant | null;
  initialQuantity?: number;
}

export function StaffUnifiedCustomizationModal({
  item,
  itemVariants,
  isOpen,
  onClose,
  onAddToOrder,
  orderType,
  initialVariant = null,
  initialQuantity = 1
}: StaffUnifiedCustomizationModalProps) {
  const { customizations, categories } = useRealtimeMenuStoreCompat({ context: 'pos' });
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

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
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [serveWithSectionId, setServeWithSectionId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get item's natural section based on its category
  const naturalSection = useMemo(() => {
    if (!item?.category_id) return null;
    return findRootSection(item.category_id, categories);
  }, [item?.category_id, categories]);

  // Get current selected section (either override or natural)
  const currentSection = useMemo(() => {
    if (serveWithSectionId) {
      return FIXED_SECTIONS.find(s => s.uuid === serveWithSectionId) || null;
    }
    return naturalSection;
  }, [serveWithSectionId, naturalSection]);

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

    // Reset state
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCustomizations([]);
    setSpecialInstructions('');
    setServeWithSectionId(null);

    // Set initial variant
    if (initialVariant && variants.find(v => v.id === initialVariant.id)) {
      setSelectedVariant(initialVariant);
    } else if (variants.length > 0) {
      // Auto-select first variant
      setSelectedVariant(variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setQuantity(initialQuantity);
    setHasInitialized(true);
  }, [isOpen, item?.id, initialVariant?.id, initialQuantity]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Price calculation helpers
  const getVariantPrice = useCallback((variant: ItemVariant): number => {
    switch (orderType) {
      case 'DELIVERY':
        return variant.price_delivery ?? variant.price ?? 0;
      case 'DINE-IN':
        return variant.price_dine_in ?? variant.price ?? 0;
      case 'COLLECTION':
      case 'WAITING':
      default:
        return variant.price ?? 0;
    }
  }, [orderType]);

  const getItemPrice = useCallback((): number => {
    if (!item) return 0;
    switch (orderType) {
      case 'DELIVERY':
        return item.price_delivery || item.price_takeaway || item.price || 0;
      case 'DINE-IN':
        return item.price_dine_in || item.price_takeaway || item.price || 0;
      case 'COLLECTION':
      case 'WAITING':
      default:
        return item.price_takeaway || item.price || 0;
    }
  }, [item, orderType]);

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

  // Get reactive hero image (matches CustomerUnifiedCustomizationModal behavior)
  const displayedHeroImage = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.display_image_url || selectedVariant.image_url || item?.image_url || '';
    }
    return item?.image_url || '';
  }, [selectedVariant, item]);

  // Filter customizations for POS display
  const posCustomizations = useMemo(() => {
    return customizations.filter(c => c.show_on_pos === true && c.is_active === true);
  }, [customizations]);

  // Apply search filter
  const filteredCustomizations = useMemo(() => {
    return posCustomizations.filter(c => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.customization_group?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    });
  }, [posCustomizations, debouncedSearchQuery]);

  // Group customizations
  const groupedCustomizations = useMemo(() => {
    const groups: Record<string, Customization[]> = {};
    filteredCustomizations.forEach(customization => {
      const groupName = customization.customization_group || 'Other';
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

  // Get short protein label for compact pill display
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

  // Handle confirm/add to order
  const handleConfirm = () => {
    if (!item) return;

    const variant = selectedVariant || (variants.length > 0 ? variants[0] : null);
    const price = variant ? getVariantPrice(variant) : getItemPrice();

    // Guard against £0.00 price
    if (price <= 0) {
      toast.warning('Unable to add item', {
        description: 'Price not available. Please select a variant with valid pricing.',
      });
      return;
    }

    const customizationsTotal = selectedCustomizations.reduce((sum, c) => sum + c.price_adjustment, 0);
    const total = (price + customizationsTotal) * quantity;

    // Resolve image from variant/item hierarchy (variant.display_image_url → variant.image_url → item.image_url)
    const resolvedImageUrl = variant?.display_image_url || variant?.image_url || item.image_url || undefined;

    const orderItem: OrderItem = {
      menu_item_id: item.id,
      category_id: item.category_id,
      name: item.name,
      quantity: quantity,
      price: price,
      total: total,
      variant_id: variant?.id || null,
      variantName: variant ? getVariantDisplayName(variant) : null,
      notes: specialInstructions || '',
      image_url: resolvedImageUrl,
      customizations: selectedCustomizations.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price_adjustment
      })),
      serveWithSectionId: serveWithSectionId
    };

    onAddToOrder(orderItem);

    // Show success toast
    const variantName = variant ? ` (${getVariantDisplayName(variant)})` : '';
    const serveWithInfo = serveWithSectionId && currentSection ? ` • Serve with ${currentSection.displayName}` : '';
    toast.success(`${item.name}${variantName} added to order`, {
      description: `Quantity: ${quantity} • £${total.toFixed(2)}${serveWithInfo}`
    });

    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setQuantity(1);
    setSelectedVariant(null);
    setSelectedCustomizations([]);
    setSpecialInstructions('');
    setSearchQuery('');
    setServeWithSectionId(null);
    onClose();
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
        handleConfirm();
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
        handleConfirm();
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
      case 'm':
      case 'M':
        e.preventDefault();
        notesInputRef.current?.focus();
        break;
      // Number keys 1-9 for variant selection
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (variants[idx]) {
          handleVariantSelect(variants[idx]);
        }
        break;
    }
  }, [quantity, variants, selectedVariant, selectedCustomizations, item]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl w-full max-h-[90dvh] overflow-hidden p-0"
        style={{
          background: `linear-gradient(135deg, ${POS_THEME.background} 0%, ${POS_THEME.backgroundLight} 100%)`,
          borderColor: POS_THEME.primary,
          borderWidth: '2px',
          boxShadow: `0 0 30px ${POS_THEME.primary}40`
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Main Grid: 1 col mobile, 2 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-full max-h-[90dvh]">

          {/* LEFT COLUMN: Image + Variants */}
          <div
            className="flex flex-col md:border-r"
            style={{ borderColor: POS_THEME.border }}
          >
            {/* Hero Image - smaller on mobile, taller on desktop */}
            <div className="relative h-32 md:h-56 w-full overflow-hidden shrink-0">
              {displayedHeroImage ? (
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
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: POS_THEME.backgroundLight }}
                >
                  <UtensilsCrossed className="h-12 w-12 opacity-30" style={{ color: POS_THEME.textMuted }} />
                </div>
              )}
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${POS_THEME.background} 0%, transparent 60%)`
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
                  color: POS_THEME.primary
                }}
              >
                £{basePrice.toFixed(2)}
              </motion.div>
            </div>

            {/* Variant Pills Section */}
            {isMultiVariant && (
              <div className="p-3 md:flex-1 md:overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <h3
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: POS_THEME.textMuted }}
                  >
                    Variant
                  </h3>
                  <span className="text-xs" style={{ color: POS_THEME.textMuted }}>
                    (Press 1-{Math.min(variants.length, 9)})
                  </span>
                </div>

                {/* Mobile: horizontal scroll */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:hidden scrollbar-hide">
                  {variants.map((variant, idx) => {
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
                            ? `linear-gradient(135deg, ${POS_THEME.primary} 0%, ${POS_THEME.primaryHover} 100%)`
                            : POS_THEME.backgroundLight,
                          borderColor: isSelected
                            ? POS_THEME.primary
                            : POS_THEME.border,
                          color: isSelected
                            ? POS_THEME.text
                            : POS_THEME.textMuted,
                          boxShadow: isSelected ? `0 0 10px ${POS_THEME.primary}40` : 'none'
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleVariantSelect(variant)}
                      >
                        {idx < 9 && (
                          <span
                            className="text-xs px-1 py-0.5 rounded"
                            style={{
                              background: isSelected ? 'rgba(255,255,255,0.2)' : POS_THEME.border,
                              color: isSelected ? POS_THEME.text : POS_THEME.textMuted
                            }}
                          >
                            {idx + 1}
                          </span>
                        )}
                        {isSelected && <Check className="h-3 w-3 shrink-0" />}
                        <span className="font-medium">{shortLabel}</span>
                        <span
                          className="text-xs"
                          style={{ color: isSelected ? POS_THEME.gold : POS_THEME.textMuted }}
                        >
                          £{price.toFixed(2)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Desktop: vertical list */}
                <div className="hidden md:flex md:flex-col gap-2">
                  {variants.map((variant, idx) => {
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
                            ? `${POS_THEME.primary}20`
                            : POS_THEME.backgroundLight,
                          borderColor: isSelected
                            ? POS_THEME.primary
                            : POS_THEME.border,
                          color: isSelected
                            ? POS_THEME.text
                            : POS_THEME.textMuted,
                          boxShadow: isSelected ? `0 0 10px ${POS_THEME.primary}30` : 'none'
                        }}
                        whileHover={{
                          borderColor: POS_THEME.borderActive,
                          background: isSelected ? `${POS_THEME.primary}30` : POS_THEME.background
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVariantSelect(variant)}
                      >
                        <div className="flex items-center gap-2">
                          {/* Number badge for keyboard shortcut */}
                          {idx < 9 && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                background: isSelected ? 'rgba(255,255,255,0.2)' : POS_THEME.border,
                                color: isSelected ? POS_THEME.text : POS_THEME.textMuted
                              }}
                            >
                              {idx + 1}
                            </span>
                          )}
                          {isSelected && <Check className="h-4 w-4" style={{ color: POS_THEME.primary }} />}
                          <span className="font-medium">{shortLabel}</span>
                        </div>
                        <span
                          className="font-bold"
                          style={{ color: isSelected ? POS_THEME.primary : POS_THEME.text }}
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
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: POS_THEME.text }}
              >
                <UtensilsCrossed className="h-5 w-5" style={{ color: POS_THEME.primary }} />
                Customise Item
              </DialogTitle>
              <DialogDescription style={{ color: POS_THEME.textMuted }}>
                {item.name}
                {selectedVariant && (
                  <Badge
                    className="ml-2"
                    style={{
                      background: POS_THEME.primary,
                      color: POS_THEME.text
                    }}
                  >
                    {getVariantDisplayName(selectedVariant)}
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 min-h-0">
              {/* Search bar - sticky */}
              {posCustomizations.length > 0 && (
                <div
                  className="sticky top-0 py-2 z-10"
                  style={{ background: POS_THEME.background }}
                >
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      style={{ color: POS_THEME.textMuted }}
                    />
                    <Input
                      type="text"
                      placeholder="Search options..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9"
                      style={{
                        background: POS_THEME.backgroundLight,
                        borderColor: POS_THEME.border,
                        color: POS_THEME.text
                      }}
                    />
                  </div>
                </div>
              )}

              {/* STAFF-ONLY: Serve With Section - DINE-IN only */}
              {orderType === 'DINE-IN' && naturalSection && (
                <div className="flex items-center justify-between py-2 mb-3">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4" style={{ color: POS_THEME.textMuted }} />
                    <span className="text-sm" style={{ color: POS_THEME.textMuted }}>Serve With:</span>
                  </div>
                  <Select
                    value={serveWithSectionId || naturalSection.uuid}
                    onValueChange={(val) => {
                      setServeWithSectionId(val === naturalSection.uuid ? null : val);
                    }}
                  >
                    <SelectTrigger
                      className="w-[180px] h-9"
                      style={{
                        background: serveWithSectionId ? POS_THEME.primary : POS_THEME.backgroundLight,
                        borderColor: serveWithSectionId ? POS_THEME.primary : POS_THEME.border,
                        color: POS_THEME.text
                      }}
                    >
                      <SelectValue>
                        {currentSection?.displayName || 'Select section'}
                        {!serveWithSectionId && ' (now)'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: POS_THEME.background,
                        borderColor: POS_THEME.border
                      }}
                    >
                      {FIXED_SECTIONS.map(section => (
                        <SelectItem
                          key={section.uuid}
                          value={section.uuid}
                          style={{ color: POS_THEME.text }}
                        >
                          {section.displayName}
                          {section.uuid === naturalSection.uuid && ' (now)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Customization Groups */}
              <div className="space-y-4 pb-4">
                {Object.keys(groupedCustomizations).length > 0 ? (
                  Object.entries(groupedCustomizations).map(([groupName, items]) => {
                    const groupSelectionCount = selectedCustomizations.filter(c => c.group === groupName).length;
                    const hasExclusiveItems = items.some(item => item.is_exclusive);

                    return (
                      <div key={groupName} className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <h3
                            className="text-sm font-semibold uppercase"
                            style={{ color: POS_THEME.primary }}
                          >
                            {groupName}
                          </h3>
                          <span className="text-xs" style={{ color: POS_THEME.textMuted }}>
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
                                  background: isSelected ? POS_THEME.primary : POS_THEME.backgroundLight,
                                  borderColor: isSelected ? POS_THEME.primary : POS_THEME.border,
                                  color: isSelected ? POS_THEME.text : POS_THEME.textMuted
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
                ) : posCustomizations.length === 0 ? null : (
                  <div className="text-center py-4" style={{ color: POS_THEME.textMuted }}>
                    {searchQuery ? 'No options found.' : 'No customization options available.'}
                  </div>
                )}
              </div>

              {/* STAFF-ONLY: Special Instructions with "Press M" badge */}
              <div className="space-y-2 pt-2 pb-4">
                <h3
                  className="text-sm font-semibold uppercase flex items-center gap-2"
                  style={{ color: POS_THEME.primary }}
                >
                  Special Instructions
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: POS_THEME.border, color: POS_THEME.textMuted }}
                  >
                    Press M
                  </Badge>
                </h3>
                <Textarea
                  ref={notesInputRef}
                  placeholder="E.g., No onions, extra spicy, etc."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  className="resize-none"
                  style={{
                    background: POS_THEME.backgroundLight,
                    borderColor: POS_THEME.border,
                    color: POS_THEME.text
                  }}
                />
              </div>
            </div>

            {/* Selected Chips - show above footer if any */}
            {selectedCustomizations.length > 0 && (
              <div
                className="px-4 py-2 shrink-0 border-t"
                style={{ borderColor: POS_THEME.border }}
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
                            background: POS_THEME.primary,
                            color: POS_THEME.text
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
                background: POS_THEME.background,
                borderColor: POS_THEME.border
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
                      borderColor: POS_THEME.border,
                      background: POS_THEME.backgroundLight,
                      color: POS_THEME.text
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span
                    className="text-lg font-bold w-8 text-center"
                    style={{ color: POS_THEME.text }}
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
                      borderColor: POS_THEME.border,
                      background: POS_THEME.backgroundLight,
                      color: POS_THEME.text
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Price Breakdown */}
                <div className="text-right">
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: POS_THEME.textMuted }}>
                      £{basePrice.toFixed(2)}
                    </span>
                    {addOnsSubtotal > 0 && (
                      <span style={{ color: POS_THEME.success }}>
                        +£{addOnsSubtotal.toFixed(2)}
                      </span>
                    )}
                    {quantity > 1 && (
                      <span style={{ color: POS_THEME.textMuted }}>
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
                    style={{ color: POS_THEME.primary }}
                  >
                    £{totalPrice.toFixed(2)}
                  </motion.div>
                </div>
              </div>

              {/* Add to Order Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleConfirm}
                      className="w-full text-base font-semibold py-5"
                      style={{
                        background: `linear-gradient(135deg, ${POS_THEME.primary} 0%, ${POS_THEME.primaryHover} 100%)`,
                        color: POS_THEME.text,
                        minHeight: '48px',
                        boxShadow: `0 0 20px ${POS_THEME.primary}50`
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Add to Order • £{totalPrice.toFixed(2)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white border-gray-700">
                    <div className="space-y-1">
                      <p>Press Enter to add • Esc to cancel</p>
                      <p className="text-xs opacity-75">+/− for quantity • M for notes</p>
                    </div>
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
