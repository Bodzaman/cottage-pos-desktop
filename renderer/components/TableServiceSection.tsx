/**
 * TableServiceSection - Table/Dine-In specific fields
 * Conditionally visible when order type includes dine-in
 * Fields: Table number, Guest count, Dine-In template type
 */

import React from 'react';
import { Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QSAITheme } from 'utils/QSAIDesign';
import { OrderTabSection } from 'components/OrderTabSection';
import { FormData, DineInTemplateType } from 'utils/receiptDesignerTypes';

interface Props {
  formData: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

export function TableServiceSection({ formData, updateField }: Props) {
  // Only show if order type or mode includes dine-in
  const isDineIn = formData.orderType === 'dine_in' || formData.orderMode === 'DINE-IN';
  
  if (!isDineIn) {
    return null;
  }

  return (
    <OrderTabSection icon={Users} title="Table Service">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Table Number</Label>
          <Input
            value={formData.tableNumber}
            onChange={(e) => updateField('tableNumber', e.target.value)}
            placeholder="T-12"
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Guest Count</Label>
          <Input
            type="number"
            min="1"
            value={formData.guestCount}
            onChange={(e) => updateField('guestCount', parseInt(e.target.value) || 1)}
            placeholder="2"
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Template Type</Label>
          <Select
            value={formData.dineInTemplateType}
            onValueChange={(val) => updateField('dineInTemplateType', val as DineInTemplateType)}
          >
            <SelectTrigger
              style={{
                backgroundColor: QSAITheme.background.secondary,
                border: `1px solid ${QSAITheme.border.light}`,
                color: QSAITheme.text.primary
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kitchen_copy">Kitchen Copy</SelectItem>
              <SelectItem value="final_bill">Final Bill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </OrderTabSection>
  );
}
