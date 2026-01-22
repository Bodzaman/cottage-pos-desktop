import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ItemCodeBadgeProps {
  code: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const ItemCodeBadge: React.FC<ItemCodeBadgeProps> = ({ 
  code, 
  className = '', 
  size = 'sm' 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1'
  };

  return (
    <Badge 
      className={`
        bg-gray-600/80 text-gray-100 border-gray-500/50 
        font-mono tracking-wide
        hover:bg-gray-500/80 transition-colors
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {code}
    </Badge>
  );
};

interface CategoryCodePrefixProps {
  prefix: string;
  className?: string;
}

export const CategoryCodePrefix: React.FC<CategoryCodePrefixProps> = ({ 
  prefix, 
  className = '' 
}) => {
  return (
    <Badge 
      className={`
        bg-blue-600/70 text-blue-100 border-blue-500/50 
        font-mono text-xs px-2 py-0.5
        ${className}
      `}
    >
      {prefix}
    </Badge>
  );
};
