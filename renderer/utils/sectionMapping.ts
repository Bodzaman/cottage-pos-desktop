/**
 * Section Mapping Utilities
 * 
 * CRITICAL PATTERN FOR CATEGORY MANAGEMENT:
 * ==========================================
 * 
 * This file defines the canonical section structure for the POS system.
 * FIXED_SECTIONS is the single source of truth for section definitions.
 * 
 * **UUID-Based Section Architecture (MYA-1379):**
 * 
 * Sections are real database records with UUIDs (not virtual IDs).
 * Main categories point to their section via parent_category_id = {section_uuid}.
 * 
 * ✅ CORRECT PATTERN:
 * ```typescript
 * const matchingSection = FIXED_SECTIONS.find(section => 
 *   section.name.toUpperCase() === categoryName.toUpperCase()
 * );
 * const parent_category_id = matchingSection ? matchingSection.uuid : null;
 * ```
 * 
 * **Database Structure:**
 * - Section records: name = "[SECTION] {NAME}", id = UUID
 * - Main categories: parent_category_id = section UUID
 * - Subcategories: parent_category_id = main category UUID
 * 
 * **Where This Pattern Applies:**
 * - CategoryForm.tsx (CREATE mode)
 * - EditCategoryDialogEnhanced.tsx (EDIT mode section assignment)
 * - CategoryManagement.tsx (uses the above components)
 * - Any component that creates/edits categories or assigns sections
 * 
 * Last Updated: MYA-1379 (UUID-Based Section Migration)
 */

// Real section UUIDs from database (created during migration)
export const SECTION_UUID_MAP = {
  'starters': '5cfed564-4034-4016-ad79-d5b1f0b7ee44',
  'main-course': '71d8a89e-6b2d-4d91-bfe1-83d537a8c5c7',
  'side-dishes': '8b161257-d508-46d6-806a-25ce33898bef',
  'accompaniments': '366f31f3-8c31-4221-93d3-aa77f0bd37dc',
  'desserts-coffee': '2fc410da-c162-4134-8b37-8a290eb0e0b4',
  'drinks-wine': 'cc3e13e2-45ee-4f85-a333-c910f038efc6',
  'set-meals': '56bc46b0-5271-401d-8a02-d4970291ddb5',
};

/**
 * Recursively find the root section for a given category
 * Supports arbitrary-depth category trees (e.g., Section → Category → Subcategory)
 * 
 * @param categoryId - The ID of the category to find the section for
 * @param categories - All categories with parent_category_id relationships
 * @returns The root section, or null if not found
 */
export function findRootSection(
  categoryId: string,
  categories: Array<{ id: string; parent_category_id: string | null; name?: string }>
): typeof FIXED_SECTIONS[number] | null {
  // Find the category
  const category = categories.find(c => c.id === categoryId);
  if (!category) return null;

  // Check if this category itself is a section
  const directSection = FIXED_SECTIONS.find(s => s.uuid === categoryId);
  if (directSection) return directSection;

  // Check if this category's parent is a section
  if (category.parent_category_id) {
    const parentSection = FIXED_SECTIONS.find(s => s.uuid === category.parent_category_id);
    if (parentSection) return parentSection;

    // Recursively check the parent's parent
    return findRootSection(category.parent_category_id, categories);
  }

  return null;
}

export const FIXED_SECTIONS = [
  {
    id: 'starters',
    uuid: SECTION_UUID_MAP['starters'],
    name: 'STARTERS',
    displayName: 'Starters',
    order: 0,
    codePrefix: 'APP',
    icon: '🥗'
  },
  {
    id: 'main-course',
    uuid: SECTION_UUID_MAP['main-course'],
    name: 'MAIN COURSE',
    displayName: 'Main Course',
    order: 1,
    codePrefix: 'MAIN',
    icon: '🍛'
  },
  {
    id: 'side-dishes',
    uuid: SECTION_UUID_MAP['side-dishes'],
    name: 'SIDE DISHES',
    displayName: 'Side Dishes',
    order: 2,
    codePrefix: 'SIDE',
    icon: '🍚'
  },
  {
    id: 'accompaniments',
    uuid: SECTION_UUID_MAP['accompaniments'],
    name: 'ACCOMPANIMENTS',
    displayName: 'Accompaniments',
    order: 3,
    codePrefix: 'ACC',
    icon: '🫓'
  },
  {
    id: 'desserts-coffee',
    uuid: SECTION_UUID_MAP['desserts-coffee'],
    name: 'DESSERTS & COFFEE',
    displayName: 'Desserts & Coffee',
    order: 4,
    codePrefix: 'DES',
    icon: '🍰'
  },
  {
    id: 'drinks-wine',
    uuid: SECTION_UUID_MAP['drinks-wine'],
    name: 'DRINKS & WINE',
    displayName: 'Drinks & Wine',
    order: 5,
    codePrefix: 'DRK',
    icon: '🍷'
  },
  {
    id: 'set-meals',
    uuid: SECTION_UUID_MAP['set-meals'],
    name: 'SET MEALS',
    displayName: 'Set Meals',
    order: 6,
    codePrefix: 'SET',
    icon: '🍱'
  }
] as const;

