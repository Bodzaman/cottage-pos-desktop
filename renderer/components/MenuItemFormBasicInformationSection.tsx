import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { globalColors } from '../utils/QSAIDesign';
import { generateKitchenDisplayName } from '../utils/smartAbbreviationSystem';
import { HierarchicalCategorySelector } from './HierarchicalCategorySelector';
import { FieldError as RHFFieldError } from './FieldError';
import { useWatch } from 'react-hook-form';
import type { UseFormRegister, UseFormSetValue, FieldErrors, Control, UseFormWatch } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuItemFormSchema';
import type { Category } from '../utils/menuTypes';
import { MenuItemMedia } from './MenuItemMedia';

/**
 * Props for BasicInformationSection component
 */
interface BasicInformationSectionProps {
  /** Form registration function */
  register: UseFormRegister<MenuItemFormInput>;
  /** Function to set form values */
  setValue: UseFormSetValue<MenuItemFormInput>;
  /** Validation errors */
  errors: FieldErrors<MenuItemFormInput>;
  /** Available categories */
  categories: Category[];
  /** Item type (food/drinks_wine/coffee_desserts) */
  itemType: string | null;
  /** React Hook Form control object */
  control: Control<MenuItemFormInput>;
  /** Whether this item has variants (hides base-level dietary tags) */
  hasVariants?: boolean;
  /** Function to watch form values */
  watch: UseFormWatch<MenuItemFormInput>;
  /** Media change handler */
  onMediaChange: (mediaData: {
    image_url: string;
    image_url_widescreen: string;
    image_asset_id: string;
    image_widescreen_asset_id: string;
    preferred_aspect_ratio: string;
  }) => void;
}

/**
 * BasicInformationSection Component
 * 
 * Handles all core menu item fields:
 * - Name & Kitchen Display Name (with smart suggestions)
 * - Description
 * - Category & Menu Order
 * - Dietary Tags (vegetarian, vegan, gluten-free, etc.)
 * - Status Toggles (featured, active)
 * 
 * @component
 */
