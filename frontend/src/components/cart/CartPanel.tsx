/**
 * CartPanel - Desktop side drawer cart
 *
 * Features:
 * - Slides in from right
 * - Fixed width: 450px
 * - Backdrop blur overlay
 * - Click outside to close
 * - Keyboard accessible (Escape to close)
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from 'utils/cartStore';
import { CartHeader } from './CartHeader';
import { CartItemList } from './CartItemList';
import { CartFooter } from './CartFooter';
import { CartEmpty } from './CartEmpty';
import { PremiumTheme } from 'utils/premiumTheme';
import { cn } from 'utils/cn';
import type { MenuItem } from 'types';

const PANEL_WIDTH = 450;

export interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
  selectedDeliveryZone?: any;
  onCheckout?: () => void;
  onSignIn?: () => void;
  isAuthenticated?: boolean;
  className?: string;
}

export function CartPanel({
  isOpen,
  onClose,
  menuItems,
  selectedDeliveryZone,
  onCheckout,
  onSignIn,
  isAuthenticated = false,
  className,
}: CartPanelProps) {
  const { items } = useCartStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap - return focus to trigger element on close
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus first focusable element in panel
      setTimeout(() => {
        const firstFocusable = panelRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
    } else {
      // Return focus on close
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Click outside handler
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: PANEL_WIDTH, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: PANEL_WIDTH, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className={cn(
              'fixed top-0 right-0 h-full z-50',
              'flex flex-col',
              className
            )}
            style={{
              width: PANEL_WIDTH,
              background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
              borderLeft: `1px solid ${PremiumTheme.colors.border.light}`,
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <CartHeader onClose={onClose} />

            {/* Content */}
            {items.length === 0 ? (
              <CartEmpty />
            ) : (
              <>
                {/* Scrollable item list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
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
        </>
      )}
    </AnimatePresence>
  );
}

export default CartPanel;
