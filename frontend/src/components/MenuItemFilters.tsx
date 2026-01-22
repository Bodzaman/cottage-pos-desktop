/**
 * MenuItemFilters
 *
 * Filter chips/dropdown system for filtering menu items by:
 * - Status: Active / Inactive / All
 * - Draft State: Published / Drafts / All
 * - Category: Multi-select with search
 *
 * Used in the Menu Items tab to enable quick filtering of the item list.
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, CheckCircle2, FileEdit, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MenuCategory } from '../utils/masterTypes';
import { colors } from '../utils/InternalDesignSystem';

export type StatusFilter = 'all' | 'active' | 'inactive';
export type DraftFilter = 'all' | 'published' | 'drafts';

export interface MenuItemFiltersState {
  status: StatusFilter;
  draft: DraftFilter;
  categoryIds: string[];
}

interface MenuItemFiltersProps {
  /** Current filter state */
  filters: MenuItemFiltersState;
  /** Handler for filter changes */
  onFiltersChange: (filters: MenuItemFiltersState) => void;
  /** Available categories for filtering */
  categories: MenuCategory[];
  /** Class name for styling */
  className?: string;
}

export const defaultFilters: MenuItemFiltersState = {
  status: 'all',
  draft: 'all',
  categoryIds: [],
};

export const MenuItemFilters: React.FC<MenuItemFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  className,
}) => {
  // Track whether any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.draft !== 'all' ||
      filters.categoryIds.length > 0
    );
  }, [filters]);

  // Update a single filter
  const updateFilter = <K extends keyof MenuItemFiltersState>(
    key: K,
    value: MenuItemFiltersState[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter((id) => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    updateFilter('categoryIds', newCategoryIds);
  };

  // Get selected category names for display
  const selectedCategoryNames = useMemo(() => {
    return filters.categoryIds
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter(Boolean);
  }, [filters.categoryIds, categories]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Icon */}
        <div className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value: StatusFilter) => updateFilter('status', value)}
        >
          <SelectTrigger
            className="w-[130px] h-9 text-sm"
            style={{
              backgroundColor: filters.status !== 'all' ? 'rgba(124, 58, 237, 0.1)' : colors.background.secondary,
              borderColor: filters.status !== 'all' ? colors.purple.primary : colors.border.accent,
              color: colors.text.primary,
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: colors.text.secondary }} />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.accent }}>
            <SelectItem value="all" style={{ color: colors.text.primary }}>All Items</SelectItem>
            <SelectItem value="active" style={{ color: colors.text.primary }}>Active Only</SelectItem>
            <SelectItem value="inactive" style={{ color: colors.text.primary }}>Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Draft State Filter */}
        <Select
          value={filters.draft}
          onValueChange={(value: DraftFilter) => updateFilter('draft', value)}
        >
          <SelectTrigger
            className="w-[140px] h-9 text-sm"
            style={{
              backgroundColor: filters.draft !== 'all' ? 'rgba(245, 158, 11, 0.1)' : colors.background.secondary,
              borderColor: filters.draft !== 'all' ? colors.status.staging : colors.border.accent,
              color: colors.text.primary,
            }}
          >
            <div className="flex items-center gap-2">
              <FileEdit className="h-3.5 w-3.5" style={{ color: colors.text.secondary }} />
              <SelectValue placeholder="Publish State" />
            </div>
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.accent }}>
            <SelectItem value="all" style={{ color: colors.text.primary }}>All States</SelectItem>
            <SelectItem value="published" style={{ color: colors.text.primary }}>Published</SelectItem>
            <SelectItem value="drafts" style={{ color: colors.text.primary }}>Drafts Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.categoryIds.length > 0 ? 'custom' : 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              updateFilter('categoryIds', []);
            }
          }}
        >
          <SelectTrigger
            className="w-[160px] h-9 text-sm"
            style={{
              backgroundColor: filters.categoryIds.length > 0 ? 'rgba(124, 58, 237, 0.1)' : colors.background.secondary,
              borderColor: filters.categoryIds.length > 0 ? colors.purple.primary : colors.border.accent,
              color: colors.text.primary,
            }}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5" style={{ color: colors.text.secondary }} />
              <span className="truncate">
                {filters.categoryIds.length > 0
                  ? `${filters.categoryIds.length} selected`
                  : 'All Categories'}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.accent }}>
            <SelectItem value="all" style={{ color: colors.text.primary }}>All Categories</SelectItem>
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-[rgba(124,58,237,0.1)]"
                style={{ color: filters.categoryIds.includes(category.id) ? colors.purple.primary : colors.text.primary }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
              >
                <div className="absolute left-2 w-4 h-4">
                  {filters.categoryIds.includes(category.id) && (
                    <CheckCircle2 className="h-4 w-4" style={{ color: colors.purple.primary }} />
                  )}
                </div>
                {category.name}
              </div>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 hover:bg-[rgba(124,58,237,0.1)]"
            style={{ color: colors.text.secondary }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                color: colors.purple.primary,
                border: `1px solid ${colors.border.accent}`,
              }}
              onClick={() => updateFilter('status', 'all')}
            >
              {filters.status === 'active' ? 'Active' : 'Inactive'}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {filters.draft !== 'all' && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
              onClick={() => updateFilter('draft', 'all')}
            >
              {filters.draft === 'published' ? 'Published' : 'Drafts'}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {selectedCategoryNames.map((name, index) => (
            <Badge
              key={filters.categoryIds[index]}
              variant="secondary"
              className="cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                color: colors.purple.primary,
                border: `1px solid ${colors.border.accent}`,
              }}
              onClick={() => toggleCategory(filters.categoryIds[index])}
            >
              {name}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Apply filters to a list of menu items
 */
export function applyMenuItemFilters<T extends {
  is_active?: boolean;
  published_at?: string | null;
  category_id?: string;
}>(
  items: T[],
  filters: MenuItemFiltersState
): T[] {
  return items.filter((item) => {
    // Status filter
    if (filters.status === 'active' && !item.is_active) return false;
    if (filters.status === 'inactive' && item.is_active) return false;

    // Draft filter
    if (filters.draft === 'published' && !item.published_at) return false;
    if (filters.draft === 'drafts' && item.published_at) return false;

    // Category filter
    if (
      filters.categoryIds.length > 0 &&
      !filters.categoryIds.includes(item.category_id || '')
    ) {
      return false;
    }

    return true;
  });
}

export default MenuItemFilters;
