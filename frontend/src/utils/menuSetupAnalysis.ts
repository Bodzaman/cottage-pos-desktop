/**
 * Menu Setup Analysis Utilities
 * 
 * Provides functions to analyze current menu setup state and determine
 * what guidance should be shown to users for optimal setup flow.
 */

import { Category, ProteinType } from './menuTypes';

/**
 * Analysis result for menu setup status
 */
export interface MenuSetupStatus {
  // Core counts
  mainCategoriesCount: number;
  subcategoriesCount: number;
  proteinsCount: number;
  
  // Setup progress flags
  hasMainCategories: boolean;
  hasSubcategories: boolean;
  hasProteins: boolean;
  
  // Recommendations
  recommendedNextStep: 'categories' | 'proteins' | 'menu-items' | 'complete';
  setupPhase: 'initial' | 'basic' | 'advanced' | 'complete';
  
  // Progress percentage (0-100)
  progressPercentage: number;
  
  // Setup flow suggestions
  suggestions: string[];
  warnings: string[];
}

/**
 * Analyzes the current menu setup state and returns guidance information
 */
export function analyzeMenuSetup(categories: Category[], proteins: ProteinType[]): MenuSetupStatus {
  // Filter categories to separate main categories from subcategories
  const mainCategories = categories.filter(cat => !cat.parent_id && !cat.is_protein_type);
  const subcategories = categories.filter(cat => cat.parent_id && !cat.is_protein_type);
  
  // Count totals
  const mainCategoriesCount = mainCategories.length;
  const subcategoriesCount = subcategories.length;
  const proteinsCount = proteins.length;
  
  // Determine setup phase and recommendations
  let setupPhase: 'initial' | 'basic' | 'advanced' | 'complete' = 'initial';
  let recommendedNextStep: 'categories' | 'proteins' | 'menu-items' | 'complete' = 'categories';
  let progressPercentage = 0;
  
  const suggestions: string[] = [];
  const warnings: string[] = [];
  
  // Calculate progress and recommendations
  if (mainCategoriesCount === 0) {
    setupPhase = 'initial';
    recommendedNextStep = 'categories';
    progressPercentage = 0;
    suggestions.push('Start by creating main categories like "Appetizers", "Main Courses", "Desserts"');
    suggestions.push('Categories help organize your menu for customers and staff');
  } else if (mainCategoriesCount < 3) {
    setupPhase = 'basic';
    recommendedNextStep = 'categories';
    progressPercentage = 25;
    suggestions.push('Consider adding more main categories to organize your menu better');
    if (proteinsCount === 0) {
      suggestions.push('Next, add protein options like "Chicken", "Lamb", "Vegetarian"');
    }
  } else {
    // Has sufficient main categories
    if (proteinsCount === 0) {
      setupPhase = 'basic';
      recommendedNextStep = 'proteins';
      progressPercentage = 50;
      suggestions.push('Great! Now add protein options like "Chicken", "Lamb", "Prawn", "Vegetarian"');
      suggestions.push('Proteins help create variants of your dishes for different dietary preferences');
    } else if (proteinsCount < 3) {
      setupPhase = 'advanced';
      recommendedNextStep = 'proteins';
      progressPercentage = 70;
      suggestions.push('Consider adding more protein options to give customers variety');
      suggestions.push('Common options include: Chicken, Lamb, Beef, Prawn, Fish, Vegetarian, Vegan');
    } else {
      setupPhase = 'complete';
      recommendedNextStep = 'menu-items';
      progressPercentage = 100;
      suggestions.push('Excellent! Your menu structure is ready');
      suggestions.push('You can now create menu items and assign them to categories');
      suggestions.push('Use the Menu Items tab to start adding your dishes');
    }
  }
  
  // Add warnings for potential issues
  if (mainCategoriesCount > 8) {
    warnings.push('You have many main categories. Consider using subcategories to organize better.');
  }
  
  if (subcategoriesCount > mainCategoriesCount * 3) {
    warnings.push('You have many subcategories. Make sure they are well organized under main categories.');
  }
  
  if (proteinsCount > 10) {
    warnings.push('You have many protein options. Ensure they are all necessary for your menu.');
  }
  
  return {
    mainCategoriesCount,
    subcategoriesCount,
    proteinsCount,
    hasMainCategories: mainCategoriesCount > 0,
    hasSubcategories: subcategoriesCount > 0,
    hasProteins: proteinsCount > 0,
    recommendedNextStep,
    setupPhase,
    progressPercentage,
    suggestions,
    warnings
  };
}

