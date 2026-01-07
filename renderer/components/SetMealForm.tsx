import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X, Save, Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { SetMeal, SetMealItem } from '../utils/menuTypes';
import { globalColors } from '../utils/QSAIDesign';
import { formatCurrency } from '../utils/formatUtils';
import MediaSelector from './MediaSelector';
import SetMealItemSelector from './SetMealItemSelector';
import { MediaItem } from '../utils/mediaLibraryUtils';
import { OptimizedImage } from 'components/OptimizedImage';

interface SetMealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingSetMeal?: SetMeal | null;
}

interface SetMealFormData {
  name: string;
  description: string;
  hero_image_url: string;
  hero_image_asset_id: string;
  set_price: number;
  active: boolean;
  items: SetMealItem[];
}

const SetMealForm: React.FC<SetMealFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSetMeal
}) => {
  const [formData, setFormData] = useState<SetMealFormData>({
    name: '',
    description: '',
    hero_image_url: '',
    hero_image_asset_id: '',
    set_price: 0,
    active: true,
    items: []
  });
  
  const [saving, setSaving] = useState(false);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [itemSelectorOpen, setItemSelectorOpen] = useState(false);
  const [individualTotal, setIndividualTotal] = useState(0);

  // Initialize form data when editing
  useEffect(() => {
    if (editingSetMeal) {
      setFormData({
        name: editingSetMeal.name,
        description: editingSetMeal.description || '',
        hero_image_url: editingSetMeal.hero_image_url || '',
        hero_image_asset_id: editingSetMeal.hero_image_asset_id || '',
        set_price: editingSetMeal.set_price,
        active: editingSetMeal.active,
        items: editingSetMeal.items || []
      });
    } else {
      // Reset form for new set meal
      setFormData({
        name: '',
        description: '',
        hero_image_url: '',
        hero_image_asset_id: '',
        set_price: 0,
        active: true,
        items: []
      });
    }
  }, [editingSetMeal]);

  // Calculate individual items total when items change
  useEffect(() => {
    const calculateTotal = async () => {
      if (formData.items.length === 0) {
        setIndividualTotal(0);
        return;
      }

      try {
        // Get menu items to calculate prices
        const response = await apiClient.get_menu_items();
        
        if (response.ok) {
          const data = await response.json();
          const menuItems = data.data || [];
          
          const total = formData.items.reduce((sum, item) => {
            const menuItem = menuItems.find((mi: any) => mi.id === item.menu_item_id);
            return sum + (menuItem?.price || 0) * item.quantity;
          }, 0);
          
          setIndividualTotal(total);
        }
      } catch (error) {
        console.error('Error calculating individual total:', error);
      }
    };

    calculateTotal();
  }, [formData.items]);

  // Handle form field changes
  const handleChange = (field: keyof SetMealFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle media selection
  const handleMediaSelect = (media: MediaItem) => {
    handleChange('hero_image_url', media.url);
    handleChange('hero_image_asset_id', media.id || '');
    setMediaSelectorOpen(false);
    toast.success('Hero image selected');
  };

  // Remove hero image
  const handleRemoveImage = () => {
    handleChange('hero_image_url', '');
    handleChange('hero_image_asset_id', '');
    toast.success('Hero image removed');
  };

  // Handle items selection
  const handleItemsChange = (items: SetMealItem[]) => {
    handleChange('items', items);
  };

  // Validate form
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.set_price > 0 &&
      formData.items.length > 0
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields and add at least one menu item');
      return;
    }

    try {
      setSaving(true);
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        hero_image_url: formData.hero_image_url,
        hero_image_asset_id: formData.hero_image_asset_id || undefined,
        set_price: formData.set_price,
        active: formData.active,
        items: formData.items
      };

      if (editingSetMeal) {
        // Update existing set meal
        const response = await apiClient.update_set_meal(
          { id: editingSetMeal.id },
          submitData
        );
        
        if (response.ok) {
          toast.success('Set meal updated successfully!');
          onSave();
        } else {
          toast.error('Failed to update set meal');
        }
      } else {
        // Create new set meal
        const response = await apiClient.create_set_meal(submitData);
        
        if (response.ok) {
          toast.success('Set meal created successfully!');
          onSave();
        } else {
          toast.error('Failed to create set meal');
        }
      }
    } catch (error) {
      console.error('Error saving set meal:', error);
      toast.error('Failed to save set meal');
    } finally {
      setSaving(false);
    }
  };

  // Calculate savings
  const savings = individualTotal > formData.set_price ? individualTotal - formData.set_price : 0;
  const savingsPercentage = individualTotal > 0 ? (savings / individualTotal) * 100 : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto border-white/10 backdrop-blur-md"
          style={{ background: '#1E1E1E' }}
        >
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              ✨ {editingSetMeal ? 'Edit Set Meal' : 'Create New Set Meal'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 pt-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                📋 Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 text-sm font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Vegetarian Delight"
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-300 text-sm font-medium">Set Price (£) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.set_price}
                    onChange={(e) => handleChange('set_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300 text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what's included in this set meal..."
                  rows={3}
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-black/10 rounded-lg border border-white/5">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleChange('active', checked)}
                  className="data-[state=checked]:bg-purple-600"
                />
                <Label htmlFor="active" className="text-gray-300 text-sm font-medium cursor-pointer">
                  Active (visible to customers)
                </Label>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Hero Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                🖼️ Hero Image
              </h3>
              
              {formData.hero_image_url ? (
                <div className="relative group">
                  <OptimizedImage
                    fallbackUrl={formData.hero_image_url}
                    variant="widescreen"
                    alt="Hero image preview"
                    className="w-full h-48 object-cover rounded-lg border border-white/10 group-hover:border-white/20 transition-colors"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 h-8 w-8 p-0 bg-red-900/80 border-red-600 text-red-300 hover:bg-red-900 backdrop-blur-sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="w-full h-48 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-white/30 transition-colors bg-black/10"
                  onClick={() => setMediaSelectorOpen(true)}
                >
                  <div className="text-center text-gray-400">
                    <ImagePlus className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm">Click to select hero image</p>
                    <p className="text-xs text-gray-600 mt-1">Optional but recommended</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => setMediaSelectorOpen(true)}
                className="border-white/20 text-gray-300 hover:bg-white/5 hover:border-white/30"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {formData.hero_image_url ? 'Change Image' : 'Select Image'}
              </Button>
            </div>

            <Separator className="bg-white/10" />

            {/* Menu Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  🍽️ Menu Items *
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setItemSelectorOpen(true)}
                  className="border-purple-600/50 text-purple-300 hover:bg-purple-600/10 hover:border-purple-500"
                >
                  {formData.items.length > 0 ? 'Modify Items' : 'Select Items'}
                </Button>
              </div>
              
              {formData.items.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-white/20 rounded-lg bg-black/5">
                  <div className="text-gray-400">
                    <p className="text-sm mb-2">No items selected</p>
                    <p className="text-xs text-gray-500">Click "Select Items" to add menu items to this set meal</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={`${item.menu_item_id}-${index}`} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-white font-medium">{item.menu_item_name || `Item ${item.menu_item_id}`}</span>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-gray-300 bg-black/20">
                        Qty: {item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Summary */}
            {formData.items.length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    💰 Pricing Summary
                  </h3>
                  
                  <div className="bg-black/20 border border-white/10 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Individual Items Total:</span>
                      <span className="text-white font-medium">{formatCurrency(individualTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Set Meal Price:</span>
                      <span className="text-white font-semibold text-lg">{formatCurrency(formData.set_price)}</span>
                    </div>
                    {savings > 0 && (
                      <>
                        <Separator className="bg-white/10" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Customer Saves:</span>
                          <span className="text-green-400 font-semibold">{formatCurrency(savings)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Savings Percentage:</span>
                          <span className="text-green-400 font-semibold">{savingsPercentage.toFixed(1)}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="border-white/20 text-gray-300 hover:bg-white/5 hover:border-white/30"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !isFormValid()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium border-purple-600 hover:border-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingSetMeal ? 'Update Set Meal' : 'Create Set Meal'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={mediaSelectorOpen}
        onClose={() => setMediaSelectorOpen(false)}
        onSelectMedia={handleMediaSelect}
        mediaType="image"
        aspectRatio="any"
        title="Select Set Meal Hero Image"
        showUploadTab={true}
        uploadUsage="set-meal"
      />

      {/* Item Selector Modal */}
      <SetMealItemSelector
        isOpen={itemSelectorOpen}
        onClose={() => setItemSelectorOpen(false)}
        selectedItems={formData.items}
        onItemsChange={handleItemsChange}
      />
    </>
  );
};

export default SetMealForm;
