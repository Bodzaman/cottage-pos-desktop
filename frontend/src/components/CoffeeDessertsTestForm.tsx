import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, Package, CreditCard } from 'lucide-react';

/**
 * Test component to verify Coffee & Desserts form behavior
 * This component mimics the core logic of MenuItemForm to test variants section hiding
 */
export function CoffeeDessertsTestForm() {
  const [itemType, setItemType] = useState<'food' | 'drinks_wine' | 'coffee_desserts'>('coffee_desserts');
  const [hasVariants, setHasVariants] = useState(false);

  // This mirrors the exact condition from MenuItemForm.tsx line 1278
  const shouldShowVariants = hasVariants && itemType !== 'drinks_wine' && itemType !== 'coffee_desserts';
  const shouldShowPricing = !hasVariants;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coffee className="w-5 h-5" />
            <span>Coffee & Desserts Form Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex items-center space-x-4">
            <div className="space-x-2">
              <label className="text-sm font-medium">Item Type:</label>
              <select 
                value={itemType} 
                onChange={(e) => setItemType(e.target.value as any)}
                className="px-3 py-1 border rounded"
              >
                <option value="food">Food</option>
                <option value="drinks_wine">Drinks & Wine</option>
                <option value="coffee_desserts">Coffee & Desserts</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="hasVariants" 
                checked={hasVariants} 
                onChange={(e) => setHasVariants(e.target.checked)}
              />
              <label htmlFor="hasVariants" className="text-sm font-medium">Has Variants</label>
            </div>
          </div>

          {/* Status Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">
                {itemType === 'coffee_desserts' ? '☕ Coffee & Desserts' : 
                 itemType === 'drinks_wine' ? '🍷 Drinks & Wine' : '🍽️ Food'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Current item type: <code>{itemType}</code>
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant={hasVariants ? "default" : "secondary"}>
                {hasVariants ? 'Variants Enabled' : 'Single Item'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Has variants: <code>{hasVariants.toString()}</code>
              </p>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-medium">Form Sections Visibility Test:</h3>
            
            {/* Variants Section Test */}
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Variants Management Section</span>
              </div>
              <div className="flex items-center space-x-2">
                {shouldShowVariants ? (
                  <Badge variant="default" className="bg-green-500">✅ Visible</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-500 text-white">❌ Hidden</Badge>
                )}
                <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {shouldShowVariants.toString()}
                </code>
              </div>
            </div>

            {/* Pricing Section Test */}
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">Pricing Configuration Section</span>
              </div>
              <div className="flex items-center space-x-2">
                {shouldShowPricing ? (
                  <Badge variant="default" className="bg-green-500">✅ Visible</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-500 text-white">❌ Hidden</Badge>
                )}
                <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {shouldShowPricing.toString()}
                </code>
              </div>
            </div>
          </div>

          {/* Expected Behavior */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">✅ Expected Behavior for Coffee & Desserts:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Variants section should be <strong>hidden</strong> (no matter if hasVariants is true/false)</li>
              <li>• Pricing section should show for <strong>single items</strong> (when hasVariants is false)</li>
              <li>• Form flow: Basic Information → Media → Single Item Pricing → Additional Settings</li>
            </ul>
          </div>

          {/* Logic Explanation */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Logic Explanation:</h4>
            <div className="text-sm font-mono space-y-1">
              <div>shouldShowVariants = hasVariants && itemType !== 'drinks_wine' && itemType !== 'coffee_desserts'</div>
              <div className="pl-4 text-muted-foreground">
                = {hasVariants.toString()} && "{itemType}" !== "drinks_wine" && "{itemType}" !== "coffee_desserts"
              </div>
              <div className="pl-4 text-muted-foreground">
                = {hasVariants.toString()} && {(itemType !== 'drinks_wine').toString()} && {(itemType !== 'coffee_desserts').toString()}
              </div>
              <div className="pl-4 font-bold">
                = {shouldShowVariants.toString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoffeeDessertsTestForm;