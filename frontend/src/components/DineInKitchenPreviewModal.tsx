/**
 * DineInKitchenPreviewModal - Kitchen Ticket Preview for DINE-IN Orders
 * Shows THERMAL RECEIPT PREVIEW (WYSIWYG) before printing kitchen ticket
 * Part of DINE-IN workflow in POSDesktop
 *
 * TRIGGER: "Preview Order" button in DineInOrderSummary
 * DISPLAY: ThermalReceiptDisplay with kitchen template (orderMode="DINE-IN")
 * CTA: 3-button UX: Cancel | Save Order | Send to Kitchen
 *
 * ✅ Phase 5.3: Filters for PENDING items only (not sent to kitchen)
 * ✅ WYSIWYG Thermal Printing: Prints exact preview to Epson TM-T20III
 */

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChefHat, Printer, Save, Clock, Loader2 } from 'lucide-react';
import { POSButton } from './POSButton';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/types';
import { resolveItemDisplayName } from '../utils/menuHelpers';
import { Badge } from '@/components/ui/badge';
import {
  isRasterPrintAvailable,
  captureReceiptAsImage,
} from '../utils/electronPrintService';
import { toast } from 'sonner';

interface DineInKitchenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  tableNumber: number | null;
  guestCount: number;
  linkedTables?: number[];
  onSaveOnly: () => Promise<void>;
  onSaveAndPrint: () => Promise<void>;
}

