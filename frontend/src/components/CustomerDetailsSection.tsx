/**
 * CustomerDetailsSection - Customer information fields
 * Fields: Name, Phone, Email, Delivery Address, Postcode, Distance, Driver Notes
 */

import React from 'react';
import { User, MapPin, Truck } from 'lucide-react';
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
  // Check if this is a delivery order
  const isDelivery = formData.orderMode === 'DELIVERY' || formData.orderType === 'delivery';

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

      {/* Delivery-specific fields - only show for delivery orders */}
      {isDelivery && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: QSAITheme.text.secondary }}>
                <MapPin className="w-3 h-3 inline mr-1" />
                Postcode
              </Label>
              <Input
                value={formData.deliveryPostcode || ''}
                onChange={(e) => updateField('deliveryPostcode', e.target.value)}
                placeholder="SW1A 1AA"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.light}`,
                  color: QSAITheme.text.primary
                }}
              />
              <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                Emphasized separately on receipt
              </p>
            </div>
            <div>
              <Label style={{ color: QSAITheme.text.secondary }}>
                <Truck className="w-3 h-3 inline mr-1" />
                Delivery Distance
              </Label>
              <Input
                value={formData.deliveryDistance || ''}
                onChange={(e) => updateField('deliveryDistance', e.target.value)}
                placeholder="2.5 miles"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.light}`,
                  color: QSAITheme.text.primary
                }}
              />
              <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                From Google Maps calculation
              </p>
            </div>
          </div>

          <div>
            <Label style={{ color: QSAITheme.text.secondary }}>Driver Notes</Label>
            <Textarea
              value={formData.deliveryNotes || ''}
              onChange={(e) => updateField('deliveryNotes', e.target.value)}
              placeholder="Ring doorbell twice, gate code 1234..."
              rows={2}
              style={{
                backgroundColor: QSAITheme.background.secondary,
                border: `1px solid ${QSAITheme.border.light}`,
                color: QSAITheme.text.primary
              }}
            />
            <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
              Special instructions for the delivery driver
            </p>
          </div>
        </>
      )}
    </OrderTabSection>
  );
}
