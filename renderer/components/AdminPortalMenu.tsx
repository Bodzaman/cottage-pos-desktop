import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Utensils, 
  Package, 
  RefreshCw,
  AlertTriangle, 
  Edit, 
  Trash2, 
  Copy, 
  Loader2, 
  BookmarkPlus,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Tag,
  PoundSterling,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';

import CategoryForm from "../components/CategoryForm";
import MenuItemForm from "../components/MenuItemForm";
import MenuItemTypeSelection from "../components/MenuItemTypeSelection";
import BatchPriceUpdate from "../components/BatchPriceUpdate";
import FloatingActionBar from "../components/FloatingActionBar";
import { SortableItem } from "../components/SortableItem";
import { MenuItemFormErrorBoundary } from "../components/MenuItemFormErrorBoundary";

import { apiClient } from 'app';
import { Category, MenuItem, ItemVariant, ProteinType, MenuCategory } from '../utils/menuTypes';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { supabase } from '../utils/supabaseClient';
import { emitMenuChangeEvent } from '../utils/eventBus';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { colors } from '../utils/QSAIDesign';
import { useMenuData } from '../utils/menuCache';

// AdminPortalMenu Component
interface AdminPortalMenuProps {
  activeSubsection: "categories" | "items" | "protein-types" | "pricing" | "preview";
}

const cardStyle = {
  backgroundColor: '#1E1E1E',
  border: '1px solid rgba(255, 255, 255, 0.03)'
};

