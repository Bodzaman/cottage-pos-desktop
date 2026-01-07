import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Settings, RefreshCw, Database, BookmarkPlus, Utensils, UtensilsCrossed, AlertCircle, Tag, PoundSterling, Upload } from "lucide-react";
import { apiClient } from "app";
import { globalColors } from "../utils/QSAIDesign";
import { useQueryClient } from '@tanstack/react-query';
import { useCategories, useMenuItems, useProteinTypes, menuKeys } from '../utils/menuQueries';
import { useRealtimeMenuStore } from "../utils/realtimeMenuStore";
import { useMountedRef, useSafeTimeout } from "utils/safeHooks";
import { colors } from "../utils/designSystem";

// Import modular components
import MenuItemsTab from "./MenuItemsTab";
import CategoriesTab from "./CategoriesTab";
import ProteinsTab from "./ProteinsTab";
import SetMealsTab from "./SetMealsTab";
import CustomizationsTab from "./CustomizationsTab";
import MenuItemTypeSelection from "./MenuItemTypeSelection";
import MenuItemForm from "./MenuItemForm";

// Import standardized types
import { MenuCategory, MenuItem, ProteinType, SetMeal, Customization } from "../utils/masterTypes";
import { MenuItemConfiguration } from "../utils/menuItemConfiguration";

// Type for MenuSubsection
type MenuSubsection = "categories" | "proteins" | "items" | "set-meals" | "addons-instructions";

