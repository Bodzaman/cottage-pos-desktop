/**
 * CartHeader - Shared header component for cart views
 *
 * Features:
 * - Title with item count
 * - Delivery/Collection mode toggle
 * - Close button
 * - Restaurant status badge
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Truck, PackageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from 'utils/cartStore';
import { PremiumTheme } from 'utils/premiumTheme';
import { toast } from 'sonner';

interface CartHeaderProps {
  onClose: () => void;
}

export function CartHeader({ onClose }: CartHeaderProps) {
  const {
    totalItems,
    currentOrderMode,
    setOrderMode,
    updatePricesForMode,
    items,
  } = useCartStore();

  const [showModeHint, setShowModeHint] = React.useState(false);

  // Handle mode toggle
  const handleModeToggle = (newMode: 'delivery' | 'collection') => {
    if (newMode === currentOrderMode) return;

    // Check if user has disabled confirmation
    const skipConfirmation = localStorage.getItem('skipOrderModeConfirmation') === 'true';

    if (skipConfirmation || items.length === 0) {
      performModeSwitch(newMode);
    } else {
      // For simplicity, switch directly with toast feedback
      // Full confirmation dialog can be added later if needed
      performModeSwitch(newMode);
    }
  };

  const performModeSwitch = (mode: 'delivery' | 'collection') => {
    setOrderMode(mode);
    updatePricesForMode(mode);
    toast.success(`Switched to ${mode === 'delivery' ? 'Delivery' : 'Collection'}`);

    // Show hint briefly
    setShowModeHint(true);
    setTimeout(() => setShowModeHint(false), 2000);
  };

  return (
    <div
      className="flex-shrink-0 px-5 py-4 border-b"
      style={{ borderColor: PremiumTheme.colors.border.light }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            Your Order
          </h2>
          <p
            className="text-sm"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full"
          style={{ color: PremiumTheme.colors.text.secondary }}
          aria-label="Close cart"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeToggle('collection')}
          className="h-9 px-3 flex-1 transition-all"
          style={{
            backgroundColor:
              currentOrderMode === 'collection'
                ? PremiumTheme.colors.burgundy[500] + '30'
                : 'transparent',
            color:
              currentOrderMode === 'collection'
                ? PremiumTheme.colors.burgundy[400]
                : PremiumTheme.colors.text.muted,
            boxShadow:
              currentOrderMode === 'collection'
                ? `0 0 0 2px ${PremiumTheme.colors.burgundy[500]}`
                : 'none',
            opacity: currentOrderMode === 'collection' ? 1 : 0.6,
          }}
        >
          <PackageIcon className="h-4 w-4 mr-1.5" />
          Collection
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleModeToggle('delivery')}
          className="h-9 px-3 flex-1 transition-all"
          style={{
            backgroundColor:
              currentOrderMode === 'delivery'
                ? PremiumTheme.colors.silver[500] + '30'
                : 'transparent',
            color:
              currentOrderMode === 'delivery'
                ? PremiumTheme.colors.silver[400]
                : PremiumTheme.colors.text.muted,
            boxShadow:
              currentOrderMode === 'delivery'
                ? `0 0 0 2px ${PremiumTheme.colors.silver[500]}`
                : 'none',
            opacity: currentOrderMode === 'delivery' ? 1 : 0.6,
          }}
        >
          <Truck className="h-4 w-4 mr-1.5" />
          Delivery
        </Button>
      </div>

      {/* Mode change hint */}
      {showModeHint && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Badge
            variant="secondary"
            className="mt-3 text-xs flex items-center gap-1 w-fit"
            style={{
              backgroundColor: PremiumTheme.colors.gold[500] + '30',
              color: PremiumTheme.colors.gold[400],
              border: `1px solid ${PremiumTheme.colors.gold[500]}60`,
            }}
          >
            <Sparkles className="h-3 w-3" />
            Prices updated for {currentOrderMode}
          </Badge>
        </motion.div>
      )}
    </div>
  );
}

export default CartHeader;
