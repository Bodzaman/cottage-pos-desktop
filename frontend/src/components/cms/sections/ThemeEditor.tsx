import React, { useState, useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useWebsiteTheme, useUpdateTheme } from '../../../utils/websiteCmsQueries';
import { colors } from '../../../utils/InternalDesignSystem';

// ============================================================================
// THEME PRESETS
// ============================================================================

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  swatches: string[]; // 4 preview colors shown on card
  values: Record<string, string>;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional & warm',
    swatches: ['#7F1D1D', '#D4D4D8', '#FFFFFF', '#111827'],
    values: {
      primary_burgundy: '#7F1D1D',
      secondary_silver: '#D4D4D8',
      background_primary: '#FFFFFF',
      background_secondary: '#F3F4F6',
      text_primary: '#111827',
      text_secondary: '#6B7280',
      border_light: '#E5E7EB',
      border_medium: '#D1D5DB',
      font_heading: 'serif',
      font_body: 'sans-serif',
      size_h1: '3rem',
      size_h2: '2.25rem',
      size_h3: '1.875rem',
      size_h4: '1.5rem',
      size_body: '1rem',
      weight_heading: '700',
      weight_body: '400',
      line_height_heading: '1.2',
      line_height_body: '1.6',
      container_max_width: '1280px',
      section_padding_x: '1rem',
      section_padding_y: '4rem',
      element_spacing: '1rem',
      grid_gap: '2rem',
      border_radius: '0.5rem',
      shadow_style: 'medium',
      transition_speed: '0.3s',
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean & minimal',
    swatches: ['#334155', '#94A3B8', '#FAFAFA', '#1E293B'],
    values: {
      primary_burgundy: '#334155',
      secondary_silver: '#94A3B8',
      background_primary: '#FAFAFA',
      background_secondary: '#F1F5F9',
      text_primary: '#1E293B',
      text_secondary: '#64748B',
      border_light: '#E2E8F0',
      border_medium: '#CBD5E1',
      font_heading: 'Inter, sans-serif',
      font_body: 'Inter, sans-serif',
      size_h1: '2.75rem',
      size_h2: '2rem',
      size_h3: '1.5rem',
      size_h4: '1.25rem',
      size_body: '1rem',
      weight_heading: '600',
      weight_body: '400',
      line_height_heading: '1.3',
      line_height_body: '1.7',
      container_max_width: '1200px',
      section_padding_x: '1.5rem',
      section_padding_y: '5rem',
      element_spacing: '1.25rem',
      grid_gap: '1.5rem',
      border_radius: '0.75rem',
      shadow_style: 'subtle',
      transition_speed: '0.2s',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Vibrant & contemporary',
    swatches: ['#581C87', '#A855F7', '#FFFBEB', '#1C1917'],
    values: {
      primary_burgundy: '#581C87',
      secondary_silver: '#A855F7',
      background_primary: '#FFFBEB',
      background_secondary: '#FEF3C7',
      text_primary: '#1C1917',
      text_secondary: '#57534E',
      border_light: '#FDE68A',
      border_medium: '#D6D3D1',
      font_heading: 'system-ui, sans-serif',
      font_body: 'system-ui, sans-serif',
      size_h1: '3.5rem',
      size_h2: '2.5rem',
      size_h3: '2rem',
      size_h4: '1.5rem',
      size_body: '1.05rem',
      weight_heading: '800',
      weight_body: '400',
      line_height_heading: '1.1',
      line_height_body: '1.6',
      container_max_width: '1400px',
      section_padding_x: '1.5rem',
      section_padding_y: '4.5rem',
      element_spacing: '1rem',
      grid_gap: '2.5rem',
      border_radius: '1rem',
      shadow_style: 'strong',
      transition_speed: '0.25s',
    },
  },
];

// ============================================================================
// FRIENDLY LABELS
// ============================================================================

