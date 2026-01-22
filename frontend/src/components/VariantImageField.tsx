/**
 * VariantImageField Component
 * 
 * Manages variant-level image with 3-state inheritance model:
 * - inherited: Uses base item image (dimmed opacity)
 * - custom: Unique image for this variant (normal style)
 * - none: No image (empty state)
 * 
 * Integrates with MediaSelector for image selection/upload
 * Extracted from MenuItemVariants.tsx to improve maintainability
 * Modernized with Tailwind classes and purple/silver/turquoise theme (Phase 3, Task MYA-1441)
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImagePlus, Image as ImageIcon, Upload, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploader, type ImageUploadResult } from 'components/ImageUploader';
import { OptimizedImage } from 'components/OptimizedImage';
import { colors } from 'utils/designSystem';

interface VariantImageFieldProps {
  /** Current image URL */
  imageUrl?: string;
  
  /** Current image asset ID */
  imageAssetId?: string;
  
  /** Image state: inherited, custom, or none */
  state: 'inherited' | 'custom' | 'none';
  
  /** Base item image URL for inherited state */
  baseImage?: string;
  
  /** Base item image asset ID for inherited state */
  baseImageAssetId?: string;
  
  /** Callback when state changes */
  onStateChange: (state: 'inherited' | 'custom' | 'none') => void;
  
  /** Callback to open media selector */
  onOpenMediaSelector: () => void;
  
  /** Callback for successful upload with optimized image data */
  onUploadSuccess: (result: ImageUploadResult) => void;
  
  /** Variant index for accessibility IDs */
  variantIndex: number;
  
  /** Optional error message */
  error?: string;
  
  /** Disable all interactions */
  disabled?: boolean;
  
  /** Upload in progress */
  isUploading?: boolean;
}

