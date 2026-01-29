import React from 'react';
import { ChefHat } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SpiceLevelDropdown } from './SpiceLevelDropdown';
import { AllergenSelector, normalizeAllergenData } from './AllergenSelector';
import { RHFFieldError } from './FieldError';
import type { UseFormRegister, UseFormSetValue, FieldErrors, Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Props for FoodSpecificFieldsSection component
 *
 * Note: `watch` prop removed - using useWatch hook instead for proper
 * form state subscription that works with React.memo
 */
interface FoodSpecificFieldsSectionProps {
  /** Form registration function */
  register: UseFormRegister<MenuItemFormInput>;
  /** Function to set form values */
  setValue: UseFormSetValue<MenuItemFormInput>;
  /** Form control instance for Controller components and useWatch */
  control: Control<MenuItemFormInput>;
  /** Validation errors */
  errors: FieldErrors<MenuItemFormInput>;
  /** Item type */
  itemType: string | null;
  /** @deprecated - watch prop no longer needed, using useWatch hook */
  watch?: any;
}

/**
 * FoodSpecificFieldsSection Component
 *
 * Handles food-specific fields:
 * - Spice Level selector
 * - Allergen selector with custom notes
 * - Chef's Special designation
 * - Chef's Notes & Special Instructions
 *
 * Uses useWatch hook for proper form state subscription that works
 * correctly with React.memo optimization.
 *
 * @component
 */
export const FoodSpecificFields = React.memo<FoodSpecificFieldsSectionProps>(({
  register,
  setValue,
  control,
  errors,
  itemType
}) => {
  // Use useWatch hook for proper form state subscription
  // This creates independent subscriptions that work correctly with React.memo
  const formSpiceLevel = useWatch({ control, name: 'spice_level' }) ?? 0;
  const rawAllergens = useWatch({ control, name: 'allergens' });
  const formAllergenWarnings = useWatch({ control, name: 'allergen_warnings' }) ?? '';
  const formChefsSpecial = useWatch({ control, name: 'chefs_special' }) ?? false;
  const formSpecialtyNotes = useWatch({ control, name: 'specialty_notes' }) ?? '';

  // Normalize allergen data for the selector
  const formAllergens = normalizeAllergenData(rawAllergens);

  return (
    <div className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#7C3AED]"
          aria-hidden="true"
        >
          <ChefHat className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          Food-Specific Settings
        </h3>
      </div>

      <div className="space-y-8">
        {/* Main Fields Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spice Level */}
          <div className="space-y-2">
            <SpiceLevelDropdown
              value={formSpiceLevel}
              onChange={(value) => setValue('spice_level', value, { shouldDirty: true })}
              className="w-full"
              aria-label="Default spice level for this dish"
            />
            <p className="text-xs text-gray-400" id="spice-level-help">
              Default spice level for this dish
            </p>
          </div>

          {/* Allergens - Full Width */}
          <div className="space-y-2 lg:col-span-2">
            <Controller
              name="allergens"
              control={control}
              defaultValue={{}}
              render={({ field }) => (
                <AllergenSelector
                  allergenData={normalizeAllergenData(field.value)}
                  onAllergenDataChange={(data) => {
                    field.onChange(data);
                  }}
                  allergenNotes={formAllergenWarnings}
                  onAllergenNotesChange={(notes) => setValue('allergen_warnings', notes, { shouldDirty: true })}
                />
              )}
            />
          </div>

          {/* Chef's Special */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" id="chef-special-label">
              Special Designation
            </Label>
            <div className="flex items-center h-10 space-x-3 px-3 rounded-md border border-white/10" role="group" aria-labelledby="chef-special-label">
              <Switch
                id="chefs_special"
                checked={formChefsSpecial}
                onCheckedChange={(checked) => setValue('chefs_special', checked, { shouldDirty: true })}
                className="data-[state=checked]:bg-[#7C3AED] data-[state=unchecked]:bg-gray-700"
                aria-label="Mark as chef's signature dish"
                aria-checked={formChefsSpecial}
              />
              <Label htmlFor="chefs_special" className="text-sm cursor-pointer">
                Chef's Special
              </Label>
            </div>
            <p className="text-xs text-gray-400" id="chef-special-help">
              Mark as chef's signature dish
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/[0.07]" />

        {/* Additional Details - Full Width */}
        <div className="space-y-6">
          {/* Chef's Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="specialty_notes" className="text-sm font-medium">
                Chef's Notes & Special Instructions
              </Label>
              <span className="text-xs text-gray-400" aria-live="polite" aria-atomic="true">
                {formSpecialtyNotes.length} / 500
              </span>
            </div>
            <Textarea
              id="specialty_notes"
              placeholder="Add any special preparation notes or chef recommendations"
              className={`min-h-[80px] resize-none bg-surface-tertiary border-white/10 ${errors.specialty_notes ? 'border-red-500' : ''}`}
              rows={3}
              aria-label="Chef's notes and special preparation instructions"
              aria-invalid={errors.specialty_notes ? 'true' : 'false'}
              aria-describedby={`specialty-notes-help ${errors.specialty_notes ? 'specialty-notes-error' : ''}`}
              {...register('specialty_notes')}
            />
            <p id="specialty-notes-help" className="text-xs text-gray-400">
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
