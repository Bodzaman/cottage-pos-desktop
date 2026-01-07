import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Users, User, Edit2, Save, Trash2, Check, XCircle, Link2, Receipt } from 'lucide-react';
import { OrderItem, Category } from 'utils/menuTypes';
import { MenuItem, CustomerTab } from 'types';
import { QSAITheme } from 'utils/QSAIDesign';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { useTableOrdersStore, tableOrdersStore } from 'utils/tableOrdersStore';
import { DineInCategoryPillsHorizontal } from 'components/DineInCategoryPillsHorizontal';
import { POSMenuSelector } from './POSMenuSelector';
import { POSSectionPills } from './POSSectionPills';
import { POSCategoryPills } from './POSCategoryPills';
import { StaffCustomizationModal } from './StaffCustomizationModal';
import type { SelectedCustomization, ItemVariant } from 'utils/menuTypes';
import {
  wrapCreateTabHandler,
  wrapRenameTabHandler,
  wrapCloseTabHandler
} from 'utils/customerTabAdapters';
import { BillViewModal } from './BillViewModal';
import ConfirmationDialog from './ConfirmationDialog';
import { DineInKitchenPreviewModal } from './DineInKitchenPreviewModal';
import { DineInBillPreviewModal } from './DineInBillPreviewModal';
import { ManageLinkedTablesDialog } from './ManageLinkedTablesDialog';
import DineInFullReviewModal from './DineInFullReviewModal';
import { OrderItemCard } from './OrderItemCard';
import { toast } from 'sonner';
import { getElectronHeaders } from 'utils/electronDetection';
import { apiClient } from 'app';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tableId: string | null; // ✅ PRIMARY: UUID for data operations
  tableNumber: number | null; // ✅ OPTIONAL: Display-only for UI
  tableCapacity: number;
  restaurantTables: Array<{ id: string; table_number: string; capacity: number; status: string }>; // NEW: For ManageLinkedTablesDialog
  linkedTables?: number[]; // ✅ NEW: Array of linked table numbers (default [])
  
  // 🚀 EVENT-DRIVEN ARCHITECTURE: Optional props for new architecture
  // When provided, component uses event-driven pattern instead of legacy stores
  eventDrivenOrder?: {
    id: string;
    order_number: string;
    items: OrderItem[];
    subtotal: number;
    tax_amount: number; // ✅ FIXED: Changed from 'tax' to match backend schema
    total_amount: number; // ✅ FIXED: Changed from 'total' to match backend schema
    status: string;
    guest_count?: number; // ✅ NEW: Guest count field
  } | null;
  onEventDrivenAddItem?: (item: OrderItem) => Promise<void>;
  onEventDrivenRemoveItem?: (itemId: string) => Promise<void>; // ✅ FIXED: Accept string itemId, not OrderItem
  onEventDrivenUpdateItemQuantity?: (itemId: string, quantity: number) => Promise<void>; // ✅ FIXED: Renamed from onEventDrivenUpdateQuantity
  onEventDrivenSendToKitchen?: () => Promise<void>;
  onEventDrivenRequestCheck?: () => Promise<void>;
  onEventDrivenUpdateGuestCount?: (guestCount: number) => Promise<void>; // ✅ NEW: Guest count update
  
  // 🚀 EVENT-DRIVEN ARCHITECTURE: Customer tabs support
  eventDrivenCustomerTabs?: CustomerTab[];
  eventDrivenActiveTabId?: string | null;
  onEventDrivenSetActiveTabId?: (tabId: string | null) => void;
  onEventDrivenCreateTab?: (tabName: string, guestId?: string) => Promise<string | null>;
  onEventDrivenAddItemsToTab?: (tabId: string, items: any[]) => Promise<boolean>;
  onEventDrivenRenameTab?: (tabId: string, newName: string) => Promise<boolean>;
  onEventDrivenCloseTab?: (tabId: string) => Promise<boolean>;
  onEventDrivenSplitTab?: (sourceTabId: string, newTabName: string, itemIndices: number[], guestId?: string) => Promise<any>;
  onEventDrivenMergeTabs?: (sourceTabId: string, targetTabId: string) => Promise<any>;
  onEventDrivenMoveItemsBetweenTabs?: (sourceTabId: string, targetTabId: string, itemIndices: number[]) => Promise<any>;
  
  // 🚀 PHASE 2 (MYA-1615): Destructure staging props from parent
  stagingItems?: OrderItem[]; // Staging cart items (ephemeral, not yet saved)
  onAddToStaging?: (item: OrderItem) => void; // Add item to staging cart
  onRemoveFromStaging?: (itemId: string) => void; // Remove item from staging cart
  onClearStaging?: () => void; // Clear staging cart
  onPersistStaging?: () => Promise<void>; // Persist staging items to database
  
  // 🚀 MYA-1694: Enriched items with full menu metadata for Review Modal
  enrichedItems?: EnrichedDineInOrderItem[]; // Enriched order items from useDineInOrder hook
  enrichedLoading?: boolean; // Loading state for enriched items
  enrichedError?: string | null; // Error state for enriched items
}

/**
 * Enhanced dine-in order management modal with dual-level tab system:
 * Level 1: Linked table tabs (Table 5, Table 6, Table 7 for large parties)
 * Level 2: Customer tabs within each table (Customer 1, Customer 2, etc.)
 * Preserves all existing functionality while adding individual customer management
 * 
 * 🚀 EVENT-DRIVEN ARCHITECTURE:
 * Supports both legacy tableOrdersStore and new event-driven architecture via optional props.
 * When eventDrivenOrder is provided, uses command pattern; otherwise falls back to legacy.
 */
