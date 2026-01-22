import { useCartStore } from 'utils/cartStore';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CartSummaryMessageProps {
  onCheckout?: () => void;
}

/**
 * Live cart summary that updates in place
 * Designed for side drawer display
 */
export function CartSummaryMessage({ onCheckout }: CartSummaryMessageProps) {
  const { items, totalItems, totalAmount, removeItem, updateItemQuantity } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    }
    navigate('/checkout-payment');
  };

  // Helper to calculate item total (price + customizations) * quantity
  const calculateItemTotal = (item: any) => {
    const basePrice = item.price || 0;
    const customizationsTotal = (item.customizations || []).reduce((sum: number, c: any) => sum + (c.price || 0), 0);
    return (basePrice + customizationsTotal) * item.quantity;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShoppingCart className="w-20 h-20 mb-4 opacity-20" />
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="text-sm mt-2 text-gray-500">Add items to get started!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Items List - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-white font-medium">{item.name}</h4>
                {item.variant && (
                  <p className="text-sm text-gray-400 mt-1">
                    {item.variant.name || item.variant.variant_name || 'Standard'}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Customizations */}
            {item.notes && (
              <p className="text-sm text-amber-400 mb-2">🌶️ {item.notes}</p>
            )}
            {item.customizations && item.customizations.length > 0 && (
              <div className="text-sm text-gray-400 mb-2 space-y-1">
                {item.customizations.map((custom, idx) => (
                  <div key={idx}>• {custom.name}</div>
                ))}
              </div>
            )}

            {/* Quantity Controls + Price */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 text-white" />
                </button>
                <span className="text-white font-medium w-8 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">£{calculateItemTotal(item).toFixed(2)}</div>
                {item.quantity > 1 && (
                  <div className="text-xs text-gray-400">£{(item.price || 0).toFixed(2)} each</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Sticky */}
      <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-lg">
          <span className="text-gray-300 font-medium">Subtotal ({totalItems} items)</span>
          <span className="text-white font-bold">£{totalAmount.toFixed(2)}</span>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-6 text-lg rounded-lg shadow-lg transition-all"
        >
          Proceed to Checkout
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
