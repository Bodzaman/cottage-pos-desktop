












import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, X, Loader2 } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { BulkActionsToolbar } from 'components/MenuItemFormBulkActionsToolbar';
import { MenuItemFormHeader } from 'components/MenuItemFormHeader';
import { MenuItemFormActions } from 'components/MenuItemFormActions';
import { MenuItemConfigurationBanner } from 'components/MenuItemConfigurationBanner';
import { 
  MenuItemFormErrorDisplay,
  MenuItemFormBasicInfoSectionWrapper,
  MenuItemFormTypeSpecificSectionWrapper,
  MenuItemFormMediaSectionWrapper,
  MenuItemFormVariantsSectionWrapper,
  MenuItemFormPricingSectionWrapper
} from 'components/MenuItemFormSectionWrappers';
import {
  SaveTemplateDialog,
  DraftRestoreDialog,
  CancelConfirmationDialog
} from 'components/MenuItemFormDialogs';
import { MenuItemFormData } from '../utils/masterTypes';
import { MenuCategory, MenuVariant, MenuCategory as MenuCategoryType, MenuVariant as MenuVariantType } from '../utils/menuTypes';
import { MenuItemConfiguration, detectConfigurationFromItem } from '../utils/menuItemConfiguration';
import { apiClient } from 'app';
import { menuItemFormSchema } from '../utils/menuFormValidation';
import { validateItemPricing, getVariantSummary } from '../utils/variantPricing';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MenuItemFormStepper } from './MenuItemFormStepper';
import { getStepsWithStatus, getNextIncompleteStep, type FormStep } from '../utils/menuFormSteps';

/**
 * Map form field names to user-friendly labels for error messages
 * 
 * @param fieldName - The form field name from react-hook-form
 * @returns User-friendly label for the field
 */
function getFieldLabel(fieldName: string): string {
  const fieldLabels: Record<string, string> = {
    name: 'Item Name',
    category_id: 'Category',
    price: 'Price',
    price_dine_in: 'Dine-In Price',
    price_takeaway: 'Takeaway Price',
    price_delivery: 'Delivery Price',
    variants: 'At least one variant',
    description: 'Description',
    spice_level: 'Spice Level',
    kitchen_display_name: 'Kitchen Display Name',
    menu_item_description: 'Menu Description',
  };
  
  return fieldLabels[fieldName] || fieldName;
}

/**
 * Helper function to generate variant_name field
 * Format: "{PROTEIN_NAME} {item_name}"
 * 
 * @param variantName - The protein/variant name (e.g., "CHICKEN", "LAMB")
 * @param itemName - The base menu item name (e.g., "Tikka Masala")
 * @returns Generated variant_name (e.g., "CHICKEN Tikka Masala")
 */
function generateVariantName(variantName: string, itemName: string): string {
  if (!variantName || !itemName) return '';
  return `${variantName.toUpperCase()} ${itemName}`;
}

/**
 * Props interface for MenuItemForm component
 * 
 * @property {MenuItemFormData} [menuItem] - Existing menu item data (for editing)
 * @property {MenuItemFormData} [initialData] - Initial form values (alternative to menuItem)
 * @property {MenuCategory[]} categories - Available menu categories
 * @property {ProteinType[]} [proteinTypes] - Available protein types for variants
 * @property {MenuItemConfiguration} [configuration] - Configuration from wizard (for new items)
 * @property {Function} [onSave] - Custom save handler (overrides default API call)
 * @property {Function} [onSuccess] - Callback after successful save
 * @property {Function} onCancel - Handler for cancel action
 * @property {boolean} [isLoading] - External loading state
 * @property {boolean} [isEditing] - Whether form is in edit mode
 * @property {string} [itemType] - Item category type: 'food' | 'drinks_wine' | 'coffee_desserts' (DEPRECATED - use configuration)
 * @property {string} [initialItemType] - Initial variant type: 'single' | 'variants' (DEPRECATED - use configuration)
 */
interface Props {
  menuItem?: MenuItemFormData;
  initialData?: MenuItemFormData;
  categories: MenuCategory[];
  proteinTypes?: ProteinType[];
  configuration?: MenuItemConfiguration; // NEW: Configuration from wizard
  onSave?: (data: MenuItemFormData) => Promise<void>;
  onSuccess?: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  itemType?: 'food' | 'drinks_wine' | 'coffee_desserts' | null; // DEPRECATED
  initialItemType?: 'single' | 'variants' | null; // DEPRECATED
}

/**
 * MenuItemForm - Comprehensive form for creating and editing menu items
 * 
 * Features:
 * - Zod schema validation with real-time error display
 * - Auto-save draft system (30s intervals)
 * - Unsaved changes protection (browser navigation blocking)
 * - Template save/load functionality
 * - Bulk operations (duplicate, copy prices, reset)
 * - Progressive disclosure with completion tracking
 * - Full accessibility (ARIA, keyboard navigation, screen reader support)
 * - Error recovery with sessionStorage backup
 * - Retry mechanism for failed submissions
 * 
 * Architecture:
 * - Decomposed into focused sub-components (Header, Actions, Sections, Dialogs)
 * - Performance optimized with React.memo, useMemo, useCallback
 * - Single source of truth for variant data
 * - Shared validation logic with backend (menuFormValidation.ts)
 * 
 * @example
 * ```tsx
 * <MenuItemForm
 *   categories={categories}
 *   proteinTypes={proteinTypes}
 *   onCancel={() => navigate('/admin')}
 *   onSuccess={() => toast.success('Item saved!')}
 *   isEditing={false}
 *   itemType="food"
 *   initialItemType="single"
 * />
 * ```
 */
