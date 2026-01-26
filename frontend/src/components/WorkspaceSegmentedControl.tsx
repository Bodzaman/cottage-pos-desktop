/**
 * WorkspaceSegmentedControl - View selector for the Dine-In Order Workspace
 *
 * Three segments: Add Items | Review | Bill
 * - Active segment highlighted with QSAI theme
 * - Bill tab has guardrail when staging items exist
 */

import { Plus, ClipboardList, Receipt, AlertCircle } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type WorkspaceView = 'add-items' | 'review' | 'bill';

interface WorkspaceSegmentedControlProps {
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  hasStagingItems: boolean;
  savedItemCount: number;
}

const viewConfig: Array<{
  value: WorkspaceView;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'add-items', label: 'Add Items', icon: <Plus size={16} /> },
  { value: 'review', label: 'Review', icon: <ClipboardList size={16} /> },
  { value: 'bill', label: 'Bill', icon: <Receipt size={16} /> },
];

export function WorkspaceSegmentedControl({
  activeView,
  onViewChange,
  hasStagingItems,
  savedItemCount,
}: WorkspaceSegmentedControlProps) {
  const handleClick = (view: WorkspaceView) => {
    // Let parent handle the navigation logic including guardrails
    onViewChange(view);
  };

  return (
    <TooltipProvider>
      <div
        className="flex items-center gap-1 p-1 mx-6 mb-4"
        style={{
          backgroundColor: QSAITheme.background.secondary,
          borderRadius: '12px',
          border: `1px solid ${QSAITheme.border.light}`,
        }}
      >
        {viewConfig.map(({ value, label, icon }) => {
          const isActive = activeView === value;
          const isBillWithStaging = value === 'bill' && hasStagingItems;
          const showWarning = isBillWithStaging;

          const button = (
            <button
              key={value}
              onClick={() => handleClick(value)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 px-4
                rounded-lg font-medium text-sm transition-all duration-150
                ${isActive ? 'shadow-lg' : 'hover:bg-white/5'}
              `}
              style={{
                backgroundColor: isActive
                  ? QSAITheme.purple.primary
                  : 'transparent',
                color: isActive
                  ? 'white'
                  : showWarning
                    ? '#F59E0B'
                    : QSAITheme.text.muted,
                boxShadow: isActive
                  ? `0 0 20px ${QSAITheme.purple.glow}`
                  : 'none',
              }}
            >
              {icon}
              {label}
              {/* Badge for Review showing saved item count */}
              {value === 'review' && savedItemCount > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(91, 33, 182, 0.3)',
                    color: isActive ? 'white' : QSAITheme.purple.light,
                  }}
                >
                  {savedItemCount}
                </span>
              )}
              {/* Warning icon for Bill when staging items exist */}
              {showWarning && !isActive && (
                <AlertCircle size={14} className="ml-1 text-yellow-500" />
              )}
            </button>
          );

          // Wrap Bill button with tooltip when staging items exist
          if (showWarning && !isActive) {
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-yellow-900 text-yellow-100 border-yellow-700"
                >
                  <p>You have unsaved items. Save or discard before viewing bill.</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>
    </TooltipProvider>
  );
}

export default WorkspaceSegmentedControl;
