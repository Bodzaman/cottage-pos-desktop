/**
 * Skeleton loading state for CategorySidebar
 * Matches the exact structure and dimensions of the real CategorySidebar
 */

import React from 'react';
import { QSAITheme } from '../utils/QSAIDesign';

export function CategorySidebarSkeleton() {
  const skeletonSections = Array.from({ length: 6 }, (_, i) => i); // 6 sections typical
  
  return (
    <div 
      className="flex flex-col h-full animate-pulse"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Header Skeleton */}
      <div 
        className="px-3 py-2 border-b flex-shrink-0" 
        style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        <div 
          className="h-5 w-24 rounded"
          style={{ background: 'rgba(124, 93, 250, 0.1)' }}
        />
        {/* Gradient Underline Skeleton */}
        <div 
          className="w-24 h-1 rounded-full mt-2"
          style={{ background: 'rgba(124, 93, 250, 0.15)' }}
        />
      </div>
      
      {/* Scrollable Content Skeleton */}
      <div className="flex-1 overflow-hidden p-2 space-y-2">
        {skeletonSections.map(index => (
          <div key={`skeleton-section-${index}`}>
            {/* Section Header Skeleton */}
            <div 
              className="flex items-center gap-2 px-3 py-2.5 rounded"
              style={{ background: 'rgba(255, 255, 255, 0.02)' }}
            >
              <div 
                className="h-4 w-4 rounded"
                style={{ background: 'rgba(124, 93, 250, 0.2)' }}
              />
              <div 
                className="h-4 flex-1 rounded"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              />
            </div>
            
            {/* Child Categories Skeleton (show for first 2 sections) */}
            {index < 2 && (
              <div className="ml-6 mt-1 space-y-1">
                {Array.from({ length: 3 }, (_, childIndex) => (
                  <div 
                    key={`skeleton-child-${index}-${childIndex}`}
                    className="h-8 rounded"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
