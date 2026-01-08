/**
 * Menu Category Template System
 * Provides predefined category structures while maintaining flexibility
 */

export interface CategoryTemplate {
  id: string;
  name: string;
  displayOrder: number;
  printOrder: number;
  description: string;
  isRequired?: boolean;
  suggestedParents?: string[];
  printToKitchen: boolean;
  codePrefix?: string;
}

export interface TemplateSet {
  id: string;
  name: string;
  description: string;
  categories: CategoryTemplate[];
}

/**
 * Core restaurant menu template - covers most restaurants
 */
export const CORE_RESTAURANT_TEMPLATE: TemplateSet = {
  id: "core-restaurant",
  name: "Core Restaurant Template",
  description: "Standard restaurant categories covering appetizers through desserts",
  categories: [
    {
      id: "template-starters",
      name: "STARTERS", 
      displayOrder: 0,
      printOrder: 0,
      description: "Appetizers, small plates, and starter dishes",
      isRequired: true,
      printToKitchen: true,
      codePrefix: "APP"
    },
    {
      id: "template-mains",
      name: "MAIN COURSE",
      displayOrder: 1, 
      printOrder: 1,
      description: "Primary dishes and entrees",
      isRequired: true,
      printToKitchen: true,
      codePrefix: "MAIN"
    },
    {
      id: "template-sides",
      name: "SIDE DISHES",
      displayOrder: 2,
      printOrder: 2, 
      description: "Rice, vegetables, and complementary dishes",
      printToKitchen: true,
      codePrefix: "SIDE"
    },
    {
      id: "template-accompaniments",
      name: "ACCOMPANIMENTS",
      displayOrder: 3,
      printOrder: 3,
      description: "Breads, sauces, and additional items", 
      printToKitchen: true,
      codePrefix: "ACC"
    },
    {
      id: "template-desserts",
      name: "DESSERTS & COFFEE",
      displayOrder: 4,
      printOrder: 4,
      description: "Coffee, tea, sweet dishes and desserts",
      printToKitchen: true,
      codePrefix: "DES"
    },
    {
      id: "template-drinks",
      name: "DRINKS & WINE",
      displayOrder: 5,
      printOrder: 5,
      description: "Beverages, wines, and drinks",
      printToKitchen: false,
      codePrefix: "DRK"
    },
    {
      id: "template-setmeals",
      name: "SET MEALS",
      displayOrder: 6,
      printOrder: 6,
      description: "Complete meal sets and special combinations",
      printToKitchen: true,
      codePrefix: "SET"
    }
  ]
};

/**
 * Indian restaurant specific template
 */
export const INDIAN_RESTAURANT_TEMPLATE: TemplateSet = {
  id: "indian-restaurant",
  name: "Indian Restaurant Template", 
  description: "Traditional Indian restaurant category structure",
  categories: [
    {
      id: "template-appetizers",
      name: "APPETIZERS",
      displayOrder: 0,
      printOrder: 0,
      description: "Starters, samosas, and small plates",
      isRequired: true,
      printToKitchen: true,
      codePrefix: "APP"
    },
    {
      id: "template-tandoori",
      name: "TANDOORI SPECIALTIES",
      displayOrder: 1,
      printOrder: 1, 
      description: "Grilled items from the tandoor oven",
      printToKitchen: true,
      codePrefix: "TAN"
    },
    {
      id: "template-curries",
      name: "CURRY DISHES",
      displayOrder: 2,
      printOrder: 2,
      description: "Traditional curry and masala dishes",
      isRequired: true,
      printToKitchen: true,
      codePrefix: "CUR"
    },
    {
      id: "template-biryani",
      name: "BIRYANI & RICE",
      displayOrder: 3,
      printOrder: 3,
      description: "Rice dishes, biryani, and pulao",
      printToKitchen: true,
      codePrefix: "BIR"
    },
    {
      id: "template-breads",
      name: "BREADS",
      displayOrder: 4,
      printOrder: 4,
      description: "Naan, roti, and Indian breads",
      printToKitchen: true,
      codePrefix: "BRD"
    },
    {
      id: "template-vegetarian",
      name: "VEGETARIAN",
      displayOrder: 5,
      printOrder: 5,
      description: "Vegetarian curries and dishes",
      printToKitchen: true,
      codePrefix: "VEG"
    },
    {
      id: "template-desserts-indian",
      name: "DESSERTS",
      displayOrder: 6,
      printOrder: 6,
      description: "Indian sweets and desserts",
      printToKitchen: true,
      codePrefix: "DES"
    },
    {
      id: "template-beverages",
      name: "BEVERAGES",
      displayOrder: 7,
      printOrder: 7,
      description: "Drinks, lassi, and beverages",
      printToKitchen: false,
      codePrefix: "BEV"
    }
  ]
};

/**
 * All available templates
 */
export const AVAILABLE_TEMPLATES: TemplateSet[] = [
  CORE_RESTAURANT_TEMPLATE,
  INDIAN_RESTAURANT_TEMPLATE
];

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): TemplateSet | undefined => {
  return AVAILABLE_TEMPLATES.find(template => template.id === id);
};

