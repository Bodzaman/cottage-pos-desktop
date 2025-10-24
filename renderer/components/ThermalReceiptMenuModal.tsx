

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { OrderItem, MenuItem, Category } from 'types';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { CustomizeOrchestratorProvider } from 'components/CustomizeOrchestrator';
import DineInCategoryList from 'components/DineInCategoryList';
import DineInMenuGrid from 'components/DineInMenuGrid';
import ThermalReceiptOrderSummary from 'components/ThermalReceiptOrderSummary';
import { toast } from 'sonner';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (orderItems: OrderItem[]) => void;
}

/**
 * ThermalReceiptMenuModal - Forked from DineInOrderModal for thermal receipt design workflow
 * 3-Panel Layout: Categories | Menu Items | Receipt Items
 * Purpose: Build sample orders for thermal receipt preview
 */
export function ThermalReceiptMenuModal({ isOpen, onClose, onOrderComplete }: Props) {
  const realtimeMenuStore = useRealtimeMenuStore();
  const { menuItems, categories, isLoading, isConnected } = realtimeMenuStore;
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<OrderItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Initialize menu store when modal opens
  useEffect(() => {
    const initializeMenuData = async () => {
      if (isOpen && !isConnected && !isLoading) {
        setIsInitializing(true);
        try {
          console.log('🔄 ThermalReceiptMenuModal: Initializing menu store...');
          await realtimeMenuStore.initialize();
          console.log('✅ ThermalReceiptMenuModal: Menu store initialized successfully');
        } catch (error) {
          console.error('❌ ThermalReceiptMenuModal: Failed to initialize menu store:', error);
          toast.error('Failed to load menu data');
        } finally {
          setIsInitializing(false);
        }
      }
    };
    
    initializeMenuData();
  }, [isOpen, isConnected, isLoading]);
  
  // Debug effect to track menu data changes
  useEffect(() => {
    console.log('🔍 ThermalReceiptMenuModal: Menu data updated:', {
      categoriesCount: categories.length,
      menuItemsCount: menuItems.length,
      isLoading,
      isConnected,
      isInitializing,
      sampleCategories: categories.slice(0, 3).map(cat => ({ id: cat.id, name: cat.name })),
      sampleItems: menuItems.slice(0, 3).map(item => ({ id: item.id, name: item.name, category_id: item.category_id }))
    });
  }, [categories, menuItems, isLoading, isConnected, isInitializing]);
  
  // Filter menu items by selected category
  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory && item.active)
    : menuItems.filter(item => item.active); // Show all active items when no specific category selected
    
  // Sort filtered menu items by display_order
  const sortedFilteredMenuItems = filteredMenuItems.sort((a, b) => {
    const aOrder = a.display_order || 999;
    const bOrder = b.display_order || 999;
    return aOrder - bOrder;
  });
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPendingItems([]);
      setSelectedCategory(null); // Default to "All Items" for quick browsing
    }
  }, [isOpen]);
  
  // CustomizeOrchestrator onSave callback to capture order items
  const handleOrchestratorSave = (orderItem: OrderItem) => {
    console.log('📝 ThermalReceiptMenuModal - Saving order item from orchestrator:', {
      name: orderItem.name,
      menu_item_id: orderItem.menu_item_id,
      category_id: orderItem.category_id,
      category_name: orderItem.category_name,
      variant: orderItem.variantName
    });
    
    // Enhanced order item with all necessary fields
    const enhancedOrderItem: OrderItem = {
      ...orderItem,
      basePrice: orderItem.basePrice || orderItem.price,
      total: (orderItem.basePrice || orderItem.price) * orderItem.quantity,
      customizations: orderItem.customizations || [],
      modifiers: orderItem.modifiers || [],
      instructions: orderItem.instructions || orderItem.notes || '',
      notes: orderItem.notes || orderItem.instructions || ''
    };
    
    // Check for duplicates using comprehensive comparison
    const existingIndex = pendingItems.findIndex(item => 
      item.name === enhancedOrderItem.name && 
      item.menu_item_id === enhancedOrderItem.menu_item_id &&
      item.variant_id === enhancedOrderItem.variant_id &&
      item.protein_type === enhancedOrderItem.protein_type &&
      JSON.stringify(item.customizations) === JSON.stringify(enhancedOrderItem.customizations) &&
      JSON.stringify(item.modifiers) === JSON.stringify(enhancedOrderItem.modifiers) &&
      item.instructions === enhancedOrderItem.instructions
    );
    
    if (existingIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...pendingItems];
      updatedItems[existingIndex].quantity += enhancedOrderItem.quantity;
      updatedItems[existingIndex].total = (updatedItems[existingIndex].basePrice || updatedItems[existingIndex].price) * updatedItems[existingIndex].quantity;
      setPendingItems(updatedItems);
    } else {
      // Add new item
      setPendingItems(prev => [...prev, enhancedOrderItem]);
    }
    
    toast.success(`Added ${enhancedOrderItem.name} to receipt`);
  };

  // Handle quantity updates for pending items
  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...pendingItems];
    updatedItems[index].quantity = quantity;
    // Recalculate total = price * quantity (use price field, not basePrice)
    updatedItems[index].total = updatedItems[index].price * quantity;
    setPendingItems(updatedItems);
  };
  
  // Handle item removal
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...pendingItems];
    updatedItems.splice(index, 1);
    setPendingItems(updatedItems);
  };
  
  // Complete order and pass items to thermal receipt
  const handleCompleteOrder = () => {
    if (pendingItems.length === 0) {
      toast.info('No items selected');
      return;
    }
    
    onOrderComplete(pendingItems);
    toast.success(`Added ${pendingItems.length} items to thermal receipt`);
    onClose();
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (pendingItems.length > 0) {
      if (confirm(`You have ${pendingItems.length} item${pendingItems.length === 1 ? '' : 's'} selected. Cancel anyway?`)) {
        setPendingItems([]);
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-7xl h-[80vh] border-0 flex flex-col [&>button]:hidden"
        style={{
          backgroundColor: QSAITheme.background.primary,
          border: `1px solid ${QSAITheme.border.medium}`,
          borderBottom: `2px solid ${QSAITheme.purple.primary}`
        }}
      >
        <CustomizeOrchestratorProvider>
          <DialogHeader 
            className="border-b pb-4 flex-shrink-0"
            style={{ borderColor: QSAITheme.border.medium }}
          >
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold" style={{ color: QSAITheme.text.primary }}>
                Build Sample Order for Receipt
              </DialogTitle>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCompleteOrder}
                  disabled={pendingItems.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  style={{
                    backgroundColor: pendingItems.length > 0 ? QSAITheme.purple.primary : QSAITheme.background.secondary,
                    color: pendingItems.length > 0 ? 'white' : QSAITheme.text.muted
                  }}
                >
                  Add to Receipt ({pendingItems.length})
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                  style={{
                    borderColor: QSAITheme.purple.primary + '40',
                    color: QSAITheme.text.secondary
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* 3-Panel Layout: Categories | Menu Items | Receipt Items */}
          <div className="flex-1 grid grid-cols-[200px_1fr_300px] gap-4 min-h-0 overflow-hidden">
            {/* Left Panel: Categories */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              {(isLoading || isInitializing) ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center" style={{ color: QSAITheme.text.muted }}>
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Loading categories...</p>
                  </div>
                </div>
              ) : (
                <DineInCategoryList
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  menuItems={menuItems}
                />
              )}
            </div>
            
            {/* Center Panel: Menu Items */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              {(isLoading || isInitializing) ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center" style={{ color: QSAITheme.text.muted }}>
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-lg">Loading menu items...</p>
                    <p className="text-sm mt-1">Please wait while we fetch your menu</p>
                  </div>
                </div>
              ) : (
                <DineInMenuGrid
                  selectedCategory={selectedCategory}
                  onAddToOrder={handleOrchestratorSave}
                />
              )}
            </div>
            
            {/* Right Panel: Receipt Items Summary */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              <ThermalReceiptOrderSummary
                orderItems={pendingItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCompleteOrder={handleCompleteOrder}
              />
            </div>
          </div>
        </CustomizeOrchestratorProvider>
      </DialogContent>
    </Dialog>
  );
}

export default ThermalReceiptMenuModal;
