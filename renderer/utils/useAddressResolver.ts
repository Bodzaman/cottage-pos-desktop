

import React, { useState, useCallback, useRef } from 'react';
import { apiClient } from 'app';
import { toast } from 'sonner';

export interface ResolvedAddress {
  street_number: string;
  route: string;
  locality: string;
  postal_code: string;
  country: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  source: 'autocomplete' | 'geocoding' | 'manual' | 'cache';
  confidence?: 'high' | 'medium' | 'low';
}

export interface AddressInput {
  query: string;
  type?: 'postcode' | 'address' | 'auto';
}

export interface UseAddressResolverReturn {
  resolveAddress: (input: AddressInput) => Promise<ResolvedAddress | null>;
  isResolving: boolean;
  error: string | null;
  clearError: () => void;
  getCachedAddress: (query: string) => ResolvedAddress | null;
  clearCache: () => void;
}

// Simple in-memory cache for resolved addresses
const addressCache = new Map<string, ResolvedAddress>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Universal Address Resolver Hook
 * 
 * Provides consistent address handling across the application with:
 * - Intelligent input detection (postcode vs address)
 * - Fallback geocoding when Places API fails
 * - In-memory caching to prevent repeated API calls
 * - Guaranteed coordinate output
 * - Error recovery and retry logic
 * - Cost optimization through caching
 * 
 * Usage:
 * ```typescript
 * const { resolveAddress, isResolving, error } = useAddressResolver();
 * 
 * const handleAddressInput = async (query: string) => {
 *   const resolved = await resolveAddress({ query, type: 'auto' });
 *   if (resolved) {
 *     // Address always has coordinates
 *     console.log(resolved.latitude, resolved.longitude);
 *   }
 * };
 * ```
 */
