import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { X, Filter, FolderTree, Search, Settings } from 'lucide-react';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { MenuSection } from 'utils/mediaHierarchyUtils';
import { AssetTypeFilter } from 'components/AssetTypeFilter';
import { ImageTypeFilter } from 'components/ImageTypeFilter';
import { HierarchyFilter } from 'components/HierarchyFilter';
import { StatusFilter } from 'components/StatusFilter';
import { MenuItemFilter } from 'components/MenuItemFilter';
// TEMPORARILY COMMENTED FOR DEBUGGING
// import { FilterPresetsPanel } from 'components/FilterPresetsPanel';

interface MediaFilterSidebarProps {
  /** Menu sections for hierarchy filter */
  sections: MenuSection[];
  /** Asset counts for each type */
  assetCounts: {
    menuImages: number;
    aiAvatars: number;
    general: number;
    total: number;
  };
  /** Callback to trigger gallery refresh after filter change */
  onFilterChange: () => void;
  /** Ref to menu item search button for keyboard shortcuts */
  menuItemSearchRef?: React.RefObject<HTMLButtonElement>;
  /** Control preset panel expansion */
  presetPanelExpanded?: boolean;
  /** Callback when preset panel expansion changes */
  onPresetPanelExpandedChange?: (expanded: boolean) => void;
}

/**
 * MediaFilterSidebar - Unified filter panel for Media Library
 * 
 * Phase 1 MVP: Container with placeholders for filter components
 * 
 * Features:
 * - Fixed 280px width sidebar
 * - Sticky "Filters" header
 * - Scrollable filter sections
 * - Active filter count badge
 * - "Clear All Filters" button
 * 
 * Child components (to be added):
 * - AssetTypeFilter (Step 3)
 * - HierarchyFilter (Step 4)
 * - StatusFilter (Step 5)
 */
export function MediaFilterSidebar({
  sections,
  assetCounts,
  onFilterChange,
  menuItemSearchRef,
  presetPanelExpanded,
  onPresetPanelExpandedChange,
}: MediaFilterSidebarProps) {
  const {
    unifiedFilters,
    resetUnifiedFilters,
    getActiveFilterCount,
    setSelectedMenuItemId,
  } = useMediaLibraryStore();

  const activeFilterCount = getActiveFilterCount();

  const handleClearAll = () => {
    resetUnifiedFilters();
    onFilterChange();
  };

  // Hierarchy filter is only enabled for menu items
  const isHierarchyEnabled = unifiedFilters.selectedAssetType === 'menu-item';
  
  // Image type filter is only enabled for menu items
  const isImageTypeEnabled = unifiedFilters.selectedAssetType === 'menu-item';

  return (
    <aside 
      className="w-[280px] flex-shrink-0 bg-card/50 border border-border/50 rounded-lg flex flex-col sticky top-6 shadow-lg shadow-black/10"
      style={{ maxHeight: 'calc(100vh - 3rem)' }}
      role="complementary"
      aria-label="Filter controls"
    >
      {/* Sticky Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-400" aria-hidden="true" />
          <h2 className="font-semibold text-lg text-foreground">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/20"
              aria-label={`${activeFilterCount} active filters`}
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable Filter Sections */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 py-4">
          {/* Asset Type Filter - Always Visible */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Asset Type
            </h3>
            <AssetTypeFilter
              assetCounts={assetCounts}
              onFilterChange={onFilterChange}
            />
          </div>

          <Separator className="bg-border/50" />

          {/* Image Type Filter - Always Visible (when menu items selected) */}
          {isImageTypeEnabled && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Image Type
                </h3>
                <ImageTypeFilter
                  onFilterChange={onFilterChange}
                  disabled={!isImageTypeEnabled}
                />
              </div>
              <Separator className="bg-border/50" />
            </>
          )}

          {/* Collapsible Sections - Accordion */}
          <Accordion type="multiple" className="space-y-4">
            {/* Browse by Hierarchy - Collapsible */}
            <AccordionItem value="hierarchy" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline hover:bg-purple-500/5 rounded-md px-2 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FolderTree className="h-4 w-4 text-purple-400" />
                  <span>Browse by Hierarchy</span>
                  {unifiedFilters.selectedSectionId && (
                    <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-300 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 pb-2">
                <HierarchyFilter
                  sections={sections}
                  onFilterChange={onFilterChange}
                  disabled={!isHierarchyEnabled}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Find Specific Item - Collapsible */}
            <AccordionItem value="menu-item" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline hover:bg-purple-500/5 rounded-md px-2 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Search className="h-4 w-4 text-purple-400" />
                  <span>Find Specific Item</span>
                  {unifiedFilters.selectedMenuItemId && (
                    <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-300 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 pb-2">
                <MenuItemFilter
                  ref={menuItemSearchRef}
                  sections={sections}
                  selectedMenuItemId={unifiedFilters.selectedMenuItemId}
                  onMenuItemSelect={setSelectedMenuItemId}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Advanced Filters - Collapsible */}
            <AccordionItem value="status" className="border-none">
              <AccordionTrigger className="py-2 hover:no-underline hover:bg-purple-500/5 rounded-md px-2 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Settings className="h-4 w-4 text-purple-400" />
                  <span>Advanced Filters</span>
                  {(unifiedFilters.showUncategorized || unifiedFilters.showLinked || unifiedFilters.showInUse || unifiedFilters.showMultiUse || unifiedFilters.showOrphaned) && (
                    <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-300 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3 pb-2">
                <StatusFilter onFilterChange={onFilterChange} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Footer: Clear All Button */}
      <div className="p-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <Button
          onClick={handleClearAll}
          variant="outline"
          className="w-full border-border/50 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 hover:shadow-md transition-all duration-200"
          disabled={activeFilterCount === 0}
          aria-label={activeFilterCount > 0 ? `Clear all ${activeFilterCount} filters` : 'No active filters to clear'}
        >
          <X className="mr-2 h-4 w-4" aria-hidden="true" />
          Clear All Filters
        </Button>
      </div>
    </aside>
  );
}
