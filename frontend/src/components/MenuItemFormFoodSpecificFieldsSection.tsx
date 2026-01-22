import React from 'react';
import { ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { globalColors } from '../utils/QSAIDesign';
import { SpiceLevelDropdown } from './SpiceLevelDropdown';
import { AllergenSelector } from './AllergenSelector';
import { FieldError as RHFFieldError } from './FieldError';
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors, Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Props for FoodSpecificFieldsSection component
 */
interface FoodSpecificFieldsSectionProps {
  /** Form registration function */
  register: UseFormRegister<MenuItemFormInput>;
  /** Function to watch form values */
  watch: UseFormWatch<MenuItemFormInput>;
  /** Function to set form values */
  setValue: UseFormSetValue<MenuItemFormInput>;
  /** Form control instance for Controller components */
  control: Control<MenuItemFormInput>;
  /** Validation errors */
  errors: FieldErrors<MenuItemFormInput>;
  /** Item type */
  itemType: string | null;
}

/**
 * FoodSpecificFieldsSection Component
 * 
 * Handles food-specific fields:
 * - Spice Level selector
 * - Preparation Time
 * - Allergen selector with custom notes
 * - Chef's Special designation
 * - Chef's Notes & Special Instructions
 * 
 * Only renders when itemType === 'food'
 * 
 * @component
 */
export const FoodSpecificFields = React.memo<FoodSpecificFieldsSectionProps>(({ 
  register,
  watch,
  setValue,
  control,
  errors,
  itemType
}) => {
  // Watch form values internally
  const formDefaultSpiceLevel = watch('default_spice_level') || 0;
  const formAllergens = watch('allergens') || [];
  const formAllergenWarnings = watch('allergen_warnings') || '';
  const formChefsSpecial = watch('chefs_special') || false;
  const formSpecialtyNotes = watch('specialty_notes') || '';

  return (
    <div className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: globalColors.purple.primary }}
          aria-hidden="true"
        >
          <ChefHat className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
          Food-Specific Settings
        </h3>
      </div>
      
      <div className="space-y-8">
        {/* Main Fields Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spice Level */}
          <div className="space-y-2">
            <SpiceLevelDropdown
              value={formDefaultSpiceLevel}
              onChange={(value) => setValue('default_spice_level', value, { shouldDirty: true })}
              className="w-full"
              aria-label="Default spice level for this dish"
            />
            <p className="text-xs" style={{ color: globalColors.text.secondary }} id="spice-level-help">
              Default spice level for this dish
            </p>
          </div>

          {/* Allergens - Full Width */}
          <div className="space-y-2 lg:col-span-2">
            <Controller
              name="allergens"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <AllergenSelector
                  selectedAllergens={field.value || []}
                  onAllergensChange={field.onChange}
                  allergenNotes={formAllergenWarnings}
                  onAllergenNotesChange={(notes) => setValue('allergen_warnings', notes, { shouldDirty: true })}
                  aria-label="Select allergens present in this dish"
                />
              )}
            />
          </div>

          {/* Chef's Special */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: globalColors.text.primary }} id="chef-special-label">
              Special Designation
            </Label>
            <div className="flex items-center h-10 space-x-3 px-3 rounded-md border border-white/10" role="group" aria-labelledby="chef-special-label">
              <Switch
                id="chefs_special"
                checked={formChefsSpecial}
                onCheckedChange={(checked) => setValue('chefs_special', checked, { shouldDirty: true })}
                className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-700"
                aria-label="Mark as chef's signature dish"
                aria-checked={formChefsSpecial}
              />
              <Label htmlFor="chefs_special" className="text-sm cursor-pointer" style={{ color: globalColors.text.primary }}>
                Chef's Special
              </Label>
            </div>
            <p className="text-xs" style={{ color: globalColors.text.secondary }} id="chef-special-help">
              Mark as chef's signature dish
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-600/50" />

        {/* Additional Details - Full Width */}
        <div className="space-y-6">
          {/* Chef's Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="specialty_notes" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                Chef's Notes & Special Instructions
              </Label>
              <span className="text-xs" style={{ color: globalColors.text.secondary }} aria-live="polite" aria-atomic="true">
                {formSpecialtyNotes.length} / 500
              </span>
            </div>
            <Textarea
              id="specialty_notes"
              placeholder="Add any special preparation notes or chef recommendations"
              className={`min-h-[80px] resize-none bg-black/20 border-white/10 ${errors.specialty_notes ? 'border-red-500' : ''}`}
              rows={3}
              aria-label="Chef's notes and special preparation instructions"
              aria-invalid={errors.specialty_notes ? 'true' : 'false'}
              aria-describedby={`specialty-notes-help ${errors.specialty_notes ? 'specialty-notes-error' : ''}`}
              {...register('specialty_notes')}
            />
            <p id="specialty-notes-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
              Internal notes for kitchen staff
            </p>
            <RHFFieldError error={errors.specialty_notes} id="specialty-notes-error" />
          </div>
        </div>
      </div>
    </div>
  );
});

FoodSpecificFields.displayName = 'FoodSpecificFields';