export default function AdminPortalMenuContent() {
  // React Query hooks - replace manual state management
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: menuItems = [], isLoading: menuItemsLoading } = useMenuItems();
  const { data: proteins = [], isLoading: proteinsLoading } = useProteinTypes();
  
  // Computed loading state
  const loading = categoriesLoading || menuItemsLoading || proteinsLoading;
  
  // Keep only non-React Query state
  const [setMeals, setSetMeals] = useState([]);
  const [customizations, setCustomizations] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("items");
  
  // UI state for MenuItems tab
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());
  
  // Dialog state - NEW 2-step wizard flow
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemConfiguration, setItemConfiguration] = useState<MenuItemConfiguration | null>(null);
  
  // Add publish menu state
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublished, setLastPublished] = useState(null);
  const [publishedItemCount, setPublishedItemCount] = useState(0);
  
  const mountedRef = useMountedRef();
  const { setSafeTimeout } = useSafeTimeout();
  
  // Real-time store for POS synchronization
  const realtimeMenuStore = useRealtimeMenuStore();

  // Load non-React Query data on mount
  useEffect(() => {
    loadAdditionalData();
  }, []);

  // Simplified data loader - only for setMeals, customizations, and publish status
  const loadAdditionalData = async () => {
    setError(null);

    try {
      // Load last published timestamp
      try {
        const statusResponse = await apiClient.get_menu_status();
        const statusData = await statusResponse.json();
        if (statusData.success && statusData.data?.last_published_at) {
          setLastPublished(statusData.data.last_published_at);
          setPublishedItemCount(statusData.data?.published_items || 0);
        }
      } catch (err) {
        console.warn('Could not load last published timestamp:', err);
      }
      
      // Load set meals
      await loadSetMeals();
      
      // Load customizations
      await loadCustomizations();
      
    } catch (error) {
      console.error('Error loading additional data:', error);
      setError('Failed to load some menu data');
      toast.error('Failed to load some menu data');
    }
  };

  // Trigger full reload including React Query data
  const loadMenuData = async () => {
    // Invalidate all React Query caches to trigger refetch
    await queryClient.invalidateQueries({ queryKey: menuKeys.all });
    
    // Load additional non-React Query data
    await loadAdditionalData();
    
    // Trigger real-time store refresh for POS synchronization
    try {
      await realtimeMenuStore.refreshData();
      console.log('Real-time store refreshed after AdminMenuContent data update');
    } catch (storeError) {
      console.warn('Failed to refresh real-time store:', storeError);
    }
  };

  const loadSetMeals = async () => {
    try {
      const response = await apiClient.list_set_meals({ active_only: false });
      const data = await response.json();
      if (mountedRef.current) {
        setSetMeals(data || []);
      }
    } catch (error) {
      console.error('Error loading set meals:', error);
      throw error;
    }
  };

  const loadCustomizations = async () => {
    try {
      const response = await apiClient.get_customizations({});
      const data = await response.json();
      if (mountedRef.current) {
        setCustomizations(data?.customizations || []);
      }
    } catch (error) {
      console.error('Error loading customizations:', error);
      throw error;
    }
  };

  // Handler functions for MenuItemsTab
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const deleteMenuItem = async (id) => {
    const item = menuItems.find(item => item.id === id);
    const itemName = item?.name || 'this menu item';
    
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await apiClient.delete_menu_item({ itemId: id });
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete menu item');
      }
      
      toast.success('Menu item deleted successfully');
      
      // Invalidate React Query cache
      await queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      await loadAdditionalData();
      
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Error deleting menu item');
    }
  };

  const handleToggleItemActive = async (itemId, active) => {
    try {
      const response = await apiClient.bulk_toggle_active({
        item_ids: [itemId],
        item_type: "menu_items", // ✅ FIX (MYA-1446): Add required item_type field
        active
      });
      
      if (response.ok) {
        toast.success(`Item ${active ? 'activated' : 'deactivated'} successfully`);
        
        // Invalidate React Query cache
        await queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
        
        // ✅ FIX (MYA-1446): Force Zustand store refresh to update badge display
        await useRealtimeMenuStore.getState().fallbackRefreshData();
      } else {
        throw new Error('Failed to toggle item status');
      }
    } catch (error) {
      console.error('Error toggling item status:', error);
      toast.error(error.message || 'Error updating item status');
    }
  };

  // Handler functions for dialogs
  const handleConfigurationComplete = (
    type: 'food' | 'drinks_wine' | 'coffee_desserts',
    pricingMode: 'single' | 'variants'
  ) => {
    console.log('✅ [AdminPortalMenuContent] Configuration complete:', { type, pricingMode });
    
    // Close wizard
    setIsTypeSelectionOpen(false);
    
    // Create MenuItemConfiguration
    const configuration: MenuItemConfiguration = {
      itemType: type,
      pricingMode: pricingMode,
      configuredAt: new Date(),
      isLocked: false
    };
    
    console.log('🔧 [AdminPortalMenuContent] Setting configuration:', configuration);
    setItemConfiguration(configuration);
    
    console.log('🚪 [AdminPortalMenuContent] Opening edit dialog with configuration');
    // Open form with configuration
    setIsEditDialogOpen(true);
  };

  const handleSaveMenuItem = async (data: any) => {
    // 🔍 CRITICAL DEBUG: Log the exact payload being sent to backend
    console.log('\n🔍 =====================================================');
    console.log('🔍 [AdminPortalMenuContent] handleSaveMenuItem CALLED');
    console.log('🔍 =====================================================');
    console.log('🔍 Operation:', editingItem?.id ? 'UPDATE' : 'CREATE');
    console.log('🔍 Editing Item ID:', editingItem?.id || 'N/A (new item)');
    console.log('🔍 --------- IMAGE ASSET DATA ---------');
    console.log('🔍 image_asset_id:', data.image_asset_id);
    console.log('🔍 image_widescreen_asset_id:', data.image_widescreen_asset_id);
    console.log('🔍 --------- FULL PAYLOAD ---------');
    console.log('🔍 Full data object:', JSON.stringify(data, null, 2));
    console.log('🔍 =====================================================\n');
    
    try {
      const response = editingItem?.id 
        ? await apiClient.update_menu_item({ itemId: editingItem.id }, data)
        : await apiClient.create_menu_item(data);
      
      console.log('\n🔍 =====================================================');
      console.log('🔍 [AdminPortalMenuContent] API Response Received');
      console.log('🔍 =====================================================');
      console.log('🔍 Response OK:', response.ok);
      console.log('🔍 Response Status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Response Data:', JSON.stringify(result, null, 2));
        console.log('🔍 =====================================================\n');
        
        toast.success(`Menu item ${editingItem?.id ? 'updated' : 'created'} successfully`);
        
        // Invalidate React Query caches
        await queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
        await queryClient.invalidateQueries({ queryKey: menuKeys.itemVariants() });
        await loadAdditionalData();
        
        // Explicit state reset before calling handleCancelDialog
        console.log('🧹 [AdminPortalMenuContent] Resetting all dialog states after successful save');
        setIsTypeSelectionOpen(false);
        setIsEditDialogOpen(false);
        setItemConfiguration(null);
        setEditingItem(null);
      } else {
        throw new Error('Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.message || 'Error saving menu item');
    }
  };

  const handleCancelDialog = () => {
    console.log('🧹 [AdminPortalMenuContent] handleCancelDialog - Resetting all dialog states');
    setIsTypeSelectionOpen(false);  // ✅ FIX: Reset type selection modal
    setIsEditDialogOpen(false);
    setItemConfiguration(null);
    setEditingItem(null);
  };

  // Add publish menu functionality with unified feedback
  const handlePublishMenu = async () => {
    if (!confirm('Publish all draft menu items to live? This will update Menu, Customizations, Voice Agent, POS, and Online Orders simultaneously.')) {
      return;
    }

    setIsPublishing(true);
    
    // Create a detailed progress toast that we'll update
    const progressToast = toast.loading('Publishing menu + customizations to all systems...', {
      duration: 10000, // Keep it visible longer
    });
    
    try {
      console.log('🚀 [Admin] Starting unified menu publish...');
      
      // Call the enhanced publish_menu endpoint
      const response = await apiClient.publish_menu();
      const result = await response.json();
      
      if (result.success) {
        // Show success with system breakdown
        const systemsUpdated = [];
        if (result.corpus_updated) systemsUpdated.push('🎤 Voice Agent');
        systemsUpdated.push('💱 POS System');
        systemsUpdated.push('🌍 Online Orders');
        
        toast.dismiss(progressToast);
        toast.success(
          `✅ Published ${result.menu_items} items + customizations to: ${systemsUpdated.join(', ')}`,
          { duration: 5000 }
        );
        
        console.log('✅ [Admin] Unified menu publish completed:', {
          items: result.menu_items,
          voiceAgent: result.corpus_updated,
          systems: systemsUpdated.length
        });
        
        // Refresh the menu data to show updated publish status
        await loadMenuData();
      } else {
        throw new Error(result.message || 'Failed to publish menu');
      }
    } catch (error) {
      console.error('❌ [Admin] Error publishing menu:', error);
      toast.dismiss(progressToast);
      toast.error(`❌ Publish failed: ${error.message || 'Unknown error'}`, {
        duration: 5000
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const renderMenuContent = () => {
    switch (activeTab) {
      case "categories":
        return <CategoriesTab />;
      case "proteins":
        return <ProteinsTab proteins={proteins} onRefreshProteins={async () => {
          await queryClient.invalidateQueries({ queryKey: menuKeys.proteinTypes() });
        }} />;
      case "items":
        return (
          <MenuItemsTab
            categories={categories}
            menuItems={menuItems}
            loading={loading}
            menuSearchQuery={menuSearchQuery}
            setMenuSearchQuery={setMenuSearchQuery}
            expandedCategories={expandedCategories}
            setExpandedCategories={setExpandedCategories}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            onCreateItem={() => {
              // Defensive reset: ensure clean state before opening
              console.log('➕ [AdminPortalMenuContent] Opening + Add Item - Defensive state reset');
              setIsTypeSelectionOpen(false);
              setIsEditDialogOpen(false);
              setItemConfiguration(null);
              setEditingItem(null);
              // Now open the wizard
              setIsTypeSelectionOpen(true);
            }}
            onEditItem={handleEditItem}
            onDeleteItem={deleteMenuItem}
            onToggleItemActive={handleToggleItemActive}
            onRefresh={loadMenuData}
          />
        );
      case "set-meals":
        return <SetMealsTab />;
      case "addons-instructions":
        return <CustomizationsTab />;
      default:
        return (
          <MenuItemsTab
            categories={categories}
            menuItems={menuItems}
            loading={loading}
            menuSearchQuery={menuSearchQuery}
            setMenuSearchQuery={setMenuSearchQuery}
            expandedCategories={expandedCategories}
            setExpandedCategories={setExpandedCategories}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            onCreateItem={() => setIsTypeSelectionOpen(true)}
            onEditItem={handleEditItem}
            onDeleteItem={deleteMenuItem}
            onToggleItemActive={handleToggleItemActive}
            onRefresh={loadMenuData}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Simplified header without main navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Utensils className="h-5 w-5" style={{ color: colors.brand.purple }} />
            Menu Management
          </h2>
          <div className="flex gap-2">
            <Button 
              onClick={handlePublishMenu}
              disabled={isPublishing || loading}
              className="bg-[#0EBAB1] hover:bg-[#0A9A92] text-white border-0"
            >
              <Upload className={`h-4 w-4 mr-2 ${isPublishing ? 'animate-pulse' : ''}`} />
              {isPublishing ? 'Publishing...' : 'Publish Menu'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => loadMenuData()}
              className="border border-[rgba(124,93,250,0.3)] hover:bg-[rgba(124,93,250,0.1)]"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Internal subsection navigation tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MenuSubsection)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-[rgba(18,18,18,0.8)] border border-[rgba(124,93,250,0.2)]">
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="proteins" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
            >
              <Utensils className="h-4 w-4 mr-2" />
              Proteins
            </TabsTrigger>
            <TabsTrigger 
              value="items" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
            >
              <Utensils className="h-4 w-4 mr-2" />
              Items
            </TabsTrigger>
            <TabsTrigger 
              value="set-meals" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
            >
              <Tag className="h-4 w-4 mr-2" />
              Set Meals
            </TabsTrigger>
            <TabsTrigger 
              value="addons-instructions" 
              className="data-[state=active]:bg-[rgba(124,93,250,0.2)] data-[state=active]:text-white text-[#BBC3E1]"
            >
              <PoundSterling className="h-4 w-4 mr-2" />
              Add-ons & Instructions
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

      {/* Content based on active subsection */}
      {renderMenuContent()}
      
      {/* Menu Item Type Selection Dialog */}
      <MenuItemTypeSelection 
        isOpen={isTypeSelectionOpen}
        onClose={() => setIsTypeSelectionOpen(false)}
        onSelectType={handleConfigurationComplete}
      />
      
      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        console.log('📊 [Dialog] State changed. Open:', open, 'Configuration exists:', !!itemConfiguration, 'Editing item:', !!editingItem?.id);
        if (!open) {
          handleCancelDialog();
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Menu Item' : 'Create New Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItem?.id 
                ? 'Modify the details of this menu item. Changes will be saved to your menu.'
                : 'Configure your new menu item. Make sure to set pricing or variants before saving.'
              }
            </DialogDescription>
          </DialogHeader>
          {(() => {
            console.log('🎨 [Form Render Check] Configuration:', itemConfiguration, 'Editing item ID:', editingItem?.id);
            return (itemConfiguration || editingItem?.id) && (
              <MenuItemForm 
                menuItem={editingItem?.id ? editingItem : undefined}
                onSave={handleSaveMenuItem}
                onCancel={handleCancelDialog}
                categories={categories}
                proteinTypes={proteins}
                isEditing={!!editingItem?.id}
                configuration={itemConfiguration || undefined}
              />
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
