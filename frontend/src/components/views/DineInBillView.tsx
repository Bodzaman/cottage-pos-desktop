/**
 * DineInBillView - Bill preview and print view
 *
 * Works on READ-ONLY bill data:
 * - WYSIWYG thermal receipt preview using ThermalReceiptDisplay
 * - Split bill options if multiple customer tabs
 * - CTA: "Print & Complete" prints bill and completes order
 * - Secondary: "Back to Review" returns to review view
 *
 * Printing unchanged - uses existing print pipelines
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt, Loader2, ArrowLeft, CheckCircle2, Users, CreditCard } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import ThermalReceiptDisplay from 'components/ThermalReceiptDisplay';
import { useTemplateAssignments } from 'utils/useTemplateAssignments';
import {
  isRasterPrintAvailable,
  captureReceiptAsImage,
} from 'utils/electronPrintService';
import { resolveItemDisplayName } from 'utils/menuHelpers';
import { toast } from 'sonner';
import type { OrderItem } from 'utils/types';

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
 */
interface CustomerTab {
  id: string;
  table_id?: number;
  tab_name: string;
  status: 'active' | 'paid' | 'closed';
}

interface DineInBillViewProps {
  // Order data
  orderItems: OrderItem[];
  enrichedItems: EnrichedDineInOrderItem[];
  tableNumber: number | null;
  guestCount: number;

  // Customer tabs for split billing
  customerTabs: CustomerTab[];

  // Actions
  onPrintBill: (orderTotal: number) => Promise<boolean>;
  onCompleteOrder: () => Promise<void>;
  onPayTab?: (tabId: string) => Promise<boolean>; // Pay individual tab

  // Navigation
  onNavigateToReview: () => void;
}

