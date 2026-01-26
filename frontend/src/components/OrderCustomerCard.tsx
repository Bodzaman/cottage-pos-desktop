import React, { useMemo } from 'react';
import { Clock, Package, Truck } from 'lucide-react';

import { TakeawayModeToggle, TakeawaySubMode } from './TakeawayModeToggle';
import { POSButton, POSButtonColorScheme } from './POSButton';
import { POSCustomerSearchForm } from './POSCustomerSearchForm';
import { POSActiveCustomerCard } from './POSActiveCustomerCard';
import { usePOSCustomerStore } from '../utils/posCustomerStore';
import { cn } from 'utils/cn';

interface Props {
  orderType: 'COLLECTION' | 'DELIVERY' | 'WAITING';
  onModeChange: (mode: TakeawaySubMode) => void;
  onTakeOrder: () => void;
  onEdit: () => void;
  onViewOrders: () => void;
  onClear: () => void;
  className?: string;
}

// Mode-specific styling configuration
const modeConfig = {
  WAITING: {
    icon: Clock,
    label: 'Start Order',
    subtitle: 'Add customer name & phone',
    colorScheme: 'amber' as POSButtonColorScheme,
    chipBg: 'rgba(180, 83, 9, 0.15)',
    chipText: 'rgba(251, 191, 36, 0.9)',
    chipLabel: 'Waiting',
  },
  COLLECTION: {
    icon: Package,
    label: 'Start Order',
    subtitle: 'Add customer name & phone',
    colorScheme: 'purple' as POSButtonColorScheme,
    chipBg: 'rgba(124, 58, 237, 0.15)',
    chipText: 'rgba(167, 139, 250, 0.9)',
    chipLabel: 'Collection',
  },
  DELIVERY: {
    icon: Truck,
    label: 'Start Order',
    subtitle: 'Add customer & delivery address',
    colorScheme: 'teal' as POSButtonColorScheme,
    chipBg: 'rgba(13, 148, 136, 0.15)',
    chipText: 'rgba(94, 234, 212, 0.9)',
    chipLabel: 'Delivery',
  },
};

/**
 * OrderCustomerCard - Zone 1 component for Take Away mode
 *
 * Two states:
 * 1. Empty: search bar + Start Order CTA
 * 2. Active: compact customer card for the current order
 */
export function OrderCustomerCard({
  orderType,
  onModeChange,
  onTakeOrder,
  onEdit,
  onViewOrders,
  onClear,
  className = ''
}: Props) {
  const customerData = usePOSCustomerStore(state => state.customerData);
  const hasCustomerData = customerData.firstName || customerData.lastName || customerData.phone;

  const config = useMemo(() => modeConfig[orderType] || modeConfig.COLLECTION, [orderType]);
  const ModeIcon = config.icon;

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* A. Compact Header */}
      <div
        className="px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
        >
          Take Away
        </h2>
      </div>

      {/* B. Customer Search (compact, subtle - only in empty state) */}
      {!hasCustomerData && (
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <POSCustomerSearchForm
            orderType={orderType}
            onCustomerNeedsAddress={onTakeOrder}
          />
        </div>
      )}

      {/* C. Segmented Control (prominent) */}
      <div className="px-3 pt-2 pb-3 flex-shrink-0">
        <TakeawayModeToggle
          currentMode={orderType}
          onModeChange={onModeChange}
        />
      </div>

      {/* D. Customer Section */}
      <div className="px-3 flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Section header with mode chip */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <span
            className="text-xs font-medium"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Customer
          </span>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
            style={{
              background: config.chipBg,
              color: config.chipText,
            }}
          >
            {config.chipLabel}
          </span>
        </div>

        {/* Content: Empty state OR Active customer card */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {hasCustomerData ? (
            /* Active state: compact customer card */
            <POSActiveCustomerCard
              customerData={customerData}
              orderType={orderType}
              onClear={onClear}
              onEdit={onEdit}
              onViewOrders={onViewOrders}
            />
          ) : (
            /* Empty state: Start Order */
            <POSButton
              variant="primary"
              colorScheme={config.colorScheme}
              fullWidth
              onClick={onTakeOrder}
              icon={<ModeIcon className="w-8 h-8 text-white" />}
              subtitle={config.subtitle}
              hint="Tap to start"
            >
              {config.label}
            </POSButton>
          )}
        </div>
      </div>

      {/* D. Bottom idle area (only when no customer) */}
      {!hasCustomerData && (
        <div
          className="mt-auto px-3 py-3 flex-shrink-0 text-center"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            No order selected
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
            Select an order to view details
          </p>
        </div>
      )}
    </div>
  );
}
