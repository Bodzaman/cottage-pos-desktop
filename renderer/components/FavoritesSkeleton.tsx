import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Skeleton loader for a single favorite item card
 */
export function FavoriteCardSkeleton() {
  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex gap-4">
        {/* Image Skeleton */}
        <Skeleton width={80} height={80} borderRadius={8} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title */}
              <Skeleton width="60%" height={20} className="mb-2" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              
              {/* Description */}
              <Skeleton width="90%" height={14} className="mb-1" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              <Skeleton width="70%" height={14} className="mb-3" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              
              {/* Price and Spice */}
              <div className="flex items-center justify-between mb-3">
                <Skeleton width={80} height={24} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                <Skeleton width={100} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              </div>
              
              {/* List Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton width={50} height={12} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                <Skeleton width={80} height={24} borderRadius={12} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
                <Skeleton width={90} height={24} borderRadius={12} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 ml-4">
              <Skeleton circle width={36} height={36} baseColor="rgba(139,21,56,0.2)" highlightColor="rgba(169,29,71,0.3)" />
              <Skeleton circle width={36} height={36} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full favorites section skeleton with tabs and list management
 */
export function FavoritesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <Skeleton width={180} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <div className="flex gap-3">
          <Skeleton width={130} height={40} borderRadius={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          <Skeleton width={140} height={40} borderRadius={8} baseColor="rgba(139,21,56,0.5)" highlightColor="rgba(169,29,71,0.6)" />
        </div>
      </div>

      {/* List Tabs */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <Skeleton width={160} height={40} borderRadius={8} baseColor="rgba(139,21,56,0.5)" highlightColor="rgba(169,29,71,0.6)" />
        <Skeleton width={140} height={40} borderRadius={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton width={120} height={40} borderRadius={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
      </div>

      {/* Favorite Cards */}
      <div className="grid gap-4">
        <FavoriteCardSkeleton />
        <FavoriteCardSkeleton />
        <FavoriteCardSkeleton />
        <FavoriteCardSkeleton />
      </div>
    </div>
  );
}
