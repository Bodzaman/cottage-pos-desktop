

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Users, User, Edit2, Save, Trash2 } from 'lucide-react';
import { OrderItem, MenuItem, Category } from 'types';
import { QSAITheme } from 'utils/QSAIDesign';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { useTableOrdersStore, tableOrdersStore } from 'utils/tableOrdersStore';
import DineInCategoryList from 'components/DineInCategoryList';
import DineInMenuGrid from 'components/DineInMenuGrid';
import DineInOrderSummary from 'components/DineInOrderSummary';
import BillReviewModal from 'components/BillReviewModal';
import CustomerTabsCompact from 'components/CustomerTabsCompact';
import ConfirmationDialog from 'components/ConfirmationDialog';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  linkedTables?: number[];
}

/**
 * Enhanced dine-in order management modal with dual-level tab system:
 * Level 1: Linked table tabs (Table 5, Table 6, Table 7 for large parties)
 * Level 2: Customer tabs within each table (Customer 1, Customer 2, etc.)
 * Preserves all existing functionality while adding individual customer management
 */
export function DineInOrderModal({ isOpen, onClose, tableNumber, linkedTables = [] }: Props) {
  const { menuItems, categories } = useRealtimeMenuStore();
  
  // Table orders store with NEW customer tab support
  const { 
    persistedTableOrders,
    addItemsToTable, 
    removeItemFromTable, 
    resetTableToAvailable,
    forceRefresh,
    // NEW: Customer tab functions
    customerTabs,
    activeCustomerTab,
    loadCustomerTabsForTable,
    createCustomerTab,
    addItemsToCustomerTab,
    setActiveCustomerTab,
    getCustomerTabsForTable,
    getActiveCustomerTab,
    renameCustomerTab,
    closeCustomerTab,
    removeItemFromCustomerTab
  } = useTableOrdersStore();
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTableTab, setSelectedTableTab] = useState<number>(tableNumber);
  const [pendingItems, setPendingItems] = useState<OrderItem[]>([]);
  const [showBillReview, setShowBillReview] = useState(false);
  
  // NEW: Customer tab UI state
  const [isCreatingNewTab, setIsCreatingNewTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  
  // NEW: Confirmation dialog state for item deletion
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    itemIndex: number;
    itemName: string;
  }>({ isOpen: false, itemIndex: -1, itemName: '' });
  
  // NEW: State for unsaved changes warning
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  
  // Get existing table order items
  const existingTableOrder = persistedTableOrders[selectedTableTab];
  const existingItems = existingTableOrder?.order_items || [];
  
  // NEW: Get customer tabs for current table
  const currentTableCustomerTabs = getCustomerTabsForTable(selectedTableTab);
  const currentActiveCustomerTab = getActiveCustomerTab(selectedTableTab);
  
  // Combined items for display (existing + pending + customer tab items)
  const getDisplayItems = () => {
    if (currentActiveCustomerTab) {
      // Show active customer tab items + pending
      return [...(currentActiveCustomerTab.order_items || []), ...pendingItems];
    } else {
      // Show table-level items + pending (existing behavior)
      return [...existingItems, ...pendingItems];
    }
  };
  
  const combinedOrderItems = getDisplayItems();
  
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
  
  // All linked tables including main table
  const allTables = [tableNumber, ...linkedTables].sort((a, b) => a - b);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTableTab(tableNumber);
      setPendingItems([]);
      setSelectedCategory(null); // Default to "All Items" for quick browsing
      
      // NEW: Reset customer tab UI state
      setIsCreatingNewTab(false);
      setNewTabName('');
    }
  }, [isOpen, tableNumber]);
  
  // Load existing order data when modal opens
  useEffect(() => {
    if (isOpen && tableNumber) {
      // Force refresh to ensure we have latest data from database
      forceRefresh();
      
      // NEW: Load customer tabs for all linked tables
      const allTables = [tableNumber, ...linkedTables];
      allTables.forEach(table => {
        loadCustomerTabsForTable(table);
      });
    }
  }, [isOpen, tableNumber, forceRefresh, loadCustomerTabsForTable]); // Remove linkedTables from dependencies to prevent loop
  
  // NEW: Handle table tab switching - load customer tabs and clear pending items
  const handleTableTabSwitch = (table: number) => {
    setSelectedTableTab(table);
    setPendingItems([]); // Clear pending when switching tables
    loadCustomerTabsForTable(table); // Ensure customer tabs are loaded
  };
  
  // NEW: Customer tab management functions - simplified for component interface
  const handleCreateCustomerTab = async (tabName: string) => {
    const tabId = await createCustomerTab(selectedTableTab, tabName);
    if (tabId) {
      // Auto-select the new tab
      setActiveCustomerTab(selectedTableTab, tabId);
      toast.success(`Customer tab "${tabName}" created`);
    } else {
      toast.error('Failed to create customer tab');
    }
  };
  
  const handleRenameCustomerTab = async (tabId: string, newName: string) => {
    const success = await renameCustomerTab(tabId, newName);
    if (success) {
      toast.success(`Customer tab renamed to "${newName}"`);
    } else {
      toast.error('Failed to rename customer tab');
    }
  };
  
  const handleCloseCustomerTab = async (tabId: string) => {
    const success = await closeCustomerTab(tabId);
    if (success) {
      toast.success('Customer tab closed and bill completed');
    } else {
      toast.error('Failed to close customer tab');
    }
  };
  
  const handleCustomerTabSelect = (customerTab: CustomerTab | null) => {
    setActiveCustomerTab(selectedTableTab, customerTab?.id || null);
    setPendingItems([]); // Clear pending when switching customer tabs
  };
  
  // Handle adding menu item to order
  const handleAddToOrder = (menuItem: MenuItem) => {
    // ✅ FIXED: Create OrderItem matching backend API structure (AppApisTableOrdersOrderItem)
    const orderItem: OrderItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ✅ Unique order item ID
      menu_item_id: menuItem.id, // ✅ FIXED: Added required menu_item_id field
      variant_id: null, // ✅ Default to null (can be set for variants later)
      name: menuItem.name,
      quantity: 1,
      price: menuItem.price,
      notes: null, // ✅ Default to null
      protein_type: null, // ✅ Default to null
      image_url: menuItem.image_url || null // ✅ Use menu item image if available
    };
    
    // Check if item already exists in pending items
    const existingIndex = pendingItems.findIndex(item => 
      item.id === orderItem.id && 
      JSON.stringify(item.customizations) === JSON.stringify(orderItem.customizations)
    );
    
    if (existingIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...pendingItems];
      updatedItems[existingIndex].quantity += 1;
      setPendingItems(updatedItems);
    } else {
      // Add new item
      setPendingItems(prev => [...prev, orderItem]);
    }
    
    toast.success(`Added ${menuItem.name} to order`);
  };
  
  // Handle quantity updates (works for both existing and pending items)
  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (index < existingItems.length) {
      // Updating existing item - implement real update logic
      const item = existingItems[index];
      const updatedItems = [...existingItems];
      updatedItems[index] = { ...item, quantity };
      
      // Update immediately in both contexts
      if (currentActiveCustomerTab) {
        // Update customer tab
        removeItemFromCustomerTab(currentActiveCustomerTab.id!, index).then(() => {
          const newItem = { ...item, quantity };
          addItemsToCustomerTab(currentActiveCustomerTab.id!, [newItem]).then(() => {
            loadCustomerTabsForTable(selectedTableTab);
          });
        });
      } else {
        // Update main table order
        const tableOrder = persistedTableOrders[selectedTableTab];
        if (tableOrder) {
          const newItems = [...tableOrder.order_items];
          newItems[index] = { ...item, quantity };
          updateTableOrder(selectedTableTab, newItems).then(() => {
            forceRefresh();
          });
        }
      }
    } else {
      // Updating pending item
      const pendingIndex = index - existingItems.length;
      const updatedPending = [...pendingItems];
      updatedPending[pendingIndex].quantity = quantity;
      setPendingItems(updatedPending);
    }
  };
  
  // Handle item removal (works for both existing and pending items)
  const handleRemoveItem = (index: number) => {
    if (index < existingItems.length) {
      // Removing existing item - show confirmation dialog
      const item = existingItems[index];
      setConfirmationDialog({
        isOpen: true,
        itemIndex: index,
        itemName: item.name || 'Unknown item'
      });
    } else {
      // Removing pending item - no confirmation needed
      const pendingIndex = index - existingItems.length;
      const updatedPending = [...pendingItems];
      updatedPending.splice(pendingIndex, 1);
      setPendingItems(updatedPending);
    }
  };
  
  // NEW: Handle confirmed deletion of existing items
  const handleConfirmDeletion = async () => {
    const { itemIndex, itemName } = confirmationDialog;
    
    // Guard: Ensure we have a valid table number
    if (!selectedTableTab || selectedTableTab <= 0) {
      toast.error('Invalid table number - cannot remove item');
      setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
      return;
    }
    
    try {
      let success = false;
      
      if (currentActiveCustomerTab) {
        // Delete from customer tab
        success = await removeItemFromCustomerTab(currentActiveCustomerTab.id!, itemIndex);
        if (success) {
          toast.success(`Removed ${itemName} from ${currentActiveCustomerTab.tab_name}`);
          // Refresh customer tabs to show changes
          await loadCustomerTabsForTable(selectedTableTab);
        }
      } else {
        // Delete from main table order
        success = await removeItemFromTable(selectedTableTab, itemIndex);
        if (success) {
          toast.success(`Removed ${itemName} from Table ${selectedTableTab}`);
          // Refresh table orders to show changes
          await forceRefresh();
        }
      }
      
      if (!success) {
        toast.error(`Failed to remove ${itemName}`);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error(`Failed to remove ${itemName}`);
    } finally {
      // Close confirmation dialog
      setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
    }
  };
  
  // NEW: Handle cancellation of deletion
  const handleCancelDeletion = () => {
    setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
  }
  
  // NEW: Handle cancel with unsaved changes warning
  const handleCancel = () => {
    // Check if there are unsaved items (pendingItems)
    if (pendingItems.length > 0) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };
  
  // NEW: Confirm cancellation with unsaved changes
  const handleConfirmCancel = () => {
    setPendingItems([]);
    setShowUnsavedWarning(false);
    onClose();
  };
  
  // NEW: Cancel the unsaved warning
  const handleCancelWarning = () => {
    setShowUnsavedWarning(false);
  };

  // Helper function to get all tables in the current session
  const getAllTables = () => {
    return [tableNumber, ...linkedTables].sort((a, b) => a - b);
  };
  
  // Save order (add pending items to persistent storage) - FIXED: Don't close modal
  const handleSave = async () => {
    if (pendingItems.length === 0) {
      toast.info('No new items to save');
      return;
    }
    
    try {
      if (currentActiveCustomerTab) {
        // NEW: Save to customer tab
        await addItemsToCustomerTab(currentActiveCustomerTab.id!, pendingItems);
        toast.success(`Added ${pendingItems.length} items to ${currentActiveCustomerTab.tab_name}`);
        // ✅ REFRESH customer tabs to show new items
        await loadCustomerTabsForTable(selectedTableTab);
      } else {
        // Existing: Save to table-level orders
        await addItemsToTable(selectedTableTab, pendingItems);
        toast.success(`Added ${pendingItems.length} items to Table ${selectedTableTab}`);
        // ✅ REFRESH table orders to show new items
        await forceRefresh();
      }
      
      setPendingItems([]); // Clear pending items after saving
      // ✅ FIXED: Don't close modal on "Add to Order" - keep it open for more items
      // onClose(); // REMOVED - modal stays open
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    }
  };
  
  // Send to kitchen (save + print kitchen ticket) - FIXED: Keep modal open after kitchen
  const handleSendToKitchen = async () => {
    if (pendingItems.length === 0) {
      toast.info('No new items to send to kitchen');
      return;
    }
    
    try {
      if (currentActiveCustomerTab) {
        // NEW: Send customer tab items to kitchen
        await addItemsToCustomerTab(currentActiveCustomerTab.id!, pendingItems);
        toast.success(`Sent ${pendingItems.length} items from ${currentActiveCustomerTab.tab_name} to kitchen`);
        // ✅ REFRESH customer tabs to show new items
        await loadCustomerTabsForTable(selectedTableTab);
      } else {
        // Existing: Send table-level items to kitchen
        await addItemsToTable(selectedTableTab, pendingItems);
        toast.success(`Sent ${pendingItems.length} items to kitchen`);
        // ✅ REFRESH table orders to show new items
        await forceRefresh();
      }
      
      setPendingItems([]);
      // ✅ FIXED: Don't close modal after sending to kitchen - keep it open for more orders
      // onClose(); // REMOVED - modal stays open
      // Add printer integration here for kitchen ticket
    } catch (error) {
      console.error('Error sending to kitchen:', error);
      toast.error('Failed to send to kitchen');
    }
  };
  
  // Print final bill workflow
  const handleFinalBill = () => {
    if (combinedOrderItems.length === 0) {
      toast.error('No items to bill');
      return;
    }
    
    // Close dine-in modal and open bill review modal
    onClose();
    setShowBillReview(true);
  };
  
  // Handle final bill print from bill review modal
  const handleFinalBillPrint = async () => {
    try {
      // Reset table to available status
      await resetTableToAvailable(selectedTableTab);
      
      // Close bill review modal
      setShowBillReview(false);
      
      toast.success(`Table ${selectedTableTab} bill completed and table reset to available`);
      // Add actual printer integration here
    } catch (error) {
      console.error('Error completing final bill:', error);
      toast.error('Failed to complete bill');
    }
  };
  
  // Render linked table tabs
  const renderLinkedTableTabs = () => {
    if (allTables.length <= 1) return null;
    
    return (
      <div className="flex gap-2 mt-3">
        {allTables.map(table => {
          const tableOrder = persistedTableOrders[table];
          const itemCount = tableOrder?.order_items.length || 0;
          
          return (
            <Button
              key={table}
              variant={selectedTableTab === table ? "default" : "outline"}
              size="sm"
              onClick={() => handleTableTabSwitch(table)}
              style={{
                backgroundColor: selectedTableTab === table ? QSAITheme.purple.primary : 'transparent',
                borderColor: selectedTableTab === table ? QSAITheme.purple.primary : QSAITheme.border.medium,
                color: selectedTableTab === table ? 'white' : QSAITheme.text.primary
              }}
              className="text-xs h-8"
            >
              Table {table}
              {itemCount > 0 && (
                <span className="ml-1 text-xs opacity-80">({itemCount})</span>
              )}
            </Button>
          );
        })}
      </div>
    );
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="max-w-7xl h-[80vh] border-0 flex flex-col [&>button]:hidden"
          style={{
            backgroundColor: QSAITheme.background.primary,
            border: `1px solid ${QSAITheme.border.medium}`,
            borderBottom: `2px solid ${QSAITheme.purple.primary}`
          }}
        >
          <DialogHeader 
            className="border-b pb-4 flex-shrink-0"
            style={{ borderColor: QSAITheme.border.medium }}
          >
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold" style={{ color: QSAITheme.text.primary }}>
                Dine-In Order Management - Table {selectedTableTab}
              </DialogTitle>
              
              {/* NEW: Cancel Button */}
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
            
            {/* Linked Tables Section */}
            {renderLinkedTableTabs()}

            {/* NEW: Customer Tabs Section - Compact Layout */}
            <div className="mt-4">
              <CustomerTabsCompact 
                tableNumber={selectedTableTab}
                onCustomerTabCreate={handleCreateCustomerTab}
                onCustomerTabRename={handleRenameCustomerTab}
                onCustomerTabClose={handleCloseCustomerTab}
              />
            </div>
          </DialogHeader>
          
          {/* 3-Panel Layout: Categories | Menu Items | Order Summary */}
          <div className="flex-1 grid grid-cols-[200px_1fr_300px] gap-4 min-h-0 overflow-hidden">
            {/* Left Panel: Categories */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              <DineInCategoryList
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                menuItems={menuItems}
              />
            </div>
            
            {/* Center Panel: Menu Items */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              <DineInMenuGrid
                selectedCategory={selectedCategory}
                onAddToOrder={handleAddToOrder}
              />
            </div>
            
            {/* Right Panel: Order Summary */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              <DineInOrderSummary
                orderItems={combinedOrderItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onSave={handleSave}
                onSendToKitchen={handleSendToKitchen}
                onFinalBill={handleFinalBill}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Bill Review Modal */}
      <BillReviewModal
        isOpen={showBillReview}
        onClose={() => setShowBillReview(false)}
        tableNumber={selectedTableTab}
        orderItems={combinedOrderItems}
        linkedTables={linkedTables}
        onPrintFinalBill={handleFinalBillPrint}
      />
      
      {/* Confirmation Dialog for Item Deletion */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onConfirm={handleConfirmDeletion}
        onCancel={handleCancelDeletion}
        title="Remove Item"
        description={`Are you sure you want to remove "${confirmationDialog.itemName}" from the order?`}
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive={true}
      />
      
      {/* NEW: Unsaved Changes Warning Dialog */}
      <ConfirmationDialog
        isOpen={showUnsavedWarning}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelWarning}
        title="Unsaved Changes"
        description={`You have ${pendingItems.length} unsaved item${pendingItems.length === 1 ? '' : 's'} in your cart. If you cancel now, these items will be lost. Are you sure you want to proceed?`}
        confirmText="Yes, Cancel"
        cancelText="Keep Editing"
        isDestructive={true}
      />
    </>
  );
}

export default DineInOrderModal;
