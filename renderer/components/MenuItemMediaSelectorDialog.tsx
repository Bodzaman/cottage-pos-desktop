import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaGalleryGrid } from 'components/MediaGalleryGrid';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { fetchHierarchicalMedia, filterMediaUnified } from 'utils/mediaHierarchyUtils';
import { MediaItem } from 'utils/mediaLibraryUtils';
import { 
  Image, 
  Search, 
  X, 
  CheckCircle2, 
  Loader2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface MenuItemMediaSelectorDialogProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Selection mode: 'single' for one image, 'multi' for multiple */
  selectionMode?: 'single' | 'multi';
  /** Callback when selection is confirmed */
  onConfirm: (selectedAssets: MediaItem[]) => void;
  /** Optional: Currently selected asset ID (to highlight) */
  currentAssetId?: string;
  /** Optional: Category context for smart suggestions */
  categoryContext?: {
    sectionId?: string;
    categoryId?: string;
  };
}

/**
 * MenuItemMediaSelectorDialog - Smart media selection dialog for menu items
 * 
 * Features:
 * - Auto-filters to "menu-images" asset type on open
 * - Compact filter sidebar (asset type, status, search)
 * - Uses MediaGalleryGrid in selection mode
 * - Footer with selection count and action buttons
 * - Supports single-select and multi-select modes
 * - Context-aware smart suggestions
 * 
 * Phase 3 of MYA-1475
 */
export function MenuItemMediaSelectorDialog({
  isOpen,
  onClose,
  selectionMode = 'single',
  onConfirm,
  currentAssetId,
  categoryContext,
}: MenuItemMediaSelectorDialogProps) {
  const {
    allMedia,
    setAllMedia,
    unifiedFilters,
    setUnifiedAssetType,
    setUnifiedSectionFilter,
    setUnifiedCategoryFilter,
    setSearchQuery,
    setShowLinked,
    setShowInUse,
    clearAllFilters,
  } = useMediaLibraryStore();

  const [isLoading, setIsLoading] = React.useState(false);
  const [localSelectedIds, setLocalSelectedIds] = React.useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = React.useState('');

  // Load media and apply filters when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      initializeDialog();
    } else {
      // Reset on close
      setLocalSelectedIds(new Set());
      setSearchInput('');
    }
  }, [isOpen]);

  const initializeDialog = async () => {
    setIsLoading(true);
    
    try {
      // Load media if not already loaded
      if (allMedia.menuImages.length === 0) {
        const data = await fetchHierarchicalMedia();
        setAllMedia(data);
      }
      
      // Auto-apply "menu-images" filter
      setUnifiedAssetType('menu-item');
      
      // Apply category context if provided
      if (categoryContext?.sectionId) {
        setUnifiedSectionFilter(categoryContext.sectionId);
      }
      if (categoryContext?.categoryId) {
        setUnifiedCategoryFilter(categoryContext.categoryId);
      }
      
      // Pre-select current asset if provided
      if (currentAssetId) {
        setLocalSelectedIds(new Set([currentAssetId]));
      }
      
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Failed to load media library');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply unified filters to get filtered assets
  const filteredAssets = React.useMemo(() => {
    if (allMedia.menuImages.length === 0 && allMedia.menuVariantImages?.length === 0) {
      return [];
    }
    
    // CRITICAL FIX: Include BOTH menu-item and menu-item-variant images
    // The unified filter system separates them, but for menu item selection,
    // we want to show ALL menu images (items + variants)
    const combinedMenuAssets = [
      ...allMedia.menuImages,
      ...(allMedia.menuVariantImages || []),
    ];
    
    // Now filter this combined array using existing filter logic
    // We temporarily override the filter to work on combined assets
    const tempFilteredData: HierarchicalMediaData = {
      ...allMedia,
      menuImages: combinedMenuAssets, // Use combined array
    };
    
    const filtered = filterMediaUnified(tempFilteredData, {
      ...unifiedFilters,
      selectedAssetType: 'menu-item', // Force menu-item filter
    });
    
    console.log('[MenuItemMediaSelectorDialog] Filtered assets:', {
      totalMenuImages: allMedia.menuImages.length,
      totalVariantImages: allMedia.menuVariantImages?.length || 0,
      combinedTotal: combinedMenuAssets.length,
      afterFilters: filtered.length,
    });
    
    return filtered;
  }, [allMedia, unifiedFilters]);

  // Transform to MediaItem[] for gallery
  const mediaItems: MediaItem[] = React.useMemo(() => {
    return filteredAssets.map(asset => ({
      id: asset.id,
      name: asset.file_name || '',
      friendlyName: asset.friendly_name || asset.file_name || '',
      size: asset.file_size || 0,
      url: asset.url || '',
      updatedAt: asset.upload_date || new Date().toISOString(),
      type: asset.type || 'image',
      tags: asset.tags || [],
      usage: asset.usage,
      description: asset.description,
    }));
  }, [filteredAssets]);

  // Handle asset selection
  const handleAssetSelect = (item: MediaItem) => {
    if (selectionMode === 'single') {
      // Single-select: replace selection
      setLocalSelectedIds(new Set([item.id]));
    } else {
      // Multi-select: toggle selection
      setLocalSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setSearchQuery(value);
  };

  // Handle confirm
  const handleConfirm = () => {
    const selectedAssets = mediaItems.filter(item => localSelectedIds.has(item.id));
    
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one image');
      return;
    }
    
    onConfirm(selectedAssets);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    clearAllFilters();
    onClose();
  };

  // Clear selection
  const handleClearSelection = () => {
    setLocalSelectedIds(new Set());
  };

  // Get selected count
  const selectedCount = localSelectedIds.size;

  // Check if an item is selected
  const isSelected = (id: string) => localSelectedIds.has(id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Image className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Select Menu Item Image{selectionMode === 'multi' ? 's' : ''}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectionMode === 'single' 
                    ? 'Choose an image for your menu item'
                    : 'Select one or more images for your menu items'
                  }
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-purple-500/50 text-purple-300">
              {filteredAssets.length} images available
            </Badge>
          </div>
        </DialogHeader>

        {/* Main Content - Sidebar + Gallery */}
        <div className="flex-1 overflow-hidden flex">
          {/* Compact Filter Sidebar */}
          <aside className="w-64 border-r border-border/50 bg-card/30 flex flex-col">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-purple-400" />
                <h3 className="font-semibold text-sm text-foreground">Filters</h3>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Status Filters */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setShowLinked(!unifiedFilters.showLinked)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        unifiedFilters.showLinked
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'text-muted-foreground hover:bg-card/50'
                      }`}
                    >
                      Linked to Items
                    </button>
                    <button
                      onClick={() => setShowInUse(!unifiedFilters.showInUse)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        unifiedFilters.showInUse
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'text-muted-foreground hover:bg-card/50'
                      }`}
                    >
                      In Use
                    </button>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Clear Filters */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearAllFilters();
                    setSearchInput('');
                    setUnifiedAssetType('menu-item'); // Keep menu-item filter
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </ScrollArea>
          </aside>

          {/* Gallery Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading images...</p>
                  </div>
                </div>
              ) : (
                <MediaGalleryGrid
                  items={mediaItems.map(item => ({
                    ...item,
                    // Add visual indicator for currently selected asset
                    isCurrentAsset: item.id === currentAssetId,
                  }))}
                  isLoading={false}
                  mode="selection"
                  selectionType={selectionMode}
                  onAssetSelect={handleAssetSelect}
                  emptyMessage="No menu images found. Try adjusting your filters."
                />
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedCount > 0 ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">
                    {selectedCount} selected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No images selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-border/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
