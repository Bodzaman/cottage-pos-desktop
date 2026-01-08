import React from 'react';
import { colors as designColors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';
import { Button } from '@/components/ui/button';
import { CompletedOrder } from '../utils/orderManagementService';
import { formatCurrency } from '../utils/formatters';
import { AlertCircle, Check, Clock, MessageSquare, Phone, Printer, ShoppingBag, Truck, X, Headphones } from 'lucide-react';
import { apiClient } from 'app';

export interface OrderActionPanelProps {
  order: CompletedOrder | null;
  onApprove?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onProcess?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onCallCustomer?: (phone: string) => void;
  onTextCustomer?: (phone: string) => void;
  onEditInPos?: (order: CompletedOrder) => void;
  className?: string;
}

/**
 * Right panel component that displays order actions and summary.
 * Used in AI Orders and Online Orders sections of the POS system.
 */
export function OrderActionPanel({
  order,
  onApprove,
  onReject,
  onProcess,
  onComplete,
  onCallCustomer,
  onTextCustomer,
  onEditInPos,
  className = ''
}: OrderActionPanelProps) {
  // If no order selected, show placeholder
  if (!order) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto" style={{ 
            color: globalColors.purple.primary + '40',
            filter: `drop-shadow(0 0 8px ${globalColors.purple.primary}30)` 
          }} />
          <h3 className="text-lg font-medium" style={{ color: designColors.text.primary }}>
            Select an Order
          </h3>
          <p className="text-sm max-w-xs" style={{ color: designColors.text.secondary }}>
            Choose an order from the queue to manage it.
          </p>
        </div>
      </div>
    );
  }
  
  // Check if this is a voice order
  const isVoiceOrder = order.order_source === 'AI_VOICE';

  // Determine which actions to show based on order status
  const isNewOrder = order.status === 'NEW';
  const isProcessing = order.status === 'PROCESSING' || order.status === 'APPROVED' || order.status === 'IN_PROGRESS';
  const isReady = order.status === 'READY';
  
  // Get icon for order type
  const getOrderTypeIcon = () => {
    // For voice orders, show voice icon regardless of order type
    if (order.order_source === 'AI_VOICE') {
      return <Headphones className="h-5 w-5" />;
    }
    
    // For regular orders, show icon based on order type
    switch (order.order_type) {
      case 'DELIVERY':
        return <Truck className="h-5 w-5" />;
      case 'COLLECTION':
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className={`h-full overflow-y-auto p-4 ${className}`}>
      {/* Order Summary Card */}
      <div 
        className="rounded-lg p-4 mb-6" 
        style={{
          backgroundColor: `${designColors.background.secondary}80`,
          color: designColors.text.primary,
          border: `1px solid ${designColors.border.light}`
        }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: designColors.text.primary }}>
          Order Summary
        </h3>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-md" style={{
            backgroundColor: order.order_source === 'AI_VOICE' 
              ? `${globalColors.purple.primary}40` 
              : `${globalColors.purple.primary}20`,
          }}>
            {getOrderTypeIcon()}
          </div>
          <div>
            <div className="font-medium" style={{ color: designColors.text.primary }}>
              {order.order_type} {order.order_source === 'AI_VOICE' && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  backgroundColor: `${globalColors.purple.primary}30`,
                  color: globalColors.purple.light
                }}>
                  Voice Order
                </span>
              )}
            </div>
            <div className="text-sm" style={{ color: designColors.text.secondary }}>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>
        
        <div className="mb-3 pt-3 border-t" style={{ borderColor: designColors.border.light }}>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: designColors.text.secondary }}>Total:</span>
            <span className="text-xl font-bold" style={{ color: designColors.text.primary }}>
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: designColors.text.primary }}>
          Order Actions
        </h3>

        {/* Actions based on order status */}
        {isNewOrder && onApprove && onReject && (
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              onClick={() => onReject(order.order_id)}
              className="justify-center"
              style={{ 
                border: `1px solid ${designColors.status.error}40`,
                color: designColors.status.error,
                backgroundColor: `${designColors.background.secondary}80`
              }}
            >
              <X className="h-4 w-4 mr-2" /> Reject
            </Button>
            
            <Button 
              onClick={() => onApprove(order.order_id)}
              className="justify-center bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
            >
              <Check className="h-4 w-4 mr-2" /> Approve
            </Button>
          </div>
        )}
        
        {isProcessing && onProcess && (
          <Button 
            onClick={() => onProcess(order.order_id)}
            className="w-full justify-center bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
          >
            <Clock className="h-4 w-4 mr-2" /> Mark as Ready
          </Button>
        )}
        
        {isReady && onComplete && (
          <Button 
            onClick={() => onComplete(order.order_id)}
            className="w-full justify-center bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
          >
            <Check className="h-4 w-4 mr-2" /> Complete Order
          </Button>
        )}
        
        {/* Edit in POS button - available for all non-dine-in orders */}
        {onEditInPos && order.order_type !== 'DINE-IN' && (
          <Button 
            className="w-full justify-center bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md mb-3"
            onClick={() => {
              if (onEditInPos && order) {
                // Pass the order to the handler
                onEditInPos(order);
              }
            }}
            style={isVoiceOrder ? {
              backgroundColor: 'rgba(124, 93, 250, 0.1)',
              borderColor: 'rgba(124, 93, 250, 0.3)',
              color: '#7C5DFA'
            } : {}}
          >
            <ShoppingBag className="h-4 w-4 mr-2" /> {isVoiceOrder ? 'Transfer to POS' : 'Edit in POS'}
          </Button>
        )}
        
        {/* Print button - always available */}
        <Button 
          variant="outline"
          className="w-full justify-center"
          style={{ 
            border: `1px solid ${globalColors.purple.primary}40`,
            color: globalColors.purple.primary,
            backgroundColor: `${designColors.background.secondary}80`
          }}
          onClick={() => {
            // Print functionality would go here
          }}
        >
          <Printer className="h-4 w-4 mr-2" /> Print Receipt
        </Button>
        
        {/* Customer contact options */}
        {order.customer?.phone && (
          <div className="mt-4">
            <h4 className="text-xs" style={{ color: designColors.text.tertiary }}>Customer Actions</h4>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {onCallCustomer && (
                <Button 
                  variant="outline" 
                  className="justify-center"
                  style={{ 
                    border: `1px solid ${globalColors.blue}40`,
                    color: globalColors.blue,
                    backgroundColor: `${designColors.background.secondary}80`
                  }}
                  onClick={() => {
                    // If external handler is provided, use it
                    if (onCallCustomer) {
                      onCallCustomer(order.customer!.phone!);
                    } else {
                      // Fallback to direct calling
                      window.location.href = `tel:${order.customer!.phone!}`;
                    }
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
              )}
              
              {onTextCustomer && (
                <Button 
                  variant="outline" 
                  className="justify-center"
                  style={{ 
                    border: `1px solid ${globalColors.purple.light}40`,
                    color: globalColors.purple.light,
                    backgroundColor: `${designColors.background.secondary}80`
                  }}
                  onClick={() => {
                    if (onTextCustomer) {
                      onTextCustomer(order.customer!.phone!);
                    } else {
                      // Send confirmation using toast notification instead
                      toast.success(`Confirmation sent to ${order.customer!.phone!}`);
                      if (order.order_id) {
                        console.log(`Would send confirmation for order ${order.order_id}`);
                      }
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Text
                </Button>
              )}
            </div>
            
            {/* For voice orders, show confidence score indicator */}
            {isVoiceOrder && typeof order.confidence_score === 'number' && (
              <div className="mt-3 rounded p-2" style={{ backgroundColor: `${designColors.background.secondary}` }}>
                <p className="text-xs mb-1" style={{ color: designColors.text.tertiary }}>Voice Recognition Confidence:</p>
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: `${designColors.background.tertiary}` }}>
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{
                      width: `${Math.min(100, Math.max(0, order.confidence_score * 100))}%`,
                      backgroundColor: order.confidence_score >= 0.8 ? designColors.status.success : 
                                      order.confidence_score >= 0.6 ? designColors.status.warning : designColors.status.error
                    }}
                  ></div>
                </div>
                <p className="text-right text-xs mt-1" style={{ color: designColors.text.tertiary }}>
                  {Math.round(order.confidence_score * 100)}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
