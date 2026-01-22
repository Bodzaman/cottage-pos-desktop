/**
 * Performance Monitor Utility
 * 
 * Centralized performance tracking for the application.
 * Handles performance marks, measures, and logging.
 * 
 * Usage:
 * ```tsx
 * import { PerformanceMonitor } from 'utils/performanceMonitor';
 * 
 * const perf = new PerformanceMonitor('PageName');
 * perf.mark('data-loaded');
 * perf.measure('page-load', 'page-start', 'data-loaded');
 * perf.logSummary();
 * ```
 */

export class PerformanceMonitor {
  private context: string;
  private marks: Map<string, number>;
  private measures: Map<string, number>;
  private isSupported: boolean;

  constructor(context: string = 'App') {
    this.context = context;
    this.marks = new Map();
    this.measures = new Map();
    this.isSupported = typeof performance !== 'undefined';
  }

  /**
   * Create a performance mark
   */
  mark(name: string): void {
    if (!this.isSupported) return;

    try {
      const fullName = `${this.context}:${name}`;
      
      // Check if mark already exists
      const existingMarks = performance.getEntriesByName(fullName, 'mark');
      if (existingMarks.length === 0) {
        performance.mark(fullName);
        this.marks.set(name, performance.now());
      }
    } catch (error) {
    }
  }

  /**
   * Create a performance measure between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    if (!this.isSupported) return null;

    try {
      const fullStartMark = `${this.context}:${startMark}`;
      const fullEndMark = `${this.context}:${endMark}`;
      const fullMeasureName = `${this.context}:${name}`;

      // Check if both marks exist
      const startMarks = performance.getEntriesByName(fullStartMark, 'mark');
      const endMarks = performance.getEntriesByName(fullEndMark, 'mark');

      if (startMarks.length === 0) {
        return null;
      }

      if (endMarks.length === 0) {
        return null;
      }

      performance.measure(fullMeasureName, fullStartMark, fullEndMark);
      const measures = performance.getEntriesByName(fullMeasureName, 'measure');
      
      if (measures.length > 0) {
        const duration = measures[0].duration;
        this.measures.set(name, duration);
        return duration;
      }
    } catch (error) {
    }

    return null;
  }

  /**
   * Get time elapsed since a mark
   */
  getElapsedTime(markName: string): number | null {
    const markTime = this.marks.get(markName);
    if (!markTime || !this.isSupported) return null;

    return performance.now() - markTime;
  }

  /**
   * Count DOM nodes (useful for render performance)
   */
  countDOMNodes(): number {
    if (typeof document === 'undefined') return 0;
    return document.querySelectorAll('*').length;
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!this.isSupported) return;

    
    // Log marks
    if (this.marks.size > 0) {
      this.marks.forEach((time, name) => {
      });
    }

    // Log measures
    if (this.measures.size > 0) {
      this.measures.forEach((duration, name) => {
      });
    }

    // Log DOM node count
    const nodeCount = this.countDOMNodes();
    if (nodeCount > 0) {
    }

    console.groupEnd();
  }

  /**
   * Clear all performance entries for this context
   */
  clear(): void {
    if (!this.isSupported) return;

    try {
      // Clear performance entries
      performance.getEntriesByType('mark').forEach(mark => {
        if (mark.name.startsWith(`${this.context}:`)) {
          performance.clearMarks(mark.name);
        }
      });

      performance.getEntriesByType('measure').forEach(measure => {
        if (measure.name.startsWith(`${this.context}:`)) {
          performance.clearMeasures(measure.name);
        }
      });

      this.marks.clear();
      this.measures.clear();
    } catch (error) {
    }
  }

  /**
   * Get all measures as an object (useful for analytics)
   */
  getMeasures(): Record<string, number> {
    const result: Record<string, number> = {};
    this.measures.forEach((duration, name) => {
      result[name] = duration;
    });
    return result;
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerf = new PerformanceMonitor('Global');

/**
 * Hook for using performance monitor in React components
 */
export function usePerformanceMonitor(context: string) {
  const [monitor] = React.useState(() => new PerformanceMonitor(context));
  
  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      monitor.clear();
    };
  }, [monitor]);

  return monitor;
}

// React import for the hook
import React from 'react';
