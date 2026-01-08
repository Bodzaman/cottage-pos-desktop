/**
 * Menu Search Utility
 * 
 * Provides fuzzy search functionality for menu items with support for:
 * - Name, description, category matching
 * - Dietary preference filtering (vegan, vegetarian, gluten-free)
 * - Typo tolerance using Levenshtein distance
 * - Highlighting matched text
 */

import { MenuItem } from 'utils/menuTypes';
import { Category } from 'utils/menuTypes';

/**
 * Search result with match metadata
 */
export interface SearchResult extends MenuItem {
  matchScore: number; // 0-100, higher is better
  matchedFields: string[]; // Which fields matched (name, description, category)
  highlightedName?: string; // Name with <mark> tags for highlighting
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  categories?: Category[];
  activeCategory?: string;
  dietaryFilters?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
  };
  minScore?: number; // Minimum match score (default: 30)
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to handle typos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate match score between query and text (0-100)
 * Higher score = better match
 */
function calculateMatchScore(query: string, text: string): number {
  if (!text) return 0;
  
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();
  
  // Exact match = 100
  if (textLower === queryLower) return 100;
  
  // Starts with query = 90
  if (textLower.startsWith(queryLower)) return 90;
  
  // Contains query = 80
  if (textLower.includes(queryLower)) return 80;
  
  // Word boundary match = 75
  const words = textLower.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(queryLower)) return 75;
    if (word === queryLower) return 85;
  }
  
  // Fuzzy match using Levenshtein distance
  const distance = levenshteinDistance(queryLower, textLower.substring(0, queryLower.length + 3));
  const maxLength = Math.max(queryLower.length, textLower.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  // Only return fuzzy matches above 60% similarity
  return similarity > 60 ? similarity * 0.6 : 0; // Scale down fuzzy matches
}

/**
 * Highlight matching text in a string
 */
function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);
  
  if (index === -1) return text;
  
  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);
  
  return `${before}<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-inherit">${match}</mark>${after}`;
}

/**
 * Check if item matches dietary filters
 */
function matchesDietaryFilters(
  item: MenuItem,
  filters?: { vegetarian?: boolean; vegan?: boolean; glutenFree?: boolean }
): boolean {
  if (!filters) return true;
  
  if (filters.vegetarian && !item.vegetarian) return false;
  if (filters.vegan && !item.vegan) return false;
  if (filters.glutenFree && !item.gluten_free) return false;
  
  return true;
}

/**
 * Get category name by ID
 */
function getCategoryName(categoryId: string | undefined, categories: Category[]): string {
  if (!categoryId) return '';
  const category = categories.find(c => c.id === categoryId);
  return category?.name || '';
}

/**
 * Search menu items with fuzzy matching
 * 
 * @param items - Menu items to search
 * @param options - Search options including query, filters, etc.
 * @returns Sorted array of matching items with scores
 */
export function searchMenuItems(
  items: MenuItem[],
  options: SearchOptions
): SearchResult[] {
  const { query, categories = [], activeCategory, dietaryFilters, minScore = 30 } = options;
  
  // Empty query = return all items (filtered by category and dietary)
  if (!query.trim()) {
    return items
      .filter(item => {
        // Filter by active category
        if (activeCategory && activeCategory !== 'all' && item.category_id !== activeCategory) {
          return false;
        }
        // Filter by dietary preferences
        return matchesDietaryFilters(item, dietaryFilters);
      })
      .map(item => ({
        ...item,
        matchScore: 100,
        matchedFields: []
      }));
  }
  
  const results: SearchResult[] = [];
  
  for (const item of items) {
    // Filter by dietary preferences first
    if (!matchesDietaryFilters(item, dietaryFilters)) {
      continue;
    }
    
    const matchedFields: string[] = [];
    let maxScore = 0;
    
    // Search in name (highest priority)
    const nameScore = calculateMatchScore(query, item.name);
    if (nameScore > 0) {
      matchedFields.push('name');
      maxScore = Math.max(maxScore, nameScore * 1.0); // Full weight
    }
    
    // Search in description
    if (item.description) {
      const descScore = calculateMatchScore(query, item.description);
      if (descScore > 0) {
        matchedFields.push('description');
        maxScore = Math.max(maxScore, descScore * 0.8); // 80% weight
      }
    }
    
    // Search in category name
    const categoryName = getCategoryName(item.category_id, categories);
    if (categoryName) {
      const catScore = calculateMatchScore(query, categoryName);
      if (catScore > 0) {
        matchedFields.push('category');
        maxScore = Math.max(maxScore, catScore * 0.6); // 60% weight
      }
    }
    
    // Check dietary keywords in query
    const queryLower = query.toLowerCase();
    if (queryLower.includes('vegan') && item.vegan) {
      matchedFields.push('dietary');
      maxScore = Math.max(maxScore, 70);
    }
    if (queryLower.includes('vegetarian') && item.vegetarian) {
      matchedFields.push('dietary');
      maxScore = Math.max(maxScore, 70);
    }
    if ((queryLower.includes('gluten') || queryLower.includes('gf')) && item.gluten_free) {
      matchedFields.push('dietary');
      maxScore = Math.max(maxScore, 70);
    }
    
    // Only include if score meets minimum threshold
    if (maxScore >= minScore) {
      results.push({
        ...item,
        matchScore: maxScore,
        matchedFields,
        highlightedName: highlightMatch(item.name, query)
      });
    }
  }
  
  // Sort by match score (highest first)
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get search suggestions based on query
 * Returns common search terms that might help the user
 */
export function getSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Common dish types
  const dishTypes = [
    'chicken', 'lamb', 'prawns', 'fish', 'vegetable',
    'tikka', 'curry', 'biryani', 'korma', 'vindaloo', 'madras',
    'naan', 'rice', 'samosa', 'pakora'
  ];
  
  // Dietary preferences
  const dietary = ['vegan', 'vegetarian', 'gluten-free'];
  
  // Spice levels
  const spice = ['mild', 'medium', 'hot', 'spicy'];
  
  // Add relevant suggestions based on partial match
  for (const term of [...dishTypes, ...dietary, ...spice]) {
    if (term.includes(queryLower) && term !== queryLower) {
      suggestions.push(term);
    }
  }
  
  return suggestions.slice(0, 5); // Return max 5 suggestions
}
