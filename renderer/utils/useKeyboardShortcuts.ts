import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export type KeyboardShortcut = {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
};

/**
 * useKeyboardShortcuts - Global keyboard navigation
 * 
 * Registers keyboard shortcuts with priority handling
 * 
 * @param shortcuts - Array of keyboard shortcuts to register
 * @param enabled - Whether shortcuts are enabled (default: true)
 * 
 * @example
 * useKeyboardShortcuts([
 *   { key: '1', altKey: true, description: 'Go to profile', action: () => navigate('/profile') },
 *   { key: 'Escape', description: 'Close modal', action: () => setOpen(false) }
 * ]);
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;
      
      if (isInput || isContentEditable) return;

      // Find matching shortcut
      const shortcut = shortcuts.find(s => {
        const keyMatches = s.key.toLowerCase() === event.key.toLowerCase();
        const altMatches = s.altKey === undefined || s.altKey === event.altKey;
        const ctrlMatches = s.ctrlKey === undefined || s.ctrlKey === event.ctrlKey;
        const shiftMatches = s.shiftKey === undefined || s.shiftKey === event.shiftKey;
        const metaMatches = s.metaKey === undefined || s.metaKey === event.metaKey;
        const isEnabled = s.enabled === undefined || s.enabled;
        
        return keyMatches && altMatches && ctrlMatches && shiftMatches && metaMatches && isEnabled;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * useGlobalKeyboardShortcuts - Global keyboard shortcuts for CustomerPortal
 * 
 * Provides navigation shortcuts for authenticated users:
 * - Alt+1 → Profile section
 * - Alt+2 → Addresses section  
 * - Alt+3 → Orders section
 * - Alt+4 → Favorites section
 * - Alt+M → Go to Menu
 * - Alt+C → Open Cart
 * - Escape → Close modals/drawers
 * - ? → Show keyboard shortcuts help
 */
export function useGlobalKeyboardShortcuts({
  onNavigateToSection,
  onNavigateToMenu,
  onOpenCart,
  onShowHelp,
  onEscape,
  isAuthenticated = false
}: {
  onNavigateToSection?: (section: string) => void;
  onNavigateToMenu?: () => void;
  onOpenCart?: () => void;
  onShowHelp?: () => void;
  onEscape?: () => void;
  isAuthenticated?: boolean;
}) {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Section navigation (CustomerPortal only)
    {
      key: '1',
      altKey: true,
      description: 'Go to Profile section',
      action: () => onNavigateToSection?.('profile'),
      enabled: isAuthenticated && !!onNavigateToSection
    },
    {
      key: '2',
      altKey: true,
      description: 'Go to Addresses section',
      action: () => onNavigateToSection?.('addresses'),
      enabled: isAuthenticated && !!onNavigateToSection
    },
    {
      key: '3',
      altKey: true,
      description: 'Go to Orders section',
      action: () => onNavigateToSection?.('orders'),
      enabled: isAuthenticated && !!onNavigateToSection
    },
    {
      key: '4',
      altKey: true,
      description: 'Go to Favorites section',
      action: () => onNavigateToSection?.('favorites'),
      enabled: isAuthenticated && !!onNavigateToSection
    },
    
    // Global navigation
    {
      key: 'm',
      altKey: true,
      description: 'Go to Menu',
      action: () => {
        if (onNavigateToMenu) {
          onNavigateToMenu();
        } else {
          navigate('/online-orders');
        }
      },
      enabled: isAuthenticated
    },
    {
      key: 'c',
      altKey: true,
      description: 'Open Cart',
      action: () => onOpenCart?.(),
      enabled: isAuthenticated && !!onOpenCart
    },
    
    // Utility shortcuts
    {
      key: 'Escape',
      description: 'Close modals/drawers',
      action: () => onEscape?.(),
      enabled: !!onEscape
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => onShowHelp?.(),
      enabled: !!onShowHelp
    }
  ];

  useKeyboardShortcuts(shortcuts, true);

  return shortcuts.filter(s => s.enabled !== false);
}
