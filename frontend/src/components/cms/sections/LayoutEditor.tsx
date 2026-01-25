import React, { useState } from 'react';
import { ChevronDown, Image, Megaphone, UtensilsCrossed, BookOpen, MessageSquare, Grid3X3, Clock, Heart, Mail, MapPin, Map, Camera } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useWebsiteLayout, useUpdateLayout } from '../../../utils/websiteCmsQueries';
import { colors } from '../../../utils/InternalDesignSystem';
import type { CMSPage } from '../../../utils/websiteCmsTypes';

// ============================================================================
// SECTION METADATA
// ============================================================================

interface SettingMeta {
  label: string;
  type: 'toggle' | 'segment' | 'select';
  options?: { value: string; label: string }[];
}

interface SectionMeta {
  label: string;
  icon: React.ElementType;
  settings: Record<string, SettingMeta>;
}

const SECTION_META: Record<string, SectionMeta> = {
  // Home page
  hero_carousel: {
    label: 'Hero Banner',
    icon: Image,
    settings: {
      height: {
        label: 'Banner Height',
        type: 'segment',
        options: [
          { value: '400px', label: 'Short' },
          { value: '600px', label: 'Medium' },
          { value: '800px', label: 'Tall' },
        ],
      },
      autoplay: { label: 'Auto-play', type: 'toggle' },
      speed: {
        label: 'Slide Speed',
        type: 'segment',
        options: [
          { value: '3000', label: 'Slow' },
          { value: '5000', label: 'Normal' },
          { value: '7000', label: 'Fast' },
        ],
      },
      show_controls: { label: 'Show Controls', type: 'toggle' },
      show_indicators: { label: 'Show Indicators', type: 'toggle' },
    },
  },
  cta_section: {
    label: 'Call to Action',
    icon: Megaphone,
    settings: {
      layout_style: {
        label: 'Layout Style',
        type: 'select',
        options: [
          { value: 'centered', label: 'Centred' },
          { value: 'split', label: 'Split' },
          { value: 'banner', label: 'Banner' },
        ],
      },
      background_style: {
        label: 'Background',
        type: 'select',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'gradient', label: 'Gradient' },
          { value: 'image', label: 'Image' },
        ],
      },
    },
  },
  signature_dishes: {
    label: 'Featured Dishes',
    icon: UtensilsCrossed,
    settings: {
      grid_columns: {
        label: 'Columns',
        type: 'segment',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      items_per_page: {
        label: 'Items Shown',
        type: 'segment',
        options: [
          { value: '3', label: '3' },
          { value: '6', label: '6' },
          { value: '9', label: '9' },
        ],
      },
    },
  },
  story_section: {
    label: 'Our Story',
    icon: BookOpen,
    settings: {
      layout_style: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'side-by-side', label: 'Side by Side' },
          { value: 'full-width', label: 'Full Width' },
        ],
      },
      enable_parallax: { label: 'Parallax Effect', type: 'toggle' },
    },
  },
  testimonials: {
    label: 'Customer Reviews',
    icon: MessageSquare,
    settings: {
      layout_style: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'carousel', label: 'Carousel' },
          { value: 'grid', label: 'Grid' },
          { value: 'stacked', label: 'Stacked' },
        ],
      },
      items_visible: {
        label: 'Visible Items',
        type: 'segment',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
    },
  },
  // About page
  heritage_grid: {
    label: 'Heritage Gallery',
    icon: Grid3X3,
    settings: {
      columns: {
        label: 'Columns',
        type: 'segment',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      gap_size: {
        label: 'Spacing',
        type: 'segment',
        options: [
          { value: 'small', label: 'Tight' },
          { value: 'medium', label: 'Normal' },
          { value: 'large', label: 'Wide' },
        ],
      },
    },
  },
  timeline: {
    label: 'Timeline',
    icon: Clock,
    settings: {
      display_style: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'vertical', label: 'Vertical' },
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'alternating', label: 'Alternating' },
        ],
      },
    },
  },
  values_grid: {
    label: 'Our Values',
    icon: Heart,
    settings: {
      columns: {
        label: 'Columns',
        type: 'segment',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      card_style: {
        label: 'Card Style',
        type: 'select',
        options: [
          { value: 'flat', label: 'Flat' },
          { value: 'elevated', label: 'Elevated' },
          { value: 'bordered', label: 'Bordered' },
        ],
      },
    },
  },
  // Contact page
  form_layout: {
    label: 'Contact Form',
    icon: Mail,
    settings: {
      columns: {
        label: 'Columns',
        type: 'segment',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
        ],
      },
      show_map: { label: 'Show Map', type: 'toggle' },
    },
  },
  info_layout: {
    label: 'Info Display',
    icon: MapPin,
    settings: {
      display_style: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'cards', label: 'Cards' },
          { value: 'list', label: 'List' },
          { value: 'inline', label: 'Inline' },
        ],
      },
    },
  },
  map_settings: {
    label: 'Map',
    icon: Map,
    settings: {
      height: {
        label: 'Map Height',
        type: 'segment',
        options: [
          { value: '300px', label: 'Short' },
          { value: '450px', label: 'Medium' },
          { value: '600px', label: 'Tall' },
        ],
      },
      zoom_level: {
        label: 'Zoom Level',
        type: 'segment',
        options: [
          { value: '13', label: 'Far' },
          { value: '15', label: 'Normal' },
          { value: '17', label: 'Close' },
        ],
      },
    },
  },
  // Gallery page
  photos_grid: {
    label: 'Photo Grid',
    icon: Camera,
    settings: {
      columns: {
        label: 'Columns',
        type: 'segment',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
        ],
      },
      gap_size: {
        label: 'Spacing',
        type: 'segment',
        options: [
          { value: 'small', label: 'Tight' },
          { value: 'medium', label: 'Normal' },
          { value: 'large', label: 'Wide' },
        ],
      },
      lightbox: { label: 'Lightbox', type: 'toggle' },
    },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface LayoutEditorProps {
  page: CMSPage;
}

