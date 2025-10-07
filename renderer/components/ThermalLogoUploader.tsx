import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image, Settings, Eye, Download, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import brain from 'brain';
import {
  processThermalImage,
  validateImageFile,
  THERMAL_LOGO_PRESETS,
  type ThermalPaperWidth,
  type ProcessingMode,
  type ProcessedImageResult
} from 'utils/thermalImageProcessor';

interface ThermalLogoUploaderProps {
  onLogoUploaded: (logoId: string, url: string) => void;
  currentLogoId?: string | null;
  paperWidth: ThermalPaperWidth;
  logoSize: 'small' | 'medium' | 'large';
}

export default function ThermalLogoUploader({
  onLogoUploaded,
  currentLogoId,
  paperWidth,
  logoSize
}: ThermalLogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('logo');
  const [customSettings, setCustomSettings] = useState({
    contrast: 20,
    brightness: 10,
    dithering: true
  });
  const [processedImage, setProcessedImage] = useState<ProcessedImageResult | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setOriginalFile(file);
    await processImage(file);
  }, []);

  // Process image with thermal optimization
  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const preset = THERMAL_LOGO_PRESETS[logoSize];
      const options = {
        paperWidth,
        mode: processingMode,
        maxWidth: preset.maxWidth,
        maxHeight: preset.maxHeight,
        dithering: customSettings.dithering,
        contrast: customSettings.contrast,
        brightness: customSettings.brightness
      };

      const result = await processThermalImage(file, options);
      setProcessedImage(result);
      toast.success('Image processed for thermal printing!');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  }, [paperWidth, logoSize, processingMode, customSettings]);

  // Reprocess with new settings
  const reprocessImage = useCallback(async () => {
    if (originalFile) {
      await processImage(originalFile);
    }
  }, [originalFile, processImage]);

  // Upload processed image
  const uploadImage = useCallback(async () => {
    if (!processedImage || !originalFile) {
      toast.error('No processed image to upload');
      return;
    }

    setIsUploading(true);
    try {
      // Create file from processed blob
      const processedFile = new File(
        [processedImage.blob],
        `thermal_${originalFile.name.replace(/\.[^/.]+$/, '')}.png`,
        { type: 'image/png' }
      );

      // Create upload data object (brain client handles FormData conversion)
      const uploadData = {
        file: processedFile,
        category: 'logos',
        subcategory: 'thermal',
        description: `Thermal-optimized logo processed for ${paperWidth}mm receipt paper`,
        tags: JSON.stringify(['logo', 'thermal', 'receipt', logoSize, processingMode])
      };
      
      const response = await brain.upload_general_file(uploadData);
      const data = await response.json();
      
      if (data.success && data.asset_id && data.url) {
        onLogoUploaded(data.asset_id, data.url);
        toast.success('Logo uploaded successfully!');
        
        // Reset state
        setProcessedImage(null);
        setOriginalFile(null);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  }, [processedImage, originalFile, paperWidth, logoSize, processingMode, onLogoUploaded]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Upload Restaurant Logo
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="w-4 h-4 mr-1" />
              Advanced
            </Button>
          </div>

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragging 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-gray-600 hover:border-gray-500'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-white font-medium mb-2">
              {isDragging ? 'Drop your logo here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-gray-400 text-sm">
              PNG, JPG, or SVG files up to 5MB
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Will be optimized for {paperWidth}mm thermal paper
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      </Card>

      {/* Processing Settings */}
      {(originalFile || showAdvanced) && (
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white">Thermal Processing Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Processing Mode */}
              <div className="space-y-2">
                <Label className="text-gray-300">Processing Mode</Label>
                <Select value={processingMode} onValueChange={(value) => setProcessingMode(value as ProcessingMode)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="logo">Logo (Balanced)</SelectItem>
                    <SelectItem value="photo">Photo (Detailed)</SelectItem>
                    <SelectItem value="line-art">Line Art (Sharp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <Label className="text-gray-300">Contrast: {customSettings.contrast}</Label>
                <Slider
                  value={[customSettings.contrast]}
                  onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, contrast: value }))}
                  min={-50}
                  max={100}
                  step={5}
                  className="text-purple-500"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <Label className="text-gray-300">Brightness: {customSettings.brightness}</Label>
                <Slider
                  value={[customSettings.brightness]}
                  onValueChange={([value]) => setCustomSettings(prev => ({ ...prev, brightness: value }))}
                  min={-50}
                  max={50}
                  step={5}
                  className="text-purple-500"
                />
              </div>

              {/* Dithering */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dithering"
                  checked={customSettings.dithering}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, dithering: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-purple-500"
                />
                <Label htmlFor="dithering" className="text-gray-300">
                  Enable Dithering (Better Quality)
                </Label>
              </div>
            </div>

            {originalFile && (
              <Button
                onClick={reprocessImage}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  <>Apply Settings</>
                )}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Preview */}
      {processedImage && (
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Thermal Preview
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview Image */}
              <div className="space-y-2">
                <Label className="text-gray-300">Processed Image</Label>
                <div className="bg-white p-4 rounded border-2 border-gray-600">
                  <img
                    src={processedImage.dataUrl}
                    alt="Thermal processed logo"
                    className="mx-auto max-w-full h-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <Label className="text-gray-300">Processing Stats</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Dimensions:</span>
                    <span>{processedImage.width} × {processedImage.height}px</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Original Size:</span>
                    <span>{(processedImage.originalSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Processed Size:</span>
                    <span>{(processedImage.processedSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>Compression:</span>
                    <span>{Math.round((1 - processedImage.processedSize / processedImage.originalSize) * 100)}%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center text-green-400 text-sm mb-3">
                    <Check className="w-4 h-4 mr-1" />
                    Optimized for thermal printing
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={uploadImage}
                      disabled={isUploading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isUploading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </div>
                      ) : (
                        <>Use This Logo</>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `thermal_logo_${Date.now()}.png`;
                        link.href = processedImage.dataUrl;
                        link.click();
                      }}
                      className="w-full border-gray-600 text-gray-300 hover:text-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Preview
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-blue-900/20 border-blue-700/50">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="text-blue-200 font-medium">Thermal Printing Tips:</p>
            <ul className="text-blue-300 space-y-1 text-xs">
              <li>• High contrast logos work best on thermal printers</li>
              <li>• Simple designs print clearer than complex graphics</li>
              <li>• Black and white images are automatically optimized</li>
              <li>• Test print recommended before final deployment</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
