import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { colors as designColors } from '../utils/designSystem';
import { globalColors, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/types';
import { formatCurrency } from '../utils/formatters';
import { Phone, ShoppingBag, Truck, Zap, Clock, AlertTriangle } from 'lucide-react';
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

// Urgency level thresholds (in seconds)
const URGENCY_THRESHOLDS = {
  CRITICAL: 60,      // < 1 minute - red, pulsing
  URGENT: 120,       // < 2 minutes - orange
  WARNING: 300,      // < 5 minutes - yellow
  NORMAL: Infinity,  // > 5 minutes - green
};

// Get urgency level based on seconds remaining
const getUrgencyLevel = (secondsRemaining: number): 'critical' | 'urgent' | 'warning' | 'normal' => {
  if (secondsRemaining < URGENCY_THRESHOLDS.CRITICAL) return 'critical';
  if (secondsRemaining < URGENCY_THRESHOLDS.URGENT) return 'urgent';
  if (secondsRemaining < URGENCY_THRESHOLDS.WARNING) return 'warning';
  return 'normal';
};

// Get urgency color
const getUrgencyColor = (level: 'critical' | 'urgent' | 'warning' | 'normal'): string => {
  switch (level) {
    case 'critical': return '#ef4444'; // Red
    case 'urgent': return '#f97316';   // Orange
    case 'warning': return '#eab308';  // Yellow
    case 'normal': return '#22c55e';   // Green
  }
};

// Format remaining time as MM:SS
const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Audio warning state - track which warnings have been played per order
const playedWarningsRef = new Map<string, Set<string>>();

// Play warning sound with volume based on urgency
const playWarningSound = (urgencyLevel: 'warning' | 'urgent' | 'critical') => {
  try {
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    const soundPath = isElectron
      ? './audio-sounds/online_order_notification_sound_pos.mp3'
      : '/audio-sounds/online_order_notification_sound_pos.mp3';

    const audio = new Audio(soundPath);
    // Volume escalates with urgency
    audio.volume = urgencyLevel === 'critical' ? 1.0 : urgencyLevel === 'urgent' ? 0.8 : 0.5;

    // For critical, play the sound twice in quick succession for emphasis
    audio.play().catch(() => {
      // Audio playback failed, possibly due to autoplay restrictions
    });

    if (urgencyLevel === 'critical') {
      setTimeout(() => {
        const audio2 = new Audio(soundPath);
        audio2.volume = 1.0;
        audio2.play().catch(() => {});
      }, 300);
    }
  } catch (err) {
    console.warn('Failed to play warning sound:', err);
  }
};

// Countdown Timer Component
const CountdownTimer = ({ deadline, orderId }: { deadline: string; orderId?: string }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [lastUrgencyLevel, setLastUrgencyLevel] = useState<string>('normal');

  useEffect(() => {
    const calculateRemaining = () => {
      const deadlineTime = new Date(deadline).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((deadlineTime - now) / 1000));
    };

    setSecondsRemaining(calculateRemaining());

    const interval = setInterval(() => {
      setSecondsRemaining(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const urgencyLevel = getUrgencyLevel(secondsRemaining);
  const urgencyColor = getUrgencyColor(urgencyLevel);
  const isPulsing = urgencyLevel === 'critical';

  // Play warning sounds when transitioning to higher urgency levels
  useEffect(() => {
    if (urgencyLevel !== lastUrgencyLevel && orderId) {
      // Get or create the set of played warnings for this order
      if (!playedWarningsRef.has(orderId)) {
        playedWarningsRef.set(orderId, new Set());
      }
      const playedWarnings = playedWarningsRef.get(orderId)!;

      // Play sound if we haven't played this level's warning for this order yet
      if (!playedWarnings.has(urgencyLevel) && urgencyLevel !== 'normal') {
        playWarningSound(urgencyLevel as 'warning' | 'urgent' | 'critical');
        playedWarnings.add(urgencyLevel);
      }

      setLastUrgencyLevel(urgencyLevel);
    }
  }, [urgencyLevel, lastUrgencyLevel, orderId]);

  // For critical orders, play repeating alert every 15 seconds
  useEffect(() => {
    if (urgencyLevel === 'critical' && orderId) {
      const repeatInterval = setInterval(() => {
        playWarningSound('critical');
      }, 15000); // Every 15 seconds

      return () => clearInterval(repeatInterval);
    }
  }, [urgencyLevel, orderId]);

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${isPulsing ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: `${urgencyColor}20`,
        color: urgencyColor,
        border: `1px solid ${urgencyColor}40`,
      }}
    >
      <Clock className="h-3 w-3" />
      <span>{formatTimeRemaining(secondsRemaining)}</span>
      {urgencyLevel === 'critical' && <AlertTriangle className="h-3 w-3 ml-1" />}
    </div>
  );
};

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
      case "AWAITING_ACCEPT":
        return "Awaiting Accept";
      case "CONFIRMED":
        return "Confirmed";
      case "APPROVED":
      case "PROCESSING":
      case "PREPARING":
        return "Preparing";
      case "IN_PROGRESS":
        return "In Progress";
      case "READY":
        return "Ready";
      case "COMPLETED":
      case "COLLECTED":
      case "DELIVERED":
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
      case "AWAITING_ACCEPT":
        return 'rgba(249, 115, 22, 0.7)'; // Orange for awaiting acceptance
      case "CONFIRMED":
        return 'rgba(34, 197, 94, 0.7)'; // Green for confirmed
      case "APPROVED":
      case "PROCESSING":
      case "PREPARING":
        return 'rgba(245, 158, 11, 0.7)';
      case "IN_PROGRESS":
        return 'rgba(245, 158, 11, 0.7)';
      case "READY":
        return 'rgba(139, 92, 246, 0.7)';
      case "COMPLETED":
      case "COLLECTED":
      case "DELIVERED":
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
          const isAwaitingAccept = order.status === 'AWAITING_ACCEPT';
          const isSelected = order.order_id === selectedOrderId;
          const acceptanceDeadline = (order as any).acceptance_deadline;

          // Calculate urgency for awaiting accept orders
          let urgencyLevel: 'critical' | 'urgent' | 'warning' | 'normal' = 'normal';
          let urgencyColor = 'transparent';
          let isPulsing = false;

          if (isAwaitingAccept && acceptanceDeadline) {
            const deadlineTime = new Date(acceptanceDeadline).getTime();
            const now = Date.now();
            const secondsRemaining = Math.max(0, Math.floor((deadlineTime - now) / 1000));
            urgencyLevel = getUrgencyLevel(secondsRemaining);
            urgencyColor = getUrgencyColor(urgencyLevel);
            isPulsing = urgencyLevel === 'critical';
          }

          return (
            <div
              key={order.order_id}
              onClick={() => onOrderSelect(order.order_id)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2' : 'hover:bg-white/5'} ${isPulsing ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: isSelected
                  ? `${globalColors.background.dark}`
                  : isAwaitingAccept
                    ? `${urgencyColor}15`
                    : isNew
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'transparent',
                borderLeft: isAwaitingAccept
                  ? `3px solid ${urgencyColor}`
                  : isNew
                    ? '3px solid rgba(59, 130, 246, 0.7)'
                    : '3px solid transparent',
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
                  <div className="flex justify-end gap-2">
                    {/* Countdown timer for AWAITING_ACCEPT orders */}
                    {isAwaitingAccept && acceptanceDeadline && (
                      <CountdownTimer deadline={acceptanceDeadline} orderId={order.order_id} />
                    )}

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
                  </div>

                  <div className="flex justify-end items-center gap-2 mt-1">
                    {/* Order value */}
                    <div className="font-bold" style={{ color: designColors.text.primary }}>
                      {formatCurrency(order.total || order.total_amount || 0)}
                    </div>
                    <Badge
                      className="text-xs"
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
                          {item.quantity}x {((item as any).item_name || item.name)?.substring(0, 15)}
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
                  {onRejectOrder && (order.status === 'NEW' || order.status === 'AWAITING_ACCEPT') && (
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
                  {onApproveOrder && (order.status === 'NEW' || order.status === 'AWAITING_ACCEPT') && (
                    <button
                      className={`px-2 py-1 rounded-sm text-xs ${isPulsing ? 'animate-none' : ''}`}
                      style={{
                        backgroundColor: isAwaitingAccept ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onApproveOrder(order.order_id);
                      }}
                    >
                      {isAwaitingAccept ? 'Accept' : 'Approve'}
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
