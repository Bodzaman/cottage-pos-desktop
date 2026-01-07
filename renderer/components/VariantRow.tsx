/**
 * VariantRow.tsx
 * 
 * Individual variant card/row component extracted from MenuItemVariants.
 * Displays all editable fields for a single menu item variant including:
 * - Protein type selection
 * - Name (auto-generated or manual)
 * - Description field (with inheritance)
 * - Image field (with inheritance)
 * - Food-specific details (spice level, dietary tags)
 * - Pricing configuration
 * - Featured/Default toggles
 * 
 * Design: Modern accordion-style with expand/collapse animation
 * Styling: VariantTableEditor-inspired (purple/silver/turquoise theme)
 * 
 * @extracted-from MenuItemVariants.tsx (lines ~600-1150)
 * @reduction ~500 lines extracted
 * @modernized Phase 2 (Task MYA-1441)
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, ChevronDown, ChevronRight, PoundSterling, Star, Trash2, FileText, ImageIcon, RotateCw, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { VariantDescriptionField } from 'components/VariantDescriptionField';
import { VariantImageField } from 'components/VariantImageField';
import { MenuItemPricing } from 'components/MenuItemPricing';
import { AllergenSelector } from 'components/AllergenSelector';
import { cn } from '@/lib/utils';
import { 
  generateVariantName, 
  getNextPattern, 
  type VariantNamePattern 
} from '../utils/variantNaming';
import { ImageUploadResult } from 'components/ImageUploader';

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Menu variant data structure (matches MenuItemVariants.tsx) */
export interface MenuVariant {
  protein_type_id?: string;
  name: string;
  name_pattern?: VariantNamePattern; // 🆕 Pattern for name generation
  description?: string;
  description_state?: 'inherited' | 'custom' | 'none';
  price: number;
  price_dine_in?: number;
  price_delivery?: number;
  is_default: boolean;
  image_url?: string;
  image_asset_id?: string;
  image_state?: 'inherited' | 'custom' | 'none';
  display_order?: number;
  spice_level?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_halal?: boolean;
  is_dairy_free?: boolean;
  is_nut_free?: boolean;
  featured?: boolean;
  // 🆕 Food-specific details (variant-level)
  allergens?: string[];
  allergen_notes?: string;
}

/** Protein type option */
export interface ProteinType {
  id: string;
  name: string;
}

/** Pricing data structure */
export interface PricingData {
  price: number;
  price_dine_in: number | undefined;
  price_takeaway: number | undefined;
  price_delivery: number | undefined;
}

/** Props for VariantRow component */
export interface VariantRowProps {
  /** Variant data */
  variant: MenuVariant;

  /** Variant index (0-based) */
  index: number;

  /** Whether duplicate name detected */
  isDuplicate: boolean;

  /** Available protein types */
  proteinTypes: ProteinType[];

  /** Parent item name for auto-generation */
  baseItemName: string;

  /** Parent item description for inheritance */
  baseItemDescription: string;

  /** Parent item image for inheritance */
  baseItemImage: string;

  /** Whether auto-name generation is enabled */
  autoGenerateNames: boolean;

  /** Whether this is the only variant (can't be deleted) */
  isOnlyVariant: boolean;

  /** Validation errors */
  errors?: any;

  /** Callback when a field changes */
  onUpdate: (field: keyof MenuVariant, value: any) => void;

  /** Callback when description state changes */
  onDescriptionStateChange: (state: 'inherited' | 'custom' | 'none') => void;

  /** Callback when image state changes */
  onImageStateChange: (state: 'inherited' | 'custom' | 'none') => void;

  /** Callback to open media selector */
  onOpenMediaSelector: () => void;

  /** Callback for successful image upload with optimized data */
  onUploadSuccess: (result: ImageUploadResult) => void;

  /** Whether an upload is in progress */
  isUploading?: boolean;

  /** Callback when variant should be removed */
  onRemove: () => void;

  /** Callback when pricing changes (all fields atomically) */
  onPricingChange: (pricingData: PricingData) => void;
}

// ============================================================================
// Component
// ============================================================================

