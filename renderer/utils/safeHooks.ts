import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for safe async operations that automatically abort when component unmounts
 * Prevents race conditions from async operations completing after unmount
 */
export function useAbortableEffect(
  effect: (abortSignal: AbortSignal) => Promise<void> | void,
  deps: React.DependencyList,
  options?: {
    onAbort?: () => void;
    onError?: (error: Error) => void;
    suppressAbortErrors?: boolean;
  }
) {
  const { onAbort, onError, suppressAbortErrors = true } = options || {};
  
  useEffect(() => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    
    const runEffect = async () => {
      try {
        await effect(abortSignal);
      } catch (error) {
        // Only handle non-abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          if (!suppressAbortErrors) {
            console.log('Effect aborted due to component unmount');
          }
          onAbort?.();
        } else {
          console.error('Error in abortable effect:', error);
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      }
    };
    
    runEffect();
    
    return () => {
      abortController.abort();
    };
  }, deps);
}

/**
 * Hook for safe timeouts that automatically clear on component unmount
 * Prevents memory leaks from orphaned timeouts
 */
export function useSafeTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback();
      timeoutRef.current = null;
    }, delay);
    
    return timeoutRef.current;
  }, []);
  
  const clearSafeTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return { setSafeTimeout, clearSafeTimeout };
}

/**
 * Hook for safe intervals that automatically clear on component unmount
 * Prevents memory leaks from orphaned intervals
 */
export function useSafeInterval() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const setSafeInterval = useCallback((callback: () => void, delay: number) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(callback, delay);
    return intervalRef.current;
  }, []);
  
  const clearSafeInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return { setSafeInterval, clearSafeInterval };
}

/**
 * Hook for managing Zustand store subscriptions with automatic cleanup
 * Prevents subscription leaks when components unmount
 */
export function useStoreSubscription<T>(
  store: { subscribe: (listener: (state: T) => void) => () => void },
  selector: (state: T) => any,
  callback: (selectedState: any) => void
) {
  useEffect(() => {
    const unsubscribe = store.subscribe((state: T) => {
      const selectedState = selector(state);
      callback(selectedState);
    });
    
    return unsubscribe;
  }, [store, selector, callback]);
}

/**
 * Hook for coordinated async state management
 * Helps prevent race conditions in components with multiple async operations
 */
export function useAsyncState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const operationCountRef = useRef(0);
  
  // Track mounting status
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  const executeAsync = useCallback(async <R>(
    operation: () => Promise<R>,
    options?: {
      onSuccess?: (result: R) => void;
      onError?: (error: Error) => void;
      updateState?: (result: R) => T;
      suppressErrors?: boolean;
    }
  ): Promise<R | null> => {
    if (!mountedRef.current) {
      console.warn('Async operation called on unmounted component');
      return null;
    }
    
    const operationId = ++operationCountRef.current;
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      
      // Check if this is still the latest operation and component is mounted
      if (mountedRef.current && operationId === operationCountRef.current) {
        if (options?.updateState) {
          setState(options.updateState(result));
        }
        options?.onSuccess?.(result);
        setLoading(false);
        return result;
      }
      
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Only update state if component is still mounted and this is the latest operation
      if (mountedRef.current && operationId === operationCountRef.current) {
        setError(error);
        setLoading(false);
        
        if (!options?.suppressErrors) {
          console.error('Async operation failed:', error);
        }
        options?.onError?.(error);
      }
      
      return null;
    }
  }, []);
  
  const resetState = useCallback(() => {
    if (mountedRef.current) {
      setState(initialState);
      setError(null);
      setLoading(false);
      operationCountRef.current = 0;
    }
  }, [initialState]);
  
  return {
    state,
    setState: (newState: T) => {
      if (mountedRef.current) {
        setState(newState);
      }
    },
    loading,
    error,
    executeAsync,
    resetState,
    isMounted: mountedRef.current
  };
}

/**
 * Hook for safer component mounting checks using refs
 * More reliable than boolean flags for async operations
 */
export function useMountedRef() {
  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  return mountedRef;
}

/**
 * Hook for debounced values with cancellation support
 * Prevents race conditions in search and input handling
 */
export function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedValue;
}
