/**
 * VariantDescriptionField Component
 * 
 * Manages variant-level description with 3-state inheritance model:
 * - inherited: Uses base item description (italic, dimmed)
 * - custom: Unique description for this variant (normal style)
 * - none: No description (empty state)
 * 
 * Extracted from MenuItemVariants.tsx to improve maintainability
 * Modernized with Tailwind classes and purple/silver/turquoise theme (Phase 3, Task MYA-1441)
 */

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VariantDescriptionFieldProps {
  /** Current description value */
  value: string;
  
  /** Current state: inherited | custom | none */
  state: 'inherited' | 'custom' | 'none';
  
  /** Base item description to inherit from */
  baseDescription: string;
  
  /** Callback when description text changes */
  onDescriptionChange: (value: string) => void;
  
  /** Callback when state changes */
  onStateChange: (state: 'inherited' | 'custom' | 'none') => void;
  
  /** Variant index for accessibility IDs */
  variantIndex: number;
  
  /** Optional error message */
  error?: string;
  
  /** Disable all interactions */
  disabled?: boolean;
}

export const VariantDescriptionField: React.FC<VariantDescriptionFieldProps> = ({
  value,
  state,
  baseDescription,
  onDescriptionChange,
  onStateChange,
  variantIndex,
  error,
  disabled = false,
}) => {
  const isInherited = state === 'inherited';
  const isNone = state === 'none';
  const displayValue = isInherited ? baseDescription : value;

  return (
    <div className="space-y-4">
      <Separator className="bg-gray-700" role="separator" />
      
      {/* Section Header */}
      <div className="flex items-center space-x-2" role="heading" aria-level={4} id={`variant-${variantIndex}-description-heading`}>
        <div 
          className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-900/20 border border-purple-500/30"
          aria-hidden="true"
        >
          <FileText className="h-3 w-3 text-purple-400" />
        </div>
        <Label className="text-gray-200 text-sm font-medium">
          Variant Description
        </Label>
        <Badge 
          variant="outline" 
          className="text-xs bg-purple-900/20 border-purple-500/30 text-purple-400"
          aria-label="Optional field"
        >
          Optional
        </Badge>
      </div>
      
      {/* Description Textarea */}
      <div 
        className={cn(
          'relative p-4 rounded-lg space-y-3 bg-gray-900/50 border',
          error ? 'border-red-500' : 'border-gray-700'
        )}
        role="group"
        aria-labelledby={`variant-${variantIndex}-description-heading`}
      >
        <div className="relative">
          <Textarea
            id={`variant-${variantIndex}-description`}
            value={displayValue}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={baseDescription ? 'Inheriting from base item...' : 'Add a custom description for this variant...'}
            rows={4}
            disabled={disabled || isInherited}
            className={cn(
              'resize-none border-gray-700 bg-gray-900/50 hover:border-purple-500/50',
              isInherited && 'italic opacity-70 text-gray-400',
              !isInherited && 'text-gray-200'
            )}
            aria-describedby={`variant-${variantIndex}-description-state ${error ? `variant-${variantIndex}-description-error` : ''}`}
          />
          
          {/* State transition action buttons */}
          <div 
            className="absolute right-2 top-2 flex space-x-1"
            role="toolbar"
            aria-label="Description state actions"
          >
            {state !== 'inherited' && baseDescription && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStateChange('inherited')}
                className="h-6 px-2 text-xs hover:bg-purple-500/10 text-purple-400"
                aria-label="Use base item description"
                title="Inherit base description"
                disabled={disabled}
              >
                <span aria-hidden="true">✨</span>
              </Button>
            )}
            {state !== 'custom' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStateChange('custom')}
                className="h-6 px-2 text-xs hover:bg-silver-500/10 text-silver-400"
                aria-label="Set custom description for variant"
                title="Custom description"
                disabled={disabled}
              >
                <span aria-hidden="true">📝</span>
              </Button>
            )}
            {state !== 'none' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onStateChange('none')}
                className="h-6 px-2 text-xs hover:bg-red-500/10 text-gray-500"
                aria-label="Remove description from variant"
                title="Remove description"
                disabled={disabled}
              >
                <span aria-hidden="true">×</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* State indicator helper text */}
        <div className="space-y-1">
          {isInherited && baseDescription && (
            <p className="text-xs text-purple-400" aria-hidden="true">
              ✨ Inheriting base item description
            </p>
          )}
          {isInherited && !baseDescription && (
            <p className="text-xs text-gray-500" aria-hidden="true">
              💡 No base description to inherit
            </p>
          )}
          {state === 'custom' && (
            <p className="text-xs text-silver-400" aria-hidden="true">
              📝 Custom description for this variant
            </p>
          )}
          {isNone && (
            <p className="text-xs text-gray-500" aria-hidden="true">
              — This variant has no description
            </p>
          )}
          
          {/* Error message */}
          {error && (
            <p 
              id={`variant-${variantIndex}-description-error`}
              className="text-xs text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        
        {/* Hidden status text for screen readers */}
        <p 
          id={`variant-${variantIndex}-description-state`}
          className="sr-only"
        >
          {isInherited && baseDescription && 'Description is inherited from base item. Use the customize button to write a different description.'}
          {isInherited && !baseDescription && 'No base item description to inherit.'}
          {state === 'custom' && 'Custom description for this variant.'}
          {isNone && 'No description set for this variant.'}
        </p>
      </div>
    </div>
  );
};
