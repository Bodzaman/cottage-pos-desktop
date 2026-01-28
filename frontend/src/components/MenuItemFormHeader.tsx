import React from 'react';
import { Clock, Lock } from 'lucide-react';

interface FormHeaderProps {
  isEditing: boolean;
  formTitle: string;
  isDirty: boolean;
  lastAutosaveTime: Date | null;
  /** Subtitle text showing item type and pricing mode, e.g. "Food - Single Price" */
  configSubtitle?: string;
  /** Whether the configuration is locked (editing existing item) */
  isConfigLocked?: boolean;
  // Legacy props kept for backward compatibility but no longer rendered
  completionPercentage?: number;
  estimatedTimeMinutes?: number;
  statusMessage?: string;
  errorMessage?: string;
  onDiscardDraft?: () => void;
}

/**
 * Compact header for the menu item form.
 * Shows title, config subtitle, unsaved indicator, and autosave timestamp.
 */
export const MenuItemFormHeader = React.memo<FormHeaderProps>(({
  formTitle,
  isDirty,
  lastAutosaveTime,
  configSubtitle,
  isConfigLocked = false,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
      {/* Left: Title + subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-lg font-semibold text-white truncate">
          {formTitle}
        </h2>
        {configSubtitle && (
          <span className="flex items-center gap-1.5 text-sm text-gray-400 shrink-0">
            {isConfigLocked && <Lock className="w-3 h-3" aria-label="Configuration locked" />}
            {configSubtitle}
          </span>
        )}
        {/* Unsaved changes dot */}
        {isDirty && (
          <span
            className="w-2 h-2 rounded-full bg-orange-500 shrink-0"
            aria-label="Unsaved changes"
            title="Unsaved changes"
          />
        )}
      </div>

      {/* Right: Autosave timestamp */}
      {lastAutosaveTime && (
        <span className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
          <Clock className="w-3 h-3" aria-hidden="true" />
          Draft saved {lastAutosaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
});

MenuItemFormHeader.displayName = 'MenuItemFormHeader';
