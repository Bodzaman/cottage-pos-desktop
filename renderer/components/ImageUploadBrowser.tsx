import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, Upload, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { AppApisUnifiedMediaStorageMediaAsset, EnhancedMediaLibraryResponse } from 'types';

export interface ImageUploadBrowserProps {
  selectedImageUrl?: string;
  selectedImageFilename?: string;
  onImageSelect: (imageUrl: string, filename: string) => void;
  triggerButton?: React.ReactNode;
}

export const ImageUploadBrowser: React.FC<ImageUploadBrowserProps> = ({
  selectedImageUrl,
  selectedImageFilename,
  onImageSelect,
  triggerButton
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<AppApisUnifiedMediaStorageMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localSelectedImage, setLocalSelectedImage] = useState<string | null>(selectedImageUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load images when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  // Handle file selection for preview
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get_media_library({ tags: JSON.stringify(["avatar"]) });
      const data: EnhancedMediaLibraryResponse = await response.json();
      
      if (data.success && data.assets) {
        setImages(data.assets);
      } else {
        toast.error('Failed to load images');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') || !['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPEG and PNG images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // API client expects BodyUploadAvatarImage object with file property
      const uploadData: BodyUploadAvatarImage = {
        file: selectedFile,
        user_id: "user123", // Default user ID for now
        user_name: "User"
      };

      const response = await apiClient.upload_avatar_image(uploadData);
      const data: FileUploadResponse = await response.json();

      if (data.success && data.url) {
        toast.success('Image uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        await loadImages(); // Reload image list
        
        // Auto-select the newly uploaded image
        setLocalSelectedImage(data.url);
        onImageSelect(data.url, data.filename || 'uploaded-image');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (filename: string) => {
    try {
      const response = await apiClient.delete_avatar_image({ filename });
      const data: BaseResponse = await response.json();

      if (data.success) {
        toast.success('Image deleted successfully');
        await loadImages();
        
        // Clear selection if deleted image was selected
        const deletedImageUrl = images.find(img => img.filename === filename)?.url;
        if (localSelectedImage === deletedImageUrl) {
          setLocalSelectedImage(null);
        }
      } else {
        toast.error(data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleImageSelect = (imageUrl: string, filename: string) => {
    setLocalSelectedImage(imageUrl);
  };

  const handleConfirmSelection = () => {
    if (localSelectedImage) {
      const selectedImage = images.find(img => img.url === localSelectedImage);
      if (selectedImage) {
        onImageSelect(selectedImage.url, selectedImage.filename);
        toast.success('Avatar image selected!');
        setIsOpen(false);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="w-full">
            <ImageIcon className="w-4 h-4 mr-2" />
            Browse Avatar Images
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avatar Image Browser</DialogTitle>
          <DialogDescription>
            Browse existing avatar images or upload a new one. Select an image to use as your avatar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              {/* Large Circular Avatar Preview */}
              {(selectedFile || localSelectedImage) ? (
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg bg-gray-100">
                      <img
                        src={previewUrl || localSelectedImage || ''}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    {selectedFile && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white text-xs px-2 py-1 hover:bg-blue-500 border-0 shadow-md">
                          New Upload
                        </Badge>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    {selectedFile ? 'Ready to upload' : 'Current selection'}
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-gray-500">
                      {selectedFile.name} • {formatFileSize(selectedFile.size)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    Upload new avatar image
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG or PNG, up to 5MB
                  </p>
                </div>
              )}
              
              {/* Upload Controls */}
              <div className="flex justify-center space-x-3">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {selectedFile ? 'Change Image' : 'Choose Image'}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div>
            <h3 className="text-lg font-medium mb-4">Existing Images</h3>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No images found</p>
                <p className="text-xs text-gray-400">Upload your first avatar image above</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((image, index) => (
                  <Card
                    key={image.id || image.asset_id || image.filename || `image-${index}`}
                    className={`cursor-pointer transition-all hover:shadow-md group ${
                      localSelectedImage === image.url
                        ? 'ring-2 ring-blue-500 shadow-md'
                        : ''
                    }`}
                    onClick={() => handleImageSelect(image.url, image.filename)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        {/* Circular Avatar Preview */}
                        <div className="relative">
                          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-100 hover:shadow-md transition-shadow">
                            <img
                              src={image.url || ''}
                              alt={image.filename || 'Avatar image'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 bg-gray-200 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-gray-400" />
                            </div>
                          </div>
                          
                          {localSelectedImage === image.url && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1.5 shadow-sm">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-1 -left-1 p-1.5 h-auto w-auto rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (image.filename) {
                                handleDeleteImage(image.filename);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {/* Image Info */}
                        <div className="mt-3 text-center w-full">
                          <p className="text-xs font-medium truncate px-1" title={image.filename || 'Unknown'}>
                            {image.filename ? image.filename.replace(/\.[^/.]+$/, "") : 'Unknown'}
                          </p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {image.file_size ? formatFileSize(image.file_size) : 'Unknown size'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              {localSelectedImage ? (
                <span className="flex items-center">
                  <Check className="w-4 h-4 mr-1 text-green-500" />
                  Image selected
                </span>
              ) : (
                'Select an image to continue'
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!localSelectedImage}
              >
                Use Selected Image
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadBrowser;
