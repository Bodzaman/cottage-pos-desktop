import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Skeleton loader for a single order card
 */
export function OrderCardSkeleton() {
  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton circle width={40} height={40} baseColor="rgba(139,21,56,0.2)" highlightColor="rgba(169,29,71,0.3)" />
          <div>
            <Skeleton width={150} height={20} className="mb-1" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton width={200} height={14} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton width={80} height={24} className="mb-1" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          <Skeleton width={90} height={20} borderRadius={12} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        </div>
      </div>
      
      {/* Order Items */}
      <div className="space-y-2 mb-4">
        <Skeleton width={120} height={14} className="mb-3" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 items-start py-2">
            <Skeleton width={64} height={64} borderRadius={8} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
            <div className="flex-1">
              <Skeleton width="60%" height={16} className="mb-1" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              <Skeleton width="40%" height={14} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            </div>
            <Skeleton width={60} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <Skeleton width={180} height={14} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton width={100} height={36} borderRadius={8} baseColor="rgba(139,21,56,0.5)" highlightColor="rgba(169,29,71,0.6)" />
      </div>
    </div>
  );
}

/**
 * Full orders section skeleton with filters
 */
export function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <Skeleton width={180} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton width={160} height={40} borderRadius={8} baseColor="rgba(139,21,56,0.5)" highlightColor="rgba(169,29,71,0.6)" />
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Skeleton height={40} borderRadius={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton height={40} borderRadius={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton height={40} borderRadius={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
      </div>
      
      {/* Results count */}
      <Skeleton width={180} height={14} className="mb-4" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />

      {/* Order Cards */}
      <div className="space-y-4">
        <OrderCardSkeleton />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </div>
    </div>
  );
}
