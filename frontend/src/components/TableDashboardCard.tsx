/**
 * TableDashboardCard
 *
 * A uniform-sized card displaying table information for the Dine-In Table Dashboard.
 * Shows different content based on table status (Available vs Occupied).
 *
 * OCCUPIED LAYOUT (3-column grid):
 * ┌─────────────────────────────────────┐
 * │ T1      [In Kitchen]            🔴  │  ← 3-col: table | badge | urgency
 * │ 👤 2                                │  ← Guest count with icon
 * ├─────────────────────────────────────┤
 * │ 52m                         £46.02  │  ← Duration + Bill total (bold)
 * └─────────────────────────────────────┘
 *
 * AVAILABLE LAYOUT (3-column grid):
 * ┌─────────────────────────────────────┐
 * │ T3       [Available]                │  ← 3-col: table | badge | (empty)
 * │                                     │
 * │              Seats: 4               │  ← Capacity (centered, larger)
 * └─────────────────────────────────────┘
 */

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Link2, Trash2 } from 'lucide-react';
import { QSAITheme } from '../utils/QSAIDesign';
import {
  TableCardData,
  getCardStyles,
  getStatusBadgeStyles,
  URGENCY_COLORS,
  UrgencyLevel,
} from '../utils/tableDashboardHelpers';
import type { LinkedTableColor } from '../utils/linkedTableColors';

interface TableDashboardCardProps {
  data: TableCardData;
  isSelected: boolean;
  onClick: () => void;
  onResetClick?: (tableNumber: number) => void;
  linkedColor?: LinkedTableColor | null;
}

/**
 * TableDashboardCard - Individual table card for the dashboard
 */
