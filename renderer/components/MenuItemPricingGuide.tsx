/**
 * MenuItemPricingGuide.tsx
 * 
 * Visual guide component that helps users choose between single pricing
 * and variant-based pricing when no pricing is configured.
 * 
 * ✅ Phase 3: Visual Pricing Configuration Guide
 * 
 * Features:
 * - Clear visual distinction between pricing modes
 * - Actionable guidance for each option
 * - Contextual help text
 * - Integration with MenuItemForm
 * 
 * @author Phase 1 Task MYA-1423
 */

import React from 'react';
import { AlertCircle, DollarSign, Grid3x3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MenuItemPricingGuideProps {
  /** Callback when user chooses single pricing mode */
  onSelectSinglePrice: () => void;
  
  /** Callback when user chooses variant pricing mode */
  onSelectVariantPrice: () => void;
  
  /** Whether the form already has variants configured */
  hasExistingVariants?: boolean;
  
  /** Whether the form has any base price configured */
  hasBasePrice?: boolean;
  
  /** Optional custom className */
  className?: string;
}

/**
 * Visual guide for choosing pricing configuration strategy
 * 
 * Displayed when:
 * - Creating new item with no pricing set
 * - Editing item with incomplete pricing
 * 
 * @example
 * <MenuItemPricingGuide
 *   onSelectSinglePrice={() => setFocus('price_dine_in')}
 *   onSelectVariantPrice={() => handleAddVariant()}
 *   hasBasePrice={false}
 *   hasExistingVariants={false}
 * />
 */
export function MenuItemPricingGuide({
  onSelectSinglePrice,
  onSelectVariantPrice,
  hasExistingVariants = false,
  hasBasePrice = false,
  className = '',
}: MenuItemPricingGuideProps) {
  
  return (
    <Alert 
      variant="destructive" 
      className={`border-2 border-orange-500/50 bg-orange-950/20 ${className}`}
      data-section="pricing-guide"
    >
      <AlertCircle className="h-5 w-5 text-orange-500" />
      <AlertTitle className="text-orange-400 text-lg font-semibold mb-4">
        ⚠️ Pricing Configuration Required
      </AlertTitle>
      
      <AlertDescription className="space-y-6">
        <p className="text-gray-300 text-sm">
          Choose how to price this menu item. You must select ONE option:
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Option 1: Single Price */}
          <Card className="border-2 border-gray-600 bg-gray-800/50 hover:border-blue-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white text-base">
                  📋 Option 1: Single Price
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400 text-sm">
                Set one price for all order types
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-300 space-y-2">
                <p className="font-medium text-gray-200">Best for:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Simple items with fixed pricing</li>
                  <li>Items without size/protein variations</li>
                  <li>Drinks, sides, desserts</li>
                </ul>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-3">
                  💡 You'll set prices for:
                  <span className="block mt-1 text-gray-300">
                    Dine-In • Takeaway • Delivery
                  </span>
                </p>
                
                <Button
                  type="button"
                  onClick={onSelectSinglePrice}
                  variant="outline"
                  className="w-full bg-blue-900/30 border-blue-500/50 text-blue-300 hover:bg-blue-800/40 hover:text-blue-200"
                  disabled={hasExistingVariants}
                >
                  {hasExistingVariants 
                    ? '🔒 Remove variants first'
                    : '→ Set Single Price'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Option 2: Variant Pricing */}
          <Card className="border-2 border-gray-600 bg-gray-800/50 hover:border-purple-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white text-base">
                  🔀 Option 2: Multiple Variants
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400 text-sm">
                Different proteins, sizes, or options
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-300 space-y-2">
                <p className="font-medium text-gray-200">Best for:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Curries with Chicken/Lamb/Prawn</li>
                  <li>Items with size options (S/M/L)</li>
                  <li>Set meals with variations</li>
                </ul>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-gray-400 mb-3">
                  💡 Each variant gets its own:
                  <span className="block mt-1 text-gray-300">
                    Name • Prices • Kitchen Display
                  </span>
                </p>
                
                <Button
                  type="button"
                  onClick={onSelectVariantPrice}
                  variant="outline"
                  className="w-full bg-purple-900/30 border-purple-500/50 text-purple-300 hover:bg-purple-800/40 hover:text-purple-200"
                  disabled={hasBasePrice}
                >
                  {hasBasePrice 
                    ? '🔒 Clear base prices first'
                    : '+ Add First Variant'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Help Text */}
        <div className="mt-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-300">💭 Not sure which to choose?</span>
            <br />
            If your item comes in different proteins or sizes with different prices, use <strong className="text-purple-300">Variants</strong>.
            Otherwise, use <strong className="text-blue-300">Single Price</strong>.
          </p>
        </div>
        
        {/* Current State Indicator */}
        {(hasExistingVariants || hasBasePrice) && (
          <div className="mt-3 p-2 rounded bg-yellow-900/20 border border-yellow-600/30">
            <p className="text-xs text-yellow-400">
              ⚡ <strong>Current state:</strong> {hasExistingVariants 
                ? 'You have variants configured. Clear them to use single pricing.' 
                : 'You have base prices set. Clear them to add variants.'}
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default MenuItemPricingGuide;
