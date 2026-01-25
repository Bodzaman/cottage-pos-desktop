import React from "react";
import { InternalTheme, colors } from "../../utils/InternalDesignSystem";
import type { LucideIcon } from "lucide-react";

interface AdminModuleHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

export function AdminModuleHeader({
  title,
  description,
  icon: Icon,
  iconColor = colors.purple.primary,
  actions,
  sticky = false,
  className = "",
}: AdminModuleHeaderProps) {
  return (
    <div
      className={`
        flex flex-wrap gap-2 sm:gap-3 items-center justify-between
        px-4 sm:px-6 py-3 sm:py-4
        ${sticky ? `sticky top-0 z-30 ${InternalTheme.classes.surfaceToolbar}` : ""}
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        )}
        <div>
          <h2
            className="text-lg sm:text-xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="text-xs sm:text-sm mt-0.5"
              style={{ color: colors.text.muted }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
