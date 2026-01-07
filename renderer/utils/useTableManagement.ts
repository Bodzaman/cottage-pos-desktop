import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { kitchenService } from 'utils/kitchenService';
import { orderManagementService } from 'utils/orderManagementService';
import { createStatusChangeAudit } from 'utils/orderAuditTrail';

// Table types
export interface TableOrder {
  orderId: string;
  items: any[];
  createdAt: Date;
  lastUpdatedAt: Date;
  completedAt?: Date;
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  finalSubtotal?: number;
  finalTax?: number;
  finalServiceCharge?: number;
  finalTotal?: number;
}

export interface SplitBill {
  billId: string;
  items: any[];
  total: number;
  paid: boolean;
  customer?: string;
}

export interface Table {
  tableNumber: number;
  capacity: number;
  status: 'AVAILABLE' | 'SEATED' | 'ORDERED' | 'BILL_REQUESTED' | 'PAYMENT_PROCESSING' | 'PAYMENT_COMPLETE';
  guestCount: number;
  occupiedAt: Date | null;
  orders: TableOrder[];
  activeOrderId: string | null;
  sentToKitchen: boolean;
  hasNewItems: boolean;
  billPrinted: boolean;
  lastBillPrintedAt: Date | null;
  lastSentToKitchenAt: Date | null;
  splitBills: SplitBill[];
}

export interface UseTableManagementReturn {
  // Table state
  tables: Table[];
  selectedTableNumber: number | null;
  guestCount: number;
  
  // Table operations
  handleTableSelect: (tableNumber: number) => void;
  handleSeatTable: () => void;
  handleUpdateTableStatus: (tableNumber: number, status: Table['status']) => void;
  handleResetTable: (tableNumber: number) => void;
  
  // Guest management
  setGuestCount: (count: number) => void;
  setSelectedTableNumber: (tableNumber: number | null) => void;
  
  // Table utilities
  getCurrentTableData: () => Table | null;
  getTableStatusColor: (status: Table['status'], sentToKitchen?: boolean) => string;
  getTableStatusLabel: (status: Table['status']) => string;
  getTimeOccupied: (occupiedAt: Date | null) => string;
  
  // Kitchen operations
  handleSendToKitchen: () => void;
  getKitchenTicketsCount: () => number;
  
  // Bill operations
  handlePrintBill: () => void;
  handleSplitBill: () => void;
  
  // Modal states for table management
  showGuestModal: boolean;
  setShowGuestModal: (show: boolean) => void;
  showSplitBillModal: boolean;
  setShowSplitBillModal: (show: boolean) => void;
}

const initializeTable = (tableNumber: number, capacity: number, status: Table['status'] = 'AVAILABLE'): Table => ({
  tableNumber,
  capacity,
  status,
  guestCount: 0,
  occupiedAt: null,
  orders: [],
  activeOrderId: null,
  sentToKitchen: false,
  hasNewItems: false,
  billPrinted: false,
  lastBillPrintedAt: null,
  lastSentToKitchenAt: null,
  splitBills: []
});

/**
 * Hook: useTableManagement
 * 
 * RESPONSIBILITY:
 * Manages complete lifecycle of dine-in table operations in POSDesktop.
 * Handles table state, guest seating, order tracking, kitchen coordination,
 * and bill management for restaurant table service.
 * 
 * DATA FLOW:
 * 1. Initializes 20 tables on mount with varying capacities
 * 2. Reads URL params to restore selected table on page load
 * 3. Updates table state in local component state (tables array)
 * 4. Syncs with kitchenService for order coordination
 * 5. Creates audit trails via auditHelpers for status changes
 * 
 * DEPENDENCIES:
 * - kitchenService: Syncs table orders with kitchen display system
 * - orderManagementService: (available but not currently used)
 * - auditHelpers: Creates status change audit logs
 * - useSimpleAuth: Gets current user for audit trail
 * - react-router: Manages URL params for table selection
 * 
 * KEY OPERATIONS:
 * - Table Selection: handleTableSelect() → Updates URL and selectedTableNumber
 * - Seating: handleSeatTable() → Creates new order, sets SEATED status
 * - Kitchen Flow: handleSendToKitchen() → Marks sentToKitchen=true, syncs with kitchen
 * - Bill Flow: handlePrintBill() → Sets BILL_REQUESTED status
 * - Reset: handleResetTable() → Returns table to AVAILABLE state
 * 
 * STATE LIFECYCLE:
 * AVAILABLE → SEATED → ORDERED → BILL_REQUESTED → PAYMENT_PROCESSING → PAYMENT_COMPLETE → AVAILABLE
 * 
 * @returns {UseTableManagementReturn} Table state, operations, and utility functions
 */
