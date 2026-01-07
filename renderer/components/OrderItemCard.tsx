import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus, Cog } from 'lucide-react';
import { OrderItem } from '../utils/menuTypes';
import { colors as QSAITheme } from '../utils/QSAIDesign';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';

interface OrderItemCardProps {
  item: OrderItem;
  index: number;
  onQuantityChange: (index: number, newQty: number) => void;
  onRemove: (index: number) => void;
  onCustomize?: (index: number, item: OrderItem) => void;
  showCustomizeButton?: boolean;
  showRemoveButton?: boolean;
}

/**
 * Shared order item card component with QSAI design
 * Used across DineInOrderModal, OrderSummaryPanel, and review modals
 * 
 * Features:
 * - Thumbnail with fallback
 * - Item name + variant badges
 * - Customizations display
 * - Quantity controls
 * - Customize button (optional)
 * - Remove button (optional)
 * - Line total price
 */
export function OrderItemCard({
  item,
  index,
  onQuantityChange,
  onRemove,
  onCustomize,
  showCustomizeButton = true,
  showRemoveButton = true
}: OrderItemCardProps) {
  // Get item variants from store for image resolution
  const itemVariants = useRealtimeMenuStore(state => state.itemVariants);

  // Resolve variant image using correct hierarchy
  const resolveImageUrl = (): string | null => {
    let resolvedImageUrl = item.image_url; // Default fallback
    
    if (item.variant_id && itemVariants) {
      const variantObj = itemVariants.find(v => v.id === item.variant_id);
      if (variantObj) {
        // Priority: display_image_url (backend-resolved) → image_url (raw) → item fallback
        resolvedImageUrl = variantObj.display_image_url || variantObj.image_url || item.image_url;
      }
    }
    
    return resolvedImageUrl || null;
  };

  const imageUrl = resolveImageUrl();

  return (
    <div
      className="bg-opacity-50 border rounded-lg p-4 space-y-3"
      style={{
        backgroundColor: QSAITheme.background.tertiary,
        borderColor: QSAITheme.border.light
      }}
    >
      {/* Top section: Image, Name, Remove button */}
      <div className="flex items-start space-x-3">
        {/* Thumbnail image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover border"
              style={{ borderColor: QSAITheme.border.medium }}
              onError={(e) => {
                // On error, replace with fallback div
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const itemName = item.name || 'Item';
                  parent.innerHTML = "
                    <div class="w-16 h-16 rounded-lg border flex items-center justify-center font-bold text-white text-2xl"
                      style="background: linear-gradient(135deg, " + QSAITheme.purple.primary + " 0%, " + QSAITheme.purple.dark + " 100%); border-color: " + QSAITheme.border.medium + ";">
                      " + itemName.charAt(0).toUpperCase() + "
                    </div>
                  ";
                }
              }}
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-lg border flex items-center justify-center font-bold text-white text-2xl"
              style={{ 
                background: "linear-gradient(135deg, " + QSAITheme.purple.primary + " 0%, " + QSAITheme.purple.dark + " 100%)",
                borderColor: QSAITheme.border.medium
              }}
            >
              {(item.name || 'Item').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Item details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1" style={{ color: QSAITheme.text.primary }}>
            {item.name}
          </h4>
          
          {/* Variant and protein info */}
          {(item.variant || item.protein_type) && (
            <div className="flex items-center space-x-2 mb-2">
              {item.variant && (
                <span 
                  className="text-xs px-2 py-1 rounded" 
                  style={{ 
                    backgroundColor: QSAITheme.purple.primaryTransparent,
                    color: QSAITheme.text.secondary
                  }}
                >
                  {item.variant}
                </span>
              )}
              {item.protein_type && (
                <span 
                  className="text-xs px-2 py-1 rounded" 
                  style={{ 
                    backgroundColor: QSAITheme.background.secondary,
                    color: QSAITheme.text.muted
                  }}
                >
                  {item.protein_type}
                </span>
              )}
            </div>
          )}
          
          {/* Rich customization details */}
          {(item.modifiers && item.modifiers.length > 0) && (
            <div className="space-y-1 mb-2">
              {item.modifiers.map((modifier, modIndex) => (
                <div key={modIndex} className="text-xs" style={{ color: QSAITheme.text.muted }}>
                  <span className="font-medium">{modifier.name}:</span>
                  <span className="ml-1">{modifier.options?.map(opt => opt.name).join(', ') || ''}</span>
                  {modifier.options?.some(opt => opt.price > 0) && (
                    <span className="ml-1" style={{ color: QSAITheme.purple.light }}>
                      (+£{modifier.options.reduce((sum, opt) => sum + opt.price, 0).toFixed(2)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Customizations display (Add Cheese, etc.) */}
          {(item.customizations && item.customizations.length > 0) && (
            <div className="space-y-1 mb-2">
              {item.customizations.map((customization, custIndex) => (
                <div key={custIndex} className="text-xs flex items-center justify-between" style={{ color: QSAITheme.text.muted }}>
                  <span className="font-medium">{customization.name}</span>
                  {customization.price_adjustment > 0 && (
                    <span className="ml-1" style={{ color: QSAITheme.purple.light }}>
                      +£{customization.price_adjustment.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Add-ons display */}
          {(item.add_ons && item.add_ons.length > 0) && (
            <div className="mb-2">
              <div className="text-xs font-medium mb-1" style={{ color: QSAITheme.text.secondary }}>Add-ons:</div>
              <div className="flex flex-wrap gap-1">
                {item.add_ons.map((addon, addonIndex) => (
                  <span 
                    key={addonIndex}
                    className="text-xs px-2 py-1 rounded" 
                    style={{ 
                      backgroundColor: QSAITheme.background.secondary,
                      color: QSAITheme.text.muted
                    }}
                  >
                    {addon.name} {addon.price > 0 && "(+£" + addon.price.toFixed(2) + ")"}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Notes and special instructions */}
          {item.notes && (
            <div 
              className="text-xs p-2 rounded border-l-2 mb-2" 
              style={{ 
                backgroundColor: QSAITheme.background.secondary,
                borderLeftColor: QSAITheme.purple.primary,
                color: QSAITheme.text.muted
              }}
            >
              <span className="font-medium">Note:</span> {item.notes}
            </div>
          )}
        </div>
        
        {/* Remove button */}
        {showRemoveButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {/* Bottom section: Quantity controls, Customize button, Price */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
        {/* Quantity controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(index, Math.max(1, item.quantity - 1))}
            className="h-6 w-6 p-0"
            style={{
              borderColor: QSAITheme.border.medium,
              backgroundColor: QSAITheme.background.secondary
            }}
          >
            <Minus className="w-3 h-3" />
          </Button>
          
          <span className="text-sm font-medium w-8 text-center" style={{ color: QSAITheme.text.primary }}>
            {item.quantity}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(index, item.quantity + 1)}
            className="h-6 w-6 p-0"
            style={{
              borderColor: QSAITheme.border.medium,
              backgroundColor: QSAITheme.background.secondary
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Customize button */}
        {showCustomizeButton && onCustomize && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCustomize(index, item)}
            className="text-xs px-2 py-1 h-6 flex-shrink-0"
            style={{
              borderColor: QSAITheme.purple.primary,
              color: 'white',
              backgroundColor: 'transparent'
            }}
          >
            <Cog className="w-3 h-3 mr-1" />
            Custom
          </Button>
        )}
        
        {/* Price */}
        <div className="text-sm font-semibold ml-auto flex-shrink-0" style={{ color: QSAITheme.text.primary }}>
          £{((item.price || 0) * item.quantity).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
