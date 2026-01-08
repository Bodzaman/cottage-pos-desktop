import React, { useState, useRef } from 'react';
import { ImagePlus, FileVideo, X, Crop, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMountedRef, useSafeTimeout } from 'utils/safeHooks';
import { getCroppedImg } from 'utils/imageUtils';
import Cropper from 'react-easy-crop';
import { MediaSelectorModal } from './MediaSelectorModal';

export interface Media {
  id?: string;          // ID from the media_assets table
  url: string | null;   // URL to the media
  name?: string;        // Display name for the media
  type: 'image' | 'video' | null;  // Type of media
  file?: File;          // File object if newly uploaded
  aspectRatio?: string; // Square, widescreen, etc.
  width?: number;       // Image/video width in pixels
  height?: number;      // Image/video height in pixels
  tags?: string[];      // Associated tags for categorization
  size?: number;        // File size in bytes
  description?: string; // Description of the media
  uploadDate?: string;  // When the media was uploaded
  mimeType?: string;    // Detailed file type (image/jpeg, video/mp4)
  fileExtension?: string; // File extension (jpg, mp4)
  isUploading?: boolean; // Flag to track upload status
  uploadProgress?: number; // Progress of upload
}

interface MediaHandlingProps {
  primary?: Media;
  secondary?: Media;
  allowedTypes?: ('image' | 'video')[];
  aspectRatio?: 'square' | 'widescreen' | 'auto';
  onMediaUpdate?: (primary?: Media, secondary?: Media) => void;
  maxFileSize?: number; // in MB
  className?: string;
  showSecondary?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function MediaHandling({
  primary,
  secondary,
  allowedTypes = ['image', 'video'],
  aspectRatio = 'auto',
  onMediaUpdate,
  maxFileSize = 10,
  className = '',
  showSecondary = false,
  primaryLabel = 'Primary Media',
  secondaryLabel = 'Secondary Media'
}: MediaHandlingProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  
  const mountedRef = useMountedRef();
  const { setSafeTimeout } = useSafeTimeout();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to update media states
  const setPrimary = (media?: Media) => {
    onMediaUpdate?.(media, secondary);
  };

  const setSecondary = (media?: Media) => {
    onMediaUpdate?.(primary, media);
  };

  // Handle file selection
  const handleFileSelect = (file: File, isSecondary = false) => {
    if (!mountedRef.current) return;
    
    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    // Validate file type
    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
    if (!fileType || !allowedTypes.includes(fileType)) {
      toast.error(`Only ${allowedTypes.join(' and ')} files are allowed`);
      return;
    }

    const url = URL.createObjectURL(file);
    const media: Media = {
      url,
      type: fileType,
      file,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      fileExtension: file.name.split('.').pop()?.toLowerCase(),
      isUploading: false,
      uploadProgress: 0,
    };

    // If it's an image and we need a specific aspect ratio, trigger cropping
    if (fileType === 'image' && aspectRatio !== 'auto') {
      setOriginalImage(url);
      setIsCropping(true);
      return;
    }

    // Otherwise, set the media directly
    if (isSecondary) {
      setSecondary(media);
    } else {
      setPrimary(media);
    }

    toast.success(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} selected successfully`);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent, isSecondary = false) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0], isSecondary);
    }
  };

  // Handle click to select file
  const handleClick = (isSecondary = false) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-target', isSecondary ? 'secondary' : 'primary');
      fileInputRef.current.click();
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isSecondary = e.target.getAttribute('data-target') === 'secondary';
      handleFileSelect(file, isSecondary);
    }
    // Reset input
    e.target.value = '';
  };

  // Handle crop completion
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Apply crop with safe timeout handling
  const applyCrop = async () => {
    if (!originalImage || !croppedAreaPixels || !mountedRef.current) return;

    setIsUploading(true);
    setUploadProgress(30);

    try {
      // Generate cropped image file with improved accuracy
      const croppedImageFile = await getCroppedImg(
        originalImage,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        'file',
        `cropped-${Date.now()}.jpg`,
        // Improved quality settings
        0.95
      ) as File;

      if (!mountedRef.current) return;
      
      setUploadProgress(70); // Update progress after cropping

      // Create media object with more details
      const croppedMedia: Media = {
        url: URL.createObjectURL(croppedImageFile),
        type: 'image',
        file: croppedImageFile,
        name: croppedImageFile.name,
        fileExtension: 'jpg',
        size: croppedImageFile.size,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
        aspectRatio: aspectRatio === 'square' ? 'square' : 'widescreen',
      };

      // Update the appropriate media state
      setPrimary(croppedMedia);
      toast.success('Image cropped successfully');

      setUploadProgress(100); // Complete progress
      setIsCropping(false);
      setOriginalImage(null);

      // Use safe timeout for cleanup with proper mounting check
      setSafeTimeout(() => {
        if (mountedRef.current) {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }, 500);

    } catch (error) {
      console.error('Error applying crop:', error);
      if (mountedRef.current) {
        toast.error('Failed to crop image');
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Cancel cropping
  const cancelCrop = () => {
    if (!mountedRef.current) return;
    
    setIsCropping(false);
    setOriginalImage(null);
  };

  // Open media selector
  const openMediaSelector = () => {
    setIsMediaSelectorOpen(true);
  };
  
  // Render preview based on media type
  const renderMediaPreview = (media: Media | undefined, isSecondary = false) => {
    if (!media || !media.url) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-800 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center justify-center space-y-2">
              {allowedTypes.includes('image') && allowedTypes.includes('video') ? (
                <>
                  <ImagePlus className="w-8 h-8" />
                  <FileVideo className="w-8 h-8" />
                  <span>No media selected</span>
                </>
              ) : allowedTypes.includes('video') ? (
                <>
                  <FileVideo className="w-8 h-8" />
                  <span>No video selected</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-8 h-8" />
                  <span>No image selected</span>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (media.type === 'image') {
      return (
        <div className="relative h-full w-full">
          <img
            src={media.url}
            alt={media.name || 'Selected media'}
            className="w-full h-full object-cover rounded-md"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => isSecondary ? setSecondary(undefined) : setPrimary(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    if (media.type === 'video') {
      return (
        <div className="relative h-full w-full">
          <video
            src={media.url}
            className="w-full h-full object-cover rounded-md"
            controls
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => isSecondary ? setSecondary(undefined) : setPrimary(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return null;
  };
  
  // Render media controls
  const renderMediaControls = (mediaType: 'primary' | 'secondary') => {
    const current = mediaType === 'primary' ? primary : secondary;
    
    return (
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => openMediaSelector(mediaType)}
        >
          <Eye className="w-4 h-4 mr-1" />
          Library
        </Button>
        
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {}}
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </Button>
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept={allowedTypes.map(type => 
              type === 'image' ? 'image/jpeg,image/png,image/jpg,image/gif' : 'video/mp4,video/quicktime,video/x-msvideo,video/webm'
            ).join(',')}
            onClick={(e) => {
              setCurrentMedia(mediaType);
              // Reset the value to allow selecting the same file again
              (e.target as HTMLInputElement).value = '';
            }}
          />
        </div>
        
        {current && current.url && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              if (mediaType === 'primary') {
                setPrimary({ url: null, type: null });
              } else if (setSecondary) {
                setSecondary({ url: null, type: null });
              }
            }}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Media upload section with aspect ratio toggle */}
      <div className="mb-4">
        {showLabels && (
          <div className="mb-2 flex justify-between items-center">
            <div className="text-sm font-medium dark:text-white">{label}</div>
            {primary?.url && primary.type === 'image' && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => {
                  // Set original image from current media
                  if (primary.url) {
                    setOriginalImage(primary.url);
                    setIsCropping(true);
                  }
                }} className="h-7 px-2">
                  <span className="sr-only">Crop image</span>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Crop
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Aspect ratio selector */}
        <div className="mb-4">
          <RadioGroup 
            defaultValue={aspectRatio}
            value={aspectRatio}
            onValueChange={(value) => setAspectRatio(value as 'square' | 'widescreen')}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="square" id="square" />
              <Label htmlFor="square" className="flex items-center">
                <div className="w-5 h-5 bg-gray-700 mr-2"></div>
                <span>Square (1:1)</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="widescreen" id="widescreen" />
              <Label htmlFor="widescreen" className="flex items-center">
                <div className="w-7 h-4 bg-gray-700 mr-2"></div>
                <span>Widescreen (16:9)</span>
              </Label>
            </div>
          </RadioGroup>
          
          {/* Helpful text explaining aspect ratio usage */}
          <div className="mt-2 text-xs text-gray-400">
            {aspectRatio === 'square' ? (
              <div className="flex items-start">
                <Info className="w-3.5 h-3.5 mt-0.5 mr-1.5 flex-shrink-0" />
                <span>Square format (1:1) is ideal for thumbnails, profile pictures, and grid displays.</span>
              </div>
            ) : (
              <div className="flex items-start">
                <Info className="w-3.5 h-3.5 mt-0.5 mr-1.5 flex-shrink-0" />
                <span>Widescreen format (16:9) is perfect for headers, banners, and feature images.</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Media preview */}
        <div 
          className={`w-full relative rounded-md overflow-hidden ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${!primary?.url ? 'border-2 border-dashed border-gray-300 dark:border-gray-700 h-32' : 'border border-[rgba(124,93,250,0.2)]'}`}
        >
          {/* Dynamic preview based on selected aspect ratio */}
          <div className={`relative ${primary?.url ? 'aspect-ratio-container transition-all duration-300' : ''} ${primary?.url && aspectRatio === 'widescreen' ? 'pb-[56.25%]' : primary?.url ? 'pb-[100%]' : ''}`}>
            {renderMediaPreview(primary)}
          </div>
          
          {primary?.url && (
            <div className="absolute top-2 right-2 z-10 flex space-x-1">
              <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full" onClick={() => setPrimary({ url: null, type: null })}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Display media information with filename and type */}
        {renderMediaInfo(primary, 'Media')}
        
        <div className="mt-2">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openMediaSelector()}
            >
              <Eye className="w-4 h-4 mr-1" />
              Library
            </Button>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {}}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept={allowedTypes.map(type => 
                  type === 'image' ? 'image/jpeg,image/png,image/jpg,image/gif' : 'video/mp4,video/quicktime,video/x-msvideo,video/webm'
                ).join(',')}
                onClick={(e) => {
                  // Reset the value to allow selecting the same file again
                  (e.target as HTMLInputElement).value = '';
                }}
              />
            </div>
            
            {primary && primary.url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPrimary({ url: null, type: null });
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Media Selector Dialog */}
      <MediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelectMedia={handleMediaSelect}
        mediaType={allowedTypes.length === 1 ? allowedTypes[0] : 'all'}
        title={`Select ${label}`}
        aspectRatio={getSelectorAspectRatio()}
      />
      
      {/* Image Cropping Dialog */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription className="sr-only">
              Crop and resize the selected image to {aspectRatio === 'square' ? 'square format (1:1)' : 'widescreen format (16:9)'} before applying
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative h-96 mb-4">
            {originalImage && (
              <Cropper
                image={originalImage}
                crop={crop}
                zoom={zoom}
                aspect={numericAspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain"
                showGrid={true}
              />
            )}
          </div>
          
          <div className="mb-4">
            <label className="text-sm font-medium block mb-1">Zoom: {zoom.toFixed(1)}x</label>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <Info className="w-4 h-4 mr-2" />
            <span>Cropping to {aspectRatio === 'square' ? 'square format (1:1)' : 'widescreen format (16:9)'}</span>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={cancelCrop} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={applyCrop} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {`Processing... ${uploadProgress}%`}
                </>
              ) : (
                'Apply Crop'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <style jsx>{`
        .aspect-ratio-container {
          position: relative;
          width: 100%;
          height: 0;
          overflow: hidden;
        }
        .aspect-ratio-container img, 
        .aspect-ratio-container video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
};

export default MediaHandling;
