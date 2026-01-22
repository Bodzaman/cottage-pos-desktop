import React from 'react';
import { CreditCard } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { MenuItemPricing, type PricingData } from './MenuItemPricing';
import type { UseFormSetValue } from 'react-hook-form';
import type { MenuItemFormInput } from '../utils/menuFormValidation';

/**
 * Props for PricingSection component
 */
interface PricingSectionProps {
  /** Whether the item has variants */
  hasVariants: boolean;
  /** Current pricing data */
  pricingData: PricingData;
  /** Callback to update form values */
  setValue: UseFormSetValue<MenuItemFormInput>;
  /** Validation errors for pricing fields */
  errors?: {
    price_dine_in?: string;
    price_takeaway?: string;
    price_delivery?: string;
  };
  /** Container style object */
  containerStyle: React.CSSProperties;
}

/**
 * PricingSection Component
 * 
 * Wrapper for MenuItemPricing component with section styling and header.
 * Only renders when hasVariants is false (single items only).
 * 
 * @component
 */
export const MenuItemFormPricingSection = React.memo<PricingSectionProps>(({ 
  hasVariants,
  pricingData, 
  setValue,
  errors,
  containerStyle 
}) => {
  const handlePricingChange = React.useCallback((updatedPricing: PricingData) => {
    // Always set all pricing values to ensure persistence - single source of truth
    setValue('price', updatedPricing.price || 0, { shouldDirty: true });
    setValue('price_takeaway', updatedPricing.price_takeaway || 0, { shouldDirty: true });
    setValue('price_dine_in', updatedPricing.price_dine_in || 0, { shouldDirty: true });
    setValue('price_delivery', updatedPricing.price_delivery || 0, { shouldDirty: true });
  }, [setValue]);

  if (hasVariants) return null;

  return (
    <div style={containerStyle} className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: globalColors.purple.primary }}
        >
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
          Pricing Configuration
        </h3>
      </div>
      
      <MenuItemPricing
        pricing={pricingData}
        hasVariants={hasVariants}
        onChange={handlePricingChange}
        errors={errors}
      />
    </div>
  );
});

MenuItemFormPricingSection.displayName = 'MenuItemFormPricingSection';
