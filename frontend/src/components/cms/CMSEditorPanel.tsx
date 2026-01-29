import React, { useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';
import { HeroEditor } from './sections/HeroEditor';
import { StoryEditor } from './sections/StoryEditor';
import { TestimonialsEditor } from './sections/TestimonialsEditor';
import { ContactEditor } from './sections/ContactEditor';
import { GalleryEditor } from './sections/GalleryEditor';
import { useAllWebsiteConfigs, useUpdateConfig } from '../../utils/websiteCmsQueries';
import { colors } from '../../utils/InternalDesignSystem';
import type { CMSPage } from '../../utils/websiteCmsTypes';

// Section definitions per page
const PAGE_SECTIONS: Record<CMSPage, { key: string; label: string }[]> = {
  home: [
    { key: 'hero', label: 'Hero Carousel' },
    { key: 'story', label: 'Our Story' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'contact', label: 'Contact & Hours' },
    { key: 'footer', label: 'Footer' },
  ],
  about: [
    { key: 'about_heritage', label: 'Heritage Story' },
    { key: 'about_values', label: 'Core Values' },
    { key: 'about_timeline', label: 'Timeline / Articles' },
    { key: 'about_team', label: 'Team Members' },
    { key: 'about_awards', label: 'Awards' },
  ],
  contact: [
    { key: 'contact', label: 'Contact Details' },
    { key: 'footer', label: 'Footer' },
  ],
  gallery: [
    { key: 'gallery_images', label: 'Gallery Images' },
  ],
};

interface CMSEditorPanelProps {
  activePage: CMSPage;
}

export function CMSEditorPanel({ activePage }: CMSEditorPanelProps) {
  const { data, isLoading } = useAllWebsiteConfigs('draft');
  const updateMutation = useUpdateConfig();

  const sections = PAGE_SECTIONS[activePage] || [];

  // Get content for a section from the loaded data
  const getContent = useCallback(
    (sectionKey: string) => {
      if (!data?.sections) return null;
      const section = data.sections.find((s) => s.section === sectionKey);
      return section?.draft_content || section?.content || null;
    },
    [data]
  );

  // Create update handler for a section
  const handleUpdate = useCallback(
    (sectionKey: string) => (content: any) => {
      updateMutation.mutate({ section: sectionKey, draft_content: content });
    },
    [updateMutation]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <Accordion type="single" collapsible defaultValue={sections[0]?.key} className="px-3 py-2">
        {sections.map(({ key, label }) => {
          const content = getContent(key);
          const hasChanges = data?.sections?.find((s) => s.section === key)?.has_unpublished_changes;

          return (
            <AccordionItem key={key} value={key} style={{ borderColor: colors.border.light }}>
              <AccordionTrigger className="text-sm py-3" style={{ color: colors.text.secondary }}>
                <div className="flex items-center gap-2">
                  {label}
                  {hasChanges && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {renderSectionEditor(key, content, handleUpdate(key))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {sections.length === 0 && (
        <div className="text-center py-12 text-white/40 text-sm">
          No editable sections for this page yet.
        </div>
      )}
    </div>
  );
}

function renderSectionEditor(sectionKey: string, content: any, onUpdate: (c: any) => void) {
  switch (sectionKey) {
    case 'hero':
      return <HeroEditor content={content} onUpdate={onUpdate} />;
    case 'story':
      return <StoryEditor content={content} onUpdate={onUpdate} />;
    case 'testimonials':
      return <TestimonialsEditor content={content} onUpdate={onUpdate} />;
    case 'contact':
      return <ContactEditor content={content} onUpdate={onUpdate} />;
    case 'footer':
      return <ContactEditor content={content} onUpdate={onUpdate} />;
    case 'about_heritage':
      return <StoryEditor content={content} onUpdate={onUpdate} />;
    case 'gallery_images':
      return <GalleryEditor content={content} onUpdate={onUpdate} />;
    case 'about_values':
    case 'about_timeline':
    case 'about_team':
    case 'about_awards':
      return (
        <div className="text-white/40 text-xs p-3 rounded border border-dashed"
          style={{ backgroundColor: colors.background.tertiary, borderColor: colors.border.medium }}>
          Section editor for "{sectionKey}" — content can be edited as JSON until a dedicated editor is built.
          <textarea
            value={content ? JSON.stringify(content, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onUpdate(parsed);
              } catch { /* ignore parse errors while typing */ }
            }}
            className="mt-2 w-full min-h-[100px] text-white/70 text-xs font-mono p-2 rounded"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.border.medium}` }}
          />
        </div>
      );
    default:
      return <div className="text-white/40 text-sm">No editor available for this section.</div>;
  }
}
