
import React, { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { globalColors } from '../utils/QSAIDesign';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

// Allergen status type
export type AllergenStatus = 'contains' | 'may_contain';
export type AllergenData = Record<string, AllergenStatus>;

// Fallback allergen list matching the 14 UK major allergens in allergen_definitions table
const FALLBACK_ALLERGENS = [
  { id: 'celery', name: 'Celery', icon_name: '🥬', sort_order: 1 },
  { id: 'gluten', name: 'Gluten (Cereals)', icon_name: '🌾', sort_order: 2 },
  { id: 'crustaceans', name: 'Crustaceans', icon_name: '🦐', sort_order: 3 },
  { id: 'eggs', name: 'Eggs', icon_name: '🥚', sort_order: 4 },
  { id: 'fish', name: 'Fish', icon_name: '🐟', sort_order: 5 },
  { id: 'lupin', name: 'Lupin', icon_name: '🌿', sort_order: 6 },
  { id: 'milk', name: 'Milk (Dairy)', icon_name: '🥛', sort_order: 7 },
  { id: 'molluscs', name: 'Molluscs', icon_name: '🦪', sort_order: 8 },
  { id: 'mustard', name: 'Mustard', icon_name: '🟡', sort_order: 9 },
  { id: 'nuts', name: 'Tree Nuts', icon_name: '🌰', sort_order: 10 },
  { id: 'peanuts', name: 'Peanuts', icon_name: '🥜', sort_order: 11 },
  { id: 'sesame', name: 'Sesame', icon_name: '🌱', sort_order: 12 },
  { id: 'soya', name: 'Soya', icon_name: '🫘', sort_order: 13 },
  { id: 'sulphites', name: 'Sulphur Dioxide / Sulphites', icon_name: '🧪', sort_order: 14 },
];

interface AllergenDefinition {
  id: string;
  name: string;
  icon_name: string | null;
  sort_order: number;
}

export interface AllergenSelectorProps {
  /** JSONB allergen data: { "gluten": "contains", "nuts": "may_contain" } */
  allergenData: AllergenData;
  onAllergenDataChange: (data: AllergenData) => void;
  allergenNotes?: string;
  onAllergenNotesChange?: (notes: string) => void;
  className?: string;
}

/**
 * Normalize legacy data formats to the current JSONB format.
 * Handles: string[] (old format) -> Record (new format treating all as "contains")
 */
export function normalizeAllergenData(raw: unknown): AllergenData {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    // Legacy string array format -> treat all as "contains"
    const result: AllergenData = {};
    for (const key of raw) {
      if (typeof key === 'string') result[key] = 'contains';
    }
    return result;
  }
  if (typeof raw === 'object') {
    return raw as AllergenData;
  }
  return {};
}

const STATUS_CYCLE: Array<AllergenStatus | null> = [null, 'contains', 'may_contain'];

function getNextStatus(current: AllergenStatus | undefined): AllergenStatus | null {
  const idx = current ? STATUS_CYCLE.indexOf(current) : 0;
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

const STATUS_STYLES = {
  contains: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#EF4444',
    label: 'Contains',
  },
  may_contain: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    text: '#F59E0B',
    label: 'May Contain',
  },
  none: {
    bg: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: 'rgba(255, 255, 255, 0.5)',
    label: 'Not Set',
  },
};

/**
 * AllergenSelector Component - 3-State System
 *
 * Click cycles: Not Set -> Contains (red) -> May Contain (amber) -> Not Set
 * Fetches allergen list from allergen_definitions table with fallback.
 * Outputs JSONB format: { "gluten": "contains", "nuts": "may_contain" }
 */
