import React from 'react';
import { globalColors } from '../../utils/QSAIDesign';
import { VoiceOrderNotificationPanel } from '../VoiceOrderNotificationPanel';
import { VoiceOrderTestPanel } from '../VoiceOrderTestPanel';

export function AIStaffSettingsTab() {
  return (
    <div className="grid gap-6">
      <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
        AI Staff Management
      </h3>
      <VoiceOrderNotificationPanel compact={true} />
      <VoiceOrderTestPanel />
    </div>
  );
}
