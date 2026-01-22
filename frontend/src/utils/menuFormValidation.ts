import { z } from 'zod';

/**
 * Menu Form Validation Schema
 * 
 * Comprehensive Zod validation for menu item forms covering:
 * - Single items and items with variants
 * - Food, drinks/wine, and coffee/desserts item types
 * - Price validation and consistency
 * - Field-level constraints
 * 
 * Used with react-hook-form via @hookform/resolvers/zod
 */

// ============================================================================
// REUSABLE FIELD VALIDATORS
// ============================================================================

/**
 * Name validator: 2-100 characters, letters, numbers, spaces, hyphens, apostrophes only
 */
export const nameValidator = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(
    /^[a-zA-Z0-9\s'\-()&,.!]+$/,
    'Name can only contain letters, numbers, spaces, and common punctuation'
  )
  .transform(val => val.trim());

/**
 * Optional name validator (allows empty string)
 */
export const optionalNameValidator = z
  .string()
  .max(100, 'Name must not exceed 100 characters')
  .regex(
    /^[a-zA-Z0-9\s'\-()&,.!]*$/,
    'Name can only contain letters, numbers, spaces, and common punctuation'
  )
  .transform(val => val.trim())
  .optional()
  .or(z.literal(''));

/**
 * Description validator: max 500 characters
 */
export const descriptionValidator = z
  .string()
  .max(500, 'Description must not exceed 500 characters')
  .transform(val => val.trim())
  .optional()
  .or(z.literal(''));

/**
 * Price validator: 0.01 - 999.99 range
 */
export const priceValidator = z
  .number({
    invalid_type_error: 'Price must be a number',
  })
  .min(0.01, 'Price must be at least £0.01')
  .max(999.99, 'Price must not exceed £999.99')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

/**
 * Optional price validator (allows 0 or undefined)
 */
export const optionalPriceValidator = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(999.99, 'Price must not exceed £999.99')
  .multipleOf(0.01, 'Price must have at most 2 decimal places')
  .optional()
  .or(z.literal(0));

/**
 * Spice level validator: 0-5
 */
export const spiceLevelValidator = z
  .number()
  .int('Spice level must be a whole number')
  .min(0, 'Spice level must be between 0 and 5')
  .max(5, 'Spice level must be between 0 and 5')
  .optional()
  .or(z.literal(0));

/**
 * ABV validator: 0-100%
 */
export const abvValidator = z
  .number()
  .min(0, 'ABV cannot be negative')
  .max(100, 'ABV cannot exceed 100%')
  .optional();

/**
 * Menu order validator: positive integer
 */
export const menuOrderValidator = z
  .number()
  .int('Menu order must be a whole number')
  .min(0, 'Menu order cannot be negative')
  .optional();

// ============================================================================
// VARIANT SCHEMA
// ============================================================================

/**
 * Schema for individual menu item variant
 */
export const variantSchema = z.object({
  id: z.string().optional(),
  protein_type_id: z.string().optional(),
  name: nameValidator,
  description: descriptionValidator.nullable(),
  description_state: z.enum(['inherited', 'custom', 'none']).optional(),
  price: priceValidator,
  price_dine_in: optionalPriceValidator,
  price_delivery: optionalPriceValidator,
  is_default: z.boolean(),
  image_url: z.string().optional().nullable().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    'Invalid image URL'
  ),
  image_asset_id: z.string().optional().nullable().or(z.literal('')),
  image_state: z.enum(['inherited', 'custom', 'none']).optional(),
  display_order: z.number().int().min(0),
  
  // Food-specific fields
  spice_level: spiceLevelValidator.nullable(),
  allergens: z.array(z.string()).optional().nullable(),
  allergen_notes: z.string().optional().nullable(),
  
  // Dietary information flags
  is_vegetarian: z.boolean().optional(),
  is_vegan: z.boolean().optional(),
  is_gluten_free: z.boolean().optional(),
  is_halal: z.boolean().optional(),
  is_dairy_free: z.boolean().optional(),
  is_nut_free: z.boolean().optional(),
  
  // Featured flag
  featured: z.boolean().optional(),
});

export type MenuVariantFormData = z.infer<typeof variantSchema>;

// ============================================================================
// MAIN MENU ITEM SCHEMA
// ============================================================================

/**
 * Base schema for all menu items (common fields)
 * Note: has_variants is omitted here and added in child schemas as literals
 */
const baseMenuItemSchema = z.object({
  // Basic Information
  id: z.string().optional(),
  name: nameValidator,
  kitchen_display_name: optionalNameValidator,
  menu_item_description: descriptionValidator,
  description: descriptionValidator, // Alias for menu_item_description
  
  // Category & Organization
  category_id: z.string().min(1, 'Category is required'),
  menu_order: menuOrderValidator,
  
  // Status flags
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  
  // Item code
  item_code: z.string().optional().or(z.literal('')),
  
  // Media
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  image_url_widescreen: z.string().url('Invalid widescreen image URL').optional().or(z.literal('')),
  image_asset_id: z.string().optional().or(z.literal('')),
  image_widescreen_asset_id: z.string().optional().or(z.literal('')),
  preferred_aspect_ratio: z.enum(['square', 'landscape']).optional().or(z.literal('')),
  
  // Dietary tags (array format - legacy)
  dietary_tags: z.array(z.string()).optional(),
  
  // Individual dietary flags (primary - matches UI switches)
  vegetarian: z.boolean().optional(),
  vegan: z.boolean().optional(),
  gluten_free: z.boolean().optional(),
  halal: z.boolean().optional(),
  dairy_free: z.boolean().optional(),
  nut_free: z.boolean().optional(),
  
  spice_indicators: z.string().optional().or(z.literal('')),
});

/**
 * Food-specific fields schema
 */
const foodSpecificSchema = z.object({
  spice_level: spiceLevelValidator,
  allergens: z.array(z.string()).optional(),
  allergen_warnings: z.string().optional().or(z.literal('')),
  specialty_notes: z.string().max(1000).optional().or(z.literal('')),
  chefs_special: z.boolean().optional(),
});

/**
 * Drinks/Wine specific fields schema
 */
const drinksWineSchema = z.object({
  drink_type: z.enum(['beer', 'wine', 'spirits', 'cocktails', 'soft_drinks', 'other']).optional(),
  serving_sizes: z.array(z.string()).optional(),
  abv: abvValidator,
  temperature: z.enum(['hot', 'cold', 'room']).optional(),
});

/**
 * Coffee/Desserts specific fields schema
 */
const coffeeDessertsSchema = z.object({
  serving_sizes: z.array(z.string()).optional(),
  abv: abvValidator,
  temperature: z.enum(['hot', 'cold', 'room']).optional(),
});

/**
 * Pricing schema for single items (no variants)
 */
const singleItemPricingSchema = z.object({
  price: optionalPriceValidator,
  price_dine_in: optionalPriceValidator,
  price_takeaway: optionalPriceValidator,
  price_delivery: optionalPriceValidator,
}).refine(
  (data) => {
    // At least one price must be set for single items
    return (
      (data.price_dine_in && data.price_dine_in > 0) ||
      (data.price_takeaway && data.price_takeaway > 0) ||
      (data.price_delivery && data.price_delivery > 0)
    );
  },
  {
    message: 'At least one price type must be set (Dine In, Takeaway, or Delivery)',
    path: ['price'],
  }
);

/**
 * Complete schema for single item (no variants)
 */
export const singleItemSchema = z.object({
  ...baseMenuItemSchema.shape,
  has_variants: z.literal(false),
  price: optionalPriceValidator,
  price_dine_in: optionalPriceValidator,
  price_takeaway: optionalPriceValidator,
  price_delivery: optionalPriceValidator,
}).merge(foodSpecificSchema.partial())
  .merge(drinksWineSchema.partial())
  .merge(coffeeDessertsSchema.partial())
  .refine(
    (data) => {
      return (
        (data.price_dine_in && data.price_dine_in > 0) ||
        (data.price_takeaway && data.price_takeaway > 0) ||
        (data.price_delivery && data.price_delivery > 0)
      );
    },
    {
      message: 'At least one price type must be set (Dine In, Takeaway, or Delivery)',
      path: ['price'],
    }
  );

/**
 * Complete schema for item with variants
 */
export const variantItemSchema = z.object({
  ...baseMenuItemSchema.shape,
  has_variants: z.literal(true),
  price: optionalPriceValidator,
  price_dine_in: optionalPriceValidator,
  price_takeaway: optionalPriceValidator,
  price_delivery: optionalPriceValidator,
  variants: z.array(variantSchema).min(1, 'At least one variant is required when "Has Variants" is enabled'),
}).merge(foodSpecificSchema.partial())
  .merge(drinksWineSchema.partial())
  .merge(coffeeDessertsSchema.partial())
  .refine(
    (data) => {
      if (!data.variants || data.variants.length === 0) return true;
      const { isValid } = validateUniqueVariantNames(data.variants);
      return isValid;
    },
    {
      message: 'All variant names must be unique. Please rename duplicate variants.',
      path: ['variants'],
    }
  );

/**
 * Main menu item form schema - uses superRefine for conditional validation
 * This approach is more flexible than discriminated unions and handles intermediate states better
 */
export const menuItemFormSchema = z.object({
  ...baseMenuItemSchema.shape,
  has_variants: z.boolean(),
  price: optionalPriceValidator,
  price_dine_in: optionalPriceValidator,
  price_takeaway: optionalPriceValidator,
  price_delivery: optionalPriceValidator,
  variants: z.array(variantSchema).optional(),
}).merge(foodSpecificSchema.partial())
  .merge(drinksWineSchema.partial())
  .merge(coffeeDessertsSchema.partial())
  .superRefine((data, ctx) => {
    // Validation for items WITH variants - only check variant name uniqueness
    if (data.has_variants === true && data.variants && data.variants.length > 0) {
      const { isValid, duplicates } = validateUniqueVariantNames(data.variants);
      if (!isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate variant names found: ${duplicates.join(', ')}. Please rename them.`,
          path: ['variants'],
        });
      }
    }
    
    // NOTE: Pricing validation is now handled by runtime validateItemPricing() function
    // This eliminates dual validation and provides better user-friendly error messages
  });

export type MenuItemFormInput = z.infer<typeof menuItemFormSchema>;

// ============================================================================
// CUSTOM VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that variant names are unique (case-insensitive, trimmed)
 */
export function validateUniqueVariantNames(variants: MenuVariantFormData[]): {
  isValid: boolean;
  duplicates: string[];
} {
  const nameMap = new Map<string, number>();
  const duplicates: string[] = [];

  variants.forEach((variant) => {
    const normalizedName = variant.name.toLowerCase().trim();
    const count = nameMap.get(normalizedName) || 0;
    nameMap.set(normalizedName, count + 1);
  });

  nameMap.forEach((count, name) => {
    if (count > 1) {
      duplicates.push(name);
    }
  });

  return {
    isValid: duplicates.length === 0,
    duplicates,
  };
}

/**
 * Validate price consistency (warn if delivery < dine-in, etc.)
 */
export function validatePriceConsistency(pricing: {
  price_dine_in?: number;
  price_takeaway?: number;
  price_delivery?: number;
}): {
  warnings: string[];
} {
  const warnings: string[] = [];

  const dineIn = pricing.price_dine_in || 0;
  const takeaway = pricing.price_takeaway || 0;
  const delivery = pricing.price_delivery || 0;

  // Warning: Takeaway more expensive than dine-in
  if (takeaway > 0 && dineIn > 0 && takeaway > dineIn * 1.1) {
    warnings.push('Takeaway price is more than 10% higher than Dine In price');
  }

  return { warnings };
}

/**
 * Validate that at least one variant exists when has_variants is true
 */
export function validateVariantsRequired(hasVariants: boolean, variantsCount: number): boolean {
  if (!hasVariants) return true;
  return variantsCount >= 1;
}
