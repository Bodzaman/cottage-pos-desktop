import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, User, Loader2, Move, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { apiClient } from 'app';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';

interface Props {
  currentImageUrl?: string | null;
  googleProfileImage?: string | null;
  authProvider?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  userId: string;
  className?: string;
  showOptimizationFeedback?: boolean; // Optional: show WebP optimization details (default: false for customer privacy)
}

interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: string;
}

// Helper function to create image element
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to get cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export const ProfileImageUpload: React.FC<Props> = ({
  userId,
  currentImageUrl,
  googleProfileImage,
  authProvider,
  onImageUpdate,
  className = '',
  showOptimizationFeedback = false
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<CropPosition>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    unit: 'px'
  });
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropState, setCropState] = useState<CropState>({
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null
  });

  // Generate user initials for fallback avatar
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setSelectedFile(file);
      setShowUploadModal(false);
      setShowCropModal(true); // Show crop modal instead of uploading directly
    };
    reader.readAsDataURL(file);
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle upload with simple positioning and image optimization
  const handleUpload = async () => {
    if (!selectedFile || !previewImage) return;
    
    setIsUploading(true);
    
    try {
      // Show optimization toast
      if (showOptimizationFeedback) {
        toast.info(`🎨 Optimizing ${selectedFile.name}...`, { duration: 2000 });
      }
      
      // Create a canvas to crop and optimize the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Set canvas size for profile image (max 800x800 for better quality, smaller than original 400x400)
      const maxSize = 800;
      canvas.width = maxSize;
      canvas.height = maxSize;
      
      // Create image element
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate the crop area (center crop with drag offset)
          const scale = Math.max(maxSize / img.width, maxSize / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Apply user's drag positioning
          const offsetX = crop.x || 0;
          const offsetY = crop.y || 0;
          
          // Center the image and apply offset
          const drawX = (maxSize - scaledWidth) / 2 + offsetX;
          const drawY = (maxSize - scaledHeight) / 2 + offsetY;
          
          // Draw the cropped image
          ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
          resolve(null);
        };
        img.onerror = reject;
        img.src = previewImage;
      });
      
      // Try WebP first (better compression), fallback to JPEG
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';
      const fileExtension = supportsWebP ? 'webp' : 'jpg';
      const quality = 0.85; // 85% quality for good balance
      
      // Convert canvas to blob with compression
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), mimeType, quality);
      });
      
      // Calculate compression ratio
      const originalSize = selectedFile.size;
      const compressedSize = blob.size;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(0);
      
      console.log(`Image optimized: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${compressionRatio}% reduction)`);
      if (showOptimizationFeedback) {
        toast.info(`✨ ${compressionRatio}% smaller - uploading...`, { duration: 1500 });
      }
      
      // Convert blob to File for proper upload
      const file = new File([blob], `profile-image.${fileExtension}`, { type: mimeType });
      
      // Upload the optimized image using apiClient
      const uploadData: BodyUploadProfileImage = {
        user_id: userId,
        file: file
      };
      
      const response = await apiClient.upload_profile_image(uploadData);
      
      if (response.ok) {
        const result = await response.json();
        onImageUpdate(result.image_url);
        if (showOptimizationFeedback) {
          toast.success(`✅ Profile image updated! (${compressionRatio}% smaller)`);
        }
        setShowUploadModal(false);
        setShowCropModal(false);
        setPreviewImage(null);
        setSelectedFile(null);
        setCrop({ x: 0, y: 0, width: 100, height: 100, unit: 'px' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Use Google profile image
  const useGoogleImage = async () => {
    if (!googleProfileImage) return;

    setIsUploading(true);
    try {
      const response = await apiClient.sync_google_profile_image({
        user_id: userId,
        google_image_url: googleProfileImage
      });
      const result = await response.json();

      if (result.success) {
        onImageUpdate(result.image_url);
        toast.success('Google profile image set successfully!');
        setShowUploadModal(false);
      } else {
        toast.error(result.error || 'Failed to sync Google image');
      }
    } catch (error) {
      console.error('Google sync error:', error);
      toast.error('Failed to sync Google image');
    } finally {
      setIsUploading(false);
    }
  };

  // Automatically sync Google profile image on component mount if conditions are met
  useEffect(() => {
    const shouldAutoSyncGoogle = () => {
      // Auto-sync if:
      // 1. User has Google profile image available
      // 2. No current profile image exists
      // 3. User's auth provider is Google
      return (
        googleProfileImage && 
        !currentImageUrl && 
        authProvider === 'google'
      );
    };

    if (shouldAutoSyncGoogle()) {
      console.log('🎯 Auto-syncing Google profile image for Google auth user');
      useGoogleImage();
    }
  }, [googleProfileImage, currentImageUrl, authProvider]);

  // Remove profile image
  const removeImage = async () => {
    setIsUploading(true);
    try {
      const response = await apiClient.delete_profile_image({ user_id: userId });
      const result = await response.json();

      if (result.success) {
        onImageUpdate(null);
        toast.success('Profile image removed successfully!');
      } else {
        toast.error('Failed to remove image');
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  // Profile image display
  const renderProfileImage = () => {
    if (currentImageUrl) {
      return (
        <img
          src={currentImageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    // Fallback to initials
    return (
      <div className="w-full h-full bg-[#8B1538] text-white flex items-center justify-center text-2xl font-bold">
        {getInitials('', '', 'User')}
      </div>
    );
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCropState(prev => ({ ...prev, croppedAreaPixels }));
  }, []);

  const handleCropConfirm = async () => {
    if (!previewImage || !cropState.croppedAreaPixels || !selectedFile) {
      toast.error('No image selected');
      return;
    }

    try {
      setIsUploading(true);
      
      // Get cropped image as blob
      const croppedBlob = await getCroppedImg(previewImage, cropState.croppedAreaPixels);
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', croppedBlob, selectedFile.name);
      formData.append('user_id', userId);

      const response = await apiClient.upload_profile_image(formData);
      const data = await response.json();

      if (data.image_url) {
        onImageUpdate(data.image_url);
        toast.success('Profile image updated successfully!');
        setShowCropModal(false);
        setPreviewImage(null);
        setSelectedFile(null);
        setCropState({ crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
      } else {
        throw new Error(data.error || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setPreviewImage(null);
    setSelectedFile(null);
    setCropState({ crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Profile Image Display */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#2A2E36] bg-[#121316]">
            {renderProfileImage()}
          </div>
          
          {/* Camera overlay for upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-[#8B1538] hover:bg-[#7A1230] rounded-full flex items-center justify-center text-white transition-colors"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] hover:bg-[#8B1538] hover:border-[#8B1538] hover:text-white"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
            
            {googleProfileImage && authProvider === 'google' && (
              <Button
                onClick={useGoogleImage}
                variant="outline"
                size="sm"
                className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] hover:bg-[#4285F4] hover:border-[#4285F4] hover:text-white"
                disabled={isUploading}
              >
                Use Google Photo
              </Button>
            )}
            
            {currentImageUrl && (
              <Button
                onClick={removeImage}
                variant="outline"
                size="sm"
                className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] hover:bg-red-500 hover:border-red-500 hover:text-white"
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-sm text-[#8B92A0]">
            Upload a square image. Max 5MB. JPG, PNG, or GIF.
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-[#8B1538] bg-[#8B153810]'
            : 'border-[#2A2E36] hover:border-[#8B1538] hover:bg-[#8B153805]'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <Upload className="h-8 w-8 text-[#8B92A0] mx-auto" />
          <p className="text-[#B7BDC6] font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-[#8B92A0]">JPG, PNG or GIF (max 5MB)</p>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-[#17191D] border-[#2A2E36] text-[#EAECEF] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#EAECEF] flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#8B1538]" />
              Upload Profile Image
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewImage ? (
              <div className="space-y-4">
                {/* Simple Image Preview with Drag to Reposition */}
                <div className="relative">
                  <div className="w-64 h-64 mx-auto relative overflow-hidden rounded-full border-4 border-[#2A2E36]">
                    <img
                      ref={setImageRef}
                      src={previewImage}
                      alt="Profile preview"
                      className="w-full h-full object-cover cursor-move transition-transform"
                      style={{
                        transform: `translate(${crop.x}px, ${crop.y}px) scale(1.2)`
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        
                        const startX = e.clientX - crop.x;
                        const startY = e.clientY - crop.y;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          // Allow much more movement - up to 120px in each direction
                          const newX = Math.max(-120, Math.min(120, moveEvent.clientX - startX));
                          const newY = Math.max(-120, Math.min(120, moveEvent.clientY - startY));
                          setCrop(prev => ({ ...prev, x: newX, y: newY }));
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  </div>
                </div>
                
                {/* Simple Instructions */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-[#8B92A0]">
                    <Move className="h-4 w-4" />
                    <span>Drag image to reposition</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Reset to center
                      setCrop({ x: 0, y: 0, width: 100, height: 100, unit: 'px' });
                    }}
                    className="text-[#8B92A0] hover:text-[#EAECEF] text-xs hover:bg-[#2A2E36]"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset to center
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-[#8B1538] bg-[#8B1538]/10' 
                    : 'border-[#2A2E36] hover:border-[#8B1538]/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-[#8B92A0] mx-auto mb-4" />
                <p className="text-[#EAECEF] mb-2">Drop your image here</p>
                <p className="text-[#8B92A0] text-sm mb-4">or</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[#2A2E36] text-[#B7BDC6] hover:bg-[#2A2E36] hover:text-[#EAECEF]"
                >
                  Choose File
                </Button>
                <p className="text-xs text-[#8B92A0] mt-4">
                  PNG, JPG up to 5MB • Auto-cropped to center
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-[#2A2E36] text-[#B7BDC6] hover:bg-[#2A2E36] hover:text-[#EAECEF]"
              onClick={() => {
                setShowUploadModal(false);
                setPreviewImage(null);
                setSelectedFile(null);
                setCrop({ x: 0, y: 0, width: 100, height: 100, unit: 'px' });
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#8B1538] hover:bg-[#8B1538]/80 text-white transition-all duration-200"
              onClick={handleUpload}
              disabled={isUploading || !previewImage}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Upload Photo</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#EAECEF]">Crop Your Photo</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
            {previewImage && (
              <Cropper
                image={previewImage}
                crop={cropState.crop}
                zoom={cropState.zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={(crop) => setCropState(prev => ({ ...prev, crop }))}
                onZoomChange={(zoom) => setCropState(prev => ({ ...prev, zoom }))}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[#B7BDC6]">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={cropState.zoom}
                onChange={(e) => setCropState(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#8B1538]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleCropCancel}
              disabled={isUploading}
              className="bg-black/20 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropConfirm}
              disabled={isUploading}
              className="bg-[#8B1538] hover:bg-[#7A1230] text-white shadow-[0_0_24px_#8B153855] border-0"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
