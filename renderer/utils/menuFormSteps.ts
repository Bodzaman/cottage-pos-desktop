import { FieldErrors } from 'react-hook-form';
import { 
  Package, 
  CreditCard, 
  ChefHat, 
  Camera, 
  Wine, 
  Coffee,
  type LucideIcon 
} from 'lucide-react';
import { MenuItemFormData, MenuVariant } from './masterTypes';
import { MenuItemConfiguration } from './menuItemConfiguration';

/**
 * Step status types for visual indicators
 */
export type StepStatus = 'complete' | 'incomplete' | 'error' | 'not-started';

/**
 * Form step definition
 * Each step represents a collapsible section in the stepper UI
 */
export interface FormStep {
  /** Unique step identifier */
  id: string;
  
  /** Display title */
  title: string;
  
  /** Brief description of what this step contains */
  description: string;
  
  /** Whether this step must be completed to save */
  required: boolean;
  
  /** Current completion status */
  status: StepStatus;
  
  /** Display order (lower = earlier) */
  order: number;
  
  /** Icon for visual identification */
  icon: LucideIcon;
}

/**
 * Get form steps based on item configuration
 * Returns different step structures for different item types and pricing modes
 * 
 * @param configuration - Menu item configuration (type and pricing mode)
 * @returns Array of form steps in display order
 * 
 * @example
 * ```ts
 * const steps = getFormSteps({
 *   itemType: 'food',
 *   pricingMode: 'variants',
 *   configuredAt: new Date(),
 *   isLocked: false
 * });
 * // Returns: [Basic Info, Pricing & Variants, Food Details, Media]
 * ```
 */
export function getFormSteps(
  configuration: MenuItemConfiguration | null
): FormStep[] {
  if (!configuration) {
    // Fallback: minimal steps if no configuration
    return [
      {
        id: 'basic',
        title: 'Basic Information',
        description: 'Name, category, description',
        required: true,
        status: 'not-started',
        order: 1,
        icon: Package
      },
      {
        id: 'pricing',
        title: 'Pricing',
        description: 'Set prices for this item',
        required: true,
        status: 'not-started',
        order: 2,
        icon: CreditCard
      }
    ];
  }

  const { itemType, pricingMode } = configuration;
  const hasVariants = pricingMode === 'variants';

  const baseSteps: FormStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Name, category, description',
      required: true,
      status: 'not-started',
      order: 1,
      icon: Package
    },
    {
      id: 'pricing',
      title: hasVariants ? 'Pricing & Variants' : 'Pricing',
      description: hasVariants 
        ? 'Configure variants with individual pricing'
        : 'Set dine-in, takeaway, and delivery prices',
      required: true,
      status: 'not-started',
      order: 2,
      icon: CreditCard
    }
  ];

  // Add item-type specific steps
  if (itemType === 'food' && !hasVariants) {
    baseSteps.push({
      id: 'food-details',
      title: 'Food Details',
      description: 'Spice level, allergens, dietary information',
      required: false,
      status: 'not-started',
      order: 3,
      icon: ChefHat
    });
  } else if (itemType === 'drinks_wine') {
    baseSteps.push({
      id: 'drinks-details',
      title: 'Drinks & Wine Details',
      description: 'Serving sizes, ABV, temperature',
      required: false,
      status: 'not-started',
      order: 3,
      icon: Wine
    });
  } else if (itemType === 'coffee_desserts') {
    baseSteps.push({
      id: 'coffee-details',
      title: 'Coffee & Desserts Details',
      description: 'Serving options and dietary information',
      required: false,
      status: 'not-started',
      order: 3,
      icon: Coffee
    });
  }

  return baseSteps.sort((a, b) => a.order - b.order);
}

/**
 * Calculate step status based on form data and validation errors
 * 
 * @param stepId - Step to calculate status for
 * @param configuration - Menu item configuration
 * @param formData - Current form values
 * @param variants - Current variants array
 * @param errors - Form validation errors
 * @returns Step status (complete, incomplete, error, not-started)
 * 
 * @example
 * ```ts
 * const status = calculateStepStatus('basic', configuration, formData, variants, errors);
 * // Returns: 'complete' if name, category, description filled
 * ```
 */
