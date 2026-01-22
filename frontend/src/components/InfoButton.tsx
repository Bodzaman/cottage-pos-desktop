
import React from 'react';
import { PortalTooltip } from './PortalTooltip';
import { MenuItem } from 'utils/menuTypes';

interface InfoButtonProps {
  item: MenuItem;
  size?: 'sm' | 'md';
  className?: string;
}

export function InfoButton({ item, size = 'md', className = '' }: InfoButtonProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonPadding = size === 'sm' ? 'p-1' : 'p-2';
  
  const tooltipContent = (
    <div className="space-y-2">
      <p className="font-medium text-sm">{item.name}</p>
      {(item.description || item.menu_item_description || item.long_description) && (
        <p className="text-xs text-gray-300">
          {item.description || item.menu_item_description || item.long_description}
        </p>
      )}
      {!item.description && !item.menu_item_description && !item.long_description && (
        <p className="text-xs text-gray-400 italic">No description available</p>
      )}
    </div>
  );

  return (
    <PortalTooltip content={tooltipContent}>
      <button 
        className={`text-gray-400 hover:text-white transition-colors duration-200 ${buttonPadding} rounded hover:bg-gray-800/50 flex-shrink-0 ${className}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <svg className={iconSize} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
    </PortalTooltip>
  );
}
