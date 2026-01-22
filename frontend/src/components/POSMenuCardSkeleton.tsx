/**
 * Professional Skeleton Component for POSMenuCard
 * Matches exact layout and dimensions of real POSMenuCard
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  viewMode?: 'card' | 'list';
  className?: string;
}

/**
 * Professional skeleton that exactly matches POSMenuCard layout
 */
export function POSMenuCardSkeleton({ viewMode = 'card', className }: Props) {
  const CARD_HEIGHT = 320;
  const LIST_HEIGHT = 140;
  const TITLE_HEIGHT = 50;
  const CUSTOMIZE_BUTTON_HEIGHT = 36;
  const VARIANTS_HEIGHT = CARD_HEIGHT - TITLE_HEIGHT - CUSTOMIZE_BUTTON_HEIGHT;
  
  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "bg-[#1A1A1A] rounded-lg border border-[rgba(124,93,250,0.1)] overflow-hidden",
          "flex items-center p-3 gap-4 animate-pulse",
          className
        )}
        style={{ height: `${LIST_HEIGHT}px` }}
      >
        {/* Thumbnail skeleton */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 flex-shrink-0" />
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-3/4" />
          <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-500 rounded w-full" />
          <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-500 rounded w-1/2" />
        </div>
        
        {/* Action buttons skeleton */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-16 bg-gradient-to-r from-[#7C5DFA]/30 to-[#6B4DEA]/30 rounded" />
          <div className="h-8 w-20 bg-gradient-to-r from-gray-700 to-gray-600 rounded" />
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "bg-[#1A1A1A] rounded-lg border border-[rgba(124,93,250,0.1)] overflow-hidden",
        "flex flex-col animate-pulse",
        className
      )}
      style={{ height: `${CARD_HEIGHT}px` }}
    >
      {/* Title section skeleton */}
      <div 
        className="px-4 py-4 flex-shrink-0 bg-[#1A1A1A] border-b border-gray-700/30"
        style={{ height: `${TITLE_HEIGHT}px` }}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-5 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-2/3" />
          </div>
          <div className="w-6 h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full" />
        </div>
        
        {/* Allergen display skeleton */}
        <div className="mt-2 flex gap-1">
          <div className="w-4 h-4 bg-gradient-to-r from-gray-600 to-gray-500 rounded" />
          <div className="w-4 h-4 bg-gradient-to-r from-gray-600 to-gray-500 rounded" />
        </div>
      </div>
      
      {/* Variants section skeleton */}
      <div 
        className="px-3 flex-1 relative"
        style={{ height: `${VARIANTS_HEIGHT}px` }}
      >
        {/* Background image skeleton */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 rounded-md" />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 rounded-md z-10" />
        
        {/* Content skeleton */}
        <div className="h-full w-full relative z-20 p-2 space-y-2">
          {/* Variant rows skeleton */}
          {[1, 2, 3].map(index => (
            <div key={index} className="flex items-center gap-2 p-2 rounded">
              <div className="w-4 h-4 bg-gradient-to-r from-[#7C5DFA]/30 to-[#6B4DEA]/30 rounded flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-500 rounded w-3/4" />
                <div className="h-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-1/2" />
              </div>
              <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-500 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Customize button skeleton */}
      <div className="flex-shrink-0">
        <div 
          className="w-full bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-t border-white/10 rounded-b-lg"
          style={{ height: `${CUSTOMIZE_BUTTON_HEIGHT + 4}px` }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-500 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
