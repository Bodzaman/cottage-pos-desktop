/**
 * Menu Item Field Mapping Utility
 *
 * Authoritative field mapping between frontend forms and database schema.
 * Single source of truth for all menu item field transformations.
 *
 * Background:
 * - The codebase migrated from Databutton Brain API to direct Supabase queries
 * - Frontend form schemas were never updated to match actual database columns
 * - This utility ensures correct field mapping and prevents "column not found" errors
 */

/**
 * Fields that exist in form but NOT in database
 * These must be removed or transformed before DB operations
 */
const INVALID_MENU_ITEM_FIELDS = [
  'active',              // Use is_active
  'dietary_tags',        // Use allergens
  'display_order',       // Use display_print_order
  'menu_order',          // Use display_print_order
  'image_url',           // Use image_asset_id
  'image_url_widescreen', // Use image_widescreen_asset_id
  'featured',            // Only in variants table
  'item_type',           // Doesn't exist
  'vegetarian',          // Use is_vegetarian
  'vegan',               // Use is_vegan
  'gluten_free',         // Use is_gluten_free
  'halal',               // Use is_halal
  'dairy_free',          // Use is_dairy_free
  'nut_free',            // Use is_nut_free
  'print_to_kitchen',    // Deprecated field
  'menu_item_description', // Use description
  'description_state',   // UI state, not in DB
  'image_state',         // UI state, not in DB
  'price',               // Use base_price (DB column is base_price, not price)
] as const;

/**
 * Transform form data to database format
 * Removes invalid fields and maps field names to match database schema
 *
 * @param formData - Form data from MenuItemForm
 * @returns Database-compatible data object
 */
export function mapFormToDatabase(formData: any): any {
  const {
    // Extract and discard invalid fields
    active,
    dietary_tags,
    display_order,
    menu_order,
    image_url,
    image_url_widescreen,
    featured,
    item_type,
    vegetarian,
    vegan,
    gluten_free,
    halal,
    dairy_free,
    nut_free,
    print_to_kitchen,
    menu_item_description,
    description_state,
    image_state,
    price,  // Extract price - will be mapped to base_price
    ...validFields
  } = formData;

  // Build database object with proper field names
  const dbData: any = {
    ...validFields,
  };

  // Map boolean fields (active → is_active)
  if (active !== undefined) dbData.is_active = active;

  // Map dietary boolean fields
  if (vegetarian !== undefined) dbData.is_vegetarian = vegetarian;
  if (vegan !== undefined) dbData.is_vegan = vegan;
  if (gluten_free !== undefined) dbData.is_gluten_free = gluten_free;
  if (halal !== undefined) dbData.is_halal = halal;
  if (dairy_free !== undefined) dbData.is_dairy_free = dairy_free;
  if (nut_free !== undefined) dbData.is_nut_free = nut_free;

  // Map dietary_tags to allergens (JSONB array)
  if (dietary_tags !== undefined) {
    dbData.allergens = Array.isArray(dietary_tags) ? dietary_tags : [];
  }

  // Map ordering fields (display_order/menu_order → display_print_order)
  if (display_order !== undefined || menu_order !== undefined) {
    dbData.display_print_order = display_order ?? menu_order ?? 0;
  }

  // Map description fields
  if (menu_item_description !== undefined && !dbData.description) {
    dbData.description = menu_item_description;
  }

  // Map price → base_price (form uses 'price', database uses 'base_price')
  // ALWAYS map price to base_price when provided - this is the authoritative value from the form
  // The user's edited price should override any existing base_price from the spread
  if (price !== undefined) {
    dbData.base_price = price;
  }

  // Note: image_url and image_url_widescreen are NOT in menu_items table
  // The table uses image_asset_id and image_widescreen_asset_id (foreign keys)

  return dbData;
}

/**
 * Transform database data to form format
 * For populating edit forms with existing data
 *
 * @param dbData - Data from database query
 * @returns Form-compatible data object
 */
export function mapDatabaseToForm(dbData: any): any {
  const formData: any = {
    ...dbData,
  };

  // Map database fields to form fields (reverse mapping)
  if (dbData.is_active !== undefined) formData.active = dbData.is_active;

  // Map dietary boolean fields
  if (dbData.is_vegetarian !== undefined) formData.vegetarian = dbData.is_vegetarian;
  if (dbData.is_vegan !== undefined) formData.vegan = dbData.is_vegan;
  if (dbData.is_gluten_free !== undefined) formData.gluten_free = dbData.is_gluten_free;
  if (dbData.is_halal !== undefined) formData.halal = dbData.is_halal;
  if (dbData.is_dairy_free !== undefined) formData.dairy_free = dbData.is_dairy_free;
  if (dbData.is_nut_free !== undefined) formData.nut_free = dbData.is_nut_free;

  // Map allergens to dietary_tags
  if (dbData.allergens !== undefined) formData.dietary_tags = dbData.allergens;

  // Map ordering fields
  if (dbData.display_print_order !== undefined) {
    formData.display_order = dbData.display_print_order;
    formData.menu_order = dbData.display_print_order;
  }

  // Map description
  if (dbData.description !== undefined) {
    formData.menu_item_description = dbData.description;
  }

  // Map base_price → price (database uses 'base_price', form uses 'price')
  if (dbData.base_price !== undefined) {
    formData.price = dbData.base_price;
  }

  return formData;
}

/**
 * Validate that no invalid fields are present in database payload
 * Throws error if invalid fields found (safety check before database operation)
 *
 * @param data - Data to validate
 * @throws Error if invalid fields detected
 */
export function validateDatabasePayload(data: any): void {
  const invalidFields = INVALID_MENU_ITEM_FIELDS.filter(field =>
    data[field] !== undefined
  );

  if (invalidFields.length > 0) {
    console.error(' Invalid database fields detected:', invalidFields);
    throw new Error(
      `Invalid database fields detected: ${invalidFields.join(', ')}. ` +
      `These fields must be mapped or removed before database operations.`
    );
  }
}
