import React, { useEffect, useRef } from 'react';
import { usePOSCustomerIntelligence } from '../utils/usePOSCustomerIntelligence';
import { POSCustomerSearchForm } from './POSCustomerSearchForm';
import { POSCustomerProfileCard } from './POSCustomerProfileCard';
import { RecentOrder } from '../utils/usePOSCustomerIntelligence';
import { Loader2 } from 'lucide-react';
import { QSAITheme } from '../utils/QSAIDesign';

interface POSCustomerIntelligencePanelProps {
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  onCustomerSelected?: (customer: any) => void;
  onOrderAgain: (order: RecentOrder) => void;
  onViewOrders?: () => void;
  onClear?: () => void;
  className?: string;
}

/**
 * POSCustomerIntelligencePanel - Main orchestrator component
 * 
 * Manages 3 view states:
 * 1. SEARCH - Shows search form with 1 intelligent search bar
 * 2. LOADING - Shows spinner "Searching..."
 * 3. PROFILE - Shows customer card with action buttons
 * 
 * Features:
 * - Smooth expand/collapse animations (300ms cubic-bezier)
 * - Unified customer intelligence (search → profile)
 * - "View Orders" opens modal (handled by parent)
 * - Clear/reset to search mode
 * - QSAI purple theme throughout
 */
export function POSCustomerIntelligencePanel({
  orderType,
  onCustomerSelected,
  onOrderAgain,
  onViewOrders,
  onClear,
  className = ''
}: POSCustomerIntelligencePanelProps) {
  const { viewMode, isSearching, customerProfile, orderHistory, searchError, clearCustomer } = usePOSCustomerIntelligence();

  // Track if we've already notified parent about current customer
  const lastNotifiedCustomerIdRef = useRef<string | null>(null);

  // ✅ CALLBACK REF PATTERN: Store callback in ref to prevent effect re-runs
  // This ref always has the latest callback without triggering the effect
  const onCustomerSelectedRef = useRef(onCustomerSelected);
  
  // Update ref on every render to always have latest callback
  useEffect(() => {
    onCustomerSelectedRef.current = onCustomerSelected;
  }, [onCustomerSelected]);

  // Handle clear action
  const handleClear = () => {
    clearCustomer();
    if (onClear) {
      onClear();
    }
  };

  return (
    <div 
      className="
        rounded-lg border border-zinc-700/50 
        bg-zinc-900/30 backdrop-blur-sm
        overflow-hidden
        transition-all duration-300 ease-out
        flex flex-col
        ${className}
      "
      style={{ maxHeight: '100%' }}
    >
      {/* Panel Header */}
      <div 
        className="px-4 py-3 border-2 border-white/20 rounded-t-lg"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 50%, ${QSAITheme.purple.primary} 100%)`,
        }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <h3 className="text-white font-bold text-lg tracking-wide">Search Customer</h3>
          {orderType !== 'DINE-IN' && (
            <span className="text-white/70 text-sm font-medium uppercase tracking-wider mt-0.5">
              ({orderType})
            </span>
          )}
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-4 overflow-y-auto flex-1 min-h-0">
        {/* STATE 1: SEARCH MODE */}
        {viewMode === 'search' && (
          <div 
            className="animate-in fade-in slide-in-from-top-2 duration-300"
            style={{ animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <POSCustomerSearchForm />
          </div>
        )}

        {/* STATE 2: LOADING MODE */}
        {viewMode === 'loading' && (
          <div 
            className="flex flex-col items-center justify-center py-8 animate-in fade-in zoom-in-95 duration-200"
          >
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-3" />
            <p className="text-sm text-purple-300 font-medium">Searching...</p>
            <p className="text-xs text-gray-500 mt-1">Loading customer profile</p>
          </div>
        )}

        {/* STATE 3: PROFILE MODE */}
        {viewMode === 'profile' && customerProfile && (
          <div 
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{ animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {/* Customer Profile Card */}
            <POSCustomerProfileCard
              customer={customerProfile}
              onClear={handleClear}
              onCustomerSelected={onCustomerSelected}
              onViewOrders={onViewOrders}
            />
          </div>
        )}
      </div>
    </div>
  );
};
