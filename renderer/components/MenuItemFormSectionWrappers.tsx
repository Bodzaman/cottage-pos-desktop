import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Cog, Camera, Layers, CreditCard, AlertCircle, DollarSign, Info } from 'lucide-react';
import { BasicInformationSection } from 'components/MenuItemFormBasicInformationSection';
import { FoodSpecificFields } from 'components/MenuItemFormFoodSpecificFieldsSection';
import { DrinksWineFields } from 'components/MenuItemFormDrinksWineFieldsSection';
import { CoffeeDessertsFields } from 'components/MenuItemFormCoffeeDessertsFieldsSection';
import { MenuItemMedia } from 'components/MenuItemMedia';
import { MenuItemVariants } from 'components/MenuItemVariants';
import { VariantTableEditor } from 'components/VariantTableEditor';
import { MenuItemPricing } from 'components/MenuItemPricing';
import { MenuItemPricingGuide } from 'components/MenuItemPricingGuide';
import type { PricingData } from 'components/MenuItemPricing';
import { MenuItemFormData as MenuItemFormInput } from '../utils/masterTypes';
import { Category, ProteinType, ItemVariant } from '../utils/menuTypes';
import { MenuItemConfiguration } from '../utils/menuItemConfiguration';

// Error Display Component
interface ErrorDisplayProps {
  submitError: string | null;
  errors: FieldErrors<MenuItemFormInput>;
  shouldShowValidationErrors?: boolean; // ✅ NEW: Control when to show react-hook-form errors
}

