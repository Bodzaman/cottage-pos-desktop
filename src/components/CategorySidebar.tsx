
/**
 * CategorySidebar - Menu Category Navigation Component
 * Adapted for cottage-pos-desktop Electron app
 * 
 * Original from Databutton Cottage Tandoori platform
 * Adapted for standalone Electron application
 */

import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Category } from '../types/menuTypes'; // Updated import path
import { QSAITheme } from '../utils/QSAIDesign';

interface Props {
  categories: Category[];
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  isLoading?: boolean;
}

// Simple category mapping for legacy design
const CATEGORY_LABELS: { [key: string]: string } = {
  'starters': 'STARTERS',
  'main-course': 'MAIN COURSE', 
  'side-dishes': 'SIDE DISHES',
  'accompaniments': 'ACCOMPANIMENTS',
  'desserts': 'DESSERTS & COFFEE',
  'drinks': 'DRINKS & WINE',
  'set-meals': 'SET MEALS'
};

export function CategorySidebar({
  categories,
  onCategorySelect,
  selectedCategory,
  isLoading = false
}: Props) {
  // State for expanded parent categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get parent categories (those without parent_category_id)
  const parentCategories = categories.filter(cat => !cat.parent_category_id && cat.active)
    .sort((a, b) => a.display_order - b.display_order);

  // Get child categories for a specific parent
  const getChildCategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_category_id === parentId && cat.active)
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Get standardized category name for display
  const getCategoryDisplayName = (category: Category) => {
    const name = category.name.toUpperCase();
    // Map common database names to standard display names
    if (name.includes('STARTER') || name.includes('APPETIZER')) return 'STARTERS';
    if (name.includes('MAIN')) return 'MAIN COURSE';
    if (name.includes('SIDE') || name.includes('RICE') || name.includes('BREAD')) return 'SIDE DISHES';
    if (name.includes('ACCOMPANIMENT') || name.includes('SAUCE')) return 'ACCOMPANIMENTS';
    if (name.includes('DESSERT') || name.includes('COFFEE') || name.includes('SWEET')) return 'DESSERTS & COFFEE';
    if (name.includes('DRINK') || name.includes('WINE') || name.includes('BEVERAGE')) return 'DRINKS & WINE';
    if (name.includes('SET') || name.includes('MEAL') || name.includes('COMBO')) return 'SET MEALS';
    return name;
  };

  // Auto-scroll to show expanded category
  const scrollToExpandedCategory = (categoryId: string) => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const categoryElement = scrollContainerRef.current.querySelector(`[data-category-id="${categoryId}"]`);
        if (categoryElement) {
          categoryElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }, 100);
  };

  // Toggle expanded state for a parent category
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      scrollToExpandedCategory(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle category selection with smart expand logic
  const handleCategorySelect = (categoryId: string | null, isParent: boolean = false, parentId?: string) => {
    onCategorySelect(categoryId);

    // If selecting a parent category, auto-expand it and scroll to it
    if (isParent && categoryId) {
      const newExpanded = new Set(expandedCategories);
      newExpanded.add(categoryId);
      setExpandedCategories(newExpanded);
      scrollToExpandedCategory(categoryId);
    }
  };

  return (
    <div 
      className="flex flex-col h-full"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        className="px-3 py-2 border-b flex-shrink-0" 
        style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        <h2 className="text-base font-semibold" style={{
          backgroundImage: `linear-gradient(135deg, white 30%, ${QSAITheme.purple.light} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 10px rgba(124, 93, 250, 0.2)'
        }}>Categories</h2>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 p-3">
          <div className="text-gray-400 text-sm">Loading categories...</div>
        </div>
      ) : (
        /* Scrollable Container */
        <div 
          ref={scrollContainerRef}
          className="flex-1 px-2 py-2 overflow-y-auto"
          style={{
            minHeight: 0,
            maxHeight: '100%'
          }}
        >
          {/* All Items Button */}
          <button
            onClick={() => handleCategorySelect(null)}
            className="w-full px-3 py-1.5 mb-1 text-left rounded-md transition-all duration-200 font-medium text-sm"
            style={{
              backgroundColor: !selectedCategory 
                ? QSAITheme.purple.primary 
                : 'rgba(30, 30, 30, 0.5)',
              color: !selectedCategory ? '#FFFFFF' : '#D1D1D6'
            }}
          >
            All Items
          </button>

          {/* Hierarchical Category Structure */}
          {parentCategories.map((parentCategory) => {
            const childCategories = getChildCategories(parentCategory.id);
            const isExpanded = expandedCategories.has(parentCategory.id);
            const isParentSelected = selectedCategory === parentCategory.id;
            const hasChildren = childCategories.length > 0;
            const displayName = getCategoryDisplayName(parentCategory);

            return (
              <div key={parentCategory.id} className="mb-0.5" data-category-id={parentCategory.id}>
                {/* Parent Category */}
                <div className="flex items-center">
                  {/* Expand/Collapse Button */}
                  {hasChildren && (
                    <button
                      onClick={() => toggleExpanded(parentCategory.id)}
                      className="flex-shrink-0 p-0.5 mr-1 rounded transition-colors duration-150"
                      style={{
                        color: isExpanded ? QSAITheme.purple.light : '#9CA3AF'
                      }}
                    >
                      <ChevronRight 
                        size={12} 
                        style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease-in-out'
                        }}
                      />
                    </button>
                  )}

                  {/* Parent Category Button */}
                  <button
                    onClick={() => handleCategorySelect(parentCategory.id, true)}
                    className={`flex-1 px-3 py-1.5 text-left rounded-md transition-all duration-200 font-medium text-sm ${
                      !hasChildren ? 'ml-4' : ''
                    }`}
                    style={{
                      backgroundColor: isParentSelected 
                        ? QSAITheme.purple.primary 
                        : 'rgba(30, 30, 30, 0.5)',
                      color: isParentSelected ? '#FFFFFF' : '#D1D1D6'
                    }}
                  >
                    {displayName}
                  </button>
                </div>

                {/* Child Categories */}
                {hasChildren && (
                  <div 
                    className="ml-4 overflow-visible transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: isExpanded ? 'none' : '0px',
                      opacity: isExpanded ? 1 : 0
                    }}
                  >
                    {childCategories.map((childCategory, index) => {
                      const isChildSelected = selectedCategory === childCategory.id;
                      const isLastChild = index === childCategories.length - 1;

                      return (
                        <div
                          key={childCategory.id}
                          className="flex items-center mb-0.5 transition-transform duration-300 ease-in-out"
                          style={{
                            transform: isExpanded ? 'translateY(0)' : 'translateY(-5px)'
                          }}
                        >
                          {/* Tree connector */}
                          <div 
                            className="flex-shrink-0 mr-1 text-xs"
                            style={{ color: 'rgba(156, 163, 175, 0.3)' }}
                          >
                            {isLastChild ? '└' : '├'}
                          </div>

                          {/* Child Category Button */}
                          <button
                            onClick={() => handleCategorySelect(childCategory.id, false, parentCategory.id)}
                            className="flex-1 px-2 py-1 text-left rounded-md transition-all duration-200 text-xs"
                            style={{
                              backgroundColor: isChildSelected 
                                ? QSAITheme.purple.primary 
                                : 'rgba(20, 20, 20, 0.4)',
                              color: isChildSelected ? '#FFFFFF' : '#B3B3B3',
                              borderLeft: `2px solid ${isChildSelected ? QSAITheme.purple.light : 'transparent'}`
                            }}
                          >
                            {childCategory.name}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategorySidebar;
