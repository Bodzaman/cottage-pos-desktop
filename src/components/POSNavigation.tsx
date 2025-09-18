
/**
 * POSNavigation - POS Navigation Component
 * Adapted for cottage-pos-desktop Electron app
 * 
 * Original from Databutton Cottage Tandoori platform
 * Adapted for standalone Electron application
 */

import React from "react";
import { OrderSelector } from "./OrderSelector";
import { colors } from "../utils/designSystem";
import { POSViewType } from "./POSViewContainer";
import { Button } from "../components/ui/button";
import { Calendar, Utensils } from 'lucide-react';

type POSNavigationProps = {
  className?: string;
  activeView?: POSViewType;
  onViewChange?: (view: POSViewType) => void;
  currentOrderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "AI_ORDERS" | "ONLINE_ORDERS";
  onOrderTypeChange?: (type: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING" | "AI_ORDERS" | "ONLINE_ORDERS") => void;
  aiOrdersCount?: number;
  onlineOrdersCount?: number;
  notifications?: {
    kitchen?: number;
    onlineOrders?: number;
    aiOrders?: number;
    reservations?: number;
  };
};

export function POSNavigation({ 
  className = "", 
  activeView, 
  onViewChange, 
  currentOrderType = "DINE-IN", 
  onOrderTypeChange, 
  aiOrdersCount = 0, 
  onlineOrdersCount = 0 
}: POSNavigationProps) {

  return (
    <div className={className} style={{ background: colors.background.primary, color: colors.text.primary }}>
      {/* Order Type Selector - only show in POS view */}
      {onOrderTypeChange && currentOrderType && activeView === 'pos' && (
        <OrderSelector
          currentOrderType={currentOrderType}
          onOrderTypeChange={onOrderTypeChange}
          aiOrdersCount={aiOrdersCount}
          onlineOrdersCount={onlineOrdersCount}
        />
      )}
    </div>
  );
}
