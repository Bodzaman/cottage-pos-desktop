/**
 * AI Context Management Utilities
 * 
 * Provides efficient context loading, validation, and management
 * for AI chatbot integration with menu data.
 */

import brain from 'brain';
import { MenuItem, Category, ItemVariant } from './menuTypes';

// AI Context Types
export interface AIMenuContext {
  categories: AICategory[];
  menu_items: AIMenuItem[];
  total_items: number;
  last_updated: string;
  context_size: number;
  metadata: Record<string, any>;
}

export interface AICategory {
  id: string;
  name: string;
  description: string | null;
  item_count: number;
  featured_items: string[];
}

export interface AIMenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_range: string;
  variants: any[];
  dietary_tags: string[];
  spice_level: string | null;
  featured: boolean;
  active: boolean;
  aliases: string[];
  confidence_keywords: string[];
}

export interface MenuValidationResult {
  item_found: boolean;
  confidence_score: number;
  matched_item: AIMenuItem | null;
  suggestions: AIMenuItem[];
  reason: string;
}

export interface ContextCacheEntry {
  data: AIMenuContext;
  timestamp: number;
  expires: number;
}

// Context cache (5 minute expiry)
const CONTEXT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let contextCache: ContextCacheEntry | null = null;

class AIContextManager {
  private static instance: AIContextManager;
  private lastFetchTime = 0;
  private refreshPromise: Promise<AIMenuContext> | null = null;

  static getInstance(): AIContextManager {
    if (!this.instance) {
      this.instance = new AIContextManager();
    }
    return this.instance;
  }

  /**
   * Get full menu context with caching and token management
   */
  async getMenuContext(
    options: {
      includeInactive?: boolean;
      categoryFilter?: string;
      compactMode?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<AIMenuContext> {
    const cacheKey = JSON.stringify(options);
    const now = Date.now();

    // Check cache validity
    if (!options.forceRefresh && contextCache && contextCache.expires > now) {
      console.log('🎯 Using cached AI menu context');
      return contextCache.data;
    }

    // Prevent multiple simultaneous fetches
    if (this.refreshPromise) {
      console.log('⏳ Waiting for existing context fetch...');
      return this.refreshPromise;
    }

    console.log('🔄 Fetching fresh AI menu context...');
    this.refreshPromise = this.fetchFreshContext(options);
    
    try {
      const context = await this.refreshPromise;
      
      // Update cache
      contextCache = {
        data: context,
        timestamp: now,
        expires: now + CONTEXT_CACHE_DURATION
      };
      
      this.lastFetchTime = now;
      return context;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Get lightweight context summary for efficient AI prompts
   */
  async getContextSummary(): Promise<any> {
    try {
      const response = await brain.getContextSummary();
      return await response.json();
    } catch (error) {
      console.error('Failed to get context summary:', error);
      throw new Error('Failed to load menu summary');
    }
  }

  /**
   * Validate menu item with fuzzy matching
   */
  async validateMenuItem(
    query: string,
    categoryFilter?: string,
    maxSuggestions: number = 3
  ): Promise<MenuValidationResult> {
    try {
      const response = await brain.validateMenuItem({
        item_query: query,
        category_filter: categoryFilter,
        max_suggestions: maxSuggestions
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to validate menu item:', error);
      throw new Error('Failed to validate menu item');
    }
  }

  /**
   * Get category-specific context for targeted AI responses
   */
  async getCategoryContext(categoryName: string): Promise<{
    category: AICategory;
    items: AIMenuItem[];
    context_size: number;
  }> {
    const fullContext = await this.getMenuContext({ categoryFilter: categoryName });
    
    const category = fullContext.categories.find(cat => 
      cat.name.toLowerCase().includes(categoryName.toLowerCase())
    );
    
    const items = fullContext.menu_items.filter(item => 
      item.category.toLowerCase().includes(categoryName.toLowerCase())
    );

    return {
      category: category || {
        id: 'unknown',
        name: categoryName,
        description: null,
        item_count: items.length,
        featured_items: []
      },
      items,
      context_size: JSON.stringify({ category, items }).length
    };
  }

  /**
   * Get optimized context for AI prompts (token-efficient)
   */
  async getOptimizedContext(maxTokens: number = 2000): Promise<{
    categories: string[];
    featured_items: string[];
    popular_items: string[];
    dietary_options: string[];
    price_ranges: Record<string, string>;
    context_summary: string;
  }> {
    const context = await this.getMenuContext({ compactMode: true });
    
    // Extract key information efficiently
    const categories = context.categories.map(cat => cat.name);
    const featuredItems = context.menu_items
      .filter(item => item.featured)
      .map(item => `${item.name} (${item.price_range})`);
    
    const popularItems = context.menu_items
      .filter(item => item.confidence_keywords.length > 5)
      .slice(0, 10)
      .map(item => `${item.name} (${item.price_range})`);
    
    const dietaryTags = [...new Set(
      context.menu_items.flatMap(item => item.dietary_tags)
    )];
    
    const priceRanges = categories.reduce((acc, cat) => {
      const categoryItems = context.menu_items.filter(item => item.category === cat);
      const prices = categoryItems.map(item => item.price_range).filter(p => p !== 'Price on request');
      if (prices.length > 0) {
        acc[cat] = `${prices[0]} - ${prices[prices.length - 1]}`;
      }
      return acc;
    }, {} as Record<string, string>);

    const contextSummary = `Menu: ${categories.length} categories, ${context.total_items} items. Featured: ${featuredItems.slice(0, 5).join(', ')}. Dietary options: ${dietaryTags.join(', ')}.`;

    return {
      categories,
      featured_items: featuredItems,
      popular_items: popularItems,
      dietary_options: dietaryTags,
      price_ranges: priceRanges,
      context_summary: contextSummary
    };
  }

  /**
   * Invalidate cache (call when menu updates)
   */
  invalidateCache(): void {
    contextCache = null;
    console.log('🗑️ AI context cache invalidated');
  }

  /**
   * Check if context is stale and needs refresh
   */
  isContextStale(): boolean {
    if (!contextCache) return true;
    return Date.now() > contextCache.expires;
  }

  private async fetchFreshContext(options: any): Promise<AIMenuContext> {
    try {
      const response = await brain.getFullMenuContext({
        include_inactive: options.includeInactive || false,
        category_filter: options.categoryFilter,
        compact_mode: options.compactMode || false
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch menu context');
      }
      
      return {
        categories: data.categories,
        menu_items: data.menu_items,
        total_items: data.total_items,
        last_updated: data.last_updated,
        context_size: data.context_size,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Failed to fetch AI menu context:', error);
      throw new Error('Failed to load menu context for AI');
    }
  }
}

// Export singleton instance
export const aiContextManager = AIContextManager.getInstance();

// Utility functions for quick access
export async function getMenuContextForAI(options?: any): Promise<AIMenuContext> {
  return aiContextManager.getMenuContext(options);
}

export async function validateMenuItemForAI(query: string, categoryFilter?: string): Promise<MenuValidationResult> {
  return aiContextManager.validateMenuItem(query, categoryFilter);
}

export async function getOptimizedMenuContext(maxTokens?: number): Promise<any> {
  return aiContextManager.getOptimizedContext(maxTokens);
}

export async function getCategoryContextForAI(categoryName: string): Promise<any> {
  return aiContextManager.getCategoryContext(categoryName);
}

export function invalidateMenuContext(): void {
  aiContextManager.invalidateCache();
}

// Event listener for menu updates (to invalidate cache)
if (typeof window !== 'undefined') {
  window.addEventListener('menuUpdated', () => {
    aiContextManager.invalidateCache();
  });
}
