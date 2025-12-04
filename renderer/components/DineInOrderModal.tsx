import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus, Users, User, Edit2, Save, Trash2 } from 'lucide-react';
import { OrderItem, MenuItem, Category, CustomerTab } from 'types';
import { QSAITheme } from 'utils/QSAIDesign';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { useTableOrdersStore, tableOrdersStore } from 'utils/tableOrdersStore';
import { DineInCategoryPillsHorizontal } from 'components/DineInCategoryPillsHorizontal';
import DineInMenuGrid from 'components/DineInMenuGrid';
import DineInOrderSummary from 'components/DineInOrderSummary';
import BillReviewModal from 'components/BillReviewModal';
import { BillViewModal } from 'components/BillViewModal';
import CustomerTabsCompact from 'components/CustomerTabsCompact';
import ConfirmationDialog from 'components/ConfirmationDialog';
import { DineInKitchenPreviewModal } from 'components/DineInKitchenPreviewModal';
import { DineInBillPreviewModal } from 'components/DineInBillPreviewModal';
import { toast } from 'sonner';
import brain from 'brain';
import { getElectronHeaders } from 'utils/electronDetection';

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
  const { menuItems, categories, filteredMenuItems, selectedMenuCategory } = useRealtimeMenuStore();
  
  // Table orders store with NEW customer tab support
  const { 
    persistedTableOrders,
    addItemsToTable, 
    removeItemFromTable, 
    resetTableToAvailable,
    forceRefresh,
    // NEW: Customer tab functions
    customerTabs,
    loadCustomerTabsForTable,
    createCustomerTab,
    addItemsToCustomerTab,
    getCustomerTabsForTable,
    getActiveCustomerTab,
    renameCustomerTab,
    closeCustomerTab,
    removeItemFromCustomerTab,
    completeCustomerTab
  } = useTableOrdersStore();
  
  // UI state
  const [selectedTableTab, setSelectedTableTab] = useState<number>(tableNumber);
  // ✅ STAGING WORKFLOW: Items added to staging first, then explicitly saved to database
  const [stagingItems, setStagingItems] = useState<OrderItem[]>([]);
  const [showBillReview, setShowBillReview] = useState(false);
  const [showBillView, setShowBillView] = useState(false);
  
  // NEW: Thermal receipt preview modals state
  const [showKitchenPreviewModal, setShowKitchenPreviewModal] = useState(false);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);
  
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
  
  // ✅ STAGING WORKFLOW: Warning system for unsaved staging items
  const hasUnsavedItems = stagingItems.length > 0;
  
  // ✅ Handle category selection - matches POSDesktop pattern
  const handleCategorySelect = (categoryId: string | null) => {
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(categoryId);
  };
  
  // Get existing table order items
  const existingTableOrder = persistedTableOrders[selectedTableTab];
  const existingItems = existingTableOrder?.items || [];
  
  // NEW: Get customer tabs for current table
  const currentTableCustomerTabs = getCustomerTabsForTable(selectedTableTab);
  const currentActiveCustomerTab = getActiveCustomerTab(selectedTableTab);
  
  // Combined items for display (existing + pending + customer tab items)
  const getDisplayItems = () => {
    if (currentActiveCustomerTab) {
      // Show active customer tab items + pending
      return [...(currentActiveCustomerTab.order_items || []), ...stagingItems];
    } else {
      // Show table-level items + pending (existing behavior)
      return [...existingItems, ...stagingItems];
    }
  };
  
  const combinedOrderItems = getDisplayItems();
  
  // ✅ USE MENU STORE FILTERING: Get filtered items from store instead of manual filtering
  // The store's updateFilteredItems() handles parent/child category logic correctly
  const sortedFilteredMenuItems = filteredMenuItems
    .filter(item => item.is_active)
    .sort((a, b) => {
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
      setStagingItems([]);
      
      // ✅ Reset menu store filter to show all items
      const menuStore = useRealtimeMenuStore.getState();
      menuStore.setSelectedMenuCategory(null);
      
      // NEW: Reset customer tab UI state
      setIsCreatingNewTab(false);
      setNewTabName('');
    }
  }, [isOpen, tableNumber]);
  
  // Load existing order data when modal opens
  useEffect(() => {
    if (isOpen && tableNumber) {
      // ✅ No forceRefresh needed - store already has data from initialization
      // addItemsToTable updates persistedTableOrders immediately, so data persists
      
      // NEW: Load customer tabs for all linked tables
      const allTables = [tableNumber, ...linkedTables];
      allTables.forEach(table => {
        loadCustomerTabsForTable(table);
      });
    }
  }, [isOpen, tableNumber, loadCustomerTabsForTable]); // Remove linkedTables from dependencies to prevent loop
  
  // NEW: Handle table tab switching - load customer tabs
  const handleTableTabSwitch = (table: number) => {
    // ✅ STAGING WORKFLOW: Warn before switching if unsaved items
    if (hasUnsavedItems) {
      toast.warning('You have unsaved items in staging!', {
        description: 'Save or send to kitchen before switching tables',
        duration: 4000
      });
      return; // Don't allow table switching with unsaved items
    }
    
    setSelectedTableTab(table);
    setStagingItems([]); // Clear staging when switching tables
    loadCustomerTabsForTable(table); // Ensure customer tabs are loaded
  };
  
  // Customer tab management functions
  const handleCreateCustomerTab = async (tabName: string) => {
    const tabId = await createCustomerTab(selectedTableTab, tabName);
    if (tabId) {
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
  };
  
  // Handle adding menu item to order
  const handleAddToOrder = (orderItem: OrderItem) => {
    // ✅ STAGING WORKFLOW: OrderItem already properly formatted by POSMenuCard
    console.log('🟡 DineInOrderModal handleAddToOrder received:', orderItem);
    
    // ✅ STAGING WORKFLOW: Check if item already exists in staging (by menu_item_id)
    const existingIndex = stagingItems.findIndex(item => 
      item.menu_item_id === orderItem.menu_item_id && 
      item.notes === orderItem.notes &&
      item.protein_type === orderItem.protein_type
    );
    
    if (existingIndex >= 0) {
      // ✅ STAGING WORKFLOW: Update quantity of existing staging item
      const updatedItems = [...stagingItems];
      updatedItems[existingIndex].quantity += 1;
      setStagingItems(updatedItems);
      toast.success(`Updated ${orderItem.name} quantity in staging`, {
        description: `Now ${updatedItems[existingIndex].quantity} items`
      });
      console.log('🟡 Updated staging item quantity:', updatedItems[existingIndex]);
    } else {
      // ✅ STAGING WORKFLOW: Add new item to staging with proper ID structure
      const stagingOrderItem: OrderItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ✅ Unique staging ID
        menu_item_id: orderItem.menu_item_id, // ✅ FIXED: Preserve correct UUID from POSMenuCard
        variant_id: orderItem.variant_id,
        name: orderItem.name,
        quantity: 1,
        price: orderItem.price,
        notes: null,
        protein_type: orderItem.protein_type,
        image_url: orderItem.image_url
      };
      
      setStagingItems(prev => [...prev, stagingOrderItem]);
      toast.success(`Added ${orderItem.name} to staging`, {
        description: 'Use "Save Order" or "Send to Kitchen" to persist'
      });
      console.log('🟡 Added new item to staging:', stagingOrderItem);
    }
  };
  
  // ✅ STAGING WORKFLOW: Modal close with unsaved items warning
  const handleModalClose = () => {
    if (hasUnsavedItems) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };
  
  // ✅ STAGING WORKFLOW: Force close without saving (for warning dialog)
  const handleForceClose = () => {
    setStagingItems([]); // Clear staging items
    setShowUnsavedWarning(false);
    onClose();
  };
  
  // Handle quantity updates (works for both existing and staging items)
  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (index < existingItems.length) {
      // Updating existing database item
      const item = existingItems[index];
      
      if (currentActiveCustomerTab) {
        // Update customer tab item
        removeItemFromCustomerTab(currentActiveCustomerTab.id!, index).then(() => {
          const newItem = { ...item, quantity };
          addItemsToCustomerTab(currentActiveCustomerTab.id!, [newItem]).then(() => {
            loadCustomerTabsForTable(selectedTableTab);
          });
        });
      } else {
        // Update main table order item
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
      // ✅ STAGING WORKFLOW: Updating staging item - immediate local update
      const stagingIndex = index - existingItems.length;
      const updatedStaging = [...stagingItems];
      updatedStaging[stagingIndex].quantity = quantity;
      setStagingItems(updatedStaging);
      console.log('🟡 Updated staging item quantity:', updatedStaging[stagingIndex]);
    }
  };
  
  // Handle item removal (works for both existing and staging items)
  const handleRemoveItem = (index: number) => {
    if (index < existingItems.length) {
      // Removing existing database item - show confirmation
      const item = existingItems[index];
      setConfirmationDialog({
        isOpen: true,
        itemIndex: index,
        itemName: item.name || 'Unknown item'
      });
    } else {
      // ✅ STAGING WORKFLOW: Removing staging item - no confirmation needed
      const stagingIndex = index - existingItems.length;
      const updatedStaging = [...stagingItems];
      updatedStaging.splice(stagingIndex, 1);
      setStagingItems(updatedStaging);
      toast.success('Item removed from staging');
      console.log('🟡 Removed staging item:', stagingIndex);
    }
  };
  
  // Handle confirmed deletion of existing database items
  const handleConfirmDeletion = async () => {
    const { itemIndex, itemName } = confirmationDialog;
    
    if (!selectedTableTab || selectedTableTab <= 0) {
      toast.error('Invalid table number - cannot remove item');
      setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
      return;
    }
    
    try {
      let success = false;
      
      if (currentActiveCustomerTab) {
        success = await removeItemFromCustomerTab(currentActiveCustomerTab.id!, itemIndex);
        if (success) {
          toast.success(`Removed ${itemName} from ${currentActiveCustomerTab.tab_name}`);
          await loadCustomerTabsForTable(selectedTableTab);
        }
      } else {
        success = await removeItemFromTable(selectedTableTab, itemIndex);
        if (success) {
          toast.success(`Removed ${itemName} from Table ${selectedTableTab}`);
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
      setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
    }
  };
  
  // Handle cancellation of deletion
  const handleCancelDeletion = () => {
    setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
  };
  
  // NEW: Handle cancel with unsaved changes warning
  const handleCancel = () => {
    // ✅ DATABASE-FIRST: No pending items to check, just close modal
    onClose();
  };
  
  // NEW: Confirm cancellation with unsaved changes
  const handleConfirmCancel = () => {
    setStagingItems([]);
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
    if (stagingItems.length === 0) {
      toast.info('No new items to save');
      return;
    }
    
    try {
      if (currentActiveCustomerTab) {
        // NEW: Save to customer tab
        await addItemsToCustomerTab(currentActiveCustomerTab.id!, stagingItems);
        toast.success(`Added ${stagingItems.length} items to ${currentActiveCustomerTab.tab_name}`);
        // ✅ REFRESH customer tabs to show new items
        await loadCustomerTabsForTable(selectedTableTab);
      } else {
        // Existing: Save to table-level orders
        await addItemsToTable(selectedTableTab, stagingItems);
        toast.success(`Added ${stagingItems.length} items to Table ${selectedTableTab}`);
        // ✅ REFRESH table orders to show new items
        await forceRefresh();
      }
      
      setStagingItems([]); // Clear pending items after saving
      // ✅ FIXED: Don't close modal on "Add to Order" - keep it open for more items
      // onClose(); // REMOVED - modal stays open
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    }
  };
  
  // ✅ STAGING WORKFLOW: Send to Kitchen - commits staging items to database + kitchen status
  const handleSendToKitchenDirect = async () => {
    if (stagingItems.length === 0) {
      toast.info('No new items in staging to send to kitchen');
      return;
    }

    try {
      if (currentActiveCustomerTab) {
        // Send staging items to customer tab + kitchen
        console.log('🍳 Sending staging items to kitchen via customer tab:', stagingItems);
        await addItemsToCustomerTab(currentActiveCustomerTab.id!, stagingItems);
        toast.success(`🍳 Sent ${stagingItems.length} items from ${currentActiveCustomerTab.tab_name} to kitchen`);
        // Refresh customer tabs to show new items
        await loadCustomerTabsForTable(selectedTableTab);
      } else {
        // Send staging items to table-level orders + kitchen
        console.log('🍳 Sending staging items to kitchen via table:', stagingItems);
        await addItemsToTable(selectedTableTab, stagingItems);
        toast.success(`🍳 Sent ${stagingItems.length} items to kitchen`);
        // ✅ No forceRefresh needed - addItemsToTable already updates persistedTableOrders
      }

      // Clear staging after successful send
      setStagingItems([]);
      console.log('🧹 Staging cleared after successful kitchen send');
      
    } catch (error) {
      console.error('❌ Failed to send staging items to kitchen:', error);
      toast.error('Failed to send items to kitchen');
    }
  };
  
  // NEW: Open kitchen preview modal (called by button)
  const handleSendToKitchen = async () => {
    if (stagingItems.length === 0) {
      toast.info('No new items to send to kitchen');
      return;
    }
    
    // ✅ WYSIWYG GUARANTEE: Auto-persist staging BEFORE opening preview
    try {
      await handleSendToKitchenDirect();
      
      // ✅ Data is immediately available - addItemsToTable updates persistedTableOrders synchronously
      // No delay or verification needed
      setShowKitchenPreviewModal(true);
    } catch (error) {
      console.error('❌ Failed to persist staging before preview:', error);
      toast.error('Failed to save items before preview');
    }
  };
  
  // NEW: Handle kitchen print from preview modal
  const handleKitchenPrint = async () => {
    try {
      // Generate order number for tracking
      const orderNumber = `TABLE-${tableNumber}-${Date.now()}`;
      
      // ✅ WYSIWYG: Use persisted table order data (same source as preview)
      const tableOrder = persistedTableOrders[selectedTableTab];
      if (!tableOrder || !tableOrder.order_items || tableOrder.order_items.length === 0) {
        toast.error('No items to print');
        return false;
      }
      
      // Prepare kitchen ticket data
      const kitchenData = {
        orderNumber,
        orderType: 'DINE-IN',
        items: tableOrder.order_items.map(item => ({
          name: item.name,
          variant_name: item.variant_name || null,
          quantity: item.quantity,
          notes: item.notes || '',
          modifiers: item.modifiers || []
        })),
        table: `Table ${tableNumber}`,
        specialInstructions: tableOrder.special_instructions || null,
        template_data: {
          guestCount: tableOrder.guest_count || currentTableCustomerTabs.length || 1,
          tableNumber
        },
        orderSource: 'POS'
      };

      console.log('🖨️ Sending kitchen ticket to printer:', kitchenData);

      // Call print API with Electron headers
      const response = await brain.print_kitchen_ticket(kitchenData, getElectronHeaders());
      const result = await response.json();

      if (result.success) {
        toast.success('Kitchen ticket printed successfully');
        setShowKitchenPreviewModal(false);
        return true;
      } else {
        throw new Error(result.error || 'Print failed');
      }
    } catch (error) {
      console.error('❌ Kitchen print failed:', error);
      toast.error('Failed to print kitchen ticket');
      return false;
    }
  };
  
  // Print final bill workflow
  const handleFinalBill = async () => {
    if (combinedOrderItems.length === 0) {
      toast.error('No items to bill');
      return;
    }
    
    // ✅ WYSIWYG GUARANTEE: If staging has items, persist them BEFORE opening preview
    if (stagingItems.length > 0) {
      try {
        await handleSendToKitchenDirect();
        // After persistence, staging is cleared and items are in DB
      } catch (error) {
        console.error('❌ Failed to persist staging before bill preview:', error);
        toast.error('Failed to save items before preview');
        return;
      }
    }
    
    // Open bill preview modal showing persisted data
    setShowBillPreviewModal(true);
  };
  
  // NEW: Handle actual bill print from preview modal
  const handleBillPrint = async (orderTotal: number) => {
    try {
      // Generate order number for tracking
      const orderNumber = `TABLE-${tableNumber}-${Date.now()}`;
      
      // ✅ WYSIWYG: Use persisted table order data (same source as preview)
      const tableOrder = persistedTableOrders[selectedTableTab];
      if (!tableOrder || !tableOrder.order_items || tableOrder.order_items.length === 0) {
        toast.error('No items to print');
        return false;
      }
      
      // Calculate totals
      const items = tableOrder.order_items.map(item => {
        let itemPrice = item.price;
        
        // Add modifier prices
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(mod => {
            itemPrice += mod.price_adjustment || 0;
          });
        }
        
        return {
          name: item.name,
          variant_name: item.variant_name || null,
          quantity: item.quantity,
          unitPrice: itemPrice,
          total: itemPrice * item.quantity,
          modifiers: item.modifiers?.map(m => m.option_name) || []
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.2; // 20% VAT
      const total = subtotal + tax;

      // Prepare customer receipt data
      const receiptData = {
        orderNumber,
        orderType: 'DINE-IN',
        items,
        tax,
        deliveryFee: 0,
        template_data: {
          tableNumber,
          guestCount: order.guest_count,
          subtotal,
          total,
          paymentMethod: 'Pending' // Will be updated when payment is processed
        },
        orderSource: 'POS'
      };

      console.log('🖨️ Sending bill receipt to printer:', receiptData);

      // Call print API with Electron headers
      const response = await brain.print_customer_receipt(receiptData, getElectronHeaders());
      const result = await response.json();

      if (result.success) {
        toast.success('Bill printed successfully');
        setShowBillPreviewModal(false);
      } else {
        throw new Error(result.error || 'Print failed');
      }
    } catch (error) {
      console.error('❌ Bill print failed:', error);
      toast.error('Failed to print bill');
    }
  };
  
  // NEW: Handle View Bill with customer breakdown
  const handleViewBill = () => {
    if (combinedOrderItems.length === 0) {
      toast.error('No items to bill');
      return;
    }
    
    setShowBillView(true);
  };
  
  // NEW: Process payment from BillViewModal
  const handleProcessPayment = async (customerIds: (string | null)[], amount: number) => {
    console.log('💳 Processing payment for customers:', customerIds, 'Amount:', amount);
    
    try {
      // Mark customer tabs as paid
      for (const customerId of customerIds) {
        if (customerId) {
          const success = await completeCustomerTab(customerId);
          if (success) {
            console.log(`✅ Marked customer tab ${customerId} as paid`);
          } else {
            console.error(`❌ Failed to mark customer tab ${customerId} as paid`);
          }
        }
      }
      
      // Refresh customer tabs to reflect payment status
      await loadCustomerTabsForTable(selectedTableTab);
      
      // Check if all customers have paid
      const allCustomersPaid = currentTableCustomerTabs.every(tab => 
        customerIds.includes(tab.id) || tab.status === 'paid'
      );
      
      // Check if all table-level items are accounted for
      const tableHasNoOrders = !persistedTableOrders[selectedTableTab]?.order_items?.length;
      
      if (allCustomersPaid && tableHasNoOrders) {
        // All customers paid and no table-level orders, reset table
        await resetTableToAvailable(selectedTableTab);
        toast.success(`✅ Table ${selectedTableTab} bill completed - table reset to available`);
        setShowBillView(false);
        onClose();
      } else {
        // Partial payment completed
        toast.success(`✅ Payment processed for ${customerIds.length} customer${customerIds.length > 1 ? 's' : ''}`);
        setShowBillView(false);
      }
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      toast.error('Failed to process payment');
    }
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
          {/* Required Dialog accessibility components */}
          <DialogHeader className="sr-only">
            <DialogTitle>Table Order Management</DialogTitle>
            <DialogDescription>
              Manage orders for Table {selectedTableTab} - add items, create customer tabs, and process orders
            </DialogDescription>
          </DialogHeader>
          
          {/* Modal Header with improved close handling */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">Table Order</span>
              {hasUnsavedItems && (
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  {stagingItems.length} unsaved
                </Badge>
              )}
            </div>
            <Button 
              onClick={handleModalClose}
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              title={hasUnsavedItems ? 'Unsaved items - click to see warning' : 'Close'}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Customer Tabs Section */}
          <div className="px-4 py-2">
            <CustomerTabsCompact
              tableNumber={selectedTableTab}
              onCustomerTabCreate={createCustomerTab}
              onCustomerTabRename={renameCustomerTab}
              onCustomerTabClose={closeCustomerTab}
            />
          </div>
          
          {/* 2-Panel Layout: Menu Area | Order Summary */}
          <div className="flex-1 grid grid-cols-[1fr_300px] gap-4 min-h-0 overflow-hidden">
            {/* Left Panel: Menu Area with Horizontal Category Pills */}
            <div 
              className="border rounded-lg flex flex-col overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              {/* Horizontal Category Pills Navigation */}
              <DineInCategoryPillsHorizontal
                categories={categories}
                selectedCategory={selectedMenuCategory}
                onCategorySelect={handleCategorySelect}
                menuItems={menuItems}
              />
              
              {/* Menu Grid - now with proper scrolling */}
              <div className="flex-1 overflow-auto">
                <DineInMenuGrid
                  selectedCategory={selectedMenuCategory}
                  onAddToOrder={handleAddToOrder}
                />
              </div>
            </div>
            
            {/* Right Panel: Order Summary */}
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: QSAITheme.border.light }}
            >
              <DineInOrderSummary
                orderItems={combinedOrderItems}
                customerTabs={currentTableCustomerTabs}
                activeCustomerTabId={currentActiveCustomerTab?.id || null}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onSave={handleSave}
                onSendToKitchen={handleSendToKitchen}
                onFinalBill={handleFinalBill}
                onViewBill={handleViewBill}
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
      
      {/* NEW: Bill View Modal with Customer Breakdown */}
      <BillViewModal
        isOpen={showBillView}
        onClose={() => setShowBillView(false)}
        tableNumber={selectedTableTab}
        orderItems={combinedOrderItems}
        customerTabs={currentTableCustomerTabs}
        onProcessPayment={handleProcessPayment}
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
        description={`You have ${stagingItems.length} unsaved item${stagingItems.length === 1 ? '' : 's'} in your cart. If you cancel now, these items will be lost. Are you sure you want to proceed?`}
        confirmText="Yes, Cancel"
        cancelText="Keep Editing"
        isDestructive={true}
      />
      
      {/* NEW: Kitchen Preview Modal */}
      <DineInKitchenPreviewModal
        isOpen={showKitchenPreviewModal}
        onClose={() => setShowKitchenPreviewModal(false)}
        orderItems={persistedTableOrders[selectedTableTab]?.order_items || []}
        tableNumber={selectedTableTab}
        guestCount={currentTableCustomerTabs.length || 1}
        onPrintKitchen={handleKitchenPrint}
      />
      
      {/* NEW: Bill Preview Modal */}
      <DineInBillPreviewModal
        isOpen={showBillPreviewModal}
        onClose={() => setShowBillPreviewModal(false)}
        orderItems={combinedOrderItems}
        tableNumber={selectedTableTab}
        guestCount={currentTableCustomerTabs.length || 1}
        orderTotal={combinedOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
        onPrintBill={handleBillPrint}
      />
    </>
  );
}

export default DineInOrderModal;
