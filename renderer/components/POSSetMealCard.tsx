import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Star, Package, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { OrderItem } from '../utils/menuTypes';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { SetMealListResponse } from 'types';
import { OptimizedImage } from 'components/OptimizedImage';

interface Props {
  setMeal: SetMealListResponse;
  onAddToOrder: (orderItem: OrderItem) => void;
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  viewMode?: 'card' | 'list';
}

export function POSSetMealCard({ setMeal, onAddToOrder, orderType, viewMode = 'card' }: Props) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  // Placeholder image if no hero image URL is provided
  const placeholderImage = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1080&q=80';

  const handleAddToOrder = () => {
    // Create a special order item for Set Meals
    const orderItem: OrderItem = {
      id: `set-meal-${setMeal.id}-${Date.now()}`,
      menu_item_id: setMeal.id, // Use set meal ID as menu_item_id
      variant_id: 'set-meal-variant', // Special variant ID for set meals
      name: setMeal.name,
      quantity: quantity,
      price: setMeal.set_price,
      variantName: 'Set Meal',
      notes: notes || undefined,
      image_url: setMeal.hero_image_url, // Include hero image URL for thumbnails
      modifiers: [],
      customizations: [],
      // Set Meal specific fields
      item_type: 'set_meal',
      set_meal_code: setMeal.code
    };
    
    onAddToOrder(orderItem);
    setNotes("");
    setQuantity(1);
    setIsDetailsOpen(false);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  // Render list view
  if (viewMode === 'list') {
    return (
      <>
        {/* Horizontal List Layout */}
        <div className="text-left w-full transition-all duration-300 rounded-lg overflow-hidden flex items-center group relative h-20 p-3 gap-4 bg-[#1A1A1A] border border-[rgba(124,93,250,0.2)]">
          {/* Set meal icon */}
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-[#7C5DFA] to-[#6B4DEA] flex items-center justify-center flex-shrink-0">
            <Package className="w-8 h-8 text-white" />
          </div>
          
          {/* Content area */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-semibold truncate mb-1" title={setMeal.name}>
              {setMeal.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className="bg-[rgba(124,93,250,0.2)] text-[#7C5DFA] border-[rgba(124,93,250,0.3)] text-xs">
                {setMeal.set_meal_code}
              </Badge>
              <span className="text-xs text-[#BBC3E1]">
                {setMeal.item_count} items
              </span>
            </div>
          </div>
          
          {/* Price */}
          <div className="text-sm text-white font-semibold">
            {formatPrice(setMeal.set_price)}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="w-8 h-8 rounded-full bg-[#7C5DFA] hover:bg-[#6B4DEA] text-white flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#7C5DFA] text-sm font-bold"
              onClick={handleAddToOrder}
              title="Add to order"
            >
              ⊕
            </button>
            
            <button
              className="w-8 h-8 rounded-full border border-[rgba(124,93,250,0.3)] text-[#7C5DFA] hover:bg-[rgba(124,93,250,0.15)] hover:text-white flex items-center justify-center transition-all duration-200 text-xs"
              onClick={() => setIsDetailsOpen(true)}
              title="View details"
            >
              ⓘ
            </button>
          </div>
        </div>
        
        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent 
            className="max-w-md max-h-[90vh] overflow-hidden"
            style={{
              ...styles.glassCard,
              background: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white mb-2">
                {setMeal.name}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] pr-4">
              {/* Hero Image */}
              <div className="mb-4 rounded-lg overflow-hidden">
                <OptimizedImage
                  fallbackUrl={setMeal.hero_image_url || placeholderImage}
                  variant="widescreen"
                  alt={setMeal.name}
                  className="w-full h-48 object-cover"
                />
              </div>

              {/* Description */}
              {setMeal.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
                  <p className="text-sm text-gray-300">{setMeal.description}</p>
                </div>
              )}
              
              {/* Set Details */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-2">Set Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Items included:</span>
                    <span className="text-white font-medium">{setMeal.item_count} items</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Individual total:</span>
                    <span className="text-white">£{setMeal.individual_items_total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Set price:</span>
                    <span className="text-white font-bold">£{setMeal.set_price.toFixed(2)}</span>
                  </div>
                  
                  {setMeal.savings > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-400 font-medium">You save:</span>
                      <span className="text-green-400 font-bold">£{setMeal.savings.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" style={{ backgroundColor: QSAITheme.border.light }} />

              {/* Notes */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-white mb-2 block">
                  Special Instructions (Optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special requests or modifications..."
                  className="w-full"
                  style={{
                    backgroundColor: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: 'white'
                  }}
                  rows={3}
                />
              </div>

              {/* Quantity Selection */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-white mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="h-10 w-10"
                    style={{
                      backgroundColor: QSAITheme.background.tertiary,
                      border: `1px solid ${QSAITheme.border.light}`,
                      color: 'white'
                    }}
                  >
                    -
                  </Button>
                  
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0) setQuantity(val);
                    }}
                    className="w-20 text-center"
                    style={{
                      backgroundColor: QSAITheme.background.tertiary,
                      border: `1px solid ${QSAITheme.border.light}`,
                      color: 'white'
                    }}
                    min="1"
                  />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={increaseQuantity}
                    className="h-10 w-10"
                    style={{
                      backgroundColor: QSAITheme.background.tertiary,
                      border: `1px solid ${QSAITheme.border.light}`,
                      color: 'white'
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="flex justify-between items-center pt-4">
              <div className="text-lg font-bold text-white">
                Total: £{(setMeal.set_price * quantity).toFixed(2)}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: 'white'
                  }}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleAddToOrder}
                  className="min-w-[120px]"
                  style={{
                    background: 'linear-gradient(135deg, #7c5cf0, #6d28d9)',
                    border: 'none',
                    color: 'white',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(124, 93, 240, 0.3)'
                  }}
                >
                  Add to Order
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Card view (existing layout but made compact)
  return (
    <>
      {/* Compact Set Meal Card with Fixed Height */}
      <div className="bg-[#1A1A1A] rounded-lg border border-[rgba(124,93,250,0.2)] overflow-hidden group hover:border-[rgba(124,93,250,0.4)] transition-all duration-300 h-[300px] flex flex-col">
        {/* Header with set meal indicator - Smaller to match thumbnail approach */}
        <div className="h-[55px] bg-gradient-to-br from-[#7C5DFA] to-[#6B4DEA] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <Package className="w-6 h-6 text-white z-10" />
          <div className="absolute top-1 left-1">
            <Badge className="bg-black/40 backdrop-blur-sm text-white border-none text-xs px-1 py-0 h-3.5">
              Set Meal
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-white text-base font-semibold mb-2 line-clamp-2 leading-tight" title={setMeal.name}>
            {setMeal.name}
          </h3>
          
          {/* Info */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-[rgba(124,93,250,0.2)] text-[#7C5DFA] border-[rgba(124,93,250,0.3)] text-xs">
              {setMeal.set_meal_code}
            </Badge>
            <span className="text-xs text-[#BBC3E1]">
              {setMeal.item_count} items
            </span>
          </div>
          
          {/* Description */}
          {setMeal.description && (
            <p className="text-xs text-[#BBC3E1] line-clamp-2 mb-3 leading-relaxed">
              {setMeal.description}
            </p>
          )}
          
          {/* Price and actions */}
          <div className="mt-auto">
            <div className="grid grid-cols-[2.5fr_55px_35px] gap-2 items-center mb-2">
              <div></div>
              <div className="text-sm text-white font-semibold text-right">
                {formatPrice(setMeal.set_price)}
              </div>
              <div className="flex justify-center">
                <button
                  className="w-7 h-7 rounded-full bg-[#7C5DFA] hover:bg-[#6B4DEA] text-white flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#7C5DFA] text-sm font-bold"
                  onClick={handleAddToOrder}
                  title="Add to order"
                >
                  ⊕
                </button>
              </div>
            </div>
            
            {/* Details button */}
            <button
              className="w-full h-7 border border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.15)] hover:text-white transition-all duration-200 flex items-center justify-center gap-1 text-xs rounded"
              onClick={() => setIsDetailsOpen(true)}
            >
              ⓘ Details
            </button>
          </div>
        </div>
      </div>
      
      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent 
          className="max-w-md max-h-[90vh] overflow-hidden"
          style={{
            ...styles.glassCard,
            background: QSAITheme.background.secondary,
            border: `1px solid ${QSAITheme.border.light}`
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white mb-2">
              {setMeal.name}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {/* Hero Image */}
            <div className="mb-4 rounded-lg overflow-hidden">
              <OptimizedImage
                fallbackUrl={setMeal.hero_image_url || placeholderImage}
                variant="widescreen"
                alt={setMeal.name}
                className="w-full h-48 object-cover"
              />
            </div>

            {/* Description */}
            {setMeal.description && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-white mb-2">Description</h4>
                <p className="text-sm text-gray-300">{setMeal.description}</p>
              </div>
            )}
            
            {/* Set Details */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white mb-2">Set Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Items included:</span>
                  <span className="text-white font-medium">{setMeal.item_count} items</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Individual total:</span>
                  <span className="text-white">£{setMeal.individual_items_total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Set price:</span>
                  <span className="text-white font-bold">£{setMeal.set_price.toFixed(2)}</span>
                </div>
                
                {setMeal.savings > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400 font-medium">You save:</span>
                    <span className="text-green-400 font-bold">£{setMeal.savings.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-4" style={{ backgroundColor: QSAITheme.border.light }} />

            {/* Notes */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-white mb-2 block">
                Special Instructions (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special requests or modifications..."
                className="w-full"
                style={{
                  backgroundColor: QSAITheme.background.tertiary,
                  border: `1px solid ${QSAITheme.border.light}`,
                  color: 'white'
                }}
                rows={3}
              />
            </div>

            {/* Quantity Selection */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-white mb-2 block">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="h-10 w-10"
                  style={{
                    backgroundColor: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: 'white'
                  }}
                >
                  -
                </Button>
                
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0) setQuantity(val);
                  }}
                  className="w-20 text-center"
                  style={{
                    backgroundColor: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: 'white'
                  }}
                  min="1"
                />
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={increaseQuantity}
                  className="h-10 w-10"
                  style={{
                    backgroundColor: QSAITheme.background.tertiary,
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: 'white'
                  }}
                >
                  +
                </Button>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex justify-between items-center pt-4">
            <div className="text-lg font-bold text-white">
              Total: £{(setMeal.set_price * quantity).toFixed(2)}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDetailsOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${QSAITheme.border.light}`,
                  color: 'white'
                }}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleAddToOrder}
                className="min-w-[120px]"
                style={{
                  background: 'linear-gradient(135deg, #7c5cf0, #6d28d9)',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(124, 93, 240, 0.3)'
                }}
              >
                Add to Order
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
