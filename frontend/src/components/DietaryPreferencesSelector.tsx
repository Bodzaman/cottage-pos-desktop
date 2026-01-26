import React from 'react';
import { motion } from 'framer-motion';
import { Check, Leaf, Wheat, Milk, AlertTriangle, Star } from 'lucide-react';
import { PremiumTheme } from 'utils/CustomerDesignSystem';

// Dietary preference options with icons and descriptions
const DIETARY_OPTIONS = [
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    description: 'No meat or fish',
    icon: Leaf,
    color: '#22c55e' // green
  },
  {
    id: 'vegan',
    label: 'Vegan',
    description: 'No animal products',
    icon: Leaf,
    color: '#16a34a' // darker green
  },
  {
    id: 'gluten_free',
    label: 'Gluten-Free',
    description: 'No wheat, barley, or rye',
    icon: Wheat,
    color: '#eab308' // yellow
  },
  {
    id: 'nut_allergy',
    label: 'Nut Allergy',
    description: 'Avoid all nuts',
    icon: AlertTriangle,
    color: '#ef4444' // red
  },
  {
    id: 'dairy_free',
    label: 'Dairy-Free',
    description: 'No milk or dairy products',
    icon: Milk,
    color: '#3b82f6' // blue
  },
  {
    id: 'halal',
    label: 'Halal',
    description: 'Halal certified only',
    icon: Star,
    color: '#8b5cf6' // purple
  }
];

interface Props {
  selectedPreferences: string[];
  onChange: (preferences: string[]) => void;
  disabled?: boolean;
}

export function DietaryPreferencesSelector({ selectedPreferences, onChange, disabled = false }: Props) {
  const togglePreference = (prefId: string) => {
    if (disabled) return;

    if (selectedPreferences.includes(prefId)) {
      onChange(selectedPreferences.filter(p => p !== prefId));
    } else {
      onChange([...selectedPreferences, prefId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-[#EAECEF]">Dietary Preferences</h4>
          <p className="text-xs text-[#8B92A0] mt-0.5">
            Select any dietary requirements you have
          </p>
        </div>
        {selectedPreferences.length > 0 && (
          <span className="text-xs text-[#8B1538]">
            {selectedPreferences.length} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {DIETARY_OPTIONS.map((option) => {
          const isSelected = selectedPreferences.includes(option.id);
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              onClick={() => togglePreference(option.id)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={{
                background: isSelected
                  ? `${option.color}15`
                  : 'rgba(255, 255, 255, 0.03)',
                borderColor: isSelected
                  ? option.color
                  : PremiumTheme.colors.border.light,
                boxShadow: isSelected
                  ? `0 0 20px ${option.color}20`
                  : 'none'
              }}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 p-0.5 rounded-full"
                  style={{ background: option.color }}
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              )}

              {/* Icon */}
              <div
                className="p-2 rounded-lg w-fit mb-2"
                style={{
                  background: isSelected ? `${option.color}30` : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{ color: isSelected ? option.color : '#8B92A0' }}
                />
              </div>

              {/* Label & Description */}
              <p
                className="text-sm font-medium"
                style={{ color: isSelected ? '#EAECEF' : '#B7BDC6' }}
              >
                {option.label}
              </p>
              <p className="text-xs text-[#8B92A0] mt-0.5">
                {option.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {selectedPreferences.length > 0 && (
        <p className="text-xs text-[#8B92A0]">
          Your dietary preferences help us highlight suitable menu items and filter recommendations.
        </p>
      )}
    </div>
  );
}
