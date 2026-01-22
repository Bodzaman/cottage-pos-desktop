
/**
 * Utility functions for converting spice levels to display format
 * Supports both old and new spice level systems for backward compatibility
 */

/**
 * Get emoji representation for a specific spice level
 * @param level - Numeric spice level (0-6)
 * @returns Emoji string for display
 */
export function getSpiceLevelEmoji(level: number): string {
  const emojiMap: { [key: number]: string } = {
    0: '',
    1: '🧈',
    2: '🟠',
    3: '🌶️',
    4: '🌶️🌶️',
    5: '🌶️🌶️🌶️',
    6: '🌶️🌶️🌶️🌶️'
  };
  
  return emojiMap[level] || '';
}

/**
 * Convert numeric spice level to full label with curry strength
 * @param level - Numeric spice level (0-6)
 * @returns Full label string
 */
export function getSpiceLevelLabel(level: number): string {
  if (level < 0 || level > 6) {
    return 'None'; // Invalid level
  }
  return SPICE_LEVEL_MAPPING[level as keyof typeof SPICE_LEVEL_MAPPING]?.label || 'None';
}

/**
 * Convert spice indicators string or numeric level to emoji display
 * Handles backward compatibility with existing data formats
 * @param spiceIndicators - Can be string (old format) or number
 * @returns Emoji string for display
 */
export function convertSpiceIndicatorsToEmoji(spiceIndicators: string | number | null | undefined): string {
  if (spiceIndicators === null || spiceIndicators === undefined) {
    return '';
  }
  
  // If it's already a string with emojis, return as is
  if (typeof spiceIndicators === 'string') {
    // Check if it's numeric string
    const numericValue = parseInt(spiceIndicators);
    if (!isNaN(numericValue)) {
      return getSpiceLevelEmoji(numericValue);
    }
    // If it's already emoji format, return as is
    return spiceIndicators;
  }
  
  // If it's a number, convert using new mapping
  if (typeof spiceIndicators === 'number') {
    return getSpiceLevelEmoji(spiceIndicators);
  }
  
  return '';
}

/**
 * Get spice level display text for UI components
 * @param level - Numeric spice level or spice indicators
 * @returns Object with emoji and label for display
 */
export function getSpiceLevelDisplay(level: number | string | null | undefined): { emoji: string; label: string } {
  if (level === null || level === undefined) {
    return { emoji: '', label: 'None' };
  }
  
  let numericLevel: number;
  
  if (typeof level === 'string') {
    numericLevel = parseInt(level);
    if (isNaN(numericLevel)) {
      return { emoji: '', label: 'None' };
    }
  } else {
    numericLevel = level;
  }
  
  return {
    emoji: getSpiceLevelEmoji(numericLevel),
    label: getSpiceLevelLabel(numericLevel)
  };
}
