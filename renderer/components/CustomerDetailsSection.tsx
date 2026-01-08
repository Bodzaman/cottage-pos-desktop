/**
 * CustomerDetailsSection - Customer information fields
 * Fields: Name, Phone, Email, Delivery Address
 */

import React from 'react';
import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QSAITheme } from 'utils/QSAIDesign';
import { OrderTabSection } from 'components/OrderTabSection';
import { FormData } from 'utils/receiptDesignerTypes';

interface Props {
  formData: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

export function CustomerDetailsSection({ formData, updateField }: Props) {
  return (
    <OrderTabSection icon={User} title="Customer Details">
      {/* Customer Name and Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Customer Name</Label>
          <Input
            value={formData.customerName}
            onChange={(e) => updateField('customerName', e.target.value)}
            placeholder="John Smith"
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Phone Number</Label>
          <Input
            value={formData.customerPhone}
            onChange={(e) => updateField('customerPhone', e.target.value)}
            placeholder="07123 456789"
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
      </div>

      {/* Customer Email */}
      <div>
        <Label style={{ color: QSAITheme.text.secondary }}>Email Address</Label>
        <Input
          type="email"
          value={formData.customerEmail}
          onChange={(e) => updateField('customerEmail', e.target.value)}
          placeholder="customer@example.com"
          style={{
            backgroundColor: QSAITheme.background.secondary,
            border: `1px solid ${QSAITheme.border.light}`,
            color: QSAITheme.text.primary
          }}
        />
      </div>

      {/* Delivery Address */}
      <div>
        <Label style={{ color: QSAITheme.text.secondary }}>Delivery Address</Label>
        <Textarea
          value={formData.deliveryAddress}
          onChange={(e) => updateField('deliveryAddress', e.target.value)}
          placeholder="123 High Street, London, SW1A 1AA"
          rows={2}
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