export const VariantRow: React.FC<VariantRowProps> = ({
  variant,
  index,
  isDuplicate,
  proteinTypes,
  autoGenerateNames,
  baseItemName,
  baseItemDescription,
  baseItemImage,
  baseItemImageAssetId,
  isOnlyVariant,
  errors,
  onUpdate,
  onDescriptionStateChange,
  onImageStateChange,
  onOpenMediaSelector,
  onRemove,
  onPricingChange,
  onUploadSuccess,
  isUploading,
}) => {
  // 🆕 Accordion state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 🆕 Animation state for pattern cycling
  const [isRotating, setIsRotating] = useState(false);

  // 🆕 Track if this is the initial mount to prevent overwriting saved names
  const isMountRef = React.useRef(true);

  // Current pattern from variant (default to 'suffix')
  const currentPattern = variant.name_pattern || 'suffix';

  // Ref to prevent infinite loops - track if we've done initial validation
  const hasValidatedRef = React.useRef(false);

  // 🆕 Handle pattern cycling
  const handleCyclePattern = () => {
    // In CUSTOM mode, unlock and reset to SUFFIX
    if (currentPattern === 'custom') {
      // Reset to SUFFIX pattern
      onUpdate('name_pattern', 'suffix');
      
      // Show unlock toast
      toast.success('Name pattern unlocked - reset to SUFFIX', {
        duration: 2000,
      });
      
      // Trigger rotation animation
      setIsRotating(true);
      setTimeout(() => setIsRotating(false), 300);
      
      return;
    }

    // Normal cycling behavior
    const nextPattern = getNextPattern(currentPattern);
    
    // Trigger rotation animation
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 300);

    // Update pattern
    onUpdate('name_pattern', nextPattern);

    // Show toast notification
    const patternNames = {
      suffix: 'SUFFIX',
      prefix: 'PREFIX',
      infix: 'INFIX',
    };
    toast.success(`Name pattern changed to ${patternNames[nextPattern as keyof typeof patternNames]}`, {
      duration: 2000,
    });
  };

  // 🆕 Handle manual name edits (auto-switch to CUSTOM)
  const handleNameEdit = (newName: string) => {
    // Update the name
    onUpdate('name', newName);
    
    // If not already in CUSTOM mode, switch to it
    if (currentPattern !== 'custom') {
      onUpdate('name_pattern', 'custom');
      toast.info('Pattern switched to CUSTOM (manual edit)', {
        duration: 2000,
      });
    }
  };

  // Compute generated name using pattern system
  const generatedName = React.useMemo(() => {
    if (!autoGenerateNames || !baseItemName || !variant.protein_type_id) {
      return '';
    }
    
    const protein = proteinTypes.find((p) => p.id === variant.protein_type_id);
    if (!protein) return '';

    // Use the new pattern-based generation
    return generateVariantName({
      baseName: baseItemName,
      proteinName: protein.name,
      pattern: currentPattern,
      customName: currentPattern === 'custom' ? variant.name : undefined,
    });
  }, [autoGenerateNames, baseItemName, variant.protein_type_id, proteinTypes, currentPattern, variant.name]);

  // 🆕 PROPER FIX: Smart pattern validation and auto-correction
  React.useEffect(() => {
    // Skip if auto-generate is disabled
    if (!autoGenerateNames) return;
    
    // Skip if pattern is CUSTOM (user-controlled)
    if (currentPattern === 'custom') return;
    
    // Skip if no generated name available
    if (!generatedName) return;

    // On initial mount: validate and auto-correct if mismatch detected
    if (!hasValidatedRef.current) {
      hasValidatedRef.current = true;
      
      // Check if current name matches expected pattern
      const nameMatchesPattern = variant.name === generatedName;
      
      if (!nameMatchesPattern) {
        console.log(`[VariantRow] Pattern mismatch detected - Auto-correcting:`);
        console.log(`  Current: "${variant.name}"`);
        console.log(`  Expected (${currentPattern}): "${generatedName}"`);
        
        // Auto-correct the name to match the pattern
        onUpdate('name', generatedName);
      }
      return;
    }

    // After initial validation: only sync when pattern or protein actively changes
    // (This prevents overwrites but allows pattern cycling to work)
    if (variant.name !== generatedName) {
      onUpdate('name', generatedName);
    }
  }, [generatedName, currentPattern, autoGenerateNames, variant.name, onUpdate]);

  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-all duration-200',
        isDuplicate
          ? 'border-red-500/50 bg-red-900/10'
          : isExpanded 
            ? 'border-purple-500/50 bg-gray-900/40 shadow-lg shadow-purple-500/10'
            : 'border-gray-700 bg-gray-900/30 hover:border-purple-500/30 hover:shadow-md hover:shadow-purple-500/5'
      )}
      role="listitem"
      aria-labelledby={`variant-${index}-heading`}
      aria-describedby={isDuplicate ? `variant-${index}-duplicate-error` : undefined}
    >
      {/* =========================================== */}
      {/* COMPACT VIEW (Always Visible) */}
      {/* =========================================== */}
      <div className="p-4 space-y-4">
        {/* Full Accordion Header Bar - PRIMARY CLICKABLE AREA */}
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-start gap-3 text-left hover:bg-purple-500/10 -m-2 p-2 rounded-lg transition-all duration-200 cursor-pointer group"
            aria-expanded={isExpanded}
            aria-controls={`variant-${index}-details`}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} advanced settings for variant ${index + 1}: description, image, dietary tags, and full pricing`}
          >
            {/* Chevron Icon */}
            <div className="mt-0.5 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-purple-400 transition-transform group-hover:scale-110" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400 transition-all group-hover:text-purple-400 group-hover:translate-x-0.5" aria-hidden="true" />
              )}
            </div>

            {/* Header Content */}
            <div className="flex-1 min-w-0">
              {/* Title Row */}
              <div className="flex items-center gap-2 flex-wrap" id={`variant-${index}-heading`}>
                <span className="text-sm font-semibold text-gray-200 group-hover:text-purple-300 transition-colors">
                  Variant {index + 1} - Advanced Settings
                </span>
                
                {variant.is_default && (
                  <Badge
                    variant="outline"
                    className="bg-purple-900/20 border-purple-500/30 text-purple-400 text-xs"
                    aria-label="Default variant"
                  >
                    <Star className="h-3 w-3 mr-1" aria-hidden="true" />
                    Default
                  </Badge>
                )}
                
                {isDuplicate && (
                  <Badge
                    variant="outline"
                    className="bg-red-900/20 border-red-500/50 text-red-400 text-xs"
                    role="alert"
                    aria-label="Warning: Duplicate name"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
                    Duplicate
                  </Badge>
                )}
              </div>
              
              {/* Helper Text - What's Inside */}
              <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                Description • Image • Dietary Tags • Full Pricing
              </p>
            </div>
          </button>

          {/* Delete Button (stays visible) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                  disabled={isOnlyVariant}
                  className="border-gray-700 hover:border-red-500 hover:bg-red-500/10 flex-shrink-0"
                  aria-label={`Remove variant ${index + 1}${variant.name ? `: ${variant.name}` : ''}${
                    isOnlyVariant ? ' (disabled - at least one variant required)' : ''
                  }`}
                >
                  <Trash2 className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-gray-800 border-red-500/30">
                <p className="text-sm text-gray-200">
                  {isOnlyVariant ? 'At least one variant required' : 'Remove variant'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Protein Type & Name Fields (2-column grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Protein Type - LEFT COLUMN */}
          <div className="space-y-2">
            <Label htmlFor={`variant-${index}-protein`} className="text-gray-400 text-sm">
              Protein Type
            </Label>
            <Select
              value={variant.protein_type_id || ''}
              onValueChange={(value) => onUpdate('protein_type_id', value)}
              aria-describedby={autoGenerateNames && baseItemName ? `variant-${index}-name-generation-hint` : undefined}
            >
              <SelectTrigger
                id={`variant-${index}-protein`}
                className="border-gray-700 bg-gray-900/50 hover:border-purple-500/50"
                aria-label="Select protein type for this variant"
              >
                <SelectValue placeholder="Select protein type" />
              </SelectTrigger>
              <SelectContent>
                {proteinTypes.map((protein) => (
                  <SelectItem key={protein.id} value={protein.id}>
                    {protein.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {autoGenerateNames && baseItemName && (
              <p
                id={`variant-${index}-name-generation-hint`}
                className="text-xs text-gray-500"
                role="status"
              >
                Selecting a protein type will auto-generate the variant name
              </p>
            )}
          </div>

          {/* Generated/Manual Name - RIGHT COLUMN */}
          {!autoGenerateNames ? (
            // Manual name input
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`variant-${index}-name`} className="text-gray-400 text-sm">
                  Variant Name <span aria-label="required">*</span>
                </Label>
                {isDuplicate && <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />}
              </div>
              <Input
                id={`variant-${index}-name`}
                name={`variant-${index}-name`}
                value={variant.name}
                onChange={(e) => handleNameEdit(e.target.value)}
                placeholder="e.g., Chicken Tikka Masala"
                className={cn(
                  'bg-gray-900/50',
                  isDuplicate
                    ? 'border-red-500 bg-red-900/10'
                    : 'border-gray-700 hover:border-purple-500/50'
                )}
                required
                aria-required="true"
                aria-invalid={isDuplicate}
                aria-describedby={isDuplicate ? `variant-${index}-duplicate-error` : `variant-${index}-name-hint`}
              />
              {isDuplicate ? (
                <p
                  id={`variant-${index}-duplicate-error`}
                  className="text-xs flex items-center gap-1 text-red-400"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  This name is already used by another variant
                </p>
              ) : (
                <p id={`variant-${index}-name-hint`} className="text-xs text-gray-500">
                  Enter a unique name for this variant
                </p>
              )}
            </div>
          ) : baseItemName && variant.protein_type_id ? (
            // Auto-generated name display with pattern cycling
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label id={`variant-${index}-generated-name-label`} className="text-gray-400 text-sm">
                  Generated Name
                </Label>
                {isDuplicate && <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />}
              </div>
              
              {/* Name Display + Cycle Button */}
              <div className="relative">
                <Input
                  id={`variant-${index}-generated-name`}
                  name={`variant-${index}-generated-name`}
                  value={variant.name}
                  onChange={(e) => handleNameEdit(e.target.value)}
                  placeholder={generatedName || "Enter variant name"}
                  className={cn(
                    'pr-12 font-medium transition-all duration-300',
                    isDuplicate
                      ? 'border-red-500 bg-red-900/10 text-red-400'
                      : currentPattern === 'custom'
                        ? 'border-yellow-500/50 bg-yellow-900/10 text-yellow-400'
                        : 'border-purple-500/50 bg-purple-900/10 text-purple-400',
                    // Purple glow animation on pattern change
                    isRotating && !isDuplicate && currentPattern !== 'custom' && 'shadow-lg shadow-purple-500/30'
                  )}
                  required
                  aria-required="true"
                  aria-invalid={isDuplicate}
                  aria-describedby={isDuplicate ? `variant-${index}-duplicate-error` : `variant-${index}-generated-name-hint`}
                  aria-labelledby={`variant-${index}-generated-name-label`}
                />
                
                {/* Cycle Button (Inline, Right Side) */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCyclePattern}
                        className={cn(
                          'absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0',
                          'hover:bg-purple-500/20 transition-all duration-300',
                          isRotating && 'animate-spin'
                        )}
                        aria-label={currentPattern === 'custom' ? 'Unlock name pattern' : 'Cycle name pattern'}
                      >
                        {currentPattern === 'custom' ? (
                          <Unlock className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                        ) : (
                          <RotateCw className="h-4 w-4 text-purple-400" aria-hidden="true" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-800 border-purple-500/30">
                      <p className="text-sm text-gray-200">
                        {currentPattern === 'custom' 
                          ? 'Unlock pattern (return to auto-generation)' 
                          : 'Cycle pattern: Suffix → Prefix → Infix'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Pattern Indicator Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    currentPattern === 'custom'
                      ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
                      : 'bg-purple-900/20 border-purple-500/30 text-purple-400'
                  )}
                >
                  {currentPattern === 'custom' ? '🔒 Custom (Manual)' : `📌 Pattern: ${currentPattern.charAt(0).toUpperCase() + currentPattern.slice(1)}`}
                </Badge>
              </div>
              
              {isDuplicate && (
                <p
                  id={`variant-${index}-duplicate-error`}
                  className="text-xs flex items-center gap-1 text-red-400"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  This generated name conflicts with another variant
                </p>
              )}
            </div>
          ) : (
            // Waiting for base item name
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Generated Name</Label>
              <div
                className="px-3 py-2 rounded-md border border-gray-700 bg-gray-900/50 text-sm text-gray-500"
                role="status"
              >
                Enter item name in Basic Information section
              </div>
              <p className="text-xs text-gray-500" aria-hidden="true">
                💡 Auto-generation requires item name from above
              </p>
            </div>
          )}
        </div>

        {/* Quick Pricing Summary (Compact View) */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <PoundSterling className="h-3 w-3 text-gray-500" />
            <span className="text-gray-400">Dine-In:</span>
            <span className="font-medium text-gray-200">£{(variant.price_dine_in || variant.price || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Takeaway:</span>
            <span className="font-medium text-gray-200">£{(variant.price || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Delivery:</span>
            <span className="font-medium text-gray-200">£{(variant.price_delivery || variant.price || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Dietary Badges (Compact View) */}
        <div className="flex flex-wrap gap-2">
          {variant.is_vegetarian && (
            <Badge variant="outline" className="bg-green-900/20 border-green-500/30 text-green-400 text-xs">
              🌱 Vegetarian
            </Badge>
          )}
          {variant.is_vegan && (
            <Badge variant="outline" className="bg-green-900/20 border-green-500/30 text-green-400 text-xs">
              🌿 Vegan
            </Badge>
          )}
          {variant.is_gluten_free && (
            <Badge variant="outline" className="bg-yellow-900/20 border-yellow-500/30 text-yellow-400 text-xs">
              🌾 Gluten-Free
            </Badge>
          )}
          {variant.is_halal && (
            <Badge variant="outline" className="bg-blue-900/20 border-blue-500/30 text-blue-400 text-xs">
              ☪️ Halal
            </Badge>
          )}
          {variant.is_dairy_free && (
            <Badge variant="outline" className="bg-purple-900/20 border-purple-500/30 text-purple-400 text-xs">
              🥛 Dairy-Free
            </Badge>
          )}
          {variant.is_nut_free && (
            <Badge variant="outline" className="bg-orange-900/20 border-orange-500/30 text-orange-400 text-xs">
              🥜 Nut-Free
            </Badge>
          )}
          {variant.featured && (
            <Badge variant="outline" className="bg-silver-900/20 border-silver-500/30 text-silver-400 text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Collapsed State Preview (shows when NOT expanded) */}
        {!isExpanded && (
          <div className="space-y-2">
            {/* Info indicators row */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {/* Description indicator */}
              {variant.description && variant.description_state !== 'none' && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  <span>Custom Description</span>
                </div>
              )}
              {(!variant.description || variant.description_state === 'none') && baseItemDescription && variant.description_state === 'inherited' && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  <span>Inherited Description</span>
                </div>
              )}

              {/* Image indicator */}
              {variant.image_url && variant.image_state !== 'none' && (
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" aria-hidden="true" />
                  <span>Custom Image</span>
                </div>
              )}
              {(!variant.image_url || variant.image_state === 'none') && baseItemImage && variant.image_state === 'inherited' && (
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" aria-hidden="true" />
                  <span>Inherited Image</span>
                </div>
              )}

              {/* Spice level indicator */}
              {variant.spice_level !== undefined && variant.spice_level !== null && (
                <div className="flex items-center gap-1">
                  <span aria-hidden="true">🌶️</span>
                  <span>Spice Level: {variant.spice_level}/6</span>
                </div>
              )}
            </div>

            {/* SECONDARY CLICKABLE CTA - Bottom expand button */}
            <div className="flex items-center justify-end pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-all duration-200 hover:gap-2 group"
                aria-label="Expand advanced settings"
              >
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
                <span className="hover:underline underline-offset-2">Expand Advanced Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================== */}
      {/* EXPANDED VIEW (Collapsible) */}
      {/* =========================================== */}
      {isExpanded && (
        <div
          id={`variant-${index}-details`}
          className="border-t border-gray-700 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          {/* Description Field (uses extracted component) */}
          <VariantDescriptionField
            value={variant.description || ''}
            state={variant.description_state || 'inherited'}
            baseDescription={baseItemDescription}
            onDescriptionChange={(value) => onUpdate('description', value)}
            onStateChange={onDescriptionStateChange}
            variantIndex={index}
            disabled={false}
          />

          {/* Image Field (uses extracted component) */}
          <VariantImageField
            imageUrl={variant.image_url}
            imageAssetId={variant.image_asset_id}
            state={variant.image_state || 'inherited'}
            baseImage={baseItemImage}
            baseImageAssetId={baseItemImageAssetId}
            onStateChange={onImageStateChange}
            onOpenMediaSelector={onOpenMediaSelector}
            variantIndex={index}
            disabled={false}
            onUploadSuccess={onUploadSuccess}
            isUploading={isUploading}
          />

          {/* Food-Specific Details Section */}
          <div className="space-y-4">
            <Separator className="bg-gray-700" role="separator" />

            <div className="flex items-center space-x-2" role="heading" aria-level={4} id={`variant-${index}-food-details-heading`}>
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center bg-silver-900/20 border border-silver-500/30"
                aria-hidden="true"
              >
                <span className="text-xs">🌶️</span>
              </div>
              <Label className="text-gray-200 text-sm font-medium">
                Food-Specific Details
              </Label>
              <Badge
                variant="outline"
                className="text-xs bg-silver-900/20 border-silver-500/30 text-silver-400"
                aria-label="Variant-specific configuration"
              >
                Variant-specific
              </Badge>
            </div>

            <div
              className="p-4 rounded-lg space-y-4 bg-gray-900/50 border border-gray-700"
              role="group"
              aria-labelledby={`variant-${index}-food-details-heading`}
            >
              {/* Spice Level */}
              <div className="space-y-2">
                <Label htmlFor={`variant-${index}-spice`} className="text-gray-400 text-sm">
                  Spice Level (0-6)
                </Label>
                <Input
                  id={`variant-${index}-spice`}
                  type="number"
                  value={variant.spice_level || ''}
                  onChange={(e) => onUpdate('spice_level', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 3"
                  min="0"
                  max="6"
                  className="border-gray-700 bg-gray-900/50 hover:border-purple-500/50"
                  aria-describedby={`variant-${index}-spice-hint`}
                />
                <p id={`variant-${index}-spice-hint`} className="text-xs text-gray-500">
                  <span aria-hidden="true">🌶️</span> Heat level specific to this variant (leave empty to inherit from base item)
                </p>
              </div>

              {/* Dietary Tags - Variant Level */}
              <div className="space-y-3">
                <Label className="text-gray-400 text-sm font-medium">
                  Dietary Information
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`variant-${index}-vegetarian`}
                      checked={variant.is_vegetarian || false}
                      onCheckedChange={(checked) => onUpdate('is_vegetarian', checked)}
                    />
                    <Label htmlFor={`variant-${index}-vegetarian`} className="text-sm text-gray-400">
                      Vegetarian
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`variant-${index}-vegan`}
                      checked={variant.is_vegan || false}
                      onCheckedChange={(checked) => onUpdate('is_vegan', checked)}
                    />
                    <Label htmlFor={`variant-${index}-vegan`} className="text-sm text-gray-400">
                      Vegan
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`variant-${index}-gluten-free`}
                      checked={variant.is_gluten_free || false}
                      onCheckedChange={(checked) => onUpdate('is_gluten_free', checked)}
                    />
                    <Label htmlFor={`variant-${index}-gluten-free`} className="text-sm text-gray-400">
                      Gluten-Free
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`variant-${index}-halal`}
                      checked={variant.is_halal || false}
                      onCheckedChange={(checked) => onUpdate('is_halal', checked)}
                    />
                    <Label htmlFor={`variant-${index}-halal`} className="text-sm text-gray-400">
                      Halal
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`variant-${index}-dairy-free`}
                      checked={variant.is_dairy_free || false}
                      onCheckedChange={(checked) => onUpdate('is_dairy_free', checked)}
                    />
                    <Label htmlFor={`variant-${index}-dairy-free`} className="text-sm text-gray-400">
                      Dairy-Free
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`variant-${index}-nut-free`}
                      checked={variant.is_nut_free || false}
                      onCheckedChange={(checked) => onUpdate('is_nut_free', checked)}
                    />
                    <Label htmlFor={`variant-${index}-nut-free`} className="text-sm text-gray-400">
                      Nut-Free
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Set dietary properties specific to this variant
                </p>
              </div>

              {/* Allergens - Variant Level */}
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm font-medium">
                  Allergens
                </Label>
                <AllergenSelector
                  selectedAllergens={variant.allergens || []}
                  onAllergensChange={(allergens) => onUpdate('allergens', allergens)}
                  allergenNotes={variant.allergen_notes || ''}
                  onAllergenNotesChange={(notes) => onUpdate('allergen_notes', notes)}
                />
                <p className="text-xs text-gray-500">
                  <span aria-hidden="true">⚠️</span> Select allergens present in this specific variant
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2" role="heading" aria-level={4} id={`variant-${index}-pricing-heading`}>
              <PoundSterling className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <Label className="text-gray-400 text-sm font-medium">
                Variant Pricing
              </Label>
            </div>
            <div role="group" aria-labelledby={`variant-${index}-pricing-heading`}>
              <MenuItemPricing
                pricing={{
                  price: variant.price,
                  price_takeaway: variant.price || 0,
                  price_dine_in: variant.price_dine_in || 0,
                  price_delivery: variant.price_delivery || 0,
                }}
                hasVariants={false}
                onChange={onPricingChange}
                errors={{
                  price_dine_in: errors?.price_dine_in,
                  price_takeaway: errors?.price,
                  price_delivery: errors?.price_delivery,
                }}
              />
            </div>
          </div>

          {/* Featured variant toggle */}
          <div className="flex items-center space-x-2" role="group" aria-labelledby={`variant-${index}-featured-label`}>
            <Switch
              id={`featured_${index}`}
              checked={variant.featured || false}
              onCheckedChange={(checked) => onUpdate('featured', checked)}
              aria-describedby={`variant-${index}-featured-hint`}
            />
            <div className="flex items-center gap-2">
              <Star className={cn('w-4 h-4', variant.featured ? 'text-silver-400' : 'text-gray-500')} aria-hidden="true" />
              <Label id={`variant-${index}-featured-label`} htmlFor={`featured_${index}`} className="text-sm text-gray-400">
                Feature this variant
              </Label>
            </div>
            <span id={`variant-${index}-featured-hint`} className="sr-only">
              {variant.featured ? 'This variant will appear in the featured section' : 'Check to feature this specific variant'}
            </span>
          </div>

          {/* Default variant toggle */}
          <div className="flex items-center space-x-2" role="group" aria-labelledby={`variant-${index}-default-label`}>
            <Switch
              id={`default_${index}`}
              checked={variant.is_default}
              onCheckedChange={(checked) => onUpdate('is_default', checked)}
              aria-describedby={`variant-${index}-default-hint`}
            />
            <Label id={`variant-${index}-default-label`} htmlFor={`default_${index}`} className="text-sm text-gray-400">
              Set as default variant
            </Label>
            <span id={`variant-${index}-default-hint`} className="sr-only">
              {variant.is_default ? 'This variant will be pre-selected in ordering interfaces' : 'Check to make this the default variant'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
