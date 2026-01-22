/**
 * TableDashboardCard
 *
 * A uniform-sized card displaying table information for the Dine-In Table Dashboard.
 * Shows different content based on table status (Empty vs Seated).
 */

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Link2, Trash2 } from 'lucide-react';
import { QSAITheme } from '../utils/QSAIDesign';
import {
  TableCardData,
  getCardStyles,
  getStatusBadgeStyles,
  STATUS_COLORS
} from '../utils/tableDashboardHelpers';
import type { LinkedTableColor } from '../utils/linkedTableColors';

interface TableDashboardCardProps {
  data: TableCardData;
  isSelected: boolean;
  onClick: () => void;
  onResetClick?: (tableNumber: number) => void;
  linkedColor?: LinkedTableColor | null; // Dynamic color for linked table groups
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
        tableNumberColor: linkedColor.primary
      }
    : baseCardStyles;
  const isOccupied = data.status !== 'AVAILABLE';
  const showStatusBadge = data.status === 'AWAITING_ORDER' || data.status === 'FOOD_SENT';
  const badgeStyles = showStatusBadge ? getStatusBadgeStyles(data.status) : null;

  return (
    <Card
      className="relative cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col h-full overflow-hidden"
      style={{
        background: cardStyles.background,
        border: cardStyles.border,
        boxShadow: cardStyles.boxShadow,
        backdropFilter: 'blur(12px)'
      }}
      onClick={onClick}
    >
      {/* Top Row: Guest Count / Capacity OR Capacity Badge */}
      <div className="flex items-center justify-between px-4 pt-3">
        {isOccupied ? (
          <>
            {/* Guest count / capacity for occupied tables */}
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" style={{ color: QSAITheme.text.muted }} />
              <span
                className="text-sm font-medium"
                style={{ color: QSAITheme.text.secondary }}
              >
                {data.guestCount || '?'}/{data.capacity}
              </span>
            </div>

            {/* Duration */}
            {data.durationText && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" style={{ color: QSAITheme.text.muted }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: QSAITheme.text.secondary }}
                >
                  {data.durationText}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Empty state - just show capacity badge on right */}
            <div />
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: QSAITheme.text.secondary,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {data.capacity}
            </Badge>
          </>
        )}
      </div>

      {/* Center: Table Number */}
      <div className="flex-1 flex flex-col items-center justify-center py-1">
        <div
          className="text-3xl font-bold tracking-tight"
          style={{ color: cardStyles.tableNumberColor }}
        >
          T{data.tableNumber}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-2 space-y-0.5">
        {/* Status Label or Badge */}
        <div className="flex justify-center">
          {showStatusBadge && badgeStyles ? (
            <Badge
              className="text-xs font-medium px-2.5 py-1"
              style={badgeStyles}
            >
              {data.statusLabel}
            </Badge>
          ) : (
            <span
              className="text-sm font-medium"
              style={{ color: cardStyles.tableNumberColor }}
            >
              {data.statusLabel}
            </span>
          )}
        </div>

        {/* Empty table: Show "Seats: X" */}
        {!isOccupied && (
          <div className="text-center">
            <span
              className="text-xs"
              style={{ color: QSAITheme.text.muted }}
            >
              Seats: {data.capacity}
            </span>
          </div>
        )}

        {/* Linked Tables Indicator */}
        {data.linkedDisplay && (
          <div className="flex items-center justify-center gap-1">
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
          <div className="text-center overflow-hidden">
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

      {/* Reset/Clear Table Button - Only for occupied tables */}
      {isOccupied && onResetClick && (
        <button
          className="absolute bottom-2 left-2 p-1.5 rounded-md transition-all duration-200 hover:scale-110 hover:bg-red-500/20"
          onClick={(e) => {
            e.stopPropagation();
            onResetClick(data.tableNumber);
          }}
          title={data.isLinked ? `Unlink Table ${data.tableNumber}` : `Clear Table ${data.tableNumber}`}
        >
          <Trash2 className="w-4 h-4 text-white/50 hover:text-red-400" />
        </button>
      )}
    </Card>
  );
});

export default TableDashboardCard;