/**
 * Get template category by ID
 */
export const getTemplateCategoryById = (templateId: string, categoryId: string): CategoryTemplate | undefined => {
  const template = getTemplateById(templateId);
  return template?.categories.find(cat => cat.id === categoryId);
};

/**
 * Check if a category name matches a template category (case insensitive)
 */
export const findMatchingTemplateCategory = (categoryName: string, templateId?: string): CategoryTemplate | undefined => {
  const templatesToCheck = templateId ? [getTemplateById(templateId)].filter(Boolean) : AVAILABLE_TEMPLATES;
  
  for (const template of templatesToCheck) {
    if (!template) continue;
    const match = template.categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (match) return match;
  }
  
  return undefined;
};

/**
 * Map existing categories to template structure
 */
export interface CategoryMapping {
  existingCategoryId: string;
  existingCategoryName: string;
  templateCategoryId: string;
  templateCategoryName: string;
  customName?: string; // Allow renaming while preserving structure
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Auto-suggest mappings between existing categories and template categories
 */
export const suggestCategoryMappings = (
  existingCategories: Array<{id: string, name: string}>,
  templateId: string
): CategoryMapping[] => {
  const template = getTemplateById(templateId);
  if (!template) return [];
  
  const mappings: CategoryMapping[] = [];
  
  // Simple name matching logic
  for (const existing of existingCategories) {
    const templateMatch = template.categories.find(templateCat => {
      const existingLower = existing.name.toLowerCase();
      const templateLower = templateCat.name.toLowerCase();
      
      // Exact match
      if (existingLower === templateLower) return true;
      
      // Contains match
      if (existingLower.includes(templateLower.split(' ')[0]) || 
          templateLower.includes(existingLower.split(' ')[0])) return true;
      
      // Common aliases
      const aliases: Record<string, string[]> = {
        'starters': ['appetizers', 'apps', 'small plates'],
        'main course': ['mains', 'entrees', 'main dishes'],
        'side dishes': ['sides', 'sides & rice'],
        'accompaniments': ['breads', 'bread', 'extras'],
        'desserts': ['sweets', 'puddings'],
        'drinks & wine': ['beverages', 'drinks', 'wine']
      };
      
      const templateKey = templateLower.replace(/[^a-z ]/g, '');
      if (aliases[templateKey]?.some(alias => existingLower.includes(alias))) return true;
      
      return false;
    });
    
    if (templateMatch) {
      mappings.push({
        existingCategoryId: existing.id,
        existingCategoryName: existing.name,
        templateCategoryId: templateMatch.id,
        templateCategoryName: templateMatch.name,
        confidence: existing.name.toLowerCase() === templateMatch.name.toLowerCase() ? 'high' : 'medium'
      });
    }
  }
  
  return mappings;
};

/**
 * Apply template structure to existing categories
 */
export interface TemplateApplicationResult {
  updatedCategories: Array<{
    id: string;
    name: string;
    display_order: number;
    print_order: number;
    code_prefix?: string;
  }>;
  newCategories: Array<{
    name: string;
    display_order: number;
    print_order: number;
    print_to_kitchen: boolean;
    active: boolean;
    parent_category_id: null;
    is_protein_type: boolean;
    code_prefix?: string;
  }>;
}

/**
 * Apply template ordering and structure to categories
 */
export const applyTemplateStructure = (
  existingCategories: Array<{id: string, name: string}>,
  mappings: CategoryMapping[],
  templateId: string,
  options: {
    createMissing?: boolean;
    preserveCustomNames?: boolean;
  } = {}
): TemplateApplicationResult => {
  const template = getTemplateById(templateId);
  if (!template) throw new Error('Template not found');
  
  const result: TemplateApplicationResult = {
    updatedCategories: [],
    newCategories: []
  };
  
  // Update mapped categories
  for (const mapping of mappings) {
    const templateCategory = template.categories.find(cat => cat.id === mapping.templateCategoryId);
    if (!templateCategory) continue;
    
    result.updatedCategories.push({
      id: mapping.existingCategoryId,
      name: options.preserveCustomNames && mapping.customName ? mapping.customName : templateCategory.name,
      display_order: templateCategory.displayOrder,
      print_order: templateCategory.printOrder,
      code_prefix: templateCategory.codePrefix
    });
  }
  
  // Create missing template categories if requested
  if (options.createMissing) {
    const mappedTemplateIds = new Set(mappings.map(m => m.templateCategoryId));
    
    for (const templateCategory of template.categories) {
      if (!mappedTemplateIds.has(templateCategory.id)) {
        result.newCategories.push({
          name: templateCategory.name,
          display_order: templateCategory.displayOrder,
          print_order: templateCategory.printOrder,
          print_to_kitchen: templateCategory.printToKitchen,
          active: true,
          parent_category_id: null,
          is_protein_type: false,
          code_prefix: templateCategory.codePrefix
        });
      }
    }
  }
  
  return result;
};
