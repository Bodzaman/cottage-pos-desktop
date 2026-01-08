

import React from 'react';
import { Label } from '@/components/ui/label';
import { OrderNumberInput } from 'components/OrderNumberInput';

export interface CategoryOrderingFieldsProps {
  menuOrder: number;
  onMenuOrderChange: (value: number) => void;
  colors: {
    text: {
      primary: string;
      secondary: string;
    };
  };
  showFields: boolean; // Controls whether to show the fields (e.g., not for subcategories)
}

export const CategoryOrderingFields: React.FC<CategoryOrderingFieldsProps> = ({
  menuOrder,
  onMenuOrderChange,
  colors,
  showFields
}) => {
  if (!showFields) {
    return null;
  }

  return (
    <>
      {/* Unified Menu Order Field */}
      <div className="space-y-2">
        <Label htmlFor="menu_order" className="font-medium" style={{ color: colors.text.primary }}>
          Menu Order
        </Label>
        <OrderNumberInput
          value={menuOrder || 0}
          onChange={onMenuOrderChange}
          placeholder="Select menu order..."
          helpText="Single ordering value for consistent display across POS and receipts (lower numbers appear first)"
        />
      </div>
    </>
  );
};