export function LayoutEditor({ page }: LayoutEditorProps) {
  const { data, isLoading } = useWebsiteLayout(page, 'draft');
  const updateMutation = useUpdateLayout();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-white/40 text-sm p-4">Loading layout...</div>;
  }

  const layouts = data?.layouts || [];

  if (layouts.length === 0) {
    return (
      <div className="text-white/40 text-sm p-4 text-center">
        No layout settings for this page yet.
      </div>
    );
  }

  // Group layout items by component
  const sectionGroups = groupByComponent(layouts);

  return (
    <div className="space-y-2 p-4">
      <p className="text-xs text-white/50 mb-3">
        Configure how each section appears on your {page} page.
      </p>

      {Object.entries(sectionGroups).map(([component, items]) => {
        const meta = SECTION_META[component];
        const isExpanded = expandedSection === component;
        const hasChanges = items.some((item) => item.has_unpublished_changes);

        // Get visibility from any item's config (usually first)
        const primaryItem = items[0];
        const primaryConfig = primaryItem.draft_config || primaryItem.published_config || {};
        const isVisible = primaryConfig.visible !== false;

        const Icon = meta?.icon || Grid3X3;
        const label = meta?.label || formatComponentName(component);

        return (
          <div
            key={component}
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: colors.background.tertiary,
              border: `1px solid ${isExpanded ? 'rgba(124, 58, 237, 0.3)' : colors.border.medium}`,
            }}
          >
            {/* Card header */}
            <button
              onClick={() => setExpandedSection(isExpanded ? null : component)}
              className="w-full flex items-center gap-3 p-3 cursor-pointer"
            >
              <Icon className="w-4 h-4 text-white/50 shrink-0" />
              <span className="text-sm text-white/85 font-medium flex-1 text-left">{label}</span>

              {hasChanges && (
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              )}

              {/* Visibility toggle */}
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={isVisible}
                  onCheckedChange={(checked) => {
                    // Update all items in this group
                    for (const item of items) {
                      const config = item.draft_config || item.published_config || {};
                      updateMutation.mutate({
                        page,
                        layout_key: item.layout_key,
                        draft_config: { ...config, visible: checked },
                      });
                    }
                  }}
                />
              </div>

              <ChevronDown
                className="w-4 h-4 text-white/30 transition-transform shrink-0"
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* Expanded settings */}
            {isExpanded && (
              <div
                className="px-3 pb-3 pt-1 space-y-3"
                style={{ borderTop: `1px solid ${colors.border.medium}` }}
              >
                {items.map((item) => {
                  const config = item.draft_config || item.published_config || {};
                  // Extract the setting key from layout_key
                  // Remove page prefix first (e.g., "home_hero_carousel_height" -> "hero_carousel_height")
                  // Then remove component prefix (e.g., "hero_carousel_height" -> "height")
                  let settingKey = item.layout_key;
                  if (settingKey.startsWith(`${page}_`)) {
                    settingKey = settingKey.slice(page.length + 1);
                  }
                  if (settingKey.startsWith(`${component}_`)) {
                    settingKey = settingKey.slice(component.length + 1);
                  }
                  const settingMeta = meta?.settings[settingKey];

                  if (!settingMeta) {
                    // Fallback for unknown settings — skip "visible" since it's the toggle
                    if (settingKey === component) return null; // Base item with just visible
                    return (
                      <FallbackControl
                        key={item.id}
                        label={formatSettingName(settingKey)}
                        value={config[settingKey]}
                        hasChanges={item.has_unpublished_changes}
                        onChange={(val) => {
                          updateMutation.mutate({
                            page,
                            layout_key: item.layout_key,
                            draft_config: { ...config, [settingKey]: val },
                          });
                        }}
                      />
                    );
                  }

                  const currentValue = config[settingKey];

                  if (settingMeta.type === 'toggle') {
                    return (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-xs text-white/60">{settingMeta.label}</span>
                        <div className="flex items-center gap-2">
                          {item.has_unpublished_changes && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          )}
                          <Switch
                            checked={currentValue === true || currentValue === 'true'}
                            onCheckedChange={(checked) => {
                              updateMutation.mutate({
                                page,
                                layout_key: item.layout_key,
                                draft_config: { ...config, [settingKey]: checked },
                              });
                            }}
                          />
                        </div>
                      </div>
                    );
                  }

                  if (settingMeta.type === 'segment') {
                    return (
                      <div key={item.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60">{settingMeta.label}</span>
                          {item.has_unpublished_changes && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          )}
                        </div>
                        <SegmentedControl
                          options={settingMeta.options || []}
                          value={String(currentValue || '')}
                          onChange={(val) => {
                            updateMutation.mutate({
                              page,
                              layout_key: item.layout_key,
                              draft_config: { ...config, [settingKey]: val },
                            });
                          }}
                        />
                      </div>
                    );
                  }

                  if (settingMeta.type === 'select') {
                    return (
                      <div key={item.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60">{settingMeta.label}</span>
                          {item.has_unpublished_changes && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          )}
                        </div>
                        <PillSelect
                          options={settingMeta.options || []}
                          value={String(currentValue || '')}
                          onChange={(val) => {
                            updateMutation.mutate({
                              page,
                              layout_key: item.layout_key,
                              draft_config: { ...config, [settingKey]: val },
                            });
                          }}
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      className="inline-flex rounded-md overflow-hidden"
      style={{ border: `1px solid ${colors.border.medium}` }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
              color: isActive ? 'rgba(167, 139, 250, 1)' : 'rgba(255,255,255,0.5)',
              borderRight: `1px solid ${colors.border.medium}`,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface PillSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

function PillSelect({ options, value, onChange }: PillSelectProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors cursor-pointer"
            style={{
              backgroundColor: isActive ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.05)',
              color: isActive ? 'rgba(167, 139, 250, 1)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isActive ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface FallbackControlProps {
  label: string;
  value: any;
  hasChanges: boolean;
  onChange: (value: any) => void;
}

function FallbackControl({ label, value, hasChanges, onChange }: FallbackControlProps) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">{label}</span>
        <div className="flex items-center gap-2">
          {hasChanges && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          <Switch checked={value} onCheckedChange={onChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-24 shrink-0">{label}</span>
      <input
        type="text"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs text-white rounded-md px-2 py-1.5"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border.medium}` }}
      />
      {hasChanges && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

interface LayoutItem {
  id: string;
  layout_key: string;
  component: string | null;
  draft_config: Record<string, any> | null;
  published_config: Record<string, any> | null;
  has_unpublished_changes: boolean;
  [key: string]: any;
}

function groupByComponent(layouts: LayoutItem[]): Record<string, LayoutItem[]> {
  const groups: Record<string, LayoutItem[]> = {};
  for (const item of layouts) {
    const component = item.component || item.layout_key.split('_').slice(0, -1).join('_') || item.layout_key;
    if (!groups[component]) groups[component] = [];
    groups[component].push(item);
  }
  return groups;
}

function formatComponentName(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatSettingName(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
