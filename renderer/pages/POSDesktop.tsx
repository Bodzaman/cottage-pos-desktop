import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// External library imports
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

// Databutton imports
import { supabase } from 'utils/supabaseClient';

// Store imports
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useRealtimeMenuStore, loadPOSBundle, cleanupRealtimeMenuStore, startRealtimeSubscriptionsIfNeeded } from '../utils/realtimeMenuStore';
import { useCustomerDataStore } from '../utils/customerDataStore';
import { useTableOrdersStore } from '../utils/tableOrdersStore';
import { usePOSAuth } from 'utils/usePOSAuth';
import { ResponsivePOSShell } from 'components/ResponsivePOSShell';

// NEW: Import focused POS stores
import { usePOSOrderStore } from 'utils/posOrderStore';
import { usePOSCustomerStore } from 'utils/posCustomerStore';
import { usePOSUIStore } from 'utils/posUIStore';
import { usePOSCustomerIntelligence } from 'utils/usePOSCustomerIntelligence';

// NEW: Event-driven architecture hooks for DINE-IN mode
import { useDineInOrder } from 'utils/useDineInOrder';
import { useRestaurantTables } from 'utils/useRestaurantTables';
import { useCustomerTabs } from 'utils/useCustomerTabs';

// Enhanced image preloading imports
import { OrderSummarySkeleton } from 'components/OrderSummarySkeleton';
import { POSZoneErrorBoundary } from 'components/POSZoneErrorBoundary';

// Utility imports
import { QSAITheme } from '../utils/QSAIDesign';
import { createLogger } from 'utils/logger';
import { useOnDemandPrinter } from 'utils/onDemandPrinterService';
import posPerf, { POSPerfMarks } from 'utils/posPerformance';
import { generateDisplayName } from 'utils/menuHelpers';
import { getOrderItems } from 'utils/posSupabaseHelpers';

// Component imports
import { ManagementHeader } from '../components/ManagementHeader';
import { POSNavigation } from '../components/POSNavigation';
import { DineInTableSelector } from '../components/DineInTableSelector';
import { POSSectionPills } from '../components/POSSectionPills';
import { POSCategoryPills } from '../components/POSCategoryPills';
import { POSMenuSelector } from '../components/POSMenuSelector';
import { OrderSummaryPanel } from '../components/OrderSummaryPanel';
import { OrderCustomerCard } from '../components/OrderCustomerCard';
import { CustomerDetailsModal } from 'components/CustomerDetailsModal';
import { CustomerOrderHistoryModal } from 'components/CustomerOrderHistoryModal';
import { POSGuestCountModal } from 'components/POSGuestCountModal';
import { DineInOrderModal } from 'components/DineInOrderModal';
import { DineInKitchenPreviewModal } from 'components/DineInKitchenPreviewModal';
import { DineInBillPreviewModal } from 'components/DineInBillPreviewModal';
import { CustomizeOrchestratorProvider } from '../components/CustomizeOrchestrator';
import { POSFooter } from 'components/POSFooter';
import { AdminSidePanel } from 'components/AdminSidePanel';
import { AvatarDropdown } from 'components/AvatarDropdown';
import { PaymentFlowOrchestrator } from 'components/PaymentFlowOrchestrator';
import { PaymentFlowResult, PaymentFlowMode } from 'utils/paymentFlowTypes';
import { PaymentChoiceModal } from 'components/PaymentChoiceModal';
import { Loader2 } from 'lucide-react';

// View Components - Import from POSDesktop for parity
import { OnlineOrderManagement } from 'components/OnlineOrderManagement';
import { ReservationsPlaceholder } from 'components/ReservationsPlaceholder';

// Utility imports
import { MenuItem, OrderItem, ModifierSelection, PaymentResult } from '../utils/menuTypes';
import { TipSelection } from '../components/POSTipSelector';
import { usePOSSettingsWithAutoFetch } from '@/utils/posSettingsStore';

// Custom hooks
import { useOrderManagement } from 'utils/useOrderManagement';
import { useCustomerFlow } from 'utils/useCustomerFlow';
import { useOrderProcessing } from 'utils/useOrderProcessing';
import { usePrintingOperations } from 'utils/usePrintingOperations';
import { usePOSInitialization } from 'utils/usePOSInitialization';

import { OfflineFirst } from '../utils/offlineFirstManager';
import { type PersistedSession } from '../utils/sessionPersistence';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from 'app';

