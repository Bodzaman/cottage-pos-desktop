import React, { useState, useEffect } from 'react';
import { apiClient } from 'app';
import { Upload, Trash2, GripVertical, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { globalColors, panelStyle } from 'utils/QSAIDesign';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  content_key: string;
  page: string;
  section: string;
  content_type: string;
  display_order: number;
  label: string | null;
  draft_value: string | null;
  draft_media_url: string | null;
  draft_thumbnail_url: string | null;
  draft_metadata: {
    width?: number;
    height?: number;
    original_filename?: string;
    file_size?: number;
    alt_text?: string;
    description?: string;
  } | null;
  published_media_url: string | null;
  published_thumbnail_url: string | null;
  has_unpublished_changes: boolean;
  created_at: string;
  updated_at: string;
}

interface ContentImageManagerProps {
  page: string;
  section: string;
  onContentChange?: () => void;
}

export default function ContentImageManager({ page, section, onContentChange }: ContentImageManagerProps) {
  const [images, setImages] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<ContentItem | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<string | null>(null);

  // Capitalize first letter for display
  const displayPage = page.charAt(0).toUpperCase() + page.slice(1);
  const displaySection = section;

  // Fetch images for this page/section
  useEffect(() => {
    fetchImages();
  }, [page, section]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get_all_draft_content({ page, section, content_type: 'image' });
      const data = await response.json();
      
      if (data.success) {
        // Sort by display_order
        const sortedImages = data.items.sort((a: ContentItem, b: ContentItem) => 
          a.display_order - b.display_order
        );
        setImages(sortedImages);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  // Single image upload
  const handleSingleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      toast.info('Uploading image...');

      const response = await apiClient.upload_single_image({
        file,
        page,
        section,
        label: file.name,
        display_order: images.length,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Image uploaded successfully');
        await fetchImages();
        onContentChange?.();
        
        // Notify preview iframe of content change
        notifyPreviewIframe();
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  // Bulk upload
  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setBulkUploading(true);
      toast.info(`Uploading ${files.length} images...`);

      const response = await apiClient.bulk_upload_images({
        files: Array.from(files),
        page,
        section,
        label_prefix: 'Image',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Uploaded ${data.uploaded_count} images successfully`);
        if (data.failed_count > 0) {
          toast.warning(`${data.failed_count} images failed to upload`);
        }
        await fetchImages();
        onContentChange?.();
        
        // Notify preview iframe of content change
        notifyPreviewIframe();
      } else {
        toast.error('Bulk upload failed');
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setBulkUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  // Helper function to notify preview iframe
  const notifyPreviewIframe = () => {
    // Find all iframes on the page (preview iframe)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage(
          { type: 'CONTENT_UPDATED', page, section },
          window.location.origin
        );
        console.log('[ContentImageManager] Sent CONTENT_UPDATED message to iframe');
      } catch (error) {
        console.error('[ContentImageManager] Failed to send message to iframe:', error);
      }
    });
  };

  // Update metadata
  const handleUpdateMetadata = async (item: ContentItem, field: string, value: string) => {
    try {
      const updatedMetadata = {
        ...(item.draft_metadata || {}),
        [field]: value,
      };

      const response = await apiClient.update_text_content({
        content_key: item.content_key,
        draft_value: JSON.stringify(updatedMetadata),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setImages(prev =>
          prev.map(img =>
            img.id === item.id
              ? { ...img, draft_metadata: updatedMetadata, has_unpublished_changes: true }
              : img
          )
        );
        toast.success('Metadata updated');
        onContentChange?.();
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
      toast.error('Failed to update metadata');
    }
  };

  // Delete image
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await apiClient.delete_content({ contentKey: itemToDelete.content_key });
      const data = await response.json();

      if (data.success) {
        toast.success('Image deleted');
        await fetchImages();
        onContentChange?.();
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Drag and drop reordering
  const handleDragStart = (item: ContentItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, targetItem: ContentItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    const draggedIndex = images.findIndex(img => img.id === draggedItem.id);
    const targetIndex = images.findIndex(img => img.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    // Update display_order
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      display_order: index,
    }));

    setImages(updatedImages);
  };

  const handleDragEnd = async () => {
    if (!draggedItem) return;

    try {
      // Send updated order to backend
      const orderData = images.map(img => ({
        content_key: img.content_key,
        display_order: img.display_order,
      }));

      const response = await apiClient.update_display_order({ items: orderData });
      const data = await response.json();

      if (data.success) {
        toast.success('Order updated');
        onContentChange?.();
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order');
      // Revert on error
      await fetchImages();
    } finally {
      setDraggedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p style={{ color: globalColors.text.muted }}>Loading images...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Context Banner */}
      <div
        className="p-4 rounded-lg border flex items-center justify-between"
        style={{
          background: `${globalColors.purple.primary}15`,
          borderColor: globalColors.purple.primary,
        }}
      >
        <div className="flex items-center gap-3">
          <ImageIcon className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
          <div>
            <p className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Currently Managing: <span style={{ color: globalColors.purple.primary }}>{displayPage} → {displaySection}</span>
            </p>
            <p className="text-xs" style={{ color: globalColors.text.muted }}>
              {images.length} {images.length === 1 ? 'image' : 'images'} in this section
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSingleUpload}
              disabled={uploading || bulkUploading}
            />
            <Button
              size="sm"
              className="gap-2"
              style={{
                background: globalColors.purple.primary,
                color: globalColors.text.primary,
              }}
              disabled={uploading || bulkUploading}
              onClick={(e) => {
                e.preventDefault();
                (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
              }}
            >
              <Plus className="h-4 w-4" />
              Add Image
            </Button>
          </label>
          <label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleBulkUpload}
              disabled={uploading || bulkUploading}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              style={{
                borderColor: globalColors.purple.primary,
                color: globalColors.purple.primary,
              }}
              disabled={uploading || bulkUploading}
              onClick={(e) => {
                e.preventDefault();
                (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
              }}
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
          </label>
        </div>
      </div>

      {/* Image Grid */}
      {images.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center border-2 border-dashed"
          style={{
            borderColor: globalColors.border.medium,
            color: globalColors.text.muted,
          }}
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-4" style={{ opacity: 0.3 }} />
          <p className="text-lg font-medium mb-2">No images in {displaySection} yet</p>
          <p className="text-sm">Click "Add Image to {displaySection}" to upload your first image</p>
          <p className="text-xs mt-2" style={{ color: globalColors.purple.primary }}>
            Images uploaded here will appear in the preview panel →
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {images.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item)}
              onDragOver={(e) => handleDragOver(e, item)}
              onDragEnd={handleDragEnd}
              className="rounded-lg p-4 cursor-move transition-all hover:scale-[1.02]"
              style={{
                ...panelStyle,
                borderColor: item.has_unpublished_changes
                  ? globalColors.purple.primary
                  : globalColors.border.medium,
                opacity: draggedItem?.id === item.id ? 0.5 : 1,
              }}
            >
              {/* Drag Handle & Unpublished Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4" style={{ color: globalColors.text.muted }} />
                  <span className="text-xs font-mono" style={{ color: globalColors.text.muted }}>
                    #{item.display_order + 1}
                  </span>
                </div>
                {item.has_unpublished_changes && (
                  <Badge
                    className="text-xs"
                    style={{
                      background: globalColors.purple.primary,
                      color: globalColors.text.primary,
                    }}
                  >
                    Unpublished
                  </Badge>
                )}
              </div>

              {/* Image Preview */}
              <div className="relative mb-3 rounded overflow-hidden bg-black/20">
                <img
                  src={item.draft_thumbnail_url || item.draft_media_url || ''}
                  alt={item.draft_metadata?.alt_text || item.label || 'Image'}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23333" width="200" height="150"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Metadata */}
              {editingMetadata === item.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Alt text"
                    defaultValue={item.draft_metadata?.alt_text || ''}
                    onBlur={(e) => {
                      handleUpdateMetadata(item, 'alt_text', e.target.value);
                      setEditingMetadata(null);
                    }}
                    style={{
                      background: globalColors.background.secondary,
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.primary,
                    }}
                  />
                  <Textarea
                    placeholder="Description"
                    defaultValue={item.draft_metadata?.description || ''}
                    rows={2}
                    onBlur={(e) => {
                      handleUpdateMetadata(item, 'description', e.target.value);
                    }}
                    style={{
                      background: globalColors.background.secondary,
                      borderColor: globalColors.border.medium,
                      color: globalColors.text.primary,
                    }}
                  />
                </div>
              ) : (
                <div
                  className="cursor-pointer hover:bg-white/5 p-2 rounded transition-colors"
                  onClick={() => setEditingMetadata(item.id)}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: globalColors.text.primary }}>
                    {item.label || 'Untitled'}
                  </p>
                  {item.draft_metadata?.alt_text && (
                    <p className="text-xs mb-1" style={{ color: globalColors.text.muted }}>
                      Alt: {item.draft_metadata.alt_text}
                    </p>
                  )}
                  {item.draft_metadata?.description && (
                    <p className="text-xs" style={{ color: globalColors.text.muted }}>
                      {item.draft_metadata.description}
                    </p>
                  )}
                  {item.draft_metadata?.width && item.draft_metadata?.height && (
                    <p className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                      {item.draft_metadata.width} × {item.draft_metadata.height}
                    </p>
                  )}
                  {!item.draft_metadata?.alt_text && !item.draft_metadata?.description && (
                    <p className="text-xs italic" style={{ color: globalColors.text.muted }}>
                      Click to add metadata
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setItemToDelete(item);
                    setDeleteDialogOpen(true);
                  }}
                  style={{
                    borderColor: globalColors.border.medium,
                    color: globalColors.text.secondary,
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          style={{
            background: globalColors.background.panel,
            borderColor: globalColors.border.medium,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: globalColors.text.primary }}>
              Delete Image
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: globalColors.text.muted }}>
              Are you sure you want to delete "{itemToDelete?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                borderColor: globalColors.border.medium,
                color: globalColors.text.secondary,
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{
                background: '#DC2626',
                color: 'white',
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
