import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadDitheringProps {
  onImageProcessed: (imageData: string) => void;
  className?: string;
}

const ImageUploadDithering: React.FC<ImageUploadDitheringProps> = ({
  onImageProcessed,
  className = ''
}) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Floyd-Steinberg Dithering Algorithm
  const floydSteinbergDithering = (imageData: ImageData): ImageData => {
    const { data, width, height } = imageData;
    const output = new ImageData(width, height);
    const outputData = output.data;
    
    // Copy original data
    for (let i = 0; i < data.length; i++) {
      outputData[i] = data[i];
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        
        // Convert to grayscale
        const gray = Math.round(
          outputData[index] * 0.299 +     // Red
          outputData[index + 1] * 0.587 + // Green
          outputData[index + 2] * 0.114   // Blue
        );
        
        // Threshold to black or white
        const newPixel = gray < 128 ? 0 : 255;
        const error = gray - newPixel;
        
        // Set the new pixel value
        outputData[index] = newPixel;     // Red
        outputData[index + 1] = newPixel; // Green
        outputData[index + 2] = newPixel; // Blue
        outputData[index + 3] = 255;     // Alpha
        
        // Distribute error to neighboring pixels
        const distributeError = (dx: number, dy: number, factor: number) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIndex = (ny * width + nx) * 4;
            const errorValue = (error * factor) / 16;
            
            outputData[nIndex] = Math.max(0, Math.min(255, outputData[nIndex] + errorValue));
            outputData[nIndex + 1] = Math.max(0, Math.min(255, outputData[nIndex + 1] + errorValue));
            outputData[nIndex + 2] = Math.max(0, Math.min(255, outputData[nIndex + 2] + errorValue));
          }
        };
        
        // Floyd-Steinberg error distribution pattern
        distributeError(1, 0, 7);  // Right
        distributeError(-1, 1, 3); // Bottom-left
        distributeError(0, 1, 5);  // Bottom
        distributeError(1, 1, 1);  // Bottom-right
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
          // Create canvas for processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Canvas context not available');
          }
          
          // Set optimal size for thermal printing (max width 384px for 80mm)
          const maxWidth = 384;
          const scale = Math.min(maxWidth / img.width, maxWidth / img.height);
          
          canvas.width = Math.floor(img.width * scale);
          canvas.height = Math.floor(img.height * scale);
          
          // Draw and get image data
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Apply Floyd-Steinberg dithering
          const ditheredData = floydSteinbergDithering(imageData);
          
          // Put processed data back to canvas
          ctx.putImageData(ditheredData, 0, 0);
          
          // Convert to data URL
          const processedDataUrl = canvas.toDataURL('image/png');
          
          setProcessedImage(processedDataUrl);
          onImageProcessed(processedDataUrl);
          
          toast.success('Image processed for thermal printing!');
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
      setOriginalImage(e.target?.result as string);
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
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file too large. Please select a file under 5MB.');
      return;
    }
    
    processImage(file);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processImage(imageFile);
    } else {
      toast.error('Please drop a valid image file');
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const clearImages = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    onImageProcessed('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Upload Area */}
      {!originalImage && (
        <Card className="bg-gray-800/50 border-gray-700 border-dashed">
          <CardContent className="p-6">
            <div 
              className="text-center space-y-4 cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
                  <p className="text-gray-400">Processing image...</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-300 font-medium">Upload Logo Image</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Drag & drop or click to select
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Will be optimized for thermal printing (Floyd-Steinberg dithering)
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}
      
      {/* Image Preview */}
      {(originalImage || processedImage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Original Image */}
          {originalImage && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Original Image</Label>
                  <div className="relative">
                    <img 
                      src={originalImage} 
                      alt="Original" 
                      className="w-full h-auto max-h-32 object-contain bg-white rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Processed Image */}
          {processedImage && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300 text-sm">Thermal Optimized</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearImages}
                      className="border-red-600 text-red-400 hover:bg-red-600/10 h-6 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="relative">
                    <img 
                      src={processedImage} 
                      alt="Thermal Optimized" 
                      className="w-full h-auto max-h-32 object-contain bg-white rounded"
                    />
                  </div>
                  <p className="text-xs text-green-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Optimized for Epson T-20III thermal printing
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Replace Button */}
      {originalImage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-gray-600 text-gray-400 hover:bg-gray-600/10"
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Replace Image
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadDithering;
