/**
 * Screen Reader Announcement Utility
 * 
 * Provides accessible announcements for dynamic content changes
 * using ARIA live regions.
 */

/**
 * Announce a message to screen readers
 * 
 * @param message - The message to announce
 * @param priority - 'polite' (wait for user to finish) or 'assertive' (interrupt)
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Get or create the live region
  let liveRegion = document.getElementById('sr-announcer');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-announcer';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only'; // Visually hidden but accessible
    
    // Add visually hidden styles
    Object.assign(liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    
    document.body.appendChild(liveRegion);
  }
  
  // Update the aria-live priority if needed
  if (liveRegion.getAttribute('aria-live') !== priority) {
    liveRegion.setAttribute('aria-live', priority);
  }
  
  // Clear previous message
  liveRegion.textContent = '';
  
  // Announce new message after a brief delay to ensure screen readers pick it up
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
}

/**
 * Announce filter changes to screen readers
 * 
 * @param filterType - Type of filter changed (e.g., 'Asset Type', 'Status')
 * @param filterValue - New filter value or description
 * @param resultCount - Number of results after filtering
 */
export function announceFilterChange(
  filterType: string,
  filterValue: string,
  resultCount?: number
): void {
  let message = `${filterType} filter changed to ${filterValue}`;
  
  if (resultCount !== undefined) {
    message += `. Showing ${resultCount} ${resultCount === 1 ? 'result' : 'results'}`;
  }
  
  announceToScreenReader(message, 'polite');
}

/**
 * Announce when filters are cleared
 * 
 * @param resultCount - Number of results after clearing
 */
export function announceFiltersClear(resultCount: number): void {
  const message = `All filters cleared. Showing ${resultCount} ${resultCount === 1 ? 'result' : 'results'}`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announce when an item is selected/deselected
 * 
 * @param itemName - Name of the item
 * @param isSelected - Whether the item is now selected or deselected
 */
export function announceSelection(
  itemName: string,
  isSelected: boolean
): void {
  const message = `${itemName} ${isSelected ? 'selected' : 'deselected'}`;
  announceToScreenReader(message, 'polite');
}
