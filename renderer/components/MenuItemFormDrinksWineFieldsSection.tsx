import React from 'react';
import { Wine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { globalColors } from '../utils/QSAIDesign';
import { FieldError as RHFFieldError } from './FieldError';
import type { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Props for DrinksWineFieldsSection component
 */
interface DrinksWineFieldsSectionProps {
  /** Form registration function */
  register: UseFormRegister<MenuItemFormInput>;
  /** Function to set form values */
  setValue: UseFormSetValue<MenuItemFormInput>;
  /** Function to watch form values */
  watch: UseFormWatch<MenuItemFormInput>;
  /** Validation errors */
  errors: FieldErrors<MenuItemFormInput>;
}

/**
 * DrinksWineFieldsSection Component
 * 
 * Handles drinks and wine-specific fields:
 * - Serving Sizes selector (with custom size creation)
 * - ABV percentage
 * - Temperature (hot/cold/room)
 * 
 * Only renders when itemType === 'drinks_wine'
 * 
 * @component
 */
export const DrinksWineFields = React.memo<DrinksWineFieldsSectionProps>(({ 
  register,
  watch,
  errors
}) => {
  // Watch form values
  const formAbv = watch('abv') || '';
  const formServingSize = watch('serving_size') || '';
  const formTastingNotes = watch('tasting_notes') || '';

  return (
    <div className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: globalColors.purple.primary }}
          aria-hidden="true"
        >
          <Wine className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
          Wine & Drinks Information
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ABV */}
        <div className="space-y-2">
          <Label htmlFor="abv" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
            ABV (Alcohol By Volume)
          </Label>
          <Input
            id="abv"
            type="text"
            placeholder="e.g., 12.5%"
            className={`bg-black/20 border-white/10 ${errors.abv ? 'border-red-500' : ''}`}
            aria-label="Alcohol by volume percentage"
            aria-invalid={errors.abv ? 'true' : 'false'}
            aria-describedby={`abv-help ${errors.abv ? 'abv-error' : ''}`}
            {...register('abv')}
          />
          <p id="abv-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
            Percentage of alcohol content
          </p>
          <RHFFieldError error={errors.abv} id="abv-error" />
        </div>

        {/* Serving Size */}
        <div className="space-y-2">
          <Label htmlFor="serving_size" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
            Serving Size
          </Label>
          <Input
            id="serving_size"
            type="text"
            placeholder="e.g., 175ml, 250ml"
            className={`bg-black/20 border-white/10 ${errors.serving_size ? 'border-red-500' : ''}`}
            aria-label="Standard serving size"
            aria-invalid={errors.serving_size ? 'true' : 'false'}
            aria-describedby={`serving-size-help ${errors.serving_size ? 'serving-size-error' : ''}`}
            {...register('serving_size')}
          />
          <p id="serving-size-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
            Standard serving size (e.g., 175ml, pint, bottle)
          </p>
          <RHFFieldError error={errors.serving_size} id="serving-size-error" />
        </div>

        {/* Tasting Notes - Full Width */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tasting_notes" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Tasting Notes & Description
            </Label>
            <span className="text-xs" style={{ color: globalColors.text.secondary }} aria-live="polite" aria-atomic="true">
              {formTastingNotes.length} / 500
            </span>
          </div>
          <Textarea
            id="tasting_notes"
            placeholder="Describe flavor profile, aroma, finish, and pairing suggestions"
            className={`min-h-[100px] resize-none bg-black/20 border-white/10 ${errors.tasting_notes ? 'border-red-500' : ''}`}
            rows={4}
            aria-label="Tasting notes, flavor profile, and pairing suggestions"
            aria-invalid={errors.tasting_notes ? 'true' : 'false'}
            aria-describedby={`tasting-notes-help ${errors.tasting_notes ? 'tasting-notes-error' : ''}`}
            {...register('tasting_notes')}
          />
          <p id="tasting-notes-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
            Professional tasting notes, flavor profile, and food pairing suggestions
          </p>
          <RHFFieldError error={errors.tasting_notes} id="tasting-notes-error" />
        </div>
      </div>
    </div>
  );
});

DrinksWineFields.displayName = 'DrinksWineFields';
