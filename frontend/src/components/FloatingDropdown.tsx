import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { globalColors as QSAITheme } from '../utils/QSAIDesign';
import { ItemVariant } from 'utils/menuTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  variants: ItemVariant[];
  onAddOption: (option: ItemVariant) => void;
  onCustomiseOption: (option: ItemVariant) => void;
  onOtherOption: () => void;
  anchor?: HTMLElement | null;
  orderType?: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
}

export function FloatingDropdown({
  isOpen,
  onClose,
  variants,
  onAddOption,
  onCustomiseOption,
  onOtherOption,
  anchor,
  orderType
}: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchor &&
        !anchor.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchor]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Smart positioning to avoid blocking order panel
  const getDropdownStyle = (): React.CSSProperties => {
    if (!anchor) return {};
    
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 320; // Expected dropdown width
    const orderPanelWidth = 400; // Approximate order panel width
    const rightPanelStartX = viewportWidth - orderPanelWidth;
    
    // Check if dropdown would overlap with order panel
    const wouldBlockOrderPanel = (rect.left + dropdownWidth) > rightPanelStartX;
    
    let left = rect.left;
    
    if (wouldBlockOrderPanel) {
      // Position to the left of the anchor element
      left = rect.right - dropdownWidth;
      // Ensure it doesn't go off-screen to the left
      if (left < 20) {
        left = 20; // Minimum padding from left edge
      }
    }
    
    return {
      position: 'fixed',
      top: rect.bottom + 8,
      left: left,
      width: dropdownWidth,
      zIndex: 1000,
      background: QSAITheme.background.card,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${QSAITheme.border.light}`,
      borderRadius: '0.75rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    };
  };

  // Get variant price based on order type
  const getVariantPrice = (variant: ItemVariant): number => {
    if (orderType === 'DELIVERY' && variant.price_delivery) {
      return variant.price_delivery;
    }
    if (orderType === 'DINE-IN' && variant.price_dine_in) {
      return variant.price_dine_in;
    }
    return variant.price || 0;
  };

  // Get variant display name
  const getVariantDisplayName = (variant: ItemVariant): string => {
    return variant.name || variant.variant_name || 'Unnamed Variant';
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      style={getDropdownStyle()}
      className="overflow-hidden animate-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ 
          borderBottomColor: QSAITheme.border.light,
          background: `linear-gradient(145deg, ${QSAITheme.background.panel} 0%, ${QSAITheme.background.card} 100%)`
        }}
      >
        <span className="font-medium text-sm" style={{ color: QSAITheme.text.primary }}>
          Choose Variation
        </span>
        <button
          onClick={onClose}
          className="transition-colors hover:scale-105"
          style={{ color: QSAITheme.text.secondary }}
          onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.text.primary}
          onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.text.secondary}
        >
          <X size={16} />
        </button>
      </div>

      {/* Options List */}
      <div className="py-2 max-h-64 overflow-y-auto">
        {variants.map((variant) => (
          <div
            key={variant.id}
            style={{
              borderBottomColor: `${QSAITheme.border.light}20`
            }}
            className="flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer group border-b"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `rgba(124, 93, 250, 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={() => onAddOption(variant)}
          >
            {/* Customise Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCustomiseOption(variant);
              }}
              className="transition-colors flex-shrink-0 hover:scale-110"
              style={{ color: QSAITheme.accent.primary }}
              onMouseEnter={(e) => e.currentTarget.style.color = QSAITheme.accent.secondary}
              onMouseLeave={(e) => e.currentTarget.style.color = QSAITheme.accent.primary}
              title="Customise this variation"
            >
              🔧
            </button>

            {/* Option Name - Clickable to add */}
            <span 
              className="flex-1 text-sm font-medium cursor-pointer"
              style={{ color: QSAITheme.text.primary }}
              title="Click to add to order"
            >
              {getVariantDisplayName(variant)}
            </span>

            {/* Price */}
            <span 
              className="font-bold text-sm flex-shrink-0 w-16 text-right"
              style={{ color: QSAITheme.text.primary }}
            >
              £{getVariantPrice(variant).toFixed(2)}
            </span>
          </div>
        ))}

        {/* Other Option */}
        <div style={{ borderTop: `1px solid ${QSAITheme.border.light}` }}>
          <div 
            className="flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer group"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `rgba(124, 93, 250, 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={onOtherOption}
          >
            {/* Empty space for alignment */}
            <div className="w-5 flex-shrink-0"></div>

            {/* Other Label */}
            <span 
              className="flex-1 text-sm italic cursor-pointer"
              style={{ color: QSAITheme.text.secondary }}
              title="Click to add custom protein"
            >
              Other (Custom Protein)
            </span>

            {/* Empty price space */}
            <div className="w-16 flex-shrink-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FloatingDropdown;
