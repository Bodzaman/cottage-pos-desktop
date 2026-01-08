import React from 'react';
import { User, UserCheck } from 'lucide-react';
import { useSimpleAuth } from '../utils/simple-auth-context';

interface DynamicUserAvatarProps {
  /** Size of the avatar in CSS classes (e.g., 'w-6 h-6', 'w-8 h-8') */
  size?: string;
  /** Additional CSS classes */
  className?: string;
  /** Text size for initials/icons (e.g., 'text-xs', 'text-sm') */
  textSize?: string;
  /** Background color override */
  backgroundColor?: string;
  /** Text color override */
  textColor?: string;
}

/**
 * Dynamic user avatar component that displays different content based on authentication status:
 * 
 * Priority Logic:
 * 1. **Logged in + Profile Picture** → Use uploaded profile picture
 * 2. **Logged in + No Profile Picture** → Generic user icon (person silhouette) 
 * 3. **Not Logged In** → Guest icon (visitor symbol)
 * 
 * Features:
 * - Automatic fallback handling for broken images
 * - Consistent circular design
 * - Smooth transitions between states
 * - Customizable sizing and colors
 */
export function DynamicUserAvatar({ 
  size = 'w-6 h-6', 
  className = '', 
  textSize = 'text-xs',
  backgroundColor,
  textColor = 'text-white'
}: DynamicUserAvatarProps) {
  const { user, profile, isAuthenticated } = useSimpleAuth();
  
  // Get user initials for fallback
  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  // Determine background color based on auth state
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    
    if (isAuthenticated) {
      return '#8B1538'; // Burgundy for authenticated users
    } else {
      return '#6B7280'; // Gray for guests
    }
  };
  
  // Priority 1: Logged in + Profile Picture
  if (isAuthenticated && (profile?.image_url || profile?.google_profile_image)) {
    const imageUrl = profile.image_url || profile.google_profile_image;
    
    return (
      <div className={`${size} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img 
          src={imageUrl} 
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials on image load error
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center ${textSize} font-medium ${textColor}" 
                     style="background-color: ${getBackgroundColor()}">
                  ${getUserInitials()}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }
  
  // Priority 2: Logged in + No Profile Picture → Show initials instead of icon
  if (isAuthenticated) {
    return (
      <div 
        className={`${size} rounded-full flex items-center justify-center ${className}`}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <span className={`${textSize} font-medium ${textColor}`}>
          {getUserInitials()}
        </span>
      </div>
    );
  }
  
  // Priority 3: Not Logged In → Guest icon
  return (
    <div 
      className={`${size} rounded-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <User className={`${textSize === 'text-xs' ? 'h-3 w-3' : textSize === 'text-sm' ? 'h-4 w-4' : 'h-5 w-5'} ${textColor}`} />
    </div>
  );
}

/**
 * Helper hook to get user display name for avatar context
 */
export function useUserDisplayName() {
  const { user, profile, isAuthenticated } = useSimpleAuth();
  
  if (!isAuthenticated) return 'Guest';
  
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  
  if (profile?.first_name) {
    return profile.first_name;
  }
  
  return user?.email?.split('@')[0] || 'User';
}

/**
 * Helper hook to get user avatar state for debugging/analytics
 */
export function useUserAvatarState() {
  const { user, profile, isAuthenticated } = useSimpleAuth();
  
  if (isAuthenticated && (profile?.image_url || profile?.google_profile_image)) {
    return {
      type: 'profile_picture',
      source: profile?.image_url ? 'uploaded' : 'google',
      url: profile?.image_url || profile?.google_profile_image
    };
  }
  
  if (isAuthenticated) {
    return {
      type: 'user_icon',
      source: 'authenticated',
      url: null
    };
  }
  
  return {
    type: 'guest_icon',
    source: 'unauthenticated', 
    url: null
  };
}
