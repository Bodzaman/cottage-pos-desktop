import React, { useState } from 'react';
import {
  MediaItem,
  getSmartDisplayName,
  getSmartSecondaryText,
  getUsageIndicator,
  deleteMedia,
  formatFileSize,
} from '../utils/mediaLibraryUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ImageIcon,
  VideoIcon,
  CopyIcon,
  PencilIcon,
  Trash2Icon,
  InfoIcon,
} from 'lucide-react';
import { cardStyle, colors } from '../utils/designSystem';
import { Button } from '@/components/ui/button';
import { EditMediaDialog } from './EditMediaDialog';
import { SmartDeleteDialog } from './SmartDeleteDialog';
import { toast } from 'sonner';
import { useMediaLibraryStore } from 'utils/mediaLibraryStore';
import { apiClient } from 'app';

interface MediaCardProps {
  item: MediaItem;
  onUpdate: () => void;
  /** Display mode: 'view' for normal browsing, 'selection' for multi-select UI */
  mode?: 'view' | 'selection';
  /** Selection type: 'multi' for checkboxes, 'single' for click-to-select */
  selectionType?: 'multi' | 'single';
  /** Callback when an asset is selected in single-select mode */
  onAssetSelect?: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ 
  item, 
  onUpdate,
  mode = 'view',
  selectionType = 'multi',
  onAssetSelect,
}) => {
  const [showSmartDeleteDialog, setShowSmartDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<MediaItem[]>([]);
  
  // Get selection state from store (for batch selection mode)
  const { batchSelection, toggleItemSelection, isItemSelected, allMedia } = useMediaLibraryStore();
  const isSelected = isItemSelected(item.id);
  
  // Determine if we're in selection mode (either batch mode from store OR explicit mode prop)
  const isSelectionModeActive = mode === 'selection' || batchSelection.isSelectionMode;
  
  const displayName = getSmartDisplayName(item);
  const secondaryText = getSmartSecondaryText(item);
  const usage = getUsageIndicator(item);

  // Handle card click based on mode
  const handleCardClick = () => {
    if (mode === 'selection' && selectionType === 'single' && onAssetSelect) {
      // Single-select mode: trigger callback immediately
      onAssetSelect(item);
    } else if (isSelectionModeActive) {
      // Multi-select mode: toggle selection
      toggleItemSelection(item.id);
    }
    // View mode: do nothing (details shown via action buttons)
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    toast.success('URL copied to clipboard!');
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSmartDeleteDialog(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  const handleConfirmDelete = async (asset: MediaItem, replacementAssetId?: string) => {
    try {
      toast.loading(`Processing deletion of ${getSmartDisplayName(asset)}...`);
      
      if (replacementAssetId) {
        // Replace asset references first
        const replaceResponse = await apiClient.replace_asset_in_menu_items({
          old_asset_id: asset.id,
          new_asset_id: replacementAssetId
        });
        
        const replaceData = await replaceResponse.json();
        if (!replaceData.success) {
          throw new Error(replaceData.message || 'Failed to replace asset references');
        }
      } else {
        // Remove references
        const removeResponse = await apiClient.remove_asset_references({
          assetId: asset.id
        });
        
        const removeData = await removeResponse.json();
        if (!removeData.success) {
          console.warn('Warning: Failed to remove some asset references:', removeData.message);
        }
      }
      
      // Delete the asset
      await deleteMedia(asset.id);
      
      toast.dismiss();
      toast.success(`Successfully deleted ${getSmartDisplayName(asset)}`);
      
      setShowSmartDeleteDialog(false);
      onUpdate(); // Refresh the media library
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.dismiss();
      toast.error(`Failed to delete asset: ${error.message}`);
    }
  };

  return (
    <>
      <Card
        style={cardStyle}
        className={`relative overflow-hidden group border-2 transition-all duration-300 ${
          isSelectionModeActive ? 'cursor-pointer' : ''
        } ${
          isSelected 
            ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50' 
            : 'border-transparent hover:border-purple-500'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          {/* NEW: Selection checkbox overlay */}
          {isSelectionModeActive && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-black/60 backdrop-blur-sm rounded-md p-1.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleItemSelection(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="border-white data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
              </div>
            </div>
          )}
          
          <div className="relative h-40">
            <img
              src={item.url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
            {/* Only show action buttons when NOT in selection mode */}
            {!isSelectionModeActive && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20" 
                  onClick={copyToClipboard}
                  title="Copy URL"
                >
                  <CopyIcon className="h-4 w-4"/>
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20" 
                  onClick={handleEditClick}
                  title="Edit metadata"
                >
                  <PencilIcon className="h-4 w-4"/>
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-red-500 hover:bg-red-500/20" 
                  onClick={handleDeleteClick}
                  title="Delete media"
                >
                  <Trash2Icon className="h-4 w-4"/>
                </Button>
              </div>
            )}
            <Badge className="absolute top-2 right-2" variant="secondary">
              {item.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1"/> : <VideoIcon className="h-3 w-3 mr-1"/>}
              {item.type}
            </Badge>
            {/* Variant Badge */}
            {item.asset_category === 'menu-item-variant' && (
              <Badge className="absolute top-11 right-2 bg-blue-600/90 text-white hover:bg-blue-700" variant="secondary">
                Variant
              </Badge>
            )}
          </div>
          {/* Enhanced Info Display */}
          <div className="p-4 space-y-2">
            {/* Primary: Friendly Name with icon */}
            <div className="flex items-start gap-2">
              {item.usage === 'menu-item' && (
                <span className="text-base flex-shrink-0">🍽️</span>
              )}
              {item.usage === 'avatar' && (
                <span className="text-base flex-shrink-0">👤</span>
              )}
              {item.usage === 'gallery' && (
                <span className="text-base flex-shrink-0">🖼️</span>
              )}
              <h3 className="font-semibold text-base text-white truncate flex-1" title={displayName}>
                {displayName}
              </h3>
            </div>
            
            {/* Usage Badge */}
            {item.usage && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs border-purple-500/50 text-purple-300 bg-purple-500/10"
                >
                  {item.usage === 'menu-item' && '🍽️ Menu Item'}
                  {item.usage === 'avatar' && '👤 Avatar'}
                  {item.usage === 'gallery' && '🖼️ Gallery'}
                  {!['menu-item', 'avatar', 'gallery'].includes(item.usage) && item.usage}
                </Badge>
                {usage && usage.type !== 'unused' && (
                  <span className="text-xs text-purple-400">{usage.text}</span>
                )}
              </div>
            )}
            
            {/* Secondary: Format/Size Info */}
            <p className="text-sm text-muted-foreground">
              {item.aspectRatio && (
                <span className="capitalize">{item.aspectRatio} • </span>
              )}
              {formatFileSize(item.size)}
            </p>
            
            {/* Tertiary: Technical Filename (only if different from friendly name) */}
            {item.name !== displayName && (
              <p className="text-xs text-muted-foreground/70 truncate" title={item.name}>
                File: {item.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Delete Dialog */}
      <SmartDeleteDialog
        isOpen={showSmartDeleteDialog}
        onClose={() => setShowSmartDeleteDialog(false)}
        asset={item}
        onConfirmDelete={handleConfirmDelete}
        availableAssets={allMedia.menuImages}
      />

      {/* Edit Media Dialog */}
      <EditMediaDialog
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={item}
        onSuccess={onUpdate}
      />
    </>
  );
};
