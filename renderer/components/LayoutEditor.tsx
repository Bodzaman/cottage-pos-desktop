import React, { useState, useCallback, useEffect } from 'react';
import { Save, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { globalColors, panelStyle } from 'utils/QSAIDesign';
import { apiClient } from 'app';

interface LayoutConfig {
  home?: {
    hero_carousel?: {
      height?: number;
      height_unit?: string;
      autoplay?: boolean;
      autoplay_speed?: number;
      show_controls?: boolean;
    };
    story_section?: {
      layout_style?: string;
      enable_parallax?: boolean;
    };
    signature_dishes?: {
      grid_columns?: number;
      items_per_page?: number;
    };
    testimonials?: {
      enable_carousel?: boolean;
      items_visible?: number;
    };
    cta?: {
      centered?: boolean;
      gradient_background?: boolean;
    };
  };
  about?: {
    heritage_grid?: {
      columns?: number;
      gap_size?: number;
      gap_unit?: string;
    };
    values_grid?: {
      columns?: number;
      card_style?: string;
    };
    timeline?: {
      display_style?: string;
    };
  };
  contact?: {
    form_layout?: {
      columns?: number;
      show_map?: boolean;
    };
    map_settings?: {
      height?: number;
      height_unit?: string;
      default_zoom?: number;
    };
    info_layout?: {
      cards_style?: string;
    };
  };
  gallery?: {
    photos_grid?: {
      columns?: number;
      gap_size?: number;
      gap_unit?: string;
      enable_lightbox?: boolean;
    };
  };
}

interface LayoutEditorProps {
  onLayoutChange?: () => void;
}

type PageId = 'home' | 'about' | 'contact' | 'gallery';

const PAGE_OPTIONS: { value: PageId; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'about', label: 'About' },
  { value: 'contact', label: 'Contact' },
  { value: 'gallery', label: 'Gallery' },
];

const UNIT_OPTIONS = [
  { value: 'px', label: 'px' },
  { value: 'vh', label: 'vh' },
  { value: '%', label: '%' },
  { value: 'rem', label: 'rem' },
];

