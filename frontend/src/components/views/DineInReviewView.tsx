/**
 * DineInReviewView - Order review and management view
 *
 * Works on PERSISTED ITEMS (database):
 * - 40/60 split layout: Item Controls (left) | Thermal Kitchen Preview (right)
 * - Item management: quantity, delete, customize, assign to tab
 * - View modes: category / customer (in left panel)
 * - "Reprint Kitchen Copy" button prints to thermal printer (brand purple)
 * - CTA: "Continue to Bill" navigates to bill view
 * - Secondary: "Add More Items" returns to add items view
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRight,
  Plus,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  User,
  Utensils,
  X,
  Printer,
  Loader2,
  Send,
} from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { CompactDineInItemRow } from 'components/CompactDineInItemRow';
import ThermalReceiptDisplay from 'components/ThermalReceiptDisplay';
import { useTemplateAssignments } from 'utils/useTemplateAssignments';
import {
  isRasterPrintAvailable,
  captureReceiptAsImage,
} from 'utils/electronPrintService';
import { generateDisplayNameForReceipt } from 'utils/menuHelpers';
import { DineInKitchenPreviewModal } from 'components/DineInKitchenPreviewModal';
import { toast } from 'sonner';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
  sent_to_kitchen_qty?: number; // Track quantity already sent to kitchen for delta printing
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

interface DineInReviewViewProps {
  // Persisted items (from useDineInOrder)
  enrichedItems: EnrichedDineInOrderItem[];
  enrichedLoading: boolean;
  enrichedError: string | null;

  // Customer tabs
  customerTabs: CustomerTab[];

  // Table context for kitchen preview
  tableNumber?: number | null;
  guestCount?: number;

  // Item operations
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onDeleteItem: (itemId: string) => void;
  onCustomizeItem: (item: EnrichedDineInOrderItem) => void;
  onAssignItemToTab?: (itemId: string, tabId: string | null) => void;

  // Navigation
  onNavigateToBill: () => void;
  onNavigateToAddItems: () => void;

  // Optional: kitchen operations (deprecated - now handled by Reprint button)
  onSendToKitchen?: () => Promise<void>;
}

export function DineInReviewView({
  enrichedItems,
  enrichedLoading,
  enrichedError,
  customerTabs,
  tableNumber,
  guestCount = 1,
  onUpdateQuantity,
  onDeleteItem,
  onCustomizeItem,
  onAssignItemToTab,
  onNavigateToBill,
  onNavigateToAddItems,
  onSendToKitchen,
}: DineInReviewViewProps) {
  // Menu store for category lookups
  const categories = useRealtimeMenuStore(state => state.categories);
  const categoriesMap = useMemo(() =>
    Object.fromEntries(categories.map(cat => [cat.id, cat])), [categories]);

  // View state
  const [viewMode, setViewMode] = useState<'category' | 'customer'>('category');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedTabs, setCollapsedTabs] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);
  const [showDeltaPreviewModal, setShowDeltaPreviewModal] = useState(false);

  // Refs
  const quantityTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const receiptRef = useRef<HTMLDivElement>(null);

  // Load kitchen template ID for thermal preview
  const { getKitchenTemplateId } = useTemplateAssignments();
  const [kitchenTemplateId, setKitchenTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      const templateId = await getKitchenTemplateId('DINE-IN');
      setKitchenTemplateId(templateId);
    };
    loadTemplate();
  }, [getKitchenTemplateId]);

  // Calculate totals
  const totalItemCount = enrichedItems.length;
  const subtotal = useMemo(() => {
    return enrichedItems.reduce((sum, item) => {
      const itemTotal = item.line_total ?? (item.unit_price * item.quantity);
      return sum + itemTotal;
    }, 0);
  }, [enrichedItems]);

  // Calculate delta items (items with quantity > sent_to_kitchen_qty)
  // These are items that need to be sent to kitchen when "Send Updates" is clicked
  const deltaItems = useMemo(() => {
    return enrichedItems
      .filter(item => item.quantity > (item.sent_to_kitchen_qty || 0))
      .map(item => ({
        ...item,
        // Calculate the delta quantity (new items to send)
        deltaQuantity: item.quantity - (item.sent_to_kitchen_qty || 0)
      }));
  }, [enrichedItems]);

  const hasDeltaItems = deltaItems.length > 0;

  // Sort all enriched items by category display_order, then by item display_order
  // This sorted list is used for both the left panel categories and the kitchen preview
  const sortedEnrichedItems = useMemo(() => {
    return [...enrichedItems].sort((a, b) => {
      // First sort by category display_order
      const catA = a.category_id ? categoriesMap[a.category_id] : null;
      const catB = b.category_id ? categoriesMap[b.category_id] : null;
      const catOrderA = catA?.display_order ?? 999;
      const catOrderB = catB?.display_order ?? 999;

      if (catOrderA !== catOrderB) {
        return catOrderA - catOrderB;
      }

      // Then sort by item display_order within category
      return (a.display_order ?? 999) - (b.display_order ?? 999);
    });
  }, [enrichedItems, categoriesMap]);

  // Group items by category, sorted by category display_order
  const itemsByCategory = useMemo(() => {
    // First, group items by category_id (using name as key for display)
    const groups: Record<string, {
      categoryId: string | null;
      displayOrder: number;
      items: EnrichedDineInOrderItem[];
    }> = {};

    enrichedItems.forEach(item => {
      const categoryName = item.category_name || 'Uncategorized';
      const categoryId = item.category_id;

      if (!groups[categoryName]) {
        // Get display_order from the categories store
        const category = categoryId ? categoriesMap[categoryId] : null;
        const displayOrder = category?.display_order ?? 999; // Uncategorized goes last

        groups[categoryName] = {
          categoryId,
          displayOrder,
          items: []
        };
      }
      groups[categoryName].items.push(item);
    });

    // Sort categories by display_order, then sort items within each category
    const sortedEntries = Object.entries(groups)
      .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
      .map(([name, data]) => {
        // Sort items within category by their display_order
        const sortedItems = [...data.items].sort((a, b) =>
          (a.display_order ?? 999) - (b.display_order ?? 999)
        );
        return [name, sortedItems] as [string, EnrichedDineInOrderItem[]];
      });

    return Object.fromEntries(sortedEntries);
  }, [enrichedItems, categoriesMap]);

  // Group items by customer tab
  const itemsByTab = useMemo(() => {
    const groups: Record<string, EnrichedDineInOrderItem[]> = {
      unassigned: [],
    };
    customerTabs.forEach(tab => {
      groups[tab.id!] = [];
    });
    enrichedItems.forEach(item => {
      const tabId = item.customer_tab_id || 'unassigned';
      if (!groups[tabId]) {
        groups[tabId] = [];
      }
      groups[tabId].push(item);
    });
    return groups;
  }, [enrichedItems, customerTabs]);

  // Map items to receipt format for thermal preview (uses sorted items for correct section order)
  const mapToReceiptOrderData = useMemo(() => {
    return {
      orderId: `KITCHEN-${tableNumber}-${Date.now()}`,
      orderNumber: `T${tableNumber}-${Date.now().toString().slice(-6)}`,
      orderType: 'DINE-IN' as const,
      tableNumber: tableNumber?.toString(),
      guestCount: guestCount,
      items: sortedEnrichedItems.map(item => {
        const displayName = generateDisplayNameForReceipt(
          item.item_name,
          item.variant_name || undefined,
          item.protein_type || undefined
        );

        return {
          id: item.id,
          name: displayName,
          price: item.unit_price,
          quantity: item.quantity,
          variant: item.variant_name ? {
            id: item.variant_id || item.id,
            name: item.variant_name,
            price_adjustment: 0
          } : undefined,
          customizations: item.customizations?.map((c: any) => ({
            id: c.customization_id || `mod-${Date.now()}`,
            name: c.name,
            price: c.price_adjustment || 0
          })) || [],
          instructions: item.notes || undefined,
          // ✅ Category tracking for section separator support in ThermalPreview
          category_id: item.category_id,
          menu_item_id: item.menu_item_id
        };
      }),
      subtotal: subtotal,
      serviceCharge: 0,
      deliveryFee: 0,
      total: subtotal,
      timestamp: new Date().toISOString()
    };
  }, [sortedEnrichedItems, tableNumber, guestCount, subtotal]);

  // Handle debounced quantity update
  const handleDebouncedQuantityUpdate = useCallback((itemId: string, newQuantity: number) => {
    // Clear existing timeout for this item
    if (quantityTimeoutRef.current[itemId]) {
      clearTimeout(quantityTimeoutRef.current[itemId]);
    }

    // Set new timeout
    quantityTimeoutRef.current[itemId] = setTimeout(() => {
      onUpdateQuantity(itemId, newQuantity);
      delete quantityTimeoutRef.current[itemId];
    }, 300);
  }, [onUpdateQuantity]);

  // Toggle category collapse
  const toggleCategory = useCallback((categoryName: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  // Toggle tab collapse
  const toggleTab = useCallback((tabId: string) => {
    setCollapsedTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  }, []);

  // Calculate subtotal for a group of items
  const calculateGroupSubtotal = (items: EnrichedDineInOrderItem[]): number => {
    return items.reduce((sum, item) => {
      const itemTotal = item.line_total ?? (item.unit_price * item.quantity);
      return sum + itemTotal;
    }, 0);
  };

  // Handle reprint kitchen copy
  const handleReprintKitchenCopy = useCallback(async () => {
    if (enrichedItems.length === 0) {
      toast.info('No items to print');
      return;
    }

    setIsPrinting(true);

    try {
      // Capture receipt image for WYSIWYG printing
      let capturedImageData: string | null = null;
      if (isRasterPrintAvailable() && receiptRef.current) {
        capturedImageData = await captureReceiptAsImage(receiptRef.current, 80);
      }

      // Print via Electron raster API
      if (capturedImageData && window.electronAPI?.printReceiptRaster) {
        const printResult = await window.electronAPI.printReceiptRaster({
          imageData: capturedImageData,
          paperWidth: 80
        });

        if (printResult.success) {
          toast.success('Kitchen copy printed', {
            description: `Sent to ${printResult.printer || 'thermal printer'}`
          });
        } else {
          toast.warning('Print may have failed', {
            description: printResult.error || 'Check printer connection'
          });
        }
      } else {
        // Fallback: use legacy print method if available
        if (onSendToKitchen) {
          await onSendToKitchen();
          toast.success('Kitchen copy sent');
        } else {
          toast.warning('Printing not available', {
            description: 'No printer connection detected'
          });
        }
      }
    } catch (error) {
      console.error('Error printing kitchen copy:', error);
      toast.error('Failed to print kitchen copy');
    } finally {
      setIsPrinting(false);
    }
  }, [enrichedItems.length, onSendToKitchen]);

  // Convert delta items to OrderItem format for DineInKitchenPreviewModal
  const deltaOrderItems = useMemo(() => {
    return deltaItems.map(item => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      variant_id: item.variant_id || null,
      name: item.item_name,
      price: item.unit_price,
      quantity: item.deltaQuantity, // Use delta quantity, not full quantity
      variantName: item.variant_name || undefined,
      protein_type: item.protein_type || undefined,
      notes: item.notes || undefined,
      image_url: item.image_url || undefined,
      modifiers: item.customizations?.map((c: any) => ({
        id: c.customization_id,
        name: c.name,
        price: c.price_adjustment || 0,
      })) || [],
    }));
  }, [deltaItems]);

  // Handle "Send Updates to Kitchen" button click
  const handleSendUpdates = useCallback(() => {
    if (!hasDeltaItems) {
      toast.info('No updates to send');
      return;
    }
    setShowDeltaPreviewModal(true);
  }, [hasDeltaItems]);

  // Handle save only from delta preview modal (just close modal)
  const handleDeltaSaveOnly = useCallback(async () => {
    // Delta items are already persisted in the database
    // This just closes the modal without printing
    setShowDeltaPreviewModal(false);
    toast.success('Updates saved');
  }, []);

  // Handle save and print from delta preview modal
  const handleDeltaSaveAndPrint = useCallback(async () => {
    // Call the parent's onSendToKitchen which will:
    // 1. Mark items as sent (update sent_to_kitchen_at)
    // 2. Update sent_to_kitchen_qty to current quantities
    // 3. Print the kitchen ticket
    if (onSendToKitchen) {
      await onSendToKitchen();
    }
    setShowDeltaPreviewModal(false);
    toast.success('Updates sent to kitchen', {
      description: 'Kitchen ticket printed'
    });
  }, [onSendToKitchen]);

  // Render loading state ONLY on initial load (when we have no items yet)
  // For background refreshes (quantity updates, deletes), keep showing current items
  // This prevents the "page skip" when user clicks +/- quantity buttons
  if (enrichedLoading && enrichedItems.length === 0) {
    return (
      <div className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-lg p-4"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.medium}`,
              }}
            >
              <Skeleton
                height={60}
                baseColor={QSAITheme.background.secondary}
                highlightColor={QSAITheme.background.panel}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (enrichedError) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="text-center space-y-4">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <X className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Items</h3>
            <p className="text-sm text-red-400">{enrichedError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state
  if (totalItemCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="text-center space-y-4">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(91, 33, 182, 0.1)',
              border: '2px solid rgba(91, 33, 182, 0.3)',
            }}
          >
            <ClipboardList
              className="h-8 w-8"
              style={{ color: QSAITheme.purple.primary }}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">No Items Yet</h3>
            <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
              Add items to this order to begin.
            </p>
          </div>
          <Button
            onClick={onNavigateToAddItems}
            className="mt-4"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
              border: `1px solid ${QSAITheme.purple.light}`,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex-1 flex flex-col min-h-0 px-6 pb-4">
      {/* 40/60 Split Layout - Controls LEFT, Preview RIGHT */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* LEFT PANEL (40%): Item Controls */}
        <div
          className="flex flex-col"
          style={{
            width: '40%',
            minWidth: '320px',
            borderRadius: '8px',
            border: `1px solid ${QSAITheme.border.light}`,
            backgroundColor: QSAITheme.background.secondary,
            overflow: 'hidden'
          }}
        >
          {/* Items Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: `1px solid ${QSAITheme.border.medium}`,
              backgroundColor: QSAITheme.background.panel,
            }}
          >
            <span className="font-semibold" style={{ fontSize: '15px', color: QSAITheme.text.primary }}>
              Order Items
            </span>

            {/* View Mode Toggle */}
            <div
              className="flex items-center rounded-lg p-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${QSAITheme.border.light}`,
              }}
            >
              <button
                onClick={() => setViewMode('category')}
                className="px-2 py-1 rounded text-xs font-medium transition-all"
                style={{
                  background: viewMode === 'category' ? QSAITheme.purple.primary : 'transparent',
                  color: viewMode === 'category' ? 'white' : QSAITheme.text.muted,
                }}
              >
                Category
              </button>
              <button
                onClick={() => setViewMode('customer')}
                className="px-2 py-1 rounded text-xs font-medium transition-all"
                style={{
                  background: viewMode === 'customer' ? '#3B82F6' : 'transparent',
                  color: viewMode === 'customer' ? 'white' : QSAITheme.text.muted,
                }}
              >
                Customer
              </button>
            </div>
          </div>

          {/* Items Content - Scrollable */}
          <ScrollArea className="flex-1 px-3">
            <div className="py-3">
              {viewMode === 'category' ? (
                /* Category View */
                <div className="space-y-3">
                  {Object.entries(itemsByCategory).map(([categoryName, items]) => {
                    const isCollapsed = collapsedCategories.has(categoryName);
                    const categoryTotal = calculateGroupSubtotal(items);

                    return (
                      <div key={categoryName}>
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryName)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-all hover:bg-white/5"
                          style={{
                            background: 'rgba(91, 33, 182, 0.08)',
                            border: `1px solid ${QSAITheme.border.accent}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <ChevronDown className="h-3.5 w-3.5" style={{ color: QSAITheme.purple.light }} />
                            ) : (
                              <ChevronUp className="h-3.5 w-3.5" style={{ color: QSAITheme.purple.light }} />
                            )}
                            <h3
                              className="text-xs font-bold uppercase tracking-wide"
                              style={{ color: QSAITheme.text.primary }}
                            >
                              {categoryName}
                            </h3>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(91, 33, 182, 0.2)',
                                color: QSAITheme.purple.light,
                              }}
                            >
                              {items.length}
                            </span>
                          </div>
                          <p className="text-xs font-semibold" style={{ color: QSAITheme.text.secondary }}>
                            £{categoryTotal.toFixed(2)}
                          </p>
                        </button>

                        {/* Category Items */}
                        {!isCollapsed && (
                          <div className="space-y-1">
                            {items.map((item) => (
                              <CompactDineInItemRow
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleDebouncedQuantityUpdate}
                                onDeleteItem={onDeleteItem}
                                onCustomizeItem={onCustomizeItem}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Customer View */
                <div className="space-y-3">
                  {/* Unassigned items */}
                  {itemsByTab['unassigned']?.length > 0 && (
                    <div
                      className="rounded-lg overflow-hidden"
                      style={{
                        background: QSAITheme.background.panel,
                        border: `1px solid ${QSAITheme.border.light}`,
                      }}
                    >
                      <button
                        onClick={() => toggleTab('unassigned')}
                        className="w-full px-3 py-2 flex items-center justify-between"
                        style={{
                          background: 'rgba(249, 115, 22, 0.05)',
                          borderBottom: `1px solid ${QSAITheme.border.light}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {collapsedTabs.has('unassigned') ? (
                            <ChevronDown className="h-3.5 w-3.5" style={{ color: '#F97316' }} />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5" style={{ color: '#F97316' }} />
                          )}
                          <Utensils className="h-4 w-4" style={{ color: '#F97316' }} />
                          <h3 className="text-sm font-semibold text-white">Table Items</h3>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}
                          >
                            {itemsByTab['unassigned'].length}
                          </span>
                        </div>
                        <p className="text-xs font-semibold" style={{ color: QSAITheme.text.secondary }}>
                          £{calculateGroupSubtotal(itemsByTab['unassigned']).toFixed(2)}
                        </p>
                      </button>
                      {!collapsedTabs.has('unassigned') && (
                        <div className="p-2 space-y-1">
                          {itemsByTab['unassigned'].map((item) => (
                            <CompactDineInItemRow
                              key={item.id}
                              item={item}
                              onUpdateQuantity={handleDebouncedQuantityUpdate}
                              onDeleteItem={onDeleteItem}
                              onCustomizeItem={onCustomizeItem}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer tabs */}
                  {customerTabs
                    .filter(tab => tab.status === 'active')
                    .map((tab) => {
                      const tabItems = itemsByTab[tab.id!] || [];
                      if (tabItems.length === 0) return null;

                      const isCollapsed = collapsedTabs.has(tab.id!);

                      return (
                        <div
                          key={tab.id}
                          className="rounded-lg overflow-hidden"
                          style={{
                            background: QSAITheme.background.panel,
                            border: `1px solid ${QSAITheme.border.light}`,
                          }}
                        >
                          <button
                            onClick={() => toggleTab(tab.id!)}
                            className="w-full px-3 py-2 flex items-center justify-between"
                            style={{
                              background: 'rgba(168, 85, 247, 0.05)',
                              borderBottom: `1px solid ${QSAITheme.border.light}`,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronDown className="h-3.5 w-3.5" style={{ color: '#A855F7' }} />
                              ) : (
                                <ChevronUp className="h-3.5 w-3.5" style={{ color: '#A855F7' }} />
                              )}
                              <User className="h-4 w-4" style={{ color: '#A855F7' }} />
                              <h3 className="text-sm font-semibold text-white">{tab.tab_name}</h3>
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}
                              >
                                {tabItems.length}
                              </span>
                            </div>
                            <p className="text-xs font-semibold" style={{ color: QSAITheme.text.secondary }}>
                              £{calculateGroupSubtotal(tabItems).toFixed(2)}
                            </p>
                          </button>
                          {!isCollapsed && (
                            <div className="p-2 space-y-1">
                              {tabItems.map((item) => (
                                <CompactDineInItemRow
                                  key={item.id}
                                  item={item}
                                  onUpdateQuantity={handleDebouncedQuantityUpdate}
                                  onDeleteItem={onDeleteItem}
                                  onCustomizeItem={onCustomizeItem}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Items Footer - Total */}
          <div
            className="px-4 py-3"
            style={{
              borderTop: `1px solid ${QSAITheme.border.medium}`,
              backgroundColor: QSAITheme.background.panel,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: QSAITheme.text.primary }}>Total</span>
              <span className="text-lg font-bold" style={{ color: QSAITheme.text.primary }}>
                £{subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (60%): Thermal Kitchen Copy Preview */}
        <div
          className="flex flex-col"
          style={{
            width: '60%',
            minWidth: '400px',
            borderRadius: '8px',
            border: `1px solid ${QSAITheme.border.light}`,
            backgroundColor: QSAITheme.background.secondary,
            overflow: 'hidden'
          }}
        >
          {/* Preview Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderBottom: `1px solid ${QSAITheme.border.medium}`,
              backgroundColor: QSAITheme.background.panel,
            }}
          >
            <span className="font-semibold" style={{ fontSize: '15px', color: QSAITheme.text.primary }}>
              Kitchen Copy Preview
            </span>
            <Badge
              style={{
                height: '24px',
                paddingLeft: '10px',
                paddingRight: '10px',
                backgroundColor: QSAITheme.purple.primary,
                color: 'white',
                borderRadius: '12px',
                fontSize: '11px'
              }}
            >
              {totalItemCount} items
            </Badge>
          </div>

          {/* Thermal Preview - Scrollable */}
          <ScrollArea className="flex-1">
            <div className="flex justify-center py-4">
              <ThermalReceiptDisplay
                ref={receiptRef}
                orderMode="DINE-IN"
                templateId={kitchenTemplateId}
                orderData={mapToReceiptOrderData}
                paperWidth={80}
                showZoomControls={false}
                className="shadow-2xl"
                receiptFormat="kitchen"
              />
            </div>
          </ScrollArea>

          {/* Print Actions */}
          <div
            className="px-4 py-3 space-y-2"
            style={{
              borderTop: `1px solid ${QSAITheme.border.medium}`,
              backgroundColor: QSAITheme.background.panel,
            }}
          >
            {/* Send Updates Button - Only visible when there are delta items */}
            {hasDeltaItems && (
              <Button
                onClick={handleSendUpdates}
                disabled={isPrinting}
                className="w-full"
                style={{
                  backgroundColor: QSAITheme.purple.primary,
                  color: 'white',
                  boxShadow: `0 4px 8px ${QSAITheme.purple.glow}`,
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Updates to Kitchen ({deltaItems.length} item{deltaItems.length !== 1 ? 's' : ''})
              </Button>
            )}

            {/* Reprint Full Kitchen Copy Button */}
            <Button
              onClick={handleReprintKitchenCopy}
              disabled={isPrinting || totalItemCount === 0}
              className="w-full"
              variant={hasDeltaItems ? "outline" : "default"}
              style={hasDeltaItems ? {
                borderColor: QSAITheme.border.medium,
                color: QSAITheme.text.secondary,
                backgroundColor: 'transparent',
              } : {
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
                  <Printer className="w-4 h-4 mr-2" />
                  Reprint Kitchen Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className="flex items-center justify-between py-4 border-t mt-4"
        style={{ borderColor: QSAITheme.border.light }}
      >
        <Button
          variant="outline"
          onClick={onNavigateToAddItems}
          style={{
            borderColor: QSAITheme.border.medium,
            color: QSAITheme.text.secondary,
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add More Items
        </Button>

        <Button
          onClick={onNavigateToBill}
          disabled={totalItemCount === 0}
          style={{
            backgroundColor: QSAITheme.purple.primary,
            color: 'white',
            boxShadow: `0 4px 8px ${QSAITheme.purple.glow}`,
          }}
        >
          Continue to Bill
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>

    {/* Delta Printing Modal - Shows only items with quantity changes */}
    <DineInKitchenPreviewModal
      isOpen={showDeltaPreviewModal}
      onClose={() => setShowDeltaPreviewModal(false)}
      orderItems={deltaOrderItems}
      tableNumber={tableNumber || null}
      guestCount={guestCount}
      onSaveOnly={handleDeltaSaveOnly}
      onSaveAndPrint={handleDeltaSaveAndPrint}
    />
    </>
  );
}

export default DineInReviewView;
