/**
 * CartSheet - Mobile bottom sheet cart
 *
 * Features:
 * - Three states: Closed → Mini (summary) → Full
 * - Swipe gestures: down to minimize, up to expand
 * - Safe area padding for notch and home indicator
 * - Smooth spring animations
 * - Backdrop blur overlay
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { useCartStore } from 'utils/cartStore';
import { CartHeader } from './CartHeader';
import { CartItemList } from './CartItemList';
import { CartFooter } from './CartFooter';
import { CartEmpty } from './CartEmpty';
import { PremiumTheme } from 'utils/premiumTheme';
import { cn } from 'utils/cn';
import type { MenuItem } from 'types';

// Sheet states
type SheetState = 'closed' | 'mini' | 'full';

// Heights for different states
const MINI_HEIGHT = 120; // Summary bar height
const FULL_HEIGHT_PERCENT = 0.85; // 85% of viewport

export interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
  selectedDeliveryZone?: any;
  onCheckout?: () => void;
  onSignIn?: () => void;
  isAuthenticated?: boolean;
  className?: string;
}

export function CartSheet({
  isOpen,
  onClose,
  menuItems,
  selectedDeliveryZone,
  onCheckout,
  onSignIn,
  isAuthenticated = false,
  className,
}: CartSheetProps) {
  const { items, totalItems, totalAmount, currentOrderMode } = useCartStore();
  const [sheetState, setSheetState] = useState<SheetState>('full');
  const sheetRef = useRef<HTMLDivElement>(null);

  // Motion values for drag
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0.5]);

  // Calculate full height
  const fullHeight = typeof window !== 'undefined'
    ? window.innerHeight * FULL_HEIGHT_PERCENT
    : 600;

  // Handle drag end - determine next state
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (sheetState === 'full') {
      // From full: swipe down to minimize or close
      if (velocity > 500 || offset > 200) {
        if (velocity > 1000 || offset > 400) {
          // Fast/long swipe = close
          onClose();
        } else {
          // Medium swipe = minimize
          setSheetState('mini');
        }
      }
    } else if (sheetState === 'mini') {
      // From mini: swipe up to expand, down to close
      if (velocity < -300 || offset < -50) {
        setSheetState('full');
      } else if (velocity > 300 || offset > 50) {
        onClose();
      }
    }
  }, [sheetState, onClose]);

  // Handle tap on mini state to expand
  const handleMiniTap = useCallback(() => {
    if (sheetState === 'mini') {
      setSheetState('full');
    }
  }, [sheetState]);

  // Reset to full state when opening
  React.useEffect(() => {
    if (isOpen) {
      setSheetState('full');
    }
  }, [isOpen]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            style={{ touchAction: 'auto' }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{
              y: 0,
              height: sheetState === 'mini' ? MINI_HEIGHT : fullHeight,
            }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              height: { duration: 0.3, ease: 'easeInOut' }
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'rounded-t-3xl overflow-hidden',
              'flex flex-col',
              className
            )}
          >
            {/* Sheet content container */}
            <div
              className="flex flex-col h-full"
              style={{
                background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
                paddingBottom: 'env(safe-area-inset-bottom, 20px)',
              }}
            >
              {/* Drag handle - larger tap area for accessibility */}
              <div
                className="flex justify-center py-4 cursor-grab active:cursor-grabbing"
                onClick={handleMiniTap}
                style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}
              >
                <div
                  className="w-12 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: PremiumTheme.colors.border.medium }}
                />
              </div>

              {/* Mini state - Summary bar */}
              {sheetState === 'mini' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between px-5 pb-4"
                  onClick={handleMiniTap}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: PremiumTheme.colors.burgundy[500] + '30' }}
                    >
                      <span className="text-lg font-bold" style={{ color: PremiumTheme.colors.burgundy[400] }}>
                        {totalItems}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: PremiumTheme.colors.text.primary }}>
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </p>
                      <p className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                        Tap to view cart
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: PremiumTheme.colors.text.primary }}>
                      {formatPrice(totalAmount)}
                    </p>
                    <p className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                      {currentOrderMode === 'delivery' ? '+ delivery' : 'Collection'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Full state - Complete cart */}
              {sheetState === 'full' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  {/* Header */}
                  <CartHeader onClose={onClose} />

                  {/* Content */}
                  {items.length === 0 ? (
                    <CartEmpty />
                  ) : (
                    <>
                      {/* Scrollable item list with iOS momentum scrolling */}
                      <div
                        className="flex-1 overflow-y-auto"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        <CartItemList
                          items={items}
                          menuItems={menuItems}
                        />
                      </div>

                      {/* Footer with totals and checkout */}
                      <CartFooter
                        onCheckout={onCheckout}
                        onSignIn={onSignIn}
                        isAuthenticated={isAuthenticated}
                        selectedDeliveryZone={selectedDeliveryZone}
                      />
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartSheet;
