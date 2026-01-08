


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Settings } from 'lucide-react';

// Shadcn Components  
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Local Components
import { EditOrderItemModal } from './EditOrderItemModal';

// Utils and Types
import { MenuItem, OrderItem, ItemVariant } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  variants: ItemVariant[];
  onAddToOrder: (orderItem: OrderItem) => void;
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
}

type WorkflowStep = 'select-variant' | 'select-quantity' | 'customize-portions';

interface PortionCustomization {
  portionIndex: number;
  quantity: number;
  customizations: any[];
  notes: string;
}

/**
 * MultiCustomModal - Allows ordering multiple quantities of the same item with different customizations
 * Flow: Variant Selection → Quantity Selection → Individual Portion Customization → Add to Order
 */
export function MultiCustomModal({ isOpen, onClose, item, variants, onAddToOrder, orderType }: Props) {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select-variant');
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [portionCustomizations, setPortionCustomizations] = useState<PortionCustomization[]>([]);
  
  // Modal states
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [currentPortionIndex, setCurrentPortionIndex] = useState(0);
  const [tempOrderItem, setTempOrderItem] = useState<OrderItem | null>(null);

  // Utility functions
  const generateOrderItemId = () => `multi_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const getVariantDisplayName = (variant: ItemVariant): string => {
    return variant.variant_name || variant.name || `${item.name} ${variant.protein_type_name || ''}`;
  };
  
  const getVariantPrice = (variant: ItemVariant): number => {
    switch (orderType) {
      case 'DINE-IN':
        return variant.price_dine_in ?? variant.price;
      case 'DELIVERY':
        return variant.price_delivery ?? variant.price;
      default:
        return variant.price;
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select-variant');
      setSelectedVariant(null);
      setTotalQuantity(1);
      setPortionCustomizations([]);
    }
  }, [isOpen]);

  // Initialize portion customizations when quantity changes
  useEffect(() => {
    if (totalQuantity > 0) {
      const newPortions: PortionCustomization[] = [];
      for (let i = 0; i < totalQuantity; i++) {
        newPortions.push({
          portionIndex: i,
          quantity: 1,
          customizations: [],
          notes: ''
        });
      }
      setPortionCustomizations(newPortions);
    }
  }, [totalQuantity]);

  // Handle variant selection
  const handleSelectVariant = (variant: ItemVariant) => {
    setSelectedVariant(variant);
    setCurrentStep('select-quantity');
  };

  // Handle "Other Custom" selection
  const handleSelectOtherCustom = () => {
    // For "Other Custom", we'll create a temporary variant
    const otherVariant: ItemVariant = {
      id: 'other-custom',
      menu_item_id: item.id,
      protein_type_id: null,
      protein_type_name: 'Custom',
      name: 'Other Custom',
      variant_name: `${item.name} (Other Custom)`,
      price: variants[0]?.price || 0, // Use first variant's price as base
      price_dine_in: variants[0]?.price_dine_in || null,
      price_delivery: variants[0]?.price_delivery || null,
      is_default: false
    };
    
    setSelectedVariant(otherVariant);
    setCurrentStep('select-quantity');
  };

  // Handle quantity confirmation
  const handleConfirmQuantity = () => {
    setCurrentStep('customize-portions');
  };

  // Handle portion customization
  const handleCustomizePortion = (portionIndex: number) => {
    if (!selectedVariant) return;
    
    // Create a temporary order item for customization
    const basePrice = getVariantPrice(selectedVariant);
    const tempItem: OrderItem = {
      id: generateOrderItemId(),
      menu_item_id: item.id,
      variant_id: selectedVariant.id,
      name: item.name,
      quantity: 1,
      price: basePrice,
      variantName: getVariantDisplayName(selectedVariant),
      notes: '',
      modifiers: [],
      customizations: []
    };
    
    setTempOrderItem(tempItem);
    setCurrentPortionIndex(portionIndex);
    setShowCustomizeModal(true);
  };

  // Handle customization save
  const handleSaveCustomization = (customizedItem: OrderItem) => {
    // Update the portion customization
    const updatedPortions = [...portionCustomizations];
    updatedPortions[currentPortionIndex] = {
      ...updatedPortions[currentPortionIndex],
      customizations: customizedItem.customizations || [],
      notes: customizedItem.notes || ''
    };
    setPortionCustomizations(updatedPortions);
    
    setShowCustomizeModal(false);
    setTempOrderItem(null);
  };

  // Handle final add to order
  const handleAddAllToOrder = () => {
    if (!selectedVariant) return;
    
    // Create separate order items for each portion
    portionCustomizations.forEach((portion, index) => {
      const basePrice = getVariantPrice(selectedVariant);
      
      // Calculate price with customizations
      const customizationPrice = portion.customizations.reduce((total, customization) => {
        return total + (customization.price_adjustment || 0);
      }, 0);
      
      const orderItem: OrderItem = {
        id: generateOrderItemId(),
        menu_item_id: item.id,
        variant_id: selectedVariant.id,
        name: item.name,
        quantity: 1, // Each portion is quantity 1
        price: basePrice + customizationPrice,
        variantName: getVariantDisplayName(selectedVariant),
        notes: portion.notes,
        modifiers: [],
        customizations: portion.customizations,
        image_url: item.image_url // Add image URL for thumbnail display
      };
      
      onAddToOrder(orderItem);
    });
    
    onClose();
  };

  // Check if all portions are customized
  const allPortionsCustomized = portionCustomizations.length > 0 && 
    portionCustomizations.every(portion => portion.customizations.length > 0 || portion.notes.length > 0);

  // Helper function to format customizations for display
  const formatCustomizations = (customizations: any[], notes: string): string => {
    const parts: string[] = [];
    
    // Add customization names
    if (customizations && customizations.length > 0) {
      const customizationNames = customizations.map(c => c.name).join(', ');
      parts.push(customizationNames);
    }
    
    // Add notes if present
    if (notes && notes.trim()) {
      parts.push(`📝 "${notes.trim()}"`);
    }
    
    return parts.join(' | ');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/20 text-white">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl text-white font-semibold">
              🔧 Multi-Custom: {item.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Step 1: Variant Selection */}
            {currentStep === 'select-variant' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">Choose Variant to Customize</h3>
                <div className="grid gap-3">
                  {variants.map((variant) => (
                    <Card 
                      key={variant.id}
                      className="cursor-pointer bg-black/40 backdrop-blur-sm border border-white/20 hover:bg-black/60 hover:border-violet-400/50 transition-all duration-300"
                      onClick={() => handleSelectVariant(variant)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🔧</span>
                            <span className="font-medium text-white">{getVariantDisplayName(variant)}</span>
                          </div>
                          <Badge variant="outline" className="border-violet-400/50 text-violet-200 bg-violet-900/30">
                            £{getVariantPrice(variant).toFixed(2)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Other Custom Option */}
                  <Card 
                    className="cursor-pointer bg-black/40 backdrop-blur-sm border border-dashed border-white/30 hover:bg-black/60 hover:border-violet-400/50 transition-all duration-300"
                    onClick={handleSelectOtherCustom}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔧</span>
                          <span className="font-medium text-white">Other Custom</span>
                        </div>
                        <Badge variant="outline" className="border-amber-400/50 text-amber-200 bg-amber-900/30">Custom</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 2: Quantity Selection */}
            {currentStep === 'select-quantity' && selectedVariant && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentStep('select-variant')}
                    className="text-violet-200 hover:text-white hover:bg-violet-900/30"
                  >
                    ← Back
                  </Button>
                </div>
                
                <h3 className="text-lg font-semibold text-white">
                  How many portions of {getVariantDisplayName(selectedVariant)}?
                </h3>
                
                <div className="flex items-center gap-4">
                  <Label htmlFor="quantity" className="text-white">Quantity:</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTotalQuantity(Math.max(1, totalQuantity - 1))}
                      className="border-white/20 text-white hover:bg-violet-900/30 hover:border-violet-400/50"
                    >
                      -
                    </Button>
                    <Input 
                      id="quantity"
                      type="number" 
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center bg-black/40 border-white/20 text-white focus:border-violet-400/50"
                      min="1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setTotalQuantity(totalQuantity + 1)}
                      className="border-white/20 text-white hover:bg-violet-900/30 hover:border-violet-400/50"
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleConfirmQuantity} 
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                >
                  Continue to Customize Portions
                </Button>
              </motion.div>
            )}

            {/* Step 3: Customize Individual Portions */}
            {currentStep === 'customize-portions' && selectedVariant && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentStep('select-quantity')}
                    className="text-violet-200 hover:text-white hover:bg-violet-900/30"
                  >
                    ← Back
                  </Button>
                </div>
                
                <h3 className="text-lg font-semibold text-white">
                  Customize Each Portion ({getVariantDisplayName(selectedVariant)})
                </h3>
                
                <div className="space-y-3">
                  {portionCustomizations.map((portion, index) => (
                    <Card key={index} className="bg-black/40 backdrop-blur-sm border border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{getVariantDisplayName(selectedVariant)} {index + 1} (1x)</h4>
                            {(portion.customizations.length > 0 || portion.notes) && (
                              <p className="text-sm text-violet-200 mt-1">
                                {formatCustomizations(portion.customizations, portion.notes)}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant={portion.customizations.length > 0 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCustomizePortion(index)}
                            className={portion.customizations.length > 0 
                              ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                              : "border-white/20 text-white hover:bg-violet-900/30 hover:border-violet-400/50"
                            }
                          >
                            🔧 {portion.customizations.length > 0 ? 'Edit' : 'Customize'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter className="border-t border-white/10 pt-4">
            {currentStep === 'customize-portions' && (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-white/20 text-white hover:bg-gray-800/50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddAllToOrder}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add {totalQuantity} Item{totalQuantity > 1 ? 's' : ''} to Order
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customization Modal */}
      <EditOrderItemModal
        isOpen={showCustomizeModal}
        orderItem={tempOrderItem}
        onClose={() => {
          setShowCustomizeModal(false);
          setTempOrderItem(null);
        }}
        onSave={handleSaveCustomization}
      />
    </>
  );
}