export const MenuItemFormErrorDisplay = React.memo<ErrorDisplayProps>(({ 
  submitError, 
  errors,
  shouldShowValidationErrors = false // Default: don't show until explicitly enabled
}) => {
  return (
    <>
      {/* Submit Error - ALWAYS show if present */}
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Validation Errors Summary - ONLY show when appropriate */}
      {shouldShowValidationErrors && Object.keys(errors).length > 0 && (
        <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following errors:
            <ul className="list-disc list-inside mt-2 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-sm">
                  {field}: {error?.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
});

MenuItemFormErrorDisplay.displayName = 'MenuItemFormErrorDisplay';

// Basic Information Section Wrapper
interface BasicInfoSectionWrapperProps {
  register: UseFormRegister<MenuItemFormInput>;
  control: Control<MenuItemFormInput>;
  setValue: UseFormSetValue<MenuItemFormInput>;
  errors: FieldErrors<MenuItemFormInput>;
  categories: MenuCategory[];
  itemType: string | null;
  hasVariants?: boolean;
  watch: UseFormWatch<MenuItemFormInput>;
  onMediaChange: (mediaData: {
    image_url: string;
    image_url_widescreen: string;
    image_asset_id: string;
    image_widescreen_asset_id: string;
    preferred_aspect_ratio: string;
  }) => void;
}

export const MenuItemFormBasicInfoSectionWrapper = React.memo<BasicInfoSectionWrapperProps>(({ 
  register,
  control,
  setValue,
  errors,
  categories,
  itemType,
  hasVariants = false,
  watch,
  onMediaChange
}) => {
  return (
    <Card className="mb-6 bg-transparent border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" aria-hidden="true" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BasicInformationSection
          register={register}
          control={control}
          setValue={setValue}
          errors={errors}
          categories={categories}
          itemType={itemType}
          hasVariants={hasVariants}
          watch={watch}
          onMediaChange={onMediaChange}
        />
      </CardContent>
    </Card>
  );
});

MenuItemFormBasicInfoSectionWrapper.displayName = 'MenuItemFormBasicInfoSectionWrapper';

// Type-Specific Fields Section Wrapper
interface TypeSpecificSectionWrapperProps {
  itemType: string | null;
  register: UseFormRegister<MenuItemFormInput>;
  watch: UseFormWatch<MenuItemFormInput>;
  setValue: UseFormSetValue<MenuItemFormInput>;
  control: Control<MenuItemFormInput>; // ✅ Added control
  errors: FieldErrors<MenuItemFormInput>;
  hasVariants?: boolean; // ✅ NEW: Check if item has variants (MYA-1484)
}

export const MenuItemFormTypeSpecificSectionWrapper = React.memo<TypeSpecificSectionWrapperProps>(({ 
  itemType,
  register,
  watch,
  setValue,
  control,
  errors,
  hasVariants = false
}) => {
  // 🔍 DIAGNOSTIC: Log values before conditional check
  console.log('🔍 Section3Check:', { 
    itemType, 
    hasVariants, 
    willHide: itemType === 'food' && hasVariants 
  });

  if (!itemType) return null;

  // ✅ For food items with variants, hide the entire section (food settings are per-variant)
  if (itemType === 'food' && hasVariants) {
    return null;
  }

  return (
    <Card className="mb-6 bg-transparent border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="h-5 w-5" aria-hidden="true" />
          {itemType === 'food' ? 'Food Settings' : 
           itemType === 'drinks_wine' ? 'Drinks & Wine Details' : 
           'Coffee & Desserts Details'}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-gray-500 hover:text-purple-400 cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-gray-800 border-purple-500/30">
                <p className="text-sm font-medium text-gray-200">
                  {itemType === 'food' ? 'Food-specific settings' : 'Beverage details'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {itemType === 'food' 
                    ? 'Dietary tags, spice level, and allergen information for food items.'
                    : 'Special characteristics and serving details for this beverage.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {itemType === 'food' && (
          <FoodSpecificFields
            register={register}
            watch={watch}
            setValue={setValue}
            control={control}
            errors={errors}
            itemType={itemType}
          />
        )}
        {itemType === 'drinks_wine' && (
          <DrinksWineFields
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        )}
        {itemType === 'coffee_desserts' && (
          <CoffeeDessertsFields
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        )}
      </CardContent>
    </Card>
  );
});

MenuItemFormTypeSpecificSectionWrapper.displayName = 'MenuItemFormTypeSpecificSectionWrapper';

// Media Section Wrapper
interface MediaSectionWrapperProps {
  watch: UseFormWatch<MenuItemFormInput>;
  onMediaChange: (mediaData: {
    image_url: string;
    image_url_widescreen: string;
    image_asset_id: string;
    image_widescreen_asset_id: string;
    preferred_aspect_ratio: string;
  }) => void;
}

export const MenuItemFormMediaSectionWrapper = React.memo<MediaSectionWrapperProps>(({ 
  watch,
  onMediaChange
}) => {
  return (
    <Card className="mb-6 bg-transparent border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" asChild>
          <h2>
            <Camera className="h-5 w-5" aria-hidden="true" />
            Item Images (Optional)
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MenuItemMedia
          media={{
            image_url: watch('image_url') || '',
            image_url_widescreen: watch('image_url_widescreen') || '',
            image_asset_id: watch('image_asset_id') || '',
            image_widescreen_asset_id: watch('image_widescreen_asset_id') || '',
            preferred_aspect_ratio: watch('preferred_aspect_ratio') || 'square'
          }}
          onChange={onMediaChange}
        />
      </CardContent>
    </Card>
  );
});

MenuItemFormMediaSectionWrapper.displayName = 'MenuItemFormMediaSectionWrapper';

// Variants Section Wrapper
interface VariantsSectionWrapperProps {
  configuration: MenuItemConfiguration | null;
  variants: MenuVariant[];
  onVariantsChange: (variants: MenuVariant[]) => void;
  proteinTypes: ProteinType[];
  baseItemName: string;
  baseItemDescription: string;
  baseItemImage: string;
  baseItemImageAssetId: string;
  errors: FieldErrors<MenuItemFormInput>;
}

/**
 * 🆕 Feature Toggle: Use new VariantTableEditor (tabular grid)
 * Set to false to rollback to old MenuItemVariants (accordion)
 */
const USE_VARIANT_TABLE_EDITOR = false;

export const MenuItemFormVariantsSectionWrapper = React.memo<VariantsSectionWrapperProps>(({ 
  configuration,
  variants,
  onVariantsChange,
  proteinTypes,
  baseItemName,
  baseItemDescription,
  baseItemImage,
  baseItemImageAssetId,
  errors
}) => {
  // UI renders based on configuration, not form field
  if (configuration?.pricingMode !== 'variants') return null;

  /**
   * Transform MenuVariant[] to MenuItemVariant[] for VariantTableEditor
   * MenuVariant is the form type, MenuItemVariant is the standardized DB type
   */
  const transformToTableFormat = (formVariants: MenuVariant[]): Partial<MenuItemVariant>[] => {
    return formVariants.map((v, index) => ({
      id: v.id || `temp-${index}`,
      name: v.name || '',
      variant_name: v.variant_name || '', // ✅ Preserve generated display name
      price: v.price || 0,
      price_dine_in: v.price_dine_in || v.price || 0,
      price_delivery: v.price_delivery || v.price || 0,
      is_default: v.is_default || false,
      order: v.order ?? index,
      protein_type_id: v.protein_type_id,
      description: v.description,
      image_url: v.image_url,
      image_asset_id: v.image_asset_id,
      // Preserve dietary fields
      is_vegetarian: v.is_vegetarian ?? false,
      is_vegan: v.is_vegan ?? false,
      is_gluten_free: v.is_gluten_free ?? false,
      is_halal: v.is_halal ?? false,
      is_dairy_free: v.is_dairy_free ?? false,
      is_nut_free: v.is_nut_free ?? false,
      // Preserve featured field
      featured: v.featured ?? false,
    }));
  };

  /**
   * Transform MenuItemVariant[] back to MenuVariant[] for form state
   */
  const transformFromTableFormat = (tableVariants: Partial<MenuItemVariant>[]): MenuVariant[] => {
    return tableVariants.map(v => ({
      id: v.id,
      name: v.name || '',
      variant_name: v.variant_name || '', // ✅ Preserve generated display name
      price: v.price || 0,
      price_dine_in: v.price_dine_in || v.price || 0,
      price_delivery: v.price_delivery || v.price || 0,
      is_default: v.is_default || false,
      order: v.order,
      protein_type_id: v.protein_type_id,
      description: v.description,
      image_url: v.image_url,
      image_asset_id: v.image_asset_id,
      // Preserve dietary fields
      is_vegetarian: v.is_vegetarian ?? false,
      is_vegan: v.is_vegan ?? false,
      is_gluten_free: v.is_gluten_free ?? false,
      is_halal: v.is_halal ?? false,
      is_dairy_free: v.is_dairy_free ?? false,
      is_nut_free: v.is_nut_free ?? false,
      // Preserve featured field
      featured: v.featured ?? false,
    }));
  };

  /**
   * Determine preset category based on configuration
   */
  const getPresetCategory = (): 'food' | 'drinks_wine' | 'coffee_desserts' => {
    if (configuration?.itemType === 'drinks' || configuration?.itemType === 'wine') {
      return 'drinks_wine';
    }
    if (configuration?.itemType === 'coffee' || configuration?.itemType === 'desserts') {
      return 'coffee_desserts';
    }
    return 'food';
  };

  return (
    <Card className="mb-6 bg-transparent border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Layers className="h-5 w-5" aria-hidden="true" />
            Item Variants (Required)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {USE_VARIANT_TABLE_EDITOR ? (
          // 🆕 New Tabular Grid Editor
          <VariantTableEditor
            variants={transformToTableFormat(variants)}
            onChange={(updated) => onVariantsChange(transformFromTableFormat(updated))}
            baseItemName={baseItemName}
            baseItemDescription={baseItemDescription}
            presetCategory={getPresetCategory()}
            showPresets={true}
          />
        ) : (
          // ⚠️ Legacy Accordion Editor (fallback)
          <MenuItemVariants
            variants={variants}
            proteinTypes={proteinTypes || []}
            onChange={onVariantsChange}
            baseItemName={baseItemName}
            baseItemDescription={baseItemDescription}
            baseItemImage={baseItemImage}
            baseItemImageAssetId={baseItemImageAssetId}
            errors={errors.variants ? { variants: errors.variants } : undefined}
          />
        )}
      </CardContent>
    </Card>
  );
});

MenuItemFormVariantsSectionWrapper.displayName = 'MenuItemFormVariantsSectionWrapper';

// Pricing Section Wrapper
interface PricingSectionWrapperProps {
  configuration: MenuItemConfiguration | null;
  watch: UseFormWatch<MenuItemFormInput>;
  setValue: UseFormSetValue<MenuItemFormInput>;
  errors: FieldErrors<MenuItemFormInput>;
  sectionExpanded: boolean;
  onToggleSection: () => void;
  onFocusPricing: () => void; // 🆕 Callback to focus pricing field
  onAddVariant: () => void; // 🆕 Callback to add first variant
  hasValidationError?: boolean; // 🆕 Indicates pricing validation failed
}

export const MenuItemFormPricingSectionWrapper = React.memo<PricingSectionWrapperProps>(({ 
  configuration,
  watch,
  setValue,
  errors,
  sectionExpanded,
  onToggleSection,
  onFocusPricing,
  onAddVariant,
  hasValidationError = false
}) => {
  // UI renders based on configuration, not form field
  if (configuration?.pricingMode !== 'single') return null;

  const handlePricingChange = (pricingData: PricingData) => {
    setValue('price_dine_in', pricingData.price_dine_in, { shouldDirty: true });
    setValue('price_takeaway', pricingData.price_takeaway, { shouldDirty: true });
    setValue('price_delivery', pricingData.price_delivery, { shouldDirty: true });
  };

  // 🎯 Determine if pricing is incomplete (no base prices set)
  const priceDineIn = watch('price_dine_in') || 0;
  const priceTakeaway = watch('price_takeaway') || 0;
  const priceDelivery = watch('price_delivery') || 0;
  const hasBasePrice = priceDineIn > 0 || priceTakeaway > 0 || priceDelivery > 0;

  return (
    <Card 
      className={`mb-6 bg-transparent transition-all duration-300 ${
        hasValidationError 
          ? 'border-red-500/50 ring-2 ring-red-500/20 animate-pulse' 
          : 'border-white/10'
      }`}
      data-section="pricing"
    >
      <CardHeader
        className="cursor-pointer select-none"
        onClick={onToggleSection}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleSection();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={sectionExpanded}
        aria-controls="pricing-section-content"
      >
        <CardTitle className="flex items-center gap-2" asChild>
          <h2>
            <CreditCard className={`h-5 w-5 ${
              hasValidationError ? 'text-red-500' : ''
            }`} aria-hidden="true" />
            Pricing (Required)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-500 hover:text-purple-400 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-800 border-purple-500/30">
                  <p className="text-sm font-medium text-gray-200">Set prices for service modes</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Configure different prices for dine-in (table service), takeaway (counter pickup), and delivery (sent to customer address).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {hasValidationError && (
              <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-md border border-red-500/30">
                Missing
              </span>
            )}
          </h2>
        </CardTitle>
      </CardHeader>
      {sectionExpanded && (
        <CardContent id="pricing-section-content">
          {/* Always show pricing fields (wizard choice already made) */}
          <MenuItemPricing
            pricing={{
              price_dine_in: priceDineIn,
              price_takeaway: priceTakeaway,
              price_delivery: priceDelivery
            }}
            onChange={handlePricingChange}
            errors={errors}
          />
        </CardContent>
      )}
    </Card>
  );
});

MenuItemFormPricingSectionWrapper.displayName = 'MenuItemFormPricingSectionWrapper';
