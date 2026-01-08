import { PremiumTheme } from '../utils/premiumTheme'
import type { ItemVariant } from 'utils/menuTypes'
import { CardDesignTokens } from '../utils/cardDesignTokens'

interface Props {
  variant: ItemVariant
  proteinTypeName: string
  displayPrice: number
  mode: 'collection' | 'delivery'
  onClick: (variant: ItemVariant) => void
  isSelected?: boolean
  size?: 'normal' | 'compact'
  theme?: 'premium' | 'pos'
}

export function VariantChip({
  variant,
  proteinTypeName,
  displayPrice,
  onClick,
  isSelected = false,
  size = 'normal',
  theme = 'premium'
}: Props) {
  const isCompact = size === 'compact'

  // Theme-based colors
  const themeColors = theme === 'pos' ? {
    // POS Purple Theme
    selectedGradient: 'linear-gradient(135deg, #7C5DFA 0%, #6B4DE0 100%)',
    selectedBorder: '#7C5DFA',
    selectedGlow: '0 0 20px rgba(124, 93, 250, 0.3)',
    hoverBorder: '#7C5DFA',
    hoverGlow: '0 0 20px rgba(124, 93, 250, 0.2)'
  } : {
    // Premium Ruby/Burgundy Theme
    selectedGradient: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]} 0%, ${PremiumTheme.colors.burgundy[700]} 100%)`,
    selectedBorder: PremiumTheme.colors.burgundy[400],
    selectedGlow: CardDesignTokens.effects.borderGlow.burgundy,
    hoverBorder: PremiumTheme.colors.burgundy[500],
    hoverGlow: CardDesignTokens.effects.borderGlow.silver
  }

  const sizeClasses = isCompact
    ? 'min-w-[85px] px-2.5 py-1.5 text-sm'
    : 'min-w-[105px] px-3.5 py-2 text-base'

  return (
    <button
      onClick={() => onClick(variant)}
      className={`
        relative flex flex-col items-center justify-center
        ${CardDesignTokens.borderRadius.chip} border-2 transition-all duration-200
        ${sizeClasses}
      `}
      style={{
        background: isSelected 
          ? themeColors.selectedGradient
          : CardDesignTokens.colors.chipGradient,
        borderColor: isSelected 
          ? themeColors.selectedBorder
          : PremiumTheme.colors.dark[600],
        boxShadow: isSelected 
          ? themeColors.selectedGlow
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = themeColors.hoverBorder;
          e.currentTarget.style.boxShadow = themeColors.hoverGlow;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = PremiumTheme.colors.dark[600];
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Protein Name - Smaller, uppercase, letter-spaced */}
      <span
        className={`
          ${CardDesignTokens.typography.chipProteinName.size}
          ${CardDesignTokens.typography.chipProteinName.weight}
          ${CardDesignTokens.typography.chipProteinName.transform}
          ${CardDesignTokens.typography.chipProteinName.letterSpacing}
          ${isSelected ? 'text-white' : 'text-gray-300'}
        `}
      >
        {proteinTypeName}
      </span>

      {/* Price - Larger, bold, gold accent */}
      <span
        className={`
          ${CardDesignTokens.typography.chipPrice.size}
          ${CardDesignTokens.typography.chipPrice.weight}
          mt-1
        `}
        style={{
          color: isSelected 
            ? '#FFFFFF'
            : CardDesignTokens.typography.chipPrice.color
        }}
      >
        £{displayPrice.toFixed(2)}
      </span>
    </button>
  )
}
