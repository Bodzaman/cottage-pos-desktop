import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getAllergenLabel, getAllergenEmoji } from './AllergenSelector';

export interface AllergenDisplayProps {
  allergens: Record<string, "contains" | "may_contain"> | string[] | string | null | undefined;
  allergenNotes?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  maxDisplay?: number; // Maximum number of allergens to show before "+ more"
  compact?: boolean; // Show only emojis in compact mode
}

/**
 * AllergenDisplay Component
 * 
 * Displays allergen information with emojis and labels.
 * Handles both new structured allergen arrays and legacy text allergen fields.
 */
export function AllergenDisplay({
  allergens,
  allergenNotes,
  size = 'md',
  showLabels = false,
  className = '',
  maxDisplay,
  compact = false
}: AllergenDisplayProps) {
  // Handle empty or null allergens
  const isEmpty = !allergens ||
    (Array.isArray(allergens) && allergens.length === 0) ||
    (typeof allergens === 'object' && !Array.isArray(allergens) && Object.keys(allergens).length === 0);

  if (isEmpty) {
    // If no structured allergens but we have notes, show a generic allergen warning
    if (allergenNotes && allergenNotes.trim()) {
      return (
        <div className={`flex items-center gap-1 ${className}`}>
          <Badge
            variant="destructive"
            className={`${getSizeClasses(size)} bg-red-100 text-red-800 border border-red-300`}
          >
            Contains allergens
          </Badge>
        </div>
      );
    }
    return null;
  }

  // Handle legacy text allergens (backward compatibility)
  if (typeof allergens === 'string') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Badge
          variant="destructive"
          className={`${getSizeClasses(size)} bg-red-100 text-red-800 border border-red-300`}
        >
          {compact ? '' : showLabels ? allergens : 'Contains allergens'}
        </Badge>
      </div>
    );
  }

  // Normalize to a list of { key, status } entries
  let allergenEntries: Array<{ key: string; status: 'contains' | 'may_contain' }>;

  if (Array.isArray(allergens)) {
    // Legacy string array format: treat all as "contains"
    allergenEntries = allergens.map(key => ({ key, status: 'contains' as const }));
  } else {
    // New JSONB format: { "gluten": "contains", "nuts": "may_contain" }
    allergenEntries = Object.entries(allergens).map(([key, status]) => ({ key, status }));
  }

  if (allergenEntries.length === 0) return null;

  // Separate contains vs may_contain
  const containsItems = allergenEntries.filter(e => e.status === 'contains');
  const mayContainItems = allergenEntries.filter(e => e.status === 'may_contain');
  const allItems = [...containsItems, ...mayContainItems];

  // Apply max display limit
  const displayAllergens = maxDisplay ? allItems.slice(0, maxDisplay) : allItems;
  const hiddenCount = maxDisplay && allItems.length > maxDisplay ? allItems.length - maxDisplay : 0;

  return (
    <div className={`flex items-center flex-wrap gap-1 ${className}`}>
      {displayAllergens.map(({ key, status }) => {
        const emoji = getAllergenEmoji(key);
        const label = getAllergenLabel(key);
        const isContains = status === 'contains';

        return (
          <Badge
            key={key}
            variant="destructive"
            className={`${getSizeClasses(size)} flex items-center gap-1 ${
              isContains
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <span>{emoji}</span>
            {!compact && showLabels && (
              <span className="text-xs">{label.replace(/^[^\s]+\s/, '')}</span>
            )}
          </Badge>
        );
      })}

      {hiddenCount > 0 && (
        <Badge
          variant="outline"
          className={`${getSizeClasses(size)} text-gray-600 border-gray-400`}
        >
          +{hiddenCount} more
        </Badge>
      )}

      {allergenNotes && allergenNotes.trim() && !compact && (
        <Badge
          variant="outline"
          className={`${getSizeClasses(size)} text-amber-700 border-amber-400 bg-amber-50`}
        >
          Notes
        </Badge>
      )}
    </div>
  );
}

// Size utility function
function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-xs px-1.5 py-0.5';
    case 'lg':
      return 'text-sm px-3 py-1';
    case 'md':
    default:
      return 'text-xs px-2 py-1';
  }
}

export default AllergenDisplay;
