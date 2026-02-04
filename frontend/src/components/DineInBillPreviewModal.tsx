/**
 * DineInBillPreviewModal - Bill Receipt Preview for DINE-IN Orders
 * Shows THERMAL RECEIPT PREVIEW (WYSIWYG) before printing final bill
 * Part of DINE-IN workflow in POSDesktop
 *
 * TRIGGER: "Print Final Bill" button in POSOrderSummary
 * DISPLAY: ThermalReceiptDisplay with customer template (orderMode="DINE-IN")
 * CTA: "Print Bill" → calls print handler
 *
 * ✅ WYSIWYG Thermal Printing: Prints exact preview to Epson TM-T20III
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Receipt, Loader2 } from 'lucide-react';
import { POSButton } from './POSButton';
import { useState, useEffect, useRef } from 'react';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/types';
import { resolveItemDisplayName } from '../utils/menuHelpers';
import { useTemplateAssignments } from '../utils/useTemplateAssignments';
import {
  isRasterPrintAvailable,
  captureReceiptAsImage,
} from '../utils/electronPrintService';
import { toast } from 'sonner';

interface DineInBillPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Accepts both OrderItem[] and EnrichedDineInOrderItem[] for flexibility
  orderItems: any[];
  tableNumber: number | null;
  guestCount: number;
  orderTotal: number;
  onPrintBill: (orderTotal: number) => Promise<boolean>;
}

export function DineInBillPreviewModal({
  isOpen,
  onClose,
  orderItems,
  tableNumber,
  guestCount,
  orderTotal,
  onPrintBill
}: DineInBillPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // 🖨️ Load customer template ID for Front of House bill
  const { getCustomerTemplateId } = useTemplateAssignments();
  const [customerTemplateId, setCustomerTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      const templateId = await getCustomerTemplateId('DINE-IN');
      setCustomerTemplateId(templateId);
    };
    loadTemplate();
  }, [getCustomerTemplateId]);

  // Debug: Log actual rendered dimensions of receipt element
  useEffect(() => {
    if (receiptRef.current && isOpen && orderItems.length > 0) {
      // Wait a bit for DOM to fully render
      setTimeout(() => {
        if (receiptRef.current) {
          console.log('📏 [DineInBillPreviewModal] Receipt element dimensions:', {
            offsetWidth: receiptRef.current.offsetWidth,
            scrollWidth: receiptRef.current.scrollWidth,
            clientWidth: receiptRef.current.clientWidth,
            cssWidth: window.getComputedStyle(receiptRef.current).width,
            expectedWidth: '576px'
          });
        }
      }, 500);
    }
  }, [isOpen, orderItems.length]);

  // Map order data to receipt format for ThermalReceiptDisplay
  const mapToReceiptOrderData = () => {
    const mappedData = {
      orderId: `BILL-${tableNumber}-${Date.now()}`,
      orderNumber: `T${tableNumber}-${Date.now().toString().slice(-6)}`,
      orderType: 'DINE-IN' as const,
      tableNumber: tableNumber?.toString(),
      guestCount: guestCount,
      items: orderItems.map(item => {
        // Use resolveItemDisplayName for intelligent variant handling
        // Handles both modern format (variant in name) and legacy format (separate fields)
        const displayName = resolveItemDisplayName({
          name: item.item_name || item.name,
          variant_name: item.variant_name || item.variantName,
          protein_type: item.protein_type
        });

        return {
          id: item.id || item.menu_item_id || `item-${Date.now()}`,
          name: displayName,
          price: item.unit_price ?? item.price,  // EnrichedDineInOrderItem: unit_price
          quantity: item.quantity,
          variant: (item.variant_name || item.variantName) ? {
            id: item.variant_id || item.id,
            name: item.variant_name || item.variantName,
            price_adjustment: 0
          } : undefined,
          // EnrichedDineInOrderItem uses customizations, not modifiers
          // Include all required fields matching ThermalPreview expectations
          customizations: (item.customizations || item.modifiers)?.map((c: any) => ({
            id: c.customization_id || c.id || `mod-${Date.now()}`,
            customization_id: c.customization_id || c.id,
            name: c.name,
            price: c.price_adjustment ?? c.price ?? 0,
            price_adjustment: c.price_adjustment ?? c.price ?? 0,
            group: c.group || '',
            is_free: c.is_free || ((c.price_adjustment ?? c.price ?? 0) === 0)
          })) || [],
          instructions: item.notes || undefined
        };
      }),
      subtotal: orderTotal,
      serviceCharge: 0,
      deliveryFee: 0,
      total: orderTotal,
      timestamp: new Date().toISOString()
    };

    return mappedData;
  };

  const handlePrint = async () => {
    setIsPrinting(true);

    console.log('🖨️ [DineInBillPreviewModal] Starting WYSIWYG print...', {
      tableNumber,
      itemCount: orderItems.length,
      orderTotal,
      rasterAvailable: isRasterPrintAvailable(),
      hasReceiptRef: !!receiptRef.current
    });

    try {
      // PRIMARY: Raster print (WYSIWYG with template styling)
      if (isRasterPrintAvailable() && receiptRef.current) {
        console.log('🖨️ [DineInBillPreviewModal] Capturing receipt for raster print...');
        const capturedImageData = await captureReceiptAsImage(receiptRef.current, 80);

        if (capturedImageData && window.electronAPI?.printReceiptRaster) {
          console.log('🖨️ [DineInBillPreviewModal] Sending to thermal printer...');

          const printResult = await window.electronAPI.printReceiptRaster({
            imageData: capturedImageData,
            paperWidth: 80
          });

          if (printResult.success) {
            console.log('✅ Bill printed successfully via raster on', printResult.printer);
            toast.success('Bill printed', {
              description: `Sent to ${printResult.printer || 'thermal printer'}`
            });
            onClose();
            return; // Success - exit without calling fallback
          } else {
            console.warn('⚠️ Raster print failed, trying fallback:', printResult.error);
          }
        }
      }

      // FALLBACK: ESC/POS via parent handler (non-Electron or raster failed)
      console.log('ℹ️ [DineInBillPreviewModal] Using ESC/POS fallback');
      const success = await onPrintBill(orderTotal);

      if (success) {
        toast.success('Bill printed');
        onClose();
      } else {
        toast.warning('Print may have failed', {
          description: 'Check printer connection'
        });
      }
    } catch (error) {
      console.error('❌ [DineInBillPreviewModal] Error in handlePrint:', error);
      toast.error('Failed to print bill');
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
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-white">
            <div
              className="p-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                boxShadow: `0 0 20px ${QSAITheme.purple.glow}`
              }}
            >
              <Receipt className="h-6 w-6 text-white" />
            </div>
            Preview Final Bill
          </DialogTitle>
          <p className="text-sm mt-3" style={{ color: QSAITheme.text.muted }}>
            Review customer bill before printing • Table {tableNumber}
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
          <div className="flex justify-center">
            {/* Preview display - captured by html2canvas for WYSIWYG raster printing
                IMPORTANT: ref is on ThermalReceiptDisplay to capture actual content size (304px),
                NOT a 576px wrapper. Sharp will scale the captured image UP to fill the paper. */}
            <ThermalReceiptDisplay
              ref={receiptRef}
              orderMode="DINE-IN"
              templateId={customerTemplateId}
              orderData={mapToReceiptOrderData()}
              paperWidth={80}
              showZoomControls={false}
              className="shadow-2xl"
              receiptFormat="front_of_house"
            />
          </div>
        </div>

        {/* Footer: Cancel (left) | Print Bill (right) */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <POSButton variant="tertiary" onClick={onClose} disabled={isPrinting}>
            Cancel
          </POSButton>

          <POSButton
            variant="primary"
            onClick={handlePrint}
            disabled={isPrinting || orderItems.length === 0}
            icon={isPrinting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Receipt className="w-5 h-5 text-white" />}
            showChevron={false}
          >
            {isPrinting ? 'Printing...' : 'Print Bill'}
          </POSButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// HMR cache clear
