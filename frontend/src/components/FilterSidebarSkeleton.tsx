import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter } from 'lucide-react';

/**
 * FilterSidebarSkeleton - Loading state for MediaFilterSidebar
 * 
 * Displays skeleton UI while sections and media data are loading.
 * Matches the layout of the actual sidebar.
 */
export function FilterSidebarSkeleton() {
  return (
    <aside className="w-[280px] flex-shrink-0 bg-card/50 border border-border/50 rounded-lg flex flex-col h-full">
      {/* Sticky Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-400" />
          <h2 className="font-semibold text-lg text-foreground">Filters</h2>
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="p-4 space-y-6">
        {/* Asset Type Filter Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Divider */}
        <Skeleton className="h-[1px] w-full" />

        {/* Hierarchy Filter Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>

        {/* Divider */}
        <Skeleton className="h-[1px] w-full" />

        {/* Menu Item Filter Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Divider */}
        <Skeleton className="h-[1px] w-full" />

        {/* Status Filter Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>

        {/* Divider */}
        <Skeleton className="h-[1px] w-full" />

        {/* Filter Presets Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* Footer with Clear All Button Skeleton */}
      <div className="p-4 border-t border-border/50 mt-auto">
        <Skeleton className="h-10 w-full" />
      </div>
    </aside>
  );
}
