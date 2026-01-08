/**
 * Thermal Image Processing Utilities
 * Optimizes images for thermal receipt printers with professional quality
 */

export type ThermalPaperWidth = 58 | 80; // mm
export type ProcessingMode = 'logo' | 'photo' | 'line-art';

export interface ThermalProcessingOptions {
  paperWidth: ThermalPaperWidth;
  mode: ProcessingMode;
  maxWidth?: number;
  maxHeight?: number;
  dithering?: boolean;
  contrast?: number; // -100 to 100
  brightness?: number; // -100 to 100
}

export interface ProcessedImageResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
}

/**
 * Get optimal width in pixels for thermal paper
 */
export function getThermalPixelWidth(paperWidth: ThermalPaperWidth): number {
  // Standard thermal printer resolution: 203 DPI
  const DPI = 203;
  const mmToInch = 0.0393701;
  return Math.round(paperWidth * mmToInch * DPI);
}

/**
 * Apply Floyd-Steinberg dithering for better thermal print quality
 */
function applyFloydSteinbergDithering(imageData: ImageData): void {
  const { data, width, height } = imageData;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Convert to grayscale if not already
      const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
      
      // Apply threshold
      const newGray = gray < 128 ? 0 : 255;
      const error = gray - newGray;
      
      // Set pixel to black or white
      data[idx] = data[idx + 1] = data[idx + 2] = newGray;
      
      // Distribute error to neighboring pixels
      if (x + 1 < width) {
        const nextIdx = (y * width + (x + 1)) * 4;
        const nextGray = Math.round(0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2]);
        const newNextGray = Math.max(0, Math.min(255, nextGray + error * 7 / 16));
        data[nextIdx] = data[nextIdx + 1] = data[nextIdx + 2] = newNextGray;
      }
      
      if (y + 1 < height) {
        if (x - 1 >= 0) {
          const belowLeftIdx = ((y + 1) * width + (x - 1)) * 4;
          const belowLeftGray = Math.round(0.299 * data[belowLeftIdx] + 0.587 * data[belowLeftIdx + 1] + 0.114 * data[belowLeftIdx + 2]);
          const newBelowLeftGray = Math.max(0, Math.min(255, belowLeftGray + error * 3 / 16));
          data[belowLeftIdx] = data[belowLeftIdx + 1] = data[belowLeftIdx + 2] = newBelowLeftGray;
        }
        
        const belowIdx = ((y + 1) * width + x) * 4;
        const belowGray = Math.round(0.299 * data[belowIdx] + 0.587 * data[belowIdx + 1] + 0.114 * data[belowIdx + 2]);
        const newBelowGray = Math.max(0, Math.min(255, belowGray + error * 5 / 16));
        data[belowIdx] = data[belowIdx + 1] = data[belowIdx + 2] = newBelowGray;
        
        if (x + 1 < width) {
          const belowRightIdx = ((y + 1) * width + (x + 1)) * 4;
          const belowRightGray = Math.round(0.299 * data[belowRightIdx] + 0.587 * data[belowRightIdx + 1] + 0.114 * data[belowRightIdx + 2]);
          const newBelowRightGray = Math.max(0, Math.min(255, belowRightGray + error * 1 / 16));
          data[belowRightIdx] = data[belowRightIdx + 1] = data[belowRightIdx + 2] = newBelowRightGray;
        }
      }
    }
  }
}

/**
 * Apply contrast and brightness adjustments
 */
function applyContrastBrightness(imageData: ImageData, contrast: number, brightness: number): void {
  const { data } = imageData;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    // Apply to RGB channels
    for (let j = 0; j < 3; j++) {
      let value = data[i + j];
      
      // Apply contrast
      value = contrastFactor * (value - 128) + 128;
      
      // Apply brightness
      value += brightness;
      
      // Clamp to valid range
      data[i + j] = Math.max(0, Math.min(255, value));
    }
  }
}

/**
 * Get processing settings based on mode
 */
function getModeSettings(mode: ProcessingMode) {
  switch (mode) {
    case 'logo':
      return {
        contrast: 20,
        brightness: 10,
        dithering: true,
        preserveAspect: true
      };
    case 'photo':
      return {
        contrast: 10,
        brightness: 5,
        dithering: true,
        preserveAspect: true
      };
    case 'line-art':
      return {
        contrast: 50,
        brightness: 0,
        dithering: false,
        preserveAspect: true
      };
  }
}

/**
 * Process image for thermal printing
 */
export async function processThermalImage(
  file: File,
  options: ThermalProcessingOptions
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Unable to get canvas context');
        }
        
        // Calculate optimal dimensions
        const maxWidth = options.maxWidth || getThermalPixelWidth(options.paperWidth);
        const maxHeight = options.maxHeight || Math.round(maxWidth * 0.75); // Reasonable height limit
        
        let { width, height } = img;
        
        // Scale to fit thermal paper width while preserving aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Ensure dimensions are integers
        width = Math.round(width);
        height = Math.round(height);
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Apply mode-specific settings
        const modeSettings = getModeSettings(options.mode);
        const contrast = options.contrast !== undefined ? options.contrast : modeSettings.contrast;
        const brightness = options.brightness !== undefined ? options.brightness : modeSettings.brightness;
        const useDithering = options.dithering !== undefined ? options.dithering : modeSettings.dithering;
        
        // Apply contrast and brightness
        applyContrastBrightness(imageData, contrast, brightness);
        
        // Apply dithering if enabled
        if (useDithering) {
          applyFloydSteinbergDithering(imageData);
        } else {
          // Simple threshold for line art
          const { data } = imageData;
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            const newGray = gray < 128 ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = newGray;
          }
        }
        
        // Put processed data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob and data URL
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }
          
          const dataUrl = canvas.toDataURL('image/png');
          
          resolve({
            canvas,
            dataUrl,
            blob,
            width,
            height,
            originalSize: file.size,
            processedSize: blob.size
          });
        }, 'image/png', 1.0);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Quick presets for common logo sizes
 */
export const THERMAL_LOGO_PRESETS = {
  small: {
    paperWidth: 58 as ThermalPaperWidth,
    mode: 'logo' as ProcessingMode,
    maxWidth: 100,
    maxHeight: 100
  },
  medium: {
    paperWidth: 80 as ThermalPaperWidth,
    mode: 'logo' as ProcessingMode,
    maxWidth: 150,
    maxHeight: 150
  },
  large: {
    paperWidth: 80 as ThermalPaperWidth,
    mode: 'logo' as ProcessingMode,
    maxWidth: 200,
    maxHeight: 200
  }
};

/**
 * Validate file for thermal processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PNG, JPG, and SVG files are supported'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }
  
  return { valid: true };
}
