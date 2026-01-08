import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Minus, Plus, Trash2, User, Users, Receipt, Utensils, Save, FileText, Cog, XCircle } from 'lucide-react';
import { AppApisTableOrdersOrderItem, CustomerTab } from 'types';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { MenuItem, ItemVariant, SelectedCustomization } from 'utils/menuTypes';
import { StaffCustomizationModal } from 'components/StaffCustomizationModal';
import { DineInActionBar } from 'components/DineInActionBar';
import { toast } from 'sonner';
import { apiClient } from 'app';

interface Props {
  orderItems: AppApisTableOrdersOrderItem[];
  stagingItems?: AppApisTableOrdersOrderItem[]; // ✅ NEW: Cart items not yet saved
  customerTabs?: CustomerTab[]; // NEW: Optional customer tabs for grouping
  activeCustomerTabId?: string | null; // NEW: Currently selected customer tab
  orderId?: string | null; // ✅ NEW: Order ID for update-item endpoint
  orderStatus?: string | null; // ✅ NEW: Order status for workflow enforcement
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onSave: () => void;
  onSendToKitchen: () => void;
  onFinalBill: () => void;
  onViewBill?: () => void; // NEW: Optional View Bill handler
  onReviewOrder?: () => void; // ✅ NEW: Handler to open Full Review Modal
  onCancelOrder?: () => void; // NEW: Handler to refresh after cancel
  onResetTable?: () => void; // ✅ NEW: Handler to reset table status
  className?: string;
}

/**
 * Dedicated order summary component optimized for dine-in modal context
 * Features compact layout, QSAI design consistency, proper CTAs
 */
