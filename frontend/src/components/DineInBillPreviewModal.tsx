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

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Receipt, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import { generateDisplayNameForReceipt } from '../utils/menuHelpers';
import { useTemplateAssignments } from '../utils/useTemplateAssignments';
import {
  isRasterPrintAvailable,
  captureReceiptAsImage,
} from '../utils/electronPrintService';
import { toast } from 'sonner';

interface DineInBillPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
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
        // Use generateDisplayNameForReceipt to avoid duplicate variation names
        const displayName = generateDisplayNameForReceipt(
          item.name,
          item.variantName,
          item.protein_type
        );

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
          customizations: item.modifiers?.map(mod => ({
            id: mod.id || `mod-${Date.now()}`,
            name: mod.name,
            price: mod.price || 0
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

    console.log('🖨️ [DineInBillPreviewModal] Starting WYSIWYG raster print...', {
      tableNumber,
      itemCount: orderItems.length,
      orderTotal,
      rasterAvailable: isRasterPrintAvailable(),
      hasReceiptRef: !!receiptRef.current
    });

    try {
      // ✅ STEP 1: Capture receipt image BEFORE any state changes
      let capturedImageData: string | null = null;
      if (isRasterPrintAvailable() && receiptRef.current) {
        console.log('🖨️ [DineInBillPreviewModal] Capturing receipt...');
        capturedImageData = await captureReceiptAsImage(receiptRef.current, 80);
        console.log('🖨️ [DineInBillPreviewModal] Image captured:', capturedImageData ? `${capturedImageData.length} bytes` : 'null');
      }

      // STEP 2: Call parent's print handler (handles Supabase queue fallback)
      const success = await onPrintBill(orderTotal);

      // STEP 3: If Electron is available, also print via raster (direct print)
      if (capturedImageData && window.electronAPI?.printReceiptRaster) {
        console.log('🖨️ [DineInBillPreviewModal] Sending captured image to thermal printer...');

        const printResult = await window.electronAPI.printReceiptRaster({
          imageData: capturedImageData,
          paperWidth: 80
        });

        if (printResult.success) {
          console.log('✅ Bill printed successfully via raster on', printResult.printer);
          toast.success('Bill printed', {
            description: `Sent to ${printResult.printer || 'thermal printer'}`
          });
        } else {
          console.warn('⚠️ Raster print failed:', printResult.error);
          // Don't show error toast if Supabase queue succeeded
          if (!success) {
            toast.warning('Print may have failed', {
              description: printResult.error || 'Check printer connection'
            });
          }
        }
      } else {
        console.log('ℹ️ [DineInBillPreviewModal] Raster printing not available, using queue fallback');
      }

      if (success) {
        onClose();
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

        {/* Footer with Action Buttons */}
        <DialogFooter className="flex gap-3 pt-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPrinting}
            className="flex-1 h-12 font-medium transition-all"
            style={{
              borderColor: QSAITheme.border.medium,
              color: QSAITheme.text.secondary,
              backgroundColor: 'transparent'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isPrinting || orderItems.length === 0}
            className="flex-1 h-12 text-base font-bold transition-all"
            style={{
              background: !isPrinting && orderItems.length > 0
                ? `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`
                : QSAITheme.background.tertiary,
              color: 'white',
              boxShadow: !isPrinting && orderItems.length > 0 ? `0 0 30px ${QSAITheme.purple.glow}` : 'none',
              opacity: !isPrinting && orderItems.length > 0 ? 1 : 0.5
            }}
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Receipt className="h-5 w-5 mr-2" />
                Print Bill
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// HMR cache clear
