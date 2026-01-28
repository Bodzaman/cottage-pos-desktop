import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import { ChevronDown, ChevronUp, Banknote, Coins } from 'lucide-react';
import { UK_DENOMINATIONS } from '../../types/zReport';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface DenominationCounterProps {
  onTotalChange: (totalPounds: number, breakdown: Record<string, number>) => void;
  initialBreakdown?: Record<string, number>; // pence_value → qty
  readOnly?: boolean;
}

export function DenominationCounter({ onTotalChange, initialBreakdown, readOnly }: DenominationCounterProps) {
  const [isExpanded, setIsExpanded] = useState(!!initialBreakdown);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    if (initialBreakdown) {
      return { ...initialBreakdown };
    }
    const initial: Record<string, number> = {};
    UK_DENOMINATIONS.forEach((d) => {
      initial[String(d.valuePence)] = 0;
    });
    return initial;
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const triggerId = useId();

  const calculateTotal = useCallback(() => {
    let totalPence = 0;
    for (const denom of UK_DENOMINATIONS) {
      const qty = quantities[String(denom.valuePence)] || 0;
      totalPence += qty * denom.valuePence;
    }
    return totalPence;
  }, [quantities]);

  useEffect(() => {
    if (isExpanded) {
      const totalPence = calculateTotal();
      const totalPounds = totalPence / 100;
      const breakdown: Record<string, number> = {};
      for (const key of Object.keys(quantities)) {
        if (quantities[key] > 0) {
          breakdown[key] = quantities[key];
        }
      }
      onTotalChange(totalPounds, breakdown);
    }
  }, [quantities, isExpanded, calculateTotal, onTotalChange]);

  const handleToggle = useCallback(() => {
    if (readOnly) return;
    setIsExpanded((prev) => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(() => {
          panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
      return next;
    });
  }, [readOnly]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (readOnly) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [readOnly, handleToggle]);

  const handleQtyChange = (penceValue: number, value: string) => {
    const qty = value === '' ? 0 : Math.max(0, Math.floor(Number(value)));
    setQuantities((prev) => ({
      ...prev,
      [String(penceValue)]: qty,
    }));
  };

  const totalPence = calculateTotal();
  const totalPounds = totalPence / 100;

  const notesDenoms = UK_DENOMINATIONS.filter((d) => d.type === 'note');
  const coinsDenoms = UK_DENOMINATIONS.filter((d) => d.type === 'coin');

  const notesPence = notesDenoms.reduce((sum, d) => sum + (quantities[String(d.valuePence)] || 0) * d.valuePence, 0);
  const coinsPence = coinsDenoms.reduce((sum, d) => sum + (quantities[String(d.valuePence)] || 0) * d.valuePence, 0);

  if (readOnly && !initialBreakdown) return null;

  return (
    <div className={`rounded-xl overflow-hidden transition-colors ${
      isExpanded ? 'border border-[#0EBAB1]/20 bg-[#0EBAB1]/[0.02]' : 'border border-white/10'
    }`}>
      {/* Toggle header — 48px touch target */}
      <button
        type="button"
        id={triggerId}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-4 min-h-[48px] text-left transition-colors ${
          readOnly ? 'cursor-default' : 'hover:bg-white/[0.03] active:bg-white/[0.05]'
        }`}
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-[#BBC3E1]">
          <Coins className="h-5 w-5 text-[#0EBAB1]" />
          {readOnly ? 'Denomination Breakdown' : 'Count by denomination'}
        </span>
        <div className="flex items-center gap-2">
          {isExpanded && totalPence > 0 && (
            <span className="text-sm text-[#0EBAB1] font-semibold tabular-nums">
              {formatCurrency(totalPounds)}
            </span>
          )}
          {!readOnly && (
            isExpanded
              ? <ChevronUp className="h-5 w-5 text-[#8B92B3]" />
              : <ChevronDown className="h-5 w-5 text-[#8B92B3]" />
          )}
        </div>
      </button>

      {/* Denomination table — capped at 280px with internal scroll */}
      {(isExpanded || readOnly) && (
        <div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="overflow-y-auto"
          style={{ maxHeight: readOnly ? 'none' : '280px' }}
        >
          <div className="px-4 pb-4 space-y-4">
            {/* Notes section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="h-4 w-4 text-[#8B92B3]" />
                <span className="text-xs font-semibold text-[#8B92B3] uppercase tracking-wider">Notes</span>
                <span className="text-xs text-[#8B92B3] ml-auto tabular-nums font-medium">{formatCurrency(notesPence / 100)}</span>
              </div>
              <div className="space-y-1.5">
                {notesDenoms.map((denom) => {
                  const qty = quantities[String(denom.valuePence)] || 0;
                  const rowTotal = qty * denom.valuePence / 100;
                  return (
                    <DenomRow
                      key={denom.valuePence}
                      label={denom.label}
                      qty={qty}
                      total={rowTotal}
                      readOnly={readOnly}
                      onChange={(val) => handleQtyChange(denom.valuePence, val)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Coins section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-[#8B92B3]" />
                <span className="text-xs font-semibold text-[#8B92B3] uppercase tracking-wider">Coins</span>
                <span className="text-xs text-[#8B92B3] ml-auto tabular-nums font-medium">{formatCurrency(coinsPence / 100)}</span>
              </div>
              <div className="space-y-1.5">
                {coinsDenoms.map((denom) => {
                  const qty = quantities[String(denom.valuePence)] || 0;
                  const rowTotal = qty * denom.valuePence / 100;
                  return (
                    <DenomRow
                      key={denom.valuePence}
                      label={denom.label}
                      qty={qty}
                      total={rowTotal}
                      readOnly={readOnly}
                      onChange={(val) => handleQtyChange(denom.valuePence, val)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Total Cash in Hand</span>
              <span className="text-base font-bold text-white tabular-nums">
                {formatCurrency(totalPounds)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DenomRowProps {
  label: string;
  qty: number;
  total: number;
  readOnly?: boolean;
  onChange: (value: string) => void;
}

function DenomRow({ label, qty, total, readOnly, onChange }: DenomRowProps) {
  return (
    <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${!readOnly ? 'hover:bg-white/[0.03] active:bg-white/[0.05]' : ''} transition-colors`}>
      <span className="w-12 text-sm font-medium text-[#BBC3E1] tabular-nums">{label}</span>
      <span className="text-sm text-[#8B92B3]">&times;</span>
      {readOnly ? (
        <span className="w-16 text-sm text-[#BBC3E1] text-center tabular-nums font-medium">{qty}</span>
      ) : (
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={qty || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-16 h-10 text-sm text-center tabular-nums font-medium rounded-lg bg-[#252525] border border-white/10 text-white outline-none focus:border-[#0EBAB1]/50 focus:ring-1 focus:ring-[#0EBAB1]/30 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      )}
      <span className="flex-1 text-sm text-[#8B92B3] text-right tabular-nums">
        {formatCurrency(total)}
      </span>
    </div>
  );
}
