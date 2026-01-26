import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, User } from 'lucide-react';
import { usePOSCustomerIntelligence, SearchQuery, CustomerSearchResult } from 'utils/usePOSCustomerIntelligence';
import { usePOSCustomerStore } from 'utils/posCustomerStore';
import { colors } from '../utils/InternalDesignSystem';

interface POSCustomerSearchFormProps {
  className?: string;
  orderType?: 'COLLECTION' | 'DELIVERY' | 'WAITING' | 'DINE-IN';
  onCustomerNeedsAddress?: () => void;  // Callback when delivery mode but customer has no address
}

/**
 * POSCustomerSearchForm - Intelligent single-field customer search
 * 
 * Features:
 * - Single search bar with auto-detection of input type
 * - Detects: Email (@), Phone (digits/07xxx), Customer Ref (alphanumeric)
 * - Real-time validation with visual feedback
 * - Debounced search trigger (500ms after typing stops)
 * - Search on Enter key
 * - Clear button when input has value
 * - QSAI purple theme
 */
export const POSCustomerSearchForm: React.FC<POSCustomerSearchFormProps> = ({
  className = '',
  orderType,
  onCustomerNeedsAddress,
}) => {
  const { searchCustomer, clearSearch, isSearching, searchResults, selectCustomer, clearSearchResults } = usePOSCustomerIntelligence();

  const [searchValue, setSearchValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [detectedType, setDetectedType] = useState<'email' | 'phone' | 'ref' | 'name' | null>(null);

  // Auto-detect input type
  const detectInputType = (value: string): 'email' | 'phone' | 'ref' | 'name' | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Email detection: contains @
    if (trimmed.includes('@')) return 'email';

    // Phone detection: starts with 07, +44, or all digits (10-11 chars)
    const digitsOnly = trimmed.replace(/\s/g, '');
    if (/^\d+$/.test(digitsOnly) && digitsOnly.length >= 10) return 'phone';
    if (/^07/.test(trimmed)) return 'phone';
    if (/^\+44/.test(trimmed)) return 'phone';

    // Customer reference: alphanumeric (CTR12345 or CT001)
    if (/^CT[R]?\d+$/i.test(trimmed)) return 'ref';

    // Fallback: treat any other text (2+ chars) as name search
    if (trimmed.length >= 2) return 'name';

    return null;
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    // UK phone format: 07xxx xxxxxx or +44 7xxx xxxxxx or 01xxx xxxxxx
    const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?|\+44\s?1\d{3}|\(?01\d{3}\)?)\s?\d{3}\s?\d{3,4}$|^\d{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateCustomerRef = (ref: string): boolean => {
    if (!ref) return true;
    // Format: CTR12345 or CT001 (flexible)
    const refRegex = /^[A-Z]{2,3}\d{3,5}$/i;
    return refRegex.test(ref);
  };

  // Validate based on detected type
  const validateInput = (value: string, type: 'email' | 'phone' | 'ref' | 'name' | null): { isValid: boolean; error: string } => {
    if (!value.trim()) return { isValid: true, error: '' };
    if (!type) return { isValid: false, error: 'Enter at least 2 characters' };

    switch (type) {
      case 'email':
        return validateEmail(value)
          ? { isValid: true, error: '' }
          : { isValid: false, error: 'Invalid email format' };

      case 'phone':
        return validatePhone(value)
          ? { isValid: true, error: '' }
          : { isValid: false, error: 'Invalid phone format (use 07xxx xxxxxx)' };

      case 'ref':
        return validateCustomerRef(value)
          ? { isValid: true, error: '' }
          : { isValid: false, error: 'Invalid reference format (e.g., CT001)' };

      case 'name':
        // Name search is always valid if 2+ characters
        return value.trim().length >= 2
          ? { isValid: true, error: '' }
          : { isValid: false, error: 'Enter at least 2 characters' };

      default:
        return { isValid: false, error: '' };
    }
  };

  // Handle input change with auto-detection and validation
  const handleInputChange = (value: string) => {
    setSearchValue(value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Detect type
    const type = detectInputType(value);
    setDetectedType(type);

    // Validate immediately for user feedback
    const validation = validateInput(value, type);
    setValidationError(validation.error);

    // Auto-search after 500ms if valid and has 3+ characters
    if (validation.isValid && value.trim().length >= 3) {
      const timer = setTimeout(() => {
        handleSearch(value, type);
      }, 500);
      setDebounceTimer(timer);
    }
  };

  // Handle search action
  const handleSearch = useCallback((value?: string, type?: 'email' | 'phone' | 'ref' | 'name' | null) => {
    const searchVal = value || searchValue;
    const searchType = type !== undefined ? type : detectedType;

    if (!searchVal.trim() || !searchType) return;

    // Validate before search
    const validation = validateInput(searchVal, searchType);
    if (!validation.isValid) return;

    // Map detected type to SearchQuery field
    const fieldMap: Record<'email' | 'phone' | 'ref' | 'name', keyof SearchQuery> = {
      email: 'email',
      phone: 'phone',
      ref: 'customerRef',
      name: 'name'
    };

    const field = fieldMap[searchType];
    searchCustomer(field, searchVal);
  }, [searchValue, detectedType, searchCustomer]);

  // Handle clear
  const handleClear = () => {
    setSearchValue('');
    setValidationError('');
    setDetectedType(null);
    clearSearch();
    clearSearchResults();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Get placeholder text based on detected type
  const getPlaceholder = () => {
    if (detectedType === 'email') return 'Searching by email...';
    if (detectedType === 'phone') return 'Searching by phone...';
    if (detectedType === 'ref') return 'Searching by reference...';
    if (detectedType === 'name') return 'Searching by name...';
    return 'Name • Email • Phone • Ref';
  };

  // Get display label for detected type
  const getTypeLabel = () => {
    switch (detectedType) {
      case 'email': return 'Email';
      case 'phone': return 'Phone';
      case 'ref': return 'Customer Reference';
      case 'name': return 'Name';
      default: return '';
    }
  };

  // Handle customer selection from dropdown
  const handleSelectCustomer = async (customer: CustomerSearchResult) => {
    setSearchValue('');
    clearSearchResults();
    await selectCustomer(customer);

    // If delivery mode and customer has no address, trigger form to open
    if (orderType === 'DELIVERY' && onCustomerNeedsAddress) {
      // Small delay to allow store to update
      setTimeout(() => {
        const customerData = usePOSCustomerStore.getState().customerData;
        if (!customerData.postcode) {
          onCustomerNeedsAddress();
        }
      }, 100);
    }
  };

  return (
    <div className={`space-y-1 relative ${className}`}>
      {/* Compact Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 z-10" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
        <Input
          type="text"
          placeholder={getPlaceholder()}
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          className="pl-8 pr-8 h-9 rounded-md text-sm text-white placeholder:text-gray-500"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        />

        {/* Clear button (appears when input has value) */}
        {searchValue && (
          <button
            onClick={handleClear}
            disabled={isSearching}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <p className="text-[11px] text-red-400 px-1 flex items-center gap-1">
          <span className="font-bold">!</span>
          {validationError}
        </p>
      )}

      {/* Type indicator (shows detected type) */}
      {detectedType && searchValue && searchResults.length === 0 && (
        <p className="text-[11px] text-purple-300 px-1">
          Detected: {getTypeLabel()}
        </p>
      )}

      {/* Loading indicator */}
      {isSearching && (
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-1.5 text-xs text-purple-400">
            <div className="h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        </div>
      )}

      {/* Search Results Dropdown (for name searches with multiple results) */}
      {searchResults.length > 0 && !isSearching && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg border overflow-hidden shadow-lg"
          style={{
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
            maxHeight: '280px',
            top: '100%',
            left: 0,
          }}
        >
          {/* Results header */}
          <div
            className="px-3 py-2 text-xs border-b"
            style={{
              color: colors.text.muted,
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.light,
            }}
          >
            {searchResults.length} customer{searchResults.length > 1 ? 's' : ''} found
          </div>

          {/* Scrollable results list */}
          <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
            {searchResults.map((customer) => {
              // Generate initials for avatar
              const initials = [
                customer.first_name?.[0] || '',
                customer.last_name?.[0] || ''
              ].join('').toUpperCase() || '?';

              return (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full px-3 py-2.5 text-left transition-colors border-b last:border-b-0 flex items-center gap-3"
                  style={{
                    borderColor: colors.border.light,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Avatar with initials */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${colors.purple.primary}33 0%, ${colors.purple.primary}66 100%)`,
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: colors.purple.primary }}>
                      {initials}
                    </span>
                  </div>

                  {/* Customer info */}
                  <div className="flex-1 min-w-0">
                    {/* Line 1: Name */}
                    <p className="font-medium text-sm truncate" style={{ color: colors.text.primary }}>
                      {customer.first_name} {customer.last_name}
                    </p>
                    {/* Line 2: Phone • Ref */}
                    <p className="text-xs truncate" style={{ color: colors.text.muted }}>
                      {[customer.phone, customer.customer_reference_number].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
