/**
 * MenuItemTypeConfigurationStep
 *
 * Inline configuration component for MenuItemForm.
 * Replaces the separate wizard dialog with an in-form collapsible section.
 *
 * Features:
 * - Item type selection (Food, Drinks & Wine, Coffee & Desserts)
 * - Pricing mode selection (Single Price, Multiple Variants)
 * - Category selection with search
 * - Progressive disclosure
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed,
  Wine,
  Coffee,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { colors } from 'utils/designSystem';
import { cn } from '@/lib/utils';
import type { MenuItemConfiguration, PricingMode } from 'utils/menuItemConfiguration';

export type ItemType = 'food' | 'drinks_wine' | 'coffee_desserts';

interface MenuItemTypeConfigurationStepProps {
  /** Current configuration (null for new items without selection) */
  configuration: MenuItemConfiguration | null;
  /** Whether the configuration is locked (for existing items) */
  isLocked: boolean;
  /** Callback when configuration changes */
  onConfigurationChange: (config: MenuItemConfiguration) => void;
  /** Whether this section is expanded */
  isExpanded: boolean;
  /** Toggle expanded state */
  onToggleExpanded: () => void;
  /** Whether configuration is complete */
  isComplete: boolean;
}

const ITEM_TYPES = [
  {
    id: 'food' as ItemType,
    title: 'Food',
    description: 'Starters, mains, sides',
    icon: UtensilsCrossed,
    color: colors.brand.purple,
  },
  {
    id: 'drinks_wine' as ItemType,
    title: 'Drinks & Wine',
    description: 'Beverages, alcohol',
    icon: Wine,
    color: '#0EBAB1', // turquoise
  },
  {
    id: 'coffee_desserts' as ItemType,
    title: 'Coffee & Desserts',
    description: 'Hot drinks, sweets',
    icon: Coffee,
    color: '#C0C0C0', // silver
  },
];

const PRICING_MODES = [
  {
    id: 'single' as PricingMode,
    title: 'Single Price',
    description: 'One fixed price (e.g., Naan £2.95)',
    recommended: false,
  },
  {
    id: 'variants' as PricingMode,
    title: 'Multiple Variants',
    description: 'Different proteins/sizes (e.g., Chicken £8.95, Lamb £9.95)',
    recommended: true,
  },
];

export function MenuItemTypeConfigurationStep({
  configuration,
  isLocked,
  onConfigurationChange,
  isExpanded,
  onToggleExpanded,
  isComplete,
}: MenuItemTypeConfigurationStepProps) {
  const [selectedType, setSelectedType] = useState<ItemType | null>(
    configuration?.itemType || null
  );
  const [selectedPricingMode, setSelectedPricingMode] = useState<PricingMode | null>(
    configuration?.pricingMode || null
  );

  const handleTypeSelect = (type: ItemType) => {
    if (isLocked) return;
    setSelectedType(type);

    // If pricing mode already selected, update configuration
    if (selectedPricingMode) {
      onConfigurationChange({
        itemType: type,
        pricingMode: selectedPricingMode,
        configuredAt: new Date(),
        isLocked: false,
      });
    }
  };

  const handlePricingModeSelect = (mode: PricingMode) => {
    if (isLocked) return;
    setSelectedPricingMode(mode);

    // If type already selected, update configuration
    if (selectedType) {
      onConfigurationChange({
        itemType: selectedType,
        pricingMode: mode,
        configuredAt: new Date(),
        isLocked: false,
      });
    }
  };

  const selectedTypeInfo = ITEM_TYPES.find((t) => t.id === selectedType);
  const selectedPricingInfo = PRICING_MODES.find((p) => p.id === selectedPricingMode);

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'rgba(124, 93, 250, 0.2)' }}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggleExpanded}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors",
          isExpanded
            ? "bg-[rgba(124,93,250,0.1)]"
            : "bg-[rgba(124,93,250,0.05)] hover:bg-[rgba(124,93,250,0.08)]"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              isComplete
                ? "bg-emerald-500 text-white"
                : "bg-[rgba(124,93,250,0.3)] text-white"
            )}
          >
            {isComplete ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Item Type & Pricing</h3>
            {isComplete && selectedTypeInfo && selectedPricingInfo && (
              <p className="text-sm text-gray-400">
                {selectedTypeInfo.title} • {selectedPricingInfo.title}
                {isLocked && (
                  <Badge variant="outline" className="ml-2 text-xs py-0">
                    Locked
                  </Badge>
                )}
              </p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Content - collapsible */}
      {isExpanded && (
        <div className="p-4 space-y-6 bg-[rgba(15,15,15,0.5)]">
          {isLocked && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-white">
                Item type and pricing mode cannot be changed after creation to protect your data.
              </AlertDescription>
            </Alert>
          )}

          {/* Item Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">What type of item is this?</label>
            <div className="grid grid-cols-3 gap-3">
              {ITEM_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeSelect(type.id)}
                    disabled={isLocked}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all text-center",
                      isSelected
                        ? "border-[#7C5DFA] bg-[rgba(124,93,250,0.15)]"
                        : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(124,93,250,0.4)] bg-[rgba(30,30,30,0.5)]",
                      isLocked && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7C5DFA] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div
                      className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${type.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: type.color }} />
                    </div>
                    <h4 className="font-medium text-white text-sm">{type.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Mode Selection - only show after type is selected */}
          {selectedType && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">How will this item be priced?</label>
              <div className="grid grid-cols-2 gap-3">
                {PRICING_MODES.map((mode) => {
                  const isSelected = selectedPricingMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handlePricingModeSelect(mode.id)}
                      disabled={isLocked}
                      className={cn(
                        "relative p-4 rounded-lg border-2 transition-all text-left",
                        isSelected
                          ? "border-[#7C5DFA] bg-[rgba(124,93,250,0.15)]"
                          : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(124,93,250,0.4)] bg-[rgba(30,30,30,0.5)]",
                        isLocked && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7C5DFA] flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white text-sm">{mode.title}</h4>
                        {mode.recommended && (
                          <Badge className="bg-[#7C5DFA] text-white text-[10px] px-1.5 py-0">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{mode.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Warning about permanence - only for new items */}
              {!isLocked && selectedPricingMode && (
                <Alert className="border-orange-500/30 bg-orange-500/5">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <AlertDescription className="text-gray-300 text-sm">
                    <strong>Note:</strong> Pricing mode cannot be changed after saving.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MenuItemTypeConfigurationStep;
