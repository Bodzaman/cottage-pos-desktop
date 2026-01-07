/**
 * Menu Item Configuration State Management
 * 
 * Manages the two-step configuration wizard state for creating menu items:
 * Step 1: Item Type (food, drinks_wine, coffee_desserts)
 * Step 2: Pricing Mode (single price vs multiple variants)
 * 
 * This configuration is locked once an item is created to prevent data loss.
 * 
 * @module menuItemConfiguration
 */

import { useState, useCallback } from 'react';

/**
 * Item type options
 */
export type ItemType = 'food' | 'drinks_wine' | 'coffee_desserts';

/**
 * Pricing mode options
 */
export type PricingMode = 'single' | 'variants';

/**
 * Complete configuration for a menu item
 */
export interface MenuItemConfiguration {
  /** Type of item (determines which category and fields) */
  itemType: ItemType;
  
  /** Pricing structure (single price or variants) */
  pricingMode: PricingMode;
  
  /** When this configuration was created */
  configuredAt: Date;
  
  /** Whether this configuration is locked (true for existing items) */
  isLocked: boolean;
}

/**
 * Detect configuration from existing menu item data
 * Used when editing existing items to show locked configuration
 * 
 * @param itemData - Existing menu item data
 * @returns Configuration derived from item data
 */
export function detectConfigurationFromItem(itemData: any): MenuItemConfiguration {
  return {
    itemType: itemData.item_type || 'food',
    pricingMode: itemData.has_variants ? 'variants' : 'single',
    configuredAt: new Date(itemData.created_at || Date.now()),
    isLocked: true // Always locked for existing items
  };
}

/**
 * Hook for managing menu item configuration state
 * 
 * @example
 * """tsx
 * const {
 *   config,
 *   setItemType,
 *   setPricingMode,
 *   isComplete,
 *   reset,
 *   lockConfiguration
 * } = useMenuItemConfiguration();
 * 
 * // Step 1: Set item type
 * setItemType('food');
 * 
 * // Step 2: Set pricing mode
 * setPricingMode('variants');
 * 
 * // Check if complete
 * if (isComplete()) {
 *   // Open form with config
 * }
 * """
 */
export function useMenuItemConfiguration() {
  const [config, setConfig] = useState<MenuItemConfiguration | null>(null);

  /**
   * Set the item type (Step 1 of wizard)
   */
  const setItemType = useCallback((itemType: ItemType) => {
    setConfig(prev => ({
      itemType,
      pricingMode: prev?.pricingMode || 'variants', // Default to variants
      configuredAt: new Date(),
      isLocked: false
    }));
  }, []);

  /**
   * Set the pricing mode (Step 2 of wizard)
   */
  const setPricingMode = useCallback((pricingMode: PricingMode) => {
    setConfig(prev => {
      if (!prev) {
        throw new Error('Must set item type before pricing mode');
      }
      return {
        ...prev,
        pricingMode,
        configuredAt: new Date()
      };
    });
  }, []);

  /**
   * Set complete configuration at once
   * Useful when loading from existing item
   */
  const setCompleteConfiguration = useCallback((newConfig: MenuItemConfiguration) => {
    setConfig(newConfig);
  }, []);

  /**
   * Check if configuration is complete
   */
  const isComplete = useCallback(() => {
    return config !== null && 
           config.itemType !== undefined && 
           config.pricingMode !== undefined;
  }, [config]);

  /**
   * Lock configuration (prevents further changes)
   * Used when moving from wizard to form
   */
  const lockConfiguration = useCallback(() => {
    setConfig(prev => prev ? { ...prev, isLocked: true } : null);
  }, []);

  /**
   * Reset configuration to initial state
   */
  const reset = useCallback(() => {
    setConfig(null);
  }, []);

  /**
   * Get configuration for form initialization
   * Returns has_variants value based on pricing mode
   */
  const getFormDefaults = useCallback(() => {
    if (!config) return null;
    
    return {
      item_type: config.itemType,
      has_variants: config.pricingMode === 'variants'
    };
  }, [config]);

  return {
    config,
    setItemType,
    setPricingMode,
    setCompleteConfiguration,
    isComplete,
    lockConfiguration,
    reset,
    getFormDefaults
  };
}

/**
 * Get display name for item type
 */
export function getItemTypeDisplayName(itemType: ItemType): string {
  switch (itemType) {
    case 'food':
      return 'Food';
    case 'drinks_wine':
      return 'Drinks & Wine';
    case 'coffee_desserts':
      return 'Coffee & Desserts';
    default:
      return itemType;
  }
}

/**
 * Get display name for pricing mode
 */
export function getPricingModeDisplayName(pricingMode: PricingMode): string {
  switch (pricingMode) {
    case 'single':
      return 'Single Price';
    case 'variants':
      return 'Multiple Variants';
    default:
      return pricingMode;
  }
}

/**
 * Get icon for item type
 */
export function getItemTypeIcon(itemType: ItemType): string {
  switch (itemType) {
    case 'food':
      return '🍛';
    case 'drinks_wine':
      return '🍷';
    case 'coffee_desserts':
      return '☕';
    default:
      return '📋';
  }
}
