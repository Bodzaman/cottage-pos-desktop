import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Search, UtensilsCrossed, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MenuItem, ItemVariant, CustomizationBase } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

interface CustomerCustomizationModalProps {
  item: MenuItem;
  variant?: ItemVariant | null;
  isOpen: boolean;
  onClose: () => void;
  addToCart: (item: MenuItem, quantity: number, variant: ItemVariant, customizations: SelectedCustomization[], notes: string) => void;
  mode: 'delivery' | 'collection';
  initialQuantity?: number;
  // ✅ NEW: Edit mode props
  editMode?: boolean;
  initialCustomizations?: SelectedCustomization[];
  initialInstructions?: string;
  // ✅ NEW: Callback for reopening cart after modal closes
  onModalClose?: () => void;
}

export interface SelectedCustomization {
  id: string;
  name: string;
  price: number;
  group?: string;
}

export function CustomerCustomizationModal({
  item,
  variant = null,
  isOpen,
  onClose,
  addToCart,
  mode,
  initialQuantity = 1,
  // ✅ NEW: Destructure edit mode props with defaults
  editMode = false,
  initialCustomizations = [],
  initialInstructions = '',
  onModalClose // ✅ NEW: Destructure callback
}: CustomerCustomizationModalProps) {
  const { customizations } = useRealtimeMenuStore();
  
  // State
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [prevTotal, setPrevTotal] = useState(0);
  const notesInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Update quantity when initialQuantity changes
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCustomizations([]);
      setSpecialInstructions('');
    }
  }, [isOpen]);

  // ✅ NEW: Pre-fill state in edit mode
  useEffect(() => {
    if (isOpen && editMode) {
      if (initialCustomizations.length > 0) {
        setSelectedCustomizations(initialCustomizations);
      }
      if (initialInstructions) {
        setSpecialInstructions(initialInstructions);
      }
    }
  }, [isOpen, editMode, initialCustomizations, initialInstructions]);

  // Filter customizations for website display
  const websiteCustomizations = useMemo(() => {
    return customizations.filter(c => c.show_on_website === true && c.is_active === true);
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
    return websiteCustomizations.filter(c => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    });
  }, [websiteCustomizations, debouncedSearchQuery]);

  // Group customizations by name (since no customization_group column exists)
  const groupedCustomizations = useMemo(() => {
    const groups: Record<string, CustomizationBase[]> = {};
    
    filteredCustomizations.forEach(customization => {
      const groupName = customization.name || 'Other';
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

  // Open all accordion groups when modal opens and groups are computed
  useEffect(() => {
    if (isOpen && Object.keys(groupedCustomizations).length > 0) {
      setOpenAccordionItems(Object.keys(groupedCustomizations));
    }
  }, [isOpen, groupedCustomizations]);

  // Calculate base price
  const basePrice = useMemo(() => {
    if (variant) {
      return mode === 'delivery' 
        ? (variant.price_delivery ?? variant.price)
        : variant.price;
    } else {
      return mode === 'delivery'
        ? (item.price_delivery || item.price_takeaway || item.price || 0)
        : (item.price_takeaway || item.price || 0);
    }
  }, [item, variant, mode]);

  // Calculate total with customizations
  const totalPrice = useMemo(() => {
    const customizationsTotal = selectedCustomizations.reduce((sum, c) => sum + c.price, 0);
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
    return selectedCustomizations.reduce((sum, c) => sum + c.price, 0);
  }, [selectedCustomizations]);

  // Handle customization toggle
  const handleCustomizationToggle = (customization: CustomizationBase, checked: boolean) => {
    if (checked) {
      setSelectedCustomizations(prev => [
        ...prev,
        {
          id: customization.id,
          name: customization.name,
          price: customization.price ?? 0,
          group: customization.customization_group ?? undefined
        }
      ]);
    } else {
      setSelectedCustomizations(prev => 
        prev.filter(c => c.id !== customization.id)
      );
    }
  };

  // Handle quantity change
  const handleQuantityDecrease = () => {
    console.log('🔍 handleQuantityDecrease called');
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleQuantityIncrease = () => {
    console.log('🔍 handleQuantityIncrease called');
    setQuantity(quantity + 1);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (variant) {
      addToCart(item, quantity, variant, selectedCustomizations, specialInstructions);
    } else {
      // For items without variants, create a minimal variant object
      const price = mode === 'delivery' 
        ? (item.price_delivery || item.price_takeaway || item.price || 0)
        : (item.price_takeaway || item.price || 0);
      
      const defaultVariant: ItemVariant = {
        id: item.id || '',
        variant_name: item.name,
        name: item.name,
        price: price,
        is_active: true
      };
      
      addToCart(item, quantity, defaultVariant, selectedCustomizations, specialInstructions);
    }

    // Show success toast
    const variantName = variant ? ` (${variant.name})` : '';
    toast.success(`${item.name}${variantName} added to cart`, {
      description: `Quantity: ${quantity} • £${totalPrice.toFixed(2)}`
    });

    // Reset state (parent will handle closing via onClose)
    setQuantity(1);
    setSelectedCustomizations([]);
    setSpecialInstructions('');
    // Note: Removed onClose() call - parent component handles modal lifecycle
  };

  // Handle chip removal and jump to group
  const handleRemoveChip = (customizationId: string, groupName?: string) => {
    setSelectedCustomizations(prev => prev.filter(c => c.id !== customizationId));
    
    // Optionally expand the group if it's collapsed
    if (groupName && !openAccordionItems.includes(groupName)) {
      setOpenAccordionItems(prev => [...prev, groupName]);
    }
  };

  // Handle close
  const handleClose = () => {
    console.log('🔍 handleClose called');
    setQuantity(1);
    setSelectedCustomizations([]);
    setSpecialInstructions('');
    onClose();
    onModalClose?.();
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
        handleAddToCart();
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
        if (quantity > 1) handleQuantityDecrease();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        notesInputRef.current?.focus();
        break;
    }
  }, [quantity]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          borderColor: PremiumTheme.colors.burgundy[500],
          borderWidth: '2px',
          boxShadow: PremiumTheme.shadows.glow.tandoori,
          zIndex: 70 // ✅ Ensure modal appears above cart drawer (z-index 60)
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle 
            className="text-2xl font-semibold flex items-center gap-2"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            <UtensilsCrossed className="h-6 w-6" style={{ color: PremiumTheme.colors.burgundy[500] }} />
            Customise Your Order
          </DialogTitle>
          <DialogDescription 
            className="text-base"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            {item.name}
          </DialogDescription>
        </DialogHeader>

        {/* Variant Info & Price - Outside DialogHeader to avoid Radix Slot ref issues */}
        <div className="flex flex-col gap-3 -mt-2">
          {variant && (
            <div className="flex flex-col gap-2">
              <div 
                className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold w-fit"
                style={{
                  background: PremiumTheme.colors.burgundy[600],
                  color: PremiumTheme.colors.text.primary,
                  borderColor: PremiumTheme.colors.burgundy[500]
                }}
              >
                {variant.name}
              </div>
              {variant.description_override && (
                <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                  {variant.description_override}
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>Base Price:</span>
            <span className="text-lg font-bold" style={{ color: PremiumTheme.colors.gold[400] }}>£{basePrice.toFixed(2)}</span>
          </div>
          <Separator style={{ background: PremiumTheme.colors.dark[700] }} />
        </div>

        {/* Smart Search Bar */}
        <div className="pb-4">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
              style={{ color: PremiumTheme.colors.text.muted }}
            />
            <Input
              type="text"
              placeholder="Search add-ons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                background: PremiumTheme.colors.dark[850],
                borderColor: PremiumTheme.colors.dark[700],
                color: PremiumTheme.colors.text.primary
              }}
              aria-label="Search customizations"
            />
          </div>
          {debouncedSearchQuery && (
            <p className="text-xs mt-2" style={{ color: PremiumTheme.colors.text.muted }}>
              {Object.keys(groupedCustomizations).length} group(s) • {filteredCustomizations.length} option(s) found
            </p>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Customization Groups as Accordion */}
          {Object.keys(groupedCustomizations).length > 0 ? (
            <Accordion 
              type="multiple" 
              value={openAccordionItems}
              onValueChange={setOpenAccordionItems}
              className="space-y-3"
            >
              {Object.entries(groupedCustomizations).map(([groupName, items]) => {
                const groupSelectionCount = selectedCustomizations.filter(c => c.group === groupName).length;
                const hasExclusiveItems = items.some(item => item.is_exclusive);
                
                return (
                  <AccordionItem 
                    key={groupName} 
                    value={groupName}
                    className="border rounded-lg"
                    style={{
                      borderColor: PremiumTheme.colors.dark[700],
                      background: PremiumTheme.colors.dark[850]
                    }}
                  >
                    <AccordionTrigger 
                      className="px-4 hover:no-underline"
                      style={{ color: PremiumTheme.colors.text.primary }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <h3 
                          className="text-lg font-semibold"
                          style={{ color: PremiumTheme.colors.burgundy[400] }}
                        >
                          {groupName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{
                              borderColor: PremiumTheme.colors.burgundy[500],
                              color: PremiumTheme.colors.burgundy[400]
                            }}
                          >
                            {items.length} {items.length === 1 ? 'option' : 'options'}
                          </Badge>
                          {groupSelectionCount > 0 && (
                            <Badge 
                              className="text-xs"
                              style={{
                                background: PremiumTheme.colors.burgundy[600],
                                color: PremiumTheme.colors.text.primary
                              }}
                            >
                              {groupSelectionCount} selected
                            </Badge>
                          )}
                          {hasExclusiveItems && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      borderColor: PremiumTheme.colors.gold[500],
                                      color: PremiumTheme.colors.gold[400]
                                    }}
                                  >
                                    Choice
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent 
                                  className="bg-gray-900 text-white border-gray-700"
                                >
                                  Select one option from this group
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {hasExclusiveItems ? (
                        <RadioGroup
                          value={selectedCustomizations.find(c => c.group === groupName)?.id}
                          onValueChange={(value) => {
                            const customization = items.find(item => item.id === value);
                            if (customization) {
                              // Deselect all in this group first
                              setSelectedCustomizations(prev => prev.filter(c => c.group !== groupName));
                              // Select the new one
                              handleCustomizationToggle(customization, true);
                            }
                          }}
                          className="space-y-2 pt-2"
                        >
                          {items.map(customization => {
                            const isSelected = selectedCustomizations.some(c => c.id === customization.id);
                            const hasPrice = (customization.price ?? 0) > 0;
                            
                            return (
                              <motion.div
                                key={customization.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer min-h-[44px]",
                                  isSelected 
                                    ? "border-opacity-100" 
                                    : "border-opacity-30 hover:border-opacity-60"
                                )}
                                style={{
                                  background: isSelected 
                                    ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}40 0%, ${PremiumTheme.colors.dark[900]} 100%)`
                                    : PremiumTheme.colors.dark[850],
                                  borderColor: isSelected 
                                    ? PremiumTheme.colors.burgundy[500]
                                    : PremiumTheme.colors.dark[700]
                                }}
                                whileHover={{ scale: 1.01 }}
                                role="option"
                                aria-selected={isSelected}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <RadioGroupItem
                                    value={customization.id}
                                    className="data-[state=checked]:bg-[#8B1538] data-[state=checked]:border-[#8B1538]"
                                  />
                                  <Label
                                    htmlFor={customization.id}
                                    className="cursor-pointer font-medium flex-1"
                                    style={{ color: PremiumTheme.colors.text.primary }}
                                  >
                                    {customization.name}
                                    {customization.description && (
                                      <p className="text-sm mt-1" style={{ color: PremiumTheme.colors.text.muted }}>
                                        {customization.description}
                                      </p>
                                    )}
                                  </Label>
                                </div>
                                {hasPrice && (
                                  <span 
                                    className="text-sm font-semibold"
                                    style={{ color: PremiumTheme.colors.burgundy[400] }}
                                  >
                                    +£{customization.price?.toFixed(2)}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-2 pt-2">
                          {items.map(customization => {
                            const isSelected = selectedCustomizations.some(c => c.id === customization.id);
                            const hasPrice = (customization.price ?? 0) > 0;
                            
                            return (
                              <motion.div
                                key={customization.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer min-h-[44px]",
                                  isSelected 
                                    ? "border-opacity-100" 
                                    : "border-opacity-30 hover:border-opacity-60"
                                )}
                                style={{
                                  background: isSelected 
                                    ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}40 0%, ${PremiumTheme.colors.dark[900]} 100%)`
                                    : PremiumTheme.colors.dark[850],
                                  borderColor: isSelected 
                                    ? PremiumTheme.colors.burgundy[500]
                                    : PremiumTheme.colors.dark[700]
                                }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => handleCustomizationToggle(customization, !isSelected)}
                                role="option"
                                aria-selected={isSelected}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Checkbox
                                    id={customization.id}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => 
                                      handleCustomizationToggle(customization, checked as boolean)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="data-[state=checked]:bg-[#8B1538] data-[state=checked]:border-[#8B1538]"
                                  />
                                  <Label
                                    htmlFor={customization.id}
                                    className="cursor-pointer font-medium flex-1"
                                    style={{ color: PremiumTheme.colors.text.primary }}
                                  >
                                    {customization.name}
                                    {customization.description && (
                                      <p className="text-sm mt-1" style={{ color: PremiumTheme.colors.text.muted }}>
                                        {customization.description}
                                      </p>
                                    )}
                                  </Label>
                                </div>
                                {hasPrice && (
                                  <span 
                                    className="text-sm font-semibold"
                                    style={{ color: PremiumTheme.colors.burgundy[400] }}
                                  >
                                    +£{customization.price?.toFixed(2)}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div 
              className="text-center py-8"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              {searchQuery ? 'No add-ons found matching your search.' : 'No add-ons available for this item.'}
            </div>
          )}
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
                      background: PremiumTheme.colors.burgundy[600],
                      color: PremiumTheme.colors.text.primary
                    }}
                    onClick={() => handleRemoveChip(custom.id, custom.group)}
                  >
                    <span>{custom.name}</span>
                    {custom.price > 0 && (
                      <span className="text-xs">+£{custom.price.toFixed(2)}</span>
                    )}
                    <X className="h-3 w-3" />
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <Separator style={{ background: PremiumTheme.colors.dark[700] }} />

        {/* Footer - Quantity and Confirm */}
        <div className="space-y-4 pt-4">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm font-medium"
              style={{ color: PremiumTheme.colors.text.muted }}
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
                  borderColor: PremiumTheme.colors.dark[700],
                  background: PremiumTheme.colors.dark[850],
                  color: PremiumTheme.colors.text.primary,
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span 
                className="text-xl font-semibold w-12 text-center"
                style={{ color: PremiumTheme.colors.text.primary }}
                aria-live="polite"
              >
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleQuantityIncrease}
                style={{
                  borderColor: PremiumTheme.colors.dark[700],
                  background: PremiumTheme.colors.dark[850],
                  color: PremiumTheme.colors.text.primary,
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
              <span style={{ color: PremiumTheme.colors.text.muted }}>Base Price</span>
              <span style={{ color: PremiumTheme.colors.text.primary }}>£{basePrice.toFixed(2)}</span>
            </div>
            {selectedCustomizations.length > 0 && (
              <motion.div 
                className="flex items-center justify-between text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span style={{ color: PremiumTheme.colors.text.muted }}>Add-ons Subtotal ({selectedCustomizations.length})</span>
                <span style={{ color: PremiumTheme.colors.burgundy[400] }}>
                  +£{addOnsSubtotal.toFixed(2)}
                </span>
              </motion.div>
            )}
            {quantity > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: PremiumTheme.colors.text.muted }}>Quantity</span>
                <span style={{ color: PremiumTheme.colors.text.primary }}>× {quantity}</span>
              </div>
            )}
            <Separator style={{ background: PremiumTheme.colors.dark[700] }} />
            <motion.div 
              className="flex items-center justify-between text-lg font-semibold"
              key={totalPrice}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <span style={{ color: PremiumTheme.colors.text.primary }}>Total</span>
              <span style={{ color: PremiumTheme.colors.gold[400] }} aria-live="polite">£{totalPrice.toFixed(2)}</span>
            </motion.div>
          </div>

          {/* Enhanced tooltip for confirm button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleAddToCart}
                  className="w-full text-lg font-semibold py-6"
                  style={{
                    background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[500]} 100%)`,
                    color: PremiumTheme.colors.text.primary,
                    minHeight: '56px'
                  }}
                  aria-label="Add item to cart"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {editMode ? 'Save Changes' : 'Add to Cart'} • £{totalPrice.toFixed(2)}
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