export function BasicInformationSection({
  register,
  setValue,
  errors,
  categories,
  itemType,
  control,
  hasVariants = false,
  watch,
  onMediaChange,
}: BasicInformationSectionProps) {
  // Use useWatch hook for reactive values instead of watch function
  const categoryId = useWatch({ control, name: 'category_id' });
  const vegetarian = useWatch({ control, name: 'vegetarian' });
  const vegan = useWatch({ control, name: 'vegan' });
  const glutenFree = useWatch({ control, name: 'gluten_free' });
  const halal = useWatch({ control, name: 'halal' });
  const dairyFree = useWatch({ control, name: 'dairy_free' });
  const nutFree = useWatch({ control, name: 'nut_free' });
  const formName = useWatch({ control, name: 'name' }) || '';
  const formDescription = useWatch({ control, name: 'description' }) || '';

  // Media fields for MenuItemMedia component
  const imageUrl = useWatch({ control, name: 'image_url' }) || '';
  const imageUrlWidescreen = useWatch({ control, name: 'image_url_widescreen' }) || '';
  const imageAssetId = useWatch({ control, name: 'image_asset_id' }) || '';
  const imageWidescreenAssetId = useWatch({ control, name: 'image_widescreen_asset_id' }) || '';
  const preferredAspectRatio = useWatch({ control, name: 'preferred_aspect_ratio' }) || 'square';

  // 🔍 DEBUG: Track categoryId changes from watch()
  React.useEffect(() => {
    console.log('🎨 [BasicInfoSection] categoryId from useWatch() changed:', categoryId);
  }, [categoryId]);

  // Kitchen name suggestion handler
  const handleKitchenNameSuggest = React.useCallback(() => {
    if (!formName) {
      toast.error('Please enter an item name first');
      return;
    }
    const suggestion = generateKitchenDisplayName(formName);
    setValue('kitchen_display_name', suggestion, { shouldDirty: true });
    toast.success('Kitchen name auto-generated!');
  }, [formName, setValue]);

  const handleCategorySelect = React.useCallback((selectedCategoryId: string) => {
    console.log('📝 [BasicInfoSection] handleCategorySelect called:', selectedCategoryId);
    console.log('📝 [BasicInfoSection] BEFORE setValue - current categoryId from watch():', categoryId);
    setValue('category_id', selectedCategoryId, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    console.log('📝 [BasicInfoSection] AFTER setValue called');
    // ✅ FIX: Don't call useWatch in callback - just reference the variable
    // The categoryId will update on the next render automatically
  }, [setValue, categoryId]);

  const handleDietaryToggle = React.useCallback((field: string, checked: boolean) => {
    console.log('🔄 [BasicInfoSection] handleDietaryToggle:', { field, checked });
    setValue(field as any, checked, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    console.log('🔄 [BasicInfoSection] setValue called for', field, '=', checked);
  }, [setValue]);

  return (
    <div className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: globalColors.purple.primary }}
          aria-hidden="true"
        >
          <FileText className="w-4 w-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
          Basic Information
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="name" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Item Name *
            </Label>
            <span className="text-xs" style={{ color: globalColors.text.secondary }} aria-live="polite" aria-atomic="true">
              {(formName || '').length} / 100
            </span>
          </div>
          <Input
            id="name"
            placeholder="Enter item name"
            className={`bg-black/20 border-white/10 ${errors.name ? 'border-red-500' : ''}`}
            aria-label="Menu item name"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={`name-help ${errors.name ? 'name-error' : ''}`}
            aria-required="true"
            {...register('name')}
          />
          <p id="name-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
            Customer-facing name shown on menus and receipts
          </p>
          <RHFFieldError error={errors.name} id="name-error" />
        </div>

        {/* Kitchen Display Name */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="kitchen_display_name" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Kitchen Display Name
              <span className="text-xs ml-1" style={{ color: globalColors.text.secondary }}>(Optional)</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleKitchenNameSuggest}
              aria-label="Generate smart abbreviation for kitchen display name"
            >
              💡 Smart Suggest
            </Button>
          </div>
          
          <Input
            id="kitchen_display_name"
            placeholder="Abbreviated name for kitchen displays"
            className="bg-black/20 border-white/10"
            aria-label="Kitchen display name (abbreviated)"
            aria-describedby="kitchen-name-help"
            {...register('kitchen_display_name')}
          />
          <p id="kitchen-name-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
            Shortened version for kitchen tickets and thermal printers
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Description
            </Label>
            <span className="text-xs" style={{ color: globalColors.text.secondary }} aria-live="polite" aria-atomic="true">
              {formDescription.length} / 500
            </span>
          </div>
          <Textarea
            id="description"
            placeholder="Describe this menu item"
            className={`min-h-[100px] resize-none bg-black/20 border-white/10 ${errors.description ? 'border-red-500' : ''}`}
            rows={4}
            aria-label="Menu item description"
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={`description-help ${errors.description ? 'description-error' : ''}`}
            {...register('description')}
          />
          <p id="description-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
            Customer-facing description shown on menus
          </p>
          <RHFFieldError error={errors.description} id="description-error" />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category_id" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
            Category *
          </Label>
          <input
            type="hidden"
            {...register('category_id')}
            aria-invalid={errors.category_id ? 'true' : 'false'}
            aria-describedby={errors.category_id ? 'category-error' : undefined}
            aria-required="true"
          />
          <HierarchicalCategorySelector
            categories={categories}
            selectedCategoryId={categoryId}
            onCategorySelect={handleCategorySelect}
          />
          <RHFFieldError error={errors.category_id} id="category-error" />
        </div>

        {/* Menu Order */}
        <div className="space-y-2">
          <Label htmlFor="menu_order" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
            Display Order
          </Label>
          <Input
            id="menu_order"
            type="number"
            placeholder="1"
            className={`bg-black/20 border-white/10 ${errors.menu_order ? 'border-red-500' : ''}`}
            aria-label="Menu display order (lower numbers appear first)"
            aria-invalid={errors.menu_order ? 'true' : 'false'}
            aria-describedby={`menu-order-help ${errors.menu_order ? 'menu-order-error' : ''}`}
            {...register('menu_order', { valueAsNumber: true })}
          />
          <p id="menu-order-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
            Lower numbers appear first
          </p>
          <RHFFieldError error={errors.menu_order} id="menu-order-error" />
        </div>
      </div>

      {/* Dietary Tags */}
      {!hasVariants && (
        <div className="mt-6">
          <Label className="text-sm font-medium mb-4 block" style={{ color: globalColors.text.primary }} id="dietary-tags-label">
            Dietary & Preference Tags
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="group" aria-labelledby="dietary-tags-label">
            <div className="flex items-center space-x-2">
              <Switch
                id="vegetarian"
                checked={vegetarian}
                onCheckedChange={(checked) => handleDietaryToggle('vegetarian', checked)}
                className="data-[state=checked]:bg-purple-600"
                aria-label="Mark as vegetarian"
                aria-checked={vegetarian}
              />
              <Label htmlFor="vegetarian" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
                🥬 Vegetarian
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="vegan"
                checked={vegan}
                onCheckedChange={(checked) => handleDietaryToggle('vegan', checked)}
                className="data-[state=checked]:bg-purple-600"
                aria-label="Mark as vegan"
                aria-checked={vegan}
              />
              <Label htmlFor="vegan" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
                🌱 Vegan
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="gluten_free"
                checked={glutenFree}
                onCheckedChange={(checked) => handleDietaryToggle('gluten_free', checked)}
                className="data-[state=checked]:bg-purple-600"
                aria-label="Mark as gluten-free"
                aria-checked={glutenFree}
              />
              <Label htmlFor="gluten_free" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
                🌾 Gluten-Free
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="halal"
                checked={halal}
                onCheckedChange={(checked) => handleDietaryToggle('halal', checked)}
                className="data-[state=checked]:bg-purple-600"
                aria-label="Mark as halal"
                aria-checked={halal}
              />
              <Label htmlFor="halal" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
                ☪️ Halal
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="dairy_free"
                checked={dairyFree}
                onCheckedChange={(checked) => handleDietaryToggle('dairy_free', checked)}
                className="data-[state=checked]:bg-purple-600"
                aria-label="Mark as dairy-free"
                aria-checked={dairyFree}
              />
              <Label htmlFor="dairy_free" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
                🥛 Dairy-Free
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="nut_free"
                checked={nutFree}
                onCheckedChange={(checked) => handleDietaryToggle('nut_free', checked)}
                className="data-[state=checked]:bg-purple-600"
                aria-label="Mark as nut-free"
                aria-checked={nutFree}
              />
              <Label htmlFor="nut_free" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
                🥜 Nut-Free
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Status Toggles */}
      <div className="mt-6 grid grid-cols-2 gap-4" role="group" aria-label="Item status settings">
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={useWatch({ control, name: 'featured' }) || false}
            onCheckedChange={(checked) => setValue('featured', checked, { shouldDirty: true })}
            className="data-[state=checked]:bg-purple-600"
            aria-label="Mark as featured item"
            aria-checked={useWatch({ control, name: 'featured' }) || false}
          />
          <Label htmlFor="featured" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
            ⭐ Featured Item
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={useWatch({ control, name: 'active' }) || false}
            onCheckedChange={(checked) => setValue('active', checked, { shouldDirty: true })}
            className="data-[state=checked]:bg-purple-600"
            aria-label="Mark as active and available for sale"
            aria-checked={useWatch({ control, name: 'active' }) || false}
          />
          <Label htmlFor="active" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
            ✅ Active (Available for sale)
          </Label>
        </div>
      </div>
      {/* 🆕 Media & Images - Now integrated into Basic Information */}
      <div className="pt-2">
        <MenuItemMedia
          media={{
            image_url: imageUrl,
            image_url_widescreen: imageUrlWidescreen,
            image_asset_id: imageAssetId,
            image_widescreen_asset_id: imageWidescreenAssetId,
            preferred_aspect_ratio: preferredAspectRatio
          }}
          onChange={onMediaChange}
          menuItemName={formName}
        />
      </div>
    </div>
  );
}

BasicInformationSection.displayName = 'BasicInformationSection';
