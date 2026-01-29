import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors, Control } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { BasicInformationSection } from 'components/MenuItemFormBasicInformationSection';
import { FoodSpecificFields } from 'components/MenuItemFormFoodSpecificFieldsSection';
import { DrinksWineFields } from 'components/MenuItemFormDrinksWineFieldsSection';
import { CoffeeDessertsFields } from 'components/MenuItemFormCoffeeDessertsFieldsSection';
import { MenuItemMedia } from 'components/MenuItemMedia';
import { MenuItemVariants, MenuVariant, ProteinType as MenuItemVariantsProteinType } from 'components/MenuItemVariants';
import { VariantTableEditor } from 'components/VariantTableEditor';
import { MenuItemPricing } from 'components/MenuItemPricing';
import type { PricingData } from 'components/MenuItemPricing';
import { MenuCategory, ProteinType, MenuItemVariant } from '../utils/masterTypes';
import { MenuItemConfiguration } from '../utils/menuItemConfiguration';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

// Error Display Component
interface ErrorDisplayProps {
  submitError: string | null;
  errors: FieldErrors<MenuItemFormInput>;
  shouldShowValidationErrors?: boolean;
}

export const MenuItemFormErrorDisplay = React.memo<ErrorDisplayProps>(({
  submitError,
  errors,
  shouldShowValidationErrors = false
}) => {
  return (
    <>
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

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
    <div className="space-y-4">
      <BasicInformationSection
        register={register as any}
        control={control as any}
        setValue={setValue as any}
        errors={errors}
        categories={categories}
        itemType={itemType}
        hasVariants={hasVariants}
        watch={watch as any}
        onMediaChange={onMediaChange}
      />
    </div>
  );
});

MenuItemFormBasicInfoSectionWrapper.displayName = 'MenuItemFormBasicInfoSectionWrapper';

// Type-Specific Fields Section Wrapper
interface TypeSpecificSectionWrapperProps {
  itemType: string | null;
  register: UseFormRegister<MenuItemFormInput>;
  watch: UseFormWatch<MenuItemFormInput>;
  setValue: UseFormSetValue<MenuItemFormInput>;
  control: Control<MenuItemFormInput>;
  errors: FieldErrors<MenuItemFormInput>;
  hasVariants?: boolean;
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
  if (!itemType) return null;

  // For food items with variants, hide the entire section (food settings are per-variant)
  if (itemType === 'food' && hasVariants) {
    return null;
  }

  return (
    <div className="space-y-4">
      {itemType === 'food' && (
        <FoodSpecificFields
          register={register as any}
          setValue={setValue as any}
          control={control as any}
          errors={errors}
          itemType={itemType}
        />
      )}
      {itemType === 'drinks_wine' && (
        <DrinksWineFields
          register={register as any}
          control={control as any}
          errors={errors}
        />
      )}
      {itemType === 'coffee_desserts' && (
        <CoffeeDessertsFields
          register={register as any}
          control={control as any}
          setValue={setValue as any}
          errors={errors}
        />
      )}
    </div>
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
    <div className="space-y-4">
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
    </div>
  );
});

MenuItemFormMediaSectionWrapper.displayName = 'MenuItemFormMediaSectionWrapper';

// Variants Section Wrapper
interface VariantsSectionWrapperProps {
  configuration: MenuItemConfiguration | null;
  variants: MenuVariant[];
  onVariantsChange: (variants: MenuVariant[]) => void;
  proteinTypes: MenuItemVariantsProteinType[];
  baseItemName: string;
  baseItemDescription: string;
  baseItemImage: string;
  baseItemImageAssetId: string;
  errors: FieldErrors<MenuItemFormInput>;
}

