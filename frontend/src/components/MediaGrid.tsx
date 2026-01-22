import React from 'react';
import { MediaItem } from '../utils/mediaLibraryUtils';
import { MediaCard } from './MediaCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ImageOffIcon } from 'lucide-react';
import { colors } from '../utils/designSystem';

interface MediaGridProps {
  items: MediaItem[];
  isLoading?: boolean;
  onUpdate?: () => void;
  layout?: 'grid' | 'list';
  /** Selection mode: 'pick' for single selection, null for normal browsing */
  selectionMode?: 'pick' | null;
  /** Callback when an asset is selected in 'pick' mode */
  onAssetSelect?: (item: MediaItem) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ 
  items, 
  isLoading = false, 
  onUpdate, 
  layout = 'grid',
  selectionMode = null,
  onAssetSelect,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-56 w-full bg-gray-800" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-900/50 rounded-lg border border-dashed border-gray-700">
        <ImageOffIcon className="mx-auto h-16 w-16 text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-white">No Media Found</h3>
        <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>
        {onUpdate && (
          <Button onClick={onUpdate} className="mt-6" variant="outline">
            Refresh Library
          </Button>
        )}
      </div>
    );
  }

  if (layout === 'list') {
      // Basic list view for now, can be expanded later
      return (
          <div className="space-y-2">
              {items.map(item => (
                  <div key={item.id} className="bg-gray-800/50 p-2 rounded-md flex items-center">
                     <p className="text-white">{item.name}</p>
                  </div>
              ))}
          </div>
      )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} onUpdate={onUpdate || (() => {})} />
      ))}
    </div>
  );
};
