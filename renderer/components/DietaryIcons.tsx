import React from 'react';

interface DietaryIconsProps {
  dietaryTags: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const DIETARY_ICON_MAP: { [key: string]: { icon: string; color: string; label: string } } = {
  'Vegan Friendly': { icon: '🌱', color: 'text-green-600', label: 'Vegan' },
  'Vegetarian': { icon: '🥬', color: 'text-green-600', label: 'Vegetarian' },
  'Dairy Free': { icon: '🥛', color: 'text-blue-600', label: 'Dairy Free' },
  'Gluten Free': { icon: '🌾', color: 'text-amber-600', label: 'Gluten Free' },
  'Contains Nuts': { icon: '🥜', color: 'text-orange-600', label: 'Contains Nuts' },
  'Contains Shellfish': { icon: '🦐', color: 'text-red-600', label: 'Contains Shellfish' },
  'Halal': { icon: '☪️', color: 'text-emerald-600', label: 'Halal' },
  'Chef\'s Special': { icon: '⭐', color: 'text-yellow-600', label: 'Chef\'s Special' },
  'New Item': { icon: '✨', color: 'text-purple-600', label: 'New' },
  // Legacy compatibility
  'Vegan': { icon: '🌱', color: 'text-green-600', label: 'Vegan' },
  'Gluten-Free': { icon: '🌾', color: 'text-amber-600', label: 'Gluten Free' },
  'Popular': { icon: '⭐', color: 'text-yellow-600', label: 'Popular' }
};

const DietaryIcons: React.FC<DietaryIconsProps> = ({ 
  dietaryTags, 
  className = '', 
  size = 'md',
  showLabels = false 
}) => {
  if (!dietaryTags || dietaryTags.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {dietaryTags.map((tag, index) => {
        const dietaryInfo = DIETARY_ICON_MAP[tag];
        if (!dietaryInfo) return null;

        return (
          <span
            key={index}
            className={`inline-flex items-center gap-1 ${showLabels ? 'px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg' : ''}`}
            title={dietaryInfo.label}
          >
            <span className={iconSizeClasses[size]} role="img" aria-label={dietaryInfo.label}>
              {dietaryInfo.icon}
            </span>
            {showLabels && (
              <span className={`${sizeClasses[size]} ${dietaryInfo.color} font-medium`}>
                {dietaryInfo.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default DietaryIcons;