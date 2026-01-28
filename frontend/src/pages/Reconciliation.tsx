import React from 'react';
import ZReport from './ZReport';

/**
 * Reconciliation Page
 *
 * This page now renders the new Z-Report component for end-of-day reconciliation.
 * The Z-Report provides:
 * - Sales summary by channel (Dine-In, POS Takeaway, Online)
 * - Payment breakdown (Cash vs Card)
 * - Cash drawer reconciliation
 * - Thermal printing support
 *
 * For the legacy AllOrdersView (order listing), use /all-orders instead.
 */
export default function Reconciliation() {
  return <ZReport />;
}