export type SectionId = typeof FIXED_SECTIONS[number]['id'];

/**
 * Category-to-Section mapping rules
 * Maps database category names and code prefixes to section IDs
 */
const CATEGORY_TO_SECTION_MAP: Record<string, SectionId> = {
  // Starters
  'APP': 'starters',
  'ST': 'starters',
  'APPETIZERS': 'starters',
  'STARTERS': 'starters',
  
  // Main Course - most protein-based categories
  'MAIN': 'main-course',
  'LAMB': 'main-course',
  'TAND': 'main-course',
  'TANDOORI': 'main-course',
  'CHICKEN': 'main-course',
  'VG': 'main-course',
  'VEGETARIAN': 'main-course',
  'CC': 'main-course',
  'CURRY': 'main-course',
  'BIRYANI': 'main-course',
  
  // Side Dishes
  'SIDE': 'side-dishes',
  'RICE': 'side-dishes',
  'VEGETABLE': 'side-dishes',
  
  // Accompaniments
  'ACC': 'accompaniments',
  'BREAD': 'accompaniments',
  'NAAN': 'accompaniments',
  'ROTI': 'accompaniments',
  'SAUCE': 'accompaniments',
  'CONDIMENT': 'accompaniments',
  
  // Desserts & Coffee
  'DES': 'desserts-coffee',
  'DESS': 'desserts-coffee',
  'DESSERT': 'desserts-coffee',
  'DESSERTS': 'desserts-coffee',
  'COFFEE': 'desserts-coffee',
  'TEA': 'desserts-coffee',
  
  // Drinks & Wine
  'DRK': 'drinks-wine',
  'DRINK': 'drinks-wine',
  'DRINKS': 'drinks-wine',
  'WINE': 'drinks-wine',
  'BEER': 'drinks-wine',
  'BEVERAGE': 'drinks-wine',
  
  // Set Meals
  'SET': 'set-meals',
  'MEAL': 'set-meals',
  'COMBO': 'set-meals'
};

/**
 * Map a database category to a fixed section
 * Tries code_prefix first, then category name
 */
export function mapCategoryToSection(category: {
  name: string;
  code_prefix?: string | null;
}): SectionId {
  // Try code_prefix first (uppercase)
  if (category.code_prefix) {
    const prefixUpper = category.code_prefix.toUpperCase();
    if (CATEGORY_TO_SECTION_MAP[prefixUpper]) {
      return CATEGORY_TO_SECTION_MAP[prefixUpper];
    }
  }
  
  // Try category name (uppercase)
  const nameUpper = category.name.toUpperCase();
  if (CATEGORY_TO_SECTION_MAP[nameUpper]) {
    return CATEGORY_TO_SECTION_MAP[nameUpper];
  }
  
  // Try partial name matching
  for (const [key, sectionId] of Object.entries(CATEGORY_TO_SECTION_MAP)) {
    if (nameUpper.includes(key) || key.includes(nameUpper)) {
      return sectionId;
    }
  }
  
  // Default to main course for unmapped items
  console.warn(`Category "${category.name}" (prefix: ${category.code_prefix}) not mapped, defaulting to main-course`);
  return 'main-course';
}

/**
 * Get all menu items that belong to a specific section
 * 
 * **UUID-Based Implementation (MYA-1379):**
 * Uses real UUID parent_category_id values from database.
 * Sections are actual database records with UUIDs.
 * Items can be in child categories (grandchildren of sections).
 * 
 * @param items - Menu items to filter
 * @param categories - All categories with parent_category_id relationships
 * @param sectionId - Section ID to filter by (e.g., 'starters', 'main-course')
 * @returns Filtered items that belong to the specified section
 */
