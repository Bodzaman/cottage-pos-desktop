/**
 * Pricing Mode Selector Component
 * 
 * Step 2 of the menu item configuration wizard.
 * Presents visual comparison between Single Price and Multiple Variants options.
 * 
 * Includes:
 * - Clear descriptions of each option
 * - Real-world restaurant examples
 * - "Best for" guidance
 * - Visual radio-style selection
 * - Warning about permanence
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { PricingMode } from 'utils/menuItemConfiguration';

interface Props {
  /** Currently selected pricing mode */
  selectedMode: PricingMode | null;
  
  /** Callback when mode is selected */
  onSelect: (mode: PricingMode) => void;
  
  /** Callback for back button */
  onBack: () => void;
  
  /** Callback for continue button */
  onContinue: () => void;
  
  /** Disable continue if selection not made */
  canContinue: boolean;
}

export function PricingModeSelector({
  selectedMode,
  onSelect,
  onBack,
  onContinue,
  canContinue
}: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Step 2 of 2</p>
        <h2 className="text-2xl font-bold text-foreground">Configure Pricing Structure</h2>
        <p className="text-muted-foreground mt-2">How will this item be priced?</p>
      </div>

      {/* Pricing Mode Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Single Price Option */}
        <Card
          className={`relative p-6 cursor-pointer transition-all border-2 ${
            selectedMode === 'single'
              ? 'border-purple-600 bg-purple-900/15'
              : 'border-border hover:border-purple-600/50'
          }`}
          onClick={() => onSelect('single')}
        >
          {/* Selection Indicator */}
          <div className="absolute top-4 right-4">
            {selectedMode === 'single' ? (
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-border" />
            )}
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-xl font-semibold text-foreground">Single Price Item</h3>
              <p className="text-sm text-muted-foreground mt-1">One fixed price for this item</p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">One fixed price</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Quick setup</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Best for: Side dishes, drinks, single items with no variations
                </p>
              </div>
            </div>

            {/* Examples */}
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Examples:</p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Garlic Naan</span>
                  <span className="text-sm font-medium text-purple-400">£2.95</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Mango Lassi</span>
                  <span className="text-sm font-medium text-purple-400">£3.50</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Poppadum</span>
                  <span className="text-sm font-medium text-purple-400">£0.80</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Multiple Variants Option */}
        <Card
          className={`relative p-6 cursor-pointer transition-all border-2 ${
            selectedMode === 'variants'
              ? 'border-purple-600 bg-purple-900/15'
              : 'border-border hover:border-purple-600/50'
          }`}
          onClick={() => onSelect('variants')}
        >
          {/* Selection Indicator */}
          <div className="absolute top-4 right-4">
            {selectedMode === 'variants' ? (
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-border" />
            )}
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                Multiple Variants
                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">Recommended</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Different proteins, sizes, or styles</p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Different proteins, sizes, or preparation styles</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Each variant has its own price</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Best for: Main courses, curries, customizable items
                </p>
              </div>
            </div>

            {/* Examples */}
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Examples:</p>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Tikka Masala</p>
                <div className="pl-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">→ Chicken</span>
                    <span className="text-sm font-medium text-purple-400">£8.95</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">→ Lamb</span>
                    <span className="text-sm font-medium text-purple-400">£9.95</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">→ King Prawn</span>
                    <span className="text-sm font-medium text-purple-400">£11.95</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Warning Alert */}
      <Alert className="border-orange-500/50 bg-orange-500/10">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <AlertDescription className="text-foreground">
          <strong className="font-semibold">Important:</strong> This choice cannot be changed after creation
          to protect your pricing data. Choose carefully!
        </AlertDescription>
      </Alert>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Button
          onClick={onContinue}
          disabled={!canContinue}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          Continue to Form
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
