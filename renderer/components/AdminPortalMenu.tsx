import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Utensils, FileText, Circle, Users, Package, Boxes, RefreshCw } from 'lucide-react';
import { AlertTriangle, Edit, Trash2, PlusCircle, Eye, EyeOff, Copy, Loader2, Target, BookmarkPlus, BarChart } from 'lucide-react';
import { BookmarkPlus as TabIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card as ShadcnCard, CardContent as ShadcnCardContent, CardHeader as ShadcnCardHeader, CardTitle as ShadcnCardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMenuData } from "../utils/menuCache";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog as StrictDialog, DialogContent as StrictDialogContent, DialogHeader as StrictDialogHeader, DialogTitle as StrictDialogTitle, DialogDescription as StrictDialogDescription, DialogTrigger as StrictDialogTrigger } from "@/components/ui/dialog";
import { Tabs as StrictTabs, TabsContent as StrictTabsContent, TabsList as StrictTabsList, TabsTrigger as StrictTabsTrigger } from "@/components/ui/tabs";
import CategoryForm from "../components/CategoryForm";
import MenuItemForm from "../components/MenuItemForm"; // Using the clean form directly
import MenuItemTypeSelection from "../components/MenuItemTypeSelection";
import ProteinTypeForm from "../components/ProteinTypeForm";
import BatchPriceUpdate from "../components/BatchPriceUpdate";
import FloatingActionBar from "../components/FloatingActionBar";
import { SortableItem } from "../components/SortableItem";
import { apiClient } from 'app';
import { Category, MenuItem, ItemVariant, ProteinType } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { supabase } from '../utils/supabaseClient';
import { eventBus, EVENTS, emitMenuChangeEvent } from '../utils/eventBus';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { colors } from '../utils/QSAIDesign';
import { MenuItemConfiguration } from '../utils/menuItemConfiguration';

// AdminPortalMenu Component
interface AdminPortalMenuProps {
  activeSubsection: "categories" | "items" | "protein-types" | "pricing" | "preview";
}

