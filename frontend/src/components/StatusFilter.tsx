import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, Link2, CheckCircle2, Users, AlertTriangle } from 'lucide-react';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { announceFilterChange } from 'utils/announceToScreenReader';

interface StatusFilterProps {
  /** Callback to trigger gallery refresh after filter change */
  onFilterChange: () => void;
}

type StatusOption = {
  id: 'uncategorized' | 'linked' | 'inUse' | 'multiUse' | 'orphaned';
  label: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  storeKey: 'showUncategorized' | 'showLinked' | 'showInUse' | 'showMultiUse' | 'showOrphaned';
};

/**
 * StatusFilter - Checkbox group for status-based filtering
 * 
 * Features:
 * - Multiple independent selections (checkboxes)
 * - Five status options: Uncategorized, Linked, In Use, Multi-Use, Orphaned
 * - Orange highlight for "Uncategorized" (special status)
 * - Updates individual store flags
 */
export function StatusFilter({ onFilterChange }: StatusFilterProps) {
  const {
    unifiedFilters,
    setShowUncategorized,
    setShowLinked,
    setShowInUse,
    setShowMultiUse,
    setShowOrphaned,
  } = useMediaLibraryStore();

  const statusOptions: StatusOption[] = [
    {
      id: 'uncategorized',
      label: 'Uncategorized',
      description: 'Assets without section/category',
      icon: <AlertCircle className="h-4 w-4" />,
      iconColor: 'text-orange-400',
      storeKey: 'showUncategorized',
    },
    {
      id: 'linked',
      label: 'Linked',
      description: 'Assets linked to menu items',
      icon: <Link2 className="h-4 w-4" />,
      iconColor: 'text-blue-400',
      storeKey: 'showLinked',
    },
    {
      id: 'inUse',
      label: 'In Use',
      description: 'Assets currently in use',
      icon: <CheckCircle2 className="h-4 w-4" />,
      iconColor: 'text-green-400',
      storeKey: 'showInUse',
    },
    {
      id: 'multiUse',
      label: 'Multi-Use',
      description: 'Popular assets used in 2+ items',
      icon: <Users className="h-4 w-4" />,
      iconColor: 'text-purple-400',
      storeKey: 'showMultiUse',
    },
    {
      id: 'orphaned',
      label: 'Orphaned',
      description: 'Linked to deleted/inactive items',
      icon: <AlertTriangle className="h-4 w-4" />,
      iconColor: 'text-red-400',
      storeKey: 'showOrphaned',
    },
  ];

  const handleCheckboxChange = (
    option: StatusOption,
    checked: boolean
  ) => {
    // Update the appropriate store flag
    switch (option.storeKey) {
      case 'showUncategorized':
        setShowUncategorized(checked);
        break;
      case 'showLinked':
        setShowLinked(checked);
        break;
      case 'showInUse':
        setShowInUse(checked);
        break;
      case 'showMultiUse':
        setShowMultiUse(checked);
        break;
      case 'showOrphaned':
        setShowOrphaned(checked);
        break;
    }
    
    // Announce filter change to screen readers
    announceFilterChange(
      'Status',
      `${option.label} ${checked ? 'enabled' : 'disabled'}`
    );
    
    onFilterChange();
  };

  return (
    <div className="space-y-3" role="group" aria-label="Filter media by status">
      {statusOptions.map((option) => {
        const isChecked = unifiedFilters[option.storeKey];

        return (
          <div
            key={option.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
              hover:scale-[1.01] hover:shadow-md
              ${
                isChecked
                  ? 'bg-purple-500/10 border-purple-500/50 shadow-sm shadow-purple-500/10'
                  : 'bg-background/30 border-border/30 hover:border-purple-500/30 hover:bg-purple-500/5'
              }
            `}
          >
            <Checkbox
              id={option.id}
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleCheckboxChange(option, checked as boolean)
              }
              className="mt-0.5 transition-all duration-200"
              aria-describedby={`${option.id}-description`}
            />
            <div className="flex-1">
              <Label
                htmlFor={option.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className={`${option.iconColor} transition-transform duration-200 hover:scale-110`} aria-hidden="true">{option.icon}</span>
                <span
                  className={`
                    text-sm font-medium transition-colors duration-200
                    ${isChecked ? 'text-foreground' : 'text-muted-foreground'}
                  `}
                >
                  {option.label}
                </span>
              </Label>
              <p
                id={`${option.id}-description`}
                className={`
                  text-xs mt-1 transition-colors duration-200
                  ${isChecked ? 'text-muted-foreground' : 'text-muted-foreground/60'}
                `}
              >
                {option.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
