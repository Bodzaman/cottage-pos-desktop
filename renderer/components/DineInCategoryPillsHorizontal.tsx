import React, { useState, useMemo } from 'react';
import { MenuCategory, MenuItem } from 'types';
import { QSAITheme } from 'utils/QSAIDesign';
import { FIXED_SECTIONS } from 'utils/sectionMapping';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';

interface Props {
  categories: MenuCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  menuItems?: { category_id: string; active: boolean }[];
  className?: string;
}

/**
 * Horizontal category pill navigation for DineInOrderModal
 * Matches POSDesktop Zone 2 design with parent/child collapsible structure
 * 
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │ [All Items] [Starters] [Main Course] [Sides] [Drinks]  │ ← Parent Pills
 * ├─────────────────────────────────────────────────────────┤
 * │ 🥩 CHICKEN  🦞 SEAFOOD  🥬 VEGETARIAN  🌶️ VEGAN       │ ← Child Pills (conditional)
 * └─────────────────────────────────────────────────────────┘
 */
export function DineInCategoryPillsHorizontal({
  categories,
  selectedCategory,
  onCategorySelect,
  menuItems = [],
  className = ''
}: Props) {
  // Track which parent category is expanded
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  // Get parent categories (no parent_category_id)
  const parentCategories = categories
    .filter(cat => !cat.parent_category_id && cat.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Get child categories for a specific parent
  const getChildCategories = (parentId: string) => {
    return categories
      .filter(cat => cat.parent_category_id === parentId && cat.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  // Helper to get parent ID of a category
  const getParentId = (categoryId: string): string | null => {
    const category = categories.find(c => c.id === categoryId);
    return category?.parent_category_id || null;
  };

  // Helper to strip [SECTION] prefix from category names
  const stripSectionPrefix = (name: string): string => {
    return name.replace(/^\[SECTION\]\s*/i, '');
  };

  // Split text into multiple lines for compact display
  const getMultiLineText = (name: string): string[] => {
    // Strip [SECTION] prefix first
    const cleanName = stripSectionPrefix(name);
    const words = cleanName.split(' ');
    if (words.length === 1) {
      // Single word - split in middle if too long
      if (cleanName.length > 12) {
        const mid = Math.ceil(cleanName.length / 2);
        return [cleanName.substring(0, mid), cleanName.substring(mid)];
      }
      return [cleanName];
    }
    // Multi-word - put on separate lines
    if (words.length === 2) {
      return words;
    }
    // 3+ words - group intelligently (first word, rest)
    return [words[0], words.slice(1).join(' ')];
  };

  // ✅ Handle category selection with menu store integration
  const handleCategoryClick = (categoryId: string | null) => {
    // Update menu store to filter items
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(categoryId);
    
    // Update local UI state
    onCategorySelect(categoryId);
    
    // Handle expanded parent state
    if (!categoryId) {
      // "All Items" clicked - collapse all
      setExpandedParent(null);
    } else {
      const clickedParentId = getParentId(categoryId);
      if (!clickedParentId) {
        // Clicked a parent category - expand it to show children
        const children = getChildCategories(categoryId);
        if (children.length > 0) {
          setExpandedParent(categoryId);
        } else {
          setExpandedParent(null);
        }
      } else {
        // Clicked a child category - keep its parent expanded
        setExpandedParent(clickedParentId);
      }
    }
  };

  // Get currently expanded child categories
  const expandedChildCategories = expandedParent ? getChildCategories(expandedParent) : [];

  return (
    <div className={className}>
      {/* Row 1: "All Items" + Parent Category Pills */}
      <div
        className="flex items-stretch justify-between gap-2 px-3 py-2 border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* All Items Pill */}
        <button
          onClick={() => handleCategoryClick(null)}
          className="flex flex-col items-center justify-center rounded-full font-bold transition-all duration-200 flex-1"
          style={{
            minHeight: '44px',
            padding: '8px 6px',
            background: !selectedCategory
              ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
              : 'rgba(30, 30, 30, 0.6)',
            border: !selectedCategory
              ? '1.5px solid rgba(124, 58, 237, 0.5)'
              : '1.5px solid rgba(255, 255, 255, 0.1)',
            color: !selectedCategory ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
            boxShadow: !selectedCategory
              ? '0 4px 12px rgba(124, 58, 237, 0.3)'
              : 'none',
          }}
        >
          <div className="text-[11px] leading-tight text-center">
            <div>ALL</div>
            <div>ITEMS</div>
          </div>
        </button>

        {/* Parent Category Pills */}
        {parentCategories.map((parent) => {
          const isActive = selectedCategory === parent.id;
          const lines = getMultiLineText(parent.name);

          return (
            <button
              key={parent.id}
              onClick={() => handleCategoryClick(parent.id)}
              className="flex flex-col items-center justify-center rounded-full font-bold transition-all duration-200 flex-1"
              style={{
                minHeight: '44px',
                padding: '8px 6px',
                background: isActive
                  ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
                  : 'rgba(30, 30, 30, 0.6)',
                border: isActive
                  ? '1.5px solid rgba(124, 58, 237, 0.5)'
                  : '1.5px solid rgba(255, 255, 255, 0.1)',
                color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: isActive
                  ? '0 4px 12px rgba(124, 58, 237, 0.3)'
                  : 'none',
              }}
            >
              <div className="text-[11px] leading-tight text-center">
                {lines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Row 2: Child Category Pills (conditional) */}
      {expandedChildCategories.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {expandedChildCategories.map((child) => {
            const isActive = selectedCategory === child.id;
            const lines = getMultiLineText(child.name);

            return (
              <button
                key={child.id}
                onClick={() => handleCategoryClick(child.id)}
                className="flex flex-col items-center justify-center rounded-full font-bold transition-all duration-200"
                style={{
                  minHeight: '44px',
                  width: '100%',
                  padding: '8px 6px',
                  background: isActive
                    ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
                    : 'rgba(25, 25, 25, 0.5)',
                  border: isActive
                    ? '2px solid rgba(124, 58, 237, 0.5)'
                    : '2px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                  boxShadow: isActive
                    ? '0 4px 12px rgba(124, 58, 237, 0.3)'
                    : 'none',
                }}
              >
                <div className="text-[11px] leading-tight text-center">
                  {lines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
