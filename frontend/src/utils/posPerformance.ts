/**
 * Performance telemetry for POS Desktop
 * Tracks startup time, rendering performance, and user interactions
 */

interface PerformanceMetric {
  name: string;
  timestamp: number;
  duration?: number;
  value?: number;
  metadata?: Record<string, any>;
}

class POSPerformanceTelemetry {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private enabled: boolean = true;
  private initializationState: Map<string, boolean> = new Map(); // Track initialization states
  private initializationPromises: Map<string, Promise<void>> = new Map(); // Track ongoing initializations
  private isDevelopment: boolean = false; // Only log in development

  constructor() {
    // Only enable verbose logging in development
    this.isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    
    // Auto-capture page load metrics
    if (typeof window !== 'undefined' && window.performance) {
      this.capturePageLoadMetrics();
    }
  }

  /**
   * Check if an initialization is already in progress or completed
   */
  isInitialized(key: string): boolean {
    return this.initializationState.get(key) === true;
  }

  /**
   * Check if initialization is currently in progress
   */
  isInitializing(key: string): boolean {
    return this.initializationPromises.has(key);
  }

  /**
   * Start an initialization process with guard against duplicates
   */
  async startInitialization(key: string, initFunction: () => Promise<void>): Promise<void> {
    // If already initialized, skip
    if (this.isInitialized(key)) {
      if (this.isDevelopment) {
        console.log(`🔄 [POS Perf] ${key} already initialized, skipping`);
      }
      return;
    }

    // If currently initializing, wait for existing promise
    if (this.isInitializing(key)) {
      if (this.isDevelopment) {
        console.log(`⏳ [POS Perf] ${key} initialization in progress, waiting...`);
      }
      return this.initializationPromises.get(key)!;
    }

    // Start new initialization
    if (this.isDevelopment) {
      console.log(`🚀 [POS Perf] Starting ${key} initialization`);
    }
    const initPromise = initFunction().then(() => {
      this.initializationState.set(key, true);
      this.initializationPromises.delete(key);
      if (this.isDevelopment) {
        console.log(`✅ [POS Perf] ${key} initialization completed`);
      }
    }).catch((error) => {
      if (this.isDevelopment) {
        console.error(`❌ [POS Perf] ${key} initialization failed:`, error);
      }
      this.initializationPromises.delete(key);
      throw error;
    });

    this.initializationPromises.set(key, initPromise);
    return initPromise;
  }

  /**
   * Reset initialization state (for testing or forced reinitialization)
   */
  resetInitialization(key: string) {
    this.initializationState.delete(key);
    this.initializationPromises.delete(key);
    if (this.isDevelopment) {
      console.log(`🔄 [POS Perf] Reset initialization state for ${key}`);
    }
  }

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;
    
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    
    this.addMetric({
      name: `${name}_start`,
      timestamp,
      metadata
    });
    
    // Only log in development
    if (this.isDevelopment) {
      console.log(`⏱️ [POS Perf] ${name} started at ${timestamp.toFixed(2)}ms`);
    }
  }

  /**
   * Measure the duration since mark was set
   */
  measure(name: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;
    
    const endTime = performance.now();
    const startTime = this.marks.get(name);
    
    if (startTime) {
      const duration = endTime - startTime;
      
      this.addMetric({
        name: `${name}_duration`,
        timestamp: endTime,
        duration,
        metadata
      });
      
      // Only log in development
      if (this.isDevelopment) {
        console.log(`⏱️ [POS Perf] ${name} completed in ${duration.toFixed(2)}ms`);
      }
      
      // Clear the mark
      this.marks.delete(name);
      
      return duration;
    } else {
      if (this.isDevelopment) {
        console.warn(`⚠️ [POS Perf] No start mark found for ${name}`);
      }
      return null;
    }
  }

  /**
   * Record a custom metric
   */
  record(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.enabled) return;
    
    this.addMetric({
      name,
      timestamp: performance.now(),
      value,
      metadata
    });
    
    // Only log in development
    if (this.isDevelopment) {
      console.log(`📊 [POS Perf] ${name}: ${value}`, metadata);
    }
  }

  /**
   * Get all metrics or filter by name pattern
   */
  getMetrics(namePattern?: string): PerformanceMetric[] {
    if (!namePattern) return [...this.metrics];
    
    const regex = new RegExp(namePattern, 'i');
    return this.metrics.filter(metric => regex.test(metric.name));
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    // Group metrics by category
    const categories = {
      startup: this.getMetrics('startup|bundle|initial'),
      rendering: this.getMetrics('render|paint|category'),
      interaction: this.getMetrics('search|select|open')
    };
    
    Object.entries(categories).forEach(([category, metrics]) => {
      if (metrics.length > 0) {
        const durations = metrics
          .filter(m => m.duration !== undefined)
          .map(m => m.duration!);
        
        if (durations.length > 0) {
          summary[category] = {
            count: durations.length,
            total: durations.reduce((sum, d) => sum + d, 0),
            average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            min: Math.min(...durations),
            max: Math.max(...durations)
          };
        }
      }
    });
    
    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private capturePageLoadMetrics() {
    // Wait a bit for navigation timing to be available
    setTimeout(() => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const navigationStart = timing.navigationStart;
        
        // DOM timing metrics
        this.addMetric({
          name: 'page_dom_loading',
          timestamp: timing.domLoading - navigationStart,
          duration: timing.domInteractive - timing.domLoading
        });
        
        this.addMetric({
          name: 'page_dom_complete',
          timestamp: timing.domComplete - navigationStart,
          duration: timing.domComplete - timing.domInteractive
        });
        
        // Load event
        if (timing.loadEventEnd > 0) {
          this.addMetric({
            name: 'page_load_complete',
            timestamp: timing.loadEventEnd - navigationStart,
            duration: timing.loadEventEnd - timing.loadEventStart
          });
        }
      }
    }, 100);
  }
}

// Singleton instance
const posPerf = new POSPerformanceTelemetry();

export default posPerf;

// Convenience hooks and functions
export const usePOSPerformance = () => {
  return {
    mark: posPerf.mark.bind(posPerf),
    measure: posPerf.measure.bind(posPerf),
    record: posPerf.record.bind(posPerf),
    getMetrics: posPerf.getMetrics.bind(posPerf),
    getSummary: posPerf.getSummary.bind(posPerf)
  };
};

// Common performance measurements for POS
export const POSPerfMarks = {
  STARTUP: 'pos_startup',
  INITIAL_RENDER: 'pos_initial_render',
  BUNDLE_LOAD: 'pos_bundle_load',
  CATEGORY_OPEN: 'pos_category_open',
  SEARCH_QUERY: 'pos_search',
  ITEM_SELECT: 'pos_item_select',
  FIRST_INTERACTIVE: 'pos_first_interactive'
} as const;

export type POSPerfMark = typeof POSPerfMarks[keyof typeof POSPerfMarks];
