import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Skeleton loader for Addresses section
 * Mimics address card layout
 */
export function AddressCardSkeleton() {
  return (
    <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Map Preview Skeleton */}
        <div className="md:w-48 h-48 md:h-auto relative flex-shrink-0 bg-black/40">
          <Skeleton height="100%" baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
        </div>

        {/* Address Details Skeleton */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton circle width={40} height={40} baseColor="rgba(139,21,56,0.2)" highlightColor="rgba(169,29,71,0.3)" />
              <div>
                <Skeleton width={120} height={20} className="mb-1" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                <Skeleton width={60} height={16} baseColor="rgba(139,21,56,0.2)" highlightColor="rgba(169,29,71,0.3)" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Skeleton circle width={36} height={36} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              <Skeleton circle width={36} height={36} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            </div>
          </div>
          
          {/* Address Text */}
          <div className="space-y-2 mb-4">
            <Skeleton width="80%" height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton width="60%" height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Skeleton width={140} height={36} borderRadius={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton width={180} height={36} borderRadius={8} baseColor="rgba(139,21,56,0.3)" highlightColor="rgba(169,29,71,0.4)" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full addresses section skeleton
 */
export function AddressesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <Skeleton width={180} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton width={140} height={40} borderRadius={8} baseColor="rgba(139,21,56,0.5)" highlightColor="rgba(169,29,71,0.6)" />
      </div>

      <div className="grid gap-4">
        <AddressCardSkeleton />
        <AddressCardSkeleton />
      </div>
    </div>
  );
}
