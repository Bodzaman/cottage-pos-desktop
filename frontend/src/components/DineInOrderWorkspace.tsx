/**
 * DineInOrderWorkspace - Unified Dine-In Order Management Modal
 *
 * THIN orchestrator that manages view state and navigation guards.
 * Views use existing hooks/stores directly instead of prop drilling.
 *
 * Three views via segmented control:
 * - Add Items: Staging cart (ephemeral)
 * - Review: Persisted items (database)
 * - Bill: Print preview (read-only)
 *
 * Session context (header) remains mounted across all view transitions.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

// Components
import { DineInWorkspaceHeader } from './DineInWorkspaceHeader';
import { WorkspaceSegmentedControl, type WorkspaceView } from './WorkspaceSegmentedControl';
import { DineInAddItemsView } from './views/DineInAddItemsView';
import { DineInReviewView } from './views/DineInReviewView';
import { DineInBillView } from './views/DineInBillView';
import ConfirmationDialog from './ConfirmationDialog';
import { POSGuestCountModal } from './POSGuestCountModal';
import { CustomerNotesDialog } from './CustomerNotesDialog';
import { AddCustomerTabDialog } from './AddCustomerTabDialog';
import { StaffCustomizationModal, type SelectedCustomization } from './StaffCustomizationModal';

// Utils & Types
import { QSAITheme } from 'utils/QSAIDesign';
import type { OrderItem, MenuItem as MenuTypesMenuItem, ItemVariant as MenuTypesItemVariant } from 'utils/types';
import { assignItemToTab, updateOrderItemCustomizations } from 'utils/supabaseQueries';
import { useRealtimeMenuStoreCompat } from 'utils/realtimeMenuStoreCompat';
import { supabase } from 'utils/supabaseClient';

/**
 * EnrichedDineInOrderItem - Local interface matching backend response
 * Matches brain/data-contracts.EnrichedDineInOrderItem
 */
interface EnrichedDineInOrderItem {
  id: string;
  order_id: string;
  customer_tab_id: string | null;
  table_number: number;
  menu_item_id: string;
  variant_id: string | null;
  category_id: string | null;
  item_name: string;
  variant_name: string | null;
  protein_type: string | null;
  protein_type_name?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  customizations: any;
  notes: string | null;
  status: string;
  sent_to_kitchen_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched fields
  image_url?: string | null;
  category_name?: string | null;
  item_description?: string | null;
  menu_item_description?: string | null;
  kitchen_display_name?: string | null;
  display_order?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  spice_level?: number;
}

/**
 * CustomerTab - Local interface matching Supabase schema (snake_case)
 * Different from types/tables.ts CustomerTab which uses camelCase
 */
interface CustomerTab {
  id: string;
  table_id?: number;
  tab_name: string;
  status: 'active' | 'paid' | 'closed';
  items?: OrderItem[];
  subtotal?: number;
  total?: number;
  payment_status?: string;
  payment_method?: string;
  paid_amount?: number;
  created_at?: string;
  updated_at?: string;
}

interface RestaurantTable {
  id: string;
  table_number: string;
  capacity: number;
  status: string;
}

interface DineInOrderWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;

  // Table context
  tableId: string | null;
  tableNumber: number | null;
  linkedTables: number[];
  isPrimaryTable: boolean;
  restaurantTables: RestaurantTable[];

  // Order data (from POSDesktop's useDineInOrder)
  order: {
    id: string;
    order_number: string;
    items: OrderItem[];
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    status: string;
    guest_count?: number;
    created_at: string;
    notes?: string;
  } | null;
  enrichedItems: EnrichedDineInOrderItem[];
  enrichedLoading: boolean;
  enrichedError: string | null;

  // Order commands
  onAddItem: (item: OrderItem) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onUpdateItemQuantity: (itemId: string, qty: number) => Promise<void>;
  onSendToKitchen: () => Promise<void>;
  onUpdateGuestCount?: (count: number) => Promise<void>;

  // Customer tabs (from POSDesktop's useCustomerTabs)
  customerTabs: CustomerTab[];
  activeTabId: string | null;
  onSetActiveTabId: (tabId: string | null) => void;
  onCreateTab: (name: string, guestId?: string) => Promise<string | null>;
  onRenameTab: (tabId: string, newName: string) => Promise<boolean>;
  onCloseTab: (tabId: string) => Promise<boolean>;

  // Staging cart (from POSDesktop state)
  stagingItems: OrderItem[];
  onAddToStaging: (item: OrderItem) => void;
  onRemoveFromStaging: (itemId: string) => void;
  onClearStaging: () => void;
  onPersistStaging: () => Promise<boolean>;

  // Print handlers
  onPrintBill: (orderTotal: number) => Promise<boolean>;
  onCompleteOrder: () => Promise<void>;
}

