/**
 * Menu Helpers - Utilities for hierarchical menu display in POS
 * 
 * Provides functions to group and organize menu items by sections and categories
 * for clear visual hierarchy in Zone 3 (POSMenuSelector).
 */

import { MenuItem, Category } from './menuTypes';
import { FIXED_SECTIONS, SECTION_UUID_MAP } from './sectionMapping';

/**
 * Hierarchical menu structure for rendering
 */
export interface HierarchicalMenu {
  sections: MenuSection[];
}

export interface MenuSection {
  id: string;
  name: string;
  displayName: string;
  categories: MenuCategoryGroup[];
}

export interface MenuCategoryGroup {
  id: string;
  name: string;
  items: MenuItem[];
}

/**
 * Generate display name for menu items
 * 
 * Reconstructs the full display name from base name, variant name, and protein type.
 * Used for reordering past orders where the stored name may only be the base name.
 * 
 * Pattern matches POSMenuItemCard.tsx logic:
 * - Single variant: "TIKKA MASALA"
 * - Multi variant: "TIKKA MASALA (LAMB)"
 * 
 * @param baseName - The base menu item name (e.g., "TIKKA MASALA")
 * @param variantName - The variant display name (optional)
 * @param proteinType - The protein type name (optional, takes priority over variantName)
 * @param isMultiVariant - Whether the item has multiple variants (defaults to true if variant/protein provided)
 * @returns The properly formatted display name
 */
export function generateDisplayName(
  baseName: string,
  variantName?: string | null,
  proteinType?: string | null,
  isMultiVariant?: boolean
): string {
  // Determine the effective variant name (protein_type takes priority)
  const effectiveVariantName = proteinType || variantName;
  
  // If no variant info or explicitly single variant, return base name only
  if (!effectiveVariantName) {
    return baseName;
  }
  
  // Auto-detect multi-variant if not explicitly specified
  const shouldShowVariant = isMultiVariant !== false; // true by default if variant exists
  
  // For multi-variant items, append variant name in parentheses
  return shouldShowVariant ? `${baseName} (${effectiveVariantName})` : baseName;
}

/**
 * Generate display name for receipt/order display
 * 
 * Prioritizes variant_name if it exists (as it's already the full display name),
 * otherwise constructs from baseName + proteinType.
 * 
 * Examples:
 * - variant_name="LAMB TIKKA MASALA" → "LAMB TIKKA MASALA" (use as-is)
 * - baseName="TIKKA MASALA", proteinType="LAMB" → "TIKKA MASALA (LAMB)" (construct)
 * 
 * @param baseName - The base menu item name
 * @param variantName - The full variant display name (preferred if available)
 * @param proteinType - The protein type (fallback)
 * @returns The properly formatted display name for receipts
 */
export function generateDisplayNameForReceipt(
  baseName: string,
  variantName?: string | null,
  proteinType?: string | null
): string {
  // If we have the full variant name, use it directly
  if (variantName) {
    return variantName;
  }
  
  // Otherwise, construct from base + protein
  if (proteinType) {
    return `${baseName} (${proteinType})`;
  }
  
  // No variant info, just return base name
  return baseName;
}

/**
 * Get display name for a section from its ID
 * "section-starters" → "Starters"
 * "section-main-course" → "Main Course"
 */
