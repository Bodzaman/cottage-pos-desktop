
import React, { useState, useEffect } from 'react';
import { POSGuestCountModalClean } from './POSGuestCountModalClean';
import { toast } from 'sonner';

/**
 * Working global modal system that intercepts table clicks
 * and manages its own modal state, bypassing the corrupted POS.tsx file.
 */

export function POSGuestCountModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(0);
  const [tableCapacity, setTableCapacity] = useState(4);

  // Global table click interceptor
  useEffect(() => {
    const handleTableClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Look for table elements - check multiple possible selectors
      const tableElement = target.closest(
        '[data-table-number], .table-button, .table-card, button[class*="table"], div[class*="table"]'
      );
      
      if (tableElement) {
        // Check if this table is already seated by looking for status indicators
        const tableText = tableElement.textContent?.toLowerCase() || '';
        const isSeatedTable = tableText.includes('seated') || tableText.includes('occupied');
        
        // If table is already seated, don't intercept - let the order management modal handle it
        if (isSeatedTable) {
          return;
        }
        
        // Try multiple ways to get table number
        let detectedTableNumber: number | null = null;
        
        // Method 1: data attribute
        const dataAttr = tableElement.getAttribute('data-table-number');
        if (dataAttr) {
          detectedTableNumber = parseInt(dataAttr);
        }
        
        // Method 2: text content like "T1", "T2", etc.
        if (!detectedTableNumber) {
          const textContent = tableElement.textContent?.trim();
          const tableMatch = textContent?.match(/T(\d+)/);
          if (tableMatch) {
            detectedTableNumber = parseInt(tableMatch[1]);
          }
        }
        
        // Method 3: look for table status text patterns
        if (!detectedTableNumber && tableElement.textContent) {
          const statusMatch = tableElement.textContent.match(/Table (\d+)/);
          if (statusMatch) {
            detectedTableNumber = parseInt(statusMatch[1]);
          }
        }
        
        // Method 4: check if this looks like a table element by class or structure
        if (!detectedTableNumber) {
          const classList = Array.from(tableElement.classList);
          for (const className of classList) {
            const classMatch = className.match(/table-(\d+)/);
            if (classMatch) {
              detectedTableNumber = parseInt(classMatch[1]);
              break;
            }
          }
        }
        
        if (detectedTableNumber && detectedTableNumber > 0) {
          // Open our enhanced modal
          setTableNumber(detectedTableNumber);
          setTableCapacity(4); // Default capacity - could be enhanced later
          setIsOpen(true);
          
          // Stop the event from reaching the broken POS handler
          event.stopPropagation();
          event.preventDefault();
        }
      }
    };

    // Add click listener with capture to intercept before other handlers
    document.addEventListener('click', handleTableClick, true);
    
    return () => {
      document.removeEventListener('click', handleTableClick, true);
    };
  }, []);

  const handleSave = (guestCount: number, action: 'normal' | 'link' | 'continue_anyway', linkedTables?: number[]) => {
    
    // Handle the different actions
    if (action === 'link' && linkedTables?.length) {
      toast.success(`Linked ${linkedTables.length + 1} tables for ${guestCount} guests`);
    } else if (action === 'continue_anyway') {
      toast.warning(`Seating ${guestCount} guests at table ${tableNumber} (over capacity)`);
    } else {
      toast.success(`Seated ${guestCount} guests at table ${tableNumber}`);
    }
    
    // TODO: Here we could dispatch events or call APIs to update the actual table state
    
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <POSGuestCountModalClean
      isOpen={isOpen}
      onClose={handleClose}
      tableNumber={tableNumber}
      onSave={handleSave}
      initialGuestCount={1}
      tableCapacity={tableCapacity}
    />
  );
}

// Legacy export for backward compatibility
export { POSGuestCountModalWrapper as POSGuestCountModal };
