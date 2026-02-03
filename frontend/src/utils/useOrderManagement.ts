import { useCallback } from 'react';
import type { OrderItem } from './types';
import { usePOSOrderStore } from './posOrderStore';

/**
 * Hook: useOrderManagement
 *
 * RESPONSIBILITY:
 * Manages the order items array in POSDesktop's current active order.
 * Handles all mutations to orderItems: add, remove, update quantity, notes, and modifiers.
 * Implements duplicate detection to prevent identical items from cluttering the order.
 *
 * DATA FLOW:
 * 1. Subscribes to orderItems from usePOSOrderStore internally
 * 2. Provides handlers that wrap setOrderItems with business logic
 * 3. Handlers update orderItems via functional updates: setOrderItems(prev => ...)
 * 4. Store updates → components that subscribe to orderItems re-render
 *
 * DUPLICATE DETECTION ALGORITHM:
 * When adding an item, checks if identical item exists by comparing:
 * - Same menu_item_id
 * - Same variant_id
 * - Same notes
 * - Same modifiers (sorted by modifier_id for comparison)
 * - Same customizations (sorted by customization_id/id for comparison) ✅ ADDED
 * If duplicate found → increment quantity
 * If unique → add as new item
 *
 * KEY OPERATIONS:
 * - handleAddToOrder(): Adds item with duplicate detection
 * - handleRemoveItem(): Removes item by id
 * - handleUpdateQuantity(): Updates quantity, removes if <= 0
 * - handleCustomizeItem(): Updates modifiers/notes via CustomizeOrchestrator
 * - handleClearOrder(): Resets orderItems to []
 * - calculateOrderTotal(): Sums item prices + modifier adjustments
 *
 * DEPENDENCIES:
 * - usePOSOrderStore: Zustand store for order state
 * - Uses sonner for user feedback toasts
 *
 * NOTE: This hook now subscribes to orderItems internally, removing the need
 * for POSDesktop to pass orderItems. This prevents menu flicker when cart changes.
 *
 * @returns Order management handlers and utilities
 */
