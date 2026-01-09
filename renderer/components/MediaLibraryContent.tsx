import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UploadIcon, RefreshCw, CheckSquare, X, Trash2, ListChecks, Loader2, FolderOpen } from 'lucide-react';
import MenuImagesTab from 'components/MenuImagesTab';
import AIAvatarTab from 'components/AIAvatarTab';
import GeneralMediaTab from 'components/GeneralMediaTab';
import { UploadDialog } from 'components/UploadDialog';
import { SmartBulkDeleteDialog } from 'components/SmartBulkDeleteDialog';
import { MediaFilterSidebar } from 'components/MediaFilterSidebar';
import { GalleryHeader } from 'components/GalleryHeader';
import { ActiveFiltersBar } from 'components/ActiveFiltersBar';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { fetchHierarchicalMedia, filterMediaUnified } from 'utils/mediaHierarchyUtils';
import { MediaItem } from 'utils/mediaLibraryUtils';
import { FilterSidebarSkeleton } from 'components/FilterSidebarSkeleton';
// TEMPORARILY COMMENTED FOR DEBUGGING
// import { MediaLibraryShortcutsHelp } from 'components/MediaLibraryShortcutsHelp';
import { useMediaLibraryShortcuts } from 'utils/useMediaLibraryShortcuts';

interface MediaLibraryContentProps {
  /** Selection mode: 'pick' for single asset selection, null for normal browsing */
  selectionMode?: 'pick' | null;
  /** Callback when an asset is selected in 'pick' mode */
  onAssetSelect?: (asset: MediaItem) => void;
}

/**
 * MediaLibraryContent - Core media library interface
 * 
 * This component contains all the media library functionality without
 * the full-page wrapper (min-h-screen, gridBackground, etc.).
 * 
 * Used by:
 * - MediaLibrary page (with full-page wrapper)
 * - AdminTabsContent (as a tab content area)
 * - AIStaffManagementHub (in Dialog for avatar picking)
 */
