/**
 * Priority-Based Image Preloading Service
 * Intelligently preloads images based on priority levels from pos-bundle API
 */

import { POSBundleMenuItem } from 'types';

type ImagePriority = 'critical' | 'important' | 'deferred' | 'lazy';

interface PreloadTask {
  url: string;
  priority: ImagePriority;
  order: number;
  estimatedLoadTime: number;
  resolve: (loaded: boolean) => void;
  reject: (error: Error) => void;
}

interface PreloadedImage {
  url: string;
  loaded: boolean;
  error?: string;
  loadTime?: number;
}

class ImagePreloaderService {
  private preloadedImages: Map<string, PreloadedImage> = new Map();
  private loadingQueue: PreloadTask[] = [];
  private activeLoads: Set<string> = new Set();
  private maxConcurrentLoads = 3;
  private abortController: AbortController | null = null;

  /**
   * Initialize preloading with bundle items
   */
  async initializeFromBundle(bundleItems: POSBundleMenuItem[]): Promise<void> {
    console.log('🖼️ [ImagePreloader] Initializing from bundle with', bundleItems.length, 'items');
    
    // Cancel any previous preloading
    this.cancelAllPreloading();
    this.abortController = new AbortController();
    
    // Create preload tasks from bundle items with image priorities
    const preloadTasks: PreloadTask[] = [];
    
    bundleItems
      .filter(item => item.image_thumb_url && item.image_priority && item.preload_order)
      .sort((a, b) => (a.preload_order || 999) - (b.preload_order || 999))
      .forEach(item => {
        if (!item.image_thumb_url) return;
        
        const task = new Promise<boolean>((resolve, reject) => {
          preloadTasks.push({
            url: item.image_thumb_url!,
            priority: item.image_priority as ImagePriority,
            order: item.preload_order || 999,
            estimatedLoadTime: item.estimated_load_time_ms || 1000,
            resolve,
            reject
          });
        });
      });
    
    // Group tasks by priority
    const criticalTasks = preloadTasks.filter(t => t.priority === 'critical');
    const importantTasks = preloadTasks.filter(t => t.priority === 'important');
    const deferredTasks = preloadTasks.filter(t => t.priority === 'deferred');
    
    console.log('🖼️ [ImagePreloader] Tasks grouped:', {
      critical: criticalTasks.length,
      important: importantTasks.length,
      deferred: deferredTasks.length
    });
    
    // Execute preloading in priority order
    try {
      // Phase 1: Critical images (immediate)
      await this.preloadImageBatch(criticalTasks, 'critical');
      
      // Phase 2: Important images (after critical completes)
      setTimeout(() => {
        this.preloadImageBatch(importantTasks, 'important');
      }, 100);
      
      // Phase 3: Deferred images (after important starts)
      setTimeout(() => {
        this.preloadImageBatch(deferredTasks, 'deferred');
      }, 300);
      
    } catch (error) {
      console.error('🖼️ [ImagePreloader] Error during initialization:', error);
    }
  }
  
  /**
   * Preload a batch of images with concurrency control
   */
  private async preloadImageBatch(tasks: PreloadTask[], phase: string): Promise<void> {
    if (tasks.length === 0) return;
    
    console.log(`🖼️ [ImagePreloader] Starting ${phase} phase with ${tasks.length} images`);
    const startTime = performance.now();
    
    // Process tasks with concurrency limit
    const concurrentTasks: Promise<void>[] = [];
    
    for (const task of tasks) {
      // Wait if we've hit the concurrent load limit
      if (concurrentTasks.length >= this.maxConcurrentLoads) {
        await Promise.race(concurrentTasks);
        // Remove completed tasks
        concurrentTasks.splice(0, concurrentTasks.findIndex(p => p === concurrentTasks[0]));
      }
      
      // Start preloading this image
      const loadPromise = this.preloadSingleImage(task);
      concurrentTasks.push(loadPromise);
    }
    
    // Wait for all remaining tasks to complete
    await Promise.allSettled(concurrentTasks);
    
    const duration = performance.now() - startTime;
    console.log(`🖼️ [ImagePreloader] ${phase} phase completed in ${duration.toFixed(1)}ms`);
  }
  
  /**
   * Preload a single image
   */
  private async preloadSingleImage(task: PreloadTask): Promise<void> {
    const { url } = task;
    
    // Skip if already loading or loaded
    if (this.activeLoads.has(url) || this.preloadedImages.has(url)) {
      task.resolve(true);
      return;
    }
    
    this.activeLoads.add(url);
    const loadStart = performance.now();
    
    try {
      const img = new Image();
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const loadTime = performance.now() - loadStart;
          this.preloadedImages.set(url, {
            url,
            loaded: true,
            loadTime
          });
          console.log(`🖼️ [ImagePreloader] Loaded ${task.priority} image in ${loadTime.toFixed(1)}ms:`, url);
          task.resolve(true);
          resolve();
        };
        
        img.onerror = () => {
          const error = `Failed to load image: ${url}`;
          this.preloadedImages.set(url, {
            url,
            loaded: false,
            error
          });
          console.warn('🖼️ [ImagePreloader] Failed to load image:', url);
          task.reject(new Error(error));
          reject(new Error(error));
        };
        
        // Handle abort signal
        if (this.abortController?.signal.aborted) {
          // Don't log abort errors - they're expected during cleanup
          reject(new Error('Preloading aborted'));
          return;
        }
        
        this.abortController?.signal.addEventListener('abort', () => {
          // Don't log abort errors - they're expected during cleanup
          reject(new Error('Preloading aborted'));
        });
      });
      
      // Start loading
      img.src = url;
      await loadPromise;
      
    } catch (error) {
      console.error(`🖼️ [ImagePreloader] Error loading ${task.priority} image:`, error);
      this.preloadedImages.set(url, {
        url,
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.activeLoads.delete(url);
    }
  }
  
  /**
   * Check if an image is preloaded and ready
   */
  isImageReady(url: string): boolean {
    const cached = this.preloadedImages.get(url);
    return cached?.loaded === true;
  }
  
  /**
   * Get preload status for an image
   */
  getImageStatus(url: string): PreloadedImage | null {
    return this.preloadedImages.get(url) || null;
  }
  
  /**
   * Cancel all active preloading
   */
  cancelAllPreloading(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.activeLoads.clear();
    this.loadingQueue.length = 0;
    console.log('🖼️ [ImagePreloader] All preloading cancelled');
  }
  
  /**
   * Get preloading statistics
   */
  getStats() {
    const total = this.preloadedImages.size;
    const loaded = Array.from(this.preloadedImages.values()).filter(img => img.loaded).length;
    const failed = Array.from(this.preloadedImages.values()).filter(img => !img.loaded).length;
    const activeLoads = this.activeLoads.size;
    
    return {
      total,
      loaded,
      failed,
      activeLoads,
      successRate: total > 0 ? (loaded / total) * 100 : 0
    };
  }
  
  /**
   * Clear all cached images (for cleanup)
   */
  clearCache(): void {
    this.preloadedImages.clear();
    this.activeLoads.clear();
    console.log('🖼️ [ImagePreloader] Cache cleared');
  }
}

// Export singleton instance
export const imagePreloader = new ImagePreloaderService();
export type { ImagePriority, PreloadedImage };
