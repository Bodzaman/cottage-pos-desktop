/**
 * Client-Side Image Upload Optimizer
 * Compresses and optimizes images BEFORE uploading to reduce bandwidth and storage
 * Uses native Canvas API - no external dependencies required
 */

export interface UploadOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for WebP/JPEG quality
  targetFormat?: 'webp' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

export interface OptimizedUploadResult {
  webp: Blob | null;
  fallback: Blob; // JPEG or PNG fallback
  webpUrl: string | null;
  fallbackUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA=';
    const img = new Image();
    img.onload = () => resolve(img.width === 2 && img.height === 1);
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

/**
 * Load image file into an Image element
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  if (maxWidth && width > maxWidth) {
    height = (maxWidth / width) * height;
    width = maxWidth;
  }
  
  if (maxHeight && height > maxHeight) {
    width = (maxHeight / height) * width;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Convert canvas to Blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Optimize image for upload: resize, compress, and convert to WebP + fallback format
 */
export async function optimizeImageForUpload(
  file: File,
  options: UploadOptimizationOptions = {}
): Promise<OptimizedUploadResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    targetFormat = 'webp',
    maintainAspectRatio = true
  } = options;

  try {
    // Load original image
    const img = await loadImage(file);
    const originalSize = file.size;
    
    // Calculate new dimensions
    const dimensions = maintainAspectRatio
      ? calculateDimensions(img.width, img.height, maxWidth, maxHeight)
      : { width: maxWidth, height: maxHeight };
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
    
    // Generate WebP version (if supported)
    let webpBlob: Blob | null = null;
    let webpUrl: string | null = null;
    
    const browserSupportsWebP = await supportsWebP();
    if (browserSupportsWebP && targetFormat === 'webp') {
      try {
        webpBlob = await canvasToBlob(canvas, 'image/webp', quality);
        webpUrl = URL.createObjectURL(webpBlob);
      } catch (error) {
        console.warn('WebP conversion failed, using fallback only:', error);
      }
    }
    
    // Generate fallback (JPEG for photos, PNG for graphics)
    const fallbackMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const fallbackBlob = await canvasToBlob(canvas, fallbackMimeType, quality);
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    
    // Calculate compression ratio
    const optimizedSize = webpBlob ? webpBlob.size : fallbackBlob.size;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
    
    return {
      webp: webpBlob,
      fallback: fallbackBlob,
      webpUrl,
      fallbackUrl,
      width: dimensions.width,
      height: dimensions.height,
      originalSize,
      optimizedSize,
      compressionRatio
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw error;
  }
}

/**
 * Optimize profile image specifically (square crop, smaller size)
 */
export async function optimizeProfileImageUpload(
  file: File,
  size: number = 400
): Promise<OptimizedUploadResult> {
  return optimizeImageForUpload(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.9,
    targetFormat: 'webp',
    maintainAspectRatio: true // Changed to true to avoid distortion
  });
}

/**
 * Generate responsive image srcset for uploads
 * Creates multiple sizes for responsive loading
 */
export async function generateResponsiveUploadImages(
  file: File,
  sizes: number[] = [400, 800, 1200]
): Promise<{
  images: OptimizedUploadResult[];
  srcset: string;
  sizes: string;
}> {
  const images = await Promise.all(
    sizes.map(size => 
      optimizeImageForUpload(file, {
        maxWidth: size,
        quality: 0.85,
        targetFormat: 'webp'
      })
    )
  );
  
  // Generate srcset string for WebP
  const srcset = images
    .filter(img => img.webpUrl)
    .map((img, index) => `${img.webpUrl} ${sizes[index]}w`)
    .join(', ');
  
  // Generate sizes attribute (common responsive breakpoints)
  const sizesAttr = '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px';
  
  return {
    images,
    srcset,
    sizes: sizesAttr
  };
}

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] } = options;
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create a blur placeholder from image (for blur-up effect)
 */
export async function createBlurPlaceholder(
  file: File,
  width: number = 40
): Promise<string> {
  try {
    const img = await loadImage(file);
    
    // Calculate height maintaining aspect ratio
    const height = Math.round((width / img.width) * img.height);
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // Draw tiny version
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to data URL (JPEG for smaller size)
    return canvas.toDataURL('image/jpeg', 0.5);
  } catch (error) {
    console.error('Failed to create blur placeholder:', error);
    return '';
  }
}

/**
 * Cleanup object URLs to prevent memory leaks
 */
export function revokeImageUrls(...urls: (string | null)[]) {
  urls.forEach(url => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}