export function DineInOrderModal({ 
  isOpen, 
  onClose, 
  tableId,
  tableNumber,
  tableCapacity,
  restaurantTables,
  linkedTables = [],
  isPrimaryTable = false,
  totalLinkedCapacity = 0,
  eventDrivenOrder,
  onEventDrivenAddItem,
  onEventDrivenRemoveItem,
  onEventDrivenUpdateItemQuantity,
  onEventDrivenSendToKitchen,
  onEventDrivenRequestCheck,
  onEventDrivenUpdateGuestCount,
  eventDrivenCustomerTabs,
  eventDrivenActiveTabId,
  onEventDrivenSetActiveTabId,
  onEventDrivenCreateTab,
  onEventDrivenAddItemsToTab,
  onEventDrivenRenameTab,
  onEventDrivenCloseTab,
  onEventDrivenSplitTab,
  onEventDrivenMergeTabs,
  onEventDrivenMoveItemsBetweenTabs,
  stagingItems = [],
  onAddToStaging,
  onRemoveFromStaging,
  onClearStaging,
  onPersistStaging,
  enrichedItems = [],
  enrichedLoading = false,
  enrichedError = null
}: Props) {
  const { menuItems, categories, filteredMenuItems, selectedMenuCategory } = useRealtimeMenuStore();
  
  const isEventDrivenMode = !!eventDrivenOrder || !!eventDrivenCustomerTabs;
  
  const persistedTableOrders = useTableOrdersStore((state) => state.persistedTableOrders);
  const customerTabs = useTableOrdersStore((state) => state.customerTabs);
  
  const { 
    addItemsToTable, 
    removeItemFromTable, 
    resetTableToAvailable,
    forceRefresh,
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
  
  // ✅ NEW: Search state for menu filtering
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ NEW: Section & Category Navigation State (MYA-1726)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // ✅ NEW: Track previous isOpen state to detect open/close transitions
  const prevIsOpenRef = React.useRef<boolean>(isOpen);
  
  // UI state
  const [selectedTableTab, setSelectedTableTab] = useState<number>(tableNumber || 0);
  // ❌ REMOVED: Internal staging state - now managed by parent (POSDesktop)
  // const [stagingItems, setStagingItems] = useState<OrderItem[]>([]);
  // const [eventDrivenStagingItems, setEventDrivenStagingItems] = useState<OrderItem[]>([]);
  const [showBillView, setShowBillView] = useState(false);
  
  // NEW: Thermal receipt preview modals state
  const [showKitchenPreviewModal, setShowKitchenPreviewModal] = useState(false);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);
  const [isFullReviewOpen, setIsFullReviewOpen] = useState(false);
  
  // NEW: Customer tab UI state
  const [isCreatingNewTab, setIsCreatingNewTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // NEW: Confirmation dialog state for item deletion
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    itemIndex: number;
    itemName: string;
  }>({ isOpen: false, itemIndex: -1, itemName: '' });
  
  // NEW: State for unsaved changes warning
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  
  // UI state for guest count editing
  const [isEditingGuestCount, setIsEditingGuestCount] = useState(false);
  const [editedGuestCount, setEditedGuestCount] = useState<number>(0);
  const [isManagingLinkedTables, setIsManagingLinkedTables] = useState(false); // NEW: For ManageLinkedTablesDialog
  
  // ✅ NEW: State for StaffCustomizationModal (MYA-1700)
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<EnrichedDineInOrderItem | null>(null);
  
  // ✅ STAGING WORKFLOW: Warning system for unsaved staging items
  const hasUnsavedItems = !isEventDrivenMode && stagingItems.length > 0;
  
  // ✅ Compute all linked tables for LinkedTableTabs component
  const allTables = useMemo(() => {
    if (!tableNumber) return [];
    return [tableNumber, ...(linkedTables || [])].sort((a, b) => a - b);
  }, [tableNumber, linkedTables]);
  
  // ✅ NEW: Compute child categories for selected section (MYA-1726)
  const childCategories = useMemo(() => {
    if (!selectedSectionId) return [];
    return categories.filter(cat => cat.parent_category_id === selectedSectionId);
  }, [categories, selectedSectionId]);
  
  // ✅ Handle section selection (MYA-1726)
  const handleSectionSelect = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedCategoryId(null); // Reset category when section changes
    
    // Update menu store to filter by section
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(sectionId);
    menuStore.setSelectedParentCategory(null); // Clear parent filter to show all items when "All Items" clicked
  }, []);

  // ✅ Handle category selection - matches POSDesktop pattern
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(categoryId);
  }, []);
  
  // ✅ Handle category change - for POSMenuSelector (MYA-1727)
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(categoryId);
  }, []);
  
  // ✅ Handle switching between linked tables
  const handleTableTabSwitch = (tableNumber: number) => {
    console.log('🔄 [DineInOrderModal] Switching to table:', tableNumber);
    setSelectedTableTab(tableNumber);
  };

  // ✅ Handle adding menu item to order (staging cart)
  const handleAddToOrder = (orderItem: OrderItem) => {
    console.log('➕ [DineInOrderModal] Adding item to staging:', orderItem.name);
    
    // 🚀 PHASE 2 CLEAN ARCHITECTURE: Call parent callback to add to staging
    if (onAddToStaging) {
      onAddToStaging(orderItem);
      console.log('✅ [DineInOrderModal] Item added to parent staging cart via callback');
    } else {
      console.warn('⚠️ [DineInOrderModal] onAddToStaging callback not provided');
    }
    
    // User feedback
    toast.success(`Added ${orderItem.name} to order`, {
      description: 'Item added to staging cart'
    });
  };
  
  // ✅ Handle customize item from menu - for POSMenuSelector (MYA-1727)
  const handleCustomizeItemFromMenu = useCallback((item: OrderItem) => {
    // For now, just add the item directly (matching POSDesktop pattern)
    handleAddToOrder(item);
  }, [handleAddToOrder]);

  // ✅ NEW: Handle customizing staging item (MYA-1728)
  const handleCustomizeStagingItem = useCallback((index: number, item: OrderItem) => {
    console.log('🔧 [DineInOrderModal] Opening customization modal for staging item:', item.name);
    
    // Convert OrderItem to EnrichedDineInOrderItem format for modal
    const enrichedItem: EnrichedDineInOrderItem = {
      id: item.id,
      menu_item_id: item.menu_item_id,
      variant_id: item.variant_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      line_total: item.price * item.quantity,
      notes: item.notes || '',
      protein_type: item.protein_type || null,
      variant_name: item.variant || null,
      customizations: item.customizations?.map(c => ({
        customization_id: c.id,
        name: c.name,
        price_adjustment: c.price || 0,
        group: c.group || ''
      })) || [],
      image_url: item.image_url || null,
      // Required fields for EnrichedDineInOrderItem
      order_id: eventDrivenOrder?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      customer_tab_id: null,
      kitchen_status: null
    };
    
    setCustomizingItem(enrichedItem);
    setIsCustomizationModalOpen(true);
  }, [eventDrivenOrder]);
  
  // ✅ Handle quantity update for order items
  const handleQuantityUpdate = (index: number, quantity: number) => {
    console.log('🔢 [DineInOrderModal] Updating quantity:', { index, quantity });
    
    if (quantity <= 0) {
      // Remove item if quantity becomes 0 or negative
      handleRemoveItem(index);
      return;
    }
    
    // 🚀 EVENT-DRIVEN MODE: Use command pattern
    if (isEventDrivenMode && onEventDrivenUpdateItemQuantity) {
      const item = stagingItems[index];
      if (!item) {
        toast.error('Item not found');
        return;
      }
      
      console.log('🚀 [EVENT-DRIVEN] Calling onEventDrivenUpdateItemQuantity');
      onEventDrivenUpdateItemQuantity(item.id, quantity)
        .then(() => {
          console.log('✅ [EVENT-DRIVEN] Quantity updated successfully');
        })
        .catch((error) => {
          console.error('❌ Failed to update quantity:', error);
          toast.error('Failed to update quantity');
        });
      return;
    }
    
    // ✅ LEGACY MODE: Update staging items array
    // Check if item is in staging or existing items
    const stagingStartIndex = existingItems.length;
    
    if (index >= stagingStartIndex) {
      // Item is in staging cart - update directly
      const stagingIndex = index - stagingStartIndex;
      setStagingItems(prev => 
        prev.map((item, i) => 
          i === stagingIndex ? { ...item, quantity } : item
        )
      );
      console.log('✅ [LEGACY] Staging item quantity updated');
    } else {
      // Item is in existing items - should update via store
      toast.error('Cannot modify saved items. Use delete and re-add.');
      console.warn('⚠️ [LEGACY] Cannot modify existing items directly');
    }
  };

  // ✅ Utility: Detect if ID is a valid UUID (database item) vs staging item
  const isUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // ✅ Handle item removal with confirmation
  const handleRemoveItem = (index: number) => {
    console.log('🗑️ [DineInOrderModal] Removing item at index:', index);
    
    const item = stagingItems[index];
    if (!item) {
      toast.error('Item not found');
      return;
    }
    
    // Show confirmation dialog
    setConfirmationDialog({
      isOpen: true,
      itemIndex: index,
      itemName: item.name
    });
  };

  // ✅ Handle confirmed deletion from dialog
  const handleConfirmDeletion = async () => {
    const { itemIndex } = confirmationDialog;
    const item = stagingItems[itemIndex];
    
    if (!item) {
      toast.error('Item not found');
      setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
      return;
    }
    
    console.log('✅ [DineInOrderModal] Confirming deletion of item:', item.name);
    
    // 🚀 ROUTING LOGIC: Detect staging vs database item by ID format
    const isDatabaseItem = isUUID(item.id);
    
    if (isDatabaseItem && isEventDrivenMode && onEventDrivenRemoveItem) {
      // ✅ DATABASE ITEM: Use API command to delete from database
      try {
        await onEventDrivenRemoveItem(item.id);
        toast.success(`Removed ${item.name}`);
        console.log('✅ [EVENT-DRIVEN] Database item removed successfully');
      } catch (error) {
        console.error('❌ Failed to remove database item:', error);
        toast.error('Failed to remove item');
      }
    } else if (!isDatabaseItem && onRemoveFromStaging) {
      // ✅ STAGING ITEM: Remove from parent's ephemeral cart (no API call)
      onRemoveFromStaging(item.id);
      toast.success(`Removed ${item.name} from cart`);
      console.log('✅ [STAGING] Ephemeral item removed from cart');
    } else {
      // ❌ Fallback error (should not happen)
      toast.error('Remove handler not available');
      console.error('❌ No appropriate removal handler:', { isDatabaseItem, hasEventHandler: !!onEventDrivenRemoveItem, hasStagingHandler: !!onRemoveFromStaging });
    }
    
    // Close dialog
    setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
  };
  
  // ✅ Handle cancelled deletion from dialog
  const handleCancelDeletion = () => {
    console.log('❌ [DineInOrderModal] Deletion cancelled');
    setConfirmationDialog({ isOpen: false, itemIndex: -1, itemName: '' });
  };
  
  // 🚀 EVENT-DRIVEN vs LEGACY: Conditional data source for order items
  // Get existing table order items from appropriate source
  const existingTableOrder = isEventDrivenMode ? null : persistedTableOrders[selectedTableTab];
  const existingItems = isEventDrivenMode 
    ? (eventDrivenOrder?.items || []) 
    : (existingTableOrder?.items || []);
  
  // 🚀 EVENT-DRIVEN vs LEGACY: Conditional data source for customer tabs
  // Use event-driven customer tabs when available, otherwise fall back to legacy store
  const currentTableCustomerTabs = isEventDrivenMode 
    ? (eventDrivenCustomerTabs || [])
    : getCustomerTabsForTable(selectedTableTab);
  
  const currentActiveCustomerTab = isEventDrivenMode
    ? (eventDrivenCustomerTabs?.find(tab => tab.id === eventDrivenActiveTabId) || null)
    : getActiveCustomerTab(selectedTableTab);
  
  // ❌ REMOVED (PHASE 5 CLEANUP): combinedOrderItems variable no longer needed
  // All usages replaced with direct data sources:
  // - DineInOrderModal displays: stagingItems (ephemeral cart)
  // - DineInFullReviewModal displays: eventDrivenOrder?.items (database items)
  // - Clean separation maintained
  
  // ✅ NEW BEHAVIOR: Open preview modal instead of direct save
  // Modal provides 3 options: Cancel | Save Order | Send to Kitchen
  const handleSave = async () => {
    // ✅ FIX: Check staging items (ephemeral cart)
    if (stagingItems.length === 0) {
      toast.info('No items to preview');
      return;
    }
    
    // ✅ Open Kitchen Preview Modal immediately (no auto-save)
    setShowKitchenPreviewModal(true);
  };
  
  // ✅ STAGING WORKFLOW: Send to Kitchen - commits staging items to database + kitchen status
  const handleSendToKitchenDirect = async () => {
    // 🚀 EVENT-DRIVEN MODE: Use command
    if (isEventDrivenMode && onEventDrivenSendToKitchen) {
      try {
        await onEventDrivenSendToKitchen();
        toast.success('🍳 Sent order to kitchen');
      } catch (error) {
        console.error('❌ Failed to send to kitchen:', error);
        toast.error('Failed to send to kitchen');
      }
      return;
    }
    
    // ✅ LEGACY MODE:
    if (stagingItems.length === 0) {
      toast.info('No new items in staging to send to kitchen');
      return;
    }
    
    // ✅ FIX: Open modal with intact stagingItems - let modal handlers persist
    setShowBillPreviewModal(true);
  };
  
  // NEW: Open kitchen preview modal (called by button)
  const handleSendToKitchen = async () => {
    // ✅ PHASE 1: Persist staging items FIRST (both event-driven and legacy modes)
    const stagingPersisted = await onPersistStaging?.();
    if (!stagingPersisted) {
      console.error('❌ [handleSendToKitchen] Failed to persist staging items');
      return; // Stop if persistence failed
    }
    
    // 🚀 EVENT-DRIVEN MODE: Use command pattern
    if (isEventDrivenMode && onEventDrivenSendToKitchen) {
      console.log('🚀 [EVENT-DRIVEN] Sending to kitchen via command');
      try {
        await onEventDrivenSendToKitchen();
        toast.success('Order sent to kitchen', {
          description: 'Kitchen ticket created'
        });
      } catch (error) {
        console.error('❌ Failed to send to kitchen:', error);
        toast.error('Failed to send to kitchen');
      }
      return;
    }
    
    // ✅ LEGACY STAGING WORKFLOW: Send to kitchen (staging already persisted)
    // ❌ PHASE 5 CLEANUP: Use database items (not obsolete combinedOrderItems)
    const databaseItems = eventDrivenOrder?.items || [];
    if (databaseItems.length === 0) {
      toast.info('No items to send to kitchen');
      return;
    }
    
    // ✅ Send to kitchen
    try {
      const tableOrder = persistedTableOrders[selectedTableTab];
      if (!tableOrder?.orderId) {
        toast.error('No order found to send to kitchen');
        return;
      }
      
      const response = await apiClient.print_dine_in_bill({ order_id: tableOrder.orderId });
      const result = await response.json();
      
      if (result.success) {
        toast.success('🍳 Sent to kitchen', {
          description: 'Kitchen ticket created'
        });
      } else {
        throw new Error(result.error || 'Failed to send to kitchen');
      }
    } catch (error) {
      console.error('❌ Failed to send to kitchen:', error);
      toast.error('Failed to send to kitchen');
    }
  };
  
  // NEW: Handle kitchen print from preview modal
  const handleKitchenPrint = async () => {
    try {
      // 🚀 EVENT-DRIVEN MODE: Use eventDrivenOrder data
      if (isEventDrivenMode && eventDrivenOrder) {
        if (!eventDrivenOrder.items || eventDrivenOrder.items.length === 0) {
          toast.error('No items to send to kitchen');
          return false;
        }

        if (!eventDrivenOrder.id) {
          toast.error('No order found');
          return false;
        }

        console.log('🍳 [EVENT-DRIVEN] Sending to kitchen via enhanced endpoint:', eventDrivenOrder.id);

        // ✅ Call enhanced send-to-kitchen endpoint (marks items + creates print job)
        const response = await apiClient.print_dine_in_bill({ order_id: eventDrivenOrder.id });
        const result = await response.json();

        if (result.success) {
          toast.success('Kitchen ticket printed successfully');
          setShowKitchenPreviewModal(false);
          return true;
        } else {
          throw new Error(result.error || 'Failed to send to kitchen');
        }
      }

      // ✅ LEGACY MODE: Use persisted table order data (same source as preview)
      const tableOrder = persistedTableOrders[selectedTableTab];
      if (!tableOrder || !tableOrder.order_items || tableOrder.order_items.length === 0) {
        toast.error('No items to print');
        return false;
      }

      // ✅ LEGACY MODE: Get orderId from table order
      // In legacy mode, we don't have eventDrivenOrder, so we need to find the order ID
      // from the persisted table order (which should have been created when items were added)
      if (!tableOrder.orderId) {
        toast.error('No order found for this table');
        return false;
      }

      console.log('🍳 [LEGACY] Sending to kitchen via enhanced endpoint:', tableOrder.orderId);

      // ✅ Call enhanced send-to-kitchen endpoint (marks items + creates print job)
      const response = await apiClient.print_dine_in_bill({ order_id: tableOrder.orderId });
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
    // Validation
    if (!eventDrivenOrder?.id || !eventDrivenOrder.items || eventDrivenOrder.items.length === 0) {
      toast.error('No items to bill');
      return;
    }
    
    // Open preview modal for staff review
    setShowBillPreviewModal(true);
  };
  
  // NEW: Handle actual bill print from preview modal
  const handleBillPrint = async (orderTotal: number) => {
    // 🚀 EVENT-DRIVEN MODE: Auto-clear workflow (Option B)
    if (isEventDrivenMode && eventDrivenOrder?.id) {
      console.log('🚀 [EVENT-DRIVEN] Auto-clear workflow: Print Bill → Mark Paid → Close');
      
      try {
        // Step 1: Print bill (NEW: Dedicated DINE-IN endpoint - does NOT change status)
        console.log('📄 [AUTO-CLEAR] Step 1: Printing bill...');
        const billResponse = await apiClient.print_dine_in_bill({ order_id: eventDrivenOrder.id });
        const billResult = await billResponse.json();
        console.log('✅ [AUTO-CLEAR] Print job created:', billResult.print_job_id);
        
        // Step 2: Mark as paid (payment method: EXTERNAL)
        console.log('💳 [AUTO-CLEAR] Step 2: Marking as paid (EXTERNAL)...');
        const paidResponse = await apiClient.mark_paid({
          order_id: eventDrivenOrder.id,
          payment_method: 'EXTERNAL',
          amount: orderTotal
        });

        // Step 3: Success feedback and close
        console.log('✅ [AUTO-CLEAR] Step 3: Order completed, closing modal');
        toast.success('Bill printed & table cleared', {
          description: 'Order completed successfully'
        });
        
        // Close preview modal
        setShowBillPreviewModal(false);
        
        // Close main modal - table will auto-refresh to green (AVAILABLE)
        onClose();
        
      } catch (error) {
        console.error('❌ Auto-clear workflow failed:', error);
        toast.error('Failed to complete order', {
          description: error instanceof Error ? error.message : 'Please try again'
        });
      }
      return;
    }
    
    // 🔄 LEGACY MODE: Original receipt generation logic
    try {
      // Generate order number for tracking
      const orderNumber = `TABLE-${tableNumber}-${Date.now()}`;
      
      // 🚀 EVENT-DRIVEN MODE: Use eventDrivenOrder (Supabase source of truth)
      if (isEventDrivenMode && eventDrivenOrder) {
        const items = eventDrivenOrder.items.map(item => {
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
          orderNumber: eventDrivenOrder.order_number,
          orderType: 'DINE-IN',
          items,
          tax,
          deliveryFee: 0,
          template_data: {
            tableNumber,
            guestCount: eventDrivenOrder.guest_count,
            subtotal,
            total,
            paymentMethod: 'Pending'
          },
          orderSource: 'POS'
        };

        console.log('🖨️ [EVENT-DRIVEN] Sending bill receipt to printer:', receiptData);

        // Call print API with Electron headers
        const response = await apiClient.print_customer_receipt(receiptData, getElectronHeaders());
        const result = await response.json();

        if (result.success) {
          toast.success('Bill printed successfully');
          return true;
        } else {
          throw new Error(result.error || 'Print failed');
        }
      }
      
      // ✅ LEGACY MODE: Use persistedTableOrders (Zustand)
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
          paymentMethod: 'Pending'
        },
        orderSource: 'POS'
      };

      console.log('🖨️ [LEGACY] Sending bill receipt to printer:', receiptData);

      // Call print API with Electron headers
      const response = await apiClient.print_customer_receipt(receiptData, getElectronHeaders());
      const result = await response.json();

      if (result.success) {
        toast.success('Bill printed successfully');
        return true;
      } else {
        throw new Error(result.error || 'Print failed');
      }
    } catch (error) {
      console.error('❌ Bill print failed:', error);
      toast.error('Failed to print bill');
      return false;
    }
  };
  
  // 🚀 NEW: Complete payment for DINE-IN order
  const handleCompletePayment = async (paymentMethod: string = 'CASH') => {
    if (!isEventDrivenMode || !eventDrivenOrder) {
      console.error('❌ Payment completion only available in event-driven mode');
      toast.error('Payment not available for this order type');
      return false;
    }

    try {
      console.log('💳 [COMPLETE PAYMENT] Starting payment flow...');
      console.log('💳 Order ID:', eventDrivenOrder.id);
      console.log('💳 Amount:', eventDrivenOrder.total_amount);
      console.log('💳 Payment Method:', paymentMethod);

      // Call mark_paid command
      const response = await apiClient.mark_paid({
        order_id: eventDrivenOrder.id,
        payment_method: paymentMethod,
        amount: eventDrivenOrder.total_amount
      });
      
      const result = await response.json();
      console.log('✅ [COMPLETE PAYMENT] Payment recorded:', result);
      
      toast.success('Payment completed successfully', {
        description: 'Table has been cleared'
      });
      
      // Close bill preview modal
      setShowBillPreviewModal(false);
      
      // Close main modal (table cleared)
      onClose();
      
      return true;
    } catch (error) {
      console.error('❌ [COMPLETE PAYMENT] Failed:', error);
      toast.error('Failed to complete payment');
      return false;
    }
  };

  // NEW: Handle View Bill with customer breakdown
  const handleViewBill = () => {
    const databaseItems = eventDrivenOrder?.items || [];
    if (databaseItems.length === 0) {
      toast.error('No items to bill');
      return;
    }
    
    setShowBillView(true);
  };
  
  // ✅ Handler to clear staging cart (no password required)
  const handleCancelOrder = () => {
    console.log('🗑️ [DineInOrderModal] Clearing staging cart', {
      stagingItemCount: stagingItems.length
    });
    
    // 🚀 PHASE 2 CLEAN ARCHITECTURE: Call parent callback to clear staging
    if (onClearStaging) {
      onClearStaging();
      console.log('✅ [DineInOrderModal] Staging cart cleared via parent callback');
    } else {
      console.warn('⚠️ [DineInOrderModal] onClearStaging callback not provided');
    }
  };

  // ✅ Handler to reset table (force clear occupied status)
  const handleResetTable = async () => {
    if (!selectedTableTab) return;
    
    // Check if there are saved items - if so, this is a destructive action that requires confirmation
    const hasSavedItems = existingItems.length > 0 || (eventDrivenOrder?.items?.length || 0) > 0;
    
    if (hasSavedItems) {
      if (!window.confirm(`Table ${selectedTableTab} has active orders. Are you sure you want to reset it? This will clear all orders.`)) {
        return;
      }
    } else {
      // Empty table but occupied status - likely ghost order
      if (!window.confirm(`Reset Table ${selectedTableTab} to available status?`)) {
        return;
      }
    }

    try {
      console.log(`🔄 [DineInOrderModal] Resetting table ${selectedTableTab} to available`);
      await resetTableToAvailable(selectedTableTab);
      toast.success(`Table ${selectedTableTab} reset to available`);
      onClose();
    } catch (error) {
      console.error('❌ Failed to reset table:', error);
      toast.error('Failed to reset table');
    }
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
      
      // Close bill preview modal
      setShowBillPreviewModal(false);
      
      toast.success(`Table ${selectedTableTab} bill completed and table reset to available`);
      // Add actual printer integration here
    } catch (error) {
      console.error('Error completing final bill:', error);
      toast.error('Failed to complete bill');
    }
  };
  
  // ✅ NEW: Handle "Save Order" button in preview modal (save without printing)
  const onSaveOnly = async () => {
    try {
      // ✅ FIX: Persist staging items to database using parent callback
      const success = await onPersistStaging?.();
      
      if (success) {
        toast.success('Order saved successfully');
        setShowKitchenPreviewModal(false);
      } else {
        toast.error('Failed to save order');
      }
    } catch (error) {
      console.error('❌ Failed to save order:', error);
      toast.error('Failed to save order');
    }
  };
  
  // ✅ NEW: Handle "Send to Kitchen" button in preview modal (save + print)
  const onSaveAndPrint = async () => {
    try {
      // ✅ STEP 1: Persist staging items FIRST using parent callback
      const stagingPersisted = await onPersistStaging?.();
      
      if (!stagingPersisted) {
        console.error('❌ Failed to persist staging items before sending to kitchen');
        return; // Stop if persistence failed
      }
      
      // 🚀 STEP 2: EVENT-DRIVEN MODE - Use parent command with fresh data
      if (isEventDrivenMode && onEventDrivenSendToKitchen) {
        console.log('🍳 [EVENT-DRIVEN] Calling onEventDrivenSendToKitchen command');
        await onEventDrivenSendToKitchen();
        
        // Close modal and show success
        setShowKitchenPreviewModal(false);
        toast.success('Order sent to kitchen', {
          description: 'Kitchen ticket created'
        });
        return;
      }
      
      // ✅ STEP 2: LEGACY MODE - Use handleKitchenPrint
      const success = await handleKitchenPrint();
      
      if (success) {
        // Modal is auto-closed by handleKitchenPrint on success
        toast.success('Order sent to kitchen', {
          description: 'Kitchen ticket created'
        });
      }
    } catch (error) {
      console.error('❌ Failed to send to kitchen:', error);
      toast.error('Failed to send to kitchen');
    }
  };
  
  // ✅ Handle saving linked tables configuration
  const handleSaveLinkedTables = async (newLinkedTables: number[]): Promise<boolean> => {
    if (!tableId) {
      toast.error('No table selected');
      return false;
    }

    try {
      console.log('🔗 [handleSaveLinkedTables] Updating linked tables:', {
        currentTable: tableNumber,
        newLinkedTables
      });

      // Check if we need to link or unlink tables
      const currentLinked = linkedTables || [];
      const tablesToAdd = newLinkedTables.filter(t => !currentLinked.includes(t));
      const tablesToRemove = currentLinked.filter(t => !newLinkedTables.includes(t));

      console.log('🔗 [handleSaveLinkedTables] Changes:', {
        tablesToAdd,
        tablesToRemove
      });

      // If we have an event-driven order, use the link/unlink commands
      if (isEventDrivenMode && eventDrivenOrder?.id) {
        // Add new linked tables
        if (tablesToAdd.length > 0) {
          const linkResponse = await apiClient.link_tables({
            order_id: eventDrivenOrder.id,
            tables_to_link: tablesToAdd
          });
          const linkResult = await linkResponse.json();
          
          if (!linkResult.id) {
            toast.error('Failed to link tables');
            return false;
          }
          console.log('✅ [handleSaveLinkedTables] Tables linked successfully');
        }

        // Remove unlinked tables
        if (tablesToRemove.length > 0) {
          for (const tableNum of tablesToRemove) {
            const unlinkResponse = await apiClient.unlink_table({
              order_id: eventDrivenOrder.id,
              table_number: tableNum
            });
            const unlinkResult = await unlinkResponse.json();
            
            if (!unlinkResult.id) {
              toast.error(`Failed to unlink table ${tableNum}`);
              return false;
            }
          }
          console.log('✅ [handleSaveLinkedTables] Tables unlinked successfully');
        }

        toast.success('Linked tables updated successfully');
        return true;
      }

      // Legacy mode - no API support yet
      toast.info('Linked tables management only available in event-driven mode');
      return false;

    } catch (error) {
      console.error('❌ [handleSaveLinkedTables] Failed to update linked tables:', error);
      toast.error('Failed to update linked tables');
      return false;
    }
  };

  // 🔧 EVENT-DRIVEN: Use imported adapter utilities instead of inline wrappers
  const wrappedEventDrivenCreateTab = wrapCreateTabHandler(onEventDrivenCreateTab);
  const wrappedEventDrivenRenameTab = wrapRenameTabHandler(onEventDrivenRenameTab);
  const wrappedEventDrivenCloseTab = wrapCloseTabHandler(onEventDrivenCloseTab);

  // ✅ NEW: Handle opening full review modal
  const handleReviewOrder = () => {
    setIsFullReviewOpen(true);
  };

  // ✅ Handle modal close with unsaved items warning
  const handleModalClose = () => {
    if (hasUnsavedItems) {
      if (window.confirm('You have unsaved items in the cart. Close anyway?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // ✅ NEW: Handle creating customer tab from Full Review Modal
  const handleCreateCustomerTabFromModal = async (tabName: string) => {
    if (isEventDrivenMode && onEventDrivenCreateTab) {
      const tabId = await onEventDrivenCreateTab(tabName);
      if (tabId) {
        toast.success(`Customer tab "${tabName}" created`);
      } else {
        toast.error('Failed to create customer tab');
      }
      return;
    }
    
    // Legacy mode
    await handleCreateCustomerTab(tabName);
  };

  // ✅ NEW: Handle updating customer tab name from Full Review Modal
  const handleUpdateCustomerTabNameFromModal = async (tabId: string, newName: string) => {
    if (isEventDrivenMode && onEventDrivenRenameTab) {
      const success = await onEventDrivenRenameTab(tabId, newName);
      if (success) {
        toast.success(`Customer tab renamed to "${newName}"`);
      } else {
        toast.error('Failed to rename customer tab');
      }
      return;
    }
    
    // Legacy mode
    await handleRenameCustomerTab(tabId, newName);
  };

  // ✅ NEW: Handle deleting customer tab from Full Review Modal
  const handleDeleteCustomerTab = async (tabId: string) => {
    // Find the customer tab
    const customerTab = currentTableCustomerTabs.find(tab => tab.id === tabId);
    
    if (!customerTab) {
      toast.error('Customer tab not found');
      return;
    }
    
    // Check if tab has items
    const hasItems = (customerTab.order_items?.length || 0) > 0;
    
    if (hasItems) {
      toast.error('Cannot delete customer tab with items', {
        description: 'Remove or reassign all items first'
      });
      return;
    }
    
    // Delete the tab (use close handler which marks as closed)
    if (isEventDrivenMode && onEventDrivenCloseTab) {
      const success = await onEventDrivenCloseTab(tabId);
      if (success) {
        toast.success('Customer tab deleted');
      } else {
        toast.error('Failed to delete customer tab');
      }
      return;
    }
    
    // Legacy mode
    const success = await closeCustomerTab(tabId);
    if (success) {
      toast.success('Customer tab deleted');
    } else {
      toast.error('Failed to delete customer tab');
    }
  };

  // ✅ NEW: Handle assigning item to customer tab
  const handleAssignItemToTab = async (itemId: string, customerTabId: string | null) => {
    console.log('🔄 [handleAssignItemToTab]', { itemId, customerTabId });
    
    if (!isEventDrivenMode) {
      toast.error('Item assignment only available in event-driven mode');
      return;
    }
    
    // For now, show a toast indicating this feature needs backend support
    // The actual implementation will require a new backend command to update item.customer_tab_id
    toast.info('Item assignment feature coming soon', {
      description: 'Backend API update required'
    });
    
    // TODO: Implement when backend supports update-item-customer-tab command
    // Example:
    // const response = await apiClient.update_item_customer_tab({
    //   order_id: eventDrivenOrder.id,
    //   item_id: itemId,
    //   customer_tab_id: customerTabId
    // });
  };

  // ✅ NEW: Handle printing individual bill for a customer tab
  const handlePrintIndividualBill = async (customerTabId: string) => {
    console.log('🧾 [handlePrintIndividualBill]', { customerTabId });
    
    // Find the customer tab
    const customerTab = currentTableCustomerTabs.find(tab => tab.id === customerTabId);
    
    if (!customerTab) {
      toast.error('Customer tab not found');
      return;
    }
    
    const tabItems = customerTab.order_items || [];
    
    if (tabItems.length === 0) {
      toast.info(`No items for ${customerTab.tab_name}`);
      return;
    }
    
    // Calculate subtotal for this customer tab
    const subtotal = tabItems.reduce((sum, item) => {
      const itemTotal = item.total_price || item.line_total || (item.unit_price * item.quantity) || 0;
      return sum + itemTotal;
    }, 0);
    
    // TODO: Open bill preview modal with filtered items for this customer tab
    toast.success(`Bill for ${customerTab.tab_name}: £${subtotal.toFixed(2)}`, {
      description: `${tabItems.length} item${tabItems.length !== 1 ? 's' : ''}`
    });
    
    console.log('📄 [handlePrintIndividualBill] Bill details:', {
      customerTabName: customerTab.tab_name,
      itemCount: tabItems.length,
      subtotal: subtotal.toFixed(2)
    });
  };

  // ==================== COMBINED BILL HANDLER ====================
  
  const handlePrintBill = async () => {
    console.log('🧾 [handlePrintBill] Printing combined bill for entire table');
    
    const databaseItems = eventDrivenOrder?.items || [];
    if (databaseItems.length === 0) {
      toast.info('No items to print');
      return;
    }
    
    // Calculate grand total for all items
    const grandTotal = databaseItems.reduce((sum, item) => {
      const itemTotal = item.total_price || item.line_total || (item.unit_price * item.quantity) || 0;
      return sum + itemTotal;
    }, 0);
    
    // TODO: Open bill preview modal with ALL items (combined bill)
    toast.success(`Combined Bill for Table ${selectedTableTab}: £${grandTotal.toFixed(2)}`, {
      description: `${databaseItems.length} item${databaseItems.length !== 1 ? 's' : ''}`
    });
    
    console.log('📄 [handlePrintBill] Combined bill details:', {
      tableNumber: selectedTableTab,
      itemCount: databaseItems.length,
      grandTotal: grandTotal.toFixed(2),
      customerTabCount: currentTableCustomerTabs.length
    });
  };

  // ✅ NEW: Handle customizing item from Full Review Modal (MYA-1700)
  const handleCustomizeItemFromModal = (item: EnrichedDineInOrderItem) => {
    console.log('🔧 [DineInOrderModal] Opening customization modal for item:', item.name);
    setCustomizingItem(item);
    setIsCustomizationModalOpen(true);
  };

  // ✅ NEW: Handle saving customization changes from StaffCustomizationModal (MYA-1700)
  const handleCustomizationConfirm = async (
    menuItem: MenuItem,
    quantity: number,
    variant?: ItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    if (!customizingItem) return;

    console.log('💾 [DineInOrderModal] Saving customization changes:', {
      itemId: customizingItem.id,
      quantity,
      customizations,
      notes,
      isEventDriven: isEventDrivenMode
    });

    try {
      // Check if this is a database item (has order_id) or staging item
      const isDatabaseItem = customizingItem.order_id && customizingItem.order_id !== '';

      if (isDatabaseItem) {
        // Database item - use API to update
        const response = await apiClient.update_item({
          itemId: customizingItem.id
        }, {
          quantity,
          customizations: customizations?.map(c => ({
            customization_id: c.id,
            name: c.name,
            price_adjustment: c.price || 0,
            group: c.group || ''
          })) || [],
          notes: notes || ''
        });

        if (response.ok) {
          toast.success(`Updated ${menuItem.name}`, {
            description: 'Customizations saved successfully'
          });

          // Invalidate query to refresh enriched items
          if (eventDrivenOrder?.id) {
            queryClient.invalidateQueries({ queryKey: ['dine-in-order', eventDrivenOrder.id] });
          }

          // Close modal
          setIsCustomizationModalOpen(false);
          setCustomizingItem(null);
        } else {
          toast.error('Failed to save customizations');
        }
      } else {
        // Staging item - update via parent callback
        // Find the item in stagingItems and recreate it with new customizations
        const itemIndex = stagingItems.findIndex(item => item.id === customizingItem.id);
        if (itemIndex === -1) {
          toast.error('Item not found in staging');
          return;
        }

        const originalItem = stagingItems[itemIndex];
        const updatedItem: OrderItem = {
          ...originalItem,
          quantity,
          customizations: customizations?.map(c => ({
            id: c.id,
            name: c.name,
            price_adjustment: c.price || 0,
            group: c.group || ''
          })) || [],
          notes: notes || ''
        };

        // Remove old item and add updated one via parent callbacks
        if (onRemoveFromStaging && onAddToStaging) {
          onRemoveFromStaging(originalItem.id);
          onAddToStaging(updatedItem);
          
          toast.success(`Updated ${menuItem.name}`, {
            description: 'Customizations updated'
          });

          // Close modal
          setIsCustomizationModalOpen(false);
          setCustomizingItem(null);
        } else {
          toast.error('Unable to update staging item');
        }
      }
    } catch (error) {
      console.error('❌ Failed to save customizations:', error);
      toast.error('Failed to save customizations');
    }
  };

  // ✅ NEW: Wrapper to update item quantity by itemId (for Full Review Modal)
  const handleUpdateItemQuantityDirect = async (itemId: string, newQty: number) => {
    console.log('🔢 [handleUpdateItemQuantityDirect] Updating quantity:', { itemId, newQty, orderId: eventDrivenOrder.id });

    try {
      const response = await apiClient.update_item_quantity_dine_in({
        order_id: eventDrivenOrder.id,
        item_id: itemId,
        new_quantity: newQty
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || 'Failed to update quantity');
      }
      
      const result = await response.json();
      console.log('✅ [handleUpdateItemQuantityDirect] Quantity updated successfully:', result);
      toast.success('Quantity updated');
      
      // ✅ Real-time subscription will automatically refresh enrichedItems
      // which will trigger receipt update via useMemo in DineInFullReviewModal
    } catch (error: any) {
      console.error('❌ [handleUpdateItemQuantityDirect] Failed to update quantity:', error);
      toast.error('Failed to update quantity');
    }
  };
  
  // ✅ NEW: Wrapper to delete item by itemId (for Full Review Modal)
  const handleDeleteItemDirect = async (itemId: string) => {
    if (!eventDrivenOrder?.id) {
      toast.error('Order not found');
      return;
    }

    console.log('🗑️ [handleDeleteItemDirect] Deleting item:', { itemId, orderId: eventDrivenOrder.id });

    try {
      const response = await apiClient.remove_item_from_order({
        order_id: eventDrivenOrder.id,
        item_id: itemId
      });
      
      const result = await response.json();
      console.log('✅ [handleDeleteItemDirect] Item deleted successfully:', result);
      toast.success('Item deleted');
      
      // ✅ Real-time subscription will automatically refresh enrichedItems
      // which will trigger receipt update via useMemo in DineInFullReviewModal
    } catch (error: any) {
      console.error('❌ [handleDeleteItemDirect] Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="!w-[94vw] !h-[92vh] !max-w-[94vw] !max-h-[92vh] border-0 flex flex-col p-[18px] rounded-[20px] [&>button]:hidden"
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
          
          {/* Modal Header - 76px */}
          <div 
            className="flex items-center justify-between" 
            style={{
              height: '76px',
              marginBottom: '18px'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">
                    {linkedTables && linkedTables.length > 0 
                      ? `Table ${tableNumber} + Table ${linkedTables.join(' + Table ')}`
                      : `Table ${tableNumber}`
                    }
                  </span>
                  
                  {linkedTables && linkedTables.length > 0 && (
                    <Badge 
                      variant="outline" 
                      className={isPrimaryTable 
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300 text-xs"
                        : "bg-blue-500/20 border-blue-500/40 text-blue-300 text-xs"
                      }
                    >
                      {isPrimaryTable ? 'PRIMARY' : `LINKED TO TABLE ${linkedTables[0]}`}
                    </Badge>
                  )}
                  
                  {hasUnsavedItems && (
                    <Badge variant="secondary" className="bg-yellow-600 text-white">
                      {stagingItems.length} unsaved
                    </Badge>
                  )}
                </div>
                
                <span className="text-sm" style={{ color: QSAITheme.text.muted }}>
                  Dine-in • Staging order
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleReviewOrder}
                className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
                style={{
                  height: '44px',
                  background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                  border: `1px solid ${QSAITheme.purple.light}`
                }}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Review Order
              </Button>
              
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
          </div>
          
          {/* Two-Panel Layout: Left (Menu) | Right (Order Summary) */}
          <div className="flex flex-row gap-[18px] flex-1 min-h-0 overflow-hidden w-full">
            {/* LEFT PANEL: Menu Browser */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">
              {/* A) Scope Row - FIXED (44px, never scrolls) */}
              <div 
                className="flex items-center justify-between px-3" 
                style={{
                  height: '44px',
                  backgroundColor: QSAITheme.background.panel,
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}
              >
                {/* Left: Customer Tab Pills */}
                <div className="flex items-center gap-2">
                  {/* Table-level pill (always visible) */}
                  <Button
                    variant={!eventDrivenActiveTabId ? "default" : "outline"}
                    size="sm"
                    onClick={() => onEventDrivenSetActiveTabId?.(null)}
                    className="flex items-center gap-1 px-3"
                    style={{
                      height: '32px',
                      backgroundColor: !eventDrivenActiveTabId ? QSAITheme.purple.primary : 'transparent',
                      borderColor: !eventDrivenActiveTabId ? QSAITheme.purple.primary : QSAITheme.border.medium,
                      color: !eventDrivenActiveTabId ? 'white' : QSAITheme.text.muted,
                      borderRadius: '16px'
                    }}
                  >
                    <Users size={14} />
                    Table
                  </Button>
                  
                  {/* Customer Tab Pills */}
                  {(eventDrivenCustomerTabs || []).map((tab) => {
                    const isActive = eventDrivenActiveTabId === tab.id;
                    return (
                      <Button
                        key={tab.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => onEventDrivenSetActiveTabId?.(tab.id!)}
                        className="flex items-center gap-1 px-3"
                        style={{
                          height: '32px',
                          backgroundColor: isActive ? QSAITheme.purple.primary : 'transparent',
                          borderColor: isActive ? QSAITheme.purple.primary : QSAITheme.border.medium,
                          color: isActive ? 'white' : QSAITheme.text.muted,
                          borderRadius: '16px'
                        }}
                      >
                        <User size={14} />
                        {tab.tab_name}
                      </Button>
                    );
                  })}
                  
                  {/* Status Text */}
                  {(!eventDrivenCustomerTabs || eventDrivenCustomerTabs.length === 0) && (
                    <span className="text-sm" style={{ color: QSAITheme.text.muted }}>
                      Customer tabs: None yet
                    </span>
                  )}
                </div>
                
                {/* Right: New Customer Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1 px-3"
                  style={{
                    height: '32px',
                    backgroundColor: QSAITheme.purple.primary,
                    borderColor: QSAITheme.purple.primary,
                    color: 'white',
                    borderRadius: '16px'
                  }}
                >
                  <Plus size={14} />
                  New Customer
                </Button>
              </div>
              
              {/* B) Category Row - STICKY (44px) */}
              <div 
                className="flex-shrink-0 space-y-2 p-3" 
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Section Pills */}
                <POSSectionPills
                  selectedSectionId={selectedSectionId}
                  onSectionSelect={handleSectionSelect}
                />
                
                {/* Category Pills - Only show when section is selected */}
                {selectedSectionId && (
                  <POSCategoryPills
                    categories={childCategories}
                    selectedCategoryId={selectedCategoryId}
                    onCategorySelect={handleCategorySelect}
                  />
                )}
              </div>
              
              {/* C) Menu Grid - SCROLLABLE */}
              <POSMenuSelector
                onAddToOrder={handleAddToOrder}
                onCustomizeItem={handleCustomizeItemFromMenu}
                onCategoryChange={handleCategoryChange}
                className="h-full"
                showSkeletons={false}
                orderType="DINE-IN"
                selectedSectionId={selectedSectionId}
                onSectionSelect={handleSectionSelect}
                childCategories={childCategories}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={handleCategorySelect}
                variantCarouselEnabled={true}
              />
            </div>
            
            {/* RIGHT PANEL: Order Summary */}
            <div 
              className="flex flex-col flex-shrink-0" 
              style={{
                width: '460px',
                minWidth: '460px',
                maxWidth: '460px',
                borderRadius: '8px',
                border: `1px solid ${QSAITheme.border.light}`,
                backgroundColor: QSAITheme.background.secondary,
                overflow: 'hidden'
              }}
            >
              {/* Zone A: Header - FIXED (46px) */}
              <div 
                className="flex items-center justify-between px-4" 
                style={{
                  height: '46px',
                  borderBottom: `1px solid ${QSAITheme.border.medium}`
                }}
              >
                <span className="font-semibold" style={{ fontSize: '16px', color: QSAITheme.text.primary }}>
                  Order Summary
                </span>
                <Badge 
                  style={{
                    height: '26px',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    backgroundColor: QSAITheme.purple.primary,
                    color: 'white',
                    borderRadius: '13px'
                  }}
                >
                  {stagingItems.length} items
                </Badge>
              </div>
              
              {/* Status Text - FIXED (34px) */}
              <div 
                className="px-4 py-2" 
                style={{
                  height: '34px',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  borderBottom: `1px solid ${QSAITheme.border.medium}`
                }}
              >
                <span className="text-xs" style={{ color: '#F59E0B', fontWeight: '500' }}>
                  Staging (not saved yet)
                </span>
              </div>
              
              {/* Zone B: Scrollable Items - DYNAMIC (fills space) */}
              <ScrollArea 
                className="px-4"
                style={{
                  height: '100%', // Fill remaining space
                  overflowY: 'auto'
                }}
              >
                {stagingItems.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                      No items added yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {stagingItems.map((item, index) => (
                      <OrderItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        onQuantityChange={handleQuantityUpdate}
                        onRemove={handleRemoveItem}
                        onCustomize={handleCustomizeStagingItem}
                        showCustomizeButton={true}
                        showRemoveButton={true}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {/* Zone C: Footer - PINNED (170px) */}
              <div 
                className="px-4 py-4" 
                style={{
                  height: '170px',
                  borderTop: `1px solid ${QSAITheme.border.medium}`,
                  backgroundColor: QSAITheme.background.panel
                }}
              >
                {/* Totals */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: QSAITheme.text.muted }}>Subtotal</span>
                    <span className="text-xs" style={{ color: QSAITheme.text.muted }}>
                      £{stagingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold" style={{ fontSize: '16px', color: QSAITheme.text.primary }}>Total</span>
                    <span className="font-bold" style={{ fontSize: '16px', color: QSAITheme.text.primary }}>
                      £{stagingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Primary CTA */}
                <Button
                  onClick={handleSave}
                  disabled={stagingItems.length === 0}
                  className="w-full mb-2"
                  style={{
                    height: '44px',
                    borderRadius: '10px',
                    background: stagingItems.length === 0 
                      ? QSAITheme.background.tertiary
                      : `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                    color: stagingItems.length === 0 ? QSAITheme.text.muted : 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    opacity: stagingItems.length === 0 ? 0.5 : 1,
                    cursor: stagingItems.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Preview & Save
                </Button>
                
                {/* Clear Order Link */}
                <button
                  onClick={handleCancelOrder}
                  className="text-left"
                  style={{
                    color: QSAITheme.status.error,
                    fontSize: '13px',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Clear Order
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modals and Dialogs */}
      <BillViewModal
        isOpen={showBillView}
        onClose={() => setShowBillView(false)}
        tableNumber={selectedTableTab}
        orderItems={eventDrivenOrder?.items || []}
        customerTabs={currentTableCustomerTabs}
        onProcessPayment={handleProcessPayment}
      />
      
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
      
      {/* ✅ Kitchen Preview Modal - For "Preview Order" button */}
      {/* 🚀 PHASE 2: orderItems receives ONLY staging from parent (ephemeral cart) */}
      <DineInKitchenPreviewModal
        isOpen={showKitchenPreviewModal}
        onClose={() => setShowKitchenPreviewModal(false)}
        orderItems={stagingItems}
        tableNumber={selectedTableTab}
        guestCount={currentTableCustomerTabs.length || 1}
        linkedTables={linkedTables}
        onSaveOnly={onSaveOnly}
        onSaveAndPrint={onSaveAndPrint}
      />
      
      {/* Bill Preview Modal - For "Review Order" button (final billing) */}
      <DineInBillPreviewModal
        isOpen={showBillPreviewModal}
        onClose={() => setShowBillPreviewModal(false)}
        orderItems={eventDrivenOrder?.items || []}
        tableNumber={selectedTableTab}
        guestCount={currentTableCustomerTabs.length || 1}
        onPrintBill={handleBillPrint}
        onCompletePayment={handleCompletePayment}
      />
      
      {/* ManageLinkedTablesDialog - Opens when clicking "Manage" button */}
      {tableNumber && (
        <ManageLinkedTablesDialog
          isOpen={isManagingLinkedTables}
          onClose={() => setIsManagingLinkedTables(false)}
          currentTableNumber={tableNumber}
          linkedTables={linkedTables || []}
          availableTables={restaurantTables
            .filter(t => t.status === 'AVAILABLE' || linkedTables.includes(parseInt(t.table_number)))
            .map(t => parseInt(t.table_number))}
          onSave={handleSaveLinkedTables}
        />
      )}
      
      {/* DineInFullReviewModal */}
      {/* 
        CLEAN ARCHITECTURE FIX (MYA-1615 Phase 4):
        
        DineInFullReviewModal is the "management interface" - shows ONLY database items.
        
        BEFORE (BUG):
        orderItems={combinedOrderItems} ← staging items (ephemeral cart)
        
        AFTER (FIXED):
        orderItems={eventDrivenOrder?.items || []} ← database items (persistent saved items)
        
        WHY THIS MATTERS:
        - Management modal needs complete picture of ALL saved items
        - Should show items from previous "Save Order" batches
        - Should NOT show unsaved staging cart items
        - Clean separation: Adding (staging) vs Management (database)
        
        DATA SOURCE:
        eventDrivenOrder comes from useDineInOrder hook in POSDesktop,
        which provides real-time updates from Supabase order_items table.
      */}
      <DineInFullReviewModal
        open={isFullReviewOpen}
        onClose={() => setIsFullReviewOpen(false)}
        tableNumber={tableNumber || selectedTableTab}
        orderItems={eventDrivenOrder?.items || []}
        enrichedItems={enrichedItems}
        enrichedLoading={enrichedLoading}
        enrichedError={enrichedError}
        customerTabs={currentTableCustomerTabs}
        activeTab={currentActiveCustomerTab}
        order={eventDrivenOrder} // NEW: Pass full order object for notes
        linkedTables={linkedTables}
        tableCapacity={tableCapacity}
        isPrimaryTable={isPrimaryTable}
        totalLinkedCapacity={totalLinkedCapacity}
        onUpdateQuantity={handleUpdateItemQuantityDirect}
        onDeleteItem={handleDeleteItemDirect}
        onCustomizeItem={handleCustomizeItemFromModal}
        onCreateCustomerTab={handleCreateCustomerTabFromModal}
        onUpdateCustomerTabName={handleUpdateCustomerTabNameFromModal}
        onDeleteCustomerTab={handleDeleteCustomerTab}
        onAssignItemToTab={handleAssignItemToTab}
        onPrintBill={handlePrintBill}
        onPrintIndividualBill={handlePrintIndividualBill}
      />
      
      {/* ✅ MYA-1700: StaffCustomizationModal for editing item customizations from Review Modal */}
      {isCustomizationModalOpen && customizingItem && (() => {
        const { menuItems: allMenuItems, itemVariants } = useRealtimeMenuStore.getState();
        const fullMenuItem = allMenuItems.find(mi => mi.id === customizingItem.menu_item_id);
        const selectedVariant = customizingItem.variant_id 
          ? itemVariants.find(v => v.id === customizingItem.variant_id)
          : null;
        
        if (!fullMenuItem) {
          console.error('❌ Menu item not found for customization modal:', customizingItem.menu_item_id);
          return null;
        }
        
        return (
          <StaffCustomizationModal
            item={fullMenuItem}
            variant={selectedVariant}
            isOpen={isCustomizationModalOpen}
            onClose={() => {
              setIsCustomizationModalOpen(false);
              setCustomizingItem(null);
            }}
            onConfirm={handleCustomizationConfirm}
            orderType="DINE-IN"
            initialQuantity={customizingItem.quantity}
            existingCustomizations={customizingItem.customizations || []}
            existingNotes={customizingItem.notes || ''}
          />
        );
      })()}
    </>
  );
}

export default DineInOrderModal;