export const TableDashboardCard = memo(function TableDashboardCard({
  data,
  isSelected,
  onClick,
  onResetClick,
  linkedColor
}: TableDashboardCardProps) {
  // Use linked color for styling if table is linked, otherwise use status-based styles
  const baseCardStyles = getCardStyles(data.status, isSelected);
  const cardStyles = linkedColor
    ? {
        background: isSelected
          ? `linear-gradient(135deg, rgba(18, 18, 18, 0.95), ${linkedColor.primary}20)`
          : `linear-gradient(135deg, ${linkedColor.background}, ${linkedColor.background})`,
        border: isSelected
          ? `2px solid ${linkedColor.primary}`
          : `2px solid ${linkedColor.border}`,
        boxShadow: isSelected
          ? `0 0 0 1px ${linkedColor.glow}, 0 0 25px ${linkedColor.glow}`
          : `0 0 16px ${linkedColor.glow}`,
        tableNumberColor: linkedColor.primary,
        tableNumberGlow: baseCardStyles.tableNumberGlow
      }
    : baseCardStyles;

  const isOccupied = data.status !== 'AVAILABLE';
  // Show status badge for all occupied statuses (SEATED, ORDERING, SENT_TO_KITCHEN)
  const showStatusBadge = isOccupied;
  const badgeStyles = showStatusBadge ? getStatusBadgeStyles(data.status) : null;

  // Get urgency indicator styling
  const urgencyLevel = data.urgency?.level || 'none';
  const showUrgencyIndicator = urgencyLevel !== 'none' && urgencyLevel !== 'low';
  const urgencyColor = URGENCY_COLORS[urgencyLevel];
  const urgencyAnimation = urgencyLevel === 'critical' ? 'animate-pulse-fast' :
                           urgencyLevel === 'high' ? 'animate-pulse' :
                           'animate-pulse-slow';

  // Format bill total for display
  const formattedBillTotal = data.billTotal != null && data.billTotal > 0
    ? `£${data.billTotal.toFixed(2)}`
    : null;

  return (
    <Card
      className="group relative cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col h-full overflow-hidden"
      style={{
        background: cardStyles.background,
        border: cardStyles.border,
        boxShadow: cardStyles.boxShadow,
        backdropFilter: 'blur(12px)'
      }}
      onClick={onClick}
    >
      {/* TOP ROW: 3-column grid for Table Number | Badge | Urgency */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-3 pt-3 gap-2">
        {/* Table Number - LEFT */}
        <div
          className="text-2xl font-bold tracking-tight"
          style={{
            color: cardStyles.tableNumberColor,
            textShadow: cardStyles.tableNumberGlow
          }}
        >
          T{data.tableNumber}
        </div>

        {/* Status Badge - CENTER */}
        <div className="flex justify-center">
          {showStatusBadge && badgeStyles ? (
            <Badge
              className="text-xs font-medium px-2 py-0.5"
              style={badgeStyles}
            >
              {data.statusLabel}
            </Badge>
          ) : (
            <span
              className="text-xs font-medium"
              style={{ color: QSAITheme.text.muted }}
            >
              {data.statusLabel}
            </span>
          )}
        </div>

        {/* Urgency Indicator - RIGHT (or empty placeholder) */}
        <div className="w-3 h-3 flex items-center justify-center">
          {showUrgencyIndicator && (
            <div
              className={`w-3 h-3 rounded-full ${urgencyAnimation}`}
              style={{ backgroundColor: urgencyColor }}
              title={data.urgency?.reason || 'Needs attention'}
            />
          )}
        </div>
      </div>

      {/* OCCUPIED TABLE LAYOUT */}
      {isOccupied ? (
        <>
          {/* Guest Count Row */}
          <div className="flex items-center gap-1.5 px-3 pt-1">
            <User className="h-3.5 w-3.5" style={{ color: QSAITheme.text.muted }} />
            <span
              className="text-sm"
              style={{ color: QSAITheme.text.secondary }}
            >
              {data.guestCount || '?'}
            </span>
          </div>

          {/* Separator Line */}
          <div
            className="mx-3 my-2 h-px"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />

          {/* Duration + Bill Total Row */}
          <div className="flex items-center justify-between px-3 pb-2 flex-1">
            {/* Left: Trash (on hover) + Duration */}
            <div className="flex items-center gap-2">
              {/* Trash icon - inline, visible on hover */}
              {onResetClick && (
                <button
                  className="p-1 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-red-500/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetClick(data.tableNumber);
                  }}
                  title={data.isLinked ? `Unlink Table ${data.tableNumber}` : `Clear Table ${data.tableNumber}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
                </button>
              )}
              <span
                className="text-sm"
                style={{ color: QSAITheme.text.secondary }}
              >
                {data.durationText || '0m'}
              </span>
            </div>

            {/* Right: Bill Total (larger, bolder) */}
            {formattedBillTotal && (
              <span
                className="text-base font-bold"
                style={{ color: '#22C55E' }}
              >
                {formattedBillTotal}
              </span>
            )}
          </div>

          {/* Linked Tables + Customer Tabs (if any) */}
          {(data.linkedDisplay || data.tabsDisplayFormatted) && (
            <div className="px-3 pb-2 space-y-0.5">
              {/* Linked Tables Indicator */}
              {data.linkedDisplay && (
                <div className="flex items-center gap-1">
                  <Link2
                    className="h-3 w-3"
                    style={{ color: linkedColor?.primary || QSAITheme.accent?.turquoise || '#14B8A6' }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: linkedColor?.primary || QSAITheme.accent?.turquoise || '#14B8A6' }}
                  >
                    {data.linkedDisplay}
                  </span>
                </div>
              )}

              {/* Customer Tab Names */}
              {data.tabsDisplayFormatted && (
                <div className="overflow-hidden">
                  <span
                    className="text-xs truncate block max-w-full"
                    style={{ color: QSAITheme.text.muted }}
                    title={data.tabsDisplay || undefined}
                  >
                    {data.tabsDisplayFormatted}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* AVAILABLE TABLE LAYOUT - Capacity centered, larger text */
        <div className="flex-1 flex items-center justify-center">
          <span
            className="text-base font-medium"
            style={{ color: QSAITheme.text.muted }}
          >
            Seats: {data.capacity}
          </span>
        </div>
      )}

    </Card>
  );
});

export default TableDashboardCard;
