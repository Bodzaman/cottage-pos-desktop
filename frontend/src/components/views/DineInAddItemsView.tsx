/**
 * DineInAddItemsView - Menu browsing and staging cart view
 *
 * Works on STAGING CART (ephemeral):
 * - Two-panel layout: Menu browser (left) | Order summary (right)
 * - Uses useRealtimeMenuStore() directly for menu data
 * - Receives staging cart via props from POSDesktop
 * - CTA: "Review & Send" opens kitchen preview modal for save/print
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Send } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { useRealtimeMenuStoreCompat } from 'utils/realtimeMenuStoreCompat';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { POSMenuSelector } from 'components/POSMenuSelector';
import { POSSectionPills } from 'components/POSSectionPills';
import { POSCategoryPills } from 'components/POSCategoryPills';
import { OrderItemCard } from 'components/OrderItemCard';
import { DineInKitchenPreviewModal } from 'components/DineInKitchenPreviewModal';
import { toast } from 'sonner';
import type { OrderItem, MenuItem } from 'utils/menuTypes';
import type { OrderItem as TypesOrderItem } from 'types';

interface DineInAddItemsViewProps {
  // Staging cart (from POSDesktop state)
  stagingItems: OrderItem[];
  onAddToStaging: (item: OrderItem) => void;
  onRemoveFromStaging: (itemId: string) => void;
  onClearStaging: () => void;

  // Kitchen preview modal callbacks
  onPersistStaging: () => Promise<boolean>;
  onSendToKitchen?: () => Promise<void>;

  // Navigation
  onNavigateToReview: () => void;

  // Table context for kitchen preview modal
  tableNumber: number | null;
  guestCount: number;
  linkedTables: number[];

  // Optional: For customization modal integration
  onCustomizeItem?: (index: number, item: OrderItem) => void;
}

export function DineInAddItemsView({
  stagingItems,
  onAddToStaging,
  onRemoveFromStaging,
  onClearStaging,
  onPersistStaging,
  onSendToKitchen,
  onNavigateToReview,
  tableNumber,
  guestCount,
  linkedTables,
  onCustomizeItem,
}: DineInAddItemsViewProps) {
  // Menu store - uses hook directly (same as Takeaway mode)
  const { categories } = useRealtimeMenuStoreCompat({ context: 'pos' });

  // Kitchen preview modal state
  const [showKitchenPreviewModal, setShowKitchenPreviewModal] = useState(false);

  // Section & Category navigation state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Compute child categories for selected section
  const childCategories = useMemo(() => {
    if (!selectedSectionId) return [];
    return categories
      .filter(cat => cat.parent_category_id === selectedSectionId)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        menuOrder: cat.display_order,
        printOrder: cat.print_order,
        printToKitchen: cat.print_to_kitchen,
        imageUrl: cat.image_url,
        parentCategoryId: cat.parent_category_id,
        active: cat.active,
        isProteinType: cat.is_protein_type
      }));
  }, [categories, selectedSectionId]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return stagingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [stagingItems]);

  // Handle section selection
  const handleSectionSelect = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
    setSelectedCategoryId(null);

    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(sectionId);
    menuStore.setSelectedParentCategory(null);
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(categoryId);
  }, []);

  // Handle category change from POSMenuSelector
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    const menuStore = useRealtimeMenuStore.getState();
    menuStore.setSelectedMenuCategory(categoryId);
  }, []);

  // Handle adding item to staging
  const handleAddToOrder = useCallback((orderItem: OrderItem) => {
    onAddToStaging(orderItem);
    toast.success(`Added ${orderItem.name} to order`, {
      description: 'Item added to staging cart'
    });
  }, [onAddToStaging]);

  // Handle quantity update for staging items
  const handleQuantityUpdate = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      const item = stagingItems[index];
      if (item) {
        onRemoveFromStaging(item.id);
      }
    }
    // Note: For staging, we can't update quantity in place
    // User must remove and re-add with new quantity
  }, [stagingItems, onRemoveFromStaging]);

  // Handle remove item
  const handleRemoveItem = useCallback((index: number) => {
    const item = stagingItems[index];
    if (item) {
      onRemoveFromStaging(item.id);
      toast.info(`Removed ${item.name} from order`);
    }
  }, [stagingItems, onRemoveFromStaging]);

  // Handle customize staging item
  const handleCustomizeStagingItem = useCallback((index: number, item: OrderItem) => {
    if (onCustomizeItem) {
      onCustomizeItem(index, item);
    }
  }, [onCustomizeItem]);

  // Handle clear order
  const handleClearOrder = useCallback(() => {
    if (stagingItems.length === 0) return;
    onClearStaging();
    toast.info('Staging cart cleared');
  }, [stagingItems.length, onClearStaging]);

  // Handle Review & Send button - opens kitchen preview modal
  const handleReviewAndSend = useCallback(() => {
    if (stagingItems.length === 0) {
      toast.info('No items to preview');
      return;
    }
    setShowKitchenPreviewModal(true);
  }, [stagingItems.length]);

  // Handle Save Only - persist without printing, navigate to Review
  const handleSaveOnly = useCallback(async () => {
    try {
      const success = await onPersistStaging();
      if (success) {
        toast.success('Order saved successfully');
        setShowKitchenPreviewModal(false);
        onNavigateToReview();
      } else {
        toast.error('Failed to save order');
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Failed to save order');
    }
  }, [onPersistStaging, onNavigateToReview]);

  // Handle Save and Print - persist, print kitchen copy, navigate to Review
  const handleSaveAndPrint = useCallback(async () => {
    try {
      // First persist the staging items
      const success = await onPersistStaging();
      if (!success) {
        toast.error('Failed to save order');
        return;
      }

      // Then send to kitchen (marks items as sent + triggers print in modal)
      if (onSendToKitchen) {
        await onSendToKitchen();
      }

      setShowKitchenPreviewModal(false);
      onNavigateToReview();
      toast.success('Order sent to kitchen', {
        description: 'Kitchen ticket created'
      });
    } catch (error) {
      console.error('Failed to send to kitchen:', error);
      toast.error('Failed to send to kitchen');
    }
  }, [onPersistStaging, onSendToKitchen, onNavigateToReview]);

  return (
    <div className="flex flex-row gap-[18px] flex-1 min-h-0 overflow-hidden w-full px-6 pb-4">
      {/* LEFT PANEL: Menu Browser */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden min-w-0">
        {/* Category Row */}
        <div
          className="flex-shrink-0 space-y-2 p-3 rounded-lg mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
            border: `1px solid ${QSAITheme.border.light}`
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

        {/* Menu Grid - SCROLLABLE */}
        <POSMenuSelector
          onAddToOrder={handleAddToOrder as unknown as (orderItem: TypesOrderItem) => void}
          onCustomizeItem={handleAddToOrder as any}
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
        {/* Zone A: Header - FIXED */}
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

        {/* Status Text - FIXED */}
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

        {/* Zone B: Scrollable Items - DYNAMIC */}
        <ScrollArea
          className="px-4"
          style={{
            height: '100%',
            overflowY: 'auto'
          }}
        >
          {stagingItems.length === 0 ? (
            <div className="flex items-center justify-center h-full py-12">
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
                  showCustomizeButton={!!onCustomizeItem}
                  showRemoveButton={true}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Zone C: Footer - PINNED */}
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
                £{subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold" style={{ fontSize: '16px', color: QSAITheme.text.primary }}>Total</span>
              <span className="font-bold" style={{ fontSize: '16px', color: QSAITheme.text.primary }}>
                £{subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Primary CTA - Review & Send */}
          <Button
            size="sm"
            onClick={handleReviewAndSend}
            disabled={stagingItems.length === 0}
            className="w-full text-sm h-11 font-medium mb-2"
            style={{
              backgroundColor: stagingItems.length === 0 ? QSAITheme.background.tertiary : QSAITheme.purple.primary,
              borderColor: QSAITheme.purple.primary,
              color: 'white',
              boxShadow: stagingItems.length === 0 ? 'none' : `0 4px 8px ${QSAITheme.purple.glow}`,
              opacity: stagingItems.length === 0 ? 0.5 : 1,
              cursor: stagingItems.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            Review & Send
          </Button>

          {/* Clear Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearOrder}
            disabled={stagingItems.length === 0}
            className="w-full text-xs h-8"
            style={{
              borderColor: QSAITheme.border.medium,
              color: QSAITheme.text.muted,
              opacity: stagingItems.length === 0 ? 0.5 : 1
            }}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear Cart
          </Button>
        </div>
      </div>

      {/* Kitchen Preview Modal */}
      <DineInKitchenPreviewModal
        isOpen={showKitchenPreviewModal}
        onClose={() => setShowKitchenPreviewModal(false)}
        orderItems={stagingItems}
        tableNumber={tableNumber || 0}
        guestCount={guestCount}
        linkedTables={linkedTables}
        onSaveOnly={handleSaveOnly}
        onSaveAndPrint={handleSaveAndPrint}
      />
    </div>
  );
}

export default DineInAddItemsView;
