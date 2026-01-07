import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Cog, AlertCircle, ChevronDown, ChevronUp, Package, Star, PoundSterling, ImagePlus, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors, cardStyle } from '../utils/designSystem';
import MediaSelector from './MediaSelector';
import { MediaItem, uploadMedia } from '../utils/mediaLibraryUtils';
import { supabase } from '../utils/supabaseClient';
import { MenuItemPricing, PricingData } from './MenuItemPricing';
import SpiceLevelDropdown from './SpiceLevelDropdown';
import AllergenSelector from './AllergenSelector';
import { FieldError } from './FieldError';
import { VariantDescriptionField } from 'components/VariantDescriptionField';
import { VariantImageField } from 'components/VariantImageField';
import { VariantRow } from 'components/VariantRow';
import { ImageUploadResult } from 'components/ImageUploader';

export interface MenuVariant {
  id?: string;
  protein_type_id?: string;
  name: string;
  variant_name?: string; // ✅ Auto-generated full display name (e.g., "SPICY TIKKA MASALA - CHICKEN")
  description?: string;
  description_state?: 'inherited' | 'custom' | 'none'; // Track description state
  price: number;
  price_dine_in?: number;
  price_delivery?: number;
  is_default: boolean;
  image_url?: string;
  image_asset_id?: string;
  image_state?: 'inherited' | 'custom' | 'none'; // Track image state
  display_order: number;
  
  // Food-specific details for variants
  spice_level?: number;
  allergens?: string[];
  allergen_notes?: string;
  
  // Dietary tags (variant-level)
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_halal?: boolean;
  is_dairy_free?: boolean;
  is_nut_free?: boolean;
  
  // Featured toggle (variant-level)
  featured?: boolean;
}

export interface ProteinType {
  id: string;
  name: string;
  display_order: number;
}

export interface Props {
  variants: MenuVariant[];
  proteinTypes: ProteinType[];
  onChange: (variants: MenuVariant[]) => void;
  baseItemName?: string;
  baseItemDescription?: string;
  baseItemImage?: string;
  baseItemImageAssetId?: string;
  errors?: {
    variants?: Array<{
      name?: string;
      price?: string;
      price_dine_in?: string;
      price_delivery?: string;
    }>;
  };
}

