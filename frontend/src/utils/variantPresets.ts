/**
 * Variant Presets Utility
 * 
 * Pre-configured variant templates for quick menu item setup.
 * Provides smart defaults for common variant types (proteins, sizes, etc.)
 * with automatic price markups based on item type.
 */

import { MenuItemVariant } from './masterTypes';

/**
 * Preset configuration for a variant type
 */
export interface VariantPreset {
  name: string;
  defaultMarkup: number; // Price adjustment from base price
  description?: string;
}

/**
 * Preset groups organized by item type
 */
export const VARIANT_PRESETS: Record<string, VariantPreset[]> = {
  // Food items - protein-based variants
  food: [
    { name: 'Chicken', defaultMarkup: 0, description: 'Standard protein option' },
    { name: 'Lamb', defaultMarkup: 1.00, description: 'Premium red meat' },
    { name: 'King Prawn', defaultMarkup: 3.00, description: 'Premium seafood' },
    { name: 'Prawn', defaultMarkup: 2.00, description: 'Seafood option' },
    { name: 'Fish', defaultMarkup: 2.00, description: 'Seafood option' },
    { name: 'Vegetable', defaultMarkup: -1.00, description: 'Vegetarian option' },
    { name: 'Paneer', defaultMarkup: 0.50, description: 'Vegetarian protein' },
    { name: 'Mushroom', defaultMarkup: -0.50, description: 'Vegetarian option' },
    { name: 'Mixed Vegetable', defaultMarkup: -0.50, description: 'Vegetarian option' },
    { name: 'Tofu', defaultMarkup: 0, description: 'Vegan protein' },
    { name: 'Beef', defaultMarkup: 1.50, description: 'Premium red meat' },
    { name: 'Duck', defaultMarkup: 2.50, description: 'Premium poultry' },
  ],
  
  // Drinks & Wine - size-based variants
  drinks_wine: [
    { name: 'Glass (175ml)', defaultMarkup: 0, description: 'Standard serving' },
    { name: 'Glass (250ml)', defaultMarkup: 2.00, description: 'Large serving' },
    { name: 'Bottle (750ml)', defaultMarkup: 15.00, description: 'Full bottle' },
    { name: 'Carafe (500ml)', defaultMarkup: 8.00, description: 'Half bottle' },
  ],
  
  // Coffee & Desserts - size-based variants
  coffee_desserts: [
    { name: 'Small', defaultMarkup: 0, description: 'Regular size' },
    { name: 'Medium', defaultMarkup: 0.50, description: 'Larger serving' },
    { name: 'Large', defaultMarkup: 1.00, description: 'Extra large' },
  ],
};

/**
 * Default protein presets (most common)
 */
export const DEFAULT_PROTEIN_PRESETS = VARIANT_PRESETS.food.map(p => p.name);

/**
 * Get presets for a specific item type
 */
export function getPresetsForItemType(
  itemType?: 'food' | 'drinks_wine' | 'coffee_desserts' | null
): VariantPreset[] {
  if (!itemType || itemType === 'food') {
    return VARIANT_PRESETS.food;
  }
  return VARIANT_PRESETS[itemType] || VARIANT_PRESETS.food;
}

/**
 * Create a variant from a preset configuration
 * 
 * @param presetName - Name of the preset (e.g., "Chicken", "Lamb")
 * @param basePrice - Base takeaway price for the item
 * @param itemType - Type of menu item
 * @param generateId - Function to generate unique IDs
 * @returns Configured MenuItemVariant
 */
export function createVariantFromPreset(
  presetName: string,
  basePrice: number,
  itemType: 'food' | 'drinks_wine' | 'coffee_desserts' = 'food',
  generateId: () => string = () => crypto.randomUUID()
): Partial<MenuItemVariant> {
  const presets = getPresetsForItemType(itemType);
  const preset = presets.find(p => p.name === presetName);
  
  if (!preset) {
    console.warn(`Preset "${presetName}" not found for item type "${itemType}"`);
    return createEmptyVariant(presetName, basePrice, generateId);
  }
  
  const markup = preset.defaultMarkup;
  
  return {
    id: generateId(),
    name: preset.name,
    price: basePrice + markup, // Takeaway price
    price_dine_in: basePrice + markup,
    price_delivery: basePrice + markup + 1.00, // Standard £1 delivery markup
    is_default: false,
    description: null, // Inherit from base item
    description_state: 'inherited',
    image_url: null, // Inherit from base item
    image_asset_id: null,
    image_state: 'inherited',
  };
}

/**
 * Create an empty variant with default values
 */
export function createEmptyVariant(
  name: string = '',
  basePrice: number = 0,
  generateId: () => string = () => crypto.randomUUID()
): Partial<MenuItemVariant> {
  return {
    id: generateId(),
    name,
    price: basePrice,
    price_dine_in: basePrice,
    price_delivery: basePrice + 1.00,
    is_default: false,
    description: null,
    description_state: 'inherited',
    image_url: null,
    image_asset_id: null,
    image_state: 'inherited',
  };
}

/**
 * Create multiple variants from preset names
 * 
 * @param presetNames - Array of preset names to create
 * @param basePrice - Base price for all variants
 * @param itemType - Type of menu item
 * @returns Array of configured variants
 */
export function createVariantsFromPresets(
  presetNames: string[],
  basePrice: number,
  itemType: 'food' | 'drinks_wine' | 'coffee_desserts' = 'food'
): Partial<MenuItemVariant>[] {
  const variants = presetNames.map((name, index) => {
    const variant = createVariantFromPreset(name, basePrice, itemType);
    // First variant is default
    if (index === 0) {
      variant.is_default = true;
    }
    return variant;
  });
  
  return variants;
}

/**
 * Suggest presets based on item name (AI-like smart suggestions)
 */
export function suggestPresetsForItemName(
  itemName: string,
  itemType: 'food' | 'drinks_wine' | 'coffee_desserts' = 'food'
): string[] {
  const nameLower = itemName.toLowerCase();
  
  // Food-specific logic
  if (itemType === 'food') {
    // Curry dishes - suggest all proteins
    if (nameLower.includes('curry') || nameLower.includes('masala') || 
        nameLower.includes('korma') || nameLower.includes('tikka') ||
        nameLower.includes('bhuna') || nameLower.includes('jalfrezi')) {
      return ['Chicken', 'Lamb', 'King Prawn', 'Vegetable'];
    }
    
    // Biryani - limited proteins
    if (nameLower.includes('biryani')) {
      return ['Chicken', 'Lamb', 'King Prawn', 'Vegetable'];
    }
    
    // Tandoori/grilled - meat focused
    if (nameLower.includes('tandoori') || nameLower.includes('kebab')) {
      return ['Chicken', 'Lamb', 'King Prawn'];
    }
    
    // If unsure, suggest common proteins
    return ['Chicken', 'Lamb', 'Vegetable'];
  }
  
  // Wine - suggest standard servings
  if (itemType === 'drinks_wine') {
    return ['Glass (175ml)', 'Bottle (750ml)'];
  }
  
  // Coffee/Desserts - suggest sizes
  if (itemType === 'coffee_desserts') {
    return ['Small', 'Medium', 'Large'];
  }
  
  return [];
}
