import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, Edit2, StickyNote, Cog } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import type { EnrichedOrderItem } from 'types';
import type { OrderItem } from 'types';
import { useRealtimeMenuStoreCompat } from 'utils/realtimeMenuStoreCompat';

interface OrderItemCardProps {
  item: OrderItem | EnrichedOrderItem;
  index: number;
  isStaging?: boolean;
  onQuantityChange: (index: number, newQty: number) => void;
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
  onCustomize?: (index: number, item: OrderItem | EnrichedOrderItem) => void;
  showCustomizeButton?: boolean;
  showRemoveButton?: boolean;
}

/**
 * Individual order item display card for the right panel.
 *
 * Features:
 * - 40x40px thumbnail (rounded corners) with gradient fallback
 * - Item name + variant badge
 * - Quantity controls (+/-)
 * - Customizations list
 * - Notes indicator
 * - Line total
 * - "Edit" / "Custom" button for customization
 * - Remove button (optional)
 */
export function OrderItemCard({
  item,
  index,
  isStaging = false,
  onQuantityChange,
  onRemove,
  onEdit,
  onCustomize,
  showCustomizeButton = true,
  showRemoveButton = true
}: OrderItemCardProps) {
  // Get item variants from store for image resolution
  const { itemVariants } = useRealtimeMenuStoreCompat({ context: 'pos' });

  // Resolve variant image using correct hierarchy
  const resolveImageUrl = (): string | null => {
    // Type assertion for image_url since it may exist on the item even if not in the strict type
    let resolvedImageUrl = (item as any).image_url as string | undefined; // Default fallback

    if (item.variant_id && itemVariants) {
      const variantObj = itemVariants.find(v => v.id === item.variant_id);
      if (variantObj) {
        // Priority: display_image_url (backend-resolved) → image_url (raw) → item fallback
        resolvedImageUrl = (variantObj as any).display_image_url || variantObj.image_url || (item as any).image_url;
      }
    }

    return resolvedImageUrl || null;
  };

  const imageUrl = resolveImageUrl();
  const lineTotal = (item.price * item.quantity).toFixed(2);
  const hasCustomizations = item.customizations && item.customizations.length > 0;
  const hasNotes = item.notes && item.notes.trim().length > 0;

  // Support both OrderItem.variant and EnrichedOrderItem.variant_name
  const variantName = (item as any).variant_name || (item as any).variant;

  return (
    <div
      className="flex gap-3 p-3 rounded-lg transition-colors"
      style={{
        backgroundColor: isStaging
          ? `${QSAITheme.status.staging}10`
          : QSAITheme.background.secondary,
        border: isStaging
          ? `1px solid ${QSAITheme.status.staging}40`
          : `1px solid ${QSAITheme.border.light}`,
      }}
    >
      {/* Thumbnail */}
      <div
        className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0"
        style={{ backgroundColor: QSAITheme.background.tertiary }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // On error, hide image and show fallback
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center text-xs font-bold';
                fallback.style.cssText = `background: linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%); color: white;`;
                fallback.textContent = (item.name || 'Item').charAt(0).toUpperCase();
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs font-bold"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
              color: 'white'
            }}
          >
            {(item.name || 'Item').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name and variant */}
        <div className="flex items-start gap-2 mb-1">
          <span
            className="font-medium text-sm leading-tight truncate"
            style={{ color: QSAITheme.text.primary }}
          >
            {item.name}
          </span>
          {variantName && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
              style={{
                borderColor: QSAITheme.purple.primary,
                color: QSAITheme.purple.light,
              }}
            >
              {variantName}
            </Badge>
          )}
          {isStaging && (
            <Badge
              className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
              style={{
                backgroundColor: `${QSAITheme.status.staging}30`,
                color: QSAITheme.status.staging,
              }}
            >
              New
            </Badge>
          )}
        </div>

        {/* Category badge */}
        {(item as any).category_name && (
          <span
            className="text-[10px]"
            style={{ color: QSAITheme.text.muted }}
          >
            {(item as any).category_name}
          </span>
        )}

        {/* Customizations */}
        {hasCustomizations && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.customizations!.slice(0, 3).map((customization: any, idx: number) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: QSAITheme.background.tertiary,
                  color: QSAITheme.text.secondary,
                }}
              >
                {typeof customization === 'string' ? customization : customization.name || customization.option_name}
              </span>
            ))}
            {item.customizations!.length > 3 && (
              <span
                className="text-[10px]"
                style={{ color: QSAITheme.text.muted }}
              >
                +{item.customizations!.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Notes indicator */}
        {hasNotes && (
          <div className="mt-1 flex items-center gap-1">
            <StickyNote className="h-3 w-3" style={{ color: QSAITheme.text.muted }} />
            <span
              className="text-[10px] truncate"
              style={{ color: QSAITheme.text.muted }}
            >
              {item.notes}
            </span>
          </div>
        )}

        {/* Price and controls row */}
        <div className="flex items-center justify-between mt-2 gap-2">
          {/* Quantity controls - fixed width, never shrink */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onQuantityChange(index, Math.max(1, item.quantity - 1))}
              style={{
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.secondary,
                backgroundColor: 'transparent',
                minWidth: '24px',
                minHeight: '24px',
              }}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span
              className="w-6 text-center text-sm font-medium"
              style={{ color: QSAITheme.text.primary }}
            >
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onQuantityChange(index, item.quantity + 1)}
              style={{
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.secondary,
                backgroundColor: 'transparent',
                minWidth: '24px',
                minHeight: '24px',
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Actions - can shrink if needed */}
          <div className="flex items-center gap-1 flex-shrink min-w-0">
            {/* Customize button */}
            {showCustomizeButton && onCustomize && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs flex-shrink-0"
                onClick={() => onCustomize(index, item)}
                style={{
                  borderColor: QSAITheme.purple.primary,
                  color: 'white',
                  backgroundColor: 'transparent'
                }}
              >
                <Cog className="h-3 w-3 mr-1" />
                Custom
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onEdit(index)}
                style={{ color: QSAITheme.text.muted }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {showRemoveButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 hover:text-red-500"
                onClick={() => onRemove(index)}
                style={{ color: QSAITheme.text.muted }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Line total - PROTECTED from shrinking, always visible */}
          <span
            className="text-sm font-semibold flex-shrink-0 min-w-[60px] text-right whitespace-nowrap"
            style={{ color: QSAITheme.text.primary }}
          >
            £{lineTotal}
          </span>
        </div>
      </div>
    </div>
  );
}

export default OrderItemCard;
