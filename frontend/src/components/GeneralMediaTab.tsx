import React from 'react';
import { Loader2 } from 'lucide-react';
import { MediaGalleryGrid } from 'components/MediaGalleryGrid';
import { MediaAsset } from 'utils/mediaLibraryUtils';

interface GeneralMediaTabProps {
  allGeneralMedia: MediaAsset[];
  isLoading?: boolean;
  onUpdate?: () => void;
}

export default function GeneralMediaTab({
  allGeneralMedia,
  isLoading = false,
  onUpdate,
}: GeneralMediaTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading media...</p>
        </div>
      </div>
    );
  }

  // Transform MediaAsset[] to MediaItem[] for gallery grid
  const generalItems = allGeneralMedia.map((asset) => ({
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">General Media</h3>
        <p className="text-sm text-muted-foreground">
          Marketing materials, banners, and other general-purpose media
        </p>
      </div>

      {/* Media Gallery Grid */}
      <MediaGalleryGrid
        items={generalItems}
        isLoading={false}
        onUpdate={onUpdate}
        mode="view"
        emptyMessage="No general media files found"
      />
    </div>
  );
}
