/**
 * ImageUploader Component
 * 
 * Professional drag-and-drop image uploader with:
 * - Preview before upload
 * - Upload progress
 * - Automatic optimization via backend
 * - Asset ID return for database linking
 * 
 * Integrates with /menu-image-upload/upload endpoint
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { API_URL } from '../utils/environment';
import { colors } from 'utils/designSystem';

export interface ImageUploadResult {
  asset_id: string;
  file_url: string;
  thumbnail_url: string;
  file_size: number;
  thumbnail_size: number;
  mime_type: string;
  dimensions: {
    width: number;
    height: number;
  };
}

interface ImageUploaderProps {
  /** Callback when upload succeeds */
  onUploadSuccess: (result: ImageUploadResult) => void;
  /** Optional existing image URL to show */
  currentImageUrl?: string;
  /** Optional asset category for organization (menu-item, ai-avatar, general) */
  assetCategory?: string;
  /** Alt text for accessibility */
  altText?: string;
  /** Menu section ID for hierarchical organization */
  menuSectionId?: string;
  /** Menu category ID for hierarchical organization */
  menuCategoryId?: string;
  /** Menu item name for friendly labeling */
  menuItemName?: string;
  /** Optional label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function ImageUploader({
  onUploadSuccess,
  currentImageUrl,
  assetCategory = 'menu-item',
  altText,
  menuSectionId,
  menuCategoryId,
  menuItemName,
  label = 'Upload Image',
  helperText = 'Drag and drop an image, or click to browse. Max 5MB. Supports JPEG, PNG, WebP.',
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, or WebP.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await uploadFile(file);
  };

  // Upload file to backend
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 Uploading image:', file.name);

      // Simulate progress (since we don't have real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Manually create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('asset_category', assetCategory);
      if (altText) formData.append('alt_text', altText);
      if (menuSectionId) formData.append('menu_section_id', menuSectionId);
      if (menuCategoryId) formData.append('menu_category_id', menuCategoryId);
      if (menuItemName) formData.append('menu_item_name', menuItemName);

      // Upload via fetch (FormData handles content-type automatically)
      const response = await fetch(`${API_URL}/menu-image-upload/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important for dev environment
      });

      const data = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      console.log('✅ Upload successful:', data);

      // Call success callback
      onUploadSuccess({
        asset_id: data.asset_id,
        file_url: data.file_url,
        thumbnail_url: data.thumbnail_url,
        file_size: data.file_size,
        thumbnail_size: data.thumbnail_size,
        mime_type: data.mime_type,
        dimensions: data.dimensions,
      });

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPreview(currentImageUrl || null); // Revert preview
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Click to upload
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clear image
  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium" style={{ color: colors.text.primary }}>
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className="relative border-2 border-dashed rounded-lg overflow-hidden transition-all cursor-pointer group"
        style={{
          borderColor: isDragging
            ? colors.brand.turquoise
            : preview
            ? colors.border.subtle
            : colors.border.default,
          backgroundColor: isDragging
            ? 'rgba(14, 186, 177, 0.1)'
            : 'rgba(255, 255, 255, 0.03)',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Content */}
        <div className="p-8">
          {isUploading ? (
            // Uploading state
            <div className="text-center space-y-4">
              <Loader2
                className="mx-auto animate-spin"
                size={48}
                style={{ color: colors.brand.turquoise }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  Uploading & optimizing...
                </p>
                <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                  {uploadProgress}% complete
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: colors.brand.turquoise,
                  }}
                />
              </div>
            </div>
          ) : preview ? (
            // Preview state
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* Clear button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  type="button"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: colors.text.secondary }}>
                Click to change image
              </p>
            </div>
          ) : (
            // Empty state
            <div className="text-center space-y-3">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: isDragging
                    ? 'rgba(14, 186, 177, 0.2)'
                    : 'rgba(91, 60, 196, 0.1)',
                }}
              >
                {isDragging ? (
                  <Upload
                    size={32}
                    style={{ color: colors.brand.turquoise }}
                    className="animate-bounce"
                  />
                ) : (
                  <ImageIcon size={32} style={{ color: colors.brand.purple }} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  {isDragging ? 'Drop image here' : 'Drag & drop an image'}
                </p>
                <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                  or click to browse
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper text */}
      {helperText && (
        <p className="text-xs" style={{ color: colors.text.tertiary }}>
          {helperText}
        </p>
      )}
    </div>
  );
}