const AdminPortalMenu: React.FC<AdminPortalMenuProps> = ({ activeSubsection }) => {
  const navigate = useNavigate();
  
  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance required before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // State for tracking drag operations
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // State for modal management
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'food' | 'drinks_wine' | 'coffee_desserts' | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Clear any selections when starting drag
    setSelectedMenuItems([]);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the active and over items in the current category
      const categoryId = menuItems.find(item => item.id === active.id)?.category_id;
      
      // If we have a category, we need to update items within that category
      if (categoryId) {
        // Get all menu items in this category
        const categoryItems = menuItems.filter(item => item.category_id === categoryId);
        
        // Find the indices of the active and over items
        const oldIndex = categoryItems.findIndex(item => item.id === active.id);
        const newIndex = categoryItems.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Create a new array with updated order
          const newOrder = arrayMove(categoryItems, oldIndex, newIndex);
          
          // Update display orders
          const updatedItems = newOrder.map((item, index) => ({
            ...item,
            display_order: index
          }));
          
          // Update the database
          updateDisplayOrder(updatedItems);
          
          // Update the state
          setMenuItems(prevItems => {
            return prevItems.map(item => {
              // If this item is in the current category, find its updated version
              if (item.category_id === categoryId) {
                const updatedItem = updatedItems.find(u => u.id === item.id);
                return updatedItem || item;
              }
              return item;
            });
          });
        }
      } else {
        // Handle uncategorized items
        const uncategorizedItems = menuItems.filter(item => !item.category_id);
        
        const oldIndex = uncategorizedItems.findIndex(item => item.id === active.id);
        const newIndex = uncategorizedItems.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Create a new array with updated order
          const newOrder = arrayMove(uncategorizedItems, oldIndex, newIndex);
          
          // Update display orders
          const updatedItems = newOrder.map((item, index) => ({
            ...item,
            display_order: index
          }));
          
          // Update the database
          updateDisplayOrder(updatedItems);
          
          // Update the state
          setMenuItems(prevItems => {
            return prevItems.map(item => {
              // If this is an uncategorized item, find its updated version
              if (!item.category_id) {
                const updatedItem = updatedItems.find(u => u.id === item.id);
                return updatedItem || item;
              }
              return item;
            });
          });
        }
      }
    }
    
    // Reset active ID
    setActiveId(null);
  };
  
  const handleDragCancel = () => {
    setActiveId(null);
  };
  
  // Handle opening type selection dialog
  const handleCreateItem = () => {
    setEditingItem(null);
    setEditingItemId(null);
    setSelectedItemType(null);
    setIsTypeSelectionOpen(true);
  };

  // Handle item type selection
  const handleSelectItemType = (type: 'food' | 'drinks_wine' | 'coffee_desserts', pricingMode: 'single' | 'variants') => {
    console.log('🎯 [AdminPortalMenu] Wizard completed:', { type, pricingMode });
    
    // Ensure single-dialog policy: close others before opening create
    setIsEditDialogOpen(false);
    setIsTypeSelectionOpen(false);
    setEditingItem(null);
    setEditingItemId(null);
    setSelectedItemType(type);
    
    // Create configuration from wizard choices
    const configuration: MenuItemConfiguration = {
      itemType: type,
      pricingMode: pricingMode,
      configuredAt: new Date(),
      isLocked: false // New items are not locked
    };
    
    console.log('✅ [AdminPortalMenu] Configuration created:', configuration);
    setItemConfiguration(configuration);
    
    setIsCreateDialogOpen(true);
  };

  // Handle opening edit dialog
  const handleEditItem = async (itemId: string) => {
    try {
      setIsLoadingItem(true);
      setEditingItemId(itemId);
      
      // Fetch the full item data from the API
      const response = await apiClient.get_menu_items();
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch menu items');
      }

      // Find the specific item by ID
      const menuItem = result.data?.find((item: any) => item.id === itemId);
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
      
      setEditingItem(menuItem);
      setIsEditDialogOpen(true);
      
    } catch (error: any) {
      console.error('Error fetching menu item for edit:', error);
      toast.error('Failed to load menu item for editing');
    } finally {
      setIsLoadingItem(false);
    }
  };

  // Handle saving menu item (both create and update)
  const handleSaveMenuItem = async (data: any) => {
    try {
      let response;
      
      if (editingItem?.id) {
        // Update existing item
        response = await apiClient.update_menu_item({ itemId: editingItem.id }, data);
      } else {
        // Create new item
        response = await apiClient.create_menu_item(data);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || 'Failed to save menu item';
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save menu item');
      }
      
      // Close dialogs and refresh data
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setEditingItemId(null);
      
      // Invalidate cache and reload data
      invalidateMenuItems();
      loadMenuData();
      
      toast.success(editingItem?.id ? 'Menu item updated successfully' : 'Menu item created successfully');
      
      // Trigger real-time store refresh for POS synchronization
      try {
        await realtimeMenuStore.refreshData();
        console.log('Real-time store refreshed after menu item save');
      } catch (storeError) {
        console.warn('Failed to refresh real-time store:', storeError);
      }
      
      // Emit menu change event for AI Voice Hub status updates
      const action = editingItem?.id ? 'updated' : 'created';
      const itemId = editingItem?.id || result.data?.menu_item?.id || result.data?.id;
      emitMenuChangeEvent(action, itemId, 'AdminPortalMenu');
      
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      throw error; // Re-throw to let MenuItemForm handle the error display
    }
  };

  // Handle canceling dialog
  const handleCancelDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsTypeSelectionOpen(false);
    setEditingItem(null);
    setEditingItemId(null);
    setSelectedItemType(null);
    setItemConfiguration(null); // Clear configuration state
  };
  
  // Update display order in the database
  const updateDisplayOrder = async (items: MenuItem[]) => {
    try {
      if (!items || items.length === 0) {
        console.warn('No items to update display order');
        return;
      }

      // Create an array of updates
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index
      }));
      
      console.log('Updating menu item display order:', updates);
      
      // Update all items with new display orders
      const { error } = await supabase
        .from('menu_items')
        .upsert(updates, { onConflict: 'id' });
        
      if (error) throw error;
      
      // Invalidate cache
      invalidateMenuItems();
      
      toast.success('Menu item order updated');
    } catch (error: any) {
      console.error('Error updating display order:', error);
      toast.error('Failed to update menu item order: ' + error.message);
    }
  };
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [proteinTypes, setProteinTypes] = useState<ProteinType[]>([]);
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'pos' | 'website'>('website');
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  const [pendingMenuItems, setPendingMenuItems] = useState<MenuItem[]>([]);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Sub-category filtering for Food Items section
  const [selectedFoodSubCategory, setSelectedFoodSubCategory] = useState<string>('all');
  
  // Multi-select state
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);

  // Get menu data functions and cache invalidation methods from our cache utility
  const { 
    fetchCategories, fetchMenuItems, fetchProteinTypes, fetchItemVariants,
    invalidateCache, invalidateMenuItems, invalidateCategories, invalidateProteinTypes, invalidateItemVariants, invalidateMenuItemsByCategory 
  } = useMenuData();
  
  // Real-time store for POS synchronization
  const realtimeMenuStore = useRealtimeMenuStore();

  // Check if dine-in price is supported

  useEffect(() => {
    loadMenuData();
  }, []);

  // Load menu data using our cached data utility
  const loadMenuData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all data in parallel
      const [categoriesData, menuItemsData, proteinTypesData, variantsData] = await Promise.all([
        fetchCategories(),
        fetchMenuItems(),
        fetchProteinTypes(),
        fetchItemVariants()
      ]);
      
      setCategories(categoriesData);
      setMenuItems(menuItemsData);
      setProteinTypes(proteinTypesData);
      setVariants(variantsData);
      
      // Generate simulated pending changes
      setPendingMenuItems(generatePendingChanges(menuItemsData));
      
      // Trigger real-time store refresh for POS synchronization
      try {
        await realtimeMenuStore.refreshData();
        console.log('Real-time store refreshed after AdminMenu data update');
      } catch (storeError) {
        console.warn('Failed to refresh real-time store:', storeError);
      }
    } catch (error: any) {
      console.error('Error loading menu data:', error);
      setError(error.message || 'Failed to load menu data');
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  // Generate simulated pending changes for menu preview
  const generatePendingChanges = (items: MenuItem[]) => {
    // This is a simulation of pending changes that might be made by an admin
    return items.map(item => {
      // Make a deep copy to avoid reference issues
      const itemCopy = { ...item };
      // Ensure variants is always defined
      itemCopy.variants = item.variants ? [...item.variants] : [];
      
      const randomChange = Math.random();
      
      if (randomChange < 0.3) {
        // No changes to some items
        return itemCopy;
      } else if (randomChange < 0.6) {
        // Modify price for some items
        return {
          ...itemCopy,
          variants: itemCopy.variants.map(variant => ({
            ...variant,
            price: parseFloat((variant.price * 1.1).toFixed(2)) // 10% price increase
          }))
        };
      } else if (randomChange < 0.8) {
        // Change active status
        return {
          ...itemCopy,
          active: !itemCopy.active,
        };
      } else {
        // Change spice level
        const newSpiceLevel = itemCopy.default_spice_level < 3 ? 
          itemCopy.default_spice_level + 1 : 
          itemCopy.default_spice_level - 1;
          
        return {
          ...itemCopy,
          default_spice_level: newSpiceLevel,
          spice_indicators: String(newSpiceLevel)
        };
      }
    });
  };

  // Multi-select and drag-and-drop handlers
  const handleSelectMenuItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If shift key is held, allow selecting multiple items
    if (e.shiftKey) {
      setSelectedMenuItems(prev => {
        if (prev.includes(id)) {
          return prev.filter(itemId => itemId !== id);
        } else {
          return [...prev, id];
        }
      });
    } else {
      // If not holding shift, select a single item
      setSelectedMenuItems([id]);
    }
  };
  

  
  // Bulk delete selected menu items
  const handleBulkDelete = async () => {
    if (selectedMenuItems.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedMenuItems.length} selected ${selectedMenuItems.length === 1 ? 'menu item' : 'menu items'}?`)) {
      return;
    }
    
    try {
      toast.info(`Deleting ${selectedMenuItems.length} ${selectedMenuItems.length === 1 ? 'menu item' : 'menu items'}...`);
      
      // Delete each selected menu item one by one
      for (const menuItemId of selectedMenuItems) {
        // First delete all variants associated with this item
        const { error: variantDeleteError } = await supabase
          .from('menu_item_variants')
          .delete()
          .eq('menu_item_id', menuItemId);
          
        if (variantDeleteError) throw variantDeleteError;
        
        // Now delete the menu item
        const { error: itemDeleteError } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', menuItemId);
          
        if (itemDeleteError) throw itemDeleteError;
      }
      
      toast.success(`${selectedMenuItems.length} ${selectedMenuItems.length === 1 ? 'menu item' : 'menu items'} deleted`);
      setSelectedMenuItems([]);
      
      // Invalidate relevant caches and reload data
      invalidateMenuItems();
      invalidateItemVariants();
      loadMenuData();
    } catch (error) {
      console.error('Error deleting menu items:', error);
      toast.error('Failed to delete some menu items');
    }
  };
  
  // Bulk toggle visibility for selected menu items
  const handleBulkToggleVisibility = async (active: boolean) => {
    if (selectedMenuItems.length === 0) return;
    
    try {
      toast.info(`${active ? 'Activating' : 'Deactivating'} ${selectedMenuItems.length} ${selectedMenuItems.length === 1 ? 'menu item' : 'menu items'}...`);
      
      // Update all selected menu items
      const { error } = await supabase
        .from('menu_items')
        .update({ active })
        .in('id', selectedMenuItems);
        
      if (error) throw error;
      
      toast.success(`${selectedMenuItems.length} ${selectedMenuItems.length === 1 ? 'menu item' : 'menu items'} ${active ? 'activated' : 'deactivated'}`);
      
      // Update local state
      setMenuItems(prev => {
        return prev.map(item => {
          if (selectedMenuItems.includes(item.id)) {
            return { ...item, active };
          }
          return item;
        });
      });
      
      invalidateMenuItems();
    } catch (error) {
      console.error(`Error ${active ? 'activating' : 'deactivating'} menu items:`, error);
      toast.error(`Failed to ${active ? 'activate' : 'deactivate'} some menu items`);
    }
  };
  
  // Bulk move selected menu items to another category
  const handleBulkMoveToCategory = async (categoryId: string) => {
    if (selectedMenuItems.length === 0 || !categoryId) return;
    
    try {
      toast.info(`Moving ${selectedMenuItems.length} ${selectedMenuItems.length === 1 ? 'menu item' : 'menu items'} to new category...`);
      
      // Update all selected menu items
      const { error } = await supabase
        .from('menu_items')
        .update({ category_id: categoryId })
        .in('id', selectedMenuItems);
        
      if (error) throw error;
      
      // Get category name for the success message
      const categoryName = categories.find(c => c.id === categoryId)?.name || 'new category';
      toast.success(`${selectedMenuItems.length} ${selectedMenuItems.length === 1 ? 'menu item' : 'menu items'} moved to ${categoryName}`);
      
      // Update local state
      setMenuItems(prev => {
        return prev.map(item => {
          if (selectedMenuItems.includes(item.id)) {
            return { ...item, category_id: categoryId };
          }
          return item;
        });
      });
      
      invalidateMenuItems();
    } catch (error) {
      console.error('Error moving menu items:', error);
      toast.error('Failed to move some menu items');
    }
  };

  // Delete a category
  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will NOT delete menu items in this category.')) {
      return;
    }
    
    try {
      // First check if there are any menu items in this category
      const { data: menuItemsInCategory, error: checkError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('category_id', id);
        
      if (checkError) throw checkError;
      
      if (menuItemsInCategory && menuItemsInCategory.length > 0) {
        // Ask if user wants to proceed anyway
        if (!confirm(`This category contains ${menuItemsInCategory.length} menu items. These items will be set to uncategorized. Proceed?`)) {
          return;
        }
        
        // Update menu items to remove the category reference
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ category_id: null })
          .eq('category_id', id);
          
        if (updateError) throw updateError;
      }
      
      // Now delete the category
      const { error: deleteError } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      toast.success('Category deleted successfully');
      
      // Invalidate relevant caches
      invalidateCategories();
      invalidateMenuItems(); // Because some menu items may have had their category_id changed
      
      // Reload data
      loadMenuData();
      
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Error deleting category: ' + error.message);
    }
  };

  // Delete a menu item with proper API integration
  const deleteMenuItem = async (id: string) => {
    // Find the item to get its name for confirmation
    const item = menuItems.find(item => item.id === id);
    const itemName = item?.name || 'this menu item';
    
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the proper apiClient endpoint
      const response = await apiClient.delete_menu_item({ itemId: id });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || 'Failed to delete menu item';
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete menu item');
      }
      
      toast.success(`"${itemName}" deleted successfully`);
      
      // Invalidate relevant caches and reload data
      invalidateMenuItems();
      invalidateItemVariants();
      loadMenuData();
      
      // Emit menu change event for AI Voice Hub status updates
      emitMenuChangeEvent('deleted', id, 'AdminPortalMenu');
      
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Error deleting menu item');
    } finally {
      setLoading(false);
    }
  };

  // Duplicate a menu item and its variants
  const duplicateMenuItem = async (id: string) => {
    setLoading(true);
    try {
      // First get the menu item we want to duplicate
      const { data: originalItem, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();
        
      if (itemError) throw itemError;
      
      // Get the variants of the original item
      const { data: originalVariants, error: variantsError } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', id);
        
      if (variantsError) throw variantsError;
      
      // Create a copy of the item with a new ID
      // Remove the id field entirely instead of setting to undefined
      const duplicatedItem = { ...originalItem };
      delete duplicatedItem.id;
      duplicatedItem.name = `${originalItem.name} (Copy)`; // Append (Copy) to the name
      duplicatedItem.created_at = new Date(); // Update creation timestamp
      
      // Insert the duplicated item
      const { data: newItem, error: insertError } = await supabase
        .from('menu_items')
        .insert(duplicatedItem)
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // Now duplicate all variants with the new menu item ID
      if (originalVariants && originalVariants.length > 0) {
        const duplicatedVariants = originalVariants.map(variant => {
          // Create a new variant object without the id field
          const newVariant = { ...variant };
          delete newVariant.id; // Remove id completely instead of setting to undefined
          newVariant.menu_item_id = newItem.id; // Use the new item's ID
          newVariant.created_at = new Date(); // Update creation timestamp
          return newVariant;
        });
        
        const { error: variantInsertError } = await supabase
          .from('menu_item_variants')
          .insert(duplicatedVariants);
          
        if (variantInsertError) throw variantInsertError;
      }
      
      toast.success('Menu item duplicated successfully');
      
      // Invalidate relevant caches
      invalidateMenuItems();
      invalidateItemVariants();
      
      // Reload data
      loadMenuData();
      
    } catch (error: any) {
      console.error('Error duplicating menu item:', error);
      toast.error('Error duplicating menu item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a protein type
  const deleteProteinType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this protein type?')) {
      return;
    }
    
    try {
      // Check if any menu items are using this protein type
      const { data: variantsUsingType, error: checkError } = await supabase
        .from('menu_item_variants')
        .select('id')
        .eq('protein_type_id', id);
        
      if (checkError) throw checkError;
      
      if (variantsUsingType && variantsUsingType.length > 0) {
        if (!confirm(`This protein type is used in ${variantsUsingType.length} menu items. These variants will be set to standard. Proceed?`)) {
          return;
        }
        
        // Update variants to remove the protein type reference
        const { error: updateError } = await supabase
          .from('menu_item_variants')
          .update({ protein_type_id: null })
          .eq('protein_type_id', id);
          
        if (updateError) throw updateError;
      }
      
      // Now delete the protein type
      const { error: deleteError } = await supabase
        .from('protein_types')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      toast.success('Protein type deleted successfully');
      
      // Invalidate relevant caches
      invalidateProteinTypes();
      invalidateItemVariants(); // Because variants may have had their protein_type_id changed
      
      // Reload data
      loadMenuData();
      
    } catch (error: any) {
      console.error('Error deleting protein type:', error);
      toast.error('Error deleting protein type: ' + error.message);
    }
  };

  // Filter menu items based on search query, category, and status
  const filteredMenuItems = menuItems.filter(item => {
    // Search query filter
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.menu_item_description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    
    // Status filter
    const matchesStatus = 
      selectedStatus === 'all' || 
      (selectedStatus === 'active' && item.active) || 
      (selectedStatus === 'inactive' && !item.active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });


  const renderMenuContent = () => {
    switch (activeSubsection) {
      case "categories":
        return renderCategoriesContent();
      case "items":
        return renderItemsContent();
      case "protein-types":
        return renderProteinTypesContent();
      case "pricing":
        return renderPricingContent();
      case "preview":
        return renderPreviewContent();
      default:
        return renderItemsContent();
    }
  };

  // Initialize expanded state when categories load
  useEffect(() => {
    if (categories.length > 0) {
      // Default all categories to expanded
      const expanded: Record<string, boolean> = {};
      categories.forEach(cat => {
        if (!cat.parent_category_id) {
          expanded[cat.id] = true;
        }
      });
      setExpandedCategories(expanded);
    }
  }, [categories]);

  // Toggle expansion of a parent category
  const toggleCategoryExpansion = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Group categories into parent-child hierarchy
  const organizeCategories = (allCategories: Category[]) => {
    // First get the top level categories
    const topLevel = allCategories.filter(cat => !cat.parent_category_id);
    
    // Then get the child categories
    const getChildren = (parentId: string) => {
      return allCategories.filter(cat => cat.parent_category_id === parentId)
        .sort((a, b) => a.display_order - b.display_order);
    };
    
    // Organize them into a structure
    return topLevel.sort((a, b) => a.display_order - b.display_order)
      .map(parent => ({
        ...parent,
        children: getChildren(parent.id)
      }));
  };

  // Render categories content
  const renderCategoriesContent = () => {
    // Organize categories into hierarchy
    const organizedCategories = organizeCategories(categories);
    
    return (
      <div className="rounded-md p-6 shadow-md" style={{ ...cardStyle }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-medium flex items-center gap-2">
              <BookmarkPlus className="h-5 w-5" style={{ color: colors.brand.purple }} />
              Menu Categories
            </h2>
            <p className="text-sm text-[#BBC3E1]/70 mt-1">Organize your menu with hierarchical categories</p>
          </div>
          <CategoryForm onSuccess={loadMenuData} />
        </div>
        
        <div className="bg-[rgba(124,93,250,0.1)] p-3 rounded-md mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2 text-[#7C5DFA]">
            <BookmarkPlus className="h-4 w-4" />
            Parent-Child Category Structure
          </h3>
          <p className="text-xs text-[#BBC3E1] mt-1">
            Categories can now have parent-child relationships. Child categories will be displayed when their parent is selected in the POS menu.
          </p>
        </div>
        
        <Separator className="bg-[rgba(124,93,250,0.2)] my-4" />
        
        {/* Floating Action Bar for bulk operations */}
        {selectedMenuItems.length > 0 && (
          <FloatingActionBar>
            <Button 
              variant="outline" 
              size="sm"
              className="border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)]"
              onClick={() => setSelectedMenuItems([])}
            >
              Clear Selection ({selectedMenuItems.length})
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)]">
                  Move to Category
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent style={{ background: colors.background.tertiary, borderColor: 'rgba(124,93,250,0.2)' }}>
                {categories.map(category => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => handleBulkMoveToCategory(category.id)}
                    className="hover:bg-[rgba(124,93,250,0.1)]"
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm"
              className="border-[rgba(25,231,156,0.3)] text-[#19E79C] hover:bg-[rgba(25,231,156,0.1)]"
              onClick={() => handleBulkToggleVisibility(true)}
            >
              Activate
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="border-[rgba(255,76,97,0.3)] text-[#FF4C61] hover:bg-[rgba(255,76,97,0.1)]"
              onClick={() => handleBulkToggleVisibility(false)}
            >
              Deactivate
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="border-[rgba(255,76,97,0.3)] text-[#FF4C61] hover:bg-[rgba(255,76,97,0.1)]"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </FloatingActionBar>
        )}
        
        {/* FloatingActionBar for Menu Items bulk operations */}
        {selectedMenuItems.length > 0 && (
          <FloatingActionBar
            selectedCount={selectedMenuItems.length}
            onClearSelection={() => setSelectedMenuItems([])}
            onDelete={handleBulkDelete}
            onToggleActive={handleBulkToggleVisibility}
            visibilityOptions={true}
            categoryOptions={false}
          />
        )}
        
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purple }} />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-lg border border-[rgba(124,93,250,0.2)] p-8 text-center" style={{ background: `rgba(15, 18, 33, 0.5)` }}>
            <BookmarkPlus className="h-12 w-12 mx-auto mb-4" style={{ color: `${colors.brand.purple}30` }} />
            <h3 className="text-lg font-medium mb-2">No Categories Found</h3>
            <p className="text-[#BBC3E1]/60 mb-4">
              Create your first menu category to get started organizing your menu.
            </p>
            <CategoryForm onSuccess={loadMenuData} />
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Render parent categories */}
            {organizedCategories.map((category) => (
              <div key={category.id} className="mb-5">
                <div 
                  className="flex items-center justify-between p-4 rounded-md border border-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.4)] transition-colors border-l-[3px] border-l-[#8A7FFD]"
                  style={{ background: '#2F2F4B' }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="text-[#8A7FFD] cursor-pointer hover:text-[#9888FF] transition-colors"
                        onClick={(e) => toggleCategoryExpansion(category.id, e)}
                      >
                        {category.children && category.children.length > 0 
                          ? (expandedCategories[category.id] ? '▼' : '►') 
                          : '•'}
                      </span>
                      <h3 className="font-semibold flex items-center gap-2">
                      {category.name}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: colors.brand.purple, background: `${colors.brand.purple}15` }}>
                        Order: {category.display_order}
                      </span>
                      {category.children && category.children.length > 0 && expandedCategories[category.id] && (
                        <Badge className="bg-[rgba(124,93,250,0.2)] text-[#7C5DFA] border-none">
                          {category.children.length} Subcategories
                        </Badge>
                      )}
                      {!category.active && (
                        <Badge variant="outline" className="ml-2 bg-[rgba(37,42,63,0.5)] text-[#BBC3E1]/60 border-[#252A3F]">
                          Inactive
                        </Badge>
                      )}
                    </h3>
                    </div>
                    <p className="text-sm text-[#BBC3E1]/70 mt-1 ml-6">{category.description || 'No description'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <CategoryForm 
                      onSuccess={loadMenuData} 
                      initialData={{
                        id: category.id,
                        name: category.name,
                        description: category.description || '',
                        display_order: category.display_order,
                        active: category.active,
                        parent_category_id: category.parent_category_id
                      }}
                      isEditing
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[#FF4C61] hover:text-[#FF4C61]/80 hover:bg-[rgba(255,76,97,0.1)]"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
                
                {/* Render child categories with indentation */}
                {category.children && category.children.length > 0 && expandedCategories[category.id] && (
                  <div className="mt-2 pl-2 border-l-2 border-[rgba(124,93,250,0.3)]">
                    {category.children.map((childCategory) => (
                      <div 
                        key={childCategory.id} 
                        className="flex items-center justify-between p-3 my-2 rounded-md border border-[rgba(124,93,250,0.15)] hover:border-[rgba(124,93,250,0.3)] transition-colors ml-4"
                        style={{ background: colors.background.tertiary }}
                      >
                        <div>
                          <h3 className="font-normal flex items-center gap-2 text-sm">
                            <span className="w-4 h-4 flex-shrink-0 ml-2">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7C5DFA]/60">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </span>
                            {childCategory.name}
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: colors.brand.purple, background: `${colors.brand.purple}10` }}>
                              Order: {childCategory.display_order}
                            </span>
                            {!childCategory.active && (
                              <Badge variant="outline" className="ml-2 bg-[rgba(37,42,63,0.5)] text-[#BBC3E1]/60 border-[#252A3F] text-xs">
                                Inactive
                              </Badge>
                            )}
                          </h3>
                          <p className="text-xs text-[#BBC3E1]/60 mt-1 ml-6">{childCategory.description || 'No description'}</p>
                        </div>
                        <div className="flex space-x-2">
                          <CategoryForm 
                            onSuccess={loadMenuData} 
                            initialData={{
                              id: childCategory.id,
                              name: childCategory.name,
                              description: childCategory.description || '',
                              display_order: childCategory.display_order,
                              active: childCategory.active,
                              parent_category_id: childCategory.parent_category_id
                            }}
                            isEditing
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-[#FF4C61] hover:text-[#FF4C61]/80 hover:bg-[rgba(255,76,97,0.1)]"
                            onClick={() => deleteCategory(childCategory.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        

      </div>
    );
  };

  // Render items content
  const renderItemsContent = () => {
    // Define category groupings for better organization
    const categoryGroups = {
      'food': {
        title: 'Food Items',
        icon: '🍽️',
        categories: ['Starters', 'Main Course', 'Side Dishes', 'Accompaniments', 'Specials', 'Chef\'s Specials', 'Appetizers', 'Mains']
      },
      'drinks_wine': {
        title: 'Drinks & Wine', 
        icon: '🍷',
        categories: ['Drinks & Wine', 'Drinks', 'Beverages', 'Wine', 'Alcohol', 'Beer']
      },
      'coffee_desserts': {
        title: 'Desserts & Coffee',
        icon: '☕',
        categories: ['Desserts & Coffee', 'Coffee & Desserts', 'Desserts', 'Sweets', 'Coffee', 'Tea']
      }
    };
    
      // Define sub-categories for Food Items
    const foodSubCategories = {
      'all': { title: 'All Food', categories: ['Starters', 'Main Course', 'Side Dishes', 'Accompaniments', 'Specials', 'Chef\'s Specials', 'Appetizers', 'Mains'] },
      'starters': { title: 'Starters', categories: ['Starters', 'Appetizers'] },
      'mains': { title: 'Main Course', categories: ['Main Course', 'Mains', 'Specials', 'Chef\'s Specials'] },
      'sides': { title: 'Side Dishes', categories: ['Side Dishes'] },
      'accompaniments': { title: 'Accompaniments', categories: ['Accompaniments'] }
    };
    
    // Filter items based on selected food sub-category
    const foodFilteredItems = filteredMenuItems.filter(item => {
      const category = categories.find(c => c.id === item.category_id);
      const categoryName = category?.name || 'Uncategorized';
      
      // Check if this is a food item
      const isFood = categoryGroups.food.categories.some(cat => 
        categoryName.toLowerCase().includes(cat.toLowerCase()) || 
        cat.toLowerCase().includes(categoryName.toLowerCase())
      );
      
      if (!isFood) return true; // Non-food items pass through
      
      // Apply food sub-category filter
      if (selectedFoodSubCategory === 'all') return true;
      
      const subCat = foodSubCategories[selectedFoodSubCategory];
      return subCat && subCat.categories.some(cat => 
        categoryName.toLowerCase().includes(cat.toLowerCase()) || 
        cat.toLowerCase().includes(categoryName.toLowerCase())
      );
    });
    
  // Group items by category type
    const groupedItems = foodFilteredItems.reduce((acc, item) => {
      const category = categories.find(c => c.id === item.category_id);
      const categoryName = category?.name || 'Uncategorized';
      
      // Find which group this category belongs to
      let groupKey = 'uncategorized';
      for (const [key, group] of Object.entries(categoryGroups)) {
        if (group.categories.some(cat => 
          categoryName.toLowerCase().includes(cat.toLowerCase()) || 
          cat.toLowerCase().includes(categoryName.toLowerCase())
        )) {
          groupKey = key;
          break;
        }
      }
      
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      
      return acc;
    }, {} as Record<string, MenuItem[]>);
    
    // Group items by category for more efficient rendering
    const itemsByCategory = filteredMenuItems.reduce((acc, item) => {
      const categoryId = item.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
    
    // Get category names for display
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
    
    // Sort categories by display order
    const sortedCategoryIds = Object.keys(itemsByCategory).sort((a, b) => {
      const catA = categories.find(c => c.id === a);
      const catB = categories.find(c => c.id === b);
      if (!catA && !catB) return 0;
      if (!catA) return 1;
      if (!catB) return -1;
      return catA.display_order - catB.display_order;
    });
    
    return (
      <div className="rounded-md p-6 shadow-md" style={{ ...cardStyle }}>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-medium flex items-center gap-2">
                <Package className="h-5 w-5" style={{ color: colors.brand.purple }} />
                Menu Items
              </h2>
              <p className="text-sm text-[#BBC3E1]/70 mt-1">Organized by category sections for better management</p>
            </div>
            <Button 
              onClick={handleCreateItem}
              className="bg-[#7C5DFA] hover:bg-[#9277FF] text-white font-semibold px-4 py-2 shadow-lg shadow-[#7C5DFA]/25"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>
          
          {/* Search and filters */}
          <div className="p-4 rounded-md border border-[rgba(124,93,250,0.2)] flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
               style={{ background: `rgba(15, 18, 33, 0.6)`, backdropFilter: 'blur(8px)' }}>
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#BBC3E1]/50" />
              <Input
                placeholder="Search menu items..."
                className="pl-8 border-[rgba(124,93,250,0.2)] focus-visible:border-[rgba(124,93,250,0.4)] w-full"
                style={{ background: colors.background.tertiary }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[rgba(124,93,250,0.2)] gap-2">
                    <Filter className="h-4 w-4" />
                    Category: {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All'}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ background: colors.background.tertiary, borderColor: 'rgba(124,93,250,0.2)' }}>
                  <DropdownMenuItem onClick={() => setSelectedCategory(null)} className="hover:bg-[rgba(124,93,250,0.1)]">
                    All Categories
                  </DropdownMenuItem>
                  <Separator className="bg-[rgba(124,93,250,0.1)] my-1" />
                  {categories.map(category => (
                    <DropdownMenuItem 
                      key={category.id} 
                      onClick={() => setSelectedCategory(category.id)}
                      className="hover:bg-[rgba(124,93,250,0.1)] flex justify-between items-center"
                    >
                      {category.name}
                      {selectedCategory === category.id && <CheckCircle2 className="h-4 w-4" style={{ color: colors.brand.purple }} />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[rgba(124,93,250,0.2)] gap-2">
                    <Filter className="h-4 w-4" />
                    Status: {selectedStatus === 'all' ? 'All' : selectedStatus === 'active' ? 'Active' : 'Inactive'}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ background: colors.background.tertiary, borderColor: 'rgba(124,93,250,0.2)' }}>
                  <DropdownMenuItem onClick={() => setSelectedStatus('all')} className="hover:bg-[rgba(124,93,250,0.1)] flex justify-between items-center">
                    All Status
                    {selectedStatus === 'all' && <CheckCircle2 className="h-4 w-4" style={{ color: colors.brand.purple }} />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('active')} className="hover:bg-[rgba(124,93,250,0.1)] flex justify-between items-center">
                    Active Only
                    {selectedStatus === 'active' && <CheckCircle2 className="h-4 w-4" style={{ color: colors.brand.purple }} />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('inactive')} className="hover:bg-[rgba(124,93,250,0.1)] flex justify-between items-center">
                    Inactive Only
                    {selectedStatus === 'inactive' && <CheckCircle1 className="h-4 w-4" style={{ color: colors.brand.purple }} />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="icon" 
                className={`border-[rgba(124,93,250,0.2)] ${activeView === 'grid' ? 'bg-[rgba(124,93,250,0.15)]' : ''}`}
                onClick={() => setActiveView('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className={`border-[rgba(124,93,250,0.2)] ${activeView === 'list' ? 'bg-[rgba(124,93,250,0.15)]' : ''}`}
                onClick={() => setActiveView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              
              {/* Select All/None controls and Clear selection */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = filteredMenuItems.map(item => item.id);
                    setSelectedMenuItems(allIds);
                  }}
                  className="text-xs border-[rgba(124,93,250,0.3)] hover:border-[rgba(124,93,250,0.6)] hover:bg-[rgba(124,93,250,0.1)]"
                  disabled={filteredMenuItems.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMenuItems([])}
                  className="text-xs border-[rgba(124,93,250,0.3)] hover:border-[rgba(124,93,250,0.6)] hover:bg-[rgba(124,93,250,0.1)]"
                  disabled={selectedMenuItems.length === 0}
                >
                  Select None
                </Button>
                
                {/* Clear selection button when items are selected */}
                {selectedMenuItems.length > 0 && (
                  <div className="text-xs text-[#BBC3E1]/70">
                    {selectedMenuItems.length} {selectedMenuItems.length === 1 ? 'item' : 'items'} selected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="bg-[rgba(124,93,250,0.2)] my-4" />
        
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purple }} />
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="rounded-lg border border-[rgba(124,93,250,0.2)] p-8 text-center" style={{ background: `rgba(15, 18, 33, 0.5)` }}>
            <Package className="h-12 w-12 mx-auto mb-4" style={{ color: `${colors.brand.purple}30` }} />
            <h3 className="text-lg font-medium mb-2">No Menu Items Found</h3>
            <p className="text-[#BBC3E1]/60 mb-4">
              {searchQuery || selectedCategory || selectedStatus !== 'all' ?
                'Try adjusting your search filters to see more results.' :
                'Add your first dish to get started with your menu.'}
            </p>
            {!(searchQuery || selectedCategory || selectedStatus !== 'all') ? (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="bg-[#7C5DFA] hover:bg-[#9277FF] text-white font-semibold px-6 py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Menu Item
              </Button>
            ) : (
              <Button variant="outline" 
                     className="border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)]"
                     onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedStatus('all');
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        ) : activeView === 'grid' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={filteredMenuItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-8 mt-6">
                {/* Render items grouped by category sections */}
                {Object.entries(categoryGroups).map(([groupKey, group]) => {
                  const groupItems = groupedItems[groupKey] || [];
                  
                  if (groupItems.length === 0) return null;
                  
                  return (
                    <div key={groupKey} className="space-y-4">
                      {/* Section Header */}
                      <div className="flex items-center justify-between p-4 rounded-lg border border-[rgba(124,93,250,0.2)]" 
                           style={{ background: `rgba(15, 18, 33, 0.4)` }}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{group.icon}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                            <p className="text-sm text-[#BBC3E1]/70">
                              {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sub-category tabs for Food Items */}
                      {groupKey === 'food' && (
                        <div className="px-4 pb-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(foodSubCategories).map(([key, subCat]) => {
                              const isSelected = selectedFoodSubCategory === key;
                              const itemCount = key === 'all' 
                                ? groupItems.length
                                : groupItems.filter(item => {
                                    const category = categories.find(c => c.id === item.category_id);
                                    const categoryName = category?.name || 'Uncategorized';
                                    return subCat.categories.some(cat => 
                                      categoryName.toLowerCase().includes(cat.toLowerCase()) || 
                                      cat.toLowerCase().includes(categoryName.toLowerCase())
                                    );
                                  }).length;
                              
                              return (
                                <button
                                  key={key}
                                  onClick={() => setSelectedFoodSubCategory(key)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-[#7C5DFA] text-white shadow-md'
                                      : 'bg-[rgba(124,93,250,0.1)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.2)] hover:text-white'
                                  }`}
                                >
                                  {subCat.title} ({itemCount})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Items Grid for this section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {groupItems.map((item) => {
                          // Find category for this item
                          const category = categories.find(c => c.id === item.category_id);
                          // Get variants for this item
                          const itemVariants = variants.filter(v => v.menu_item_id === item.id);
                          
                          return (
                            <SortableItem 
                              key={item.id}
                              id={item.id}
                              className={`rounded-lg border border-[rgba(124,93,250,0.2)] overflow-hidden hover:border-[rgba(124,93,250,0.4)] transition-all duration-200 ${selectedMenuItems.includes(item.id) ? 'bg-[rgba(124,93,250,0.15)] border-[rgba(124,93,250,0.4)]' : ''}`}
                            >
                              {/* Checkbox for selection */}
                              <div className="absolute top-3 right-3 z-10">
                                <div 
                                  className="flex items-center justify-center w-6 h-6 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMenuItems(prev => 
                                      prev.includes(item.id) 
                                        ? prev.filter(id => id !== item.id)
                                        : [...prev, item.id]
                                    );
                                  }}
                                >
                                  <div 
                                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                      selectedMenuItems.includes(item.id) 
                                        ? 'bg-[#7C5DFA] border-[#7C5DFA] shadow-lg' 
                                        : 'bg-black/30 border-gray-400 backdrop-blur-sm'
                                    }`}
                                  >
                                    {selectedMenuItems.includes(item.id) && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="cursor-pointer" style={{ ...cardStyle }}>
                                {/* Image section */}
                                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#7C5DFA]/20 to-[#4A4A4A]/20">
                                  {item.image_url ? (
                                    <img 
                                      src={item.image_url} 
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  {/* Fallback placeholder */}
                                  <div className={`absolute inset-0 flex items-center justify-center ${item.image_url ? 'hidden' : ''}`}>
                                    <Package className="h-12 w-12 text-white/30" />
                                  </div>
                                  
                                  {/* Status badges overlay */}
                                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                                    {!item.active && (
                                      <Badge variant="outline" className="bg-[rgba(255,76,97,0.9)] text-white border-none text-xs backdrop-blur-md">
                                        Inactive
                                      </Badge>
                                    )}
                                    {item.featured && (
                                      <Badge className="bg-[rgba(255,185,70,0.9)] text-white border-none text-xs">
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Content section */}
                                <div className="p-4 space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-white text-base leading-tight truncate">{item.name}</h3>
                                        {item.item_code && (
                                          <Badge className="bg-black/80 text-white border-none font-mono text-xs backdrop-blur-md border border-white/20 shrink-0">
                                            {item.item_code}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#BBC3E1]/70 line-clamp-2 leading-relaxed">
                                        {item.menu_item_description || 'No description available'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Category and variants info */}
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      {category ? (
                                        <Badge variant="outline" className="bg-[rgba(124,93,250,0.05)] text-[#7C5DFA]/80 border-[#7C5DFA]/20">
                                          {category.name}
                                        </Badge>
                                      ) : (
                                        <span className="text-[#BBC3E1]/50">Uncategorized</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Badge variant="secondary" className="bg-[#252A3F] text-[#BBC3E1] border-none text-xs">
                                        {itemVariants.length} variant{itemVariants.length !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {/* Price range */}
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">
                                      {(() => {
                                        const prices = itemVariants.map(v => v.price).filter(p => p !== null && p !== undefined);
                                        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
                                        const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
                                        
                                        if (minPrice !== null && maxPrice !== null) {
                                          return minPrice === maxPrice ? 
                                            `£${minPrice.toFixed(2)}` : 
                                            `£${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`;
                                        }
                                        return <span className="text-[#BBC3E1]/50 text-xs">No pricing</span>;
                                      })()}
                                    </div>
                                  </div>
                                  
                                  {/* Action buttons */}
                                  <div className="flex gap-2 pt-2 border-t border-[rgba(124,93,250,0.1)]">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex-1 border-[rgba(124,93,250,0.2)] hover:bg-[rgba(124,93,250,0.1)]"
                                      onClick={() => handleEditItem(item.id)}
                                      disabled={isLoadingItem && editingItemId === item.id}
                                      title="Edit this menu item"
                                    >
                                      {isLoadingItem && editingItemId === item.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Edit className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-[rgba(124,93,250,0.2)] hover:bg-[rgba(124,93,250,0.1)]"
                                      onClick={() => duplicateMenuItem(item.id)}
                                      title="Duplicate this menu item"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-[#FF4C61] hover:text-[#FF4C61]/80 hover:bg-[rgba(255,76,97,0.1)]"
                                      onClick={() => deleteMenuItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </SortableItem>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="border border-[rgba(124,93,250,0.2)] rounded-lg overflow-hidden mt-6">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-sm font-medium py-3 px-4"
                 style={{ background: `${colors.brand.purple}10` }}>
              <div className="w-10 text-center">Select</div>
              <div>Menu Item</div>
              <div className="text-center px-4">Category</div>
              <div className="text-center px-4">Variants</div>
              <div className="text-center px-4">Price Range</div>
              <div className="text-center px-4">Actions</div>
            </div>
            
            {filteredMenuItems.map((item, index) => {
              // Find category for this item
              const category = categories.find(c => c.id === item.category_id);
              // Get variants for this item
              const itemVariants = variants.filter(v => v.menu_item_id === item.id);
              // Calculate price range
              const prices = itemVariants.map(v => v.price).filter(p => p !== null && p !== undefined);
              const minPrice = prices.length > 0 ? Math.min(...prices) : null;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
              
              return (
                <div 
                  key={item.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 items-center py-3 px-4 text-sm ${index % 2 === 0 ? 'bg-[rgba(15, 18, 33, 0.5)]' : ''} ${selectedMenuItems.includes(item.id) ? 'bg-[rgba(124,93,250,0.15)] border-l-2 border-l-[#7C5DFA]' : ''}`}
                >
                  {/* Checkbox for selection */}
                  <div className="w-10 flex justify-center">
                    <div 
                      className="flex items-center justify-center w-6 h-6 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMenuItems(prev => 
                          prev.includes(item.id) 
                            ? prev.filter(id => id !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                    >
                      <div 
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          selectedMenuItems.includes(item.id) 
                            ? 'bg-[#7C5DFA] border-[#7C5DFA] shadow-lg' 
                            : 'bg-black/30 border-gray-400 backdrop-blur-sm hover:border-[#7C5DFA]/50'
                        }`}
                      >
                        {selectedMenuItems.includes(item.id) && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu item name and details */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded overflow-hidden bg-[rgba(124,93,250,0.1)] flex-shrink-0">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-4 w-4" style={{ color: colors.brand.purple }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {item.name}
                        {item.item_code && (
                          <Badge className="bg-black/80 text-white border-none font-mono text-xs backdrop-blur-md border border-white/20">
                            {item.item_code}
                          </Badge>
                        )}
                        {!item.active && (
                          <Badge variant="outline" className="bg-[rgba(255,76,97,0.1)] text-[#FF4C61] border-[#FF4C61]/20 text-xs">
                            Inactive
                          </Badge>
                        )}
                        {item.featured && (
                          <Badge className="bg-[rgba(255,185,70,0.1)] text-[#FFB946] border-none text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-[#BBC3E1]/70 mt-1 line-clamp-1">{item.menu_item_description || 'No description'}</div>
                    </div>
                  </div>
                  
                  {/* Category */}
                  <div className="px-4 text-center">
                    {category ? (
                      <Badge variant="outline" className="bg-[rgba(124,93,250,0.05)] text-[#7C5DFA]/80 border-[#7C5DFA]/20">
                        {category.name}
                      </Badge>
                    ) : (
                      <span className="text-[#BBC3E1]/50 text-xs">Uncategorized</span>
                    )}
                  </div>
                  
                  {/* Variants count */}
                  <div className="px-4 text-center">
                    <Badge variant="secondary" className="bg-[#252A3F] text-[#BBC3E1] border-none">
                      {itemVariants.length}
                    </Badge>
                  </div>
                  
                  {/* Price range */}
                  <div className="px-4 text-center font-medium">
                    {minPrice !== null && maxPrice !== null ? (
                      minPrice === maxPrice ? 
                        `£${minPrice.toFixed(2)}` : 
                        `£${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`
                    ) : (
                      <span className="text-[#BBC3E1]/50 text-xs">No pricing</span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="px-4 text-center flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-[rgba(124,93,250,0.2)] hover:bg-[rgba(124,93,250,0.1)]"
                      onClick={() => handleEditItem(item.id)}
                      disabled={isLoadingItem && editingItemId === item.id}
                      title="Edit this menu item"
                    >
                      {isLoadingItem && editingItemId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[#FF4C61] hover:text-[#FF4C61]/80 hover:bg-[rgba(255,76,97,0.1)]"
                      onClick={() => deleteMenuItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* FloatingActionBar for Menu Items bulk operations */}
        {selectedMenuItems.length > 0 && (
          <FloatingActionBar
            selectedCount={selectedMenuItems.length}
            onClearSelection={() => setSelectedMenuItems([])}
            onDelete={handleBulkDelete}
            onToggleActive={handleBulkToggleVisibility}
            visibilityOptions={true}
            categoryOptions={false}
          />
        )}
      </div>
    );
  };

  // Render protein types content
  const renderProteinTypesContent = () => {
    // Note: This is a redirect component that will be shown momentarily before redirecting
    return (
      <div className="rounded-md p-6 shadow-md" style={{ ...cardStyle }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-medium flex items-center gap-2">
              <Tag className="h-5 w-5" style={{ color: colors.brand.purple }} />
              Protein Types
            </h2>
            <p className="text-sm text-[#BBC3E1]/70 mt-1">Redirecting to unified Menu Structure page...</p>
          </div>
        </div>
        <div className="py-10 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purple }} />
          <p className="text-center text-[#BBC3E1]/70">
            Protein types are now managed in the Menu Structure page along with categories.
          </p>
        </div>
      </div>
    );
  };

  // Render pricing content
  const renderPricingContent = () => {
    return (
      <div className="rounded-md p-6 shadow-md" style={{ ...cardStyle }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-medium flex items-center gap-2">
              <PoundSterling className="h-5 w-5" style={{ color: colors.brand.purple }} />
              Batch Price Updates
            </h2>
            <p className="text-sm text-[#BBC3E1]/70 mt-1">Update pricing for multiple items at once</p>
          </div>
        </div>
        <Separator className="bg-[rgba(124,93,250,0.2)] my-4" />
        
        <div>
          <BatchPriceUpdate 
            categories={categories} 
            onSuccess={() => {
              invalidateItemVariants();
              loadMenuData();
            }} 
          />
        </div>
      </div>
    );
  };

  // Render preview content
  const renderPreviewContent = () => {
    return (
      <div className="rounded-md p-6 shadow-md" style={{ ...cardStyle }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-medium flex items-center gap-2">
              <Eye className="h-5 w-5" style={{ color: colors.brand.purple }} />
              Menu Preview
            </h2>
            <p className="text-sm text-[#BBC3E1]/70 mt-1">Preview how your menu will appear</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className={`border-[rgba(124,93,250,0.2)] ${previewMode === 'website' ? 'bg-[rgba(124,93,250,0.15)]' : ''}`}
              onClick={() => setPreviewMode('website')}
            >
              Website View
            </Button>
            <Button 
              variant="outline" 
              className={`border-[rgba(124,93,250,0.2)] ${previewMode === 'pos' ? 'bg-[rgba(124,93,250,0.15)]' : ''}`}
              onClick={() => setPreviewMode('pos')}
            >
              POS View
            </Button>
          </div>
        </div>
        <Separator className="bg-[rgba(124,93,250,0.2)] my-4" />
        
        <div className="space-y-4">
          <p>Menu preview will appear here</p>
          <p className="text-sm text-gray-400">(This is a placeholder - full menu preview content will be integrated here)</p>
        </div>
      </div>
    );
  };

  // Real-time store for POS synchronization
  const realtimeMenuStore = useRealtimeMenuStore();

  // Check if dine-in price is supported

  // Convert Category[] to MenuCategory[] for MenuItemForm compatibility
  const convertToMenuCategories = (categories: Category[]): MenuCategory[] => {
    console.log('🔄 [AdminPortalMenu] Converting categories:', {
      originalCount: categories.length,
      sampleCategory: categories[0] ? {
        id: categories[0].id,
        name: categories[0].name,
        active: categories[0].active,
        is_protein_type: categories[0].is_protein_type
      } : null
    });
    
    const converted = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      display_order: cat.display_order,
      print_order: cat.print_order,
      print_to_kitchen: cat.print_to_kitchen,
      image_url: cat.image_url,
      parent_category_id: cat.parent_category_id,
      active: cat.active,
      is_protein_type: cat.is_protein_type
    }));
    
    console.log('✅ [AdminPortalMenu] Converted categories:', {
      convertedCount: converted.length,
      sampleConverted: converted[0] ? {
        id: converted[0].id,
        name: converted[0].name,
        active: converted[0].active,
        is_protein_type: converted[0].is_protein_type
      } : null
    });
    
    return converted;
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation tabs and refresh button */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Utensils className="h-6 w-6" style={{ color: colors.brand.purple }} />
            Menu Management
          </h1>
          <Button 
            variant="outline" 
            onClick={() => loadMenuData()}
            className="border border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Menu subsection navigation tabs */}
        <Tabs value={activeSubsection} className="w-full ">
          <TabsList className="grid w-full grid-cols-5 bg-[rgba(18,18,18,0.8)] border border-[rgba(124,93,250,0.2)]">
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
              onClick={() => navigate(`/admin?section=menu&subsection=categories`)}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="items" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
              onClick={() => navigate(`/admin?section=menu&subsection=items`)}
            >
              <Utensils className="h-4 w-4 mr-2" />
              Items
            </TabsTrigger>
            <TabsTrigger 
              value="protein-types" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
              onClick={() => navigate(`/admin?section=menu&subsection=protein-types`)}
            >
              <Tag className="h-4 w-4 mr-2" />
              Proteins
            </TabsTrigger>
            <TabsTrigger 
              value="pricing" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
              onClick={() => navigate(`/admin?section=menu&subsection=pricing`)}
            >
              <PoundSterling className="h-4 w-4 mr-2" />
              Pricing
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
              onClick={() => navigate(`/admin?section=menu&subsection=preview`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="mb-4 bg-[rgba(255,76,97,0.1)] border border-[rgba(255,76,97,0.3)] text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {renderMenuContent()}
      
      {/* Menu Item Type Selection Dialog */}
      <MenuItemTypeSelection 
        open={isTypeSelectionOpen}
        onClose={() => setIsTypeSelectionOpen(false)}
        onSelectType={handleSelectItemType}
      />
      
      {/* Only render one dialog at a time to avoid nesting */}
      {isEditDialogOpen && !isCreateDialogOpen && (
        <StrictDialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) handleCancelDialog(); }}>
          <div 
            className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-2 rounded-lg"
            style={{ backgroundColor: '#1E1E1E', border: '1px solid rgba(255, 255, 255, 0.03)' }}
          >
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
              <DialogDescription>
                Modify the details of this menu item. Changes will be saved to your menu.
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <MenuItemFormErrorBoundary onReset={() => {
                // Reset form state on error recovery
                setEditingItem(null);
                setIsEditDialogOpen(false);
              }}>
                <MenuItemForm 
                  menuItem={editingItem}
                  onSave={handleSaveMenuItem}
                  onCancel={handleCancelDialog}
                  categories={(() => {
                    console.log('📋 [AdminPortalMenu] Edit form - categories state check:', {
                      categoriesLength: categories.length,
                      categories: categories.slice(0, 3).map(cat => ({ id: cat.id, name: cat.name, active: cat.active }))
                    });
                    const converted = convertToMenuCategories(categories);
                    console.log('📋 [AdminPortalMenu] Edit form - passing categories:', {
                      originalLength: categories.length,
                      convertedLength: converted.length,
                      editingItem: editingItem?.name
                    });
                    return converted;
                  })()}
                  proteinTypes={proteinTypes}
                  isEditing={true}
                />
              </MenuItemFormErrorBoundary>
            )}
          </div>
        </StrictDialog>
      )}

      {isCreateDialogOpen && (
        <StrictDialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) handleCancelDialog(); }}>
          <div 
            className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-2 rounded-lg"
            style={{ backgroundColor: '#1E1E1E', border: '1px solid rgba(255, 255, 255, 0.03)' }}
          >
            <DialogHeader>
              <DialogTitle>
                Add New Menu Item
              </DialogTitle>
              <DialogDescription>
                Create a new {selectedItemType === 'food' ? 'food' : selectedItemType === 'drinks_wine' ? 'drinks & wine' : selectedItemType === 'coffee_desserts' ? 'coffee & desserts' : 'menu'} item with all the necessary details and pricing.
              </DialogDescription>
            </DialogHeader>
            <MenuItemForm 
              onSave={handleSaveMenuItem}
              onCancel={handleCancelDialog}
              categories={(() => {
                console.log('🆕 [AdminPortalMenu] Create form - categories state check:', {
                  categoriesLength: categories.length,
                  categories: categories.slice(0, 3).map(cat => ({ id: cat.id, name: cat.name, active: cat.active }))
                });
                const converted = convertToMenuCategories(categories);
                console.log('🆕 [AdminPortalMenu] Create form - passing data:', {
                  originalLength: categories.length,
                  convertedLength: converted.length,
                  configuration: itemConfiguration
                });
                return converted;
              })()}
              proteinTypes={proteinTypes}
              isEditing={false}
              configuration={itemConfiguration!}
            />
          </div>
        </StrictDialog>
      )}
    </div>
  );
};

export default AdminPortalMenu;
