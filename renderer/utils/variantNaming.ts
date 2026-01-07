/**
 * Variant Name Pattern Generation Utility
 * 
 * Provides functions for generating variant names using different patterns:
 * - SUFFIX: "Base Name - Protein" (default)
 * - PREFIX: "Protein Base Name"
 * - INFIX: "First Word Protein Remaining Words"
 * - CUSTOM: User's manual input (locked from auto-regeneration)
 * 
 * Task: MYA-1444
 */

export type VariantNamePattern = 'suffix' | 'prefix' | 'infix' | 'custom';

export interface GenerateVariantNameOptions {
  baseName: string;
  proteinName: string;
  pattern: VariantNamePattern;
  customName?: string;
}

/**
 * Generate a variant name based on the selected pattern.
 * 
 * @param options - Configuration for name generation
 * @returns Generated variant name
 * 
 * @example
 * // SUFFIX pattern (default)
 * generateVariantName({
 *   baseName: "Spicy Tikka Masala",
 *   proteinName: "Lamb",
 *   pattern: "suffix"
 * })
 * // Returns: "Spicy Tikka Masala - Lamb"
 * 
 * @example
 * // PREFIX pattern
 * generateVariantName({
 *   baseName: "Spicy Tikka Masala",
 *   proteinName: "Lamb",
 *   pattern: "prefix"
 * })
 * // Returns: "Lamb Spicy Tikka Masala"
 * 
 * @example
 * // INFIX pattern (smart insertion)
 * generateVariantName({
 *   baseName: "Spicy Tikka Masala",
 *   proteinName: "Lamb",
 *   pattern: "infix"
 * })
 * // Returns: "Spicy Lamb Tikka Masala"
 * 
 * @example
 * // CUSTOM pattern (manual edit lock)
 * generateVariantName({
 *   baseName: "Spicy Tikka Masala",
 *   proteinName: "Lamb",
 *   pattern: "custom",
 *   customName: "Chef's Special Lamb Masala"
 * })
 * // Returns: "Chef's Special Lamb Masala"
 */
export function generateVariantName(options: GenerateVariantNameOptions): string {
  const { baseName, proteinName, pattern, customName } = options;

  // Validate inputs
  if (!baseName || !proteinName) {
    console.warn('[variantNaming] Missing required fields:', { baseName, proteinName });
    return baseName || proteinName || '';
  }

  // CUSTOM pattern: return user's manual input
  if (pattern === 'custom') {
    if (customName) {
      return customName;
    }
    // Fallback to suffix if no custom name provided
    console.warn('[variantNaming] CUSTOM pattern selected but no customName provided, falling back to SUFFIX');
    return `${baseName} - ${proteinName}`;
  }

  // Clean and normalize names
  const cleanBase = baseName.trim();
  const cleanProtein = proteinName.trim();

  switch (pattern) {
    case 'suffix':
      // "Base Name - Protein"
      return `${cleanBase} - ${cleanProtein}`;

    case 'prefix':
      // "Protein Base Name"
      return `${cleanProtein} ${cleanBase}`;

    case 'infix': {
      // "First Word Protein Remaining Words"
      const words = cleanBase.split(/\s+/).filter(w => w.length > 0);
      
      if (words.length === 0) {
        // Edge case: empty base name after splitting
        return cleanProtein;
      }
      
      if (words.length === 1) {
        // Single word: fallback to prefix pattern
        return `${cleanProtein} ${words[0]}`;
      }
      
      // Insert protein after first word
      const firstWord = words[0];
      const remainingWords = words.slice(1).join(' ');
      return `${firstWord} ${cleanProtein} ${remainingWords}`;
    }

    default:
      // Unknown pattern: fallback to suffix
      console.warn('[variantNaming] Unknown pattern, falling back to SUFFIX:', pattern);
      return `${cleanBase} - ${cleanProtein}`;
  }
}

/**
 * Get the next pattern in the cycle sequence.
 * 
 * Cycle order: suffix → prefix → infix → suffix (loops)
 * Note: CUSTOM is not part of the cycle (user must manually edit to enter CUSTOM mode)
 * 
 * @param currentPattern - The current pattern
 * @returns The next pattern in the cycle
 */
export function getNextPattern(currentPattern: VariantNamePattern): VariantNamePattern {
  const cycleOrder: VariantNamePattern[] = ['suffix', 'prefix', 'infix'];
  
  // If custom, return to start of cycle
  if (currentPattern === 'custom') {
    return 'suffix';
  }
  
  const currentIndex = cycleOrder.indexOf(currentPattern);
  const nextIndex = (currentIndex + 1) % cycleOrder.length;
  
  return cycleOrder[nextIndex];
}

/**
 * Get a human-readable label for a pattern.
 * 
 * @param pattern - The pattern to get a label for
 * @returns Human-readable label
 */
export function getPatternLabel(pattern: VariantNamePattern): string {
  const labels: Record<VariantNamePattern, string> = {
    suffix: 'Suffix',
    prefix: 'Prefix',
    infix: 'Infix',
    custom: 'Custom (Manual)'
  };
  
  return labels[pattern] || 'Unknown';
}

/**
 * Get an icon for a pattern.
 * 
 * @param pattern - The pattern to get an icon for
 * @returns Emoji icon representing the pattern
 */
export function getPatternIcon(pattern: VariantNamePattern): string {
  const icons: Record<VariantNamePattern, string> = {
    suffix: '📌',
    prefix: '📌',
    infix: '📌',
    custom: '🔒'
  };
  
  return icons[pattern] || '📌';
}

/**
 * Detect if a name appears to be manually edited (doesn't match any auto-generated pattern).
 * 
 * This helps determine if we should switch to CUSTOM mode when user types in the name field.
 * 
 * @param name - The current variant name
 * @param baseName - The base menu item name
 * @param proteinName - The protein name
 * @returns true if the name appears to be custom/manually edited
 */
export function isCustomName(name: string, baseName: string, proteinName: string): boolean {
  if (!name || !baseName || !proteinName) {
    return false;
  }

  const cleanName = name.trim();
  const cleanBase = baseName.trim();
  const cleanProtein = proteinName.trim();

  // Generate all possible auto-generated names
  const suffixName = generateVariantName({ baseName: cleanBase, proteinName: cleanProtein, pattern: 'suffix' });
  const prefixName = generateVariantName({ baseName: cleanBase, proteinName: cleanProtein, pattern: 'prefix' });
  const infixName = generateVariantName({ baseName: cleanBase, proteinName: cleanProtein, pattern: 'infix' });

  // If name matches any auto-generated pattern, it's not custom
  if (cleanName === suffixName || cleanName === prefixName || cleanName === infixName) {
    return false;
  }

  // Name doesn't match any pattern → it's custom
  return true;
}