export function MenuItemVariants({ variants, proteinTypes, onChange, baseItemName = '', baseItemDescription = '', baseItemImage = '', baseItemImageAssetId = '', errors }: Props) {
  // 🐛 Debug logging to diagnose rendering
  console.log('🔍 [MenuItemVariants] Component Render:', {
    variantsLength: variants?.length,
    variantsIsArray: Array.isArray(variants),
    variantsValue: variants,
    proteinTypesLength: proteinTypes?.length,
    baseItemName,
    hasErrors: !!errors,
    errorsObject: errors,
    errorsKeys: errors ? Object.keys(errors) : [],
    variantsError: errors?.variants,
    variantsErrorMessage: errors?.variants?.message,
    variantsErrorType: errors?.variants?.type
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [autoGenerateNames, setAutoGenerateNames] = useState(true);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());
  const [isUploadingVariant, setIsUploadingVariant] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);

  // 🆕 Track which variants have duplicate names
  const findDuplicateIndices = (variantList: MenuVariant[]): Set<number> => {
    const duplicates = new Set<number>();
    const nameCount = new Map<string, number[]>();
    
    // Build map of normalized names to variant indices
    variantList.forEach((variant, index) => {
      const normalizedName = (variant.name || '').trim().toLowerCase();
      if (normalizedName) { // Only check non-empty names
        if (!nameCount.has(normalizedName)) {
          nameCount.set(normalizedName, []);
        }
        nameCount.get(normalizedName)!.push(index);
      }
    });
    
    // Mark all indices that have duplicate names
    nameCount.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach(idx => duplicates.add(idx));
      }
    });
    
    return duplicates;
  };

  // 🆕 Update duplicate detection whenever variants change
  useEffect(() => {
    const duplicates = findDuplicateIndices(variants);
    setDuplicateIndices(duplicates);
    
    if (duplicates.size > 0 && variants.length > 0) {
      const duplicateNames = Array.from(duplicates)
        .map(idx => variants[idx]?.name)
        .filter((name, index, self) => name && self.indexOf(name) === index);
      toast.error(`Duplicate variant names detected: ${duplicateNames.join(', ')}`);
    }
  }, [variants]);

  const addVariant = () => {
    const newVariant: MenuVariant = {
      name: '',
      description: baseItemDescription,
      description_state: baseItemDescription ? 'inherited' : 'none',
      price: 0,
      price_dine_in: 0,
      price_delivery: 0,
      is_default: variants.length === 0,
      image_url: baseItemImage,
      image_asset_id: baseItemImageAssetId,
      image_state: baseItemImage ? 'inherited' : 'none',
      display_order: variants.length,
      // Initialize dietary tags to false
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_halal: false,
      is_dairy_free: false,
      is_nut_free: false,
      // Initialize featured to false
      featured: false,
    };
    
    const updatedVariants = [...variants, newVariant];
    onChange(updatedVariants);
    toast.success('New variant added');
    
    setTimeout(() => {
      const variantIndex = updatedVariants.length - 1;
      const nameInput = document.querySelector(
        `input[name="variant-${variantIndex}-name"]`
      ) as HTMLInputElement;
      
      if (nameInput) {
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    if (variants[index].is_default && newVariants.length > 0) {
      newVariants[0].is_default = true;
    }
    onChange(newVariants);
  };

  const updateVariant = (index: number, field: keyof MenuVariant, value: any) => {
    const newVariants = [...variants];
    
    if (field === 'is_default' && value === true) {
      newVariants.forEach((variant, i) => {
        if (i !== index) {
          variant.is_default = false;
        }
      });
    }
    
    if (field === 'description') {
      const currentState = newVariants[index].description_state || 'inherited';
      
      if (currentState === 'inherited' && value !== baseItemDescription) {
        newVariants[index].description_state = 'custom';
      } else if (currentState === 'custom' && value === baseItemDescription) {
        newVariants[index].description_state = 'inherited';
      } else if (value === '') {
        newVariants[index].description_state = 'none';
      }
    }
    
    if (field === 'image_url') {
      const currentImageState = newVariants[index].image_state || 'inherited';
      
      if (currentImageState === 'inherited' && value !== baseItemImage) {
        newVariants[index].image_state = 'custom';
      } else if (currentImageState === 'custom' && value === baseItemImage) {
        newVariants[index].image_state = 'inherited';
      } else if (value === '') {
        newVariants[index].image_state = 'none';
      }
    }
    
    newVariants[index] = {
      ...newVariants[index],
      [field]: value
    };
    
    if (field === 'protein_type_id' && autoGenerateNames && baseItemName) {
      const proteinType = proteinTypes.find(pt => pt.id === value);
      if (proteinType) {
        newVariants[index].name = `${proteinType.name} ${baseItemName}`;
      }
    }
    
    onChange(newVariants);
  };

  const setDescriptionState = (index: number, state: 'inherited' | 'custom' | 'none') => {
    const newVariants = [...variants];
    const variant = newVariants[index];
    
    switch (state) {
      case 'inherited':
        variant.description = baseItemDescription;
        variant.description_state = 'inherited';
        break;
      case 'custom':
        variant.description_state = 'custom';
        break;
      case 'none':
        variant.description = '';
        variant.description_state = 'none';
        break;
    }
    
    onChange(newVariants);
  };

  const setImageState = (index: number, state: 'inherited' | 'custom' | 'none') => {
    const newVariants = [...variants];
    const variant = newVariants[index];
    
    switch (state) {
      case 'inherited':
        variant.image_url = baseItemImage;
        variant.image_asset_id = baseItemImageAssetId;
        variant.image_state = 'inherited';
        break;
      case 'custom':
        variant.image_state = 'custom';
        break;
      case 'none':
        variant.image_url = '';
        variant.image_asset_id = '';
        variant.image_state = 'none';
        break;
    }
    
    onChange(newVariants);
  };

  /**
   * Handle variant image upload with optimization
   * Now uses the same ImageUploader flow as Basic Information
   */
  const handleVariantImageUpload = async (index: number, result: ImageUploadResult) => {
    console.log('✅ [MenuItemVariants] Variant image upload successful:', result);
    console.log('📸 [MenuItemVariants] Asset ID:', result.asset_id);
    console.log('📁 [MenuItemVariants] File URL:', result.file_url);

    // Update variant with optimized image data
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      image_url: result.file_url,
      image_asset_id: result.asset_id,
      image_state: 'custom'
    };

    onChange(newVariants);
    toast.success('Variant image uploaded and optimized successfully!');
  };

  const applyBaseDescriptionToAll = () => {
    const newVariants = variants.map(variant => ({
      ...variant,
      description: baseItemDescription,
      description_state: baseItemDescription ? 'inherited' as const : 'none' as const
    }));
    onChange(newVariants);
    toast.success('Applied base description to all variants');
  };

  const removeAllDescriptions = () => {
    const newVariants = variants.map(variant => ({
      ...variant,
      description: '',
      description_state: 'none' as const
    }));
    onChange(newVariants);
    toast.success('Removed descriptions from all variants');
  };

  const applyBaseImageToAll = () => {
    const newVariants = variants.map(variant => ({
      ...variant,
      image_url: baseItemImage,
      image_asset_id: '',
      image_state: baseItemImage ? 'inherited' as const : 'none' as const
    }));
    onChange(newVariants);
    toast.success('Applied base image to all variants');
  };

  const removeAllImages = () => {
    const newVariants = variants.map(variant => ({
      ...variant,
      image_url: '',
      image_asset_id: '',
      image_state: 'none' as const
    }));
    onChange(newVariants);
    toast.success('Removed images from all variants');
  };

  const handleAutoGenerateToggle = (enabled: boolean) => {
    setAutoGenerateNames(enabled);
    
    if (enabled && baseItemName) {
      const newVariants = variants.map(variant => {
        if (variant.protein_type_id) {
          const proteinType = proteinTypes.find(pt => pt.id === variant.protein_type_id);
          if (proteinType) {
            return {
              ...variant,
              name: `${proteinType.name} ${baseItemName}`
            };
          }
        }
        return variant;
      });
      onChange(newVariants);
      toast.success('Variant names auto-generated');
    }
  };

  const getProteinTypeName = (proteinTypeId?: string) => {
    const proteinType = proteinTypes.find(pt => pt.id === proteinTypeId);
    return proteinType?.name || 'Unknown';
  };

  const handleMediaSelect = (media: MediaItem) => {
    if (selectedVariantIndex !== null) {
      const newVariants = [...variants];
      newVariants[selectedVariantIndex] = {
        ...newVariants[selectedVariantIndex],
        image_url: media.url || '',
        image_asset_id: media.id || ''
      };
      onChange(newVariants);
      
      setMediaSelectorOpen(false);
      setSelectedVariantIndex(null);
      toast.success(`Image selected for variant`);
    }
  };

  const openMediaSelector = (variantIndex: number) => {
    setSelectedVariantIndex(variantIndex);
    setMediaSelectorOpen(true);
  };

  const removeVariantImage = (variantIndex: number) => {
    updateVariant(variantIndex, 'image_url', '');
    updateVariant(variantIndex, 'image_asset_id', '');
    toast.success('Image removed from variant');
  };

  return (
    <Card style={cardStyle}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.brand.purple }}
            aria-hidden="true"
          >
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle 
              as="h3"
              className="text-lg font-medium"
              style={{ color: colors.text.primary }}
              id="variant-management-heading"
            >
              Variant Management
            </CardTitle>
            <p 
              style={{ color: colors.text.secondary }}
              className="text-xs mt-1"
              id="variant-management-description"
            >
              Configure different proteins, sizes, or preparations
            </p>
          </div>
          {variants.length > 0 && (
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: colors.brand.purple,
                color: colors.brand.purple,
                marginLeft: 'auto'
              }}
              aria-label={`${variants.length} variant${variants.length !== 1 ? 's' : ''} configured`}
            >
              {variants.length} variant{variants.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6" aria-labelledby="variant-management-heading" aria-describedby="variant-management-description">
        {/* Auto-generation toggle - only show when variants exist */}
        {variants.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg border" 
            style={{ borderColor: colors.text.disabled + '40', backgroundColor: colors.background.tertiary }}
            role="group"
            aria-labelledby="auto-generate-label"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-generate-names"
                  checked={autoGenerateNames}
                  onCheckedChange={handleAutoGenerateToggle}
                  aria-describedby="auto-generate-status"
                />
                <Label 
                  htmlFor="auto-generate-names" 
                  id="auto-generate-label"
                  className="text-sm font-medium" 
                  style={{ color: colors.text.primary }}
                >
                  <span aria-hidden="true">☑️</span> Auto-generate variant names from protein types
                </Label>
              </div>
            </div>
            <div 
              id="auto-generate-status"
              className="text-xs" 
              style={{ color: colors.text.secondary }}
              aria-live="polite"
            >
              {autoGenerateNames ? 'Names will auto-populate' : 'Manual entry mode'}
            </div>
          </div>
        )}

        {/* Info box - only show when variants exist */}
        {variants.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg text-sm" 
            style={{ 
              backgroundColor: `${colors.brand.turquoise}20`,
              color: colors.text.primary
            }}
            role="note"
            aria-label="Variants information"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Variants allow multiple options for this menu item</p>
              <p>For example: Chicken Tikka Masala, Lamb Tikka Masala, Vegetarian Tikka Masala</p>
            </div>
          </div>
        )}

        {/* Bulk Description Actions */}
        {variants.length > 1 && (
          <div className="p-4 rounded-lg border" 
            style={{ borderColor: colors.text.disabled + '40', backgroundColor: colors.background.secondary }}
            role="group"
            aria-labelledby="bulk-description-heading"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" style={{ color: colors.brand.gold }} aria-hidden="true" />
                <Label 
                  id="bulk-description-heading"
                  className="text-sm font-medium" 
                  style={{ color: colors.text.primary }}
                >
                  Bulk Description Actions
                </Label>
              </div>
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  backgroundColor: `${colors.brand.gold}20`,
                  borderColor: colors.brand.gold,
                  color: colors.brand.gold 
                }}
                aria-label={`${variants.length} variants`}
              >
                {variants.length} variants
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Bulk description actions">
              {baseItemDescription && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyBaseDescriptionToAll}
                  className="flex items-center space-x-1"
                  style={{ 
                    borderColor: colors.brand.purple + '40',
                    backgroundColor: colors.brand.purple + '10',
                    color: colors.brand.purple 
                  }}
                  aria-label="Apply base item description to all variants"
                >
                  <span className="mr-1" aria-hidden="true">✨</span>
                  Apply base to all
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeAllDescriptions}
                className="flex items-center space-x-1"
                style={{ 
                  borderColor: colors.text.disabled + '40',
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.secondary 
                }}
                aria-label="Remove descriptions from all variants"
              >
                <span className="mr-1" aria-hidden="true">×</span>
                Remove all descriptions
              </Button>
            </div>
            
            <p className="text-xs mt-2" style={{ color: colors.text.secondary }} aria-hidden="true">
              💡 Apply changes to all variants at once for efficiency
            </p>
          </div>
        )}

        {/* 🆕 Duplicate Warning Banner */}
        {duplicateIndices.size > 0 && (
          <div 
            className="flex items-start gap-2 p-3 rounded-lg text-sm" 
            style={{ 
              backgroundColor: '#FEE2E2',
              border: '1px solid #EF4444',
              color: '#991B1B'
            }}
            role="alert"
            aria-live="assertive"
          >
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} aria-hidden="true" />
            <div>
              <p className="font-semibold"><span aria-hidden="true">⚠️</span> Duplicate Variant Names Detected</p>
              <p className="text-xs mt-1">Each variant must have a unique name. Please rename the highlighted variants.</p>
            </div>
          </div>
        )}

        {variants.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg"
            style={{ borderColor: colors.text.disabled + '40' }}
            role="status"
            aria-label="No variants created"
          >
            {/* Defensive: use Cog icon, and guard in case of any import issue */}
            {typeof Cog === 'function' ? (
              <Cog className="mx-auto h-12 w-12" style={{ color: colors.text.disabled }} aria-hidden="true" />
            ) : (
              <div className="mx-auto h-12 w-12 rounded-full border" style={{ borderColor: colors.text.disabled + '40' }} aria-hidden="true" />
            )}
            <p className="mt-2 text-sm" style={{ color: colors.text.secondary }}>No variants created yet</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={addVariant}
              style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}
              aria-label="Add first variant"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add First Variant
            </Button>
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Menu item variants">
            {variants.map((variant, index) => (
              <VariantRow
                key={index}
                variant={variant}
                index={index}
                isDuplicate={duplicateIndices.has(index)}
                proteinTypes={proteinTypes}
                autoGenerateNames={autoGenerateNames}
                baseItemName={baseItemName}
                baseItemDescription={baseItemDescription}
                baseItemImage={baseItemImage}
                baseItemImageAssetId={baseItemImageAssetId}
                isOnlyVariant={variants.length === 1}
                errors={errors?.variants?.[index]}
                onUpdate={(field, value) => updateVariant(index, field, value)}
                onDescriptionStateChange={(state) => setDescriptionState(index, state)}
                onImageStateChange={(state) => setImageState(index, state)}
                onOpenMediaSelector={() => openMediaSelector(index)}
                onRemove={() => removeVariant(index)}
                onPricingChange={(pricingData) => {
                  const newVariants = [...variants];
                  newVariants[index] = {
                    ...newVariants[index],
                    price: pricingData.price_takeaway || 0,
                    price_dine_in: pricingData.price_dine_in || 0,
                    price_delivery: pricingData.price_delivery || 0
                  };
                  onChange(newVariants);
                }}
                onUploadSuccess={(result) => handleVariantImageUpload(index, result)}
                isUploading={isUploadingVariant && uploadingVariantIndex === index}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addVariant}
              className="w-full"
              style={{ borderColor: colors.brand.purple, color: colors.brand.purple }}
              aria-label="Add another variant to this menu item"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Another Variant
            </Button>
          </div>
        )}

        {variants.length > 0 && (
          <div 
            className="text-xs space-y-1 pt-2 border-t" 
            style={{ borderColor: colors.text.disabled + '40', color: colors.text.secondary }}
            role="note"
            aria-label="Variant tips"
          >
            <p><span aria-hidden="true">💡</span> <strong>Tip:</strong> Variants allow customers to choose different protein types or preparations</p>
            <p aria-hidden="true">• The default variant will be pre-selected in ordering interfaces</p>
            <p aria-hidden="true">• Each variant can have different pricing for takeaway, dine-in, and delivery</p>
            <p aria-hidden="true">• Consider adding variants for different spice levels, sizes, or protein options</p>
          </div>
        )}

        {/* Bulk Image Actions */}
        {variants.length > 1 && (
          <div 
            className="p-4 rounded-lg border" 
            style={{ borderColor: colors.text.disabled + '40', backgroundColor: colors.background.secondary }}
            role="group"
            aria-labelledby="bulk-image-heading"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ImagePlus className="h-4 w-4" style={{ color: colors.brand.turquoise }} aria-hidden="true" />
                <Label 
                  id="bulk-image-heading"
                  className="text-sm font-medium" 
                  style={{ color: colors.text.primary }}
                >
                  Bulk Image Actions
                </Label>
              </div>
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  backgroundColor: `${colors.brand.turquoise}20`,
                  borderColor: colors.brand.turquoise,
                  color: colors.brand.turquoise 
                }}
                aria-label={`${variants.length} variants`}
              >
                {variants.length} variants
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Bulk image actions">
              {baseItemImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyBaseImageToAll}
                  className="flex items-center space-x-1"
                  style={{ 
                    borderColor: colors.brand.purple + '40',
                    backgroundColor: colors.brand.purple + '10',
                    color: colors.brand.purple 
                  }}
                  aria-label="Apply base item image to all variants"
                >
                  <span className="mr-1" aria-hidden="true">✨</span>
                  Apply base image to all
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeAllImages}
                className="flex items-center space-x-1"
                style={{ 
                  borderColor: colors.text.disabled + '40',
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.secondary 
                }}
                aria-label="Remove images from all variants"
              >
                <span className="mr-1" aria-hidden="true">×</span>
                Remove all variant images
              </Button>
            </div>
            
            <p className="text-xs mt-2" style={{ color: colors.text.secondary }} aria-hidden="true">
              🖼️ Manage images across all variants efficiently
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Media Selector Dialog */}
      <MediaSelector
        isOpen={mediaSelectorOpen}
        onClose={() => {
          setMediaSelectorOpen(false);
          setSelectedVariantIndex(null);
        }}
        onSelectMedia={handleMediaSelect}
        mediaType="image"
        aspectRatio="any"
        title="Select Variant Image"
        showUploadTab={true}
        uploadUsage="menu-variant"
      />
    </Card>
  );
}
