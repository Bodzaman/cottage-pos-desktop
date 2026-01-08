import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Category } from 'utils/menuTypes';
import { QSAITheme } from 'utils/QSAIDesign';

interface Props {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void; // Changed to accept null for "All Items"
  className?: string;
  menuItems?: { category_id: string; active: boolean }[]; // Add menuItems prop for total count
}

/**
 * Nested category list component with collapsible parent/child structure
 * Matches main POSDesktop interface for consistent UX
 */
export function DineInCategoryList({
  categories,
  selectedCategory,
  onCategorySelect,
  className,
  menuItems = []
}: Props) {
  // Track which parent categories are expanded
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  
  // Get parent categories (no parent_category_id)
  const parentCategories = categories
    .filter(cat => !cat.parent_category_id && cat.active)
    .sort((a, b) => a.display_order - b.display_order);
  
  // Get child categories for a specific parent
  const getChildCategories = (parentId: string) => {
    return categories
      .filter(cat => cat.parent_category_id === parentId && cat.active)
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Calculate total active items count
  const totalActiveItems = menuItems.filter(item => item.active).length;

  // Toggle parent category expansion
  const toggleParentExpansion = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  // Handle parent category click - expand and select if no children
  const handleParentClick = (parent: Category) => {
    const childCategories = getChildCategories(parent.id);
    
    if (childCategories.length > 0) {
      // Has children - toggle expansion
      toggleParentExpansion(parent.id);
    } else {
      // No children - select directly
      onCategorySelect(parent.id);
    }
  };

  return (
    <div className={cn('flex flex-col h-full min-w-0', className)}>
      {/* Header */}
      <div 
        className="p-4 border-b flex-shrink-0"
        style={{ borderColor: QSAITheme.border.medium }}
      >
        <h3 className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>Categories</h3>
      </div>
      
      {/* Categories List - Let the shell column handle scrolling */}
      <div className="flex-1 min-w-0">
        <div className="p-2 space-y-1">
          {/* All Items Option */}
          <Button
            variant="ghost"
            onClick={() => onCategorySelect(null)}
            className={cn(
              'w-full justify-start text-sm px-3 py-2.5 h-auto transition-all duration-200 font-medium'
            )}
            style={{
              backgroundColor: selectedCategory === null ? QSAITheme.purple.secondary : 'transparent',
              color: QSAITheme.text.primary // Always use white text for consistency
            }}
          >
            {/* Category Name */}
            <span className="flex-1 text-left truncate">All Items</span>
          </Button>

          {parentCategories.map((parent) => {
            const childCategories = getChildCategories(parent.id);
            const isExpanded = expandedParents.has(parent.id);
            const isParentSelected = selectedCategory === parent.id;
            const hasChildren = childCategories.length > 0;
            
            return (
              <div key={parent.id} className="space-y-1">
                {/* Parent Category */}
                <Button
                  variant="ghost"
                  onClick={() => handleParentClick(parent)}
                  className={cn(
                    'w-full justify-start text-sm px-3 py-2.5 h-auto transition-all duration-200',
                    hasChildren && 'font-medium'
                  )}
                  style={{
                    backgroundColor: isParentSelected ? QSAITheme.purple.secondary : 'transparent',
                    borderColor: isParentSelected ? QSAITheme.purple.primary : 'transparent',
                    border: isParentSelected ? `1px solid ${QSAITheme.purple.primary}` : 'none',
                    color: isParentSelected ? QSAITheme.purple.primary : QSAITheme.text.primary
                  }}
                >
                  {/* Expansion Icon */}
                  {hasChildren && (
                    <div className="mr-2 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" style={{ color: QSAITheme.text.secondary }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: QSAITheme.text.secondary }} />
                      )}
                    </div>
                  )}
                  
                  {/* Category Name */}
                  <span className="flex-1 text-left truncate">{parent.name}</span>
                  
                  {/* Remove Item Count Badge - keeping this section clean */}
                </Button>
                
                {/* Child Categories - Only show if parent is expanded */}
                {hasChildren && isExpanded && (
                  <div 
                    className="ml-6 space-y-0.5 border-l pl-3"
                    style={{ borderColor: QSAITheme.border.light }}
                  >
                    {childCategories.map((child) => {
                      const isChildSelected = selectedCategory === child.id;
                      
                      return (
                        <Button
                          key={child.id}
                          variant="ghost"
                          onClick={() => onCategorySelect(child.id)}
                          className="w-full justify-start text-xs px-3 py-2 h-auto transition-all duration-200"
                          style={{
                            backgroundColor: isChildSelected ? QSAITheme.purple.secondary : 'transparent',
                            borderColor: isChildSelected ? QSAITheme.purple.primary : 'transparent',
                            border: isChildSelected ? `1px solid ${QSAITheme.purple.primary}` : 'none',
                            color: isChildSelected ? QSAITheme.purple.primary : QSAITheme.text.secondary
                          }}
                        >
                          <span className="flex-1 text-left truncate">{child.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DineInCategoryList;
