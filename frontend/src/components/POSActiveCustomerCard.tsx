import React from 'react';
import { X, Phone, Mail, MapPin, Edit, ArrowRight } from 'lucide-react';
import { CustomerData } from '../utils/posCustomerStore';

interface POSActiveCustomerCardProps {
  customerData: CustomerData;
  orderType: 'COLLECTION' | 'DELIVERY' | 'WAITING';
  onClear: () => void;
  onEdit: () => void;
  onViewOrders?: () => void;
}

export function POSActiveCustomerCard({
  customerData,
  orderType,
  onClear,
  onEdit,
  onViewOrders,
}: POSActiveCustomerCardProps) {
  const fullName = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Customer';
  const hasAddress = customerData.address || customerData.street || customerData.postcode;
  const showAddress = orderType === 'DELIVERY' || hasAddress;

  const addressText = [
    customerData.street || customerData.address,
    customerData.city,
    customerData.postcode,
  ].filter(Boolean).join(', ');

  return (
    <div
      className="rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
      style={{
        background: 'rgba(24, 24, 27, 0.6)',
        border: '1px solid rgba(63, 63, 70, 0.5)',
      }}
    >
      {/* Header */}
      <div
        className="px-3.5 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.3)' }}
      >
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Customer for this order
        </span>
        <button
          onClick={onClear}
          className="p-1 rounded hover:bg-red-500/10 transition-colors group"
          title="Clear customer"
        >
          <X className="h-3.5 w-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* Customer Details */}
      <div className="px-3.5 py-3 space-y-1.5">
        {/* Name */}
        <p className="text-sm font-semibold text-white truncate">{fullName}</p>

        {/* Phone (prominent) */}
        {customerData.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
            <span className="text-sm font-mono text-white/90">{customerData.phone}</span>
          </div>
        )}

        {/* Email */}
        {customerData.email && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail className="h-3 w-3 text-zinc-500 flex-shrink-0" />
            <span className="text-xs text-zinc-400 truncate">{customerData.email}</span>
          </div>
        )}

        {/* Address (max 2 lines, only for delivery or when present) */}
        {showAddress && addressText && (
          <div className="flex items-start gap-1.5 pt-1">
            <MapPin className="h-3 w-3 text-orange-400/80 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{addressText}</span>
          </div>
        )}
      </div>

      {/* Chip Row (only if rich data exists) */}
      {(customerData.customerRef || customerData.recentOrderCount) && (
        <div
          className="px-3.5 pb-2 flex items-center gap-1.5 flex-wrap"
        >
          {customerData.customerRef && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
              style={{
                border: '1px solid rgba(124, 58, 237, 0.3)',
                color: 'rgba(167, 139, 250, 0.9)',
                background: 'rgba(124, 58, 237, 0.08)',
              }}
            >
              {customerData.customerRef}
            </span>
          )}
          {customerData.recentOrderCount != null && customerData.recentOrderCount > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
              style={{
                border: '1px solid rgba(63, 63, 70, 0.5)',
                color: 'rgba(161, 161, 170, 0.9)',
              }}
            >
              {customerData.recentOrderCount} order{customerData.recentOrderCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div
        className="px-3.5 py-2.5 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(63, 63, 70, 0.3)' }}
      >
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5"
          style={{
            background: 'rgba(124, 58, 237, 0.12)',
            color: 'rgba(167, 139, 250, 0.95)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.25)';
          }}
        >
          <Edit className="h-3 w-3" />
          Edit
        </button>

        {onViewOrders && (
          <button
            onClick={onViewOrders}
            className="flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            View Orders
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
