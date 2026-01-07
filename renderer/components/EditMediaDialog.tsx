import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import type { MediaItem } from '../utils/mediaLibraryUtils';

interface EditMediaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  onSuccess: () => void;
}

export const EditMediaDialog: React.FC<EditMediaDialogProps> = ({
  isOpen,
  onOpenChange,
  item,
  onSuccess,
}) => {
  const [friendlyName, setFriendlyName] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [usage, setUsage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when item changes
  useEffect(() => {
    if (item) {
      setFriendlyName(item.friendlyName || item.name || '');
      setDescription(item.description || '');
      setTags(item.tags || []);
      setUsage(item.usage || '');
      setTagInput('');
    }
  }, [item]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!item) return;

    setIsSaving(true);
    try {
      const updates = {
        friendly_name: friendlyName.trim(),
        description: description.trim(),
        tags: tags,
        usage: usage.trim() || undefined,
      };

      const response = await apiClient.update_media_asset(
        { assetId: item.id },
        updates
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Media metadata updated successfully');
        onOpenChange(false);
        onSuccess(); // Refresh the media library
      } else {
        throw new Error(data.message || 'Failed to update media');
      }
    } catch (error: any) {
      console.error('Error updating media:', error);
      toast.error(error.message || 'Failed to update media metadata');
    } finally {
      setIsSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Media Metadata</DialogTitle>
          <DialogDescription>
            Update the metadata for this media asset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview Image */}
          <div className="flex justify-center">
            <img
              src={item.url}
              alt={item.name}
              className="max-h-48 rounded-lg border border-border/50 object-contain"
            />
          </div>

          {/* Friendly Name */}
          <div className="space-y-2">
            <Label htmlFor="friendly-name">Friendly Name</Label>
            <Input
              id="friendly-name"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder="Enter a friendly display name"
              className="bg-card border-border/50"
            />
            <p className="text-xs text-muted-foreground">
              Original filename: {item.name}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this media asset"
              rows={3}
              className="bg-card border-border/50 resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag and press Enter"
                className="bg-card border-border/50 flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-2 py-1 cursor-pointer hover:bg-secondary/80"
                  >
                    {tag}
                    <X
                      className="ml-1 h-3 w-3"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Usage */}
          <div className="space-y-2">
            <Label htmlFor="usage">Usage</Label>
            <Input
              id="usage"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="e.g., menu-item, general, avatar"
              className="bg-card border-border/50"
            />
            <p className="text-xs text-muted-foreground">
              Specify how this media is being used (optional)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !friendlyName.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
