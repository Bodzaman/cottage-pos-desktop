/**
 * PHASE 2: Menu Database Integration Strategy for AI Context
 * 
 * This module designs the real-time menu data pipeline that feeds contextual
 * information to AI models for accurate structured responses.
 */

import {
  MenuContext,
  MenuContextItem,
  CategoryInfo,
  PromotionInfo
} from './structuredResponseTypes';

// ================================
// REAL-TIME MENU CONTEXT MANAGER
// ================================

/**
 * Manages real-time menu data loading and AI context generation
 */
export class MenuContextManager {
  private menuContext: MenuContext | null = null;
  private contextVersion: string = '';
  private lastUpdate: Date = new Date(0);
  private updateInterval: number = 5 * 60 * 1000; // 5 minutes
  private listeners: Set<(context: MenuContext) => void> = new Set();

  constructor(
    private supabaseClient: any,
    private cacheConfig: MenuCacheConfig = DEFAULT_CACHE_CONFIG
  ) {}

  /**
   * Initialize real-time menu context with live updates
   */
  async initialize(): Promise<MenuContext> {
    try {
      // Load initial menu data
      await this.refreshMenuContext();
      
      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      // Set up periodic refresh
      this.setupPeriodicRefresh();
      
      return this.menuContext!;
    } catch (error) {
      console.error('Failed to initialize menu context:', error);
      throw new Error('Menu context initialization failed');
    }
  }

  /**
   * Get current menu context for AI prompts
   */
  getCurrentContext(): MenuContext | null {
    return this.menuContext;
  }

