import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { colors } from '../../../utils/InternalDesignSystem';
import type { StoryContent } from '../../../utils/websiteCmsTypes';

interface StoryEditorProps {
  content: StoryContent | null;
  onUpdate: (content: StoryContent) => void;
}

export function StoryEditor({ content, onUpdate }: StoryEditorProps) {
  const title = content?.title || '';
  const paragraphs = content?.paragraphs || [];
  const cta_text = content?.cta_text || '';
  const background_image = content?.background_image || '';

  const handleParagraphChange = (index: number, value: string) => {
    const newParagraphs = [...paragraphs];
    newParagraphs[index] = value;
    onUpdate({ ...content!, paragraphs: newParagraphs });
  };

  const addParagraph = () => {
    onUpdate({ ...content!, paragraphs: [...paragraphs, ''] });
  };

  const removeParagraph = (index: number) => {
    const newParagraphs = [...paragraphs];
    newParagraphs.splice(index, 1);
    onUpdate({ ...content!, paragraphs: newParagraphs });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-white/60">Section Title</Label>
        <Input
          value={title}
          onChange={(e) => onUpdate({ ...content!, title: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
          placeholder="Our Story"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-white/60">Paragraphs ({paragraphs.length})</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" style={{ color: colors.purple.light }} onClick={addParagraph}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        {paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={p}
              onChange={(e) => handleParagraphChange(i, e.target.value)}
              className="text-white text-sm min-h-[60px] flex-1" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
              placeholder={`Paragraph ${i + 1}`}
            />
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-white/30 hover:text-red-400 shrink-0"
              onClick={() => removeParagraph(i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">CTA Button Text</Label>
        <Input
          value={cta_text}
          onChange={(e) => onUpdate({ ...content!, cta_text: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
          placeholder="Read Full Story"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">Background Image URL</Label>
        <Input
          value={background_image}
          onChange={(e) => onUpdate({ ...content!, background_image: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
          placeholder="https://..."
        />
        {background_image && (
          <img src={background_image} alt="" className="w-full h-20 object-cover rounded opacity-60" />
        )}
      </div>
    </div>
  );
}