export function MediaLibraryContent({ 
  selectionMode = null,
  onAssetSelect,
}: MediaLibraryContentProps = {}) {
  const {
    activeTab,
    setActiveTab,
    allMedia,
    setAllMedia,
    isLoading,
    setIsLoading,
    batchSelection,
    enterSelectionMode,
    exitSelectionMode,
    selectAllItems,
    clearSelection,
  } = useMediaLibraryStore();

  // Subscribe to unifiedFilters separately for reactivity
  const unifiedFilters = useMediaLibraryStore((state) => state.unifiedFilters);

  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = React.useState(false);
  const [filterChangeCounter, setFilterChangeCounter] = React.useState(0);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [showFilteringOverlay, setShowFilteringOverlay] = React.useState(false);
  const filterTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = React.useState(false);
  const menuItemSearchRef = React.useRef<HTMLButtonElement>(null);
  const filterPresetButtonRef = React.useRef<HTMLButtonElement>(null);

  // Refs for keyboard shortcuts
  const [presetPanelExpanded, setPresetPanelExpanded] = React.useState(false);

  // Keyboard shortcuts
  // TEMPORARILY COMMENTED FOR DEBUGGING
  /*
  useMediaLibraryShortcuts({
    menuItemSearchRef,
    onOpenPresetPalette: () => setPresetPanelExpanded(true),
    onRefresh: () => {
      setIsLoading(true);
      fetchAllMedia().finally(() => setIsLoading(false));
    },
  });
  */

  // Synchronize activeTab with selectedAssetType filter
  React.useEffect(() => {
    // When asset type filter changes, switch to corresponding tab
    switch (unifiedFilters.selectedAssetType) {
      case 'menu-item':
        if (activeTab !== 'menu-images') {
          setActiveTab('menu-images');
        }
        break;
      case 'ai-avatar':
        if (activeTab !== 'ai-avatars') {
          setActiveTab('ai-avatars');
        }
        break;
      case 'general':
        if (activeTab !== 'general') {
          setActiveTab('general');
        }
        break;
      case 'all':
        // For 'all', default to menu-images tab
        if (activeTab !== 'menu-images') {
          setActiveTab('menu-images');
        }
        break;
    }
  }, [unifiedFilters.selectedAssetType, activeTab, setActiveTab]);

  // Fetch all media on mount
  const fetchAllMedia = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchHierarchicalMedia();
      setAllMedia(data);
      toast.success(`Media library loaded successfully`);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to load media library');
    } finally {
      setIsLoading(false);
    }
  }, [setAllMedia, setIsLoading]);

  React.useEffect(() => {
    fetchAllMedia();
  }, [fetchAllMedia]);

  // Apply unified filtering to get filtered assets
  const filteredAssets = React.useMemo(() => {
    // Start filtering indicator
    setIsFiltering(true);
    
    console.log('🔄 RECALCULATING filteredAssets with filters:', {
      selectedAssetType: unifiedFilters.selectedAssetType,
      selectedSectionId: unifiedFilters.selectedSectionId,
      selectedCategoryId: unifiedFilters.selectedCategoryId,
      allMediaCount: {
        menuImages: allMedia.menuImages.length,
        aiAvatars: allMedia.aiAvatars.length,
        general: allMedia.generalMedia.length,
      }
    });
    
    // Set a timeout to show overlay if filtering takes >500ms
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    filterTimeoutRef.current = setTimeout(() => {
      setShowFilteringOverlay(true);
    }, 500);
    
    const result = filterMediaUnified(allMedia, unifiedFilters);
    
    console.log('✅ FILTERED RESULT:', {
      count: result.length,
      assetTypes: result.map(a => a.asset_category),
    });
    
    // Clear filtering indicators
    setIsFiltering(false);
    setShowFilteringOverlay(false);
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    return result;
  }, [allMedia, unifiedFilters, filterChangeCounter]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  // Categorize filtered media by type for tab display
  const menuImages = React.useMemo(() => {
    return filteredAssets.filter(asset => 
      asset.asset_category === 'menu-item' || 
      asset.asset_category === 'menu-item-variant'
    );
  }, [filteredAssets]);

  const aiAvatars = React.useMemo(() => {
    return filteredAssets.filter(asset => asset.asset_category === 'ai-avatar');
  }, [filteredAssets]);

  const generalMedia = React.useMemo(() => {
    return filteredAssets.filter(asset => asset.asset_category === 'general');
  }, [filteredAssets]);

  const sections = React.useMemo(() => {
    return allMedia.sections || [];
  }, [allMedia.sections]);

  // Calculate asset counts for sidebar (use RAW counts, not filtered)
  const assetCounts = React.useMemo(() => ({
    menuImages: (allMedia.menuImages || []).length,
    aiAvatars: (allMedia.aiAvatars || []).length,
    general: (allMedia.generalMedia || []).length,
    total: (allMedia.menuImages || []).length + (allMedia.aiAvatars || []).length + (allMedia.generalMedia || []).length,
  }), [allMedia.menuImages, allMedia.aiAvatars, allMedia.generalMedia]);

  const handleUploadComplete = () => {
    setIsUploadOpen(false);
    fetchAllMedia();
  };

  // Refresh after delete or update operations
  const handleMediaUpdate = React.useCallback(() => {
    fetchAllMedia();
  }, [fetchAllMedia]);

  // Callback when filter changes in sidebar
  const handleFilterChange = React.useCallback(() => {
    // Trigger recalculation by incrementing counter
    setFilterChangeCounter(prev => prev + 1);
    console.log('Filters changed - gallery refreshed with new filters');
  }, []);

  // Get current tab items for Select All functionality
  const getCurrentTabItems = React.useCallback(() => {
    switch (activeTab) {
      case 'menu-images':
        return menuImages.map(item => item.id);
      case 'ai-avatars':
        return aiAvatars.map(item => item.id);
      case 'general':
        return generalMedia.map(item => item.id);
      default:
        return [];
    }
  }, [activeTab, menuImages, aiAvatars, generalMedia]);

  // Get selected assets as full MediaItem objects
  const getSelectedAssets = React.useCallback((): MediaItem[] => {
    const selectedIds = Array.from(batchSelection.selectedIds);
    const allAssets = [...menuImages, ...aiAvatars, ...generalMedia];
    return allAssets.filter(asset => selectedIds.includes(asset.id));
  }, [batchSelection.selectedIds, menuImages, aiAvatars, generalMedia]);

  // Get all available assets for replacement options
  const getAllAvailableAssets = React.useCallback((): MediaItem[] => {
    return [...menuImages, ...aiAvatars, ...generalMedia];
  }, [menuImages, aiAvatars, generalMedia]);

  // Handle successful bulk delete
  const handleBulkDeleteSuccess = React.useCallback(() => {
    exitSelectionMode();
    fetchAllMedia();
  }, [exitSelectionMode, fetchAllMedia]);

  const selectedCount = batchSelection.selectedIds.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              {selectionMode === 'pick' ? 'Choose Avatar' : 'Media Library'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {selectionMode === 'pick' 
              ? 'Select an avatar for your AI staff member'
              : 'Organize and manage all your restaurant media assets'
            }
          </p>
        </div>
        {selectionMode !== 'pick' && (
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchAllMedia}
              variant="outline"
              disabled={isLoading}
              className="border-border/50 hover:bg-purple-500/10"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </div>
        )}
      </header>

      {/* NEW: Batch Selection Toolbar */}
      {selectionMode !== 'pick' && (
        <div className="flex items-center justify-between gap-4 p-4 bg-card/20 border border-border/30 rounded-lg">
          {!batchSelection.isSelectionMode ? (
            <div className="flex items-center gap-3">
              <Button
                onClick={enterSelectionMode}
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10 text-purple-400"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Select Items
              </Button>
              <p className="text-sm text-muted-foreground">
                Select multiple items to delete in batch
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-md">
                  <CheckSquare className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">
                    {selectedCount} selected
                  </span>
                </div>
                
                <Button
                  onClick={() => selectAllItems(getCurrentTabItems())}
                  variant="ghost"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300"
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Select All
                </Button>
                
                {selectedCount > 0 && (
                  <Button
                    onClick={clearSelection}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowBatchDeleteDialog(true)}
                  disabled={selectedCount === 0}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedCount})
                </Button>
                
                <Button
                  onClick={exitSelectionMode}
                  variant="outline"
                  className="border-border/50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* NEW: Two-Column Layout - Sidebar + Gallery */}
      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Left Column: Filter Sidebar */}
        {isLoading ? (
          <FilterSidebarSkeleton />
        ) : (
          <MediaFilterSidebar
            sections={sections}
            assetCounts={{
              menuImages: menuImages.length,
              aiAvatars: aiAvatars.length,
              general: generalMedia.length,
              total: filteredAssets.length,
            }}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Right Column: Gallery Content */}
        <div className="space-y-6 relative">
          {/* Gallery Header - Shows what's being displayed */}
          <GalleryHeader 
            assetType={unifiedFilters.selectedAssetType} 
            count={filteredAssets.length}
            onShowHelp={() => setShowKeyboardHelp(true)}
          />

          {/* Active Filter Chips */}
          <ActiveFiltersBar 
            sections={sections}
            onFilterChange={handleFilterChange}
          />

          {/* Filtering Overlay - Shows when filter operation >500ms */}
          {showFilteringOverlay && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="bg-card border border-purple-500/30 rounded-lg p-6 shadow-xl flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                <span className="text-sm font-medium text-foreground">Filtering...</span>
              </div>
            </div>
          )}

          {/* Gallery Content - Unified display of filtered assets */}
          <div className="bg-card/20 border border-border/30 rounded-lg p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading media...</p>
                </div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center space-y-3">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm text-muted-foreground">No assets match the current filters</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Menu Images Section */}
                {menuImages.length > 0 && (
                  <MenuImagesTab
                    sections={sections}
                    allMenuImages={menuImages}
                    isLoading={false}
                    onUpdate={handleMediaUpdate}
                  />
                )}

                {/* AI Avatars Section */}
                {aiAvatars.length > 0 && (
                  <AIAvatarTab
                    allAvatars={aiAvatars}
                    isLoading={false}
                    onUpdate={handleMediaUpdate}
                  />
                )}

                {/* General Media Section */}
                {generalMedia.length > 0 && (
                  <GeneralMediaTab
                    allGeneralMedia={generalMedia}
                    isLoading={false}
                    onUpdate={handleMediaUpdate}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadComplete={handleUploadComplete}
      />

      {/* Batch Delete Dialog */}
      <SmartBulkDeleteDialog
        isOpen={showBatchDeleteDialog}
        onClose={() => setShowBatchDeleteDialog(false)}
        selectedAssets={getSelectedAssets()}
        availableAssets={getAllAvailableAssets()}
        onSuccess={handleBulkDeleteSuccess}
      />
    </div>
  );
}