export function filterItemsBySection(
  items: Array<{
    id: string;
    category_id?: string;
    [key: string]: any;
  }>,
  categories: Array<{
    id: string;
    name: string;
    parent_category_id?: string | null;
    code_prefix?: string | null;
  }>,
  sectionId: SectionId
): typeof items {
  // ✅ Get the real UUID for this section
  const sectionUuid = SECTION_UUID_MAP[sectionId];
  if (!sectionUuid) {
    console.warn(`⚠️ No UUID found for section: ${sectionId}`);
    return [];
  }
  
  // ✅ RECURSIVE CATEGORY COLLECTION:
  // We need to find ALL categories that belong to this section, including:
  // 1. Direct children (main categories like "STARTERS")
  // 2. Grandchildren (subcategories like "NON VEGETARIAN", "SEAFOOD")
  // 3. Any deeper descendants
  
  const allCategoryIds = new Set<string>();
  
  // Step 1: Find direct children (main categories pointing to section UUID)
  const directChildren = categories.filter(cat => cat.parent_category_id === sectionUuid);
  directChildren.forEach(cat => allCategoryIds.add(cat.id));
  
  // Step 2: Recursively find all descendants
  let foundNew = true;
  while (foundNew) {
    foundNew = false;
    for (const cat of categories) {
      // If this category's parent is already in our set, add this category too
      if (cat.parent_category_id && 
          allCategoryIds.has(cat.parent_category_id) && 
          !allCategoryIds.has(cat.id)) {
        allCategoryIds.add(cat.id);
        foundNew = true;
      }
    }
  }
  
  // Step 3: Filter items that belong to any of these categories
  const filtered = items.filter(item => 
    item.category_id && allCategoryIds.has(item.category_id)
  );
  
  console.log(`🔍 filterItemsBySection('${sectionId}'): Found ${allCategoryIds.size} categories, ${filtered.length} items`);
  
  return filtered;
}

/**
 * Get section by ID
 */
export function getSectionById(sectionId: SectionId) {
  return FIXED_SECTIONS.find(s => s.id === sectionId);
}

/**
 * Get section for a specific category
 */
export function getSectionForCategory(category: {
  name: string;
  code_prefix?: string | null;
}) {
  const sectionId = mapCategoryToSection(category);
  return getSectionById(sectionId);
}

/**
 * Organizes categories into sections based on FIXED_SECTIONS.
 * Now uses UUID-based section architecture (MYA-1379).
 */
export function organizeCategoriesBySection(
  categories: any[],
  searchQuery: string = '',
  showActive: boolean | null = true
): { section: Section; categories: any[]; count: number }[] {
  const query = searchQuery.toLowerCase().trim();

  // Step 1: Build a map of category ID -> section using UUIDs
  const categoryToSectionMap = new Map<string, Section>();
  
  categories.forEach((cat) => {
    // Check if this category is a direct child of a section (UUID match)
    const section = FIXED_SECTIONS.find((s) => s.uuid === cat.parent_category_id);
    if (section) {
      categoryToSectionMap.set(cat.id, section);
    }
    // Legacy fallback: top-level categories (parent_category_id = null)
    else if (cat.parent_category_id === null && !cat.name.startsWith('[SECTION]')) {
      const sectionId = mapCategoryToSection({ name: cat.name, code_prefix: cat.code_prefix || '' });
      const section = FIXED_SECTIONS.find((s) => s.id === sectionId);
      if (section) {
        categoryToSectionMap.set(cat.id, section);
      }
    }
  });

  // Step 2: For child categories, inherit parent's section
  categories.forEach((cat) => {
    if (cat.parent_category_id && !FIXED_SECTIONS.some(s => s.uuid === cat.parent_category_id)) {
      const parentSection = categoryToSectionMap.get(cat.parent_category_id);
      if (parentSection) {
        categoryToSectionMap.set(cat.id, parentSection);
      }
    }
  });

  // Step 3: Group categories by section, applying filters
  const result = FIXED_SECTIONS.map((section) => {
    const sectionCategories = categories.filter((cat) => {
      // Skip section records themselves
      if (cat.name.startsWith('[SECTION]')) return false;
      
      // Check if category belongs to this section
      const belongsToSection = categoryToSectionMap.get(cat.id)?.id === section.id;
      if (!belongsToSection) return false;

      // Apply active/inactive filter
      if (showActive === true && !cat.is_active) return false;
      if (showActive === false && cat.is_active) return false;

      // Apply search filter
      if (query && !cat.name.toLowerCase().includes(query)) return false;

      return true;
    });

    return {
      section,
      categories: sectionCategories,
      count: sectionCategories.length,
    };
  });

  return result;
}
