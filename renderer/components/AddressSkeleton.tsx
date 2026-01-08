import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Props {
  count?: number;
}

/**
 * Skeleton loader for Addresses section
 * Mimics address card layout with map preview
 */
export function AddressSkeleton({ count = 2 }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton width={180} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        <Skeleton width={140} height={40} baseColor="rgba(139, 21, 56, 0.3)" highlightColor="rgba(139, 21, 56, 0.4)" />
      </div>

      {/* Address Cards */}
      <div className="grid gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Map Preview */}
              <div className="md:w-48 h-48 md:h-auto relative flex-shrink-0 bg-black/40 flex items-center justify-center">
                <Skeleton width={192} height={192} baseColor="rgba(255,255,255,0.05)" highlightColor="rgba(255,255,255,0.1)" />
              </div>

              {/* Address Details */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton circle width={40} height={40} baseColor="rgba(139, 21, 56, 0.2)" highlightColor="rgba(139, 21, 56, 0.3)" />
                    <div>
                      <Skeleton width={120} height={20} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                      <Skeleton width={60} height={16} baseColor="rgba(139, 21, 56, 0.2)" highlightColor="rgba(139, 21, 56, 0.3)" className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton circle width={32} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                    <Skeleton circle width={32} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                  </div>
                </div>
                
                {/* Address Text */}
                <div className="space-y-2 mb-4">
                  <Skeleton width="90%" height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                  <Skeleton width="70%" height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Skeleton width={140} height={32} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                  <Skeleton width={180} height={32} baseColor="rgba(139, 21, 56, 0.3)" highlightColor="rgba(139, 21, 56, 0.4)" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