/**
 * POSDesktop - Professional Point of Sale interface
 */
export default function POSDesktop() {
  const isDev = (import.meta as any).env?.DEV;
  const navigate = useNavigate();
  const location = useLocation();
  useSimpleAuth();
  const { user, isAuthenticated, isLoading: authLoading, logout } = usePOSAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/pos-login', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const managerApprovalResolverRef = useRef<((approved: boolean) => void) | null>(null);
  const [managerOverrideGranted, setManagerOverrideGranted] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const categories = useRealtimeMenuStore(state => state.categories, shallow);
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const isLoading = useRealtimeMenuStore(state => state.isLoading);
  const isConnected = useRealtimeMenuStore(state => state.isConnected);
  const setSearchQuery = useRealtimeMenuStore(state => state.setSearchQuery);
  
  // ✅ FIX: Use reactive selectors for values that should trigger re-renders
  // Use getState() only for actions (mutations), not for reading values
  const orderType = usePOSOrderStore(state => state.orderType);
  const orderItems = usePOSOrderStore(state => state.orderItems, shallow);
  const selectedTableNumber = usePOSOrderStore(state => state.selectedTableNumber);
  const guestCount = usePOSOrderStore(state => state.guestCount);
  const setOrderType = usePOSOrderStore(state => state.setOrderType);
  const setOrderItems = usePOSOrderStore(state => state.setOrderItems);
  const setSelectedTableNumber = usePOSOrderStore(state => state.setSelectedTableNumber);
  const setGuestCount = usePOSOrderStore(state => state.setGuestCount);
  const clearOrder = usePOSOrderStore(state => state.clearOrder);
  
  const customerData = usePOSCustomerStore(state => state.customerData, shallow);
  const updateCustomer = usePOSCustomerStore(state => state.updateCustomer);
  const clearCustomer = usePOSCustomerStore(state => state.clearCustomer);
  
  const activeView = usePOSUIStore(state => state.activeView);
  const showDineInModal = usePOSUIStore(state => state.showDineInModal);
  const showGuestCountModal = usePOSUIStore(state => state.showGuestCountModal);
  const showCustomerModal = usePOSUIStore(state => state.showCustomerModal);
  const showPaymentFlow = usePOSUIStore(state => state.showPaymentFlow);
  const setActiveView = usePOSUIStore(state => state.setActiveView);
  const setModal = usePOSUIStore(state => state.setModal);
  const setQueuedJobsCount = usePOSUIStore(state => state.setQueuedJobsCount);
  const persistedTableOrders = useTableOrdersStore((state) => state.persistedTableOrders);

  const { tables: restaurantTables, loading: tablesLoading, refetch: refetchTables } = useRestaurantTables();
  
  const selectedTableUuid = useMemo(() => {
    if (orderType !== 'DINE-IN' || !selectedTableNumber) return null;
    const table = restaurantTables.find((t: any) => t.table_number === selectedTableNumber?.toString());
    return table?.id || null;
  }, [orderType, selectedTableNumber, restaurantTables]);

  const linkedTableContext = useMemo(() => {
    if (orderType !== 'DINE-IN' || !selectedTableNumber) return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    const selectedTable = restaurantTables.find((t: any) => parseInt(t.table_number) === selectedTableNumber);
    if (!selectedTable) return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    const isLinked = selectedTable.is_linked_table || selectedTable.is_linked_primary;
    if (!isLinked || !selectedTable.linked_with_tables) return { linkedTableNumbers: [], isPrimaryTable: false, totalLinkedCapacity: 0 };
    const linkedTableNumbers = selectedTable.linked_with_tables;
    const isPrimaryTable = selectedTable.is_linked_primary || false;
    const linkedTableObjects = restaurantTables.filter((t: any) => linkedTableNumbers.includes(parseInt(t.table_number)));
    const totalLinkedCapacity = selectedTable.capacity + linkedTableObjects.reduce((sum: number, t: any) => sum + (t.capacity || 0), 0);
    return { linkedTableNumbers, isPrimaryTable, totalLinkedCapacity };
  }, [orderType, selectedTableNumber, restaurantTables]);

  const { order: dineInOrder, enrichedItems: dineInEnrichedItems, enrichedLoading: dineInEnrichedLoading, enrichedError: dineInEnrichedError, createOrder, addItem: addItemToDineIn, removeItem: removeItemFromDineIn, updateItemQuantity, sendToKitchen: sendDineInToKitchen, updateGuestCount } = useDineInOrder(selectedTableUuid || '');

  const dineInOrderRef = useRef(dineInOrder);
  useEffect(() => { dineInOrderRef.current = dineInOrder; }, [dineInOrder]);

  const { customerTabs: customerTabsData, activeTabId, setActiveTabId, createTab, addItemsToTab, renameTab, closeTab, splitTab, mergeTabs, moveItemsBetweenTabs } = useCustomerTabs(orderType === 'DINE-IN' ? selectedTableNumber : null);

  const [dineInStagingItems, setDineInStagingItems] = useState<OrderItem[]>([]);
  const addToStagingCart = useCallback((item: OrderItem) => setDineInStagingItems(prev => [...prev, item]), []);
  const removeFromStagingCart = useCallback((itemId: string) => setDineInStagingItems(prev => prev.filter(item => item.id !== itemId)), []);
  const clearStagingCart = useCallback(() => setDineInStagingItems([]), []);

  const persistStagingCart = useCallback(async () => {
    if (dineInStagingItems.length === 0) return false;
    if (!dineInOrderRef.current) {
      const startTime = Date.now();
      while (!dineInOrderRef.current && (Date.now() - startTime < 3000)) await new Promise(r => setTimeout(r, 100));
      if (!dineInOrderRef.current) return false;
    }
    try {
      for (const item of dineInStagingItems) await addItemToDineIn(item);
      setDineInStagingItems([]);
      return true;
    } catch { return false; }
  }, [dineInStagingItems, addItemToDineIn]);

  const clearCustomerData = useCustomerDataStore(state => state.clearCustomerData);
  const setCustomerData = useCustomerDataStore(state => state.setCustomerData);
  const customerDataStoreData = useCustomerDataStore(state => state.customerData, shallow);
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const { settings: posSettings } = usePOSSettingsWithAutoFetch();
  const variantCarouselEnabled = posSettings?.variant_carousel_enabled ?? true;
  
  const orderTotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [orderItems]);
  const deliveryFee = useMemo((): number => {
    if (orderType === "DELIVERY" && (customerData as any).deliveryFee !== undefined) return (customerData as any).deliveryFee;
    if (orderType === "DELIVERY" && posSettings?.delivery_charge?.enabled) return posSettings.delivery_charge.amount;
    return 0;
  }, [orderType, customerData, posSettings]);
  
  const initialization = usePOSInitialization({ onViewChange: (view: any) => setActiveView(view) });

  const handleLogout = useCallback(async () => { await logout(); navigate('/pos-login', { replace: true }); }, [logout, navigate]);
  const handleManagementAuthSuccess = useCallback(() => { setManagerOverrideGranted(true); if (managerApprovalResolverRef.current) managerApprovalResolverRef.current(true); setIsManagementDialogOpen(false); setShowAdminPanel(true); }, []);

  const handleOrderTypeChange = useCallback((orderType: any) => {
    setOrderType(orderType);
    setActiveView(orderType === 'ONLINE_ORDERS' ? 'online-orders' : 'pos');
  }, [orderStore, uiStore]);
  
  const handleTableSelect = useCallback((tableNumber: number, tableStatus?: string) => {
    const table = restaurantTables.find((t: any) => parseInt(t.table_number) === tableNumber);
    if (table?.is_linked_table || table?.is_linked_primary || (tableStatus && tableStatus !== 'AVAILABLE')) {
      setOrderType('DINE-IN');
      setSelectedTableNumber(tableNumber);
      setModal('showDineInModal', true);
    } else {
      setOrderType('DINE-IN');
      setSelectedTableNumber(tableNumber);
      setModal('showGuestCountModal', true);
    }
    updateCustomer({ ...customerDataStoreData, tableNumber: tableNumber.toString(), guestCount: guestCount || 1 } as any);
  }, [restaurantTables, orderStore, uiStore, customerStore, customerDataStoreData]);
  
  const handleGuestCountSave = useCallback(async (guestCount: number, action: string, linkedTables?: number[]) => {
    const tableIdVal = selectedTableNumber;
    if (!tableIdVal) return;
    
    const orderId = await createOrder(guestCount);
    if (orderId) {
      if (action === 'link' && linkedTables) {
        try { await apiClient.link_tables({ order_id: orderId, tables_to_link: linkedTables }); await refetchTables(); } catch {}
      }
      setGuestCount(guestCount);
      setModal('showGuestCountModal', false);
      setModal('showDineInModal', true);
    }
  }, [createOrder, orderStore, uiStore, refetchTables]);

  const handleCustomerIntelligenceSelected = useCallback((customer: any) => {
    const data = {
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.default_address?.address_line1 || '',
      street: customer.default_address?.address_line1 || '',
      city: customer.default_address?.city || '',
      postcode: customer.default_address?.postal_code || '',
    };
    updateCustomer(data as any);
    setCustomerData(data as any);
  }, [customerStore, setCustomerData]);

  const handleLoadPastOrder = useCallback(async (order: any) => {
    const data = await getOrderItems(order.order_id);
    if (data.success && data.items) {
      const items = data.items.map((i: any) => ({
        id: i.id || i.menu_item_id,
        menu_item_id: i.menu_item_id,
        variant_id: i.variant_id || '',
        name: generateDisplayName(i.name, i.variant_name, i.protein_type),
        price: parseFloat(i.price || 0),
        quantity: parseInt(i.quantity || 1),
        variantName: i.variant_name,
        protein_type: i.protein_type || '',
        modifiers: i.modifiers || [],
        notes: i.notes || '',
        image_url: i.image_url || '',
      }));
      setOrderItems([...orderItems, ...items]);
      setShowOrderHistoryModal(false);
    }
  }, [orderStore]);

  const calculateOrderTotal = useCallback((): number => {
    return orderItems.reduce((total: number, item: OrderItem) => {
      let it = item.price * item.quantity;
      if (item.modifiers) item.modifiers.forEach((m: any) => { it += (m.price_adjustment || 0) * item.quantity; });
      return total + it;
    }, 0);
  }, [orderItems]);

  const handleCustomerSave = useCallback((data: any) => { updateCustomer(data); setCustomerData(data); }, [customerStore, setCustomerData]);

  const orderManagement = useOrderManagement(orderItems, setOrderItems);
  const customerFlow = useCustomerFlow(orderType as any, customerData as any, (data: any) => updateCustomer(data), selectedTableNumber, guestCount);
  const orderProcessing = useOrderProcessing(orderType as any, orderItems, customerData as any, selectedTableNumber, guestCount);
  const printing = usePrintingOperations(orderType as any, orderItems, customerData as any, selectedTableNumber, guestCount);


  const handleAddToOrder = useCallback((item: OrderItem) => {
    if (orderType === 'DINE-IN') addItemToDineIn(item);
    else orderManagement.handleAddToOrder(item);
  }, [orderType, addItemToDineIn, orderManagement]);

  const handleClearOrder = useCallback(() => { orderManagement.handleClearOrder(); clearOrder(); }, [orderManagement, orderStore]);

  const handlePaymentSuccess = useCallback(async (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    const subtotal = calculateOrderTotal();
    const finalTotal = subtotal * 1.2 + tipSelection.amount;
    await (orderProcessing as any).persistPayment({ payment_method: paymentResult?.method || 'CASH', subtotal, tax_amount: subtotal * 0.2, tip_amount: tipSelection.amount, total_amount: finalTotal });
    await printing.handlePrintKitchen();
    await printing.handlePrintReceipt(finalTotal);
    clearOrder();
    clearCustomer();
  }, [calculateOrderTotal, orderProcessing, printing, orderStore, customerStore]);

  const handleSendToKitchen = useCallback(async () => {
    if (orderItems.length === 0) return;
    const subtotal = calculateOrderTotal();
    await supabase.from('orders').insert({ order_type: orderType, table_number: selectedTableNumber, guest_count: guestCount || 1, items: orderItems as any, subtotal, tax_amount: subtotal * 0.2, total_amount: subtotal * 1.2, status: 'IN_PROGRESS', created_at: new Date().toISOString() });
    toast.success('🍽️ Sent to kitchen!');
  }, [orderStore, calculateOrderTotal]);

  const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
  const [paymentFlowMode, setPaymentFlowMode] = useState<PaymentFlowMode>('payment');
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [showKitchenPreviewModal, setShowKitchenPreviewModal] = useState(false);
  const [showBillPreviewModal, setShowBillPreviewModal] = useState(false);

  const handleShowPaymentModal = useCallback(async () => {
    if (orderType === 'DINE-IN') return await printing.handlePrintBill(orderTotal);
    setShowPaymentChoiceModal(true);
  }, [orderType, printing, orderTotal]);

  const handleSelectPaymentMode = useCallback((mode: PaymentFlowMode) => {
    setPaymentFlowMode(mode);
    setShowPaymentChoiceModal(false);
    setModal('showPaymentFlow', true);
  }, [uiStore]);

  const handlePaymentFlowComplete = useCallback(async (result: PaymentFlowResult) => {
    if (!result.success) {
      setModal('showPaymentFlow', false);
      return;
    }
    await printing.handlePrintKitchen();
    await printing.handlePrintReceipt(result.orderTotal ?? 0);
    clearOrder();
    clearCustomer();
    setModal('showPaymentFlow', false);
    toast.success('💰 Payment successful!');
  }, [printing, orderStore, customerStore, uiStore]);

  const { printerStatus } = useOnDemandPrinter();

  useEffect(() => {
    if (printerStatus?.queuedJobs !== undefined) setQueuedJobsCount(printerStatus.queuedJobs);
  }, [printerStatus, uiStore]);

  useEffect(() => {
    const timer = setTimeout(() => { startRealtimeSubscriptionsIfNeeded(); }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSectionSelect = useCallback((id: string | null) => { setSelectedSectionId(id); setSelectedCategoryId(null); useRealtimeMenuStore.getState().setSelectedMenuCategory(id); }, []);
  const handleCategorySelect = useCallback((id: string | null) => { setSelectedCategoryId(id); useRealtimeMenuStore.getState().setSelectedMenuCategory(id); }, []);
  const childCats = useMemo(() => selectedSectionId ? categories.filter(c => c.parent_category_id === selectedSectionId) : [], [categories, selectedSectionId]);

  const renderMainPOSView = () => (
    <ResponsivePOSShell zones={{
      customer: (
        <POSZoneErrorBoundary zoneName="Customer" onReset={() => {}} showHomeButton>
          <div className="flex flex-col h-full bg-[#121212] rounded-lg overflow-hidden border border-white/5 p-3">
            {orderType === "DINE-IN" ? <DineInTableSelector selectedTable={selectedTableNumber} onTableSelect={handleTableSelect} tableOrders={persistedTableOrders as any} /> : <OrderCustomerCard orderType={orderType} onTakeOrder={() => setModal('showCustomerModal', true)} onCustomerSelected={handleCustomerIntelligenceSelected} onOrderAgain={handleLoadPastOrder} onViewOrders={() => setShowOrderHistoryModal(true)} onClear={() => { clearCustomer(); clearCustomerData(); }} />}
          </div>
        </POSZoneErrorBoundary>
      ),
      categories: null,
      menu: (
        <POSZoneErrorBoundary zoneName="Menu" onReset={() => {}} showHomeButton>
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-3 space-y-2 bg-[#121212] border-b border-white/5">
              <POSSectionPills selectedSectionId={selectedSectionId} onSectionSelect={handleSectionSelect} />
              {selectedSectionId && <POSCategoryPills categories={childCats} selectedCategoryId={selectedCategoryId} onCategorySelect={handleCategorySelect} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <POSMenuSelector onAddToOrder={handleAddToOrder} onCustomizeItem={handleAddToOrder} onCategoryChange={handleCategorySelect} orderType={orderType} selectedSectionId={selectedSectionId} childCategories={childCats} selectedCategoryId={selectedCategoryId} onCategorySelect={handleCategorySelect} variantCarouselEnabled={variantCarouselEnabled} />
            </div>
          </div>
        </POSZoneErrorBoundary>
      ),
      summary: (
        <POSZoneErrorBoundary zoneName="Order" onReset={handleClearOrder} showHomeButton>
          <OrderSummaryPanel orderItems={orderType === 'DINE-IN' ? [] : orderItems} orderType={orderType as any} tableNumber={selectedTableNumber || 0} guestCount={guestCount} customerFirstName={customerData.firstName} customerLastName={customerData.lastName} customerPhone={customerData.phone} customerAddress={customerData.address} customerPostcode={customerData.postcode} deliveryFee={deliveryFee} onRemoveItem={orderManagement.handleRemoveItem} onUpdateQuantity={(itemId: string, quantity: number) => orderManagement.handleUpdateQuantity(0, quantity) /* dummy index */} onClearOrder={handleClearOrder} onPaymentSuccess={handlePaymentSuccess} onSendToKitchen={handleSendToKitchen} onPrintBill={() => printing.handlePrintBill(orderTotal)} onSaveUpdate={() => {}} onTableSelect={(num: number) => setSelectedTableNumber(num)} onTableSelectionClick={() => setModal('showGuestCountModal', true)} onCustomizeItem={orderManagement.handleCustomizeItem} onCustomerDetailsClick={() => setModal('showCustomerModal', true)} onShowPaymentModal={handleShowPaymentModal} />
        </POSZoneErrorBoundary>
      )
    }} />
  );

  if (authLoading) return <div className="h-screen w-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-purple-500" /></div>;
  if (!isAuthenticated) return null;

  return (
    <CustomizeOrchestratorProvider>
      <div className="grid grid-rows-[auto_1fr_auto] h-screen bg-black overflow-hidden">
        <ManagementHeader title="POS" onAdminSuccess={handleManagementAuthSuccess} onLogout={handleLogout} />
        <POSNavigation activeView={(activeView as any)} currentOrderType={orderType} onOrderTypeChange={handleOrderTypeChange} />
        <div className="flex-1 overflow-hidden">{activeView === 'pos' ? renderMainPOSView() : activeView === 'online-orders' ? <OnlineOrderManagement onBack={() => setActiveView('pos')} /> : <ReservationsPlaceholder onBack={() => setActiveView('pos')} />}</div>
        <POSFooter currentOrderType={orderType} />
        
        <DineInOrderModal isOpen={showDineInModal} onClose={() => setModal('showDineInModal', false)} tableId={selectedTableUuid} tableNumber={selectedTableNumber as any} tableCapacity={4} restaurantTables={restaurantTables} eventDrivenOrder={orderType === 'DINE-IN' ? (dineInOrder as any) : null} eventDrivenCustomerTabs={customerTabsData} eventDrivenActiveTabId={activeTabId} onEventDrivenSetActiveTabId={setActiveTabId} onEventDrivenAddItem={addItemToDineIn} onEventDrivenRemoveItem={removeItemFromDineIn} onEventDrivenUpdateItemQuantity={updateItemQuantity} onEventDrivenUpdateGuestCount={updateGuestCount} onEventDrivenSendToKitchen={sendDineInToKitchen} onEventDrivenCreateTab={createTab} onEventDrivenAddItemsToTab={addItemsToTab} onEventDrivenRenameTab={renameTab} onEventDrivenCloseTab={closeTab} onEventDrivenSplitTab={splitTab} onEventDrivenMergeTabs={mergeTabs} onEventDrivenMoveItemsBetweenTabs={moveItemsBetweenTabs} stagingItems={dineInStagingItems} onAddToStaging={addToStagingCart} onRemoveFromStaging={removeFromStagingCart} onClearStaging={clearStagingCart} onPersistStaging={persistStagingCart as any} enrichedItems={dineInEnrichedItems} enrichedLoading={dineInEnrichedLoading} enrichedError={dineInEnrichedError} />
        {showGuestCountModal && <POSGuestCountModal isOpen={true} onClose={() => setModal('showGuestCountModal', false)} onSave={handleGuestCountSave} tableNumber={selectedTableNumber || 0} tableCapacity={4} initialGuestCount={1} restaurantTables={restaurantTables} tablesLoading={tablesLoading} />}
        {showCustomerModal && <CustomerDetailsModal isOpen={true} onClose={() => setModal('showCustomerModal', false)} onSave={handleCustomerSave} orderType={orderType as any} initialData={customerData as any} orderValue={orderTotal} onOrderTypeSwitch={() => {}} onManagerOverride={() => {}} requestManagerApproval={async () => true} managerOverrideGranted={true} />}
        {showAdminPanel && <AdminSidePanel isOpen={true} onClose={() => setShowAdminPanel(false)} defaultTab="dashboard" />}
        <CustomerOrderHistoryModal isOpen={showOrderHistoryModal} onClose={() => setShowOrderHistoryModal(false)} customer={null} orders={[]} onReorder={handleLoadPastOrder} />
        <PaymentChoiceModal isOpen={showPaymentChoiceModal} onClose={() => setShowPaymentChoiceModal(false)} onSelectMode={handleSelectPaymentMode} orderTotal={orderTotal} orderType={orderType as any} />
        <PaymentFlowOrchestrator isOpen={showPaymentFlow} onClose={() => setModal('showPaymentFlow', false)} mode={paymentFlowMode} orderItems={orderItems} orderTotal={orderTotal} orderType={orderType as any} customerData={customerData as any} deliveryFee={deliveryFee} onPaymentComplete={handlePaymentFlowComplete} />
      </div>
    </CustomizeOrchestratorProvider>
  );
}
