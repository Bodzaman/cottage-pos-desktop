import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X, Edit2, Trash2, Users, ShoppingCart, Table, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { DineInCategoryList } from './DineInCategoryList';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/receiptDesignerTypes';
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
    if (!activeTab) return;

    // Build OrderItem with customer metadata
    const newItem: OrderItem = {
      id: uuidv4(),
      name: menuItem.name,
      basePrice: menuItem.price || 0,
      quantity: 1,
      total: menuItem.price || 0,
      menu_item_id: menuItem.id,
      category_id: menuItem.category_id,
      category_name: categories.find(c => c.id === menuItem.category_id)?.name,
      // Customer metadata
      customer_id: activeTab.id,
      customer_name: activeTab.name,
      protein_type: menuItem.protein_type || null,
      // Variant handling
      variant: menuItem.variant ? {
        id: menuItem.variant.id,
        name: menuItem.variant.name || '',
        price_adjustment: menuItem.variant.price_adjustment || 0,
        protein_type: menuItem.variant.protein_type
      } : undefined
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

  // Build final order
  const handleBuildOrder = () => {
    // Merge all customer tab items into single array
    const allItems = customerTabs.flatMap(tab => tab.items);

    if (allItems.length === 0) {
      toast.error('Add at least one item to build order');
      return;
    }

    // Return full dine-in output with table context
    const output: DineInOrderOutput = {
      orderItems: allItems,
      tableNumber: tableNumber.trim(),
      guestCount: parseInt(guestCount) || 1,
    };

    onOrderBuilt(output);
    toast.success(`Sample order created with ${allItems.length} items`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] p-0 overflow-hidden">
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
                        Table {tableNumber} • {guestCount} {parseInt(guestCount) === 1 ? 'Guest' : 'Guests'}
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
                  onCategorySelect={setSelectedCategory}
                  menuItems={menuItems}
                  className="min-w-0"
                />
              }
              center={
                <POSMenuSelector
                  selectedCategoryId={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  onAddToOrder={handleAddToOrder}
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
                      activeTab.items.map(item => (
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
                              {item.variant && (
                                <div className="text-xs mt-0.5 truncate" style={{ color: QSAITheme.text.secondary }}>
                                  {item.variant.name}
                                </div>
                              )}
                              <div className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                                £{item.total.toFixed(2)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(activeTab.id, item.id)}
                              className="hover:opacity-70"
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
                      ))
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
