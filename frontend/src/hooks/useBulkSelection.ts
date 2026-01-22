/**
 * useBulkSelection Hook
 *
 * Manages multi-select state for bulk operations on menu items.
 *
 * Features:
 * - Toggle individual item selection
 * - Select all visible items
 * - Range selection with Shift+Click
 * - Keyboard shortcuts (Ctrl/Cmd+A, Escape)
 * - Clear selection
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

export interface UseBulkSelectionOptions {
  /** Enable keyboard shortcuts (Ctrl/Cmd+A, Escape) */
  enableKeyboardShortcuts?: boolean;
}

export interface UseBulkSelectionReturn<T extends { id: string }> {
  /** Set of selected item IDs */
  selectedIds: Set<string>;
  /** Check if an item is selected */
  isSelected: (id: string) => boolean;
  /** Toggle selection for a single item */
  toggle: (id: string) => void;
  /** Select all items in the provided list */
  selectAll: (items: T[]) => void;
  /** Clear all selections */
  clearAll: () => void;
  /** Select a range of items (for Shift+Click) */
  selectRange: (items: T[], fromId: string, toId: string) => void;
  /** Number of selected items */
  count: number;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Last clicked item ID (for range selection) */
  lastClickedId: string | null;
  /** Handle click with modifier key support */
  handleClick: (id: string, event?: React.MouseEvent, items?: T[]) => void;
}

/**
 * Hook for managing bulk selection state
 */
export function useBulkSelection<T extends { id: string }>(
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionReturn<T> {
  const { enableKeyboardShortcuts = true } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  // Check if an item is selected
  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  // Toggle selection for a single item
  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLastClickedId(id);
  }, []);

  // Select all items
  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, []);

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastClickedId(null);
  }, []);

  // Select a range of items (for Shift+Click)
  const selectRange = useCallback((items: T[], fromId: string, toId: string) => {
    const fromIndex = items.findIndex((item) => item.id === fromId);
    const toIndex = items.findIndex((item) => item.id === toId);

    if (fromIndex === -1 || toIndex === -1) return;

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    const rangeIds = items.slice(start, end + 1).map((item) => item.id);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      rangeIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // Handle click with modifier key support
  const handleClick = useCallback(
    (id: string, event?: React.MouseEvent, items?: T[]) => {
      // Shift+Click for range selection
      if (event?.shiftKey && lastClickedId && items) {
        selectRange(items, lastClickedId, id);
        setLastClickedId(id);
        return;
      }

      // Ctrl/Cmd+Click for toggle
      if (event?.ctrlKey || event?.metaKey) {
        toggle(id);
        return;
      }

      // Regular click - toggle the item
      toggle(id);
    },
    [lastClickedId, selectRange, toggle]
  );

  // Computed values
  const count = selectedIds.size;
  const hasSelection = count > 0;

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to clear selection
      if (event.key === 'Escape' && hasSelection) {
        event.preventDefault();
        clearAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, hasSelection, clearAll]);

  return {
    selectedIds,
    isSelected,
    toggle,
    selectAll,
    clearAll,
    selectRange,
    count,
    hasSelection,
    lastClickedId,
    handleClick,
  };
}

export default useBulkSelection;
