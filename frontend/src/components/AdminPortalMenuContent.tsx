/**
 * AdminPortalMenuContent
 *
 * Main container for Menu Management with sidebar navigation.
 *
 * Architecture:
 * - Sidebar: Items, Set Meals, Add-ons + Settings
 * - Main Content: Active section content
 * - Settings Modal: Categories & Proteins configuration
 */

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, AlertCircle, Upload, Utensils } from "lucide-react";
import {
  getMenuStatus,
  getSetMeals,
  getCustomizations,
  createMenuItem as createMenuItemQuery,
  updateMenuItem as updateMenuItemQuery,
  deleteMenuItem as deleteMenuItemQuery,
  bulkToggleActive,
  publishMenu,
  revertToPublished,
  getPublishedSnapshot,
  getItemsWithSnapshots
} from "../utils/supabaseQueries";
import { colors, InternalTheme } from "../utils/InternalDesignSystem";
import { useQueryClient } from '@tanstack/react-query';
import { useCategories, useMenuItems, useProteinTypes, menuKeys } from '../utils/menuQueries';
import { useRealtimeMenuStoreCompat } from "../utils/realtimeMenuStoreCompat";
import { useMountedRef, useSafeTimeout } from "utils/safeHooks";

// Import modular components
import MenuItemsTab from "./MenuItemsTab";
import SetMealsTab from "./SetMealsTab";
import CustomizationsTab from "./CustomizationsTab";
import MenuItemTypeSelection from "./MenuItemTypeSelection";
import MenuItemForm from "./MenuItemForm";
import PublishReviewModal from "./PublishReviewModal";

// Import new sidebar navigation components
import MenuManagementSidebar, { MenuSection } from "./MenuManagementSidebar";
import MenuSettingsModal from "./MenuSettingsModal";
import { useMenuCounts } from "../hooks/useMenuCounts";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

// Import standardized types
import {
  MenuCategory,
  MenuItem,
  ProteinType,
  mapApiCategoryToMenuCategory,
  mapApiItemToMenuItem,
  mapApiProteinToProteinType
} from "../utils/masterTypes";
import { MenuItemConfiguration } from "../utils/menuItemConfiguration";

