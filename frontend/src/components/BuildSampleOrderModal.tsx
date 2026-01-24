import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X, Edit2, Trash2, Users, ShoppingCart, Table, ArrowRight, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { DineInCategoryList } from './DineInCategoryList';
import { DineInMenuGrid } from './DineInMenuGrid';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { OrderItem, CustomerTabInfo } from '../utils/receiptDesignerTypes';
import { OrderItem as MenuOrderItem } from '../utils/menuTypes';
import { v4 as uuidv4 } from 'uuid';
import { CustomizeOrchestratorProvider } from './CustomizeOrchestrator';
import { ModalShell3Col } from 'components/ModalShell3Col';

interface LocalCustomerTab {
  id: string;
  name: string;
  items: OrderItem[];
}

// Add output type for Dine-In modal
interface DineInOrderOutput {
  orderItems: OrderItem[];
  tableNumber: string;
  guestCount: number;
  linkedTables: number[];
  customerTabs: CustomerTabInfo[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Update signature to return full Dine-In context
  onOrderBuilt: (output: DineInOrderOutput) => void;
  initialOrderItems?: OrderItem[];
}

/**
 * BuildSampleOrderModal - Local customer tab system for receipt designer
 * 
 * Allows building multi-customer sample orders without database writes.
 * Mimics DineInOrderModal UX with customer tabs and menu browsing.
 */
export function BuildSampleOrderModal({
  isOpen,
  onClose,
  onOrderBuilt,
  initialOrderItems = []
}: Props) {
  const { categories, menuItems } = useRealtimeMenuStore();

  // ✅ Initialize store when modal opens (matches POSDesktop pattern)
  useEffect(() => {
    if (!isOpen) return;

    const initializeMenu = async () => {
      const store = useRealtimeMenuStore.getState();

      // Only initialize if store is empty (check protein types too)
      if (store.categories.length === 0 || store.menuItems.length === 0 || store.proteinTypes.length === 0) {
        console.log('[BuildSampleOrderModal] Initializing menu store...');

        // ✅ Use store.initialize() instead of manually calling getPOSBundle
        // This loads ALL data: categories, items, variants, protein types, customizations
        await store.initialize();

        console.log('[BuildSampleOrderModal] Menu store initialized:', {
          categories: store.categories.length,
          items: store.menuItems.length,
          proteinTypes: store.proteinTypes.length,
          variants: store.itemVariants.length
        });
      }
    };

    initializeMenu();
  }, [isOpen]);

  // Local state for customer tabs
  const [customerTabs, setCustomerTabs] = useState<LocalCustomerTab[]>([
    { id: uuidv4(), name: 'Customer 1', items: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(customerTabs[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Two-step flow state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [guestCount, setGuestCount] = useState<string>('');
  const [linkedTablesInput, setLinkedTablesInput] = useState<string>('');

  // Helper to parse linked tables from comma-separated string
  const parseLinkedTables = (input: string): number[] => {
    return input
      .split(',')
      .map(t => parseInt(t.trim()))
      .filter(n => !isNaN(n) && n > 0);
  };

  // Category selection handler with store integration
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    // 1. Update local state for UI synchronization
    setSelectedCategory(categoryId);

    // 2. Update store to trigger filtering (matches POSDesktop pattern)
    useRealtimeMenuStore.getState().setSelectedMenuCategory(categoryId);
  }, []);

  // Continue to menu browsing step
  const handleContinueToMenu = () => {
    if (!tableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }
    if (!guestCount || parseInt(guestCount) < 1) {
      toast.error('Please enter number of guests');
      return;
    }
    setCurrentStep(2);
    toast.success(`Table ${tableNumber} initialized`);
  };

  // Get active tab
  const activeTab = customerTabs.find(tab => tab.id === activeTabId);

  // Calculate total items across all tabs
  const totalItems = customerTabs.reduce((sum, tab) => sum + tab.items.length, 0);

  // Add new customer tab
  const handleAddCustomerTab = () => {
    const newTabNumber = customerTabs.length + 1;
    const newTab: LocalCustomerTab = {
      id: uuidv4(),
      name: `Customer ${newTabNumber}`,
      items: []
    };
    setCustomerTabs([...customerTabs, newTab]);
    setActiveTabId(newTab.id);
    toast.success(`Added ${newTab.name}`);
  };

  // Remove customer tab
  const handleRemoveTab = (tabId: string) => {
    if (customerTabs.length === 1) {
      toast.error('Must have at least one customer tab');
      return;
    }

    const tabToRemove = customerTabs.find(t => t.id === tabId);
    setCustomerTabs(customerTabs.filter(tab => tab.id !== tabId));
    
    // Switch to first tab if removing active tab
    if (activeTabId === tabId) {
      setActiveTabId(customerTabs[0].id);
    }

    toast.success(`Removed ${tabToRemove?.name}`);
  };

  // Start renaming tab
  const handleStartRenaming = (tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditingName(currentName);
  };

  // Save renamed tab
  const handleSaveRename = () => {
    if (!editingTabId) return;
    
    setCustomerTabs(customerTabs.map(tab => 
      tab.id === editingTabId ? { ...tab, name: editingName.trim() || tab.name } : tab
    ));
    setEditingTabId(null);
    setEditingName('');
  };

  // Add menu item to active customer tab
  const handleAddToOrder = (menuItem: any) => {
    // ✅ DEBUG: Log what handleAddToOrder receives
    console.log('[BuildSampleOrderModal] handleAddToOrder received:', {
      menuItem,
      menuItem_keys: menuItem ? Object.keys(menuItem) : [],
      name: menuItem?.name,
      item_name: menuItem?.item_name,
      variant_name: menuItem?.variant_name,
      customizations: menuItem?.customizations,
      unit_price: menuItem?.unit_price,
      total_price: menuItem?.total_price
    });

    if (!activeTab) return;

    // ✅ FIELD MAPPING FIX: Handle both StaffVariantSelector format AND standard format
    // StaffVariantSelector uses: item_name, variant_name, unit_price, total_price, customizations
    // Standard format uses: name, variant.name, price, customizations

    const itemName = menuItem.item_name || menuItem.name;
    const variantName = menuItem.variant_name || menuItem.variantName;
    const basePrice = menuItem.unit_price || menuItem.price || menuItem.basePrice || 0;
    const quantity = menuItem.quantity || 1;
    const customizations = menuItem.customizations || [];

    // Calculate total including customizations
    // ✅ FIX: Always recalculate to use correctly mapped price_adjustment values
    const customizationsTotal = customizations.reduce(
      (sum: number, c: any) => sum + (c.price_adjustment || c.price || 0),
      0
    );
    const totalPrice = (basePrice + customizationsTotal) * quantity;

    // Get the full display name with pattern applied
    // ✅ Filter out "Standard" as it's a synthetic variant for single items
    const actualVariantName = variantName && variantName !== 'Standard' ? variantName : undefined;
    const hasVariant = !!menuItem.variant || !!menuItem.variant_id || !!actualVariantName;
    let displayName = itemName;
    let variantDisplayName: string | undefined = actualVariantName;

    if (hasVariant && menuItem.variant) {
      // Use variant_name if available (has pattern applied: prefix/suffix/infix/custom)
      if (menuItem.variant.variant_name && menuItem.variant.variant_name.trim() && menuItem.variant.variant_name !== 'Standard') {
        displayName = menuItem.variant.variant_name;
        variantDisplayName = menuItem.variant.variant_name;
      } else if (menuItem.variant.name || menuItem.variant.protein_type) {
        // Fallback: construct with suffix pattern
        const variantShortName = menuItem.variant.name || menuItem.variant.protein_type || '';
        if (variantShortName && variantShortName !== 'Standard') {
          displayName = `${itemName} (${variantShortName})`;
          variantDisplayName = variantShortName;
        }
      }
    } else if (actualVariantName) {
      // StaffVariantSelector path: variant_name is already at top level
      displayName = `${itemName} (${actualVariantName})`;
      variantDisplayName = actualVariantName;
    }

    // Build OrderItem with customer metadata
    const newItem: OrderItem = {
      id: menuItem.id || uuidv4(),
      name: displayName,
      variantName: variantDisplayName,
      basePrice: basePrice,
      quantity: quantity,
      total: totalPrice,
      menu_item_id: menuItem.menu_item_id || menuItem.id,
      category_id: menuItem.category_id,
      category_name: categories.find(c => c.id === menuItem.category_id)?.name,
      // Customer metadata
      customer_id: activeTab.id,
      customer_name: activeTab.name,
      protein_type: menuItem.protein_type || null,
      // Kitchen display name for thermal receipts
      kitchen_display_name: menuItem.kitchen_display_name || null,
      // Display order for sorting items within sections on receipts
      display_order: menuItem.display_order || 0,
      // Variant handling
      variant: (menuItem.variant || menuItem.variant_id) ? {
        id: menuItem.variant?.id || menuItem.variant_id || '',
        name: menuItem.variant?.protein_type || menuItem.variant?.name || variantName || '',
        price_adjustment: menuItem.variant?.price_adjustment || 0,
        protein_type: menuItem.variant?.protein_type || menuItem.protein_type
      } : undefined,
      // ✅ PRESERVE CUSTOMIZATIONS from StaffVariantSelector
      customizations: customizations.map((c: any) => ({
        id: c.id,
        customization_id: c.customization_id || c.id,
        name: c.name,
        price_adjustment: c.price_adjustment || c.price || 0,
        group: c.group
      })),
      modifiers: menuItem.modifiers || []
    };

    // Update active tab's items
    setCustomerTabs(customerTabs.map(tab =>
      tab.id === activeTabId
        ? { ...tab, items: [...tab.items, newItem] }
        : tab
    ));

    toast.success(`Added ${menuItem.name} to ${activeTab.name}`);
  };

  // Remove item from customer tab
  const handleRemoveItem = (tabId: string, itemId: string) => {
    setCustomerTabs(customerTabs.map(tab =>
      tab.id === tabId
        ? { ...tab, items: tab.items.filter(item => item.id !== itemId) }
        : tab
    ));
  };

  // Update item quantity
  const handleUpdateQuantity = (tabId: string, itemId: string, delta: number) => {
    setCustomerTabs(customerTabs.map(tab =>
      tab.id === tabId
        ? {
            ...tab,
            items: tab.items.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    quantity: Math.max(1, item.quantity + delta),
                    total: item.basePrice * Math.max(1, item.quantity + delta)
                  }
                : item
            )
          }
        : tab
    ));
  };

  // Handle customized items from POSMenuItemCard's StaffCustomizationModal
  // This receives a fully-formed OrderItem with customizations already applied
  const handleCustomizedItem = (orderItem: any) => {
    // ✅ DEBUG: Log incoming data at the very start
    console.log('[BuildSampleOrderModal] handleCustomizedItem received:', {
      orderItem,
      name: orderItem?.name,
      variantName: orderItem?.variantName,
      price: orderItem?.price,
      basePrice: orderItem?.basePrice,
      quantity: orderItem?.quantity,
      customizations: orderItem?.customizations,
      customizationsLength: orderItem?.customizations?.length,
      menu_item_id: orderItem?.menu_item_id,
      variant_id: orderItem?.variant_id
    });

    if (!activeTab) {
      toast.error('Please select a customer tab first');
      return;
    }

    // ✅ Calculate total including customizations
    const customizationTotal = (orderItem.customizations || []).reduce(
      (sum: number, c: any) => sum + (c.price_adjustment || 0),
      0
    );
    const basePrice = orderItem.price || orderItem.basePrice || 0;
    const totalPrice = (basePrice + customizationTotal) * orderItem.quantity;

    // ✅ Convert to our internal OrderItem format with customer metadata
    const newItem: OrderItem = {
      id: orderItem.id || uuidv4(),
      name: orderItem.name,
      variantName: orderItem.variantName,
      basePrice: basePrice,
      quantity: orderItem.quantity,
      total: totalPrice,
      menu_item_id: orderItem.menu_item_id,
      category_id: orderItem.category_id || '',
      category_name: categories.find(c => c.id === orderItem.category_id)?.name,
      // Customer metadata
      customer_id: activeTab.id,
      customer_name: activeTab.name,
      protein_type: orderItem.protein_type || null,
      // Kitchen display name for thermal receipts (preserved from POSMenuItemCard)
      kitchen_display_name: (orderItem as any).kitchen_display_name || null,
      // Display order for sorting items within sections on receipts
      display_order: (orderItem as any).display_order || 0,
      // Variant handling
      variant: orderItem.variant_id ? {
        id: orderItem.variant_id,
        name: orderItem.variantName || '',
        price_adjustment: 0,
        protein_type: orderItem.protein_type
      } : undefined,
      // ✅ Customizations - handle both POSMenuItemCard and MenuOrderItem formats
      customizations: (orderItem.customizations || []).map((c: any) => ({
        id: c.id || c.customization_id,
        customization_id: c.customization_id || c.id,
        name: c.name,
        price_adjustment: c.price_adjustment || 0,
        group: c.group || ''
      })),
      modifiers: orderItem.modifiers || [],
      notes: orderItem.notes || ''
    };

    // Add to active tab
    setCustomerTabs(customerTabs.map(tab =>
      tab.id === activeTabId
        ? { ...tab, items: [...tab.items, newItem] }
        : tab
    ));

    // ✅ DEBUG: Log what we're adding
    console.log('[BuildSampleOrderModal] Added item:', {
      name: newItem.name,
      variantName: newItem.variantName,
      variant: newItem.variant,
      customizations: newItem.customizations,
      total: newItem.total
    });

    toast.success(`Added ${orderItem.name} to ${activeTab.name}`);
  };

  // Build final order
  const handleBuildOrder = () => {
    // Merge all customer tab items into single array
    const allItems = customerTabs.flatMap(tab => tab.items);

    if (allItems.length === 0) {
      toast.error('Add at least one item to build order');
      return;
    }

    // Parse linked tables from input
    const linkedTables = parseLinkedTables(linkedTablesInput);

    // Convert local customer tabs to CustomerTabInfo format
    const customerTabsInfo: CustomerTabInfo[] = customerTabs
      .filter(tab => tab.items.length > 0) // Only include tabs with items
      .map(tab => ({
        tabName: tab.name,
        items: tab.items
      }));

    // Return full dine-in output with table context
    const output: DineInOrderOutput = {
      orderItems: allItems,
      tableNumber: tableNumber.trim(),
      guestCount: parseInt(guestCount) || 1,
      linkedTables: linkedTables,
      customerTabs: customerTabsInfo,
    };

    onOrderBuilt(output);
    toast.success(`Sample order created with ${allItems.length} items`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90dvh] p-0 overflow-hidden">
        {currentStep === 1 ? (
          // Step 1: Table Initialization
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 border-b" style={{ borderColor: QSAITheme.border.medium }}>
              <div>
                <DialogTitle style={{ color: QSAITheme.text.primary }}>
                  Table Setup
                </DialogTitle>
                <p className="text-sm mt-1" style={{ color: QSAITheme.text.secondary }}>
                  Enter table details to start building a DINE-IN order
                </p>
              </div>
            </DialogHeader>

            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-md space-y-6">
                {/* Table Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                    <Table className="w-4 h-4 inline mr-2" />
                    Table Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 12 or T12"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="text-lg"
                    autoFocus
                  />
                </div>

                {/* Guest Count Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of Guests
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="2"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                {/* Linked Tables Input (optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                    <Link2 className="w-4 h-4 inline mr-2" />
                    Linked Tables (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 1, 2, 3"
                    value={linkedTablesInput}
                    onChange={(e) => setLinkedTablesInput(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                    Enter comma-separated table numbers to link multiple tables
                  </p>
                </div>

                {/* Continue Button */}
                <Button
                  onClick={handleContinueToMenu}
                  className="w-full gap-2"
                  size="lg"
                  style={{
                    backgroundColor: QSAITheme.purple.primary,
                    color: QSAITheme.text.primary
                  }}
                >
                  Continue to Menu
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Customer Tabs + Menu Browsing inside shared shell
          <CustomizeOrchestratorProvider>
            <ModalShell3Col
              header={
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <DialogTitle style={{ color: QSAITheme.text.primary }}>
                        Build Sample Order
                      </DialogTitle>
                      <Badge variant="outline" className="gap-1.5">
                        <Table className="w-3 h-3" />
                        {linkedTablesInput && parseLinkedTables(linkedTablesInput).length > 1
                          ? `Tables ${parseLinkedTables(linkedTablesInput).join(' + ')}`
                          : `Table ${tableNumber}`} • {guestCount} {parseInt(guestCount) === 1 ? 'Guest' : 'Guests'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1" style={{ color: QSAITheme.text.secondary }}>
                      Create a multi-customer order for receipt testing
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      ← Back to Table Setup
                    </Button>
                    <Badge variant="secondary" className="gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      {totalItems} items
                    </Badge>
                    <Button
                      onClick={handleBuildOrder}
                      disabled={totalItems === 0}
                      style={{
                        backgroundColor: QSAITheme.purple.primary,
                        color: QSAITheme.text.primary
                      }}
                    >
                      Build Order
                    </Button>
                  </div>
                </div>
              }
              left={
                <DineInCategoryList
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategorySelect}
                  menuItems={menuItems}
                  className="min-w-0"
                />
              }
              center={
                <DineInMenuGrid
                  selectedCategory={selectedCategory}
                  onAddToOrder={handleAddToOrder}
                  onCustomizeItem={handleCustomizedItem}
                  className="min-w-0 max-w-full"
                />
              }
              right={
                <div className="flex flex-col h-full min-w-0">
                  {/* Customer Tabs Header */}
                  <div className="p-4 border-b border-border flex-shrink-0 sticky top-0 bg-background z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: QSAITheme.purple.primary }} />
                        <h3 className="font-medium" style={{ color: QSAITheme.text.primary }}>
                          Customer Tabs
                        </h3>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleAddCustomerTab}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Customer
                      </Button>
                    </div>

                    {/* Customer Tab Pills */}
                    <div className="flex flex-wrap gap-2">
                      {customerTabs.map(tab => (
                        <div
                          key={tab.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full border cursor-pointer transition-all"
                          style={{
                            backgroundColor: activeTabId === tab.id ? QSAITheme.purple.primary : 'transparent',
                            borderColor: activeTabId === tab.id ? QSAITheme.purple.primary : QSAITheme.border.medium,
                            color: QSAITheme.text.primary
                          }}
                          onClick={() => setActiveTabId(tab.id)}
                        >
                          {editingTabId === tab.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleSaveRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') setEditingTabId(null);
                              }}
                              className="h-5 w-24 px-1 text-xs"
                              autoFocus
                            />
                          ) : (
                            <>
                              <span className="text-xs font-medium truncate max-w-[8rem]">{tab.name}</span>
                              {tab.items.length > 0 && (
                                <Badge variant="secondary" className="text-xs h-4 px-1">
                                  {tab.items.length}
                                </Badge>
                              )}
                              {activeTabId === tab.id && (
                                <div className="flex items-center gap-0.5 ml-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartRenaming(tab.id, tab.name);
                                    }}
                                    className="hover:opacity-70"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  {customerTabs.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTab(tab.id);
                                      }}
                                      className="hover:opacity-70"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Items for Active Customer */}
                  <div className="flex-1 min-w-0 p-4 space-y-3">
                    {!activeTab || activeTab.items.length === 0 ? (
                      <div className="text-center py-8" style={{ color: QSAITheme.text.muted }}>
                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No items yet</p>
                        <p className="text-xs mt-1">Select items from the menu</p>
                      </div>
                    ) : (
                      activeTab.items.map(item => {
                        // ✅ DEBUG: Log what we're displaying
                        console.log('[BuildSampleOrderModal] Displaying item:', {
                          name: item.name,
                          variantName: item.variantName,
                          variant: item.variant,
                          customizations: item.customizations
                        });

                        return (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border"
                          style={{
                            backgroundColor: QSAITheme.background.base,
                            borderColor: QSAITheme.border.light
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate" style={{ color: QSAITheme.text.primary }}>
                                {item.name}
                              </div>
                              {/* Only show variant name if it exists and is not "Standard" */}
                              {(item.variantName && item.variantName !== 'Standard') || (item.variant?.protein_type && item.variant.protein_type !== 'Standard') ? (
                                <div className="text-xs mt-0.5 truncate" style={{ color: QSAITheme.text.secondary }}>
                                  {item.variantName || item.variant?.protein_type}
                                </div>
                              ) : null}
                              {/* Show customizations if any */}
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.customizations.map((c, idx) => (
                                    <div key={idx} className="text-xs flex justify-between" style={{ color: QSAITheme.purple.light }}>
                                      <span>+ {c.name}</span>
                                      {c.price_adjustment > 0 && <span>+£{c.price_adjustment.toFixed(2)}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Show notes if any */}
                              {item.notes && (
                                <div className="text-xs mt-1 italic" style={{ color: QSAITheme.text.muted }}>
                                  Note: {item.notes}
                                </div>
                              )}
                              <div className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                                £{item.total.toFixed(2)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(activeTab.id, item.id)}
                              className="hover:opacity-70 p-1"
                            >
                              <Trash2 className="w-4 h-4" style={{ color: QSAITheme.text.muted }} />
                            </button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => handleUpdateQuantity(activeTab.id, item.id, -1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="text-xs font-medium w-8 text-center" style={{ color: QSAITheme.text.primary }}>
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => handleUpdateQuantity(activeTab.id, item.id, 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>

                  {/* Build Button */}
                  {activeTab && activeTab.items.length > 0 && (
                    <div className="p-4 border-t border-border sticky bottom-0 bg-background z-10">
                      <Button
                        onClick={handleBuildOrder}
                        className="w-full"
                        style={{
                          backgroundColor: QSAITheme.purple.primary,
                          color: QSAITheme.text.primary
                        }}
                      >
                        Build Order
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
          </CustomizeOrchestratorProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
