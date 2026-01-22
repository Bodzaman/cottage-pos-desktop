import React from "react";

// Shared 3-column modal shell with a single header and three independent scrollable columns.
// Ensures consistent sizing and prevents horizontal overflow by applying min-w-0.
// Usage: place inside DialogContent, which should set width/height. The shell will take full height.

export interface ModalShell3ColProps {
  header: React.ReactNode;
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}

export function ModalShell3Col({ header, left, center, right, className }: ModalShell3ColProps) {
  return (
    <div className={`h-full grid grid-rows-[auto,1fr] min-h-0 ${className ?? ""}`}>
      {/* Sticky Header outside scrollable columns */}
      <div className="border-b border-border p-6 sticky top-0 z-10 bg-background">
        {header}
      </div>

      {/* Body: Three scrollable columns */}
      <div className="grid grid-cols-[16rem,1fr,24rem] h-full min-w-0 min-h-0">
        {/* Left column */}
        <div className="min-w-0 min-h-0 overflow-y-auto overflow-x-hidden border-r border-border">
          {left}
        </div>

        {/* Center column */}
        <div className="min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
          {center}
        </div>

        {/* Right column */}
        <div className="min-w-0 min-h-0 overflow-y-auto overflow-x-hidden border-l border-border">
          {right}
        </div>
      </div>
    </div>
  );
}

export default ModalShell3Col;
