import React from 'react'
import { VariantChip } from 'components/VariantChip'
import type { ItemVariant, ProteinType } from 'utils/menuTypes'
import { CardDesignTokens } from '../utils/cardDesignTokens'

interface Props {
  variants: ItemVariant[]
  proteinTypes: ProteinType[]
  mode: 'collection' | 'delivery'
  selectedVariantId: string | null
  onVariantClick: (variant: ItemVariant) => void
  theme?: 'premium' | 'pos'
}

export function VariantChipsSection({
  variants,
  proteinTypes,
  mode,
  selectedVariantId,
  onVariantClick,
  theme = 'premium'
}: Props) {
  // Filter and sort variants
  const activeVariants = variants
    .filter(v => v.is_active)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))

  if (activeVariants.length === 0) return null

  // Determine spacing mode based on variant count
  const isCompactMode = activeVariants.length >= 5
  const gapSize = isCompactMode ? "gap-2.5" : "gap-3.5"

  return (
    <div className="space-y-3">
      <div 
        className={`${CardDesignTokens.typography.variantLabel.size} ${CardDesignTokens.typography.variantLabel.weight}`}
        style={{ color: CardDesignTokens.typography.variantLabel.color }}
      >
        Available in:
      </div>
      
      {/* Professional Flex Layout: Natural flow for clean distribution */}
      <div className={`flex flex-wrap justify-start ${gapSize}`}>
        {activeVariants.map(variant => {
          // Find protein type name
          const proteinType = proteinTypes.find(
            pt => pt.id === variant.protein_type_id
          )
          const proteinName = proteinType?.name || variant.name || 'Unknown'

          // Calculate display price
          const displayPrice = mode === 'delivery'
            ? (variant.price_delivery ?? variant.price)
            : variant.price

          return (
            <VariantChip
              key={variant.id}
              variant={variant}
              proteinTypeName={proteinName}
              displayPrice={displayPrice}
              mode={mode}
              onClick={onVariantClick}
              isSelected={variant.id === selectedVariantId}
              size={isCompactMode ? 'compact' : 'normal'}
              theme={theme}
            />
          )
        })}
      </div>
    </div>
  )
}
