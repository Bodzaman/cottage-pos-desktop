/**
 * SpecialInstructionsSection - Special instructions and notes
 * Fields: Special instructions textarea
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QSAITheme } from 'utils/QSAIDesign';
import { OrderTabSection } from 'components/OrderTabSection';
import { FormData } from 'utils/receiptDesignerTypes';

interface Props {
  formData: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

export function SpecialInstructionsSection({ formData, updateField }: Props) {
  return (
    <OrderTabSection icon={MessageSquare} title="Special Instructions">
      <div>
        <Label style={{ color: QSAITheme.text.secondary }}>Order Notes & Instructions</Label>
        <Textarea
          value={formData.specialInstructions}
          onChange={(e) => updateField('specialInstructions', e.target.value)}
          placeholder="Add any special instructions or dietary requirements..."
          rows={4}
          style={{
            backgroundColor: QSAITheme.background.secondary,
            border: `1px solid ${QSAITheme.border.light}`,
            color: QSAITheme.text.primary
          }}
        />
      </div>
    </OrderTabSection>
  );
}