export function DineInBillView({
  orderItems,
  enrichedItems,
  tableNumber,
  guestCount,
  customerTabs,
  onPrintBill,
  onCompleteOrder,
  onPayTab,
  onNavigateToReview,
}: DineInBillViewProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string | null>(null); // null = all items
  const receiptRef = useRef<HTMLDivElement>(null);

  // Load customer template ID for Front of House bill
  const { getCustomerTemplateId } = useTemplateAssignments();
  const [customerTemplateId, setCustomerTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      const templateId = await getCustomerTemplateId('DINE-IN');
      setCustomerTemplateId(templateId);
    };
    loadTemplate();
  }, [getCustomerTemplateId]);

  // Filter items based on selected tab
  // ALWAYS use enrichedItems (from dine_in_order_items table) - never orderItems (stale JSONB)
  const displayItems = useMemo(() => {
    const itemsToMap = selectedTab
      ? enrichedItems.filter(item => item.customer_tab_id === selectedTab)
      : enrichedItems;

    return itemsToMap.map(item => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      name: item.item_name,
      price: item.unit_price,
      quantity: item.quantity,
      variantName: item.variant_name || undefined,
      protein_type: item.protein_type || undefined,
      notes: item.notes || undefined,
      modifiers: item.customizations?.map((c: any) => ({
        id: c.customization_id,
        name: c.name,
        price: c.price_adjustment || 0,
      })) || [],
    })) as OrderItem[];
  }, [selectedTab, enrichedItems]);

  // Calculate totals using line_total from enrichedItems (includes customization adjustments)
  const orderTotal = useMemo(() => {
    const itemsToSum = selectedTab
      ? enrichedItems.filter(item => item.customer_tab_id === selectedTab)
      : enrichedItems;
    return itemsToSum.reduce((sum, item) => sum + (item.line_total || (item.unit_price * item.quantity)), 0);
  }, [selectedTab, enrichedItems]);

  // Map order data to receipt format
  const mapToReceiptOrderData = () => {
    return {
      orderId: `BILL-${tableNumber}-${Date.now()}`,
      orderNumber: `T${tableNumber}-${Date.now().toString().slice(-6)}`,
      orderType: 'DINE-IN' as const,
      tableNumber: tableNumber?.toString(),
      guestCount: guestCount,
      items: displayItems.map(item => {
        // Use resolveItemDisplayName for intelligent variant handling
        const displayName = resolveItemDisplayName(item);

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
  };

  // Handle print and complete
  const handlePrintAndComplete = async () => {
    setIsPrinting(true);

    try {
      let printSuccess = false;

      // PRIMARY: Raster print (WYSIWYG with template styling)
      if (isRasterPrintAvailable() && receiptRef.current) {
        const capturedImageData = await captureReceiptAsImage(receiptRef.current, 80);

        if (capturedImageData && window.electronAPI?.printReceiptRaster) {
          const printResult = await window.electronAPI.printReceiptRaster({
            imageData: capturedImageData,
            paperWidth: 80
          });

          if (printResult.success) {
            toast.success('Bill printed', {
              description: `Sent to ${printResult.printer || 'thermal printer'}`
            });
            printSuccess = true;
          } else {
            console.warn('Raster print failed, trying fallback:', printResult.error);
          }
        }
      }

      // FALLBACK: ESC/POS via parent handler (non-Electron or raster failed)
      if (!printSuccess) {
        printSuccess = await onPrintBill(orderTotal);
        if (printSuccess) {
          toast.success('Bill printed');
        } else {
          toast.warning('Print may have failed', {
            description: 'Check printer connection'
          });
        }
      }

      // Complete the order after successful print
      if (printSuccess) {
        await onCompleteOrder();
        toast.success('Order completed', {
          description: 'Table is now available'
        });
      }
    } catch (error) {
      console.error('Error in handlePrintAndComplete:', error);
      toast.error('Failed to complete order');
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle pay single tab - prints bill for this tab only and marks it paid
  const handlePayTabOnly = async () => {
    if (!selectedTab || !onPayTab) return;

    setIsPrinting(true);

    try {
      let printSuccess = false;

      // PRIMARY: Raster print (WYSIWYG with template styling)
      if (isRasterPrintAvailable() && receiptRef.current) {
        const capturedImageData = await captureReceiptAsImage(receiptRef.current, 80);

        if (capturedImageData && window.electronAPI?.printReceiptRaster) {
          const printResult = await window.electronAPI.printReceiptRaster({
            imageData: capturedImageData,
            paperWidth: 80
          });

          if (printResult.success) {
            toast.success('Tab bill printed', {
              description: `Sent to ${printResult.printer || 'thermal printer'}`
            });
            printSuccess = true;
          } else {
            console.warn('Raster print failed, trying fallback:', printResult.error);
          }
        }
      }

      // FALLBACK: ESC/POS via parent handler (non-Electron or raster failed)
      if (!printSuccess) {
        printSuccess = await onPrintBill(orderTotal);
        if (printSuccess) {
          toast.success('Tab bill printed');
        } else {
          toast.warning('Print may have failed', {
            description: 'Check printer connection'
          });
        }
      }

      // Mark tab as paid
      if (printSuccess) {
        const success = await onPayTab(selectedTab);
        if (success) {
          // Check if there are remaining active tabs
          const remainingTabs = customerTabs.filter(
            t => t.status === 'active' && t.id !== selectedTab
          );

          if (remainingTabs.length === 0) {
            // All tabs paid - complete the order
            await onCompleteOrder();
            toast.success('Order completed', {
              description: 'All tabs paid - table is now available'
            });
          } else {
            toast.success('Tab paid', {
              description: `${remainingTabs.length} tab(s) remaining`
            });
            setSelectedTab(null); // Reset to "All" view
          }
        }
      }
    } catch (error) {
      console.error('Error in handlePayTabOnly:', error);
      toast.error('Failed to process tab payment');
    } finally {
      setIsPrinting(false);
    }
  };

  // Get active customer tabs
  const activeTabs = customerTabs.filter(tab => tab.status === 'active');

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between py-3 border-b mb-4"
        style={{ borderColor: QSAITheme.border.light }}
      >
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold" style={{ color: QSAITheme.text.primary }}>
            Bill Preview
          </span>

          {/* Split bill selector (if multiple tabs) */}
          {activeTabs.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={!selectedTab ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTab(null)}
                style={{
                  height: '32px',
                  backgroundColor: !selectedTab ? QSAITheme.purple.primary : 'transparent',
                  borderColor: !selectedTab ? QSAITheme.purple.primary : QSAITheme.border.medium,
                  color: !selectedTab ? 'white' : QSAITheme.text.muted,
                  borderRadius: '16px'
                }}
              >
                <Users size={14} className="mr-1" />
                All ({enrichedItems.length})
              </Button>

              {activeTabs.map(tab => {
                const tabItemCount = enrichedItems.filter(i => i.customer_tab_id === tab.id).length;
                const isSelected = selectedTab === tab.id;

                return (
                  <Button
                    key={tab.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTab(tab.id!)}
                    style={{
                      height: '32px',
                      backgroundColor: isSelected ? QSAITheme.purple.primary : 'transparent',
                      borderColor: isSelected ? QSAITheme.purple.primary : QSAITheme.border.medium,
                      color: isSelected ? 'white' : QSAITheme.text.muted,
                      borderRadius: '16px'
                    }}
                  >
                    {tab.tab_name} ({tabItemCount})
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ color: QSAITheme.text.primary }}>
            Total: £{orderTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Receipt Preview - Scrollable */}
      <div
        className="flex-1 overflow-y-auto flex justify-center py-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${QSAITheme.purple.primary} transparent`
        }}
      >
        {displayItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Receipt className="h-16 w-16 mx-auto" style={{ color: QSAITheme.text.muted }} />
              <p className="text-lg" style={{ color: QSAITheme.text.muted }}>
                No items to bill
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Footer Actions */}
      <div
        className="flex items-center justify-between py-4 border-t"
        style={{ borderColor: QSAITheme.border.light }}
      >
        <Button
          variant="outline"
          onClick={onNavigateToReview}
          disabled={isPrinting}
          style={{
            borderColor: QSAITheme.border.medium,
            color: QSAITheme.text.secondary,
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Review
        </Button>

        <div className="flex items-center gap-3">
          {/* Pay This Tab Only - shown when a specific tab is selected */}
          {selectedTab && onPayTab && (
            <Button
              onClick={handlePayTabOnly}
              disabled={isPrinting || displayItems.length === 0}
              variant="outline"
              className="min-w-[180px]"
              style={{
                borderColor: QSAITheme.purple.primary,
                color: QSAITheme.purple.primary,
                backgroundColor: 'transparent',
              }}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay This Tab (£{orderTotal.toFixed(2)})
                </>
              )}
            </Button>
          )}

          {/* Print Final Bill - completes entire order */}
          <Button
            onClick={handlePrintAndComplete}
            disabled={isPrinting || displayItems.length === 0}
            className="min-w-[200px]"
            style={{
              backgroundColor: isPrinting ? QSAITheme.background.tertiary : QSAITheme.purple.primary,
              color: 'white',
              boxShadow: isPrinting ? 'none' : `0 4px 8px ${QSAITheme.purple.glow}`,
            }}
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Print Final Bill
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DineInBillView;
