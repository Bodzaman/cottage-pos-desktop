/**
 * UnifiedCart - Main cart orchestrator
 *
 * Detects device type and renders:
 * - Mobile: Bottom sheet (CartSheet)
 * - Desktop: Side panel (CartPanel)
 *
 * Features:
 * - Responsive layout switching
 * - Shared cart state via cartStore
 * - Animation coordination
 * - Accessibility support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useCartStore } from 'utils/cartStore';
import { CartSheet } from './CartSheet';
import { CartPanel } from './CartPanel';
import type { MenuItem } from 'types';

// Breakpoint for mobile/desktop detection
const MOBILE_BREAKPOINT = 768;

export interface UnifiedCartProps {
  /** Menu items for recommendations and editing */
  menuItems?: MenuItem[];
  /** Delivery zone configuration */
  selectedDeliveryZone?: any;
  /** Callback when checkout is triggered */
  onCheckout?: () => void;
  /** Callback for sign in action */
  onSignIn?: () => void;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Custom class name */
  className?: string;
}

export function UnifiedCart({
  menuItems,
  selectedDeliveryZone,
  onCheckout,
  onSignIn,
  isAuthenticated = false,
  className,
}: UnifiedCartProps) {
  const { isCartOpen, closeCart } = useCartStore();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle checkout navigation
  const handleCheckout = useCallback(() => {
    closeCart();
    if (onCheckout) {
      onCheckout();
    }
  }, [closeCart, onCheckout]);

  // Handle sign in
  const handleSignIn = useCallback(() => {
    closeCart();
    if (onSignIn) {
      onSignIn();
    }
  }, [closeCart, onSignIn]);

  // Shared props for both views
  const cartProps = {
    isOpen: isCartOpen,
    onClose: closeCart,
    menuItems,
    selectedDeliveryZone,
    onCheckout: handleCheckout,
    onSignIn: handleSignIn,
    isAuthenticated,
  };

  // Render mobile bottom sheet or desktop panel
  if (isMobile) {
    return <CartSheet {...cartProps} className={className} />;
  }

  return <CartPanel {...cartProps} className={className} />;
}

export default UnifiedCart;
