import React from 'react';
import { Coffee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { globalColors } from '../utils/QSAIDesign';
import { ServingSizesSelector } from './ServingSizesSelector';
import { FieldError as RHFFieldError } from './FieldError';
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Props for CoffeeDessertsFieldsSection component
 */
interface CoffeeDessertsFieldsSectionProps {
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
 * CoffeeDessertsFieldsSection Component
 * 
 * Handles coffee and desserts-specific fields:
 * - Serving Sizes selector (with custom size creation)
 * - ABV percentage (for desserts with alcohol)
 * - Temperature (hot/cold/room)
 * 
 * Only renders when itemType === 'coffee_desserts'
 * 
 * @component
 */
export const CoffeeDessertsFields = React.memo<CoffeeDessertsFieldsSectionProps>(({ 
  register,
  setValue,
  watch,
  errors,
}) => {
  // Watch form values internally
  const formTemperature = watch('temperature') || '';

  return (
    <div className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: globalColors.purple.primary }}
          aria-hidden="true"
        >
          <Coffee className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
          Coffee & Desserts Details
        </h3>
      </div>
      
      <div className="space-y-6">
        {/* Serving Sizes Selector */}
        <ServingSizesSelector
          register={register}
          watch={watch}
          errors={errors}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ABV */}
          <div className="space-y-2">
            <Label htmlFor="abv" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              ABV (Alcohol By Volume)
            </Label>
            <Input
              id="abv"
              type="number"
              step="0.1"
              placeholder="0.0"
              className={`bg-black/20 border-white/10 ${errors.abv ? 'border-red-500' : ''}`}
              aria-label="Alcohol by volume percentage for desserts containing alcohol"
              aria-invalid={errors.abv ? 'true' : 'false'}
              aria-describedby={`abv-help ${errors.abv ? 'abv-error' : ''}`}
              {...register('abv', { valueAsNumber: true })}
            />
            <p id="abv-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
              For desserts containing alcohol (e.g., tiramisu, rum cake)
            </p>
            <RHFFieldError error={errors.abv} id="abv-error" />
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Serving Temperature
            </Label>
            <Select
              value={formTemperature}
              onValueChange={(value) => setValue('temperature', value, { shouldDirty: true })}
              aria-label="Recommended serving temperature"
              aria-describedby="temperature-help"
            >
              <SelectTrigger 
                id="temperature"
                className="bg-black/20 border-white/10"
                aria-label="Select serving temperature"
              >
                <SelectValue placeholder="Select serving temperature" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="cold" className="text-white hover:bg-purple-500/20">Cold</SelectItem>
                <SelectItem value="room_temp" className="text-white hover:bg-purple-500/20">Room Temperature</SelectItem>
                <SelectItem value="hot" className="text-white hover:bg-purple-500/20">Hot</SelectItem>
              </SelectContent>
            </Select>
            <p id="temperature-help" className="text-xs" style={{ color: globalColors.text.secondary }}>
              Recommended serving temperature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

CoffeeDessertsFields.displayName = 'CoffeeDessertsFields';
