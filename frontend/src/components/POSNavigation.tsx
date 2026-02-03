import React from "react";
import { OrderSelector } from "./OrderSelector";
import { colors } from "../utils/designSystem";
import { POSViewMode } from "../utils/posUIStore";

type POSNavigationProps = {
  className?: string;
  currentViewMode: POSViewMode;
  onViewModeChange: (mode: POSViewMode) => void;
  onlineOrdersCount?: number;
};

export function POSNavigation({
  className = "",
  currentViewMode,
  onViewModeChange,
  onlineOrdersCount = 0,
}: POSNavigationProps) {
  return (
    <div className={className} style={{ background: colors.background.primary, color: colors.text.primary }}>
      <OrderSelector
        currentViewMode={currentViewMode}
        onViewModeChange={onViewModeChange}
        onlineOrdersCount={onlineOrdersCount}
      />
    </div>
  );
}
