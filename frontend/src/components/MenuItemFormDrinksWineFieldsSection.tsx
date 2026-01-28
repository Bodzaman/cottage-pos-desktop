import React from 'react';
import { Wine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RHFFieldError } from './FieldError';
import type { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Props for DrinksWineFieldsSection component
 */
interface DrinksWineFieldsSectionProps {
  /** Form registration function */
  register: UseFormRegister<MenuItemFormInput>;
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
  const formAbv = watch('abv') ?? '';
  const formServingSizes = watch('serving_sizes') ?? [];
  const formDescription = watch('description') ?? '';

  return (
    <div className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#7C3AED]"
          aria-hidden="true"
        >
          <Wine className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          Wine & Drinks Information
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ABV */}
        <div className="space-y-2">
          <Label htmlFor="abv" className="text-sm font-medium">
            ABV (Alcohol By Volume)
          </Label>
          <Input
            id="abv"
            type="text"
            placeholder="e.g., 12.5%"
            className={`bg-surface-tertiary border-white/10 ${errors.abv ? 'border-red-500' : ''}`}
            aria-label="Alcohol by volume percentage"
            aria-invalid={errors.abv ? 'true' : 'false'}
            aria-describedby={`abv-help ${errors.abv ? 'abv-error' : ''}`}
            {...register('abv')}
          />
          <p id="abv-help" className="text-xs text-gray-400">
            Percentage of alcohol content
          </p>
          <RHFFieldError error={errors.abv} id="abv-error" />
        </div>

        {/* Serving Sizes */}
        <div className="space-y-2">
          <Label htmlFor="serving_sizes" className="text-sm font-medium">
            Serving Sizes
          </Label>
          <Input
            id="serving_sizes"
            type="text"
            placeholder="e.g., 175ml, 250ml"
            className={`bg-surface-tertiary border-white/10 ${errors.serving_sizes ? 'border-red-500' : ''}`}
            aria-label="Standard serving sizes"
            aria-invalid={errors.serving_sizes ? 'true' : 'false'}
            aria-describedby={`serving-sizes-help ${errors.serving_sizes ? 'serving-sizes-error' : ''}`}
            defaultValue={formServingSizes.join(', ')}
          />
          <p id="serving-sizes-help" className="text-xs text-gray-400">
            Standard serving sizes (e.g., 175ml, pint, bottle)
          </p>
          <RHFFieldError error={errors.serving_sizes} id="serving-sizes-error" />
        </div>

        {/* Tasting Notes & Description - Full Width */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-medium">
              Tasting Notes & Description
            </Label>
            <span className="text-xs text-gray-400" aria-live="polite" aria-atomic="true">
              {formDescription.length} / 500
            </span>
          </div>
          <Textarea
            id="description"
            placeholder="Describe flavor profile, aroma, finish, and pairing suggestions"
            className={`min-h-[100px] resize-none bg-surface-tertiary border-white/10 ${errors.description ? 'border-red-500' : ''}`}
            rows={4}
            aria-label="Tasting notes, flavor profile, and pairing suggestions"
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={`description-help ${errors.description ? 'description-error' : ''}`}
            {...register('description')}
          />
          <p id="description-help" className="text-xs text-gray-400">
            Professional tasting notes, flavor profile, and food pairing suggestions
          </p>
          <RHFFieldError error={errors.description} id="description-error" />
        </div>
      </div>
    </div>
  );
});

DrinksWineFields.displayName = 'DrinksWineFields';
