/**
 * Centralized Logging System with Environment-Aware Levels
 * Replaces scattered console.log statements for better performance
 */

import { mode, Mode } from 'app';

// Log levels with priority
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

// Environment-based configuration
const LOG_CONFIG = {
  [Mode.DEV]: {
    level: LogLevel.DEBUG,
    enableConsole: true,
    enablePerformanceLogs: true,
    maxObjectDepth: 3
  },
  [Mode.PROD]: {
    level: LogLevel.WARN,
    enableConsole: false,
    enablePerformanceLogs: false,
    maxObjectDepth: 1
  }
};

const config = LOG_CONFIG[mode] || LOG_CONFIG[Mode.PROD];

// Logger class with performance-conscious implementation
class Logger {
  private component: string;
  private performanceMarks: Map<string, number> = new Map();

  constructor(component: string) {
    this.component = component;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= config.level && config.enableConsole;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] ${level} [${this.component}]`;
    
    if (data) {
      // Limit object serialization depth for performance
      const serialized = this.safeStringify(data, config.maxObjectDepth);
      return `${prefix} ${message} ${serialized}`;
    }
    
    return `${prefix} ${message}`;
  }

  private safeStringify(obj: any, maxDepth: number): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          // Prevent circular references and deep nesting
          if (maxDepth <= 0) return '[Object]';
          maxDepth--;
        }
        return value;
      });
    } catch {
      return '[Unstringifiable Object]';
    }
  }

  // Core logging methods
  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('🔍 DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('ℹ️ INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('⚠️ WARN', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('❌ ERROR', message, error));
    }
  }

  // Performance monitoring methods
  startPerformanceTimer(label: string): void {
    if (config.enablePerformanceLogs) {
      this.performanceMarks.set(label, performance.now());
    }
  }

  endPerformanceTimer(label: string): number {
    if (!config.enablePerformanceLogs) return 0;
    
    const startTime = this.performanceMarks.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.performanceMarks.delete(label);
      
      if (duration > 100) { // Only log slow operations
        this.warn(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    return 0;
  }

  // API call logging helper
  logApiCall(endpoint: string, method: string = 'GET', duration?: number): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const durationText = duration ? ` (${duration.toFixed(2)}ms)` : '';
      this.debug(`API Call: ${method} ${endpoint}${durationText}`);
    }
  }

  // Polling cycle logging helper
  logPollingCycle(type: string, interval: number, dataSize?: number): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const sizeText = dataSize ? ` [${dataSize} items]` : '';
      this.debug(`Polling: ${type} (${interval}ms interval)${sizeText}`);
    }
  }
}

// Factory function for creating component loggers
export function createLogger(component: string): Logger {
  return new Logger(component);
}

// Convenience function for quick logging without creating logger instance
export const quickLog = {
  debug: (component: string, message: string, data?: any) => 
    createLogger(component).debug(message, data),
  info: (component: string, message: string, data?: any) => 
    createLogger(component).info(message, data),
  warn: (component: string, message: string, data?: any) => 
    createLogger(component).warn(message, data),
  error: (component: string, message: string, error?: any) => 
    createLogger(component).error(message, error)
};

// Export current environment config for reference
export const loggerConfig = config;
