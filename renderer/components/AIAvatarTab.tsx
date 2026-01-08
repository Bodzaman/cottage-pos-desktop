import React from 'react';
import { Loader2 } from 'lucide-react';
import { MediaGalleryGrid } from 'components/MediaGalleryGrid';
import { MediaItem } from 'utils/mediaLibraryUtils';

interface AIAvatarTabProps {
  allAvatars: MediaAsset[];
  isLoading?: boolean;
  onUpdate?: () => void;
  /** Selection mode: 'pick' to select single asset, null for normal browsing */
  selectionMode?: 'pick' | null;
  /** Callback when an asset is selected in 'pick' mode */
  onAssetSelect?: (asset: MediaAsset) => void;
}

export default function AIAvatarTab({
  allAvatars,
  isLoading = false,
  onUpdate,
  selectionMode = null,
  onAssetSelect,
}: AIAvatarTabProps) {
  // Separate categorized vs uncategorized avatars
  const categorizedAvatars = React.useMemo(() => {
    return allAvatars.filter((asset) => asset.linked_items && asset.linked_items.length > 0);
  }, [allAvatars]);

  const uncategorizedAvatars = React.useMemo(() => {
    return allAvatars.filter((asset) => !asset.linked_items || asset.linked_items.length === 0);
  }, [allAvatars]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading avatars...</p>
        </div>
      </div>
    );
  }

  // Transform MediaAsset[] to MediaItem[] for gallery grid
  const transformAvatars = (avatars: MediaAsset[]): MediaItem[] =>
    avatars.map((asset) => ({
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
    }));

  return (
    <div className="space-y-8">
      {/* Categorized Avatars Section */}
      {categorizedAvatars.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Assigned Avatars</h3>
            <p className="text-sm text-muted-foreground">Avatars linked to AI staff members</p>
          </div>
          <MediaGalleryGrid
            items={transformAvatars(categorizedAvatars)}
            isLoading={false}
            onUpdate={onUpdate}
            mode={selectionMode === 'pick' ? 'selection' : 'view'}
            selectionType="single"
            onAssetSelect={onAssetSelect}
            emptyMessage="No assigned avatars found"
          />
        </div>
      )}

      {/* Uncategorized Avatars Section */}
      {uncategorizedAvatars.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Available Avatars</h3>
            <p className="text-sm text-muted-foreground">Avatars not yet assigned to AI staff</p>
          </div>
          <MediaGalleryGrid
            items={transformAvatars(uncategorizedAvatars)}
            isLoading={false}
            onUpdate={onUpdate}
            mode={selectionMode === 'pick' ? 'selection' : 'view'}
            selectionType="single"
            onAssetSelect={onAssetSelect}
            emptyMessage="No available avatars found"
          />
        </div>
      )}

      {/* Empty State - No Avatars at All */}
      {categorizedAvatars.length === 0 && uncategorizedAvatars.length === 0 && (
        <MediaGalleryGrid
          items={[]}
          isLoading={false}
          emptyMessage="No AI avatars found"
        />
      )}
    </div>
  );
}
