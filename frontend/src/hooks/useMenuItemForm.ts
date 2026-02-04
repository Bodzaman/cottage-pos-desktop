/**
 * useMenuItemForm Hook
 *
 * Manages form state, validation, and submission for menu items.
 * Extracts form logic from MenuItemForm component for reusability.
 *
 * Features:
 * - React Hook Form integration with Zod validation
 * - Variant state management
 * - Configuration detection for existing items
 * - Pricing validation
 * - Submit handlers with retry logic
 *
 * @example
 * ```tsx
 * const { form, variants, setVariants, submit, isSubmitting } = useMenuItemForm({
 *   initialData: existingMenuItem,
 *   onSuccess: () => toast.success('Saved!'),
 * });
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { menuItemFormSchema } from '../utils/menuFormValidation';
import { MenuItemConfiguration, detectConfigurationFromItem } from '../utils/menuItemConfiguration';
import { validateItemPricing } from '../utils/variantPricing';
import type { MenuItemFormData, MenuItemVariant, MenuCategory, ProteinType } from '../utils/masterTypes';
import type { MenuVariant } from '../components/MenuItemVariants';
import brain from 'brain';
import { toast } from 'sonner';

export interface UseMenuItemFormOptions {
  /** Existing menu item data (for editing) */
  initialData?: MenuItemFormData;
  /** Configuration from type selection wizard */
  configuration?: MenuItemConfiguration;
  /** Whether form is in edit mode */
  isEditing?: boolean;
  /** Available categories (for validation) */
  categories?: MenuCategory[];
  /** Available protein types (for variants) */
  proteinTypes?: ProteinType[];
  /** Callback after successful save */
  onSuccess?: () => void;
  /** Custom save handler (overrides default API call) */
  onSave?: (data: MenuItemFormData) => Promise<void>;
}

export interface UseMenuItemFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<MenuItemFormData>;
  /** Variants array state */
  variants: MenuVariant[];
  /** Set variants */
  setVariants: React.Dispatch<React.SetStateAction<MenuVariant[]>>;
  /** Current configuration */
  configuration: MenuItemConfiguration | null;
  /** Set configuration */
  setConfiguration: React.Dispatch<React.SetStateAction<MenuItemConfiguration | null>>;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Submit error message */
  submitError: string | null;
  /** Has pricing validation error */
  hasPricingError: boolean;
  /** Submit the form */
  submit: () => Promise<void>;
  /** Reset the form */
  resetForm: () => void;
  /** Validate pricing */
  validatePricing: () => boolean;
}

/**
 * Transform MenuItemVariant to MenuVariant for local state
 */
function transformVariant(v: MenuItemVariant, index: number): MenuVariant {
  return {
    id: v.id,
    protein_type_id: v.protein_type_id || undefined,
    name: v.name || '',
    description: v.description || '',
    description_state: v.description_state || 'inherited',
    price: v.price && v.price > 0 ? v.price : 0.01,
    price_dine_in: v.price_dine_in || 0,
    price_delivery: v.price_delivery || 0,
    is_default: v.is_default || false,
    image_url: v.image_url || '',
    image_asset_id: v.image_asset_id || '',
    image_state: v.image_state || 'inherited',
    display_order: index,
    spice_level: v.spice_level || 0,
    allergens: v.allergens || {},
    allergen_notes: v.allergen_notes || '',
    is_vegetarian: v.is_vegetarian || false,
    is_vegan: v.is_vegan || false,
    is_gluten_free: v.is_gluten_free || false,
    is_halal: v.is_halal || false,
    is_dairy_free: v.is_dairy_free || false,
    is_nut_free: v.is_nut_free || false,
    featured: v.featured || false,
  };
}

/**
 * Build default values for the form
 */
function buildDefaultValues(
  initialData?: MenuItemFormData,
  configuration?: MenuItemConfiguration | null
): MenuItemFormData {
  const hasVariants = configuration?.pricingMode === 'variants' || initialData?.has_variants || false;

  return {
    name: initialData?.name || '',
    description: initialData?.description || initialData?.menu_item_description || initialData?.long_description || '',
    category_id: initialData?.category_id || '',
    spice_level: initialData?.spice_level || 0,
    featured: initialData?.featured || false,
    active: initialData?.active ?? true,
    dietary_tags: initialData?.dietary_tags || [],
    menu_order: initialData?.menu_order || initialData?.display_order || 0,
    kitchen_display_name: initialData?.kitchen_display_name || '',
    has_variants: hasVariants,
    variants: initialData?.variants?.map((v, i) => transformVariant(v, i)) || [],
    price: initialData?.price || 0,
    price_dine_in: initialData?.price_dine_in || 0,
    price_takeaway: initialData?.price_takeaway || 0,
    price_delivery: initialData?.price_delivery || 0,
  } as MenuItemFormData;
}

