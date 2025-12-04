/**
 * DineInKitchenPreviewModal - Kitchen Ticket Preview for DINE-IN Orders
 * Shows THERMAL RECEIPT PREVIEW (WYSIWYG) before printing kitchen ticket
 * Part of DINE-IN workflow in POSDesktop
 * 
 * TRIGGER: "Send to Kitchen" button in POSOrderSummary
 * DISPLAY: ThermalReceiptDisplay with kitchen template (orderMode="DINE-IN")
 * CTA: "Print Kitchen Ticket" → calls print handler
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import { generateDisplayNameForReceipt } from '../utils/menuHelpers';

interface DineInKitchenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  tableNumber: number | null;
  guestCount: number;
  onPrintKitchen: () => Promise<boolean>;
}

export function DineInKitchenPreviewModal({
  isOpen,
  onClose,
  orderItems,
  tableNumber,
  guestCount,
  onPrintKitchen
}: DineInKitchenPreviewModalProps) {

  // DEBUG: Log what we're receiving
  console.log('🔍 DineInKitchenPreviewModal - orderItems:', orderItems);
  console.log('🔍 DineInKitchenPreviewModal - tableNumber:', tableNumber);
  console.log('🔍 DineInKitchenPreviewModal - guestCount:', guestCount);

  // Map order data to receipt format for ThermalReceiptDisplay
  const mapToReceiptOrderData = () => {
    const mappedData = {
      orderId: `DINE-${tableNumber}-${Date.now()}`,
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
      subtotal: 0, // Kitchen ticket doesn't need prices
      serviceCharge: 0,
      deliveryFee: 0,
      total: 0,
      timestamp: new Date().toISOString()
    };
    
    // DEBUG: Log the mapped data
    console.log('🔍 DineInKitchenPreviewModal - mappedData:', mappedData);
    console.log('🔍 DineInKitchenPreviewModal - items count:', mappedData.items.length);
    
    return mappedData;
  };

  const handlePrint = async () => {
    const success = await onPrintKitchen();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.background.primary} 0%, ${QSAITheme.background.secondary} 100%)`,
          border: `1px solid ${QSAITheme.border.accent}`,
        }}
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <ChefHat className="h-6 w-6" style={{ color: QSAITheme.purple.primary }} />
            Preview Kitchen Ticket
          </DialogTitle>
          <p className="text-sm text-white/60 mt-2">
            Review kitchen ticket before printing to thermal printer
          </p>
        </DialogHeader>

        {/* Scrollable Receipt Preview */}
        <div 
          className="flex-1 overflow-y-auto py-4"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}
        >
          <div className="flex justify-center">
            <ThermalReceiptDisplay
              orderMode="DINE-IN"
              orderData={mapToReceiptOrderData()}
              paperWidth={80}
              showZoomControls={false}
              className="shadow-2xl"
              receiptFormat="kitchen"
            />
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <DialogFooter className="flex gap-3 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 border-white/20 text-white/80 hover:bg-white/10 hover:border-purple-500/50"
            style={styles.frostedGlassStyle}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 h-12 text-white font-bold"
            style={{
              ...styles.frostedGlassStyle,
              background: QSAITheme.purple.primary,
              boxShadow: effects.outerGlow('medium')
            }}
          >
            <ChefHat className="h-5 w-5 mr-2" />
            Print Kitchen Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// HMR cache clear
