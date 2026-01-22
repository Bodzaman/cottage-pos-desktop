import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Image, Bot, FolderOpen, LayoutGrid } from 'lucide-react';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { announceFilterChange } from 'utils/announceToScreenReader';

interface AssetTypeFilterProps {
  /** Asset counts for each type */
  assetCounts: {
    menuImages: number;
    aiAvatars: number;
    general: number;
    total: number;
  };
  /** Callback to trigger gallery refresh after filter change */
  onFilterChange: () => void;
}

type AssetTypeOption = {
  value: 'all' | 'menu-item' | 'ai-avatar' | 'general';
  label: string;
  icon: React.ReactNode;
  count: number;
};

/**
 * AssetTypeFilter - Radio button group for selecting asset type
 * 
 * Features:
 * - Single selection (radio buttons)
 * - Count badges per type
 * - Active state styling (purple theme)
 * - Icons for visual clarity
 */
export function AssetTypeFilter({
  assetCounts,
  onFilterChange,
}: AssetTypeFilterProps) {
  const { unifiedFilters, setUnifiedAssetType } = useMediaLibraryStore();

  const assetTypeOptions: AssetTypeOption[] = [
    {
      value: 'all',
      label: 'All Assets',
      icon: <LayoutGrid className="h-4 w-4" />,
      count: assetCounts.total,
    },
    {
      value: 'menu-item',
      label: 'Menu Items',
      icon: <Image className="h-4 w-4" />,
      count: assetCounts.menuImages,
    },
    {
      value: 'ai-avatar',
      label: 'AI Avatars',
      icon: <Bot className="h-4 w-4" />,
      count: assetCounts.aiAvatars,
    },
    {
      value: 'general',
      label: 'General Media',
      icon: <FolderOpen className="h-4 w-4" />,
      count: assetCounts.general,
    },
  ];

  const handleValueChange = (value: string) => {
    const assetType = value as 'all' | 'menu-item' | 'ai-avatar' | 'general';
    
    setUnifiedAssetType(assetType);

    // Announce filter change to screen readers
    const selectedOption = assetTypeOptions.find(opt => opt.value === assetType);
    if (selectedOption) {
      announceFilterChange('Asset Type', selectedOption.label, selectedOption.count);
    }

    onFilterChange();
  };

  return (
    <RadioGroup
      value={unifiedFilters.selectedAssetType}
      onValueChange={handleValueChange}
      className="space-y-2"
      aria-label="Filter media by asset type"
    >
      {assetTypeOptions.map((option) => {
        const isSelected = unifiedFilters.selectedAssetType === option.value;
        
        return (
          <div key={option.value} className="relative">
            <div
              onClick={() => handleValueChange(option.value)}
              className={`
                flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                hover:scale-[1.02] hover:shadow-md
                ${
                  isSelected
                    ? 'bg-purple-500/10 border-purple-500/50 shadow-sm shadow-purple-500/10'
                    : 'bg-background/30 border-border/30 hover:border-purple-500/30 hover:bg-purple-500/5'
                }
              `}
            >
              <div className="flex items-center gap-3 flex-1">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="border-2 transition-all"
                  aria-describedby={`${option.value}-count`}
                />
                <Label
                  htmlFor={option.value}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span
                    className={`
                      transition-all duration-200
                      ${isSelected ? 'text-purple-400 scale-110' : 'text-muted-foreground group-hover:text-purple-300'}
                    `}
                    aria-hidden="true"
                  >
                    {option.icon}
                  </span>
                  <span
                    className={`
                      text-sm font-medium transition-colors duration-200
                      ${isSelected ? 'text-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    {option.label}
                  </span>
                </Label>
              </div>
              
              <Badge
                variant="secondary"
                className={`
                  ml-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-muted/50 text-muted-foreground border-border/30'
                  }
                `}
                id={`${option.value}-count`}
                aria-label={`${option.count} ${option.label.toLowerCase()}`}
              >
                {option.count}
              </Badge>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
