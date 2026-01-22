/**
 * PHASE 2: Structured Response Architecture - JSON Schema Design
 * 
 * This module defines the comprehensive schema for AI responses that can embed
 * structured visual elements (cards, recommendations, comparisons) inline within
 * streaming text responses.
 */

// ================================
// CORE STRUCTURED RESPONSE SCHEMA
// ================================

/**
 * Base interface for all structured response elements
 */
export interface StructuredElement {
  id: string;
  type: StructuredElementType;
  confidence?: number; // AI confidence score (0-1)
  metadata?: Record<string, any>;
}

/**
 * Supported structured element types
 */
export type StructuredElementType = 
  | 'menu_card'
  | 'recommendation_set' 
  | 'comparison_table'
  | 'order_summary'
  | 'category_showcase'
  | 'promotional_banner'
  | 'dietary_filter_results';

/**
 * Main structured response container
 * Combines streaming text with embedded structured elements
 */
export interface StructuredResponse {
  /** Unique response identifier */
  id: string;
  
  /** Main text content with placeholders for structured elements */
  content: string;
  
  /** Array of structured elements to render inline */
  structuredElements: StructuredElement[];
  
  /** Response metadata */
  metadata: {
    /** AI model used for generation */
    modelUsed: string;
    /** Processing latency in milliseconds */
    latencyMs: number;
    /** Overall confidence score */
    confidence: number;
    /** Menu context version used */
    menuContextVersion?: string;
    /** User context factors considered */
    personalizationFactors?: string[];
  };
}

// ================================
// SPECIFIC STRUCTURED ELEMENTS
// ================================

/**
 * Single menu item card (extends existing system)
 */
export interface MenuCardElement extends StructuredElement {
  type: 'menu_card';
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    dietaryTags?: string[];
    spiceLevel?: number;
    available: boolean;
    variants?: MenuItemVariant[];
  };
  /** Placement hint for inline rendering */
  placeholderText: string; // e.g., "{{MENU_CARD:chicken_tikka_masala}}"
}

/**
 * Set of recommended dishes with reasoning
 */
export interface RecommendationSetElement extends StructuredElement {
  type: 'recommendation_set';
  title: string;
  description?: string;
  recommendations: {
    menuItemId: string;
    reasoning: string;
    matchScore: number; // How well it matches user criteria (0-1)
    tags?: string[]; // e.g., ['spicy', 'popular', 'vegetarian']
  }[];
  placeholderText: string; // e.g., "{{RECOMMENDATIONS:mild_curry_options}}"
}

/**
 * Side-by-side comparison of menu items
 */
export interface ComparisonTableElement extends StructuredElement {
  type: 'comparison_table';
  title: string;
  items: {
    menuItemId: string;
    highlights: string[]; // Key differentiating features
    pros: string[];
    bestFor: string; // e.g., "First-time visitors", "Spice lovers"
  }[];
  comparisonCriteria: string[]; // e.g., ['Spice Level', 'Price', 'Popularity']
  placeholderText: string; // e.g., "{{COMPARISON:curry_options}}"
}

/**
 * Current order summary with totals
 */
export interface OrderSummaryElement extends StructuredElement {
  type: 'order_summary';
  items: {
    menuItemId: string;
    quantity: number;
    variantName?: string;
    notes?: string;
    lineTotal: number;
  }[];
  totals: {
    subtotal: number;
    deliveryFee?: number;
    total: number;
  };
  placeholderText: string; // e.g., "{{ORDER_SUMMARY}}"
}

/**
 * Showcase of items from a specific category
 */
export interface CategoryShowcaseElement extends StructuredElement {
  type: 'category_showcase';
  categoryId: string;
  categoryName: string;
  description?: string;
  featuredItems: string[]; // Array of menu item IDs
  displayStyle: 'grid' | 'carousel' | 'list';
  placeholderText: string; // e.g., "{{CATEGORY:starters}}"
}

/**
 * Promotional content with call-to-action
 */
export interface PromotionalBannerElement extends StructuredElement {
  type: 'promotional_banner';
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaAction?: string; // URL or action identifier
  validUntil?: Date;
  placeholderText: string; // e.g., "{{PROMO:weeknight_special}}"
}

