

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Wine, Beer, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors } from '../utils/designSystem';
import { CustomServingSizeResponse, CustomServingSizeCreate, CustomServingSizeUpdate } from 'types';

interface Props {
  onServingSizeChange?: () => void;
}

export default function CustomServingSizesManager({ onServingSizeChange }: Props) {
  const [servingSizes, setServingSizes] = useState<CustomServingSizeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<CustomServingSizeResponse | null>(null);
  const [formData, setFormData] = useState({ name: '', volume: '', category: 'Glass' });

  const categories = [
    { value: 'Glass', label: '🍷 Glass', color: 'purple' },
    { value: 'Bottle', label: '🍾 Bottle', color: 'blue' },
    { value: 'Pint', label: '🍺 Pint', color: 'amber' },
    { value: 'Carafe', label: '🍷 Carafe', color: 'purple' },
    { value: 'Magnum', label: '🍾 Magnum', color: 'emerald' },
    { value: 'Custom', label: '🥤 Custom', color: 'gray' }
  ];

  const loadServingSizes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.list_custom_serving_sizes({});
      const data = await response.json();
      setServingSizes(data);
    } catch (error) {
      console.error('Failed to load serving sizes:', error);
      toast.error('Failed to load serving sizes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServingSizes();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.volume.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const createData: CustomServingSizeCreate = {
        name: formData.name.trim(),
        volume: formData.volume.trim(),
        category: formData.category,
        restaurant_id: 'cottage_tandoori', // TODO: Get from context
        is_default: false
      };

      const response = await apiClient.create_custom_serving_size(createData);
      const data = await response.json();
      
      setServingSizes(prev => [...prev, data]);
      setFormData({ name: '', volume: '', category: 'Glass' });
      setIsCreateDialogOpen(false);
      toast.success(`Created custom serving size: ${data.name}`);
      
      if (onServingSizeChange) {
        onServingSizeChange();
      }
    } catch (error) {
      console.error('Failed to create serving size:', error);
      toast.error('Failed to create serving size');
    }
  };

  const handleEdit = async () => {
    if (!editingSize || !formData.name.trim() || !formData.volume.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const updateData: CustomServingSizeUpdate = {
        name: formData.name.trim(),
        volume: formData.volume.trim(),
        category: formData.category
      };

      const response = await apiClient.update_custom_serving_size(
        { servingSizeId: editingSize.id }, 
        updateData
      );
      const data = await response.json();
      
      setServingSizes(prev => prev.map(size => 
        size.id === editingSize.id ? data : size
      ));
      setEditingSize(null);
      setFormData({ name: '', volume: '', category: 'Glass' });
      setIsEditDialogOpen(false);
      toast.success(`Updated serving size: ${data.name}`);
      
      if (onServingSizeChange) {
        onServingSizeChange();
      }
    } catch (error) {
      console.error('Failed to update serving size:', error);
      toast.error('Failed to update serving size');
    }
  };

  const handleDelete = async (size: CustomServingSizeResponse) => {
    if (size.is_default) {
      toast.error('Cannot delete system default serving sizes');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${size.name}"?`)) {
      return;
    }

    try {
      await apiClient.delete_custom_serving_size({ servingSizeId: size.id });
      setServingSizes(prev => prev.filter(s => s.id !== size.id));
      toast.success(`Deleted serving size: ${size.name}`);
      
      if (onServingSizeChange) {
        onServingSizeChange();
      }
    } catch (error) {
      console.error('Failed to delete serving size:', error);
      toast.error('Failed to delete serving size');
    }
  };

  const startEdit = (size: CustomServingSizeResponse) => {
    if (size.is_default) {
      toast.error('Cannot edit system default serving sizes');
      return;
    }
    
    setEditingSize(size);
    setFormData({
      name: size.name,
      volume: size.volume,
      category: size.category
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Glass': case 'Carafe': return '🍷';
      case 'Bottle': case 'Magnum': return '🍾';
      case 'Pint': return '🍺';
      default: return '🥤';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Serving Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading serving sizes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Wine className="w-5 h-5" />
            <span>Custom Serving Sizes</span>
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Custom Size</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Serving Size</DialogTitle>
                <DialogDescription>
                  Create a new custom serving size for drinks and wine items.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Large Glass"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume *</Label>
                  <Input
                    id="volume"
                    placeholder="e.g., 500ml"
                    value={formData.volume}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
                      setIsCreateDialogOpen(false);
                      setFormData({ name: '', volume: '', category: 'Glass' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    Create Serving Size
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Manage custom serving sizes for drinks & wine items. System default sizes cannot be edited or deleted.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servingSizes.map((size) => (
            <div 
              key={size.id} 
              className={`p-4 border rounded-lg space-y-3 ${
                size.is_default 
                  ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700' 
                  : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(size.category)}</span>
                  <div>
                    <div className="font-medium text-sm">{size.name}</div>
                    <div className="text-xs text-gray-500">{size.volume}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      size.is_default 
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' 
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                    }`}
                  >
                    {size.is_default ? 'DEFAULT' : 'CUSTOM'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {size.category}
                </Badge>
              </div>
              
              {!size.is_default && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(size)}
                    className="flex-1 flex items-center space-x-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(size)}
                    className="flex-1 flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {servingSizes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Wine className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No serving sizes found.</p>
            <p className="text-sm">Add your first custom serving size to get started.</p>
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Serving Size</DialogTitle>
              <DialogDescription>
                Update the details of the selected serving size.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Large Glass"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-volume">Volume *</Label>
                <Input
                  id="edit-volume"
                  placeholder="e.g., 500ml"
                  value={formData.volume}
                  onChange={(e) => setFormData(prev => ({ ...prev, volume: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
                    setIsEditDialogOpen(false);
                    setEditingSize(null);
                    setFormData({ name: '', volume: '', category: 'Glass' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEdit}>
                  Update Serving Size
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
