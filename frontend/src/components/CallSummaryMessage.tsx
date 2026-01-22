import React from 'react';
import { Phone, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCartStore } from 'utils/cartStore';
import type { CartItem } from 'utils/cartStore';

interface CallSummaryMessageProps {
  callDuration: number; // in seconds
  itemsAdded: CartItem[];
}

/**
 * CallSummaryMessage - Special message displayed after voice call ends
 * 
 * Shows call duration, items added during call, total amount,
 * and "View Cart" button to open chat cart drawer.
 */
export function CallSummaryMessage({
  callDuration,
  itemsAdded
}: CallSummaryMessageProps) {
  const { openChatCart, totalAmount } = useCartStore();

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Calculate total for items added during this call
  const callTotal = itemsAdded.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 text-orange-600 dark:text-orange-400">
        <Phone className="h-5 w-5" />
        <span className="font-semibold text-lg">
          Call ended ({formatDuration(callDuration)})
        </span>
      </div>

      {/* Items Added Section */}
      {itemsAdded.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="font-medium text-foreground mb-2">
                {itemsAdded.length} {itemsAdded.length === 1 ? 'item' : 'items'} added to your order:
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {itemsAdded.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span>•</span>
                    <span className="flex-1">
                      {item.name}
                      {item.selectedVariant && (
                        <span className="text-xs ml-1">({item.selectedVariant.name})</span>
                      )}
                      {item.spiceLevel && item.spiceLevel !== 'none' && (
                        <span className="text-xs ml-1 capitalize">({item.spiceLevel} spice)</span>
                      )}
                      {item.quantity > 1 && (
                        <span className="text-xs ml-1">(x{item.quantity})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between text-lg font-semibold text-foreground">
              <span>Total:</span>
              <span>£{callTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* View Cart Button */}
          <Button
            onClick={openChatCart}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Cart →
          </Button>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">
            No items were added during this call.
          </p>
        </div>
      )}
    </Card>
  );
}
