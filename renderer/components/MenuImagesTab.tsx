import React from 'react';
import { Loader2 } from 'lucide-react';
import { MediaGalleryGrid } from 'components/MediaGalleryGrid';
import { MenuSection } from '../utils/mediaHierarchyUtils';
import { MediaAsset } from '../utils/mediaLibraryUtils';

interface MenuImagesTabProps {
  sections: MenuSection[];
  allMenuImages: MediaAsset[];
  isLoading?: boolean;
  onUpdate?: () => void;
}

/**
 * MenuImagesTab - Display menu images filtered by sidebar
 * 
 * IMPORTANT: This component NO LONGER filters data itself.
 * It receives already-filtered results from MediaLibraryContent,
 * which applies the unified filter logic based on sidebar selections.
 * 
 * The sidebar's HierarchyFilter replaces the old SectionCategorySelector.
 */
export default function MenuImagesTab({
  sections,
  allMenuImages,
  isLoading = false,
  onUpdate,
}: MenuImagesTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading menu images...</p>
        </div>
      </div>
    );
  }

  // Transform MediaAsset[] to MediaItem[] for gallery grid
  const menuItems = allMenuImages.map((asset) => ({
    id: asset.id,
    name: asset.file_name || '',
    friendlyName: asset.friendly_name || asset.file_name || '',
    size: asset.file_size || 0,
    url: asset.url || '',
    updatedAt: asset.upload_date || new Date().toISOString(),
    type: asset.type || 'image',
    tags: asset.tags || [],
    usage: asset.usage,
    description: asset.description,
    asset_category: asset.asset_category,
  }));

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      {allMenuImages.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing <span className="font-semibold text-foreground">{allMenuImages.length}</span>{' '}
            {allMenuImages.length === 1 ? 'image' : 'images'}
          </span>
        </div>
      )}

      {/* Media Gallery Grid */}
      <MediaGalleryGrid
        items={menuItems}
        isLoading={false}
        onUpdate={onUpdate}
        mode="view"
        emptyMessage="No menu images match your filters"
      />
    </div>
  );
}
