import React from 'react';
import { Coffee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServingSizesSelector } from './ServingSizesSelector';
import { FieldError as RHFFieldError } from './FieldError';
import type { UseFormRegister, UseFormSetValue, FieldErrors, Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Props for CoffeeDessertsFieldsSection component
 *
 * Note: `watch` prop removed - using useWatch hook instead for proper
 * form state subscription that works with React.memo
 */
interface CoffeeDessertsFieldsSectionProps {
  /** Form registration function */
  register: UseFormRegister<MenuItemFormInput>;
  /** Function to set form values */
  setValue: UseFormSetValue<MenuItemFormInput>;
  /** Form control instance for useWatch */
  control: Control<MenuItemFormInput>;
  /** Validation errors */
  errors: FieldErrors<MenuItemFormInput>;
  /** @deprecated - watch prop no longer needed, using useWatch hook */
  watch?: any;
}

/**
 * CoffeeDessertsFieldsSection Component
 *
 * Handles coffee and desserts-specific fields:
 * - Serving Sizes selector (with custom size creation)
 * - ABV percentage (for desserts with alcohol)
 * - Temperature (hot/cold/room)
 *
 * Uses useWatch hook for proper form state subscription that works
 * correctly with React.memo optimization.
 *
 * @component
 */
export const CoffeeDessertsFields = React.memo<CoffeeDessertsFieldsSectionProps>(({
  register,
  setValue,
  control,
  errors,
}) => {
  // Use useWatch hook for proper form state subscription
  const formTemperature = useWatch({ control, name: 'temperature' }) ?? '';

  return (
    <div className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#7C3AED]"
          aria-hidden="true"
        >
          <Coffee className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          Coffee & Desserts Details
        </h3>
      </div>
      
      <div className="space-y-6">
        {/* Serving Sizes Selector */}
        <ServingSizesSelector
          register={register}
          control={control}
          errors={errors}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ABV */}
          <div className="space-y-2">
            <Label htmlFor="abv" className="text-sm font-medium">
              ABV (Alcohol By Volume)
            </Label>
            <Input
              id="abv"
              type="number"
              step="0.1"
              placeholder="0.0"
              className={`bg-surface-tertiary border-white/10 ${errors.abv ? 'border-red-500' : ''}`}
              aria-label="Alcohol by volume percentage for desserts containing alcohol"
              aria-invalid={errors.abv ? 'true' : 'false'}
              aria-describedby={`abv-help ${errors.abv ? 'abv-error' : ''}`}
              {...register('abv', { valueAsNumber: true })}
            />
            <p id="abv-help" className="text-xs text-gray-400">
              For desserts containing alcohol (e.g., tiramisu, rum cake)
            </p>
            <RHFFieldError error={errors.abv} id="abv-error" />
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label htmlFor="temperature" className="text-sm font-medium">
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
                className="bg-surface-tertiary border-white/10"
                aria-label="Select serving temperature"
              >
                <SelectValue placeholder="Select serving temperature" />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(26,26,26,0.95)] border border-white/[0.07]">
                <SelectItem value="cold" className="text-white hover:bg-white/[0.05]">Cold</SelectItem>
                <SelectItem value="room_temp" className="text-white hover:bg-white/[0.05]">Room Temperature</SelectItem>
                <SelectItem value="hot" className="text-white hover:bg-white/[0.05]">Hot</SelectItem>
              </SelectContent>
            </Select>
            <p id="temperature-help" className="text-xs text-gray-400">
              Recommended serving temperature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

CoffeeDessertsFields.displayName = 'CoffeeDessertsFields';
