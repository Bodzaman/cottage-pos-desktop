


import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Utensils, ChefHat, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '../utils/menuTypes';
import { QSAITheme } from '../utils/QSAIDesign';

interface Props {
  categories: Category[];
  onCategorySelect: (categoryId: string | null) => void;
  onParentCategorySelect: (parentCategoryId: string) => void;
  onRefresh: () => void;
  selectedCategory: string | null;
  selectedParentCategory: string | null;
  isLoading?: boolean;
}

// Define fixed parent categories with mapping to database categories
const FIXED_PARENT_CATEGORIES = [
  { id: 'starters', label: 'STARTERS', mappedNames: ['Starters', 'Appetizers', 'Appetizer'] },
  { id: 'main-course', label: 'MAIN COURSE', mappedNames: ['Main Course', 'Mains', 'Main Courses', 'Tandoori Main Course'] },
  { id: 'side-dishes', label: 'SIDE DISHES', mappedNames: ['Side Dishes', 'Sides', 'Rice', 'Bread'] },
  { id: 'accompaniments', label: 'ACCOMPANIMENTS', mappedNames: ['Accompaniments', 'Sauces', 'Condiments'] },
  { id: 'desserts-coffee', label: 'DESSERTS & COFFEE', mappedNames: ['Desserts & Coffee', 'Coffee & Desserts', 'Desserts', 'Sweet', 'Coffee'] },
  { id: 'drinks-wine', label: 'DRINKS & WINE', mappedNames: ['Drinks & Wine', 'Drinks', 'Beverages', 'Wine', 'Alcohol'] },
  { id: 'set-meals', label: 'SET MEALS', mappedNames: ['Set Meals', 'Combinations', 'Special Offers'] }
];

