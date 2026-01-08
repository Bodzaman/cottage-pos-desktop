import React, { useState, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { apiClient } from 'app';
import { toast } from 'sonner';

interface ThemeEditorProps {
  onThemeChange?: () => void;
}

interface ThemeConfig {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  effects: Record<string, string>;
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {},
  typography: {},
  spacing: {},
  effects: {},
};

export function ThemeEditor({ onThemeChange }: ThemeEditorProps) {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load draft theme
  const loadTheme = useCallback(async () => {
    try {
      const response = await apiClient.get_draft_theme();
      const data = await response.json();
      
      if (data.success) {
        setTheme(data.theme);
        setHasUnsavedChanges(data.has_unpublished_changes);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      toast.error('Failed to load theme configuration');
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  // Debounced update function
  const updateThemeSetting = useCallback(
    async (category: string, key: string, value: string) => {
      try {
        const response = await apiClient.update_theme_setting({
          category,
          key,
          value,
        });
        
        const data = await response.json();
        
        if (data.success) {
          setHasUnsavedChanges(true);
          onThemeChange?.();
        }
      } catch (error) {
        console.error('Failed to update theme setting:', error);
        toast.error('Failed to update theme setting');
      }
    },
    [onThemeChange]
  );

  // Color change handler with debounce
  const handleColorChange = (category: string, key: string, value: string) => {
    // Update local state immediately for responsive UI
    setTheme((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof ThemeConfig],
        [key]: value,
      },
    }));

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      updateThemeSetting(category, key, value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Input change handler
  const handleInputChange = (category: string, key: string, value: string) => {
    setTheme((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof ThemeConfig],
        [key]: value,
      },
    }));

    // Debounce API call
    const timeoutId = setTimeout(() => {
      updateThemeSetting(category, key, value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Reset theme to default
  const handleResetTheme = async () => {
    setLoading(true);
    try {
      const response = await apiClient.reset_theme_to_default({ confirm: true });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Theme reset to default Cottage Tandoori theme');
        await loadTheme();
        onThemeChange?.();
      }
    } catch (error) {
      console.error('Failed to reset theme:', error);
      toast.error('Failed to reset theme');
    } finally {
      setLoading(false);
      setShowResetDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Public Website Theme Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize colors, typography, spacing, and effects for the public website
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowResetDialog(true)}
          disabled={loading}
        >
          Reset to Default
        </Button>
      </div>

      {hasUnsavedChanges && (
        <Card className="border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4">
            <p className="text-sm text-orange-900 dark:text-orange-200">
              ⚠️ You have unpublished theme changes. Click "Publish Changes" to make them live.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
        </TabsList>

        {/* COLORS TAB */}
        <TabsContent value="colors" className="space-y-6">
          {/* Primary Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>Main brand colors for the public website</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.colors)
                .filter(([key]) => key.includes('primary') || key.includes('burgundy') || key.includes('secondary') || key.includes('silver'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <div className="flex gap-4">
                      <div className="relative">
                        <button
                          className="w-16 h-10 rounded border-2 border-border"
                          style={{ backgroundColor: value }}
                          onClick={() => setActiveColorPicker(activeColorPicker === key ? null : key)}
                        />
                        {activeColorPicker === key && (
                          <div className="absolute top-12 left-0 z-50 p-4 bg-background border border-border rounded-lg shadow-lg">
                            <HexColorPicker
                              color={value}
                              onChange={(newColor) => handleColorChange('colors', key, newColor)}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 w-full"
                              onClick={() => setActiveColorPicker(null)}
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange('colors', key, e.target.value)}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Background Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Background Colors</CardTitle>
              <CardDescription>Page and section backgrounds</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.colors)
                .filter(([key]) => key.includes('background'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <div className="flex gap-4">
                      <div className="relative">
                        <button
                          className="w-16 h-10 rounded border-2 border-border"
                          style={{ backgroundColor: value }}
                          onClick={() => setActiveColorPicker(activeColorPicker === key ? null : key)}
                        />
                        {activeColorPicker === key && (
                          <div className="absolute top-12 left-0 z-50 p-4 bg-background border border-border rounded-lg shadow-lg">
                            <HexColorPicker
                              color={value}
                              onChange={(newColor) => handleColorChange('colors', key, newColor)}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 w-full"
                              onClick={() => setActiveColorPicker(null)}
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange('colors', key, e.target.value)}
                        className="flex-1"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Text Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Text Colors</CardTitle>
              <CardDescription>Typography color palette</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.colors)
                .filter(([key]) => key.includes('text'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <div className="flex gap-4">
                      <div className="relative">
                        <button
                          className="w-16 h-10 rounded border-2 border-border"
                          style={{ backgroundColor: value }}
                          onClick={() => setActiveColorPicker(activeColorPicker === key ? null : key)}
                        />
                        {activeColorPicker === key && (
                          <div className="absolute top-12 left-0 z-50 p-4 bg-background border border-border rounded-lg shadow-lg">
                            <HexColorPicker
                              color={value}
                              onChange={(newColor) => handleColorChange('colors', key, newColor)}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 w-full"
                              onClick={() => setActiveColorPicker(null)}
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange('colors', key, e.target.value)}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Border Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Border Colors</CardTitle>
              <CardDescription>Border and divider colors</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.colors)
                .filter(([key]) => key.includes('border'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <div className="flex gap-4">
                      <div className="relative">
                        <button
                          className="w-16 h-10 rounded border-2 border-border"
                          style={{ backgroundColor: value }}
                          onClick={() => setActiveColorPicker(activeColorPicker === key ? null : key)}
                        />
                        {activeColorPicker === key && (
                          <div className="absolute top-12 left-0 z-50 p-4 bg-background border border-border rounded-lg shadow-lg">
                            <HexColorPicker
                              color={value}
                              onChange={(newColor) => handleColorChange('colors', key, newColor)}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 w-full"
                              onClick={() => setActiveColorPicker(null)}
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange('colors', key, e.target.value)}
                        className="flex-1"
                        placeholder="#E5E7EB"
                      />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TYPOGRAPHY TAB */}
        <TabsContent value="typography" className="space-y-6">
          {/* Font Families */}
          <Card>
            <CardHeader>
              <CardTitle>Font Families</CardTitle>
              <CardDescription>Typography fonts for headings and body text</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.typography)
                .filter(([key]) => key.includes('font'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Select value={value} onValueChange={(val) => handleInputChange('typography', key, val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="sans-serif">Sans-serif</SelectItem>
                        <SelectItem value="monospace">Monospace</SelectItem>
                        <SelectItem value="cursive">Cursive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Font Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Font Sizes</CardTitle>
              <CardDescription>Text size for headings and body</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.typography)
                .filter(([key]) => key.includes('size'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleInputChange('typography', key, e.target.value)}
                      placeholder="1rem"
                    />
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Line Heights */}
          <Card>
            <CardHeader>
              <CardTitle>Line Heights</CardTitle>
              <CardDescription>Vertical spacing between lines of text</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.typography)
                .filter(([key]) => key.includes('line'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) => handleInputChange('typography', key, e.target.value)}
                      placeholder="1.6"
                    />
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Font Weights */}
          <Card>
            <CardHeader>
              <CardTitle>Font Weights</CardTitle>
              <CardDescription>Text boldness for headings and body</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.typography)
                .filter(([key]) => key.includes('weight'))
                .map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Select value={value} onValueChange={(val) => handleInputChange('typography', key, val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light (300)</SelectItem>
                        <SelectItem value="400">Regular (400)</SelectItem>
                        <SelectItem value="500">Medium (500)</SelectItem>
                        <SelectItem value="600">Semi-bold (600)</SelectItem>
                        <SelectItem value="700">Bold (700)</SelectItem>
                        <SelectItem value="800">Extra-bold (800)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPACING TAB */}
        <TabsContent value="spacing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout Spacing</CardTitle>
              <CardDescription>Padding, margins, and container sizes</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {Object.entries(theme.spacing).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => handleInputChange('spacing', key, e.target.value)}
                    placeholder="1rem"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EFFECTS TAB */}
        <TabsContent value="effects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Effects</CardTitle>
              <CardDescription>Border radius, shadows, and transitions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Border Radius */}
              {theme.effects.border_radius && (
                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Input
                    type="text"
                    value={theme.effects.border_radius}
                    onChange={(e) => handleInputChange('effects', 'border_radius', e.target.value)}
                    placeholder="0.5rem"
                  />
                </div>
              )}

              {/* Shadow Style */}
              {theme.effects.shadow_style && (
                <div className="space-y-2">
                  <Label>Shadow Style</Label>
                  <Select
                    value={theme.effects.shadow_style}
                    onValueChange={(val) => handleInputChange('effects', 'shadow_style', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Transition Speed */}
              {theme.effects.transition_speed && (
                <div className="space-y-2">
                  <Label>Transition Speed</Label>
                  <Input
                    type="text"
                    value={theme.effects.transition_speed}
                    onChange={(e) => handleInputChange('effects', 'transition_speed', e.target.value)}
                    placeholder="0.3s"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Theme to Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all theme settings to the original Cottage Tandoori burgundy and silver theme.
              All custom colors, typography, spacing, and effects will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetTheme} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Theme'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
