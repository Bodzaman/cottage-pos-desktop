/**
 * CartItemList - Scrollable list of cart items
 *
 * Features:
 * - Swipe to delete with gesture feedback
 * - Quantity controls with animations
 * - Item editing support
 * - Price display with customizations
 * - Undo support after removal
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Minus, Plus, Trash2, Edit2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from 'utils/cartStore';
import { PremiumTheme } from 'utils/premiumTheme';
import { toast } from 'sonner';
import type { CartItem, MenuItem } from 'types';

interface CartItemListProps {
  items: CartItem[];
  menuItems?: MenuItem[];
  onEditItem?: (itemId: string, itemData: any) => void;
}

// Animation variants
const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// Swipe threshold for deletion
const DELETE_THRESHOLD = -100;

export function CartItemList({ items, menuItems, onEditItem }: CartItemListProps) {
  const { updateQuantityDebounced, removeItem, setEditingItem } = useCartStore();

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (itemId: string, currentQty: number, delta: number) => {
      const newQty = currentQty + delta;
      if (newQty < 1) {
        handleRemoveItem(itemId);
      } else {
        updateQuantityDebounced(itemId, newQty);
      }
    },
    [updateQuantityDebounced]
  );

  // Handle item removal with undo toast
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      removeItem(itemId);

      // Show undo toast
      toast(
        <div className="flex items-center gap-3">
          <span style={{ color: PremiumTheme.colors.text.secondary }}>
            {item.name} removed
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // TODO: Implement undo via undoStack
              toast.info('Undo feature coming soon');
            }}
            className="h-7 text-xs"
            style={{
              borderColor: PremiumTheme.colors.border.medium,
              color: PremiumTheme.colors.text.primary,
            }}
          >
            Undo
          </Button>
        </div>,
        {
          duration: 5000,
        }
      );
    },
    [items, removeItem]
  );

  // Handle swipe gesture
  const handleDragEnd = useCallback(
    (itemId: string, _: any, info: PanInfo) => {
      if (info.offset.x < DELETE_THRESHOLD) {
        handleRemoveItem(itemId);
      }
    },
    [handleRemoveItem]
  );

  // Handle edit click
  const handleEditClick = useCallback(
    (itemId: string) => {
      setEditingItem(itemId);
      // If onEditItem is provided, use it; otherwise editing state will be handled by CartItemEditor
      if (onEditItem) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          onEditItem(itemId, item);
        }
      }
    },
    [items, setEditingItem, onEditItem]
  );

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  // Calculate item total including customizations
  const getItemTotal = (item: CartItem) => {
    const customizationsTotal = (item.customizations || []).reduce(
      (sum, c) => sum + (c.price || 0),
      0
    );
    return (item.price + customizationsTotal) * item.quantity;
  };

  return (
    <div className="px-4 py-2">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => handleDragEnd(item.id, _, info)}
            className="relative mb-3"
          >
            {/* Delete background indicator */}
            <div
              className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 rounded-xl"
              style={{
                background: `linear-gradient(to left, ${PremiumTheme.colors.status.error}40, transparent)`,
                width: '100%',
              }}
            >
              <Trash2
                className="w-5 h-5"
                style={{ color: PremiumTheme.colors.status.error }}
              />
            </div>

            {/* Item card */}
            <div
              className="relative flex gap-3 p-3 rounded-xl"
              style={{
                backgroundColor: PremiumTheme.colors.dark[800],
                border: `1px solid ${PremiumTheme.colors.border.light}`,
              }}
            >
              {/* Image */}
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: PremiumTheme.colors.dark[700] }}
                >
                  <ShoppingBag
                    className="w-6 h-6"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm truncate"
                      style={{ color: PremiumTheme.colors.text.primary }}
                    >
                      {item.name}
                    </p>
                    {item.variant?.name && (
                      <p
                        className="text-xs truncate"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        {item.variant.name}
                      </p>
                    )}
                    {/* Customizations */}
                    {item.customizations && item.customizations.length > 0 && (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: PremiumTheme.colors.gold[400] }}
                      >
                        +{item.customizations.map((c) => c.name).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Edit button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditClick(item.id)}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex-shrink-0"
                    style={{ color: PremiumTheme.colors.text.muted }}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Price and quantity row */}
                <div className="flex items-center justify-between mt-2">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: PremiumTheme.colors.burgundy[400] }}
                  >
                    {formatPrice(getItemTotal(item))}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity, -1)
                      }
                      className="h-9 w-9 min-h-[36px] min-w-[36px]"
                      style={{ color: PremiumTheme.colors.text.muted }}
                      aria-label={
                        item.quantity === 1
                          ? `Remove ${item.name}`
                          : `Decrease quantity`
                      }
                    >
                      {item.quantity === 1 ? (
                        <Trash2
                          className="w-4 h-4"
                          style={{ color: PremiumTheme.colors.status.error }}
                        />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </Button>

                    <span
                      className="w-8 text-center text-sm font-medium"
                      style={{ color: PremiumTheme.colors.text.primary }}
                    >
                      {item.quantity}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity, 1)
                      }
                      className="h-9 w-9 min-h-[36px] min-w-[36px]"
                      style={{ color: PremiumTheme.colors.text.muted }}
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <p
                    className="text-xs mt-1 truncate"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    Note: {item.notes}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default CartItemList;
