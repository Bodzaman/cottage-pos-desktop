import React from 'react';
import { Minus, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from './ErrorBoundary';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CartItemProps {
  item: {
    id: string;
    menuItem: { 
      id: string; 
      name: string; 
      description: string;
      image_url?: string;
      active?: boolean; // Stock/availability flag
    };
    variant: {
      id: string;
      name: string;
      price: string;
    };
    quantity: number;
    specialInstructions?: string;
  };
}

// Configurable max quantity per item (can be adjusted per business rules)
const MAX_QUANTITY_PER_ITEM = 10;

// Memoize the component to prevent unnecessary re-renders
export const CartItem = React.memo(({ item }: CartItemProps) => {
  const { updateItemQuantity, removeItem, updateItemNotes } = useCartStore();
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [instructionsText, setInstructionsText] = React.useState(item.specialInstructions || item.notes || '');
  const MAX_CHARS = 200;

  // Check if item is available (active in database)
  const isAvailable = item?.menuItem?.active !== false;
  const isAtMaxQuantity = item.quantity >= MAX_QUANTITY_PER_ITEM;

  // Quick-select instruction chips
  const quickInstructions = [
    'No onions',
    'Extra spicy',
    'Mild',
    'Gluten-free',
    'No dairy',
    'Extra sauce'
  ];

  // Memoize calculated values to prevent recalculation on every render
  const price = React.useMemo(() => parseFloat(item?.variant?.price || '0'), [item?.variant?.price]);
  
  const totalPrice = React.useMemo(() => {
    return (price * (item?.quantity || 0)).toFixed(2);
  }, [price, item?.quantity]);

  const displayName = React.useMemo(() => {
    const name = item?.menuItem?.name || 'Menu item';
    const variantName = item?.variant?.name || '';
    return variantName ? `${name} (${variantName})` : name;
  }, [item?.menuItem?.name, item?.variant?.name]);

  // Memoize handlers to prevent recreating functions on each render
  const handleDecreaseQuantity = React.useCallback(() => {
    if (item.quantity > 1) {
      updateItemQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  }, [item.id, item.quantity, updateItemQuantity, removeItem]);
  
  const handleIncreaseQuantity = React.useCallback(() => {
    if (item.quantity < MAX_QUANTITY_PER_ITEM) {
      updateItemQuantity(item.id, item.quantity + 1);
    }
  }, [item.id, item.quantity, updateItemQuantity]);
  
  const handleRemoveItem = React.useCallback(() => {
    removeItem(item.id);
  }, [item.id, removeItem]);

  // NEW: Handle quick-select chip click
  const handleQuickSelect = React.useCallback((instruction: string) => {
    const currentText = instructionsText.trim();
    let newText = '';
    
    // If already contains this instruction, remove it
    if (currentText.includes(instruction)) {
      newText = currentText.replace(instruction, '').replace(/,\s*,/g, ',').replace(/^,\s*|\s*,$/g, '').trim();
    } else {
      // Add instruction
      newText = currentText ? `${currentText}, ${instruction}` : instruction;
    }
    
    // Enforce character limit
    if (newText.length <= MAX_CHARS) {
      setInstructionsText(newText);
      updateItemNotes(item.id, newText);
    }
  }, [instructionsText, item.id, updateItemNotes]);

  // NEW: Handle textarea change
  const handleInstructionsChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setInstructionsText(newText);
      updateItemNotes(item.id, newText);
    }
  }, [item.id, updateItemNotes]);

  const description = item?.menuItem?.description || '';
  const hasCustomizations = (item?.variant?.customizations?.length || 0) > 0;
  
  return (
    <ErrorBoundary fallback={
      <Card className="p-4 bg-red-900/20 border border-red-700">
        <div className="text-red-100 text-center">
          <p className="text-sm">Error loading cart item</p>
        </div>
      </Card>
    }>
      <Card 
        className={`p-4 border-gray-700 ${
          isAvailable 
            ? 'bg-gray-800/50' 
            : 'bg-gray-800/30 border-amber-700/50'
        }`}
        role="article"
        aria-label={`${displayName}, £${totalPrice}`}
      >
        <div className="flex gap-3">
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-tandoor-platinum">{displayName}</h4>
                {/* NEW: Unavailable badge */}
                {!isAvailable && (
                  <Badge 
                    variant="outline" 
                    className="bg-amber-900/30 border-amber-700 text-amber-300 text-xs"
                  >
                    <AlertCircle size={12} className="mr-1" />
                    Unavailable
                  </Badge>
                )}
              </div>
              <button
                onClick={handleRemoveItem}
                className="text-gray-400 hover:text-red-400 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-tandoor-orange focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                aria-label={`Remove ${displayName} from cart`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            
            {/* NEW: Unavailable warning message */}
            {!isAvailable && (
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                This item is currently unavailable and will be removed from your cart.
              </p>
            )}
            
            {description && (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{description}</p>
            )}
            
            {/* Show customizations pricing if any */}
            {hasCustomizations && (
              <div className="text-xs text-gray-400 mt-1">
                {item.variant.customizations.map((c: any) => (
                  <span key={c.id} className="mr-2">+ {c.name} £{c.price.toFixed(2)}</span>
                ))}
              </div>
            )}
            
            {/* Display special instructions if set and section is closed */}
            {!showInstructions && instructionsText && (
              <p className="text-xs text-tandoor-orange mt-2 italic" role="note">
                {instructionsText}
              </p>
            )}

            {/* NEW: Expandable Special Instructions Section */}
            <div className="mt-3">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-tandoor-orange transition-colors focus:outline-none focus:ring-2 focus:ring-tandoor-orange focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1"
                aria-expanded={showInstructions}
              >
                {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{instructionsText ? 'Edit special instructions' : 'Add special instructions'}</span>
              </button>

              {showInstructions && (
                <div className="mt-2 space-y-2" role="region" aria-label="Special instructions">
                  {/* Quick-select chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickInstructions.map((instruction) => {
                      const isActive = instructionsText.includes(instruction);
                      return (
                        <Badge
                          key={instruction}
                          variant={isActive ? 'default' : 'outline'}
                          className={`cursor-pointer text-xs transition-colors ${
                            isActive 
                              ? 'bg-tandoor-orange hover:bg-tandoor-orange/80 text-white border-tandoor-orange' 
                              : 'border-gray-600 text-gray-300 hover:border-tandoor-orange hover:text-tandoor-orange'
                          }`}
                          onClick={() => handleQuickSelect(instruction)}
                        >
                          {instruction}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Textarea with character counter */}
                  <div className="relative">
                    <Textarea
                      value={instructionsText}
                      onChange={handleInstructionsChange}
                      placeholder="e.g., No nuts, well done, extra sauce..."
                      className="bg-gray-900 border-gray-600 text-white text-sm resize-none focus:ring-2 focus:ring-tandoor-orange focus:border-transparent"
                      rows={2}
                      maxLength={MAX_CHARS}
                      aria-label="Special instructions"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {instructionsText.length}/{MAX_CHARS}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <div 
                className="flex items-center space-x-2"
                role="group"
                aria-label={`Quantity controls for ${displayName}`}
              >
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7 rounded-full bg-gray-700 border-gray-600 text-gray-300 focus:ring-2 focus:ring-tandoor-orange focus:ring-offset-2 focus:ring-offset-gray-900"
                  onClick={handleDecreaseQuantity}
                  aria-label={item.quantity > 1 ? `Decrease quantity of ${displayName}` : `Remove ${displayName} from cart`}
                >
                  <Minus size={14} aria-hidden="true" />
                </Button>
                <span 
                  className="text-sm font-medium text-tandoor-platinum w-5 text-center"
                  aria-label={`Quantity: ${item.quantity}`}
                  role="status"
                >
                  {item.quantity}
                </span>
                
                {/* NEW: Increment button with tooltip */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className={`h-7 w-7 rounded-full bg-gray-700 border-gray-600 focus:ring-2 focus:ring-tandoor-orange focus:ring-offset-2 focus:ring-offset-gray-900 ${
                          isAtMaxQuantity 
                            ? 'opacity-50 cursor-not-allowed text-gray-500' 
                            : 'text-gray-300'
                        }`}
                        onClick={handleIncreaseQuantity}
                        disabled={isAtMaxQuantity}
                        aria-label={isAtMaxQuantity ? `Maximum quantity reached for ${displayName}` : `Increase quantity of ${displayName} to ${item.quantity + 1}`}
                      >
                        <Plus size={14} aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    {isAtMaxQuantity && (
                      <TooltipContent side="top" className="bg-gray-800 border-gray-700">
                        <p className="text-xs">Maximum {MAX_QUANTITY_PER_ITEM} per order</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="text-tandoor-platinum font-medium" aria-label={`Total price: £${totalPrice}`}>
                £{totalPrice}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </ErrorBoundary>
  );
});

CartItem.displayName = 'CartItem';
