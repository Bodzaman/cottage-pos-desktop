/**
 * Search Analytics Utility
 * 
 * Tracks search behavior to understand:
 * - What customers search for
 * - Which searches return no results (menu gaps)
 * - Popular search terms
 * - Search conversion (search → add to cart)
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase config from localStorage (set by app initialization)
function getSupabaseClient() {
  const config = localStorage.getItem('supabase_config');
  if (!config) {
    console.warn('[SearchAnalytics] No Supabase config found in localStorage');
    return null;
  }
  
  try {
    const { url, key } = JSON.parse(config);
    return createClient(url, key);
  } catch (error) {
    console.error('[SearchAnalytics] Failed to parse Supabase config:', error);
    return null;
  }
}

/**
 * Search event data
 */
export interface SearchEvent {
  query: string;
  results_count: number;
  had_results: boolean;
  active_category?: string;
  dietary_filters?: string[]; // ['vegan', 'vegetarian', 'gluten_free']
  timestamp: string;
  user_id?: string;
  session_id?: string;
}

/**
 * Track a search query
 * 
 * @param query - Search query entered by user
 * @param resultsCount - Number of results returned
 * @param options - Additional tracking metadata
 */
export async function trackSearch(
  query: string,
  resultsCount: number,
  options?: {
    activeCategory?: string;
    dietaryFilters?: { vegetarian?: boolean; vegan?: boolean; glutenFree?: boolean };
    userId?: string;
  }
): Promise<void> {
  // Don't track empty queries
  if (!query.trim()) return;
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('[SearchAnalytics] Cannot track search - Supabase not initialized');
    return;
  }
  
  // Build dietary filters array
  const dietaryFilters: string[] = [];
  if (options?.dietaryFilters?.vegan) dietaryFilters.push('vegan');
  if (options?.dietaryFilters?.vegetarian) dietaryFilters.push('vegetarian');
  if (options?.dietaryFilters?.glutenFree) dietaryFilters.push('gluten_free');
  
  // Get or create session ID
  let sessionId = sessionStorage.getItem('search_session_id');
  if (!sessionId) {
    sessionId = `search_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('search_session_id', sessionId);
  }
  
  const event: SearchEvent = {
    query: query.trim().toLowerCase(),
    results_count: resultsCount,
    had_results: resultsCount > 0,
    active_category: options?.activeCategory,
    dietary_filters: dietaryFilters.length > 0 ? dietaryFilters : undefined,
    timestamp: new Date().toISOString(),
    user_id: options?.userId,
    session_id: sessionId
  };
  
  try {
    // Insert into search_analytics table
    const { error } = await supabase
      .from('search_analytics')
      .insert(event);
    
    if (error) {
      // Table might not exist - log but don't fail
      console.warn('[SearchAnalytics] Failed to track search:', error.message);
    } else {
      console.log(`[SearchAnalytics] Tracked search: "${query}" → ${resultsCount} results`);
    }
  } catch (error) {
    console.error('[SearchAnalytics] Error tracking search:', error);
  }
}

/**
 * Track search conversion (user added item to cart after searching)
 * 
 * @param query - Original search query
 * @param itemId - ID of item added to cart
 * @param itemName - Name of item added
 */
export async function trackSearchConversion(
  query: string,
  itemId: string,
  itemName: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  
  const sessionId = sessionStorage.getItem('search_session_id');
  if (!sessionId) return; // No active search session
  
  try {
    const { error } = await supabase
      .from('search_conversions')
      .insert({
        query: query.trim().toLowerCase(),
        item_id: itemId,
        item_name: itemName,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.warn('[SearchAnalytics] Failed to track conversion:', error.message);
    } else {
      console.log(`[SearchAnalytics] Tracked conversion: "${query}" → ${itemName}`);
    }
  } catch (error) {
    console.error('[SearchAnalytics] Error tracking conversion:', error);
  }
}

/**
 * Get popular search terms (requires backend API)
 * This is a client-side stub - actual implementation would call backend
 */
export async function getPopularSearches(limit: number = 10): Promise<string[]> {
  // TODO: Implement backend endpoint to aggregate search_analytics
  // For now, return empty array
  return [];
}

/**
 * Get zero-result searches (menu gaps)
 * This is a client-side stub - actual implementation would call backend
 */
export async function getZeroResultSearches(limit: number = 10): Promise<string[]> {
  // TODO: Implement backend endpoint to query search_analytics where had_results = false
  // For now, return empty array
  return [];
}