export function POSMenuNavigator({
  categories,
  onCategorySelect,
  onParentCategorySelect,
  onRefresh,
  selectedCategory,
  selectedParentCategory,
  isLoading = false
}: Props) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const tier2ScrollRef = useRef<HTMLDivElement>(null);

  // Get current fixed parent category based on selected parent
  const getCurrentFixedParentCategory = () => {
    if (selectedCategory === 'set-meals') {
      return 'set-meals';
    }
    
    if (!selectedParentCategory) return null;
    
    const currentParentCategory = categories.find(cat => cat.id === selectedParentCategory);
    if (!currentParentCategory) return null;
    
    // Find which fixed category this database category maps to
    for (const fixedCategory of FIXED_PARENT_CATEGORIES) {
      if (fixedCategory.mappedNames.some(mappedName => 
        currentParentCategory.name.toLowerCase().includes(mappedName.toLowerCase()) ||
        mappedName.toLowerCase().includes(currentParentCategory.name.toLowerCase())
      )) {
        return fixedCategory.id;
      }
    }
    
    return null;
  };

  // Handle fixed parent category selection
  const handleFixedParentCategorySelect = (fixedParentId: string) => {
    if (fixedParentId === 'set-meals') {
      // Special handling for Set Meals - find actual SET MEALS category by name
      const setMealsCategory = categories.find(cat => cat.name === 'SET MEALS');
      if (setMealsCategory) {
        onCategorySelect(setMealsCategory.id);
      } else {
        // Fallback to hardcoded string for backwards compatibility
        onCategorySelect('set-meals');
      }
    } else {
      // Find matching database parent categories for this fixed category
      const fixedCategory = FIXED_PARENT_CATEGORIES.find(cat => cat.id === fixedParentId);
      if (fixedCategory) {
        // Find database parent categories that match this fixed category
        const matchingParentCategories = categories.filter(cat => 
          !cat.parent_category_id && 
          fixedCategory.mappedNames.some(mappedName => 
            cat.name.toLowerCase().includes(mappedName.toLowerCase()) ||
            mappedName.toLowerCase().includes(cat.name.toLowerCase())
          )
        );
        
        if (matchingParentCategories.length > 0) {
          // Select the first matching parent category
          onParentCategorySelect(matchingParentCategories[0].id);
        }
      }
    }
  };

  // Get currently selected fixed parent category
  const currentFixedParentCategory = getCurrentFixedParentCategory();

  // Get all relevant categories for Tier 2 (parent + children) when Tier 1 is selected
  const getTier2Categories = () => {
    if (!currentFixedParentCategory || currentFixedParentCategory === 'set-meals') {
      return [];
    }

    const fixedCategory = FIXED_PARENT_CATEGORIES.find(cat => cat.id === currentFixedParentCategory);
    if (!fixedCategory) return [];

    // Find all database parent categories that match this fixed category
    const matchingParentCategories = categories.filter(cat => 
      !cat.parent_category_id && 
      fixedCategory.mappedNames.some(mappedName => 
        cat.name.toLowerCase().includes(mappedName.toLowerCase()) ||
        mappedName.toLowerCase().includes(cat.name.toLowerCase())
      )
    );

    // Get all children for these parent categories
    const allChildren = matchingParentCategories.flatMap(parent => 
      categories.filter(cat => cat.parent_category_id === parent.id)
    );

    // Combine parents and children with type indicator
    const tier2Categories = [
      ...matchingParentCategories.map(cat => ({ ...cat, isParent: true })),
      ...allChildren.map(cat => ({ ...cat, isParent: false }))
    ];

    return tier2Categories;
  };

  const tier2Categories = getTier2Categories();

  // Check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    if (!tier2ScrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tier2ScrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Auto-scroll to active category
  const scrollToActiveCategory = () => {
    if (!tier2ScrollRef.current || !selectedCategory) return;
    
    const activeButton = tier2ScrollRef.current.querySelector(`[data-category-id="${selectedCategory}"]`) as HTMLElement;
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Scroll by a specific amount
  const scrollBy = (direction: 'left' | 'right') => {
    if (!tier2ScrollRef.current) return;
    
    const scrollAmount = tier2ScrollRef.current.clientWidth * 0.6; // Scroll by 60% of visible width
    const targetScroll = tier2ScrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    
    tier2ScrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isHovering || !tier2ScrollRef.current) return;
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollBy('left');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollBy('right');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHovering]);

  // Auto-scroll to active category when selection changes
  useEffect(() => {
    scrollToActiveCategory();
  }, [selectedCategory]);

  // Initialize scroll position check
  useEffect(() => {
    checkScrollPosition();
  }, [tier2Categories]);

  return (
    <div className="space-y-4 p-4 rounded-lg" style={{
      background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Primary Tier: Compact Category Tabs */}
      <div className="px-4 py-3 border-b border-white/10" style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)'
      }}>
        <div className="flex gap-1 overflow-x-auto scrollbar-none" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {FIXED_PARENT_CATEGORIES.map((fixedCategory) => {
            const isActive = currentFixedParentCategory === fixedCategory.id;
            return (
            <button
              key={fixedCategory.id}
              onClick={() => handleFixedParentCategorySelect(fixedCategory.id)}
              className={`px-1.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-300 transform hover:scale-[1.02] whitespace-nowrap flex-shrink-0 min-w-fit ${
                isActive
                  ? 'text-white shadow-2xl scale-[1.02]'
                  : 'text-gray-300 hover:text-white hover:shadow-lg'
              }`}
              style={isActive ? {
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                boxShadow: `0 12px 32px -8px ${QSAITheme.purple.primary}60, 0 4px 16px -4px ${QSAITheme.purple.primary}40`
              } : {
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {fixedCategory.label}
            </button>
            );
          })}
        </div>

        {/* Secondary Tier: Parent + Child Categories with Enhanced Scrolling */}
        {tier2Categories.length > 0 && currentFixedParentCategory !== 'set-meals' && (
          <div 
            className="relative px-4 py-3 border-t border-b" 
            style={{
              background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.06) 0%, rgba(71, 85, 105, 0.06) 100%)',
              borderTopColor: 'rgba(100, 116, 139, 0.15)',
              borderBottomColor: 'rgba(100, 116, 139, 0.15)'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Scroll Container with Enhanced Scrollbar */}
            <div className="relative">
              {/* Left Fade Gradient */}
              {showLeftArrow && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(to right, rgba(20, 20, 20, 0.9) 0%, transparent 100%)'
                  }}
                />
              )}
              
              {/* Right Fade Gradient */}
              {showRightArrow && (
                <div 
                  className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(to left, rgba(20, 20, 20, 0.9) 0%, transparent 100%)'
                  }}
                />
              )}
              
              {/* Left Scroll Arrow */}
              {showLeftArrow && isHovering && (
                <button
                  onClick={() => scrollBy('left')}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'rgba(100, 116, 139, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <ChevronLeft className="w-3 h-3 text-white" />
                </button>
              )}
              
              {/* Right Scroll Arrow */}
              {showRightArrow && isHovering && (
                <button
                  onClick={() => scrollBy('right')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'rgba(100, 116, 139, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <ChevronRight className="w-3 h-3 text-white" />
                </button>
              )}
              
              {/* Scrollable Content */}
              <div 
                ref={tier2ScrollRef}
                className="flex gap-1 overflow-x-auto"
                style={{
                  scrollbarWidth: isHovering ? 'thin' : 'none',
                  msOverflowStyle: isHovering ? 'auto' : 'none',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch'
                }}
                onScroll={checkScrollPosition}
              >
                {/* All Items button */}
                <Button
                  variant={!selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategorySelect(null)}
                  data-category-id="all"
                  className={`
                    relative px-2 py-1 text-[10px] transition-all duration-200 rounded-md flex-shrink-0
                    ${!selectedCategory 
                      ? 'text-white font-semibold' 
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                  style={{
                    background: !selectedCategory 
                      ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.4) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: !selectedCategory 
                      ? '1px solid rgba(100, 116, 139, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: !selectedCategory 
                      ? '0 2px 8px rgba(100, 116, 139, 0.3)'
                      : 'none'
                  }}
                >
                  ALL ITEMS
                </Button>
                
                {/* Parent and Child Categories */}
                {tier2Categories.map((category) => {
                  const isActive = selectedCategory === category.id;
                  const isParent = category.isParent;
                  
                  return (
                    <Button
                      key={category.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCategorySelect(category.id)}
                      data-category-id={category.id}
                      className={`
                        relative px-2 py-1 text-[10px] transition-all duration-200 rounded-md flex-shrink-0
                        ${isActive 
                          ? 'text-white' 
                          : 'text-gray-300 hover:text-white'
                        }
                        ${isParent ? 'font-semibold' : 'font-normal ml-2'}
                      `}
                      style={{
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.4) 100%)'
                          : isParent 
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(255, 255, 255, 0.04)',
                        border: isActive 
                          ? '1px solid rgba(100, 116, 139, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isActive 
                          ? '0 2px 8px rgba(100, 116, 139, 0.3)'
                          : 'none'
                      }}
                    >
                      {isParent ? category.name : `• ${category.name}`}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default POSMenuNavigator;