export function LayoutEditor({ onLayoutChange }: LayoutEditorProps) {
  const [layout, setLayout] = useState<LayoutConfig>({});
  const [selectedPage, setSelectedPage] = useState<PageId>('home');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounced save timer
  const saveTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Load draft layout
  const loadLayout = useCallback(async () => {
    try {
      const response = await apiClient.get_draft_layout();
      const data = await response.json();
      
      if (data.success) {
        setLayout(data.layout);
        setHasUnsavedChanges(data.has_unpublished_changes);
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  }, []);

  // Auto-save with debounce
  const debouncedSave = useCallback((key: string, value: any) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    setSaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const response = await apiClient.update_layout_setting({
          key,
          value,
        });
        const data = await response.json();
        
        if (data.success) {
          setHasUnsavedChanges(true);
          setSaveStatus('saved');
          onLayoutChange?.();
          
          // Reset status after 2s
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } catch (error) {
        console.error('Failed to save layout setting:', error);
        setSaveStatus('idle');
      }
    }, 500);
  }, [onLayoutChange]);

  // Update layout setting
  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const newLayout = { ...layout };
    
    let current: any = newLayout;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setLayout(newLayout);
    debouncedSave(path, value);
  };

  // Reset layout
  const handleReset = async (page?: PageId) => {
    setLoading(true);
    try {
      const response = await apiClient.reset_layout({
        page: page || null,
      });
      const data = await response.json();
      
      if (data.success) {
        await loadLayout();
        onLayoutChange?.();
      }
    } catch (error) {
      console.error('Failed to reset layout:', error);
    } finally {
      setLoading(false);
      setShowResetDialog(false);
      setResetTarget(null);
    }
  };

  // Load on mount
  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  // Helper to get nested value
  const getValue = (path: string, defaultValue: any = undefined) => {
    const keys = path.split('.');
    let current: any = layout;
    for (const key of keys) {
      if (current === undefined || current === null) return defaultValue;
      current = current[key];
    }
    return current !== undefined ? current : defaultValue;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
            Layout Configuration
          </h3>
          <p className="text-sm" style={{ color: globalColors.text.muted }}>
            Configure page layouts and component settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-xs" style={{ color: globalColors.text.muted }}>Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs" style={{ color: globalColors.purple.primary }}>✓ Saved</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResetTarget(selectedPage);
              setShowResetDialog(true);
            }}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Page
          </Button>
        </div>
      </div>

      {/* Page Selector */}
      <div className="mb-6">
        <Label className="mb-2 block" style={{ color: globalColors.text.secondary }}>
          Select Page
        </Label>
        <Select value={selectedPage} onValueChange={(value) => setSelectedPage(value as PageId)}>
          <SelectTrigger
            className="w-full"
            style={{
              ...panelStyle,
              color: globalColors.text.primary,
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Unpublished Changes Alert */}
      {hasUnsavedChanges && (
        <Alert className="mb-4" style={{ borderColor: globalColors.purple.primary }}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unpublished layout changes. Click "Publish All" to make them live.
          </AlertDescription>
        </Alert>
      )}

      {/* Layout Controls by Page */}
      <div className="flex-1 overflow-y-auto">
        {selectedPage === 'home' && (
          <Accordion type="multiple" defaultValue={['hero', 'story', 'dishes']} className="space-y-2">
            {/* Hero Carousel */}
            <AccordionItem value="hero" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Hero Carousel
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                {/* Height */}
                <div>
                  <Label className="mb-2 flex items-center gap-2">
                    Height
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3" style={{ color: globalColors.text.muted }} />
                        </TooltipTrigger>
                        <TooltipContent>Height of the hero carousel</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={getValue('home.hero_carousel.height', 600)}
                      onChange={(e) => updateSetting('home.hero_carousel.height', Number(e.target.value))}
                      className="flex-1"
                    />
                    <Select
                      value={getValue('home.hero_carousel.height_unit', 'px')}
                      onValueChange={(value) => updateSetting('home.hero_carousel.height_unit', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Autoplay */}
                <div className="flex items-center justify-between">
                  <Label>Enable Autoplay</Label>
                  <Switch
                    checked={getValue('home.hero_carousel.autoplay', true)}
                    onCheckedChange={(checked) => updateSetting('home.hero_carousel.autoplay', checked)}
                  />
                </div>

                {/* Autoplay Speed */}
                {getValue('home.hero_carousel.autoplay', true) && (
                  <div>
                    <Label className="mb-2">Autoplay Speed (seconds)</Label>
                    <Slider
                      value={[getValue('home.hero_carousel.autoplay_speed', 5)]}
                      onValueChange={([value]) => updateSetting('home.hero_carousel.autoplay_speed', value)}
                      min={3}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                      {getValue('home.hero_carousel.autoplay_speed', 5)}s
                    </div>
                  </div>
                )}

                {/* Show Controls */}
                <div className="flex items-center justify-between">
                  <Label>Show Navigation Controls</Label>
                  <Switch
                    checked={getValue('home.hero_carousel.show_controls', true)}
                    onCheckedChange={(checked) => updateSetting('home.hero_carousel.show_controls', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Story Section */}
            <AccordionItem value="story" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Story Section
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                {/* Layout Style */}
                <div>
                  <Label className="mb-2">Layout Style</Label>
                  <Select
                    value={getValue('home.story_section.layout_style', 'side-by-side')}
                    onValueChange={(value) => updateSetting('home.story_section.layout_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="side-by-side">Side by Side</SelectItem>
                      <SelectItem value="stacked">Stacked</SelectItem>
                      <SelectItem value="offset">Offset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Parallax */}
                <div className="flex items-center justify-between">
                  <Label>Enable Parallax Effect</Label>
                  <Switch
                    checked={getValue('home.story_section.enable_parallax', false)}
                    onCheckedChange={(checked) => updateSetting('home.story_section.enable_parallax', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Signature Dishes */}
            <AccordionItem value="dishes" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Signature Dishes
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                {/* Grid Columns */}
                <div>
                  <Label className="mb-2">Grid Columns</Label>
                  <Slider
                    value={[getValue('home.signature_dishes.grid_columns', 3)]}
                    onValueChange={([value]) => updateSetting('home.signature_dishes.grid_columns', value)}
                    min={2}
                    max={4}
                    step={1}
                  />
                  <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                    {getValue('home.signature_dishes.grid_columns', 3)} columns
                  </div>
                </div>

                {/* Items Per Page */}
                <div>
                  <Label className="mb-2">Items Per Page</Label>
                  <Input
                    type="number"
                    value={getValue('home.signature_dishes.items_per_page', 6)}
                    onChange={(e) => updateSetting('home.signature_dishes.items_per_page', Number(e.target.value))}
                    min={3}
                    max={12}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Testimonials */}
            <AccordionItem value="testimonials" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Testimonials
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                {/* Enable Carousel */}
                <div className="flex items-center justify-between">
                  <Label>Enable Carousel</Label>
                  <Switch
                    checked={getValue('home.testimonials.enable_carousel', true)}
                    onCheckedChange={(checked) => updateSetting('home.testimonials.enable_carousel', checked)}
                  />
                </div>

                {/* Items Visible */}
                {getValue('home.testimonials.enable_carousel', true) && (
                  <div>
                    <Label className="mb-2">Items Visible</Label>
                    <Slider
                      value={[getValue('home.testimonials.items_visible', 3)]}
                      onValueChange={([value]) => updateSetting('home.testimonials.items_visible', value)}
                      min={1}
                      max={4}
                      step={1}
                    />
                    <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                      {getValue('home.testimonials.items_visible', 3)} items
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* CTA Section */}
            <AccordionItem value="cta" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Call-to-Action
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Centered Layout</Label>
                  <Switch
                    checked={getValue('home.cta.centered', true)}
                    onCheckedChange={(checked) => updateSetting('home.cta.centered', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Gradient Background</Label>
                  <Switch
                    checked={getValue('home.cta.gradient_background', true)}
                    onCheckedChange={(checked) => updateSetting('home.cta.gradient_background', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {selectedPage === 'about' && (
          <Accordion type="multiple" defaultValue={['heritage', 'values']} className="space-y-2">
            {/* Heritage Grid */}
            <AccordionItem value="heritage" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Heritage Grid
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div>
                  <Label className="mb-2">Columns</Label>
                  <Slider
                    value={[getValue('about.heritage_grid.columns', 2)]}
                    onValueChange={([value]) => updateSetting('about.heritage_grid.columns', value)}
                    min={1}
                    max={3}
                    step={1}
                  />
                  <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                    {getValue('about.heritage_grid.columns', 2)} columns
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Gap Size</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={getValue('about.heritage_grid.gap_size', 24)}
                      onChange={(e) => updateSetting('about.heritage_grid.gap_size', Number(e.target.value))}
                      className="flex-1"
                    />
                    <Select
                      value={getValue('about.heritage_grid.gap_unit', 'px')}
                      onValueChange={(value) => updateSetting('about.heritage_grid.gap_unit', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Values Grid */}
            <AccordionItem value="values" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Values Grid
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div>
                  <Label className="mb-2">Columns</Label>
                  <Slider
                    value={[getValue('about.values_grid.columns', 3)]}
                    onValueChange={([value]) => updateSetting('about.values_grid.columns', value)}
                    min={2}
                    max={4}
                    step={1}
                  />
                  <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                    {getValue('about.values_grid.columns', 3)} columns
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Card Style</Label>
                  <Select
                    value={getValue('about.values_grid.card_style', 'elevated')}
                    onValueChange={(value) => updateSetting('about.values_grid.card_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="elevated">Elevated</SelectItem>
                      <SelectItem value="outlined">Outlined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Timeline */}
            <AccordionItem value="timeline" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Timeline
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div>
                  <Label className="mb-2">Display Style</Label>
                  <Select
                    value={getValue('about.timeline.display_style', 'vertical')}
                    onValueChange={(value) => updateSetting('about.timeline.display_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Vertical</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {selectedPage === 'contact' && (
          <Accordion type="multiple" defaultValue={['form', 'map']} className="space-y-2">
            {/* Form Layout */}
            <AccordionItem value="form" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Contact Form
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div>
                  <Label className="mb-2">Form Columns</Label>
                  <Slider
                    value={[getValue('contact.form_layout.columns', 1)]}
                    onValueChange={([value]) => updateSetting('contact.form_layout.columns', value)}
                    min={1}
                    max={2}
                    step={1}
                  />
                  <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                    {getValue('contact.form_layout.columns', 1)} column(s)
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Map</Label>
                  <Switch
                    checked={getValue('contact.form_layout.show_map', true)}
                    onCheckedChange={(checked) => updateSetting('contact.form_layout.show_map', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Map Settings */}
            <AccordionItem value="map" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Map Settings
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div>
                  <Label className="mb-2">Map Height</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={getValue('contact.map_settings.height', 400)}
                      onChange={(e) => updateSetting('contact.map_settings.height', Number(e.target.value))}
                      className="flex-1"
                    />
                    <Select
                      value={getValue('contact.map_settings.height_unit', 'px')}
                      onValueChange={(value) => updateSetting('contact.map_settings.height_unit', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Default Zoom Level</Label>
                  <Slider
                    value={[getValue('contact.map_settings.default_zoom', 15)]}
                    onValueChange={([value]) => updateSetting('contact.map_settings.default_zoom', value)}
                    min={10}
                    max={20}
                    step={1}
                  />
                  <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                    Zoom: {getValue('contact.map_settings.default_zoom', 15)}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Info Layout */}
            <AccordionItem value="info" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Contact Info
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div>
                  <Label className="mb-2">Cards Style</Label>
                  <Select
                    value={getValue('contact.info_layout.cards_style', 'grid')}
                    onValueChange={(value) => updateSetting('contact.info_layout.cards_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {selectedPage === 'gallery' && (
          <Accordion type="multiple" defaultValue={['photos']} className="space-y-2">
            {/* Photos Grid */}
            <AccordionItem value="photos" style={{ ...panelStyle, marginBottom: '8px' }}>
              <AccordionTrigger className="px-4" style={{ color: globalColors.text.primary }}>
                Photos Grid
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                <div>
                  <Label className="mb-2">Grid Columns</Label>
                  <Slider
                    value={[getValue('gallery.photos_grid.columns', 4)]}
                    onValueChange={([value]) => updateSetting('gallery.photos_grid.columns', value)}
                    min={2}
                    max={6}
                    step={1}
                  />
                  <div className="text-xs mt-1" style={{ color: globalColors.text.muted }}>
                    {getValue('gallery.photos_grid.columns', 4)} columns
                  </div>
                </div>
                <div>
                  <Label className="mb-2">Gap Size</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={getValue('gallery.photos_grid.gap_size', 16)}
                      onChange={(e) => updateSetting('gallery.photos_grid.gap_size', Number(e.target.value))}
                      className="flex-1"
                    />
                    <Select
                      value={getValue('gallery.photos_grid.gap_unit', 'px')}
                      onValueChange={(value) => updateSetting('gallery.photos_grid.gap_unit', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Lightbox</Label>
                  <Switch
                    checked={getValue('gallery.photos_grid.enable_lightbox', true)}
                    onCheckedChange={(checked) => updateSetting('gallery.photos_grid.enable_lightbox', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="p-6 rounded-lg max-w-md"
            style={{
              ...panelStyle,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: globalColors.text.primary }}>
              Reset Layout Configuration?
            </h3>
            <p className="text-sm mb-4" style={{ color: globalColors.text.muted }}>
              This will reset {resetTarget ? `the ${resetTarget} page` : 'all pages'} to default layout settings.
              Your current draft changes will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReset(resetTarget as PageId)}
                disabled={loading}
                style={{
                  background: globalColors.purple.primary,
                  color: globalColors.text.primary,
                }}
              >
                {loading ? 'Resetting...' : 'Reset'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
