import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PremiumTheme } from 'utils/premiumTheme';

/**
 * CategoryNavigationSkeleton
 * 
 * Skeleton loading component for the category navigation tabs.
 * Shows 6 tab skeletons + view toggle skeleton while menu data loads.
 * Matches the dark theme aesthetic with glass morphism effect.
 */
export function CategoryNavigationSkeleton() {
  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between py-3">
        {/* Category Tabs Skeleton */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex space-x-4" role="tablist">
            {/* 6 section tabs */}
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-9 w-28 rounded-lg flex-shrink-0"
                style={{
                  backgroundColor: PremiumTheme.colors.dark[700],
                  opacity: 0.5
                }}
              />
            ))}
          </div>
        </div>
        
        {/* View Toggle Skeleton */}
        <div className="flex items-center space-x-2 ml-4">
          <div 
            className="flex rounded-lg p-1"
            style={{ backgroundColor: PremiumTheme.colors.dark[800] }}
          >
            {/* Gallery button skeleton */}
            <Skeleton
              className="h-9 w-9 rounded-md"
              style={{
                backgroundColor: PremiumTheme.colors.dark[700],
                opacity: 0.5
              }}
            />
            {/* List button skeleton */}
            <Skeleton
              className="h-9 w-9 rounded-md ml-0"
              style={{
                backgroundColor: PremiumTheme.colors.dark[700],
                opacity: 0.5
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
