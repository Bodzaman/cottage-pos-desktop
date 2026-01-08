import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCartStore } from 'utils/cartStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Utensils, Clock, Edit2, Info, ArrowRight } from 'lucide-react';
import { PremiumTheme } from 'utils/premiumTheme';
import { MenuItem } from 'utils/menuTypes';
import { toast } from 'sonner';
import { ItemRecommendations } from './ItemRecommendations';
import { CartItemEditor } from './CartItemEditor'; // ✅ NEW: Import cart item editor
import { CustomerVariantSelector } from './CustomerVariantSelector'; // ✅ NEW: Import for edit mode
import { CustomerCustomizationModal } from './CustomerCustomizationModal'; // ✅ NEW: Import for edit mode
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore'; // ✅ NEW: To get variants
import { apiClient } from 'app';
import { sortCartItemsByCategory } from 'utils/cartSorting';
import { formatDistanceToNow } from 'date-fns';

interface CartContentProps {
  onCheckout: () => void;
  onContinueShopping?: () => void;
  showContinueShopping?: boolean;
  onEditItem?: (itemId: string, itemData: any) => void;
  menuItems?: MenuItem[];
  selectedDeliveryZone?: any;
  onSignIn?: () => void; // NEW: Callback for sign-in button
}

// Animation constants for consistent timing
const ANIMATION_TIMINGS = {
  itemEntry: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as any }, // Spring curve
  itemExit: { duration: 0.2, ease: "easeIn" as any },
  quantityChange: { duration: 0.15, ease: "easeInOut" as any },
  priceHighlight: { duration: 0.5, ease: "easeOut" as any },
  cartTotalUpdate: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as any },
  addToCartFly: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as any } // Spring curve
};

// Color palette for animations
const CART_COLORS = {
  priceIncrease: '#ef4444', // Red flash
  priceDecrease: '#22c55e', // Green flash
  savings: '#22c55e', // Green badge
  warning: '#f59e0b', // Amber for minimums
  success: PremiumTheme.colors.burgundy[400],
  muted: PremiumTheme.colors.text.muted
};

// Helper function to format currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

// Generic variant names that should be hidden (no useful info)
const GENERIC_VARIANTS = ['standard', 'regular', 'default', 'normal'];

// ✅ FIX #1: Helper to get variant display name
const getVariantDisplayName = (item: any): string | null => {
  // Use variant_name directly from cart table
  if (item.variant_name) {
    return item.variant_name;
  }
  
  // Fallback to variant object
  if (item.variant?.name) {
    return item.variant.name;
  }
  
  return null;
};

