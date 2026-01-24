import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DineInCategoryList } from './DineInCategoryList';
import { DineInMenuGrid } from './DineInMenuGrid';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/receiptDesignerTypes';
import { OrderItem as MenuOrderItem } from '../utils/menuTypes';
import { v4 as uuidv4 } from 'uuid';
import { CustomizeOrchestratorProvider } from './CustomizeOrchestrator';
import { ModalShell3Col } from 'components/ModalShell3Col';

// Simplified output for takeaway orders (WAITING, COLLECTION, DELIVERY)
// Note: Customer details are configured via the Order tab in the main receipt designer
interface TakeawayOrderOutput {
  orderItems: OrderItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderBuilt: (output: TakeawayOrderOutput) => void;
  initialOrderItems?: OrderItem[];
}

/**
 * BuildSampleTakeawayModal - Simple single-customer order builder
 * 
 * For WAITING, COLLECTION, and DELIVERY order modes.
 * No customer tabs - all items belong to single customer.
 * Reuses menu browsing components from DINE-IN.
 */
export function BuildSampleTakeawayModal({
  isOpen,
  onClose,
  onOrderBuilt,
  initialOrderItems = []
}: Props) {
  const { categories, menuItems } = useRealtimeMenuStore();
  
  // Single customer order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate total
  const totalItems = orderItems.length;

  // Add menu item to order
  const handleAddToOrder = (menuItem: any) => {
    // Get proper display name with variant pattern
    const hasVariant = !!menuItem.variant;
    let displayName = menuItem.name;
    let variantDisplayName: string | undefined = undefined;

    if (hasVariant && menuItem.variant) {
      if (menuItem.variant.variant_name && menuItem.variant.variant_name.trim()) {
        displayName = menuItem.variant.variant_name;
        variantDisplayName = menuItem.variant.variant_name;
      } else if (menuItem.variant.name || menuItem.variant.protein_type) {
        const variantShortName = menuItem.variant.name || menuItem.variant.protein_type || '';
        displayName = variantShortName ? `${menuItem.name} (${variantShortName})` : menuItem.name;
        variantDisplayName = variantShortName;  // Store just the variant part, not the full display name
      }
    }

    // Build OrderItem without customer metadata (single customer flow)
    const newItem: OrderItem = {
      id: uuidv4(),
      name: displayName,
      variantName: variantDisplayName,
      basePrice: menuItem.price || 0,
      quantity: 1,
      total: menuItem.price || 0,
      menu_item_id: menuItem.id,
      category_id: menuItem.category_id,
      category_name: categories.find(c => c.id === menuItem.category_id)?.name,
      protein_type: menuItem.protein_type || null,
      // Kitchen display name for thermal receipts
      kitchen_display_name: menuItem.kitchen_display_name || null,
      // Display order for sorting items within sections on receipts
      display_order: menuItem.display_order || 0,
      // No customer_id or customer_name for takeaway
      // Variant handling
      variant: menuItem.variant ? {
        id: menuItem.variant.id,
        name: menuItem.variant.name || '',
        price_adjustment: menuItem.variant.price_adjustment || 0,
        protein_type: menuItem.variant.protein_type
      } : undefined,
      // Initialize customizations and modifiers
      customizations: [],
      modifiers: []
    };

    setOrderItems([...orderItems, newItem]);
    toast.success(`Added ${menuItem.name}`);
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setOrderItems(orderItems.map(item =>
      item.id === itemId
        ? {
            ...item,
            quantity: Math.max(1, item.quantity + delta),
            total: item.basePrice * Math.max(1, item.quantity + delta)
          }
        : item
    ));
  };

  // Handle customized items from POSMenuItemCard's StaffCustomizationModal
  // This receives a fully-formed OrderItem with customizations already applied
  const handleCustomizedItem = (orderItem: MenuOrderItem) => {
    // Calculate total including customizations
    // Note: StaffVariantSelector sends "price", BuildSampleOrderModal sends "price_adjustment"
    // Use fallback chain to handle both formats
    const customizationTotal = (orderItem.customizations || []).reduce(
      (sum, c) => sum + (c.price_adjustment || c.price || 0), 0
    );
    const totalPrice = (orderItem.price + customizationTotal) * orderItem.quantity;

    // Convert to our internal OrderItem format (no customer metadata for takeaway)
    const newItem: OrderItem = {
      id: uuidv4(),
      name: orderItem.name,
      variantName: orderItem.variantName,
      basePrice: orderItem.price,
      quantity: orderItem.quantity,
      total: totalPrice,
      menu_item_id: orderItem.menu_item_id,
      category_id: orderItem.category_id,
      category_name: categories.find(c => c.id === orderItem.category_id)?.name,
      protein_type: orderItem.protein_type || null,
      // Kitchen display name for thermal receipts (preserved from POSMenuItemCard)
      kitchen_display_name: (orderItem as any).kitchen_display_name || null,
      // Display order for sorting items within sections on receipts
      display_order: (orderItem as any).display_order || 0,
      // Variant handling
      variant: orderItem.variant_id ? {
        id: orderItem.variant_id,
        name: orderItem.variantName || '',
        price_adjustment: 0,
        protein_type: orderItem.protein_type
      } : undefined,
      // Customizations - convert from StaffCustomizationModal format
      // Note: StaffVariantSelector sends "price", use fallback chain to handle both formats
      customizations: (orderItem.customizations || []).map(c => ({
        id: c.id,
        customization_id: c.id,
        name: c.name,
        price_adjustment: c.price_adjustment || c.price || 0,
        group: c.group
      })),
      modifiers: orderItem.modifiers || [],
      notes: orderItem.notes
    };

    setOrderItems([...orderItems, newItem]);
    toast.success(`Added ${orderItem.name}`);
  };

  // Build final order
  const handleBuildOrder = () => {
    if (orderItems.length === 0) {
      toast.error('Add at least one item to build order');
      return;
    }

    const output: TakeawayOrderOutput = {
      orderItems
    };

    onOrderBuilt(output);
    toast.success(`Sample order created with ${orderItems.length} items`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90dvh] p-0 overflow-hidden">
        <CustomizeOrchestratorProvider>
          <ModalShell3Col
            header={
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle style={{ color: QSAITheme.text.primary }}>
                    Build Sample Order
                  </DialogTitle>
                  <p className="text-sm mt-1" style={{ color: QSAITheme.text.secondary }}>
                    Create a takeaway order for receipt testing (Collection/Delivery/Waiting)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    {totalItems} items
                  </Badge>
                  <Button
                    onClick={handleBuildOrder}
                    disabled={totalItems === 0}
                    style={{
                      backgroundColor: QSAITheme.purple.primary,
                      color: QSAITheme.text.primary
                    }}
                  >
                    Build Order
                  </Button>
                </div>
              </div>
            }
            left={
              <DineInCategoryList
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                menuItems={menuItems}
                className="min-w-0"
              />
            }
            center={
              <DineInMenuGrid
                selectedCategory={selectedCategory}
                onAddToOrder={handleAddToOrder}
                onCustomizeItem={handleCustomizedItem}
                className="min-w-0 max-w-full"
              />
            }
            right={
              <div className="flex flex-col h-full min-w-0">
                {/* Items List - Customer details are configured via the Order tab in main designer */}
                <div className="flex-1 min-w-0 p-4 space-y-3 overflow-y-auto">
                  {orderItems.length === 0 ? (
                    <div className="text-center py-8" style={{ color: QSAITheme.text.muted }}>
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No items yet</p>
                      <p className="text-xs mt-1">Select items from the menu</p>
                    </div>
                  ) : (
                    orderItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: QSAITheme.background.base,
                          borderColor: QSAITheme.border.light
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate" style={{ color: QSAITheme.text.primary }}>
                              {item.name}
                            </div>
                            {item.variant && (
                              <div className="text-xs mt-0.5 truncate" style={{ color: QSAITheme.text.secondary }}>
                                {item.variant.name}
                              </div>
                            )}
                            {/* Display customizations */}
                            {item.customizations && item.customizations.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {item.customizations.map((c, idx) => (
                                  <div key={idx} className="text-xs flex justify-between" style={{ color: QSAITheme.text.secondary }}>
                                    <span>+ {c.name}</span>
                                    <span style={{ color: QSAITheme.text.muted }}>
                                      {c.price_adjustment > 0 ? `£${c.price_adjustment.toFixed(2)}` : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Display notes */}
                            {item.notes && (
                              <div className="text-xs mt-1 italic" style={{ color: QSAITheme.text.muted }}>
                                Note: {item.notes}
                              </div>
                            )}
                            <div className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                              £{item.total.toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="hover:opacity-70 p-1"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: QSAITheme.text.muted }} />
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="text-xs font-medium w-8 text-center" style={{ color: QSAITheme.text.primary }}>
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Build Button */}
                {orderItems.length > 0 && (
                  <div className="p-4 border-t border-border sticky bottom-0 bg-background z-10">
                    <Button
                      onClick={handleBuildOrder}
                      className="w-full"
                      style={{
                        backgroundColor: QSAITheme.purple.primary,
                        color: QSAITheme.text.primary
                      }}
                    >
                      Build Order
                    </Button>
                  </div>
                )}
              </div>
            }
          />
        </CustomizeOrchestratorProvider>
      </DialogContent>
    </Dialog>
  );
}
