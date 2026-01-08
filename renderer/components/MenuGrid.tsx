import React, { memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, ItemVariant, ProteinType } from 'utils/menuTypes';
import { OnlineMenuCard } from './OnlineMenuCard';
import { PremiumTheme } from '../utils/premiumTheme';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, Search } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface MenuGridProps {
  menuItems: MenuItem[];
  onItemSelect: (item: MenuItem, variant?: ItemVariant) => void;
  mode?: 'delivery' | 'collection';
  isLoading?: boolean;
  searchQuery?: string;
  selectedCategory?: string | null;
  className?: string;
  itemVariants?: ItemVariant[];
  proteinTypes?: ProteinType[];
  galleryCompact?: boolean;
}

// 🔴 CRITICAL: Memoize the entire MenuGrid component to prevent infinite re-renders
const MenuGrid = memo<MenuGridProps>(({ 
  menuItems, 
  onItemSelect, 
  mode = 'collection', 
  isLoading = false, 
  searchQuery = '', 
  selectedCategory = '', 
  className = '', 
  itemVariants = [], 
  proteinTypes = [], 
  galleryCompact = false 
}) => {
  // Ref for the scrollable container
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate grid columns based on screen size (default to 4 for desktop)
  // This should match the Tailwind grid classes: md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 768) return 1; // mobile
    if (width < 1024) return 2; // tablet
    if (width < 1280) return 3; // desktop
    return 4; // xl
  };
  
  const columnCount = getColumnCount();
  
  // Virtual rows (each row contains columnCount items)
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(menuItems.length / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 380, // Estimated height per row (card height ~350px + gap)
    overscan: 2, // Render 2 extra rows above/below viewport
  });

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading menu items...</p>
        </div>
      </div>
    );
  }

  // If no items available
  if (!menuItems || menuItems.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">No menu items available</p>
          <p className="text-gray-500 text-sm">Please check back later or contact the restaurant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 🎯 PERFORMANCE OPTIMIZATION: Simplified animations */}
      {/* Removed per-card motion.div wrappers and stagger delays to reduce overhead */}
      {/* Only animate container for smoother category transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory || 'all-items'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {menuItems.map((item) => (
            <OnlineMenuCard
              key={item.id}
              item={item}
              onSelect={onItemSelect}
              mode={mode}
              itemVariants={itemVariants}
              proteinTypes={proteinTypes}
              searchQuery={searchQuery}
              galleryCompact={galleryCompact}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Stats Footer */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Showing {menuItems.length} item{menuItems.length !== 1 ? 's' : ''}</span>
          {searchQuery && (
            <span>Search: "{searchQuery}"</span>
          )}
          {selectedCategory && (
            <span>Category: {selectedCategory}</span>
          )}
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
MenuGrid.displayName = 'MenuGrid';

export { MenuGrid };
export default MenuGrid; // 🔴 CRITICAL: Export as default for memoization
