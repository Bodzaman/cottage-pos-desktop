import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PoundSterling, Utensils, Truck, Home, Save, Copy, Undo2, Keyboard, AlertTriangle } from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';
import { toast } from 'sonner';
import { PriceNumberInput } from './PriceNumberInput';
import { validatePriceConsistency } from '../utils/menuFormValidation';

export interface PricingData {
  price: number | undefined;
  price_takeaway: number | undefined;
  price_dine_in: number | undefined;
  price_delivery: number | undefined;
}

export interface Props {
  pricing: PricingData;
  hasVariants: boolean;
  onChange: (pricingData: PricingData) => void;
  errors?: {
    price_dine_in?: string;
    price_takeaway?: string;
    price_delivery?: string;
  };
}

export function MenuItemPricing({ pricing, hasVariants, onChange, errors }: Props) {
  const [lastPrices, setLastPrices] = useState<PricingData>(pricing);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Calculate price consistency warnings
  const priceWarnings = useMemo(() => {
    return validatePriceConsistency({
      price_dine_in: pricing.price_dine_in,
      price_takeaway: pricing.price_takeaway,
      price_delivery: pricing.price_delivery,
    });
  }, [pricing.price_dine_in, pricing.price_takeaway, pricing.price_delivery]);

  // Handle individual price changes - purely controlled component
  const handlePriceChange = (field: keyof PricingData, value: number) => {
    const newPricing = { ...pricing };
    
    // Update only the changed field, preserve all existing values
    newPricing[field] = value;
    
    // Set base price to first available value for backwards compatibility
    const firstPrice = newPricing.price_dine_in || newPricing.price_takeaway || newPricing.price_delivery || 0;
    newPricing.price = firstPrice;
    
    // Immediately notify parent - single source of truth
    onChange(newPricing);
  };

  // Keyboard shortcuts handler - removed Enter navigation, kept utility shortcuts
  const handleKeyDown = (e: React.KeyboardEvent, field: keyof PricingData) => {
    // Quantity shortcuts (1-9)
    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
      const quantity = parseInt(e.key);
      const currentValue = pricing[field] || 0;
      const newValue = currentValue + quantity;
      handlePriceChange(field, newValue);
      toast.success(`Added ${quantity} to ${field.replace('price_', '')} price`);
      return;
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'd': // Duplicate price
          e.preventDefault();
          const sourceValue = pricing[field];
          if (sourceValue) {
            // Copy to all other fields
            const newPricing = {
              ...pricing,
              price_dine_in: sourceValue,
              price_takeaway: sourceValue,
              price_delivery: sourceValue,
              price: sourceValue
            };
            onChange(newPricing);
            toast.success('Duplicated price to all fields');
          }
          break;
          
        case 'z': // Undo
          e.preventDefault();
          onChange(lastPrices);
          toast.success('Undid last pricing change');
          break;
          
        case 's': // Quick save
          e.preventDefault();
          setLastPrices(pricing);
          toast.success('Prices saved');
          break;
      }
    }

    // Escape - clear field
    if (e.key === 'Escape') {
      handlePriceChange(field, 0);
      toast.info('Cleared price field');
    }
  };

  // Format price for display
  const formatPrice = (price: number | undefined) => {
    return price ? price.toFixed(2) : '0.00';
  };

  return (
    <Card style={cardStyle}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.brand.gold }}
              aria-hidden="true"
            >
              <PoundSterling className="w-4 h-4 text-white" />
            </div>
            <CardTitle 
              className="text-lg font-medium"
              style={{ color: colors.text.primary }}
              id="pricing-title"
            >
              Pricing Configuration
            </CardTitle>
          </div>
          
          {hasVariants && (
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: colors.brand.turquoise,
                color: colors.brand.turquoise 
              }}
              aria-label="Pricing for item with variants"
            >
              Variants Enabled
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6" aria-labelledby="pricing-title">
        {/* Help Text */}
        <div 
          className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5"
          role="region"
          aria-label="Keyboard shortcuts for pricing"
          id="keyboard-shortcuts"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Keyboard className="w-4 h-4 text-purple-400" aria-hidden="true" />
            <Label className="text-sm font-medium text-purple-400">Keyboard Shortcuts</Label>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">Tab</kbd> Navigate between price fields</div>
            <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">↑/↓</kbd> Adjust price by £0.25</div>
            <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">Scroll</kbd> Quick price adjustment</div>
            <div><kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">1-9</kbd> Add quantity • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">Ctrl+D</kbd> Duplicate price • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">Ctrl+Z</kbd> Undo • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">Escape</kbd> Clear</div>
          </div>
        </div>

        {hasVariants && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${colors.brand.turquoise}20`,
              borderColor: colors.brand.turquoise + '40'
            }}
            role="note"
            aria-label="Base pricing information for variants"
          >
            <p className="font-medium" style={{ color: colors.text.primary }}>Note: This item has variants</p>
            <p style={{ color: colors.text.primary }}>The prices below serve as base prices. Individual variants can override these prices.</p>
          </div>
        )}

        <div className="space-y-4">
          <h4 
            className="text-sm font-medium"
            style={{ color: colors.text.secondary }}
            id="pricing-instructions"
          >
            Set prices for different order types (VAT inclusive)
          </h4>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            role="group"
            aria-labelledby="pricing-instructions"
            aria-describedby="keyboard-shortcuts"
          >
            {/* Dine In Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Home className="w-4 h-4" style={{ color: colors.text.secondary }} aria-hidden="true" />
                <Label
                  htmlFor="price-dine-in"
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: colors.text.secondary }}
                >
                  Dine In Price
                  {activeField === 'price_dine_in' && (
                    <span className="text-xs text-purple-400" aria-label="Currently focused">●</span>
                  )}
                </Label>
              </div>
              <PriceNumberInput
                value={pricing.price_dine_in || 0}
                onChange={(value) => handlePriceChange('price_dine_in', value)}
                placeholder="8.50"
                label=""
                tabIndex={1}
                onFocus={() => setActiveField('price_dine_in')}
                onBlur={() => setActiveField(null)}
                error={errors?.price_dine_in}
                id="price-dine-in"
                aria-label="Dine in price in pounds"
              />
            </div>

            {/* Takeaway Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Utensils className="w-4 h-4" style={{ color: colors.text.secondary }} aria-hidden="true" />
                <Label
                  htmlFor="price-takeaway"
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: colors.text.secondary }}
                >
                  Takeaway Price
                  {activeField === 'price_takeaway' && (
                    <span className="text-xs text-purple-400" aria-label="Currently focused">●</span>
                  )}
                </Label>
              </div>
              <PriceNumberInput
                value={pricing.price_takeaway || 0}
                onChange={(value) => handlePriceChange('price_takeaway', value)}
                placeholder="7.50"
                label=""
                tabIndex={2}
                onFocus={() => setActiveField('price_takeaway')}
                onBlur={() => setActiveField(null)}
                error={errors?.price_takeaway}
                id="price-takeaway"
                aria-label="Takeaway price in pounds"
              />
            </div>

            {/* Delivery Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4" style={{ color: colors.text.secondary }} aria-hidden="true" />
                <Label
                  htmlFor="price-delivery"
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: colors.text.secondary }}
                >
                  Delivery Price
                  {activeField === 'price_delivery' && (
                    <span className="text-xs text-purple-400" aria-label="Currently focused">●</span>
                  )}
                </Label>
              </div>
              <PriceNumberInput
                value={pricing.price_delivery || 0}
                onChange={(value) => handlePriceChange('price_delivery', value)}
                placeholder="9.00"
                label=""
                tabIndex={3}
                onFocus={() => setActiveField('price_delivery')}
                onBlur={() => setActiveField(null)}
                error={errors?.price_delivery}
                id="price-delivery"
                aria-label="Delivery price in pounds"
              />
            </div>
          </div>
        </div>

        {/* 🆕 Price Consistency Warnings */}
        {priceWarnings.warnings.length > 0 && (
          <div 
            className="p-3 rounded-lg border space-y-2"
            style={{ 
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.3)'
            }}
            role="alert"
            aria-live="polite"
            aria-label="Price consistency warnings"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-amber-500">Price Consistency Warnings</span>
            </div>
            {priceWarnings.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 ml-6">
                <span className="text-xs text-amber-400" aria-hidden="true">•</span>
                <span className="text-xs text-amber-300">{warning}</span>
              </div>
            ))}
            <p className="text-xs text-amber-400/70 ml-6 mt-1">
              These are suggestions only and won't prevent saving.
            </p>
          </div>
        )}

        {/* Price Summary - Only show if any prices are set */}
        {(pricing.price_takeaway || pricing.price_dine_in || pricing.price_delivery) && (
          <div 
            className="p-4 rounded-lg" 
            style={{ backgroundColor: colors.background.tertiary }}
            role="region"
            aria-label="Price summary for all order types"
          >
            <h4 className="text-sm font-medium mb-2" style={{ color: colors.text.primary }}>Price Summary</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p style={{ color: colors.text.secondary }}>Dine In</p>
                <p className="font-semibold" style={{ color: colors.text.primary }} aria-label={`Dine in price: ${formatPrice(pricing.price_dine_in)} pounds`}>£{formatPrice(pricing.price_dine_in)}</p>
              </div>
              <div className="text-center">
                <p style={{ color: colors.text.secondary }}>Takeaway</p>
                <p className="font-semibold" style={{ color: colors.text.primary }} aria-label={`Takeaway price: ${formatPrice(pricing.price_takeaway)} pounds`}>£{formatPrice(pricing.price_takeaway)}</p>
              </div>
              <div className="text-center">
                <p style={{ color: colors.text.secondary }}>Delivery</p>
                <p className="font-semibold" style={{ color: colors.text.primary }} aria-label={`Delivery price: ${formatPrice(pricing.price_delivery)} pounds`}>£{formatPrice(pricing.price_delivery)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