export default function AdminPortalMenuContent() {
  // React Query hooks - replace manual state management
  const queryClient = useQueryClient();
  const { data: rawCategories = [], isLoading: categoriesLoading } = useCategories();
  const { data: rawMenuItems = [], isLoading: menuItemsLoading } = useMenuItems();
  const { data: rawProteins = [], isLoading: proteinsLoading } = useProteinTypes();

  // Track which menu items have published snapshots (for revert button visibility)
  const [itemsWithSnapshots, setItemsWithSnapshots] = useState<Set<string>>(new Set());

  // Map API types to master types for component compatibility
  const categories = useMemo(() => rawCategories.map(mapApiCategoryToMenuCategory), [rawCategories]);
  const menuItems = useMemo(() => rawMenuItems.map((item: any) => ({
    ...mapApiItemToMenuItem(item),
    hasPublishedSnapshot: itemsWithSnapshots.has(item.id)
  })), [rawMenuItems, itemsWithSnapshots]);
  const proteins = useMemo(() => rawProteins.map(mapApiProteinToProteinType), [rawProteins]);

  // Computed loading state
  const loading = categoriesLoading || menuItemsLoading || proteinsLoading;

  // Draft count for publish button
  const draftItemCount = useMemo(() => {
    return menuItems.filter((item: any) => !item.published_at).length;
  }, [menuItems]);

  // State for additional data (not managed by React Query)
  const [setMeals, setSetMeals] = useState([]);
  const [customizations, setCustomizations] = useState([]);
  const [error, setError] = useState(null);

  // Responsive layout hook for auto-collapsing sidebar on mobile
  const { shouldCollapseSidebar, isMobile } = useResponsiveLayout();

  // NEW: Sidebar navigation state
  const [activeSection, setActiveSection] = useState<MenuSection>('items');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(shouldCollapseSidebar);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Auto-collapse sidebar when screen becomes mobile-sized
  useEffect(() => {
    if (shouldCollapseSidebar && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
  }, [shouldCollapseSidebar]);

  // Menu counts for sidebar
  const menuCounts = useMenuCounts();

  // UI state for MenuItems tab
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Dialog state - 2-step wizard flow
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemConfiguration, setItemConfiguration] = useState<MenuItemConfiguration | null>(null);

  // Publish menu state
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublished, setLastPublished] = useState(null);
  const [publishedItemCount, setPublishedItemCount] = useState(0);

  // Publish Review Modal state
  const [isPublishReviewOpen, setIsPublishReviewOpen] = useState(false);

  // Mutation lock to prevent race conditions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMutating = isPublishing || isSubmitting;

  const mountedRef = useMountedRef();
  const { setSafeTimeout } = useSafeTimeout();

  // Real-time store for POS synchronization
  const realtimeMenuStore = useRealtimeMenuStoreCompat({ context: 'admin' });

  // Load non-React Query data on mount
  useEffect(() => {
    loadAdditionalData();
  }, []);

  // Fetch which items have published snapshots (for revert button visibility)
  useEffect(() => {
    const fetchSnapshots = async () => {
      if (rawMenuItems.length === 0) return;

      const draftItemIds = rawMenuItems
        .filter((item: any) => !item.published_at)
        .map((item: any) => item.id);

      if (draftItemIds.length === 0) {
        setItemsWithSnapshots(new Set());
        return;
      }

      const snapshotSet = await getItemsWithSnapshots(draftItemIds);
      setItemsWithSnapshots(snapshotSet);
    };

    fetchSnapshots();
  }, [rawMenuItems]);

  // Load additional data (setMeals, customizations, publish status)
  const loadAdditionalData = async () => {
    setError(null);

    try {
      // Load last published timestamp
      try {
        const statusData = await getMenuStatus();
        if (statusData.success && statusData.data?.last_published_at) {
          setLastPublished(statusData.data.last_published_at);
          setPublishedItemCount(statusData.data?.published_items || 0);
        }
      } catch (err) {
        // Silently ignore status fetch errors
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
    await queryClient.invalidateQueries({ queryKey: menuKeys.all });
    await loadAdditionalData();

    try {
      await realtimeMenuStore.refreshData();
    } catch (storeError) {
      // Silently ignore store refresh errors
    }
  };

  const loadSetMeals = async () => {
    try {
      const data = await getSetMeals(false);
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
      const data = await getCustomizations();
      if (mountedRef.current) {
        setCustomizations(data || []);
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
      const success = await deleteMenuItemQuery(id);

      if (!success) {
        throw new Error('Failed to delete menu item');
      }

      toast.success('Menu item deleted successfully');
      await queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      await loadAdditionalData();

    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Error deleting menu item');
    }
  };

  const handleToggleItemActive = async (itemId, active) => {
    try {
      const result = await bulkToggleActive([itemId], 'menu_items', active);

      if (result.success) {
        toast.success(`Item ${active ? 'activated' : 'deactivated'} successfully`);
        await queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
        await realtimeMenuStore.forceFullRefresh();
      } else {
        throw new Error('Failed to toggle item status');
      }
    } catch (error) {
      console.error('Error toggling item status:', error);
      toast.error(error.message || 'Error updating item status');
    }
  };

  // Handler for reverting draft items to published state
  const handleRevertItem = async (itemId: string) => {
    const item = menuItems.find((i: any) => i.id === itemId);
    const itemName = item?.name || 'this item';

    const snapshot = await getPublishedSnapshot(itemId);
    if (!snapshot) {
      toast.error(`"${itemName}" has never been published - nothing to revert to`);
      return;
    }

    if (!confirm(`Revert "${itemName}" to its published version? All draft changes will be lost.`)) {
      return;
    }

    try {
      const result = await revertToPublished(itemId);

      if (result.success) {
        toast.success(`"${itemName}" reverted to published version`);
        await queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
      } else {
        throw new Error(result.error || 'Failed to revert item');
      }
    } catch (error: any) {
      console.error('Error reverting item:', error);
      toast.error(error.message || 'Error reverting item');
    }
  };

  // Handler functions for dialogs
  const handleConfigurationComplete = (
    type: 'food' | 'drinks_wine' | 'coffee_desserts',
    pricingMode: 'single' | 'variants'
  ) => {
    setIsTypeSelectionOpen(false);

    const configuration: MenuItemConfiguration = {
      itemType: type,
      pricingMode: pricingMode,
      configuredAt: new Date(),
      isLocked: false
    };

    setItemConfiguration(configuration);
    setIsEditDialogOpen(true);
  };

  const handleSaveMenuItem = async (data: any) => {
    if (isMutating) {
      toast.warning('Please wait for the current operation to complete');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = editingItem?.id
        ? await updateMenuItemQuery(editingItem.id, data)
        : await createMenuItemQuery(data);

      if (result) {
        toast.success(`Menu item ${editingItem?.id ? 'updated' : 'created'} successfully`);

        await queryClient.invalidateQueries({ queryKey: menuKeys.menuItems() });
        await queryClient.invalidateQueries({ queryKey: menuKeys.itemVariants() });
        await loadAdditionalData();

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDialog = () => {
    setIsTypeSelectionOpen(false);
    setIsEditDialogOpen(false);
    setItemConfiguration(null);
    setEditingItem(null);
  };

  // Publish menu functionality
  const handlePublishMenu = async () => {
    if (isMutating) {
      toast.warning('Please wait for the current operation to complete');
      return;
    }

    if (!confirm('Publish all draft menu items to live? This will update Menu, Customizations, Voice Agent, POS, and Online Orders simultaneously.')) {
      return;
    }

    setIsPublishing(true);

    const progressToast = toast.loading('Publishing menu + customizations to all systems...', {
      duration: 10000,
    });

    try {
      const result = await publishMenu();

      if (result.success) {
        const systemsUpdated = [];
        if (result.corpus_updated) systemsUpdated.push('Voice Agent');
        systemsUpdated.push('POS System');
        systemsUpdated.push('Online Orders');

        toast.dismiss(progressToast);
        toast.success(
          `Published ${result.menu_items} items + customizations to: ${systemsUpdated.join(', ')}`,
          { duration: 5000 }
        );

        await loadMenuData();
      } else {
        throw new Error(result.message || 'Failed to publish menu');
      }
    } catch (error) {
      toast.dismiss(progressToast);
      toast.error(`Publish failed: ${error.message || 'Unknown error'}`, {
        duration: 5000
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Render active section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'items':
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
              // Clear any previous state
              setIsTypeSelectionOpen(false);
              setItemConfiguration(null);
              setEditingItem(null);
              // Open form dialog directly - type selection is now inline in the form
              setIsEditDialogOpen(true);
            }}
            onEditItem={handleEditItem}
            onDeleteItem={deleteMenuItem}
            onToggleItemActive={handleToggleItemActive}
            onRefresh={loadMenuData}
            onRevert={handleRevertItem}
          />
        );
      case 'set-meals':
        return <SetMealsTab />;
      case 'addons':
        return <CustomizationsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <MenuManagementSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        counts={{
          items: menuCounts.items,
          itemDrafts: menuCounts.itemDrafts,
          setMeals: menuCounts.setMeals,
          addons: menuCounts.addons,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 ${InternalTheme.classes.surfaceToolbar}`}
        >
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-between">
            <h2
              className="text-lg sm:text-xl font-bold flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <Utensils className="h-5 w-5" style={{ color: colors.purple.primary }} />
              <span className="hidden xs:inline">Menu Management</span>
              <span className="xs:hidden">Menu</span>
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsPublishReviewOpen(true)}
                disabled={isMutating || loading || draftItemCount === 0}
                className={`
                  text-white border-0
                  transition-all duration-200
                  shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]
                  ${draftItemCount > 0
                    ? 'bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309]'
                    : 'bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6]'
                  }
                `}
                aria-label={draftItemCount > 0 ? `Review and publish ${draftItemCount} drafts` : 'Publish menu'}
              >
                <Upload className={`h-4 w-4 ${isPublishing ? 'animate-pulse' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">
                  {isPublishing ? 'Publishing...' : isSubmitting ? 'Saving...' : draftItemCount > 0 ? `Review & Publish (${draftItemCount})` : 'Publish Menu'}
                </span>
                {/* Show count badge on mobile when there are drafts */}
                {draftItemCount > 0 && (
                  <span className="sm:hidden ml-1 text-xs font-bold">
                    ({draftItemCount})
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => loadMenuData()}
                disabled={loading}
                aria-label="Refresh menu data"
                className="hover:bg-[rgba(124,58,237,0.1)]"
                style={{ borderColor: colors.border.accent }}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="px-6 py-4">
            <Alert
              variant="destructive"
              className="text-white"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: `1px solid rgba(239, 68, 68, 0.3)`,
              }}
            >
              <AlertCircle className="h-4 w-4" style={{ color: colors.status.error }} />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Content based on active section */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderSectionContent()}
        </div>
      </div>

      {/* Settings Modal (Categories & Proteins) */}
      <MenuSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onMenuChange={loadMenuData}
      />

      {/* Menu Item Type Selection Dialog */}
      <MenuItemTypeSelection
        isOpen={isTypeSelectionOpen}
        onClose={() => setIsTypeSelectionOpen(false)}
        onSelectType={handleConfigurationComplete}
      />

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancelDialog();
        }
      }}>
        <DialogContent 
          className="max-w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-7xl w-[98vw] sm:w-[96vw] h-[98vh] sm:h-[95vh] flex flex-col p-0 gap-0"
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.07]">
            <DialogTitle className="text-lg sm:text-xl">{editingItem?.id ? 'Edit Menu Item' : 'Create New Menu Item'}</DialogTitle>
            <DialogDescription className="text-sm">
              {editingItem?.id
                ? 'Modify the details of this menu item. Changes will be saved to your menu.'
                : 'Configure your new menu item. Make sure to set pricing or variants before saving.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <MenuItemForm
              menuItem={editingItem?.id ? editingItem : undefined}
              onSave={handleSaveMenuItem}
              onSuccess={() => { }}
              onCancel={handleCancelDialog}
              categories={categories}
              proteinTypes={proteins}
              isEditing={!!editingItem?.id}
              configuration={itemConfiguration || undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Review Modal */}
      <PublishReviewModal
        isOpen={isPublishReviewOpen}
        onClose={() => setIsPublishReviewOpen(false)}
        onPublishSuccess={() => {
          loadMenuData();
          setIsPublishReviewOpen(false);
        }}
        draftCount={draftItemCount}
      />
    </div>
  );
}
