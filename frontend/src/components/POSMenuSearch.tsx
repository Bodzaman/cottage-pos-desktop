import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { QSAITheme } from 'utils/QSAIDesign';

interface Props {
  className?: string;
}

/**
 * Smart search bar for POSDesktop menu with:
 * - Debounced input (300ms)
 * - Fuzzy search (priority: name > category > description)
 * - Clear button with smooth animation
 * - Keyboard support (Esc to clear)
 * - Accessibility compliant (ARIA labels)
 * - QSAI theme styling
 */
export function POSMenuSearch({ className }: Props) {
  const { searchQuery, setSearchQuery } = useRealtimeMenuStore();
  const [localValue, setLocalValue] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when store value changes externally
  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced search handler (300ms delay)
  const handleInputChange = useCallback((value: string) => {
    setLocalValue(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, [setSearchQuery]);

  // Clear search handler
  const handleClear = useCallback(() => {
    setLocalValue('');
    setSearchQuery('');
    inputRef.current?.focus();
  }, [setSearchQuery]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={`relative ${className || ''}`} style={{ minWidth: '280px' }}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search className="w-4 h-4" style={{ color: QSAITheme.text.muted }} />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search menu items..."
        aria-label="Search menu items"
        aria-describedby="search-help"
        className="w-full h-10 pl-10 pr-10 rounded-lg transition-all duration-200 outline-none"
        style={{
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          border: `1px solid rgba(124, 93, 250, 0.2)`,
          color: QSAITheme.text.primary,
          fontSize: '14px',
        }}
        onFocus={(e) => {
          e.target.style.border = `1px solid ${QSAITheme.purple.primary}`;
          e.target.style.boxShadow = `0 0 8px ${QSAITheme.purple.glow}`;
        }}
        onBlur={(e) => {
          e.target.style.border = `1px solid rgba(124, 93, 250, 0.2)`;
          e.target.style.boxShadow = 'none';
        }}
      />

      {/* Clear Button (only when text exists) */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110"
          style={{ color: QSAITheme.text.muted }}
          aria-label="Clear search"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = QSAITheme.purple.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = QSAITheme.text.muted;
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Hidden help text for screen readers */}
      <span id="search-help" className="sr-only">
        Search by item name, category, or description. Press Escape to clear.
      </span>
    </div>
  );
}

export default POSMenuSearch;
