import React from "react";
import { OrderSelector } from "./OrderSelector";
import { colors } from "../utils/designSystem";
import { POSViewType } from "./POSViewContainer";
import { Button } from '@/components/ui/button';
import { Calendar, Utensils } from 'lucide-react';

type POSNavigationProps = {
  className?: string;
  activeView?: POSViewType;
  onViewChange?: (view: POSViewType) => void;
  currentOrderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "ONLINE_ORDERS";
  onOrderTypeChange?: (type: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "ONLINE_ORDERS") => void;
  onlineOrdersCount?: number;
  notifications?: {
    kitchen?: number;
    onlineOrders?: number;
    reservations?: number;
  };
  showAdminControls?: boolean;
};

export function POSNavigation({ className = "", activeView, onViewChange, currentOrderType = "DINE-IN", onOrderTypeChange, onlineOrdersCount = 0, showAdminControls = false }: POSNavigationProps) {
  return (
    <div className={className} style={{ background: colors.background.primary, color: colors.text.primary }}>
      {/* Top row: actions */}
      <div className="flex items-center justify-between">
        {/* Order Type Selector - only show in POS view */}
        {onOrderTypeChange && currentOrderType && activeView === 'pos' && (
          <OrderSelector
            currentOrderType={currentOrderType}
            onOrderTypeChange={onOrderTypeChange}
            onlineOrdersCount={onlineOrdersCount}
          />
        )}
      </div>
    </div>
  );
}
