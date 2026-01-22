
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Category, MenuItem } from '../utils/menuTypes';
import { QSAITheme } from '../utils/QSAIDesign';

interface SubcategoryTabsProps {
  parentCategory: Category | null;
  subcategories: Category[];
  menuItems: MenuItem[];
  selectedSubcategory: string | null;
  onSubcategorySelect: (subcategoryId: string) => void;
  onBackToCategories: () => void;
  className?: string;
}

export function SubcategoryTabs({
  parentCategory,
  subcategories,
  menuItems,
  selectedSubcategory,
  onSubcategorySelect,
  onBackToCategories,
  className = ''
}: SubcategoryTabsProps) {
  
  // Count items in each subcategory
  const getSubcategoryItemCount = (subcategoryId: string) => {
    return menuItems.filter(item => item.category_id === subcategoryId && item.active).length;
  };

  // If no parent category selected, don't render
  if (!parentCategory) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Breadcrumb Navigation */}
      <div className="flex items-center mb-4 px-4 py-2 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToCategories}
          className="text-gray-400 hover:text-white hover:bg-white/5 mr-3"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>
        <ChevronRight className="h-4 w-4 text-gray-500 mr-3" />
        <span className="text-white font-medium">{parentCategory.name}</span>
      </div>

      {/* Horizontal Subcategory Tabs */}
      {subcategories.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {subcategories.map((subcategory) => {
                const isSelected = selectedSubcategory === subcategory.id;
                const itemCount = getSubcategoryItemCount(subcategory.id);

                return (
                  <motion.div
                    key={subcategory.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSubcategorySelect(subcategory.id)}
                      className={`h-10 px-4 transition-all duration-200 ${
                        isSelected
                          ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-md'
                          : 'border-white/20 text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/30'
                      }`}
                      style={{
                        background: isSelected ? QSAITheme.accent.purple : 'transparent'
                      }}
                    >
                      <span className="font-medium">{subcategory.name}</span>
                      {itemCount > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={`ml-2 text-xs ${
                            isSelected 
                              ? 'bg-purple-400/30 text-purple-100' 
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {itemCount}
                        </Badge>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Show all items in category option */}
      <div className="px-4 pb-4 border-b border-white/10">
        <Button
          variant={!selectedSubcategory ? "default" : "outline"}
          size="sm"
          onClick={() => onSubcategorySelect('')}
          className={`transition-all duration-200 ${
            !selectedSubcategory
              ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-md'
              : 'border-white/20 text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/30'
          }`}
        >
          <span className="font-medium">All {parentCategory.name}</span>
          <Badge 
            variant="secondary" 
            className={`ml-2 text-xs ${
              !selectedSubcategory 
                ? 'bg-purple-400/30 text-purple-100' 
                : 'bg-white/10 text-white'
            }`}
          >
            {menuItems.filter(item => {
              const allSubcategoryIds = subcategories.map(sub => sub.id);
              return (item.category_id === parentCategory.id || allSubcategoryIds.includes(item.category_id)) && item.active;
            }).length}
          </Badge>
        </Button>
      </div>
    </div>
  );
}
