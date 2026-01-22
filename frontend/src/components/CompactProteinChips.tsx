import React from 'react';
import { ItemVariant, ProteinType } from '../utils/menuTypes';
import { cn } from '../utils/cn';

interface CompactProteinChipsProps {
  variants: ItemVariant[];
  proteinTypes: ProteinType[];
  themeColor: string;
  orderType?: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  maxVisible?: number;
  className?: string;
  onVariantClick?: (variant: ItemVariant) => void;
  selectedVariantId?: string | null;
  // New props for one-click ordering
  currentQuantity?: number;
  onAddVariant?: (variant: ItemVariant, quantity: number) => void;
}

/**
 * Smart protein chips with truncation and tooltip support
 * Displays protein type names from variants with pricing based on order type
 * Now clickable to select variants OR directly add to order
 */
export function CompactProteinChips({
  variants,
  proteinTypes,
  themeColor,
  orderType = 'COLLECTION',
  maxVisible,
  className,
  onVariantClick,
  selectedVariantId,
  currentQuantity = 1,
  onAddVariant
}: CompactProteinChipsProps) {
  // Filter active variants and sort by price
  const activeVariants = variants
    .filter(v => v.is_active)
    .sort((a, b) => a.price - b.price);

  if (activeVariants.length === 0) return null;

  // Helper function to get correct price based on order type
  const getVariantPrice = (variant: ItemVariant): number => {
    if (orderType === 'DINE-IN') {
      return variant.price_dine_in ?? variant.price;
    } else if (orderType === 'DELIVERY') {
      return variant.price_delivery ?? variant.price;
    } else {
      // COLLECTION or WAITING
      return variant.price;
    }
  };

  // Determine how many to show
  const visibleVariants = maxVisible 
    ? activeVariants.slice(0, maxVisible) 
    : activeVariants;
  const remainingCount = activeVariants.length - visibleVariants.length;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleVariants.map(variant => {
        const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
        const proteinName = proteinType?.name || variant.name || 'Unknown';
        const price = getVariantPrice(variant);
        const displayText = `${proteinName} £${price.toFixed(2)}`;
        const isSelected = selectedVariantId === variant.id;
        
        return (
          <span
            key={variant.id}
            className={cn(
              "px-2 py-1 text-xs font-semibold rounded inline-block transition-all duration-200",
              (onVariantClick || onAddVariant) && "cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95"
            )}
            style={{
              backgroundColor: isSelected ? '#7C5DFA' : '#5B3DD0',
              color: '#FFFFFF',
              border: isSelected ? '2px solid #9178FF' : '2px solid transparent',
              boxShadow: isSelected ? '0 0 12px rgba(124, 93, 250, 0.5)' : 'none'
            }}
            title={displayText}
            onClick={(e) => {
              e.stopPropagation();
              // Priority: onAddVariant for one-click ordering, fallback to onVariantClick for selection
              if (onAddVariant) {
                onAddVariant(variant, currentQuantity);
              } else if (onVariantClick) {
                onVariantClick(variant);
              }
            }}
          >
            {displayText}
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span 
          className="text-xs font-medium px-2 py-0.5"
          style={{ 
            color: `${themeColor}80`,
            opacity: 0.7 
          }}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
