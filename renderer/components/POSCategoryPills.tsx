import React from 'react';
import type { Category } from 'utils/menuTypes';

interface POSCategoryPillsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

/**
 * Horizontal category navigation pills for POS
 * Shows child categories when a section is selected
 * Multi-line text with CSS Grid - equal spacing and no scroll
 */
export function POSCategoryPills({ 
  categories, 
  selectedCategoryId, 
  onCategorySelect 
}: POSCategoryPillsProps) {
  // Don't render if no categories
  if (categories.length === 0) {
    return null;
  }

  // Split category name into multiple lines for compact display
  const getMultiLineText = (name: string): string[] => {
    const words = name.split(' ');
    if (words.length === 1) {
      // Single word - split in middle if too long
      if (name.length > 12) {
        const mid = Math.ceil(name.length / 2);
        return [name.substring(0, mid), name.substring(mid)];
      }
      return [name];
    }
    // Multi-word - put on separate lines intelligently
    if (words.length === 2) {
      return words;
    }
    // 3+ words - group intelligently (first word, rest)
    return [words[0], words.slice(1).join(' ')];
  };

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {categories.map((category) => {
        const isActive = selectedCategoryId === category.id;
        const lines = getMultiLineText(category.name);
        
        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(isActive ? null : category.id)}
            className="flex flex-col items-center justify-center rounded-full font-bold transition-all duration-200"
            style={{
              minHeight: '44px',
              width: '100%',
              padding: '8px 6px',
              background: isActive
                ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
                : 'rgba(25, 25, 25, 0.5)',
              border: isActive
                ? '2px solid rgba(124, 58, 237, 0.5)'
                : '2px solid rgba(255, 255, 255, 0.08)',
              color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
              boxShadow: isActive
                ? '0 4px 12px rgba(124, 58, 237, 0.3)'
                : 'none',
            }}
          >
            <div className="text-[11px] leading-tight text-center">
              {lines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
