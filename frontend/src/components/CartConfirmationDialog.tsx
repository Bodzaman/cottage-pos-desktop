/**
 * CartConfirmationDialog - Confirm Cart Modifications from AI
 *
 * Displays a preview of cart changes proposed by AI chat/voice and allows
 * the user to confirm, edit quantity, or cancel before cart is modified.
 *
 * Part of the Structured Event Protocol for AI Chat + Voice.
 *
 * @module CartConfirmationDialog
 */

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { PremiumTheme } from '../utils/premiumTheme';
import type { CartProposal, CartProposalItem } from '../types/structured-events';

interface CartConfirmationDialogProps {
  /** The cart modification proposal from AI */
  proposal: CartProposal | null;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when user confirms (with potentially edited items) */
  onConfirm: (items: CartProposalItem[]) => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

const getOperationTitle = (operation: CartProposal['operation']): string => {
  switch (operation) {
    case 'add':
      return 'Add to Cart?';
    case 'remove':
      return 'Remove from Cart?';
    case 'update':
      return 'Update Cart?';
    case 'clear':
      return 'Clear Cart?';
    default:
      return 'Modify Cart?';
  }
};

const getOperationDescription = (operation: CartProposal['operation']): string => {
  switch (operation) {
    case 'add':
      return 'Would you like to add these items to your cart?';
    case 'remove':
      return 'Would you like to remove these items from your cart?';
    case 'update':
      return 'Would you like to update these items in your cart?';
    case 'clear':
      return 'This will remove all items from your cart.';
    default:
      return 'Review the changes below.';
  }
};

const getOperationIcon = (operation: CartProposal['operation']) => {
  switch (operation) {
    case 'add':
      return <ShoppingCart className="h-6 w-6" style={{ color: PremiumTheme.colors.silver[400] }} />;
    case 'remove':
      return <Trash2 className="h-6 w-6" style={{ color: '#EF4444' }} />;
    default:
      return <ShoppingBag className="h-6 w-6" style={{ color: PremiumTheme.colors.silver[400] }} />;
  }
};

export function CartConfirmationDialog({
  proposal,
  isOpen,
  onConfirm,
  onCancel
}: CartConfirmationDialogProps) {
  // Track edited items with mutable quantities
  const [editedItems, setEditedItems] = useState<CartProposalItem[]>([]);

  // Reset edited items when proposal changes
  useEffect(() => {
    if (proposal?.items) {
      setEditedItems([...proposal.items]);
    }
  }, [proposal]);

  if (!proposal) return null;

  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setEditedItems(items =>
      items.map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item
      )
    );
  };

  // Calculate total based on edited items
  const totalDelta = editedItems.reduce(
    (sum, item) => sum + (item.unit_price || 0) * item.quantity,
    0
  );

  const handleConfirm = () => {
    onConfirm(editedItems);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent
        className="border-0 max-w-md"
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          color: PremiumTheme.colors.text.primary,
          border: `1px solid ${PremiumTheme.colors.border.light}`
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle
            className="flex items-center gap-2 text-xl"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            {getOperationIcon(proposal.operation)}
            {getOperationTitle(proposal.operation)}
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: PremiumTheme.colors.text.muted }}>
            {getOperationDescription(proposal.operation)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Item List with Quantity Editor */}
        <div
          className="my-4 p-4 rounded-lg border space-y-3"
          style={{
            backgroundColor: PremiumTheme.colors.dark[800],
            borderColor: PremiumTheme.colors.border.medium
          }}
        >
          {editedItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 rounded-lg"
              style={{ backgroundColor: PremiumTheme.colors.dark[700] }}
            >
              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium truncate"
                  style={{ color: PremiumTheme.colors.text.primary }}
                >
                  {item.item_name || 'Item'}
                </p>
                {item.variant_name && (
                  <p
                    className="text-sm truncate"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    {item.variant_name}
                  </p>
                )}
                <p
                  className="text-sm"
                  style={{ color: PremiumTheme.colors.silver[400] }}
                >
                  {formatPrice(item.unit_price || 0)} each
                </p>

                {/* Customizations */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.customizations.map((customization, cIdx) => (
                      <p
                        key={cIdx}
                        className="text-xs"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >
                        + {customization.name}
                        {customization.price > 0 && (
                          <span style={{ color: PremiumTheme.colors.gold[500] }}>
                            {' '}(+{formatPrice(customization.price)})
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <p
                    className="text-xs italic mt-1"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Quantity Editor */}
              {proposal.allow_qty_edit && proposal.operation === 'add' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: PremiumTheme.colors.border.medium,
                      color: PremiumTheme.colors.text.secondary
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span
                    className="w-8 text-center font-medium"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: PremiumTheme.colors.border.medium,
                      color: PremiumTheme.colors.text.secondary
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Fixed Quantity Display (for non-editable) */}
              {(!proposal.allow_qty_edit || proposal.operation !== 'add') && (
                <span
                  className="flex-shrink-0 font-medium"
                  style={{ color: PremiumTheme.colors.text.primary }}
                >
                  x{item.quantity}
                </span>
              )}
            </div>
          ))}

          {/* Total */}
          <div
            className="flex justify-between font-medium pt-3 border-t"
            style={{
              borderColor: PremiumTheme.colors.border.light,
              color: PremiumTheme.colors.text.primary
            }}
          >
            <span>
              {proposal.operation === 'remove' ? 'Total to remove:' : 'Total to add:'}
            </span>
            <span style={{ color: PremiumTheme.colors.silver[400] }}>
              {formatPrice(totalDelta)}
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="border-gray-600 hover:bg-gray-700"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            style={{
              background: proposal.operation === 'remove'
                ? '#EF4444'
                : `linear-gradient(135deg, ${PremiumTheme.colors.silver[500]} 0%, ${PremiumTheme.colors.silver[600]} 100%)`,
              color: proposal.operation === 'remove' ? 'white' : PremiumTheme.colors.dark[900],
              border: 'none'
            }}
          >
            {proposal.operation === 'add' && 'Add to Cart'}
            {proposal.operation === 'remove' && 'Remove'}
            {proposal.operation === 'update' && 'Update'}
            {proposal.operation === 'clear' && 'Clear Cart'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default CartConfirmationDialog;