export function CartContent({
  onCheckout,
  onContinueShopping,
  showContinueShopping = true,
  onEditItem,
  menuItems,
  selectedDeliveryZone,
  onSignIn, // NEW
  isAuthenticated = false
}: CartContentProps) {
  // Accessibility: respect user's motion preferences
  const shouldReduceMotion = useReducedMotion();
  
  const { 
    items, 
    updateItemQuantity, 
    removeItem, 
    clearCart, 
    totalItems, 
    totalAmount, 
    currentOrderMode, 
    addItem,
    updateItem, // ✅ NEW: Add updateItem for editing cart items
    menuItems: cartMenuItems,
    closeCart, // ✅ NEW: Import closeCart for auto-close on edit
    openCart, // ✅ NEW: Import openCart for auto-reopen after edit
    editingItemId, // ✅ NEW: Get from store instead of local state
    setEditingItem, // ✅ NEW: Action to set editing item
    clearEditingItem // ✅ NEW: Action to clear editing item
  } = useCartStore();
  
  // ✅ NEW: Get itemVariants from realtime store for edit modal
  const { itemVariants } = useRealtimeMenuStore();
  
  // ✅ NEW: Get the editing menu item from menuItems prop
  const editingCartItem = editingItemId ? items.find(i => i.id === editingItemId) : null;
  const editingMenuItem = editingCartItem && menuItems 
    ? menuItems.find(m => m.id === editingCartItem.menuItemId)
    : null;
  
  // Track previous total for animation trigger
  const [previousTotal, setPreviousTotal] = React.useState(totalAmount);
  const [totalChanged, setTotalChanged] = React.useState(false);
  
  // Trigger total change animation
  React.useEffect(() => {
    if (previousTotal !== totalAmount && previousTotal !== 0) {
      setTotalChanged(true);
      const timer = setTimeout(() => setTotalChanged(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousTotal(totalAmount);
  }, [totalAmount]);
  
  const navigate = useNavigate();
  
  // ✅ NEW: Sort cart items by category hierarchy
  const sortedItems = useMemo(
    () => sortCartItemsByCategory(items, menuItems),
    [items, menuItems]
  );
  
  // NEW: State for delivery config from database
  const [deliveryConfig, setDeliveryConfig] = React.useState<{
    fee: number;
    min_order: number;
    free_over: number;
  } | null>(null);
  
  // NEW: Fetch delivery config on mount
  React.useEffect(() => {
    const fetchDeliveryConfig = async () => {
      try {
        const response = await apiClient.get_delivery_config();
        const data = await response.json();
        setDeliveryConfig({
          fee: data.fee || 3.0,
          min_order: data.min_order || 25.0, // Updated default to 25
          free_over: data.free_over || 30.0
        });
      } catch (error) {
        console.error('Failed to fetch delivery config:', error);
        // Fallback to defaults
        setDeliveryConfig({
          fee: 3.0,
          min_order: 25.0, // Updated default to 25
          free_over: 30.0
        });
      }
    };
    
    fetchDeliveryConfig();
  }, []);

  // Calculate final total including delivery fees
  const calculateFinalTotal = (): number => {
    let total = totalAmount;
    
    // Add delivery fee if in delivery mode
    if (currentOrderMode === 'delivery') {
      // Use zone-specific fee if available, otherwise use config fee
      if (selectedDeliveryZone) {
        total += selectedDeliveryZone.delivery_charge;
      } else if (deliveryConfig) {
        total += deliveryConfig.fee;
      }
    }
    
    return total;
  };

  // Calculate delivery fee for display - NOW USES DATABASE VALUES
  const deliveryFee = currentOrderMode === 'delivery' && selectedDeliveryZone 
    ? selectedDeliveryZone.delivery_charge 
    : (currentOrderMode === 'delivery' && deliveryConfig ? deliveryConfig.fee : 0);
  
  // VAT calculation (20% UK standard rate, already included in prices)
  const vatRate = 0.20;
  const vatAmount = totalAmount * (vatRate / (1 + vatRate));
  
  // Collection savings
  const collectionSavings = currentOrderMode === 'delivery' ? deliveryFee : 0;

  // Calculate final total for display
  const finalTotal = calculateFinalTotal();
  
  // NEW: Calculate if minimum order is met (for delivery only)
  const minimumOrderMet = currentOrderMode === 'delivery' 
    ? (deliveryConfig ? totalAmount >= deliveryConfig.min_order : true)
    : true; // Collection has no minimum
  
  // NEW: Calculate amount needed to reach minimum
  const amountNeededForMinimum = currentOrderMode === 'delivery' && deliveryConfig
    ? Math.max(0, deliveryConfig.min_order - totalAmount)
    : 0;

  const handleCheckout = () => {
    // Prevent checkout if minimum not met for delivery
    if (currentOrderMode === 'delivery' && !minimumOrderMet) {
      const minOrder = deliveryConfig?.min_order || 0;
      const safeMinOrder = typeof minOrder === 'number' && !isNaN(minOrder) ? minOrder : 0;
      toast.error(`Minimum order of £${safeMinOrder.toFixed(2)} required for delivery`);
      return;
    }
    onCheckout();
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared successfully');
  };
  
  // ✅ NEW: Edit handlers
  const handleEditClick = (itemId: string) => {
    // Close cart drawer before opening customization modal
    closeCart();
    setEditingItem(itemId);
  };
  
  const handleSaveEdit = (itemId: string, updatedData: {
    variant?: any;
    customizations?: Array<{id: string; name: string; price: number}>;
    notes?: string;
    quantity?: number;
  }) => {
    // Call cartStore updateItem
    updateItem(itemId, updatedData);
    
    // Close editor
    clearEditingItem();
    
    // Show success feedback
    toast.success('Item updated successfully');
  };
  
  const handleCancelEdit = () => {
    clearEditingItem();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable items list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {items.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Animated food icon */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-6"
            >
              <ShoppingCart 
                className="h-20 w-20 mx-auto opacity-30" 
                style={{ color: PremiumTheme.colors.silver[400] }} 
              />
            </motion.div>
            
            <h3 className="text-xl font-semibold mb-2" style={{ color: PremiumTheme.colors.text.primary }}>
              Your cart is empty
            </h3>
            <p className="text-sm mb-6" style={{ color: PremiumTheme.colors.text.muted }}>
              Ready to order? Add some delicious dishes!
            </p>
            
            {/* Current order mode indicator */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                Current mode:
              </span>
              <Badge
                className="cursor-default"
                style={{
                  backgroundColor: currentOrderMode === 'delivery' 
                    ? PremiumTheme.colors.silver[500] + '20'
                    : PremiumTheme.colors.burgundy[500] + '20',
                  color: currentOrderMode === 'delivery' 
                    ? PremiumTheme.colors.silver[400]
                    : PremiumTheme.colors.burgundy[400],
                  border: `1px solid ${currentOrderMode === 'delivery' 
                    ? PremiumTheme.colors.silver[500] + '40'
                    : PremiumTheme.colors.burgundy[500] + '40'}`
                }}
              >
                {currentOrderMode === 'delivery' ? '🚗 Delivery' : '🏃 Collection'}
              </Badge>
            </div>
            
            {/* Suggested actions */}
            {showContinueShopping && onContinueShopping && (
              <div className="space-y-3 max-w-xs mx-auto">
                <Button
                  onClick={onContinueShopping}
                  className="w-full h-11 font-medium transition-all hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${PremiumTheme.colors.silver[500]} 0%, ${PremiumTheme.colors.silver[600]} 100%)`,
                    color: PremiumTheme.colors.dark[900],
                    border: 'none'
                  }}
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  Browse Menu
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedItems.map((item) => {
              // ✅ FIX: item.name already contains full variant name from cartStore
              // cartStore line 387: name: variant?.variant_name || variant?.name || item.name
              const displayName = item.name || 'Menu item';
              
              // ✅ FIX: Calculate mode-aware price with proper fallbacks
              const unitPrice = currentOrderMode === 'delivery'
                ? (item.price_delivery || item.price_collection || item.price || 0)
                : (item.price_collection || item.price || 0);
              
              const showUnitPrice = item.quantity > 1;
              
              // Calculate customizations total - with safety check for array
              const customizationsArray = Array.isArray(item.customizations) ? item.customizations : [];
              const customizationsTotal = customizationsArray.reduce((sum, c) => sum + c.price, 0);
              const itemTotalWithCustomizations = (unitPrice + customizationsTotal) * item.quantity;
              
              // ✅ FIX #1: Use variant_name from database (enriched field)
              // Priority 1: variant_name from cart table ("Chicken Tikka")
              // Priority 2: variant object's variant_name (fallback)
              // Priority 3: item.name (base fallback)
              const variantName = item.variant_name || item.variant?.variant_name || item.name || 'Menu item';
              
              // ✅ NEW: Check if this item is being edited
              const isEditing = editingItemId === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: 1
                  }}
                  exit={shouldReduceMotion ? undefined : { 
                    opacity: 0, 
                    x: 20, 
                    scale: 0.95,
                    transition: ANIMATION_TIMINGS.itemExit
                  }}
                  transition={shouldReduceMotion ? { duration: 0 } : ANIMATION_TIMINGS.itemEntry}
                  className="group"
                >
                  <Card
                    className="border-0 overflow-hidden transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[800]} 0%, ${PremiumTheme.colors.charcoal[800]} 100%)`,
                      borderColor: item.priceChanged ? PremiumTheme.colors.silver[400] : PremiumTheme.colors.border.medium,
                      boxShadow: item.priceChanged ? `0 0 8px ${PremiumTheme.colors.silver[400]}40` : 'none'
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        {/* Item Image with glow and hover effect */}
                        <div 
                          className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative transition-transform duration-300 group-hover:scale-105"
                          style={{
                            border: `1px solid ${PremiumTheme.colors.silver[400]}40`,
                            boxShadow: `0 0 12px ${PremiumTheme.colors.silver[400]}20`
                          }}
                        >
                          {/* Use variant image first with proper resolution hierarchy */}
                          {(item.variant?.display_image_url || item.variant?.image_url || item.image_url) ? (
                            <img 
                              src={item.variant?.display_image_url || item.variant?.image_url || item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => {
                                // On error, hide image and show placeholder
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : null}
                          {/* Fallback placeholder - show if no image or if image fails */}
                          <div 
                            className="w-full h-full flex items-center justify-center rounded-lg"
                            style={{ 
                              backgroundColor: PremiumTheme.colors.dark[700],
                              display: (item.variant?.display_image_url || item.variant?.image_url || item.image_url) ? 'none' : 'flex'
                            }}
                          >
                            <Utensils className="h-8 w-8" style={{ color: PremiumTheme.colors.text.muted }} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Item Name - Single display with Edit button */}
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-base" style={{ color: PremiumTheme.colors.text.primary }}>
                              {variantName}
                            </h4>
                            
                            {/* ✅ RESTRUCTURE: Edit + Delete buttons in top-right */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(item.id)}
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: PremiumTheme.colors.silver[400] }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: '#ef4444' }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Display Customizations */}
                          {customizationsArray.length > 0 && (
                            <div className="mb-2 space-y-1">
                              {customizationsArray.map((customization, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center justify-between text-xs"
                                  style={{ color: PremiumTheme.colors.text.muted }}
                                >
                                  <span className="flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: PremiumTheme.colors.burgundy[400] }} />
                                    {customization.name}
                                  </span>
                                  {customization.price > 0 && (
                                    <span style={{ color: PremiumTheme.colors.gold[400] }}>
                                      +{formatPrice(customization.price)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Notes as pill badges */}
                          {item.notes && (
                            <div className="mb-2">
                              <Badge 
                                variant="outline" 
                                className="text-xs font-normal"
                                style={{
                                  borderColor: PremiumTheme.colors.border.medium,
                                  color: PremiumTheme.colors.text.muted,
                                  backgroundColor: PremiumTheme.colors.dark[700] + '60'
                                }}
                              >
                                {item.notes.length > 30 ? item.notes.substring(0, 30) + '...' : item.notes}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Price and Quantity Controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <motion.div
                                whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  className="h-7 w-7 p-0 transition-all"
                                  style={{
                                    border: `1px solid ${PremiumTheme.colors.border.medium}`,
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[700]}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </motion.div>
                              
                              <motion.span 
                                key={`qty-${item.id}-${item.quantity}`}
                                initial={shouldReduceMotion ? false : { scale: 1.3, color: CART_COLORS.success }}
                                animate={{ scale: 1, color: PremiumTheme.colors.text.primary }}
                                transition={shouldReduceMotion ? { duration: 0 } : {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 20
                                }}
                                className="font-medium text-base min-w-[1.5rem] text-center"
                              >
                                {item.quantity}
                              </motion.span>
                              
                              <motion.div
                                whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  className="h-7 w-7 p-0 transition-all"
                                  style={{
                                    border: `1px solid ${PremiumTheme.colors.border.medium}`,
                                    color: PremiumTheme.colors.text.secondary
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[700]}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </motion.div>
                            </div>
                            
                            {/* ✅ RESTRUCTURE: Price only on right (no delete button) */}
                            <div className="flex flex-col items-end">
                              <motion.p 
                                key={`price-${item.id}-${itemTotalWithCustomizations}`}
                                initial={shouldReduceMotion ? false : { 
                                  scale: 1.15,
                                  backgroundColor: item.priceChanged 
                                    ? (itemTotalWithCustomizations > (item.price * item.quantity) ? CART_COLORS.priceIncrease : CART_COLORS.priceDecrease) + '40'
                                    : 'transparent'
                                }}
                                animate={{ 
                                  scale: 1,
                                  backgroundColor: 'transparent'
                                }}
                                transition={shouldReduceMotion ? { duration: 0 } : ANIMATION_TIMINGS.priceHighlight}
                                className="font-bold text-base px-2 py-1 rounded"
                                style={{ color: PremiumTheme.colors.silver[400] }}
                              >
                                {formatPrice(itemTotalWithCustomizations)}
                              </motion.p>
                              {/* Unit price for multi-quantity items - includes customizations */}
                              {showUnitPrice && (
                                <p className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                                  {formatPrice(unitPrice + customizationsTotal)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        
        {/* Smart Item Recommendations */}
        {items.length > 0 && menuItems && menuItems.length > 0 && (
          <div className="mt-4">
            <ItemRecommendations
              cartItems={items}
              menuItems={menuItems}
              onAddItem={(item: MenuItem) => {
                addItem(item, null, 1, '', [], currentOrderMode);
                toast.success(`${item.name} added to cart`);
              }}
              orderMode={currentOrderMode}
            />
          </div>
        )}
      </div>
      
      {/* Footer with enhanced totals */}
      {items.length > 0 && (
        <div className="border-t p-6" style={{ borderColor: PremiumTheme.colors.border.medium }}>
          {/* Enhanced Price Breakdown */}
          <Accordion type="single" collapsible className="mb-4">
            <AccordionItem value="price-breakdown" style={{ borderColor: PremiumTheme.colors.border.medium }}>
              <AccordionTrigger 
                className="text-sm py-2 hover:no-underline"
                style={{ 
                  color: PremiumTheme.colors.text.muted,
                }}
              >
                <div className="flex items-center gap-2" style={{ color: PremiumTheme.colors.text.secondary }}>
                  <Info size={14} />
                  <span>Price Breakdown</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2 pb-4">
                {/* Items breakdown */}
                <div className="text-xs space-y-1.5">
                  {items.map((item) => {
                    // ✅ Use same variant name logic as item cards (line 358)
                    const variantName = item.variant_name || item.variant?.variant_name || item.name || 'Menu item';
                    const customizationsArray = Array.isArray(item.customizations) ? item.customizations : [];
                    
                    // ✅ Calculate total including customizations
                    const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                    const customizationsTotal = customizationsArray.reduce((sum, c) => sum + (c.price || 0), 0);
                    const itemTotal = (itemPrice + customizationsTotal) * (item.quantity || 0);
                    
                    return (
                      <div key={item.id} className="space-y-1">
                        {/* Main item line */}
                        <div className="flex justify-between" style={{ color: PremiumTheme.colors.text.secondary }}>
                          <span>
                            {item.quantity}x {variantName}
                          </span>
                          <span>£{itemTotal.toFixed(2)}</span>
                        </div>
                        
                        {/* Customizations (indented) */}
                        {customizationsArray.length > 0 && (
                          <div className="ml-4 space-y-0.5">
                            {customizationsArray.map((customization, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between"
                                style={{ color: PremiumTheme.colors.text.muted }}
                              >
                                <span className="flex items-center gap-1 text-[10px]">
                                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: PremiumTheme.colors.burgundy[400] }} />
                                  {customization.name}
                                </span>
                                {customization.price > 0 && (
                                  <span className="text-[10px]" style={{ color: PremiumTheme.colors.gold[400] }}>
                                    +£{customization.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="border-t my-2" style={{ borderColor: PremiumTheme.colors.border.medium }} />
                
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span style={{ color: PremiumTheme.colors.text.secondary }}>Subtotal:</span>
                  <span className="font-medium" style={{ color: PremiumTheme.colors.silver[400] }}>
                    £{(typeof totalAmount === 'number' && !isNaN(totalAmount) ? totalAmount : 0).toFixed(2)}
                  </span>
                </div>
                
                {/* Delivery Fee */}
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-1">
                    <span style={{ color: PremiumTheme.colors.text.secondary }}>Delivery Fee:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={12} className="cursor-help" style={{ color: PremiumTheme.colors.text.muted }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Delivery fee for delivery orders</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-medium" style={{ color: PremiumTheme.colors.silver[400] }}>
                    {deliveryFee > 0 ? `£${(typeof deliveryFee === 'number' && !isNaN(deliveryFee) ? deliveryFee : 0).toFixed(2)}` : 'FREE'}
                  </span>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Main Total Display */}
          <div className="space-y-2 mb-4" role="region" aria-label="Order summary">
            <div className="flex justify-between text-lg font-bold">
              <span style={{ color: PremiumTheme.colors.text.secondary }}>Total:</span>
              <motion.span 
                key={`total-${finalTotal}`}
                initial={shouldReduceMotion ? false : { 
                  scale: totalChanged ? 1.2 : 1,
                  color: totalChanged ? CART_COLORS.success : PremiumTheme.colors.burgundy[400]
                }}
                animate={{ 
                  scale: 1,
                  color: PremiumTheme.colors.burgundy[400]
                }}
                transition={shouldReduceMotion ? { duration: 0 } : {
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
              >
                £{(typeof finalTotal === 'number' && !isNaN(finalTotal) ? finalTotal : 0).toFixed(2)}
              </motion.span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: PremiumTheme.colors.text.muted }}>Order Mode:</span>
              <span className="capitalize" style={{ color: PremiumTheme.colors.text.secondary }}>{currentOrderMode}</span>
            </div>
          </div>
          
          {/* NEW: Minimum Order Warning for Delivery */}
          {currentOrderMode === 'delivery' && !minimumOrderMet && deliveryConfig && (
            <div 
              className="mb-4 p-3 rounded-lg border text-center"
              style={{
                backgroundColor: PremiumTheme.colors.burgundy[500] + '20',
                borderColor: PremiumTheme.colors.burgundy[500] + '60',
                color: PremiumTheme.colors.burgundy[400]
              }}
            >
              <p className="text-sm font-medium">
                Add £{(typeof amountNeededForMinimum === 'number' && !isNaN(amountNeededForMinimum) ? amountNeededForMinimum : 0).toFixed(2)} more to reach £{(typeof deliveryConfig.min_order === 'number' && !isNaN(deliveryConfig.min_order) ? deliveryConfig.min_order : 0).toFixed(2)} minimum
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Show different buttons based on authentication state */}
            {isAuthenticated ? (
              /* AUTHENTICATED: Single Proceed to Checkout button */
              <Button
                onClick={handleCheckout}
                disabled={currentOrderMode === 'delivery' && !minimumOrderMet}
                className="w-full h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: (currentOrderMode === 'delivery' && !minimumOrderMet)
                    ? `${PremiumTheme.colors.dark[700]}`
                    : `${PremiumTheme.colors.burgundy[500]}`,
                  color: 'white',
                  border: 'none',
                  cursor: (currentOrderMode === 'delivery' && !minimumOrderMet) ? 'not-allowed' : 'pointer',
                  opacity: (currentOrderMode === 'delivery' && !minimumOrderMet) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (currentOrderMode !== 'delivery' || minimumOrderMet) {
                    e.currentTarget.style.background = PremiumTheme.colors.burgundy[600];
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentOrderMode !== 'delivery' || minimumOrderMet) {
                    e.currentTarget.style.background = PremiumTheme.colors.burgundy[500];
                  }
                }}
              >
                {(currentOrderMode === 'delivery' && !minimumOrderMet) ? (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Minimum £{deliveryConfig?.min_order.toFixed(2)} Required
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              /* NOT AUTHENTICATED: Show both Sign In and Guest options */
              <>
                {/* Secondary: Sign In for Faster Checkout */}
                {onSignIn && (
                  <Button
                    onClick={onSignIn}
                    variant="outline"
                    className="w-full h-10 text-sm font-normal transition-all duration-200"
                    style={{
                      border: `1px solid ${PremiumTheme.colors.border.medium}`,
                      backgroundColor: 'transparent',
                      color: PremiumTheme.colors.text.secondary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = PremiumTheme.colors.burgundy[500];
                      e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500] + '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = PremiumTheme.colors.border.medium;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Sign In for Faster Checkout
                  </Button>
                )}
                
                {/* Primary: Continue as Guest */}
                <Button
                  onClick={handleCheckout}
                  disabled={currentOrderMode === 'delivery' && !minimumOrderMet}
                  className="w-full h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: (currentOrderMode === 'delivery' && !minimumOrderMet)
                      ? `${PremiumTheme.colors.dark[700]}`
                      : `${PremiumTheme.colors.burgundy[500]}`,
                    color: 'white',
                    border: 'none',
                    cursor: (currentOrderMode === 'delivery' && !minimumOrderMet) ? 'not-allowed' : 'pointer',
                    opacity: (currentOrderMode === 'delivery' && !minimumOrderMet) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (currentOrderMode !== 'delivery' || minimumOrderMet) {
                      e.currentTarget.style.background = PremiumTheme.colors.burgundy[600];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentOrderMode !== 'delivery' || minimumOrderMet) {
                      e.currentTarget.style.background = PremiumTheme.colors.burgundy[500];
                    }
                  }}
                >
                  {(currentOrderMode === 'delivery' && !minimumOrderMet) ? (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Minimum £{deliveryConfig?.min_order.toFixed(2)} Required
                    </>
                  ) : (
                    <>
                      Continue as Guest
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
            
            <div className="flex space-x-2">
              {showContinueShopping && onContinueShopping && (
                <Button
                  onClick={onContinueShopping}
                  variant="outline"
                  className="flex-1 h-10 transition-all duration-200"
                  style={{
                    border: `1px solid ${PremiumTheme.colors.border.medium}`,
                    color: PremiumTheme.colors.text.secondary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[700]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Continue Shopping
                </Button>
              )}
              
              <Button
                onClick={handleClearCart}
                variant="outline"
                className="h-10 px-3 border-red-600 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Quick info */}
          <div className="mt-4 text-center">
            <p className="text-xs flex items-center justify-center" style={{ color: PremiumTheme.colors.text.muted }}>
              <Clock className="h-3 w-3 mr-1" />
              Estimated prep time: 15-20 minutes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartContent;
