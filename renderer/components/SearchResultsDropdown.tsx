import React, { useEffect, useState } from 'react';
import { OrderModel } from 'types';
import { globalColors } from '../utils/QSAIDesign';
import { Clock, Phone, DollarSign, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface SearchResultsDropdownProps {
  results: OrderModel[];
  isVisible: boolean;
  isLoading: boolean;
  onSelectOrder: (order: OrderModel) => void;
  onShowAllResults: () => void;
  searchQuery: string;
}

const getOrderTypeIcon = (orderSource: string) => {
  switch (orderSource) {
    case 'AI_VOICE':
      return '🎤';
    case 'ONLINE':
    case 'CUSTOMER_ONLINE_MENU':
      return '🌐';
    case 'POS':
      return '🍽️';
    case 'TABLE':
      return '🪑';
    default:
      return '📋';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PREPARING':
      return { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c', icon: '⏳' };
    case 'READY':
      return { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', icon: '✅' };
    case 'COMPLETED':
      return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', icon: '🔄' };
    case 'NEW':
      return { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', icon: '🆕' };
    default:
      return { bg: 'rgba(156, 163, 175, 0.2)', text: '#9ca3af', icon: '📋' };
  }
};

const formatOrderTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return 'Invalid time';
  }
};

const formatOrderType = (orderType: string) => {
  switch (orderType.toUpperCase()) {
    case 'DELIVERY':
      return 'DELIVERY';
    case 'COLLECTION':
      return 'COLLECTION';
    case 'DINE-IN':
    case 'DINE_IN':
      return 'DINE-IN';
    case 'WAITING':
      return 'WAITING';
    default:
      return orderType.toUpperCase();
  }
};

const highlightMatch = (text: string, searchQuery: string) => {
  if (!searchQuery || !text) return text;
  
  const regex = new RegExp(`(${searchQuery})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <span 
          key={index} 
          style={{ 
            backgroundColor: 'rgba(91, 33, 182, 0.3)',
            color: '#c084fc',
            fontWeight: 'bold'
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  results,
  isVisible,
  isLoading,
  onSelectOrder,
  onShowAllResults,
  searchQuery
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const maxIndex = Math.min(results.length, 5) - 1; // Top 5 results + "Show all" option
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, maxIndex + 1)); // +1 for "Show all" option
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            onSelectOrder(results[selectedIndex]);
          } else if (selectedIndex === maxIndex + 1) {
            onShowAllResults();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, results, selectedIndex, onSelectOrder, onShowAllResults]);
  
  if (!isVisible) return null;

  return (
    <div 
      className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-xl border overflow-hidden"
      style={{
        backgroundColor: globalColors.background.secondary,
        borderColor: globalColors.border.light,
        maxHeight: '400px'
      }}
    >
      {isLoading ? (
        <div className="p-4 text-center" style={{ color: globalColors.text.secondary }}>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: globalColors.text.accent }}></div>
            <span>Searching orders...</span>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center" style={{ color: globalColors.text.secondary }}>
          {searchQuery.length < 2 ? (
            <span>Type at least 2 characters to search orders</span>
          ) : (
            <span>No orders found for "{searchQuery}"</span>
          )}
        </div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto">
            {results.slice(0, 5).map((order, index) => {
              const statusInfo = getStatusColor(order.status);
              const orderIcon = getOrderTypeIcon(order.order_source);
              const isSelected = selectedIndex === index;
              
              return (
                <div
                  key={order.order_id}
                  className={`p-3 cursor-pointer transition-colors duration-150 border-b border-opacity-20 ${
                    isSelected ? 'ring-2 ring-inset' : ''
                  }`}
                  style={{ 
                    borderColor: globalColors.border.light,
                    backgroundColor: isSelected 
                      ? 'rgba(91, 33, 182, 0.15)' 
                      : index === 0 && selectedIndex === -1 
                        ? 'rgba(255, 255, 255, 0.03)' 
                        : 'transparent',
                    ringColor: isSelected ? globalColors.text.accent : 'transparent'
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseLeave={() => setSelectedIndex(-1)}
                  onClick={() => onSelectOrder(order)}
                >
                  <div className="flex items-start justify-between">
                    {/* Left: Order Info */}
                    <div className="flex-1 min-w-0">
                      {/* First Row: Order Icon, ID, Total, Type, Time */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{orderIcon}</span>
                        <span 
                          className="font-semibold text-sm"
                          style={{ color: globalColors.text.primary }}
                        >
                          #{highlightMatch(order.order_number || order.order_id || 'N/A', searchQuery)}
                        </span>
                        <span className="text-sm font-bold" style={{ color: globalColors.text.accent }}>
                          {formatCurrency(order.total)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ 
                          backgroundColor: 'rgba(91, 33, 182, 0.2)',
                          color: globalColors.text.accent
                        }}>
                          {formatOrderType(order.order_type)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" style={{ color: globalColors.text.tertiary }} />
                          <span className="text-xs" style={{ color: globalColors.text.tertiary }}>
                            {formatOrderTime(order.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Second Row: Customer Name and Phone */}
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm" style={{ color: globalColors.text.secondary }}>
                          {order.customer_name ? highlightMatch(order.customer_name, searchQuery) : 'Walk-in Customer'}
                        </span>
                        {order.customer_phone && (
                          <>
                            <span style={{ color: globalColors.text.tertiary }}>•</span>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" style={{ color: globalColors.text.tertiary }} />
                              <span className="text-xs" style={{ color: globalColors.text.tertiary }}>
                                {highlightMatch(order.customer_phone, searchQuery)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Third Row: Items Preview */}
                      {order.items && order.items.length > 0 && (
                        <div className="text-xs" style={{ color: globalColors.text.tertiary }}>
                          {order.items.slice(0, 2).map((item, idx) => (
                            <span key={idx}>
                              {idx > 0 && ', '}
                              {item.quantity}x {highlightMatch(item.name || 'Unknown Item', searchQuery)}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span>, +{order.items.length - 2} more items</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Status */}
                    <div className="flex flex-col items-end space-y-1">
                      <div 
                        className="px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
                        style={{ 
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.text
                        }}
                      >
                        <span>{statusInfo.icon}</span>
                        <span>{order.status.toUpperCase()}</span>
                      </div>
                      <ChevronRight className="h-4 w-4" style={{ color: globalColors.text.tertiary }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Show All Results Footer */}
          {(results.length > 5 || results.length > 0) && (
            <div 
              className={`p-3 cursor-pointer transition-colors duration-150 border-t ${
                selectedIndex === Math.min(results.length, 5) ? 'ring-2 ring-inset' : ''
              }`}
              style={{ 
                borderColor: globalColors.border.light,
                backgroundColor: selectedIndex === Math.min(results.length, 5)
                  ? 'rgba(91, 33, 182, 0.15)'
                  : 'rgba(91, 33, 182, 0.05)',
                ringColor: selectedIndex === Math.min(results.length, 5) ? globalColors.text.accent : 'transparent'
              }}
              onMouseEnter={() => setSelectedIndex(Math.min(results.length, 5))}
              onMouseLeave={() => setSelectedIndex(-1)}
              onClick={onShowAllResults}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: globalColors.text.accent }}>
                  📋 Show all results in AllOrdersModal...
                </span>
                <ChevronRight className="h-4 w-4" style={{ color: globalColors.text.accent }} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResultsDropdown;
