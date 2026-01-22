import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';

interface StagingStatusBannerProps {
  itemCount: number;
  className?: string;
}

/**
 * Amber indicator banner for unsaved staging items.
 * Shows when items have been added but not yet sent to kitchen.
 *
 * Styling:
 * - Height: 34px
 * - Background: Amber at 20% opacity
 * - Border: 1px solid amber
 * - Text: "Staging (not saved yet)" in amber
 */
export function StagingStatusBanner({ itemCount, className = '' }: StagingStatusBannerProps) {
  if (itemCount === 0) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-3 h-[34px] rounded-md ${className}`}
      style={{
        backgroundColor: `${QSAITheme.status.staging}20`,
        border: `1px solid ${QSAITheme.status.staging}60`,
      }}
    >
      <Clock
        className="h-4 w-4"
        style={{ color: QSAITheme.status.staging }}
      />
      <span
        className="text-sm font-medium"
        style={{ color: QSAITheme.status.staging }}
      >
        {itemCount} item{itemCount !== 1 ? 's' : ''} staging (not saved yet)
      </span>
    </div>
  );
}

export default StagingStatusBanner;