const THEME_LABELS: Record<string, string> = {
  primary_burgundy: 'Primary Colour',
  secondary_silver: 'Secondary Colour',
  background_primary: 'Background',
  background_secondary: 'Background (alt)',
  text_primary: 'Text Colour',
  text_secondary: 'Text (muted)',
  border_light: 'Border (light)',
  border_medium: 'Border (medium)',
  font_heading: 'Heading Font',
  font_body: 'Body Font',
  size_h1: 'Heading 1 Size',
  size_h2: 'Heading 2 Size',
  size_h3: 'Heading 3 Size',
  size_h4: 'Heading 4 Size',
  size_body: 'Body Text Size',
  weight_heading: 'Heading Weight',
  weight_body: 'Body Weight',
  line_height_heading: 'Heading Line Height',
  line_height_body: 'Body Line Height',
  container_max_width: 'Max Content Width',
  section_padding_x: 'Horizontal Padding',
  section_padding_y: 'Vertical Padding',
  element_spacing: 'Element Spacing',
  grid_gap: 'Grid Gap',
  border_radius: 'Corner Roundness',
  shadow_style: 'Shadow Style',
  transition_speed: 'Animation Speed',
};

const CATEGORY_LABELS: Record<string, string> = {
  colors: 'Colours',
  typography: 'Typography',
  spacing: 'Spacing',
  effects: 'Effects',
};

const FONT_OPTIONS = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System' },
  { value: '"Playfair Display", serif', label: 'Playfair Display' },
  { value: '"Georgia", serif', label: 'Georgia' },
];

const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

const WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ThemeEditor() {
  const { data, isLoading } = useWebsiteTheme('draft');
  const updateMutation = useUpdateTheme();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);

  const variables = data?.variables || [];

  // Build a lookup of current values
  const currentValues = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of variables) {
      map[v.theme_key] = v.draft_value || v.published_value || '';
    }
    return map;
  }, [variables]);

  // Detect which preset (if any) matches current values
  const activePresetId = useMemo(() => {
    for (const preset of THEME_PRESETS) {
      const matches = Object.entries(preset.values).every(
        ([key, val]) => currentValues[key] === val
      );
      if (matches) return preset.id;
    }
    return null;
  }, [currentValues]);

  // Group variables by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof variables> = {};
    for (const v of variables) {
      const cat = v.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    }
    return groups;
  }, [variables]);

  const applyPreset = async (preset: ThemePreset) => {
    setApplyingPreset(preset.id);
    for (const [key, value] of Object.entries(preset.values)) {
      if (currentValues[key] !== value) {
        updateMutation.mutate({ theme_key: key, draft_value: value });
      }
    }
    // Small delay so user sees the applying state
    setTimeout(() => setApplyingPreset(null), 600);
  };

  if (isLoading) {
    return <div className="text-white/40 text-sm p-4">Loading theme...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Preset selector */}
      <div>
        <p className="text-xs text-white/50 mb-3">Choose a starting theme, then customise below.</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            const isApplying = applyingPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                disabled={isApplying}
                className="relative flex flex-col items-start p-3 rounded-lg text-left transition-all cursor-pointer"
                style={{
                  backgroundColor: isActive ? 'rgba(124, 58, 237, 0.12)' : colors.background.tertiary,
                  border: `1.5px solid ${isActive ? 'rgba(124, 58, 237, 0.5)' : colors.border.medium}`,
                }}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                )}
                {/* Swatch strip */}
                <div className="flex gap-1 mb-2">
                  {preset.swatches.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: color,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-white/90">{preset.name}</span>
                <span className="text-[11px] text-white/40 mt-0.5">{preset.description}</span>
                {isApplying && (
                  <span className="text-[10px] text-purple-300 mt-1">Applying...</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: colors.border.medium }} />

      {/* Customise section */}
      <div>
        <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">Customise</p>
        <div className="space-y-1">
          {Object.entries(grouped).map(([category, vars]) => {
            const isExpanded = expandedCategory === category;
            const hasChanges = vars.some((v) => v.has_unpublished_changes);
            return (
              <div key={category}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    {hasChanges && (
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <ChevronDown
                    className="w-4 h-4 text-white/40 transition-transform"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {isExpanded && (
                  <div className="pl-3 pr-1 pb-3 space-y-2.5">
                    {vars.map((v) => (
                      <ThemeControl
                        key={v.id}
                        themeKey={v.theme_key}
                        category={category}
                        value={v.draft_value || v.published_value || ''}
                        hasChanges={v.has_unpublished_changes}
                        onChange={(val) => updateMutation.mutate({ theme_key: v.theme_key, draft_value: val })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// INDIVIDUAL THEME CONTROL
// ============================================================================

// Helper to format unknown keys as readable labels
function formatLabel(key: string): string {
  return key
    .replace(/^(colors?|typography|spacing|effects)_/, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface ThemeControlProps {
  themeKey: string;
  category: string;
  value: string;
  hasChanges: boolean;
  onChange: (value: string) => void;
}

function ThemeControl({ themeKey, category, value, hasChanges, onChange }: ThemeControlProps) {
  // Strip category prefix for label lookup (e.g., "typography_font_heading" → "font_heading")
  const keyWithoutPrefix = themeKey.includes('_')
    ? themeKey.split('_').slice(1).join('_')
    : themeKey;
  const label = THEME_LABELS[keyWithoutPrefix] || THEME_LABELS[themeKey] || formatLabel(themeKey);

  // Color inputs
  if (category === 'colors') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60 w-28 shrink-0 truncate" title={label}>
          {label}
        </span>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer bg-transparent border-none"
            style={{ border: `1px solid ${colors.border.medium}` }}
          />
          <span className="text-[11px] text-white/40 font-mono">{value}</span>
        </div>
        {hasChanges && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
      </div>
    );
  }

  // Font family dropdowns
  if (themeKey === 'font_heading' || themeKey === 'font_body') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60 w-28 shrink-0 truncate" title={label}>
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs text-white bg-transparent rounded-md px-2 py-1.5 cursor-pointer"
          style={{ border: `1px solid ${colors.border.medium}`, backgroundColor: colors.background.tertiary }}
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasChanges && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
      </div>
    );
  }

  // Font weight dropdowns
  if (themeKey === 'weight_heading' || themeKey === 'weight_body') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60 w-28 shrink-0 truncate" title={label}>
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs text-white bg-transparent rounded-md px-2 py-1.5 cursor-pointer"
          style={{ border: `1px solid ${colors.border.medium}`, backgroundColor: colors.background.tertiary }}
        >
          {WEIGHT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasChanges && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
      </div>
    );
  }

  // Shadow style dropdown
  if (themeKey === 'shadow_style') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60 w-28 shrink-0 truncate" title={label}>
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs text-white bg-transparent rounded-md px-2 py-1.5 cursor-pointer"
          style={{ border: `1px solid ${colors.border.medium}`, backgroundColor: colors.background.tertiary }}
        >
          {SHADOW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasChanges && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
      </div>
    );
  }

  // Size/spacing — range slider
  if (category === 'spacing' || themeKey.startsWith('size_') || themeKey === 'border_radius' || themeKey === 'transition_speed' || themeKey.startsWith('line_height_')) {
    const numericValue = parseFloat(value) || 0;
    const unit = value.replace(/[\d.]/g, '') || '';
    const max = themeKey.includes('max_width') ? 1600
      : themeKey.includes('padding_y') ? 8
      : themeKey.startsWith('size_h') ? 5
      : themeKey === 'size_body' ? 2
      : themeKey.startsWith('line_height') ? 2.5
      : themeKey === 'border_radius' ? 2
      : themeKey === 'transition_speed' ? 1
      : themeKey === 'grid_gap' ? 4
      : 4;
    const step = themeKey.includes('max_width') ? 20
      : themeKey === 'transition_speed' ? 0.05
      : themeKey.startsWith('line_height') ? 0.1
      : 0.25;

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60 w-28 shrink-0 truncate" title={label}>
          {label}
        </span>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="range"
            min={0}
            max={max}
            step={step}
            value={numericValue}
            onChange={(e) => {
              const newVal = parseFloat(e.target.value);
              onChange(themeKey.includes('max_width') ? `${newVal}px` : `${newVal}${unit}`);
            }}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#7C3AED' }}
          />
          <span className="text-[11px] text-white/40 font-mono w-14 text-right">{value}</span>
        </div>
        {hasChanges && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
      </div>
    );
  }

  // Default: text input (fallback)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-28 shrink-0 truncate" title={label}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs text-white rounded-md px-2 py-1.5"
        style={{ backgroundColor: colors.background.tertiary, border: `1px solid ${colors.border.medium}` }}
      />
      {hasChanges && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
    </div>
  );
}