  /**
   * Subscribe to menu context updates
   */
  subscribe(listener: (context: MenuContext) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current context if available
    if (this.menuContext) {
      listener(this.menuContext);
    }
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Force refresh of menu context
   */
  async refreshMenuContext(): Promise<MenuContext> {
    try {
      const [menuItems, categories, promotions] = await Promise.all([
        this.loadMenuItems(),
        this.loadCategories(),
        this.loadPromotions()
      ]);
      
      // Generate new context version
      const newVersion = this.generateContextVersion(menuItems, categories, promotions);
      
      // Create new context
      this.menuContext = {
        items: menuItems,
        categories,
        promotions,
        version: newVersion,
        generatedAt: new Date()
      };
      
      this.contextVersion = newVersion;
      this.lastUpdate = new Date();
      
      // Notify all listeners
      this.notifyListeners();
      
      return this.menuContext;
    } catch (error) {
      console.error('Failed to refresh menu context:', error);
      throw error;
    }
  }

  /**
   * Load menu items with full context information
   */
  private async loadMenuItems(): Promise<MenuContextItem[]> {
    const { data: items, error } = await this.supabaseClient
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        category_id,
        dietary_tags,
        spice_level,
        available,
        popularity_score,
        categories!inner(name),
        menu_item_variants(
          id,
          name,
          price,
          protein_type,
          spice_level,
          is_default,
          available
        )
      `)
      .eq('available', true)
      .order('popularity_score', { ascending: false });
      
    if (error) {
      throw new Error(`Failed to load menu items: ${error.message}`);
    }
    
    return items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.categories.name,
      price: item.price,
      imageUrl: item.image_url,
      dietaryTags: item.dietary_tags || [],
      spiceLevel: item.spice_level,
      popularity: item.popularity_score || 0,
      available: item.available,
      variants: item.menu_item_variants?.map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        proteinType: variant.protein_type,
        spiceLevel: variant.spice_level,
        isDefault: variant.is_default,
        available: variant.available
      })) || []
    }));
  }

  /**
   * Load category information
   */
  private async loadCategories(): Promise<CategoryInfo[]> {
    const { data: categories, error } = await this.supabaseClient
      .from('categories')
      .select(`
        id,
        name,
        description,
        display_order,
        menu_items!inner(id)
      `)
      .order('display_order');
      
    if (error) {
      throw new Error(`Failed to load categories: ${error.message}`);
    }
    
    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      itemCount: category.menu_items?.length || 0,
      displayOrder: category.display_order
    }));
  }

  /**
   * Load current promotions
   */
  private async loadPromotions(): Promise<PromotionInfo[]> {
    const { data: promotions, error } = await this.supabaseClient
      .from('promotions')
      .select('*')
      .eq('active', true)
      .gte('valid_until', new Date().toISOString());
      
    if (error) {
      throw new Error(`Failed to load promotions: ${error.message}`);
    }
    
    return promotions?.map(promo => ({
      id: promo.id,
      title: promo.title,
      description: promo.description,
      applicableItems: promo.applicable_items || [],
      validUntil: promo.valid_until ? new Date(promo.valid_until) : undefined
    })) || [];
  }

  /**
   * Generate context version hash for cache invalidation
   */
  private generateContextVersion(
    items: MenuContextItem[],
    categories: CategoryInfo[],
    promotions: PromotionInfo[]
  ): string {
    const dataString = JSON.stringify({
      items: items.map(i => ({ id: i.id, name: i.name, available: i.available })),
      categories: categories.map(c => ({ id: c.id, itemCount: c.itemCount })),
      promotions: promotions.map(p => ({ id: p.id, validUntil: p.validUntil }))
    });
    
    // Simple hash function for version generation
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `v${Date.now()}_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Set up real-time subscriptions for menu changes
   */
  private setupRealtimeSubscriptions(): void {
    // Subscribe to menu items changes
    this.supabaseClient
      .channel('menu_context_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => this.handleMenuUpdate()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => this.handleMenuUpdate()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'promotions'
        },
        () => this.handleMenuUpdate()
      )
      .subscribe();
  }

  /**
   * Handle real-time menu updates
   */
  private async handleMenuUpdate(): Promise<void> {
    // Debounce updates to avoid excessive refreshes
    clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      this.refreshMenuContext().catch(error => {
        console.error('Failed to handle menu update:', error);
      });
    }, this.cacheConfig.debounceMs);
  }

  /**
   * Set up periodic refresh to ensure data freshness
   */
  private setupPeriodicRefresh(): void {
    setInterval(() => {
      const timeSinceUpdate = Date.now() - this.lastUpdate.getTime();
      if (timeSinceUpdate > this.updateInterval) {
        this.refreshMenuContext().catch(error => {
          console.error('Periodic refresh failed:', error);
        });
      }
    }, this.updateInterval);
  }

  /**
   * Notify all listeners of context updates
   */
  private notifyListeners(): void {
    if (this.menuContext) {
      this.listeners.forEach(listener => {
        try {
          listener(this.menuContext!);
        } catch (error) {
          console.error('Listener notification failed:', error);
        }
      });
    }
  }

  private updateTimeout: NodeJS.Timeout | null = null;
}

// ================================
// ITEM VALIDATION PIPELINE
// ================================

/**
 * Validates menu items for AI recommendations
 */
export class MenuItemValidator {
  constructor(private menuContext: MenuContext) {}

  /**
   * Validate that menu items are available and accurate
   */
  validateItems(itemIds: string[]): ValidationResult {
    const results: ItemValidation[] = [];
    const contextItems = new Map(this.menuContext.items.map(item => [item.id, item]));
    
    for (const itemId of itemIds) {
      const item = contextItems.get(itemId);
      
      if (!item) {
        results.push({
          itemId,
          valid: false,
          issues: ['Item not found in menu'],
          suggested_alternative: this.findSimilarItem(itemId)
        });
        continue;
      }
      
      const issues: string[] = [];
      
      if (!item.available) {
        issues.push('Item currently unavailable');
      }
      
      if (item.variants && item.variants.length > 0) {
        const availableVariants = item.variants.filter(v => v.available);
        if (availableVariants.length === 0) {
          issues.push('No variants currently available');
        }
      }
      
      results.push({
        itemId,
        valid: issues.length === 0,
        issues,
        item_data: item
      });
    }
    
    return {
      overall_valid: results.every(r => r.valid),
      items: results,
      validation_timestamp: new Date()
    };
  }