export function DineInKitchenPreviewModal({
  isOpen,
  onClose,
  orderItems,
  tableNumber,
  guestCount,
  linkedTables = [],
  onSaveOnly,
  onSaveAndPrint
}: DineInKitchenPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // ✅ NO FILTER NEEDED: orderItems now receives staging items directly (inherently pending)
  const pendingItems = orderItems;

  console.log('🔍 [DineInKitchenPreviewModal] Item Status:', {
    totalItems: orderItems.length,
    pendingItems: pendingItems.length,
    linkedTables: linkedTables,
    firstPendingItem: pendingItems[0],
  });

  // Debug: Log actual rendered dimensions of receipt element
  useEffect(() => {
    if (receiptRef.current && isOpen && pendingItems.length > 0) {
      // Wait a bit for DOM to fully render
      setTimeout(() => {
        if (receiptRef.current) {
          console.log('📏 [DineInKitchenPreviewModal] Receipt element dimensions:', {
            offsetWidth: receiptRef.current.offsetWidth,
            scrollWidth: receiptRef.current.scrollWidth,
            clientWidth: receiptRef.current.clientWidth,
            cssWidth: window.getComputedStyle(receiptRef.current).width,
            expectedWidth: '576px'
          });
        }
      }, 500);
    }
  }, [isOpen, pendingItems.length]);

  // Map order data to receipt format for ThermalReceiptDisplay
  const mapToReceiptOrderData = () => {
    const mappedData = {
      orderId: `DINE-${tableNumber}-${Date.now()}`,
      orderNumber: `T${tableNumber}-${Date.now().toString().slice(-6)}`,
      orderType: 'DINE-IN' as const,
      tableNumber: linkedTables.length > 0
        ? `${tableNumber} + ${linkedTables.join(', ')}`
        : tableNumber?.toString(),
      guestCount: guestCount,
      items: pendingItems.map(item => {
        // Use resolveItemDisplayName for intelligent variant handling
        // useKitchenName=true uses abbreviated kitchen_display_name when available
        const displayName = resolveItemDisplayName(item, { useKitchenName: true });

        return {
          id: item.id || item.menu_item_id || `item-${Date.now()}`,
          name: displayName,
          price: item.price,
          quantity: item.quantity,
          variant: item.variantName ? {
            id: item.id,
            name: item.variantName,
            price_adjustment: 0
          } : undefined,
          // Include all required fields matching ThermalPreview expectations
          customizations: (item.customizations || item.modifiers)?.map((c: any) => ({
            id: c.id || c.customization_id || `mod-${Date.now()}`,
            customization_id: c.customization_id || c.id,
            name: c.name,
            price: c.price_adjustment ?? c.price ?? 0,
            price_adjustment: c.price_adjustment ?? c.price ?? 0,
            group: c.group || '',
            is_free: c.is_free || ((c.price_adjustment ?? c.price ?? 0) === 0)
          })) || [],
          instructions: item.notes || undefined,
          // Pass kitchen_display_name for kitchen receipts (shorter name for thermal printing)
          kitchen_display_name: item.kitchen_display_name || null,
          // Category tracking for receipt section organization
          category_id: item.category_id,
          menu_item_id: item.menu_item_id
        };
      }),
      subtotal: 0, // Kitchen ticket doesn't need prices
      serviceCharge: 0,
      deliveryFee: 0,
      total: 0,
      timestamp: new Date().toISOString()
    };

    return mappedData;
  };

  const handleSaveOnly = async () => {
    if (isSaving) return; // Guard against double-click race condition
    setIsSaving(true);
    try {
      await onSaveOnly();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);

    console.log('🖨️ [DineInKitchenPreviewModal] Starting WYSIWYG raster print...', {
      tableNumber,
      itemCount: pendingItems.length,
      rasterAvailable: isRasterPrintAvailable(),
      hasReceiptRef: !!receiptRef.current
    });

    try {
      // ✅ STEP 1: Capture receipt image BEFORE save (while items still exist)
      let capturedImageData: string | null = null;
      if (isRasterPrintAvailable() && receiptRef.current) {
        console.log('🖨️ [DineInKitchenPreviewModal] Capturing receipt BEFORE save...');
        capturedImageData = await captureReceiptAsImage(receiptRef.current, 80);
        console.log('🖨️ [DineInKitchenPreviewModal] Image captured:', capturedImageData ? `${capturedImageData.length} bytes` : 'null');
      }

      // STEP 2: Save order to database via parent callback (this clears items)
      await onSaveAndPrint();

      // STEP 3: Print the ALREADY CAPTURED image to thermal printer
      if (capturedImageData && window.electronAPI?.printReceiptRaster) {
        console.log('🖨️ [DineInKitchenPreviewModal] Sending captured image to printer...');

        const printResult = await window.electronAPI.printReceiptRaster({
          imageData: capturedImageData,
          paperWidth: 80
        });

        if (printResult.success) {
          console.log('✅ Kitchen ticket printed successfully via raster on', printResult.printer);
          toast.success('Kitchen ticket printed', {
            description: `Sent to ${printResult.printer || 'thermal printer'}`
          });
        } else {
          console.warn('⚠️ Raster print failed:', printResult.error);
          toast.warning('Order saved but print failed', {
            description: printResult.error || 'Check printer connection'
          });
        }
      } else {
        console.log('ℹ️ [DineInKitchenPreviewModal] Raster printing not available or capture failed');
      }

      // Modal will be closed by parent component after successful save
    } catch (error) {
      console.error('❌ [DineInKitchenPreviewModal] Error in handlePrint:', error);
      toast.error('Failed to process order');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl max-h-[90dvh] flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.background.primary} 0%, ${QSAITheme.background.secondary} 100%)`,
          border: `1px solid ${QSAITheme.border.accent}`,
          boxShadow: `0 0 60px ${QSAITheme.purple.glow}`
        }}
      >
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-white">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                  boxShadow: `0 0 20px ${QSAITheme.purple.glow}`
                }}
              >
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              Preview Kitchen Ticket
            </DialogTitle>

            {/* Item Count Badge */}
            <Badge
              variant="secondary"
              className="px-3 py-1 text-sm font-semibold"
              style={{
                background: pendingItems.length > 0
                  ? QSAITheme.purple.primary
                  : QSAITheme.background.tertiary,
                color: 'white',
                border: `1px solid ${pendingItems.length > 0 ? QSAITheme.purple.light : QSAITheme.border.medium}`
              }}
            >
              <Clock className="w-3 h-3 mr-1.5 inline" />
              {pendingItems.length} pending {pendingItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>

          <p className="text-sm mt-3" style={{ color: QSAITheme.text.muted }}>
            Review items before sending to kitchen • Table {tableNumber}
          </p>
        </DialogHeader>

        {/* Scrollable Receipt Preview */}
        <div
          className="flex-1 overflow-y-auto py-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${QSAITheme.purple.primary} transparent`
          }}
        >
          {pendingItems.length > 0 ? (
            <div className="flex justify-center">
              {/* Preview display - captured by html2canvas for WYSIWYG raster printing
                  IMPORTANT: ref is on ThermalReceiptDisplay to capture actual content size (304px),
                  NOT a 576px wrapper. Sharp will scale the captured image UP to fill the paper. */}
              <ThermalReceiptDisplay
                ref={receiptRef}
                orderMode="DINE-IN"
                orderData={mapToReceiptOrderData()}
                paperWidth={80}
                showZoomControls={false}
                className="shadow-2xl"
                receiptFormat="kitchen"
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-64 rounded-lg"
              style={{
                backgroundColor: QSAITheme.background.tertiary,
                border: `1px dashed ${QSAITheme.border.medium}`
              }}
            >
              <ChefHat className="w-16 h-16 mb-4" style={{ color: QSAITheme.text.muted }} />
              <p className="text-lg font-medium" style={{ color: QSAITheme.text.secondary }}>
                No pending items
              </p>
              <p className="text-sm mt-2" style={{ color: QSAITheme.text.muted }}>
                All items have been sent to kitchen
              </p>
            </div>
          )}
        </div>

        {/* Footer with Action Buttons: Cancel (left) | Save Order (center) | Send to Kitchen (right) */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <POSButton variant="tertiary" onClick={onClose}>
            Cancel
          </POSButton>

          <POSButton
            variant="secondary"
            onClick={handleSaveOnly}
            disabled={pendingItems.length === 0 || isSaving}
            icon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Order'}
          </POSButton>

          <POSButton
            variant="primary"
            onClick={handlePrint}
            disabled={pendingItems.length === 0 || isPrinting}
            icon={isPrinting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Printer className="w-5 h-5 text-white" />}
            showChevron={false}
          >
            {isPrinting ? 'Printing...' : 'Send to Kitchen'}
          </POSButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// HMR cache clear
