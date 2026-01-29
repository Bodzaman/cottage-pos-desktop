/**
 * CompactLogoUpload - Inline logo upload with thumbnail preview
 * Replaces the large ImageUploadDithering component with a compact single-line layout
 * Uses the same Floyd-Steinberg dithering algorithm for thermal printer optimization
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { QSAITheme } from 'utils/QSAIDesign';

interface CompactLogoUploadProps {
  currentImage: string | null;
  onImageProcessed: (dataUrl: string) => void;
  onClear: () => void;
  position: 'left' | 'center' | 'right';
  onPositionChange: (pos: 'left' | 'center' | 'right') => void;
}

const CompactLogoUpload: React.FC<CompactLogoUploadProps> = ({
  currentImage,
  onImageProcessed,
  onClear,
  position,
  onPositionChange
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Floyd-Steinberg Dithering Algorithm (same as ImageUploadDithering)
  const floydSteinbergDithering = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new ImageData(width, height);
    const outputData = output.data;

    const transparentPixels = new Set<number>();

    for (let i = 0; i < data.length; i += 4) {
      outputData[i] = data[i];
      outputData[i + 1] = data[i + 1];
      outputData[i + 2] = data[i + 2];
      outputData[i + 3] = data[i + 3];

      if (data[i + 3] < 255) {
        transparentPixels.add(i / 4);
      }
    }

    for (const pixelIndex of transparentPixels) {
      const index = pixelIndex * 4;
      outputData[index] = 255;
      outputData[index + 1] = 255;
      outputData[index + 2] = 255;
      outputData[index + 3] = 255;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const pixelIndex = y * width + x;

        if (transparentPixels.has(pixelIndex)) continue;

        const gray = Math.round(
          outputData[index] * 0.299 +
          outputData[index + 1] * 0.587 +
          outputData[index + 2] * 0.114
        );

        const newPixel = gray < 128 ? 0 : 255;
        const error = gray - newPixel;

        outputData[index] = newPixel;
        outputData[index + 1] = newPixel;
        outputData[index + 2] = newPixel;
        outputData[index + 3] = 255;

        const distributeError = (dx: number, dy: number, factor: number) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborPixelIndex = ny * width + nx;
            if (transparentPixels.has(neighborPixelIndex)) return;

            const nIndex = (ny * width + nx) * 4;
            const errorValue = (error * factor) / 16;

            outputData[nIndex] = Math.max(0, Math.min(255, outputData[nIndex] + errorValue));
            outputData[nIndex + 1] = Math.max(0, Math.min(255, outputData[nIndex + 1] + errorValue));
            outputData[nIndex + 2] = Math.max(0, Math.min(255, outputData[nIndex + 2] + errorValue));
          }
        };

        distributeError(1, 0, 7);
        distributeError(-1, 1, 3);
        distributeError(0, 1, 5);
        distributeError(1, 1, 1);
      }
    }

    return output;
  };

  const processImage = (file: File) => {
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) throw new Error('Canvas context not available');

          const maxWidth = 384;
          const scale = Math.min(maxWidth / img.width, maxWidth / img.height);

          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const ditheredData = floydSteinbergDithering(imageData);
          ctx.putImageData(ditheredData, 0, 0);

          const processedDataUrl = canvas.toDataURL('image/png');
          onImageProcessed(processedDataUrl);

          toast.success('Logo optimized for thermal printing');
        } catch (error) {
          console.error('Image processing error:', error);
          toast.error('Failed to process image');
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        toast.error('Failed to load image');
        setIsProcessing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file too large (max 5MB)');
      return;
    }

    processImage(file);
  };

  const handleClear = () => {
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Logo Upload Row */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium w-12" style={{ color: QSAITheme.text.secondary }}>
          Logo
        </Label>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="h-8 px-3"
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${QSAITheme.border.light}`,
            color: QSAITheme.text.secondary
          }}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {currentImage ? 'Replace' : 'Upload'}
            </>
          )}
        </Button>

        {currentImage && (
          <>
            <div
              className="w-12 h-12 rounded border overflow-hidden flex-shrink-0"
              style={{
                borderColor: QSAITheme.border.light,
                backgroundColor: '#ffffff'
              }}
            >
              <img
                src={currentImage}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0"
              style={{ color: '#ef4444' }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Position Row - only show when logo exists */}
      {currentImage && (
        <div className="flex items-center gap-3 ml-14">
          <span className="text-xs" style={{ color: QSAITheme.text.muted }}>Position:</span>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((pos) => (
              <Button
                key={pos}
                variant="ghost"
                size="sm"
                onClick={() => onPositionChange(pos)}
                className="h-7 px-3 text-xs capitalize"
                style={{
                  backgroundColor: position === pos ? QSAITheme.purple.primary : 'transparent',
                  color: position === pos ? '#ffffff' : QSAITheme.text.muted,
                  border: `1px solid ${position === pos ? QSAITheme.purple.primary : QSAITheme.border.light}`
                }}
              >
                {pos}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactLogoUpload;
