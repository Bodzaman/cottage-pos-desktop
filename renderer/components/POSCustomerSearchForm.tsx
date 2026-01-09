import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { usePOSCustomerIntelligence, SearchQuery } from 'utils/usePOSCustomerIntelligence';

interface POSCustomerSearchFormProps {
  className?: string;
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
export const POSCustomerSearchForm: React.FC<POSCustomerSearchFormProps> = ({ className = '' }) => {
  const { searchCustomer, clearSearch, isSearching } = usePOSCustomerIntelligence();
  
  const [searchValue, setSearchValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [detectedType, setDetectedType] = useState<'email' | 'phone' | 'ref' | null>(null);

  // Auto-detect input type
  const detectInputType = (value: string): 'email' | 'phone' | 'ref' | null => {
    if (!value.trim()) return null;
    
    // Email detection: contains @
    if (value.includes('@')) return 'email';
    
    // Phone detection: starts with 07 or all digits (10-11 chars)
    const digitsOnly = value.replace(/\s/g, '');
    if (/^\d+$/.test(digitsOnly) && digitsOnly.length >= 10) return 'phone';
    if (/^07/.test(value)) return 'phone';
    
    // Customer reference: alphanumeric (CTR12345 or CT001)
    if (/^[A-Z]{2,3}\d+$/i.test(value)) return 'ref';
    
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
  const validateInput = (value: string, type: 'email' | 'phone' | 'ref' | null): { isValid: boolean; error: string } => {
    if (!value.trim()) return { isValid: true, error: '' };
    if (!type) return { isValid: false, error: 'Unable to detect search type' };

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
  const handleSearch = useCallback((value?: string, type?: 'email' | 'phone' | 'ref' | null) => {
    const searchVal = value || searchValue;
    const searchType = type !== undefined ? type : detectedType;
    
    if (!searchVal.trim() || !searchType) return;

    // Validate before search
    const validation = validateInput(searchVal, searchType);
    if (!validation.isValid) return;

    // Map detected type to SearchQuery field
    const fieldMap: Record<'email' | 'phone' | 'ref', keyof SearchQuery> = {
      email: 'email',
      phone: 'phone',
      ref: 'customerRef'
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
    return 'Email • Phone • Ref';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Single Intelligent Search Bar */}
      <div className="space-y-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white z-10" />
          <Input
            type="text"
            placeholder={getPlaceholder()}
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSearching}
            className="pl-10 pr-10 h-11 rounded-lg text-white placeholder:text-gray-400"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              border: '2px solid',
              boxShadow: '0 4px 20px rgba(124, 93, 250, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              e.target.style.boxShadow = '0 6px 25px rgba(124, 93, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.boxShadow = '0 4px 20px rgba(124, 93, 250, 0.1)';
            }}
          />
          
          {/* Clear button (appears when input has value) */}
          {searchValue && (
            <button
              onClick={handleClear}
              disabled={isSearching}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Validation error */}
        {validationError && (
          <p className="text-xs text-red-400 px-2 flex items-center gap-1">
            <span className="font-bold">!</span>
            {validationError}
          </p>
        )}
        
        {/* Type indicator (shows detected type) */}
        {detectedType && searchValue && (
          <p className="text-xs text-purple-300 px-2">
            Detected: {detectedType === 'email' ? 'Email' : detectedType === 'phone' ? 'Phone' : 'Customer Reference'}
          </p>
        )}
        
        {/* Helper text */}
        {!searchValue && (
          <div className="text-xs text-gray-400 text-center px-2">
            <p>Search by email, phone, or customer reference  e.g. (CT001)</p>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isSearching && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        </div>
      )}
    </div>
  );
};
