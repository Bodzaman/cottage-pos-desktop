


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../utils/menuTypes';
import { PremiumTheme } from '../utils/premiumTheme';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Grid3X3, Utensils, Coffee, Wine, Leaf } from 'lucide-react';
import { cn } from '../utils/cn';

interface CategoryNavigationProps {
  categories: Category[];
  selectedParentCategory: string | null;
  selectedMenuCategory: string | null;
  onParentCategorySelect: (categoryId: string | null) => void;
  onMenuCategorySelect: (categoryId: string | null) => void;
  menuItemCount?: Record<string, number>;
  className?: string;
  isMobile?: boolean;
}

// Fixed parent categories with Indian restaurant theming
const FIXED_PARENT_CATEGORIES = [
  { 
    id: 'starters', 
    label: 'STARTERS', 
    icon: <Utensils className="h-4 w-4" />,
    mappedNames: ['Starters', 'Appetizers', 'Appetizer', 'Hot Appetizers'],
    color: PremiumTheme.colors.silver[500]
  },
  { 
    id: 'main-course', 
    label: 'MAIN COURSE', 
    icon: <Grid3X3 className="h-4 w-4" />,
    mappedNames: ['Main Course', 'Mains', 'Main Courses', 'Tandoori Main Course', 'Tandoori Specialities', 'Chicken Dishes', 'Lamb Dishes', 'Seafood', 'Vegetarian Mains'],
    color: PremiumTheme.colors.tandoori[500]
  },
  { 
    id: 'side-dishes', 
    label: 'SIDE DISHES', 
    icon: <Leaf className="h-4 w-4" />,
    mappedNames: ['Side Dishes', 'Sides', 'Rice', 'Bread', 'Naan', 'Rice Dishes'],
    color: PremiumTheme.colors.royal[500]
  },
  { 
    id: 'accompaniments', 
    label: 'ACCOMPANIMENTS', 
    icon: <Utensils className="h-4 w-4" />,
    mappedNames: ['Accompaniments', 'Sauces', 'Condiments', 'Chutneys'],
    color: PremiumTheme.colors.gold[500]
  },
  { 
    id: 'desserts-coffee', 
    label: 'DESSERTS & COFFEE', 
    icon: <Coffee className="h-4 w-4" />,
    mappedNames: ['Desserts & Coffee', 'Coffee & Desserts', 'Desserts', 'Sweet', 'Coffee', 'Ice Cream'],
    color: PremiumTheme.colors.silver[600]
  },
  { 
    id: 'drinks-wine', 
    label: 'DRINKS & WINE', 
    icon: <Wine className="h-4 w-4" />,
    mappedNames: ['Drinks & Wine', 'Drinks', 'Beverages', 'Wine', 'Alcohol', 'Soft Drinks'],
    color: PremiumTheme.colors.tandoori[600]
  }
];