function MenuItemForm({ 
  menuItem, 
  initialData, 
  categories, 
  proteinTypes,
  configuration: propConfiguration,
  onSave, 
  onSuccess, 
  onCancel, 
  isLoading = false,
  isEditing = false,
  itemType = null,
  initialItemType = null
}: Props) {
  console.log('🎨 [MenuItemForm] Component rendering with props:', {
    hasMenuItem: !!menuItem,
    hasInitialData: !!initialData,
    categoriesProp: categories,
    categoriesLength: categories?.length,
    categoriesType: typeof categories,
    itemType,
    initialItemType,
    configuration: propConfiguration,
    isEditing,
    categoriesPreview: categories?.slice(0, 2).map(c => ({ id: c.id, name: c.name }))
  });

  // ✅ CRITICAL: Initialize itemData FIRST (before any hooks that reference it)
  const itemData = menuItem || initialData;

  // Determine configuration (from prop or detect from existing item)
  const configuration = useMemo<MenuItemConfiguration | null>(() => {
    if (propConfiguration) {
      return propConfiguration;
    }
    if (menuItem || initialData) {
      return detectConfigurationFromItem(menuItem || initialData);
    }
    // Fallback to deprecated props for backward compatibility
    if (itemType || initialItemType) {
      return {
        itemType: (itemType || 'food') as 'food' | 'drinks_wine' | 'coffee_desserts',
        pricingMode: (initialItemType === 'variants' ? 'variants' : 'single') as 'single' | 'variants',
        configuredAt: new Date(),
        isLocked: false
      };
    }
    return null;
  }, [propConfiguration, menuItem, initialData, itemType, initialItemType]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<MenuVariant[]>(
    itemData?.variants ? itemData.variants.map((v: any, index: number) => ({
      id: v.id,
      protein_type_id: v.protein_type_id,
      name: v.name,
      description: v.description || '',
      description_state: v.description_state || 'inherited',
      price: v.price && v.price > 0 ? v.price : 0.01,
      price_dine_in: v.price_dine_in || 0,
      price_delivery: v.price_delivery || 0,
      is_default: v.is_default || false,
      image_url: v.image_url || '',
      image_asset_id: v.image_asset_id || '',
      image_state: v.image_state || 'inherited',
      display_order: v.display_order ?? index,
      spice_level: v.spice_level || 0,
      allergens: v.allergens || [],
      allergen_notes: v.allergen_notes || '',
      is_vegetarian: v.is_vegetarian || false,
      is_vegan: v.is_vegan || false,
      is_gluten_free: v.is_gluten_free || false,
      is_halal: v.is_halal || false,
      is_dairy_free: v.is_dairy_free || false,
      is_nut_free: v.is_nut_free || false,
      featured: v.featured || false,
    })) : []
  );
  const [retryCount, setRetryCount] = useState(0);
  
  // 🆕 Screen reader status messages (Phase 3.4)
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 🆕 Phase 2.4: Collapsible sections state
  const [sectionsExpanded, setSectionsExpanded] = useState({
    basic: true,
    typeSpecific: true,
    media: false,
    variants: true,
    pricing: true
  });
  
  // Toggle section expansion handler
  const toggleSection = useCallback((sectionKey: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  }, []);
  
  // Autosave Draft System State
  const [lastAutosaveTime, setLastAutosaveTime] = useState<Date | null>(null);
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  
  // 🆕 Phase 2.1: Unsaved Changes Dialog State
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // ✅ MOVED UP: itemData now initialized at the top (line after console.log)
  const [selectedCategory, setSelectedCategory] = useState<string>(itemData?.category_id || '');
  
  const getInitialHasVariants = (): boolean => {
    // 🎯 PRIORITY 1: Check configuration from wizard (NEW)
    if (configuration && !configuration.isLocked) {
      return configuration.pricingMode === 'variants';
    }
    
    // 🎯 PRIORITY 2: Check existing item data (EDIT mode)
    if (isEditing && itemData) {
      return itemData.has_variants || false;
    }
    
    // 🎯 PRIORITY 3: Fallback to deprecated props for backward compatibility
    if (initialItemType) {
      return initialItemType === 'variants';
    }
    
    return false;
  };

  // 🆕 PHASE 2.5: Template Management State
  const [savedTemplates, setSavedTemplates] = useState<Array<{id: string, name: string, data: any}>>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [loadTemplateDialogOpen, setLoadTemplateDialogOpen] = useState(false);

  // 🆕 PHASE 2.5: Load templates from localStorage on mount
  useEffect(() => {
    try {
      const templatesJson = localStorage.getItem('menuItemTemplates');
      if (templatesJson) {
        setSavedTemplates(JSON.parse(templatesJson));
      }
    } catch (e) {
      console.warn('Failed to load templates:', e);
    }
  }, []);

  // Form state
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, touchedFields, isValid },
    reset,
    getValues,
    setFocus,
    control // ✅ ADD: Need control for useWatch
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
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
      has_variants: getInitialHasVariants(),
      // Transform variants to only include schema-compliant fields
      variants: itemData?.variants ? itemData.variants.map((v: any, index: number) => ({
        id: v.id,
        protein_type_id: v.protein_type_id,
        name: v.name, // API already transforms variant_name → name
        description: v.description || '',
        description_state: v.description_state || 'inherited',
        price: v.price && v.price > 0 ? v.price : 0.01, // Ensure minimum price
        price_dine_in: v.price_dine_in || 0,
        price_delivery: v.price_delivery || 0,
        is_default: v.is_default || false,
        image_url: v.image_url || '',
        image_asset_id: v.image_asset_id || '',
        image_state: v.image_state || 'inherited',
        display_order: v.display_order ?? index, // REQUIRED FIELD - use index as fallback
        spice_level: v.spice_level || 0,
        allergens: v.allergens || [],
        allergen_notes: v.allergen_notes || '',
        // Dietary fields
        is_vegetarian: v.is_vegetarian || false,
        is_vegan: v.is_vegan || false,
        is_gluten_free: v.is_gluten_free || false,
        is_halal: v.is_halal || false,
        is_dairy_free: v.is_dairy_free || false,
        is_nut_free: v.is_nut_free || false,
        featured: v.featured || false,
      })) : [],
      image_url: itemData?.image_url || '',
      image_url_widescreen: itemData?.image_url_widescreen || '',
      image_asset_id: itemData?.image_asset_id || '',
      image_widescreen_asset_id: itemData?.image_widescreen_asset_id || '',
      preferred_aspect_ratio: itemData?.preferred_aspect_ratio || 'square',
      price: itemData?.price ?? undefined,
      price_takeaway: itemData?.price_takeaway ?? undefined,
      price_dine_in: itemData?.price_dine_in ?? undefined,
      price_delivery: itemData?.price_delivery ?? undefined,
    }
  });

  // Unsaved Changes Protection
  const backupKey = `menuItemForm_backup_${itemData?.id || 'new'}`;
  const draftKey = `menuItemForm_draft_${itemType || 'food'}_${isEditing ? itemData?.id : 'new'}`;

  // 🆕 Phase 2.4: Form completion tracking (moved after useForm hook)
  /**
   * Calculate form completion percentage
   * 
   * Tracks completion of:
   * - Required fields (name, category_id)
   * - Pricing (at least one price type)
   * - Variants (if has_variants=true)
   * - Optional but valuable fields (description, image_url)
   * 
   * @returns {number} Completion percentage (0-100)
   */
  
  // ✅ FIX: Use useWatch instead of watch() to avoid render loop
  const formData = useWatch({ control });
  
  const completionPercentage = useMemo(() => {
    if (!formData) return 0;
    
    let completedFields = 0;
    let totalFields = 0;
    
    // Required fields
    const requiredFields = ['name', 'category_id'];
    totalFields += requiredFields.length;
    completedFields += requiredFields.filter(field => {
      const value = formData[field];
      return value && String(value).trim() !== '';
    }).length;
    
    // Pricing (at least one price type)
    totalFields += 1;
    if ((formData.price && formData.price > 0) ||
        (formData.price_dine_in && formData.price_dine_in > 0) ||
        (formData.price_takeaway && formData.price_takeaway > 0) ||
        (formData.price_delivery && formData.price_delivery > 0)) {
      completedFields += 1;
    }
    
    // Variants (if applicable)
    if (formData.has_variants) {
      totalFields += 1;
      if (variants && variants.length > 0) {
        completedFields += 1;
      }
    }
    
    // Optional but valuable fields
    const optionalFields = ['description', 'image_url'];
    totalFields += optionalFields.length;
    completedFields += optionalFields.filter(field => {
      const value = formData[field];
      return value && String(value).trim() !== '';
    }).length;
    
    return Math.round((completedFields / totalFields) * 100);
  }, [formData]);
  
  // 🆕 Phase 2.4: Estimated time to complete (in minutes)
  /**
   * Estimate time remaining to complete form
   * 
   * Based on completion percentage.
   * Assumes 30 seconds per 10% of form = 3 minutes for full form.
   * 
   * @returns {number} Estimated minutes remaining (minimum 1)
   */
  const estimatedTimeMinutes = useMemo(() => {
    const remaining = 100 - completionPercentage;
    // Rough estimate: 30 seconds per 10% of form = 3 minutes for full form
    return Math.max(1, Math.round((remaining / 100) * 3));
  }, [completionPercentage]);

  // Autosave Draft System - Check for existing draft on mount
  /**
   * Check for existing draft on component mount
   * 
   * Automatically detects and offers to restore:
   * - Drafts saved within last 24 hours
   * - Only for new items (not when editing)
   * 
   * Older drafts are automatically cleared.
   */
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && !isEditing) { // Only restore for new items
        const draft = JSON.parse(savedDraft);
        const draftAge = Date.now() - new Date(draft.timestamp).getTime();
        
        // Only show restore dialog if draft is less than 24 hours old
        if (draftAge < 24 * 60 * 60 * 1000) {
          setDraftData(draft);
          setShowDraftRestoreDialog(true);
        } else {
          // Clear old drafts
          localStorage.removeItem(draftKey);
        }
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  }, [draftKey, isEditing]);

  // ✅ CRITICAL FIX: Load existing variants when editing
  useEffect(() => {
    if (isEditing && itemData?.variants && Array.isArray(itemData.variants)) {
      setVariants(itemData.variants);
      setValue('variants', itemData.variants);
    }
  }, [isEditing, itemData?.variants, setValue]);

  // ✅ AUTO-SYNC: Keep has_variants in sync with variants array length
  /**
   * Auto-sync has_variants field with variants array length
   * 
   * This ensures the has_variants boolean always reflects the actual state:
   * - has_variants = true when variants.length > 0
   * - has_variants = false when variants.length === 0
   * 
   * Prevents validation conflicts where has_variants=true but variants array is empty.
   * Uses shouldDirty=false to avoid triggering unsaved changes warning.
   */
  useEffect(() => {
    const hasVariantsComputed = variants.length > 0;
    const currentHasVariants = watch('has_variants');
    
    // Only update if there's a mismatch
    if (hasVariantsComputed !== currentHasVariants) {
      console.log('🔄 Auto-syncing has_variants:', {
        variantsCount: variants.length,
        currentHasVariants,
        newHasVariants: hasVariantsComputed
      });
      setValue('has_variants', hasVariantsComputed, { shouldDirty: false });
    }
  }, [variants, watch, setValue]);

  // 🐛 DEBUG: Log form validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('🚨 [MenuItemForm] Validation Errors:', {
        errorCount: Object.keys(errors).length,
        errors: errors,
        errorFields: Object.keys(errors),
        errorMessages: Object.entries(errors).map(([field, error]) => ({
          field,
          message: error?.message,
          type: error?.type
        })),
        formData: {
          has_variants: watch('has_variants'),
          variantsCount: variants?.length,
          name: watch('name'),
          category_id: watch('category_id')
        }
      });
    }
  }, [errors, watch, variants]);

  // Autosave Draft System - Auto-save every 30 seconds
  /**
   * Auto-save draft system
   * 
   * Saves form data to localStorage every 30 seconds when form has changes.
   * 
   * Draft payload includes:
   * - All form field values
   * - Variant data
   * - Timestamp
   * - Item type
   * 
   * Only runs when form is dirty (has unsaved changes).
   */
  useEffect(() => {
    if (!isDirty) return; // Don't save if form is pristine

    const autosaveInterval = setInterval(() => {
      try {
        const currentValues = watch();
        const draftPayload = {
          formData: currentValues,
          variants,
          timestamp: new Date().toISOString(),
          itemType,
        };
        
        localStorage.setItem(draftKey, JSON.stringify(draftPayload));
        setLastAutosaveTime(new Date());
        console.log('📝 Draft auto-saved:', new Date().toLocaleTimeString());
      } catch (e) {
        console.warn('Failed to auto-save draft:', e);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autosaveInterval);
  }, [isDirty, watch, variants, draftKey, itemType]);

  // Handle draft restore
  /**
   * Restore draft data from localStorage
   * 
   * Restores:
   * - All form field values using setValue()
   * - Variant array data
   * 
   * Sets shouldDirty=true to trigger unsaved changes protection.
   */
  const handleRestoreDraft = useCallback(() => {
    if (!draftData) return;

    try {
      const { formData, variants: draftVariants } = draftData;
      
      // Restore all form fields
      Object.keys(formData).forEach((key) => {
        setValue(key as any, formData[key], { shouldDirty: true });
      });
      
      // Restore variants
      if (draftVariants) {
        setVariants(draftVariants);
      }
      
      setShowDraftRestoreDialog(false);
      toast.success('Draft restored successfully!');
    } catch (e) {
      console.error('Failed to restore draft:', e);
      toast.error('Failed to restore draft');
    }
  }, [draftData, setValue]);

  // Handle discard draft
  /**
   * Discard saved draft
   * 
   * Removes draft from localStorage and clears draft state.
   * Used by both the restore dialog ("Discard" button)
   * and the header (manual discard button).
   */
  const handleDiscardDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
      setShowDraftRestoreDialog(false);
      setDraftData(null);
      setLastAutosaveTime(null);
      toast.info('Draft discarded');
    } catch (e) {
      console.warn('Failed to discard draft:', e);
    }
  }, [draftKey]);

  // Manual discard draft button
  /**
   * Manual draft discard with confirmation
   * 
   * Shows native browser confirm dialog before discarding.
   * Used by the header "Discard Draft" button.
   */
  const handleManualDiscardDraft = useCallback(() => {
    if (confirm('Are you sure you want to discard the auto-saved draft? This cannot be undone.')) {
      handleDiscardDraft();
    }
  }, [handleDiscardDraft]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  /**
   * Handle cancel action with unsaved changes check
   * 
   * Shows confirmation dialog if form has changes,
   * otherwise cancels immediately.
   */
  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  }, [isDirty, onCancel]);

  // Watch has_variants field for use in onSubmit
  const hasVariants = watch('has_variants');

  // Handle form submission
  /**
   * Submit handler with comprehensive pricing validation
   * 
   * ✅ Phase 2.4: Enhanced with user-friendly pricing validation
   * - Calls validateItemPricing() for authoritative validation
   * - Displays actionable error messages with guidance
   * - Auto-scrolls to pricing section on validation failure
   * - Shows non-blocking warnings as informational toasts
   */
  const onSubmit = useCallback(async (data: MenuItemFormData) => {
    // Backup to sessionStorage before submission
    try {
      sessionStorage.setItem(backupKey, JSON.stringify({
        formData: data,
        variants,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Failed to backup form data:', e);
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setStatusMessage(isEditing ? 'Updating menu item...' : 'Creating menu item...'); // Announce start
      setErrorMessage(''); // Clear previous errors
      
      // ✅ VALIDATION STEP 1: Item name (basic requirement)
      if (!data.name.trim()) {
        const errorMsg = 'Item name is required';
        setSubmitError(errorMsg);
        setErrorMessage(errorMsg);
        toast.error('⚠️ Missing Required Field', {
          description: errorMsg,
          duration: 5000,
        });
        setIsSubmitting(false);
        return;
      }

      // ✅ VALIDATION STEP 2: Category selection (MUST come before pricing)
      // Auto-assign category for specialized item types
      if (itemType === 'drinks_wine') {
        data.category_id = 'category-drinks-wine';
      } else if (itemType === 'coffee_desserts') {
        data.category_id = 'category-coffee-desserts';
      }
      
      // Block submission if no category selected
      if (!data.category_id) {
        const errorMsg = 'Please select a category from the dropdown above';
        setSubmitError(errorMsg);
        setErrorMessage(errorMsg);
        
        toast.error('🚨 Category Required', {
          description: 'You must select a category before creating a menu item.',
          duration: 7000,
        });
        
        // Auto-scroll to category section (Basic Information)
        setTimeout(() => {
          const categorySection = document.querySelector('[data-section="basicInfo"]') || 
                                   document.querySelector('select[name="category_id"]')?.closest('.space-y-4');
          if (categorySection) {
            categorySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        setIsSubmitting(false);
        return;
      }

      // ✅ VALIDATION STEP 3: Pricing validation
      // Single source of truth: validateItemPricing() from variantPricing.ts
      const pricingValidation = validateItemPricing(
        {
          price: data.price || 0,
          price_dine_in: data.price_dine_in || 0,
          price_takeaway: data.price_takeaway || 0,
          price_delivery: data.price_delivery || 0,
          has_variants: hasVariants
        },
        variants
      );

      // Block submission if pricing validation fails
      if (!pricingValidation.isValid) {
        const errorMsg = pricingValidation.errors.join('\n\n');
        setSubmitError(errorMsg);
        setErrorMessage(errorMsg);
        setHasPricingError(true);
        
        toast.error('🚨 Pricing Configuration Required', {
          description: pricingValidation.errors[0], // Show first error (most relevant)
          duration: 7000,
        });
        
        // Auto-scroll to pricing section
        setTimeout(() => {
          const pricingSection = document.querySelector('[data-section="pricing"]') || 
                                 document.querySelector('.pricing-section');
          if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        setIsSubmitting(false);
        return;
      }

      // ✅ Clear pricing error if validation passed
      setHasPricingError(false);

      // ⚠️ Show non-blocking warnings (informational)
      if (pricingValidation.warnings.length > 0) {
        pricingValidation.warnings.forEach(warning => {
          toast.warning('💡 Pricing Notice', {
            description: warning,
            duration: 4000
          });
        });
      }
      
      // ✅ VALIDATION STEP 4: Media Asset Validation (Layer 2 - Frontend)
      // Validate image_asset_id and image_widescreen_asset_id exist in database
      const assetIdsToValidate: string[] = [];
      if (data.image_asset_id && data.image_asset_id.trim()) {
        assetIdsToValidate.push(data.image_asset_id.trim());
      }
      if (data.image_widescreen_asset_id && data.image_widescreen_asset_id.trim()) {
        assetIdsToValidate.push(data.image_widescreen_asset_id.trim());
      }
      
      if (assetIdsToValidate.length > 0) {
        try {
          const validationResponse = await apiClient.validate_media_assets({
            asset_ids: assetIdsToValidate
          });
          
          const validationData = await validationResponse.json();
          
          if (validationData.success && !validationData.all_valid) {
            // Some assets are invalid - clear them and show warning (non-blocking)
            const invalidAssets = validationData.results.filter((r: any) => !r.is_valid);
            
            invalidAssets.forEach((asset: any) => {
              if (asset.asset_id === data.image_asset_id) {
                data.image_asset_id = '';
                toast.warning('📸 Image Not Available', {
                  description: 'The selected square image is no longer available and has been cleared. You can continue without it or select a new image.',
                  duration: 6000
                });
              }
              if (asset.asset_id === data.image_widescreen_asset_id) {
                data.image_widescreen_asset_id = '';
                toast.warning('📸 Image Not Available', {
                  description: 'The selected widescreen image is no longer available and has been cleared. You can continue without it or select a new image.',
                  duration: 6000
                });
              }
            });
          }
        } catch (error) {
          // Validation endpoint failed - log but don't block submission
          console.warn('⚠️ [Media Validation] Failed to validate assets (non-blocking):', error);
          // Continue with submission - backend Layer 3 will catch any issues
        }
      }
      
      // ✅ All validations passed - proceed with submission
      if (itemData?.id) {
        data.id = itemData.id;
      }
      
      const cleanedData = {
        ...data,
        // ✅ Only send image_asset_id if it's actually set and not empty
        image_asset_id: data.image_asset_id && data.image_asset_id.trim() !== '' ? data.image_asset_id : null,
        image_widescreen_asset_id: data.image_widescreen_asset_id && data.image_widescreen_asset_id.trim() !== '' ? data.image_widescreen_asset_id : null,
        price: watch('price'),
        price_takeaway: watch('price_takeaway'),
        price_dine_in: watch('price_dine_in'),
        price_delivery: watch('price_delivery'),
      };
      
      const submissionData = {
        ...cleanedData,
        has_variants: hasVariants,
        variants: hasVariants ? variants : [],
        display_order: cleanedData.menu_order || 0,
        item_type: itemType || 'food',
      };
      
      delete submissionData.menu_order;
      
      // 🔍 DEBUG: Log complete submission payload
      console.log('\n' + '='.repeat(80));
      console.log('🔍 [FORM SUBMISSION DEBUG] Menu Item Save Payload');
      console.log('='.repeat(80));
      console.log('Operation:', itemData?.id ? 'UPDATE' : 'CREATE');
      console.log('Item ID:', itemData?.id || 'NEW');
      console.log('Item Name:', submissionData.name);
      console.log('Has Variants:', submissionData.has_variants);
      console.log('\n📸 IMAGE ASSET DATA:');
      console.log('  image_asset_id:', submissionData.image_asset_id || '(not set)');
      console.log('  image_widescreen_asset_id:', submissionData.image_widescreen_asset_id || '(not set)');
      console.log('\n💰 PRICING DATA:');
      console.log('  price:', submissionData.price);
      console.log('  price_takeaway:', submissionData.price_takeaway);
      console.log('  price_dine_in:', submissionData.price_dine_in);
      console.log('  price_delivery:', submissionData.price_delivery);
      if (submissionData.has_variants && submissionData.variants?.length > 0) {
        console.log('\n🔄 VARIANTS DATA:');
        submissionData.variants.forEach((v: any, idx: number) => {
          console.log(`  Variant ${idx + 1}: ${v.name}`);
          console.log(`    - image_asset_id: ${v.image_asset_id || '(not set)'}`);
          console.log(`    - price: £${v.price}`);
        });
      }
      console.log('\n📦 Full Payload:', JSON.stringify(submissionData, null, 2));
      console.log('='.repeat(80) + '\n');
      
      let response;
      
      if (onSave) {
        await onSave(submissionData);
        
        // ✅ Success handling moved inside proper validation
        // Clear both sessionStorage backup AND localStorage draft on success
        sessionStorage.removeItem(backupKey);
        localStorage.removeItem(draftKey);
        setLastAutosaveTime(null);
        setRetryCount(0);
        
        setStatusMessage(isEditing ? 'Menu item updated successfully' : 'Menu item created successfully');
        setTimeout(() => setStatusMessage(''), 3000);
        
        toast.success(isEditing ? 'Menu item updated successfully!' : 'Menu item created successfully!');
        
        if (onSuccess) {
          onSuccess();
        }
      } else if (onSuccess) {
        if (itemData?.id) {
          response = await apiClient.update_menu_item({ itemId: itemData.id }, submissionData);
        } else {
          response = await apiClient.create_menu_item(submissionData);
        }
        
        if (!response.ok) {
          // ✅ ENHANCED: Parse validation errors from backend
          const errorData = await response.json().catch(() => null);
          
          if (response.status === 422 && errorData?.detail) {
            // FastAPI validation error format
            if (Array.isArray(errorData.detail)) {
              const validationErrors = errorData.detail.map((err: any) => {
                const field = err.loc?.join('.') || 'unknown';
                return `${field}: ${err.msg}`;
              }).join('\n');
              throw new Error(`Validation failed:\n${validationErrors}`);
            } else {
              throw new Error(errorData.detail);
            }
          }
          
          const errorMessage = errorData?.error || errorData?.message || 'Failed to save menu item';
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to save menu item');
        }
        
        // ✅ Success handling - only executes if no errors thrown above
        sessionStorage.removeItem(backupKey);
        localStorage.removeItem(draftKey);
        setLastAutosaveTime(null);
        setRetryCount(0);
        
        setStatusMessage(isEditing ? 'Menu item updated successfully' : 'Menu item created successfully');
        setTimeout(() => setStatusMessage(''), 3000);
        
        toast.success(isEditing ? 'Menu item updated successfully!' : 'Menu item created successfully!');
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        if (itemData?.id) {
          response = await apiClient.update_menu_item({ itemId: itemData.id }, submissionData);
        } else {
          response = await apiClient.create_menu_item(submissionData);
        }
        
        if (!response.ok) {
          // ✅ ENHANCED: Parse validation errors from backend
          const errorData = await response.json().catch(() => null);
          
          if (response.status === 422 && errorData?.detail) {
            // FastAPI validation error format
            if (Array.isArray(errorData.detail)) {
              const validationErrors = errorData.detail.map((err: any) => {
                const field = err.loc?.join('.') || 'unknown';
                return `${field}: ${err.msg}`;
              }).join('\n');
              throw new Error(`Validation failed:\n${validationErrors}`);
            } else {
              throw new Error(errorData.detail);
            }
          }
          
          const errorMessage = errorData?.error || errorData?.message || 'Failed to save menu item';
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to save menu item');
        }
        
        // ✅ Success handling - only executes if no errors thrown above
        sessionStorage.removeItem(backupKey);
        localStorage.removeItem(draftKey);
        setLastAutosaveTime(null);
        setRetryCount(0);
        
        setStatusMessage(isEditing ? 'Menu item updated successfully' : 'Menu item created successfully');
        setTimeout(() => setStatusMessage(''), 3000);
        
        toast.success(isEditing ? 'Menu item updated successfully!' : 'Menu item created successfully!');
        
        if (onSuccess) {
          onSuccess();
        }
      }
      
      // ✅ Reset form only after successful creation (not update)
      if (!itemData?.id) {
        reset();
        setSelectedCategory('');
        setVariants([]);
      }
      
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      const errorMsg = error.message || `Failed to ${itemData?.id ? 'update' : 'create'} menu item`;
      setSubmitError(errorMsg);
      setErrorMessage(errorMsg); // Announce error to screen readers
      toast.error(errorMsg);
      
      // Auto-focus first field with error
      if (Object.keys(errors).length > 0) {
        const firstErrorField = Object.keys(errors)[0] as keyof MenuItemFormData;
        try {
          setFocus(firstErrorField);
          // Scroll to the field
          setTimeout(() => {
            const element = document.querySelector(`[name="${firstErrorField}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } catch (e) {
          console.warn('Could not focus error field:', e);
        }
      }
      
      // Retry logic with exponential backoff (only for non-validation errors)
      if (retryCount < 3 && !error.message?.includes('required') && !error.message?.includes('Validation failed')) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleSubmit(onSubmit)();
        }, delay);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [backupKey, variants, hasVariants, itemType, itemData, watch, onSave, onSuccess, draftKey, isEditing, reset, setSelectedCategory, setVariants, errors, setFocus, retryCount, handleSubmit]);

  /**
   * Handle form validation failures
   * Called by react-hook-form when validation fails before onSubmit
   * 
   * Shows toast notification with specific field name
   * Auto-scrolls to first error field
   * Focuses the field for immediate correction
   */
  const onInvalid = useCallback((errors: FieldErrors<MenuItemFormData>) => {
    console.log('❌ [FORM VALIDATION] Validation failed:', errors);
    
    // Get first error field
    const firstErrorField = Object.keys(errors)[0];
    if (!firstErrorField) return;
    
    // Get user-friendly label
    const fieldLabel = getFieldLabel(firstErrorField);
    const errorMessage = errors[firstErrorField]?.message;
    
    // Show toast notification
    toast.error(`Missing required field: ${fieldLabel}`, {
      description: errorMessage ? String(errorMessage) : undefined,
      duration: 4000,
    });
    
    // Auto-scroll to field
    setTimeout(() => {
      const fieldElement = document.querySelector(`[name="${firstErrorField}"]`);
      
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus the field
        if (fieldElement instanceof HTMLElement) {
          fieldElement.focus();
        }
      }
    }, 100);
    
    // Also use existing setFocus for react-hook-form awareness
    try {
      setFocus(firstErrorField as keyof MenuItemFormData);
    } catch (e) {
      console.warn('Could not focus field via setFocus:', e);
    }
  }, [setFocus]);

  // 🆕 Phase 3.2: Global keyboard shortcuts handler
  /**
   * Global keyboard shortcuts handler
   * 
   * Shortcuts:
   * - Ctrl/Cmd + Enter: Submit form (disabled in textareas)
   * - Escape: Cancel form (only when no dialogs open)
   * 
   * Smart detection:
   * - Skips Enter shortcut when typing in text inputs
   * - Skips Escape when modal dialogs are open
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in a textarea or contenteditable
      const target = e.target as HTMLElement;
      const isTextInput = 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.tagName === 'INPUT' && target.getAttribute('type') !== 'checkbox' && target.getAttribute('type') !== 'radio');

      // Enter to submit (only works when NOT in textarea)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSubmitting) {
        e.preventDefault();
        handleSubmit(onSubmit)();
        return;
      }

      // Escape to cancel
      if (e.key === 'Escape' && !isSubmitting) {
        // Don't close if there's an open dialog
        const hasOpenDialog = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (!hasOpenDialog) {
          e.preventDefault();
          handleCancel();
        }
        return;
      }
    };

    // Attach keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSubmit, onSubmit, isSubmitting, handleCancel]);

  // ... existing useEffects for initialization and category auto-populate ...

  // Handle pricing updates
  const handlePricingChange = useCallback((pricingData: PricingData) => {
    setValue('price', pricingData.price || 0, { shouldDirty: true });
    setValue('price_takeaway', pricingData.price_takeaway || 0, { shouldDirty: true });
    setValue('price_dine_in', pricingData.price_dine_in || 0, { shouldDirty: true });
    setValue('price_delivery', pricingData.price_delivery || 0, { shouldDirty: true });
  }, [setValue]);

  // Handle media updates
  const handleMediaChange = useCallback((mediaData: {
    image_url: string;
    image_url_widescreen: string;
    image_asset_id: string;
    image_widescreen_asset_id: string;
    preferred_aspect_ratio: string;
  }) => {
    console.log('🔵 [MenuItemForm handleMediaChange] RECEIVED mediaData:', mediaData);
    console.log('🔵 [MenuItemForm handleMediaChange] image_asset_id value:', mediaData.image_asset_id);
    console.log('🔵 [MenuItemForm handleMediaChange] image_widescreen_asset_id value:', mediaData.image_widescreen_asset_id);
    
    setValue('image_url', mediaData.image_url, { shouldDirty: true });
    setValue('image_url_widescreen', mediaData.image_url_widescreen, { shouldDirty: true });
    setValue('image_asset_id', mediaData.image_asset_id, { shouldDirty: true });
    console.log('✅ [MenuItemForm handleMediaChange] Called setValue for image_asset_id:', mediaData.image_asset_id);
    setValue('image_widescreen_asset_id', mediaData.image_widescreen_asset_id, { shouldDirty: true });
    console.log('✅ [MenuItemForm handleMediaChange] Called setValue for image_widescreen_asset_id:', mediaData.image_widescreen_asset_id);
    setValue('preferred_aspect_ratio', mediaData.preferred_aspect_ratio, { shouldDirty: true });
  }, [setValue]);

  // Handle variants updates
  const handleVariantsChange = useCallback((hasVariantsValue: boolean, variantsData?: MenuVariant[]) => {
    setValue('has_variants', hasVariantsValue, { shouldDirty: true });
    if (variantsData) {
      setVariants(variantsData);
      setValue('variants', variantsData, { shouldDirty: true });
    }
  }, [setValue]);

  // 🆕 PHASE 3.2: Pricing guide callbacks
  const handleFocusPricing = useCallback(() => {
    setFocus('price_dine_in');
    // Ensure pricing section is expanded
    if (!sectionsExpanded.pricing) {
      toggleSection('pricing');
    }
  }, [setFocus, sectionsExpanded.pricing, toggleSection]);

  const handleAddVariant = useCallback(() => {
    // Enable variant mode
    setValue('has_variants', true, { shouldDirty: true });
    // User will add variants manually via the variants section that appears
  }, [setValue]);

  // Filter categories based on item type
  const filteredCategories = useMemo(() => {
    console.log('🔍 [MenuItemForm] filteredCategories memo:', {
      categoriesProp: categories,
      categoriesLength: categories?.length,
      categoriesType: typeof categories,
      itemType,
      categoriesPreview: categories?.slice(0, 2).map(c => ({ id: c.id, name: c.name }))
    });
    
    if (!categories) return [];
    
    if (itemType === 'drinks_wine') {
      return categories.filter(cat => 
        cat.active && (
          cat.name.toLowerCase().includes('drink') ||
          cat.name.toLowerCase().includes('wine') ||
          cat.name.toLowerCase().includes('beverage') ||
          cat.name.toLowerCase().includes('alcohol')
        )
      );
    }
    
    if (itemType === 'coffee_desserts') {
      return categories.filter(cat => 
        cat.active && (
          cat.name.toLowerCase().includes('coffee') ||
          cat.name.toLowerCase().includes('dessert') ||
          cat.name.toLowerCase().includes('sweet') ||
          cat.name.toLowerCase().includes('tea')
        )
      );
    }
    
    const result = categories.filter(cat => cat.active && !cat.is_protein_type);
    console.log('🎯 [MenuItemForm] FINAL FILTER RESULT for itemType=' + itemType + ':', {
      inputCount: categories?.length,
      outputCount: result.length,
      sampleOutput: result.slice(0, 3).map(c => ({ name: c.name, active: c.active, is_protein_type: c.is_protein_type }))
    });
    return result;
  }, [categories, itemType]);

  // 🆕 PHASE 2.5: Save template to localStorage (moved after useForm)
  const handleSaveAsTemplate = useCallback(() => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      const formData = getValues();
      const newTemplate = {
        id: `template_${Date.now()}`,
        name: templateName.trim(),
        data: {
          formData,
          variants,
          timestamp: new Date().toISOString()
        }
      };

      const updatedTemplates = [...savedTemplates, newTemplate];
      localStorage.setItem('menuItemTemplates', JSON.stringify(updatedTemplates));
      setSavedTemplates(updatedTemplates);
      setTemplateDialogOpen(false);
      setTemplateName('');
      toast.success(`Template "${newTemplate.name}" saved!`);
    } catch (e) {
      console.error('Failed to save template:', e);
      toast.error('Failed to save template');
    }
  }, [templateName, getValues, variants, savedTemplates]);

  // 🆕 PHASE 2.5: Load template (moved after useForm)
  const handleLoadTemplate = useCallback((templateId: string) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (!template) return;

    try {
      const { formData, variants: templateVariants } = template.data;
      
      // Clear form first
      reset();
      
      // Restore all form fields except id and timestamps
      Object.keys(formData).forEach((key) => {
        if (!['id', 'created_at', 'updated_at'].includes(key)) {
          setValue(key as any, formData[key], { shouldDirty: true });
        }
      });
      
      // Restore variants
      if (templateVariants) {
        setVariants(templateVariants);
      }
      
      setLoadTemplateDialogOpen(false);
      toast.success(`Template "${template.name}" loaded!`);
    } catch (e) {
      console.error('Failed to load template:', e);
      toast.error('Failed to load template');
    }
  }, [savedTemplates, reset, setValue]);

  // 🆕 PHASE 2.5: Delete template (moved after useForm)
  const handleDeleteTemplate = useCallback((templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this template? This cannot be undone.')) return;

    try {
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      localStorage.setItem('menuItemTemplates', JSON.stringify(updatedTemplates));
      setSavedTemplates(updatedTemplates);
      toast.success('Template deleted');
    } catch (e) {
      console.error('Failed to delete template:', e);
      toast.error('Failed to delete template');
    }
  }, [savedTemplates]);

  // 🆕 PHASE 2.5: Duplicate current item (moved after useForm)
  const handleDuplicateItem = useCallback(() => {
    if (!confirm('Create a copy of this item? The new item will be created as a draft.')) return;

    try {
      const formData = getValues();
      
      // Clear form
      reset();
      
      // Restore all fields except id, timestamps, and modify name
      Object.keys(formData).forEach((key) => {
        if (!['id', 'created_at', 'updated_at'].includes(key)) {
          let value = formData[key];
          if (key === 'name') {
            value = `${value} (Copy)`;
          }
          if (key === 'active') {
            value = false; // Start duplicates as inactive
          }
          setValue(key as any, value, { shouldDirty: true });
        }
      });
      
      // Duplicate variants
      if (variants.length > 0) {
        setVariants(variants.map(v => ({ ...v, id: undefined })));
      }
      
      toast.success('Item duplicated! Ready to save.');
    } catch (e) {
      console.error('Failed to duplicate item:', e);
      toast.error('Failed to duplicate item');
    }
  }, [getValues, reset, setValue, variants]);

  // 🆕 PHASE 2.5: Copy prices to all types (moved after useForm)
  const handleCopyPricesToAll = useCallback(() => {
    const dineInPrice = watch('price_dine_in');
    if (!dineInPrice || dineInPrice <= 0) {
      toast.error('Please set Dine-In price first');
      return;
    }

    if (!confirm(`Copy Dine-In price (£${dineInPrice.toFixed(2)}) to Takeaway and Delivery?`)) return;

    setValue('price_takeaway', dineInPrice, { shouldDirty: true });
    setValue('price_delivery', dineInPrice, { shouldDirty: true });
    toast.success('Prices copied to all types');
  }, [watch, setValue]);

  // 🆕 PHASE 2.5: Reset form completely (moved after useForm)
  const handleResetForm = useCallback(() => {
    if (!confirm('Reset the entire form? All unsaved changes will be lost.')) return;

    reset();
    setVariants([]);
    setSelectedCategory(null);
    handleDiscardDraft(); // Also clear draft
    toast.success('Form reset');
  }, [reset, handleDiscardDraft]);

  // 🆕 Clear pricing error when pricing is updated
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // If any pricing field changes, clear the error state
      if (name && ['price_dine_in', 'price_takeaway', 'price_delivery', 'price'].includes(name)) {
        setHasPricingError(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // 🎯 Sync has_variants form field from configuration (one-way flow)
  // Configuration drives UI, form field is for database persistence only
  useEffect(() => {
    if (configuration) {
      const shouldHaveVariants = configuration.pricingMode === 'variants';
      setValue('has_variants', shouldHaveVariants, { shouldDirty: false });
    }
  }, [configuration, setValue]);

  // 🎯 NEW: Stepper state management
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(['basic']) // Start with basic info expanded
  );

  // Remove old section expansion state (replaced by stepper)
  // const [sectionsExpanded, setSectionsExpanded] = useState({
  //   basic: true,
  //   typeSpecific: true,
  //   media: false,
  //   variants: true,
  //   pricing: true
  // });
  // const toggleSection = ...

  // 🎯 NEW: Calculate steps with current status
  const formSteps = useMemo<FormStep[]>(() => {
    return getStepsWithStatus(
      configuration,  // ✅ Pass full configuration object
      watch(),       // ✅ Pass formData from watch()
      variants,      // ✅ Pass variants array
      errors         // ✅ Pass validation errors
    );
  }, [configuration, watch, variants, errors]);

  // 🎯 NEW: Auto-expand logic for progressive disclosure
  useEffect(() => {
    // Find the first incomplete required step
    const nextIncomplete = getNextIncompleteStep(formSteps);
    
    if (nextIncomplete && !expandedSteps.has(nextIncomplete.id)) {
      setExpandedSteps(prev => {
        const next = new Set(prev);
        
        // Collapse all previous steps to reduce cognitive load
        const nextIndex = formSteps.findIndex(s => s.id === nextIncomplete.id);
        formSteps.slice(0, nextIndex).forEach(step => {
          next.delete(step.id);
        });
        
        // Expand the next incomplete required step
        next.add(nextIncomplete.id);
        return next;
      });
    }
  }, [formSteps]);

  // 🎯 NEW: Manual step toggle handler
  const handleToggleStep = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  // 🎯 NEW: Scroll to step and expand
  const handleScrollToStep = useCallback((stepId: string) => {
    // Expand the step
    setExpandedSteps(prev => new Set(prev).add(stepId));
    
    // Scroll to step (with small delay for expand animation)
    setTimeout(() => {
      const element = document.getElementById(`step-${stepId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  // 🎯 NEW: Render step content based on step ID
  const renderStepContent = useCallback((stepId: string) => {
    switch (stepId) {
      case 'basic':
        return (
          <MenuItemFormBasicInfoSectionWrapper
            register={register}
            control={control}
            setValue={setValue}
            errors={errors}
            categories={filteredCategories}
            itemType={configuration?.itemType || null}
            hasVariants={hasVariants}
            watch={watch}
            onMediaChange={handleMediaChange}
          />
        );
      
      case 'pricing':
        // Configuration drives UI structure, not form fields
        return configuration?.pricingMode === 'variants' ? (
          <MenuItemFormVariantsSectionWrapper
            configuration={configuration}
            variants={variants}
            onVariantsChange={setVariants}
            proteinTypes={proteinTypes || []}
            baseItemName={watch('name') || ''}
            baseItemDescription={watch('description') || ''}
            baseItemImage={watch('image_url') || ''}
            baseItemImageAssetId={watch('image_asset_id') || ''}
            errors={errors}
          />
        ) : (
          <MenuItemFormPricingSectionWrapper
            configuration={configuration}
            watch={watch}
            setValue={setValue}
            errors={errors}
            sectionExpanded={true}
            onToggleSection={() => {}}
            onFocusPricing={handleFocusPricing}
            onAddVariant={handleAddVariant}
            hasValidationError={hasPricingError}
          />
        );
      
      case 'food-details':
      case 'drinks-details':
      case 'coffee-details':
        return (
          <MenuItemFormTypeSpecificSectionWrapper
            itemType={configuration?.itemType || null}
            register={register}
            watch={watch}
            setValue={setValue}
            control={control}
            errors={errors}
            hasVariants={configuration?.pricingMode === 'variants'}
          />
        );
      
      default:
        return null;
    }
  }, [configuration, variants, register, control, setValue, errors, filteredCategories, watch, proteinTypes, handleMediaChange, handleFocusPricing, handleAddVariant, hasPricingError]);

  return (
    <>
      {/* 🆕 PHASE 3.3: Enhanced Focus Indicators - Global CSS */}
      <style>{`
        /* Enhanced focus indicators for accessibility */
        .menu-item-form input:focus,
        .menu-item-form textarea:focus,
        .menu-item-form select:focus,
        .menu-item-form button:focus-visible,
        .menu-item-form [role="button"]:focus-visible {
          outline: 2px solid ${globalColors.purple.primary};
          outline-offset: 2px;
          border-radius: 4px;
        }
        
        /* Focus for card headers (collapsible sections) */
        .menu-item-form [role="button"]:focus-visible {
          box-shadow: 0 0 0 3px ${globalColors.purple.glow};
        }
        
        /* Ensure focus is always visible */
        .menu-item-form *:focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>

      {/* 🆕 PHASE 3.4: Screen Reader Live Regions */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {errorMessage}
      </div>

      {/* Outer container with flex column layout */}
      <div className="flex flex-col h-full min-h-0">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-6xl mx-auto px-6 pt-6 pb-6">
              {/* 🆕 PHASE 2.5: Bulk Operations Toolbar */}
              <BulkActionsToolbar
                isEditing={isEditing}
                hasVariants={hasVariants}
                savedTemplates={savedTemplates}
                onDuplicateItem={handleDuplicateItem}
                onSaveAsTemplate={handleSaveAsTemplate}
                onLoadTemplate={handleLoadTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onCopyPricesToAll={handleCopyPricesToAll}
                onResetForm={handleResetForm}
              />

              {/* Main Form Container */}
              <div 
                className="p-8 rounded-xl transition-all duration-300 menu-item-form"
                style={{
                  backgroundColor: '#1E1E1E',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  borderBottom: '1px solid rgba(91, 33, 182, 0.15)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Form Header */}
                <MenuItemFormHeader
                  isEditing={isEditing}
                  formTitle={isEditing ? 'Edit Menu Item' : 
                    `Add New ${itemType === 'food' ? 'Food' : 
                      itemType === 'drinks_wine' ? 'Drinks & Wine' : 
                      itemType === 'coffee_desserts' ? 'Coffee & Desserts' : 'Menu'} Item`}
                  isDirty={isDirty}
                  lastAutosaveTime={lastAutosaveTime}
                  completionPercentage={completionPercentage}
                  estimatedTimeMinutes={estimatedTimeMinutes}
                  statusMessage={statusMessage}
                  errorMessage={errorMessage}
                  onDiscardDraft={handleDiscardDraft}
                />

                {/* Error Display */}
                <MenuItemFormErrorDisplay
                  submitError={submitError}
                  errors={errors}
                  shouldShowValidationErrors={
                    // Show validation errors only when:
                    !!submitError ||          // User attempted submit and it failed
                    !!itemData?.id ||         // Editing existing item (validation always on)
                    Object.keys(touchedFields || {}).length > 0  // User has interacted with fields
                  }
                />

                {/* 🆕 Configuration Banner */}
                {configuration && (
                  <MenuItemConfigurationBanner
                    configuration={configuration}
                    variantCount={variants.length}
                  />
                )}

                {/* 🆕 PHASE 2: Pricing Status Panel - Only show for existing items or after submit error */}
                {(() => {
                  // Only show validation for: existing items OR after submit error
                  // Do NOT show during form filling - let users complete the form first
                  const shouldShowPricingValidation = 
                    !!itemData?.id ||       // Editing existing item - show validation
                    hasPricingError;         // Submit failed - show errors
                  
                  if (!shouldShowPricingValidation) {
                    return null; // Don't show validation for brand new forms being filled out
                  }
                  
                  const basePriceIsZero = 
                    (!watch('price') || watch('price') === 0) &&
                    (!watch('price_dine_in') || watch('price_dine_in') === 0) &&
                    (!watch('price_takeaway') || watch('price_takeaway') === 0) &&
                    (!watch('price_delivery') || watch('price_delivery') === 0);
                  
                  const variantSummary = hasVariants && variants.length > 0 
                    ? getVariantSummary(variants, proteinTypes || [])
                    : null;

                  const pricingValidation = validateItemPricing(
                    {
                      price: watch('price') || 0,
                      price_dine_in: watch('price_dine_in') || 0,
                      price_takeaway: watch('price_takeaway') || 0,
                      price_delivery: watch('price_delivery') || 0,
                      has_variants: hasVariants
                    },
                    variants
                  );

                  return (
                    <Alert 
                      className="mb-6 border-purple-500/20" 
                      style={{ 
                        backgroundColor: 'rgba(91, 33, 182, 0.1)',
                        borderColor: pricingValidation.isValid ? 'rgba(91, 33, 182, 0.3)' : 'rgba(239, 68, 68, 0.5)'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {pricingValidation.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">Pricing Configuration</h4>
                            <Badge variant={pricingValidation.isValid ? 'default' : 'destructive'} className="text-xs">
                              {pricingValidation.isValid ? 'Valid' : 'Invalid'}
                            </Badge>
                          </div>

                          {hasVariants ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                <span className="text-purple-200">
                                  Variant pricing active - {variants.length} protein option{variants.length !== 1 ? 's' : ''} configured
                                </span>
                              </div>
                              {variantSummary && (
                                <div className="flex items-center gap-2 ml-6">
                                  <Info className="h-4 w-4 text-purple-400" />
                                  <span className="text-purple-300">
                                    Price range: {variantSummary.priceRange}
                                  </span>
                                </div>
                              )}
                              {basePriceIsZero && (
                                <div className="flex items-center gap-2 ml-6">
                                  <Info className="h-4 w-4 text-blue-400" />
                                  <span className="text-blue-300 text-xs">
                                    ℹ️ Base price is £0.00 - this is normal for variant items
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-purple-400" />
                                <span className="text-purple-200">
                                  Single-price item (no variants)
                                </span>
                              </div>
                              {basePriceIsZero && (
                                <div className="flex items-center gap-2 ml-6">
                                  <AlertCircle className="h-4 w-4 text-red-400" />
                                  <span className="text-red-300 text-xs font-medium">
                                    ⚠️ Warning: Base price is £0.00 - please set a price or add variants
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Show validation errors if any */}
                          {pricingValidation.errors.length > 0 && (
                            <div className="mt-3 p-3 rounded-md bg-red-950/50 border border-red-500/30">
                              <p className="text-red-300 text-sm font-medium mb-1">Pricing errors:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {pricingValidation.errors.map((error, idx) => (
                                  <li key={idx} className="text-red-200 text-xs">{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Show warnings if any (non-blocking) */}
                          {pricingValidation.warnings.length > 0 && pricingValidation.isValid && (
                            <div className="mt-3 p-3 rounded-md bg-yellow-950/30 border border-yellow-500/20">
                              <p className="text-yellow-300 text-sm font-medium mb-1">Notices:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {pricingValidation.warnings.map((warning, idx) => (
                                  <li key={idx} className="text-yellow-200 text-xs">{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  );
                })()}

                {/* 🆕 PHASE 3: VERTICAL STEPPER LAYOUT */}
                <MenuItemFormStepper
                  steps={formSteps}
                  expandedSteps={expandedSteps}
                  onToggleStep={handleToggleStep}
                  renderStepContent={renderStepContent}
                />

                {/* OLD FLAT LAYOUT - REMOVED */}
                {/* <MenuItemFormBasicInfoSectionWrapper ... /> */}
                {/* <MenuItemFormTypeSpecificSectionWrapper ... /> */}
                {/* <MenuItemFormMediaSectionWrapper ... /> */}
                {/* {configuration?.pricingMode === 'variants' && <MenuItemFormVariantsSectionWrapper ... />} */}
                {/* {configuration?.pricingMode === 'single' && <MenuItemFormPricingSectionWrapper ... />} */}

                {/* 🆕 PHASE 3.2: Keyboard Shortcuts Help */}
                <Card className="mb-6 bg-transparent border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                      Keyboard Shortcuts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ color: globalColors.text.secondary }}>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: globalColors.text.primary }}>Ctrl+S</kbd>
                        <span>Save form</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: globalColors.text.primary }}>Ctrl+Enter</kbd>
                        <span>Submit form</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>Ctrl+D</kbd>
                        <span>Duplicate item</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>Ctrl+Shift+R</kbd>
                        <span>Reset form</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>Esc</kbd>
                        <span>Cancel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>Enter</kbd>
                        <span>Submit (from input fields)</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: globalColors.text.muted }}>
                      💡 Tip: Use <kbd className="px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>Tab</kbd> to navigate between fields
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* 🔧 STICKY FOOTER - Outside scroll container, inside form */}
          <div className="border-t p-6" style={{ backgroundColor: globalColors.background.primary, borderColor: globalColors.border.default }}>
            <div className="flex justify-end gap-4 max-w-5xl mx-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isLoading}
                className="min-w-[120px]"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  console.log('\n' + '🔘'.repeat(50));
                  console.log('🔘 [SAVE BUTTON] Button Click Registered');
                  console.log('🔘'.repeat(50));
                  console.log('📊 Current Form State:');
                  console.log('  isSubmitting:', isSubmitting);
                  console.log('  isLoading:', isLoading);
                  console.log('  isDirty:', isDirty);
                  console.log('  isValid:', isValid);
                  console.log('\n🚨 Validation Errors:', Object.keys(errors).length > 0 ? errors : 'NONE');
                  if (Object.keys(errors).length > 0) {
                    console.log('\n⚠️ BLOCKING ERRORS FOUND:');
                    Object.entries(errors).forEach(([field, error]: [string, any]) => {
                      console.log(`  ❌ ${field}:`, error?.message || error);
                    });
                  }
                  console.log('\n🔧 About to call handleSubmit(onSubmit, onInvalid)...');
                  console.log('🔘'.repeat(50) + '\n');
                  
                  // Call the handler with both success and error callbacks
                  handleSubmit(onSubmit, onInvalid)();
                }}
                disabled={isSubmitting || isLoading}
                className="min-w-[160px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isSubmitting && retryCount > 0 ? `Retrying (${retryCount}/3)...` : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Menu Item
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* All Dialogs */}
        <SaveTemplateDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          onSave={handleSaveAsTemplate}
        />

        <DraftRestoreDialog
          open={showDraftRestoreDialog}
          onOpenChange={setShowDraftRestoreDialog}
          draftData={draftData}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />

        <CancelConfirmationDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          onConfirm={onCancel}
        />
      </div>
    </>
  );
}

export default MenuItemForm;