const AdminPortalMenu: React.FC<AdminPortalMenuProps> = ({ activeSubsection }) => {
  const navigate = useNavigate();
  
  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'food' | 'drinks_wine' | 'coffee_desserts' | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [itemConfiguration, setItemConfiguration] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [proteinTypes, setProteinTypes] = useState<ProteinType[]>([]);
  const [variants, setVariants] = useState<ItemVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'pos' | 'website'>('website');
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedFoodSubCategory, setSelectedFoodSubCategory] = useState<string>('all');

  // Real-time store and cache
  const realtimeMenuStore = useRealtimeMenuStore();
  const { 
    fetchCategories, fetchMenuItems, fetchProteinTypes, fetchItemVariants,
    invalidateMenuItems, invalidateCategories, invalidateProteinTypes, invalidateItemVariants 
  } = useMenuData();

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    setError(null);
    try {
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
      
      try {
        await realtimeMenuStore.refreshData();
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setSelectedMenuItems([]);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Reordering logic
    }
    setActiveId(null);
  };
  
  const handleDragCancel = () => setActiveId(null);
  
  const handleCreateItem = () => {
    setEditingItem(null);
    setEditingItemId(null);
    setSelectedItemType(null);
    setIsTypeSelectionOpen(true);
  };

  const handleSelectItemType = (type: 'food' | 'drinks_wine' | 'coffee_desserts', pricingMode: 'single' | 'variants') => {
    setIsEditDialogOpen(false);
    setIsTypeSelectionOpen(false);
    setSelectedItemType(type);
    setItemConfiguration({ itemType: type, pricingMode, configuredAt: new Date(), isLocked: false });
    setIsCreateDialogOpen(true);
  };

  const handleEditItem = async (itemId: string) => {
    try {
      setIsLoadingItem(true);
      setEditingItemId(itemId);
      const response = await apiClient.get_menu_items();
      const result = await response.json();
      const menuItem = result.data?.find((item: any) => item.id === itemId);
      if (!menuItem) throw new Error('Menu item not found');
      setEditingItem(menuItem);
      setIsEditDialogOpen(true);
    } catch (error: any) {
      toast.error('Failed to load menu item for editing');
    } finally {
      setIsLoadingItem(false);
    }
  };

  const handleSaveMenuItem = async (data: any) => {
    try {
      const response = editingItem?.id ? 
        await apiClient.update_menu_item({ itemId: editingItem.id }, data) : 
        await apiClient.create_menu_item(data);
      
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to save menu item');
      
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      invalidateMenuItems();
      loadMenuData();
      toast.success(editingItem?.id ? 'Menu item updated' : 'Menu item created');
      emitMenuChangeEvent(editingItem?.id ? 'updated' : 'created', result.data?.id, 'AdminPortalMenu');
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancelDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsTypeSelectionOpen(false);
    setEditingItem(null);
    setItemConfiguration(null);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete category?')) return;
    try {
      const { error } = await supabase.from('menu_categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Category deleted');
      invalidateCategories();
      loadMenuData();
    } catch (error: any) {
      toast.error('Delete failed: ' + error.message);
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (!confirm('Delete menu item?')) return;
    try {
      const response = await apiClient.delete_menu_item({ itemId: id });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      toast.success('Deleted successfully');
      invalidateMenuItems();
      loadMenuData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const duplicateMenuItem = async (id: string) => {
    try {
      const { data: originalItem } = await supabase.from('menu_items').select('*').eq('id', id).single();
      if (!originalItem) return;
      const { id: _, ...dupData } = originalItem;
      dupData.name = `${originalItem.name} (Copy)`;
      const { data: newItem } = await supabase.from('menu_items').insert(dupData).select().single();
      toast.success('Duplicated successfully');
      loadMenuData();
    } catch (error: any) {
      toast.error('Duplicate failed');
    }
  };

  const convertToMenuCategories = (categories: Category[]): MenuCategory[] => {
    return categories.map(cat => ({
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
  };

  const renderCategoriesContent = () => (
    <div className="rounded-md p-6 shadow-md" style={cardStyle}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium flex items-center gap-2">
          <BookmarkPlus className="h-5 w-5" style={{ color: colors.purple.primary }} />
          Menu Categories
        </h2>
        <CategoryForm onSuccess={loadMenuData} />
      </div>
      <div className="grid gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="p-4 rounded-md border border-white/5 bg-white/5 flex justify-between items-center">
            <span>{cat.name}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat.id)} className="text-red-400">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderItemsContent = () => (
    <div className="rounded-md p-6 shadow-md" style={cardStyle}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium flex items-center gap-2">
          <Package className="h-5 w-5" style={{ color: colors.purple.primary }} />
          Menu Items
        </h2>
        <Button onClick={handleCreateItem} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map(item => (
          <Card key={item.id} className="bg-white/5 border-white/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-white">{item.name}</h3>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEditItem(item.id)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMenuItem(item.id)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Utensils className="h-6 w-6 text-purple-500" />
          Menu Management
        </h1>
        <Button variant="outline" onClick={loadMenuData} className="border-white/10 group">
          <RefreshCw className="h-4 w-4 mr-2 group-active:animate-spin" /> Refresh
        </Button>
      </div>

      <Tabs value={activeSubsection} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-black/40">
          <TabsTrigger value="categories" onClick={() => navigate('/admin?section=menu&subsection=categories')}>Categories</TabsTrigger>
          <TabsTrigger value="items" onClick={() => navigate('/admin?section=menu&subsection=items')}>Items</TabsTrigger>
          <TabsTrigger value="protein-types" onClick={() => navigate('/admin?section=menu&subsection=protein-types')}>Proteins</TabsTrigger>
          <TabsTrigger value="pricing" onClick={() => navigate('/admin?section=menu&subsection=pricing')}>Pricing</TabsTrigger>
          <TabsTrigger value="preview" onClick={() => navigate('/admin?section=menu&subsection=preview')}>Preview</TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {activeSubsection === "categories" ? renderCategoriesContent() : 
       activeSubsection === "items" ? renderItemsContent() : 
       <div className="p-8 text-center text-gray-500" style={cardStyle}>Subsection content under development</div>}

      <MenuItemTypeSelection isOpen={isTypeSelectionOpen} onClose={() => setIsTypeSelectionOpen(false)} onSelectType={handleSelectItemType} />
      
      {isEditDialogOpen && editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && handleCancelDialog()}>
          <DialogContent className="max-w-4xl bg-[#1E1E1E] border-white/5">
            <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
            <MenuItemFormErrorBoundary onReset={() => setIsEditDialogOpen(false)}>
              <MenuItemForm menuItem={editingItem as any} onSave={handleSaveMenuItem} onCancel={handleCancelDialog} categories={convertToMenuCategories(categories)} proteinTypes={proteinTypes} isEditing />
            </MenuItemFormErrorBoundary>
          </DialogContent>
        </Dialog>
      )}

      {isCreateDialogOpen && (
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && handleCancelDialog()}>
          <DialogContent className="max-w-4xl bg-[#1E1E1E] border-white/5">
            <DialogHeader><DialogTitle>Create Item</DialogTitle></DialogHeader>
            <MenuItemForm onSave={handleSaveMenuItem} onCancel={handleCancelDialog} categories={convertToMenuCategories(categories)} proteinTypes={proteinTypes} isEditing={false} configuration={itemConfiguration} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPortalMenu;