export function CategoryNavigation({ 
  categories, 
  selectedParentCategory, 
  selectedMenuCategory, 
  onParentCategorySelect, 
  onMenuCategorySelect, 
  menuItemCount = {},
  className = '',
  isMobile = false
}: CategoryNavigationProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Auto-expand selected parent category
  useEffect(() => {
    if (selectedParentCategory) {
      setExpandedCategories(prev => new Set([...prev, selectedParentCategory]));
    }
  }, [selectedParentCategory]);
  
  // Get subcategories for a parent category
  const getSubcategories = (parentCategoryId: string) => {
    const fixedCategory = FIXED_PARENT_CATEGORIES.find(cat => cat.id === parentCategoryId);
    if (!fixedCategory) return [];
    
    return categories.filter(dbCategory => {
      // Exclude exact matches to prevent duplicate nesting (e.g., STARTERS appearing under STARTERS)
      if (dbCategory.name.toUpperCase() === fixedCategory.label.toUpperCase()) {
        return false;
      }
      
      // Only include categories that have a proper parent-child relationship OR are mapped subcategories
      const isDirectChild = dbCategory.parent_category_id && 
        categories.some(parent => 
          parent.id === dbCategory.parent_category_id && 
          fixedCategory.mappedNames.some(mappedName => 
            parent.name.toLowerCase().includes(mappedName.toLowerCase()) ||
            mappedName.toLowerCase().includes(parent.name.toLowerCase())
          )
        );
      
      // Include categories that are logically subcategories based on name mapping but not exact matches
      const isMappedSubcategory = fixedCategory.mappedNames.some(mappedName => 
        dbCategory.name.toLowerCase().includes(mappedName.toLowerCase()) &&
        dbCategory.name.toLowerCase() !== mappedName.toLowerCase() // Exclude exact matches
      );
      
      return (isDirectChild || isMappedSubcategory) && dbCategory.active;
    });
  };
  
  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  // Handle parent category selection
  const handleParentCategorySelect = (categoryId: string | null) => {
    onParentCategorySelect(categoryId);
    onMenuCategorySelect(null); // Clear subcategory selection
    
    if (categoryId) {
      setExpandedCategories(prev => new Set([...prev, categoryId]));
    }
  };
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: PremiumTheme.colors.dark[600] }}>
        <h2 
          className="text-sm font-semibold tracking-wide"
          style={{ color: PremiumTheme.colors.text.muted }}
        >
          CATEGORIES
        </h2>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Dishes */}
          <motion.button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
              !selectedParentCategory ? "font-medium" : ""
            )}
            style={{
              backgroundColor: !selectedParentCategory ? `${PremiumTheme.colors.royal[500]}20` : 'transparent',
              color: !selectedParentCategory ? PremiumTheme.colors.royal[300] : PremiumTheme.colors.text.secondary,
              border: !selectedParentCategory ? `1px solid ${PremiumTheme.colors.royal[500]}40` : '1px solid transparent'
            }}
            onClick={() => handleParentCategorySelect(null)}
            whileHover={{ 
              backgroundColor: !selectedParentCategory ? `${PremiumTheme.colors.royal[500]}30` : `${PremiumTheme.colors.dark[700]}50`,
              scale: 1.02
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Grid3X3 className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-sm">All Dishes</span>
            {menuItemCount.all && (
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: `${PremiumTheme.colors.royal[500]}30`,
                  color: PremiumTheme.colors.royal[300]
                }}
              >
                {menuItemCount.all}
              </span>
            )}
          </motion.button>
          
          {/* Fixed Parent Categories */}
          {FIXED_PARENT_CATEGORIES.map((parentCategory) => {
            const subcategories = getSubcategories(parentCategory.id);
            const isSelected = selectedParentCategory === parentCategory.id;
            const isExpanded = expandedCategories.has(parentCategory.id);
            const hasSubcategories = subcategories.length > 0;
            
            return (
              <div key={parentCategory.id} className="space-y-1">
                {/* Parent Category */}
                <motion.button
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                    isSelected ? "font-medium" : ""
                  )}
                  style={{
                    backgroundColor: isSelected ? `${parentCategory.color}20` : 'transparent',
                    color: isSelected ? parentCategory.color : PremiumTheme.colors.text.secondary,
                    border: isSelected ? `1px solid ${parentCategory.color}40` : '1px solid transparent'
                  }}
                  onClick={() => handleParentCategorySelect(parentCategory.id)}
                  whileHover={{ 
                    backgroundColor: isSelected ? `${parentCategory.color}30` : `${PremiumTheme.colors.dark[700]}50`,
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-shrink-0" style={{ color: parentCategory.color }}>
                    {parentCategory.icon}
                  </div>
                  <span className="flex-1 text-sm">{parentCategory.label}</span>
                  
                  {/* Item count */}
                  {menuItemCount[parentCategory.id] && (
                    <span 
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${parentCategory.color}30`,
                        color: parentCategory.color
                      }}
                    >
                      {menuItemCount[parentCategory.id]}
                    </span>
                  )}
                  
                  {/* Expand arrow */}
                  {hasSubcategories && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(parentCategory.id);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  )}
                </motion.button>
                
                {/* Subcategories */}
                <AnimatePresence>
                  {hasSubcategories && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden ml-4 space-y-1"
                    >
                      {subcategories.map((subcategory) => {
                        const isSubSelected = selectedMenuCategory === subcategory.id;
                        
                        return (
                          <motion.button
                            key={subcategory.id}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                              isSubSelected ? "font-medium" : ""
                            )}
                            style={{
                              backgroundColor: isSubSelected ? `${parentCategory.color}15` : 'transparent',
                              color: isSubSelected ? parentCategory.color : PremiumTheme.colors.text.muted,
                              border: isSubSelected ? `1px solid ${parentCategory.color}30` : '1px solid transparent'
                            }}
                            onClick={() => onMenuCategorySelect(subcategory.id)}
                            whileHover={{ 
                              backgroundColor: isSubSelected ? `${parentCategory.color}25` : `${PremiumTheme.colors.dark[700]}30`,
                              scale: 1.01
                            }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: subcategories.indexOf(subcategory) * 0.05 }}
                          >
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: parentCategory.color }} />
                            <span className="flex-1 text-sm truncate">{subcategory.name}</span>
                            
                            {/* Item count for subcategory */}
                            {menuItemCount[subcategory.id] && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${parentCategory.color}20`,
                                  color: parentCategory.color
                                }}
                              >
                                {menuItemCount[subcategory.id]}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          {/* Direct database categories (fallback) */}
          {categories
            .filter(cat => !cat.parent_category_id && cat.active)
            .filter(cat => !FIXED_PARENT_CATEGORIES.some(fixed => 
              fixed.mappedNames.some(name => 
                cat.name.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(cat.name.toLowerCase())
              )
            ))
            .map((category) => {
              const isSelected = selectedMenuCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                    isSelected ? "font-medium" : ""
                  )}
                  style={{
                    backgroundColor: isSelected ? `${PremiumTheme.colors.royal[500]}20` : 'transparent',
                    color: isSelected ? PremiumTheme.colors.royal[300] : PremiumTheme.colors.text.secondary,
                    border: isSelected ? `1px solid ${PremiumTheme.colors.royal[500]}40` : '1px solid transparent'
                  }}
                  onClick={() => onMenuCategorySelect(category.id)}
                  whileHover={{ 
                    backgroundColor: isSelected ? `${PremiumTheme.colors.royal[500]}30` : `${PremiumTheme.colors.dark[700]}50`,
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Utensils className="h-4 w-4 flex-shrink-0" style={{ color: PremiumTheme.colors.royal[500] }} />
                  <span className="flex-1 text-sm truncate">{category.name}</span>
                  
                  {menuItemCount[category.id] && (
                    <span 
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${PremiumTheme.colors.royal[500]}30`,
                        color: PremiumTheme.colors.royal[300]
                      }}
                    >
                      {menuItemCount[category.id]}
                    </span>
                  )}
                </motion.button>
              );
            })
          }
        </div>
      </ScrollArea>
    </div>
  );
}
