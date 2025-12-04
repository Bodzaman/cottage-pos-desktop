import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Removed ScrollArea to avoid nested scroll; the shell column provides scrolling
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import { MenuItem, OrderItem } from 'types';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { QSAITheme } from '../utils/QSAIDesign';
import { POSMenuItemCard } from './POSMenuItemCard';
import { PremiumMenuCard } from './PremiumMenuCard';
import { shallow } from 'zustand/shallow';

interface Props {
  selectedCategory: string | null;
  onAddToOrder: (item: any) => void;
  className?: string;
}

/**
 * Enhanced menu item grid component optimized for dine-in modal middle panel
 * Now matches main POS interface with List/Card view toggle and POSMenuCard integration
 * Uses store's filteredMenuItems for consistent filtering with POSMenuSelector
 */
export function DineInMenuGrid({
  selectedCategory,
  onAddToOrder,
  className
}: Props) {
  // ✅ USE STORE'S FILTERED ITEMS: Matches POSMenuSelector pattern
  const { filteredMenuItems, isLoading, itemVariants, proteinTypes } = useRealtimeMenuStore(
    (state) => ({
      filteredMenuItems: state.filteredMenuItems,
      isLoading: state.isLoading,
      itemVariants: state.itemVariants,
      proteinTypes: state.proteinTypes
    }),
    shallow
  );
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ✅ NO MANUAL FILTERING: Store handles parent/child category logic
  const sortedItems = filteredMenuItems
    .sort((a, b) => {
      const aOrder = a.display_order || 999;
      const bOrder = b.display_order || 999;
      return aOrder - bOrder;
    });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full min-w-0', className)}>
        <div style={{ color: QSAITheme.text.secondary }}>Loading menu items...</div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-center p-8 min-w-0', className)}>
        <div className="mb-2" style={{ color: QSAITheme.text.secondary }}>No items available</div>
        <div className="text-sm" style={{ color: QSAITheme.text.muted }}>
          {selectedCategory ? 'No items in this category' : 'Select a category to view items'}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full min-w-0', className)}>
      {/* Header with View Toggle */}
      <div 
        className="p-4 border-b flex-shrink-0"
        style={{ borderColor: QSAITheme.border.medium }}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>Menu Items</h3>
            <p className="text-xs mt-1" style={{ color: QSAITheme.text.secondary }}>
              {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          {/* View Mode Toggle - Matching EnhancedMenuGrid */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              style={{
                backgroundColor: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent',
                borderColor: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent'
              }}
              className={viewMode === 'list' ? 'text-white hover:opacity-90' : ''}
            >
              <div className="space-y-1 h-4 w-4">
                <div className="bg-current h-1 rounded" />
                <div className="bg-current h-1 rounded" />
                <div className="bg-current h-1 rounded" />
              </div>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              style={{
                backgroundColor: viewMode === 'grid' ? QSAITheme.purple.primary : 'transparent',
                borderColor: viewMode === 'grid' ? QSAITheme.purple.primary : 'transparent'
              }}
              className={viewMode === 'grid' ? 'text-white hover:opacity-90' : ''}
            >
              <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
                <div className="bg-current rounded-sm" />
              </div>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Menu Items - rely on parent column for scrolling */}
      <div className="flex-1 min-w-0">
        <div className="p-4 min-w-0">
          {viewMode === 'grid' ? (
            /* Grid View using POSMenuItemCard to match main POS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
              <AnimatePresence>
                {sortedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group w-full max-w-full min-w-0"
                  >
                    <POSMenuItemCard
                      item={item}
                      onAddToOrder={onAddToOrder}
                      orderType="DINE-IN"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* List View using PremiumMenuCard */
            <div className="space-y-4 min-w-0">
              <AnimatePresence>
                {sortedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="w-full max-w-full min-w-0"
                  >
                    <PremiumMenuCard
                      item={item}
                      onSelect={() => {}}
                      onAddToOrder={onAddToOrder}
                      itemVariants={itemVariants}
                      proteinTypes={proteinTypes}
                      viewMode="list"
                      orderType="DINE-IN"
                      theme="pos"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DineInMenuGrid;
