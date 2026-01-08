import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Props {
  count?: number;
}

/**
 * Skeleton loader for Favorites section
 * Mimics favorite item card layout
 */
export function FavoriteSkeleton({ count = 4 }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton width={180} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <div className="flex gap-3">
          <Skeleton width={120} height={40} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          <Skeleton width={140} height={40} baseColor="rgba(139, 21, 56, 0.3)" highlightColor="rgba(139, 21, 56, 0.4)" />
        </div>
      </div>

      {/* List Pills */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <Skeleton width={160} height={40} baseColor="rgba(139, 21, 56, 0.3)" highlightColor="rgba(139, 21, 56, 0.4)" />
        <Skeleton width={140} height={40} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton width={130} height={40} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
      </div>

      {/* Favorite Cards */}
      <div className="grid gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex gap-4">
              {/* Image */}
              <Skeleton width={80} height={80} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title */}
                    <Skeleton width="70%" height={20} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" className="mb-2" />
                    
                    {/* Description */}
                    <Skeleton width="90%" height={14} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" className="mb-1" />
                    <Skeleton width="60%" height={14} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" className="mb-3" />
                    
                    {/* Price */}
                    <Skeleton width={60} height={24} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" className="mb-3" />
                    
                    {/* List Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Skeleton width={40} height={12} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                      <Skeleton width={90} height={24} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
                      <Skeleton width={100} height={24} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <Skeleton circle width={36} height={36} baseColor="rgba(139, 21, 56, 0.2)" highlightColor="rgba(139, 21, 56, 0.3)" />
                    <Skeleton circle width={36} height={36} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