export const useTableManagement = (): UseTableManagementReturn => {
  const navigate = useNavigate();
  
  // Table state
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  
  // Modal states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  
  // Initialize tables on mount
  useEffect(() => {
    const initialTables: Table[] = [];
    
    // Initialize 20 tables with varying capacities
    const tableCapacities = {
      1: 2, 2: 2, 3: 4, 4: 4, 5: 4, 6: 4, 7: 6, 8: 6, 9: 8, 10: 8,
      11: 2, 12: 2, 13: 4, 14: 4, 15: 4, 16: 4, 17: 6, 18: 6, 19: 8, 20: 8
    };
    
    for (let i = 1; i <= 20; i++) {
      initialTables.push(initializeTable(i, tableCapacities[i as keyof typeof tableCapacities]));
    }
    
    setTables(initialTables);
  }, []);
  
  // Handle URL parameters for table selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    
    if (tableParam) {
      const tableNumber = parseInt(tableParam);
      if (tableNumber >= 1 && tableNumber <= 20) {
        setSelectedTableNumber(tableNumber);
      }
    }
  }, []);
  
  // Table operations
  const handleTableSelect = useCallback((tableNumber: number) => {
    const table = tables.find(t => t.tableNumber === tableNumber);
    if (!table || table.status !== 'AVAILABLE') {
      toast.error(`Table ${tableNumber} is not available`);
      return;
    }
    
    setSelectedTableNumber(tableNumber);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('table', tableNumber.toString());
    navigate(url.pathname + url.search, { replace: true });
    
    toast.success(`Table ${tableNumber} selected`);
  }, [tables, navigate]);
  
  const handleSeatTable = useCallback(() => {
    if (!selectedTableNumber || guestCount <= 0) {
      toast.error('Please select a table and set guest count');
      return;
    }
    
    const table = tables.find(t => t.tableNumber === selectedTableNumber);
    if (!table) {
      toast.error('Table not found');
      return;
    }
    
    if (guestCount > table.capacity) {
      toast.error(`Table ${selectedTableNumber} can only seat ${table.capacity} guests`);
      return;
    }
    
    const now = new Date();
    const orderId = `table-${selectedTableNumber}-${now.getTime()}`;
    
    setTables(prev => prev.map(t => 
      t.tableNumber === selectedTableNumber
        ? {
            ...t,
            status: 'SEATED',
            guestCount,
            occupiedAt: now,
            activeOrderId: orderId,
            orders: [{
              orderId,
              items: [],
              createdAt: now,
              lastUpdatedAt: now,
              paymentStatus: 'PENDING'
            }]
          }
        : t
    ));
    
    toast.success(`Table ${selectedTableNumber} seated with ${guestCount} guests`);
  }, [selectedTableNumber, guestCount, tables]);
  
  const handleUpdateTableStatus = useCallback((tableNumber: number, status: Table['status']) => {
    const { user } = useSimpleAuth();
    
    setTables(prev => prev.map(table => {
      if (table.tableNumber === tableNumber) {
        // Create audit entry for status change
        if (table.activeOrderId && user) {
          createStatusChangeAudit(
            table.activeOrderId,
            user.id,
            user.first_name || user.email || 'Staff',
            'pos',
            table.status,
            status
          );
        }
        
        const now = new Date();
        
        if (status === 'AVAILABLE') {
          // Reset table completely
          return initializeTable(tableNumber, table.capacity, 'AVAILABLE');
        }
        
        return {
          ...table,
          status,
          lastUpdatedAt: now
        };
      }
      return table;
    }));
    
    toast.success(`Table ${tableNumber} status updated to ${status}`);
  }, []);
  
  const handleResetTable = useCallback((tableNumber: number) => {
    setTables(prev => prev.map(table => 
      table.tableNumber === tableNumber
        ? initializeTable(tableNumber, table.capacity, 'AVAILABLE')
        : table
    ));
    
    if (selectedTableNumber === tableNumber) {
      setSelectedTableNumber(null);
      setGuestCount(1);
    }
    
    toast.success(`Table ${tableNumber} has been reset`);
  }, [selectedTableNumber]);
  
  // Utility functions
  const getCurrentTableData = useCallback((): Table | null => {
    if (!selectedTableNumber) return null;
    return tables.find(t => t.tableNumber === selectedTableNumber) || null;
  }, [selectedTableNumber, tables]);
  
  const getTableStatusColor = useCallback((status: Table['status'], sentToKitchen?: boolean): string => {
    switch (status) {
      case 'AVAILABLE': return '#22c55e'; // green
      case 'SEATED': return '#3b82f6'; // blue
      case 'ORDERED': return sentToKitchen ? '#8b5cf6' : '#f59e0b'; // purple if sent, orange if not
      case 'BILL_REQUESTED': return '#ec4899'; // pink
      case 'PAYMENT_PROCESSING': return '#06b6d4'; // cyan
      case 'PAYMENT_COMPLETE': return '#10b981'; // emerald
      default: return '#6b7280'; // gray
    }
  }, []);
  
  const getTableStatusLabel = useCallback((status: Table['status']): string => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'SEATED': return 'Seated';
      case 'ORDERED': return 'Ordered';
      case 'BILL_REQUESTED': return 'Bill Requested';
      case 'PAYMENT_PROCESSING': return 'Processing Payment';
      case 'PAYMENT_COMPLETE': return 'Payment Complete';
      default: return 'Unknown';
    }
  }, []);
  
  const getTimeOccupied = useCallback((occupiedAt: Date | null): string => {
    if (!occupiedAt) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - occupiedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  }, []);
  
  // Kitchen operations
  const handleSendToKitchen = useCallback(() => {
    if (!selectedTableNumber) {
      toast.error('No table selected');
      return;
    }
    
    const tableData = getCurrentTableData();
    if (!tableData || !tableData.activeOrderId) {
      toast.error('No active order found');
      return;
    }
    
    const now = new Date();
    
    setTables(prev => prev.map(table => 
      table.tableNumber === selectedTableNumber
        ? {
            ...table,
            sentToKitchen: true,
            hasNewItems: false,
            lastSentToKitchenAt: now,
            status: 'ORDERED'
          }
        : table
    ));
    
    // Sync with kitchen service
    kitchenService.updateOrderStatus(tableData.activeOrderId, 'IN_KITCHEN');
    kitchenService.syncWithPOS(tables);
    
    toast.success(`Order sent to kitchen for Table ${selectedTableNumber}`);
  }, [selectedTableNumber, getCurrentTableData, tables]);
  
  const getKitchenTicketsCount = useCallback((): number => {
    return tables.reduce((count, table) => {
      return count + (table.sentToKitchen && table.status === 'ORDERED' ? 1 : 0);
    }, 0);
  }, [tables]);
  
  // Bill operations
  const handlePrintBill = useCallback(() => {
    if (!selectedTableNumber) {
      toast.error('No table selected');
      return;
    }
    
    const tableData = getCurrentTableData();
    if (!tableData) {
      toast.error('Table data not found');
      return;
    }
    
    if (!tableData.sentToKitchen) {
      toast.error('Please send order to kitchen before printing bill');
      return;
    }
    
    const now = new Date();
    
    setTables(prev => prev.map(table => 
      table.tableNumber === selectedTableNumber
        ? {
            ...table,
            billPrinted: true,
            lastBillPrintedAt: now,
            status: 'BILL_REQUESTED'
          }
        : table
    ));
    
    toast.success(`Bill printed for Table ${selectedTableNumber}`);
  }, [selectedTableNumber, getCurrentTableData]);
  
  const handleSplitBill = useCallback(() => {
    setShowSplitBillModal(true);
  }, []);
  
  return {
    // Table state
    tables,
    selectedTableNumber,
    guestCount,
    
    // Table operations
    handleTableSelect,
    handleSeatTable,
    handleUpdateTableStatus,
    handleResetTable,
    
    // Guest management
    setGuestCount,
    setSelectedTableNumber,
    
    // Table utilities
    getCurrentTableData,
    getTableStatusColor,
    getTableStatusLabel,
    getTimeOccupied,
    
    // Kitchen operations
    handleSendToKitchen,
    getKitchenTicketsCount,
    
    // Bill operations
    handlePrintBill,
    handleSplitBill,
    
    // Modal states
    showGuestModal,
    setShowGuestModal,
    showSplitBillModal,
    setShowSplitBillModal
  };
};