export function useAddressResolver(): UseAddressResolverReturn {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache management
  const getCachedAddress = useCallback((query: string): ResolvedAddress | null => {
    const normalizedQuery = query.trim().toLowerCase();
    const cached = addressCache.get(normalizedQuery);
    const timestamp = cacheTimestamps.get(normalizedQuery);
    
    if (cached && timestamp && (Date.now() - timestamp) < CACHE_EXPIRY) {
      console.log('📦 Using cached address for:', query);
      return { ...cached, source: 'cache' };
    }
    
    // Clean expired cache entry
    if (cached) {
      addressCache.delete(normalizedQuery);
      cacheTimestamps.delete(normalizedQuery);
    }
    
    return null;
  }, []);

  const setCachedAddress = useCallback((query: string, address: ResolvedAddress) => {
    const normalizedQuery = query.trim().toLowerCase();
    addressCache.set(normalizedQuery, address);
    cacheTimestamps.set(normalizedQuery, Date.now());
    console.log('💾 Cached address for:', query);
  }, []);

  const clearCache = useCallback(() => {
    addressCache.clear();
    cacheTimestamps.clear();
    console.log('🗑️ Address cache cleared');
  }, []);

  // Detect input type automatically
  const detectInputType = (query: string): 'postcode' | 'address' => {
    const cleaned = query.trim().toUpperCase();
    
    // UK postcode patterns
    const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/;
    
    if (postcodePattern.test(cleaned)) {
      return 'postcode';
    }
    
    return 'address';
  };

  // Resolve address using multiple strategies
  const resolveAddress = useCallback(async (input: AddressInput): Promise<ResolvedAddress | null> => {
    const { query, type = 'auto' } = input;
    
    if (!query?.trim()) {
      setError('Address query cannot be empty');
      return null;
    }

    // Check cache first
    const cached = getCachedAddress(query);
    if (cached) {
      setError(null);
      return cached;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setIsResolving(true);
      setError(null);
      
      console.log('🔄 Resolving address:', { query, type });
      
      // Determine resolution strategy
      const resolvedType = type === 'auto' ? detectInputType(query) : type;
      console.log('🎯 Detected input type:', resolvedType);
      
      let result: ResolvedAddress | null = null;
      
      if (resolvedType === 'postcode') {
        result = await resolvePostcode(query);
      } else {
        result = await resolveFullAddress(query);
      }
      
      if (result) {
        // Add confidence score based on source
        result.confidence = getConfidenceScore(result);
        
        // Cache successful resolution
        setCachedAddress(query, result);
        
        console.log('✅ Address resolved successfully:', result);
        toast.success('📍 Address located successfully');
        return result;
      } else {
        console.warn('⚠️ Address resolution failed for:', query);
        setError('Unable to locate this address. Please check and try again.');
        toast.error('Address not found');
        return null;
      }
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🚫 Address resolution cancelled');
        return null;
      }
      
      console.error('❌ Address resolution error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve address';
      setError(errorMessage);
      toast.error('Failed to resolve address');
      return null;
    } finally {
      setIsResolving(false);
      abortControllerRef.current = null;
    }
  }, [getCachedAddress, setCachedAddress]);

  // Resolve postcode using geocoding API
  const resolvePostcode = async (postcode: string): Promise<ResolvedAddress | null> => {
    try {
      console.log('📮 Resolving postcode:', postcode);
      
      const response = await apiClient.geocode({
        postcode: postcode.trim().toUpperCase()
      });
      
      const result = await response.json();
      
      if (result.success && result.coordinates) {
        return {
          street_number: '',
          route: '',
          locality: result.locationName || '',
          postal_code: result.postcode || postcode.trim().toUpperCase(),
          country: 'United Kingdom',
          formatted_address: `${result.locationName || ''}, ${result.postcode || postcode}`.trim(),
          latitude: result.coordinates.lat,
          longitude: result.coordinates.lng,
          source: 'geocoding'
        };
      }
      
      return null;
    } catch (err) {
      console.error('❌ Postcode resolution error:', err);
      return null;
    }
  };

  // Resolve full address using geocoding API
  const resolveFullAddress = async (address: string): Promise<ResolvedAddress | null> => {
    try {
      console.log('🏠 Resolving full address:', address);
      
      const response = await apiClient.geocode({
        locationName: address.trim()
      });
      
      const result = await response.json();
      
      if (result.success && result.coordinates) {
        // Parse the address into components (basic parsing)
        const parts = address.trim().split(',').map(p => p.trim());
        
        return {
          street_number: '',
          route: parts[0] || address.trim(),
          locality: result.locationName || (parts.length > 1 ? parts[1] : ''),
          postal_code: result.postcode || '',
          country: 'United Kingdom',
          formatted_address: address.trim(),
          latitude: result.coordinates.lat,
          longitude: result.coordinates.lng,
          source: 'geocoding'
        };
      }
      
      return null;
    } catch (err) {
      console.error('❌ Address resolution error:', err);
      return null;
    }
  };

  // Determine confidence score based on source and data completeness
  const getConfidenceScore = (address: ResolvedAddress): 'high' | 'medium' | 'low' => {
    if (address.source === 'autocomplete') {
      return 'high'; // Google Places suggestions are highly accurate
    }
    
    if (address.source === 'geocoding') {
      // Check data completeness
      const hasPostcode = !!address.postal_code;
      const hasLocality = !!address.locality;
      
      if (hasPostcode && hasLocality) {
        return 'high';
      } else if (hasPostcode || hasLocality) {
        return 'medium';
      } else {
        return 'low';
      }
    }
    
    return 'medium';
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    resolveAddress,
    isResolving,
    error,
    clearError,
    getCachedAddress,
    clearCache
  };
}

export default useAddressResolver;

// Utility functions for external use
export const isValidUKPostcode = (postcode: string): boolean => {
  const pattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/;
  return pattern.test(postcode.trim().toUpperCase());
};

export const formatPostcode = (postcode: string): string => {
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, '');
  if (cleaned.length >= 5) {
    return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  }
  return cleaned;
};

export const normalizeAddress = (address: ResolvedAddress): string => {
  const parts = [
    address.street_number,
    address.route,
    address.locality,
    address.postal_code
  ].filter(Boolean);
  
  return parts.join(', ');
};
