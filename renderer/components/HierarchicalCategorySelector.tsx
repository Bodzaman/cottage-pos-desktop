import React from 'react';
import { Label } from '@/components/ui/label';
import { globalColors } from '../utils/QSAIDesign';
import type { Category } from '../utils/menuTypes';

interface Props {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  className?: string;
  itemType?: 'food' | 'drinks_wine' | 'coffee_desserts' | null;
}

interface SectionGroup {
  section: Category;
  children: Category[];
}

// Section emoji mapping by name
const SECTION_EMOJIS: Record<string, string> = {
  'STARTERS': '🔥',
  'MAIN COURSE': '🍛',
  'SIDE DISHES': '🥘',
  'ACCOMPANIMENTS': '🥗',
  'DESSERTS & COFFEE': '☕',
  'DRINKS & WINE': '🍷',
  'SET MEALS': '🍽️'
};

/**
 * Section-Based Category Selector
 * Shows all categories in a flat list grouped under bold visual section headers
 * No expand/collapse needed - everything visible for fast selection
 */
export function HierarchicalCategorySelector({ 
  categories, 
  selectedCategoryId, 
  onCategorySelect, 
  className = '',
  itemType = null 
}: Props) {
  // DEBUG: Log when selectedCategoryId prop changes
  React.useEffect(() => {
    console.log('🎨 [HierarchicalCategorySelector] selectedCategoryId prop changed:', selectedCategoryId);
  }, [selectedCategoryId]);
  
  // Filter categories based on item type
  const filteredCategories = React.useMemo(() => {
    console.log('🔍 [CategorySelector] Filtering categories:', {
      totalCategories: categories?.length || 0,
      itemType,
      categoriesRaw: categories,
      firstCategory: categories?.[0]
    });
    
    if (!categories) {
      console.log('🚫 [CategorySelector] No categories provided');
      return [];
    }
    
    // For specialized item types, filter to appropriate categories
    if (itemType === 'drinks_wine') {
      const filtered = categories.filter(cat => 
        cat.active && (
          cat.name.toLowerCase().includes('drink') ||
          cat.name.toLowerCase().includes('wine') ||
          cat.name.toLowerCase().includes('beverage') ||
          cat.name.toLowerCase().includes('alcohol')
        )
      );
      console.log('🍷 [CategorySelector] Filtered for drinks_wine:', filtered.length);
      return filtered;
    }
    
    if (itemType === 'coffee_desserts') {
      const filtered = categories.filter(cat => 
        cat.active && (
          cat.name.toLowerCase().includes('coffee') ||
          cat.name.toLowerCase().includes('dessert') ||
          cat.name.toLowerCase().includes('sweet') ||
          cat.name.toLowerCase().includes('tea')
        )
      );
      console.log('☕ [CategorySelector] Filtered for coffee_desserts:', filtered.length);
      return filtered;
    }
    
    // For food items or general, show all active categories except protein types
    const filtered = categories.filter(cat => cat.active && !cat.is_protein_type);
    console.log('🍽️ [CategorySelector] Filtered for food/general:', {
      filtered: filtered.length,
      itemType,
      activeCategories: categories.filter(cat => cat.active).length,
      proteinTypeCategories: categories.filter(cat => cat.is_protein_type).length
    });
    return filtered;
  }, [categories, itemType]);

  // Build section groups (parent categories with their children)
  const sectionGroups = React.useMemo(() => {
    const groups: SectionGroup[] = [];
    
    // Get all parent categories (sections)
    // Categories with parent_category_id starting with "section-" ARE sections
    // Categories with null parent_category_id are also sections (legacy)
    const sections = filteredCategories
      .filter(cat => {
        const parentId = cat.parent_category_id;
        // Section if: no parent OR parent starts with "section-"
        return !parentId || (typeof parentId === 'string' && parentId.startsWith('section-'));
      })
      .sort((a, b) => {
        const orderA = (a as any).sort_order ?? 999;
        const orderB = (b as any).sort_order ?? 999;
        return orderA - orderB;
      });

    // For each section, get its child categories
    // Children have parent_category_id that is an actual category UUID (not starting with "section-")
    sections.forEach(section => {
      const children = filteredCategories
        .filter(cat => {
          const parentId = cat.parent_category_id;
          // Child if: parent_category_id matches this section's ID AND doesn't start with "section-"
          return parentId && 
                 typeof parentId === 'string' && 
                 !parentId.startsWith('section-') && 
                 parentId === section.id;
        })
        .sort((a, b) => {
          const orderA = (a as any).sort_order ?? 999;
          const orderB = (b as any).sort_order ?? 999;
          return orderA - orderB;
        });
      
      groups.push({ section, children });
    });

    console.log('📂 [CategorySelector] Built section groups:', {
      totalGroups: groups.length,
      groups: groups.map(g => ({
        section: g.section.name,
        childCount: g.children.length,
        children: g.children.map(c => c.name)
      }))
    });

    return groups;
  }, [filteredCategories]);

  const renderSectionGroup = (group: SectionGroup) => {
    const { section, children } = group;
    const emoji = SECTION_EMOJIS[section.name.toUpperCase()] || '📁';

    return (
      <div key={section.id} className="w-full">
        {/* Section Header - Bold, non-clickable, with emoji */}
        <div
          className="flex items-center w-full px-3 py-2.5 mb-1"
          style={{
            backgroundColor: 'rgba(91, 33, 182, 0.08)',
            borderLeft: `3px solid ${globalColors.purple.primary}`,
            cursor: 'default'
          }}
        >
          <span className="text-lg mr-2">{emoji}</span>
          <span 
            className="font-bold text-sm tracking-wide"
            style={{ color: globalColors.purple.light }}
          >
            {section.name.toUpperCase()}
          </span>
          <span 
            className="ml-auto text-xs font-medium"
            style={{ color: globalColors.text.secondary }}
          >
            {children.length} {children.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {/* Child Categories - Indented, clickable */}
        {children.map(category => {
          const isSelected = selectedCategoryId === category.id;
          
          // DEBUG: Log comparison for each category
          console.log('🎯 [Render] Category comparison:', {
            categoryName: category.name,
            categoryId: category.id,
            selectedCategoryId: selectedCategoryId,
            isSelected: isSelected,
            typesMatch: typeof selectedCategoryId === typeof category.id
          });
          
          return (
            <div
              key={category.id}
              className={`flex items-center w-full px-3 py-2 text-sm cursor-pointer transition-all duration-150 rounded-md ml-8 ${
                isSelected 
                  ? 'bg-purple-900/15 border-l-2 border-l-purple-600 text-purple-400 font-medium hover:bg-purple-900/20'
                  : 'bg-transparent border-l-2 border-l-transparent text-gray-100 hover:bg-gray-700/50'
              }`}
              onClick={() => {
                console.log('🖱️ [HierarchicalCategorySelector] Category clicked:', category.id, category.name);
                onCategorySelect(category.id);
                console.log('📤 [HierarchicalCategorySelector] onCategorySelect called');
              }}
            >
              {/* Bullet point for child categories */}
              <div 
                className={`w-2 h-2 rounded-full mr-3 ${
                  isSelected 
                    ? 'bg-purple-600' 
                    : 'bg-gray-400/50'
                }`}
              />
              <span>
                {category.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (sectionGroups.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label style={{ color: globalColors.text.primary }}>Category *</Label>
        <div 
          className="p-4 text-center rounded-md border"
          style={{
            backgroundColor: '#1E1E1E',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: globalColors.text.secondary
          }}
        >
          No categories available for this item type
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div 
        className="max-h-80 overflow-y-auto rounded-md border p-2 space-y-2"
        style={{
          backgroundColor: '#1E1E1E',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        {sectionGroups.map(group => renderSectionGroup(group))}
      </div>
      
      {selectedCategoryId && (
        <p className="text-xs" style={{ color: globalColors.text.secondary }}>
          Selected: {filteredCategories.find(cat => cat.id === selectedCategoryId)?.name}
        </p>
      )}
    </div>
  );
}
