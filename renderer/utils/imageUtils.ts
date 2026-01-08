/**
 * Image optimization utilities for the gallery and other image-heavy pages
 */

/**
 * Creates a cropped image from a source image
 * @param imageSrc - Source image URL or data URL
 * @param pixelCrop - Cropping area in pixels
 * @param rotation - Rotation angle in degrees
 * @param flip - Flip image
 * @param outputType - Output type: 'dataUrl' or 'file'
 * @returns Promise with the cropped image as data URL or File
 */
/**
 * Creates a cropped image from a source image
 * @param imageSrc - Source image URL or data URL
 * @param pixelCrop - Cropping area in pixels
 * @param rotation - Rotation angle in degrees
 * @param flip - Flip image
 * @param outputType - Output type: 'dataUrl' or 'file'
 * @param fileName - Optional filename for the output file
 * @returns Promise with the cropped image as data URL or File
 */
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { width: number; height: number; x: number; y: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  outputType: 'dataUrl' | 'file' = 'dataUrl',
  fileName?: string
): Promise<string | File> => {
  console.log('getCroppedImg called with:', { pixelCrop, rotation, flip, outputType });
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate dimensions based on rotation and original image dimensions
  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center of the canvas
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped image
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Could not get cropped canvas context');
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;
  
  // Add detailed logs for debugging cropping issues
  console.log('Cropping details:', {
    sourceX: pixelCrop.x,
    sourceY: pixelCrop.y,
    sourceWidth: pixelCrop.width, 
    sourceHeight: pixelCrop.height,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    croppedCanvasWidth: croppedCanvas.width,
    croppedCanvasHeight: croppedCanvas.height,
    originalImage: { width: image.width, height: image.height },
    rotation,
    flip
  });

  // Apply exact crop to the rotated image
  // The x and y coordinates are relative to the rotated canvas center
  try {
    // Draw the cropped image with offset to account for rotation
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
  } catch (error) {
    console.error('Error during cropping:', error);
    throw new Error(`Cropping failed: ${error.message}`);
  }

  // Return as a data URL or File based on outputType
  if (outputType === 'file') {
    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }
          const file = new File(
            [blob],
            fileName || `cropped-image-${Date.now()}.jpg`,
            { type: 'image/jpeg' }
          );
          console.log('Created cropped image file:', {
            name: file.name,
            size: file.size,
            type: file.type
          });
          resolve(file);
        },
        'image/jpeg',
        0.95  // High quality for better image fidelity
      );
    });
  } else {
    // Return as data URL
    const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.95);
    console.log('Created cropped image data URL');
    return dataUrl;
  }
};

/**
 * Creates an Image object from a URL
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

/**
 * Convert degrees to radians
 */
const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180;
};

/**
 * Calculate rotated dimensions
 */
const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * Converts a File to a data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a data URL to a File
 */
export const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  console.log('Converting data URL to file:', dataUrl.substring(0, 50) + '...');
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    console.log('Converted data URL to file:', { name: file.name, type: file.type, size: file.size });
    return file;
  } catch (error) {
    console.error('Error converting data URL to File:', error);
    throw error;
  }
};

/**
 * Generates a responsive image URL with appropriate sizing parameters
 * Supports various image hosting services like unsplash and databutton static assets
 */

/**
 * Generates a responsive image URL with appropriate sizing parameters
 * Supports various image hosting services like unsplash and databutton static assets
 */
export function getOptimizedImageUrl(url: string, width: number = 800): string {
  // For Unsplash images, use their image optimization API
  if (url.includes('unsplash.com')) {
    // Add width, quality, and auto format parameters if not already present
    const hasParams = url.includes('?');
    const connector = hasParams ? '&' : '?';
    const params = `${connector}w=${width}&q=80&auto=format&fit=crop`;
    
    // Avoid adding duplicate parameters
    if (url.includes('w=') && url.includes('q=') && url.includes('auto=format')) {
      return url;
    }
    
    return `${url}${params}`;
  }
  
  // Databutton static assets are already optimized
  return url;
}

/**
 * Provides a fallback image URL when the original image fails to load
 */
export function getPlaceholderImage(category: string = 'general'): string {
  // Category-specific placeholder images
  const placeholders = {
    food: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop",
    venue: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?q=80&w=800&auto=format&fit=crop",
    events: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
    general: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop"
  };
  
  return placeholders[category as keyof typeof placeholders] || placeholders.general;
}

/**
 * Returns image dimensions for proper image aspect ratio and prevent layout shifts
 */
export function getImageDimensions(width: number, height: number): { width: number, height: number } {
  // Normalize dimensions for aspect ratio purposes
  if (!width || !height) {
    return { width: 4, height: 3 }; // Default 4:3 aspect ratio
  }
  
  return { width, height };
}

/**
 * Helper function to preload an image for analysis
 * @param url URL of the image to preload
 * @returns Promise with the loaded image
 */
const preloadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

/**
 * Analyzes an image to determine its dimensions and aspect ratio
 * @param url URL of the image to analyze
 * @returns Promise with the image dimensions and aspect ratio
 */
export async function analyzeImage(url: string): Promise<{ 
  width: number, 
  height: number, 
  aspectRatio: string,
  aspectRatioValue: number 
}> {
  try {
    const img = await preloadImage(url);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    
    let aspectRatio = 'unknown';
    const aspectRatioValue = width / height;
    
    // Determine aspect ratio with tighter tolerances
    if (Math.abs(aspectRatioValue - 1) < 0.01) {
      aspectRatio = 'square'; // 1:1
    } else if (Math.abs(aspectRatioValue - 16/9) < 0.05) {
      aspectRatio = 'widescreen'; // 16:9
    } else if (Math.abs(aspectRatioValue - 4/3) < 0.05) {
      aspectRatio = 'standard'; // 4:3
    } else if (Math.abs(aspectRatioValue - 3/2) < 0.05) {
      aspectRatio = 'photo'; // 3:2
    } else if (aspectRatioValue > 1) {
      aspectRatio = 'landscape';
    } else {
      aspectRatio = 'portrait';
    }
    
    return { width, height, aspectRatio, aspectRatioValue };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { width: 0, height: 0, aspectRatio: 'unknown', aspectRatioValue: 0 };
  }
}
