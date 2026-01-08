import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description: string;
  disabled?: boolean;
}

/**
 * Reusable keyboard shortcuts hook
 * 
 * @example
 * useKeyboardShortcuts([
 *   { key: 'c', shiftKey: true, callback: toggleCart, description: 'Toggle cart' },
 *   { key: 'Enter', shiftKey: true, callback: checkout, description: 'Checkout' },
 *   { key: 'Escape', callback: closeModal, description: 'Close' }
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
        const metaMatch = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

        if (keyMatch && shiftMatch && ctrlMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.callback();
          break; // Only trigger first matching shortcut
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook specifically for cart-related keyboard shortcuts
 */
export function useCartKeyboardShortcuts({
  onToggleCart,
  onCheckout,
  onCloseCart,
  isCartOpen,
  canCheckout
}: {
  onToggleCart: () => void;
  onCheckout: () => void;
  onCloseCart: () => void;
  isCartOpen: boolean;
  canCheckout: boolean;
}) {
  useKeyboardShortcuts([
    {
      key: 'c',
      shiftKey: true,
      callback: onToggleCart,
      description: 'Toggle cart sidebar',
    },
    {
      key: 'Enter',
      shiftKey: true,
      callback: onCheckout,
      description: 'Proceed to checkout',
      disabled: !canCheckout || !isCartOpen,
    },
    {
      key: 'Escape',
      callback: onCloseCart,
      description: 'Close cart',
      disabled: !isCartOpen,
    },
  ]);
}
