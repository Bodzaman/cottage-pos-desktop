


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText, 
  Star, 
  Phone, 
  Globe, 
  MapPin, 
  Clock, 
  Gift, 
  Heart,
  AlignLeft,
  AlignCenter, 
  AlignRight,
  Utensils,
  Truck,
  Building
} from 'lucide-react';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { QRCodeConfig } from './QRCodeFormBuilder';

export interface ElementTemplate {
  id: string;
  name: string;
  category: 'header' | 'footer' | 'promotional' | 'contact';
  description: string;
  icon: React.ComponentType<any>;
  content: {
    text?: string;
    qrCode?: Omit<QRCodeConfig, 'id'>;
    position: 'left' | 'center' | 'right';
  };
}

interface ElementLibraryProps {
  onInsertElement: (template: ElementTemplate) => void;
  currentSection: 'header' | 'order' | 'items' | 'totals' | 'footer';
  className?: string;
}

export default function ElementLibrary({ 
  onInsertElement, 
  currentSection,
  className = '' 
}: ElementLibraryProps) {
  const [customText, setCustomText] = useState('');
  const [customPosition, setCustomPosition] = useState<'left' | 'center' | 'right'>('center');
  
  const insertCustomElement = () => {
    if (!customText.trim()) return;
    
    const customTemplate: ElementTemplate = {
      id: `custom_${Date.now()}`,
      name: 'Custom Text',
      category: currentSection === 'header' ? 'header' : 'footer',
      description: 'Custom text element',
      icon: FileText,
      content: {
        text: customText,
        position: customPosition
      }
    };
    
    onInsertElement(customTemplate);
    setCustomText('');
  };
  
  return (
    <Card 
      className={className}
      style={{
        backgroundColor: QSAITheme.background.panel,
        border: `1px solid ${QSAITheme.border.light}`
      }}
    >
      <CardHeader>
        <CardTitle 
          className="flex items-center"
          style={{ color: QSAITheme.text.primary }}
        >
          <Utensils className="h-5 w-5 mr-2" />
          Quick Custom Elements - {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Quick Custom Element */}
        <div className="space-y-3">
          <Label style={{ color: QSAITheme.text.secondary }}>Add Custom Text Element</Label>
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Add custom text element..."
            rows={3}
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {(['left', 'center', 'right'] as const).map(position => {
                const Icon = position === 'left' ? AlignLeft : position === 'center' ? AlignCenter : AlignRight;
                return (
                  <button
                    key={position}
                    type="button"
                    onClick={() => setCustomPosition(position)}
                    className={`p-2 rounded border ${
                      customPosition === position 
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <Button 
              onClick={insertCustomElement}
              disabled={!customText.trim()}
              size="sm"
              style={{
                background: QSAITheme.purple.primary,
                color: QSAITheme.text.primary
              }}
              className="hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-1" />
              Insert Custom Text
            </Button>
          </div>
        </div>
        
        <div 
          className="text-center py-4 text-sm border border-dashed rounded-lg"
          style={{ 
            color: QSAITheme.text.muted,
            borderColor: QSAITheme.border.light
          }}
        >
          💡 Focus on the dynamic workflow:
          <br />
          <strong>Take Order → Format Toggle → Live Preview</strong>
        </div>
      </CardContent>
    </Card>
  );
}
