import { MenuItem } from './menuTypes';
import { useRealtimeMenuStore } from './realtimeMenuStore';

/**
 * Lightweight dish mention detection for chat messages
 * Provides fast, case-insensitive detection of menu items mentioned in text
 */

export interface DishMention {
  item: MenuItem;
  matchedText: string;
  startIndex: number;
  endIndex: number;
}

export interface DishMentionIndex {
  normalized: Map<string, MenuItem>;
  aliases: Map<string, MenuItem>;
  words: Set<string>;
}

/**
 * Create a normalized search index from menu items
 * Builds lookup maps for fast O(1) detection
 */
export function createDishMentionIndex(menuItems: MenuItem[]): DishMentionIndex {
  const normalized = new Map<string, MenuItem>();
  const aliases = new Map<string, MenuItem>();
  const words = new Set<string>();
  
  menuItems.forEach(item => {
    if (!item.active || !item.name) return;
    
    // Normalize main name
    const normalizedName = normalizeText(item.name);
    normalized.set(normalizedName, item);
    
    // Add individual words for partial matching
    normalizedName.split(' ').forEach(word => {
      if (word.length >= 3) { // Only index words 3+ chars
        words.add(word);
      }
    });
    
    // Add common aliases based on dish name patterns
    const aliasesForItem = generateAliases(item.name);
    aliasesForItem.forEach(alias => {
      aliases.set(alias, item);
    });
  });
  
  return { normalized, aliases, words };
}

/**
 * Normalize text for consistent matching
 * Removes punctuation, extra spaces, converts to lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Generate common aliases for a dish name
 * Handles common variations and abbreviations
 */
function generateAliases(dishName: string): string[] {
  const aliases: string[] = [];
  const normalized = normalizeText(dishName);
  
  // Common Indian food aliases
  const aliasMap: Record<string, string[]> = {
    'chicken tikka masala': ['ctm', 'chicken tikka', 'tikka masala'],
    'butter chicken': ['murgh makhani', 'makhani'],
    'chicken korma': ['korma'],
    'lamb biryani': ['biryani', 'lamb biryani'],
    'chicken biryani': ['biryani', 'chicken biryani'],
    'vegetable biryani': ['veg biryani', 'vegetable biryani'],
    'garlic naan': ['naan', 'garlic bread'],
    'pilau rice': ['pilau', 'pilaf rice'],
    'basmati rice': ['basmati', 'rice'],
    'onion bhaji': ['bhaji', 'onion bhajis'],
    'poppadom': ['poppadoms', 'papad', 'papadum'],
    'samosa': ['samosas'],
    'tandoori chicken': ['tandoori'],
    'seekh kebab': ['seekh', 'kebab'],
    'chicken madras': ['madras'],
    'chicken vindaloo': ['vindaloo'],
    'chicken jalfrezi': ['jalfrezi'],
    'chicken dhansak': ['dhansak'],
    'lamb rogan josh': ['rogan josh'],
    'saag paneer': ['palak paneer', 'spinach paneer'],
    'dal tarka': ['dal', 'lentils'],
    'mango lassi': ['lassi', 'mango drink'],
    'gulab jamun': ['gulab jamun', 'indian dessert']
  };
  
  // Check if current dish matches any alias patterns
  Object.entries(aliasMap).forEach(([key, values]) => {
    if (normalized.includes(key) || key.includes(normalized)) {
      aliases.push(...values.map(alias => normalizeText(alias)));
    }
  });
  
  // Add partial name matches (first/last words)
  const words = normalized.split(' ');
  if (words.length > 1) {
    // Add combinations of first and last words
    aliases.push(words[0]); // First word
    aliases.push(words[words.length - 1]); // Last word
    
    // Add combinations without common words
    const filteredWords = words.filter(word => 
      !['with', 'and', 'or', 'in', 'on', 'the', 'a', 'an'].includes(word)
    );
    if (filteredWords.length > 1) {
      aliases.push(filteredWords.join(' '));
    }
  }
  
  return [...new Set(aliases)]; // Remove duplicates
}

