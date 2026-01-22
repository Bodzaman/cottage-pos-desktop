import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Plus, Minus, X, DollarSign, Info } from 'lucide-react';
import { OrderItem, CustomizationSelection } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { globalColors } from '../utils/QSAIDesign';
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

interface EditOrderItemModalProps {
  isOpen: boolean;
  orderItem: OrderItem | null;
  onClose: () => void;
  onSave: (updatedItem: OrderItem) => void;
}

export function EditOrderItemModal({ isOpen, orderItem, onClose, onSave }: EditOrderItemModalProps) {
  
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedCustomizations, setSelectedCustomizations] = useState<CustomizationSelection[]>([]);
  const [basePrice, setBasePrice] = useState(0);
  
  // 🚀 SELECTIVE SUBSCRIPTIONS: Only subscribe to what we need
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const customizations = useRealtimeMenuStore(state => state.customizations, shallow);
  
  // Find the menu item to get available customizations
  const menuItem = menuItems.find(item => item.id === orderItem?.menu_item_id);
  
  // Get available customizations for this item
  const availableCustomizations = customizations.filter(customization => {
    if (!customization.is_active) return false;
    if (!customization.show_on_pos) return false;
    
    // Check if customization is global or specific to this item
    if (customization.is_global) return true;
    if (customization.item_ids && orderItem?.menu_item_id) {
      return customization.item_ids.includes(orderItem.menu_item_id);
    }
    return false;
  });
  
  // Group customizations by category
  const customizationGroups = availableCustomizations.reduce((groups, customization) => {
    const group = customization.customization_group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(customization);
    return groups;
  }, {} as Record<string, typeof availableCustomizations>);
  
  // Initialize form with order item data
  useEffect(() => {
    if (orderItem) {
      setQuantity(orderItem.quantity);
      setNotes(orderItem.notes || '');
      setBasePrice(orderItem.price);
      
      // Convert modifiers to customizations format for editing
      const customizations: CustomizationSelection[] = orderItem.customizations || [];
      setSelectedCustomizations(customizations);
    }
  }, [orderItem]);
  
  // Calculate total price including customizations
  const calculateTotalPrice = () => {
    const customizationTotal = selectedCustomizations.reduce((sum, customization) => {
      return sum + (customization.price_adjustment || 0);
    }, 0);
    return (basePrice + customizationTotal) * quantity;
  };
  
  // Handle customization selection
  const handleCustomizationToggle = (customization: any) => {
    const customizationId = customization.id;
    const group = customization.customization_group || 'Other';
    
    setSelectedCustomizations(prev => {
      const existing = prev.find(c => c.customization_id === customizationId);
      
      if (existing) {
        // Remove if already selected
        return prev.filter(c => c.customization_id !== customizationId);
      } else {
        // Add new customization
        const newCustomization: CustomizationSelection = {
          id: `custom-${Date.now()}-${Math.random()}`,
          customization_id: customizationId,
          name: customization.name,
          price_adjustment: customization.price || 0,
          group: group
        };
        
        // If exclusive group, remove other selections from same group
        if (customization.is_exclusive) {
          const filtered = prev.filter(c => c.group !== group);
          return [...filtered, newCustomization];
        }
        
        return [...prev, newCustomization];
      }
    });
  };
  
  // Handle save
  const handleSave = () => {
    if (!orderItem) return;
    
    const updatedItem: OrderItem = {
      ...orderItem,
      quantity,
      notes: notes.trim(),
      customizations: selectedCustomizations,
      price: basePrice // Keep original base price, total calculated elsewhere
    };
    
    onSave(updatedItem);
    toast.success('Item customization updated');
  };
  
  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };
  
  if (!orderItem || !menuItem) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{
        backgroundColor: '#1F1F1F', // Improved backdrop color for better contrast
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
            🔧 Customize Order Item
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Item Info Header */}
          <Card className="p-5" style={{
            backgroundColor: globalColors.background.tertiary,
            border: `1px solid rgba(91, 33, 182, 0.3)`,
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
            borderRadius: '10px'
          }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: globalColors.text.primary }}>
                  {orderItem.name}
                </h3>
                {orderItem.variantName && (
                  <Badge variant="outline" className="mt-2" style={{
                    borderColor: globalColors.purple.light,
                    color: globalColors.purple.light,
                    backgroundColor: `${globalColors.purple.primaryTransparent}10`
                  }}>
                    {orderItem.variantName} (Cannot be changed)
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium" style={{ color: '#A78BFA' }}>Base Price</p>
                <p className="font-bold text-xl" style={{ 
                  color: '#FFFFFF',
                  textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                }}>£{basePrice.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          
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
          
          {/* Customizations */}
          {Object.keys(customizationGroups).length > 0 && (
            <Card className="p-5" style={{
              backgroundColor: globalColors.background.tertiary,
              border: `1px solid ${globalColors.purple.primaryTransparent}30`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3)`,
              borderRadius: '10px'
            }}>
              <h4 className="font-semibold mb-5 text-lg" style={{ color: '#A78BFA' }}>Add-ons & Customizations</h4>
              <div className="space-y-6">
                {Object.entries(customizationGroups).map(([groupName, customizations]) => (
                  <div key={groupName}>
                    <h5 className="font-semibold text-base mb-3" style={{ 
                      color: '#A78BFA',
                      textShadow: '0 0 4px rgba(167, 139, 250, 0.3)'
                    }}>
                      {groupName}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customizations.map((customization) => {
                        const isSelected = selectedCustomizations.some(c => c.customization_id === customization.id);
                        return (
                          <motion.button
                            key={customization.id}
                            whileHover={{ 
                              scale: 1.02,
                              backgroundColor: isSelected ? `${globalColors.purple.primaryTransparent}40` : `${globalColors.purple.primaryTransparent}15`
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCustomizationToggle(customization)}
                            className={`p-4 rounded-lg border text-left transition-all duration-200`}
                            style={{
                              backgroundColor: isSelected ? `${globalColors.purple.primaryTransparent}25` : globalColors.background.primary,
                              borderColor: isSelected ? globalColors.purple.primary : globalColors.purple.primaryTransparent,
                              borderWidth: isSelected ? '2px' : '1px',
                              boxShadow: isSelected ? `0 0 12px ${globalColors.purple.glow}20, inset 0 0 8px ${globalColors.purple.glow}10` : '0 2px 8px rgba(0, 0, 0, 0.2)'
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium" style={{ color: globalColors.text.primary }}>
                                {customization.name}
                              </span>
                              {/* Show price for paid items, "Free" for zero/null price items */}
                              {customization.price !== null && customization.price !== undefined && (
                                <span className="text-sm font-bold" style={{ 
                                  color: '#10B981', // Green for both paid and free items
                                  textShadow: '0 0 4px rgba(16, 185, 129, 0.3)'
                                }}>
                                  {customization.price > 0 ? `+£${customization.price.toFixed(2)}` : 'Free'}
                                </span>
                              )}
                            </div>
                            {customization.description && (
                              <p className="text-xs mt-2" style={{ color: globalColors.text.secondary }}>
                                {customization.description}
                              </p>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                    {groupName !== Object.keys(customizationGroups)[Object.keys(customizationGroups).length - 1] && (
                      <Separator className="mt-6" style={{ 
                        backgroundColor: `${globalColors.purple.primaryTransparent}30`,
                        height: '2px'
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Notes */}
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
              placeholder="Add any special instructions for this item..."
              className="min-h-[100px] text-base"
              style={{
                backgroundColor: globalColors.background.primary,
                borderColor: globalColors.purple.primaryTransparent,
                color: globalColors.text.primary,
                borderWidth: '2px',
                borderRadius: '8px'
              }}
            />
          </Card>
          
          {/* Total Price */}
          <Card className="p-5" style={{
            backgroundColor: globalColors.background.tertiary,
            border: `2px solid ${globalColors.purple.primary}`,
            boxShadow: `0 8px 24px ${globalColors.purple.glow}25, inset 0 0 12px ${globalColors.purple.glow}10`,
            borderRadius: '12px'
          }}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-xl" style={{ color: globalColors.text.primary }}>Total Price:</span>
              <span className="font-bold text-2xl" style={{ 
                color: '#FFFFFF',
                textShadow: '0 0 12px rgba(255, 255, 255, 0.4)'
              }}>
                £{calculateTotalPrice().toFixed(2)}
              </span>
            </div>
            {selectedCustomizations.length > 0 && (
              <div className="mt-3 pt-3 border-t text-sm space-y-1" style={{
                borderColor: `${globalColors.purple.primaryTransparent}30`
              }}>
                <p style={{ color: globalColors.text.secondary, fontSize: '14px' }}>Base: £{(basePrice * quantity).toFixed(2)}</p>
                {selectedCustomizations.map((customization, index) => (
                  <p key={index} style={{ 
                    color: '#10B981',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {customization.name}: +£{((customization.price_adjustment || 0) * quantity).toFixed(2)}
                  </p>
                ))}
              </div>
            )}
          </Card>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 pt-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-12 text-base font-semibold"
                style={{
                  borderColor: globalColors.text.secondary,
                  color: globalColors.text.secondary,
                  backgroundColor: globalColors.background.primary,
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                onClick={handleSave}
                className="w-full h-12 text-base font-bold"
                style={{
                  background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.light} 100%)`,
                  border: 'none',
                  color: 'white',
                  boxShadow: `0 8px 16px ${globalColors.purple.glow}40`,
                  transition: 'all 0.2s ease'
                }}
              >
                Save Changes
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
