import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { UseFormRegister, UseFormWatch, FieldErrors } from 'react-hook-form';
import { useCustomServingSizes } from 'utils/useCustomServingSizes';
import { toast } from 'sonner';

interface ServingSizesSelectorProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  errors: FieldErrors<any>;
}

// Helper function to get category icon (moved to top to avoid hoisting issues)
const getCategoryIcon = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'glass': case 'carafe': return '🍷';
    case 'bottle': case 'magnum': return '🍾';
    case 'pint': return '🍺';
    default: return '🥤';
  }
};

export function ServingSizesSelector({ register, watch, errors }: ServingSizesSelectorProps) {
  const { allEnhancedSizes, loading, addCustomServingSize, refresh } = useCustomServingSizes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSizeForm, setNewSizeForm] = useState({ name: '', volume: '', category: 'Glass' });
  const [isAdding, setIsAdding] = useState(false);

  const categories = [
    { value: 'Glass', label: '🍷 Glass' },
    { value: 'Bottle', label: '🍾 Bottle' },
    { value: 'Pint', label: '🍺 Pint' },
    { value: 'Carafe', label: '🍷 Carafe' },
    { value: 'Magnum', label: '🍾 Magnum' },
    { value: 'Custom', label: '🥤 Custom' }
  ];

  const handleAddCustomSize = async () => {
    if (!newSizeForm.name.trim() || !newSizeForm.volume.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsAdding(true);
      await addCustomServingSize(newSizeForm.name, newSizeForm.volume, newSizeForm.category);
      setNewSizeForm({ name: '', volume: '', category: 'Glass' });
      setIsAddDialogOpen(false);
      refresh(); // Refresh the serving sizes list
    } catch (error) {
      console.error('Failed to add custom serving size:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const getCategoryTag = (size: any) => {
    if (size.is_default) {
      switch (size.category) {
        case 'Glass': return { label: 'Wine', color: 'purple' };
        case 'Bottle': return { label: 'UK Standard', color: 'blue' };
        case 'Pint': return { label: 'Beer/Cider', color: 'amber' };
        default: return { label: 'Standard', color: 'gray' };
      }
    } else {
      return { label: 'CUSTOM', color: 'green' };
    }
  };

  const getFieldName = (size: any) => {
    return size.is_default ? size.field_name : `custom_${size.id}`;
  };

  const getPriceFieldName = (size: any) => {
    return size.is_default ? `${size.field_name}_price` : `custom_${size.id}_price`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Label className="text-base font-semibold">Available Serving Sizes *</Label>
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">Required</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-500">Loading serving sizes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label className="text-base font-semibold">Available Serving Sizes *</Label>
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">Required</span>
        </div>
        
        {/* Add Custom Serving Size Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center space-x-2"
              style={{
                backgroundColor: '#1E1E1E',
                borderColor: 'rgba(91, 33, 182, 0.3)',
                color: '#F0F0F5'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Size</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Serving Size</DialogTitle>
              <DialogDescription>
                Create a custom serving size for your restaurant's specific needs.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Name *</Label>
                <Input
                  id="custom-name"
                  placeholder="e.g., Large Glass, Carafe"
                  value={newSizeForm.name}
                  onChange={(e) => setNewSizeForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-volume">Volume *</Label>
                <Input
                  id="custom-volume"
                  placeholder="e.g., 500ml, 1L"
                  value={newSizeForm.volume}
                  onChange={(e) => setNewSizeForm(prev => ({ ...prev, volume: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-category">Category *</Label>
                <Select
                  value={newSizeForm.category}
                  onValueChange={(value) => setNewSizeForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setNewSizeForm({ name: '', volume: '', category: 'Glass' });
                  }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCustomSize} disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add Serving Size'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Select at least one serving size available for this drink. Each size needs individual pricing.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allEnhancedSizes.map((size) => {
          const fieldName = getFieldName(size);
          const priceFieldName = getPriceFieldName(size);
          const categoryTag = getCategoryTag(size);
          const isSelected = watch(fieldName);
          
          return (
            <div 
              key={size.id} 
              className={`p-4 border rounded-lg space-y-3 ${size.color_class}`}
            >
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id={fieldName}
                  className="rounded" 
                  {...register(fieldName)}
                />
                <Label htmlFor={fieldName} className="text-sm font-medium flex items-center space-x-2">
                  <span>{size.icon}</span>
                  <span>{size.display_label}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      categoryTag.color === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50' :
                      categoryTag.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50' :
                      categoryTag.color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50' :
                      categoryTag.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/50' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-900/50'
                    }`}
                  >
                    {categoryTag.label}
                  </Badge>
                </Label>
              </div>
              {isSelected && (
                <div className="pl-8">
                  <Label htmlFor={priceFieldName} className="text-xs text-gray-600">Price (£)</Label>
                  <Input
                    id={priceFieldName}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={size.is_default ? getDefaultPlaceholder(size) : "0.00"}
                    className="mt-1 text-sm"
                    {...register(priceFieldName, { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Validation message for serving sizes */}
      <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="font-medium">💡 Note:</span> At least one serving size must be selected. Individual pricing is required for each selected size.
        {allEnhancedSizes.filter(s => !s.is_default).length > 0 && (
          <span className="block mt-1">🟢 Custom serving sizes are available alongside standard options.</span>
        )}
      </div>
    </div>
  );
}

// Helper function to get default placeholder prices
function getDefaultPlaceholder(size: any): string {
  switch (size.field_name) {
    case 'serving_size_125ml_glass': return '4.50';
    case 'serving_size_175ml_glass': return '6.50';
    case 'serving_size_250ml_glass': return '2.95';
    case 'serving_size_330ml_bottle': return '3.50';
    case 'serving_size_half_pint': return '2.75';
    case 'serving_size_pint': return '5.50';
    case 'serving_size_bottle': return '24.95';
    default: return '0.00';
  }
}
