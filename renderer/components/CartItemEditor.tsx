import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CartItem, CartCustomization } from '../utils/cartStore';
import { PremiumTheme } from '../utils/premiumTheme';

interface CartItemEditorProps {
  item: CartItem;
  availableVariants?: any[]; // Variants for this menu item
  availableCustomizations?: any[]; // Available customizations from menu
  onSave: (updates: Partial<Pick<CartItem, 'variant' | 'customizations' | 'quantity' | 'notes'>>) => void;
  onCancel: () => void;
}

export const CartItemEditor: React.FC<CartItemEditorProps> = ({
  item,
  availableVariants = [],
  availableCustomizations = [],
  onSave,
  onCancel,
}) => {
  // Local state for editing
  const [selectedVariant, setSelectedVariant] = useState(item.variant);
  const [selectedCustomizations, setSelectedCustomizations] = useState<CartCustomization[]>(
    item.customizations || []
  );
  const [notes, setNotes] = useState(item.notes || '');
  const [quantity, setQuantity] = useState(item.quantity);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);

  // Check if anything changed
  const hasChanges = () => {
    const variantChanged = selectedVariant?.id !== item.variant?.id;
    const customizationsChanged = JSON.stringify(selectedCustomizations) !== JSON.stringify(item.customizations || []);
    const notesChanged = notes !== (item.notes || '');
    const quantityChanged = quantity !== item.quantity;
    return variantChanged || customizationsChanged || notesChanged || quantityChanged;
  };

  // Handle customization toggle
  const toggleCustomization = (customization: any) => {
    const exists = selectedCustomizations.find(c => c.id === customization.id);
    if (exists) {
      setSelectedCustomizations(prev => prev.filter(c => c.id !== customization.id));
    } else {
      setSelectedCustomizations(prev => [
        ...prev,
        {
          id: customization.id,
          name: customization.name,
          price: customization.price || 0,
          group: customization.group
        }
      ]);
    }
  };

  // Handle save
  const handleSave = () => {
    if (!hasChanges()) {
      onCancel();
      return;
    }

    onSave({
      variant: selectedVariant,
      customizations: selectedCustomizations,
      notes,
      quantity
    });
  };

  // Calculate total with customizations
  const calculateTotal = () => {
    const basePrice = selectedVariant?.price ?? item.price;
    const customizationsTotal = selectedCustomizations.reduce((sum, c) => sum + c.price, 0);
    return (basePrice + customizationsTotal) * quantity;
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="px-4 py-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
        {/* Variant Selector (if multiple variants available) */}
        {availableVariants.length > 1 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">Variant</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white hover:border-gray-500 transition-colors"
              >
                <span className="text-sm">
                  {selectedVariant?.variant_name || selectedVariant?.name || 'Select variant'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {showVariantDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {availableVariants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(variant);
                          setShowVariantDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 transition-colors ${
                          selectedVariant?.id === variant.id ? 'bg-gray-800 text-white' : 'text-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{variant.variant_name || variant.name}</span>
                          <span className="text-green-400 font-medium">£{variant.price?.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Customizations (if available) */}
        {availableCustomizations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">Customizations</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableCustomizations.map((customization) => {
                const isSelected = selectedCustomizations.some(c => c.id === customization.id);
                return (
                  <div
                    key={customization.id}
                    className="flex items-center space-x-2 p-2 bg-gray-900 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <Checkbox
                      id={`custom-${customization.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleCustomization(customization)}
                      className="border-gray-500"
                    />
                    <label
                      htmlFor={`custom-${customization.id}`}
                      className="flex-1 flex justify-between items-center cursor-pointer text-sm"
                    >
                      <span className="text-gray-300">{customization.name}</span>
                      {customization.price > 0 && (
                        <span className="text-green-400 font-medium">+£{customization.price.toFixed(2)}</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Stepper */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">Quantity</Label>
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-9 w-9 p-0 border-gray-600 hover:bg-gray-800"
            >
              -
            </Button>
            <span className="text-white font-semibold text-lg min-w-[2rem] text-center">
              {quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
              className="h-9 w-9 p-0 border-gray-600 hover:bg-gray-800"
            >
              +
            </Button>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-300">Special Instructions</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Extra spicy, no onions..."
            className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 resize-none"
            rows={3}
            maxLength={200}
          />
          <div className="text-xs text-gray-500 text-right">
            {notes.length}/200
          </div>
        </div>

        {/* Price Preview */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
          <span className="text-sm text-gray-400">Item Total:</span>
          <span className="text-lg font-bold text-green-400">
            £{calculateTotal().toFixed(2)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-gray-600 hover:bg-gray-800"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: hasChanges() ? PremiumTheme.colors.burgundy[500] : undefined,
            }}
          >
            <Check className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
