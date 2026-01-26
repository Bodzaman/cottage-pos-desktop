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

interface KanbanColumnProps {
  title: string;
  icon: React.ReactNode;
  orders: OnlineOrder[];
  color: string;
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
  color,
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
    <div className="flex-1 flex flex-col min-w-[300px] bg-muted/30 rounded-lg border">
      {/* Column Header */}
      <div className={cn('flex items-center gap-2 px-4 py-3 border-b', color)}>
        {icon}
        <span className="font-semibold">{title}</span>
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
        color="bg-blue-500/10"
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
        color="bg-purple-500/10"
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
        color="bg-green-500/10"
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
