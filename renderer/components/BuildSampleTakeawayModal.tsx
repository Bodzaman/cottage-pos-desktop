import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Trash2, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { DineInCategoryList } from './DineInCategoryList';
import { POSMenuSelector } from './POSMenuSelector';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/receiptDesignerTypes';
import { v4 as uuidv4 } from 'uuid';
import { CustomizeOrchestratorProvider } from './CustomizeOrchestrator';
import { ModalShell3Col } from 'components/ModalShell3Col';

// Simplified output for takeaway orders (WAITING, COLLECTION, DELIVERY)
interface TakeawayOrderOutput {
  orderItems: OrderItem[];
  customerName?: string;
  customerPhone?: string;
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
  
  // Optional customer details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Calculate total
  const totalItems = orderItems.length;
  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

  // Add menu item to order
  const handleAddToOrder = (menuItem: any) => {
    // Build OrderItem without customer metadata (single customer flow)
    const newItem: OrderItem = {
      id: uuidv4(),
      name: menuItem.name,
      basePrice: menuItem.price || 0,
      quantity: 1,
      total: menuItem.price || 0,
      menu_item_id: menuItem.id,
      category_id: menuItem.category_id,
      category_name: categories.find(c => c.id === menuItem.category_id)?.name,
      protein_type: menuItem.protein_type || null,
      // No customer_id or customer_name for takeaway
      // Variant handling
      variant: menuItem.variant ? {
        id: menuItem.variant.id,
        name: menuItem.variant.name || '',
        price_adjustment: menuItem.variant.price_adjustment || 0,
        protein_type: menuItem.variant.protein_type
      } : undefined
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

  // Build final order
  const handleBuildOrder = () => {
    if (orderItems.length === 0) {
      toast.error('Add at least one item to build order');
      return;
    }

    const output: TakeawayOrderOutput = {
      orderItems,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined
    };

    onOrderBuilt(output);
    toast.success(`Sample order created with ${orderItems.length} items`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] p-0 overflow-hidden">
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
              <POSMenuSelector
                selectedCategory={selectedCategory}
                onAddToOrder={handleAddToOrder}
                className="min-w-0 max-w-full"
              />
            }
            right={
              <div className="flex flex-col h-full min-w-0">
                {/* Customer Details (Optional) */}
                <div className="p-4 border-b border-border flex-shrink-0 sticky top-0 bg-background z-10">
                  <h3 className="font-medium text-sm" style={{ color: QSAITheme.text.primary }}>
                    Customer Details (Optional)
                  </h3>
                  
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: QSAITheme.text.muted }} />
                      <Input
                        placeholder="Customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" style={{ color: QSAITheme.text.muted }} />
                      <Input
                        placeholder="Phone number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 min-w-0 p-4 space-y-3">
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
                            <div className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                              £{item.total.toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="hover:opacity-70"
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
