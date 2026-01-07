import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  RefreshCw,
  Plus,
  Save,
  X,
  Trash2
} from "lucide-react";

import { colors } from "../utils/designSystem";
import { apiClient } from "app";
import { useQueryClient } from '@tanstack/react-query';
import { menuKeys } from '../utils/menuQueries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
interface CustomizationBase {
  id: string;
  name: string;
  price?: number;
  customization_group?: string;
  display_order: number;
  is_exclusive: boolean;
  is_active: boolean;
  show_on_pos: boolean;
  show_on_website: boolean;
  ai_voice_agent: boolean;
  is_global: boolean;
  item_ids?: string[];
}

interface CustomizationsTabProps {
  // No props needed - manages its own state
}

const CustomizationsTab: React.FC<CustomizationsTabProps> = () => {
  // All the customization state from the original component
  const [customizations, setCustomizations] = useState<CustomizationBase[]>([]);
  const [customizationSearchQuery, setCustomizationSearchQuery] = useState('');
  const [customizationFilter, setCustomizationFilter] = useState<'all' | 'pos' | 'website' | 'ai-voice'>('all');
  const [customizationGroupFilter, setCustomizationGroupFilter] = useState<string>('all');
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);
  const [customizationsInitialized, setCustomizationsInitialized] = useState(false);
  const [selectedCustomizationId, setSelectedCustomizationId] = useState<string | null>(null);
  
  // Add computed state variables for filtered and grouped customizations
  const [filteredCustomizations, setFilteredCustomizations] = useState<CustomizationBase[]>([]);
  const [groupedCustomizations, setGroupedCustomizations] = useState<Record<string, CustomizationBase[]>>({});
  
  // Add missing customization state variables
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [customizationForm, setCustomizationForm] = useState({
    id: "",
    name: "",
    price: 0,
    customization_group: "_none_",
    display_order: 0,
    is_exclusive: false,
    is_active: true,
    show_on_pos: true,
    show_on_website: false,
    ai_voice_agent: false,
    is_global: false,
    item_ids: [] as string[]
  });
  const [customizationGroups, setCustomizationGroups] = useState<string[]>([]);
  const [customizationViewMode, setCustomizationViewMode] = useState<'grid' | 'list'>('grid');

  const queryClient = useQueryClient();

  // Load customizations when component mounts
  useEffect(() => {
    if (!customizationsInitialized) {
      loadCustomizationsSimple();
    }
  }, [customizationsInitialized]);

  // Compute filtered and grouped customizations whenever dependencies change
  useEffect(() => {
    // Add null check to prevent undefined.filter() errors
    if (!customizations || !Array.isArray(customizations)) {
      setFilteredCustomizations([]);
      setGroupedCustomizations({});
      return;
    }
    
    const filtered = customizations.filter(customization => {
      const matchesSearch = customization.name.toLowerCase().includes(customizationSearchQuery.toLowerCase());
      const matchesVisibilityFilter = 
        customizationFilter === 'all' ||
        (customizationFilter === 'pos' && customization.show_on_pos) ||
        (customizationFilter === 'website' && customization.show_on_website);
      const matchesGroupFilter = 
        customizationGroupFilter === 'all' ||
        (customization.customization_group || 'general').toLowerCase() === customizationGroupFilter.toLowerCase();
      
      return matchesSearch && matchesVisibilityFilter && matchesGroupFilter;
    });
    
    const grouped = filtered.reduce((acc, customization) => {
      const group = customization.customization_group || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push(customization);
      return acc;
    }, {} as Record<string, CustomizationBase[]>);
    
    setFilteredCustomizations(filtered);
    setGroupedCustomizations(grouped);
  }, [customizations, customizationSearchQuery, customizationFilter, customizationGroupFilter]);

  const loadCustomizationsSimple = async () => {
    if (loadingCustomizations) return;
    
    setLoadingCustomizations(true);
    try {
      const customizationsResponse = await apiClient.get_customizations({});
      const customizationsData = await customizationsResponse.json();
      
      if (customizationsData && customizationsData.customizations) {
        const sortedCustomizations = [...customizationsData.customizations];
        sortedCustomizations.sort((a, b) => {
          if (a.customization_group !== b.customization_group) {
            return (a.customization_group || '').localeCompare(b.customization_group || '');
          }
          return (a.display_order || 0) - (b.display_order || 0);
        });
        
        setCustomizations(sortedCustomizations);
        
        const groups = [...new Set(
          sortedCustomizations
            .map(c => c.customization_group)
            .filter(g => g && g.trim())
        )];
        setCustomizationGroups(groups);
        
        setCustomizationsInitialized(true);
      } else {
        setCustomizations([]);
        setCustomizationGroups([]);
      }
    } catch (error) {
      console.error('Error loading customizations:', error);
      setCustomizations([]);
      setCustomizationGroups([]);
    } finally {
      setLoadingCustomizations(false);
    }
  };

  const resetCustomizationForm = () => {
    setCustomizationForm({
      id: "",
      name: "",
      price: 0,
      customization_group: "_none_",
      display_order: 0,
      is_exclusive: false,
      is_active: true,
      show_on_pos: true,
      show_on_website: false,
      ai_voice_agent: false,
      is_global: false,
      item_ids: []
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'spice level':
      case 'spice':
        return '🌶️';
      case 'dietary':
      case 'allergens':
        return '🥗';
      case 'extras':
      case 'add-ons':
      case 'additional':
        return '➕';
      case 'size':
      case 'portion':
        return '📏';
      case 'preparation':
      case 'cooking':
        return '👨‍🍳';
      case 'sauce':
      case 'dressing':
        return '🥄';
      case 'special instructions':
      case 'preferences':
      case 'notes':
        return '📝';
      case 'general':
      case '_none_':
        return '🏷️';
      default:
        return '🏷️';
    }
  };

  const handleSelectCustomization = (id: string) => {
    setSelectedCustomizationId(id);
    
    // Add null check to prevent undefined.find() errors
    if (!customizations || !Array.isArray(customizations)) {
      return;
    }
    
    const customization = customizations.find(c => c.id === id);
    
    if (customization) {
      let itemIds = customization.item_ids || [];
      if (customization.is_global) {
        itemIds = ['ALL'];
      }
      
      setCustomizationForm({
        id: customization.id,
        name: customization.name,
        price: customization.price || 0,
        customization_group: customization.customization_group === null ? '_none_' : (customization.customization_group || '_none_'),
        display_order: customization.display_order || 0,
        is_exclusive: customization.is_exclusive || false,
        is_active: customization.is_active,
        show_on_pos: customization.show_on_pos,
        show_on_website: customization.show_on_website,
        ai_voice_agent: customization.ai_voice_agent,
        is_global: customization.is_global,
        item_ids: itemIds
      });
    }
  };

  const createNewCustomization = () => {
    setSelectedCustomizationId(null);
    resetCustomizationForm();
  };

  const saveCustomization = async () => {
    try {
      const isUpdate = !!customizationForm.id;
      
      if (!customizationForm.name) {
        toast.error('Please enter a name for the customization');
        return;
      }
      
      const customizationGroup = customizationForm.customization_group === '_none_' ? null : customizationForm.customization_group || null;
      
      let itemIds = customizationForm.item_ids || [];
      let isGlobal = false;
      
      if (itemIds.includes('ALL')) {
        isGlobal = true;
        itemIds = [];
      }
      
      const customizationData = {
        name: customizationForm.name,
        price: customizationForm.price === 0 ? null : customizationForm.price,
        customization_group: customizationGroup,
        display_order: 0,
        is_exclusive: false,
        is_active: customizationForm.is_active,
        show_on_pos: customizationForm.show_on_pos,
        show_on_website: customizationForm.show_on_website,
        ai_voice_agent: customizationForm.ai_voice_agent,
        is_global: isGlobal,
        item_ids: itemIds
      };
      
      let response;
      if (isUpdate) {
        response = await apiClient.update_customization(
          { customizationId: customizationForm.id },
          customizationData
        );
      } else {
        response = await apiClient.create_customization(customizationData);
      }
      
      if (!response.ok) {
        throw new Error('Failed to save customization');
      }
      
      toast.success(`Customization ${isUpdate ? 'updated' : 'created'} successfully`);
      
      queryClient.invalidateQueries(menuKeys.customizations);
      loadCustomizationsSimple();
      
    } catch (error: any) {
      console.error('Error saving customization:', error.message);
      toast.error(`Failed to ${customizationForm.id ? 'update' : 'create'} customization`);
    }
  };

  const deleteCustomization = async () => {
    if (!customizationForm.id) return;
    
    if (!confirm('Are you sure you want to delete this customization?')) {
      return;
    }
    
    try {
      const response = await apiClient.delete_customization({
        customizationId: customizationForm.id
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete customization');
      }
      
      toast.success('Customization deleted successfully');
      
      queryClient.invalidateQueries(menuKeys.customizations);
      setSelectedCustomizationId(null);
      resetCustomizationForm();
      loadCustomizationsSimple();
      
    } catch (error: any) {
      console.error('Error deleting customization:', error.message);
      toast.error('Failed to delete customization');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Add-ons & Instructions</h2>
        <Button 
          onClick={createNewCustomization}
          className="bg-[#7C5DFA] hover:bg-[#6B4DEA] text-white border border-[#7C5DFA]/30 hover:border-[#7C5DFA]/50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customization
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Form */}
        <Card className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.4)] transition-colors">
          <CardHeader>
            <CardTitle className="text-white">Customization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <Label className="text-gray-200">Name *</Label>
              <Input
                value={customizationForm.name}
                onChange={(e) => setCustomizationForm({...customizationForm, name: e.target.value})}
                placeholder="I.e., Extra Spicy, Large Size"
                className="bg-[#2A2A2A] border-[#444] text-white placeholder:text-gray-400"
              />
            </div>

            {/* Price */}
            <div>
              <Label className="text-gray-200">Price (£)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={customizationForm.price}
                onChange={(e) => setCustomizationForm({...customizationForm, price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                className="bg-[#2A2A2A] border-[#444] text-white placeholder:text-gray-400"
              />
            </div>

            {/* Category/Group */}
            <div className="space-y-2">
              <Label className="text-gray-200">Category</Label>
              <Select
                value={customizationForm.customization_group === '_none_' ? '' : customizationForm.customization_group}
                onValueChange={(value) => setCustomizationForm({...customizationForm, customization_group: value || '_none_'})}
              >
                <SelectTrigger className="bg-[#2A2A2A] border-[#444] text-white">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#444]">
                  <SelectItem value="Add-ons" className="text-white hover:bg-[#3A3A3A]">Add-ons</SelectItem>
                  <SelectItem value="General" className="text-white hover:bg-[#3A3A3A]">General</SelectItem>
                  <SelectItem value="Dietary" className="text-white hover:bg-[#3A3A3A]">Dietary</SelectItem>
                  <SelectItem value="Spice Level" className="text-white hover:bg-[#3A3A3A]">Spice Level</SelectItem>
                  <SelectItem value="Preferences" className="text-white hover:bg-[#3A3A3A]">Preferences</SelectItem>
                  <SelectItem value="Preparations" className="text-white hover:bg-[#3A3A3A]">Preparations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Control */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-[rgba(124,93,250,0.1)] border border-[rgba(124,93,250,0.2)]">
                <div>
                  <Label className="text-white">Active</Label>
                  <p className="text-xs text-gray-400">Master toggle - controls overall availability</p>
                </div>
                <Switch 
                  checked={customizationForm.is_active}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      setCustomizationForm({
                        ...customizationForm, 
                        is_active: false,
                        show_on_pos: false,
                        show_on_website: false
                      });
                    } else {
                      setCustomizationForm({...customizationForm, is_active: true});
                    }
                  }}
                  className="data-[state=checked]:bg-[#7C5DFA]"
                />
              </div>

              {/* Visibility Controls */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  customizationForm.is_active 
                    ? 'bg-[rgba(124,93,250,0.05)] border-[rgba(124,93,250,0.1)]' 
                    : 'bg-[rgba(124,93,250,0.02)] border-[rgba(124,93,250,0.05)] opacity-50'
                }`}>
                  <div>
                    <Label className={customizationForm.is_active ? 'text-white' : 'text-gray-500'}>Restaurant (POS)</Label>
                    <p className="text-xs text-gray-400">Staff can see this</p>
                  </div>
                  <Switch 
                    checked={customizationForm.show_on_pos}
                    disabled={!customizationForm.is_active}
                    onCheckedChange={(checked) => {
                      const updates: any = { show_on_pos: checked };
                      if (checked && !customizationForm.is_active) {
                        updates.is_active = true;
                      }
                      setCustomizationForm({...customizationForm, ...updates});
                    }}
                    className="data-[state=checked]:bg-[#7C5DFA]"
                  />
                </div>
                
                <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  customizationForm.is_active 
                    ? 'bg-[rgba(10,154,146,0.05)] border-[rgba(10,154,146,0.1)]' 
                    : 'bg-[rgba(124,93,250,0.02)] border-[rgba(124,93,250,0.05)] opacity-50'
                }`}>
                  <div>
                    <Label className={customizationForm.is_active ? 'text-white' : 'text-gray-500'}>Online Ordering</Label>
                    <p className="text-xs text-gray-400">Customers can see this</p>
                  </div>
                  <Switch 
                    checked={customizationForm.show_on_website}
                    disabled={!customizationForm.is_active}
                    onCheckedChange={(checked) => {
                      const updates: any = { show_on_website: checked };
                      if (checked && !customizationForm.is_active) {
                        updates.is_active = true;
                      }
                      setCustomizationForm({...customizationForm, ...updates});
                    }}
                    className="data-[state=checked]:bg-[#0A6A92]"
                  />
                </div>
                
                <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  customizationForm.is_active 
                    ? 'bg-[rgba(255,159,28,0.05)] border-[rgba(255,159,28,0.1)]' 
                    : 'bg-[rgba(124,93,250,0.02)] border-[rgba(124,93,250,0.05)] opacity-50'
                }`}>
                  <div>
                    <Label className={customizationForm.is_active ? 'text-white' : 'text-gray-500'}>AI Voice Agent</Label>
                    <p className="text-xs text-gray-400">Voice orders can request this</p>
                  </div>
                  <Switch 
                    checked={customizationForm.ai_voice_agent}
                    disabled={!customizationForm.is_active}
                    onCheckedChange={(checked) => {
                      const updates: any = { ai_voice_agent: checked };
                      if (checked && !customizationForm.is_active) {
                        updates.is_active = true;
                      }
                      setCustomizationForm({...customizationForm, ...updates});
                    }}
                    className="data-[state=checked]:bg-[#FF9F1C]"
                  />
                </div>
              </div>
            </div>

            {/* Menu Item Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#7C5DFA]">Menu Items</h3>
              
              <div className="p-4 rounded-lg bg-[rgba(124,93,250,0.05)] border border-[rgba(124,93,250,0.1)]">
                <div className="space-y-4">
                  {/* Quick Apply to All Option */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(10,154,146,0.05)] border border-[rgba(10,154,146,0.1)]">
                    <div className="text-xl">🌍</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>Apply to All Menu Items</div>
                      <div className="text-xs" style={{ color: colors.text.muted }}>Quick option - appears on every dish</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomizationForm({...customizationForm, item_ids: ['ALL']})}
                      className="border-[#0A6A92] text-[#0A9A92] hover:bg-[#0A9A92] hover:text-white"
                    >
                      Select All
                    </Button>
                  </div>
                  
                  {/* Selected Items Display */}
                  <div className="border-t border-[rgba(124,93,250,0.2)] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>Applied To:</span>
                      <span className="text-xs" style={{ color: colors.text.muted }}>
                        {customizationForm.item_ids.includes('ALL') ? 'All Items' : `${customizationForm.item_ids.length} specific item(s)`}
                      </span>
                    </div>
                    
                    {customizationForm.item_ids.includes('ALL') ? (
                      <div className="text-center py-4">
                        <div className="text-2xl mb-2">✅</div>
                        <p className="text-sm text-[#0A9A92] font-medium">Applied to All Menu Items</p>
                        <p className="text-xs" style={{ color: colors.text.muted }}>This add-on will appear on every dish</p>
                      </div>
                    ) : customizationForm.item_ids.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed border-[rgba(124,93,250,0.2)] rounded-lg">
                        <div className="text-2xl mb-2">🍽️</div>
                        <p style={{ color: colors.text.muted }} className="text-sm">No items selected</p>
                        <p className="text-xs" style={{ color: colors.text.muted }}>Use "Select All" or choose specific dishes</p>
                      </div>
                    ) : (
                      <div className="bg-[#161A2C] border border-[rgba(124,93,250,0.2)] rounded-md p-3">
                        <p className="text-sm" style={{ color: colors.text.muted }}>
                          ✅ Applied to {customizationForm.item_ids.length} specific menu item(s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-[rgba(124,93,250,0.15)]">
              <div className="space-y-4">
                <Button 
                  onClick={saveCustomization}
                  className="bg-[#7C5DFA] hover:bg-[#9277FF] text-white font-semibold px-6 py-3 w-full"
                  disabled={!customizationForm.name}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {customizationForm.id ? 'Update Add-on & Instruction' : 'Create Add-on & Instruction'}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={resetCustomizationForm}
                    className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:text-white hover:border-[rgba(124,93,250,0.5)]"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  
                  {customizationForm.id && (
                    <Button 
                      variant="destructive" 
                      onClick={deleteCustomization}
                      className="bg-red-800/80 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - List */}
        <Card className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.4)] transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Current Add-ons</CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredCustomizations?.length} items
              </Badge>
            </div>
            
            {/* Search and filters */}
            <div className="space-y-3">
              <Input
                placeholder="Search add-ons..."
                value={customizationSearchQuery}
                onChange={(e) => setCustomizationSearchQuery(e.target.value)}
                className="bg-[#2A2A2A] border-[#444] text-white"
              />
              
              <div className="flex gap-2">
                <Button
                  variant={customizationFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomizationFilter('all')}
                  className={customizationFilter === 'all' ? 'bg-[#7C5DFA]' : ''}
                >
                  All
                </Button>
                <Button
                  variant={customizationFilter === 'pos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomizationFilter('pos')}
                  className={customizationFilter === 'pos' ? 'bg-[#7C5DFA]' : ''}
                >
                  POS
                </Button>
                <Button
                  variant={customizationFilter === 'website' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomizationFilter('website')}
                  className={customizationFilter === 'website' ? 'bg-[#7C5DFA]' : ''}
                >
                  Website
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCustomizations ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.brand.purple }} />
                <p style={{ color: colors.text.secondary }}>Loading customizations...</p>
              </div>
            ) : filteredCustomizations?.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏷️</div>
                <h3 className="font-medium mb-1" style={{ color: colors.text.primary }}>
                  {(customizations?.length || 0) === 0 ? 'No Add-ons Created Yet' : 'No Matching Add-ons'}
                </h3>
                <p style={{ color: colors.text.secondary }} className="text-sm mb-4">
                  {(customizations?.length || 0) === 0 
                    ? 'Create your first add-on or special instruction to get started'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {(customizations?.length || 0) === 0 && (
                  <Button 
                    onClick={createNewCustomization}
                    className="bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Add-on
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedCustomizations).map(([group, items]) => (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getCategoryIcon(group)}</span>
                      <h4 className="font-medium" style={{ color: colors.text.primary }}>{group}</h4>
                      <Badge variant="outline" className="text-xs">{items.length}</Badge>
                    </div>
                    
                    <div className="space-y-1 ml-6">
                      {items.map((customization) => (
                        <div
                          key={customization.id}
                          onClick={() => handleSelectCustomization(customization.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedCustomizationId === customization.id
                              ? 'border-[#7C5DFA] bg-[rgba(124,93,250,0.1)]'
                              : 'border-[rgba(124,93,250,0.2)] bg-[rgba(124,93,250,0.05)] hover:border-[rgba(124,93,250,0.3)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium" style={{ color: colors.text.primary }}>
                                {customization.name}
                              </h5>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm" style={{ color: colors.text.secondary }}>
                                  {customization.price ? `£ ${customization.price.toFixed(2)}` : 'Free'}
                                </span>
                                <div className="flex gap-1">
                                  {customization.show_on_pos && (
                                    <Badge variant="outline" className="text-xs bg-[rgba(124,93,250,0.1)] border-[rgba(124,93,250,0.3)]">
                                      POS
                                    </Badge>
                                  )}
                                  {customization.show_on_website && (
                                    <Badge variant="outline" className="text-xs bg-[rgba(10,154,146,0.1)] border-[rgba(10,154,146,0.3)]">
                                      Website
                                    </Badge>
                                  )}
                                  {customization.is_global && (
                                    <Badge variant="outline" className="text-xs bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.3)]">
                                      All Items
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={customization.is_active}
                                size="sm"
                                className="data-[state=checked]:bg-[#7C5DFA]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomizationsTab;
