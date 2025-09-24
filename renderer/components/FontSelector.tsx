// Advanced Font Selector Component for Thermal Receipt Designer

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Zap, Users, Building2, Type, Filter } from 'lucide-react';
import { ThermalFont, THERMAL_FONTS, getFontsByCategory, getOptimalFontSize, injectGoogleFonts } from 'utils/thermalFonts';
import { FontFamily } from 'utils/visualTemplateTypes';
import { getSmartFontRecommendations, getQuickPresets, getFontPairings } from 'utils/fontRecommendations';

interface FontSelectorProps {
  selectedFont: FontFamily;
  onFontChange: (font: FontFamily) => void;
  templateType: 'kitchen' | 'foh';
  elementType: 'header' | 'items' | 'totals' | 'footer' | 'notes';
  paperWidth: 58 | 80;
  showPreview?: boolean;
}

export default function FontSelector({
  selectedFont,
  onFontChange,
  templateType,
  elementType,
  paperWidth,
  showPreview = true
}: FontSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'monospace' | 'sans-serif' | 'specialized'>('all');
  const [thermalOptimizedOnly, setThermalOptimizedOnly] = useState(false);

  // Inject Google Fonts on mount
  useEffect(() => {
    injectGoogleFonts();
  }, []);

  // Get font categories
  const fontsByCategory = useMemo(() => getFontsByCategory(), []);
  
  // Get current font object
  const currentFont = THERMAL_FONTS.find(f => f.family === selectedFont) || THERMAL_FONTS[0];
  
  // Filter fonts based on criteria
  const filteredFonts = useMemo(() => {
    let fonts = THERMAL_FONTS;
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      fonts = fontsByCategory[categoryFilter] || [];
    }
    
    // Apply thermal optimization filter
    if (thermalOptimizedOnly) {
      fonts = fonts.filter(f => f.thermalOptimized);
    }
    
    // Apply search filter
    if (searchTerm) {
      fonts = fonts.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return fonts;
  }, [categoryFilter, thermalOptimizedOnly, searchTerm, fontsByCategory]);
  
  // Get smart recommendations
  const recommendations = useMemo(() => {
    return getSmartFontRecommendations({
      templateType,
      paperWidth,
      elementType,
      priority: templateType === 'kitchen' ? 'speed' : 'branding'
    });
  }, [templateType, paperWidth, elementType]);
  
  // Get quick presets
  const presets = useMemo(() => getQuickPresets(templateType), [templateType]);
  
  // Get font pairings
  const pairings = useMemo(() => getFontPairings(templateType), [templateType]);

  const handleFontSelect = (font: ThermalFont) => {
    onFontChange(font.family);
  };

  return (
    <div className="space-y-4">
      {/* Current Font Display */}
      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600/50">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-medium text-white">Current Font</Label>
          <Badge variant="outline" className="text-xs">
            {currentFont.category}
          </Badge>
        </div>
        <div 
          className="text-sm text-white p-2 bg-gray-900/50 rounded border"
          style={{ fontFamily: currentFont.cssFamily }}
        >
          {currentFont.name} - {elementType} text
        </div>
        <p className="text-xs text-gray-400 mt-1">{currentFont.description}</p>
      </div>

      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommended" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            Smart
          </TabsTrigger>
          <TabsTrigger value="browse" className="text-xs">
            <Type className="w-3 h-3 mr-1" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="presets" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Quick
          </TabsTrigger>
          <TabsTrigger value="pairings" className="text-xs">
            <Building2 className="w-3 h-3 mr-1" />
            Pairs
          </TabsTrigger>
        </TabsList>

        {/* Smart Recommendations */}
        <TabsContent value="recommended" className="space-y-3">
          <div className="text-xs text-gray-300 mb-2">
            AI-recommended fonts for {templateType === 'kitchen' ? 'kitchen tickets' : 'customer receipts'}
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {recommendations.slice(0, 6).map((rec, index) => (
              <div key={rec.font.family}>
                <Card 
                  className={`p-2 cursor-pointer transition-all border ${
                    rec.font.family === selectedFont 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                  }`}
                  onClick={() => handleFontSelect(rec.font)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white truncate">
                          {rec.font.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(rec.score)}
                        </Badge>
                        {rec.font.thermalOptimized && (
                          <Badge variant="outline" className="text-xs bg-green-900/20 border-green-600">
                            <Zap className="w-2 h-2 mr-1" />
                            Thermal
                          </Badge>
                        )}
                      </div>
                      
                      {showPreview && (
                        <div 
                          className="text-xs text-gray-300 mb-1 p-1 bg-gray-900/50 rounded"
                          style={{ 
                            fontFamily: rec.font.cssFamily,
                            fontSize: `${getOptimalFontSize(rec.font, templateType)}px`
                          }}
                        >
                          Sample: Cottage Tandoori £12.95
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        {rec.reasons.slice(0, 2).join(' • ')}
                      </div>
                      
                      {rec.warnings && (
                        <div className="text-xs text-yellow-400 mt-1">
                          ⚠️ {rec.warnings[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Browse All Fonts */}
        <TabsContent value="browse" className="space-y-3">
          {/* Filters */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <Input
                    placeholder="Search fonts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>
              
              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="sans-serif">Sans-serif</SelectItem>
                  <SelectItem value="specialized">Specialized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="thermal-only"
                checked={thermalOptimizedOnly}
                onChange={(e) => setThermalOptimizedOnly(e.target.checked)}
                className="w-3 h-3"
              />
              <Label htmlFor="thermal-only" className="text-xs text-gray-300">
                Thermal optimized only
              </Label>
            </div>
          </div>
          
          {/* Font Grid */}
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {filteredFonts.map((font) => (
              <div key={font.family}>
                <Card 
                  className={`p-2 cursor-pointer transition-all border ${
                    font.family === selectedFont 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                  }`}
                  onClick={() => handleFontSelect(font)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white truncate">
                      {font.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {font.category}
                      </Badge>
                      {font.thermalOptimized && (
                        <Zap className="w-3 h-3 text-green-400" />
                      )}
                    </div>
                  </div>
                  
                  {showPreview && (
                    <div 
                      className="text-xs text-gray-300 mb-1 p-1 bg-gray-900/50 rounded"
                      style={{ 
                        fontFamily: font.cssFamily,
                        fontSize: `${getOptimalFontSize(font, templateType)}px`
                      }}
                    >
                      COTTAGE TANDOORI - £12.95
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400 leading-tight">
                    {font.description}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Quick Presets */}
        <TabsContent value="presets" className="space-y-3">
          <div className="text-xs text-gray-300 mb-2">
            Industry-standard presets for {templateType === 'kitchen' ? 'kitchen' : 'customer'} use
          </div>
          
          <div className="space-y-2">
            {Object.entries(presets).map(([key, font]) => (
              <Card 
                key={key}
                className={`p-3 cursor-pointer transition-all border ${
                  font.family === selectedFont 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
                }`}
                onClick={() => handleFontSelect(font)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white capitalize">
                    {key} Font
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {font.name}
                  </Badge>
                </div>
                
                {showPreview && (
                  <div 
                    className="text-xs text-gray-300 p-2 bg-gray-900/50 rounded mb-2"
                    style={{ 
                      fontFamily: font.cssFamily,
                      fontSize: `${getOptimalFontSize(font, templateType)}px`
                    }}
                  >
                    Cottage Tandoori - £12.95
                  </div>
                )}
                
                <p className="text-xs text-gray-400">{font.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Font Pairings */}
        <TabsContent value="pairings" className="space-y-3">
          <div className="text-xs text-gray-300 mb-2">
            Professional font combinations
          </div>
          
          <div className="space-y-3">
            {pairings.map((pairing, index) => (
              <Card key={index} className="p-3 bg-gray-800/30 border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white">
                    {pairing.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleFontSelect(pairing.header)}
                  >
                    Use Header
                  </Button>
                </div>
                
                <div className="space-y-2 mb-2">
                  <div className="text-xs text-gray-400">
                    Header: <span className="text-white">{pairing.header.name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Body: <span className="text-white">{pairing.body.name}</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400">{pairing.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
