import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { colors } from '../../../utils/InternalDesignSystem';
import type { TestimonialsContent, TestimonialItem } from '../../../utils/websiteCmsTypes';

interface TestimonialsEditorProps {
  content: TestimonialsContent | null;
  onUpdate: (content: TestimonialsContent) => void;
}

export function TestimonialsEditor({ content, onUpdate }: TestimonialsEditorProps) {
  const title = content?.title || '';
  const subtitle = content?.subtitle || '';
  const reviews = content?.reviews || [];

  const handleReviewChange = (index: number, field: keyof TestimonialItem, value: any) => {
    const newReviews = [...reviews];
    newReviews[index] = { ...newReviews[index], [field]: value };
    onUpdate({ ...content!, reviews: newReviews });
  };

  const addReview = () => {
    const newReview: TestimonialItem = {
      id: Date.now(),
      text: '',
      author: '',
      location: '',
      rating: 5,
      initials: '',
      bgColor: 'bg-rose-100/10',
      textColor: 'text-rose-50',
    };
    onUpdate({ ...content!, reviews: [...reviews, newReview] });
  };

  const removeReview = (index: number) => {
    const newReviews = [...reviews];
    newReviews.splice(index, 1);
    onUpdate({ ...content!, reviews: newReviews });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-white/60">Section Title</Label>
        <Input
          value={title}
          onChange={(e) => onUpdate({ ...content!, title: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-white/60">Subtitle</Label>
        <Input
          value={subtitle}
          onChange={(e) => onUpdate({ ...content!, subtitle: e.target.value })}
          className="text-white text-sm" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-white/60">Reviews ({reviews.length})</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" style={{ color: colors.purple.light }} onClick={addReview}>
            <Plus className="h-3 w-3 mr-1" /> Add Review
          </Button>
        </div>

        {reviews.map((review, i) => (
          <div key={review.id || i} className="p-3 rounded-md space-y-2" style={{ backgroundColor: colors.background.tertiary, border: `1px solid ${colors.border.medium}` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Review #{i + 1}</span>
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 text-white/30 hover:text-red-400"
                onClick={() => removeReview(i)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={review.author}
                onChange={(e) => handleReviewChange(i, 'author', e.target.value)}
                placeholder="Author name"
                className="text-white text-xs" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
              />
              <Input
                value={review.location}
                onChange={(e) => handleReviewChange(i, 'location', e.target.value)}
                placeholder="Location"
                className="text-white text-xs" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
              />
            </div>
            <Textarea
              value={review.text}
              onChange={(e) => handleReviewChange(i, 'text', e.target.value)}
              placeholder="Review text..."
              className="text-white text-xs min-h-[50px]" style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
