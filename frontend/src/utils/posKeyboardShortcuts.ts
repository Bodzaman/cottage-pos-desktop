/**
 * POS Keyboard Shortcuts Registry
 *
 * Centralised shortcut mapping for the POS Desktop interface.
 * All keyboard shortcuts are registered/unregistered in one place
 * so they can be displayed in a help overlay and easily modified.
 *
 * Key layout:
 *   F1        – New order (clear cart)
 *   F2        – Checkout / payment flow
 *   F3        – Print receipt
 *   F4        – Lock screen
 *   F5        – Refresh menu
 *   F6–F12    – Jump to section 1-7 (Starters … Set Meals)
 *   Escape    – Cancel / close modal
 *   Ctrl+P    – Reprint last receipt
 *   Ctrl+Z    – Undo last cart action
 *   Numpad +  – Increase quantity of selected item
 *   Numpad -  – Decrease quantity of selected item
 */

import { FIXED_SECTIONS } from './sectionMapping';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShortcutAction {
  key: string;
  label: string;
  description: string;
  /** Set true if the shortcut requires Ctrl/Cmd modifier */
  ctrl?: boolean;
}

export interface POSShortcutHandlers {
  onNewOrder: () => void;
  onCheckout: () => void;
  onPrintReceipt: () => void;
  onLockScreen: () => void;
  onRefreshMenu: () => void;
  onSectionSelect: (sectionUuid: string | null) => void;
  onEscape: () => void;
  onReprintLast: () => void;
  onUndo: () => void;
  onQuantityUp: () => void;
  onQuantityDown: () => void;
}

// ---------------------------------------------------------------------------
// Shortcut catalogue (for help overlay / tooltips)
// ---------------------------------------------------------------------------

export const POS_SHORTCUTS: ShortcutAction[] = [
  { key: 'F1', label: 'New Order', description: 'Clear cart and start a new order' },
  { key: 'F2', label: 'Checkout', description: 'Open payment flow' },
  { key: 'F3', label: 'Print', description: 'Print current receipt' },
  { key: 'F4', label: 'Lock', description: 'Lock the POS screen' },
  { key: 'F5', label: 'Refresh', description: 'Refresh menu from server' },
  ...FIXED_SECTIONS.map((s, i) => ({
    key: `F${6 + i}`,
    label: s.displayName,
    description: `Jump to ${s.displayName} section`,
  })),
  { key: 'Escape', label: 'Cancel', description: 'Close active modal / cancel' },
  { key: 'K', label: 'Command Palette', description: 'Search commands and menu items', ctrl: true },
  { key: '8', label: '86 Board', description: 'Toggle 86\'d items panel', ctrl: true },
  { key: 'P', label: 'Reprint', description: 'Open reprint dialog', ctrl: true },
  { key: 'Z', label: 'Undo', description: 'Undo last cart change', ctrl: true },
  { key: 'NumpadAdd', label: 'Qty +', description: 'Increase quantity' },
  { key: 'NumpadSubtract', label: 'Qty -', description: 'Decrease quantity' },
];

// ---------------------------------------------------------------------------
// Section F-key map  (F6 → index 0 = Starters, F12 → index 6 = Set Meals)
// ---------------------------------------------------------------------------

const SECTION_FKEY_MAP: Record<string, string | null> = {};
FIXED_SECTIONS.forEach((section, index) => {
  SECTION_FKEY_MAP[`F${6 + index}`] = section.uuid;
});

// ---------------------------------------------------------------------------
// Register / unregister
// ---------------------------------------------------------------------------

/**
 * Attach the global keydown listener.
 * Returns a cleanup function to remove the listener (call on unmount).
 */
export function registerPOSShortcuts(
  handlers: POSShortcutHandlers,
  options: { isLocked: boolean }
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip when locked
    if (options.isLocked) return;

    // Skip when focus is in an input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;

    // ---- Ctrl combos ----
    if (ctrl) {
      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          handlers.onReprintLast();
          return;
        case 'z':
          e.preventDefault();
          handlers.onUndo();
          return;
      }
    }

    // ---- F-keys & others ----
    switch (e.key) {
      // F1-F5: existing POS actions (handled in POSDesktop effect already)
      // We intentionally DO NOT duplicate F1-F5 here — they're managed inline.

      // F6-F12: Section quick-select
      case 'F6':
      case 'F7':
      case 'F8':
      case 'F9':
      case 'F10':
      case 'F11':
      case 'F12': {
        e.preventDefault();
        const sectionUuid = SECTION_FKEY_MAP[e.key] ?? null;
        handlers.onSectionSelect(sectionUuid);
        return;
      }

      case 'Escape':
        handlers.onEscape();
        return;

      // Numpad quantity adjustment
      case '+':
      case 'Add':
        e.preventDefault();
        handlers.onQuantityUp();
        return;
      case '-':
      case 'Subtract':
        e.preventDefault();
        handlers.onQuantityDown();
        return;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
