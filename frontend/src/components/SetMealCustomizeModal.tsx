import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Plus, Minus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { MenuItem, OrderItem, SetMeal } from 'utils/menuTypes';
import { globalColors } from 'utils/QSAIDesign';
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

interface SetMealItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  original_item_id: string;
  category_id?: string;
}

interface SetMealSubstitution {
  original_item_id: string;
  original_item_name: string;
  original_price: number;
  new_item_id: string;
  new_item_name: string;
  new_price: number;
  price_difference: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setMealItem: MenuItem & { 
    set_meal_data?: {
      individual_items_total: number;
      savings: number;
      items: SetMealItem[];
    };
    item_type?: string;
    price?: number;
  };
  onSave: (customizedOrderItem: OrderItem) => void;
}

/**
 * Specialized customization modal for Set Meals
 * Allows item substitutions with price difference calculations
 */
export function SetMealCustomizeModal({ isOpen, onClose, setMealItem, onSave }: Props) {
  // 🚀 SELECTIVE SUBSCRIPTIONS: Only subscribe to what we need
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const categories = useRealtimeMenuStore(state => state.categories, shallow);
  
  // Modal state
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [substitutions, setSubstitutions] = useState<SetMealSubstitution[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Calculate current items (original + substitutions)
  const getCurrentItems = (): SetMealItem[] => {
    if (!setMealItem.set_meal_data?.items) return [];
    
    return setMealItem.set_meal_data.items.map(originalItem => {
      const substitution = substitutions.find(sub => sub.original_item_id === originalItem.id);
      if (substitution) {
        return {
          ...originalItem,
          id: substitution.new_item_id,
          name: substitution.new_item_name,
          price: substitution.new_price
        };
      }
      return originalItem;
    });
  };
  
  // Calculate total price adjustments
  const getTotalPriceAdjustment = (): number => {
    return substitutions.reduce((total, sub) => total + sub.price_difference, 0);
  };
  
  // Calculate final total
  const getFinalTotal = (): number => {
    const basePrice = setMealItem.price || 0;
    const adjustments = getTotalPriceAdjustment();
    return (basePrice + adjustments) * quantity;
  };
  
  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      setSubstitutions([]);
      setShowItemSelector(false);
      setReplacingItemId(null);
      setSelectedCategory(null);
    }
  }, [isOpen]);
  
  // Handle item replacement
  const handleReplaceItem = (originalItemId: string) => {
    setReplacingItemId(originalItemId);
    setSelectedCategory(null);
    setShowItemSelector(true);
  };
  
  // Handle new item selection
  const handleSelectNewItem = (newItem: MenuItem) => {
    if (!replacingItemId || !setMealItem.set_meal_data?.items) return;
    
    const originalItem = setMealItem.set_meal_data.items.find(item => item.id === replacingItemId);
    if (!originalItem) return;
    
    const priceDifference = newItem.price - originalItem.price;
    
    const newSubstitution: SetMealSubstitution = {
      original_item_id: originalItem.id,
      original_item_name: originalItem.name,
      original_price: originalItem.price,
      new_item_id: newItem.id,
      new_item_name: newItem.name,
      new_price: newItem.price,
      price_difference: priceDifference
    };
    
    // Update substitutions
    setSubstitutions(prev => {
      const filtered = prev.filter(sub => sub.original_item_id !== replacingItemId);
      return [...filtered, newSubstitution];
    });
    
    setShowItemSelector(false);
    setReplacingItemId(null);
    
    if (priceDifference > 0) {
      toast.success(`Item replaced (+£${priceDifference.toFixed(2)})`);
    } else if (priceDifference < 0) {
      toast.success(`Item replaced (-£${Math.abs(priceDifference).toFixed(2)})`);
    } else {
      toast.success('Item replaced (no price change)');
    }
  };
  
  // Remove substitution (revert to original)
  const handleRevertSubstitution = (originalItemId: string) => {
    setSubstitutions(prev => prev.filter(sub => sub.original_item_id !== originalItemId));
    toast.info('Reverted to original item');
  };
  
  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };
  
  // Handle save
  const handleSave = () => {
    const finalPrice = getFinalTotal();
    const priceAdjustment = getTotalPriceAdjustment();
    
    const orderItem: OrderItem = {
      id: `setmeal_${setMealItem.id}_${Date.now()}`,
      menu_item_id: setMealItem.id,
      name: setMealItem.name,
      quantity,
      price: finalPrice / quantity, // Price per unit
      notes,
      variant_id: '',
      variantName: '',
      protein_type: '',
      modifiers: [],
      // Set meal specific data
      item_type: 'set_meal',
      set_meal_data: {
        ...setMealItem.set_meal_data,
        substitutions,
        price_adjustment: priceAdjustment,
        final_unit_price: finalPrice / quantity
      }
    };
    
    onSave(orderItem);
    onClose();
  };
  
  // Get filtered menu items for replacement
  const getReplacementItems = (): MenuItem[] => {
    if (!selectedCategory) return [];
    return menuItems.filter(item => 
      item.category_id === selectedCategory && 
      item.active &&
      item.id !== replacingItemId
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{
        backgroundColor: '#1F1F1F', // Same as EditOrderItemModal
        border: `1px solid ${globalColors.purple.primaryTransparent}40`,
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(91, 33, 182, 0.15)`,
        borderRadius: '12px'
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center" style={{
            color: globalColors.text.primary,
            backgroundImage: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {showItemSelector ? (
              <><ArrowLeft className="h-5 w-5 mr-2" onClick={() => setShowItemSelector(false)} style={{ cursor: 'pointer', color: globalColors.purple.primary }} /> Select Replacement Item</>
            ) : (
              <>🍽️ Customize {setMealItem.name}</>
            )}
          </DialogTitle>
          {!showItemSelector && (
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm" style={{ color: '#A78BFA' }}>
                Base Price: £{(setMealItem.price || 0).toFixed(2)}
              </span>
              {getTotalPriceAdjustment() !== 0 && (
                <span className="text-sm font-medium" style={{
                  color: getTotalPriceAdjustment() > 0 ? globalColors.purple.primary : '#10B981'
                }}>
                  {getTotalPriceAdjustment() > 0 ? '+' : ''}£{getTotalPriceAdjustment().toFixed(2)} adjustments
                </span>
              )}
              <span className="text-lg font-bold" style={{ 
                color: '#FFFFFF',
                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
              }}>
                Total: £{getFinalTotal().toFixed(2)}
              </span>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {!showItemSelector ? (
            // Main customization view
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Items (2/3 width) */}
              <div className="lg:col-span-2">
                <Card className="p-5" style={{
                  backgroundColor: globalColors.background.tertiary,
                  border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                  borderRadius: '10px'
                }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#A78BFA' }}>
                    Items in Set Meal
                  </h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {getCurrentItems().map((item) => {
                        const substitution = substitutions.find(sub => sub.original_item_id === item.original_item_id || sub.new_item_id === item.id);
                        const isSubstituted = !!substitution;
                        
                        return (
                          <motion.div
                            key={item.original_item_id}
                            whileHover={{ scale: 1.01 }}
                            className="p-4 rounded-lg border transition-all duration-200"
                            style={{
                              backgroundColor: isSubstituted ? `rgba(91, 33, 182, 0.25)` : globalColors.background.primary,
                              borderColor: isSubstituted ? globalColors.purple.primary : `rgba(91, 33, 182, 0.3)`,
                              borderWidth: isSubstituted ? '2px' : '1px',
                              boxShadow: isSubstituted ? `0 0 12px rgba(91, 33, 182, 0.2)` : '0 2px 8px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {isSubstituted && substitution && (
                                    <span className="text-sm line-through" style={{ color: globalColors.text.muted }}>
                                      {substitution.original_item_name}
                                    </span>
                                  )}
                                  <span className="font-medium" style={{
                                    color: isSubstituted ? globalColors.purple.light : globalColors.text.primary
                                  }}>
                                    {item.name}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm" style={{ color: globalColors.text.secondary }}>
                                    Qty: {item.quantity} × £{item.price.toFixed(2)}
                                  </span>
                                  {isSubstituted && substitution && substitution.price_difference !== 0 && (
                                    <span className="text-sm font-medium" style={{
                                      color: substitution.price_difference > 0 ? globalColors.purple.primary : '#10B981'
                                    }}>
                                      ({substitution.price_difference > 0 ? '+' : ''}£{substitution.price_difference.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isSubstituted ? (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRevertSubstitution(item.original_item_id)}
                                      className="text-xs"
                                      style={{
                                        borderColor: globalColors.purple.primary,
                                        color: globalColors.purple.primary,
                                        backgroundColor: `${globalColors.purple.primaryTransparent}10`
                                      }}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Revert
                                    </Button>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleReplaceItem(item.id)}
                                      className="text-xs"
                                      style={{
                                        borderColor: globalColors.purple.primary,
                                        color: globalColors.purple.primary,
                                        backgroundColor: `rgba(91, 33, 182, 0.1)`
                                      }}
                                    >
                                      Change
                                    </Button>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
              
              {/* Right Panel - Order Controls (1/3 width) */}
              <div className="space-y-6">
                {/* Quantity Control */}
                <Card className="p-5" style={{
                  backgroundColor: globalColors.background.tertiary,
                  border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                  borderRadius: '10px'
                }}>
                  <h4 className="font-semibold mb-4 text-lg" style={{ color: '#A78BFA' }}>Quantity</h4>
                  <div className="flex items-center space-x-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="h-10 w-10 p-0"
                        style={{
                          borderColor: globalColors.purple.primary,
                          color: globalColors.purple.primary,
                          backgroundColor: `${globalColors.purple.primaryTransparent}10`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-24 text-center text-lg font-semibold"
                      min="1"
                      style={{
                        backgroundColor: globalColors.background.primary,
                        borderColor: globalColors.purple.primary,
                        color: globalColors.text.primary,
                        borderWidth: '2px'
                      }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="h-10 w-10 p-0"
                        style={{
                          borderColor: globalColors.purple.primary,
                          color: globalColors.purple.primary,
                          backgroundColor: `${globalColors.purple.primaryTransparent}10`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </Card>
                
                {/* Special Instructions */}
                <Card className="p-5" style={{
                  backgroundColor: globalColors.background.tertiary,
                  border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                  borderRadius: '10px'
                }}>
                  <h4 className="font-semibold mb-4 text-lg" style={{ color: '#A78BFA' }}>Special Instructions</h4>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests..."
                    className="min-h-[80px] resize-none"
                    style={{
                      backgroundColor: globalColors.background.primary,
                      borderColor: globalColors.purple.primary,
                      color: globalColors.text.primary,
                      borderWidth: '2px'
                    }}
                  />
                </Card>
                
                {/* Price Summary */}
                <Card className="p-5" style={{
                  backgroundColor: globalColors.background.tertiary,
                  border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                  borderRadius: '10px'
                }}>
                  <h4 className="font-semibold mb-4 text-lg" style={{ color: '#A78BFA' }}>Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: globalColors.text.secondary }}>Base Price:</span>
                      <span style={{ color: globalColors.text.primary }}>£{(setMealItem.price || 0).toFixed(2)}</span>
                    </div>
                    {getTotalPriceAdjustment() !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: globalColors.text.secondary }}>Adjustments:</span>
                        <span style={{
                          color: getTotalPriceAdjustment() > 0 ? globalColors.purple.primary : '#10B981'
                        }}>
                          {getTotalPriceAdjustment() > 0 ? '+' : ''}£{getTotalPriceAdjustment().toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span style={{ color: globalColors.text.secondary }}>Quantity:</span>
                      <span style={{ color: globalColors.text.primary }}>×{quantity}</span>
                    </div>
                    <Separator style={{ 
                      backgroundColor: `${globalColors.purple.primaryTransparent}30`,
                      height: '2px',
                      margin: '12px 0'
                    }} />
                    <div className="flex justify-between font-semibold text-lg" style={{
                      color: '#FFFFFF',
                      textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                    }}>
                      <span>Total:</span>
                      <span>£{getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleSave}
                      className="w-full py-3 text-lg font-semibold"
                      style={{
                        backgroundColor: globalColors.purple.primary,
                        color: 'white',
                        border: 'none',
                        boxShadow: `0 4px 20px ${globalColors.purple.glow}40`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Add to Order
                    </Button>
                  </motion.div>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full py-3"
                    style={{
                      borderColor: globalColors.purple.primary,
                      color: globalColors.purple.primary,
                      backgroundColor: 'transparent'
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Item selector view
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[500px]">
              {/* Categories */}
              <Card className="p-4" style={{
                backgroundColor: globalColors.background.tertiary,
                border: `1px solid ${globalColors.purple.primaryTransparent}30`,
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                borderRadius: '10px'
              }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#A78BFA' }}>
                  Categories
                </h3>
                <ScrollArea className="h-[420px]">
                  <div className="space-y-1">
                    {categories.filter(cat => cat.active).map((category) => (
                      <motion.div
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className="w-full justify-start text-left"
                          style={{
                            backgroundColor: selectedCategory === category.id ? globalColors.purple.primary : 'transparent',
                            color: selectedCategory === category.id ? 'white' : globalColors.text.primary,
                            borderColor: selectedCategory === category.id ? globalColors.purple.primary : 'transparent'
                          }}
                        >
                          {category.name}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
              
              {/* Menu Items */}
              <div className="md:col-span-3">
                <Card className="p-4 h-full" style={{
                  backgroundColor: globalColors.background.tertiary,
                  border: `1px solid rgba(91, 33, 182, 0.3)`,
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
                  borderRadius: '10px'
                }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: '#A78BFA' }}>
                    Select Replacement Item
                  </h3>
                  <ScrollArea className="h-[420px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getReplacementItems().map((item) => {
                        const originalItem = setMealItem.set_meal_data?.items.find(i => i.id === replacingItemId);
                        const priceDifference = originalItem ? item.price - originalItem.price : 0;
                        
                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: `0 8px 25px ${globalColors.purple.glow}30`
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="p-3 rounded-lg border cursor-pointer transition-all duration-200"
                            style={{
                              backgroundColor: globalColors.background.primary,
                              borderColor: `rgba(91, 33, 182, 0.3)`,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                            }}
                            onClick={() => handleSelectNewItem(item)}
                          >
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm" style={{ color: globalColors.text.primary }}>
                                {item.name}
                              </h4>
                              <div className="flex justify-between items-center">
                                <span className="text-sm" style={{ color: globalColors.text.secondary }}>
                                  £{item.price.toFixed(2)}
                                </span>
                                {priceDifference !== 0 && (
                                  <span className="text-xs font-medium px-2 py-1 rounded" style={{
                                    color: priceDifference > 0 ? globalColors.purple.primary : '#10B981',
                                    backgroundColor: priceDifference > 0 ? `${globalColors.purple.primaryTransparent}20` : 'rgba(16, 185, 129, 0.2)'
                                  }}>
                                    {priceDifference > 0 ? '+' : ''}£{priceDifference.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
