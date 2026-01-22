/**
 * Configuration Summary Component
 * 
 * Displays the locked configuration of a menu item in a read-only banner.
 * Shows when editing existing items to communicate that the structure is permanent.
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Info } from 'lucide-react';
import {
  MenuItemConfiguration,
  getItemTypeDisplayName,
  getPricingModeDisplayName,
  getItemTypeIcon,
} from 'utils/menuItemConfiguration';

interface Props {
  /** The menu item configuration to display */
  configuration: MenuItemConfiguration;
  
  /** Optional: Show variant count for variants items */
  variantCount?: number;
  
  /** Optional: Show in compact mode */
  compact?: boolean;
}

export function ConfigurationSummary({
  configuration,
  variantCount,
  compact = false,
}: Props) {
  const itemTypeLabel = getItemTypeDisplayName(configuration.itemType);
  const pricingModeLabel = getPricingModeDisplayName(configuration.pricingMode);
  const icon = getItemTypeIcon(configuration.itemType);

  // Compact mode - simple one-line display
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {icon} {itemTypeLabel} - {pricingModeLabel}
          {variantCount !== undefined && configuration.pricingMode === 'variants' && (
            <span className="ml-1">({variantCount} configured)</span>
          )}
        </span>
      </div>
    );
  }

  // Full mode - detailed alert banner
  return (
    <Alert className="border-purple-500/50 bg-purple-900/15">
      <Lock className="h-4 w-4 text-purple-500" />
      <AlertDescription>
        <div className="space-y-2">
          {/* Title */}
          <div className="font-semibold text-foreground">
            {icon} Item Configuration (Locked)
          </div>

          {/* Configuration Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type: </span>
              <span className="font-medium text-foreground">{itemTypeLabel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pricing: </span>
              <span className="font-medium text-foreground">
                {pricingModeLabel}
                {variantCount !== undefined && configuration.pricingMode === 'variants' && (
                  <span className="ml-1 text-purple-400">({variantCount} variants)</span>
                )}
              </span>
            </div>
          </div>

          {/* Info Message */}
          <div className="flex items-start gap-2 pt-2 border-t border-purple-500/30">
            <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Configuration is locked to prevent data loss. Create a new item to use different settings.
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