  /**
   * Find similar items when requested item is not available
   */
  private findSimilarItem(itemId: string): string | undefined {
    // Simple similarity matching - could be enhanced with fuzzy search
    const searchTerm = itemId.toLowerCase().replace(/[_-]/g, ' ');
    
    const similarItem = this.menuContext.items.find(item => 
      item.available && 
      item.name.toLowerCase().includes(searchTerm.split(' ')[0])
    );
    
    return similarItem?.id;
  }
}

// ================================
// FUZZY MATCHING ALGORITHM
// ================================

/**
 * Fuzzy matching for menu item names and descriptions
 */
export class MenuFuzzyMatcher {
  constructor(private menuContext: MenuContext) {}

  /**
   * Find menu items matching a search query
   */
  findMatches(
    query: string,
    options: FuzzyMatchOptions = DEFAULT_FUZZY_OPTIONS
  ): FuzzyMatchResult[] {
    const results: FuzzyMatchResult[] = [];
    
    for (const item of this.menuContext.items) {
      if (!item.available && !options.includeUnavailable) {
        continue;
      }
      
      const nameScore = this.calculateSimilarity(query, item.name);
      const descriptionScore = this.calculateSimilarity(query, item.description);
      const categoryScore = this.calculateSimilarity(query, item.category);
      
      // Weight the scores
      const overallScore = 
        nameScore * 0.6 +
        descriptionScore * 0.3 +
        categoryScore * 0.1;
      
      if (overallScore >= options.minScore) {
        results.push({
          item,
          score: overallScore,
          match_type: this.determineMatchType(nameScore, descriptionScore, categoryScore),
          confidence: this.calculateConfidence(overallScore, item.popularity || 0)
        });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxResults);
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Determine the type of match found
   */
  private determineMatchType(
    nameScore: number,
    descriptionScore: number,
    categoryScore: number
  ): 'exact' | 'name' | 'description' | 'category' | 'partial' {
    if (nameScore > 0.9) return 'exact';
    if (nameScore > 0.7) return 'name';
    if (descriptionScore > 0.7) return 'description';
    if (categoryScore > 0.7) return 'category';
    return 'partial';
  }

  /**
   * Calculate confidence score based on match score and popularity
   */
  private calculateConfidence(matchScore: number, popularity: number): number {
    // Boost confidence for popular items
    const popularityBoost = Math.min(popularity / 100, 0.2); // Max 20% boost
    return Math.min(matchScore + popularityBoost, 1.0);
  }
}

// ================================
// CONFIGURATION INTERFACES
// ================================

interface MenuCacheConfig {
  /** Debounce time for real-time updates */
  debounceMs: number;
  /** Cache TTL in milliseconds */
  cacheTtl: number;
  /** Whether to preload variants */
  preloadVariants: boolean;
}

interface FuzzyMatchOptions {
  /** Minimum similarity score to include in results */
  minScore: number;
  /** Maximum number of results to return */
  maxResults: number;
  /** Whether to include unavailable items */
  includeUnavailable: boolean;
}

interface ValidationResult {
  overall_valid: boolean;
  items: ItemValidation[];
  validation_timestamp: Date;
}

interface ItemValidation {
  itemId: string;
  valid: boolean;
  issues: string[];
  suggested_alternative?: string;
  item_data?: MenuContextItem;
}

interface FuzzyMatchResult {
  item: MenuContextItem;
  score: number;
  match_type: 'exact' | 'name' | 'description' | 'category' | 'partial';
  confidence: number;
}

// ================================
// DEFAULT CONFIGURATIONS
// ================================

const DEFAULT_CACHE_CONFIG: MenuCacheConfig = {
  debounceMs: 1000,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
  preloadVariants: true
};

const DEFAULT_FUZZY_OPTIONS: FuzzyMatchOptions = {
  minScore: 0.3,
  maxResults: 10,
  includeUnavailable: false
};

export default {
  MenuContextManager,
  MenuItemValidator,
  MenuFuzzyMatcher,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_FUZZY_OPTIONS
};
