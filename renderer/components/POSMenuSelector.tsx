import React, { useEffect, useState, useRef, useCallback } from 'react';
import { List, LayoutGrid, Grid3x3, SearchX } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { POSMenuSearch } from './POSMenuSearch';
import { PremiumMenuCard } from './PremiumMenuCard';
import { POSMenuItemCard } from './POSMenuItemCard';
import { POSSectionPills } from './POSSectionPills';
import { POSCategoryPills } from './POSCategoryPills';
import { POSMenuCardSkeleton } from './POSMenuCardSkeleton';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { groupItemsByHierarchy, getSectionDisplayName, getDisplayMode, groupItemsBySection } from 'utils/menuHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { QSAITheme } from '../utils/QSAIDesign';
import type { MenuItem, OrderItem } from 'utils/menuTypes';
import { shallow } from 'zustand/shallow';

interface Props {
  onAddToOrder: (orderItem: OrderItem) => void;
  onCustomizeItem?: (orderItem: OrderItem) => void;
  onCategoryChange: (categoryId: string | null) => void;
  className?: string;
  showSkeletons?: boolean;
  orderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  selectedSectionId?: string | null;
  onSectionSelect?: (sectionId: string | null) => void;
  childCategories?: any[];
  selectedCategoryId?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
  variantCarouselEnabled?: boolean; // NEW: POS Settings toggle
}