export function AllergenSelector({
  allergenData = {},
  onAllergenDataChange,
  allergenNotes = '',
  onAllergenNotesChange,
  className = ''
}: AllergenSelectorProps) {

  // Fetch allergen definitions from DB
  const { data: allergenDefs } = useQuery<AllergenDefinition[]>({
    queryKey: ['allergen_definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allergen_definitions')
        .select('id, name, icon_name, sort_order')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  const allergens = allergenDefs && allergenDefs.length > 0 ? allergenDefs : FALLBACK_ALLERGENS;

  const handleAllergenCycle = useCallback((allergenId: string) => {
    const current = allergenData[allergenId];
    const next = getNextStatus(current);
    const updated = { ...allergenData };
    if (next === null) {
      delete updated[allergenId];
    } else {
      updated[allergenId] = next;
    }
    onAllergenDataChange(updated);
  }, [allergenData, onAllergenDataChange]);

  const containsList = Object.entries(allergenData).filter(([, v]) => v === 'contains');
  const mayContainList = Object.entries(allergenData).filter(([, v]) => v === 'may_contain');

  const getAllergenName = (id: string) => {
    const def = allergens.find(a => a.id === id);
    return def ? `${def.icon_name || ''} ${def.name}` : id;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Allergen Grid */}
      <div className="space-y-3">
        <Label className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
          Allergen Information
        </Label>
        <p className="text-xs" style={{ color: globalColors.text.secondary }}>
          Click to cycle: <span style={{ color: STATUS_STYLES.none.text }}>Not Set</span>{' '}
          <span style={{ color: STATUS_STYLES.contains.text }}>Contains</span>{' '}
          <span style={{ color: STATUS_STYLES.may_contain.text }}>May Contain</span>{' '}
          Not Set
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allergens.map((allergen) => {
            const status = allergenData[allergen.id];
            const style = status ? STATUS_STYLES[status] : STATUS_STYLES.none;

            return (
              <button
                key={allergen.id}
                type="button"
                onClick={() => handleAllergenCycle(allergen.id)}
                className="flex items-center space-x-3 p-3 rounded-lg border transition-all text-left hover:scale-[1.01]"
                style={{
                  backgroundColor: style.bg,
                  borderColor: style.border,
                }}
              >
                <span className="text-lg flex-shrink-0" aria-hidden="true">
                  {allergen.icon_name || ''}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-medium block"
                    style={{ color: globalColors.text.primary }}
                  >
                    {allergen.name}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: style.text }}
                  >
                    {style.label}
                  </span>
                </div>
                {status && (
                  <span
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: style.text }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {(containsList.length > 0 || mayContainList.length > 0) && (
        <div className="space-y-2">
          {containsList.length > 0 && (
            <div className="p-3 rounded-lg"
                 style={{
                   backgroundColor: 'rgba(239, 68, 68, 0.1)',
                   border: '1px solid rgba(239, 68, 68, 0.2)'
                 }}>
              <span className="text-sm font-medium" style={{ color: '#EF4444' }}>Contains:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {containsList.map(([key]) => (
                  <span key={key}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>
                    {getAllergenName(key)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {mayContainList.length > 0 && (
            <div className="p-3 rounded-lg"
                 style={{
                   backgroundColor: 'rgba(245, 158, 11, 0.1)',
                   border: '1px solid rgba(245, 158, 11, 0.2)'
                 }}>
              <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>May Contain:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {mayContainList.map(([key]) => (
                  <span key={key}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }}>
                    {getAllergenName(key)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            Any additional allergen information not covered above
          </p>
        </div>
      )}
    </div>
  );
}

// Export allergen utilities for use in display components
export const getAllergenLabel = (allergenKey: string): string => {
  const allergen = FALLBACK_ALLERGENS.find(a => a.id === allergenKey);
  return allergen ? `${allergen.icon_name} ${allergen.name}` : allergenKey;
};

export const getAllergenEmoji = (allergenKey: string): string => {
  const allergen = FALLBACK_ALLERGENS.find(a => a.id === allergenKey);
  return allergen?.icon_name || '';
};

export const ALLERGEN_KEYS = FALLBACK_ALLERGENS.map(a => a.id);

export default AllergenSelector;
