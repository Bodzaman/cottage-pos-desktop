import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Star, Trash2, AlertCircle, Image, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getAllPresets, 
  deleteUserPreset, 
  updateUserPreset,
  FilterPreset 
} from 'utils/filterPresets';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Icon mapping for presets
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertCircle,
  Image,
  Star,
  Calendar,
  Trash2,
  Sparkles,
};

function getPresetIcon(iconName: string) {
  const IconComponent = ICON_MAP[iconName];
  if (IconComponent) {
    return <IconComponent className="h-4 w-4" />;
  }
  // Fallback to emoji
  return <span className="text-sm">{iconName}</span>;
}

interface FilterPresetsPanelProps {
  /** Control expansion state from parent */
  expanded?: boolean;
  /** Callback when expansion changes */
  onExpandedChange?: (expanded: boolean) => void;
}

export function FilterPresetsPanel({ 
  expanded: controlledExpanded,
  onExpandedChange,
}: FilterPresetsPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [presets, setPresets] = useState<FilterPreset[]>(getAllPresets());
  
  const { applyFilters } = useMediaLibraryStore();

  // Use controlled or internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const handleExpandedChange = (newExpanded: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const builtInPresets = presets.filter(p => p.isDefault);
  const userPresets = presets.filter(p => !p.isDefault);

  /**
   * Apply a preset's filters
   */
  const handleApplyPreset = (preset: FilterPreset) => {
    applyFilters(preset.filters);
    toast.success(`Applied "${preset.name}"`);
  };

  /**
   * Toggle star on user preset
   */
  const handleToggleStar = (presetId: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent applying preset
    
    const success = updateUserPreset(presetId, { isStarred: !currentStarred });
    if (success) {
      setPresets(getAllPresets());
    }
  };

  /**
   * Delete user preset
   */
  const handleDeletePreset = (presetId: string, presetName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent applying preset
    
    const success = deleteUserPreset(presetId);
    if (success) {
      setPresets(getAllPresets());
      toast.success(`Deleted "${presetName}"`);
    } else {
      toast.error('Failed to delete preset');
    }
  };

  return (
    <div className="border-b border-border pb-4">
      {/* Header with collapse toggle */}
      <button
        onClick={() => handleExpandedChange(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        aria-expanded={isExpanded}
        aria-controls="filter-presets-content"
      >
        <span>Filter Presets</span>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {/* Built-in Presets */}
              <div className="space-y-1.5">
                {builtInPresets.map(preset => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full justify-start text-left hover:bg-purple-500/10 hover:border-purple-500 transition-all"
                  >
                    <span className="mr-2">{getPresetIcon(preset.icon)}</span>
                    <span className="text-sm">{preset.name}</span>
                  </Button>
                ))}
              </div>

              {/* User Presets (if any) */}
              {userPresets.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Your Presets</p>
                  {userPresets.map(preset => (
                    <div
                      key={preset.id}
                      className="group flex items-center gap-1.5"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyPreset(preset)}
                        className="flex-1 justify-start text-left hover:bg-purple-500/10 hover:border-purple-500 transition-all"
                      >
                        <span className="mr-2">{getPresetIcon(preset.icon)}</span>
                        <span className="text-sm">{preset.name}</span>
                        {preset.isStarred && (
                          <Star className="h-3 w-3 ml-auto text-yellow-500 fill-yellow-500" />
                        )}
                      </Button>
                      
                      {/* Star toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggleStar(preset.id, preset.isStarred || false, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-8 w-8"
                      >
                        <Star 
                          className={`h-3.5 w-3.5 ${
                            preset.isStarred 
                              ? 'text-yellow-500 fill-yellow-500' 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      </Button>
                      
                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeletePreset(preset.id, preset.name, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-8 w-8 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state for user presets */}
              {userPresets.length === 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  No saved presets yet. Apply filters and save them!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
