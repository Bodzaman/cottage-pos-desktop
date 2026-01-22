
import React, { useState, useEffect } from 'react';
import { POSGuestCountModalClean } from './POSGuestCountModalClean';

// Global modal state management
let globalModalState = {
  isOpen: false,
  tableNumber: 0,
  tableCapacity: 4,
  onSave: (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => {},
  onClose: () => {}
};

let setGlobalModalState: React.Dispatch<React.SetStateAction<typeof globalModalState>> | null = null;

// Global functions to control the modal
export const openGuestCountModal = (
  tableNumber: number,
  tableCapacity: number,
  onSave: (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => void
) => {
  if (setGlobalModalState) {
    setGlobalModalState({
      isOpen: true,
      tableNumber,
      tableCapacity,
      onSave,
      onClose: () => closeGuestCountModal()
    });
  }
};

export const closeGuestCountModal = () => {
  if (setGlobalModalState) {
    setGlobalModalState(prev => ({ ...prev, isOpen: false }));
  }
};

// Global Modal Provider Component
export const GlobalGuestCountModal: React.FC = () => {
  const [modalState, setModalState] = useState(globalModalState);
  
  useEffect(() => {
    setGlobalModalState = setModalState;
    return () => {
      setGlobalModalState = null;
    };
  }, []);

  if (!modalState.isOpen) {
    return null;
  }

  return (
    <POSGuestCountModalClean
      isOpen={modalState.isOpen}
      onClose={modalState.onClose}
      tableNumber={modalState.tableNumber}
      tableCapacity={modalState.tableCapacity}
      onSave={modalState.onSave}
      initialGuestCount={1}
    />
  );
};

// Hook for table click functionality
export const useGlobalTableClick = () => {
  useEffect(() => {
    const handleTableClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Look for table buttons or containers
      const tableElement = target.closest('[data-table-number], .table-button, .table-container');
      
      if (tableElement) {
        // Extract table number from various possible attributes/classes
        let tableNumber: number | null = null;
        
        // Check data attribute first
        const dataTableNumber = tableElement.getAttribute('data-table-number');
        if (dataTableNumber) {
          tableNumber = parseInt(dataTableNumber);
        }
        
        // Check for text content like "T1", "T2", etc.
        if (!tableNumber) {
          const textContent = tableElement.textContent?.trim();
          const tableMatch = textContent?.match(/T(\d+)/);
          if (tableMatch) {
            tableNumber = parseInt(tableMatch[1]);
          }
        }
        
        // Check for class names
        if (!tableNumber) {
          const classList = Array.from(tableElement.classList);
          for (const className of classList) {
            const classMatch = className.match(/table-(\d+)/);
            if (classMatch) {
              tableNumber = parseInt(classMatch[1]);
              break;
            }
          }
        }
        
        if (tableNumber) {
          
          // Open the enhanced modal
          openGuestCountModal(
            tableNumber,
            4, // Default capacity
            (guestCount, action, linkedTables) => {
              
              // Here we could dispatch a custom event or call a global function
              // For now, just log the action
              if (action === 'link' && linkedTables) {
              } else {
              }
              
              closeGuestCountModal();
            }
          );
          
          // Prevent the original click handler from running
          event.stopPropagation();
          event.preventDefault();
        }
      }
    };

    // Add click listener with high priority (capture phase)
    document.addEventListener('click', handleTableClick, true);
    
    return () => {
      document.removeEventListener('click', handleTableClick, true);
    };
  }, []);
};

export default GlobalGuestCountModal;
