
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Search, Palette, Filter } from 'lucide-react';
import { FontFamily } from 'utils/visualTemplateTypes';
import { THERMAL_FONTS, injectGoogleFonts } from 'utils/thermalFonts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface FontSelectorModalProps {
  selectedFont: FontFamily;
  onFontChange: (font: FontFamily) => void;
  templateType: 'kitchen' | 'foh';
  elementType: 'header' | 'items' | 'totals' | 'footer' | 'notes';
  paperWidth: 58 | 80;
}

export default function FontSelectorModal({
  selectedFont,
  onFontChange,
  templateType,
  elementType,
  paperWidth
}: FontSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'monospace' | 'sans-serif' | 'specialized'>('all');
  const [thermalOptimizedOnly, setThermalOptimizedOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Inject Google Fonts on mount
  useEffect(() => {
    injectGoogleFonts();
  }, []);

  // Filter fonts based on search and filters
  const filteredFonts = THERMAL_FONTS.filter(font => {
    const matchesSearch = font.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         font.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || font.category === categoryFilter;
    
    const matchesThermalOptimized = !thermalOptimizedOnly || font.thermalOptimized;
    
    return matchesSearch && matchesCategory && matchesThermalOptimized;
  });

  // Get popular fonts for the template type
  const getPopularFonts = () => {
    if (templateType === 'kitchen') {
      return THERMAL_FONTS.filter(f => ['JetBrains Mono', 'Fira Code', 'Courier', 'Hack'].includes(f.name));
    } else {
      return THERMAL_FONTS.filter(f => ['Inter', 'Poppins', 'Arial', 'Open Sans'].includes(f.name));
    }
  };

  const handleFontSelect = (font: FontFamily) => {
    console.log('🔧 Font selected:', font);
    console.log('🔧 About to call onFontChange with:', font);
    onFontChange(font);
    console.log('🔧 About to close modal');
    setIsOpen(false);
    console.log('🔧 Modal close state set');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs hover:bg-gray-700/50"
        >
          <Edit className="w-3 h-3 mr-1" />
          Change
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Select Font Family
            <Badge variant="secondary" className="text-xs">
              {templateType === 'kitchen' ? '🍳 Kitchen' : '📄 Customer'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search fonts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="specialized">Specialized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="thermal-optimized"
                  checked={thermalOptimizedOnly}
                  onCheckedChange={setThermalOptimizedOnly}
                />
                <Label htmlFor="thermal-optimized" className="text-sm text-gray-300">
                  Thermal Optimized Only
                </Label>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Popular Fonts Section */}
          <div>
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              ⭐ Popular for {templateType === 'kitchen' ? 'Kitchen' : 'Customer'} Receipts
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {getPopularFonts().map((font) => (
                <div
                  key={font.name}
                  className={`p-3 rounded border cursor-pointer transition-all hover:bg-gray-700/30 ${
                    selectedFont === font.family 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => handleFontSelect(font.family)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h5 className="text-sm font-medium text-white">{font.name}</h5>
                      <p className="text-xs text-gray-400">{font.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {font.thermalOptimized && (
                        <Badge variant="outline" className="text-xs px-1 py-0">🔥 Thermal</Badge>
                      )}
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {font.category}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Font Preview */}
                  <div 
                    className="text-xs p-2 bg-white text-black rounded font-mono overflow-hidden"
                    style={{ 
                      fontFamily: font.cssFamily,
                      fontSize: templateType === 'kitchen' ? '10px' : '9px'
                    }}
                  >
                    COTTAGE TANDOORI<br/>
                    Chicken Tikka......£12.95<br/>
                    ========================<br/>
                    TOTAL..............£16.45
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* All Fonts Section */}
          <div>
            <h4 className="text-sm font-medium text-white mb-2">
              All Fonts ({filteredFonts.length})
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {filteredFonts.map((font) => (
                <div
                  key={font.name}
                  className={`p-2 rounded border cursor-pointer transition-all hover:bg-gray-700/30 ${
                    selectedFont === font.family 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => handleFontSelect(font.family)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-white">{font.name}</h5>
                      <p className="text-xs text-gray-400 truncate">{font.description}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {font.thermalOptimized && (
                        <Badge variant="outline" className="text-xs px-1 py-0">🔥</Badge>
                      )}
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {font.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
