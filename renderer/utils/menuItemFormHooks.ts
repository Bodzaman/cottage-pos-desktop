import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { MenuItemFormData, MenuCategory, ProteinType, MenuVariant } from './masterTypes';
import { validateItemPricing } from './variantPricing';

/**
 * Custom hook for managing menu item form state and logic
 * Extracted from MenuItemForm to preserve all business logic
 */
export function useMenuItemForm({
  menuItem,
  initialData,
  categories,
  proteinTypes,
  onSave,
  onSuccess,
  onCancel,
  isLoading = false,
  isEditing = false,
  itemType = null
}: {
  menuItem?: MenuItemFormData;
  initialData?: MenuItemFormData;
  categories: MenuCategory[];
  proteinTypes?: ProteinType[];
  onSave?: (data: MenuItemFormData) => Promise<void>;
  onSuccess?: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  itemType?: 'food' | 'drinks_wine' | 'coffee_desserts' | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [variants, setVariants] = useState<MenuVariant[]>([]);
  
  // Order context state for auto-population
  const [orderContext, setOrderContext] = useState<{
    categoryName: string;
    nextMenuOrder: number;
  } | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  
  // Use either menuItem (new pattern) or initialData (legacy pattern)
  const itemData = menuItem || initialData;
  const [selectedCategory, setSelectedCategory] = useState<string>(itemData?.category_id || '');
  
  // Collapsible section state management
  const [sectionsExpanded, setSectionsExpanded] = useState({
    itemType: true,        // Always expanded (core decision)
    basicInfo: true,       // Expanded by default (essential info)
    specializedFields: itemType ? true : false, // Expanded if item type selected
    media: false,          // Collapsed by default (optional)
    variants: false,       // Smart expansion based on hasVariants
    pricing: true,         // Expanded by default for single items
    additionalSettings: false // Collapsed by default (secondary info)
  });
  
  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset
  } = useForm<MenuItemFormData>({
    defaultValues: {
      name: itemData?.name || '',
      description: itemData?.description || itemData?.menu_item_description || itemData?.long_description || '',
      category_id: itemData?.category_id || '',
      spice_level: itemData?.spice_level || 0,
      featured: itemData?.featured || false,
      active: itemData?.active ?? true,
      print_to_kitchen: true,
      dietary_tags: itemData?.dietary_tags || [],
      menu_order: itemData?.menu_order || itemData?.display_order || 0,
      has_variants: itemData?.has_variants || false,
      
      // Image/Media fields
      image_url: itemData?.image_url || '',
      image_url_widescreen: itemData?.image_url_widescreen || '',
      image_asset_id: itemData?.image_asset_id || '',
      image_widescreen_asset_id: itemData?.image_widescreen_asset_id || '',
      preferred_aspect_ratio: itemData?.preferred_aspect_ratio || 'square',
      
      // Pricing fields
      price: itemData?.price,
      price_takeaway: itemData?.price_takeaway,
      price_dine_in: itemData?.price_dine_in,
      price_delivery: itemData?.price_delivery,
      
      // Drinks & Wine serving sizes
      serving_size_125ml_glass: itemData?.serving_size_125ml_glass || false,
      serving_size_125ml_glass_price: itemData?.serving_size_125ml_glass_price,
      serving_size_175ml_glass: itemData?.serving_size_175ml_glass || false,
      serving_size_175ml_glass_price: itemData?.serving_size_175ml_glass_price,
      serving_size_250ml_glass: itemData?.serving_size_250ml_glass || false,
      serving_size_250ml_glass_price: itemData?.serving_size_250ml_glass_price,
      serving_size_330ml_bottle: itemData?.serving_size_330ml_bottle || false,
      serving_size_330ml_bottle_price: itemData?.serving_size_330ml_bottle_price,
      serving_size_half_pint: itemData?.serving_size_half_pint || false,
      serving_size_half_pint_price: itemData?.serving_size_half_pint_price,
      serving_size_pint: itemData?.serving_size_pint || false,
      serving_size_pint_price: itemData?.serving_size_pint_price,
      serving_size_bottle: itemData?.serving_size_bottle || false,
      serving_size_bottle_price: itemData?.serving_size_bottle_price,
    }
  });

  // Watch form values
  const hasVariants = watch('has_variants');
  const watchedCategory = watch('category_id');

  // Helper function to toggle section expansion
  const toggleSection = (sectionKey: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Auto-populate ordering fields when category changes
  const autoPopulateOrdering = async () => {
    if (!selectedCategory || isEditing) return;
    
    try {
      setIsLoadingOrder(true);
      const category = categories.find(c => c.id === selectedCategory);
      if (!category) return;
      
      // Get next display order
      const displayOrderResponse = await apiClient.get_next_item_display_order({ 
        category_id: selectedCategory
      });
      
      if (displayOrderResponse.ok) {
        const displayOrderData = await displayOrderResponse.json();
        
        setValue('menu_order', displayOrderData.next_order);
        
        setOrderContext({
          categoryName: category.name,
          nextMenuOrder: displayOrderData.next_order
        });
      }
    } catch (error) {
      console.error('Error auto-populating order fields:', error);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Auto-populate ordering when category changes
  useEffect(() => {
    if (selectedCategory !== watchedCategory) {
      setSelectedCategory(watchedCategory || '');
    }
    autoPopulateOrdering();
  }, [selectedCategory, setValue, categories, isEditing]);

  // Handle form submission
  const onSubmit = async (data: MenuItemFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Validate required fields
      if (!data.name.trim()) {
        throw new Error('Item name is required');
      }
      
      // 🛡️ PRICING VALIDATION using unified utility
      const pricingValidation = validateItemPricing(
        {
          price: data.price,
          price_dine_in: data.price_dine_in,
          price_takeaway: data.price_takeaway,
          price_delivery: data.price_delivery,
          has_variants: data.has_variants
        },
        variants
      );
      
      // Block submission if validation fails
      if (!pricingValidation.isValid) {
        const errorMessage = pricingValidation.errors.join(', ');
        setSubmitError(errorMessage);
        toast.error('Pricing validation failed', {
          description: errorMessage
        });
        return; // Don't submit
      }
      
      // Show warnings (non-blocking)
      if (pricingValidation.warnings.length > 0) {
        toast.warning('Pricing notice', {
          description: pricingValidation.warnings.join(', ')
        });
      }
      
      // Auto-assign category for specialized item types
      if (itemType && !data.category_id) {
        const targetCategoryName = itemType === 'food' ? 'Main Courses' : 
                                  itemType === 'drinks_wine' ? 'Drinks & Wine' : 
                                  itemType === 'coffee_desserts' ? 'Coffee & Desserts' : null;
        
        if (targetCategoryName) {
          const targetCategory = categories.find(cat => 
            cat.name.toLowerCase().includes(targetCategoryName.toLowerCase().split(' ')[0])
          );
          if (targetCategory) {
            data.category_id = targetCategory.id;
          }
        }
      }
      
      if (!data.category_id) {
        throw new Error('Category is required');
      }
      
      // Call the save handler
      if (onSave) {
        await onSave(data);
      }
      
      // Legacy callback support
      if (onSuccess) {
        onSuccess();
      }
      
      toast.success(`Menu item ${isEditing ? 'updated' : 'created'} successfully`);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'An error occurred while saving');
      toast.error(error.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Form methods
    register,
    handleSubmit: handleSubmit(onSubmit),
    watch,
    setValue,
    errors,
    isDirty,
    reset,
    
    // State
    isSubmitting,
    submitError,
    variants,
    setVariants,
    selectedCategory,
    setSelectedCategory,
    sectionsExpanded,
    toggleSection,
    orderContext,
    isLoadingOrder,
    
    // Computed values
    hasVariants,
    itemData,
    
    // Actions
    onCancel,
    autoPopulateOrdering
  };
}

/**
 * Custom hook for managing specialized field rendering based on item type
 */
export function useItemTypeFields(itemType: 'food' | 'drinks_wine' | 'coffee_desserts' | null) {
  const getFieldsConfig = () => {
    switch (itemType) {
      case 'food':
        return {
          icon: 'UtensilsCrossed',
          iconColor: 'text-amber-500',
          title: 'Food Item Settings',
          titleColor: 'text-amber-500',
          showPreparationTime: true,
          showAllergens: true,
          showNutritionalInfo: true,
          showSpiceLevel: true
        };
      case 'drinks_wine':
        return {
          icon: 'Wine',
          iconColor: 'text-purple-500',
          title: 'Drinks & Wine Details',
          titleColor: 'text-purple-500',
          showDrinkType: true,
          showAlcoholContent: true,
          showServingTemperature: true,
          showServingSizes: true
        };
      case 'coffee_desserts':
        return {
          icon: 'Coffee',
          iconColor: 'text-orange-500',
          title: 'Coffee & Desserts Item',
          titleColor: 'text-orange-500',
          showStreamlined: true,
          showSpecialtyNotes: true
        };
      default:
        return {
          icon: 'Info',
          iconColor: 'text-gray-500',
          title: 'Select Item Type',
          titleColor: 'text-gray-500',
          showPrompt: true
        };
    }
  };

  return { fieldsConfig: getFieldsConfig() };
}
