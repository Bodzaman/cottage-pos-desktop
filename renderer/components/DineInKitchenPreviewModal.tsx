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
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChefHat, Printer, Save, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import { generateDisplayNameForReceipt } from '../utils/menuHelpers';
import { Badge } from '@/components/ui/badge';

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

  // ✅ NO FILTER NEEDED: orderItems now receives staging items directly (inherently pending)
  const pendingItems = orderItems;
  
  console.log('🔍 [DineInKitchenPreviewModal] Item Status:', {
    totalItems: orderItems.length,
    pendingItems: pendingItems.length,
    linkedTables: linkedTables,
    firstPendingItem: pendingItems[0],
  });

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
    
    return mappedData;
  };

  const handleSaveOnly = async () => {
    await onSaveOnly();
    onClose();
  };

  const handlePrint = async () => {
    await onSaveAndPrint();
    // Modal will be closed by parent component after successful print
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] flex flex-col"
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
              <ThermalReceiptDisplay
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

        {/* Footer with Action Buttons */}
        <DialogFooter className="flex gap-3 pt-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 h-12 font-medium transition-all"
            style={{
              borderColor: QSAITheme.border.medium,
              color: QSAITheme.text.secondary,
              backgroundColor: 'transparent'
            }}
          >
            Cancel
          </Button>
          
          <div className="flex-1 flex gap-3">
            <Button
              variant="secondary"
              onClick={handleSaveOnly}
              disabled={pendingItems.length === 0}
              className="flex-1 h-12 font-semibold transition-all"
              style={{
                background: pendingItems.length > 0 
                  ? QSAITheme.background.highlight 
                  : QSAITheme.background.tertiary,
                color: pendingItems.length > 0 ? 'white' : QSAITheme.text.muted,
                border: `1px solid ${pendingItems.length > 0 ? QSAITheme.border.medium : QSAITheme.border.light}`,
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Order
            </Button>
            
            <Button
              onClick={handlePrint}
              disabled={pendingItems.length === 0}
              className="flex-1 h-12 text-base font-bold transition-all"
              style={{
                background: pendingItems.length > 0
                  ? `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`
                  : QSAITheme.background.tertiary,
                color: 'white',
                boxShadow: pendingItems.length > 0 ? `0 0 30px ${QSAITheme.purple.glow}` : 'none',
                opacity: pendingItems.length > 0 ? 1 : 0.5
              }}
            >
              <Printer className="w-5 h-5 mr-2" />
              Send to Kitchen
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// HMR cache clear
