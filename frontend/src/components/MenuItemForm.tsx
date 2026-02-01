









/**
 * @fileoverview MenuItemForm - Comprehensive form for creating and editing menu items
 *
 * MIGRATION NOTE:
 * This component has reusable logic extracted into hooks for new implementations:
 * - useFormDraft (src/hooks/useFormDraft.ts) - Auto-save draft management
 * - useMenuItemForm (src/hooks/useMenuItemForm.ts) - Form state and submission
 *
 * These hooks can be used for:
 * - New wizard-style forms
 * - Simpler menu item forms
 * - Other forms needing draft functionality
 *
 * This file remains the production implementation until a full migration is tested.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
// Button, Save, X, Loader2 moved to MenuItemFormProgressFooter
import { BulkActionsToolbar } from 'components/MenuItemFormBulkActionsToolbar';
import { MenuItemFormHeader } from 'components/MenuItemFormHeader';
import {
  MenuItemFormErrorDisplay,
  MenuItemFormBasicInfoSectionWrapper,
  MenuItemFormTypeSpecificSectionWrapper,
  MenuItemFormVariantsSectionWrapper,
  MenuItemFormPricingSectionWrapper
} from 'components/MenuItemFormSectionWrappers';
import {
  SaveTemplateDialog,
  DraftRestoreDialog,
  CancelConfirmationDialog
} from 'components/MenuItemFormDialogs';
import { MenuCategory, ProteinType, MenuItemFormData, MenuItemVariant } from '../utils/masterTypes';
import type { MenuVariant, ProteinType as VariantsProteinType } from './MenuItemVariants';
import type { PricingData } from './MenuItemPricing';
import type { MenuItemFormInput } from '../utils/menuFormValidation';
import { MenuItemConfiguration, detectConfigurationFromItem } from '../utils/menuItemConfiguration';
import brain from 'brain';
import { menuItemFormSchema } from '../utils/menuFormValidation';
import { validateItemPricing } from '../utils/variantPricing';
import { getStepsWithStatus, type FormStep } from '../utils/menuFormSteps';
import { MenuItemTypeConfigurationStep } from './MenuItemTypeConfigurationStep';
import { MenuItemFormNavRail, MenuItemFormTabBar } from './MenuItemFormNavRail';
import { MenuItemFormSectionHeader } from './MenuItemFormSectionHeader';
import { MenuItemFormProgressFooter } from './MenuItemFormProgressFooter';

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

  // ✅ CRITICAL: Initialize itemData FIRST (before any hooks that reference it)
  const itemData = menuItem || initialData;

  // Determine initial configuration (from prop or detect from existing item)
  const initialConfiguration = useMemo<MenuItemConfiguration | null>(() => {
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

  // 🆕 Configuration state - allows inline configuration for new items
  const [configuration, setConfiguration] = useState<MenuItemConfiguration | null>(initialConfiguration);

  // Sync configuration state with prop changes
  useEffect(() => {
    if (initialConfiguration) {
      setConfiguration(initialConfiguration);
    }
  }, [initialConfiguration]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<MenuVariant[]>(
    itemData?.variants ? itemData.variants.map((v: MenuItemVariant, index: number) => ({
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
    })) : []
  );
  const [retryCount, setRetryCount] = useState(0);
  
  // 🆕 Screen reader status messages (Phase 3.4)
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 🆕 Phase 1: Pricing validation error state
  const [hasPricingError, setHasPricingError] = useState<boolean>(false);
  
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
  
  // ✅ MOVED UP: itemData now initialized at the top
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
      // Failed to load templates
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
      dietary_tags: itemData?.dietary_tags || [],
      menu_order: itemData?.menu_order || itemData?.display_order || 0,
      // Kitchen display name for thermal receipts (abbreviated name)
      kitchen_display_name: itemData?.kitchen_display_name || '',
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
        allergens: v.allergens || {},
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
      // Failed to load draft
    }
  }, [draftKey, isEditing]);

  // ✅ CRITICAL FIX: Load existing variants when editing
  useEffect(() => {
    if (isEditing && itemData?.variants && Array.isArray(itemData.variants)) {
      // Transform MenuItemVariant[] to MenuVariant[] for local state
      const transformedVariants: MenuVariant[] = itemData.variants.map((v: MenuItemVariant, index: number) => ({
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
      }));
      setVariants(transformedVariants);
      setValue('variants', itemData.variants);
    }
  }, [isEditing, itemData?.variants, setValue]);

  // ✅ AUTO-SYNC: Keep has_variants in sync with actual variants array
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
      setValue('has_variants', hasVariantsComputed, { shouldDirty: false });
    }
  }, [variants, watch, setValue]);

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
      } catch (e) {
        // Failed to auto-save draft
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
      // Failed to restore draft
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
      // Failed to discard draft
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
      // Failed to backup form data
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
      // Map form data to MenuItem shape expected by validateItemPricing
      const pricingValidation = validateItemPricing(
        {
          base_price: data.price || 0,
          price_dine_in: data.price_dine_in || 0,
          price_takeaway: data.price_takeaway || 0,
          price_delivery: data.price_delivery || 0,
          has_variants: hasVariants,
          variants: []
        } as Partial<import('../utils/masterTypes').MenuItem>,
        variants.map(v => ({
          ...v,
          menu_item_id: itemData?.id || '',
          id: v.id || '',
        })) as MenuItemVariant[]
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
          const validationResponse = await brain.validate_media_assets({
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
          // Media validation failed (non-blocking)
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
      
      // Transform MenuVariant[] to MenuItemVariant[] for submission
      const transformedVariantsForSubmission: MenuItemVariant[] = hasVariants ? variants.map((v, index) => ({
        id: v.id || '',
        menu_item_id: itemData?.id || '',
        protein_type_id: v.protein_type_id || null,
        name: v.name || null,
        variant_name: v.variant_name || null,
        price: v.price,
        price_takeaway: v.price,
        price_dine_in: v.price_dine_in || null,
        price_delivery: v.price_delivery || null,
        is_default: v.is_default || false,
        description_override: v.description || null,
        spice_level_override: v.spice_level || null,
        dietary_tags_override: null,
        image_url: v.image_url || null,
        image_asset_id: v.image_asset_id || null,
        image_state: v.image_state,
        description: v.description || null,
        description_state: v.description_state,
        available_for_delivery: true,
        available_for_takeaway: true,
        available_for_dine_in: true,
        is_vegetarian: v.is_vegetarian || false,
        is_vegan: v.is_vegan || false,
        is_gluten_free: v.is_gluten_free || false,
        is_halal: v.is_halal || false,
        is_dairy_free: v.is_dairy_free || false,
        is_nut_free: v.is_nut_free || false,
        spice_level: v.spice_level || null,
        allergens: v.allergens || {},
        allergen_notes: v.allergen_notes || null,
        featured: v.featured || false,
      })) : [];

      const submissionData = {
        ...cleanedData,
        has_variants: hasVariants,
        variants: transformedVariantsForSubmission,
        display_order: cleanedData.menu_order || 0,
        item_type: itemType || 'food',
      };
      
      delete submissionData.menu_order;
      
      let response;

      if (onSave) {
        try {
          await onSave(submissionData);
        } catch (onSaveError) {
          throw onSaveError; // Re-throw to outer catch
        }

        // ✅ Success handling - only runs if onSave didn't throw
        // Clear both sessionStorage backup AND localStorage draft on success
        sessionStorage.removeItem(backupKey);
        localStorage.removeItem(draftKey);
        setLastAutosaveTime(null);
        setRetryCount(0);

        setStatusMessage(isEditing ? 'Menu item updated successfully' : 'Menu item created successfully');
        setTimeout(() => setStatusMessage(''), 3000);

        // NOTE: handleSaveMenuItem already shows a toast, so we skip the duplicate here
        // toast.success(isEditing ? 'Menu item updated successfully!' : 'Menu item created successfully!');

        if (onSuccess) {
          onSuccess();
        }
      } else if (onSuccess) {
        if (itemData?.id) {
          response = await brain.update_menu_item({ itemId: itemData.id }, submissionData as any);
        } else {
          response = await brain.create_menu_item(submissionData as any);
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
        
        onSuccess();
      } else {
        if (itemData?.id) {
          response = await brain.update_menu_item({ itemId: itemData.id }, submissionData as any);
        } else {
          response = await brain.create_menu_item(submissionData as any);
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
      // Error saving menu item
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
          // Could not focus error field
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
      // Could not focus field via setFocus
    }
  }, [setFocus]);

  // 🆕 Phase 3.2: Global keyboard shortcuts handler - DISABLED FOR CLIPBOARD DEBUGGING
  /**
   * Global keyboard shortcuts handler
   * 
   * TEMPORARILY DISABLED to debug clipboard paste issue
   */
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     const target = e.target as HTMLElement;
      
  //     // ✅ CRITICAL: Identify text input elements first
  //     const isTextInput = 
  //       target.tagName === 'TEXTAREA' ||
  //       target.isContentEditable ||
  //       (target.tagName === 'INPUT' && target.getAttribute('type') !== 'checkbox' && target.getAttribute('type') !== 'radio');

  //     // ✅ If user is in a text input, ONLY handle our specific shortcuts, let everything else pass through
  //     if (isTextInput) {
  //       // Only handle Ctrl+Enter for submit in text inputs (but not in multiline textareas)
  //       if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSubmitting && target.tagName !== 'TEXTAREA') {
  //         e.preventDefault();
  //         handleSubmit(onSubmit)();
  //       }
  //       // Let ALL other keys (including clipboard operations) pass through naturally
  //       return;
  //     }

  //     // ✅ For non-text-input elements, handle escape
  //     if (e.key === 'Escape' && !isSubmitting) {
  //       // Don't close if there's an open dialog
  //       const hasOpenDialog = document.querySelector('[role="dialog"][aria-hidden="false"]');
  //       if (!hasOpenDialog) {
  //         e.preventDefault();
  //         handleCancel();
  //       }
  //     }
  //   };

  //   // Attach keyboard listener - no need for passive: false anymore since we're being selective
  //   document.addEventListener('keydown', handleKeyDown);

  //   // Cleanup
  //   return () => {
  //     document.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [handleSubmit, onSubmit, isSubmitting, handleCancel]);

  // ... existing useEffects for initialization and category auto-populate ...

  // Handle pricing updates
  const handlePricingChange = useCallback((pricingData: PricingData) => {
    if (pricingData.price !== undefined) {
      setValue('price', pricingData.price, { shouldDirty: true });
    }
    if (pricingData.price_takeaway !== undefined) {
      setValue('price_takeaway', pricingData.price_takeaway, { shouldDirty: true });
    }
    if (pricingData.price_dine_in !== undefined) {
      setValue('price_dine_in', pricingData.price_dine_in, { shouldDirty: true });
    }
    if (pricingData.price_delivery !== undefined) {
      setValue('price_delivery', pricingData.price_delivery, { shouldDirty: true });
    }
  }, [setValue]);

  // Handle media updates
  const handleMediaChange = useCallback((mediaData: {
    image_url: string;
    image_url_widescreen: string;
    image_asset_id: string;
    image_widescreen_asset_id: string;
    preferred_aspect_ratio: string;
  }) => {
    setValue('image_url', mediaData.image_url, { shouldDirty: true });
    setValue('image_url_widescreen', mediaData.image_url_widescreen, { shouldDirty: true });
    setValue('image_asset_id', mediaData.image_asset_id, { shouldDirty: true });
    setValue('image_widescreen_asset_id', mediaData.image_widescreen_asset_id, { shouldDirty: true });
    setValue('preferred_aspect_ratio', mediaData.preferred_aspect_ratio as 'square' | 'widescreen', { shouldDirty: true });
  }, [setValue]);

  // Handle variants updates
  const handleVariantsChange = useCallback((hasVariantsValue: boolean, variantsData?: MenuVariant[]) => {
    setValue('has_variants', hasVariantsValue, { shouldDirty: true });
    if (variantsData) {
      setVariants(variantsData);
      // Transform MenuVariant[] to MenuItemVariant[] for form state
      const transformedVariants: MenuItemVariant[] = variantsData.map((v, index) => ({
        id: v.id || '',
        menu_item_id: itemData?.id || '',
        protein_type_id: v.protein_type_id || null,
        name: v.name || null,
        variant_name: v.variant_name || null,
        price: v.price,
        price_takeaway: v.price,
        price_dine_in: v.price_dine_in || null,
        price_delivery: v.price_delivery || null,
        is_default: v.is_default || false,
        image_url: v.image_url || null,
        image_asset_id: v.image_asset_id || null,
        image_state: v.image_state,
        description: v.description || null,
        description_state: v.description_state,
        is_vegetarian: v.is_vegetarian || false,
        is_vegan: v.is_vegan || false,
        is_gluten_free: v.is_gluten_free || false,
        is_halal: v.is_halal || false,
        is_dairy_free: v.is_dairy_free || false,
        is_nut_free: v.is_nut_free || false,
        spice_level: v.spice_level || null,
        allergens: v.allergens || {},
        allergen_notes: v.allergen_notes || null,
        featured: v.featured || false,
      }));
      setValue('variants', transformedVariants, { shouldDirty: true });
    }
  }, [setValue, itemData?.id]);

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
      // Failed to save template
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
      // Failed to load template
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
      // Failed to delete template
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
      // Failed to duplicate item
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
    setSelectedCategory('');
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

  // Active section tracking for nav rail highlight
  const [activeStepId, setActiveStepId] = useState<string>(
    initialConfiguration ? 'basic' : 'configuration'
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 🎯 NEW: Calculate steps with current status
  // ✅ FIX: Use formData from useWatch (reactive) instead of watch() in useMemo
  // This ensures steps recalculate when form values change
  const formSteps = useMemo<FormStep[]>(() => {
    // Transform MenuVariant[] to MenuItemVariant[] for getStepsWithStatus
    const transformedVariants: MenuItemVariant[] = variants.map(v => ({
      id: v.id || '',
      menu_item_id: itemData?.id || '',
      protein_type_id: v.protein_type_id || null,
      name: v.name || null,
      variant_name: v.variant_name || null,
      price: v.price,
      price_dine_in: v.price_dine_in || null,
      price_delivery: v.price_delivery || null,
      is_default: v.is_default || false,
      image_url: v.image_url || null,
      image_asset_id: v.image_asset_id || null,
      is_vegetarian: v.is_vegetarian || false,
      is_vegan: v.is_vegan || false,
      is_gluten_free: v.is_gluten_free || false,
      is_halal: v.is_halal || false,
      is_dairy_free: v.is_dairy_free || false,
      is_nut_free: v.is_nut_free || false,
    }));

    return getStepsWithStatus(
      configuration,  // ✅ Pass full configuration object
      formData as Partial<MenuItemFormData>,  // ✅ Use reactive formData from useWatch
      transformedVariants,      // ✅ Pass transformed variants array
      errors as FieldErrors<MenuItemFormData>   // ✅ Pass validation errors
    );
  }, [configuration, formData, variants, errors, itemData?.id]);

  // IntersectionObserver for active section tracking
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const stepId = entry.target.getAttribute('data-step');
            if (stepId) setActiveStepId(stepId);
          }
        }
      },
      {
        root: container,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    const sections = container.querySelectorAll('[data-step]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [formSteps]);

  // Scroll to a specific section
  const handleScrollToStep = useCallback((stepId: string) => {
    const element = scrollContainerRef.current?.querySelector(`[data-step="${stepId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 🎯 NEW: Render step content based on step ID
  // Note: We cast register/control/setValue/watch/errors to MenuItemFormInput types
  // because MenuItemFormData and MenuItemFormInput are structurally compatible
  const renderStepContent = useCallback((stepId: string) => {
    // Type assertions for wrapper components that expect MenuItemFormInput
    const formInputRegister = register as unknown as import('react-hook-form').UseFormRegister<MenuItemFormInput>;
    const formInputControl = control as unknown as import('react-hook-form').Control<MenuItemFormInput>;
    const formInputSetValue = setValue as unknown as import('react-hook-form').UseFormSetValue<MenuItemFormInput>;
    const formInputWatch = watch as unknown as import('react-hook-form').UseFormWatch<MenuItemFormInput>;
    const formInputErrors = errors as unknown as import('react-hook-form').FieldErrors<MenuItemFormInput>;

    // Transform proteinTypes to match VariantsProteinType interface
    const variantsProteinTypes: VariantsProteinType[] = (proteinTypes || []).map(pt => ({
      id: pt.id,
      name: pt.name,
      display_order: pt.menu_order || 0,
    }));

    switch (stepId) {
      case 'configuration':
        // Inline configuration step for new items without pre-configuration
        return (
          <MenuItemTypeConfigurationStep
            configuration={configuration}
            isLocked={isEditing || !!initialConfiguration}
            onConfigurationChange={(newConfig) => {
              setConfiguration(newConfig);
              // Update has_variants in form based on pricing mode
              setValue('has_variants', newConfig.pricingMode === 'variants');
            }}
            isExpanded={true}
            onToggleExpanded={() => {}}
            isComplete={!!(configuration?.itemType && configuration?.pricingMode)}
          />
        );

      case 'basic':
        return (
          <MenuItemFormBasicInfoSectionWrapper
            register={formInputRegister}
            control={formInputControl}
            setValue={formInputSetValue}
            errors={formInputErrors}
            categories={filteredCategories}
            itemType={configuration?.itemType || null}
            hasVariants={hasVariants}
            watch={formInputWatch}
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
            proteinTypes={variantsProteinTypes}
            baseItemName={watch('name') || ''}
            baseItemDescription={watch('description') || ''}
            baseItemImage={watch('image_url') || ''}
            baseItemImageAssetId={watch('image_asset_id') || ''}
            errors={formInputErrors}
          />
        ) : (
          <MenuItemFormPricingSectionWrapper
            configuration={configuration}
            watch={formInputWatch}
            setValue={formInputSetValue}
            errors={formInputErrors}
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
            register={formInputRegister}
            watch={formInputWatch}
            setValue={formInputSetValue}
            control={formInputControl}
            errors={formInputErrors}
            hasVariants={configuration?.pricingMode === 'variants'}
          />
        );

      default:
        return null;
    }
  }, [configuration, variants, register, control, setValue, errors, filteredCategories, watch, proteinTypes, handleMediaChange, handleFocusPricing, handleAddVariant, hasPricingError, isEditing, initialConfiguration]);

  // Compute config subtitle for header
  const configSubtitle = configuration
    ? `${configuration.itemType === 'food' ? 'Food' : configuration.itemType === 'drinks_wine' ? 'Drinks & Wine' : configuration.itemType === 'coffee_desserts' ? 'Coffee & Desserts' : 'Menu'} — ${configuration.pricingMode === 'variants' ? 'Variant Pricing' : 'Single Price'}`
    : undefined;

  return (
    <>
      {/* Screen Reader Live Regions */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {errorMessage}
      </div>

      {/* Outer container */}
      <div className="flex flex-col h-full min-h-0">
        {/* Compact Header */}
        <MenuItemFormHeader
          isEditing={isEditing}
          formTitle={isEditing ? 'Edit Menu Item' : 'Add Menu Item'}
          isDirty={isDirty}
          lastAutosaveTime={lastAutosaveTime}
          configSubtitle={configSubtitle}
          isConfigLocked={isEditing || !!initialConfiguration}
        />

        {/* Bulk Actions Toolbar */}
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

        {/* Mobile Tab Bar (visible < lg) */}
        <MenuItemFormTabBar
          steps={formSteps}
          activeStepId={activeStepId}
          onStepClick={handleScrollToStep}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 min-h-0">
          {/* Desktop Nav Rail (visible lg+) */}
          <MenuItemFormNavRail
            steps={formSteps}
            activeStepId={activeStepId}
            onStepClick={handleScrollToStep}
          />

          {/* Scrollable Content Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 py-6 pb-24 space-y-2 menu-item-form">
              {/* Error Display */}
              <MenuItemFormErrorDisplay
                submitError={submitError}
                errors={errors as unknown as import('react-hook-form').FieldErrors<MenuItemFormInput>}
                shouldShowValidationErrors={
                  !!submitError || !!itemData?.id || Object.keys(touchedFields || {}).length > 0
                }
              />

              {/* All sections rendered continuously with section dividers */}
              {formSteps.map((step) => (
                <section key={step.id} data-step={step.id}>
                  <MenuItemFormSectionHeader
                    title={step.title}
                    icon={step.icon}
                    status={step.status}
                    required={step.required}
                  />
                  <div className="py-4">
                    {renderStepContent(step.id)}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </form>

        {/* Sticky Progress Footer */}
        <MenuItemFormProgressFooter
          steps={formSteps}
          onSave={() => handleSubmit(onSubmit, onInvalid)()}
          onCancel={handleCancel}
          isSubmitting={isSubmitting || isLoading}
          onScrollToStep={handleScrollToStep}
        />

        {/* Dialogs */}
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
