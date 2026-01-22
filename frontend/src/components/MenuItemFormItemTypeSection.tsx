import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, FileText, Info, Cog } from 'lucide-react';
import { globalColors } from '../utils/QSAIDesign';

/**
 * Props for ItemTypeSection component
 */
interface ItemTypeSectionProps {
  /** Whether the item has variants */
  hasVariants: boolean;
  /** Whether the form is in edit mode */
  isEditing: boolean;
  /** Container style object */
  containerStyle: React.CSSProperties;
}

/**
 * ItemTypeSection Component
 * 
 * Displays the locked item type selection (Single Item or Has Variants).
 * Shows contextual help messages based on edit mode and variant status.
 * 
 * @component
 */
export const MenuItemFormItemTypeSection = React.memo<ItemTypeSectionProps>(({ 
  hasVariants, 
  isEditing, 
  containerStyle 
}) => {
  return (
    <div style={containerStyle} className="mb-8 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: globalColors.purple.primary }}
        >
          <Cog className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
          Item Type Selection
        </h3>
      </div>

      <div className="space-y-4">
        <div 
          className="flex items-center justify-between p-4 rounded-lg" 
          style={{ 
            backgroundColor: 'rgba(91, 33, 182, 0.1)',
            border: '1px solid rgba(91, 33, 182, 0.3)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: globalColors.purple.primary }}
            >
              {hasVariants ? (
                <Package className="w-5 h-5 text-white" />
              ) : (
                <FileText className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: globalColors.text.secondary }}>
                Item Structure
              </p>
              <p className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>
                {hasVariants ? 'Has Variants' : 'Single Item'}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs px-3 py-1"
            style={{ 
              borderColor: globalColors.purple.primary,
              color: globalColors.purple.light,
              backgroundColor: 'rgba(91, 33, 182, 0.15)'
            }}
          >
            🔒 Locked
          </Badge>
        </div>
        
        <Alert 
          style={{ 
            backgroundColor: 'rgba(91, 33, 182, 0.05)',
            border: '1px solid rgba(91, 33, 182, 0.15)'
          }}
        >
          <Info className="h-4 w-4" style={{ color: globalColors.purple.light }} />
          <AlertDescription style={{ color: globalColors.text.secondary }}>
            {isEditing
              ? (hasVariants 
                  ? 'This item has variants. The structure is locked to prevent data loss. Manage variants in the section below.'
                  : 'This is a single item. The structure is locked. To add variants, create a new menu item.')
              : (hasVariants
                  ? 'You chose "Item with Variants". Add your variants below.'
                  : 'You chose "Single Item". Set your pricing below.')}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
});

MenuItemFormItemTypeSection.displayName = 'MenuItemFormItemTypeSection';
