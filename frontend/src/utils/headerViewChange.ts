/**
 * Shared utilities for header-triggered view changes on POS pages
 * Provides unified event handling for view switching from ManagementHeader buttons
 */

export type HeaderViewType = 'pos' | 'reservations' | 'kitchen' | 'online-orders' | 'website' | 'reconciliation' | 'admin';

export interface HeaderViewChangeEvent {
  view: HeaderViewType;
}

/**
 * Set up event listener for header view change events
 * @param callback Function to handle view changes
 * @returns Cleanup function to remove the event listener
 */
export function setupHeaderViewChangeListener(
  callback: (event: HeaderViewChangeEvent) => void
): () => void {
  const handleHeaderViewChange = (event: CustomEvent<HeaderViewChangeEvent>) => {
    callback(event.detail);
  };

  document.addEventListener('header-view-change', handleHeaderViewChange as EventListener);
  
  return () => {
    document.removeEventListener('header-view-change', handleHeaderViewChange as EventListener);
  };
}

/**
 * Dispatch a header view change event
 * @param view The view to change to
 */
export function dispatchHeaderViewChange(view: HeaderViewType): void {
  document.dispatchEvent(new CustomEvent('header-view-change', { 
    detail: { view } 
  }));
}

/**
 * React hook for handling header view changes
 * @param onViewChange Callback for when view changes
 * @returns Setup function to call in useEffect
 */
export function useHeaderViewChange(
  onViewChange: (view: HeaderViewType) => void
) {
  return () => {
    return setupHeaderViewChangeListener(({ view }) => {
      onViewChange(view);
    });
  };
}
