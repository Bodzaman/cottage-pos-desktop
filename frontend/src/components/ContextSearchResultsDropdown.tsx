import React, { useEffect, useState } from 'react';
import { globalColors } from '../utils/QSAIDesign';
import { Clock, Phone, ChevronRight, Eye, Printer, ShoppingCart, User } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { POSSearchResult, SearchResultSource } from '../utils/usePOSContextSearch';
import type { POSViewMode } from '../utils/posUIStore';

interface ContextSearchResultsDropdownProps {
  customerResults: POSSearchResult[];
  activeResults: POSSearchResult[];
  pastResults: POSSearchResult[];
  isVisible: boolean;
  isLoading: boolean;
  searchQuery: string;
  posViewMode: POSViewMode;
  onSelect: (result: POSSearchResult) => void;
  onReprint?: (result: POSSearchResult) => void;
  onReorder?: (result: POSSearchResult) => void;
  onShowAllResults: () => void;
}

// ---- Helpers ----

const getOrderTypeIcon = (orderSource?: string, type?: string) => {
  if (type === 'customer') return null; // We use a Lucide icon instead
  switch (orderSource) {
    case 'AI_VOICE': return '🎤';
    case 'ONLINE':
    case 'CUSTOMER_ONLINE_MENU':
    case 'CUSTOMER_ONLINE_ORDER': return '🌐';
    case 'POS': return '🍽️';
    case 'TABLE': return '🪑';
    default: return '📋';
  }
};

const getStatusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'PREPARING': case 'CONFIRMED':
      return { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c' };
    case 'READY':
      return { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' };
    case 'COMPLETED':
      return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' };
    case 'NEW':
      return { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' };
    default:
      return { bg: 'rgba(156, 163, 175, 0.2)', text: '#9ca3af' };
  }
};

const formatOrderTime = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch {
    return '';
  }
};

const highlightMatch = (text: string, query: string) => {
  if (!query || !text) return text;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} style={{ backgroundColor: 'rgba(91,33,182,0.3)', color: '#c084fc', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : part
    );
  } catch {
    return text;
  }
};

// ---- Section Header ----