/**
 * Feature Toggle: Use new VariantTableEditor (tabular grid)
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
  if (configuration?.pricingMode !== 'variants') return null;

  const transformToTableFormat = (formVariants: MenuVariant[]): Partial<MenuItemVariant>[] => {
    return formVariants.map((v, index) => ({
      id: v.id || `temp-${index}`,
      menu_item_id: '',
      name: v.name || '',
      variant_name: v.variant_name || '',
      price: v.price || 0,
      price_dine_in: v.price_dine_in || v.price || 0,
      price_delivery: v.price_delivery || v.price || 0,
      is_default: v.is_default || false,
      protein_type_id: v.protein_type_id,
      description: v.description,
      image_url: v.image_url,
      image_asset_id: v.image_asset_id,
    }));
  };

  const transformFromTableFormat = (tableVariants: Partial<MenuItemVariant>[]): MenuVariant[] => {
    return tableVariants.map((v, index) => ({
      id: v.id,
      name: v.name || '',
      variant_name: v.variant_name || '',
      price: v.price || 0,
      price_dine_in: v.price_dine_in || v.price || 0,
      price_delivery: v.price_delivery || v.price || 0,
      is_default: v.is_default || false,
      display_order: index,
      protein_type_id: v.protein_type_id,
      description: v.description,
      image_url: v.image_url,
      image_asset_id: v.image_asset_id,
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_halal: false,
      is_dairy_free: false,
      is_nut_free: false,
      featured: false,
    }));
  };

  const getPresetCategory = (): 'food' | 'drinks_wine' | 'coffee_desserts' => {
    if (configuration?.itemType === 'drinks_wine') return 'drinks_wine';
    if (configuration?.itemType === 'coffee_desserts') return 'coffee_desserts';
    return 'food';
  };

  return (
    <div className="space-y-4" data-section="pricing">
      {USE_VARIANT_TABLE_EDITOR ? (
        <VariantTableEditor
          variants={transformToTableFormat(variants)}
          onChange={(updated) => onVariantsChange(transformFromTableFormat(updated))}
          baseItemName={baseItemName}
          baseItemDescription={baseItemDescription}
          presetCategory={getPresetCategory()}
          showPresets={true}
        />
      ) : (
        <MenuItemVariants
          variants={variants}
          proteinTypes={proteinTypes || []}
          onChange={onVariantsChange}
          baseItemName={baseItemName}
          baseItemDescription={baseItemDescription}
          baseItemImage={baseItemImage}
          baseItemImageAssetId={baseItemImageAssetId}
          errors={undefined}
        />
      )}
    </div>
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
  onFocusPricing: () => void;
  onAddVariant: () => void;
  hasValidationError?: boolean;
}

export const MenuItemFormPricingSectionWrapper = React.memo<PricingSectionWrapperProps>(({
  configuration,
  watch,
  setValue,
  errors,
  hasValidationError = false
}) => {
  if (configuration?.pricingMode !== 'single') return null;

  const handlePricingChange = (pricingData: PricingData) => {
    setValue('price_dine_in', pricingData.price_dine_in, { shouldDirty: true });
    setValue('price_takeaway', pricingData.price_takeaway, { shouldDirty: true });
    setValue('price_delivery', pricingData.price_delivery, { shouldDirty: true });
  };

  const priceDineIn = watch('price_dine_in') || 0;
  const priceTakeaway = watch('price_takeaway') || 0;
  const priceDelivery = watch('price_delivery') || 0;

  return (
    <div
      className={`space-y-4 ${hasValidationError ? 'ring-2 ring-red-500/20 rounded-lg p-4' : ''}`}
      data-section="pricing"
    >
      <MenuItemPricing
        pricing={{
          price: priceDineIn || priceTakeaway || priceDelivery || undefined,
          price_dine_in: priceDineIn,
          price_takeaway: priceTakeaway,
          price_delivery: priceDelivery
        }}
        hasVariants={false}
        onChange={handlePricingChange}
        errors={{
          price_dine_in: errors.price_dine_in?.message,
          price_takeaway: errors.price_takeaway?.message,
          price_delivery: errors.price_delivery?.message,
        }}
      />
    </div>
  );
});

MenuItemFormPricingSectionWrapper.displayName = 'MenuItemFormPricingSectionWrapper';
