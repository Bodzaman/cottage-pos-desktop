import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical, Loader2 } from 'lucide-react';
import { CMS_FONT_OPTIONS, loadAllFonts, getFontFamily, DEFAULT_TITLE_FONT, DEFAULT_BODY_FONT } from '../../../utils/cmsFonts';
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
import type { HeroContent } from '../../../utils/websiteCmsTypes';

interface HeroEditorProps {
  content: HeroContent | null;
  onUpdate: (content: HeroContent) => void;
}

function SortableImageItem({ id, url, onRemove }: { id: string; url: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: colors.background.tertiary,
    border: `1px solid ${colors.border.medium}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-md group"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-white/30 hover:text-white/60">
        <GripVertical className="h-4 w-4" />
      </button>
      <img src={url} alt="" className="h-10 w-16 object-cover rounded" />
      <span className="flex-1 text-xs text-white/50 truncate">{url.split('/').pop()}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function HeroEditor({ content, onUpdate }: HeroEditorProps) {
  const uploadMutation = useUploadWebsiteImage();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const images = content?.images || [];
  const title = content?.title || '';
  const subtitle = content?.subtitle || '';
  const titleFont = content?.title_font || DEFAULT_TITLE_FONT;
  const bodyFont = content?.body_font || DEFAULT_BODY_FONT;

  useEffect(() => {
    loadAllFonts();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      const newImages = arrayMove(images, oldIndex, newIndex);
      onUpdate({ ...content!, images: newImages });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onUpdate({ ...content!, images: newImages });
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadMutation.mutate(
        { file, section: 'hero' },
        {
          onSuccess: (result) => {
            if (result.success && result.urls?.hero) {
              const newImages = [...(content?.images || []), result.urls.hero];
              onUpdate({ ...content!, images: newImages });
            }
          },
        }
      );
    }
    e.target.value = '';
  }, [content, onUpdate, uploadMutation]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-white/60">Title</Label>
        <Input
          value={title}
          onChange={(e) => onUpdate({ ...content!, title: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
          placeholder="Restaurant name"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">Title Font</Label>
        <Select
          value={titleFont}
          onValueChange={(value) => onUpdate({ ...content!, title_font: value })}
        >
          <SelectTrigger
            className="text-white text-sm h-9"
            style={{
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              fontFamily: getFontFamily(titleFont),
            }}
          >
            <SelectValue placeholder="Select font..." />
          </SelectTrigger>
          <SelectContent>
            {CMS_FONT_OPTIONS.map((font) => (
              <SelectItem
                key={font.id}
                value={font.id}
                className="text-sm"
                style={{ fontFamily: font.family }}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-white/40">Applies to the restaurant name wordmark</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">Subtitle</Label>
        <Input
          value={subtitle}
          onChange={(e) => onUpdate({ ...content!, subtitle: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
          placeholder="Tagline"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">Page Font</Label>
        <Select
          value={bodyFont}
          onValueChange={(value) => onUpdate({ ...content!, body_font: value })}
        >
          <SelectTrigger
            className="text-white text-sm h-9"
            style={{
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
              fontFamily: getFontFamily(bodyFont),
            }}
          >
            <SelectValue placeholder="Select font..." />
          </SelectTrigger>
          <SelectContent>
            {CMS_FONT_OPTIONS.map((font) => (
              <SelectItem
                key={font.id}
                value={font.id}
                className="text-sm"
                style={{ fontFamily: font.family }}
              >
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-white/40">Applies to all other text on the website</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-white/60">Carousel Images ({images.length})</Label>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <span className="inline-flex items-center gap-1 text-xs hover:opacity-80" style={{ color: colors.purple.light }}>
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
          <SortableContext items={images} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {images.map((url, index) => (
                <SortableImageItem
                  key={url}
                  id={url}
                  url={url}
                  onRemove={() => handleRemoveImage(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {images.length === 0 && (
          <div className="text-center py-6 text-white/30 text-sm border border-dashed rounded-md" style={{ borderColor: colors.border.medium }}>
            No images yet. Click "Add Images" to upload.
          </div>
        )}
      </div>
    </div>
  );
}
