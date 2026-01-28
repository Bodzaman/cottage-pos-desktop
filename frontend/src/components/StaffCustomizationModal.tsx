import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Search, UtensilsCrossed } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MenuItem, ItemVariant, CustomizationBase } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

interface StaffCustomizationModalProps {
  item: MenuItem;
  variant?: ItemVariant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, quantity: number, variant?: ItemVariant | null, customizations?: SelectedCustomization[], notes?: string) => void;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  initialQuantity?: number;
}

export interface SelectedCustomization {
  id: string;
  name: string;
  price_adjustment: number;
  group?: string;
}

// 🎨 POS Purple Theme Colors
const POS_THEME = {
  primary: '#7C5DFA',
  primaryHover: '#6B4DE0',
  primaryLight: '#9277FF',
  background: '#1A1A1A',
  backgroundLight: '#171717',
  border: '#404040',
  text: '#FFFFFF',
  textMuted: '#B0B0B0',
  success: '#0EBAB1'
};

export function StaffCustomizationModal({
  item,
  variant = null,
  isOpen,
  onClose,
  onConfirm,
  orderType,
  initialQuantity = 1
}: StaffCustomizationModalProps) {
  const { customizations } = useRealtimeMenuStore();
  
  // State
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [prevTotal, setPrevTotal] = useState(0);
  const notesInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Update quantity when initialQuantity changes
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  // Reset state when modal closes (transitions from open to closed)
  useEffect(() => {
    if (!isOpen) {
      // Only reset when modal is closed
      setSearchQuery('');
      setSelectedCustomizations([]);
      setSpecialInstructions('');
    }
  }, [isOpen]);

  // Filter customizations for POS display (show_on_pos = true)
  const posCustomizations = useMemo(() => {
    return customizations.filter(c => c.show_on_pos === true && c.is_active === true);
  }, [customizations]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Group customizations by customization_group
  const groupedCustomizations = useMemo(() => {
    const groups: Record<string, CustomizationBase[]> = {};
    
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

  // Calculate base price based on order type
  const basePrice = useMemo(() => {
    if (variant) {
      // Variant pricing
      if (orderType === 'DELIVERY') {
        return variant.price_delivery ?? variant.price;
      } else if (orderType === 'DINE-IN') {
        return variant.price_dine_in ?? variant.price;
      }
      return variant.price;
    } else {
      // Item pricing
      if (orderType === 'DELIVERY') {
        return item.price_delivery || item.price_takeaway || item.price || 0;
      } else if (orderType === 'DINE-IN') {
        return item.price_dine_in || item.price_takeaway || item.price || 0;
      }
      return item.price_takeaway || item.price || 0;
    }
  }, [item, variant, orderType]);

  // Calculate total with customizations
  const totalPrice = useMemo(() => {
    const customizationsTotal = selectedCustomizations.reduce((sum, c) => sum + c.price_adjustment, 0);
    return (basePrice + customizationsTotal) * quantity;
  }, [basePrice, selectedCustomizations, quantity]);

  // Track price changes for animation
  useEffect(() => {
    if (totalPrice !== prevTotal) {
      setPrevTotal(totalPrice);
    }
  }, [totalPrice]);

  // Calculate add-ons subtotal
  const addOnsSubtotal = useMemo(() => {
    return selectedCustomizations.reduce((sum, c) => sum + c.price_adjustment, 0);
  }, [selectedCustomizations]);

  // Handle customization toggle
  const handleCustomizationToggle = (customization: CustomizationBase, checked: boolean) => {
    console.log('[StaffCustomizationModal] handleCustomizationToggle called:', {
      customization: { id: customization.id, name: customization.name, price: customization.price },
      checked,
      currentSelectedCount: selectedCustomizations.length
    });

    if (checked) {
      setSelectedCustomizations(prev => {
        const updated = [
          ...prev,
          {
            id: customization.id,
            name: customization.name,
            price_adjustment: customization.price ?? 0,
            group: customization.customization_group ?? undefined
          }
        ];
        console.log('[StaffCustomizationModal] After adding, selectedCustomizations:', updated);
        return updated;
      });
    } else {
      setSelectedCustomizations(prev => {
        const updated = prev.filter(c => c.id !== customization.id);
        console.log('[StaffCustomizationModal] After removing, selectedCustomizations:', updated);
        return updated;
      });
    }
  };

  // Handle quantity change
  const handleQuantityDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleQuantityIncrease = () => {
    setQuantity(quantity + 1);
  };

  // Handle confirm
  const handleConfirm = () => {
    console.log('[StaffCustomizationModal] handleConfirm called:', {
      selectedCustomizations: selectedCustomizations,
      selectedCustomizationsLength: selectedCustomizations.length,
      quantity,
      totalPrice
    });

    onConfirm(
      item,
      quantity,
      variant,
      selectedCustomizations.length > 0 ? selectedCustomizations : undefined,
      specialInstructions || undefined
    );

    // Show success toast
    const variantName = variant ? ` (${variant.name})` : '';
    toast.success(`${item.name}${variantName} added to order`, {
      description: `Quantity: ${quantity} • £${totalPrice.toFixed(2)}`
    });

    // Reset and close
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setQuantity(1);
    setSelectedCustomizations([]);
    setSpecialInstructions('');
    setSearchQuery('');
    onClose();
  };

  // Enhanced keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent shortcuts when typing in inputs
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

    switch(e.key) {
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
        if (quantity > 1) handleQuantityDecrease();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        notesInputRef.current?.focus();
        break;
    }
  }, [quantity]);

  // Handle chip removal
  const handleRemoveChip = (customizationId: string) => {
    setSelectedCustomizations(prev => prev.filter(c => c.id !== customizationId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${POS_THEME.background} 0%, ${POS_THEME.backgroundLight} 100%)`,
          borderColor: POS_THEME.primary,
          borderWidth: '2px'
        }}
        onKeyDown={handleKeyDown}
        aria-labelledby="customization-modal-title"
        aria-describedby="customization-modal-description"
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle 
            id="customization-modal-title"
            className="text-2xl font-semibold flex items-center gap-2"
            style={{ color: POS_THEME.text }}
          >
            <UtensilsCrossed className="h-6 w-6" style={{ color: POS_THEME.primary }} />
            Customise Item
          </DialogTitle>
          <DialogDescription 
            id="customization-modal-description"
            style={{ color: POS_THEME.textMuted }}
          >
            {item.name}
            {variant && (
              <Badge 
                className="ml-2"
                style={{
                  background: POS_THEME.primary,
                  color: POS_THEME.text
                }}
              >
                {variant.name}
              </Badge>
            )}
            {variant && variant.description_override && (
              <span className="block mt-1 text-sm">{variant.description_override}</span>
            )}
          </DialogDescription>
          {/* Live Base Price Display */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm" style={{ color: POS_THEME.textMuted }}>Base Price:</span>
            <span className="text-lg font-bold" style={{ color: POS_THEME.primary }}>£{basePrice.toFixed(2)}</span>
          </div>
          <Separator style={{ background: POS_THEME.border, marginTop: '0.5rem' }} />
        </DialogHeader>

        {/* Smart Search Bar */}
        <div className="pb-4">
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
              className="pl-10"
              style={{
                background: POS_THEME.backgroundLight,
                borderColor: POS_THEME.border,
                color: POS_THEME.text
              }}
              aria-label="Search customizations"
            />
          </div>
          {debouncedSearchQuery && (
            <p className="text-xs mt-2" style={{ color: POS_THEME.textMuted }}>
              {filteredCustomizations.length} result{filteredCustomizations.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-5">
          {Object.keys(groupedCustomizations).length > 0 ? (
            <div className="space-y-5">
              {Object.entries(groupedCustomizations).map(([groupName, items]) => {
                const groupSelectionCount = selectedCustomizations.filter(c => c.group === groupName).length;
                const hasExclusiveItems = items.some(item => item.is_exclusive);

                return (
                  <div key={groupName} className="space-y-3">
                    {/* Section Header */}
                    <div className="flex items-baseline gap-2">
                      <h3
                        className="text-base font-semibold"
                        style={{ color: POS_THEME.primary }}
                      >
                        {groupName}
                      </h3>
                      <span className="text-xs" style={{ color: POS_THEME.textMuted }}>
                        {hasExclusiveItems ? 'Choose one' : 'Choose any'}
                        {groupSelectionCount > 0 && ` (${groupSelectionCount} selected)`}
                      </span>
                    </div>

                    {/* Pill / Chip Options */}
                    <div className="flex flex-wrap gap-2">
                      {items.map(customization => {
                        const isSelected = selectedCustomizations.some(c => c.id === customization.id);
                        const hasPrice = (customization.price ?? 0) > 0;

                        return (
                          <motion.button
                            key={customization.id}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all min-h-[44px] cursor-pointer"
                            )}
                            style={{
                              background: isSelected
                                ? POS_THEME.primary
                                : POS_THEME.backgroundLight,
                              borderColor: isSelected
                                ? POS_THEME.primary
                                : POS_THEME.border,
                              color: isSelected
                                ? POS_THEME.text
                                : POS_THEME.textMuted
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              if (hasExclusiveItems) {
                                // Single choice: deselect others in group first
                                setSelectedCustomizations(prev => prev.filter(c => c.group !== groupName));
                                if (!isSelected) {
                                  handleCustomizationToggle(customization, true);
                                }
                              } else {
                                handleCustomizationToggle(customization, !isSelected);
                              }
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
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
              })}
            </div>
          ) : (
            <div
              className="text-center py-8"
              style={{ color: POS_THEME.textMuted }}
            >
              {searchQuery ? 'No options found matching your search.' : 'No options available for this item.'}
            </div>
          )}

          {/* Special Instructions with ref */}
          <div className="space-y-3 pt-2">
            <h3 
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: POS_THEME.primary }}
            >
              Special Instructions
              <Badge variant="outline" className="text-xs" style={{ borderColor: POS_THEME.border, color: POS_THEME.textMuted }}>
                Press M to focus
              </Badge>
            </h3>
            <Textarea
              ref={notesInputRef}
              placeholder="E.g., No onions, extra spicy, etc."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              className="resize-none"
              style={{
                background: POS_THEME.backgroundLight,
                borderColor: POS_THEME.border,
                color: POS_THEME.text
              }}
              aria-label="Special instructions"
            />
          </div>
        </div>

        {/* Selected Summary Chips */}
        {selectedCustomizations.length > 0 && (
          <div className="py-3">
            <div className="flex flex-wrap gap-2">
              {selectedCustomizations.map((custom) => (
                <motion.div
                  key={custom.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Badge
                    className="flex items-center gap-2 py-1 px-3 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      background: POS_THEME.primary,
                      color: POS_THEME.text
                    }}
                    onClick={() => handleRemoveChip(custom.id)}
                  >
                    <span>{custom.name}</span>
                    {custom.price_adjustment > 0 && (
                      <span className="text-xs">+£{custom.price_adjustment.toFixed(2)}</span>
                    )}
                    <X className="h-3 w-3" />
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <Separator style={{ background: POS_THEME.border }} />

        {/* Footer - Quantity and Confirm */}
        <div className="space-y-4 pt-4">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm font-medium"
              style={{ color: POS_THEME.textMuted }}
            >
              Quantity
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleQuantityDecrease}
                disabled={quantity <= 1}
                style={{
                  borderColor: POS_THEME.border,
                  background: POS_THEME.backgroundLight,
                  color: POS_THEME.text,
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span 
                className="text-xl font-semibold w-12 text-center"
                style={{ color: POS_THEME.text }}
                aria-live="polite"
              >
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleQuantityIncrease}
                style={{
                  borderColor: POS_THEME.border,
                  background: POS_THEME.backgroundLight,
                  color: POS_THEME.text,
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Price Breakdown with Animation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: POS_THEME.textMuted }}>Base Price</span>
              <span style={{ color: POS_THEME.text }}>£{basePrice.toFixed(2)}</span>
            </div>
            {selectedCustomizations.length > 0 && (
              <motion.div 
                className="flex items-center justify-between text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span style={{ color: POS_THEME.textMuted }}>Add-ons Subtotal ({selectedCustomizations.length})</span>
                <span style={{ color: POS_THEME.success }}>
                  +£{addOnsSubtotal.toFixed(2)}
                </span>
              </motion.div>
            )}
            {quantity > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: POS_THEME.textMuted }}>Quantity</span>
                <span style={{ color: POS_THEME.text }}>× {quantity}</span>
              </div>
            )}
            <Separator style={{ background: POS_THEME.border }} />
            <motion.div 
              className="flex items-center justify-between text-lg font-semibold"
              key={totalPrice}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <span style={{ color: POS_THEME.text }}>Total</span>
              <span style={{ color: POS_THEME.primary }} aria-live="polite">£{totalPrice.toFixed(2)}</span>
            </motion.div>
          </div>

          {/* Enhanced tooltip for confirm button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleConfirm}
                  className="w-full text-lg font-semibold py-6"
                  style={{
                    background: `linear-gradient(135deg, ${POS_THEME.primary} 0%, ${POS_THEME.primaryHover} 100%)`,
                    color: POS_THEME.text,
                    minHeight: '56px'
                  }}
                  aria-label="Add item to order"
                >
                  <Check className="h-5 w-5 mr-2" />
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
      </DialogContent>
    </Dialog>
  );
}