/**
 * Detect dish mentions in a text message
 * Returns up to maxMatches items, avoiding duplicates
 */
export function detectDishMentions(
  message: string,
  index: DishMentionIndex,
  maxMatches: number = 3
): DishMention[] {
  if (!message?.trim()) return [];
  
  const mentions: DishMention[] = [];
  const seenItems = new Set<string>();
  const normalizedMessage = normalizeText(message);
  
  // First pass: exact name matches (highest priority)
  index.normalized.forEach((item, normalizedName) => {
    const startIndex = normalizedMessage.indexOf(normalizedName);
    if (startIndex !== -1 && !seenItems.has(item.id)) {
      mentions.push({
        item,
        matchedText: normalizedName,
        startIndex,
        endIndex: startIndex + normalizedName.length
      });
      seenItems.add(item.id);
    }
  });
  
  // Second pass: alias matches (if we haven't hit maxMatches)
  if (mentions.length < maxMatches) {
    index.aliases.forEach((item, alias) => {
      const startIndex = normalizedMessage.indexOf(alias);
      if (startIndex !== -1 && !seenItems.has(item.id)) {
        mentions.push({
          item,
          matchedText: alias,
          startIndex,
          endIndex: startIndex + alias.length
        });
        seenItems.add(item.id);
      }
    });
  }
  
  // Sort by position in text and limit results
  return mentions
    .sort((a, b) => a.startIndex - b.startIndex)
    .slice(0, maxMatches);
}

/**
 * Performance-optimized detection for real-time use
 * Uses word-based detection for faster scanning
 */
export function detectDishMentionsFast(
  message: string,
  menuItems: MenuItem[],
  maxMatches: number = 3
): MenuItem[] {
  console.log('🔍 detectDishMentionsFast called with:', {
    message: message?.substring(0, 50) + '...',
    menuItemsCount: menuItems?.length || 0,
    maxMatches,
    sampleItems: menuItems?.slice(0, 3).map(item => ({ id: item.id, name: item.name, active: item.active })) || []
  });
  
  if (!message?.trim()) {
    console.log('❌ Empty message, returning []');
    return [];
  }
  
  // ✨ CRITICAL FIX: Handle menu store timing gracefully
  if (!menuItems || menuItems.length === 0) {
    // Try to get fresh menu items from store using getState()
    const freshMenuItems = useRealtimeMenuStore.getState().menuItems;
    if (freshMenuItems && freshMenuItems.length > 0) {
      console.log('✅ Retrieved fresh menu items from store:', freshMenuItems.length);
      menuItems = freshMenuItems;
    } else {
      console.log('❌ No menu items provided, returning []');
      return [];
    }
  }
  
  const normalizedMessage = normalizeText(message);
  console.log('🔍 Normalized message:', normalizedMessage);
  
  const words = normalizedMessage.split(' ');
  const matches: MenuItem[] = [];
  const seenIds = new Set<string>();
  
  // Quick word-based detection
  menuItems.forEach(item => {
    if (!item.active || seenIds.has(item.id) || matches.length >= maxMatches) return;
    
    const itemWords = normalizeText(item.name).split(' ');
    
    // Check if all item words appear in message
    const allWordsPresent = itemWords.every(itemWord => 
      words.some(messageWord => 
        messageWord.includes(itemWord) || itemWord.includes(messageWord)
      )
    );
    
    if (allWordsPresent) {
      console.log('✅ Found dish match:', item.name);
      matches.push(item);
      seenIds.add(item.id);
    }
  });
  
  console.log('🎯 Final matches:', matches.map(m => m.name));
  return matches;
}

/**
 * Utility to get price for display based on current context
 * Handles variants and different pricing modes
 */
export function getDishDisplayPrice(item: MenuItem): number {
  // For now, use base price - can be enhanced later for variants
  return item.price || 0;
}

/**
 * Check if a menu item is available for ordering
 */
export function isDishAvailable(item: MenuItem): boolean {
  return item.active;
}
