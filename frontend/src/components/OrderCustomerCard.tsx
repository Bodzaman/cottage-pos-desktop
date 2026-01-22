import React from 'react';
import { Search } from 'lucide-react';
import { QSAITheme } from '../utils/QSAIDesign';
import { POSCustomerIntelligencePanel } from './POSCustomerIntelligencePanel';
import { useCustomerDataStore } from '../utils/customerDataStore';
import { cn } from 'utils/cn';

interface Props {
  orderType: 'COLLECTION' | 'DELIVERY' | 'WAITING';
  onTakeOrder: () => void;
  onCustomerSelected: (customer: any) => void;
  onOrderAgain: (order: any) => void;
  onViewOrders: () => void;
  onClear: () => void;
  className?: string;
}

/**
 * OrderCustomerCard - Unified Zone 1 component for WAITING/COLLECTION/DELIVERY
 * 
 * Replaces the stacked CustomerSummaryBadge + POSCustomerIntelligencePanel
 * with a single cohesive card featuring:
 * - Search customer section (primary position)
 * - "OR" divider
 * - Take Order CTA button (secondary position)
 * - Mode badge in header
 * 
 * DESIGN PHILOSOPHY:
 * - Search workflow comes first (top)
 * - Clear visual hierarchy without competing purple blocks
 * - Intentional, not stacked/patched
 * - QSAI immersive elegance theme
 */
export function OrderCustomerCard({
  orderType,
  onTakeOrder,
  onCustomerSelected,
  onOrderAgain,
  onViewOrders,
  onClear,
  className = ''
}: Props) {
  const { customerData } = useCustomerDataStore();

  // Check if customer data exists
  const hasCustomerData = customerData.firstName || customerData.lastName || customerData.phone;

  return (
    <div 
      className={cn('flex flex-col', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      {/* Header with Mode Badge */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255, 255, 255, 0.03)' }}
      >
        <h2 
          className="text-base font-semibold"
          style={{
            backgroundImage: `linear-gradient(135deg, white 30%, ${QSAITheme.purple.light} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          Order & Customer
        </h2>
        
        {/* Mode Badge */}
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
            color: 'white',
            boxShadow: `0 2px 8px ${QSAITheme.purple.glow}`
          }}
        >
          {orderType}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* Search Section - Primary Position */}
        <div className="space-y-2">
          {/* Section Label - Simple Text, Not Purple Button */}
          <div className="flex items-center space-x-2 mb-2">
            <Search className="w-4 h-4" style={{ color: QSAITheme.text.muted }} />
            <span 
              className="text-sm font-medium"
              style={{ color: QSAITheme.text.muted }}
            >
              Find Existing Customer
            </span>
          </div>

          {/* Customer Intelligence Panel - Embedded */}
          <POSCustomerIntelligencePanel
            key="customer-intelligence-embedded"
            orderType={orderType}
            onCustomerSelected={onCustomerSelected}
            onOrderAgain={onOrderAgain}
            onViewOrders={onViewOrders}
            onClear={onClear}
          />
        </div>

        {/* Visual Divider with OR */}
        {!hasCustomerData && (
          <div className="flex items-center space-x-4 py-2">
            <div 
              className="flex-1 h-px"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            />
            <span 
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: QSAITheme.text.muted }}
            >
              OR
            </span>
            <div 
              className="flex-1 h-px"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>
        )}

        {/* Take Order CTA Button - Secondary Position */}
        {!hasCustomerData && (
          <button
            onClick={onTakeOrder}
            className="w-full group relative overflow-hidden transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
              borderRadius: '8px',
              padding: '16px 24px',
              border: '1px solid rgba(124, 93, 250, 0.3)',
              boxShadow: `0 6px 20px ${QSAITheme.purple.glow}, 0 2px 4px rgba(0,0,0,0.1)`,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${QSAITheme.purple.glow}60, 0 4px 8px rgba(0,0,0,0.2)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${QSAITheme.purple.glow}, 0 2px 4px rgba(0,0,0,0.1)`;
            }}
          >
            {/* Background gradient animation */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(45deg, transparent 0%, ${QSAITheme.purple.light}40 50%, transparent 100%)`,
                animation: 'shimmer 2s infinite'
              }}
            />
            
            {/* Button Content */}
            <div className="relative z-10 text-center">
              <div className="text-base font-bold text-white mb-1">
                Click to TAKE ORDER
              </div>
              <div 
                className="text-xs"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Add customer info
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// Add shimmer animation to global styles if not already present
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
if (!document.querySelector('style[data-shimmer]')) {
  style.setAttribute('data-shimmer', 'true');
  document.head.appendChild(style);
}
