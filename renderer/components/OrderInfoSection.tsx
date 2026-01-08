/**
 * OrderInfoSection - Order Information section
 * System-level fields: Receipt number, Date, Time, Order source, Order mode, Order type
 */

import React from 'react';
import { FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QSAITheme } from 'utils/QSAIDesign';
import { OrderTabSection } from 'components/OrderTabSection';
import { FormData, OrderMode, OrderSource, OrderType } from 'utils/receiptDesignerTypes';

interface Props {
  formData: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

export function OrderInfoSection({ formData, updateField }: Props) {
  return (
    <OrderTabSection icon={FileText} title="Order Information">
      {/* Receipt Number, Date, Time */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Receipt Number</Label>
          <Input
            value={formData.receiptNumber}
            onChange={(e) => updateField('receiptNumber', e.target.value)}
            placeholder="#001"
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Date</Label>
          <Input
            type="date"
            value={formData.orderDate}
            onChange={(e) => updateField('orderDate', e.target.value)}
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Time</Label>
          <Input
            type="time"
            value={formData.orderTime}
            onChange={(e) => updateField('orderTime', e.target.value)}
            style={{
              backgroundColor: QSAITheme.background.secondary,
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.primary
            }}
          />
        </div>
      </div>

      {/* Order Source, Order Mode, Order Type */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Order Source</Label>
          <Select
            value={formData.orderSource}
            onValueChange={(val) => updateField('orderSource', val as OrderSource)}
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
              <SelectItem value="POS">POS</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="AI_VOICE">AI Voice</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Order Mode</Label>
          <Select
            value={formData.orderMode}
            onValueChange={(val) => updateField('orderMode', val as OrderMode)}
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
              <SelectItem value="DINE-IN">Dine-In</SelectItem>
              <SelectItem value="COLLECTION">Collection</SelectItem>
              <SelectItem value="DELIVERY">Delivery</SelectItem>
              <SelectItem value="WAITING">Waiting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label style={{ color: QSAITheme.text.secondary }}>Order Type</Label>
          <Select
            value={formData.orderType}
            onValueChange={(val) => updateField('orderType', val as OrderType)}
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
              <SelectItem value="dine_in">Dine In</SelectItem>
              <SelectItem value="collection">Collection</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="online_orders">Online Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </OrderTabSection>
  );
}
