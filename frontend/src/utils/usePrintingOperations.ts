import { useCallback, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from './supabaseClient';
import type { OrderType } from './customerTypes';
import type { OrderItem } from './types';
import type { CustomerData } from './useCustomerFlow';
import { useTemplateAssignments } from './useTemplateAssignments';
import { getElectronHeaders } from './electronDetection';
import brain from 'brain';
import {
  isElectronPrintAvailable,
  isESCPOSPrintAvailable,
  printKitchenTicketESCPOS,
  printCustomerReceiptESCPOS,
  type KitchenTicketData,
  type CustomerReceiptData,
} from './electronPrintService';
import { useRealtimeMenuStoreCompat } from './realtimeMenuStoreCompat';
import { findRootSection, FIXED_SECTIONS, SECTION_INDICATORS, SectionId } from './sectionMapping';
import { saveReceiptToHistory } from 'components/pos/ReprintDialog';

/**
 * Hook: usePrintingOperations
 *
 * RESPONSIBILITY:
 * Manages all printing operations in POSDesktop using HYBRID print strategy:
 * - PRIMARY: Direct Electron IPC printing (instant, for desktop app)
 * - FALLBACK: Supabase queue (for web app or when Electron unavailable)
 *
 * HYBRID PRINTING STRATEGY:
 * 1. Check if Electron print API is available
 * 2. If YES: Print directly via ESC/POS or Raster commands
 * 3. If NO (or error): Fall back to Supabase queue
 *
 * DATA FLOW:
 * Electron path: User clicks print → ESC/POS commands → Direct to Epson TM-T20III
 * Web path: User clicks print → Supabase RPC → print_jobs table → External print service
 *
 * TEMPLATE ASSIGNMENT INTEGRATION:
 * - Each order type can have assigned receipt templates
 * - Templates defined in ThermalReceiptDesignerV2 page
 * - Template selection managed via POSSettings
 * - Supports different layouts for kitchen vs customer receipts
 *
 * PRINTING MODES:
 * - Kitchen Ticket: Item-focused, includes modifiers, notes, prep instructions
 * - Customer Receipt: Price-focused, includes totals, payment info, branding
 * - Bill: Similar to receipt but for dine-in bill requests
 *
 * KEY OPERATIONS:
 * - handlePrintKitchenTicket(): Prints to kitchen with cooking details
 * - handlePrintReceipt(): Prints customer-facing receipt with prices
 * - handlePrintBill(): Prints bill for dine-in tables
 * - Prevents duplicate prints via lastPrintedAt timestamp tracking
 *
 * STATE TRACKING:
 * - isPrinting: Prevents concurrent print operations
 * - lastPrintedAt: Timestamp of last print (prevents accidental duplicates)
 *
 * @param orderType - Current order type
 * @param orderItems - Items to print on receipt
 * @param customerData - Customer info for receipt header
 * @param selectedTableNumber - Table number for dine-in orders
 * @param guestCount - Guest count for dine-in orders
 * @returns Printing handlers and operation state
 */
export function usePrintingOperations(
  orderType: OrderType,
  orderItems: OrderItem[],
  customerData: CustomerData,
  selectedTableNumber: number | null,
  guestCount: number
) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastPrintedAt, setLastPrintedAt] = useState<Date | null>(null);

  // Use validated template assignments hook
  const templateAssignments = useTemplateAssignments();

  // Get categories from realtime store for section mapping
  const { categories, menuItems } = useRealtimeMenuStoreCompat({ context: 'pos' });

  // Build item to category lookup
  const itemToCategoryMap = useMemo(() => {
    const map: {[menuItemId: string]: string} = {};
    menuItems.forEach(item => {
      if (item.id && item.category_id) {
        map[item.id] = item.category_id;
      }
    });
    return map;
  }, [menuItems]);

  // Helper to get section info for an item
  // Supports "Serve With" override - when item is served with a different section
  const getSectionInfo = useCallback((item: OrderItem): {
    sectionNumber: number;
    sectionName: string;
    isOverride?: boolean;
    originalSectionId?: SectionId;
    originalSectionName?: string;
  } => {
    // Check for section override first (item served with different section)
    const overrideId = item.serveWithSectionId || item.serve_with_section_id;
    if (overrideId) {
      const overrideSection = FIXED_SECTIONS.find(s => s.uuid === overrideId);
      if (overrideSection) {
        // Find original section for indicator display
        const originalCategoryId = item.category_id || itemToCategoryMap[item.menu_item_id];
        const originalSection = originalCategoryId ? findRootSection(originalCategoryId, categories) : null;

        return {
          sectionNumber: overrideSection.order + 1,
          sectionName: overrideSection.name,
          isOverride: true,
          originalSectionId: originalSection?.id as SectionId | undefined,
          originalSectionName: originalSection?.name
        };
      }
    }

    // Get category_id from item or lookup via menu_item_id
    const categoryId = item.category_id || itemToCategoryMap[item.menu_item_id];
    if (!categoryId) {
      return { sectionNumber: 999, sectionName: '' };
    }

    // Use findRootSection to traverse category hierarchy
    const rootSection = findRootSection(categoryId, categories);
    if (rootSection) {
      return {
        sectionNumber: rootSection.order + 1, // 0-indexed to 1-indexed
        sectionName: rootSection.name
      };
    }

    return { sectionNumber: 999, sectionName: '' };
  }, [categories, itemToCategoryMap]);

  // ============================================================================
  // HELPER: Get Template Assignment for Order Mode
  // ============================================================================
  const getTemplateAssignment = useCallback(async (mode: OrderType) => {
    try {
      // Convert order type to API format (e.g., "DINE-IN" -> "DINE_IN")
      const apiOrderMode = mode.replace(/-/g, '_');

      const response = await brain.get_template_assignment({
        orderMode: apiOrderMode
      });
      const assignment = await response.json();

      // Handle null template IDs (database has NULL for some order modes)
      // Fallback to classic_restaurant template if no template assigned
      return {
        kitchenTemplateId: assignment.kitchen_template_id || 'classic_restaurant',
        customerTemplateId: assignment.customer_template_id || 'classic_restaurant'
      };
    } catch (error) {
      console.warn('⚠️ Failed to fetch template assignment, using defaults:', error);
      // Return default template IDs if fetch fails
      return {
        kitchenTemplateId: 'classic_restaurant',
        customerTemplateId: 'classic_restaurant'
      };
    }
  }, []);

  // ============================================================================
  // HELPER: Queue print job to Supabase (fallback)
  // ============================================================================
  const queuePrintJob = useCallback(async (jobData: any): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('create_print_job', jobData);

      if (error) {
        throw new Error(error.message || 'Failed to create print job');
      }

      if (data) {
        console.log('✅ Print job queued to Supabase:', data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to queue print job:', error);
      return false;
    }
  }, []);

  // ============================================================================
  // PRINT KITCHEN TICKET (HYBRID: Electron ESC/POS → Supabase Queue)
  // ============================================================================
  const handlePrintKitchen = useCallback(async (
    paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'
  ) => {
    if (orderItems.length === 0) {
      toast.error('No items to print');
      return false;
    }

    setIsPrinting(true);

    // Fetch template assignment for this order mode
    const { kitchenTemplateId } = await getTemplateAssignment(orderType);

    // Generate order number
    const orderNumber = `${orderType.charAt(0)}${Date.now().toString().slice(-6)}`;

    try {
      // =====================================================================
      // PRIMARY PATH: Direct Electron ESC/POS printing (production)
      // =====================================================================
      if (isESCPOSPrintAvailable()) {
        console.log('🖨️ [HYBRID] Electron ESC/POS available, printing directly...');

        const kitchenData: KitchenTicketData = {
          tableNumber: selectedTableNumber || undefined,
          guestCount: orderType === 'DINE-IN' ? guestCount : undefined,
          items: orderItems.map(item => {
            const sectionInfo = getSectionInfo(item);
            return {
              name: item.name,
              quantity: item.quantity,
              variantName: item.variantName || undefined,
              modifiers: item.modifiers?.map(m => m.name) || [],
              notes: item.notes || undefined,
              sectionNumber: sectionInfo.sectionNumber,
              sectionName: sectionInfo.sectionName
            };
          }),
          orderNumber,
          orderType,
          timestamp: new Date().toISOString(),
          paymentStatus // Include for PAID badge on takeaway kitchen tickets
        };

        const result = await printKitchenTicketESCPOS(kitchenData);

        if (result.success) {
          setLastPrintedAt(new Date());
          // Success - no toast, printer provides physical feedback
          console.log('✅ [HYBRID] Direct print successful:', result);
          return true;
        } else {
          // Direct print failed - fall through to queue
          console.warn('⚠️ [HYBRID] Direct print failed, trying queue fallback:', result.error);
        }
      } else {
        console.log('ℹ️ [HYBRID] Electron not available, using Supabase queue');
      }

      // =====================================================================
      // FALLBACK PATH: Supabase queue (web app or Electron failure)
      // =====================================================================
      const jobData = {
        p_job_type: 'KITCHEN_TICKET',
        p_order_data: {
          orderNumber,
          orderType,
          items: orderItems.map(item => ({
            name: item.name,
            variant_name: item.variantName || null,
            quantity: item.quantity,
            modifiers: item.modifiers?.map(m => m.name) || [],
            special_instructions: item.notes || null
          })),
          table: selectedTableNumber?.toString() || undefined,
          customerName: orderType !== 'DINE-IN' ? `${customerData.firstName} ${customerData.lastName}`.trim() : undefined,
          timestamp: new Date().toISOString(),
          template_id: kitchenTemplateId
        },
        p_printer_id: null,
        p_priority: 10
      };

      console.log('🖨️ [HYBRID] Queuing kitchen ticket to Supabase:', jobData);
      const queued = await queuePrintJob(jobData);

      if (queued) {
        setLastPrintedAt(new Date());
        // Success - no toast, print queue handles printing
        return true;
      } else {
        throw new Error('Failed to queue print job');
      }
    } catch (error: any) {
      console.error('❌ Error printing kitchen ticket:', error);
      toast.error(`Kitchen print failed: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderItems, orderType, selectedTableNumber, customerData, guestCount, getTemplateAssignment, queuePrintJob]);

  // ============================================================================
  // PRINT CUSTOMER RECEIPT (HYBRID: Electron ESC/POS → Supabase Queue)
  // ============================================================================
  const handlePrintReceipt = useCallback(async (
    orderTotal: number,
    paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'
  ) => {
    if (orderItems.length === 0) {
      toast.error('No items to print');
      return false;
    }

    setIsPrinting(true);

    // Fetch template assignment for this order mode
    const { customerTemplateId } = await getTemplateAssignment(orderType);

    // Generate order number
    const orderNumber = `${orderType.charAt(0)}${Date.now().toString().slice(-6)}`;

    try {
      // =====================================================================
      // PRIMARY PATH: Direct Electron ESC/POS printing (production)
      // =====================================================================
      if (isESCPOSPrintAvailable()) {
        console.log('🖨️ [HYBRID] Electron ESC/POS available, printing receipt directly...');

        const receiptItems = orderItems.map(item => {
          let itemPrice = item.price;
          if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(mod => {
              itemPrice += mod.price_adjustment || 0;
            });
          }
          const sectionInfo = getSectionInfo(item);
          return {
            name: item.name,
            quantity: item.quantity,
            price: itemPrice,
            variantName: item.variantName || undefined,
            modifiers: item.modifiers?.map(m => ({
              name: m.name,
              price: m.price_adjustment || 0
            })) || [],
            sectionNumber: sectionInfo.sectionNumber,
            sectionName: sectionInfo.sectionName
          };
        });

        const customerData_: CustomerReceiptData = {
          items: receiptItems,
          subtotal: orderTotal,
          tax: orderTotal * 0.20,
          total: orderTotal * 1.20,
          orderNumber,
          orderType,
          tableNumber: selectedTableNumber || undefined,
          timestamp: new Date().toISOString(),
          paymentMethod: 'Card',
          customerName: orderType !== 'DINE-IN'
            ? `${customerData.firstName} ${customerData.lastName}`.trim()
            : undefined,
          paymentStatus
        };

        const result = await printCustomerReceiptESCPOS(customerData_);

        if (result.success) {
          setLastPrintedAt(new Date());
          // Success - no toast, printer provides physical feedback
          console.log('✅ [HYBRID] Direct receipt print successful:', result);
          // Save to receipt history for reprint functionality
          saveReceiptToHistory(customerData_, {
            orderNumber,
            orderType,
            total: customerData_.total,
            tableNumber: selectedTableNumber || undefined,
            customerName: customerData_.customerName,
            itemCount: orderItems.length
          });
          return true;
        } else {
          console.warn('⚠️ [HYBRID] Direct receipt print failed, trying queue fallback:', result.error);
        }
      } else {
        console.log('ℹ️ [HYBRID] Electron not available for receipt, using Supabase queue');
      }

      // =====================================================================
      // FALLBACK PATH: Supabase queue
      // =====================================================================
      const jobData = {
        p_job_type: 'CUSTOMER_RECEIPT',
        p_order_data: {
          orderNumber,
          orderType,
          items: orderItems.map(item => {
            let itemPrice = item.price;
            if (item.modifiers && item.modifiers.length > 0) {
              item.modifiers.forEach(mod => {
                itemPrice += mod.price_adjustment || 0;
              });
            }
            return {
              name: item.name,
              variant_name: item.variantName || null,
              quantity: item.quantity,
              unitPrice: itemPrice,
              total: itemPrice * item.quantity,
              modifiers: item.modifiers?.map(m => m.name) || []
            };
          }),
          tax: orderTotal * 0.20,
          deliveryFee: orderType === 'DELIVERY' ? 2.50 : 0,
          table: selectedTableNumber?.toString() || undefined,
          customerName: orderType !== 'DINE-IN' ? `${customerData.firstName} ${customerData.lastName}`.trim() : undefined,
          paymentMethod: 'Card',
          timestamp: new Date().toISOString(),
          template_id: customerTemplateId,
          paymentStatus
        },
        p_printer_id: null,
        p_priority: 5
      };

      console.log('🖨️ [HYBRID] Queuing customer receipt to Supabase:', jobData);
      const queued = await queuePrintJob(jobData);

      if (queued) {
        setLastPrintedAt(new Date());
        // Success - no toast, print queue handles printing
        return true;
      } else {
        throw new Error('Failed to queue print job');
      }
    } catch (error) {
      console.error('❌ Error printing receipt:', error);
      toast.error('Failed to print receipt');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, customerData, selectedTableNumber, getTemplateAssignment, queuePrintJob]);

  // ============================================================================
  // PRINT BILL (for dine-in) - HYBRID: Electron ESC/POS → Supabase Queue
  // ============================================================================
  const handlePrintBill = useCallback(async (
    orderTotal: number,
    paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'
  ) => {
    if (orderType !== 'DINE-IN') {
      toast.error('Bill printing is only for dine-in orders');
      return false;
    }

    if (orderItems.length === 0) {
      toast.error('No items to print');
      return false;
    }

    if (!selectedTableNumber) {
      toast.error('Table number is required for bill printing');
      return false;
    }

    setIsPrinting(true);

    try {
      // Fetch validated customer template for dine-in bills
      const customerTemplateId = await templateAssignments.getCustomerTemplateId('DINE-IN');

      // Calculate bill totals
      const subtotal = orderTotal;
      const serviceCharge = orderTotal * 0.125; // 12.5% service charge
      const tax = (orderTotal + serviceCharge) * 0.20; // 20% VAT on subtotal + service
      const total = subtotal + serviceCharge + tax;

      // Build items for receipt
      const receiptItems = orderItems.map(item => {
        let itemPrice = item.price;
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(mod => {
            itemPrice += mod.price_adjustment || 0;
          });
        }
        return {
          name: item.name,
          variant_name: item.variantName || null,
          quantity: item.quantity,
          unitPrice: itemPrice,
          total: itemPrice * item.quantity,
          modifiers: item.modifiers?.map(m => m.name) || []
        };
      });

      // =====================================================================
      // PRIMARY PATH: Direct Electron ESC/POS printing (production)
      // =====================================================================
      if (isESCPOSPrintAvailable()) {
        console.log('🖨️ [HYBRID] Electron ESC/POS available, printing bill directly...');

        const billData: CustomerReceiptData = {
          items: receiptItems.map((item, idx) => {
            const sectionInfo = getSectionInfo(orderItems[idx]);
            return {
              name: item.name,
              quantity: item.quantity,
              price: item.unitPrice,
              variantName: item.variant_name || undefined,
              sectionNumber: sectionInfo.sectionNumber,
              sectionName: sectionInfo.sectionName
            };
          }),
          subtotal,
          tax,
          total,
          orderNumber: `TABLE-${selectedTableNumber}-${Date.now()}`,
          orderType: 'DINE-IN',
          tableNumber: selectedTableNumber,
          timestamp: new Date().toISOString(),
          paymentMethod: 'Card',
          paymentStatus
        };

        const result = await printCustomerReceiptESCPOS(billData);

        if (result.success) {
          setLastPrintedAt(new Date());
          // Success - no toast, printer provides physical feedback
          console.log('✅ [HYBRID] Direct bill print successful:', result);
          // Save to receipt history for reprint functionality
          saveReceiptToHistory(billData, {
            orderNumber: billData.orderNumber || `T${selectedTableNumber}`,
            orderType: 'DINE-IN',
            total: billData.total,
            tableNumber: selectedTableNumber,
            itemCount: orderItems.length
          });
          return true;
        } else {
          console.warn('⚠️ [HYBRID] Direct bill print failed, trying queue fallback:', result.error);
        }
      } else {
        console.log('ℹ️ [HYBRID] Electron not available for bill, using Supabase queue');
      }

      // =====================================================================
      // FALLBACK PATH: Supabase queue
      // =====================================================================
      const jobData = {
        job_type: 'BILL',
        order_data: {
          orderNumber: `TABLE-${selectedTableNumber}-${Date.now()}`,
          orderType: 'DINE-IN',
          items: receiptItems,
          tax,
          deliveryFee: 0,
          tableNumber: selectedTableNumber,
          guestCount,
          subtotal,
          serviceCharge,
          total,
          timestamp: new Date().toISOString(),
          template_id: customerTemplateId || 'classic_restaurant',
          table: `Table ${selectedTableNumber}`,
          paymentMethod: 'Card',
          paymentStatus
        },
        printer_id: null,
        priority: 5
      };

      console.log('🖨️ [HYBRID] Queuing bill to Supabase for table:', selectedTableNumber);
      const queued = await queuePrintJob(jobData);

      if (queued) {
        setLastPrintedAt(new Date());
        // Success - no toast, print queue handles printing
        return true;
      } else {
        throw new Error('Failed to queue bill print job');
      }
    } catch (error) {
      console.error('❌ Error printing bill:', error);
      toast.error('Failed to print bill');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, selectedTableNumber, guestCount, templateAssignments, queuePrintJob]);

  // ============================================================================
  // PRINT BILL (DINE-IN) - Explicit items variant (uses provided items)
  // ============================================================================
  const handlePrintBillForItems = useCallback(async (
    items: OrderItem[],
    orderTotal: number,
    tableNumberOverride?: number | null,
    guestCountOverride?: number,
    paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'
  ) => {
    if (orderType !== 'DINE-IN') {
      toast.error('Bill printing is only for dine-in orders');
      return false;
    }

    if (items.length === 0) {
      toast.error('No items to print');
      return false;
    }

    const tableNumberToUse = tableNumberOverride ?? selectedTableNumber;
    if (!tableNumberToUse) {
      toast.error('Table number is required for bill printing');
      return false;
    }

    setIsPrinting(true);

    try {
      const customerTemplateId = await templateAssignments.getCustomerTemplateId('DINE-IN');

      const subtotal = orderTotal;
      const serviceCharge = orderTotal * 0.125;
      const tax = (orderTotal + serviceCharge) * 0.20;
      const total = subtotal + serviceCharge + tax;

      const receiptItems = items.map(item => {
        let itemPrice = item.price;
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(mod => {
            itemPrice += mod.price_adjustment ?? mod.price ?? 0;
          });
        }
        return {
          name: item.name,
          variant_name: item.variantName || null,
          quantity: item.quantity,
          unitPrice: itemPrice,
          total: itemPrice * item.quantity,
          modifiers: item.modifiers?.map(m => m.name) || []
        };
      });

      if (isESCPOSPrintAvailable()) {
        console.log('🖨️ [HYBRID] Electron ESC/POS available, printing bill directly...');

        const billData: CustomerReceiptData = {
          items: receiptItems.map((item, idx) => {
            const sectionInfo = getSectionInfo(items[idx]);
            return {
              name: item.name,
              quantity: item.quantity,
              price: item.unitPrice,
              variantName: item.variant_name || undefined,
              sectionNumber: sectionInfo.sectionNumber,
              sectionName: sectionInfo.sectionName
            };
          }),
          subtotal,
          tax,
          total,
          orderNumber: `TABLE-${tableNumberToUse}-${Date.now()}`,
          orderType: 'DINE-IN',
          tableNumber: tableNumberToUse,
          timestamp: new Date().toISOString(),
          paymentMethod: 'Card',
          paymentStatus
        };

        const result = await printCustomerReceiptESCPOS(billData);

        if (result.success) {
          setLastPrintedAt(new Date());
          console.log('✅ [HYBRID] Direct bill print successful:', result);
          saveReceiptToHistory(billData, {
            orderNumber: billData.orderNumber || `T${tableNumberToUse}`,
            orderType: 'DINE-IN',
            total: billData.total,
            tableNumber: tableNumberToUse,
            itemCount: items.length
          });
          return true;
        } else {
          console.warn('⚠️ [HYBRID] Direct bill print failed, trying queue fallback:', result.error);
        }
      } else {
        console.log('ℹ️ [HYBRID] Electron not available for bill, using Supabase queue');
      }

      const jobData = {
        job_type: 'BILL',
        order_data: {
          orderNumber: `TABLE-${tableNumberToUse}-${Date.now()}`,
          orderType: 'DINE-IN',
          items: receiptItems,
          tax,
          deliveryFee: 0,
          tableNumber: tableNumberToUse,
          guestCount: guestCountOverride ?? guestCount,
          subtotal,
          serviceCharge,
          total,
          timestamp: new Date().toISOString(),
          template_id: customerTemplateId || 'classic_restaurant',
          table: `Table ${tableNumberToUse}`,
          paymentMethod: 'Card',
          paymentStatus
        },
        printer_id: null,
        priority: 5
      };

      console.log('🖨️ [HYBRID] Queuing bill to Supabase for table:', tableNumberToUse);
      const queued = await queuePrintJob(jobData);

      if (queued) {
        setLastPrintedAt(new Date());
        return true;
      }
      throw new Error('Failed to queue bill print job');
    } catch (error) {
      console.error('❌ Error printing bill:', error);
      toast.error('Failed to print bill');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, selectedTableNumber, guestCount, templateAssignments, queuePrintJob, getSectionInfo]);

  // ============================================================================
  // SEND TO KITCHEN (HYBRID: Electron ESC/POS → Supabase Queue)
  // ============================================================================
  const handleSendToKitchen = useCallback(async () => {
    if (orderItems.length === 0) {
      toast.error('No items to send to kitchen');
      return false;
    }

    setIsPrinting(true);

    // Fetch template assignment for this order mode
    const { kitchenTemplateId } = await getTemplateAssignment(orderType);

    // Generate order number
    const orderNumber = `${orderType.charAt(0)}${Date.now().toString().slice(-6)}`;

    try {
      // =====================================================================
      // PRIMARY PATH: Direct Electron ESC/POS printing (production)
      // =====================================================================
      if (isESCPOSPrintAvailable()) {
        console.log('🖨️ [HYBRID] Sending to kitchen via Electron ESC/POS...');

        const kitchenData: KitchenTicketData = {
          tableNumber: selectedTableNumber || undefined,
          guestCount: orderType === 'DINE-IN' ? guestCount : undefined,
          items: orderItems.map(item => {
            const sectionInfo = getSectionInfo(item);
            return {
              name: item.name,
              quantity: item.quantity,
              variantName: item.variantName || undefined,
              modifiers: item.modifiers?.map(m => m.name) || [],
              notes: item.notes || undefined,
              sectionNumber: sectionInfo.sectionNumber,
              sectionName: sectionInfo.sectionName
            };
          }),
          orderNumber,
          orderType,
          timestamp: new Date().toISOString()
        };

        const result = await printKitchenTicketESCPOS(kitchenData);

        if (result.success) {
          setLastPrintedAt(new Date());
          // Success - no toast, kitchen display and printer provide feedback
          console.log('✅ [HYBRID] Direct kitchen send successful:', result);
          return true;
        } else {
          console.warn('⚠️ [HYBRID] Direct kitchen send failed, trying queue fallback:', result.error);
        }
      } else {
        console.log('ℹ️ [HYBRID] Electron not available, queuing to Supabase');
      }

      // =====================================================================
      // FALLBACK PATH: Supabase queue
      // =====================================================================
      const jobData = {
        job_type: 'KITCHEN_TICKET',
        order_data: {
          orderNumber,
          orderType,
          tableNumber: selectedTableNumber,
          items: orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            notes: item.notes || '',
            modifiers: item.modifiers || [],
            variant_name: item.variantName || null
          })),
          timestamp: new Date().toISOString(),
          guestCount: orderType === 'DINE-IN' ? guestCount : undefined,
          template_id: kitchenTemplateId
        },
        printer_id: null,
        priority: 5
      };

      console.log('🖨️ [HYBRID] Queuing kitchen ticket to Supabase:', jobData);
      const queued = await queuePrintJob(jobData);

      if (queued) {
        setLastPrintedAt(new Date());
        // Success - no toast, kitchen display provides feedback
        return true;
      } else {
        throw new Error('Failed to queue kitchen ticket');
      }
    } catch (error) {
      console.error('❌ Error sending to kitchen:', error);
      toast.error('Failed to send to kitchen');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [orderType, orderItems, selectedTableNumber, guestCount, getTemplateAssignment, queuePrintJob]);

  return {
    // State
    isPrinting,
    lastPrintedAt,

    // Handlers
    handlePrintKitchen,
    handlePrintReceipt,
    handlePrintBill,
    handlePrintBillForItems,
    handleSendToKitchen,
  };
}
