import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Image, Box } from 'lucide-react';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';

interface ImageTypeFilterProps {
  /** Callback to trigger gallery refresh after filter change */
  onFilterChange: () => void;
  /** Disabled state (e.g., when not viewing menu images) */
  disabled?: boolean;
}

type ImageTypeOption = {
  value: 'all' | 'menu-item' | 'menu-item-variant';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

/**
 * ImageTypeFilter - Radio button group for filtering menu items vs variants
 * 
 * Features:
 * - Single selection (radio buttons)
 * - Three options: All Images, Menu Items Only, Variants Only
 * - Icons for visual clarity
 * - Active state styling (purple theme)
 * - Disabled when not viewing menu images
 */
export function ImageTypeFilter({
  onFilterChange,
  disabled = false,
}: ImageTypeFilterProps) {
  const { unifiedFilters, setSelectedImageType } = useMediaLibraryStore();

  const imageTypeOptions: ImageTypeOption[] = [
    {
      value: 'all',
      label: 'All Images',
      icon: Box,
      description: 'Show both menu items and variants',
    },
    {
      value: 'menu-item',
      label: 'Menu Items Only',
      icon: Image,
      description: 'Show only standard menu item images',
    },
    {
      value: 'menu-item-variant',
      label: 'Variants Only',
      icon: Image,
      description: 'Show only variant images',
    },
  ];

  const handleChange = (value: string) => {
    setSelectedImageType(value as 'all' | 'menu-item' | 'menu-item-variant');
    onFilterChange();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">
          Image Type
        </Label>
        {disabled && (
          <span className="text-xs text-muted-foreground italic">
            Menu items only
          </span>
        )}
      </div>

      <RadioGroup
        value={unifiedFilters.selectedImageType || 'all'}
        onValueChange={handleChange}
        disabled={disabled}
        className="space-y-2"
      >
        {imageTypeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = unifiedFilters.selectedImageType === option.value;

          return (
            <div key={option.value} className="flex items-center space-x-3">
              <RadioGroupItem
                value={option.value}
                id={`image-type-${option.value}`}
                className={
                  isActive
                    ? 'border-purple-500 text-purple-500'
                    : 'border-border'
                }
                disabled={disabled}
              />
              <Label
                htmlFor={`image-type-${option.value}`}
                className={
                  `flex items-center gap-2 cursor-pointer transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isActive
                      ? 'text-purple-400 font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="text-sm">{option.label}</span>
                  {isActive && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {option.description}
                    </span>
                  )}
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
