import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Category } from '../utils/menuTypes';
import { QSAITheme } from '../utils/QSAIDesign';
import { FIXED_SECTIONS } from 'utils/sectionMapping';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  categories: Category[];
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategory: string | null;
  isLoading?: boolean;
}

const CategorySidebar = React.memo(function CategorySidebar({
  categories,
  onCategorySelect,
  selectedCategory,
  isLoading = false
}: Props) {
  // State for expanded parent categories with localStorage persistence
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pos_expanded_categories');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.warn('Failed to load expanded categories from localStorage:', error);
      return new Set();
    }
  });
  
  // Glow animation state for selection changes
  const [showGlow, setShowGlow] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Persist expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pos_expanded_categories', JSON.stringify([...expandedCategories]));
    } catch (error) {
      console.warn('Failed to save expanded categories to localStorage:', error);
    }
  }, [expandedCategories]);
  
  // Trigger glow animation on selection change
  useEffect(() => {
    setShowGlow(true);
    const timer = setTimeout(() => setShowGlow(false), 300);
    return () => clearTimeout(timer);
  }, [selectedCategory]);
  
  // Get child categories for a specific section
  const getChildCategories = (sectionId: string) => {
    const sectionParentId = `section-${sectionId}`;
    return categories
      .filter(cat => cat.parent_category_id === sectionParentId && cat.active)
      .sort((a, b) => a.display_order - b.display_order);
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
  
  // Toggle expanded state for a parent section
  const toggleExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
      scrollToExpandedCategory(sectionId);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Handle category selection with smart expand logic
  const handleCategorySelect = (categoryId: string | null, isSection: boolean = false, sectionId?: string) => {
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      console.log('🎯 [CategorySidebar] Category selected:', {
        categoryId,
        isSection,
        sectionId,
        categoryType: categoryId?.startsWith('section-') ? 'SECTION' : 'REAL_CATEGORY'
      });
      
      if (categoryId && !categoryId.startsWith('section-')) {
        const selectedCat = categories.find(c => c.id === categoryId);
        console.log('🎯 [CategorySidebar] Selected category details:', selectedCat);
      }
    }
    
    onCategorySelect(categoryId);
    
    // If selecting a section, auto-expand it and scroll to it
    if (isSection && sectionId) {
      const newExpanded = new Set(expandedCategories);
      newExpanded.add(sectionId);
      setExpandedCategories(newExpanded);
      scrollToExpandedCategory(sectionId);
    }
  };

  // Check if a section should have parent highlight (when a child is selected)
  const isParentOfSelected = (sectionId: string): boolean => {
    if (!selectedCategory) return false;
    const childCategories = getChildCategories(sectionId);
    return childCategories.some(cat => cat.id === selectedCategory);
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
        }}>CATEGORIES</h2>
        {/* Gradient Underline */}
        <div 
          className="w-24 h-1 rounded-full mt-2"
          style={{
            background: `linear-gradient(90deg, transparent, ${QSAITheme.purple.light}, transparent)`
          }}
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 p-3">
          <div className="text-gray-400 text-sm">Loading categories...</div>
        </div>
      ) : (
        <TooltipProvider>
          <div 
            ref={scrollContainerRef}
            className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/70 scrollbar-track-transparent"
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
                color: !selectedCategory ? '#FFFFFF' : '#D1D1D6',
                boxShadow: !selectedCategory && showGlow ? `0 0 12px ${QSAITheme.purple.glow}` : 'none',
                transition: 'box-shadow 300ms ease-in-out'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory) {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory) {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.5)';
                  e.currentTarget.style.color = '#D1D1D6';
                }
              }}
            >
              All Items
            </button>

            {/* 7 Fixed Sections with child categories */}
            {FIXED_SECTIONS.map((section, sectionIndex) => {
              const childCategories = getChildCategories(section.id);
              const sectionParentId = `section-${section.id}`;
              const isExpanded = expandedCategories.has(section.id);
              const isSectionSelected = selectedCategory === sectionParentId;
              const hasChildren = childCategories.length > 0;
              const hasParentHighlight = isParentOfSelected(section.id);
              
              return (
                <React.Fragment key={section.id}>
                  <div className="mb-0.5" data-category-id={section.id}>
                    {/* Section Parent */}
                    <div className="flex items-center">
                      {/* Expand/Collapse Button */}
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpanded(section.id)}
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
                      
                      {/* Section Button with Tooltip - Pass section-* ID */}
                      <Tooltip delayDuration={700}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleCategorySelect(sectionParentId, true, section.id)}
                            className={`flex-1 px-3 py-1.5 text-left rounded-md transition-all duration-200 font-medium text-sm ${
                              !hasChildren ? 'ml-4' : ''
                            }`}
                            style={{
                              backgroundColor: isSectionSelected 
                                ? QSAITheme.purple.primary 
                                : hasParentHighlight
                                ? 'rgba(124, 58, 237, 0.1)'
                                : 'rgba(30, 30, 30, 0.5)',
                              color: isSectionSelected ? '#FFFFFF' : '#D1D1D6',
                              boxShadow: isSectionSelected && showGlow ? `0 0 12px ${QSAITheme.purple.glow}` : 'none',
                              transition: 'background-color 200ms, box-shadow 300ms ease-in-out'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSectionSelected) {
                                e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
                                e.currentTarget.style.color = '#FFFFFF';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSectionSelected) {
                                e.currentTarget.style.backgroundColor = hasParentHighlight 
                                  ? 'rgba(124, 58, 237, 0.1)' 
                                  : 'rgba(30, 30, 30, 0.5)';
                                e.currentTarget.style.color = '#D1D1D6';
                              }
                            }}
                          >
                            {section.displayName}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p>{section.displayName}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    {/* Child Categories */}
                    {hasChildren && (
                      <div 
                        className="ml-4 overflow-visible transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: isExpanded ? 'none' : '0px',
                          opacity: isExpanded ? 1 : 0,
                          pointerEvents: isExpanded ? 'auto' : 'none',
                          display: isExpanded ? 'block' : 'none'
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
                              
                              {/* Child Category Button with Tooltip */}
                              <Tooltip delayDuration={700}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleCategorySelect(childCategory.id, false)}
                                    className="flex-1 px-2 py-1 text-left rounded-md transition-all duration-200 text-xs truncate"
                                    style={{
                                      backgroundColor: isChildSelected 
                                        ? QSAITheme.purple.primary 
                                        : 'rgba(20, 20, 20, 0.4)',
                                      color: isChildSelected ? '#FFFFFF' : '#B3B3B3',
                                      borderLeft: `2px solid ${isChildSelected ? QSAITheme.purple.light : 'transparent'}`,
                                      boxShadow: isChildSelected && showGlow ? `0 0 12px ${QSAITheme.purple.glow}` : 'none',
                                      transition: 'background-color 200ms, border-left-color 200ms, box-shadow 300ms ease-in-out'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isChildSelected) {
                                        e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
                                        e.currentTarget.style.color = '#FFFFFF';
                                        e.currentTarget.style.borderLeftColor = QSAITheme.purple.light;
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isChildSelected) {
                                        e.currentTarget.style.backgroundColor = 'rgba(20, 20, 20, 0.4)';
                                        e.currentTarget.style.color = '#B3B3B3';
                                        e.currentTarget.style.borderLeftColor = 'transparent';
                                      }
                                    }}
                                  >
                                    {childCategory.name}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p>{childCategory.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Subtle Section Divider (not after last section) */}
                  {sectionIndex < FIXED_SECTIONS.length - 1 && (
                    <div 
                      className="my-2"
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                        marginLeft: '0.5rem',
                        marginRight: '0.5rem'
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
});

// Set display name for debugging
CategorySidebar.displayName = 'CategorySidebar';

export { CategorySidebar };