// Animation variants for view transitions (fast: 150ms)
const viewVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const viewTransition = {
  duration: 0.15,
  ease: 'easeInOut',
};

export function DineInOrderWorkspace({
  isOpen,
  onClose,
  tableId,
  tableNumber,
  linkedTables,
  isPrimaryTable,
  restaurantTables,
  order,
  enrichedItems,
  enrichedLoading,
  enrichedError,
  onAddItem,
  onRemoveItem,
  onUpdateItemQuantity,
  onSendToKitchen,
  onUpdateGuestCount,
  customerTabs,
  activeTabId,
  onSetActiveTabId,
  onCreateTab,
  onRenameTab,
  onCloseTab,
  stagingItems,
  onAddToStaging,
  onRemoveFromStaging,
  onClearStaging,
  onPersistStaging,
  onPrintBill,
  onCompleteOrder,
}: DineInOrderWorkspaceProps) {
  // ============================================================================
  // MENU DATA (React Query via compat layer)
  // ============================================================================

  const { menuItems: allMenuItems, itemVariants } = useRealtimeMenuStoreCompat({ context: 'pos' });

  // ============================================================================
  // VIEW STATE
  // ============================================================================

  const [activeView, setActiveView] = useState<WorkspaceView>('add-items');

  // Dialog states
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<WorkspaceView | null>(null);
  const [showGuestCountModal, setShowGuestCountModal] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showCreateTabDialog, setShowCreateTabDialog] = useState(false);

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<EnrichedDineInOrderItem | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [customizingItemIndex, setCustomizingItemIndex] = useState<number>(-1);
  const [isEditingStagingItem, setIsEditingStagingItem] = useState(false);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveView('add-items');
    }
  }, [isOpen]);

  // ============================================================================
  // NAVIGATION LOGIC
  // ============================================================================

  const handleNavigate = useCallback(async (targetView: WorkspaceView, skipPersist = false) => {
    // Guard: Add Items → Review must persist staging first (unless skipPersist=true)
    if (activeView === 'add-items' && targetView === 'review' && !skipPersist) {
      if (stagingItems.length > 0) {
        const success = await onPersistStaging();
        if (!success) {
          toast.error('Failed to save items');
          return; // Stay on Add Items if persist failed
        }
        toast.success('Items saved to order');
      }
    }

    // Guard: Prevent Bill if staging items exist (show confirmation)
    if (targetView === 'bill' && stagingItems.length > 0) {
      setPendingNavigation(targetView);
      setShowDiscardDialog(true);
      return;
    }

    setActiveView(targetView);
  }, [activeView, stagingItems.length, onPersistStaging]);

  // Handle discard confirmation
  const handleDiscardAndNavigate = useCallback(() => {
    onClearStaging();
    if (pendingNavigation) {
      setActiveView(pendingNavigation);
    }
    setShowDiscardDialog(false);
    setPendingNavigation(null);
  }, [pendingNavigation, onClearStaging]);

  const handleCancelDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    setPendingNavigation(null);
  }, []);

  // ============================================================================
  // HEADER ACTIONS
  // ============================================================================

  const handleCreateTab = useCallback(async (tabName: string) => {
    await onCreateTab(tabName);
    setShowCreateTabDialog(false);
  }, [onCreateTab]);

  const handleUpdateGuestCount = useCallback(async (count: number) => {
    if (onUpdateGuestCount) {
      await onUpdateGuestCount(count);
    }
    setShowGuestCountModal(false);
  }, [onUpdateGuestCount]);

  // ============================================================================
  // VIEW CALLBACKS
  // ============================================================================

  // Add Items View
  const handleNavigateToReview = useCallback(() => {
    handleNavigate('review');
  }, [handleNavigate]);

  // Navigation that skips the persist guard (for use after explicit persist in DineInAddItemsView)
  const handleNavigateToReviewDirect = useCallback(() => {
    handleNavigate('review', true); // skipPersist = true
  }, [handleNavigate]);

  // Review View
  const handleNavigateToBill = useCallback(() => {
    handleNavigate('bill');
  }, [handleNavigate]);

  const handleNavigateToAddItems = useCallback(() => {
    handleNavigate('add-items');
  }, [handleNavigate]);

  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    onUpdateItemQuantity(itemId, quantity);
  }, [onUpdateItemQuantity]);

  const handleDeleteItem = useCallback((itemId: string) => {
    onRemoveItem(itemId);
  }, [onRemoveItem]);

  // Handle customizing persisted items (from Review view)
  const handleCustomizeItem = useCallback((item: EnrichedDineInOrderItem) => {
    setCustomizingItem(item);
    setIsEditingStagingItem(false);
    setCustomizingItemIndex(-1);
    setIsCustomizationModalOpen(true);
  }, []);

  // Handle customizing staging items (from Add Items view)
  const handleCustomizeStagingItem = useCallback((index: number, item: OrderItem) => {
    // Convert OrderItem to EnrichedDineInOrderItem format for the modal
    const enrichedItem: EnrichedDineInOrderItem = {
      id: item.id,
      order_id: order?.id || '',
      customer_tab_id: null,
      table_number: tableNumber || 0,
      menu_item_id: item.menu_item_id,
      variant_id: item.variant_id || null,
      category_id: null,
      item_name: item.name,
      variant_name: item.variantName || null,
      protein_type: item.protein_type || null,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity,
      customizations: item.customizations?.map(c => ({
        customization_id: c.id || c.customization_id,
        name: c.name,
        price_adjustment: c.price_adjustment || 0,
        group: c.group || ''
      })) || [],
      notes: item.notes || null,
      status: 'PENDING',
      sent_to_kitchen_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      image_url: item.image_url || null,
    };
    setCustomizingItem(enrichedItem);
    setIsEditingStagingItem(true);
    setCustomizingItemIndex(index);
    setIsCustomizationModalOpen(true);
  }, [order?.id, tableNumber]);

  // Handle confirmation from customization modal
  const handleCustomizationConfirm = useCallback(async (
    menuItem: MenuTypesMenuItem,
    quantity: number,
    variant?: MenuTypesItemVariant | null,
    customizations?: SelectedCustomization[],
    notes?: string
  ) => {
    if (!customizingItem) return;

    if (isEditingStagingItem && customizingItemIndex >= 0) {
      // Update staging item
      const originalItem = stagingItems[customizingItemIndex];
      if (!originalItem) return;

      const updatedItem: OrderItem = {
        ...originalItem,
        quantity,
        customizations: customizations?.map(c => ({
          id: c.id,
          customization_id: c.id,
          name: c.name,
          price_adjustment: c.price_adjustment || 0,
          group: c.group || ''
        })) || [],
        notes: notes || '',
      };

      // Remove old and add updated (staging cart doesn't support in-place update)
      onRemoveFromStaging(originalItem.id);
      onAddToStaging(updatedItem);
      toast.success(`Updated ${menuItem.name}`);
    } else {
      // Update persisted item in database
      const result = await updateOrderItemCustomizations(
        customizingItem.id,
        quantity,
        customizations?.map(c => ({
          customization_id: c.id,
          name: c.name,
          price_adjustment: c.price_adjustment || 0,
          group: c.group || ''
        })) || [],
        notes || ''
      );

      if (result.success) {
        toast.success(`Updated ${customizingItem.item_name}`);
        // Enriched items will auto-refresh via real-time subscription
      } else {
        toast.error(result.message || 'Failed to update item');
      }
    }

    setIsCustomizationModalOpen(false);
    setCustomizingItem(null);
    setCustomizingItemIndex(-1);
    setIsEditingStagingItem(false);
  }, [customizingItem, isEditingStagingItem, customizingItemIndex, stagingItems, onRemoveFromStaging, onAddToStaging]);

  // Handle item assignment to customer tab
  const handleAssignItemToTab = useCallback(async (itemId: string, tabId: string | null) => {
    const result = await assignItemToTab(itemId, tabId);
    if (result.success) {
      toast.success(result.message);
      // The enrichedItems will auto-refresh via real-time subscription
    } else {
      toast.error(result.message);
    }
  }, []);

  // Bill View
  const handleNavigateToReviewFromBill = useCallback(() => {
    handleNavigate('review');
  }, [handleNavigate]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          hideCloseButton
          className="max-w-[95vw] max-h-[95dvh] w-full h-full p-0 flex flex-col overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.background.primary} 0%, ${QSAITheme.background.secondary} 100%)`,
            border: `1px solid ${QSAITheme.border.accent}`,
            borderTop: `2px solid ${QSAITheme.purple.primary}`,
          }}
        >
          {/* Required Dialog accessibility components */}
          <DialogHeader className="sr-only">
            <DialogTitle>Dine-In Order Workspace</DialogTitle>
            <DialogDescription>
              Manage orders for Table {tableNumber} - add items, review, and print bill
            </DialogDescription>
          </DialogHeader>

          {/* Unified Header - Always Visible */}
          <DineInWorkspaceHeader
            tableNumber={tableNumber}
            linkedTables={linkedTables}
            isPrimaryTable={isPrimaryTable}
            order={order}
            customerTabs={customerTabs}
            activeTabId={activeTabId}
            onSetActiveTabId={onSetActiveTabId}
            onCreateTab={() => setShowCreateTabDialog(true)}
            onEditGuestCount={() => setShowGuestCountModal(true)}
            onOpenNotes={() => setShowNotesDialog(true)}
            onClose={onClose}
            onRenameTab={onRenameTab}
            stagingItemCount={stagingItems.length}
          />

          {/* Segmented Control */}
          <WorkspaceSegmentedControl
            activeView={activeView}
            onViewChange={handleNavigate}
            hasStagingItems={stagingItems.length > 0}
            savedItemCount={enrichedItems.length}
          />

          {/* View Content with Animations */}
          <AnimatePresence mode="wait">
            {activeView === 'add-items' && (
              <motion.div
                key="add-items"
                variants={viewVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={viewTransition}
                className="flex-1 flex flex-col min-h-0"
              >
                <DineInAddItemsView
                  stagingItems={stagingItems}
                  onAddToStaging={onAddToStaging}
                  onRemoveFromStaging={onRemoveFromStaging}
                  onClearStaging={onClearStaging}
                  onPersistStaging={onPersistStaging}
                  onSendToKitchen={onSendToKitchen}
                  onNavigateToReview={handleNavigateToReviewDirect}
                  tableNumber={tableNumber}
                  guestCount={order?.guest_count || customerTabs.length || 1}
                  linkedTables={linkedTables}
                  onCustomizeItem={handleCustomizeStagingItem}
                />
              </motion.div>
            )}

            {activeView === 'review' && (
              <motion.div
                key="review"
                variants={viewVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={viewTransition}
                className="flex-1 flex flex-col min-h-0"
              >
                <DineInReviewView
                  enrichedItems={enrichedItems}
                  enrichedLoading={enrichedLoading}
                  enrichedError={enrichedError}
                  customerTabs={customerTabs}
                  tableNumber={tableNumber}
                  guestCount={order?.guest_count || customerTabs.length || 1}
                  onUpdateQuantity={handleUpdateQuantity}
                  onDeleteItem={handleDeleteItem}
                  onCustomizeItem={handleCustomizeItem}
                  onAssignItemToTab={handleAssignItemToTab}
                  onNavigateToBill={handleNavigateToBill}
                  onNavigateToAddItems={handleNavigateToAddItems}
                  onSendToKitchen={onSendToKitchen}
                />
              </motion.div>
            )}

            {activeView === 'bill' && (
              <motion.div
                key="bill"
                variants={viewVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={viewTransition}
                className="flex-1 flex flex-col min-h-0"
              >
                <DineInBillView
                  orderItems={order?.items || []}
                  enrichedItems={enrichedItems}
                  tableNumber={tableNumber}
                  guestCount={order?.guest_count || customerTabs.length || 1}
                  customerTabs={customerTabs}
                  onPrintBill={onPrintBill}
                  onCompleteOrder={onCompleteOrder}
                  onNavigateToReview={handleNavigateToReviewFromBill}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Discard Staging Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDiscardDialog}
        onConfirm={handleDiscardAndNavigate}
        onCancel={handleCancelDiscard}
        title="Unsaved Items"
        description={`You have ${stagingItems.length} unsaved item${stagingItems.length === 1 ? '' : 's'} in your cart. Discard and continue to bill?`}
        confirmText="Discard & Continue"
        cancelText="Go Back"
        isDestructive={true}
      />

      {/* Guest Count Modal */}
      <POSGuestCountModal
        isOpen={showGuestCountModal}
        onClose={() => setShowGuestCountModal(false)}
        onSave={(guestCount, _action, _linkedTables) => {
          handleUpdateGuestCount(guestCount);
        }}
        initialGuestCount={order?.guest_count || customerTabs.length || 1}
        tableNumber={tableNumber || 0}
        tableCapacity={
          restaurantTables.find(t => t.table_number === String(tableNumber))?.capacity || 4
        }
      />

      {/* Notes Dialog - Always mounted, visibility controlled by open prop */}
      <CustomerNotesDialog
        open={showNotesDialog}
        onClose={() => setShowNotesDialog(false)}
        initialNotes={order?.notes || ''}
        onSave={async (notes) => {
          if (!order?.id) {
            toast.error('No active order');
            setShowNotesDialog(false);
            return;
          }

          const { error } = await supabase
            .from('orders')
            .update({ notes })
            .eq('id', order.id);

          if (error) {
            console.error('[DineInOrderWorkspace] Notes save error:', error);
            toast.error('Failed to save notes');
          } else {
            toast.success('Notes saved');
          }
          setShowNotesDialog(false);
        }}
        tableNumber={tableNumber || undefined}
      />

      {/* Add Customer Tab Dialog */}
      <AddCustomerTabDialog
        isOpen={showCreateTabDialog}
        onClose={() => setShowCreateTabDialog(false)}
        onCreateTab={handleCreateTab}
        existingTabNames={customerTabs
          .filter(tab => tab.status === 'active')
          .map(tab => tab.tab_name || '')}
      />

      {/* Customization Modal for editing item customizations */}
      {isCustomizationModalOpen && customizingItem && (() => {
        const fullMenuItem = allMenuItems.find(mi => mi.id === customizingItem.menu_item_id);

        if (!fullMenuItem) {
          console.error('Menu item not found for customization modal:', customizingItem.menu_item_id);
          return null;
        }

        const selectedVariant = customizingItem.variant_id
          ? itemVariants.find(v => v.id === customizingItem.variant_id)
          : null;

        // Convert customizations to SelectedCustomization format
        const initialCustomizations: SelectedCustomization[] = customizingItem.customizations?.map((c: any) => ({
          id: c.customization_id || c.id,
          name: c.name,
          price_adjustment: c.price_adjustment || 0,
          group: c.group || ''
        })) || [];

        return (
          <StaffCustomizationModal
            item={fullMenuItem}
            variant={selectedVariant || null}
            isOpen={isCustomizationModalOpen}
            onClose={() => {
              setIsCustomizationModalOpen(false);
              setCustomizingItem(null);
              setCustomizingItemIndex(-1);
              setIsEditingStagingItem(false);
            }}
            onConfirm={handleCustomizationConfirm}
            orderType="DINE-IN"
            initialQuantity={customizingItem.quantity}
            initialCustomizations={initialCustomizations}
            initialNotes={customizingItem.notes || ''}
          />
        );
      })()}
    </>
  );
}

export default DineInOrderWorkspace;
