import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Camera, FolderOpen, Trash2, Image, Square, Monitor } from 'lucide-react';
import { MenuItemMediaSelectorDialog } from 'components/MenuItemMediaSelectorDialog';
import { ImageUploader, type ImageUploadResult } from 'components/ImageUploader';
import type { MediaItem } from 'utils/mediaLibraryUtils';
import { toast } from 'sonner';
import { OptimizedImage } from 'components/OptimizedImage';

export interface MediaData {
  image_url: string;
  image_url_widescreen: string;
  image_asset_id: string;
  image_widescreen_asset_id: string;
  preferred_aspect_ratio: string;
}

export interface Props {
  media: MediaData;
  onChange: (mediaData: MediaData) => void;
  menuItemName?: string;
}

export function MenuItemMedia({ media, onChange, menuItemName }: Props) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // Get the primary image based on preferred aspect ratio
  const getPrimaryImage = () => {
    const ratio = media.preferred_aspect_ratio || 'square';
    if (ratio === 'landscape') {
      return {
        url: media.image_url_widescreen,
        asset_id: media.image_widescreen_asset_id,
        type: 'widescreen'
      };
    }
    return {
      url: media.image_url,
      asset_id: media.image_asset_id,
      type: 'square'
    };
  };

  // Handle successful image upload from ImageUploader
  const handleUploadSuccess = (result: ImageUploadResult) => {
    const ratio = media.preferred_aspect_ratio || 'square';

    if (ratio === 'landscape') {
      // Set as widescreen image
      onChange({
        ...media,
        image_url_widescreen: result.file_url,
        image_widescreen_asset_id: result.asset_id
      });
    } else {
      // Set as square image (default)
      onChange({
        ...media,
        image_url: result.file_url,
        image_asset_id: result.asset_id
      });
    }

    toast.success('Image uploaded and optimized successfully!');
  };

  // Handle media selection from MenuItemMediaSelectorDialog
  const handleMediaSelect = (selectedAssets: MediaItem[]) => {
    // Dialog is in single-select mode, so we expect one asset
    if (selectedAssets.length === 0) {
      return;
    }

    const selectedMedia = selectedAssets[0];
    const ratio = media.preferred_aspect_ratio || 'square';
    
    if (ratio === 'landscape') {
      // Set as widescreen image
      onChange({
        ...media,
        image_url_widescreen: selectedMedia.url || '',
        image_widescreen_asset_id: selectedMedia.id || ''
      });
    } else {
      // Set as square image (default for square and portrait)
      onChange({
        ...media,
        image_url: selectedMedia.url || '',
        image_asset_id: selectedMedia.id || ''
      });
    }
    
    setShowMediaSelector(false);
    toast.success('Image selected successfully!');
  };

  // Handle removing the primary image
  const handleRemoveImage = () => {
    const ratio = media.preferred_aspect_ratio || 'square';
    
    if (ratio === 'landscape') {
      onChange({
        ...media,
        image_url_widescreen: '',
        image_widescreen_asset_id: ''
      });
    } else {
      onChange({
        ...media,
        image_url: '',
        image_asset_id: ''
      });
    }
  };

  // Handle aspect ratio preference change
  const handleAspectRatioChange = (ratio: string) => {
    onChange({
      ...media,
      preferred_aspect_ratio: ratio
    });
  };

  // Open media selector
  const openMediaSelector = () => {
    setShowMediaSelector(true);
  };
  
  const primaryImage = getPrimaryImage();

  return (
    <>
      <Card className="bg-[rgba(26,26,26,0.8)] backdrop-blur-md border border-white/[0.07] rounded-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0EBAB1]"
              aria-hidden="true"
            >
              <Camera className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <CardTitle
              className="text-lg font-medium flex items-center gap-2 text-white"
              id="menu-item-media-heading"
            >
              Images & Media
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Aspect Ratio Preference - Moved to top for better UX */}
          <fieldset className="space-y-3">
            <legend className="sr-only">Image aspect ratio preference for menu item display</legend>
            <Label
              className="text-sm font-medium text-gray-400"
              id="aspect-ratio-label"
            >
              Aspect Ratio Preference
            </Label>
            <RadioGroup 
              value={media.preferred_aspect_ratio || 'square'} 
              onValueChange={handleAspectRatioChange}
              className="flex flex-col space-y-2"
              aria-labelledby="aspect-ratio-label"
              aria-describedby="aspect-ratio-help"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="square" id="square" />
                <Label htmlFor="square" className="flex items-center space-x-2 cursor-pointer">
                  <Square className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-white">Square</span>
                  <span className="text-xs text-gray-500" aria-hidden="true">Best for menu cards</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="flex items-center space-x-2 cursor-pointer">
                  <Monitor className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-white">Wide</span>
                  <span className="text-xs text-gray-500" aria-hidden="true">Best for hero images</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="flex items-center space-x-2 cursor-pointer">
                  <Image className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-white">Auto</span>
                  <span className="text-xs text-gray-500" aria-hidden="true">Adapts to content</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-500" id="aspect-ratio-help">
              This determines which format is preferred when displaying the image.
            </p>
          </fieldset>

          {/* Upload Section with new ImageUploader */}
          <div className="space-y-4" role="group" aria-labelledby="menu-item-media-heading">
            {/* Image Preview Area */}
            {primaryImage.url ? (
              <div
                className="relative border border-white/[0.07] rounded-lg p-4 bg-surface-tertiary"
                role="region"
                aria-labelledby="image-preview-label"
              >
                <div className="flex items-center gap-4">
                  <OptimizedImage
                    fallbackUrl={primaryImage.url}
                    metadata={media}
                    variant="square"
                    alt="Current menu item image preview"
                    className="w-24 h-24 object-cover rounded border"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      id="image-preview-label"
                      className="text-sm font-medium truncate text-white"
                    >
                      Current Image
                    </p>
                    {primaryImage.asset_id && (
                      <p className="text-xs text-gray-500">
                        <span className="sr-only">Asset ID: </span>
                        <span aria-hidden="true">ID: {primaryImage.asset_id.substring(0, 8)}...</span>
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full flex-shrink-0"
                    onClick={handleRemoveImage}
                    aria-label="Remove current menu item image"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : null}

            {/* New ImageUploader Component */}
            <ImageUploader
              onUploadSuccess={handleUploadSuccess}
              currentImageUrl={primaryImage.url}
              assetCategory="menu-item"
              menuItemName={menuItemName}
              label={primaryImage.url ? 'Replace Image' : 'Upload Image'}
              helperText="Drag & drop or click to upload. Max 5MB. Auto-optimized for web."
            />

            {/* Browse Media Library Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-surface-tertiary border-[rgba(124,58,237,0.3)] text-white hover:bg-white/[0.05]"
                onClick={openMediaSelector}
                aria-label="Browse media library to select existing image"
                aria-describedby="browse-button-hint"
              >
                <FolderOpen className="w-4 h-4 mr-2" aria-hidden="true" />
                Browse Media Library
              </Button>
              <span id="browse-button-hint" className="sr-only">
                Open the media library to select from previously uploaded images
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Selector Dialog - NEW MenuItemMediaSelectorDialog */}
      <MenuItemMediaSelectorDialog
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onConfirm={handleMediaSelect}
        selectionMode="single"
        currentAssetId={primaryImage.asset_id}
      />
    </>
  );
}
