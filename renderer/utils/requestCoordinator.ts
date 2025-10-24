/**
 * Request Coordinator - Prevents duplicate network requests
 * 
 * When multiple components request the same data simultaneously,
 * this coordinator ensures only one network request is made and
 * all callers receive the same result.
 * 
 * Example:
 * - Component A calls refreshData()
 * - Component B calls refreshData() 10ms later
 * - Result: Only 1 network request is made, both get the same data
 */

class RequestCoordinator {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestStats = {
    totalRequests: 0,
    deduplicatedRequests: 0,
    lastReset: Date.now()
  };

  /**
   * Execute a request with deduplication
   * 
   * @param key Unique identifier for this request type
   * @param fetcher Function that performs the actual request
   * @returns Promise with the request result
   */
  async fetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    this.requestStats.totalRequests++;

    // Check if this request is already in progress
    if (this.pendingRequests.has(key)) {
      this.requestStats.deduplicatedRequests++;
      return this.pendingRequests.get(key)! as Promise<T>;
    }

    // Start new request
    const promise = fetcher();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Get deduplication statistics
   */
  getStats() {
    const deduplicationRate = this.requestStats.totalRequests > 0
      ? (this.requestStats.deduplicatedRequests / this.requestStats.totalRequests) * 100
      : 0;

    return {
      totalRequests: this.requestStats.totalRequests,
      deduplicatedRequests: this.requestStats.deduplicatedRequests,
      actualRequests: this.requestStats.totalRequests - this.requestStats.deduplicatedRequests,
      deduplicationRate: Math.round(deduplicationRate * 10) / 10,
      uptime: Date.now() - this.requestStats.lastReset
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.requestStats = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clear() {
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const requestCoordinator = new RequestCoordinator();

// Expose to dev tools in development
if (import.meta.env?.DEV) {
  (window as any).requestCoordinator = requestCoordinator;
}
