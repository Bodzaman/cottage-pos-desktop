/**
 * MenuItemFormExample Component
 *
 * Example implementation showing how to use the extracted hooks
 * for building menu item forms. This is a reference implementation
 * for future wizard-style forms.
 *
 * Demonstrates:
 * - useFormDraft for auto-save functionality
 * - useMenuItemForm for form state management
 * - Proper integration patterns
 *
 * NOTE: This is an example/reference, not meant for production use.
 * The production MenuItemForm.tsx handles additional edge cases.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Save, X, Clock } from 'lucide-react';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useMenuItemForm } from '../../hooks/useMenuItemForm';
import type { MenuItemFormData, MenuCategory, ProteinType } from '../../utils/masterTypes';
import { toast } from 'sonner';

interface MenuItemFormExampleProps {
  /** Existing item to edit (undefined for create) */
  initialData?: MenuItemFormData;
  /** Available categories */
  categories?: MenuCategory[];
  /** Available proteins */
  proteinTypes?: ProteinType[];
  /** Callback after successful save */
  onSuccess?: () => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
}

/**
 * Example form using the extracted hooks
 */
export function MenuItemFormExample({
  initialData,
  categories = [],
  proteinTypes = [],
  onSuccess,
  onCancel
}: MenuItemFormExampleProps) {
  const isEditing = !!initialData?.id;

  // Use the menu item form hook for form state
  const {
    form,
    variants,
    setVariants,
    isSubmitting,
    submitError,
    submit,
    resetForm
  } = useMenuItemForm({
    initialData,
    isEditing,
    categories,
    proteinTypes,
    onSuccess: () => {
      // Clear draft on successful save
      draft.clearDraft();
      onSuccess?.();
    }
  });

  const { register, formState: { errors, isDirty }, getValues } = form;

  // Use the draft hook for auto-save
  const draft = useFormDraft<Partial<MenuItemFormData>>({
    key: initialData?.id ? `menu-item-${initialData.id}` : 'menu-item-new',
    isDirty,
    getData: () => getValues(),
    setData: (data) => {
      // Restore form data
      Object.entries(data).forEach(([key, value]) => {
        form.setValue(key as keyof MenuItemFormData, value as any);
      });
    },
    getAdditionalData: () => ({ variants }),
    setAdditionalData: (data) => {
      if (data.variants) {
        setVariants(data.variants);
      }
    },
    disabled: isSubmitting
  });

  // Handle draft restore
  const handleRestoreDraft = () => {
    draft.restoreDraft();
    toast.success('Draft restored!');
  };

  // Handle draft discard
  const handleDiscardDraft = () => {
    draft.discardDraft();
    toast.info('Draft discarded');
  };

  return (
    <>
      {/* Draft Restore Dialog */}
      <Dialog open={draft.showRestoreDialog} onOpenChange={draft.closeRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Saved Draft?</DialogTitle>
            <DialogDescription>
              We found an unsaved draft from your previous session.
              Would you like to restore it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardDraft}>
              Discard
            </Button>
            <Button onClick={handleRestoreDraft}>
              Restore Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Edit Menu Item' : 'New Menu Item'}</span>
            {draft.lastAutosaveTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Draft saved {draft.lastAutosaveTime.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            {/* Error Display */}
            {submitError && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                {submitError}
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Chicken Tikka Masala"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Brief description of the dish"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Category *</Label>
              <select
                id="category_id"
                {...register('category_id')}
                className="w-full h-10 px-3 border rounded-md bg-background"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-sm text-red-500">{errors.category_id.message}</p>
              )}
            </div>

            {/* Price Field (simplified) */}
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Item
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

export default MenuItemFormExample;
