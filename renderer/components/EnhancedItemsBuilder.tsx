import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Minus,
  Trash2,
  Edit3,
  ChefHat,
  Utensils,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
  customizations: Customization[];
  addOns: AddOn[];
  instructions: string;
  total: number;
}

interface Customization {
  id: string;
  name: string;
  type: 'spice' | 'cooking' | 'special';
  price: number;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface EnhancedItemsBuilderProps {
  items: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

// Predefined customization options
const SPICE_LEVELS = [
  { id: 'mild', name: 'Mild', price: 0 },
  { id: 'medium', name: 'Medium', price: 0 },
  { id: 'hot', name: 'Hot', price: 0 },
  { id: 'extra-hot', name: 'Extra Hot', price: 0.50 }
];

const COOKING_PREFERENCES = [
  { id: 'well-done', name: 'Well Done', price: 0 },
  { id: 'medium', name: 'Medium', price: 0 },
  { id: 'rare', name: 'Rare', price: 0 },
  { id: 'extra-crispy', name: 'Extra Crispy', price: 0.50 }
];

const COMMON_ADDONS = [
  { id: 'extra-rice', name: 'Extra Rice', price: 2.50 },
  { id: 'extra-naan', name: 'Extra Naan', price: 3.00 },
  { id: 'extra-sauce', name: 'Extra Sauce', price: 1.50 },
  { id: 'extra-onions', name: 'Extra Onions', price: 1.00 },
  { id: 'side-salad', name: 'Side Salad', price: 3.50 },
  { id: 'pickles', name: 'Pickles & Chutneys', price: 2.00 }
];

const EnhancedItemsBuilder: React.FC<EnhancedItemsBuilderProps> = ({
  items,
  onItemsChange
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  
  const createNewItem = (): OrderItem => {
    return {
      id: `item_${Date.now()}`,
      name: newItemName || 'New Item',
      basePrice: parseFloat(newItemPrice) || 0,
      quantity: 1,
      customizations: [],
      addOns: [],
      instructions: '',
      total: parseFloat(newItemPrice) || 0
    };
  };
  
  const addItem = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    
    if (!newItemPrice || parseFloat(newItemPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    const newItem = createNewItem();
    onItemsChange([...items, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    toast.success('Item added successfully');
  };
  
  const removeItem = (itemId: string) => {
    onItemsChange(items.filter(item => item.id !== itemId));
    toast.success('Item removed');
  };
  
  const updateItem = (itemId: string, updates: Partial<OrderItem>) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        // Recalculate total
        const customizationTotal = updatedItem.customizations.reduce((sum, c) => sum + c.price, 0);
        const addOnTotal = updatedItem.addOns.reduce((sum, a) => sum + a.price, 0);
        updatedItem.total = (updatedItem.basePrice + customizationTotal + addOnTotal) * updatedItem.quantity;
        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };
  
  const addCustomization = (itemId: string, customization: Customization) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    // Remove existing customization of same type for spice/cooking
    let updatedCustomizations = item.customizations;
    if (customization.type === 'spice' || customization.type === 'cooking') {
      updatedCustomizations = updatedCustomizations.filter(c => c.type !== customization.type);
    }
    
    updateItem(itemId, {
      customizations: [...updatedCustomizations, customization]
    });
  };
  
  const removeCustomization = (itemId: string, customizationId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    updateItem(itemId, {
      customizations: item.customizations.filter(c => c.id !== customizationId)
    });
  };
  
  const addAddOn = (itemId: string, addOn: AddOn) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    // Check if addon already exists
    if (item.addOns.some(a => a.id === addOn.id)) {
      toast.error('Add-on already added');
      return;
    }
    
    updateItem(itemId, {
      addOns: [...item.addOns, addOn]
    });
  };
  
  const removeAddOn = (itemId: string, addOnId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    updateItem(itemId, {
      addOns: item.addOns.filter(a => a.id !== addOnId)
    });
  };
  
  return (
    <div className="space-y-6">
      
      {/* Add New Item */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add New Item
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="text-gray-300">Item Name</Label>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g., Chicken Tikka Masala"
              />
            </div>
            <div>
              <Label className="text-gray-300">Base Price (£)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="12.95"
              />
            </div>
          </div>
          <Button
            onClick={addItem}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>
      
      {/* Items List */}
      {items.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-12 text-center">
            <ChefHat className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No items added yet</p>
            <p className="text-sm text-gray-500 mt-2">Add your first item above to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={item.id} className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center">
                    <Utensils className="h-5 w-5 mr-2" />
                    {item.name}
                    <Badge variant="outline" className="ml-2 border-green-500 text-green-400">
                      £{item.total.toFixed(2)}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                      className="border-gray-600 text-gray-400"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Basic Item Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-300">Quantity</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        className="border-gray-600 text-gray-400 h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-white font-semibold min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                        className="border-gray-600 text-gray-400 h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-gray-300">Base Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.basePrice}
                      onChange={(e) => updateItem(item.id, { basePrice: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <div className="text-gray-300 text-sm">Item Total</div>
                    <div className="text-lg font-bold text-green-400">£{item.total.toFixed(2)}</div>
                  </div>
                </div>
                
                {editingItem === item.id && (
                  <div className="space-y-4 border-t border-gray-700 pt-4">
                    
                    {/* Spice Level */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Spice Level</Label>
                      <div className="flex flex-wrap gap-2">
                        {SPICE_LEVELS.map(spice => {
                          const isSelected = item.customizations.some(c => c.id === spice.id);
                          return (
                            <Button
                              key={spice.id}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  removeCustomization(item.id, spice.id);
                                } else {
                                  addCustomization(item.id, {
                                    ...spice,
                                    type: 'spice'
                                  });
                                }
                              }}
                              className={isSelected ? 
                                "bg-orange-600 hover:bg-orange-700" : 
                                "border-orange-600 text-orange-400 hover:bg-orange-600/10"
                              }
                            >
                              {spice.name}
                              {spice.price > 0 && ` (+£${spice.price.toFixed(2)})`}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Cooking Preference */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Cooking Preference</Label>
                      <div className="flex flex-wrap gap-2">
                        {COOKING_PREFERENCES.map(cooking => {
                          const isSelected = item.customizations.some(c => c.id === cooking.id);
                          return (
                            <Button
                              key={cooking.id}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  removeCustomization(item.id, cooking.id);
                                } else {
                                  addCustomization(item.id, {
                                    ...cooking,
                                    type: 'cooking'
                                  });
                                }
                              }}
                              className={isSelected ? 
                                "bg-blue-600 hover:bg-blue-700" : 
                                "border-blue-600 text-blue-400 hover:bg-blue-600/10"
                              }
                            >
                              {cooking.name}
                              {cooking.price > 0 && ` (+£${cooking.price.toFixed(2)})`}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Add-ons */}
                    <div>
                      <Label className="text-gray-300 mb-2 block">Add-ons</Label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_ADDONS.map(addon => {
                          const isSelected = item.addOns.some(a => a.id === addon.id);
                          return (
                            <Button
                              key={addon.id}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  removeAddOn(item.id, addon.id);
                                } else {
                                  addAddOn(item.id, addon);
                                }
                              }}
                              className={isSelected ? 
                                "bg-green-600 hover:bg-green-700" : 
                                "border-green-600 text-green-400 hover:bg-green-600/10"
                              }
                            >
                              {addon.name} (+£{addon.price.toFixed(2)})
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Special Instructions */}
                    <div>
                      <Label className="text-gray-300">Special Instructions</Label>
                      <Textarea
                        value={item.instructions}
                        onChange={(e) => updateItem(item.id, { instructions: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                        placeholder="e.g., No onions, extra sauce..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
                
                {/* Summary */}
                {(item.customizations.length > 0 || item.addOns.length > 0 || item.instructions) && (
                  <div className="bg-gray-800 p-3 rounded-lg text-sm">
                    <div className="text-gray-400 mb-2">Order Summary:</div>
                    
                    {item.customizations.length > 0 && (
                      <div className="text-gray-300">
                        <span className="font-semibold">Customizations:</span>
                        {item.customizations.map(c => (
                          <span key={c.id} className="ml-2">
                            {c.name}{c.price > 0 && ` (+£${c.price.toFixed(2)})`}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {item.addOns.length > 0 && (
                      <div className="text-gray-300">
                        <span className="font-semibold">Add-ons:</span>
                        {item.addOns.map(a => (
                          <span key={a.id} className="ml-2">
                            {a.name} (+£{a.price.toFixed(2)})
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {item.instructions && (
                      <div className="text-gray-300">
                        <span className="font-semibold">Instructions:</span>
                        <span className="ml-2 italic">{item.instructions}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Summary */}
      {items.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Items Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-300">
                Total Items: {items.length} | Total Quantity: {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
              <span className="text-green-400 font-bold">
                £{items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedItemsBuilder;
