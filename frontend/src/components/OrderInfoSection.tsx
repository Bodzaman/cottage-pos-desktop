/**
 * OrderInfoSection - Order Information section
 * System-level fields: Receipt number, Date, Time, Order source, Order mode, Order type, Payment status
 */

import React from 'react';
import { FileText, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

      {/* Payment Status - For previewing PAID badge on receipt */}
      <div className="pt-3 border-t" style={{ borderColor: QSAITheme.border.light }}>
        <Label className="flex items-center gap-2 mb-3" style={{ color: QSAITheme.text.secondary }}>
          <CreditCard className="w-4 h-4" />
          Payment Status (Preview)
        </Label>
        <RadioGroup
          value={formData.paymentStatus || 'none'}
          onValueChange={(val) => updateField('paymentStatus', val === 'none' ? undefined : val as 'PAID' | 'UNPAID' | 'PARTIAL')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="none"
              id="payment-none"
              style={{ borderColor: QSAITheme.border.light }}
            />
            <Label htmlFor="payment-none" className="cursor-pointer" style={{ color: QSAITheme.text.primary }}>
              None
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="PAID"
              id="payment-paid"
              style={{ borderColor: '#10B981' }}
            />
            <Label htmlFor="payment-paid" className="cursor-pointer" style={{ color: '#10B981' }}>
              Paid
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="PARTIAL"
              id="payment-partial"
              style={{ borderColor: '#F59E0B' }}
            />
            <Label htmlFor="payment-partial" className="cursor-pointer" style={{ color: '#F59E0B' }}>
              Partial
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs mt-2" style={{ color: QSAITheme.text.muted }}>
          Toggle to preview how the payment status badge appears on receipts
        </p>
      </div>
    </OrderTabSection>
  );
}
