import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Category } from '../utils/menuTypes';

interface MenuBreadcrumbProps {
  parentCategory: Category | null;
  selectedSubcategory: Category | null;
  onBackToCategories: () => void;
  onBackToParentCategory?: () => void;
  className?: string;
}

export function MenuBreadcrumb({
  parentCategory,
  selectedSubcategory,
  onBackToCategories,
  onBackToParentCategory,
  className = ''
}: MenuBreadcrumbProps) {
  
  return (
    <div className={`flex items-center py-2 px-4 bg-black/20 border-b border-white/10 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBackToCategories}
        className="text-gray-400 hover:text-white hover:bg-white/5 mr-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Categories
      </Button>
      
      {parentCategory && (
        <>
          <ChevronRight className="h-3 w-3 text-gray-500 mx-1" />
          {selectedSubcategory && onBackToParentCategory ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToParentCategory}
              className="text-gray-300 hover:text-white hover:bg-white/5 mr-2"
            >
              {parentCategory.name}
            </Button>
          ) : (
            <span className="text-white font-medium">{parentCategory.name}</span>
          )}
        </>
      )}
      
      {selectedSubcategory && (
        <>
          <ChevronRight className="h-3 w-3 text-gray-500 mx-1" />
          <span className="text-purple-300 font-medium">{selectedSubcategory.name}</span>
        </>
      )}
    </div>
  );
}