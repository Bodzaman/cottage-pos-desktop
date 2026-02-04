import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { FormData, ReceiptFormat } from 'utils/receiptDesignerTypes';
import ThermalPreview from 'components/ThermalPreview';

interface ReceiptPreviewV2Props {
  formData: FormData;
  formatToggle: ReceiptFormat;
  paperWidth: number;
  isLoading: boolean;
  onFormatChange?: (format: ReceiptFormat) => void;  // NEW: Callback to update store when format changes
}

export function ReceiptPreviewV2({
  formData,
  formatToggle,
  paperWidth,
  isLoading,
  onFormatChange
}: ReceiptPreviewV2Props) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle format change - call callback to update store
  const handleFormatChange = (format: ReceiptFormat) => {
    if (onFormatChange) {
      onFormatChange(format);
    }
  };

  // Merge headerQRCodes and footerQRCodes into single qrCodes array for ThermalPreview
  const mergedFormData = useMemo(() => ({
    ...formData,
    qrCodes: [
      ...(formData.headerQRCodes || []),
      ...(formData.footerQRCodes || [])
    ]
  }), [formData]);

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: QSAITheme.background.secondary }}>
        <div
          className="mx-auto"
          style={{
            width: `${paperWidth}mm`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease'
          }}
        >
          {isLoading ? (
            <div className="p-8 text-center bg-white" style={{ color: QSAITheme.text.muted }}>
              Loading preview...
            </div>
          ) : (
            <ThermalPreview
              formData={mergedFormData as any}
              receiptFormat={formatToggle}
              paperWidth={paperWidth as 58 | 80}
              mode="form"
              elements={null}
              orderData={null}
            />
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{
          backgroundColor: QSAITheme.background.panel,
          borderColor: QSAITheme.border.light
        }}
      >
        {/* Format Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={formatToggle === 'front_of_house' ? 'default' : 'outline'}
            onClick={() => handleFormatChange('front_of_house')}
            style={{
              backgroundColor: formatToggle === 'front_of_house' ? QSAITheme.purple.primary : 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: formatToggle === 'front_of_house' ? QSAITheme.text.primary : QSAITheme.text.secondary
            }}
          >
            ⚡ FOH
          </Button>
          <Button
            size="sm"
            variant={formatToggle === 'kitchen_customer' ? 'default' : 'outline'}
            onClick={() => handleFormatChange('kitchen_customer')}
            style={{
              backgroundColor: formatToggle === 'kitchen_customer' ? QSAITheme.purple.primary : 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: formatToggle === 'kitchen_customer' ? QSAITheme.text.primary : QSAITheme.text.secondary
            }}
          >
            🍳 Kitchen
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetZoom}
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary,
              minWidth: '60px'
            }}
          >
            {zoom}%
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
