import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';

interface MiniCartPillProps {
  variant?: 'floating' | 'header';
  onViewCart?: () => void;
}

/**
 * MiniCartPill - Compact expandable cart summary
 *
 * Features:
 * - Shows item count and total
 * - Expandable to show recent items
 * - Click to open full cart
 */
export function MiniCartPill({ variant = 'floating', onViewCart }: MiniCartPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (itemCount === 0) return null;

  const recentItems = items.slice(-3); // Show last 3 items

  const baseClasses =
    variant === 'floating'
      ? 'fixed top-4 right-4 z-40'
      : 'relative';

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="bg-background border border-border rounded-full shadow-lg overflow-hidden">
        {/* Main pill */}
        <div
          className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            <motion.span
              key={itemCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            >
              {itemCount}
            </motion.span>
          </div>
          <span className="font-semibold text-sm">
            £{totalAmount.toFixed(2)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border"
            >
              <div className="p-3 space-y-2">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate max-w-[120px]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-muted-foreground">
                      £{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{items.length - 3} more items
                  </p>
                )}
                <Button
                  size="sm"
                  className="w-full mt-2 bg-orange-500 hover:bg-orange-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewCart?.();
                  }}
                >
                  View Cart
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default MiniCartPill;