export function getSectionDisplayName(sectionId: string): string {
  // Remove "section-" prefix if present
  const cleanId = sectionId.startsWith('section-') 
    ? sectionId.substring(8) 
    : sectionId;
  
  // Find matching section in FIXED_SECTIONS
  const section = FIXED_SECTIONS.find(s => s.id === cleanId);
  
  if (section) {
    return section.displayName;
  }
  
  // Fallback: capitalize and format
  return cleanId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Group menu items by section → category → items
 * Used for "All Items" view mode
 * 
 * Now uses UUID-based section architecture with recursive category collection (MYA-1379)
 * Handles 3-level hierarchy: Section → Main Category → Subcategory → Items
 */
export function groupItemsByHierarchy(
  items: MenuItem[], 
  categories: Category[]
): HierarchicalMenu {
  const isDev = import.meta.env?.DEV;
  
  // Build section structure
  const sections: MenuSection[] = [];
  
  // Process each fixed section
  FIXED_SECTIONS.forEach(fixedSection => {
    // ✅ Use real UUID instead of virtual "section-*" ID
    const sectionUuid = fixedSection.uuid;
    
    // ✅ RECURSIVE CATEGORY COLLECTION:
    // Collect ALL categories that belong to this section (children, grandchildren, etc.)
    const allCategoryIds = new Set<string>();
    
    // Step 1: Find direct children (main categories pointing to section UUID)
    const directChildren = categories.filter(cat => cat.parent_category_id === sectionUuid && cat.active);
    directChildren.forEach(cat => allCategoryIds.add(cat.id));
    
    // Step 2: Recursively find all descendants
    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      for (const cat of categories) {
        if (cat.parent_category_id && 
            allCategoryIds.has(cat.parent_category_id) && 
            !allCategoryIds.has(cat.id) &&
            cat.active) {
          allCategoryIds.add(cat.id);
          foundNew = true;
        }
      }
    }
    
    if (allCategoryIds.size === 0) {
      return; // Skip empty sections
    }
    
    // Get only the direct children for display (not grandchildren)
    const displayCategories = directChildren.sort((a, b) => a.display_order - b.display_order);
    
    // Build category groups with items (items can be in any descendant category)
    const categoryGroups: MenuCategoryGroup[] = displayCategories.map(category => {
      // ✅ CORRECT: Collect ONLY this category's descendants
      const thisCategoryDescendants = new Set<string>([category.id]);
      
      // Recursively find children of THIS specific category only
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        for (const cat of categories) {
          if (cat.parent_category_id && 
              thisCategoryDescendants.has(cat.parent_category_id) && 
              !thisCategoryDescendants.has(cat.id) &&
              cat.active) {
            thisCategoryDescendants.add(cat.id);
            foundNew = true;
          }
        }
      }
      
      // ✅ Filter items by THIS category's tree only
      const categoryItems = items
        .filter(item => thisCategoryDescendants.has(item.category_id))
        .sort((a, b) => a.display_order - b.display_order);
      
      return {
        id: category.id,
        name: category.name,
        items: categoryItems
      };
    }).filter(group => group.items.length > 0);
    
    // Only add section if it has categories with items
    if (categoryGroups.length > 0) {
      sections.push({
        id: `section-${fixedSection.id}`, // Keep virtual ID for UI compatibility
        name: fixedSection.name,
        displayName: fixedSection.displayName,
        categories: categoryGroups
      });
    }
  });
  
  return { sections };
}

/**
 * Group items by category when a specific section is selected
 * Used for "Section Selected" view mode
 * 
 * Now uses UUID-based section architecture with recursive category collection (MYA-1379)
 * Handles 3-level hierarchy: Section → Main Category → Subcategory → Items
 */
export function groupItemsBySection(
  items: MenuItem[],
  categories: Category[],
  sectionId: string
): MenuCategoryGroup[] {
  const isDev = import.meta.env?.DEV;
  
  if (isDev) {
    console.log('🔨 [groupItemsBySection] Input:', {
      itemCount: items.length,
      sectionId
    });
  }
  
  // ✅ Convert virtual "section-*" ID to real UUID
  const cleanId = sectionId.startsWith('section-') 
    ? sectionId.substring(8) 
    : sectionId;
  
  const sectionUuid = SECTION_UUID_MAP[cleanId as keyof typeof SECTION_UUID_MAP];
  
  if (!sectionUuid) {
    console.warn(`⚠️ No UUID found for section: ${sectionId}`);
    return [];
  }
  
  // ✅ RECURSIVE CATEGORY COLLECTION:
  // Collect ALL categories that belong to this section
  const allCategoryIds = new Set<string>();
  
  // Step 1: Find direct children
  const directChildren = categories.filter(cat => cat.parent_category_id === sectionUuid && cat.active);
  directChildren.forEach(cat => allCategoryIds.add(cat.id));
  
  // Step 2: Recursively find all descendants
  let foundNew = true;
  while (foundNew) {
    foundNew = false;
    for (const cat of categories) {
      if (cat.parent_category_id && 
          allCategoryIds.has(cat.parent_category_id) && 
          !allCategoryIds.has(cat.id) &&
          cat.active) {
        allCategoryIds.add(cat.id);
        foundNew = true;
      }
    }
  }
  
  // Get only direct children for display
  const displayCategories = directChildren.sort((a, b) => a.display_order - b.display_order);
  
  // Build category groups with items from all descendants
  const categoryGroups: MenuCategoryGroup[] = displayCategories.map(category => {
    const categoryItems = items
      .filter(item => allCategoryIds.has(item.category_id))
      .sort((a, b) => a.display_order - b.display_order);
    
    return {
      id: category.id,
      name: category.name,
      items: categoryItems
    };
  }).filter(group => group.items.length > 0);
  
  if (isDev) {
    console.log('🔨 [groupItemsBySection] Output:', {
      categoryCount: categoryGroups.length,
      totalItems: categoryGroups.reduce((sum, cat) => sum + cat.items.length, 0)
    });
  }
  
  return categoryGroups;
}

/**
 * Determine display mode based on selected category
 * Returns: 'all' | 'section' | 'category'
 */
export function getDisplayMode(selectedCategory: string | null): 'all' | 'section' | 'category' {
  if (!selectedCategory || selectedCategory === 'all') {
    return 'all';
  }
  
  if (selectedCategory.startsWith('section-')) {
    return 'section';
  }
  
  return 'category';
}
