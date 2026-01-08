import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '../utils/supabaseClient';
import { ModifierSelection } from '../utils/menuTypes';

interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  selection_type: 'SINGLE' | 'MULTIPLE';
  is_required: boolean;
  menu_item_id: string;
  modifiers: Modifier[];
}

interface Modifier {
  id: string;
  name: string;
  price_adjustment: number;
  modifier_group_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  menuItemId: string;
  onSelectModifiers: (modifiers: ModifierSelection[]) => void;
  className?: string;
}

export function POSModifierSelector({ menuItemId, onSelectModifiers, className }: Props) {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch modifier groups and their modifiers for the menu item
  useEffect(() => {
    const fetchModifiers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch modifier groups for this menu item
        const { data: groupsData, error: groupsError } = await supabase
          .from('modifier_groups')
          .select('id, name, description, selection_type, is_required')
          .eq('menu_item_id', menuItemId);
          
        if (groupsError) throw groupsError;
        
        // For each group, fetch the modifiers
        const groupsWithModifiers = await Promise.all(
          (groupsData || []).map(async (group) => {
            const { data: modifiersData, error: modifiersError } = await supabase
              .from('modifiers')
              .select('*')
              .eq('modifier_group_id', group.id);
              
            if (modifiersError) throw modifiersError;
            
            return {
              ...group,
              modifiers: modifiersData || []
            };
          })
        );
        
        setModifierGroups(groupsWithModifiers);
      } catch (err: any) {
        console.error('Error fetching modifiers:', err.message);
        setError('Failed to load modifiers');
      } finally {
        setLoading(false);
      }
    };
    
    if (menuItemId) {
      fetchModifiers();
    }
  }, [menuItemId]);
  
  // Simulate modifiers for development purposes if none exist
  useEffect(() => {
    if (!loading && modifierGroups.length === 0) {
      // Create mock modifier groups for testing
      const mockModifierGroups: ModifierGroup[] = [
        {
          id: 'mg1',
          name: 'Spice Level',
          description: 'How spicy would you like it?',
          selection_type: 'SINGLE',
          is_required: true,
          menu_item_id: menuItemId,
          modifiers: [
            { id: 'm1', name: 'Mild', price_adjustment: 0, modifier_group_id: 'mg1', is_required: false, created_at: '', updated_at: '' },
            { id: 'm2', name: 'Medium', price_adjustment: 0, modifier_group_id: 'mg1', is_required: false, created_at: '', updated_at: '' },
            { id: 'm3', name: 'Hot', price_adjustment: 0, modifier_group_id: 'mg1', is_required: false, created_at: '', updated_at: '' },
            { id: 'm4', name: 'Extra Hot', price_adjustment: 0.5, modifier_group_id: 'mg1', is_required: false, created_at: '', updated_at: '' }
          ]
        },
        {
          id: 'mg2',
          name: 'Additional Toppings',
          description: 'Add extra toppings',
          selection_type: 'MULTIPLE',
          is_required: false,
          menu_item_id: menuItemId,
          modifiers: [
            { id: 'm5', name: 'Extra Cheese', price_adjustment: 1.5, modifier_group_id: 'mg2', is_required: false, created_at: '', updated_at: '' },
            { id: 'm6', name: 'Cashew Nuts', price_adjustment: 1.0, modifier_group_id: 'mg2', is_required: false, created_at: '', updated_at: '' },
            { id: 'm7', name: 'Extra Sauce', price_adjustment: 0.75, modifier_group_id: 'mg2', is_required: false, created_at: '', updated_at: '' }
          ]
        },
        {
          id: 'mg3',
          name: 'Dietary Preferences',
          description: 'Customize your dish',
          selection_type: 'MULTIPLE',
          is_required: false,
          menu_item_id: menuItemId,
          modifiers: [
            { id: 'm8', name: 'Gluten Free (where possible)', price_adjustment: 1.5, modifier_group_id: 'mg3', is_required: false, created_at: '', updated_at: '' },
            { id: 'm9', name: 'No Dairy', price_adjustment: 0, modifier_group_id: 'mg3', is_required: false, created_at: '', updated_at: '' }
          ]
        }
      ];
      
      setModifierGroups(mockModifierGroups);
    }
  }, [loading, modifierGroups.length, menuItemId]);
  
  // Handle single selection (radio buttons)
  const handleSingleSelect = (groupId: string, modifier: Modifier) => {
    // Remove any previous selections from this group
    const updatedSelections = selectedModifiers.filter(
      (mod) => !modifierGroups.find(
        (group) => group.id === groupId && group.modifiers.some((m) => m.id === mod.modifier_id)
      )
    );
    
    // Add the new selection
    updatedSelections.push({
      id: `${modifier.id}-${Date.now()}`, // Generate a unique ID
      modifier_id: modifier.id,
      name: modifier.name,
      price_adjustment: modifier.price_adjustment
    });
    
    setSelectedModifiers(updatedSelections);
    onSelectModifiers(updatedSelections);
  };
  
  // Handle multiple selection (checkboxes)
  const handleMultipleSelect = (checked: boolean, modifier: Modifier) => {
    let updatedSelections;
    
    if (checked) {
      // Add the selection
      updatedSelections = [
        ...selectedModifiers,
        {
          id: `${modifier.id}-${Date.now()}`, // Generate a unique ID
          modifier_id: modifier.id,
          name: modifier.name,
          price_adjustment: modifier.price_adjustment
        }
      ];
    } else {
      // Remove the selection
      updatedSelections = selectedModifiers.filter(
        (mod) => mod.modifier_id !== modifier.id
      );
    }
    
    setSelectedModifiers(updatedSelections);
    onSelectModifiers(updatedSelections);
  };
  
  // Helper to check if a modifier is selected
  const isModifierSelected = (modifierId: string) => {
    return selectedModifiers.some((mod) => mod.modifier_id === modifierId);
  };

  if (loading) {
    return <div className="text-center py-4 text-tandoor-platinum">Loading modifiers...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (modifierGroups.length === 0) {
    return <div className="text-center py-2 text-tandoor-platinum/60 text-sm">No modifiers available</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <ScrollArea className="h-[300px] pr-4">
        {modifierGroups.map((group) => (
          <Card key={group.id} className="mb-4 bg-tandoor-charcoal border-tandoor-red/20">
            <CardContent className="p-4">
              <div className="mb-2">
                <h3 className="text-md font-medium text-tandoor-gold">
                  {group.name}
                  {group.is_required && <span className="text-tandoor-red ml-2 text-sm">(Required)</span>}
                </h3>
                {group.description && (
                  <p className="text-sm text-tandoor-platinum/70">{group.description}</p>
                )}
              </div>
              
              <Separator className="my-3 bg-tandoor-red/20" />
              
              {group.selection_type === 'SINGLE' ? (
                <RadioGroup
                  defaultValue={selectedModifiers.find(
                    (mod) => group.modifiers.some((m) => m.id === mod.modifier_id)
                  )?.modifier_id}
                  onValueChange={(value) => {
                    const modifier = group.modifiers.find((m) => m.id === value);
                    if (modifier) handleSingleSelect(group.id, modifier);
                  }}
                >
                  <div className="space-y-2">
                    {group.modifiers.map((modifier) => (
                      <div key={modifier.id} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={modifier.id} 
                          id={modifier.id} 
                          className="border-tandoor-red/50 text-tandoor-red"
                        />
                        <Label htmlFor={modifier.id} className="flex-1 cursor-pointer text-tandoor-platinum">
                          {modifier.name}
                        </Label>
                        {modifier.price_adjustment > 0 && (
                          <span className="text-sm font-medium text-tandoor-platinum">
                            +£{modifier.price_adjustment.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  {group.modifiers.map((modifier) => (
                    <div key={modifier.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={modifier.id} 
                        checked={isModifierSelected(modifier.id)}
                        onCheckedChange={(checked) => handleMultipleSelect(checked === true, modifier)}
                        className="border-tandoor-red/50 text-tandoor-red"
                      />
                      <Label htmlFor={modifier.id} className="flex-1 cursor-pointer text-tandoor-platinum">
                        {modifier.name}
                      </Label>
                      {modifier.price_adjustment > 0 && (
                        <span className="text-sm font-medium text-tandoor-platinum">
                          +£{modifier.price_adjustment.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}
