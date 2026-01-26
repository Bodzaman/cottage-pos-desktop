import React from 'react';
import { globalColors } from '../../utils/QSAIDesign';
import { POSUrgencySettings } from '../POSUrgencySettings';

export function POSSettingsTab() {
  return (
    <div className="grid gap-4">
      <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
        POS Configuration
      </h3>
      <p style={{ color: globalColors.text.secondary }}>
        Configure point of sale settings, table management, and receipt templates.
      </p>
      <POSUrgencySettings />
    </div>
  );
}
