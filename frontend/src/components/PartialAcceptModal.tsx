import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import { formatCurrency } from '../utils/formatters';

interface OrderItem {
  id?: string;
  item_id?: string;
  name?: string;
  item_name?: string;
  quantity: number;
  price: number;
  variant?: string;
  notes?: string;
}

interface PartialAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (removedItems: RemovedItem[], modifiedItems: ModifiedItem[], refundAmount: number) => Promise<void>;
  orderNumber?: string;
  orderTotal?: number;
  items: OrderItem[];
}

interface RemovedItem {
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  reason?: string;
}

interface ModifiedItem {
  item_id: string;
  name: string;
  original_quantity: number;
  new_quantity: number;
  price: number;
}

export function PartialAcceptModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  orderTotal = 0,
  items,
}: PartialAcceptModalProps) {
  // Track item modifications
  const [itemStates, setItemStates] = useState<Map<string, { included: boolean; quantity: number }>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize item states when modal opens or items change
  useEffect(() => {
    if (isOpen && items.length > 0) {
      const initialStates = new Map<string, { included: boolean; quantity: number }>();
      items.forEach((item, index) => {
        const itemId = item.id || item.item_id || `item-${index}`;
        initialStates.set(itemId, {
          included: true,
          quantity: item.quantity,
        });
      });
      setItemStates(initialStates);
    }
  }, [isOpen, items]);

  // Calculate refund amount and new total
  const { refundAmount, newTotal, removedItems, modifiedItems, hasChanges } = useMemo(() => {
    let refund = 0;
    const removed: RemovedItem[] = [];
    const modified: ModifiedItem[] = [];

    items.forEach((item, index) => {
      const itemId = item.id || item.item_id || `item-${index}`;
      const state = itemStates.get(itemId);
      const itemName = item.name || item.item_name || 'Unknown Item';

      if (!state) return;

      if (!state.included) {
        // Item completely removed
        const itemTotal = item.price * item.quantity;
        refund += itemTotal;
        removed.push({
          item_id: itemId,
          name: itemName,
          quantity: item.quantity,
          price: item.price,
        });
      } else if (state.quantity < item.quantity) {
        // Quantity reduced
        const quantityDiff = item.quantity - state.quantity;
        const refundForItem = item.price * quantityDiff;
        refund += refundForItem;
        modified.push({
          item_id: itemId,
          name: itemName,
          original_quantity: item.quantity,
          new_quantity: state.quantity,
          price: item.price,
        });
      }
    });

    const changes = removed.length > 0 || modified.length > 0;

    return {
      refundAmount: refund,
      newTotal: orderTotal - refund,
      removedItems: removed,
      modifiedItems: modified,
      hasChanges: changes,
    };
  }, [items, itemStates, orderTotal]);

  const handleToggleItem = (itemId: string) => {
    setItemStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId);
      if (current) {
        newMap.set(itemId, { ...current, included: !current.included });
      }
      return newMap;
    });
  };

  const handleQuantityChange = (itemId: string, delta: number, originalQuantity: number) => {
    setItemStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId);
      if (current) {
        const newQuantity = Math.max(1, Math.min(originalQuantity, current.quantity + delta));
        newMap.set(itemId, { ...current, quantity: newQuantity });
      }
      return newMap;
    });
  };

  const handleSubmit = async () => {
    if (!hasChanges) {
      setError('Please make at least one change before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(removedItems, modifiedItems, refundAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to accept order with changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: globalColors.background.secondary,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: globalColors.text.primary }}>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Accept Order {orderNumber} with Changes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info message */}
          <div
            className="p-3 rounded-md text-sm"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: globalColors.text.secondary,
            }}
          >
            <p>
              Remove unavailable items or reduce quantities. A partial refund will be issued for removed items.
            </p>
          </div>

          {/* Items list */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
              Order Items
            </Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item, index) => {
                const itemId = item.id || item.item_id || `item-${index}`;
                const state = itemStates.get(itemId);
                const itemName = item.name || item.item_name || 'Unknown Item';
                const isIncluded = state?.included ?? true;
                const currentQuantity = state?.quantity ?? item.quantity;

                return (
                  <div
                    key={itemId}
                    className={`p-3 rounded-md transition-all ${!isIncluded ? 'opacity-50' : ''}`}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isIncluded ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Checkbox and item info */}
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          id={`item-${itemId}`}
                          checked={isIncluded}
                          onCheckedChange={() => handleToggleItem(itemId)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`item-${itemId}`}
                            className={`cursor-pointer text-sm font-medium ${!isIncluded ? 'line-through' : ''}`}
                            style={{ color: globalColors.text.primary }}
                          >
                            {itemName}
                          </Label>
                          {item.variant && (
                            <p className="text-xs mt-0.5" style={{ color: globalColors.text.secondary }}>
                              {item.variant}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-xs mt-0.5 italic" style={{ color: globalColors.text.muted }}>
                              Note: {item.notes}
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: globalColors.text.secondary }}>
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                      </div>

                      {/* Quantity controls */}
                      {isIncluded && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(itemId, -1, item.quantity)}
                            disabled={currentQuantity <= 1}
                            style={{
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span
                            className="w-8 text-center text-sm font-medium"
                            style={{ color: globalColors.text.primary }}
                          >
                            {currentQuantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(itemId, 1, item.quantity)}
                            disabled={currentQuantity >= item.quantity}
                            style={{
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Item total */}
                      <div className="text-right min-w-[60px]">
                        <span
                          className={`text-sm font-medium ${!isIncluded ? 'line-through' : ''}`}
                          style={{ color: isIncluded ? globalColors.text.primary : globalColors.text.muted }}
                        >
                          {formatCurrency(item.price * (isIncluded ? currentQuantity : item.quantity))}
                        </span>
                        {currentQuantity !== item.quantity && isIncluded && (
                          <p className="text-xs" style={{ color: globalColors.text.muted }}>
                            was {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div
            className="p-4 rounded-md space-y-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: globalColors.text.secondary }}>Original Total:</span>
              <span style={{ color: globalColors.text.primary }}>{formatCurrency(orderTotal)}</span>
            </div>
            {hasChanges && (
              <>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#ef4444' }}>Refund Amount:</span>
                  <span style={{ color: '#ef4444' }}>-{formatCurrency(refundAmount)}</span>
                </div>
                <div className="border-t pt-2 mt-2" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex justify-between font-medium">
                    <span style={{ color: globalColors.text.primary }}>New Total:</span>
                    <span style={{ color: '#22c55e' }}>{formatCurrency(newTotal)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Changes summary */}
          {hasChanges && (
            <div
              className="p-3 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: globalColors.text.secondary,
              }}
            >
              <p className="font-medium mb-1" style={{ color: globalColors.text.primary }}>
                Changes to be applied:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {removedItems.map((item) => (
                  <li key={item.item_id}>
                    <span className="text-red-400">Remove:</span> {item.name} x{item.quantity}
                  </li>
                ))}
                {modifiedItems.map((item) => (
                  <li key={item.item_id}>
                    <span className="text-amber-400">Reduce:</span> {item.name} from {item.original_quantity} to{' '}
                    {item.new_quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              className="p-2 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: globalColors.text.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || isSubmitting}
            style={{
              backgroundColor: hasChanges ? '#22c55e' : undefined,
              color: '#ffffff',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Accept with Changes${hasChanges ? ` (-${formatCurrency(refundAmount)})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PartialAcceptModal;
