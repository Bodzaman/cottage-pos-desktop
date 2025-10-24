/**
 * Network Performance Monitor - Tracks network metrics for POSDesktop
 * 
 * Monitors:
 * - Active subscription count
 * - Request count per minute
 * - Request deduplication rate
 * - Cache hit rate
 * - Failed request rate
 * - Subscription scope (all items vs category-filtered)
 */

interface NetworkMetrics {
  // Subscription metrics
  activeSubscriptions: number;
  subscriptionsByChannel: Record<string, {
    active: boolean;
    scope: 'all' | 'category' | 'filtered';
    filterValue?: string;
    messageCount: number;
    lastMessage: number;
  }>;

  // Request metrics
  totalRequests: number;
  deduplicatedRequests: number;
  failedRequests: number;
  
  // Cache metrics
  cacheHits: number;
  cacheMisses: number;
  
  // Real-time metrics
  realtimeMessages: number;
  messagesPerMinute: number;
  
  // Timing
  lastUpdated: number;
  sessionStart: number;
}

class NetworkMonitor {
  private metrics: NetworkMetrics = {
    activeSubscriptions: 0,
    subscriptionsByChannel: {},
    totalRequests: 0,
    deduplicatedRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    realtimeMessages: 0,
    messagesPerMinute: 0,
    lastUpdated: Date.now(),
    sessionStart: Date.now()
  };

  private messageTimestamps: number[] = [];

  /**
   * Track subscription start
   */
  subscriptionStarted(channel: string, scope: 'all' | 'category' | 'filtered' = 'all', filterValue?: string) {
    this.metrics.activeSubscriptions++;
    this.metrics.subscriptionsByChannel[channel] = {
      active: true,
      scope,
      filterValue,
      messageCount: 0,
      lastMessage: 0
    };
    this.updateTimestamp();
  }

  /**
   * Track subscription stop
   */
  subscriptionStopped(channel: string) {
    if (this.metrics.subscriptionsByChannel[channel]) {
      this.metrics.activeSubscriptions--;
      this.metrics.subscriptionsByChannel[channel].active = false;
    }
    this.updateTimestamp();
  }

  /**
   * Track real-time message received
   */
  messageReceived(channel: string) {
    this.metrics.realtimeMessages++;
    
    if (this.metrics.subscriptionsByChannel[channel]) {
      this.metrics.subscriptionsByChannel[channel].messageCount++;
      this.metrics.subscriptionsByChannel[channel].lastMessage = Date.now();
    }

    // Track message timestamps for rate calculation
    const now = Date.now();
    this.messageTimestamps.push(now);
    
    // Keep only last 60 seconds of timestamps
    const oneMinuteAgo = now - 60000;
    this.messageTimestamps = this.messageTimestamps.filter(ts => ts > oneMinuteAgo);
    
    this.metrics.messagesPerMinute = this.messageTimestamps.length;
    this.updateTimestamp();
  }

  /**
   * Track network request
   */
  requestMade(deduplicated: boolean = false) {
    this.metrics.totalRequests++;
    if (deduplicated) {
      this.metrics.deduplicatedRequests++;
    }
    this.updateTimestamp();
  }

  /**
   * Track failed request
   */
  requestFailed() {
    this.metrics.failedRequests++;
    this.updateTimestamp();
  }

  /**
   * Track cache hit
   */
  cacheHit() {
    this.metrics.cacheHits++;
    this.updateTimestamp();
  }

  /**
   * Track cache miss
   */
  cacheMiss() {
    this.metrics.cacheMisses++;
    this.updateTimestamp();
  }

  /**
   * Get current metrics
   */
  getMetrics(): NetworkMetrics & {
    deduplicationRate: number;
    cacheHitRate: number;
    failureRate: number;
    sessionDuration: number;
  } {
    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    const actualRequests = this.metrics.totalRequests - this.metrics.deduplicatedRequests;

    return {
      ...this.metrics,
      deduplicationRate: this.metrics.totalRequests > 0
        ? Math.round((this.metrics.deduplicatedRequests / this.metrics.totalRequests) * 1000) / 10
        : 0,
      cacheHitRate: totalCacheAccess > 0
        ? Math.round((this.metrics.cacheHits / totalCacheAccess) * 1000) / 10
        : 0,
      failureRate: actualRequests > 0
        ? Math.round((this.metrics.failedRequests / actualRequests) * 1000) / 10
        : 0,
      sessionDuration: Date.now() - this.metrics.sessionStart
    };
  }

  /**
   * Get formatted report
   */
  getReport(): string {
    const metrics = this.getMetrics();
    const actualRequests = metrics.totalRequests - metrics.deduplicatedRequests;

    return `
📊 POS Network Performance Report
═══════════════════════════════════════

🔌 Subscriptions:
  Active: ${metrics.activeSubscriptions}
  Channels: ${Object.keys(metrics.subscriptionsByChannel).length}
  
📨 Real-time Messages:
  Total: ${metrics.realtimeMessages}
  Rate: ${metrics.messagesPerMinute}/min
  
🌐 Network Requests:
  Total: ${metrics.totalRequests}
  Actual: ${actualRequests}
  Deduplicated: ${metrics.deduplicatedRequests} (${metrics.deduplicationRate}%)
  Failed: ${metrics.failedRequests} (${metrics.failureRate}%)
  
💾 Cache Performance:
  Hits: ${metrics.cacheHits}
  Misses: ${metrics.cacheMisses}
  Hit Rate: ${metrics.cacheHitRate}%
  
⏱️  Session Duration: ${Math.round(metrics.sessionDuration / 1000)}s
    `;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      activeSubscriptions: 0,
      subscriptionsByChannel: {},
      totalRequests: 0,
      deduplicatedRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      realtimeMessages: 0,
      messagesPerMinute: 0,
      lastUpdated: Date.now(),
      sessionStart: Date.now()
    };
    this.messageTimestamps = [];
  }

  private updateTimestamp() {
    this.metrics.lastUpdated = Date.now();
  }
}

// Export singleton instance
export const networkMonitor = new NetworkMonitor();

// Expose to dev tools in development
if (import.meta.env?.DEV) {
  (window as any).posNetworkMetrics = networkMonitor;
}
