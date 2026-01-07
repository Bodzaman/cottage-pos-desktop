/**
 * Smart Abbreviation System for Kitchen Display Names
 * Frontend utility for generating kitchen display names from full menu item names
 */

// Default abbreviation dictionary - matches the backend dictionary
const DEFAULT_ABBREVIATION_DICTIONARY: Record<string, string> = {
  // Proteins
  "chicken": "Chi",
  "lamb": "Lb",
  "prawn": "Pr",
  "king prawn": "K Pr",
  "prawns": "Pr",
  "king prawns": "K Pr",
  "beef": "Bf",
  "mutton": "Mut",
  "fish": "Fi",
  "salmon": "Sal",
  "duck": "Dk",
  "goat": "Gt",
  "vegetable": "Veg",
  "vegetables": "Veg",
  "paneer": "Pan",
  "tofu": "Tof",
  
  // Cooking styles
  "tikka": "Tk",
  "tandoori": "Tan",
  "masala": "Mas",
  "mossala": "Moss",
  "curry": "Cur",
  "biryani": "Bir",
  "korma": "Kor",
  "vindaloo": "Vin",
  "jalfrezi": "Jal",
  "bhuna": "Bhu",
  "balti": "Bal",
  "dansak": "Dan",
  "pathia": "Pat",
  "madras": "Mad",
  "rogan": "Rog",
  "josh": "Jos",
  
  // Flavors and ingredients
  "garlic": "G",
  "ginger": "Gin",
  "onion": "On",
  "tomato": "Tom",
  "spinach": "Sp",
  "coconut": "Coc",
  "mango": "Man",
  "butter": "But",
  "cream": "Cr",
  "yogurt": "Yog",
  "mint": "Mt",
  "coriander": "Cor",
  "cumin": "Cum",
  "cardamom": "Car",
  
  // Special terms (no abbreviation - too important for clarity)
  "chilli": "Chilli",
  "mild": "Mild",
  "hot": "Hot",
  "extra": "Extra",
  "special": "Special",
  
  // Preparation terms
  "grilled": "Gr",
  "fried": "Fr",
  "roasted": "Rst",
  "steamed": "Stm",
  "baked": "Bkd",
  "stuffed": "Stf",
  
  // Bread and rice
  "naan": "Nan",
  "rice": "R",
  "pilau": "Pil",
  "basmati": "Bas",
  
  // Drinks abbreviations
  "large": "L",
  "small": "S",
  "medium": "M",
  "bottle": "Btl",
  "glass": "Gl",
  "pint": "Pt"
};

/**
 * Generate kitchen display name from full item name using abbreviation dictionary
 * @param itemName - Full menu item name
 * @param customDictionary - Optional custom abbreviations to override defaults
 * @returns Abbreviated kitchen display name
 */
export function generateKitchenDisplayName(
  itemName: string, 
  customDictionary: Record<string, string> = {}
): string {
  if (!itemName || typeof itemName !== 'string') {
    return '';
  }

  // Merge default dictionary with custom overrides
  const dictionary = { ...DEFAULT_ABBREVIATION_DICTIONARY, ...customDictionary };
  
  // Clean and prepare the item name
  const cleanName = itemName.trim();
  
  // Split into words for processing
  const words = cleanName.toLowerCase().split(/\s+/);
  
  // Process each word and apply abbreviations
  const abbreviatedWords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check for multi-word phrases first (like "king prawn")
    if (i < words.length - 1) {
      const twoWordPhrase = `${word} ${words[i + 1]}`;
      if (dictionary[twoWordPhrase]) {
        abbreviatedWords.push(dictionary[twoWordPhrase]);
        i++; // Skip next word as it's part of this phrase
        continue;
      }
    }
    
    // Check for single word abbreviation
    if (dictionary[word]) {
      abbreviatedWords.push(dictionary[word]);
    } else {
      // Keep original word if no abbreviation found
      // Capitalize first letter for better readability
      abbreviatedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
  }
  
  return abbreviatedWords.join(' ');
}

/**
 * Check if a kitchen display name would benefit from abbreviation
 * Based on character length and thermal printer constraints
 * @param itemName - Full item name
 * @param maxLength - Maximum characters for single line (default: 32 for 80mm thermal)
 * @returns Object with analysis and suggestion
 */
export function analyzeKitchenDisplayNeed(
  itemName: string, 
  maxLength: number = 32
): {
  needsAbbreviation: boolean;
  originalLength: number;
  suggestedName: string;
  suggestedLength: number;
  savings: number;
} {
  const originalLength = itemName.length;
  const suggestedName = generateKitchenDisplayName(itemName);
  const suggestedLength = suggestedName.length;
  const savings = originalLength - suggestedLength;
  
  return {
    needsAbbreviation: originalLength > maxLength,
    originalLength,
    suggestedName,
    suggestedLength,
    savings
  };
}

/**
 * Get the default abbreviation dictionary
 * @returns Copy of the default dictionary
 */
export function getDefaultAbbreviationDictionary(): Record<string, string> {
  return { ...DEFAULT_ABBREVIATION_DICTIONARY };
}

/**
 * Validate and clean custom abbreviation dictionary
 * @param customDict - Custom dictionary to validate
 * @returns Cleaned dictionary with invalid entries removed
 */
export function validateAbbreviationDictionary(
  customDict: Record<string, string>
): Record<string, string> {
  const cleaned: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(customDict)) {
    // Ensure both key and value are non-empty strings
    if (typeof key === 'string' && typeof value === 'string' && 
        key.trim().length > 0 && value.trim().length > 0) {
      cleaned[key.toLowerCase().trim()] = value.trim();
    }
  }
  
  return cleaned;
}

/**
 * Create preview of how different names would be abbreviated
 * Useful for admin interface to show before/after
 * @param itemNames - Array of item names to preview
 * @param customDictionary - Optional custom abbreviations
 * @returns Array of preview objects
 */
export function createAbbreviationPreview(
  itemNames: string[],
  customDictionary: Record<string, string> = {}
): Array<{
  original: string;
  abbreviated: string;
  savings: number;
  needsAbbreviation: boolean;
}> {
  return itemNames.map(name => {
    const analysis = analyzeKitchenDisplayNeed(name);
    const customAbbreviated = generateKitchenDisplayName(name, customDictionary);
    
    return {
      original: name,
      abbreviated: customAbbreviated,
      savings: name.length - customAbbreviated.length,
      needsAbbreviation: analysis.needsAbbreviation
    };
  });
}

export default {
  generateKitchenDisplayName,
  analyzeKitchenDisplayNeed,
  getDefaultAbbreviationDictionary,
  validateAbbreviationDictionary,
  createAbbreviationPreview
};
