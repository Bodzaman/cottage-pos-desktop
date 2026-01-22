import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AuthTheme } from 'utils/authTheme';

/**
 * Skeleton loader for Profile section
 * Mimics the actual profile form layout
 */
export function ProfileSkeleton() {
  return (
    <Card className="bg-black/20 backdrop-blur-sm border-white/10">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Skeleton circle width={24} height={24} baseColor="#8B1538" highlightColor="#A91D47" />
            <Skeleton width={180} height={24} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>
        </div>
        
        {/* Profile Completion Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton width={150} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton width={40} height={16} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>
          <Skeleton height={8} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Profile Image */}
        <div className="flex justify-center">
          <Skeleton circle width={120} height={120} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* First Name */}
          <div>
            <Skeleton width={100} height={14} className="mb-2" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton height={48} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>

          {/* Last Name */}
          <div>
            <Skeleton width={100} height={14} className="mb-2" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton height={48} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>

          {/* Email */}
          <div>
            <Skeleton width={100} height={14} className="mb-2" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton height={48} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>

          {/* Phone */}
          <div>
            <Skeleton width={100} height={14} className="mb-2" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
            <Skeleton height={48} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>
        </div>

        {/* AI Personalization Section */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton circle width={20} height={20} baseColor="#8B1538" highlightColor="#A91D47" />
              <div className="flex-1">
                <Skeleton width={150} height={18} className="mb-2" baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
                <Skeleton width={300} height={14} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
              </div>
            </div>
            <Skeleton width={44} height={24} borderRadius={12} baseColor="rgba(255,255,255,0.1)" highlightColor="rgba(255,255,255,0.15)" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
