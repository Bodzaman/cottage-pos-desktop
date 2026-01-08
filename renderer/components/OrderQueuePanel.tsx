import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { colors as designColors } from '../utils/designSystem';
import { globalColors, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import { formatCurrency } from '../utils/formatters';
import { Phone, ShoppingBag, Truck, Zap } from 'lucide-react';
import { CompletedOrder } from '../utils/orderManagementService';

export type OrderQueuePanelProps = {
  orders: CompletedOrder[];
  selectedOrderId: string | null;
  onOrderSelect: (orderId: string) => void;
  orderSource: 'AI_VOICE' | 'WEBSITE';
  className?: string;
  onEditOrder?: (orderId: string) => void;
  onApproveOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
}

/**
 * Left panel component that displays a list of orders in a queue format.
 * Used in AI Orders and Online Orders sections of the POS system.
 */
// Helper function to get CSS class based on confidence score
const getConfidenceClass = (confidence: number) => {
  if (confidence >= 0.9) {
    return 'bg-green-500/20 text-green-400';
  } else if (confidence >= 0.7) {
    return 'bg-yellow-500/20 text-yellow-400';
  } else {
    return 'bg-red-500/20 text-red-400';
  }
};

export function OrderQueuePanel({
  orders,
  selectedOrderId,
  onOrderSelect,
  orderSource,
  className = '',
  onEditOrder,
  onApproveOrder,
  onRejectOrder
}: OrderQueuePanelProps) {
  // Get appropriate icon for order type
  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'DELIVERY':
        return <Truck className="h-4 w-4" />;
      case 'COLLECTION':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  // Get appropriate label for order status
  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return "New";
      case "APPROVED":
      case "PROCESSING":
        return "Processing";
      case "IN_PROGRESS":
        return "In Progress";
      case "READY":
        return "Ready";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return 'rgba(59, 130, 246, 0.7)';
      case "APPROVED":
      case "PROCESSING":
        return 'rgba(245, 158, 11, 0.7)';
      case "IN_PROGRESS":
        return 'rgba(245, 158, 11, 0.7)';
      case "READY":
        return 'rgba(139, 92, 246, 0.7)';
      case "COMPLETED":
        return 'rgba(16, 185, 129, 0.7)';
      case "CANCELLED":
      case "REFUNDED":
        return 'rgba(239, 68, 68, 0.7)';
      default:
        return 'rgba(107, 114, 128, 0.7)';
    }
  };

  // If no orders, show empty state
  if (orders.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <div className="p-4 rounded-full mb-4" style={{
          background: `linear-gradient(145deg, rgba(124, 93, 250, 0.1) 0%, rgba(124, 93, 250, 0.2) 100%)`,
          backdropFilter: 'blur(4px)',
          border: `1px solid rgba(124, 93, 250, 0.15)`,
          boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1), ${effects.innerGlow('subtle')}`
        }}>
          {orderSource === 'AI_VOICE' ? (
            <Phone className="h-10 w-10" style={{ 
              color: globalColors.purple.primary,
              filter: `drop-shadow(0 0 4px ${globalColors.purple.primary}50)` 
            }} />
          ) : (
            <ShoppingBag className="h-10 w-10" style={{ 
              color: globalColors.purple.primary,
              filter: `drop-shadow(0 0 4px ${globalColors.purple.primary}50)` 
            }} />
          )}
        </div>
        <h3 className="text-lg font-medium mb-2" style={{ color: designColors.text.primary }}>
          No Orders in Queue
        </h3>
        <p className="text-center text-sm" style={{ color: designColors.text.secondary }}>
          {orderSource === 'AI_VOICE' ? 
            'When customers place orders via phone, they will appear here.' : 
            'When customers place online orders, they will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      <h3 className="text-lg font-semibold mb-4 px-2" style={{ color: designColors.text.primary }}>
        Order Queue
      </h3>
      
      <div className="space-y-2">
        {orders.map(order => {
          const isNew = order.status === 'NEW';
          const isSelected = order.order_id === selectedOrderId;

          return (
            <div 
              key={order.order_id}
              onClick={() => onOrderSelect(order.order_id)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2' : 'hover:bg-white/5'}`}
              style={{
                backgroundColor: isSelected ? `${globalColors.background.dark}` : isNew ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderLeft: isNew ? '3px solid rgba(59, 130, 246, 0.7)' : '3px solid transparent',
                boxShadow: isSelected ? `0 0 0 1px ${globalColors.purple.primary}40` : 'none',
                transform: isSelected ? 'translateY(-1px)' : 'none',
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded" style={{
                    backgroundColor: isNew ? 'rgba(59, 130, 246, 0.2)' : 'rgba(124, 93, 250, 0.2)',
                  }}>
                    {getOrderTypeIcon(order.order_type)}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: designColors.text.primary }}>
                      {order.order_id}
                    </div>
                    <div className="text-xs" style={{ color: designColors.text.tertiary }}>
                      {format(new Date(order.created_at || order.completed_at), "h:mm a")}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex justify-between">
                    {/* Confidence score indicator */}
                    {order.confidence_score !== undefined && (
                      <div 
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getConfidenceClass(order.confidence_score)}`}
                        title={`AI confidence: ${Math.round(order.confidence_score * 100)}%`}
                      >
                        <Zap className="h-3 w-3" />
                        <span>{Math.round(order.confidence_score * 100)}%</span>
                      </div>
                    )}
                    
                    {/* Order value */}
                    <div className="font-bold" style={{ color: designColors.text.primary }}>
                      {formatCurrency(order.total || order.total_amount || 0)}
                    </div>
                  </div>
                  <Badge 
                    className="text-xs mt-1"
                    style={{ 
                      backgroundColor: getStatusColor(order.status),
                      color: '#ffffff',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </div>
              </div>

              {/* Customer name if available */}
              {order.customer_name && (
                <div className="mt-2 text-xs" style={{ color: designColors.text.secondary }}>
                  <span className="font-medium">{order.customer_name}</span>
                  {order.customer_phone && (
                    <span className="ml-2">{order.customer_phone}</span>
                  )}
                </div>
              )}

              {/* Basic item summary */}
              <div className="mt-2 flex text-xs" style={{ color: designColors.text.tertiary }}>
                <div className="truncate">
                  {order.items.length > 0 ? (
                    <span>
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}: 
                      {order.items.slice(0, 2).map(item => (
                        <span key={item.item_id || Math.random()}>
                          {item.quantity}x {item.item_name?.substring(0, 15) || item.name?.substring(0, 15)}
                        </span>
                      )).join(', ')}
                      {order.items.length > 2 && '...'}
                    </span>
                  ) : 'No items'}
                </div>
              </div>
              
              {/* Action buttons */}
              {(onEditOrder || onApproveOrder || onRejectOrder) && (
                <div className="mt-2 flex gap-2 justify-end">
                  {onRejectOrder && order.status === 'NEW' && (
                    <button
                      className="px-2 py-1 rounded-sm text-xs"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRejectOrder(order.order_id);
                      }}
                    >
                      Reject
                    </button>
                  )}
                  {onApproveOrder && order.status === 'NEW' && (
                    <button
                      className="px-2 py-1 rounded-sm text-xs"
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onApproveOrder(order.order_id);
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {onEditOrder && (
                    <button
                      className="px-2 py-1 rounded-sm text-xs"
                      style={{
                        backgroundColor: 'rgba(124, 93, 250, 0.15)',
                        color: globalColors.purple.primary,
                        border: '1px solid rgba(124, 93, 250, 0.3)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditOrder(order.order_id);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