export function POSMenuSelector({
  onAddToOrder,
  onCustomizeItem,
  onCategoryChange,
  className,
  showSkeletons = false,
  orderType = 'COLLECTION',
  selectedSectionId,
  onSectionSelect,
  childCategories,
  selectedCategoryId,
  onCategorySelect,
  variantCarouselEnabled = true // NEW: POS Settings toggle
}: Props) {
  // 🚀 SELECTIVE SUBSCRIPTIONS: Subscribe to specific fields only to prevent unnecessary re-renders
  const categories = useRealtimeMenuStore(state => state.categories, shallow);
  const filteredMenuItems = useRealtimeMenuStore(state => state.filteredMenuItems, shallow);
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const isLoading = useRealtimeMenuStore(state => state.isLoading);
  const selectedMenuCategory = useRealtimeMenuStore(state => state.selectedMenuCategory);
  const itemVariants = useRealtimeMenuStore(state => state.itemVariants, shallow);
  const proteinTypes = useRealtimeMenuStore(state => state.proteinTypes, shallow);
  
  // View mode state (persisted to localStorage)
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('posMenuViewMode') as 'card' | 'list') || 'card';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // ✅ Section visibility tracking for header updates
  const [currentVisibleSection, setCurrentVisibleSection] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Callback ref to capture the ScrollArea viewport element
  const captureViewport = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Radix ScrollArea renders viewport as a child element
      const viewport = node.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      viewportRef.current = viewport;
    }
  }, []);

  // ✅ NEW: Enhanced bundle strategy - determine what to show
  const shouldShowSkeletons = showSkeletons; // Show skeletons during initial load phase
  const hasRealData = filteredMenuItems.length > 0;
  
  // ✅ NEW: Determine display mode
  const displayMode = getDisplayMode(selectedMenuCategory);
  
  // Save view mode preference
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('posMenuViewMode', mode);
  };

  // ✅ INTERSECTION OBSERVER: Track which section is most visible
  // - Only active in 'all' display mode
  // - Uses viewport element as root for accurate visibility detection
  // - Finds section with largest visible area
  // - More reliable than scroll events
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    // Only track in 'all' mode when we have menu items
    if (displayMode !== 'all' || filteredMenuItems.length === 0) {
      setCurrentVisibleSection(null);
      return;
    }

    // We need the viewport element from Radix ScrollArea
    if (!viewportRef.current) {
      return;
    }

    // Track intersection entries to find most visible section
    const intersectionMap = new Map<string, IntersectionObserverEntry>();

    const updateMostVisibleSection = () => {
      let maxVisibleArea = 0;
      let mostVisible: string | null = null;

      intersectionMap.forEach((entry, sectionName) => {
        if (entry.isIntersecting) {
          const visibleArea = entry.intersectionRatio * entry.boundingClientRect.height;
          if (visibleArea > maxVisibleArea) {
            maxVisibleArea = visibleArea;
            mostVisible = sectionName;
          }
        }
      });

      if (mostVisible && mostVisible !== currentVisibleSection) {
        setCurrentVisibleSection(mostVisible);
      }
    };

    // Create IntersectionObserver with viewport as root
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionName = entry.target.getAttribute('data-section-name');
          if (sectionName) {
            intersectionMap.set(sectionName, entry);
          }
        });
        updateMostVisibleSection();
      },
      {
        root: viewportRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1.0], // Multiple thresholds for smooth tracking
        rootMargin: '-100px 0px -50px 0px' // Account for header
      }
    );

    // Observe each section element
    sectionRefs.current.forEach((element, sectionName) => {
      observer.observe(element);
    });

    // Cleanup
    return () => {
      observer.disconnect();
      intersectionMap.clear();
    };
  }, [displayMode, filteredMenuItems.length, currentVisibleSection]);

  // ✅ NEW: Calculate header text based on display mode
  const getHeaderText = (): string | null => {
    // MODE 1: All Items - use visible section from IntersectionObserver
    if (displayMode === 'all') {
      // Use currently visible section if available
      if (currentVisibleSection) {
        return currentVisibleSection;
      }
      // Fallback: Try to get first section name, otherwise show "ALL ITEMS"
      if (filteredMenuItems.length > 0) {
        const hierarchicalMenu = groupItemsByHierarchy(filteredMenuItems, categories);
        const firstSection = hierarchicalMenu.sections[0];
        return firstSection?.displayName || 'ALL ITEMS';
      }
      return 'ALL ITEMS';
    }
    
    // MODE 2: Section Selected
    if (displayMode === 'section' && selectedMenuCategory) {
      return getSectionDisplayName(selectedMenuCategory);
    }
    
    // MODE 3: Category Selected
    if (displayMode === 'category' && selectedMenuCategory) {
      const category = categories.find(cat => cat.id === selectedMenuCategory);
      return category?.name || null;
    }
    
    return null;
  };

  // ✅ NEW: Build breadcrumb path for header
  const getBreadcrumbPath = (): string[] => {
    const path: string[] = ['Menu Items'];
    
    if (!selectedMenuCategory) {
      return path;
    }
    
    // If a category is selected, build the full path
    if (displayMode === 'category') {
      const category = categories.find(cat => cat.id === selectedMenuCategory);
      if (category) {
        // Find parent section
        if (category.parent_category_id?.startsWith('section-')) {
          const sectionName = getSectionDisplayName(category.parent_category_id);
          path.push(sectionName);
        }
        path.push(category.name);
      }
    } else if (displayMode === 'section') {
      // Just section selected
      const sectionName = getSectionDisplayName(selectedMenuCategory);
      path.push(sectionName);
    }
    
    return path;
  };

  // ✅ Gradient style constants for consistency
  const gradientTextStyle = {
    backgroundImage: "linear-gradient(135deg, white 30%, " + QSAITheme.purple.light + " 100%)",
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };
  
  const gradientUnderlineStyle = {
    background: 'linear-gradient(90deg, rgba(124, 93, 250, 0.8) 0%, rgba(124, 93, 250, 0) 100%)'
  };

  // ✅ NEW: Render hierarchical structure based on display mode
  const renderMenuContent = () => {
    if (shouldShowSkeletons) {
      // Show skeleton cards during initial load
      return (
        <div className={viewMode === 'card' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1" 
          : "space-y-2 p-1"
        }>
          {Array.from({ length: 8 }, (_, index) => (
            <POSMenuCardSkeleton key={"skeleton-" + index} viewMode={viewMode} />
          ))}
        </div>
      );
    }

    if (filteredMenuItems.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <SearchX 
            size={64} 
            className="mb-4" 
            style={{ 
              color: 'rgba(124, 58, 237, 0.3)',
              strokeWidth: 1.5 
            }} 
          />
          <p 
            className="text-lg font-medium mb-2"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            No items in this category
          </p>
          <p 
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            Try selecting a different category or clearing your search
          </p>
        </div>
      );
    }

    // MODE 1: All Items - Full hierarchy (Section → Category → Items)
    if (displayMode === 'all') {
      const hierarchicalMenu = groupItemsByHierarchy(filteredMenuItems, categories);

      return (
        <div className="space-y-8">
          {hierarchicalMenu.sections.map((section) => (
            <div 
              key={section.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(section.displayName, el);
                else sectionRefs.current.delete(section.displayName);
              }}
              data-section-name={section.displayName}
            >
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
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                    : "space-y-2"
                  }>
                    {category.items.map((menuItem) => (
                      viewMode === 'card' ? (
                        <POSMenuItemCard
                          key={menuItem.id}
                          item={menuItem}
                          onAddToOrder={onAddToOrder}
                          onCustomizeItem={onCustomizeItem}
                          orderType={orderType}
                          variantCarouselEnabled={variantCarouselEnabled}
                        />
                      ) : (
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
                          variantCarouselEnabled={variantCarouselEnabled}
                        />
                      )
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
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-2"
              }>
                {category.items.map((menuItem) => (
                  viewMode === 'card' ? (
                    <POSMenuItemCard
                      key={menuItem.id}
                      item={menuItem}
                      onAddToOrder={onAddToOrder}
                      onCustomizeItem={onCustomizeItem}
                      orderType={orderType}
                      variantCarouselEnabled={variantCarouselEnabled}
                    />
                  ) : (
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
                      variantCarouselEnabled={variantCarouselEnabled}
                    />
                  )
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
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "space-y-2"
          }>
            {filteredMenuItems.map((menuItem) => (
              viewMode === 'card' ? (
                <POSMenuItemCard
                  key={menuItem.id}
                  item={menuItem}
                  onAddToOrder={onAddToOrder}
                  onCustomizeItem={onCustomizeItem}
                  orderType={orderType}
                  variantCarouselEnabled={variantCarouselEnabled}
                />
              ) : (
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
                  variantCarouselEnabled={variantCarouselEnabled}
                />
              )
            ))}
          </div>
        </div>
      );
    }

    // Fallback: flat list (should not reach here)
    return (
      <div className={viewMode === 'card' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1" 
        : "space-y-2 p-1"
      }>
        {filteredMenuItems.map((menuItem) => (
          viewMode === 'card' ? (
            <POSMenuItemCard
              key={menuItem.id}
              item={menuItem}
              onAddToOrder={onAddToOrder}
              onCustomizeItem={onCustomizeItem}
              orderType={orderType}
              variantCarouselEnabled={variantCarouselEnabled}
            />
          ) : (
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
              variantCarouselEnabled={variantCarouselEnabled}
            />
          )
        ))}
      </div>
    );
  };

  return (
    <div className={"h-full flex flex-col overflow-hidden " + className || ''}>
      {/* HEADER ROW: Breadcrumb Path (Left) | Toggle Buttons (Center) | Search Bar (Right) */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* LEFT: Breadcrumb Path */}
        {(() => {
          const breadcrumbPath = getBreadcrumbPath();
          
          return (
            <div className="flex items-center gap-2">
              {breadcrumbPath.map((segment, index) => (
                <React.Fragment key={index}>
                  <span 
                    className={index === breadcrumbPath.length - 1 ? "text-lg font-bold" : "text-sm"}
                    style={{
                      color: index === breadcrumbPath.length - 1 
                        ? QSAITheme.purple.light 
                        : 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    {segment}
                  </span>
                  {index < breadcrumbPath.length - 1 && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        })()}

        {/* Spacer for flex layout */}
        <div className="flex-1" />
        
        {/* CENTER: View Toggle Buttons */}
        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-purple-500/20">
          <button
            onClick={() => handleViewModeChange('list')}
            className={"px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 " + 
              viewMode === 'list'
                ? 'text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
            style={{
              backgroundColor: viewMode === 'list' ? QSAITheme.purple.primary : 'transparent',
              boxShadow: viewMode === 'list' ? "0 0 20px " + QSAITheme.purple.primary + "40" : 'none'
            }}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => handleViewModeChange('card')}
            className={"px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 " + 
              viewMode === 'card'
                ? 'text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
            style={{
              backgroundColor: viewMode === 'card' ? QSAITheme.purple.primary : 'transparent',
              boxShadow: viewMode === 'card' ? "0 0 20px " + QSAITheme.purple.primary + "40" : 'none'
            }}
          >
            <Grid3x3 className="w-4 h-4" />
            Card View
          </button>
        </div>

        {/* RIGHT: Search Bar */}
        <POSMenuSearch />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={captureViewport}>
          {renderMenuContent()}
        </ScrollArea>
      </div>
    </div>
  );
}

export default POSMenuSelector;
