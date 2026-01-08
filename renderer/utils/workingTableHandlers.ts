
// Working table linking implementation for POS system
// This fixes the modal callback handlers to properly implement capacity validation and table linking

import { TableData } from './tableTypes';

// Fix for GuestCountModal onConfirm handler
export const createWorkingGuestCountHandler = (
  selectedTableNumber: number | null,
  setGuestCountForValidation: (count: number) => void,
  setShowGuestModal: (show: boolean) => void,
  setShowTableLinkingModal: (show: boolean) => void,
  handleSeatTable: (guestCount: number) => void
) => {
  return (guestCount: number, action: 'normal' | 'link' | 'continue_anyway') => {
    console.log('🔍 Guest Count Validation:', { guestCount, action, selectedTableNumber });
    
    if (!selectedTableNumber) {
      console.warn('No table selected for guest count validation');
      return;
    }
    
    if (action === 'link') {
      console.log('🔗 Triggering table linking flow');
      // Store guest count for table linking modal
      setGuestCountForValidation(guestCount);
      setShowGuestModal(false);
      setShowTableLinkingModal(true);
    } else {
      console.log(`✅ Proceeding with ${action} seating`);
      // Proceed with normal seating or continue anyway
      handleSeatTable(guestCount);
      setShowGuestModal(false);
    }
  };
};

// Fix for TableLinkingModal onConfirm handler
export const createWorkingTableLinkingHandler = (
  selectedTableNumber: number | null,
  guestCountForValidation: number,
  setTables: (updater: (tables: TableData[]) => TableData[]) => void,
  handleSeatTable: (guestCount: number) => void,
  setShowTableLinkingModal: (show: boolean) => void,
  setShowGuestModal: (show: boolean) => void
) => {
  return (linkedTableNumbers: number[]) => {
    console.log('🔗 Table Linking Confirmed:', { 
      primary: selectedTableNumber, 
      linked: linkedTableNumbers, 
      guestCount: guestCountForValidation 
    });
    
    if (!selectedTableNumber) {
      console.warn('No primary table selected for linking');
      return;
    }
    
    // Generate unique group ID
    const groupId = `group-${selectedTableNumber}-${Date.now()}`;
    console.log('📝 Generated group ID:', groupId);
    
    // Update tables with linking relationships
    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.tableNumber === selectedTableNumber) {
          console.log('🎯 Updating primary table:', table.tableNumber);
          return {
            ...table,
            linkedTables: linkedTableNumbers,
            isLinkedPrimary: true,
            linkedGroupId: groupId
          };
        }
        // Mark linked tables as part of the group
        if (linkedTableNumbers.includes(table.tableNumber)) {
          console.log('🔗 Updating linked table:', table.tableNumber);
          return {
            ...table,
            isLinkedTable: true,
            linkedGroupId: groupId,
            linkedToPrimary: selectedTableNumber
          };
        }
        return table;
      });
    });
    
    // Proceed with seating using the validated guest count
    console.log('🪑 Seating guests on linked tables');
    handleSeatTable(guestCountForValidation);
    setShowTableLinkingModal(false);
    setShowGuestModal(false);
  };
};
