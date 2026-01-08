import { toast } from 'sonner';

/**
 * Manager Override Utility
 * 
 * Provides a centralized way to handle manager overrides with password verification
 * for both POSDesktop components.
 */

export interface ManagerOverrideOptions {
  onSuccess: () => void;
  onCancel?: () => void;
  reason?: string;
}

/**
 * Triggers manager override flow with password verification
 * @param options Configuration for the override flow
 * @returns Promise resolving to boolean indicating success
 */
export const triggerManagerOverride = async (
  showPasswordDialog: (show: boolean) => void,
  setPendingAction: (action: (() => void) | null) => void,
  options: ManagerOverrideOptions
): Promise<void> => {
  // Store the pending action to execute after successful authentication
  setPendingAction(() => options.onSuccess);
  
  // Show the password dialog
  showPasswordDialog(true);
  
  // Toast to inform user about the override requirement
  toast.info('🔐 Manager authentication required for override');
};

/**
 * Handles successful manager authentication
 * @param pendingAction The action to execute after successful authentication
 * @param clearPendingAction Function to clear the pending action
 * @param showPasswordDialog Function to control password dialog visibility
 */
export const handleManagerAuthSuccess = (
  pendingAction: (() => void) | null,
  clearPendingAction: () => void,
  showPasswordDialog: (show: boolean) => void
): void => {
  // Close password dialog
  showPasswordDialog(false);
  
  // Execute the pending action if it exists
  if (pendingAction) {
    pendingAction();
    clearPendingAction();
    toast.success('🔐 Manager override approved');
  }
};

/**
 * Handles manager authentication cancellation
 * @param options Override options for cancel callback
 * @param clearPendingAction Function to clear the pending action
 * @param showPasswordDialog Function to control password dialog visibility
 */
export const handleManagerAuthCancel = (
  options: ManagerOverrideOptions | null,
  clearPendingAction: () => void,
  showPasswordDialog: (show: boolean) => void
): void => {
  // Close password dialog
  showPasswordDialog(false);
  
  // Execute cancel callback if provided
  if (options?.onCancel) {
    options.onCancel();
  }
  
  // Clear pending action
  clearPendingAction();
  
  toast.info('Manager override cancelled');
};
