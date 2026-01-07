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
import { MenuItem, ItemVariant, CustomizationBase, SelectedCustomization } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import { globalColors } from '../utils/QSAIDesign';
import { apiClient } from 'app';
import type { OrderItem } from 'utils/menuTypes';

interface StaffCustomizationModalProps {
  item: MenuItem;
  variant?: ItemVariant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, quantity: number, variant?: ItemVariant | null, customizations?: SelectedCustomization[], notes?: string) => void;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  initialQuantity?: number;
  existingCustomizations?: SelectedCustomization[];
  existingNotes?: string;
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
  initialQuantity = 1,
  existingCustomizations = [],
  existingNotes = ''
}: StaffCustomizationModalProps) {
  const { customizations } = useRealtimeMenuStore();
  
  // ✅ DETECT EDIT MODE: If existing customizations or notes provided, we're editing
  const isEditMode = existingCustomizations.length > 0 || existingNotes !== '';
  
  // ✅ PRICE ENRICHMENT: Cross-reference existing customizations with menu data to populate prices
  // This runs once when props change, doesn't cause re-renders during editing
  const enrichedExistingCustomizations = useMemo(() => {
    if (!existingCustomizations || existingCustomizations.length === 0) {
      return [];
    }
    
    return existingCustomizations.map(existing => {
      // Find matching customization in menu data
      const menuCustomization = customizations.find(c => c.id === existing.id);
      
      // If found and has price, use it; otherwise keep existing price
      return {
        ...existing,
        price: menuCustomization?.price ?? existing.price
      };
    });
  }, [existingCustomizations, customizations]);
  
  // State
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedCustomizations, setSelectedCustomizations] = useState<SelectedCustomization[]>(enrichedExistingCustomizations);
  const [specialInstructions, setSpecialInstructions] = useState(existingNotes);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
  const [prevTotal, setPrevTotal] = useState(0);
  const notesInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Update quantity when initialQuantity changes
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  // ✅ SINGLE INITIALIZATION: Load existing data ONCE when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');  // Always reset search
      // Initialize from enriched data (has prices from menu)
      setSelectedCustomizations(enrichedExistingCustomizations);
      setSpecialInstructions(existingNotes || '');
    }
  }, [isOpen]); // ✅ ONLY watch isOpen - prevents re-initialization during editing

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

  // Open all accordion groups when modal opens and groups are computed
  useEffect(() => {
    if (isOpen && Object.keys(groupedCustomizations).length > 0) {
      setOpenAccordionItems(Object.keys(groupedCustomizations));
    }
  }, [isOpen, groupedCustomizations]);

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
      const newItem = {
        id: customization.id,
        name: customization.name,
        price: customization.price ?? 0,
        group: customization.customization_group ?? undefined
      };
      
      setSelectedCustomizations(prev => {
        const updated = [...prev, newItem];
        return updated;
      });
    } else {
      setSelectedCustomizations(prev => {
        const updated = prev.filter(c => c.id !== customization.id);
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

  // Handle chip removal and jump to group
  const handleRemoveChip = (customizationId: string, groupName?: string) => {
    setSelectedCustomizations(prev => prev.filter(c => c.id !== customizationId));
    
    // Optionally expand the group if it's collapsed
    if (groupName && !openAccordionItems.includes(groupName)) {
      setOpenAccordionItems(prev => [...prev, groupName]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
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
              placeholder="Search add-ons..."
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
                      borderColor: POS_THEME.border,
                      background: POS_THEME.backgroundLight
                    }}
                  >
                    <AccordionTrigger 
                      className="px-4 hover:no-underline"
                      style={{ color: POS_THEME.text }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <h3 
                          className="text-lg font-semibold"
                          style={{ color: POS_THEME.primary }}
                        >
                          {groupName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{
                              borderColor: POS_THEME.primary,
                              color: POS_THEME.primary
                            }}
                          >
                            {items.length} {items.length === 1 ? 'option' : 'options'}
                          </Badge>
                          {groupSelectionCount > 0 && (
                            <Badge 
                              className="text-xs"
                              style={{
                                background: POS_THEME.success,
                                color: POS_THEME.text
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
                                      borderColor: POS_THEME.primaryLight,
                                      color: POS_THEME.primaryLight
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
                                    ? `linear-gradient(135deg, ${POS_THEME.primary}40 0%, ${POS_THEME.background} 100%)`
                                    : POS_THEME.backgroundLight,
                                  borderColor: isSelected 
                                    ? POS_THEME.primary
                                    : POS_THEME.border
                                }}
                                whileHover={{ scale: 1.01 }}
                                role="option"
                                aria-selected={isSelected}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <RadioGroupItem
                                    value={customization.id}
                                    className="data-[state=checked]:bg-[#7C5DFA] data-[state=checked]:border-[#7C5DFA]"
                                  />
                                  <Label
                                    htmlFor={customization.id}
                                    className="cursor-pointer font-medium flex-1"
                                    style={{ color: POS_THEME.text }}
                                  >
                                    {customization.name}
                                    {customization.description && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="ml-2 inline-flex">
                                              <Info className="h-3 w-3" style={{ color: POS_THEME.textMuted }} />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-gray-900 text-white border-gray-700">
                                            {customization.description}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </Label>
                                </div>
                                {hasPrice && (
                                  <span 
                                    className="text-sm font-semibold"
                                    style={{ color: POS_THEME.primary }}
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
                                    ? `linear-gradient(135deg, ${POS_THEME.primary}40 0%, ${POS_THEME.background} 100%)`
                                    : POS_THEME.backgroundLight,
                                  borderColor: isSelected 
                                    ? POS_THEME.primary
                                    : POS_THEME.border
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
                                    onCheckedChange={(checked) => {
                                      handleCustomizationToggle(customization, checked as boolean);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="data-[state=checked]:bg-[#7C5DFA] data-[state=checked]:border-[#7C5DFA]"
                                  />
                                  <Label
                                    htmlFor={customization.id}
                                    className="cursor-pointer font-medium flex-1"
                                    style={{ color: POS_THEME.text }}
                                  >
                                    {customization.name}
                                    {customization.description && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="ml-2 inline-flex">
                                              <Info className="h-3 w-3" style={{ color: POS_THEME.textMuted }} />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-gray-900 text-white border-gray-700">
                                            {customization.description}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </Label>
                                </div>
                                {hasPrice && (
                                  <span 
                                    className="text-sm font-semibold"
                                    style={{ color: POS_THEME.primary }}
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
              style={{ color: POS_THEME.textMuted }}
            >
              {searchQuery ? 'No add-ons found matching your search.' : 'No add-ons available for this item.'}
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
                  {isEditMode ? 'Update' : 'Add to Order'} • £{totalPrice.toFixed(2)}
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
