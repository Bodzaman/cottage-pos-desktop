/**
 * Skeleton Grid for POSDesktop during bundle loading
 * Shows professional loading state with proper grid layout
 */

import React from 'react';
import { POSMenuCardSkeleton } from './POSMenuCardSkeleton';
import { cn } from '@/lib/utils';

interface Props {
  viewMode?: 'card' | 'list';
  itemCount?: number;
  className?: string;
}

/**
 * Grid of skeleton cards matching POSDesktop layout
 */
export function POSSkeletonGrid({ viewMode = 'card', itemCount = 8, className }: Props) {
  const skeletonItems = Array.from({ length: itemCount }, (_, index) => index);
  
  if (viewMode === 'list') {
    return (
      <div className={cn("space-y-2", className)}>
        {skeletonItems.map(index => (
          <POSMenuCardSkeleton 
            key={`skeleton-list-${index}`}
            viewMode="list"
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {skeletonItems.map(index => (
        <POSMenuCardSkeleton 
          key={`skeleton-card-${index}`}
          viewMode="card"
        />
      ))}
    </div>
  );
}
