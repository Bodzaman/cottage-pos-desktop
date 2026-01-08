


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Utensils, 
  Star,
  Grid3X3,
  RefreshCw,
  X,
  Package
} from 'lucide-react';
import { Category, MenuItem } from '../utils/menuTypes';
import { QSAITheme, styles } from '../utils/QSAIDesign';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';

interface EnhancedMenuCategoriesProps {
  categories: Category[];
  menuItems: MenuItem[];
  selectedParentCategory: string | null;
  onParentCategorySelect: (parentCategoryId: string) => void;
  onShowAllItems: () => void;
  className?: string;
  setMealsCount?: number; // Number of active set meals
  onSetMealsSelect?: () => void; // Callback when Set Meals category is selected
  isSetMealsSelected?: boolean; // Whether Set Meals category is currently selected
}

export function EnhancedMenuCategories({
  categories,
  menuItems,
  selectedParentCategory,
  onParentCategorySelect,
  onShowAllItems,
  className = '',
  setMealsCount = 0,
  onSetMealsSelect,
  isSetMealsSelected = false
}: EnhancedMenuCategoriesProps) {
  const realtimeMenuStore = useRealtimeMenuStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // No longer need expanded categories or search focus state for parent-only view

  // Get parent categories (categories with no parent) and sort by display_order
  const parentCategories = categories
    .filter(cat => !cat.parent_category_id && cat.active)
    .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));

  // Count items in parent category (including children)
  const getParentCategoryItemCount = (parentId: string) => {
    const childCategories = categories.filter(cat => cat.parent_category_id === parentId && cat.active);
    const childCategoryIds = childCategories.map(cat => cat.id);
    return menuItems.filter(item => 
      (item.category_id === parentId || childCategoryIds.includes(item.category_id)) && 
      item.active
    ).length;
  };

  // Handle refresh data
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await realtimeMenuStore.refreshData();
    } catch (error) {
      console.error('Failed to refresh menu data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div 
      className={`h-full flex flex-col ${className}`}
      style={{
        background: QSAITheme.background.panel,
        borderRight: `1px solid ${QSAITheme.border.light}`
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-2 mb-4">
          <Utensils className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Search has been moved to POS header */}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start text-left transition-all duration-200 ${
            !selectedParentCategory && !isSetMealsSelected
              ? 'bg-purple-600/20 text-purple-300 border-purple-400/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          onClick={onShowAllItems}
        >
          <Grid3X3 className="h-4 w-4 mr-3" />
          <span className="flex-1">All Categories</span>
          <Badge variant="secondary" className="ml-2 bg-white/10 text-white">
            {menuItems.filter(item => item.active).length}
          </Badge>
        </Button>
        
        {/* Set Meals Category */}
        {onSetMealsSelect && (
          <Button
            variant="ghost"
            className={`w-full justify-start text-left transition-all duration-200 ${
              isSetMealsSelected
                ? 'bg-purple-600/30 text-purple-300 border-purple-400/50'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
            onClick={onSetMealsSelect}
          >
            <Package className="h-4 w-4 mr-3" />
            <span className="flex-1">Set Meals</span>
            <Badge variant="secondary" className="ml-2 bg-white/10 text-white">
              {setMealsCount}
            </Badge>
          </Button>
        )}
      </div>

      {/* Parent Categories List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <AnimatePresence>
            {parentCategories.map((parentCategory) => {
              const isSelected = selectedParentCategory === parentCategory.id;
              const itemCount = getParentCategoryItemCount(parentCategory.id);

              return (
                <motion.div
                  key={parentCategory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1"
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-left transition-all duration-200 ${
                      isSelected
                        ? 'bg-purple-600/30 text-purple-300 border-purple-400/50'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => onParentCategorySelect(parentCategory.id)}
                  >
                    <span className="flex-1 font-medium">{parentCategory.name}</span>
                    <Badge variant="secondary" className="ml-2 bg-white/10 text-white text-xs">
                      {itemCount}
                    </Badge>
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-400 text-center">
          {parentCategories.length} main categories • {menuItems.filter(item => item.active).length} items
        </div>
      </div>
    </div>
  );
}
