import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, QrCode, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';

export interface QRCodeConfig {
  id: string;
  type: 'url' | 'wifi' | 'contact' | 'text';
  content: string;
  size: 'small' | 'medium' | 'large';
  position: 'left' | 'center' | 'right';
  placement?: 'header' | 'footer'; // Keep for backward compatibility
  enabled: boolean;
}

interface QRCodeFormBuilderProps {
  qrCodes: QRCodeConfig[];
  onQRCodesChange: (qrCodes: QRCodeConfig[]) => void;
  currentSection: 'header' | 'footer'; // Required prop for tab context
  className?: string;
}

const QR_CODE_TYPES = [
  { value: 'url', label: 'Website URL', placeholder: 'https://www.cottagetandoori.co.uk' },
  { value: 'wifi', label: 'WiFi Password', placeholder: 'Network: CottageTandoori, Password: welcome123' },
  { value: 'contact', label: 'Contact Info', placeholder: 'Name: Cottage Tandoori, Phone: 020 7123 4567' },
  { value: 'text', label: 'Plain Text', placeholder: 'Follow us on social media!' }
];

const QR_SIZES = [
  { value: 'small', label: 'Small (64px)', pixels: 64 },
  { value: 'medium', label: 'Medium (96px)', pixels: 96 },
  { value: 'large', label: 'Large (128px)', pixels: 128 }
];

const POSITION_OPTIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight }
];

export default function QRCodeFormBuilder({ 
  qrCodes, 
  onQRCodesChange, 
  currentSection,
  className = '' 
}: QRCodeFormBuilderProps) {
  
  const addQRCode = () => {
    const newQRCode: QRCodeConfig = {
      id: `qr_${Date.now()}`,
      type: 'url',
      content: '',
      size: 'medium',
      position: 'center',
      placement: currentSection, // Auto-set based on current tab
      enabled: true
    };
    
    onQRCodesChange([...qrCodes, newQRCode]);
  };
  
  const removeQRCode = (id: string) => {
    onQRCodesChange(qrCodes.filter(qr => qr.id !== id));
  };
  
  const updateQRCode = (id: string, updates: Partial<QRCodeConfig>) => {
    onQRCodesChange(
      qrCodes.map(qr => qr.id === id ? { ...qr, ...updates } : qr)
    );
  };
  
  const generateQRContent = (qrCode: QRCodeConfig): string => {
    if (!qrCode.content.trim()) return 'Preview QR Code';
    
    switch (qrCode.type) {
      case 'wifi':
        // Simple WiFi format - in production you'd parse network name and password
        return `WIFI:T:WPA;S:${qrCode.content.split(',')[0] || 'Network'};P:${qrCode.content.split(',')[1] || 'Password'};;`;
      case 'contact':
        // Simple vCard format
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${qrCode.content}\nEND:VCARD`;
      case 'url':
        return qrCode.content.startsWith('http') ? qrCode.content : `https://${qrCode.content}`;
      case 'text':
      default:
        return qrCode.content;
    }
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
          className="flex items-center justify-between"
          style={{ color: QSAITheme.text.primary }}
        >
          <div className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            QR Codes
          </div>
          <Button
            onClick={addQRCode}
            size="sm"
            style={{
              background: QSAITheme.purple.primary,
              color: QSAITheme.text.primary
            }}
            className="hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add QR
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {qrCodes.length === 0 ? (
          <div 
            className="text-center py-8 border border-dashed rounded-lg"
            style={{
              borderColor: QSAITheme.border.light,
              color: QSAITheme.text.muted
            }}
          >
            <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No QR codes added yet</p>
            <p className="text-xs mt-1">Add QR codes for menus, WiFi, contact info, or website links</p>
          </div>
        ) : (
          qrCodes.map((qrCode, index) => (
            <div key={qrCode.id} className="space-y-4">
              {index > 0 && (
                <Separator style={{ backgroundColor: QSAITheme.border.light }} />
              )}
              
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline"
                  style={{
                    borderColor: QSAITheme.purple.primary,
                    color: QSAITheme.purple.primary
                  }}
                >
                  QR Code #{index + 1}
                </Badge>
                <Button
                  onClick={() => removeQRCode(qrCode.id)}
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* QR Type */}
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>QR Code Type</Label>
                    <Select
                      value={qrCode.type}
                      onValueChange={(value: 'url' | 'wifi' | 'contact' | 'text') => 
                        updateQRCode(qrCode.id, { type: value })
                      }
                    >
                      <SelectTrigger 
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`
                        }}
                      >
                        {QR_CODE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>Content</Label>
                    <Textarea
                      value={qrCode.content}
                      onChange={(e) => updateQRCode(qrCode.id, { content: e.target.value })}
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.primary
                      }}
                      placeholder={QR_CODE_TYPES.find(t => t.value === qrCode.type)?.placeholder}
                      rows={3}
                    />
                  </div>
                  
                  {/* Size */}
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>Size</Label>
                    <Select
                      value={qrCode.size}
                      onValueChange={(value: 'small' | 'medium' | 'large') => 
                        updateQRCode(qrCode.id, { size: value })
                      }
                    >
                      <SelectTrigger 
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`
                        }}
                      >
                        {QR_SIZES.map(size => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Position Controls */}
                  <div>
                    <Label style={{ color: QSAITheme.text.secondary }}>Position</Label>
                    <RadioGroup
                      value={qrCode.position}
                      onValueChange={(value: 'left' | 'center' | 'right') => 
                        updateQRCode(qrCode.id, { position: value })
                      }
                      className="flex space-x-4 mt-2"
                    >
                      {POSITION_OPTIONS.map(option => {
                        const IconComponent = option.icon;
                        return (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={option.value} 
                              id={`${qrCode.id}-${option.value}`}
                              style={{ borderColor: QSAITheme.purple.primary }}
                            />
                            <Label 
                              htmlFor={`${qrCode.id}-${option.value}`}
                              className="flex items-center cursor-pointer"
                              style={{ color: QSAITheme.text.secondary }}
                            >
                              <IconComponent className="h-4 w-4 mr-1" />
                              {option.label}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>
                
                {/* QR Code Preview */}
                <div className="space-y-2">
                  <Label style={{ color: QSAITheme.text.secondary }}>Preview</Label>
                  <div 
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: QSAITheme.background.secondary,
                      borderColor: QSAITheme.border.light,
                      textAlign: qrCode.position
                    }}
                  >
                    <div className="inline-block">
                      <QRCodeSVG
                        value={generateQRContent(qrCode)}
                        size={QR_SIZES.find(s => s.value === qrCode.size)?.pixels || 96}
                        level="M"
                        includeMargin={false}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    </div>
                  </div>
                  
                  {/* Position Preview */}
                  <div 
                    className="text-xs p-2 rounded"
                    style={{
                      backgroundColor: QSAITheme.background.tertiary,
                      color: QSAITheme.text.muted
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>Thermal Position:</span>
                      <Badge 
                        variant="outline"
                        style={{
                          borderColor: QSAITheme.purple.primary,
                          color: QSAITheme.purple.primary,
                          fontSize: '10px'
                        }}
                      >
                        {qrCode.position.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
