
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { globalColors } from '../utils/QSAIDesign';

// Standard allergen list with emojis for Indian restaurant context
const STANDARD_ALLERGENS = [
  { key: 'dairy', label: '🥛 Dairy', description: '(milk, ghee, yogurt, paneer, cream)' },
  { key: 'tree_nuts', label: '🌰 Tree Nuts', description: '(cashews, almonds, pistachios)' },
  { key: 'peanuts', label: '🥜 Peanuts', description: '' },
  { key: 'gluten', label: '🌾 Gluten', description: '(wheat, naan, roti)' },
  { key: 'eggs', label: '🥚 Eggs', description: '(in some breads, preparations)' },
  { key: 'fish', label: '🐟 Fish', description: '' },
  { key: 'shellfish', label: '🦐 Shellfish/Crustaceans', description: '' },
  { key: 'soy', label: '🫘 Soy', description: '(soy sauce, tofu)' },
  { key: 'sesame', label: '🌱 Sesame', description: '(sesame oil, tahini)' },
  { key: 'mustard', label: '🟡 Mustard', description: '(mustard seeds/oil)' },
  { key: 'celery', label: '🥬 Celery', description: '' },
  { key: 'molluscs', label: '🦪 Molluscs', description: '' }
] as const;

export interface AllergenSelectorProps {
  selectedAllergens: string[];
  onAllergensChange: (allergens: string[]) => void;
  allergenNotes?: string;
  onAllergenNotesChange?: (notes: string) => void;
  className?: string;
}

/**
 * AllergenSelector Component
 * 
 * Multi-select checkbox system for standardized allergen selection
 * with additional free text field for special notes.
 */
export function AllergenSelector({
  selectedAllergens = [],
  onAllergensChange,
  allergenNotes = '',
  onAllergenNotesChange,
  className = ''
}: AllergenSelectorProps) {

  const handleAllergenToggle = (allergenKey: string, checked: boolean) => {
    if (checked) {
      // Add allergen if not already selected
      if (!selectedAllergens.includes(allergenKey)) {
        onAllergensChange([...selectedAllergens, allergenKey]);
      }
    } else {
      // Remove allergen
      onAllergensChange(selectedAllergens.filter(key => key !== allergenKey));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Allergen Checkboxes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
          Select Allergens Present
        </Label>
        
        {/* Grid layout for allergens - 2 columns on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STANDARD_ALLERGENS.map((allergen) => {
            const isSelected = selectedAllergens.includes(allergen.key);
            
            return (
              <div key={allergen.key} className="flex items-start space-x-3 p-3 rounded-lg border transition-colors"
                   style={{
                     backgroundColor: isSelected ? 'rgba(91, 33, 182, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                     borderColor: isSelected ? 'rgba(91, 33, 182, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                   }}>
                <Checkbox
                  id={`allergen-${allergen.key}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleAllergenToggle(allergen.key, checked as boolean)}
                  className="mt-0.5"
                  style={{
                    backgroundColor: isSelected ? globalColors.purple.primary : 'transparent',
                    borderColor: isSelected ? globalColors.purple.primary : 'rgba(255, 255, 255, 0.3)'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <Label 
                    htmlFor={`allergen-${allergen.key}`}
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: globalColors.text.primary }}
                  >
                    {allergen.label}
                  </Label>
                  {allergen.description && (
                    <p className="text-xs mt-1" style={{ color: globalColors.text.secondary }}>
                      {allergen.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Selected allergens summary */}
        {selectedAllergens.length > 0 && (
          <div className="p-3 rounded-lg" 
               style={{ 
                 backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                 border: '1px solid rgba(239, 68, 68, 0.2)' 
               }}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium" style={{ color: '#EF4444' }}>⚠️ Contains:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedAllergens.map(key => {
                const allergen = STANDARD_ALLERGENS.find(a => a.key === key);
                return allergen ? (
                  <span key={key} 
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                          color: '#EF4444' 
                        }}>
                    {allergen.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Additional Notes Field */}
      {onAllergenNotesChange && (
        <div className="space-y-2">
          <Label htmlFor="allergen-notes" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
            Additional Allergen Notes
          </Label>
          <Textarea
            id="allergen-notes"
            placeholder="e.g., Contains traces of sesame, prepared in facility with tree nuts, may contain sulphites"
            value={allergenNotes}
            onChange={(e) => onAllergenNotesChange(e.target.value)}
            className="min-h-[60px] resize-none bg-black/20 border-white/10"
            rows={2}
          />
          <p className="text-xs" style={{ color: globalColors.text.secondary }}>
            Any additional allergen information not covered by the checkboxes above
          </p>
        </div>
      )}
    </div>
  );
}

// Export allergen utilities for use in display components
export const getAllergenLabel = (allergenKey: string): string => {
  const allergen = STANDARD_ALLERGENS.find(a => a.key === allergenKey);
  return allergen ? allergen.label : allergenKey;
};

export const getAllergenEmoji = (allergenKey: string): string => {
  const allergen = STANDARD_ALLERGENS.find(a => a.key === allergenKey);
  if (!allergen) return '⚠️';
  
  // Extract emoji from label
  const emojiMatch = allergen.label.match(/^(🥛|🌰|🥜|🌾|🥚|🐟|🦐|🫘|🌱|🟡|🥬|🦪)/);
  return emojiMatch ? emojiMatch[1] : '⚠️';
};

export const ALLERGEN_KEYS = STANDARD_ALLERGENS.map(a => a.key);

export default AllergenSelector;
