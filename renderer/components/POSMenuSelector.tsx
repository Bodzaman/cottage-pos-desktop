import React, { useEffect, useState } from 'react';
import { ChevronRight, Search, RefreshCw, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { Category, MenuItem, OrderItem } from 'utils/menuTypes';
import { QSAITheme } from 'utils/QSAIDesign';
import { CategorySidebar } from 'components/CategorySidebar';
import { POSMenuCard } from 'components/POSMenuCard';
import { POSMenuCardSkeleton } from 'components/POSMenuCardSkeleton';
import { toast } from 'sonner';

interface Props {
  onItemSelect?: (item: MenuItem, optionIndex?: number) => void;
  onAddToOrder?: (orderItem: OrderItem) => void;
  className?: string;
  overrideMenuItems?: MenuItem[];
  orderMode?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  onCustomizeItem?: (item: OrderItem) => void;
  // ✅ NEW: Enhanced bundle strategy props
  showSkeletons?: boolean;
  preloadedImages?: {
    isImageReady: (url: string) => boolean;
    getImageStatus: (url: string) => any;
  };
}

export function POSMenuSelector({ 
  onItemSelect, 
  onAddToOrder, 
  className, 
  overrideMenuItems, 
  orderMode = "COLLECTION", 
  onCustomizeItem,
  // ✅ NEW: Enhanced bundle strategy props
  showSkeletons = false,
  preloadedImages
}: Props) {
  const {
    categories,
    filteredMenuItems,
    selectedMenuCategory,
    setSelectedMenuCategory,
    selectedParentCategory,
    setSelectedParentCategory,
    searchQuery,
    setSearchQuery,
    isLoading,
    forceFullRefresh
  } = useRealtimeMenuStore();
  
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    const saved = localStorage.getItem('posMenuViewMode');
    return (saved as 'card' | 'list') || 'card';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ✅ NEW: Enhanced bundle strategy - determine what to show
  const shouldShowSkeletons = showSkeletons; // Show skeletons during initial load phase
  const hasRealData = filteredMenuItems.length > 0;
  
  console.log('🚀 [POSMenuSelector] Render state:', {
    showSkeletons,
    shouldShowSkeletons,
    hasRealData,
    menuItemsCount: filteredMenuItems.length,
    isLoading
  });
  
  // Save view mode preference
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('posMenuViewMode', mode);
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered from POS');
      await forceFullRefresh();
      toast.success('Menu data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing menu data:', error);
      toast.error('Failed to refresh menu data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Create a handler that works with both legacy and new interfaces
  const handleCardItemSelect = (orderItem: OrderItem) => {
    // If we have the new onAddToOrder prop, use it directly
    if (onAddToOrder) {
      onAddToOrder(orderItem);
      return;
    }
    
    // Otherwise, fall back to the legacy onItemSelect interface
    if (onItemSelect) {
      // Find the original menu item
      const originalItem = filteredMenuItems.find(item => item.id === orderItem.menu_item_id);
      if (!originalItem) return;
      
      // Find the variant index (simplified for now)
      onItemSelect(originalItem, 0);
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedMenuCategory(categoryId);
    if (categoryId !== null) {
      setSelectedParentCategory(null);
    }
    setSearchQuery(''); // Clear search when selecting category
  };

  // Handle parent category selection
  const handleParentCategorySelect = (parentCategoryId: string) => {
    if (parentCategoryId) {
      setSelectedParentCategory(parentCategoryId);
      setSelectedMenuCategory(null); // Clear child category selection
    } else {
      setSelectedParentCategory(null);
      setSelectedMenuCategory(null);
    }
    setSearchQuery(''); // Clear search when selecting parent category
  };

  return (
    <div className={`h-full flex flex-col overflow-hidden ${className || ''}`}>
      {/* Header with search bar and view toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu items..."
              className="pl-10 w-64"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
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
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className={viewMode === 'card' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1" 
            : "space-y-2 p-1"
          }>
            {/* ✅ NEW: Conditional rendering based on skeleton state */}
            {shouldShowSkeletons ? (
              // Show skeleton cards during initial load
              Array.from({ length: 8 }, (_, index) => (
                <POSMenuCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
              ))
            ) : (
              // Show real menu items
              filteredMenuItems.map((item) => (
                <POSMenuCard
                  key={item.id}
                  item={item}
                  onAddToOrder={handleCardItemSelect}
                  orderType={orderMode}
                  viewMode={viewMode}
                  onCustomizeItem={onCustomizeItem}
                  // ✅ NEW: Pass preloaded image functions
                  preloadedImages={preloadedImages}
                />
              ))
            )}
          </div>

          {/* No Results Message - only show when not loading skeletons */}
          {!shouldShowSkeletons && filteredMenuItems.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 text-gray-400 mx-auto mb-4">🍽️</div>
              <p className="text-gray-400">
                {searchQuery 
                  ? `No items found for "${searchQuery}"` 
                  : 'No items in this category'
                }
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

export default POSMenuSelector;