export function calculateStepStatus(
  stepId: string,
  configuration: MenuItemConfiguration | null,
  formData: Partial<MenuItemFormData>,
  variants: MenuVariant[],
  errors: FieldErrors<MenuItemFormData>
): StepStatus {
  // Helper to check if errors exist for specific fields
  const hasErrorsInFields = (fields: string[]): boolean => {
    return fields.some(field => {
      const fieldError = errors[field as keyof MenuItemFormData];
      return fieldError !== undefined;
    });
  };

  switch (stepId) {
    case 'basic': {
      const requiredFields = ['name', 'category_id', 'menu_item_description'];
      
      // Check for errors
      if (hasErrorsInFields(requiredFields)) {
        return 'error';
      }
      
      // Check if all required fields have values
      const hasName = formData.name?.trim().length > 0;
      const hasDescription = 
        (formData.description?.trim().length > 0) || 
        (formData.menu_item_description?.trim().length > 0);
      const hasCategory = !!formData.category_id;
      
      if (hasName && hasCategory && hasDescription) {
        return 'complete';
      }
      
      // Started but not complete
      if (hasName || hasCategory || hasDescription) {
        return 'incomplete';
      }
      
      return 'not-started';
    }

    case 'pricing': {
      const hasVariants = configuration?.pricingMode === 'variants';
      
      if (hasVariants) {
        // Variant-based pricing
        const variantFields = ['variants'];
        
        if (hasErrorsInFields(variantFields)) {
          return 'error';
        }
        
        // Must have at least 1 variant with valid pricing
        if (variants && variants.length > 0) {
          const hasValidVariant = variants.some(v => {
            const hasDineIn = v.price_dine_in && v.price_dine_in > 0;
            const hasTakeaway = v.price_takeaway && v.price_takeaway > 0;
            const hasDelivery = v.price_delivery && v.price_delivery > 0;
            return hasDineIn || hasTakeaway || hasDelivery;
          });
          
          if (hasValidVariant) {
            return 'complete';
          }
          
          return 'incomplete';
        }
        
        return 'incomplete'; // No variants configured
      } else {
        // Single-item pricing
        const pricingFields = ['price_dine_in', 'price_takeaway', 'price_delivery'];
        
        if (hasErrorsInFields(pricingFields)) {
          return 'error';
        }
        
        // At least one price must be set and > 0
        const hasDineIn = formData.price_dine_in && formData.price_dine_in > 0;
        const hasTakeaway = formData.price_takeaway && formData.price_takeaway > 0;
        const hasDelivery = formData.price_delivery && formData.price_delivery > 0;
        
        if (hasDineIn || hasTakeaway || hasDelivery) {
          return 'complete';
        }
        
        // Started but no valid prices
        if (formData.price_dine_in !== undefined || 
            formData.price_takeaway !== undefined || 
            formData.price_delivery !== undefined) {
          return 'incomplete';
        }
        
        return 'not-started';
      }
    }

    case 'food-details':
    case 'drinks-details':
    case 'coffee-details': {
      // Optional sections - check if any fields have errors
      const typeSpecificFields = [
        'default_spice_level',
        'dietary_tags',
        'allergen_info',
        'serving_sizes',
        'abv_percentage',
        'temperature'
      ];
      
      if (hasErrorsInFields(typeSpecificFields)) {
        return 'error';
      }
      
      // Check if any optional fields are filled
      const hasSpiceLevel = formData.default_spice_level !== undefined && formData.default_spice_level > 0;
      const hasDietaryTags = formData.dietary_tags && formData.dietary_tags.length > 0;
      const hasAllergenInfo = formData.allergen_info && formData.allergen_info.trim().length > 0;
      const hasServingSizes = formData.serving_sizes && formData.serving_sizes.length > 0;
      const hasAbv = formData.abv_percentage !== undefined && formData.abv_percentage > 0;
      const hasTemperature = formData.temperature && formData.temperature.trim().length > 0;
      
      if (hasSpiceLevel || hasDietaryTags || hasAllergenInfo || 
          hasServingSizes || hasAbv || hasTemperature) {
        return 'complete';
      }
      
      return 'not-started';
    }

    case 'media': {
      // Optional section - check if image uploaded
      const mediaFields = ['image_url', 'image_url_widescreen'];
      
      if (hasErrorsInFields(mediaFields)) {
        return 'error';
      }
      
      const hasImage = formData.image_url && formData.image_url.trim().length > 0;
      const hasWidescreenImage = formData.image_url_widescreen && formData.image_url_widescreen.trim().length > 0;
      
      if (hasImage || hasWidescreenImage) {
        return 'complete';
      }
      
      return 'not-started';
    }

    default:
      return 'not-started';
  }
}

/**
 * Get summary text for collapsed step
 * Shows quick preview of what's configured in this step
 * 
 * @param stepId - Step to get summary for
 * @param formData - Current form values
 * @param variants - Current variants array
 * @returns Summary string or null if step not started
 * 
 * @example
 * ```ts
 * const summary = getStepSummary('basic', formData, variants);
 * // Returns: "Chicken Tikka Masala • Main Courses"
 * ```
 */
