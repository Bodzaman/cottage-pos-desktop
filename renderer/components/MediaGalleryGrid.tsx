import React from 'react';
import { MediaItem } from 'utils/mediaLibraryUtils';
import { MediaCard } from 'components/MediaCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen } from 'lucide-react';

interface MediaGalleryGridProps {
  /** Array of media items to display */
  items: MediaItem[];
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Callback after update operations (delete, edit, etc.) */
  onUpdate?: () => void;
  
  /** Display mode: 'view' for normal browsing, 'selection' for multi-select */
  mode?: 'view' | 'selection';
  
  /** Selection mode type: 'multi' for checkboxes, 'single' for click-to-select */
  selectionType?: 'multi' | 'single';
  
  /** Callback when an asset is selected (single-select mode) */
  onAssetSelect?: (item: MediaItem) => void;
  
  /** Custom empty state message */
  emptyMessage?: string;
  
  /** Show skeleton count when loading */
  skeletonCount?: number;
}

/**
 * MediaGalleryGrid - Unified, reusable grid component for displaying media assets
 * 
 * Features:
 * - Two modes: 'view' (normal browsing) and 'selection' (multi-select)
 * - Responsive grid layout (2-5 columns based on screen size)
 * - Loading skeleton states
 * - Empty state display
 * - Integrates with MediaCard for consistent card rendering
 * 
 * Used by:
 * - MediaLibrary page tabs (MenuImagesTab, AIAvatarTab, GeneralMediaTab)
 * - MenuItemMediaSelectorDialog (Phase 3)
 * - Any future media selection interfaces
 */
export function MediaGalleryGrid({
  items,
  isLoading = false,
  onUpdate,
  mode = 'view',
  selectionType = 'multi',
  onAssetSelect,
  emptyMessage = 'No assets found',
  skeletonCount = 10,
}: MediaGalleryGridProps) {
  // Loading State
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(skeletonCount)].map((_, i) => (
          <Skeleton key={i} className="h-56 w-full bg-card/50" />
        ))}
      </div>
    );
  }

  // Empty State
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Grid Display
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          onUpdate={onUpdate || (() => {})}
          mode={mode}
          selectionType={selectionType}
          onAssetSelect={onAssetSelect}
        />
      ))}
    </div>
  );
}
