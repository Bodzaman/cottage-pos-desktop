/**
 * CompactDineInItemRow - Horizontal compact item display for Review Modal
 * 
 * Displays order items in a compact horizontal row format:
 * - 60x60 thumbnail image
 * - Item name (bold) + variant/protein/customizations inline
 * - Quantity controls (inline)
 * - Line total price
 * - Quick action buttons (customize, delete)
 * 
 * Design: Optimized for scanning many items quickly in category-grouped lists
 * Size: ~80px height per row (vs 200px+ for EnrichedOrderItemCard)
 */

import { useState } from 'react';
import { Plus, Minus, Trash2, Cog, Utensils } from 'lucide-react';
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
import { QSAITheme } from 'utils/QSAIDesign';
import type { EnrichedDineInOrderItem } from 'types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CompactDineInItemRowProps {
  item: EnrichedDineInOrderItem;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onDeleteItem: (itemId: string) => void;
  onCustomizeItem: (item: EnrichedDineInOrderItem) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompactDineInItemRow({
  item,
  onUpdateQuantity,
  onDeleteItem,
  onCustomizeItem,
}: CompactDineInItemRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleConfirmDelete = () => {
    onDeleteItem(item.id);
    setShowDeleteDialog(false);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Build inline metadata string (variant + protein + customizations count)
  const buildMetadataString = () => {
    const parts: string[] = [];

    if (item.variant_name) {
      parts.push(item.variant_name);
    }

    if (item.protein_type_name) {
      parts.push(item.protein_type_name);
    }

    if (item.customizations && item.customizations.length > 0) {
      parts.push(`${item.customizations.length} customization${item.customizations.length > 1 ? 's' : ''}`);
    }

    if (item.notes) {
      parts.push('📝 Note');
    }

    return parts.join(' · ');
  };

  const metadataString = buildMetadataString();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 group"
        style={{
          border: `1px solid transparent`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = QSAITheme.border.medium;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        {/* Thumbnail Image (60x60) */}
        <div
          className="w-[60px] h-[60px] rounded-md overflow-hidden flex-shrink-0"
          style={{
            border: `1px solid ${QSAITheme.border.light}`,
            backgroundColor: QSAITheme.background.secondary,
          }}
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.item_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: QSAITheme.background.secondary }}
            >
              <Utensils
                className="h-6 w-6"
                style={{ color: QSAITheme.text.muted }}
              />
            </div>
          )}
        </div>

        {/* Item Details (Flex-1) */}
        <div className="flex-1 min-w-0">
          {/* Item Name */}
          <h4
            className="text-sm font-semibold mb-0.5 truncate"
            style={{ color: QSAITheme.text.primary }}
          >
            {item.item_name}
          </h4>

          {/* Metadata String (variant · protein · customizations) */}
          {metadataString && (
            <p
              className="text-xs truncate"
              style={{ color: QSAITheme.text.muted }}
            >
              {metadataString}
            </p>
          )}

          {/* Unit Price (small) */}
          <p
            className="text-xs mt-0.5"
            style={{ color: QSAITheme.text.muted }}
          >
            £{item.unit_price.toFixed(2)} each
          </p>
        </div>

        {/* Quantity Controls (Compact) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            disabled={item.quantity <= 1}
            className="h-6 w-6 rounded flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${QSAITheme.border.medium}`,
              color: QSAITheme.text.primary,
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              if (item.quantity > 1) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = QSAITheme.purple.light;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = QSAITheme.border.medium;
            }}
          >
            <Minus className="h-3 w-3" />
          </button>

          <span
            className="mx-1 text-sm font-medium min-w-[24px] text-center"
            style={{ color: QSAITheme.text.primary }}
          >
            {item.quantity}
          </span>

          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="h-6 w-6 rounded flex items-center justify-center transition-all"
            style={{
              border: `1px solid ${QSAITheme.border.medium}`,
              color: QSAITheme.text.primary,
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = QSAITheme.purple.light;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = QSAITheme.border.medium;
            }}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Line Total */}
        <div className="text-right flex-shrink-0 min-w-[70px]">
          <p
            className="text-sm font-bold"
            style={{ color: QSAITheme.text.primary }}
          >
            £{item.line_total.toFixed(2)}
          </p>
        </div>

        {/* Quick Actions (Hover Reveal) */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Customize Button */}
          <button
            onClick={() => onCustomizeItem(item)}
            className="h-7 w-7 rounded flex items-center justify-center transition-all"
            style={{
              border: `1px solid ${QSAITheme.purple.primary}`,
              color: QSAITheme.purple.primary,
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = QSAITheme.purple.primaryTransparent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Customize item"
          >
            <Cog className="h-3.5 w-3.5" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="h-7 w-7 rounded flex items-center justify-center transition-all"
            style={{
              color: '#EF4444',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Delete item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent
          style={{
            background: QSAITheme.background.panel,
            border: `1px solid ${QSAITheme.border.accent}`,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: QSAITheme.text.primary }}>
              Delete {item.item_name}?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: QSAITheme.text.muted }}>
              This will remove this item from the order. This action cannot be undone.
              {item.quantity > 1 && (
                <span
                  className="block mt-2 font-medium"
                  style={{ color: QSAITheme.text.secondary }}
                >
                  Quantity: {item.quantity} × £{item.unit_price.toFixed(2)} = £
                  {item.line_total.toFixed(2)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{
                border: `1px solid ${QSAITheme.border.medium}`,
                color: QSAITheme.text.secondary,
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
              }}
              className="hover:bg-red-600"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