export function getStepSummary(
  stepId: string,
  formData: Partial<MenuItemFormData>,
  variants: MenuVariant[]
): string | null {
  switch (stepId) {
    case 'basic': {
      const parts: string[] = [];
      
      if (formData.name) {
        parts.push(formData.name);
      }
      
      // Note: We don't have category name here, just ID
      // This will need to be enhanced in the component to lookup category name
      
      return parts.length > 0 ? parts.join(' • ') : null;
    }

    case 'pricing': {
      const hasVariants = formData.has_variants === true;
      
      if (hasVariants) {
        if (variants && variants.length > 0) {
          const validVariants = variants.filter(v => 
            (v.price_dine_in && v.price_dine_in > 0) ||
            (v.price_takeaway && v.price_takeaway > 0) ||
            (v.price_delivery && v.price_delivery > 0)
          );
          
          if (validVariants.length > 0) {
            const proteins = validVariants.map(v => v.variant_name).join(', ');
            return `${validVariants.length} variant${validVariants.length > 1 ? 's' : ''} configured: ${proteins}`;
          }
          
          return `${variants.length} variant${variants.length > 1 ? 's' : ''} added (pricing incomplete)`;
        }
        
        return null;
      } else {
        // Single-item pricing
        const prices: string[] = [];
        
        if (formData.price_dine_in && formData.price_dine_in > 0) {
          prices.push(`Dine-In: £${formData.price_dine_in.toFixed(2)}`);
        }
        if (formData.price_takeaway && formData.price_takeaway > 0) {
          prices.push(`Takeaway: £${formData.price_takeaway.toFixed(2)}`);
        }
        if (formData.price_delivery && formData.price_delivery > 0) {
          prices.push(`Delivery: £${formData.price_delivery.toFixed(2)}`);
        }
        
        return prices.length > 0 ? prices.join(' • ') : null;
      }
    }

    case 'food-details': {
      const parts: string[] = [];
      
      if (formData.default_spice_level && formData.default_spice_level > 0) {
        parts.push(`Spice Level: ${formData.default_spice_level}`);
      }
      
      if (formData.dietary_tags && formData.dietary_tags.length > 0) {
        parts.push(`${formData.dietary_tags.length} dietary tag${formData.dietary_tags.length > 1 ? 's' : ''}`);
      }
      
      return parts.length > 0 ? parts.join(' • ') : null;
    }

    case 'drinks-details': {
      const parts: string[] = [];
      
      if (formData.serving_sizes && formData.serving_sizes.length > 0) {
        parts.push(`${formData.serving_sizes.length} serving size${formData.serving_sizes.length > 1 ? 's' : ''}`);
      }
      
      if (formData.abv_percentage && formData.abv_percentage > 0) {
        parts.push(`${formData.abv_percentage}% ABV`);
      }
      
      if (formData.temperature) {
        parts.push(formData.temperature);
      }
      
      return parts.length > 0 ? parts.join(' • ') : null;
    }

    case 'coffee-details': {
      const parts: string[] = [];
      
      if (formData.serving_sizes && formData.serving_sizes.length > 0) {
        parts.push(`${formData.serving_sizes.length} serving option${formData.serving_sizes.length > 1 ? 's' : ''}`);
      }
      
      if (formData.dietary_tags && formData.dietary_tags.length > 0) {
        parts.push(`${formData.dietary_tags.length} dietary tag${formData.dietary_tags.length > 1 ? 's' : ''}`);
      }
      
      return parts.length > 0 ? parts.join(' • ') : null;
    }

    case 'media': {
      const parts: string[] = [];
      
      if (formData.image_url) {
        parts.push('Standard image');
      }
      
      if (formData.image_url_widescreen) {
        parts.push('Widescreen image');
      }
      
      return parts.length > 0 ? parts.join(' + ') : null;
    }

    default:
      return null;
  }
}

/**
 * Get steps with calculated statuses
 * Convenience function that combines getFormSteps and calculateStepStatus
 * 
 * @param configuration - Menu item configuration
 * @param formData - Current form values
 * @param variants - Current variants array
 * @param errors - Form validation errors
 * @returns Array of steps with current statuses
 * 
 * @example
 * ```ts
 * const steps = getStepsWithStatus(configuration, formData, variants, errors);
 * // Returns steps with real-time status updates
 * ```
 */
export function getStepsWithStatus(
  configuration: MenuItemConfiguration | null,
  formData: Partial<MenuItemFormData>,
  variants: MenuVariant[],
  errors: FieldErrors<MenuItemFormData>
): FormStep[] {
  const steps = getFormSteps(configuration);
  
  return steps.map(step => ({
    ...step,
    status: calculateStepStatus(step.id, configuration, formData, variants, errors)
  }));
}

/**
 * Get next incomplete required step
 * Used for auto-expand logic to guide users
 * 
 * @param steps - Array of form steps with statuses
 * @returns Next incomplete required step or null if all complete
 */
export function getNextIncompleteStep(steps: FormStep[]): FormStep | null {
  return steps.find(
    step => step.required && step.status !== 'complete'
  ) || null;
}

/**
 * Calculate overall form progress percentage
 * Based on completion of required steps
 * 
 * @param steps - Array of form steps with statuses
 * @returns Progress percentage (0-100)
 * 
 * @example
 * ```ts
 * const progress = calculateFormProgress(steps);
 * // Returns: 66 (if 2 of 3 required steps complete)
 * ```
 */
export function calculateFormProgress(steps: FormStep[]): number {
  const requiredSteps = steps.filter(s => s.required);
  
  if (requiredSteps.length === 0) {
    return 100;
  }
  
  const completedRequired = requiredSteps.filter(
    s => s.status === 'complete'
  ).length;
  
  return Math.round((completedRequired / requiredSteps.length) * 100);
}