export function useMenuItemForm({
  initialData,
  configuration: propConfiguration,
  isEditing = false,
  categories = [],
  proteinTypes = [],
  onSuccess,
  onSave
}: UseMenuItemFormOptions = {}): UseMenuItemFormReturn {
  // Determine initial configuration
  const initialConfiguration = useMemo<MenuItemConfiguration | null>(() => {
    if (propConfiguration) return propConfiguration;
    if (initialData) return detectConfigurationFromItem(initialData);
    return null;
  }, [propConfiguration, initialData]);

  // Configuration state
  const [configuration, setConfiguration] = useState<MenuItemConfiguration | null>(initialConfiguration);

  // Sync configuration with props
  useEffect(() => {
    if (initialConfiguration) {
      setConfiguration(initialConfiguration);
    }
  }, [initialConfiguration]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasPricingError, setHasPricingError] = useState(false);

  // Variants state (separate from form for performance)
  const [variants, setVariants] = useState<MenuVariant[]>(
    initialData?.variants?.map((v, i) => transformVariant(v, i)) || []
  );

  // Form setup
  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: buildDefaultValues(initialData, configuration),
  });

  const { watch, setValue, handleSubmit, reset, getValues } = form;

  // Sync variants with form
  useEffect(() => {
    if (isEditing && initialData?.variants) {
      const transformed = initialData.variants.map((v, i) => transformVariant(v, i));
      setVariants(transformed);
      setValue('variants', initialData.variants);
    }
  }, [isEditing, initialData?.variants, setValue]);

  // Auto-sync has_variants with variants array
  useEffect(() => {
    const hasVariantsComputed = variants.length > 0;
    const currentHasVariants = watch('has_variants');

    if (hasVariantsComputed !== currentHasVariants) {
      setValue('has_variants', hasVariantsComputed, { shouldDirty: false });
    }
  }, [variants, watch, setValue]);

  // Validate pricing
  const validatePricing = useCallback((): boolean => {
    const formData = getValues();
    const hasVariantsValue = watch('has_variants');

    const validation = validateItemPricing(
      {
        has_variants: hasVariantsValue,
        price: formData.price,
        price_dine_in: formData.price_dine_in,
        price_takeaway: formData.price_takeaway,
        price_delivery: formData.price_delivery,
      },
      hasVariantsValue ? (variants as unknown as MenuItemVariant[]) : []
    );

    setHasPricingError(!validation.isValid);
    return validation.isValid;
  }, [getValues, watch, variants]);

  // Submit handler
  const submit = useCallback(async () => {
    // Validate pricing first
    if (!validatePricing()) {
      setSubmitError('Please fix pricing errors before saving');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = getValues();
      const hasVariantsValue = watch('has_variants');

      // Prepare data for API
      const submitData: MenuItemFormData = {
        ...formData,
        has_variants: hasVariantsValue,
        variants: hasVariantsValue ? (variants.map((v, i) => ({
          ...v,
          display_order: i,
        })) as unknown as MenuItemVariant[]) : [],
      };

      // Use custom save handler or default API
      if (onSave) {
        await onSave(submitData);
      } else if (isEditing && initialData?.id) {
        // Update existing item
        const response = await brain.update_menu_item(initialData.id, submitData as any);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update menu item');
        }
      } else {
        // Create new item
        const response = await brain.create_menu_item(submitData as any);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create menu item');
        }
      }

      toast.success(isEditing ? 'Menu item updated!' : 'Menu item created!');
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save menu item';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [validatePricing, getValues, watch, variants, onSave, isEditing, initialData?.id, onSuccess]);

  // Reset form
  const resetForm = useCallback(() => {
    reset(buildDefaultValues(initialData, configuration));
    setVariants(initialData?.variants?.map((v, i) => transformVariant(v, i)) || []);
    setSubmitError(null);
    setHasPricingError(false);
  }, [reset, initialData, configuration]);

  return {
    form,
    variants,
    setVariants,
    configuration,
    setConfiguration,
    isSubmitting,
    submitError,
    hasPricingError,
    submit: handleSubmit(submit) as unknown as () => Promise<void>,
    resetForm,
    validatePricing,
  };
}

export default useMenuItemForm;
