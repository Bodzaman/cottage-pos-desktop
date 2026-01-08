import React from 'react';
import { RefundManagementPanel } from './RefundManagementPanel';

interface AdminRefundSectionProps {
  className?: string;
}

/**
 * Admin section wrapper for refund management
 * Provides consistent styling and layout for admin dashboard integration
 */
export function AdminRefundSection({ className }: AdminRefundSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <RefundManagementPanel />
    </div>
  );
}
