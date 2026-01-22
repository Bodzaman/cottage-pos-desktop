import React from 'react';
import { colors, gridBackgroundStyle } from '../utils/designSystem';
import { ManagementHeader } from '../components/ManagementHeader';
import { ProtectedRoute } from '../utils/ProtectedRoute';
import { AllOrdersView } from '../components/AllOrdersView';

export default function Reconciliation() {
  return (
    <ProtectedRoute requireAuth requireStaff>
      {/* 
        This page now renders the comprehensive AllOrdersView component
        which shows ALL order types and sources in a unified interface,
        replacing the previous OnlineOrdersView that only showed online orders.
      */}
      <AllOrdersView onBack={() => window.history.back()} />
    </ProtectedRoute>
  );
}
