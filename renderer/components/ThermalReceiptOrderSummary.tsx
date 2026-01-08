import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { AppApisTableOrdersOrderItem } from 'types';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';

interface Props {
  orderItems: AppApisTableOrdersOrderItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCompleteOrder: () => void;
  className?: string;
}

/**
 * ThermalReceiptOrderSummary - Right panel for ThermalReceiptMenuModal
 * Shows selected items for building thermal receipt preview
 */
export function ThermalReceiptOrderSummary({
  orderItems,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder,
  className
}: Props) {
  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const total = subtotal; // No tax/discount for receipt design

  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* Header */}
      <div 
        className="p-4 border-b flex items-center gap-2"
        style={{ 
          borderColor: QSAITheme.border.light,
          backgroundColor: QSAITheme.background.secondary
        }}
      >
        <ShoppingCart className="w-5 h-5" style={{ color: QSAITheme.purple.primary }} />
        <h3 className="font-semibold" style={{ color: QSAITheme.text.primary }}>
          Receipt Items
        </h3>
        <Badge 
          variant="secondary" 
          className="ml-auto"
          style={{ 
            backgroundColor: QSAITheme.purple.primary + '20',
            color: QSAITheme.purple.primary 
          }}
        >
          {orderItems.length}
        </Badge>
      </div>

      {/* Items List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {orderItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: QSAITheme.text.muted }} />
              <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                No items selected yet.
              </p>
              <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                Browse menu and add items for receipt preview.
              </p>
            </div>
          ) : (
            orderItems.map((item, index) => (
              <div 
                key={`${item.id}-${index}`}
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: QSAITheme.background.tertiary,
                  borderColor: QSAITheme.border.light
                }}
              >
                {/* Item Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium text-sm leading-tight"
                      style={{ color: QSAITheme.text.primary }}
                    >
                      {item.variantName || item.name}
                    </h4>
                    
                    {item.notes && (
                      <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="h-6 w-6 p-0 hover:bg-red-500/20"
                  >
                    <X className="w-3 h-3" style={{ color: QSAITheme.text.muted }} />
                  </Button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      className="h-7 w-7 p-0"
                      style={{
                        borderColor: QSAITheme.border.medium,
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <span 
                      className="w-8 text-center text-sm font-medium"
                      style={{ color: QSAITheme.text.primary }}
                    >
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      className="h-7 w-7 p-0"
                      style={{
                        borderColor: QSAITheme.border.medium,
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <div 
                      className="text-sm font-medium"
                      style={{ color: QSAITheme.text.primary }}
                    >
                      £{((item.price || 0) * item.quantity).toFixed(2)}
                    </div>
                    <div 
                      className="text-xs opacity-70"
                      style={{ color: QSAITheme.text.secondary }}
                    >
                      £{(item.price || 0).toFixed(2)} each
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {orderItems.length > 0 && (
        <div 
          className="p-4 border-t"
          style={{ 
            borderColor: QSAITheme.border.light,
            backgroundColor: QSAITheme.background.secondary
          }}
        >
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span style={{ color: QSAITheme.text.secondary }}>Subtotal</span>
              <span style={{ color: QSAITheme.text.primary }}>£{subtotal.toFixed(2)}</span>
            </div>
            
            <Separator style={{ backgroundColor: QSAITheme.border.light }} />
            
            <div className="flex justify-between font-semibold">
              <span style={{ color: QSAITheme.text.primary }}>Total</span>
              <span style={{ color: QSAITheme.text.primary }}>£{total.toFixed(2)}</span>
            </div>
          </div>
          
          <Button
            onClick={onCompleteOrder}
            className="w-full"
            style={{
              backgroundColor: QSAITheme.purple.primary,
              color: 'white'
            }}
          >
            Add {orderItems.length} Item{orderItems.length === 1 ? '' : 's'} to Receipt
          </Button>
        </div>
      )}
    </div>
  );
}

export default ThermalReceiptOrderSummary;
