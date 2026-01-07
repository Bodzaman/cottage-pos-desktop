/**
 * Customer Tab Adapter Utilities
 * 
 * Adapts event-driven customer tab hook signatures to match CustomerTabsCompact interface.
 * useCustomerTabs returns Promise<string | null> and Promise<boolean>
 * CustomerTabsCompact expects Promise<void>
 * These wrappers throw errors on failure to provide proper UI feedback
 */

/**
 * Wraps event-driven createTab to match Promise<void> signature
 * Throws error if tab creation fails
 */
export function wrapCreateTabHandler(
  handler: ((tabName: string) => Promise<string | null>) | undefined
): ((tabName: string) => Promise<void>) | undefined {
  if (!handler) return undefined;
  
  return async (tabName: string): Promise<void> => {
    const tabId = await handler(tabName);
    if (!tabId) {
      throw new Error('Failed to create customer tab');
    }
    // Success - resolves normally
  };
}

/**
 * Wraps event-driven renameTab to match Promise<void> signature
 * Throws error if rename fails
 */
export function wrapRenameTabHandler(
  handler: ((tabId: string, newName: string) => Promise<boolean>) | undefined
): ((tabId: string, newName: string) => Promise<void>) | undefined {
  if (!handler) return undefined;
  
  return async (tabId: string, newName: string): Promise<void> => {
    const success = await handler(tabId, newName);
    if (!success) {
      throw new Error('Failed to rename customer tab');
    }
    // Success - resolves normally
  };
}

/**
 * Wraps event-driven closeTab to match Promise<void> signature
 * Throws error if close fails
 */
export function wrapCloseTabHandler(
  handler: ((tabId: string) => Promise<boolean>) | undefined
): ((tabId: string) => Promise<void>) | undefined {
  if (!handler) return undefined;
  
  return async (tabId: string): Promise<void> => {
    const success = await handler(tabId);
    if (!success) {
      throw new Error('Failed to close customer tab');
    }
    // Success - resolves normally
  };
}
