import React, { useEffect, useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { MenuItem, OrderItem } from 'utils/menuTypes';
import { QSAITheme } from 'utils/QSAIDesign';
import { colors as designColors } from 'utils/designSystem';
import { POSMenuCard } from 'components/POSMenuCard';
import { PremiumMenuCard } from 'components/PremiumMenuCard';
import { POSMenuCardSkeleton } from 'components/POSMenuCardSkeleton';
import { 
  groupItemsByHierarchy, 
  groupItemsBySection, 
  getDisplayMode,
  getSectionDisplayName,
  type MenuSection,
  type MenuCategoryGroup
} from 'utils/menuHelpers';

interface Props {
  onAddToOrder: (orderItem: OrderItem) => void;
  onCustomizeItem?: (orderItem: OrderItem) => void;
  onCategoryChange: (categoryId: string | null) => void;
  className?: string;
  showSkeletons?: boolean;
  orderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
}

export function POSMenuSelector({
  onAddToOrder,
  onCustomizeItem,
  onCategoryChange,
  className,
  showSkeletons = false,
  orderType = 'COLLECTION'
}: Props) {
  const {
    categories,
    filteredMenuItems,
    menuItems,
    isLoading,
    selectedMenuCategory,
    itemVariants,
    proteinTypes
  } = useRealtimeMenuStore();
  
  // View mode state (persisted to localStorage)
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('posMenuViewMode') as 'card' | 'list') || 'card';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ✅ NEW: Enhanced bundle strategy - determine what to show
  const shouldShowSkeletons = showSkeletons; // Show skeletons during initial load phase
  const hasRealData = filteredMenuItems.length > 0;
  
  // ✅ NEW: Determine display mode
  const displayMode = getDisplayMode(selectedMenuCategory);
  
  console.log('🚀 [POSMenuSelector] Render state:', {
    selectedMenuCategory,
    displayMode,
    showSkeletons,
    shouldShowSkeletons,
    hasRealData,
    menuItemsCount: filteredMenuItems.length,
    totalMenuItems: menuItems.length,
    isLoading,
    items: filteredMenuItems.map(i => ({ name: i.name, category_id: i.category_id }))
  });
  
  // Save view mode preference
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('posMenuViewMode', mode);
  };

  // ✅ NEW: Render hierarchical structure based on display mode
  const renderMenuContent = () => {
    if (shouldShowSkeletons) {
      // Show skeleton cards during initial load
      return (
        <div className={viewMode === 'card' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1" 
          : "space-y-2 p-1"
        }>
          {Array.from({ length: 8 }, (_, index) => (
            <POSMenuCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
          ))}
        </div>
      );
    }

    if (filteredMenuItems.length === 0 && !isLoading) {
      return (
        <div className="text-center py-8">
          <div className="w-12 h-12 text-gray-400 mx-auto mb-4">🍽️</div>
          <p className="text-gray-400">No items in this category</p>
        </div>
      );
    }

    // MODE 1: All Items - Full hierarchy (Section → Category → Items)
    if (displayMode === 'all') {
      const hierarchicalMenu = groupItemsByHierarchy(filteredMenuItems, categories);
      
      return (
        <div className="space-y-8 p-1">
          {hierarchicalMenu.sections.map((section) => (
            <div key={section.id} className="space-y-4">
              {/* Section Heading - Gradient Text with Underline */}
              <div className="pb-2">
                <h2 
                  className="text-xl font-bold tracking-wide text-left"
                  style={{
                    backgroundImage: `linear-gradient(135deg, white 30%, ${designColors.brand.purple} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textTransform: 'uppercase',
                    display: 'inline-block'
                  }}
                >
                  {section.displayName}
                </h2>
                {/* Gradient Underline */}
                <div 
                  className="w-24 h-1 rounded-full mt-2"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${designColors.brand.purple}, transparent)`
                  }}
                />
              </div>
              
              {/* Categories within Section */}
              {section.categories.map((category) => (
                <div key={category.id} className="space-y-3">
                  {/* Category Subheading - LEFT ALIGNED with INDENTATION */}
                  <h3 
                    className="text-lg font-semibold pl-6"
                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    {category.name}
                  </h3>
                  
                  {/* Items Grid */}
                  <div className={viewMode === 'card' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "space-y-2"
                  }>
                    {category.items.map((menuItem) => (
                      <PremiumMenuCard
                        key={menuItem.id}
                        item={menuItem}
                        onSelect={() => {}}
                        onAddToOrder={onAddToOrder}
                        onCustomizeItem={onCustomizeItem}
                        itemVariants={itemVariants}
                        proteinTypes={proteinTypes}
                        viewMode={viewMode}
                        orderType={orderType}
                        theme="pos"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    // MODE 2: Section Selected - Categories as subheadings
    if (displayMode === 'section' && selectedMenuCategory) {
      const categoryGroups = groupItemsBySection(
        filteredMenuItems, 
        categories, 
        selectedMenuCategory
      );
      
      const sectionName = getSectionDisplayName(selectedMenuCategory);
      
      return (
        <div className="space-y-4 p-1">
          {/* Section Heading - LEFT ALIGNED with PURPLE BORDER */}
          <div 
            className="border-l-4 pl-3 pb-2"
            style={{ borderColor: QSAITheme.purple.light }}
          >
            <h2 
              className="text-xl font-bold tracking-wide uppercase text-left"
              style={{ color: QSAITheme.purple.light }}
            >
              {sectionName}
            </h2>
          </div>
          
          {/* Categories within Section */}
          {categoryGroups.map((category) => (
            <div key={category.id} className="space-y-3">
              {/* Category Subheading - LEFT ALIGNED with INDENTATION */}
              <h3 
                className="text-lg font-semibold pl-6"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                {category.name}
              </h3>
              
              {/* Items Grid */}
              <div className={viewMode === 'card' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-2"
              }>
                {category.items.map((menuItem) => (
                  <PremiumMenuCard
                    key={menuItem.id}
                    item={menuItem}
                    onSelect={() => {}}
                    onAddToOrder={onAddToOrder}
                    onCustomizeItem={onCustomizeItem}
                    itemVariants={itemVariants}
                    proteinTypes={proteinTypes}
                    viewMode={viewMode}
                    orderType={orderType}
                    theme="pos"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // MODE 3: Category Selected - Items only with category heading
    if (displayMode === 'category' && selectedMenuCategory) {
      const selectedCategoryObj = categories.find(cat => cat.id === selectedMenuCategory);
      const categoryName = selectedCategoryObj?.name || 'Menu Items';
      
      return (
        <div className="space-y-4 p-1">
          {/* Category Heading */}
          <div 
            className="flex items-center gap-3 pb-2 border-b"
            style={{ borderColor: 'rgba(124, 93, 250, 0.2)' }}
          >
            <h2 
              className="text-xl font-bold tracking-wide"
              style={{ color: QSAITheme.purple.light }}
            >
              {categoryName.toUpperCase()}
            </h2>
            <div className="flex-1 h-px" style={{ background: 'rgba(124, 93, 250, 0.1)' }} />
          </div>
          
          {/* Items Grid */}
          <div className={viewMode === 'card' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-2"
          }>
            {filteredMenuItems.map((menuItem) => (
              <PremiumMenuCard
                key={menuItem.id}
                item={menuItem}
                onSelect={() => {}}
                onAddToOrder={onAddToOrder}
                onCustomizeItem={onCustomizeItem}
                itemVariants={itemVariants}
                proteinTypes={proteinTypes}
                viewMode={viewMode}
                orderType={orderType}
                theme="pos"
              />
            ))}
          </div>
        </div>
      );
    }

    // Fallback: flat list (should not reach here)
    return (
      <div className={viewMode === 'card' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1" 
        : "space-y-2 p-1"
      }>
        {filteredMenuItems.map((menuItem) => (
          <PremiumMenuCard
            key={menuItem.id}
            item={menuItem}
            onSelect={() => {}}
            onAddToOrder={onAddToOrder}
            onCustomizeItem={onCustomizeItem}
            itemVariants={itemVariants}
            proteinTypes={proteinTypes}
            viewMode={viewMode}
            orderType={orderType}
            theme="pos"
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden ${className || ''}`}>
      {/* Header with view toggle only */}
      <div className="flex items-center justify-end mb-4">
        {/* View Toggle */}
        <div className="flex items-center bg-[#1A1A1A] rounded-lg border border-[rgba(124,93,250,0.2)] overflow-hidden">
          <button
            onClick={() => handleViewModeChange('list')}
            className={`px-3 py-2 flex items-center gap-2 text-sm transition-all duration-200 ${
              viewMode === 'list'
                ? 'text-white'
                : 'text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]'
            }`}
            style={{
              backgroundColor: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent'
            }}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => handleViewModeChange('card')}
            className={`px-3 py-2 flex items-center gap-2 text-sm transition-all duration-200 ${
              viewMode === 'card'
                ? 'text-white'
                : 'text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]'
            }`}
            style={{
              backgroundColor: viewMode === 'card' ? QSAITheme.purple.primary : 'transparent'
            }}
          >
            <LayoutGrid className="w-4 h-4" />
            Card View
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {renderMenuContent()}
        </ScrollArea>
      </div>
    </div>
  );
}

export default POSMenuSelector;
