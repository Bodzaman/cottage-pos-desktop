// Table linking and guest count validation handlers for POS system
import { TableData } from './tableTypes';

// Guest count validation handler type
export type GuestCountValidationHandler = (
  guestCount: number, 
  shouldLinkTables: boolean
) => void;

// Table linking handler type
export type TableLinkingHandler = (linkedTableNumbers: number[]) => void;

// Create guest count validation handler
export const createGuestCountValidationHandler = (
  selectedTableNumber: number | null,
  setGuestCountForValidation: (count: number) => void,
  setShowGuestModal: (show: boolean) => void,
  setShowTableLinkingModal: (show: boolean) => void,
  handleSeatTable: (guestCount: number) => void
): GuestCountValidationHandler => {
  return (guestCount: number, shouldLinkTables: boolean) => {
    if (!selectedTableNumber) return;
    
    if (shouldLinkTables) {
      // Store guest count for table linking modal
      setGuestCountForValidation(guestCount);
      setShowGuestModal(false);
      setShowTableLinkingModal(true);
    } else {
      // Proceed with normal seating
      handleSeatTable(guestCount);
      setShowGuestModal(false);
    }
  };
};

// Create table linking handler
export const createTableLinkingHandler = (
  selectedTableNumber: number | null,
  guestCountForValidation: number,
  setTables: (updater: (tables: TableData[]) => TableData[]) => void,
  handleSeatTable: (guestCount: number) => void,
  setShowTableLinkingModal: (show: boolean) => void,
  setShowGuestModal: (show: boolean) => void
): TableLinkingHandler => {
  return (linkedTableNumbers: number[]) => {
    if (!selectedTableNumber) return;
    
    console.log('Linking tables:', [selectedTableNumber, ...linkedTableNumbers]);
    
    // Generate unique group ID
    const groupId = `group-${selectedTableNumber}-${Date.now()}`;
    
    // Update primary table with linked table info
    setTables(prevTables => {
      return prevTables.map(table => {
        if (table.tableNumber === selectedTableNumber) {
          return {
            ...table,
            linkedTables: linkedTableNumbers,
            isLinkedPrimary: true,
            linkedGroupId: groupId
          };
        }
        // Mark linked tables as part of the group
        if (linkedTableNumbers.includes(table.tableNumber)) {
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
    handleSeatTable(guestCountForValidation);
    setShowTableLinkingModal(false);
    setShowGuestModal(false);
  };
};