export function DineInOrderSummary({
  orderItems,
  stagingItems = [], // ✅ NEW: Cart items not yet saved (with default)
  customerTabs = [],
  activeCustomerTabId = null,
  orderId = null,
  orderStatus = null,
  onUpdateQuantity,
  onRemoveItem,
  onSave,
  onSendToKitchen,
  onFinalBill,
  onViewBill,
  onReviewOrder,
  onCancelOrder,
  onResetTable,
  className
}: Props) {
  // ✅ Get menu items and variants from store for StaffCustomizationModal
  const { menuItems, itemVariants } = useRealtimeMenuStore();
  
  // ✅ State for StaffCustomizationModal
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [customizingOrderItem, setCustomizingOrderItem] = useState<AppApisTableOrdersOrderItem | null>(null);
  const [customizingItemIndex, setCustomizingItemIndex] = useState<number>(-1);
  
  // ✅ NEW: State for Cancel Order password authentication
  const [showCancelPasswordDialog, setShowCancelPasswordDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // 🔍 PHASE 4: DIAGNOSTIC LOGGING - Verify menu_item_id presence
  useEffect(() => {
    console.log('🔍 [PHASE 4 DIAGNOSTIC] DineInOrderSummary received orderItems:', {
      itemCount: orderItems?.length || 0,
      rawItems: orderItems,
      firstItem: orderItems?.[0],
      firstItemKeys: orderItems?.[0] ? Object.keys(orderItems[0]) : [],
      menu_item_id_check: {
        exists: orderItems?.[0]?.menu_item_id !== undefined,
        value: orderItems?.[0]?.menu_item_id,
        type: typeof orderItems?.[0]?.menu_item_id
      },
      variant_check: {
        has_variant_object: orderItems?.[0]?.variant !== undefined,
        has_variant_id: orderItems?.[0]?.variant_id !== undefined,
        has_variant_name: orderItems?.[0]?.variant_name !== undefined,
      }
    });
  }, [orderItems]);

  // DEBUG: Log when orderItems prop changes
  useEffect(() => {
    console.log('[DineInOrderSummary] 📦 ORDER_ITEMS PROP RECEIVED:', {
      itemCount: orderItems?.length || 0,
      items: orderItems,
      customerTabsCount: customerTabs?.length || 0,
      activeCustomerTabId
    });
  }, [orderItems, customerTabs, activeCustomerTabId]);

  // ✅ CLEAN ARCHITECTURE: Combine orderItems and stagingItems for display
  // 
  // ARCHITECTURE DECISION (MYA-1615 Phase 2):
  // This component supports TWO use cases:
  // 
  // USE CASE 1: Adding Interface (DineInOrderModal)
  //   - orderItems: [] (empty - no database items yet)
  //   - stagingItems: [...] (items being added, not yet saved)
  //   - allItems = [] + stagingItems = stagingItems ✅
  //   - Shows ONLY ephemeral cart items
  //   - After save: stagingItems clears, cart becomes empty
  // 
  // USE CASE 2: Management Interface (DineInFullReviewModal - future)
  //   - orderItems: [...] (all saved database items)
  //   - stagingItems: [] (no staging in management view)
  //   - allItems = orderItems + [] = orderItems ✅
  //   - Shows ONLY persistent saved items
  //   - Allows editing, tab assignment, payment
  // 
  // WHY COMBINE BOTH:
  // - Single component can handle both adding and management
  // - Flexible architecture for future enhancements
  // - Consistent rendering logic regardless of source
  // 
  // DATA LIFECYCLE:
  // Staging (ephemeral) → Persist (save) → Database (persistent) → Review (display)
  const allItems = React.useMemo(() => {
    return [...orderItems, ...stagingItems];
  }, [orderItems, stagingItems]);

  // Calculate totals using same logic as POSOrderSummary
  const subtotal = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Add tax/discount logic here if needed

  // NEW: Group items by customer tab ID
  const groupedItems = React.useMemo(() => {
    const groups: Map<string | null, AppApisTableOrdersOrderItem[]> = new Map();
    
    allItems.forEach(item => {
      const tabId = (item as any).customer_tab_id || null;
      const existing = groups.get(tabId) || [];
      groups.set(tabId, [...existing, item]);
    });
    
    return groups;
  }, [allItems]);

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

                  {/* ✅ NEW: Kitchen Status Badge (Phase 5.1) */}
                  <Badge 
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 font-medium"
                    style={{
                      borderColor: item.sent_to_kitchen 
                        ? 'rgba(34, 197, 94, 0.5)' 
                        : 'rgba(249, 115, 22, 0.5)',
                      backgroundColor: item.sent_to_kitchen
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'rgba(249, 115, 22, 0.1)',
                      color: item.sent_to_kitchen
                        ? '#22C55E'
                        : '#F97316'
                    }}
                  >
                    {item.sent_to_kitchen ? 'Sent' : 'Pending'}
                  </Badge>

                  {/* ✅ NEW: Customize button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCustomization(globalIndex, item)}
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

  // ✅ Handler to open StaffCustomizationModal for editing order items
  const handleOpenCustomization = (index: number, item: AppApisTableOrdersOrderItem) => {
    console.log('🔧 [DineInOrderSummary] handleOpenCustomization called:', {
      index,
      item,
      menuItemId: item.menu_item_id,
      variantId: item.variant_id
    });
    
    setCustomizingOrderItem(item);
    setCustomizingItemIndex(index);
    setIsCustomizationModalOpen(true);
  };
  
  // ✅ Handler to save customized item from StaffCustomizationModal
  const handleCustomizationConfirm = async (
    menuItem: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    if (customizingItemIndex === -1 || !customizingOrderItem) return;
    
    console.log('✅ [DineInOrderSummary] Customization confirmed:', {
      menuItem,
      quantity,
      variant,
      customizations,
      notes,
      orderId,
      itemId: customizingOrderItem.id
    });
    
    // ✅ Phase 4.2.4: Call update-item endpoint
    try {
      const response = await apiClient.update_item({
        order_id: orderId || '',
        item_id: customizingOrderItem.id,
        quantity,
        notes: notes || null,
        customizations: customizations || []
      });

      const updatedItem = await response.json();
      console.log('✅ [DineInOrderSummary] Item updated successfully:', updatedItem);
      toast.success('Item updated successfully');
      
      // Close modal
      setIsCustomizationModalOpen(false);
      setCustomizingOrderItem(null);
      setCustomizingItemIndex(-1);
    } catch (error) {
      console.error('❌ Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  // ✅ Handler to clear staging cart (no password required)
  const handleCancelOrder = () => {
    console.log('🔍 [RENDER SOURCE CHECK] Before clear:', {
      orderItemsProp: orderItems,
      orderItemsLength: orderItems.length,
      stagingItems: stagingItems,
      stagingItemsLength: stagingItems.length,
      groupedItemsKeys: Array.from(groupedItems.keys()),
      groupedItemsSize: groupedItems.size
    });
    
    if (stagingItems.length === 0) {
      toast.info('Cart is already empty');
      return;
    }
    
    console.log('🗑️ [DineInOrderSummary] Clearing staging cart');
    
    // Call parent handler to clear staging state
    if (onCancelOrder) {
      onCancelOrder();
    }
    
    toast.success('Cart cleared', {
      description: 'Unsaved items removed from cart'
    });
    
    // ✅ DEBUG: Check what orderItems is AFTER parent updates state
    setTimeout(() => {
      console.log('🔍 [RENDER SOURCE CHECK] After clear (50ms delay):', {
        orderItemsProp: orderItems,
        orderItemsLength: orderItems.length,
        stagingItems: stagingItems,
        stagingItemsLength: stagingItems.length
      });
    }, 50);
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
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: QSAITheme.text.primary }}>
            Order Summary
            {stagingItems.length > 0 && (
              <Badge 
                variant="default" 
                className="text-xs"
                style={{
                  backgroundColor: `${QSAITheme.purple.primary}40`,
                  color: QSAITheme.purple.light,
                  border: `1px solid ${QSAITheme.purple.primary}`
                }}
              >
                {stagingItems.length} item{stagingItems.length === 1 ? '' : 's'}
              </Badge>
            )}
          </h3>
          <span className="text-xs" style={{ color: QSAITheme.text.secondary }}>{allItems.length} items</span>
        </div>
      </div>

      {/* Order Items List */}
      <div className="flex-1 overflow-y-auto">
        {allItems.length === 0 ? (
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
      {allItems.length > 0 && (
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

      {/* Action Buttons - Delegated to DineInActionBar */}
      <DineInActionBar
        stagingItemCount={stagingItems.length}
        savedItemCount={orderItems.length}
        totalItemCount={allItems.length}
        orderId={orderId}
        onSave={onSave}
        onReviewOrder={onReviewOrder || (() => {})}
        onCancelOrder={onCancelOrder || (() => {})}
        onResetTable={onResetTable}
      />

      {/* ✅ NEW: StaffCustomizationModal for editing order items */}
      {isCustomizationModalOpen && customizingOrderItem && (() => {
        // Find the MenuItem and ItemVariant from store
        const menuItem = menuItems.find(m => m.id === customizingOrderItem.menu_item_id);
        const variant = customizingOrderItem.variant_id 
          ? itemVariants.find(v => v.id === customizingOrderItem.variant_id)
          : null;
        
        if (!menuItem) {
          console.error('❌ MenuItem not found for customization:', customizingOrderItem.menu_item_id);
          return null;
        }
        
        // Convert customizations to SelectedCustomization format
        const existingCustomizations: SelectedCustomization[] = (customizingOrderItem.customizations || []).map(c => ({
          id: c.customization_id || c.id || '',
          name: c.name || '',
          price: c.price_adjustment || 0,
          group: c.group || ''
        }));
        
        return (
          <StaffCustomizationModal
            isOpen={isCustomizationModalOpen}
            onClose={() => {
              setIsCustomizationModalOpen(false);
              setCustomizingOrderItem(null);
              setCustomizingItemIndex(-1);
            }}
            onConfirm={handleCustomizationConfirm}
            item={menuItem}
            variant={variant}
            orderType="DINE-IN"
            initialQuantity={customizingOrderItem.quantity}
            existingCustomizations={existingCustomizations}
            existingNotes={customizingOrderItem.notes}
          />
        );
      })()}
    </div>
  );
}

export default DineInOrderSummary;
