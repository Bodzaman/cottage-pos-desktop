import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { MenuSection } from 'utils/mediaHierarchyUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveFiltersBarProps {
  /** Menu sections for hierarchy context */
  sections: MenuSection[];
  /** Callback to trigger gallery refresh after filter change */
  onFilterChange: () => void;
}

/**
 * ActiveFiltersBar - Display active filters as removable chips
 * 
 * Features:
 * - Smart chip text (human-readable names)
 * - Grouped by category: Asset Type | Hierarchy | Status
 * - Individual chip removal
 * - Visual dividers between groups
 * - Responsive wrapping
 * - "Clear All" button on right
 */
export function ActiveFiltersBar({ sections, onFilterChange }: ActiveFiltersBarProps) {
  const {
    unifiedFilters,
    setUnifiedAssetType,
    setUnifiedSectionFilter,
    setUnifiedCategoryFilter,
    setSelectedMenuItemId,
    setShowUncategorized,
    setShowLinked,
    setShowInUse,
    setShowMultiUse,
    setShowOrphaned,
    resetUnifiedFilters,
    getActiveFilterCount,
  } = useMediaLibraryStore();

  const activeFilterCount = getActiveFilterCount();

  // If no filters active, don't render anything
  if (activeFilterCount === 0) {
    return null;
  }

  /**
   * Generate chip data from current filter state
   */
  interface FilterChip {
    id: string;
    label: string;
    group: 'asset-type' | 'hierarchy' | 'status';
    onRemove: () => void;
  }

  const chips: FilterChip[] = [];

  // Asset Type Chips
  if (unifiedFilters.selectedAssetType !== 'all') {
    const assetTypeLabels: Record<string, string> = {
      'menu-item': 'Menu Images',
      'ai-avatar': 'AI Avatars',
      'general': 'General Media',
    };

    chips.push({
      id: 'asset-type',
      label: assetTypeLabels[unifiedFilters.selectedAssetType] || unifiedFilters.selectedAssetType,
      group: 'asset-type',
      onRemove: () => {
        setUnifiedAssetType('all');
        onFilterChange();
      },
    });
  }

  // Hierarchy Chips
  if (unifiedFilters.selectedSectionId) {
    const section = sections.find(s => s.id === unifiedFilters.selectedSectionId);
    chips.push({
      id: 'section',
      label: section?.display_name || 'Section',
      group: 'hierarchy',
      onRemove: () => {
        setUnifiedSectionFilter(null);
        setUnifiedCategoryFilter(null); // Clear child too
        onFilterChange();
      },
    });
  }

  if (unifiedFilters.selectedCategoryId) {
    let categoryName = 'Category';
    sections.forEach(section => {
      const category = section.categories.find(c => c.id === unifiedFilters.selectedCategoryId);
      if (category) {
        categoryName = category.display_name;
      }
    });

    chips.push({
      id: 'category',
      label: categoryName,
      group: 'hierarchy',
      onRemove: () => {
        setUnifiedCategoryFilter(null);
        onFilterChange();
      },
    });
  }

  if (unifiedFilters.selectedMenuItemId) {
    // TODO: Fetch menu item name from ID
    // For now, just show "Menu Item Selected"
    chips.push({
      id: 'menu-item',
      label: 'Menu Item',
      group: 'hierarchy',
      onRemove: () => {
        setSelectedMenuItemId(null);
        onFilterChange();
      },
    });
  }

  // Status Chips
  if (unifiedFilters.showUncategorized) {
    chips.push({
      id: 'uncategorized',
      label: 'Uncategorized',
      group: 'status',
      onRemove: () => {
        setShowUncategorized(false);
        onFilterChange();
      },
    });
  }

  if (unifiedFilters.showLinked) {
    chips.push({
      id: 'linked',
      label: 'Linked',
      group: 'status',
      onRemove: () => {
        setShowLinked(false);
        onFilterChange();
      },
    });
  }

  if (unifiedFilters.showInUse) {
    chips.push({
      id: 'in-use',
      label: 'In Use',
      group: 'status',
      onRemove: () => {
        setShowInUse(false);
        onFilterChange();
      },
    });
  }

  if (unifiedFilters.showMultiUse) {
    chips.push({
      id: 'multi-use',
      label: 'Multi-Use',
      group: 'status',
      onRemove: () => {
        setShowMultiUse(false);
        onFilterChange();
      },
    });
  }

  if (unifiedFilters.showOrphaned) {
    chips.push({
      id: 'orphaned',
      label: 'Orphaned',
      group: 'status',
      onRemove: () => {
        setShowOrphaned(false);
        onFilterChange();
      },
    });
  }

  // Group chips by category
  const assetTypeChips = chips.filter(c => c.group === 'asset-type');
  const hierarchyChips = chips.filter(c => c.group === 'hierarchy');
  const statusChips = chips.filter(c => c.group === 'status');

  const handleClearAll = () => {
    resetUnifiedFilters();
    onFilterChange();
  };

  /**
   * Make chips keyboard accessible
   */
  const handleChipKeyDown = (e: React.KeyboardEvent, onRemove: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-3 px-4 py-3 bg-purple-500/5 border border-purple-500/20 rounded-lg"
          role="region"
          aria-label="Active filters"
        >
          {/* Filter Icon & Label */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-purple-400" aria-hidden="true" />
            <span>Active Filters:</span>
          </div>

          {/* Chip Groups */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Asset Type Group */}
            <AnimatePresence mode="popLayout">
              {assetTypeChips.map(chip => (
                <motion.div
                  key={chip.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-200 border-purple-500/40 hover:bg-purple-500/30 cursor-pointer transition-colors pl-3 pr-2 py-1 gap-1.5"
                    onClick={chip.onRemove}
                    onKeyDown={(e) => handleChipKeyDown(e, chip.onRemove)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    {chip.label}
                    <X className="h-3 w-3 hover:text-purple-100" aria-hidden="true" />
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Divider */}
            {assetTypeChips.length > 0 && (hierarchyChips.length > 0 || statusChips.length > 0) && (
              <div className="h-5 w-px bg-border/50" aria-hidden="true" />
            )}

            {/* Hierarchy Group */}
            <AnimatePresence mode="popLayout">
              {hierarchyChips.map(chip => (
                <motion.div
                  key={chip.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/20 text-blue-200 border-blue-500/40 hover:bg-blue-500/30 cursor-pointer transition-colors pl-3 pr-2 py-1 gap-1.5"
                    onClick={chip.onRemove}
                    onKeyDown={(e) => handleChipKeyDown(e, chip.onRemove)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    {chip.label}
                    <X className="h-3 w-3 hover:text-blue-100" aria-hidden="true" />
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Divider */}
            {hierarchyChips.length > 0 && statusChips.length > 0 && (
              <div className="h-5 w-px bg-border/50" aria-hidden="true" />
            )}

            {/* Status Group */}
            <AnimatePresence mode="popLayout">
              {statusChips.map(chip => (
                <motion.div
                  key={chip.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/20 text-orange-200 border-orange-500/40 hover:bg-orange-500/30 cursor-pointer transition-colors pl-3 pr-2 py-1 gap-1.5"
                    onClick={chip.onRemove}
                    onKeyDown={(e) => handleChipKeyDown(e, chip.onRemove)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    {chip.label}
                    <X className="h-3 w-3 hover:text-orange-100" aria-hidden="true" />
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Clear All Button */}
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Clear all ${activeFilterCount} active filters`}
          >
            Clear All
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
