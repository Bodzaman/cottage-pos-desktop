import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Package, FileText, Settings, CreditCard, UtensilsCrossed, Wine, Coffee, Info, Camera, Save, X, CheckCircle2 } from 'lucide-react';
import { apiClient } from 'app';
import { MenuItemPricing } from 'components/MenuItemPricing';
import { MenuItemMedia } from 'components/MenuItemMedia';
import { MenuItemVariants } from 'components/MenuItemVariants';
import ServingSizesSelector from 'components/ServingSizesSelector';
import SpiceLevelDropdown from './SpiceLevelDropdown';
import { useMenuItemForm, useItemTypeFields } from '../utils/menuItemFormHooks';
import { MenuItemFormData } from '../utils/masterTypes';
import { Category, ProteinType } from '../utils/menuTypes';
import { globalColors, styles } from '../utils/QSAIDesign';
import { validateItemPricing, getVariantSummary } from '../utils/variantPricing';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

// QSAI Design System Styles
const qsaiStyles = {
  // Clean panel background with subtle border
  panel: {
    backgroundColor: '#1E1E1E', // Soft black for panels
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(91, 33, 182, 0.15)', // Subtle purple accent
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  
  // Clean card styling without heavy gradients
  card: {
    backgroundColor: '#1E1E1E',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  
  // Modern button styling
  button: {
    primary: {
      backgroundColor: '#5B21B6', // Updated purple
      color: '#FFFFFF',
      border: 'none',
      boxShadow: '0 2px 4px rgba(91, 33, 182, 0.2)'
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#F0F0F5',
      border: '1px solid rgba(255, 255, 255, 0.12)'
    }
  },
  
  // Clean input styling
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    color: '#FFFFFF',
    borderRadius: '0.375rem'
  },
  
  // Section header styling
  sectionHeader: {
    color: '#F0F0F5', // Pearl white
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem'
  }
};

export interface QSAIMenuItemFormProps {
  menuItem?: MenuItemFormData;
  initialData?: MenuItemFormData;
  categories: Category[];
  proteinTypes?: ProteinType[];
  onSave?: (data: MenuItemFormData) => Promise<void>;
  onSuccess?: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  itemType?: 'food' | 'drinks_wine' | 'coffee_desserts' | null;
}

/**
 * QSAI-styled Menu Item Form Component
 * Clean, modern design without heavy gradients
 */
export function QSAIMenuItemForm(props: QSAIMenuItemFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    errors,
    isSubmitting,
    submitError,
    sectionsExpanded,
    toggleSection,
    orderContext,
    isLoadingOrder,
    hasVariants,
    variants,
    onCancel
  } = useMenuItemForm(props);
  
  const { fieldsConfig } = useItemTypeFields(props.itemType);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div style={qsaiStyles.panel} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 style={qsaiStyles.sectionHeader}>
                {props.isEditing ? 'Edit Menu Item' : 
                 `Add New ${props.itemType === 'food' ? 'Food' : 
                           props.itemType === 'drinks_wine' ? 'Drinks & Wine' : 
                           props.itemType === 'coffee_desserts' ? 'Coffee & Desserts' : 'Menu'} Item`}
              </h2>
              <p className="text-sm" style={{ color: globalColors.text.secondary }}>
                {props.isEditing ? 'Update item details and pricing' : 'Complete the form to add a new menu item'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information Section */}
        <Card style={qsaiStyles.card}>
          <CardHeader>
            <Collapsible 
              open={sectionsExpanded.basicInfo} 
              onOpenChange={() => toggleSection('basicInfo')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
                <CardTitle className="flex items-center space-x-2" style={{ color: globalColors.text.primary }}>
                  <FileText className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
                  <span>Basic Information</span>
                </CardTitle>
                {sectionsExpanded.basicInfo ? 
                  <ChevronUp className="h-4 w-4" style={{ color: globalColors.text.secondary }} /> : 
                  <ChevronDown className="h-4 w-4" style={{ color: globalColors.text.secondary }} />
                }
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Item Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                      Item Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Chicken Tikka Masala"
                      style={qsaiStyles.input}
                      {...register('name', { required: 'Item name is required' })}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-400">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                      Category *
                    </Label>
                    <Select value={watch('category_id') || ''} onValueChange={(value) => setValue('category_id', value)}>
                      <SelectTrigger style={qsaiStyles.input}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {props.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category_id && (
                      <p className="text-xs text-red-400">{errors.category_id.message}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the item, ingredients, and preparation..."
                    rows={3}
                    style={qsaiStyles.input}
                    {...register('description')}
                  />
                </div>

                {/* Order Context Display */}
                {orderContext && (
                  <div style={qsaiStyles.card} className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="h-4 w-4" style={{ color: globalColors.purple.primary }} />
                      <span className="text-sm font-medium" style={{ color: globalColors.text.primary }}>
                        Auto-populated ordering for {orderContext.categoryName}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: globalColors.text.secondary }}>
                      <div>Display Order: {orderContext.nextDisplayOrder}</div>
                      <div>Print Order: {orderContext.nextPrintOrder}</div>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Specialized Fields Section */}
        {props.itemType && (
          <Card style={qsaiStyles.card}>
            <CardHeader>
              <Collapsible 
                open={sectionsExpanded.specializedFields} 
                onOpenChange={() => toggleSection('specializedFields')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
                  <CardTitle className="flex items-center space-x-2" style={{ color: globalColors.text.primary }}>
                    {props.itemType === 'food' && <UtensilsCrossed className="h-5 w-5 text-amber-500" />}
                    {props.itemType === 'drinks_wine' && <Wine className="h-5 w-5 text-purple-500" />}
                    {props.itemType === 'coffee_desserts' && <Coffee className="h-5 w-5 text-orange-500" />}
                    <span>{fieldsConfig.title}</span>
                  </CardTitle>
                  {sectionsExpanded.specializedFields ? 
                    <ChevronUp className="h-4 w-4" style={{ color: globalColors.text.secondary }} /> : 
                    <ChevronDown className="h-4 w-4" style={{ color: globalColors.text.secondary }} />
                  }
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-6 pt-4">
                  <SpecializedFieldsRenderer itemType={props.itemType} register={register} watch={watch} setValue={setValue} />
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>
        )}

        {/* Pricing Status Panel */}
        {(() => {
          const basePriceIsZero = 
            (!watch('price') || watch('price') === 0) &&
            (!watch('price_dine_in') || watch('price_dine_in') === 0) &&
            (!watch('price_takeaway') || watch('price_takeaway') === 0) &&
            (!watch('price_delivery') || watch('price_delivery') === 0);
          
          const variantSummary = hasVariants && variants.length > 0 
            ? getVariantSummary(variants, props.proteinTypes || [])
            : null;

          const pricingValidation = validateItemPricing(
            {
              price: watch('price') || 0,
              price_dine_in: watch('price_dine_in') || 0,
              price_takeaway: watch('price_takeaway') || 0,
              price_delivery: watch('price_delivery') || 0,
              has_variants: hasVariants
            },
            variants
          );

          return (
            <Alert 
              className="mb-6" 
              style={{ 
                backgroundColor: pricingValidation.isValid 
                  ? 'rgba(91, 33, 182, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                borderColor: pricingValidation.isValid 
                  ? 'rgba(91, 33, 182, 0.3)' 
                  : 'rgba(239, 68, 68, 0.5)',
                borderWidth: '1px'
              }}
            >
              <div className="flex items-start gap-3">
                {pricingValidation.isValid ? (
                  <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white">Pricing Configuration</h4>
                    <Badge 
                      variant={pricingValidation.isValid ? 'default' : 'destructive'} 
                      className="text-xs"
                      style={{
                        backgroundColor: pricingValidation.isValid ? globalColors.purple.primary : undefined
                      }}
                    >
                      {pricingValidation.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>

                  {hasVariants ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-purple-200">
                          Variant pricing active - {variants.length} protein option{variants.length !== 1 ? 's' : ''} configured
                        </span>
                      </div>
                      {variantSummary && (
                        <div className="flex items-center gap-2 ml-6">
                          <Info className="h-4 w-4 text-purple-400" />
                          <span className="text-purple-300">
                            Price range: {variantSummary.priceRange}
                          </span>
                        </div>
                      )}
                      {basePriceIsZero && (
                        <div className="flex items-center gap-2 ml-6">
                          <Info className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-300 text-xs">
                            ℹ️ Base price is £0.00 - this is normal for variant items
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-200">
                          Single-price item (no variants)
                        </span>
                      </div>
                      {basePriceIsZero && (
                        <div className="flex items-center gap-2 ml-6">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <span className="text-red-300 text-xs font-medium">
                            ⚠️ Warning: Base price is £0.00 - please set a price or add variants
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show validation errors if any */}
                  {pricingValidation.errors.length > 0 && (
                    <div className="mt-3 p-3 rounded-md bg-red-950/50 border border-red-500/30">
                      <p className="text-red-300 text-sm font-medium mb-1">Pricing errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {pricingValidation.errors.map((error, idx) => (
                          <li key={idx} className="text-red-200 text-xs">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Show warnings if any (non-blocking) */}
                  {pricingValidation.warnings.length > 0 && pricingValidation.isValid && (
                    <div className="mt-3 p-3 rounded-md bg-yellow-950/30 border border-yellow-500/20">
                      <p className="text-yellow-300 text-sm font-medium mb-1">Notices:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {pricingValidation.warnings.map((warning, idx) => (
                          <li key={idx} className="text-yellow-200 text-xs">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          );
        })()}

        {/* Pricing Section */}
        <Card style={qsaiStyles.card}>
          <CardHeader>
            <Collapsible 
              open={sectionsExpanded.pricing} 
              onOpenChange={() => toggleSection('pricing')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
                <CardTitle className="flex items-center space-x-2" style={{ color: globalColors.text.primary }}>
                  <CreditCard className="h-5 w-5" style={{ color: globalColors.purple.primary }} />
                  <span>Pricing</span>
                </CardTitle>
                {sectionsExpanded.pricing ? 
                  <ChevronUp className="h-4 w-4" style={{ color: globalColors.text.secondary }} /> : 
                  <ChevronDown className="h-4 w-4" style={{ color: globalColors.text.secondary }} />
                }
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-4">
                <MenuItemPricing
                  pricing={{
                    price: watch('price'),
                    price_takeaway: watch('price_takeaway'),
                    price_dine_in: watch('price_dine_in'),
                    price_delivery: watch('price_delivery')
                  }}
                  hasVariants={hasVariants}
                  onChange={(pricing) => {
                    setValue('price', pricing.price);
                    setValue('price_takeaway', pricing.price_takeaway);
                    setValue('price_dine_in', pricing.price_dine_in);
                    setValue('price_delivery', pricing.price_delivery);
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        <div style={qsaiStyles.panel} className="p-6">
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              style={qsaiStyles.button.secondary}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={qsaiStyles.button.primary}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {props.isEditing ? 'Update Item' : 'Create Item'}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Specialized fields renderer component
 */
interface SpecializedFieldsRendererProps {
  itemType: 'food' | 'drinks_wine' | 'coffee_desserts';
  register: any;
  watch: any;
  setValue: any;
}

function SpecializedFieldsRenderer({ itemType, register, watch, setValue }: SpecializedFieldsRendererProps) {
  switch (itemType) {
    case 'food':
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <SpiceLevelDropdown
              value={watch('default_spice_level') || 0}
              onChange={(level) => setValue('default_spice_level', level)}
              label="Default Spice Level"
            />
          </div>
        </div>
      );
      
    case 'drinks_wine':
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="drink_type" style={{ color: globalColors.text.primary }}>
                Drink Category
              </Label>
              <Select value={watch('drink_type') || ''} onValueChange={(value) => setValue('drink_type', value)}>
                <SelectTrigger style={qsaiStyles.input}>
                  <SelectValue placeholder="Select drink type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beer">🍺 Beer</SelectItem>
                  <SelectItem value="wine">🍷 Wine</SelectItem>
                  <SelectItem value="spirits">🥃 Spirits</SelectItem>
                  <SelectItem value="cocktails">🍹 Cocktails</SelectItem>
                  <SelectItem value="soft_drinks">🥤 Soft Drinks</SelectItem>
                  <SelectItem value="hot_drinks">☕ Hot Drinks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alcohol_content" style={{ color: globalColors.text.primary }}>
                Alcohol Content (%)
              </Label>
              <Input
                id="alcohol_content"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g., 12.5"
                style={qsaiStyles.input}
                {...register('alcohol_content', { valueAsNumber: true })}
              />
            </div>
          </div>
          
          {/* Serving sizes would go here */}
          <ServingSizesSelector register={register} watch={watch} errors={{}} />
        </div>
      );
      
    case 'coffee_desserts':
      return (
        <div className="space-y-6">
          <div className="text-center py-8" style={qsaiStyles.card} className="p-6">
            <Coffee className="h-16 w-16 mx-auto mb-4 text-orange-400" />
            <h4 className="text-lg font-medium text-orange-400 mb-2">Streamlined Creation Process</h4>
            <p className="text-sm text-orange-400/80 max-w-md mx-auto leading-relaxed">
              This simplified form focuses on the essentials. Items will be automatically categorized as Coffee & Desserts.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialty_notes" style={{ color: globalColors.text.primary }}>
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="specialty_notes"
              placeholder="Any special preparation notes or dietary information..."
              rows={3}
              style={qsaiStyles.input}
              {...register('specialty_notes')}
            />
          </div>
        </div>
      );
      
    default:
      return null;
  }
}

export default QSAIMenuItemForm;
