/**
 * OnlineOrderKanban Component
 * Three-column Kanban layout for online order management
 * Columns: NEW | PREPARING | READY
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ChefHat, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnlineOrderCard } from './OnlineOrderCard';
import { OnlineOrder, OnlineOrderStatus } from 'utils/stores/onlineOrdersRealtimeStore';

/** Column color config for gradient headers + glow */
interface ColumnColorConfig {
  headerBg: string;
  headerBorder: string;
  headerGlow: string;
}

const COLUMN_COLORS = {
  blue: {
    headerBg: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.08) 100%)',
    headerBorder: 'rgba(59,130,246,0.25)',
    headerGlow: '0 4px 12px rgba(59,130,246,0.15)',
  },
  purple: {
    headerBg: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(91,33,182,0.08) 100%)',
    headerBorder: 'rgba(124,58,237,0.25)',
    headerGlow: '0 4px 12px rgba(124,58,237,0.15)',
  },
  green: {
    headerBg: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.08) 100%)',
    headerBorder: 'rgba(34,197,94,0.25)',
    headerGlow: '0 4px 12px rgba(34,197,94,0.15)',
  },
} as const;

interface KanbanColumnProps {
  title: string;
  icon: React.ReactNode;
  orders: OnlineOrder[];
  colorConfig: ColumnColorConfig;
  emptyMessage: string;
  selectedOrderId?: string | null;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
  isActionLoading?: boolean;
}

function KanbanColumn({
  title,
  icon,
  orders,
  colorConfig,
  emptyMessage,
  selectedOrderId,
  onAccept,
  onReject,
  onMarkReady,
  onComplete,
  onViewDetails,
  onSelectOrder,
  isActionLoading,
}: KanbanColumnProps) {
  return (
    <div
      className="flex-1 flex flex-col min-w-[300px] rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(25,25,25,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(124,93,250,0.12)',
        boxShadow: '0 8px 24px -6px rgba(0,0,0,0.5)',
      }}
    >
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: colorConfig.headerBg,
          borderBottom: `1px solid ${colorConfig.headerBorder}`,
          boxShadow: colorConfig.headerGlow,
        }}
      >
        {icon}
        <span className="font-semibold text-white">{title}</span>
        <Badge variant="secondary" className="ml-auto">
          {orders.length}
        </Badge>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 p-3">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OnlineOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrderId === order.id}
                onAccept={onAccept}
                onReject={onReject}
                onMarkReady={onMarkReady}
                onComplete={onComplete}
                onViewDetails={onViewDetails}
                onSelect={onSelectOrder}
                isActionLoading={isActionLoading}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface OnlineOrderKanbanProps {
  newOrders: OnlineOrder[];
  preparingOrders: OnlineOrder[];
  readyOrders: OnlineOrder[];
  selectedOrderId?: string | null;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onMarkReady: (orderId: string) => void;
  onComplete: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  onSelectOrder?: (orderId: string) => void;
  isActionLoading?: boolean;
}

export function OnlineOrderKanban({
  newOrders,
  preparingOrders,
  readyOrders,
  selectedOrderId,
  onAccept,
  onReject,
  onMarkReady,
  onComplete,
  onViewDetails,
  onSelectOrder,
  isActionLoading,
}: OnlineOrderKanbanProps) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto p-4">
      {/* NEW Orders Column */}
      <KanbanColumn
        title="New Orders"
        icon={<Clock className="w-5 h-5 text-blue-500" />}
        orders={newOrders}
        colorConfig={COLUMN_COLORS.blue}
        emptyMessage="No new orders"
        selectedOrderId={selectedOrderId}
        onAccept={onAccept}
        onReject={onReject}
        onViewDetails={onViewDetails}
        onSelectOrder={onSelectOrder}
        isActionLoading={isActionLoading}
      />

      {/* PREPARING Orders Column */}
      <KanbanColumn
        title="Preparing"
        icon={<ChefHat className="w-5 h-5 text-purple-500" />}
        orders={preparingOrders}
        colorConfig={COLUMN_COLORS.purple}
        emptyMessage="No orders being prepared"
        selectedOrderId={selectedOrderId}
        onMarkReady={onMarkReady}
        onViewDetails={onViewDetails}
        onSelectOrder={onSelectOrder}
        isActionLoading={isActionLoading}
      />

      {/* READY Orders Column */}
      <KanbanColumn
        title="Ready"
        icon={<Package className="w-5 h-5 text-green-500" />}
        orders={readyOrders}
        colorConfig={COLUMN_COLORS.green}
        emptyMessage="No orders ready"
        selectedOrderId={selectedOrderId}
        onComplete={onComplete}
        onViewDetails={onViewDetails}
        onSelectOrder={onSelectOrder}
        isActionLoading={isActionLoading}
      />
    </div>
  );
}

export default OnlineOrderKanban;
