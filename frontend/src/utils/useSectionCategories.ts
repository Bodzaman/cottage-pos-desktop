import { useMemo } from 'react';
import { Category } from './menuTypes';
import { FIXED_SECTIONS, mapCategoryToSection } from './sectionMapping';

/**
 * Custom hook to transform database categories into a hierarchical structure
 * with 7 fixed sections as parent categories and real categories as children
 */
export function useSectionCategories(dbCategories: Category[]): Category[] {
  return useMemo(() => {
    // Create synthetic parent categories for the 7 sections
    const sectionParents: Category[] = FIXED_SECTIONS.map((section, index) => ({
      id: `section-${section.id}`,
      name: section.name,
      description: section.displayName,
      display_order: index,
      print_order: index,
      print_to_kitchen: false,
      image_url: null,
      parent_category_id: null,
      active: true,
    }));

    // Create child categories with section parent references
    const childCategories: Category[] = dbCategories.map((cat) => {
      const sectionId = mapCategoryToSection(cat);
      return {
        ...cat,
        parent_category_id: `section-${sectionId}`,
      };
    });

    // Combine section parents with child categories
    return [...sectionParents, ...childCategories];
  }, [dbCategories]);
}

/**
 * Helper to check if a category ID is a section (synthetic parent)
 */
export function isSectionCategory(categoryId: string | null): boolean {
  return categoryId?.startsWith('section-') ?? false;
}

/**
 * Get the section ID from a section category ID
 */
export function getSectionId(categoryId: string): string | null {
  if (isSectionCategory(categoryId)) {
    return categoryId.replace('section-', '');
  }
  return null;
}
