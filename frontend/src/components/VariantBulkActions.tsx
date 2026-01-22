/**
 * VariantBulkActions Component
 * 
 * Toolbar with quick actions for bulk variant price operations.
 * Integrates with variantBulkOperations utility.
 * 
 * Features:
 * - Copy prices between columns
 * - Add delivery markup
 * - Percentage increases/decreases
 * - Round prices to nearest increment
 * - Visual feedback for actions
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wand2,
  Copy,
  TrendingUp,
  TrendingDown,
  Percent,
  Hash,
  DollarSign,
} from 'lucide-react';
import { BulkAction } from 'utils/variantBulkOperations';

interface VariantBulkActionsProps {
  onBulkUpdate: (action: BulkAction) => void;
  disabled?: boolean;
  variantCount: number;
}

export const VariantBulkActions: React.FC<VariantBulkActionsProps> = ({
  onBulkUpdate,
  disabled = false,
  variantCount,
}) => {
  const [customDialog, setCustomDialog] = useState<{
    open: boolean;
    type: 'percentage' | 'markup' | 'round';
    title: string;
  }>({ open: false, type: 'percentage', title: '' });

  const [customValue, setCustomValue] = useState<string>('');

  const handleQuickAction = (action: BulkAction) => {
    onBulkUpdate(action);
  };

  const openCustomDialog = (type: 'percentage' | 'markup' | 'round', title: string) => {
    setCustomDialog({ open: true, type, title });
    setCustomValue('');
  };

  const handleCustomAction = () => {
    const value = parseFloat(customValue);
    
    if (isNaN(value)) {
      return;
    }

    if (customDialog.type === 'percentage') {
      handleQuickAction({ type: 'percentage-increase', percentage: value });
    } else if (customDialog.type === 'markup') {
      handleQuickAction({ type: 'add-delivery-markup', amount: value });
    }

    setCustomDialog({ ...customDialog, open: false });
  };

  const hasVariants = variantCount > 0;

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || !hasVariants}
              className="hover:bg-purple-500/10 hover:border-purple-500"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Quick Actions
              {hasVariants && (
                <span className="ml-2 text-xs text-gray-400">({variantCount})</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-gray-400">
              Copy Prices
            </DropdownMenuLabel>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'copy-dine-in-to-all' })}
            >
              <Copy className="mr-2 h-4 w-4 text-blue-400" />
              Copy Dine-In → All Columns
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'copy-takeaway-to-all' })}
            >
              <Copy className="mr-2 h-4 w-4 text-blue-400" />
              Copy Takeaway → All Columns
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'copy-delivery-to-all' })}
            >
              <Copy className="mr-2 h-4 w-4 text-blue-400" />
              Copy Delivery → All Columns
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs font-normal text-gray-400">
              Delivery Markup
            </DropdownMenuLabel>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'add-delivery-markup', amount: 1.00 })}
            >
              <TrendingUp className="mr-2 h-4 w-4 text-green-400" />
              +£1.00 Delivery Markup
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'add-delivery-markup', amount: 1.50 })}
            >
              <TrendingUp className="mr-2 h-4 w-4 text-green-400" />
              +£1.50 Delivery Markup
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => openCustomDialog('markup', 'Custom Delivery Markup')}
            >
              <DollarSign className="mr-2 h-4 w-4 text-green-400" />
              Custom Markup...
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs font-normal text-gray-400">
              Price Adjustments
            </DropdownMenuLabel>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'percentage-increase', percentage: 5 })}
            >
              <Percent className="mr-2 h-4 w-4 text-orange-400" />
              +5% All Prices
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'percentage-increase', percentage: 10 })}
            >
              <Percent className="mr-2 h-4 w-4 text-orange-400" />
              +10% All Prices
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'percentage-decrease', percentage: 10 })}
            >
              <TrendingDown className="mr-2 h-4 w-4 text-red-400" />
              -10% All Prices
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => openCustomDialog('percentage', 'Custom Percentage Adjustment')}
            >
              <Percent className="mr-2 h-4 w-4 text-orange-400" />
              Custom %...
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs font-normal text-gray-400">
              Rounding
            </DropdownMenuLabel>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'round-prices', to: 0.05 })}
            >
              <Hash className="mr-2 h-4 w-4 text-purple-400" />
              Round to .95 / .00 / .05
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'round-prices', to: 0.10 })}
            >
              <Hash className="mr-2 h-4 w-4 text-purple-400" />
              Round to .90 / .00 / .10
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'round-prices', to: 0.50 })}
            >
              <Hash className="mr-2 h-4 w-4 text-purple-400" />
              Round to .50 / .00
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => handleQuickAction({ type: 'round-prices', to: 1.00 })}
            >
              <Hash className="mr-2 h-4 w-4 text-purple-400" />
              Round to Whole £
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!hasVariants && (
          <p className="text-xs text-gray-400">
            Add variants to enable bulk actions
          </p>
        )}
      </div>

      {/* Custom Action Dialog */}
      <Dialog open={customDialog.open} onOpenChange={(open) => setCustomDialog({ ...customDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{customDialog.title}</DialogTitle>
            <DialogDescription>
              {customDialog.type === 'percentage'
                ? 'Enter a percentage to adjust all prices (positive to increase, negative to decrease)'
                : 'Enter a fixed amount to add to all delivery prices'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="custom-value">
              {customDialog.type === 'percentage' ? 'Percentage (%)' : 'Amount (£)'}
            </Label>
            <Input
              id="custom-value"
              type="number"
              step={customDialog.type === 'percentage' ? '1' : '0.01'}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={customDialog.type === 'percentage' ? 'e.g., 10 or -5' : 'e.g., 1.50'}
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomAction();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomDialog({ ...customDialog, open: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleCustomAction}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

VariantBulkActions.displayName = 'VariantBulkActions';
