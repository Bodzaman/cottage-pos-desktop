import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, User, Users, Receipt, Utensils } from 'lucide-react';
import { AppApisTableOrdersOrderItem, CustomerTab } from 'brain/data-contracts';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';

interface Props {
  orderItems: AppApisTableOrdersOrderItem[];
  customerTabs?: CustomerTab[]; // NEW: Optional customer tabs for grouping
  activeCustomerTabId?: string | null; // NEW: Currently selected customer tab
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onSave: () => void;
  onSendToKitchen: () => void;
  onFinalBill: () => void;
  onViewBill?: () => void; // NEW: Optional View Bill handler
  className?: string;
}

/**
 * Dedicated order summary component optimized for dine-in modal context
 * Features compact layout, QSAI design consistency, proper CTAs
 */
export function DineInOrderSummary({
  orderItems,
  customerTabs = [],
  activeCustomerTabId = null,
  onUpdateQuantity,
  onRemoveItem,
  onSave,
  onSendToKitchen,
  onFinalBill,
  onViewBill,
  className
}: Props) {
  // Calculate totals using same logic as POSOrderSummary
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Add tax/discount logic here if needed

  // NEW: Group items by customer tab ID
  const groupedItems = React.useMemo(() => {
    const groups: Map<string | null, AppApisTableOrdersOrderItem[]> = new Map();
    
    orderItems.forEach(item => {
      const tabId = (item as any).customer_tab_id || null;
      const existing = groups.get(tabId) || [];
      groups.set(tabId, [...existing, item]);
    });
    
    return groups;
  }, [orderItems]);

  // NEW: Get customer tab name by ID
  const getCustomerTabName = (tabId: string | null): string => {
    if (!tabId) return 'Table';
    const tab = customerTabs.find(t => t.id === tabId);
    return tab?.tab_name || `Customer ${tabId.slice(0, 4)}`;
  };

  // NEW: Render item group helper
  const renderItemGroup = (items: AppApisTableOrdersOrderItem[], tabId: string | null, startIndex: number) => {
    const tabName = getCustomerTabName(tabId);
    const isActiveTab = tabId === activeCustomerTabId;
    const isTableLevel = tabId === null;
    
    return (
      <div key={tabId || 'table'} className="mb-3">
        {/* Customer Tab Header */}
        <div 
          className="flex items-center justify-between px-2 py-1.5 mb-1 rounded-t sticky top-0 z-10"
          style={{
            backgroundColor: isActiveTab 
              ? QSAITheme.purple.primary 
              : isTableLevel
                ? QSAITheme.background.dark
                : QSAITheme.background.tertiary,
            borderLeft: isActiveTab ? `3px solid ${QSAITheme.purple.glow}` : '3px solid transparent'
          }}
        >
          <div className="flex items-center gap-2">
            {isTableLevel ? (
              <Users size={14} style={{ color: isActiveTab ? '#fff' : QSAITheme.text.muted }} />
            ) : (
              <User size={14} style={{ color: isActiveTab ? '#fff' : QSAITheme.purple.primary }} />
            )}
            <span 
              className="text-xs font-semibold"
              style={{ color: isActiveTab ? '#fff' : QSAITheme.text.primary }}
            >
              {tabName}
            </span>
          </div>
          <Badge 
            variant="secondary" 
            className="h-4 px-1.5 text-[10px]"
            style={{
              backgroundColor: isActiveTab ? 'rgba(255,255,255,0.2)' : QSAITheme.purple.light,
              color: '#fff'
            }}
          >
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        {/* Items in this group */}
        <div className="space-y-1 px-1">
          {items.map((item, idx) => {
            const globalIndex = startIndex + idx;
            return (
              <div 
                key={`${item.id}-${globalIndex}`}
                className="rounded-lg p-2 border"
                style={{
                  backgroundColor: QSAITheme.background.tertiary,
                  borderColor: isActiveTab ? QSAITheme.purple.primary : QSAITheme.border.light
                }}
              >
                {/* Item Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  {/* ✅ NEW: Add thumbnail image on the left */}
                  <div 
                    className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 relative"
                    style={{
                      border: `1px solid ${QSAITheme.border.medium}`,
                      backgroundColor: QSAITheme.background.secondary
                    }}
                  >
                    {/* ✅ Use variant image resolution hierarchy */}
                    {(item.variant?.display_image_url || item.variant?.image_url || item.image_url) ? (
                      <img 
                        src={item.variant?.display_image_url || item.variant?.image_url || item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // On error, hide image and show placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    {/* Fallback placeholder - show if no image or if image fails */}
                    <div 
                      className="w-full h-full flex items-center justify-center rounded-md"
                      style={{ 
                        backgroundColor: QSAITheme.background.secondary,
                        display: (item.variant?.display_image_url || item.variant?.image_url || item.image_url) ? 'none' : 'flex'
                      }}
                    >
                      <Utensils className="h-5 w-5" style={{ color: QSAITheme.text.muted }} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate" style={{ color: QSAITheme.text.primary }}>
                      {item.name}
                    </h4>
                    
                    {/* Variant and protein info badges - matching OrderSummaryPanel */}
                    {(item.variant || item.protein_type) && (
                      <div className="flex items-center space-x-2 mt-1 mb-1">
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
                    
                    <div className="text-xs mt-0.5" style={{ color: QSAITheme.text.primary }}>
                      £{item.price.toFixed(2)} each
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🔴 DELETE_BUTTON_CLICKED:', { globalIndex, itemName: item.name });
                      onRemoveItem(globalIndex);
                    }}
                    className="h-6 w-6 p-0 hover:bg-red-500/10 rounded inline-flex items-center justify-center transition-colors"
                    style={{ color: QSAITheme.text.primary }}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Quantity Controls and Total */}
                <div className="flex items-center justify-between">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(globalIndex, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      className="h-6 w-6 p-0 hover:bg-white/10"
                      style={{
                        borderColor: QSAITheme.border.medium,
                        color: QSAITheme.text.primary
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <span className="mx-2 text-sm font-medium min-w-[24px] text-center" style={{ color: QSAITheme.text.primary }}>
                      {item.quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(globalIndex, item.quantity + 1)}
                      className="h-6 w-6 p-0 hover:bg-white/10"
                      style={{
                        borderColor: QSAITheme.border.medium,
                        color: QSAITheme.text.primary
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Item Total */}
                  <div className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                    £{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                {/* Customizations */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: QSAITheme.border.light }}>
                    <div className="space-y-1">
                      {item.customizations.map((customization, custIndex) => (
                        <div key={custIndex} className="flex justify-between text-xs">
                          <span style={{ color: QSAITheme.text.secondary }}>{customization.name}</span>
                          {customization.price > 0 && (
                            <span style={{ color: QSAITheme.text.secondary }}>+£{customization.price.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn('flex flex-col h-full', className)}
      style={{ backgroundColor: QSAITheme.background.secondary }}
    >
      {/* Header */}
      <div 
        className="p-3 border-b flex-shrink-0"
        style={{ borderColor: QSAITheme.border.medium }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>Order Summary</h3>
          <span className="text-xs" style={{ color: QSAITheme.text.secondary }}>{orderItems.length} items</span>
        </div>
      </div>

      {/* Order Items List */}
      <div className="flex-1 overflow-y-auto">
        {orderItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-sm mb-2" style={{ color: QSAITheme.text.muted }}>No items in order</div>
              <div className="text-xs" style={{ color: QSAITheme.text.disabled }}>Add items from the menu</div>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {/* Render groups: Table-level first, then customer tabs */}
            {(() => {
              let currentIndex = 0;
              const groups = [];
              
              // Table-level items first (no customer_tab_id)
              const tableLevelItems = groupedItems.get(null);
              if (tableLevelItems && tableLevelItems.length > 0) {
                groups.push(renderItemGroup(tableLevelItems, null, currentIndex));
                currentIndex += tableLevelItems.length;
              }
              
              // Then customer tab items
              Array.from(groupedItems.keys())
                .filter(tabId => tabId !== null)
                .forEach(tabId => {
                  const items = groupedItems.get(tabId)!;
                  groups.push(renderItemGroup(items, tabId, currentIndex));
                  currentIndex += items.length;
                });
              
              return groups;
            })()}
          </div>
        )}
      </div>

      {/* Totals Section */}
      {orderItems.length > 0 && (
        <div className="border-t p-3 flex-shrink-0" style={{ borderColor: QSAITheme.border.medium }}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: QSAITheme.text.secondary }}>Subtotal:</span>
              <span style={{ color: QSAITheme.text.primary }}>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-2" style={{ borderColor: QSAITheme.border.medium }}>
              <span style={{ color: QSAITheme.text.primary }}>Total:</span>
              <span style={{ color: QSAITheme.text.primary }}>£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-3 border-t space-y-2 flex-shrink-0" style={{ borderColor: QSAITheme.border.medium }}>
        {orderItems.length > 0 ? (
          <>
            {/* ✅ DATABASE-FIRST: Items are saved immediately when added */}
            <div className="text-center py-2 mb-2 rounded" style={{ backgroundColor: QSAITheme.background.tertiary }}>
              <div className="text-xs font-medium" style={{ color: QSAITheme.text.primary }}>
                Items automatically saved to order
              </div>
              <div className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                {orderItems.length} item{orderItems.length === 1 ? '' : 's'} in database
              </div>
            </div>
            
            {/* Save Order Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              className="w-full text-xs h-9 font-medium"
              style={{
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.primary,
                backgroundColor: 'transparent'
              }}
            >
              Save Order
            </Button>
            
            {/* Send to Kitchen Button */}
            <Button
              size="sm"
              onClick={onSendToKitchen}
              className="w-full text-xs h-9 font-medium"
              style={{
                backgroundColor: QSAITheme.purple.primary,
                color: '#FFFFFF'
              }}
            >
              Send to Kitchen
            </Button>
            
            {/* NEW: View Bill Button - Opens customer-grouped bill modal */}
            {onViewBill && customerTabs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewBill}
                className="w-full text-xs h-9 font-medium"
                style={{
                  borderColor: QSAITheme.purple.light,
                  color: QSAITheme.purple.light,
                  backgroundColor: `${QSAITheme.purple.primary}15`
                }}
              >
                <Receipt className="w-3 h-3 mr-1.5" />
                View Bill (By Customer)
              </Button>
            )}
            
            {/* Print Final Bill Button - Opens review modal */}
            <Button
              variant="outline"
              size="sm"
              onClick={onFinalBill}
              className="w-full text-xs h-9 font-medium"
              style={{
                borderColor: QSAITheme.purple.primary,
                color: QSAITheme.purple.primary,
                backgroundColor: 'transparent'
              }}
            >
              Print Final Bill
            </Button>
          </>
        ) : (
          <div className="text-center py-2">
            <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
              Add items from menu - they'll save automatically
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DineInOrderSummary;
