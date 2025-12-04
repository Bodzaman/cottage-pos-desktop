import React from 'react';
import { Button } from '@/components/ui/button';
import { X, User, Phone, Mail, Ticket, MapPin, Edit, ArrowRight } from 'lucide-react';
import { CustomerIntelligenceProfile } from 'utils/usePOSCustomerIntelligence';

interface POSCustomerProfileCardProps {
  customer: CustomerIntelligenceProfile;
  onClear: () => void;
  onCustomerSelected?: (customer: CustomerIntelligenceProfile) => void;
  onViewOrders?: () => void;
  onEdit?: () => void;
  className?: string;
}

/**
 * POSCustomerProfileCard - Displays customer profile in a frosted glass card
 * 
 * Layout:
 * ┌─────────────────────────────────────┐
 * │ ✅ Customer Profile        [✕ Clear]│
 * ├─────────────────────────────────────┤
 * │ 👤 John Smith    📞 07123 456789   │
 * │ 📧 john@email.com  🎫 CTR12345     │
 * │ 📍 123 High St, London, SW1A 1AA   │
 * └─────────────────────────────────────┘
 * 
 * Features:
 * - Frosted glass card with purple gradient border
 * - 2-row header: Name/Phone, Email/Ref
 * - Default address with map pin icon
 * - Clear button (top-right ✕)
 * - Smooth expand animation (300ms cubic-bezier)
 */
export const POSCustomerProfileCard: React.FC<POSCustomerProfileCardProps> = ({
  customer,
  onClear,
  onCustomerSelected,
  onViewOrders,
  onEdit,
  className = '',
}) => {
  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
  const hasAddress = customer.default_address;

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg
        bg-gradient-to-br from-zinc-900/95 to-zinc-800/95
        backdrop-blur-sm
        border border-purple-500/30
        shadow-lg shadow-purple-500/10
        animate-in fade-in slide-in-from-top-2
        duration-300
        ${className}
      `}
      style={{
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Purple gradient accent border */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-500/20 rounded-lg opacity-50 pointer-events-none" />
      
      {/* Header */}
      <div className="relative border-b border-zinc-700/50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Customer Profile</h3>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          title="Clear customer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Customer Details */}
      <div className="relative px-5 py-4 space-y-2.5">
        {/* Row 1: Name + Phone */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <User className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-white truncate">
              {fullName}
            </span>
          </div>
          
          {customer.phone && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-300 font-mono">
                {customer.phone}
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Email + Customer Ref */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-300 truncate">
              {customer.email}
            </span>
          </div>
          
          {customer.customer_reference_number && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Ticket className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs text-purple-300 font-mono font-semibold">
                {customer.customer_reference_number}
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Default Address */}
        {hasAddress && (
          <div className="flex items-start gap-2 pt-1 border-t border-zinc-700/30">
            <MapPin className="h-3.5 w-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300 leading-relaxed">
              {customer.default_address.address_line1}
              {customer.default_address.address_line2 && (
                <>, {customer.default_address.address_line2}</>
              )}
              <br />
              {customer.default_address.city}, {customer.default_address.postal_code}
            </div>
          </div>
        )}

        {/* Optional Edit Button */}
        {onEdit && (
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="w-full border-zinc-700 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-300 text-xs"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="relative px-5 pb-4 pt-2 flex gap-2 min-w-0">
        {/* Primary Action: Select Customer */}
        <button
          onClick={() => onCustomerSelected?.(customer)}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            boxShadow: '0 4px 12px rgba(91, 33, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(91, 33, 182, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(91, 33, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
        >
          Select Customer
        </button>

        {/* Secondary Action: View Orders */}
        {onViewOrders && (
          <button
            onClick={onViewOrders}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            View Orders
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
