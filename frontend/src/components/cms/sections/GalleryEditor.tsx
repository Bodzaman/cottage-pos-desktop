import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUploadWebsiteImage } from '../../../utils/websiteCmsQueries';
import { colors } from '../../../utils/InternalDesignSystem';
import type { GalleryImagesContent, GalleryImageItem } from '../../../utils/websiteCmsTypes';

interface GalleryEditorProps {
  content: GalleryImagesContent | null;
  onUpdate: (content: GalleryImagesContent) => void;
}

interface SortableGalleryItemProps {
  item: GalleryImageItem;
  onUpdate: (field: keyof GalleryImageItem, value: any) => void;
  onRemove: () => void;
}

function SortableGalleryItem({ item, onUpdate, onRemove }: SortableGalleryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: colors.background.tertiary,
    border: `1px solid ${colors.border.medium}`,
  };

  return (
    <div ref={setNodeRef} style={style} className="p-3 rounded-md space-y-2">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-white/30 hover:text-white/60 mt-1">
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="w-20 h-14 rounded overflow-hidden flex-shrink-0 bg-black/20">
          {item.src ? (
            <img src={item.src} alt={item.alt} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <Input
            value={item.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="Image title"
            className="text-white text-xs h-7"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: colors.border.medium }}
          />
          <div className="flex gap-2">
            <Input
              value={item.alt}
              onChange={(e) => onUpdate('alt', e.target.value)}
              placeholder="Alt text"
              className="text-white text-xs h-7 flex-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: colors.border.medium }}
            />
            <Select
              value={item.category}
              onValueChange={(value) => onUpdate('category', value)}
            >
              <SelectTrigger
                className="w-24 h-7 text-xs text-white"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: colors.border.medium }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="food">Food</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/30 hover:text-red-400 flex-shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="pl-6">
        <Textarea
          value={item.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Description (optional)"
          className="text-white text-xs min-h-[40px]"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: colors.border.medium }}
        />
      </div>
    </div>
  );
}

export function GalleryEditor({ content, onUpdate }: GalleryEditorProps) {
  const uploadMutation = useUploadWebsiteImage();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const title = content?.title || 'Our Gallery';
  const subtitle = content?.subtitle || '';
  const heroImage = content?.hero_image || '';
  const images = content?.images || [];
  const includeMenuImages = content?.include_menu_images ?? true;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const newImages = arrayMove(images, oldIndex, newIndex).map((img, i) => ({
        ...img,
        order: i,
      }));
      onUpdate({ ...content!, images: newImages });
    }
  };

  const handleImageUpdate = (index: number, field: keyof GalleryImageItem, value: any) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    onUpdate({ ...content!, images: newImages });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onUpdate({ ...content!, images: newImages.map((img, i) => ({ ...img, order: i })) });
  };

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        uploadMutation.mutate(
          { file, section: 'gallery' },
          {
            onSuccess: (result) => {
              if (result.success && result.urls?.hero) {
                const newImage: GalleryImageItem = {
                  id: Date.now() + i,
                  src: result.urls.hero,
                  alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                  category: 'venue',
                  title: '',
                  description: '',
                  order: (content?.images?.length || 0) + i,
                };
                const newImages = [...(content?.images || []), newImage];
                onUpdate({ ...content!, images: newImages });
              }
            },
          }
        );
      }
      e.target.value = '';
    },
    [content, onUpdate, uploadMutation]
  );

  const handleHeroUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      uploadMutation.mutate(
        { file, section: 'gallery' },
        {
          onSuccess: (result) => {
            if (result.success && result.urls?.hero) {
              onUpdate({ ...content!, hero_image: result.urls.hero });
            }
          },
        }
      );
      e.target.value = '';
    },
    [content, onUpdate, uploadMutation]
  );

  return (
    <div className="space-y-5">
      {/* Page Settings */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-white/40 uppercase tracking-wider">Page Settings</div>

        <div className="space-y-2">
          <Label className="text-xs text-white/60">Page Title</Label>
          <Input
            value={title}
            onChange={(e) => onUpdate({ ...content!, title: e.target.value })}
            className="text-white text-sm"
            style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            placeholder="Gallery"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-white/60">Subtitle</Label>
          <Input
            value={subtitle}
            onChange={(e) => onUpdate({ ...content!, subtitle: e.target.value })}
            className="text-white text-sm"
            style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            placeholder="Experience the ambiance..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-white/60">Hero Background Image</Label>
          <div className="flex items-center gap-2">
            {heroImage ? (
              <div className="relative w-24 h-14 rounded overflow-hidden">
                <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
                <button
                  className="absolute top-0 right-0 p-1 bg-black/60 text-white/60 hover:text-red-400"
                  onClick={() => onUpdate({ ...content!, hero_image: '' })}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="w-24 h-14 rounded flex items-center justify-center text-white/20 border border-dashed"
                style={{ borderColor: colors.border.medium }}
              >
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleHeroUpload}
              />
              <span
                className="text-xs hover:opacity-80"
                style={{ color: colors.purple.light }}
              >
                {heroImage ? 'Change' : 'Upload'}
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-xs text-white/60">Include Menu Item Images</Label>
            <p className="text-[10px] text-white/40">Show food images from menu items in the Food category</p>
          </div>
          <Switch
            checked={includeMenuImages}
            onCheckedChange={(checked) => onUpdate({ ...content!, include_menu_images: checked })}
          />
        </div>
      </div>

      {/* Gallery Images */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Venue Images ({images.length})
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <span
              className="inline-flex items-center gap-1 text-xs hover:opacity-80"
              style={{ color: colors.purple.light }}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              Add Images
            </span>
          </label>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {images.map((image, index) => (
                <SortableGalleryItem
                  key={image.id}
                  item={image}
                  onUpdate={(field, value) => handleImageUpdate(index, field, value)}
                  onRemove={() => handleRemoveImage(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {images.length === 0 && (
          <div
            className="text-center py-8 text-white/30 text-sm border border-dashed rounded-md"
            style={{ borderColor: colors.border.medium }}
          >
            No venue images yet. Click "Add Images" to upload.
          </div>
        )}
      </div>
    </div>
  );
}
