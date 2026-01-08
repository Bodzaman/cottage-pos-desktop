/**
 * TimingScheduleSection - Timing and scheduling fields
 * Fields: Collection time, Estimated delivery time, Preparation time
 */

import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QSAITheme } from 'utils/QSAIDesign';
import { OrderTabSection } from 'components/OrderTabSection';
import { FormData } from 'utils/receiptDesignerTypes';

interface Props {
  formData: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

export function TimingScheduleSection({ formData, updateField }: Props) {
  return (
    <OrderTabSection icon={Clock} title="Timing & Schedule">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Collection Time</Label>
          <Input
            type="time"
            value={formData.collectionTime}
            onChange={(e) => updateField('collectionTime', e.target.value)}
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Estimated Delivery</Label>
          <Input
            type="time"
            value={formData.estimatedDeliveryTime}
            onChange={(e) => updateField('estimatedDeliveryTime', e.target.value)}
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Preparation Time</Label>
          <Input
            type="time"
            value={formData.preparationTime}
            onChange={(e) => updateField('preparationTime', e.target.value)}
            placeholder="00:30"
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
      </div>
    </OrderTabSection>
  );
}
