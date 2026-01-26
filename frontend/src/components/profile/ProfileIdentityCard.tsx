import React from 'react';
import { motion } from 'framer-motion';
import { ProfileImageUpload } from 'components/ProfileImageUpload';
import { PremiumCard } from 'components/PremiumCard';

interface ProfileIdentityCardProps {
  user: any;
  profile: any;
  completionPercentage: number;
  completionColor: string;
  completionMessage: string;
  onImageUpdate: (imageUrl: string | null) => Promise<void>;
}

export function ProfileIdentityCard({
  user,
  profile,
  completionPercentage,
  completionColor,
  completionMessage,
  onImageUpdate,
}: ProfileIdentityCardProps) {
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Your Name';
  const email = profile?.email || user?.email || '';

  // Calculate stroke dash for circular progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PremiumCard subsurface padding="lg">
        <div className="flex flex-col items-center text-center">
          {/* Profile Image */}
          <div className="mb-4">
            <ProfileImageUpload
              userId={user?.id || ''}
              currentImageUrl={profile?.image_url}
              googleProfileImage={profile?.google_profile_image}
              authProvider={profile?.auth_provider}
              onImageUpdate={onImageUpdate}
            />
          </div>

          {/* Name */}
          <h3 className="text-lg font-semibold text-white mb-1">
            {fullName}
          </h3>

          {/* Email */}
          <p className="text-sm text-gray-400 mb-5 truncate max-w-full">
            {email}
          </p>

          {/* Circular Completion Indicator */}
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={completionColor}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span
              className="absolute text-sm font-semibold"
              style={{ color: completionColor }}
            >
              {completionPercentage}%
            </span>
          </div>

          {/* Completion Message */}
          <p className="text-xs text-gray-500 mt-2 max-w-[160px]">
            {completionMessage}
          </p>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

export default ProfileIdentityCard;
