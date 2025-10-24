/**
 * Skeleton loading state for OrderSummaryPanel
 * Matches the exact structure and dimensions of the real OrderSummaryPanel
 */

import React from 'react';
import { QSAITheme } from '../utils/QSAIDesign';
import { ShoppingCart } from 'lucide-react';

export function OrderSummarySkeleton() {
  const skeletonItems = Array.from({ length: 3 }, (_, i) => i); // Show 3 skeleton items
  
  return (
    <div 
      className="flex flex-col h-full animate-pulse"
      style={{
        background: `linear-gradient(135deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.dark} 100%)`,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid rgba(124, 93, 250, 0.1)`
      }}
    >
      {/* Header Skeleton */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} style={{ color: QSAITheme.purple.light, opacity: 0.3 }} />
          <div 
            className="h-5 w-32 rounded"
            style={{ background: 'rgba(124, 93, 250, 0.1)' }}
          />
        </div>
        <div 
          className="h-6 w-12 rounded-full"
          style={{ background: 'rgba(124, 93, 250, 0.15)' }}
        />
      </div>
      
      {/* Customer Badge Skeleton */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}>
        <div 
          className="h-10 w-full rounded"
          style={{ background: 'rgba(255, 255, 255, 0.02)' }}
        />
      </div>
      
      {/* Order Items Skeleton */}
      <div className="flex-1 overflow-hidden px-4 py-3 space-y-3">
        {skeletonItems.map(index => (
          <div 
            key={`skeleton-item-${index}`}
            className="p-3 rounded"
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div 
                  className="h-4 w-3/4 rounded mb-2"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                />
                <div 
                  className="h-3 w-1/2 rounded"
                  style={{ background: 'rgba(124, 93, 250, 0.1)' }}
                />
              </div>
              <div 
                className="h-5 w-16 rounded"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>
            
            {/* Quantity Controls Skeleton */}
            <div className="flex items-center gap-2 mt-2">
              <div 
                className="h-8 w-24 rounded"
                style={{ background: 'rgba(124, 93, 250, 0.1)' }}
              />
              <div 
                className="h-6 w-6 rounded"
                style={{ background: 'rgba(255, 0, 0, 0.1)' }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Footer Skeleton */}
      <div 
        className="px-4 py-3 border-t space-y-2"
        style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        {/* Subtotal */}
        <div className="flex justify-between">
          <div 
            className="h-4 w-20 rounded"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          />
          <div 
            className="h-4 w-16 rounded"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />
        </div>
        
        {/* Total */}
        <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}>
          <div 
            className="h-5 w-24 rounded"
            style={{ background: 'rgba(124, 93, 250, 0.15)' }}
          />
          <div 
            className="h-5 w-20 rounded"
            style={{ background: 'rgba(124, 93, 250, 0.2)' }}
          />
        </div>
        
        {/* Action Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-2 pt-3">
          <div 
            className="h-10 rounded"
            style={{ background: 'rgba(124, 93, 250, 0.15)' }}
          />
          <div 
            className="h-10 rounded"
            style={{ background: 'rgba(124, 93, 250, 0.2)' }}
          />
        </div>
      </div>
    </div>
  );
}
