/**
 * MenuItemConfigurationBanner - Display locked configuration for menu items
 * 
 * Shows the item type and pricing mode configuration at the top of MenuItemForm.
 * For existing items (locked), displays read-only configuration.
 * For new items being created, shows the chosen configuration from the wizard.
 * 
 * @module components/MenuItemConfigurationBanner
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Lock } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';
import {
  MenuItemConfiguration,
  getItemTypeDisplayName,
  getPricingModeDisplayName,
  getItemTypeIcon
} from '../utils/menuItemConfiguration';

interface ConfigurationBannerProps {
  configuration: MenuItemConfiguration;
  variantCount?: number;
}

/**
 * Display configuration banner for menu item form
 * 
 * @param configuration - The menu item configuration
 * @param variantCount - Number of configured variants (for display)
 */
export const MenuItemConfigurationBanner: React.FC<ConfigurationBannerProps> = ({
  configuration,
  variantCount = 0
}) => {
  const itemTypeIcon = getItemTypeIcon(configuration.itemType);
  const itemTypeName = getItemTypeDisplayName(configuration.itemType);
  const pricingModeName = getPricingModeDisplayName(configuration.pricingMode);
  
  // Different styling for locked vs new items
  const isLocked = configuration.isLocked;
  
  return (
    <Alert 
      className="mb-6"
      style={{
        backgroundColor: isLocked ? 'rgba(59, 130, 246, 0.1)' : 'rgba(147, 51, 234, 0.1)',
        borderColor: isLocked ? 'rgba(59, 130, 246, 0.3)' : 'rgba(147, 51, 234, 0.3)'
      }}
    >
      <div className="flex items-start gap-3">
        {isLocked ? (
          <Lock className="h-5 w-5 mt-0.5" style={{ color: '#3B82F6' }} />
        ) : (
          <Info className="h-5 w-5 mt-0.5" style={{ color: '#9333EA' }} />
        )}
        
        <div className="flex-1">
          <AlertDescription>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{itemTypeIcon}</span>
              <strong style={{ color: globalColors.text.primary }}>
                {isLocked ? 'Item Configuration (Locked)' : 'Configuration Summary'}
              </strong>
            </div>
            
            <div className="space-y-1 text-sm" style={{ color: globalColors.text.secondary }}>
              <div>
                <strong>Type:</strong> {itemTypeName}
              </div>
              <div>
                <strong>Pricing:</strong> {pricingModeName}
                {configuration.pricingMode === 'variants' && variantCount > 0 && (
                  <span className="ml-1">({variantCount} variant{variantCount !== 1 ? 's' : ''} configured)</span>
                )}
              </div>
            </div>
            
            {isLocked && (
              <p className="text-xs mt-2" style={{ color: globalColors.text.secondary }}>
                ℹ️ Configuration is locked to prevent data loss. Create a new item to use different settings.
              </p>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default MenuItemConfigurationBanner;
