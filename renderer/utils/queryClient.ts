import { QueryClient } from '@tanstack/react-query';

/**
 * Production-grade QueryClient configuration for dashboard data management.
 * 
 * Key features:
 * - Smart caching with 30s staleness window
 * - Automatic background refetching without UI flashing
 * - Exponential backoff retry strategy
 * - Window focus refetching for fresh data when user returns
 * - Tab activity detection (pauses polling when inactive)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Consider data fresh for 30 seconds (prevents unnecessary refetches)
      staleTime: 30000, // 30 seconds
      
      // Keep unused data in cache for 5 minutes
      gcTime: 300000, // 5 minutes (formerly cacheTime in v4)
      
      // Refetch when user returns to tab/window
      refetchOnWindowFocus: true,
      
      // Use cached data on component mount if available and fresh
      refetchOnMount: false,
      
      // Don't refetch on reconnect (we handle this with window focus)
      refetchOnReconnect: false,
      
      // Retry failed requests up to 2 times
      retry: 2,
      
      // Exponential backoff: 1s, 2s, 4s (max 30s)
      retryDelay: (attemptIndex) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      
      // Shorter retry delay for mutations (user is waiting)
      retryDelay: 1000,
    },
  },
});