export function useOrderManagement() {
  // 🔧 FIX: Only subscribe to setOrderItems - NOT orderItems!
  // Subscribing to orderItems causes this hook to re-render when cart changes,
  // which causes POSDesktop to re-render and flicker the menu.
  // Instead, use usePOSOrderStore.getState().orderItems imperatively in callbacks.
  const setOrderItems = usePOSOrderStore(state => state.setOrderItems);
  // ============================================================================
  // ADD TO ORDER - With duplicate detection
  // ============================================================================
  const handleAddToOrder = useCallback((orderItem: OrderItem) => {
    setOrderItems(prev => {
      const currentItems = prev;
      
      // Check for duplicate item (same menu item + variant + modifiers + customizations)
      const duplicateIndex = currentItems.findIndex(existingItem => {
        const sameMenuItem = existingItem.menu_item_id === orderItem.menu_item_id;
        const sameVariant = existingItem.variant_id === orderItem.variant_id;
        const sameNotes = existingItem.notes === orderItem.notes;

        // Compare modifiers arrays (if both have modifiers)
        const sameModifiers = (() => {
          const existingMods = existingItem.modifiers || [];
          const newMods = orderItem.modifiers || [];

          if (existingMods.length !== newMods.length) return false;

          // Sort and compare modifier arrays
          const sortedExisting = existingMods.sort((a, b) => a.modifier_id.localeCompare(b.modifier_id));
          const sortedNew = newMods.sort((a, b) => a.modifier_id.localeCompare(b.modifier_id));

          return sortedExisting.every((mod, index) => {
            const newMod = sortedNew[index];
            return mod.modifier_id === newMod.modifier_id &&
                   mod.option_id === newMod.option_id;
          });
        })();

        // ✅ CRITICAL FIX: Compare customizations arrays
        const sameCustomizations = (() => {
          const existingCust = existingItem.customizations || [];
          const newCust = orderItem.customizations || [];

          if (existingCust.length !== newCust.length) return false;

          // Sort and compare customizations by id and price
          const sortedExisting = [...existingCust].sort((a, b) =>
            (a.customization_id || a.id || '').localeCompare(b.customization_id || b.id || '')
          );
          const sortedNew = [...newCust].sort((a, b) =>
            (a.customization_id || a.id || '').localeCompare(b.customization_id || b.id || '')
          );

          return sortedExisting.every((cust, index) => {
            const newCust = sortedNew[index];
            const sameId = (cust.customization_id || cust.id) === (newCust.customization_id || newCust.id);
            const samePrice = (cust.price_adjustment || 0) === (newCust.price_adjustment || 0);
            return sameId && samePrice;
          });
        })();

        return sameMenuItem && sameVariant && sameNotes && sameModifiers && sameCustomizations;
      });
      
      if (duplicateIndex >= 0) {
        // Increment quantity of existing item
        const updatedItems = currentItems.map((item, index) =>
          index === duplicateIndex
            ? { ...item, quantity: item.quantity + orderItem.quantity }
            : item
        );
        return updatedItems;
      } else {
        // Add as new item
        const newItems = [...currentItems, orderItem];
        return newItems;
      }
    });
  }, [setOrderItems]);

  // ============================================================================
  // REMOVE ITEM
  // ============================================================================
  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  }, [setOrderItems]);

  // ============================================================================
  // UPDATE QUANTITY
  // ============================================================================
  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter((_, i) => i !== index));
      return;
    }

    setOrderItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity } : item
    ));
  }, [setOrderItems]);

  // ============================================================================
  // CLEAR ORDER
  // ============================================================================
  const handleClearOrder = useCallback(() => {
    setOrderItems([]);
  }, [setOrderItems]);

  // ============================================================================
  // INCREMENT ITEM
  // ============================================================================
  const handleIncrementItem = useCallback((itemId: string) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
    ));
  }, [setOrderItems]);

  // ============================================================================
  // DECREMENT ITEM
  // ============================================================================
  const handleDecrementItem = useCallback((itemId: string) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity - 1);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  }, [setOrderItems]);

  // ============================================================================
  // UPDATE NOTES
  // ============================================================================
  const handleUpdateNotes = useCallback((itemId: string, notes: string) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  }, [setOrderItems]);

  // ============================================================================
  // CUSTOMIZE ITEM - Save customizations from CustomizeOrchestrator
  // ============================================================================
  const handleCustomizeItem = useCallback((index: number, item: OrderItem) => {
    setOrderItems(prev => {
      const newItems = [...prev];
      if (index >= 0 && index < newItems.length) {
        // Preserve existing id and ensure we keep essential identifiers
        const existing = newItems[index];
        const updated: OrderItem = {
          ...existing,
          ...item,
          // Ensure identifiers remain unchanged
          id: existing.id,
          menu_item_id: existing.menu_item_id,
          variant_id: existing.variant_id,
        };
        newItems[index] = updated;
      }
      return newItems;
    });
  }, [setOrderItems]);

  // ============================================================================
  // GET DISPLAY ORDER ITEMS
  // ============================================================================
  const getDisplayOrderItems = useCallback(() => {
    // 🔧 FIX: Use imperative access - no reactive subscription
    return usePOSOrderStore.getState().orderItems;
  }, []);  // Empty deps - stable callback

  // ============================================================================
  // CALCULATE ORDER TOTAL
  // ============================================================================
  const calculateOrderTotal = useCallback((): number => {
    // 🔧 FIX: Use imperative access - no reactive subscription
    const orderItems = usePOSOrderStore.getState().orderItems;
    return orderItems.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;

      // Add modifier prices if present
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          itemTotal += (modifier.price_adjustment || 0) * item.quantity;
        });
      }

      // Add customization prices if present
      if (item.customizations && item.customizations.length > 0) {
        item.customizations.forEach(customization => {
          itemTotal += (customization.price_adjustment || 0) * item.quantity;
        });
      }

      return total + itemTotal;
    }, 0);
  }, []);  // Empty deps - stable callback

  return {
    // Handlers
    handleAddToOrder,
    handleRemoveItem,
    handleUpdateQuantity,
    handleClearOrder,
    handleIncrementItem,
    handleDecrementItem,
    handleUpdateNotes,
    handleCustomizeItem,
    
    // Utilities
    getDisplayOrderItems,
    calculateOrderTotal,
  };
}
