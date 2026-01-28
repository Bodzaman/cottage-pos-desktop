import React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable modal layout shell: sticky header, scrollable body, sticky footer.
 * Place inside DialogContent (which provides portal, overlay, centering, sizing).
 *
 * DialogContent should use `overflow-hidden flex flex-col` and explicit height/max-height
 * so this shell fills the available space correctly.
 */
export interface ModalShellProps {
  /** Fixed header region (title bar, tabs, close button, etc.) */
  header?: React.ReactNode;
  /** Fixed footer region (action buttons, summary bar, etc.) */
  footer?: React.ReactNode;
  /** Scrollable body content */
  children: React.ReactNode;
  /** Extra classes on the root flex container */
  className?: string;
  /** Extra classes on the scrollable body region */
  bodyClassName?: string;
}

export function ModalShell({
  header,
  footer,
  children,
  className,
  bodyClassName,
}: ModalShellProps) {
  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      {header && (
        <div className="shrink-0">{header}</div>
      )}
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overscroll-contain",
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer && (
        <div className="shrink-0">{footer}</div>
      )}
    </div>
  );
}

export default ModalShell;