/**
 * Results of dietary filtering with visual indicators
 */
export interface DietaryFilterResultsElement extends StructuredElement {
  type: 'dietary_filter_results';
  filterCriteria: string[]; // e.g., ['vegetarian', 'mild', 'under_15']
  matchingItems: string[]; // Array of menu item IDs
  totalMatches: number;
  suggestedAlternatives?: string[]; // If no exact matches
  placeholderText: string; // e.g., "{{DIETARY_RESULTS:vegetarian_mild}}"
}

// ================================
// MENU ITEM VARIANT SUPPORT
// ================================

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
  proteinType?: string;
  spiceLevel?: number;
  isDefault: boolean;
  available: boolean;
}

// ================================
// PARSING AND RENDERING TYPES
// ================================

/**
 * Parsed message with separated text and structured elements
 */
export interface ParsedStructuredMessage {
  /** Text segments between structured elements */
  textSegments: string[];
  /** Structured elements in order of appearance */
  elements: StructuredElement[];
  /** Original raw content for fallback */
  rawContent: string;
  /** Parsing success flag */
  parseSuccess: boolean;
  /** Any parsing errors encountered */
  parseErrors?: string[];
}

/**
 * Configuration for structured response parsing
 */
export interface ParsingConfig {
  /** Maximum number of structured elements per response */
  maxElements: number;
  /** Whether to show parsing errors to users */
  showParseErrors: boolean;
  /** Fallback behavior when parsing fails */
  fallbackMode: 'text_only' | 'partial_render' | 'retry_parse';
  /** Placeholder pattern for detecting structured elements */
  placeholderPattern: RegExp;
}

// ================================
// AI PROMPT CONTEXT TYPES
// ================================

/**
 * Menu context provided to AI for structured responses
 */
export interface MenuContext {
  /** Available menu items with full details */
  items: MenuContextItem[];
  /** Category information */
  categories: CategoryInfo[];
  /** Current promotions */
  promotions?: PromotionInfo[];
  /** Context version for cache invalidation */
  version: string;
  /** Generation timestamp */
  generatedAt: Date;
}

export interface MenuContextItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  dietaryTags: string[];
  spiceLevel?: number;
  popularity?: number; // Relative popularity score
  available: boolean;
  variants?: MenuItemVariant[];
}

export interface CategoryInfo {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  displayOrder: number;
}

export interface PromotionInfo {
  id: string;
  title: string;
  description: string;
  applicableItems?: string[]; // Menu item IDs
  validUntil?: Date;
}

// ================================
// ERROR HANDLING AND FALLBACKS
// ================================

/**
 * Structured response error types
 */
export type StructuredResponseError = 
  | 'parsing_failed'
  | 'invalid_json'
  | 'missing_menu_items'
  | 'timeout'
  | 'ai_model_error'
  | 'network_error';

/**
 * Error information for structured responses
 */
export interface StructuredResponseErrorInfo {
  type: StructuredResponseError;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Fallback response when structured parsing fails
 */
export interface FallbackResponse {
  content: string;
  showError: boolean;
  errorInfo?: StructuredResponseErrorInfo;
  retryAvailable: boolean;
}

// ================================
// UTILITY TYPES
// ================================

/**
 * Type guard for structured elements
 */
export function isStructuredElement(obj: any): obj is StructuredElement {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.type === 'string' &&
         ['menu_card', 'recommendation_set', 'comparison_table', 'order_summary', 
          'category_showcase', 'promotional_banner', 'dietary_filter_results'].includes(obj.type);
}

/**
 * Type guard for menu card elements
 */
export function isMenuCardElement(element: StructuredElement): element is MenuCardElement {
  return element.type === 'menu_card';
}

/**
 * Type guard for recommendation sets
 */
export function isRecommendationSetElement(element: StructuredElement): element is RecommendationSetElement {
  return element.type === 'recommendation_set';
}

/**
 * Default parsing configuration
 */
export const DEFAULT_PARSING_CONFIG: ParsingConfig = {
  maxElements: 5,
  showParseErrors: false,
  fallbackMode: 'partial_render',
  placeholderPattern: /\{\{([A-Z_]+):([a-zA-Z0-9_]+)\}\}/g
};
