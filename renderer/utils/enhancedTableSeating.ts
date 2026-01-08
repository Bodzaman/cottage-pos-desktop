/**
 * Enhanced Table Seating Handlers
 * 
 * Complete integration between POS table management and enhanced POSGuestCountModal
 * Supports table linking, capacity validation, and multiple seating scenarios
 */

import { toast } from 'sonner';
import { TableData } from './tableTypes';

/**
 * Enhanced handleSeatTable function signature
 * Supports normal seating, table linking, and capacity override scenarios
 */
export type EnhancedSeatTableHandler = (
  guestCount: number,
  action?: 'normal' | 'link' | 'continue_anyway',
  linkedTables?: number[]
) => void;

/**
 * Create enhanced seat table handler with full table linking support
 */
export const createEnhancedSeatTableHandler = (
  selectedTableNumber: number | null,
  setTables: (updater: (tables: TableData[]) => TableData[]) => void,
  setShowGuestModal: (show: boolean) => void,
  showReservationWarning: boolean,
  setShowReservationWarning: (show: boolean) => void,
  reservedTables: string[] | null
): EnhancedSeatTableHandler => {
  
  return (guestCount: number, action: 'normal' | 'link' | 'continue_anyway' = 'normal', linkedTables?: number[]) => {
    if (!selectedTableNumber || guestCount < 1) return;
    
    console.log('🪑 Seating table with enhanced parameters:', { 
      table: selectedTableNumber, 
      guestCount, 
      action, 
      linkedTables 
    });
    
    // Check if this table has a current reservation
    const tableId = `table-${selectedTableNumber}`;
    const isReserved = reservedTables && Array.isArray(reservedTables) && reservedTables.length > 0 && reservedTables.includes(tableId);
    
    if (isReserved && showReservationWarning) {
      // Warning already shown, proceed with seating
      setShowReservationWarning(false);
    }
    
    // Handle table linking logic
    if (action === 'link' && linkedTables && linkedTables.length > 0) {
      console.log('🔗 Implementing table linking:', { primary: selectedTableNumber, linked: linkedTables });
      
      // Generate unique group ID for linked tables
      const groupId = `group-${selectedTableNumber}-${Date.now()}`;
      
      // Update all linked tables with LINKED status and group information
      setTables(currentTables => 
        currentTables.map(table => {
          if (table.tableNumber === selectedTableNumber) {
            // Primary table - set to OCCUPIED
            return {
              ...table,
              status: 'OCCUPIED' as const,
              guestCount,
              occupiedAt: new Date(),
              groupId,
              isGroupPrimary: true,
              linkedTables
            };
          } else if (linkedTables.includes(table.tableNumber)) {
            // Linked tables - set to LINKED
            return {
              ...table,
              status: 'LINKED' as const,
              guestCount: 0, // Linked tables don't have individual guest counts
              occupiedAt: new Date(),
              groupId,
              isGroupPrimary: false,
              primaryTable: selectedTableNumber
            };
          }
          return table;
        })
      );
      
      toast.success(`Table ${selectedTableNumber} linked with tables ${linkedTables.join(', ')} for ${guestCount} guests`);
    } else {
      // Handle normal seating or continue anyway
      console.log(`✅ Proceeding with ${action} seating`);
      
      setTables(currentTables => 
        currentTables.map(table => 
          table.tableNumber === selectedTableNumber
            ? {
                ...table,
                status: 'OCCUPIED' as const,
                guestCount,
                occupiedAt: new Date(),
                // Clear any existing linking data
                groupId: undefined,
                isGroupPrimary: undefined,
                linkedTables: undefined,
                primaryTable: undefined
              }
            : table
        )
      );
      
      if (action === 'continue_anyway') {
        toast.success(`Table ${selectedTableNumber} seated with ${guestCount} guests (capacity override)`);
      } else {
        toast.success(`Table ${selectedTableNumber} seated with ${guestCount} guests`);
      }
    }
    
    // Close the guest modal
    setShowGuestModal(false);
  };
};

/**
 * Enhanced POSGuestCountModal onSave handler
 * Integrates directly with the enhanced seat table handler
 */
export const createEnhancedModalSaveHandler = (
  enhancedSeatTableHandler: EnhancedSeatTableHandler
) => {
  return (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => {
    console.log('📝 Enhanced modal save:', { guestCount, action, linkedTables });
    enhancedSeatTableHandler(guestCount, action, linkedTables);
  };
};

/**
 * Integration helper to replace basic guest count display
 * Used to remove the basic guest count section in favor of enhanced modal
 */
export const shouldShowBasicGuestCount = (useEnhancedModal: boolean = true): boolean => {
  // Return false when using enhanced modal
  return !useEnhancedModal;
};

/**
 * Migration helper to update existing handleSeatTable calls
 * Provides backward compatibility while supporting enhanced features
 */
export const migrateToEnhancedHandler = (
  oldHandler: (guestCount: number) => void,
  enhancedHandler: EnhancedSeatTableHandler
) => {
  // Return enhanced handler that supports both old and new calling patterns
  return (guestCount: number, action?: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => {
    if (action || linkedTables) {
      // Use enhanced functionality
      enhancedHandler(guestCount, action, linkedTables);
    } else {
      // Backward compatibility - use normal seating
      enhancedHandler(guestCount, 'normal');
    }
  };
};