export const VariantImageField: React.FC<VariantImageFieldProps> = ({
  imageUrl,
  imageAssetId,
  state,
  baseImage,
  baseImageAssetId,
  onStateChange,
  onOpenMediaSelector,
  onUploadSuccess,
  variantIndex,
  error,
  disabled = false,
  isUploading = false,
}) => {
  const isInherited = state === 'inherited';
  const isNone = state === 'none';
  const displayImage = isInherited ? baseImage : imageUrl;
  const hasImage = Boolean(displayImage);
  
  return (
    <div className="space-y-4">
      <Separator className="bg-gray-700" role="separator" />
      
      {/* Section Header */}
      <div className="flex items-center space-x-2" role="heading" aria-level={4} id={`variant-${variantIndex}-image-heading`}>
        <div 
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-turquoise-900/20 border border-turquoise-500/30"
          aria-hidden="true"
        >
          <ImageIcon className="h-3 w-3 text-turquoise-400" />
        </div>
        <Label className="text-gray-200 text-sm font-medium">
          Variant Image
        </Label>
        <Badge 
          variant="outline" 
          className="text-xs bg-silver-900/20 border-silver-500/30 text-silver-400"
          aria-label="Optional field"
        >
          Optional
        </Badge>
      </div>
      
      {/* Image Container */}
      <div 
        className={cn(
          'relative p-4 rounded-lg space-y-3 bg-gray-900/50 border',
          error ? 'border-red-500' : 'border-gray-700'
        )}
        role="group"
        aria-labelledby={`variant-${variantIndex}-image-heading`}
      >
        {/* Upload Buttons (shown when no image) */}
        {!hasImage && (
          <div className="flex gap-3 mb-4" role="toolbar" aria-label="Image upload actions">
            <div className="relative flex-1">
              <ImageUploader
                onUploadSuccess={onUploadSuccess}
                currentImageUrl={imageUrl}
                assetCategory="menu-item-variant"
                label={imageUrl ? 'Replace Variant Image' : 'Upload Variant Image'}
                helperText="Drag & drop or click to upload. Max 5MB. Auto-optimized for web."
                disabled={disabled || isUploading}
              />
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="bg-gray-900 border-purple-500/30 text-gray-200 hover:bg-purple-500/10"
              onClick={onOpenMediaSelector}
              disabled={disabled || isUploading}
              aria-label="Browse media library to select existing image"
            >
              <FolderOpen className="w-4 h-4 mr-2" aria-hidden="true" />
              Browse Media Library
            </Button>
          </div>
        )}
        
        <div className="relative">
          {/* Image Preview or Empty State */}
          {hasImage ? (
            <div 
              className={cn(
                'relative h-48 rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity border-gray-700',
                isInherited && 'opacity-60'
              )}
              onClick={!disabled && !isInherited ? onOpenMediaSelector : undefined}
              role="button"
              tabIndex={!disabled && !isInherited ? 0 : -1}
              aria-label={isInherited ? 'Inherited image from base item' : 'Click to change variant image'}
              onKeyDown={(e) => {
                if (!disabled && !isInherited && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onOpenMediaSelector();
                }
              }}
            >
              <img
                src={displayImage}
                alt={`Variant ${variantIndex + 1} preview`}
                className={cn(
                  'w-full h-full object-cover',
                  isInherited && 'brightness-75'
                )}
              />
              {isInherited && (
                <div 
                  className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium bg-purple-500/80 text-white"
                  aria-hidden="true"
                >
                  ✨ Inherited
                </div>
              )}
            </div>
          ) : (
            <div 
              className="h-48 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center"
            >
              <ImagePlus className="h-8 w-8 mx-auto mb-2 text-gray-500" aria-hidden="true" />
              <p className="text-sm text-gray-400">No image selected</p>
              <p className="text-xs text-gray-500 mt-1">Drag & drop an image or use the buttons above</p>
            </div>
          )}
          
          {/* State transition action buttons */}
          <div 
            className="absolute right-2 top-2 flex space-x-1"
            role="toolbar"
            aria-label="Image state actions"
          >
            {state !== 'inherited' && baseImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStateChange('inherited')}
                className="h-6 px-2 text-xs hover:bg-purple-500/10 text-purple-400"
                aria-label="Use base item image"
                title="Inherit base image"
                disabled={disabled}
              >
                <span aria-hidden="true">✨</span>
              </Button>
            )}
            {state !== 'custom' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onStateChange('custom');
                  if (!hasImage) {
                    // Auto-open media selector when switching to custom with no image
                    setTimeout(onOpenMediaSelector, 100);
                  }
                }}
                className="h-6 px-2 text-xs hover:bg-silver-500/10 text-silver-400"
                aria-label="Set custom image for variant"
                title="Set custom image"
                disabled={disabled}
              >
                <span aria-hidden="true">📸</span>
              </Button>
            )}
            {state !== 'none' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStateChange('none')}
                className="h-6 px-2 text-xs hover:bg-red-500/10 text-gray-500"
                aria-label="Remove image from variant"
                title="Remove image"
                disabled={disabled}
              >
                <span aria-hidden="true">×</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* State indicator helper text */}
        <div className="space-y-1">
          {isInherited && baseImage && (
            <p className="text-xs text-purple-400" aria-hidden="true">
              🖼️ Inheriting base item image
            </p>
          )}
          {isInherited && !baseImage && (
            <p className="text-xs text-gray-500" aria-hidden="true">
              💡 No base image to inherit
            </p>
          )}
          {state === 'custom' && (
            <p className="text-xs text-silver-400" aria-hidden="true">
              🎯 Custom image for this variant
            </p>
          )}
          {isNone && (
            <p className="text-xs text-gray-500" aria-hidden="true">
              — This variant has no image
            </p>
          )}
          
          {/* Error message */}
          {error && (
            <p 
              id={`variant-${variantIndex}-image-error`}
              className="text-xs text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        
        {/* Hidden status text for screen readers */}
        <p 
          id={`variant-${variantIndex}-image-state`}
          className="sr-only"
        >
          {isInherited && baseImage && 'Image is inherited from base item. Use the customize button to set a different image.'}
          {isInherited && !baseImage && 'No base item image to inherit.'}
          {state === 'custom' && 'Custom image for this variant.'}
          {isNone && 'No image set for this variant.'}
        </p>
      </div>
    </div>
  );
};
