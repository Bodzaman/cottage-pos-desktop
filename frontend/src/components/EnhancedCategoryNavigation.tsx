import React, { useState } from 'react';
import { Category, MenuItem } from '../utils/menuTypes';
import { EnhancedMenuCategories } from './EnhancedMenuCategories';
import { SubcategoryTabs } from './SubcategoryTabs';
import { MenuBreadcrumb } from './MenuBreadcrumb';

interface EnhancedCategoryNavigationProps {
  categories: Category[];
  menuItems: MenuItem[];
  selectedCategory: string | null;
  selectedParentCategory: string | null;
  searchQuery: string;
  onCategorySelect: (categoryId: string) => void;
  onParentCategorySelect: (parentCategoryId: string) => void;
  onSearchChange: (query: string) => void;
  onShowAllItems: () => void;
  className?: string;
}

export function EnhancedCategoryNavigation({
  categories,
  menuItems,
  selectedCategory,
  selectedParentCategory,
  searchQuery,
  onCategorySelect,
  onParentCategorySelect,
  onSearchChange,
  onShowAllItems,
  className = ''
}: EnhancedCategoryNavigationProps) {
  
  // Get subcategories for selected parent
  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_category_id === parentId && cat.active);
  };
  
  // Get selected parent category object
  const selectedParentCategoryObj = selectedParentCategory 
    ? categories.find(cat => cat.id === selectedParentCategory) 
    : null;
  
  // Get selected subcategory object
  const selectedSubcategoryObj = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory) 
    : null;
  
  // Get subcategories for selected parent
  const subcategories = selectedParentCategory ? getSubcategories(selectedParentCategory) : [];
  
  // Handle back to categories
  const handleBackToCategories = () => {
    onParentCategorySelect('');
    onCategorySelect('');
    onSearchChange('');
  };
  
  // Handle back to parent category (from subcategory)
  const handleBackToParentCategory = () => {
    onCategorySelect('');
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Left Sidebar - Parent Categories Only */}
      <div className="w-80 h-full border-r border-white/10">
        <EnhancedMenuCategories
          categories={categories}
          menuItems={menuItems}
          selectedCategory={selectedCategory}
          selectedParentCategory={selectedParentCategory}
          searchQuery={searchQuery}
          onCategorySelect={onCategorySelect}
          onParentCategorySelect={onParentCategorySelect}
          onSearchChange={onSearchChange}
          onShowAllItems={onShowAllItems}
        />
      </div>
      
      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb Navigation */}
        {selectedParentCategory && (
          <MenuBreadcrumb
            parentCategory={selectedParentCategoryObj}
            selectedSubcategory={selectedSubcategoryObj}
            onBackToCategories={handleBackToCategories}
            onBackToParentCategory={handleBackToParentCategory}
          />
        )}
        
        {/* Horizontal Subcategory Tabs */}
        {selectedParentCategory && (
          <SubcategoryTabs
            parentCategory={selectedParentCategoryObj}
            subcategories={subcategories}
            menuItems={menuItems}
            selectedSubcategory={selectedCategory}
            onSubcategorySelect={onCategorySelect}
            onBackToCategories={handleBackToCategories}
          />
        )}
        
        {/* Menu Items Area - This would be handled by the parent component */}
        <div className="flex-1">
          {/* Menu items grid will be rendered by parent component */}
        </div>
      </div>
    </div>
  );
}