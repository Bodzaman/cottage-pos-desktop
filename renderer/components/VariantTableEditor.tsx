/**
 * VariantTableEditor Component
 * 
 * Main tabular interface for managing menu item variants.
 * Replaces the 1,511-line accordion component with a streamlined grid.
 * 
 * Features:
 * - Editable grid with inline cell editing
 * - Drag-and-drop row reordering
 * - Bulk price operations
 * - Smart protein presets
 * - Duplicate detection
 * - Auto-save support
 * - Clear inheritance model from base item
 */

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { SortableVariantRow } from './SortableVariantRow';
import { VariantBulkActions } from './VariantBulkActions';
import { EditableTableCell } from './EditableTableCell';
import {
  VARIANT_PRESETS,
  createVariantFromPreset,
  getPresetsForItemType,
} from 'utils/variantPresets';
import {
  applyBulkAction,
  BulkAction,
  validateVariantPricing,
} from 'utils/variantBulkOperations';
import type { ItemVariant } from 'utils/menuTypes';
import {
  Plus,
  Info,
  AlertTriangle,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';

interface VariantTableEditorProps {
  variants: Partial<ItemVariant>[];
  onChange: (variants: Partial<ItemVariant>[]) => void;
  baseItemName: string;
  baseItemDescription?: string;
  presetCategory?: 'food' | 'drinks_wine' | 'coffee_desserts';
  disabled?: boolean;
  showPresets?: boolean;
}

/**
 * Generate a unique ID for new variants
 */
function generateVariantId(): string {
  return `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a full display name for a variant
 * Format: "{Base Item Name} - {Protein/Variant Name}"
 * Example: "SPICY TIKKA MASALA - CHICKEN"
 * 
 * @param baseItemName - The base menu item name
 * @param variantName - The protein or variant type name
 * @returns Formatted display name
 */
function generateVariantDisplayName(baseItemName: string, variantName: string): string {
  // Handle empty inputs
  if (!baseItemName || !baseItemName.trim()) {
    return variantName || '';
  }
  if (!variantName || !variantName.trim()) {
    return baseItemName || '';
  }
  
  // Check if variantName already contains baseItemName (avoid duplication)
  const baseNameNormalized = baseItemName.trim().toUpperCase();
  const variantNameNormalized = variantName.trim().toUpperCase();
  
  if (variantNameNormalized.includes(baseNameNormalized)) {
    // Already contains base name, just return variant name
    return variantName.trim();
  }
  
  // Generate combined name: "Base Item Name - Variant Name"
  return `${baseItemName.trim()} - ${variantName.trim()}`;
}

export const VariantTableEditor: React.FC<VariantTableEditorProps> = ({
  variants,
  onChange,
  baseItemName,
  baseItemDescription,
  presetCategory = 'food',
  disabled = false,
  showPresets = true,
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Get protein types from real-time store for dynamic presets
  const { proteinTypes } = useRealtimeMenuStore();

  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Validate variants whenever they change
  useEffect(() => {
    const errors = validateVariantPricing(variants);
    setValidationErrors(errors);
  }, [variants]);

  /**
   * Handle drag-and-drop reordering
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = variants.findIndex((v) => v.id === active.id);
    const newIndex = variants.findIndex((v) => v.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(variants, oldIndex, newIndex);
      // Update order field
      const withOrder = reordered.map((v, index) => ({
        ...v,
        order: index,
      }));
      onChange(withOrder);
    }
  };

  /**
   * Add a new blank variant
   */
  const handleAddVariant = () => {
    const newVariant: Partial<ItemVariant> = {
      id: generateVariantId(),
      name: '',
      variant_name: '', // ✅ Initialize empty for custom variants
      price: 0,
      price_dine_in: 0,
      price_delivery: 0,
      is_default: variants.length === 0, // First variant is default
      order: variants.length,
      // Initialize dietary fields
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_halal: false,
      is_dairy_free: false,
      is_nut_free: false,
      // Initialize featured field
      featured: false,
      // ✅ Initialize food settings fields
      spice_level: null,
      allergens: [],
      allergen_notes: '',
    };

    onChange([...variants, newVariant]);
    // Auto-focus the name cell for the new variant
    setTimeout(() => {
      setEditingCell({ row: variants.length, col: 'name' });
    }, 50);
  };

  /**
   * Add a variant from a preset
   */
  const handleAddPresetVariant = (presetName: string) => {
    // Get base price from first existing variant or default to 0
    const basePrice = variants[0]?.price ?? 8.95;
    
    // 🔥 FIX: Look up preset in dynamic data (proteinTypes) instead of hardcoded list
    const preset = dynamicPresets.find(p => p.name === presetName);
    
    if (!preset) {
      console.warn(`Preset "${presetName}" not found in dynamic presets`);
      return;
    }
    
    // For food items, find the actual protein type to get the ID
    let proteinTypeId: string | null = null;
    if (presetCategory === 'food') {
      const proteinType = proteinTypes.find(p => p.name === presetName);
      proteinTypeId = proteinType?.id || null;
    }
    
    // 🎯 Generate full variant display name
    const fullVariantName = generateVariantDisplayName(baseItemName, preset.name);
    
    // Create variant with dynamic pricing from protein_types table
    const newVariant: Partial<ItemVariant> = {
      id: generateVariantId(),
      name: preset.name,
      variant_name: fullVariantName, // ✅ Set the auto-generated display name
      protein_type_id: proteinTypeId,
      price: basePrice + preset.defaultMarkup,
      price_dine_in: basePrice + preset.defaultMarkup,
      price_delivery: basePrice + preset.defaultMarkup + 1.00, // +£1 for delivery
      is_default: variants.length === 0, // First variant is default
      order: variants.length,
      // Initialize dietary fields
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_halal: false,
      is_dairy_free: false,
      is_nut_free: false,
      // Initialize featured field
      featured: false,
      // ✅ Initialize food settings fields
      spice_level: null,
      allergens: [],
      allergen_notes: '',
    };

    onChange([...variants, newVariant]);
  };

  /**
   * Update a specific field on a variant
   */
  const handleUpdateVariant = (
    index: number,
    field: keyof ItemVariant,
    value: string | number | boolean
  ) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    
    // 🎯 If name changed, regenerate variant_name
    if (field === 'name' && typeof value === 'string') {
      updated[index].variant_name = generateVariantDisplayName(baseItemName, value);
    }
    
    onChange(updated);
    setEditingCell(null);
  };

  /**
   * Delete a variant
   */
  const handleDeleteVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    
    // If we deleted the default, make the first one default
    if (updated.length > 0 && !updated.some(v => v.is_default)) {
      updated[0].is_default = true;
    }
    
    onChange(updated);
  };

  /**
   * Set a variant as default
   */
  const handleSetDefault = (index: number) => {
    const updated = variants.map((v, i) => ({
      ...v,
      is_default: i === index,
    }));
    onChange(updated);
  };

  /**
   * Apply a bulk action to all variants
   */
  const handleBulkAction = (action: BulkAction) => {
    const updated = applyBulkAction(variants, action);
    onChange(updated);
  };

  /**
   * Check for duplicate variant names
   */
  const getDuplicateIndices = (): Set<number> => {
    const duplicates = new Set<number>();
    const nameMap = new Map<string, number[]>();

    variants.forEach((v, index) => {
      if (!v.name) return;
      const name = v.name.toLowerCase().trim();
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(index);
    });

    nameMap.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((i) => duplicates.add(i));
      }
    });

    return duplicates;
  };

  const duplicateIndices = getDuplicateIndices();
  const hasVariants = variants.length > 0;
  const presets = getPresetsForItemType(presetCategory);
  
  // ✅ DYNAMIC PROTEIN PRESETS: Replace hardcoded presets with active proteins from database
  // For food items, use dynamic protein types; for drinks/desserts, use hardcoded size presets
  const dynamicPresets = presetCategory === 'food' 
    ? proteinTypes
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
        .map(p => ({
          name: p.name,
          defaultMarkup: p.price_adjustment || 0,
          description: `${p.name} protein option`
        }))
    : presets; // Use hardcoded presets for drinks/desserts

  return (
    <div className="space-y-4">
      {/* Base Item Inheritance Notice */}
      <Alert className="border-purple-500/30 bg-purple-900/10">
        <Info className="h-4 w-4 text-purple-400" />
        <AlertDescription>
          <strong className="text-purple-300">Base Item:</strong>{' '}
          <span className="text-gray-300">{baseItemName || 'Untitled Item'}</span>
          <br />
          <span className="text-sm text-gray-400">
            All variants inherit description, images, and dietary settings from the base item.
            Only name and pricing vary per variant.
          </span>
        </AlertDescription>
      </Alert>

      {/* Validation Warnings */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-900/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Validation Issues:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {validationErrors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Toolbar */}
      {hasVariants && (
        <div className="flex items-center justify-between">
          <VariantBulkActions
            onBulkUpdate={handleBulkAction}
            disabled={disabled}
            variantCount={variants.length}
          />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
            </Badge>
            <Button
              onClick={handleAddVariant}
              size="sm"
              disabled={disabled}
              variant="outline"
              className="hover:bg-green-500/10 hover:border-green-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>
          </div>
        </div>
      )}

      {/* ✅ NEW: Quick Add Protein Preset Buttons (shown when variants exist) */}
      {hasVariants && showPresets && dynamicPresets.length > 0 && (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/30">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="h-4 w-4 text-purple-400" />
            <h4 className="text-sm font-medium text-gray-300">Quick Add Protein Variants</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {dynamicPresets.map((preset) => (
              <Button
                key={preset.name}
                onClick={() => handleAddPresetVariant(preset.name)}
                size="sm"
                variant="outline"
                disabled={disabled}
                className="hover:bg-purple-500/10 hover:border-purple-500"
              >
                {preset.name}
                {preset.defaultMarkup && preset.defaultMarkup !== 0 
                  ? ` (+£${preset.defaultMarkup.toFixed(2)})` 
                  : ''}
              </Button>
            ))}
            <Button
              onClick={handleAddVariant}
              size="sm"
              variant="outline"
              disabled={disabled}
              className="hover:bg-blue-500/10 hover:border-blue-500"
            >
              <Plus className="mr-2 h-3 w-3" />
              Custom Variant
            </Button>
          </div>
        </div>
      )}

      {/* Editable Grid */}
      {hasVariants && (
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-900/50">
                  <TableHead className="w-12">{/* Drag handle */}</TableHead>
                  <TableHead className="min-w-[200px]">
                    Variant Name
                    {duplicateIndices.size > 0 && (
                      <span className="ml-2 text-xs text-red-400">
                        (duplicates detected)
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="text-center">Dine-In</TableHead>
                  <TableHead className="text-center">Takeaway</TableHead>
                  <TableHead className="text-center">Delivery</TableHead>
                  <TableHead className="w-16 text-center">Veg</TableHead>
                  <TableHead className="w-16 text-center">Vegan</TableHead>
                  <TableHead className="w-16 text-center">GF</TableHead>
                  <TableHead className="w-16 text-center">Halal</TableHead>
                  <TableHead className="w-16 text-center">DF</TableHead>
                  <TableHead className="w-16 text-center">NF</TableHead>
                  <TableHead className="min-w-[120px] text-center">Spice Level</TableHead>
                  <TableHead className="min-w-[200px] text-center">Allergens</TableHead>
                  <TableHead className="min-w-[150px] text-center">Allergen Notes</TableHead>
                  <TableHead className="w-24 text-center">Prep (min)</TableHead>
                  <TableHead className="w-16 text-center">★</TableHead>
                  <TableHead className="w-24 text-center">Default</TableHead>
                  <TableHead className="w-12">{/* Actions */}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <SortableContext
                  items={variants.map((v) => v.id || '')}
                  strategy={verticalListSortingStrategy}
                >
                  {variants.map((variant, index) => (
                    <SortableVariantRow
                      key={variant.id || `variant-${index}`}
                      variant={variant}
                      index={index}
                      editingCell={editingCell}
                      onEdit={(row, col) => setEditingCell({ row, col })}
                      onUpdate={(field, value) =>
                        handleUpdateVariant(index, field, value)
                      }
                      onDelete={() => handleDeleteVariant(index)}
                      onSetDefault={() => handleSetDefault(index)}
                      isDuplicate={duplicateIndices.has(index)}
                      defaultVariantId={variants.find(v => v.is_default)?.id}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {/* Empty State with Preset Buttons */}
      {!hasVariants && showPresets && (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <div className="mb-4">
            <Plus className="h-12 w-12 mx-auto text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No variants yet
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Get started quickly with protein presets or add a custom variant
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {dynamicPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handleAddPresetVariant(preset.name)}
                disabled={disabled}
                className="hover:bg-purple-500/10 hover:border-purple-500"
              >
                <Plus className="mr-1 h-3 w-3" />
                {preset.name}
                {preset.defaultMarkup !== 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({preset.defaultMarkup > 0 ? '+' : ''}£
                    {preset.defaultMarkup.toFixed(2)})
                  </span>
                )}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleAddVariant}
            disabled={disabled}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Variant
          </Button>
        </div>
      )}

      {/* Empty State without Presets */}
      {!hasVariants && !showPresets && (
        <div className="text-center py-12">
          <Button onClick={handleAddVariant} disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Variant
          </Button>
        </div>
      )}

      {/* Success State */}
      {hasVariants && validationErrors.length === 0 && (
        <Alert className="border-green-500/30 bg-green-900/10">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-sm text-gray-300">
            All variants are valid and ready to save
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

VariantTableEditor.displayName = 'VariantTableEditor';