const SectionHeader: React.FC<{ label: string; count: number; accent: string }> = ({ label, count, accent }) => (
  <div
    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-between"
    style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: accent, borderBottom: `1px solid ${globalColors.border.light}` }}
  >
    <span>{label}</span>
    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${accent}22`, color: accent }}>
      {count}
    </span>
  </div>
);

// ---- Customer Result Row ----

const CustomerRow: React.FC<{
  result: POSSearchResult;
  isSelected: boolean;
  query: string;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ result, isSelected, query, onSelect, onMouseEnter, onMouseLeave }) => (
  <div
    className="px-3 py-2.5 cursor-pointer transition-colors duration-100 flex items-center gap-3"
    style={{
      backgroundColor: isSelected ? 'rgba(91,33,182,0.15)' : 'transparent',
      borderBottom: `1px solid ${globalColors.border.light}20`,
    }}
    onClick={onSelect}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: 'rgba(124,93,250,0.15)' }}
    >
      <User className="h-4 w-4" style={{ color: '#a78bfa' }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
        {highlightMatch(result.label, query)}
      </div>
      {result.sublabel && (
        <div className="text-xs truncate" style={{ color: globalColors.text.tertiary }}>
          {highlightMatch(result.sublabel, query)}
        </div>
      )}
    </div>
    <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: globalColors.text.tertiary }} />
  </div>
);

// ---- Order Result Row ----

const OrderRow: React.FC<{
  result: POSSearchResult;
  isSelected: boolean;
  query: string;
  showReorder: boolean;
  onSelect: () => void;
  onReprint?: () => void;
  onReorder?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ result, isSelected, query, showReorder, onSelect, onReprint, onReorder, onMouseEnter, onMouseLeave }) => {
  const statusInfo = getStatusColor(result.status);
  const icon = getOrderTypeIcon(result.rawData?.order_source, result.type);

  return (
    <div
      className="px-3 py-2.5 cursor-pointer transition-colors duration-100 group"
      style={{
        backgroundColor: isSelected ? 'rgba(91,33,182,0.15)' : 'transparent',
        borderBottom: `1px solid ${globalColors.border.light}20`,
      }}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Row 1: Order ID, total, type, time */}
          <div className="flex items-center gap-2 mb-0.5">
            {icon && <span className="text-base">{icon}</span>}
            <span className="text-sm font-semibold" style={{ color: globalColors.text.primary }}>
              {highlightMatch(result.label, query)}
            </span>
            {result.total != null && (
              <span className="text-sm font-bold" style={{ color: globalColors.text.accent }}>
                {formatCurrency(result.total)}
              </span>
            )}
            {result.orderType && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(91,33,182,0.2)', color: globalColors.text.accent }}
              >
                {result.orderType}
              </span>
            )}
            {result.createdAt && (
              <div className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" style={{ color: globalColors.text.tertiary }} />
                <span className="text-xs" style={{ color: globalColors.text.tertiary }}>
                  {formatOrderTime(result.createdAt)}
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Customer + phone */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm" style={{ color: globalColors.text.secondary }}>
              {highlightMatch(result.sublabel, query)}
            </span>
            {result.rawData?.customer_phone && (
              <>
                <span style={{ color: globalColors.text.tertiary }}>·</span>
                <Phone className="h-3 w-3" style={{ color: globalColors.text.tertiary }} />
                <span className="text-xs" style={{ color: globalColors.text.tertiary }}>
                  {highlightMatch(result.rawData.customer_phone, query)}
                </span>
              </>
            )}
          </div>

          {/* Row 3: Item preview */}
          {result.itemPreview && (
            <div className="text-xs" style={{ color: globalColors.text.tertiary }}>
              {result.itemPreview}
            </div>
          )}
        </div>

        {/* Right side: status + action buttons */}
        <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
          {result.status && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}
            >
              {result.status}
            </span>
          )}
          {/* Action buttons on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="p-1 rounded hover:bg-white/10"
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" style={{ color: globalColors.text.secondary }} />
            </button>
            {onReprint && (
              <button
                onClick={(e) => { e.stopPropagation(); onReprint(); }}
                className="p-1 rounded hover:bg-white/10"
                title="Reprint"
              >
                <Printer className="h-3.5 w-3.5" style={{ color: globalColors.text.secondary }} />
              </button>
            )}
            {showReorder && onReorder && (
              <button
                onClick={(e) => { e.stopPropagation(); onReorder(); }}
                className="p-1 rounded hover:bg-white/10"
                title="Reorder"
              >
                <ShoppingCart className="h-3.5 w-3.5" style={{ color: globalColors.text.secondary }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DROPDOWN
// ============================================================================

const ContextSearchResultsDropdown: React.FC<ContextSearchResultsDropdownProps> = ({
  customerResults,
  activeResults,
  pastResults,
  isVisible,
  isLoading,
  searchQuery,
  posViewMode,
  onSelect,
  onReprint,
  onReorder,
  onShowAllResults,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Flatten all results for keyboard navigation
  const flatResults = [...customerResults, ...activeResults, ...pastResults];
  const totalItems = flatResults.length + 1; // +1 for "Show all" row

  useEffect(() => { setSelectedIndex(-1); }, [customerResults, activeResults, pastResults]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
            onSelect(flatResults[selectedIndex]);
          } else if (selectedIndex === flatResults.length) {
            onShowAllResults();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, flatResults, selectedIndex, totalItems, onSelect, onShowAllResults]);

  if (!isVisible) return null;

  const hasAny = flatResults.length > 0;
  const showReorder = posViewMode === 'TAKE_AWAY';

  // Compute flat index offsets
  const customerOffset = 0;
  const activeOffset = customerResults.length;
  const pastOffset = customerResults.length + activeResults.length;

  // Contextual empty/loading messages
  const emptyMessage = (() => {
    if (searchQuery.length < 2) return 'Type at least 2 characters to search';
    switch (posViewMode) {
      case 'DINE_IN': return `No customers found for "${searchQuery}"`;
      case 'TAKE_AWAY': return `No orders found for "${searchQuery}"`;
      case 'ONLINE': return `No online orders found for "${searchQuery}"`;
      default: return `No results for "${searchQuery}"`;
    }
  })();

  const loadingMessage = posViewMode === 'DINE_IN' ? 'Searching customers...' : 'Searching orders...';

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-xl border overflow-hidden"
      style={{
        backgroundColor: globalColors.background.secondary,
        borderColor: globalColors.border.light,
        maxHeight: '420px',
      }}
    >
      {isLoading && !hasAny ? (
        <div className="p-4 text-center" style={{ color: globalColors.text.secondary }}>
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: globalColors.text.accent }} />
            <span>{loadingMessage}</span>
          </div>
        </div>
      ) : !hasAny ? (
        <div className="p-4 text-center" style={{ color: globalColors.text.secondary }}>
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="max-h-[360px] overflow-y-auto">
            {/* Customer section (DINE_IN only) */}
            {customerResults.length > 0 && (
              <>
                <SectionHeader label="Customers" count={customerResults.length} accent="#a78bfa" />
                {customerResults.map((result, idx) => (
                  <CustomerRow
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === customerOffset + idx}
                    query={searchQuery}
                    onSelect={() => onSelect(result)}
                    onMouseEnter={() => setSelectedIndex(customerOffset + idx)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                  />
                ))}
              </>
            )}

            {/* Active section (ONLINE) */}
            {activeResults.length > 0 && (
              <>
                <SectionHeader label="Active Orders" count={activeResults.length} accent="#4ade80" />
                {activeResults.slice(0, 10).map((result, idx) => (
                  <OrderRow
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === activeOffset + idx}
                    query={searchQuery}
                    showReorder={false}
                    onSelect={() => onSelect(result)}
                    onReprint={onReprint ? () => onReprint(result) : undefined}
                    onMouseEnter={() => setSelectedIndex(activeOffset + idx)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                  />
                ))}
              </>
            )}

            {/* Past orders section */}
            {pastResults.length > 0 && (
              <>
                <SectionHeader label="Past Orders" count={pastResults.length} accent="#9ca3af" />
                {pastResults.slice(0, 5).map((result, idx) => (
                  <OrderRow
                    key={result.id}
                    result={result}
                    isSelected={selectedIndex === pastOffset + idx}
                    query={searchQuery}
                    showReorder={showReorder}
                    onSelect={() => onSelect(result)}
                    onReprint={onReprint ? () => onReprint(result) : undefined}
                    onReorder={onReorder ? () => onReorder(result) : undefined}
                    onMouseEnter={() => setSelectedIndex(pastOffset + idx)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Show all footer (only for order tabs, not customer lookup) */}
          {posViewMode !== 'DINE_IN' && (
            <div
              className={`px-3 py-2.5 cursor-pointer transition-colors duration-100 border-t ${
                selectedIndex === flatResults.length ? 'ring-2 ring-inset' : ''
              }`}
              style={{
                borderColor: globalColors.border.light,
                backgroundColor: selectedIndex === flatResults.length
                  ? 'rgba(91,33,182,0.15)'
                  : 'rgba(91,33,182,0.05)',
              }}
              onMouseEnter={() => setSelectedIndex(flatResults.length)}
              onMouseLeave={() => setSelectedIndex(-1)}
              onClick={onShowAllResults}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: globalColors.text.accent }}>
                  Show all results...
                </span>
                <ChevronRight className="h-4 w-4" style={{ color: globalColors.text.accent }} />
              </div>
            </div>
          )}

          {/* Loading indicator when fetching more */}
          {isLoading && hasAny && (
            <div className="px-3 py-1.5 text-center border-t" style={{ borderColor: globalColors.border.light, color: globalColors.text.tertiary }}>
              <span className="text-xs">Loading more results...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContextSearchResultsDropdown;
