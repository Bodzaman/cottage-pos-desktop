import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Props {
  count?: number;
}

/**
 * Skeleton loader for Orders section
 * Mimics order card layout with items
 */
export function OrderSkeleton({ count = 3 }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton width={180} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton width={160} height={40} baseColor="rgba(139, 21, 56, 0.3)" highlightColor="rgba(139, 21, 56, 0.4)" />
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton height={40} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          <Skeleton height={40} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          <Skeleton height={40} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        </div>
        <Skeleton width={200} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
      </div>

      {/* Order Cards */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton circle width={40} height={40} baseColor="rgba(139, 21, 56, 0.2)" highlightColor="rgba(139, 21, 56, 0.3)" />
                <div>
                  <Skeleton width={140} height={20} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                  <Skeleton width={200} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" className="mt-1" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton width={60} height={24} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                <Skeleton width={80} height={20} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" className="mt-1" />
              </div>
            </div>
            
            {/* Order Items */}
            <div className="space-y-2 mb-4">
              <Skeleton width={120} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              {Array.from({ length: 2 }).map((_, itemIndex) => (
                <div key={itemIndex} className="flex gap-3 items-start py-2">
                  <Skeleton width={64} height={64} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
                  <div className="flex-1">
                    <Skeleton width="70%" height={18} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                    <Skeleton width="50%" height={14} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Skeleton width={180} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              <Skeleton width={100} height={32} baseColor="rgba(139, 21, 56, 0.3)" highlightColor="rgba(139, 21, 56, 0.4)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
