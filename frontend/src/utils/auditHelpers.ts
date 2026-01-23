/**
 * Audit Helpers
 * Functions for creating audit trail entries
 */

/**
 * Create an audit entry for order status changes
 * @param orderId - The order ID
 * @param userId - The user who made the change
 * @param userName - Display name of the user
 * @param source - Source of the change (pos, online, etc.)
 * @param previousStatus - Previous order status
 * @param newStatus - New order status
 */
export function createStatusChangeAudit(
  orderId: string,
  userId: string,
  userName: string,
  source: string,
  previousStatus: string,
  newStatus: string
): void {
  // Log audit entry for now - can be extended to store in database
  console.log('[Audit] Status change:', {
    orderId,
    userId,
    userName,
    source,
    previousStatus,
    newStatus,
    timestamp: new Date().toISOString()
  });
}

/**
 * Create an audit entry for general actions
 */
export function createActionAudit(
  action: string,
  userId: string,
  userName: string,
  details?: Record<string, unknown>
): void {
  console.log('[Audit] Action:', {
    action,
    userId,
    userName,
    details,
    timestamp: new Date().toISOString()
  });
}
