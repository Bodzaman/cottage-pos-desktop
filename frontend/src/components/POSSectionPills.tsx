import React from 'react';
import { FIXED_SECTIONS } from '../utils/sectionMapping';

interface POSSectionPillsProps {
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
}

/**
 * Horizontal section navigation pills for POS
 * Icon-on-top design with multi-line text for perfect row fit
 */
export function POSSectionPills({ selectedSectionId, onSectionSelect }: POSSectionPillsProps) {
  return (
    <div 
      className="flex items-stretch justify-between gap-2 px-3 py-2 border-b"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* All Items Pill */}
      <button
        onClick={() => onSectionSelect(null)}
        className="flex flex-col items-center justify-center rounded-full font-bold transition-all duration-200 flex-1"
        style={{
          minHeight: '44px',
          padding: '8px 6px',
          background: !selectedSectionId
            ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
            : 'rgba(30, 30, 30, 0.6)',
          border: !selectedSectionId
            ? '1.5px solid rgba(124, 58, 237, 0.5)'
            : '1.5px solid rgba(255, 255, 255, 0.1)',
          color: !selectedSectionId ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
          boxShadow: !selectedSectionId
            ? '0 4px 12px rgba(124, 58, 237, 0.3)'
            : 'none',
        }}
      >
        <div className="text-[11px] leading-tight text-center">
          <div>ALL</div>
          <div>ITEMS</div>
        </div>
      </button>

      {/* Section Pills */}
      {FIXED_SECTIONS.map((section) => {
        const isActive = selectedSectionId === section.uuid;
        
        // Split section name into two lines for compact display
        const getMultiLineText = (name: string) => {
          const words = name.split(' ');
          if (words.length === 1) {
            // Single word - split in middle if too long
            if (name.length > 8) {
              const mid = Math.ceil(name.length / 2);
              return [name.substring(0, mid), name.substring(mid)];
            }
            return [name, ''];
          }
          // Multi-word - put on separate lines
          if (words.length === 2) {
            return words;
          }
          // 3+ words - group intelligently
          return [words[0], words.slice(1).join(' ')];
        };
        
        const [line1, line2] = getMultiLineText(section.name);
        
        return (
          <button
            key={section.uuid}
            onClick={() => onSectionSelect(section.uuid)}
            className="flex flex-col items-center justify-center rounded-full font-bold transition-all duration-200 flex-1"
            style={{
              minHeight: '44px',
              padding: '8px 6px',
              background: isActive
                ? 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)'
                : 'rgba(30, 30, 30, 0.6)',
              border: isActive
                ? '1.5px solid rgba(124, 58, 237, 0.5)'
                : '1.5px solid rgba(255, 255, 255, 0.1)',
              color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              boxShadow: isActive
                ? '0 4px 12px rgba(124, 58, 237, 0.3)'
                : 'none',
            }}
          >
            <div className="text-[11px] leading-tight text-center">
              <div>{line1}</div>
              {line2 && <div>{line2}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
