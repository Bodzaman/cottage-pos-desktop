import React from 'react';
import { globalColors } from '../../utils/QSAIDesign';
import { RefundManagementPanel } from '../RefundManagementPanel';

export function PaymentsSettingsTab() {
  return (
    <div className="grid gap-6">
      <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
        Payment & Delivery Management
      </h3>
      <RefundManagementPanel />
    </div>
  );
}
