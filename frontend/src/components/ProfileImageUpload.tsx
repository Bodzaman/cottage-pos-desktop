import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import brain from 'brain';
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

// Crop state for react-easy-crop
interface CropState {
  crop: Point;
  zoom: number;
  rotation: number;
  croppedAreaPixels: Area | null;
}

// Helper to create an image element from a source URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

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
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropState, setCropState] = useState<CropState>({
    crop: { x: 0, y: 0 },
    zoom: 1,
    rotation: 0,
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
      setShowCropModal(true); // Show crop modal instead of uploading directly
    };
    reader.readAsDataURL(file);
  };

  // Use Google profile image
  const useGoogleImage = async () => {
    if (!googleProfileImage) return;

    setIsUploading(true);
    try {
      const response = await brain.sync_google_profile_image({
        user_id: userId,
        google_image_url: googleProfileImage
      });
      const result = await response.json();

      if (result.success) {
        onImageUpdate(result.image_url);
        toast.success('Google profile image set successfully!');
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
      useGoogleImage();
    }
  }, [googleProfileImage, currentImageUrl, authProvider]);

  // Remove profile image
  const removeImage = async () => {
    setIsUploading(true);
    try {
      const response = await brain.delete_profile_image({ user_id: userId });
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

      const response = await brain.upload_profile_image(formData as any);
      const data = await response.json();

      if (data.image_url) {
        onImageUpdate(data.image_url);
        toast.success('Profile image updated successfully!');
        setShowCropModal(false);
        setPreviewImage(null);
        setSelectedFile(null);
        setCropState({ crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, croppedAreaPixels: null });
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
    setCropState({ crop: { x: 0, y: 0 }, zoom: 1, rotation: 0, croppedAreaPixels: null });
  };

  return (
    <div className={className}>
      {/* Compact Avatar with Edit Overlay */}
      <div className="relative inline-block group">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#2A2E36] bg-[#121316] shadow-lg">
          {renderProfileImage()}
        </div>

        {/* Hover Overlay with Actions */}
        <div
          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Camera className="h-5 w-5 text-white mx-auto mb-1" />
            <span className="text-[10px] text-white/90 font-medium">Change</span>
          </div>
        </div>

        {/* Edit Badge (always visible) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-7 h-7 bg-[#8B1538] hover:bg-[#7A1230] rounded-full flex items-center justify-center text-white transition-colors shadow-lg border-2 border-[#121316]"
          disabled={isUploading}
          aria-label="Change profile photo"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Remove Button (only when image exists) */}
        {currentImageUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeImage();
            }}
            className="absolute top-0 right-0 w-6 h-6 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100 shadow-lg border-2 border-[#121316]"
            disabled={isUploading}
            aria-label="Remove photo"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
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

      {/* Subtle Text Actions */}
      <div className="mt-2 flex items-center justify-center gap-2 text-xs">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-[#8B1538] transition-colors"
          disabled={isUploading}
        >
          Change photo
        </button>
        {googleProfileImage && authProvider === 'google' && (
          <>
            <span className="text-gray-600">•</span>
            <button
              onClick={useGoogleImage}
              className="text-gray-500 hover:text-[#4285F4] transition-colors"
              disabled={isUploading}
            >
              Use Google
            </button>
          </>
        )}
      </div>

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