/**
 * Gets the optimal default type for the dropdown based on current menu state
 */
export function getOptimalDefaultType(setupStatus: MenuSetupStatus): 'main' | 'sub' | 'protein' {
  switch (setupStatus.recommendedNextStep) {
    case 'categories':
      return 'main';
    case 'proteins':
      return 'protein';
    case 'menu-items':
    case 'complete':
    default:
      return 'main';
  }
}

/**
 * Gets contextual helper text based on current menu state
 */
export function getContextualHelperText(selectedType: 'main' | 'sub' | 'protein', setupStatus: MenuSetupStatus): string {
  switch (selectedType) {
    case 'main':
      if (!setupStatus.hasMainCategories) {
        return 'Create your first main section (like "Starters", "Main Dishes", "Desserts")';
      }
      return 'Main sections help organize your menu for customers';
      
    case 'sub':
      if (!setupStatus.hasMainCategories) {
        return 'Create main sections first, then add smaller groups within them';
      }
      return 'Smaller groups within a main section (like "Hot Starters" under "Starters")';
      
    case 'protein':
      if (!setupStatus.hasMainCategories) {
        return 'Create main sections first, then add protein choices';
      }
      if (!setupStatus.hasProteins) {
        return 'Add protein choices your customers can select (like "Chicken", "Lamb", "Vegetarian")';
      }
      return 'Protein choices customers can pick for their dishes (like Chicken, Lamb, Fish)';
      
    default:
      return '';
  }
}

/**
 * Gets the dropdown options in optimal order based on current menu state
 */
export function getOptimalDropdownOrder(setupStatus: MenuSetupStatus): Array<{value: 'main' | 'sub' | 'protein', label: string, recommended?: boolean}> {
  const baseOptions = [
    { value: 'main' as const, label: 'Main Section' },
    { value: 'sub' as const, label: 'Group within Section' },
    { value: 'protein' as const, label: 'Protein Choice' }
  ];
  
  // Mark recommended option and potentially reorder
  const options = baseOptions.map(option => ({
    ...option,
    recommended: option.value === getOptimalDefaultType(setupStatus)
  }));
  
  // If we need proteins, promote it to second position
  if (setupStatus.recommendedNextStep === 'proteins' && setupStatus.hasMainCategories) {
    const proteinOption = options.find(opt => opt.value === 'protein')!;
    const otherOptions = options.filter(opt => opt.value !== 'protein');
    return [otherOptions[0], proteinOption, ...otherOptions.slice(1)];
  }
  
  // If we need categories first, keep main at top
  if (setupStatus.recommendedNextStep === 'categories') {
    return options; // Keep original order with main first
  }
  
  return options;
}

/**
 * Gets setup progress indicators for dashboard display
 */
export function getSetupProgressIndicators(setupStatus: MenuSetupStatus) {
  return {
    categories: {
      status: setupStatus.hasMainCategories ? 'complete' : 'pending',
      count: setupStatus.mainCategoriesCount,
      label: 'Main Categories'
    },
    proteins: {
      status: setupStatus.hasProteins ? 'complete' : 'pending', 
      count: setupStatus.proteinsCount,
      label: 'Protein Options'
    },
    overall: {
      percentage: setupStatus.progressPercentage,
      phase: setupStatus.setupPhase,
      nextStep: setupStatus.recommendedNextStep
    }
  };
}
