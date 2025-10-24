import { useCallback } from 'react';
import { toast } from 'sonner';
import type { OrderItem } from './menuTypes';

/**
 * Hook: useOrderManagement
 * 
 * RESPONSIBILITY:
 * Manages the order items array in POSDesktop's current active order.
 * Handles all mutations to orderItems: add, remove, update quantity, notes, and modifiers.
 * Implements duplicate detection to prevent identical items from cluttering the order.
 * 
 * DATA FLOW:
 * 1. Receives orderItems array and setOrderItems updater from POSDesktop
 * 2. Provides handlers that wrap setOrderItems with business logic
 * 3. Handlers update orderItems via functional updates: setOrderItems(prev => ...)
 * 4. POSDesktop state updates → UI re-renders → OrderSummaryPanel displays changes
 * 
 * DUPLICATE DETECTION ALGORITHM:
 * When adding an item, checks if identical item exists by comparing:
 * - Same menu_item_id
 * - Same variant_id
 * - Same notes
 * - Same modifiers (sorted by modifier_id for comparison)
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
 * - None (pure state management)
 * - Uses sonner for user feedback toasts
 * 
 * @param orderItems - Current array of items in the order
 * @param setOrderItems - State setter function from POSDesktop
 * @returns Order management handlers and utilities
 */
export function useOrderManagement(
  orderItems: OrderItem[],
  setOrderItems: (items: OrderItem[] | ((prev: OrderItem[]) => OrderItem[])) => void
) {
  // ============================================================================
  // ADD TO ORDER - With duplicate detection
  // ============================================================================
  const handleAddToOrder = useCallback((orderItem: OrderItem) => {
    setOrderItems(prev => {
      const currentItems = prev;
      
      // Check for duplicate item (same menu item + variant + modifiers)
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
        
        return sameMenuItem && sameVariant && sameNotes && sameModifiers;
      });
      
      if (duplicateIndex >= 0) {
        // Increment quantity of existing item
        const updatedItems = currentItems.map((item, index) => 
          index === duplicateIndex 
            ? { ...item, quantity: item.quantity + orderItem.quantity }
            : item
        );
        toast.success(`Increased quantity of ${orderItem.name} (now ${currentItems[duplicateIndex].quantity + orderItem.quantity})`);
        return updatedItems;
      } else {
        // Add as new item
        const newItems = [...currentItems, orderItem];
        toast.success(`Added ${orderItem.name} to order`);
        return newItems;
      }
    });
  }, [setOrderItems]);

  // ============================================================================
  // REMOVE ITEM
  // ============================================================================
  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
    toast.info("Item removed from order");
  }, [setOrderItems]);

  // ============================================================================
  // UPDATE QUANTITY
  // ============================================================================
  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter((_, i) => i !== index));
      toast.info("Item removed from order");
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
    toast.info('Order cleared');
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
    toast.success('Item updated');
  }, [setOrderItems]);

  // ============================================================================
  // GET DISPLAY ORDER ITEMS
  // ============================================================================
  const getDisplayOrderItems = useCallback(() => {
    return orderItems;
  }, [orderItems]);

  // ============================================================================
  // CALCULATE ORDER TOTAL
  // ============================================================================
  const calculateOrderTotal = useCallback((): number => {
    return orderItems.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;
      
      // Add modifier prices if present
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          itemTotal += (modifier.price_adjustment || 0) * item.quantity;
        });
      }
      
      return total + itemTotal;
    }, 0);
  }, [orderItems]);

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
